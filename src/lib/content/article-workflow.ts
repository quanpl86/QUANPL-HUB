import { randomUUID } from "crypto";
import { ARTICLE_ASSET_HARD_RULE } from "./article-asset-rule.ts";

export const ARTICLE_WORKFLOW_VERSION = "article-workflow/1.0";
export const ARTICLE_WORKFLOW_SEQUENCE = ARTICLE_ASSET_HARD_RULE.sequence;
export type ArticleWorkflowJson = Record<string, unknown>;

export type ArticleWorkflowImageId = (typeof ARTICLE_WORKFLOW_SEQUENCE)[number];
export type ArticleWorkflowStatus =
  | "AWAITING_IMAGE_UPLOAD"
  | "READY_TO_DRAFT"
  | "COMPLETED"
  | "CANCELLED";

export type ArticleWorkflowImageSpec = {
  image_id: ArticleWorkflowImageId;
  purpose: "article_cover" | "editorial_illustration";
  prompt: string;
  alt: string;
  aspect: "16:9";
  filename?: string;
};

export type ArticleWorkflowAsset = {
  image_id: ArticleWorkflowImageId;
  raw_url: string;
  width: number;
  height: number;
  mime_type: string;
  file_bytes: number;
  sha256: string;
};

export type ArticleWorkflowRun = {
  id: string;
  workflow_version: typeof ARTICLE_WORKFLOW_VERSION;
  topic: string;
  idempotency_key: string;
  status: ArticleWorkflowStatus;
  current_index: number;
  article_package: ArticleWorkflowJson;
  image_plan: ArticleWorkflowImageSpec[];
  assets: Partial<Record<ArticleWorkflowImageId, ArticleWorkflowAsset>>;
  draft_result?: ArticleWorkflowJson | null;
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ArticleWorkflowNextAction =
  | ({ action: "GENERATE_IMAGE" } & ArticleWorkflowImageSpec)
  | { action: "CREATE_DRAFT"; run_id: string }
  | { action: "CANCELLED"; run_id: string }
  | { action: "COMPLETED"; run_id: string; draft_result: ArticleWorkflowJson | null };

function record(value: unknown): ArticleWorkflowJson | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as ArticleWorkflowJson
    : null;
}

function requiredText(value: unknown, field: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`ARTICLE_WORKFLOW_INVALID: ${field} is required`);
  return text;
}

export function buildArticleWorkflowImagePlan(articlePackage: unknown): ArticleWorkflowImageSpec[] {
  const pkg = record(articlePackage);
  if (!pkg) throw new Error("ARTICLE_WORKFLOW_INVALID: article_package must be an object");

  const cover = record(pkg.featured_image);
  if (!cover) throw new Error("ARTICLE_WORKFLOW_INVALID: featured_image is required");
  const inline = Array.isArray(pkg.inline_images) ? pkg.inline_images : [];
  const byId = new Map(inline.map((item) => {
    const image = record(item) || {};
    return [String(image.id || ""), image];
  }));

  const plan: ArticleWorkflowImageSpec[] = [{
    image_id: "cover",
    purpose: "article_cover",
    prompt: requiredText(cover.prompt, "featured_image.prompt"),
    alt: requiredText(cover.alt, "featured_image.alt"),
    aspect: "16:9",
    filename: typeof cover.suggested_filename === "string" ? cover.suggested_filename : undefined,
  }];

  for (const imageId of ARTICLE_ASSET_HARD_RULE.required_inline_ids) {
    const image = byId.get(imageId);
    if (!image) throw new Error(`ARTICLE_WORKFLOW_INVALID: inline_images must include ${imageId}`);
    plan.push({
      image_id: imageId,
      purpose: "editorial_illustration",
      prompt: requiredText(image.prompt, `inline_images.${imageId}.prompt`),
      alt: requiredText(image.alt, `inline_images.${imageId}.alt`),
      aspect: "16:9",
      filename: typeof image.suggested_filename === "string" ? image.suggested_filename : undefined,
    });
  }

  if (inline.length !== ARTICLE_ASSET_HARD_RULE.inline_exact) {
    throw new Error(`ARTICLE_WORKFLOW_INVALID: exactly ${ARTICLE_ASSET_HARD_RULE.inline_exact} inline images are required`);
  }
  return plan;
}

