import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";
import { verifyToken } from "@/lib/oauth-utils";
import { getOAuthIssuer, getOAuthResource } from "@/lib/oauth-security";
import { PostsRepository } from "@/lib/content/posts.repository";
import { EditorialPolicyRepository } from "@/lib/editorial/editorial-policy.repository";
import { ARTICLE_INLINE_IMAGE_MIN, normalizeArticlePackage } from "@/lib/content/article-package";
import { ARTICLE_ASSET_HARD_RULE } from "@/lib/content/article-asset-rule";
import { flattenImageError, generateAndUploadBlogImage, uploadBlogImage, uploadGeneratedImageFile, uploadGithubImage } from "@/lib/content/blog-image";
import { createImageUploadSession } from "@/lib/content/image-upload-ticket";
import { CHATGPT_MCP_PERMISSIONS } from "@/lib/content/chatgpt-permissions";
import { EditorialCalendarRepository } from "@/lib/content/editorial-calendar";
import { EditorialWeekRepository } from "@/lib/content/editorial-week";
import { EditorialCommentRepository } from "@/lib/content/editorial-comments";
import { EditorialPlanAudit } from "@/lib/content/editorial-plan";
import { EDITORIAL_COMMANDS } from "@/lib/content/editorial-commands";
import { IMAGE_GENERATION_STANDARD } from "@/lib/content/image-generation-standard";
import { EditorialArticlesRepository } from "@/lib/content/editorial-articles";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidateEditorialSurfaces } from "@/lib/content/editorial-revalidate";
import {
  ARTICLE_WORKFLOW_INSTRUCTIONS,
  applyArticleWorkflowAsset,
  createArticleWorkflowRun,
  getArticleWorkflowNextAction,
  type ArticleWorkflowRun,
} from "@/lib/content/article-workflow";
import { ArticleWorkflowRepository } from "@/lib/content/article-workflow.repository";

const editorialSlotSchema = z.object({
  id: z.string().optional().describe("Existing slot id when revising a week."),
  title: z.string(),
  angle: z.string().optional().describe("Góc viết / unique angle. Alias of content_angle."),
  content_angle: z.string().optional().describe("Alias for angle."),
  audience: z.string().optional(),
  target_audience: z.string().optional().describe("Alias for audience."),
  goal: z.string().optional(),
  outline: z.string().optional().describe("Nội dung / dàn ý. Required for weekly plans."),
  scheduled_date: z.string().optional().describe("YYYY-MM-DD in Asia/Ho_Chi_Minh."),
  scheduled_time: z.string().optional().describe("HH:MM 24h Asia/Ho_Chi_Minh. Default 00:00 if omitted."),
  field: z.string().optional(),
  subject: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  search_intent: z.string().optional().describe("Required on weekly plans."),
  primary_keyword: z.string().optional().describe("Required on weekly plans."),
  secondary_keywords: z.array(z.string()).optional(),
  why_this_article: z.string().optional().describe("Required on weekly plans."),
  source_strategy: z.string().optional().describe("Required on weekly plans."),
  article_objectives: z.array(z.string()).optional(),
  internal_link_suggestions: z.array(z.object({
    post_id: z.string().optional(),
    slug: z.string().optional(),
    title: z.string().optional(),
    reason: z.string().optional(),
  })).optional(),
});

const articleWorkflowPackageSchema = z.object({
  schema_version: z.literal("article-package/7.0"),
  task_id: z.string().optional().nullable(),
  calendar_id: z.string().optional().nullable(),
  idempotency_key: z.string().min(1),
  policy_version: z.string().min(1),
  policy_hash: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content_markdown: z.string().min(1),
  field: z.string().optional(),
  subject: z.string().optional(),
  category_id: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured_image: z.object({
    purpose: z.literal("article_cover"),
    prompt: z.string().min(1),
    alt: z.string().min(1),
    caption: z.string().optional(),
    suggested_filename: z.string().optional(),
    url: z.string().nullable(),
  }),
  featured_image_url: z.string().nullable(),
  featured_image_alt: z.string().optional(),
  inline_images: z.array(z.object({
    id: z.enum(["img-01", "img-02", "img-03"]),
    purpose: z.enum(["concept_diagram", "workflow", "comparison", "case_study", "explainer"]),
    position: z.object({
      placeholder: z.string().optional(),
      after_heading_id: z.string().optional(),
    }).optional(),
    prompt: z.string().min(1),
    alt: z.string().min(1),
    caption: z.string().optional(),
    suggested_filename: z.string().optional(),
    url: z.string().nullable(),
  })).length(3),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    primary_keyword: z.string(),
    secondary_keywords: z.array(z.string()),
    search_intent: z.object({
      primary: z.string(),
      secondary_questions: z.array(z.string()).optional(),
    }),
    semantic_entities: z.array(z.string()),
  }),
  aio: z.object({
    direct_answer: z.string(),
    tldr: z.string(),
    key_takeaways: z.array(z.string()),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  }),
  references: z.array(z.object({
    title: z.string(),
    url: z.string(),
    source_type: z.string(),
  })),
  internal_links: z.array(z.object({ post_id: z.string(), anchor: z.string() })),
  schema_org: z.record(z.string(), z.any()).optional(),
  quality: z.object({
    overall: z.number(),
    factual_accuracy: z.number(),
    source_quality: z.number(),
    seo: z.number(),
    aio: z.number(),
    editorial: z.number(),
    hard_fail_conditions: z.array(z.string()),
  }),
});

