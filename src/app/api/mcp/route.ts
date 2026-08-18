import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";
import { verifyToken } from "@/lib/oauth-utils";
import { getOAuthIssuer, getOAuthResource } from "@/lib/oauth-security";
import { PostsRepository } from "@/lib/content/posts.repository";
import { EditorialPolicyRepository } from "@/lib/editorial/editorial-policy.repository";
import { normalizeArticlePackage } from "@/lib/content/article-package";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function createKingDragonHubMcpServer() {
  const server = new McpServer({
    name: "KingDragonHub-MCP",
    version: "2.0.0",
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

  // [Tool 3]: get_editorial_guidelines
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

  // [Tool 4]: create_blog_draft
  if (process.env.MCP_ENABLE_WRITE === "true") {
    server.registerTool(
      "create_blog_draft",
      {
        description: "Create a review-only DRAFT from Article Package v7. content_markdown is the clean narrative only (may include {{IMAGE:id}}). AIO/FAQ/citations/media are structured fields. featured_image is an object with purpose/prompt/alt/url (url may be null in Phase A+B). Never publish.",
        inputSchema: z.object({
          schema_version: z.string().optional().describe("article-package/7.0"),
          task_id: z.string().optional().nullable(),
          idempotency_key: z.string(),
          policy_version: z.string(),
          policy_hash: z.string(),
          title: z.string(),
          slug: z.string(),
          excerpt: z.string(),
          content_markdown: z.string(),
          category_id: z.string().optional(),
          tags: z.array(z.string()).optional(),
          featured_image: z.object({
            purpose: z.literal("article_cover"),
            prompt: z.string(),
            alt: z.string(),
            caption: z.string().optional(),
            suggested_filename: z.string().optional(),
            url: z.string().nullable().optional(),
          }).optional().describe("Cover spec. url may be null until generate_and_upload_blog_image exists."),
          featured_image_url: z.string().optional().describe("Legacy v6 cover URL. Prefer featured_image object."),
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
            url: z.string().nullable().optional(),
          })).optional().describe("0-4 informational inline images. Use {{IMAGE:id}} in content_markdown."),
          seo: z.object({
            title: z.string(),
            description: z.string(),
            primary_keyword: z.string(),
            secondary_keywords: z.array(z.string()),
            search_intent: z.object({
              primary: z.string(),
              secondary_questions: z.array(z.string()).optional(),
            }).optional(),
            semantic_entities: z.array(z.string()).optional(),
          }),
          aio: z.object({
            direct_answer: z.string().optional().describe("50-100 word answer-first paragraph."),
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
