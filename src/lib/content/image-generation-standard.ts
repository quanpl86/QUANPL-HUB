export const IMAGE_GENERATION_STANDARD = {
  version: "1.0",
  rule: "ChatGPT decides WHAT image is needed. MCP Image Router decides WHICH engine. QA decides IF it may enter the draft.",
  lanes: {
    chat_direct: "User asks to create images in ChatGPT first. Optional later: generate_and_upload_blog_image source_url.",
    hub_post: "User asks to create images for the post. Call generate_and_upload_blog_image. Do not pick FLUX yourself.",
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
    "Describe the asset. Do not choose FLUX/OpenAI/Gemini yourself.",
    "Cover: 16:9, no text.",
    "Body illustrations: 2–4 distinct scenes, not 3 similar clipboard shots.",
    "Workflow/rubric/table: required_labels exact Vietnamese + layout_spec. SVG renders them unchanged.",
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
