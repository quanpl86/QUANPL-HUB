import { getSupabaseAdmin } from "../supabase.ts";
import {
  ARTICLE_WORKFLOW_VERSION,
  type ArticleWorkflowJson,
  type ArticleWorkflowRun,
  type ArticleWorkflowStatus,
} from "./article-workflow.ts";

const WORKFLOW_TYPE = "ARTICLE_WORKFLOW";

function fromRow(row: Record<string, unknown>): ArticleWorkflowRun {
  const payload = (row.payload || {}) as ArticleWorkflowJson;
  const storedStatus = payload.status as ArticleWorkflowStatus | undefined;
  return {
    id: String(row.id),
    workflow_version: ARTICLE_WORKFLOW_VERSION,
    topic: String(payload.topic || row.name || ""),
    idempotency_key: String(payload.idempotency_key || row.policy_hash || ""),
    status: row.status === "RETIRED" && storedStatus !== "COMPLETED"
      ? "CANCELLED"
      : (storedStatus || "AWAITING_IMAGE_UPLOAD"),
    current_index: Number(payload.current_index || 0),
    article_package: (payload.article_package || {}) as ArticleWorkflowJson,
    image_plan: (payload.image_plan || []) as ArticleWorkflowRun["image_plan"],
    assets: (payload.assets || {}) as ArticleWorkflowRun["assets"],
    draft_result: (payload.draft_result || null) as ArticleWorkflowJson | null,
    last_error: typeof payload.last_error === "string" ? payload.last_error : null,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

function payloadFor(run: ArticleWorkflowRun): ArticleWorkflowJson {
  return {
    workflow_version: ARTICLE_WORKFLOW_VERSION,
    topic: run.topic,
    idempotency_key: run.idempotency_key,
    status: run.status,
    current_index: run.current_index,
    article_package: run.article_package,
    image_plan: run.image_plan,
    assets: run.assets,
    draft_result: run.draft_result || null,
    last_error: run.last_error || null,
  };
}

export class ArticleWorkflowRepository {
  static async create(run: ArticleWorkflowRun): Promise<ArticleWorkflowRun> {
    const supabase = getSupabaseAdmin();
    const { data: replay, error: replayError } = await supabase
      .from("content_instructions")
      .select("*")
      .eq("instruction_type", WORKFLOW_TYPE)
      .eq("policy_hash", run.idempotency_key)
      .maybeSingle();
    if (replayError) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${replayError.message}`);
    if (replay) return fromRow(replay);

    const { error: cancelError } = await supabase
      .from("content_instructions")
      .update({ status: "RETIRED" })
      .eq("instruction_type", WORKFLOW_TYPE)
      .eq("status", "ACTIVE");
    if (cancelError) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${cancelError.message}`);

    const { data, error } = await supabase
      .from("content_instructions")
      .insert({
        id: run.id,
        name: `Article workflow: ${run.topic}`.slice(0, 240),
        description: "Internal resumable ChatGPT article state",
        content: ARTICLE_WORKFLOW_VERSION,
        is_default: false,
        instruction_type: WORKFLOW_TYPE,
        policy_version: ARTICLE_WORKFLOW_VERSION,
        policy_hash: run.idempotency_key,
        status: "ACTIVE",
        payload: payloadFor(run),
      })
      .select("*")
      .single();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    return fromRow(data);
  }

  static async getActive(runId?: string): Promise<ArticleWorkflowRun | null> {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("content_instructions")
      .select("*")
      .eq("instruction_type", WORKFLOW_TYPE);
    if (runId) {
      query = query.eq("id", runId);
    } else {
      query = query.eq("status", "ACTIVE");
    }
    const { data, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    return data ? fromRow(data) : null;
  }

  static async saveProgress(previous: ArticleWorkflowRun, next: ArticleWorkflowRun): Promise<ArticleWorkflowRun> {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("content_instructions")
      .update({ payload: payloadFor(next) })
      .eq("id", previous.id)
      .eq("instruction_type", WORKFLOW_TYPE)
      .eq("status", "ACTIVE");
    if (previous.updated_at) query = query.eq("updated_at", previous.updated_at);
    const { data, error } = await query.select("*").maybeSingle();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: workflow was advanced by another request");
    return fromRow(data);
  }

  static async complete(runId: string, draftResult: ArticleWorkflowJson): Promise<ArticleWorkflowRun> {
    const current = await this.getActive(runId);
    if (!current || current.status !== "READY_TO_DRAFT") {
      throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: workflow is not ready to draft");
    }
    const completed: ArticleWorkflowRun = {
      ...current,
      status: "COMPLETED",
      draft_result: draftResult,
      last_error: null,
    };
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content_instructions")
      .update({ status: "RETIRED", payload: payloadFor(completed) })
      .eq("id", runId)
      .eq("instruction_type", WORKFLOW_TYPE)
      .eq("status", "ACTIVE")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`ARTICLE_WORKFLOW_DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("ARTICLE_WORKFLOW_STATE_CONFLICT: workflow is not ready to draft");
    return fromRow(data);
  }

  static async rememberError(runId: string, message: string): Promise<void> {
    const current = await this.getActive(runId);
    if (!current || current.status === "COMPLETED" || current.status === "CANCELLED") return;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("content_instructions")
      .update({ payload: payloadFor({ ...current, last_error: message.slice(0, 4000) }) })
      .eq("id", runId)
      .eq("instruction_type", WORKFLOW_TYPE)
      .eq("status", "ACTIVE");
    if (error) console.error("[ArticleWorkflowRepository] rememberError", error);
  }
}