export function createArticleWorkflowRun(input: {
  topic: string;
  article_package: ArticleWorkflowJson;
}): ArticleWorkflowRun {
  const topic = requiredText(input.topic, "topic");
  const idempotencyKey = requiredText(input.article_package?.idempotency_key, "article_package.idempotency_key");
  return {
    id: randomUUID(),
    workflow_version: ARTICLE_WORKFLOW_VERSION,
    topic,
    idempotency_key: idempotencyKey,
    status: "AWAITING_IMAGE_UPLOAD",
    current_index: 0,
    article_package: structuredClone(input.article_package),
    image_plan: buildArticleWorkflowImagePlan(input.article_package),
    assets: {},
    draft_result: null,
    last_error: null,
  };
}

export function getArticleWorkflowNextAction(run: ArticleWorkflowRun): ArticleWorkflowNextAction {
  if (run.status === "COMPLETED") {
    return { action: "COMPLETED", run_id: run.id, draft_result: run.draft_result || null };
  }
  if (run.status === "CANCELLED") {
    return { action: "CANCELLED", run_id: run.id };
  }
  if (run.status === "READY_TO_DRAFT" || run.current_index >= run.image_plan.length) {
    return { action: "CREATE_DRAFT", run_id: run.id };
  }
  const spec = run.image_plan[run.current_index];
  if (!spec) throw new Error("ARTICLE_WORKFLOW_INVALID: missing image plan step");
  return { action: "GENERATE_IMAGE", ...spec };
}

export function applyArticleWorkflowAsset(
  run: ArticleWorkflowRun,
  asset: ArticleWorkflowAsset
): ArticleWorkflowRun {
  if (run.status !== "AWAITING_IMAGE_UPLOAD") {
    throw new Error(`ARTICLE_WORKFLOW_STATE_CONFLICT: cannot upload while ${run.status}`);
  }
  const expected = run.image_plan[run.current_index];
  if (!expected || expected.image_id !== asset.image_id) {
    throw new Error(`ARTICLE_WORKFLOW_STATE_CONFLICT: expected ${expected?.image_id || "draft"}, received ${asset.image_id}`);
  }

  const articlePackage = structuredClone(run.article_package);
  if (asset.image_id === "cover") {
    articlePackage.featured_image = { ...(record(articlePackage.featured_image) || {}), url: asset.raw_url };
    articlePackage.featured_image_url = asset.raw_url;
  } else {
    const inlineImages = Array.isArray(articlePackage.inline_images) ? articlePackage.inline_images : [];
    articlePackage.inline_images = inlineImages.map((value) => {
      const image = record(value) || {};
      return image.id === asset.image_id ? { ...image, url: asset.raw_url } : image;
    });
  }

  const nextIndex = run.current_index + 1;
  return {
    ...run,
    current_index: nextIndex,
    status: nextIndex === run.image_plan.length ? "READY_TO_DRAFT" : "AWAITING_IMAGE_UPLOAD",
    article_package: articlePackage,
    assets: { ...run.assets, [asset.image_id]: asset },
    last_error: null,
  };
}

export const ARTICLE_WORKFLOW_INSTRUCTIONS = [
  "ARTICLE_WORKFLOW_V1.",
  "When the user asks to write an article, research and prepare the complete Article Package, call start_article_workflow, then immediately generate the returned cover as the final action.",
  "When the user says Tiếp tục, Tiếp tục nhé, Làm tiếp, or equivalent, call continue_article_workflow with the native image file from the previous assistant response; never ask for technical IDs.",
  "After each upload, generate the returned next image as the final action. After img-03, continue_article_workflow creates the draft automatically.",
  "Never parallelize images. Never use base64 or start_image_upload from ChatGPT.",
].join(" ");
