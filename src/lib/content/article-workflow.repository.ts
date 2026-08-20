import { getSupabaseAdmin } from "../supabase.ts";
import {
  ARTICLE_WORKFLOW_VERSION,
  type ArticleWorkflowImageId,
  type ArticleWorkflowJson,
  type ArticleWorkflowRun,
  type ArticleWorkflowStatus,
} from "./article-workflow.ts";

type DbRow = Record<string, unknown>;

function fromRows(row: DbRow, images: DbRow[]): ArticleWorkflowRun {
  const assets: ArticleWorkflowRun["assets"] = {};
  const failures: ArticleWorkflowRun["image_failures"] = {};
  for (const image of images) {
    const imageId = String(image.image_id) as ArticleWorkflowImageId;
    if (image.status === "UPLOADED") {
      assets[imageId] = {
        image_id: imageId,
        raw_url: String(image.raw_url), width: Number(image.width), height: Number(image.height),
        mime_type: String(image.mime_type), file_bytes: Number(image.file_bytes), sha256: String(image.sha256),
      };
    }
    if (Number(image.attempt_count) > 0 || image.status === "MISSING") {
      failures[imageId] = {
        image_id: imageId,
        attempt_count: Number(image.attempt_count), max_attempts: Number(image.max_attempts),
        failure_code: String(image.failure_code || "IMAGE_FAILED"),
        failure_reason: String(image.failure_reason || "Image processing failed"),
        status: image.status === "MISSING" ? "MISSING" : "PENDING",
      };
    }
  }
  return {
    id: String(row.id), workflow_version: ARTICLE_WORKFLOW_VERSION,
    topic: String(row.topic), idempotency_key: String(row.idempotency_key),
    status: String(row.status) as ArticleWorkflowStatus,
    media_status: String(row.media_status) as ArticleWorkflowRun["media_status"],
    current_index: Number(row.current_index),
    article_package: (row.article_package || {}) as ArticleWorkflowJson,
    image_plan: images.map((image) => ({
      image_id: String(image.image_id) as ArticleWorkflowImageId,
      purpose: String(image.purpose) as "article_cover" | "editorial_illustration",
      prompt: String(image.prompt), alt: String(image.alt), aspect: "16:9" as const,
      filename: typeof image.suggested_filename === "string" ? image.suggested_filename : undefined,
    })),
    assets, image_failures: failures,
    draft_result: (row.draft_result || null) as ArticleWorkflowJson | null,
    last_error: typeof row.last_error === "string" ? row.last_error : null,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

async function imagesFor(workflowId: string): Promise<DbRow[]> {
  const { data, error } = await getSupabaseAdmin().from("article_workflow_images").select("*")
    .eq("workflow_id", workflowId).order("sequence_no", { ascending: true });
  if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
  return (data || []) as DbRow[];
}

async function event(workflowId: string, eventType: string, details: ArticleWorkflowJson = {}, imageId?: string) {
  const { error } = await getSupabaseAdmin().from("article_workflow_events").insert({
    workflow_id: workflowId, event_type: eventType, image_id: imageId || null, details,
  });
  if (error) console.error("[ArticleWorkflowRepository] event", error);
}

export class ArticleWorkflowRepository {
  static async create(run: ArticleWorkflowRun): Promise<ArticleWorkflowRun> {
    const supabase = getSupabaseAdmin();
    const { data: replay, error: replayError } = await supabase.from("article_workflow_runs").select("*")
      .eq("idempotency_key", run.idempotency_key).maybeSingle();
    if (replayError) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${replayError.message}`);
    if (replay) return fromRows(replay as DbRow, await imagesFor(String(replay.id)));
    const { error: cancelError } = await supabase.from("article_workflow_runs").update({
      status: "CANCELLED", completed_at: new Date().toISOString(),
    }).in("status", ["AWAITING_IMAGE_UPLOAD", "READY_TO_DRAFT", "READY_TO_DRAFT_INCOMPLETE"]);
    if (cancelError) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${cancelError.message}`);
    const { data, error } = await supabase.from("article_workflow_runs").insert({
      id: run.id, workflow_version: ARTICLE_WORKFLOW_VERSION, topic: run.topic,
      idempotency_key: run.idempotency_key, status: run.status, media_status: run.media_status,
      current_index: run.current_index, article_package: run.article_package,
    }).select("*").single();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    const { error: imageError } = await supabase.from("article_workflow_images").insert(run.image_plan.map((image, sequenceNo) => ({
      workflow_id: run.id, image_id: image.image_id, sequence_no: sequenceNo, purpose: image.purpose,
      prompt: image.prompt, alt: image.alt, aspect: image.aspect, suggested_filename: image.filename || null,
    })));
    if (imageError) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${imageError.message}`);
    await event(run.id, "WORKFLOW_STARTED", { topic: run.topic });
    return fromRows(data as DbRow, await imagesFor(run.id));
  }

  static async getActive(runId?: string): Promise<ArticleWorkflowRun | null> {
    let query = getSupabaseAdmin().from("article_workflow_runs").select("*");
    query = runId ? query.eq("id", runId) : query.in("status", ["AWAITING_IMAGE_UPLOAD", "READY_TO_DRAFT", "READY_TO_DRAFT_INCOMPLETE"]);
    const { data, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    return data ? fromRows(data as DbRow, await imagesFor(String(data.id))) : null;
  }

  static async saveProgress(previous: ArticleWorkflowRun, next: ArticleWorkflowRun): Promise<ArticleWorkflowRun> {
    const imageId = previous.image_plan[previous.current_index]?.image_id;
    const asset = imageId ? next.assets[imageId] : undefined;
    if (!imageId || !asset) throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: no uploaded asset to save");
    const supabase = getSupabaseAdmin();
    const { error: imageError } = await supabase.from("article_workflow_images").update({
      status: "UPLOADED", raw_url: asset.raw_url, width: asset.width, height: asset.height,
      mime_type: asset.mime_type, file_bytes: asset.file_bytes, sha256: asset.sha256,
      attempt_count: Math.max(previous.image_failures[imageId]?.attempt_count || 0, 1),
      failure_code: null, failure_reason: null, uploaded_at: new Date().toISOString(),
    }).eq("workflow_id", previous.id).eq("image_id", imageId).eq("status", "PENDING");
    if (imageError) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${imageError.message}`);
    let query = supabase.from("article_workflow_runs").update({
      status: next.status, media_status: next.media_status, current_index: next.current_index,
      article_package: next.article_package, last_error: null,
    }).eq("id", previous.id).eq("status", previous.status);
    if (previous.updated_at) query = query.eq("updated_at", previous.updated_at);
    const { data, error } = await query.select("*").maybeSingle();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: workflow was advanced by another request");
    await event(previous.id, "IMAGE_UPLOAD_SUCCEEDED", { raw_url: asset.raw_url }, imageId);
    if (next.status === "READY_TO_DRAFT") await event(previous.id, "MEDIA_COMPLETE");
    return fromRows(data as DbRow, await imagesFor(previous.id));
  }

  static async saveImageFailure(previous: ArticleWorkflowRun, next: ArticleWorkflowRun): Promise<ArticleWorkflowRun> {
    const imageId = previous.image_plan[previous.current_index]?.image_id;
    const failure = imageId ? next.image_failures[imageId] : undefined;
    if (!imageId || !failure) throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: no image failure to save");
    const missing = failure.status === "MISSING";
    const supabase = getSupabaseAdmin();
    const { error: imageError } = await supabase.from("article_workflow_images").update({
      status: missing ? "MISSING" : "PENDING", attempt_count: failure.attempt_count,
      max_attempts: failure.max_attempts, failure_code: failure.failure_code,
      failure_reason: failure.failure_reason, missing_at: missing ? new Date().toISOString() : null,
    }).eq("workflow_id", previous.id).eq("image_id", imageId).eq("status", "PENDING");
    if (imageError) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${imageError.message}`);
    const { data, error } = await supabase.from("article_workflow_runs").update({
      status: next.status, media_status: next.media_status, current_index: next.current_index,
      article_package: next.article_package, last_error: next.last_error,
    }).eq("id", previous.id).eq("status", previous.status).select("*").maybeSingle();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: workflow was advanced by another request");
    await event(previous.id, missing ? "IMAGE_MARKED_MISSING" : "IMAGE_ATTEMPT_FAILED", {
      attempt_count: failure.attempt_count, max_attempts: failure.max_attempts,
      failure_code: failure.failure_code, failure_reason: failure.failure_reason,
    }, imageId);
    if (next.status === "READY_TO_DRAFT_INCOMPLETE") await event(previous.id, "MEDIA_INCOMPLETE");
    return fromRows(data as DbRow, await imagesFor(previous.id));
  }

  static async complete(runId: string, draftResult: ArticleWorkflowJson): Promise<ArticleWorkflowRun> {
    const current = await this.getActive(runId);
    if (!current || !["READY_TO_DRAFT", "READY_TO_DRAFT_INCOMPLETE"].includes(current.status)) {
      throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: workflow is not ready to draft");
    }
    const draftPostId = String((draftResult.draft as ArticleWorkflowJson | undefined)?.id || draftResult.draft_id || "") || null;
    const { data, error } = await getSupabaseAdmin().from("article_workflow_runs").update({
      status: "COMPLETED", draft_result: draftResult, draft_post_id: draftPostId,
      last_error: null, completed_at: new Date().toISOString(),
    }).eq("id", runId).eq("status", current.status).select("*").maybeSingle();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: workflow is not ready to draft");
    await event(runId, "DRAFT_CREATED", { draft_post_id: draftPostId, media_status: current.media_status });
    return fromRows(data as DbRow, await imagesFor(runId));
  }

  static async rememberError(runId: string, message: string): Promise<void> {
    const { error } = await getSupabaseAdmin().from("article_workflow_runs")
      .update({ last_error: message.slice(0, 4000) }).eq("id", runId)
      .in("status", ["AWAITING_IMAGE_UPLOAD", "READY_TO_DRAFT", "READY_TO_DRAFT_INCOMPLETE"]);
    if (error) console.error("[ArticleWorkflowRepository] rememberError", error);
  }
}
