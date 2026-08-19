export const IMAGE_GENERATION_STANDARD = {
  version: "1.3",
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
    if_base64_too_large: "upload_github_image is ALLOWED (Hub writes quanpl86/imgBlog). Or pass source_url of the original, or generate_and_upload_blog_image. Do not compress.",
    github_upload: "ALWAYS ALLOWED via upload_github_image / upload_blog_image. Hub uses GITHUB_ASSET_TOKEN. ChatGPT GitHub connector to imgBlog is also allowed.",
  },
  lanes: {
    chat_direct: "PRIMARY for cover/illustration: create with ChatGPT Images in this chat (Plus, no API key). Then start_image_upload and HTTP POST original bytes to put_url. Never image_base64 through MCP — the connector truncates it.",
    hub_post: "Only if Hub has OPENAI_API_KEY or GEMINI_API_KEY. Flux is NOT used for covers/scenes — it returns ~1024×576 and fails QA. Default is ChatGPT Images in chat + start_image_upload.",
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
    short: 3,
    standard: 3,
    deep: "3-4",
    split: ["concept", "practice", "application"],
    min_inline: 3,
    cover: 1,
  },
  when_writing_article: {
    automatic: true,
    steps: [
      "Create images with ChatGPT Images ONE AT A TIME (parallel Images calls → ExceptionGroup/UNKNOWN).",
      "Cover first: 16:9, no text. Immediately start_image_upload and POST put_url.",
      "Then at least 3 distinct body illustrations, same upload path after each image.",
      "Do not call generate_and_upload_blog_image for covers/scenes unless Hub has OpenAI/Gemini. Flux is 1024×576 and will fail QA.",
      "Workflow/rubric/table: generate_and_upload_blog_image SVG with Vietnamese required_labels.",
      "create_blog_draft only after cover URL + ≥3 inline GitHub RAW URLs exist.",
    ],
  },
  agent_must: [
    "When writing any article: ChatGPT Images cover + at least 3 body images, uploaded via start_image_upload PUT path to GitHub. This is default, not optional.",
    "If the user wants the nicest cover/illustration: create with ChatGPT Images in this chat first, then start_image_upload and POST original PNG bytes. Never image_base64 on MCP. Never WebP 800x450.",
    "If MCP base64 is truncated: do not compress and do not use FLUX 1024×576. POST bytes to put_url.",
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
