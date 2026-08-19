export const IMAGE_GENERATION_STANDARD = {
  version: "1.2",
  rule: "ChatGPT decides WHAT image is needed. MCP Image Router decides WHICH engine. QA decides IF it may enter the draft. OpenAI / ChatGPT Images is PRIMARY for scenes. SVG is PRIMARY for exact Vietnamese structured text. Never compress/downscale to fit a tool call.",
  quality: {
    cover_min: "1536x864",
    inline_min: "1280x720",
    prefer: "original PNG, Hub stores bytes as-is",
    forbidden: [
      "resize to 800x450 or similar to shrink base64",
      "convert to small WebP/JPEG as a payload trick",
      "upscale a tiny compressed file to pass resolution",
    ],
    if_base64_too_large: "pass source_url of the ORIGINAL full-resolution HTTPS file, or call generate_and_upload_blog_image so Hub creates a PNG. Do not compress.",
  },
  lanes: {
    chat_direct: "PRIMARY for cover/illustration: create with ChatGPT Images in this chat (Plus, no API key). Then upload_blog_image with source_url of the original or uncompressed image_base64. MCP does not generate those pixels and does not recompress.",
    hub_post: "Only if the user insists Hub generate without an in-chat image, OR if original pixels cannot be sent without compressing: generate_and_upload_blog_image. Engine OpenAI API→Gemini→Flux→Stability (API billed, not Plus). Do not pick FLUX yourself.",
  },
  primary: {
    scene: "chatgpt_images_then_upload_blog_image",
    structured_text: "svg",
    server_fallback: ["openai", "gemini", "flux", "stability"],
  },
  routing: {
    article_cover: { engine: "ai_router", text_policy: "no_text", aspect: "16:9" },
    editorial_illustration: { engine: "ai_router", text_policy: "no_text" },
    concept_diagram: { engine: "ai_router", text_policy: "no_text" },
    case_study: { engine: "ai_router", text_policy: "no_text" },
    explainer: { engine: "svg_if_labels_else_ai", text_policy: "exact_text_if_labels" },
    workflow: { engine: "svg", text_policy: "exact_text" },
    comparison: { engine: "svg", text_policy: "exact_text" },
    rubric: { engine: "svg", text_policy: "exact_text" },
    timeline: { engine: "svg", text_policy: "exact_text" },
    table: { engine: "svg", text_policy: "exact_text" },
    framework: { engine: "svg", text_policy: "exact_text" },
  },
  ai_provider_priority: ["openai", "gemini", "flux", "stability"],
  retry: {
    on_429: "immediate_fallback_next_provider",
    max_retry_per_provider: 1,
    retry_same_provider_only_for: ["502", "503", "timeout"],
  },
  body_plan: {
    short: 2,
    standard: 3,
    deep: "3-5",
    split: ["concept", "practice", "application"],
  },
  agent_must: [
    "If the user wants the nicest cover/illustration: create with ChatGPT Images in this chat first, then upload the ORIGINAL pixels (source_url preferred). Never WebP 800x450.",
    "If base64 would be truncated: do not compress. Use source_url of the original, or generate_and_upload_blog_image (Hub PNG).",
    "If the user wants Hub to generate for the post: call generate_and_upload_blog_image and let MCP pick OpenAI first. Do not choose FLUX.",
    "Cover: 16:9, no text.",
    "Body illustrations: 2–4 distinct scenes, not 3 similar clipboard shots.",
    "Workflow/rubric/table/timeline: required_labels exact Vietnamese + layout_spec. SVG only — never an image model.",
    "Explainer with a few short labels may use OpenAI if text_policy=optional_text; long exact matrices stay SVG.",
    "On fix_cover / fix_inline_images: new URLs only, then update_blog_draft.",
    "Do not update_blog_draft until generate returns qa_gates PASS.",
  ],
};

export const SVG_IMAGE_PURPOSES = [
  "workflow",
  "comparison",
  "explainer",
  "rubric",
  "timeline",
  "table",
  "framework",
] as const;

export type TextPolicy = "no_text" | "exact_text" | "optional_text";

export function resolveTextPolicy(input: {
  purpose: string;
  text_policy?: string | null;
  required_labels?: string[];
}): TextPolicy {
  if (input.text_policy === "no_text" || input.text_policy === "exact_text" || input.text_policy === "optional_text") {
    return input.text_policy;
  }
  const labels = input.required_labels?.filter((item) => item.trim()) || [];
  if (SVG_IMAGE_PURPOSES.includes(input.purpose as (typeof SVG_IMAGE_PURPOSES)[number]) && labels.length) {
    return "exact_text";
  }
  if (input.purpose === "article_cover" || input.purpose === "editorial_illustration") return "no_text";
  return labels.length ? "exact_text" : "no_text";
}

export function isTransientImageError(message: string): boolean {
  return /502|503|timeout|ETIMEDOUT|ECONNRESET/i.test(message);
}

export function isRateLimitImageError(message: string): boolean {
  return /\b429\b/.test(message);
}
