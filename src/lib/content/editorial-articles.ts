import { EditorialCalendarRepository, type EditorialSlot } from "./editorial-calendar";
import { EditorialCommentRepository } from "./editorial-comments";
import {
  normalizeDraftRevisionRequest,
  parseDraftRevisionFromFeedback,
  type DraftRevisionRequest,
} from "./editorial-draft-revision";

export type EditorialArticleSummary = {
  calendar_id: string;
  post_id: string;
  title: string;
  slug: string | null;
  is_published: boolean;
  slot_status: string;
  workflow_status: "published" | "revise" | "review" | "writing" | "other";
  scheduled_date: string | null;
  scheduled_time: string | null;
  last_seo_score: number | null;
  can_update: boolean;
  mode: "week" | "free_write";
};

function workflowStatus(slot: EditorialSlot, isPublished: boolean): EditorialArticleSummary["workflow_status"] {
  if (isPublished || slot.status === "published") return "published";
  if (slot.status === "revision_requested" && slot.result_post_id) return "revise";
  if (slot.status === "drafted") return "review";
  if (slot.status === "writing") return "writing";
  return "other";
}

export class EditorialArticlesRepository {
  static async list(supabase: any): Promise<{ articles: EditorialArticleSummary[]; instruction: string }> {
    const slots = (await EditorialCalendarRepository.list(supabase)).filter((slot) => slot.result_post_id);
    const postIds = slots.map((slot) => slot.result_post_id) as string[];
    const posts = new Map<string, { id: string; slug: string | null; is_published: boolean; title: string }>();
    if (postIds.length) {
      const { data, error } = await supabase
        .from("posts")
        .select("id, slug, is_published, title")
        .in("id", postIds);
      if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
      for (const row of data || []) posts.set(row.id, row);
    }
    const articles = slots.map((slot) => {
      const post = posts.get(slot.result_post_id as string);
      const isPublished = Boolean(post?.is_published || slot.status === "published");
      const status = workflowStatus(slot, isPublished);
      return {
        calendar_id: slot.id,
        post_id: slot.result_post_id as string,
        title: post?.title || slot.title,
        slug: post?.slug || null,
        is_published: isPublished,
        slot_status: slot.status,
        workflow_status: status,
        scheduled_date: slot.scheduled_date,
        scheduled_time: slot.scheduled_time,
        last_seo_score: slot.last_seo_score,
        can_update: status === "revise" || status === "review",
        mode: slot.week_id ? "week" : "free_write",
      };
    });
    return {
      articles,
      instruction:
        "published = đã đăng, LOCKED. review = chờ admin đọc. revise = admin đã trả — get_editorial_draft rồi update_blog_draft(calendar_id). mode=free_write là bài tự do (week_id null), cùng vòng trả/sửa. writing = GPT đang gửi draft.",
    };
  }

  static async getDraft(
    supabase: any,
    input: { calendar_id?: string | null; post_id?: string | null }
  ) {
    const calendarId = input.calendar_id?.trim() || null;
    const postId = input.post_id?.trim() || null;
    if (!calendarId && !postId) throw new Error("calendar_id or post_id is required");
    const slot = calendarId
      ? await EditorialCalendarRepository.get(supabase, calendarId)
      : await EditorialCalendarRepository.getByPostId(supabase, postId as string);
    if (!slot) throw new Error("UNKNOWN_SLOT");
    if (!slot.result_post_id) throw new Error("NO_DRAFT: no post linked to this slot");

    const { data: post, error } = await supabase
      .from("posts")
      .select(
        "id, title, slug, excerpt, content, image_url, is_published, keywords, tags, meta_title, meta_description, seo_keywords, article_package, updated_at"
      )
      .eq("id", slot.result_post_id)
      .maybeSingle();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    if (!post) throw new Error("DRAFT_NOT_FOUND");

    let comments: Awaited<ReturnType<typeof EditorialCommentRepository.listForWeeks>> = [];
    if (slot.week_id) {
      comments = (await EditorialCommentRepository.listForWeeks(supabase, [slot.week_id])).filter(
        (item) => item.slot_id === slot.id
      );
    }

    const revision =
      (await latestRevisionRequest(supabase, slot.id)) ||
      parseDraftRevisionFromFeedback(slot.admin_feedback);
    const isPublished = Boolean(post.is_published || slot.status === "published");
    const status = workflowStatus(slot, isPublished);

    return {
      calendar_id: slot.id,
      week_id: slot.week_id,
      slot: {
        id: slot.id,
        title: slot.title,
        status: slot.status,
        scheduled_date: slot.scheduled_date,
        scheduled_time: slot.scheduled_time,
        last_seo_score: slot.last_seo_score,
        admin_feedback: slot.admin_feedback,
      },
      workflow_status: status,
      can_update: !isPublished && (status === "revise" || status === "review"),
      revision_request: revision,
      comments,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        image_url: post.image_url,
        is_published: post.is_published,
        keywords: post.keywords,
        tags: post.tags,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        seo_keywords: post.seo_keywords,
        article_package: post.article_package,
        updated_at: post.updated_at,
        review_url: `https://kingdragonhub.com/admin/posts/edit/${post.id}`,
      },
      instruction: isPublished
        ? "PLAN_LOCKED: published. Do not call update_blog_draft."
        : status === "revise"
          ? "Admin returned this draft. Follow revision_request and comments. Regen images if fix_cover or fix_inline_images. Then update_blog_draft(calendar_id). Do not create_blog_draft."
          : "Draft is waiting for admin review. Only update_blog_draft if the admin asked you to fix it.",
    };
  }
}

async function latestRevisionRequest(supabase: any, slotId: string): Promise<DraftRevisionRequest | null> {
  const { data, error } = await supabase
    .from("editorial_activity")
    .select("payload")
    .eq("slot_id", slotId)
    .eq("event", "article_rejected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
  const payload = data?.payload;
  if (!payload || typeof payload !== "object") return null;
  const request = (payload as { request?: Partial<DraftRevisionRequest> }).request;
  if (!request) return normalizeDraftRevisionRequest(String((payload as { feedback?: string }).feedback || ""));
  return normalizeDraftRevisionRequest(request);
}

export async function seoTargetForSlot(supabase: any, slotId: string, fallback = 95): Promise<number> {
  const fromActivity = await latestRevisionRequest(supabase, slotId);
  if (fromActivity?.seo_target && fromActivity.seo_target > fallback) return fromActivity.seo_target;
  try {
    const slot = await EditorialCalendarRepository.get(supabase, slotId);
    const parsed = parseDraftRevisionFromFeedback(slot.admin_feedback);
    if (parsed?.seo_target && parsed.seo_target > fallback) return parsed.seo_target;
  } catch {
    /* unknown slot */
  }
  return fallback;
}
