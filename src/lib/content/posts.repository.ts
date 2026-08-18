import { createClient } from "@supabase/supabase-js";
import { EditorialPolicyRepository } from "../editorial/editorial-policy.repository";
import { sendDraftEmailNotification } from "../notifications/email";
import {
  buildArticlePackageSnapshot,
  dedupeIssues,
  formatPackageErrors,
  normalizeArticlePackage,
  validateArticlePackage,
  type PackageIssue,
} from "./article-package";
import { compileArticleHtml } from "./compile-article-html";
import { resolvePostTaxonomy } from "./taxonomy";

function sanitizeTaskId(taskId: unknown): string | null {
  if (typeof taskId !== "string") return null;
  const trimmed = taskId.trim();
  return trimmed === "" ? null : trimmed;
}

// Helper to get an admin Supabase client for backend operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables for backend operations.");
  }
  return createClient(url, key);
}

export class PostsRepository {
  /**
   * Lấy danh sách các bài viết hiện có để kiểm tra trùng lặp (Inventory)
   */
  static async getInventory(params: { category?: string; topic?: string; limit?: number }) {
    const supabase = getSupabaseAdmin();
    const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 100);

    let query = supabase.from("posts").select("id, title, slug, status, is_published, keywords, category_id, updated_at");

    if (params.category) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .or(`slug.eq.${params.category},name.eq.${params.category}`)
        .limit(1)
        .single();
        
