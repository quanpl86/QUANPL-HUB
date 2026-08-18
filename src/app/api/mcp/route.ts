import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";
import { verifyToken } from "@/lib/oauth-utils";
import { getOAuthIssuer, getOAuthResource } from "@/lib/oauth-security";
import { PostsRepository } from "@/lib/content/posts.repository";
import { EditorialPolicyRepository } from "@/lib/editorial/editorial-policy.repository";
import { normalizeArticlePackage } from "@/lib/content/article-package";
import { generateAndUploadBlogImage } from "@/lib/content/blog-image";
import { EditorialCalendarRepository } from "@/lib/content/editorial-calendar";
import { EditorialWeekRepository } from "@/lib/content/editorial-week";
import { EditorialCommentRepository } from "@/lib/content/editorial-comments";
import { EditorialPlanAudit } from "@/lib/content/editorial-plan";
import { EDITORIAL_COMMANDS } from "@/lib/content/editorial-commands";
import { getSupabaseAdmin } from "@/lib/supabase";

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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function createKingDragonHubMcpServer() {
  const server = new McpServer({
    name: "KingDragonHub-MCP",
    version: "7.10.0",
  });

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
      description: "Contract canary + full Vietnamese short-command map. Call first every session. Follow short_commands / get_editorial_commands for: đề xuất lịch, check lịch, báo chi tiết, check hạn, sửa lịch, viết tự do, viết đến hạn, sửa bài bị trả.",
      inputSchema: z.object({})
    },
    async () => ({
      content: [{
        type: "text",
        text: JSON.stringify({
          mcp_server: "KingDragonHub-MCP",
          mcp_version: "7.10.0",
          media_tool: "generate_and_upload_blog_image",
          taxonomy_tool: "get_blog_categories",
          calendar_tools: [
            "get_editorial_commands",
            "propose_editorial_week",
            "list_editorial_weeks",
            "get_editorial_week",
            "revise_editorial_week",
            "add_editorial_comment",
            "get_due_editorial_slots",
            "list_editorial_calendar",
            "update_blog_draft",
          ],
          review_desk: "/admin/editorial",
          command_tool: "get_editorial_commands",
          short_commands: EDITORIAL_COMMANDS,
          calendar_workflow: {
            "1": "propose_editorial_week — send the weekly article list for review. Do NOT write articles yet.",
            "2": "Admin reviews at /admin/editorial: reorder (item_order), edit briefs, and leave detailed comments.",
            "3": "If revision_requested: get_editorial_week, read comments + revision_constraints, then revise_editorial_week with based_on_revision=week.revision_number. Success moves the week to revision_ready. Stale based_on_revision returns REVISION_CONFLICT.",
            "4": "After the week is approved: each session call get_due_editorial_slots. Write in item_order.",
            "5": "Write only due slots via create_blog_draft(calendar_id). Server rejects writing before scheduled datetime.",
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
            min_items_with_url: 2,
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
      content: [{ type: "text", text: JSON.stringify(EDITORIAL_COMMANDS, null, 2) }],
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
              instruction: "Write due[] with create_blog_draft(calendar_id). Fix revise[] with update_blog_draft(calendar_id) after reading admin comments. Ignore blocked[] until the admin approves the week. Do not write upcoming[].",
            }),
          }],
        };
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
          const slot = await EditorialCalendarRepository.revise(getSupabaseAdmin(), id, patch);
          return { content: [{ type: "text", text: JSON.stringify({ slot }) }] };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "update_blog_draft",
      {
        description: "Revise an existing DRAFT after admin rejected the article. calendar_id required. Same Article Package v7 gates as create_blog_draft. Only DRAFT→DRAFT. Published posts are rejected. After success the slot returns to drafted (awaiting review).",
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
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err: unknown) {
          return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage(err) }) }], isError: true };
        }
      }
    );

    server.registerTool(
      "generate_and_upload_blog_image",
      {
        description: "Generate an editorial blog image, upload it to GitHub, and return a persistent RAW URL. REQUIRED before create_blog_draft: call once with image_id=cover (16:9), then at least twice for body images (img-01, img-02). Put those URLs into featured_image.url and inline_images[].url. Does not create a post. Preschool/child scenes must be illustration-only.",
        inputSchema: z.object({
          idempotency_key: z.string().describe("Same key as the draft. Retry overwrites the same GitHub path."),
          image_id: z.string().describe("cover or an inline id such as img-01"),
          purpose: z.enum([
            "article_cover",
            "concept_diagram",
            "workflow",
            "comparison",
            "case_study",
            "explainer",
          ]),
          prompt: z.string().describe("English illustration prompt. No photorealistic children."),
          alt: z.string().describe("Vietnamese alt text. Required. Copied into featured_image.alt / img alt."),
          aspect: z.enum(["16:9", "4:3", "1:1"]).optional(),
          filename: z.string().optional(),
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
        description: "Create a review-only DRAFT from Article Package v7. Free mode: calendar_id=null. Schedule mode: calendar_id must be an approved due slot from get_due_editorial_slots. If the slot belongs to a week, that week must be approved. Server rejects writing before scheduled_date + scheduled_time (Asia/Ho_Chi_Minh). HARD REQUIREMENTS: cover HTTPS url; at least 2 inline images with {{IMAGE:id}}; system SEO score >= 95. Never publish.",
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
          }).describe("Cover spec. url MUST be a GitHub RAW HTTPS URL from generate_and_upload_blog_image."),
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
        "WWW-Authenticate": `Bearer resource_metadata="${getOAuthIssuer()}/.well-known/oauth-protected-resource", scope="blog:read policy:read draft:create"`,
      },
    });
  }

  // Chuyển tiếp Request cho handler xử lý
  return handler.fetch(req);
}

// Export GET for SSE connections
export const GET = POST;