function errorMessage(error: unknown): string {
  return flattenImageError(error) || "Unknown error";
}

async function finalizeArticleWorkflow(run: ArticleWorkflowRun) {
  if (run.status !== "READY_TO_DRAFT") {
    throw new Error(`ARTICLE_WORKFLOW_STATE_CONFLICT: cannot create draft while ${run.status}`);
  }
  const pkg = normalizeArticlePackage(run.article_package);
  const draftResult = await PostsRepository.createDraft({
    ...run.article_package,
    featured_image: pkg.featured_image,
    featured_image_alt: pkg.featured_image?.alt,
    inline_images: pkg.inline_images,
  });
  const completed = await ArticleWorkflowRepository.complete(run.id, draftResult as Record<string, unknown>);
  revalidateEditorialSurfaces((draftResult as { draft?: { id?: string }; draft_id?: string })?.draft?.id
    || (draftResult as { draft_id?: string })?.draft_id);
  return {
    status: "COMPLETED",
    run_id: completed.id,
    uploaded_assets: completed.assets,
    draft: draftResult,
    next_action: getArticleWorkflowNextAction(completed),
  };
}

function createKingDragonHubMcpServer() {
  const server = new McpServer(
    {
      name: "KingDragonHub-MCP",
      version: "7.32.0",
    },
    {
      instructions: `${ARTICLE_WORKFLOW_INSTRUCTIONS} ${ARTICLE_ASSET_HARD_RULE.text}`,
    }
  );

  // [Tool 1]: get_blog_inventory
  server.registerTool(
    "get_blog_inventory",
    {
      description: "Lấy danh sách các bài viết hiện có trên blog để tránh trùng lặp chủ đề.",
      inputSchema: z.object({
        category: z.string().optional(),
        topic: z.string().optional(),
        limit: z.number().default(50).optional(),
      })
    },
    async ({ category, topic, limit }) => {
      const inventory = await PostsRepository.getInventory({ category, topic, limit });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(inventory),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_blog_categories",
    {
      description: "Return the full KingDragonHub taxonomy tree: Lĩnh vực (fields) → Chủ đề (subjects) → Danh mục (categories), plus suggested_tags. Always call this before create_blog_draft. Prefer an existing category_id. Send field/subject/category names if you are unsure. Only propose a new category when nothing in the tree fits.",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await PostsRepository.getCategories();
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // [Tool 2]: get_related_posts
  server.registerTool(
    "get_related_posts",
    {
      description: "Tìm các bài viết liên quan để xây dựng internal links.",
      inputSchema: z.object({
        topic: z.string(),
        keywords: z.array(z.string()).optional(),
        category: z.string().optional(),
        exclude_post_id: z.string().optional(),
        limit: z.number().default(10).optional(),
      })
    },
    async ({ topic, keywords, category, exclude_post_id, limit }) => {
      const related = await PostsRepository.getRelatedPosts({ topic, keywords, category, exclude_post_id, limit });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(related),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_article_package_contract",
    {
      description: "Call first every session. Simple article commands use the resumable workflow: start_article_workflow after research, generate the returned image, then on each user 'Tiếp tục' call continue_article_workflow with the previous native image. Do not ask for technical IDs.",
      inputSchema: z.object({})
    },
    async () => ({
      content: [{
        type: "text",
        text: JSON.stringify({
          mcp_server: "KingDragonHub-MCP",
          mcp_version: "7.32.0",
          asset_policy: ARTICLE_ASSET_HARD_RULE.asset_policy,
          article_asset_hard_rule: ARTICLE_ASSET_HARD_RULE.text,
          image_pipeline: {
            hard_rule: true,
            no_openai_api_key: true,
            autonomous: true,
            resumable: true,
            one_user_message: false,
            cover_exact: 1,
            inline_exact: 3,
            required_ids: ARTICLE_ASSET_HARD_RULE.required_ids,
            lane_a1_chatgpt: "start_article_workflow → native cover. Each 'Tiếp tục': continue_article_workflow receives the previous native file, uploads it, and returns the next image prompt. After img-03 it creates the draft. Never parallel.",
            lane_a2_external: "Browser/external client only → start_image_upload → HTTP POST original PNG bytes to put_url.",
            lane_b: "generate_and_upload_blog_image SVG only.",
            if_no_image_gen: "image_gen is NOT an MCP tool. Use native ChatGPT Images for the single image in next_action, then resume on the next user 'Tiếp tục'.",
            never: ARTICLE_ASSET_HARD_RULE.never,
          },
          when_writing_article: EDITORIAL_COMMANDS.when_writing,
          chatgpt_media_tool: "upload_generated_image_file",
          article_workflow_tools: ["start_article_workflow", "get_active_article_workflow", "continue_article_workflow"],
          external_media_tool: "start_image_upload",
          media_tools: ["upload_generated_image_file", "upload_github_image", "upload_blog_image", "generate_and_upload_blog_image"],
          permissions: CHATGPT_MCP_PERMISSIONS,
          taxonomy_tool: "get_blog_categories",
          command_tool: "get_editorial_commands",
          short_commands: "call get_editorial_commands",
          image_generation_standard: IMAGE_GENERATION_STANDARD,
          calendar_tools: [
            "get_editorial_commands",
            "propose_editorial_week",
            "list_editorial_weeks",
            "get_editorial_week",
            "revise_editorial_week",
            "add_editorial_comment",
            "get_due_editorial_slots",
            "list_editorial_calendar",
            "list_editorial_articles",
            "get_editorial_draft",
            "upload_generated_image_file",
            "upload_github_image",
            "upload_blog_image",
            "update_blog_draft",
          ],
          review_desk: "/admin/editorial",
          calendar_workflow: {
            "1": "propose_editorial_week — send the weekly article list for review. Do NOT write articles yet.",
            "2": "Admin reviews at /admin/editorial: reorder (item_order), edit briefs, and leave detailed comments.",
            "3": "If revision_requested: get_editorial_week, read comments + revision_constraints, then revise_editorial_week with based_on_revision=week.revision_number. Success moves the week to revision_ready. Stale based_on_revision returns REVISION_CONFLICT.",
            "4": "After the week is approved: each session call get_due_editorial_slots. Write in item_order.",
            "5": "Write only due slots via create_blog_draft(calendar_id). Server rejects writing before scheduled datetime.",
            "6": "Rejected drafts: list_editorial_articles or get_due_editorial_slots revise[]. get_editorial_draft(calendar_id), follow revision_request, regen images if asked, then update_blog_draft. Unpublished review drafts: if the user asks to write that topic again or upgrade images, update_blog_draft — do not duplicate. Published posts are LOCKED.",
            limitation: "ChatGPT cannot auto-wake at the scheduled time. The user must open a conversation or a ChatGPT scheduled task on the due day.",
          },
          schema_version: "article-package/7.0",
          create_blog_draft_required_fields: [
            "schema_version",
            "featured_image",
            "featured_image_url",
            "inline_images",
            "aio.direct_answer",
            "seo.search_intent",
            "seo.semantic_entities",
          ],
          featured_image: {
            type: "object",
            required: ["purpose", "prompt", "alt", "url"],
            purpose: "article_cover",
            url_required: true,
          },
          inline_images: {
            type: "array",
            exact_items_with_url: ARTICLE_INLINE_IMAGE_MIN,
            required_ids: ["img-01", "img-02", "img-03"],
            item_required: ["id", "purpose", "prompt", "alt", "url"],
            url_required: true,
          },
        }, null, 2),
      }],
    })
  );

  // [Tool 3]: get_editorial_guidelines
  server.registerTool(
    "get_editorial_commands",
    {
      description: "Map câu ngắn tiếng Việt sang đúng việc MCP. Gọi khi user nói ngắn về lịch tuần, trạng thái, đến hạn, sửa plan, viết tự do, viết theo tuần, sửa bài bị trả, tạo lại ảnh. Không đoán mode. Không publish.",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify({ ...EDITORIAL_COMMANDS, permissions: CHATGPT_MCP_PERMISSIONS }, null, 2) }],
    })
  );

  server.registerTool(
    "get_editorial_guidelines",
    {
      description: "Authoritative editorial policy. Use policy_version and policy_hash verbatim. Do not paraphrase thresholds.",
      inputSchema: z.object({
        include_details: z.boolean().optional().describe("Mặc định là true"),
      })
    },
    async () => {
      try {
        const policy = await EditorialPolicyRepository.getActivePolicy();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(policy),
            },
          ],
        };
      } catch (err: unknown) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: errorMessage(err) }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "list_editorial_weeks",
    {
      description: "List weekly article plans. proposed/revision_ready = waiting for admin. revision_requested = you must revise_editorial_week with based_on_revision. approved is LOCKED.",
      inputSchema: z.object({
        status: z.enum(["proposed", "revision_requested", "revision_ready", "approved", "cancelled"]).optional(),
      }),
    },
    async ({ status }) => {
      try {
        const weeks = await EditorialWeekRepository.list(getSupabaseAdmin(), status);
        return { content: [{ type: "text", text: JSON.stringify({ weeks }) }] };
      } catch (err: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_editorial_week",
    {
      description: "Get one weekly plan with briefs, revision_number, revision_constraints, locked_at, latest_revision, field-level diff, comments, and recent activity. Always read comments and constraints before revise_editorial_week. Send based_on_revision=revision_number.",
      inputSchema: z.object({
        id: z.string(),
      }),
    },
    async ({ id }) => {
      try {
        const week = await EditorialWeekRepository.get(getSupabaseAdmin(), id);
        return { content: [{ type: "text", text: JSON.stringify({ week }) }] };
      } catch (err: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
      }
    }
  );

  server.registerTool(
    "list_editorial_calendar",
    {
      description: "List individual calendar slots. Prefer list_editorial_weeks for the weekly review loop. Use get_due_editorial_slots to find what to write today.",
      inputSchema: z.object({
        status: z.enum(["proposed", "approved", "revision_requested", "writing", "drafted", "published", "cancelled"]).optional(),
      }),
    },
    async ({ status }) => {
      try {
        const slots = await EditorialCalendarRepository.list(getSupabaseAdmin(), status);
        return { content: [{ type: "text", text: JSON.stringify({ slots }) }] };
      } catch (err: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_due_editorial_slots",
    {
      description: "Return work for this session. due = week-approved slots that are due and have no draft yet — create_blog_draft(calendar_id). revise = drafted articles the admin rejected — update_blog_draft(calendar_id). blocked = slot looks due but the weekly list is not approved; do not write. upcoming = approved but not due yet. Never write blocked or upcoming.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await EditorialCalendarRepository.listDue(getSupabaseAdmin());
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              ...result,
              instruction: "Write due[] with create_blog_draft(calendar_id). Fix revise[]: get_editorial_draft(calendar_id) then update_blog_draft. Ignore blocked[] until the admin approves the week. Do not write upcoming[]. Published is LOCKED.",
            }),
          }],
        };
      } catch (err: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
      }
    }
  );

  server.registerTool(
    "list_editorial_articles",
    {
      description: "List ChatGPT calendar articles that already have a draft or published post. workflow_status: published (LOCKED), review (waiting admin), revise (admin returned — get_editorial_draft then update_blog_draft), writing. Never update published posts.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await EditorialArticlesRepository.list(getSupabaseAdmin());
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_editorial_draft",
    {
      description: "Read one ChatGPT calendar draft/post: id, title, content, images, SEO, comments, revision_request. Pass calendar_id from list_editorial_articles. If can_update=false the post is published — do not update. If can_update=true (review or revise) and the user asked to write/upgrade this article, update_blog_draft — do not create a duplicate.",
      inputSchema: z.object({
        calendar_id: z.string().optional().nullable(),
        post_id: z.string().optional().nullable(),
      }),
    },
    async (input) => {
      try {
        const draft = await EditorialArticlesRepository.getDraft(getSupabaseAdmin(), input);
        return { content: [{ type: "text", text: JSON.stringify(draft) }] };
      } catch (err: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
      }
    }
  );

  // [Tool 4]: create_blog_draft
  if (process.env.MCP_ENABLE_WRITE === "true") {
    server.registerTool(
      "propose_editorial_week",
      {
        description: "Submit a weekly article list for admin review. Each slot requires title, outline, scheduled_date, search_intent, primary_keyword, why_this_article, source_strategy. target_audience aliases audience; content_angle aliases angle. Do NOT write full articles.",
        inputSchema: z.object({
          week_start: z.string().describe("Any date in the week, YYYY-MM-DD. Normalized to Monday Asia/Ho_Chi_Minh."),
          title: z.string().optional(),
          summary: z.string().optional().describe("Why this week's mix of topics."),
          slots: z.array(editorialSlotSchema).min(1).max(12),
        }),
      },
      async (input) => {
        try {
          const week = await EditorialWeekRepository.propose(getSupabaseAdmin(), input);
          revalidateEditorialSurfaces();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                week,
                next: "Stop. Tell the admin to review /admin/editorial (drag order, edit briefs, comment). If they request changes, get_editorial_week, read comments, then revise_editorial_week. Do not write articles yet.",
              }),
            }],
          };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "revise_editorial_week",
      {
        description: "Revise a weekly list after status=revision_requested. based_on_revision is REQUIRED and must match week.revision_number or the server returns REVISION_CONFLICT and does not write. Respect revision_constraints or receive CONSTRAINT_VIOLATION. Approved weeks return PLAN_LOCKED. Success sets status=revision_ready.",
        inputSchema: z.object({
          id: z.string(),
          based_on_revision: z.number().describe("Must equal week.revision_number from get_editorial_week."),
          week_start: z.string().optional(),
          title: z.string().optional(),
          summary: z.string().optional(),
          slots: z.array(editorialSlotSchema).optional(),
        }),
      },
      async (input) => {
        try {
          const { id, ...patch } = input;
          const week = await EditorialWeekRepository.revise(getSupabaseAdmin(), id, patch);
          revalidateEditorialSurfaces();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                week,
                next: "Status is revision_ready. Stop. Admin reviews the diff at /admin/editorial.",
              }),
            }],
          };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "add_editorial_comment",
      {
        description: "Reply to the admin review desk. Use after reading get_editorial_week comments. week_id required. slot_id set when the reply is about one article; omit slot_id for a week-level reply. Does not change approval status.",
        inputSchema: z.object({
          week_id: z.string(),
          slot_id: z.string().optional().nullable(),
          body: z.string().describe("Detailed reply. Vietnamese preferred if the admin wrote in Vietnamese."),
        }),
      },
      async (input) => {
        try {
          const supabase = getSupabaseAdmin();
          const comment = await EditorialCommentRepository.add(supabase, {
            week_id: input.week_id,
            slot_id: input.slot_id,
            author: "chatgpt",
            body: input.body,
          });
          await EditorialPlanAudit.log(supabase, {
            week_id: input.week_id,
            slot_id: input.slot_id,
            event: "comment_added",
            actor: "chatgpt",
          });
          revalidateEditorialSurfaces();
          return { content: [{ type: "text", text: JSON.stringify({ comment }) }] };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "propose_editorial_calendar",
      {
        description: "Legacy: propose ungrouped slots. Prefer propose_editorial_week so the admin reviews one weekly list.",
        inputSchema: z.object({
          slots: z.array(editorialSlotSchema).min(1).max(12),
        }),
      },
      async ({ slots }) => {
        try {
          const created = await EditorialCalendarRepository.propose(getSupabaseAdmin(), slots);
          return { content: [{ type: "text", text: JSON.stringify({ created }) }] };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "revise_editorial_slot",
      {
        description: "Revise one slot after admin set that slot to revision_requested. Prefer revise_editorial_week when the whole week was sent back.",
        inputSchema: editorialSlotSchema.partial().extend({
          id: z.string(),
        }),
      },
      async (input) => {
        try {
          const { id, ...patch } = input;
          const supabase = getSupabaseAdmin();
          const slot = await EditorialCalendarRepository.revise(supabase, id, patch);
          if (slot.week_id) {
            await EditorialWeekRepository.noteSlotRevised(supabase, slot.week_id, slot.id);
          }
          revalidateEditorialSurfaces();
          return { content: [{ type: "text", text: JSON.stringify({ slot }) }] };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "start_article_workflow",
      {
        title: "Start Resumable Article",
        description: "Use after researching and writing a complete article from a simple user request such as 'Hãy viết bài về...'. Stores the Article Package and exact 1+3 image plan. Then generate next_action.prompt as a native ChatGPT Image immediately; do not ask the user for IDs or image metadata.",
        inputSchema: z.object({
          topic: z.string().min(1).describe("The user's article topic in natural language."),
          article_package: articleWorkflowPackageSchema.describe("Complete researched Article Package v7. Image URLs must still be null."),
        }),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async (input) => {
        try {
          const prepared = createArticleWorkflowRun(input);
          const run = await ArticleWorkflowRepository.create(prepared);
          const nextAction = getArticleWorkflowNextAction(run);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: run.status === "AWAITING_IMAGE_UPLOAD" ? "AWAITING_IMAGE_GENERATION" : run.status,
                run_id: run.id,
                topic: run.topic,
                next_action: nextAction,
                user_instruction: nextAction.action === "GENERATE_IMAGE"
                  ? "Generate the returned image now. On the next user 'Tiếp tục', pass that native image to continue_article_workflow."
                  : "The idempotent workflow already exists; follow next_action without restarting research or images.",
              }),
            }],
          };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "get_active_article_workflow",
      {
        title: "Get Active Article Workflow",
        description: "Use when the user says 'Tiếp tục', 'Tiếp tục nhé', 'Làm tiếp', or asks for article progress. Returns the pending image or draft action. Do not ask the user for run_id.",
        inputSchema: z.object({}),
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async () => {
        try {
          const run = await ArticleWorkflowRepository.getActive();
          return {
            content: [{ type: "text", text: JSON.stringify(run ? {
              status: run.status,
              run_id: run.id,
              topic: run.topic,
              uploaded_image_ids: Object.keys(run.assets),
              next_action: getArticleWorkflowNextAction(run),
              last_error: run.last_error || null,
            } : {
              status: "NO_ACTIVE_WORKFLOW",
              next_action: "Ask the user which article they want to create.",
            }) }],
          };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "continue_article_workflow",
      {
        title: "Continue Article With Previous Image",
        description: "PRIMARY command for 'Tiếp tục'. If an image was generated in the previous assistant response, pass that native file as `file`; the server infers cover/img-01/img-02/img-03, uploads it, and returns the next image prompt. Generate that next image as the final action. If READY_TO_DRAFT, omit file and the server retries draft creation.",
        inputSchema: z.object({
          run_id: z.string().optional().describe("Optional. Omit to resume the single active workflow."),
          file: z.object({
            download_url: z.string().url(),
            file_id: z.string().min(1),
            mime_type: z.string().optional(),
            file_name: z.string().optional(),
          }).strict().optional().describe("Native image file from the immediately previous assistant response."),
        }),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
        },
        _meta: {
          "openai/fileParams": ["file"],
          "openai/toolInvocation/invoking": "Continuing article workflow…",
          "openai/toolInvocation/invoked": "Article workflow advanced",
        },
      },
      async (input) => {
        let run: ArticleWorkflowRun | null = null;
        try {
          run = await ArticleWorkflowRepository.getActive(input.run_id);
          if (!run) throw new Error("ARTICLE_WORKFLOW_NOT_FOUND: no active article workflow");

          if (run.status === "COMPLETED") {
            return { content: [{ type: "text", text: JSON.stringify({
              status: "COMPLETED",
              run_id: run.id,
              uploaded_assets: run.assets,
              draft: run.draft_result,
              next_action: getArticleWorkflowNextAction(run),
            }) }] };
          }
          if (run.status === "READY_TO_DRAFT") {
            return { content: [{ type: "text", text: JSON.stringify(await finalizeArticleWorkflow(run)) }] };
          }

          const nextAction = getArticleWorkflowNextAction(run);
          if (nextAction.action !== "GENERATE_IMAGE") {
            throw new Error(`ARTICLE_WORKFLOW_STATE_CONFLICT: unexpected ${nextAction.action}`);
          }
          if (!input.file) {
            return {
              content: [{ type: "text", text: JSON.stringify({
                status: "AWAITING_NATIVE_FILE",
                run_id: run.id,
                expected_image_id: nextAction.image_id,
                next_action: nextAction,
                instruction: "Use the native image from the previous assistant response as file. If it is unavailable, regenerate only this pending image.",
              }) }],
            };
          }

          const uploaded = await uploadGeneratedImageFile({
            file: input.file,
            idempotency_key: run.idempotency_key,
            article_key: String(run.article_package.slug || run.topic),
            image_id: nextAction.image_id,
            purpose: nextAction.purpose,
            prompt: nextAction.prompt,
            alt: nextAction.alt,
            aspect: nextAction.aspect,
            filename: nextAction.filename,
          });
          const advanced = applyArticleWorkflowAsset(run, {
            image_id: nextAction.image_id,
            raw_url: uploaded.raw_url,
            width: uploaded.width,
            height: uploaded.height,
            mime_type: uploaded.mime_type,
            file_bytes: uploaded.file_bytes,
            sha256: uploaded.sha256,
          });
          const saved = await ArticleWorkflowRepository.saveProgress(run, advanced);

          if (saved.status === "READY_TO_DRAFT") {
            return { content: [{ type: "text", text: JSON.stringify(await finalizeArticleWorkflow(saved)) }] };
          }
          return {
            content: [{ type: "text", text: JSON.stringify({
              status: "IMAGE_UPLOADED",
              run_id: saved.id,
              uploaded,
              uploaded_image_ids: Object.keys(saved.assets),
              next_action: getArticleWorkflowNextAction(saved),
              user_instruction: "Generate next_action.prompt now as the final action. The user only needs to say 'Tiếp tục nhé'.",
            }) }],
          };
        } catch (err: unknown) {
          const message = errorMessage(err);
          if (run) await ArticleWorkflowRepository.rememberError(run.id, message);
          return { content: [{ type: "text", text: JSON.stringify({ error: message, run_id: run?.id }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "update_blog_draft",
      {
        description: "Update an unpublished DRAFT. calendar_id required. Allowed when slot is drafted (review) or revision_requested. Use this when the user asks to rewrite/upgrade images on an existing draft — do not wait for admin reject, do not create a second post. Same Article Package v7 gates (cover + ≥3 inline GitHub RAW URLs, SEO ≥ 95). Published posts are LOCKED. After success the slot stays drafted (awaiting review).",
        inputSchema: z.object({
          calendar_id: z.string(),
          schema_version: z.string(),
          idempotency_key: z.string(),
          policy_version: z.string(),
          policy_hash: z.string(),
          title: z.string(),
          slug: z.string(),
          excerpt: z.string(),
          content_markdown: z.string(),
          field: z.string().optional(),
          subject: z.string().optional(),
          category_id: z.string().optional(),
          category: z.string().optional(),
          tags: z.array(z.string()).optional(),
          featured_image: z.object({
            purpose: z.literal("article_cover"),
            prompt: z.string(),
            alt: z.string(),
            caption: z.string().optional(),
            suggested_filename: z.string().optional(),
            url: z.string().nullable(),
          }),
          featured_image_url: z.string().nullable(),
          featured_image_alt: z.string().optional(),
          inline_images: z.array(z.any()),
          seo: z.any(),
          aio: z.any(),
          references: z.array(z.any()),
          internal_links: z.array(z.any()),
          quality: z.any(),
          task_id: z.string().optional().nullable(),
        }),
      },
      async (draftData) => {
        try {
          const result = await PostsRepository.updateDraft(draftData);
          revalidateEditorialSurfaces((result as { draft?: { id?: string } })?.draft?.id);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "upload_generated_image_file",
      {
        title: "Upload ChatGPT Image",
        description: "PRIMARY CHATGPT LANE A1. Call immediately after each native ChatGPT Image. Pass the generated image as `file`; ChatGPT fills download_url + file_id. Hub downloads original bytes from download_url, QAs, and stores them on GitHub. Capture raw_url for the draft. Sequence cover, img-01, img-02, img-03. Retry the SAME image_id on failure. Never call start_image_upload from ChatGPT and never draft before four RAW URLs exist.",
        inputSchema: z.object({
          file: z.object({
            download_url: z.string().url(),
            file_id: z.string().min(1),
            mime_type: z.string().optional(),
            file_name: z.string().optional(),
          }).strict().describe("Native ChatGPT file parameter. Do not pass a path or file_id string."),
          idempotency_key: z.string(),
          article_key: z.string().optional(),
          image_id: z.string().describe("cover, img-01, img-02, or img-03"),
          purpose: z.enum([
            "article_cover",
            "editorial_illustration",
            "concept_diagram",
            "case_study",
            "explainer",
            "workflow",
            "comparison",
          ]),
          alt: z.string(),
          aspect: z.enum(["16:9", "4:3", "1:1"]).optional(),
          filename: z.string().optional(),
          prompt: z.string().optional(),
        }),
        outputSchema: z.object({
          status: z.literal("PASS"),
          image_id: z.string(),
          purpose: z.string(),
          raw_url: z.string().url(),
          url: z.string().url(),
          width: z.number(),
          height: z.number(),
          mime_type: z.string(),
          file_bytes: z.number(),
          sha256: z.string(),
          stored_as_received: z.boolean(),
        }),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
        },
        _meta: {
          "openai/fileParams": ["file"],
          "openai/toolInvocation/invoking": "Uploading image to Hub…",
          "openai/toolInvocation/invoked": "Image stored on GitHub",
        },
      },
      async (input) => {
        try {
          const result = await uploadGeneratedImageFile(input);
          return {
            structuredContent: result,
            content: [{ type: "text", text: JSON.stringify(result) }],
          };
        } catch (err: unknown) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      "start_image_upload",
      {
        title: "Start External Binary Upload",
        description: "EXTERNAL CLIENT LANE A2 ONLY. Reserve this tool for browsers or clients that can HTTP POST original PNG bytes to put_url. ChatGPT must not call this tool; ChatGPT must use upload_generated_image_file with a native file attachment.",
        inputSchema: z.object({
          idempotency_key: z.string(),
          article_key: z.string().optional(),
          image_id: z.string().describe("cover or img-01"),
          purpose: z.enum([
            "article_cover",
            "editorial_illustration",
            "concept_diagram",
            "workflow",
            "comparison",
            "case_study",
            "explainer",
            "rubric",
            "timeline",
            "table",
            "framework",
          ]),
          alt: z.string(),
          aspect: z.enum(["16:9", "4:3", "1:1"]).optional(),
          filename: z.string().optional(),
          prompt: z.string().optional(),
        }),
      },
      async (input) => {
        try {
          const session = createImageUploadSession(input);
          return { content: [{ type: "text", text: JSON.stringify(session) }] };
        } catch (err: unknown) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      "upload_github_image",
      {
        description: "ALLOWED. Upload an original image to GitHub repo quanpl86/imgBlog (Hub GITHUB_ASSET_TOKEN). ChatGPT is permitted to do this every session — no separate GitHub login. Stores bytes as-is under public/editor-assets/. Cover ≥1536×864, inline ≥1280×720, PNG preferred. NEVER compress/WebP-downscale first. Then put the returned RAW url on the draft, or pass it as source_url to upload_blog_image for editorial QA/versioning.",
        inputSchema: z.object({
          image_base64: z.string().optional().describe("Original PNG preferred. Do not compress to fit the call; if truncated, use source_url."),
          source_url: z.string().optional().describe("Public HTTPS of the ORIGINAL file. ChatGPT may also use a GitHub connector, then pass that RAW URL here."),
          filename: z.string().optional(),
          idempotency_key: z.string().optional(),
          image_id: z.string().optional().describe("cover or img-01. If it contains cover, cover QA applies."),
          alt: z.string().optional(),
        }),
      },
      async (input) => {
        try {
          const result = await uploadGithubImage(input);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err: unknown) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      "upload_blog_image",
      {
        description: "Store an image on KingDragonHub for non-native/external integrations. ChatGPT-native Images must use upload_generated_image_file; never pass them as image_base64. Cover ≥1536×864. Never WebP 800×450. SVG workflow/rubric: generate_and_upload_blog_image.",
        inputSchema: z.object({
          idempotency_key: z.string(),
          article_key: z.string().optional(),
          image_id: z.string().describe("cover or img-01"),
          purpose: z.enum([
            "article_cover",
            "editorial_illustration",
            "concept_diagram",
            "workflow",
            "comparison",
            "case_study",
            "explainer",
            "rubric",
            "timeline",
            "table",
            "framework",
          ]),
          alt: z.string().describe("Vietnamese alt describing meaning, not keywords."),
          prompt: z.string().optional(),
          aspect: z.enum(["16:9", "4:3", "1:1"]).optional(),
          filename: z.string().optional(),
          image_base64: z.string().optional().describe("Original PNG (preferred) as data URL or raw base64. Do not downscale or WebP-compress first. If this would be truncated, omit it and use source_url."),
          source_url: z.string().optional().describe("PREFERRED when the original file is large. Public HTTPS of the FULL-RESOLUTION original (GitHub RAW PNG, etc.). ChatGPT file URLs may fail — then use generate_and_upload_blog_image instead of compressing."),
        }),
      },
      async (input) => {
        try {
          const result = await uploadBlogImage(input);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err: unknown) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      "generate_and_upload_blog_image",
      {
        description: "LANE B SVG ONLY: workflow/rubric/timeline/table/comparison/framework with exact Vietnamese required_labels. Server rejects article_cover and scene purposes. Covers/scenes are ChatGPT Lane A1: ChatGPT Images → native file attachment → upload_generated_image_file.",
        inputSchema: z.object({
          idempotency_key: z.string().describe("Same key as the draft. Does NOT reuse the file path — each call versions the URL."),
          article_key: z.string().optional().describe("Article slug used in the filename."),
          image_id: z.string().describe("cover or an inline id such as img-01"),
          purpose: z.enum([
            "workflow",
            "comparison",
            "explainer",
            "rubric",
            "timeline",
            "table",
            "framework",
          ]).describe("SVG lane only. Not article_cover."),
          provider: z.enum(["auto", "openai", "gemini", "flux", "stability"]).optional().describe("Ignored for SVG. Do not set flux."),
          fallback: z.boolean().optional(),
          prompt: z.string().describe("Visual goal for the SVG. Exact Vietnamese strings go in required_labels, not here."),
          alt: z.string().describe("Vietnamese alt: meaning of the image, not keyword stuffing."),
          aspect: z.enum(["16:9", "4:3", "1:1"]).optional(),
          filename: z.string().optional(),
          text_policy: z.enum(["no_text", "exact_text", "optional_text"]).optional(),
          visual_goal: z.string().optional().describe("What the reader must understand from the image."),
          must_show: z.array(z.string()).optional(),
          required_labels: z.array(z.string()).optional().describe("Exact Vietnamese strings. Required for workflow/rubric/comparison/timeline. Renderer must not paraphrase."),
          required_values: z.array(z.string()).optional(),
          layout_spec: z.object({
            type: z.enum(["rubric_matrix", "workflow_steps", "comparison", "scene"]),
            rows: z.number().optional(),
            columns: z.number().optional(),
          }).optional(),
          must_not_show: z.array(z.string()).optional(),
          text_language: z.string().optional(),
          text_accuracy_required: z.boolean().optional(),
          visual_style: z.string().optional(),
          qa_required: z.boolean().optional(),
          source_url: z.string().optional().describe("HTTPS URL of the ORIGINAL full-resolution image. Server fetches, QAs, stores bytes as-is, returns a versioned RAW URL. Skip generation. Do not point this at a downscaled WebP."),
          image_base64: z.string().optional().describe("Prefer upload_blog_image. Original PNG data URL/base64 only — never a compressed thumbnail."),
        }),
      },
      async (input) => {
        try {
          const result = await generateAndUploadBlogImage(input);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err: unknown) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      "create_blog_draft",
      {
        description: "Final gate. EXACTLY 1 cover URL + EXACTLY 3 inline GitHub RAW URLs (img-01, img-02, img-03) and {{IMAGE:img-01}}..{{IMAGE:img-03}} in markdown. Server returns IMAGE_SET_INCOMPLETE otherwise. SEO >= 95. Never publish. Free-write: calendar_id=null.",
        inputSchema: z.object({
          schema_version: z.string().describe("Must be article-package/7.0"),
          task_id: z.string().optional().nullable(),
          calendar_id: z.string().optional().nullable().describe("Approved due slot id from get_due_editorial_slots. Required in schedule mode. Leave null for free-write mode."),
          idempotency_key: z.string(),
          policy_version: z.string(),
          policy_hash: z.string(),
          title: z.string(),
          slug: z.string(),
          excerpt: z.string(),
          content_markdown: z.string(),
          field: z.string().optional().describe("Lĩnh vực name or slug from get_blog_categories, e.g. Education & Skills."),
          subject: z.string().optional().describe("Chủ đề name or slug from get_blog_categories, e.g. EARLY CHILDHOOD or PEDAGOGY."),
          category_id: z.string().optional().describe("Existing danh mục id from get_blog_categories. Prefer this over creating a new category."),
          category: z.string().optional().describe("Danh mục name or slug. Matched against existing categories first; created only if nothing fits."),
          tags: z.array(z.string()).optional().describe("Editorial tags shown in admin. Prefer suggested_tags from the chosen category, in Vietnamese."),
          featured_image: z.object({
            purpose: z.literal("article_cover"),
            prompt: z.string(),
            alt: z.string(),
            caption: z.string().optional(),
            suggested_filename: z.string().optional(),
            url: z.string().nullable(),
          }).describe("Cover spec. url MUST be GitHub RAW returned by upload_generated_image_file for a native ChatGPT Image."),
          featured_image_url: z.string().nullable().describe("Same persistent cover URL as featured_image.url."),
          featured_image_alt: z.string().optional(),
          inline_images: z.array(z.object({
            id: z.string(),
            purpose: z.enum(["concept_diagram", "workflow", "comparison", "case_study", "explainer"]),
            position: z.object({
              placeholder: z.string().optional(),
              after_heading_id: z.string().optional(),
            }).optional(),
            prompt: z.string(),
            alt: z.string(),
            caption: z.string().optional(),
            suggested_filename: z.string().optional(),
            url: z.string().nullable(),
          })).describe("At least 2 informational inline images with HTTPS urls. Each id must appear as {{IMAGE:id}} in content_markdown. Max 4. decoration is forbidden."),
          seo: z.object({
            title: z.string(),
            description: z.string(),
            primary_keyword: z.string(),
            secondary_keywords: z.array(z.string()),
            search_intent: z.object({
              primary: z.string(),
              secondary_questions: z.array(z.string()).optional(),
            }),
            semantic_entities: z.array(z.string()),
          }),
          aio: z.object({
            direct_answer: z.string().describe("50-100 word answer-first paragraph."),
            tldr: z.string(),
            key_takeaways: z.array(z.string()),
            faq: z.array(z.object({
              question: z.string(),
              answer: z.string()
            })).optional(),
          }),
          references: z.array(z.object({
            title: z.string(),
            url: z.string(),
            source_type: z.string(),
          })),
          internal_links: z.array(z.object({
            post_id: z.string(),
            anchor: z.string(),
          })),
          schema_org: z.record(z.string(), z.any()).optional(),
          quality: z.object({
            overall: z.number(),
            factual_accuracy: z.number(),
            source_quality: z.number(),
            seo: z.number(),
            aio: z.number(),
            editorial: z.number(),
            hard_fail_conditions: z.array(z.string()),
          }),
        })
      },
      async (draftData) => {
        try {
          const pkg = normalizeArticlePackage(draftData);
          const result = await PostsRepository.createDraft({
            ...draftData,
            featured_image: pkg.featured_image,
            featured_image_alt: pkg.featured_image?.alt,
            inline_images: pkg.inline_images,
          });
          revalidateEditorialSurfaces((result as { draft_id?: string })?.draft_id);
          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
          };
        } catch (err: unknown) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}

// Handler Request bằng MCP V2
const handler = createMcpHandler(createKingDragonHubMcpServer);

export async function POST(req: Request) {
  // Fail-Closed Authentication
  const secret = process.env.MCP_SECRET_KEY;
  if (!secret) {
    return new Response("MCP server configuration error", { status: 500 });
  }

  // Support token via header or query param for SSE (EventSource doesn't support custom headers in browser, but SDK supports headers)
  const authHeader = req.headers.get("authorization");
  
  const isDevBearer = process.env.MCP_ALLOW_STATIC_BEARER === "true"
    && authHeader === `Bearer ${secret}`;
  let isOAuthToken = false;
  if (authHeader) {
    const decoded = verifyToken(authHeader);
    if (decoded
      && decoded.type === 'access'
      && decoded.iss === getOAuthIssuer()
      && decoded.aud === getOAuthResource()
      && typeof decoded.scope === 'string') {
      isOAuthToken = true;
    }
  }

  if (!isDevBearer && !isOAuthToken) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${getOAuthIssuer()}/.well-known/oauth-protected-resource", scope="blog:read policy:read draft:create media:write"`,
      },
    });
  }

  // Chuyển tiếp Request cho handler xử lý
  return handler.fetch(req);
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Export GET for SSE connections
export const GET = POST;