      if (!cat) {
        return { posts: [], count: 0 };
      }
      query = query.eq("category_id", cat.id);
    }

    query = query.limit(safeLimit);
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("[PostsRepository] getInventory error:", error);
      return { posts: [], count: 0, error: error.message };
    }

    // Simple text search filter if topic provided
    let filteredData = data || [];
    if (params.topic) {
      const topicLower = params.topic.toLowerCase();
      filteredData = filteredData.filter((p) => 
        p.title.toLowerCase().includes(topicLower) || 
        (p.keywords && p.keywords.some((k: string) => k.toLowerCase().includes(topicLower)))
      );
    }

    return {
      posts: filteredData,
      count: filteredData.length
    };
  }

  static async getCategories() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description")
      .order("name");
    if (error) {
      return { categories: [], error: error.message };
    }
    return { categories: data || [] };
  }

  /**
   * Tìm các bài viết liên quan dựa trên keywords giao nhau (Related Posts)
   */
  static async getRelatedPosts(params: {
    topic: string;
    keywords?: string[];
    category?: string;
    exclude_post_id?: string;
    limit?: number;
  }) {
    const supabase = getSupabaseAdmin();
    // Fetch posts that are published to link to
    const safeLimit = Math.min(Math.max(params.limit ?? 10, 1), 100);
    
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, keywords, updated_at")
      .eq("is_published", true);

    if (error) {
      console.error("[PostsRepository] getRelatedPosts error:", error);
      return { posts: [], error: error.message };
    }

    const posts = data || [];
    const targetKeywords = params.keywords ? params.keywords.map((k) => k.toLowerCase()) : [];
    const topicLower = params.topic.toLowerCase();

    // Tính điểm relevance (0-1 scale)
    const scoredPosts = posts
      .filter((p) => p.id.toString() !== params.exclude_post_id)
      .map((p) => {
        let score = 0;
        const postKeywords = p.keywords ? p.keywords.map((k: string) => k.toLowerCase()) : [];
        
        // 1. Topic match in title (0.4 weight)
        if (p.title.toLowerCase().includes(topicLower)) {
          score += 0.4;
        }

        // 2. Keyword intersection (0.6 weight)
        if (targetKeywords.length > 0 && postKeywords.length > 0) {
          const intersection = targetKeywords.filter((k) => postKeywords.includes(k));
          const keywordScore = (intersection.length / Math.max(targetKeywords.length, 1)) * 0.6;
          score += keywordScore;
        }

        return { ...p, relevance_score: score };
      })
      .filter((p) => p.relevance_score > 0) // Chỉ trả về các bài có liên quan
      .sort((a, b) => {
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        // Tie-breaker: updated_at DESC, id ASC
        const dateB = new Date(b.updated_at || 0).getTime();
        const dateA = new Date(a.updated_at || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return a.id.localeCompare(b.id);
      })
      .slice(0, safeLimit);

    return {
      posts: scoredPosts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        relevance_score: p.relevance_score.toFixed(2)
      }))
    };
  }

  /**
   * Tạo bản nháp (DRAFT) từ nội dung AI
   * Áp dụng chính sách Fail-Closed:
   * - status/is_published luôn bị ép thành DRAFT / false
   * - is_ai_generated luôn bị ép thành true
   * - Yêu cầu idempotency_key để tránh duplicate
   */
  static async createDraft(draftData: any) {
    const supabase = getSupabaseAdmin();

    // 1. Kiểm tra Idempotency & Task ID
    if (!draftData.idempotency_key) {
      throw new Error("Missing idempotency_key");
    }

    // Sanitize task_id (ChatGPT sometimes sends empty string "")
    const taskId = sanitizeTaskId(draftData.task_id);

    // Verify task_id exists in content_tasks ONLY IF PROVIDED
    if (taskId) {
      const { data: task, error: taskError } = await supabase
        .from("content_tasks")
        .select("id")
        .eq("id", taskId)
        .maybeSingle();
        
      if (taskError && taskError.code !== '22P02') {
        // 22P02 is invalid input syntax for uuid, which also means unknown task_id
        throw new Error(`DATABASE_ERROR: ${taskError.message}`);
      }
      if (!task) {
        throw new Error("UNKNOWN_TASK_ID");
      }
    }

    // 2. Check Idempotency Replay
    // Bắt lỗi nếu column chưa được migrate, fallback to standard error.
    try {
      const { data: existingPost, error: idempError } = await supabase
        .from("posts")
        .select("id, slug")
        .eq("idempotency_key", draftData.idempotency_key)
        .maybeSingle();

      if (idempError && idempError.code !== 'PGRST116' && !idempError.message?.includes('does not exist')) {
        throw idempError;
      }

      if (existingPost) {
        return {
          success: true,
          created: false,
          reason: "IDEMPOTENT_REPLAY",
          draft: {
            id: existingPost.id,
            slug: existingPost.slug,
            review_url: `https://kingdragonhub.com/admin/posts/preview?id=${existingPost.id}`
          }
        };
      }
    } catch (err: any) {
      // If column doesn't exist, we just proceed. The migration should be applied.
      if (!err.message?.includes('does not exist')) {
        throw err;
      }
    }

    // 3. Quality Gate & Policy Validation (Server-side)
    const activePolicy = await EditorialPolicyRepository.getActivePolicy();
    
    if (draftData.policy_version !== activePolicy.policy_version) {
      throw new Error("QUALITY_GATE_FAILED: policy_version mismatch");
    }
    if (draftData.policy_hash !== activePolicy.policy_hash) {
      throw new Error("QUALITY_GATE_FAILED: policy_hash mismatch");
    }
    if ((draftData.references?.length || 0) < activePolicy.source_policy.minimum_sources) {
      throw new Error("QUALITY_GATE_FAILED: Not enough references");
    }
    if ((draftData.internal_links?.length || 0) < activePolicy.internal_linking.minimum_links) {
      throw new Error("QUALITY_GATE_FAILED: Not enough internal_links");
    }
    if (draftData.quality.hard_fail_conditions && draftData.quality.hard_fail_conditions.length > 0) {
      throw new Error(`QUALITY_GATE_FAILED: Hard fail conditions met - ${draftData.quality.hard_fail_conditions.join(', ')}`);
    }
    if (draftData.quality.overall < activePolicy.quality_gate.overall_min) {
      throw new Error("QUALITY_GATE_FAILED: Overall quality below threshold");
    }
    if (draftData.quality.factual_accuracy < activePolicy.quality_gate.factual_accuracy_min) {
      throw new Error("QUALITY_GATE_FAILED: Factual accuracy below threshold");
    }
    if (draftData.quality.source_quality < activePolicy.quality_gate.source_quality_min) {
      throw new Error("QUALITY_GATE_FAILED: Source quality below threshold");
    }

    const pkg = normalizeArticlePackage(draftData);
    const mediaCheck = validateArticlePackage(pkg, {
      requireV7Fields: process.env.MCP_REQUIRE_V7_FIELDS === "true",
    });
    if (mediaCheck.errors.length > 0) {
      throw new Error(`QUALITY_GATE_FAILED: ${formatPackageErrors(mediaCheck.errors)}`);
    }

    const compileNative = process.env.MCP_COMPILE_NATIVE_HTML !== "false";
    let finalContent: string;
    const compileWarnings: PackageIssue[] = [];
    if (compileNative) {
      const compiled = await compileArticleHtml(pkg);
      finalContent = compiled.html;
      compileWarnings.push(...compiled.warnings);
    } else {
      finalContent = buildRichContent(draftData);
    }

    const taxonomy = await resolvePostTaxonomy(supabase, {
      category_id: draftData.category_id,
      category: draftData.category,
      title: draftData.title,
      tags: draftData.tags,
      seo: draftData.seo,
    });

    const warnings = dedupeIssues([
      ...mediaCheck.warnings,
      ...compileWarnings,
      ...taxonomy.warnings,
    ]);
    const articlePackage = {
      ...buildArticlePackageSnapshot(pkg, warnings),
      category: taxonomy.category,
      tags: taxonomy.tags,
    };

    // 4. Chuẩn bị dữ liệu và Hard-Lock Governance
    const insertData: any = {
      title: draftData.title,
      slug: draftData.slug,
      excerpt: draftData.excerpt,
      content: finalContent,
      is_published: false, // HARD-LOCK
      is_ai_generated: true, // HARD-LOCK
      category_id: taxonomy.category_id,
      keywords: taxonomy.keywords,
      tags: taxonomy.tags,
      image_url: pkg.featured_image?.url || null,
      meta_title: draftData.seo?.title || draftData.title,
      meta_description: draftData.seo?.description || draftData.excerpt,
      seo_keywords: {
        primary: draftData.seo?.primary_keyword,
        secondary: draftData.seo?.secondary_keywords,
        quality_score: draftData.quality?.overall,
        image_alt: pkg.featured_image?.alt || null,
        search_intent: pkg.seo.search_intent || null,
        semantic_entities: pkg.seo.semantic_entities || null,
        direct_answer: pkg.aio.direct_answer || null
      },
      schema_org: draftData.schema_org,
      source_task_id: taskId,
      article_package: articlePackage,
    };

    // Chỉ add idempotency_key nếu migration đã chạy (chúng ta sẽ insert, nếu fail do schema thì catch và retry không có cột này)
    try {
      insertData.idempotency_key = draftData.idempotency_key;
      
      const { data, error } = await supabase
        .from("posts")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        const missingColumn = error.message?.includes('does not exist');
        if (missingColumn && error.message?.includes('article_package')) {
          delete insertData.article_package;
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("posts")
            .insert([insertData])
            .select()
            .single();
          if (fallbackError) throw new Error("Failed to create draft: " + fallbackError.message);
          return await handleDraftSuccess(supabase, fallbackData, draftData, activePolicy, warnings);
        }
        if (missingColumn && error.message?.includes('idempotency_key')) {
          delete insertData.idempotency_key;
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("posts")
            .insert([insertData])
            .select()
            .single();
          if (fallbackError) throw new Error("Failed to create draft: " + fallbackError.message);
          return await handleDraftSuccess(supabase, fallbackData, draftData, activePolicy, warnings);
        }
        throw new Error("Failed to create draft: " + error.message);
      }
      return await handleDraftSuccess(supabase, data, draftData, activePolicy, warnings);

    } catch (err: any) {
      console.error("[PostsRepository] createDraft error:", err);
      throw err;
    }
  }
}

async function handleDraftSuccess(
  supabase: any,
  data: any,
  draftData: any,
  activePolicy: any,
  warnings: PackageIssue[] = []
) {
  const taskId = sanitizeTaskId(draftData.task_id);

  // Update Audit Log trong content_tasks
  if (taskId) {
    await supabase.from("content_tasks").update({
      status: "AWAITING_REVIEW",
      result_post_id: data.id,
      logs: JSON.stringify({
        event: "DRAFT_CREATED",
        post_id: data.id,
        policy_version: activePolicy.policy_version,
        policy_hash: activePolicy.policy_hash,
        created_at: new Date().toISOString()
      })
    }).eq("id", taskId);
  }

  // Gửi email thông báo cho Admin (không await để tránh chặn response của API)
  sendDraftEmailNotification(data.title, data.id).catch(console.error);

  return {
    success: true,
    created: true,
    draft_id: data.id,
    title: data.title,
    slug: data.slug,
    review_url: `https://kingdragonhub.com/admin/posts/edit/${data.id}`,
    status: "DRAFT",
    source_task_id: taskId,
    policy_version: activePolicy.policy_version,
    quality_overall: draftData.quality?.overall ?? null,
    warnings,
    category_id: data.category_id ?? null,
    tags: data.tags ?? []
  };
}

// Helper: Render AIO & SEO structured data into final Markdown
function buildRichContent(draftData: any): string {
  let md = "";

  // 1. TLDR (Answer First - AIO)
  if (draftData.aio?.tldr) {
    md += `> **Tóm tắt (TLDR):** ${draftData.aio.tldr}\n\n`;
  }

  // 2. Key Takeaways (AIO)
  if (draftData.aio?.key_takeaways && draftData.aio.key_takeaways.length > 0) {
    md += `## 🎯 Những Điểm Chính (Key Takeaways)\n`;
    draftData.aio.key_takeaways.forEach((point: string) => {
      md += `- ${point}\n`;
    });
    md += `\n`;
  }

  // 3. Core Content (SEO & Semantic Headings)
  md += `${draftData.content_markdown}\n\n`;

  // 4. FAQ (AIO - Structured Information)
  if (draftData.aio?.faq && draftData.aio.faq.length > 0) {
    md += `--- \n## ❓ Câu Hỏi Thường Gặp (FAQ)\n`;
    draftData.aio.faq.forEach((item: any) => {
      md += `**Q: ${item.question}**\n${item.answer}\n\n`;
    });
  }

  // 5. Internal Links (SEO Semantic Topic Cluster)
  if (draftData.internal_links && draftData.internal_links.length > 0) {
    md += `--- \n## 🔗 Đọc Thêm\n`;
    draftData.internal_links.forEach((link: any) => {
      md += `- [${link.anchor}](${link.url})\n`;
    });
    md += `\n`;
  }

  // 6. References (E-E-A-T & Academic Integrity)
  if (draftData.references && draftData.references.length > 0) {
    md += `--- \n## 📚 Nguồn Tham Khảo\n`;
    draftData.references.forEach((ref: any, index: number) => {
      md += `${index + 1}. [${ref.title}](${ref.url}) `;
      if (ref.author || ref.year) {
        md += `*(${ref.author || 'N/A'}, ${ref.year || 'N/A'})* `;
      }
      md += `- Nguồn Tier: ${ref.tier || 'N/A'}\n`;
    });
  }

  return md;
}
