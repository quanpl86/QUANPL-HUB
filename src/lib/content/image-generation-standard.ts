import { getCoverPromptContract } from "./cover-prompt-standard.ts";

export const IMAGE_GENERATION_STANDARD = {
  version: "3.0",
  hard_rule: true,
  no_openai_api_key: true,
  rule: "HARD. Lane A1 ChatGPT scenes: ChatGPT Images → native file attachment → upload_generated_image_file → GitHub RAW. Lane A2 external clients only: start_image_upload → HTTP POST PNG bytes. Lane B structured Vietnamese text: generate_and_upload_blog_image SVG. Never Hub OpenAI Images API, MCP image_base64, or FLUX.",
  quality: {
    cover_min: "1536x864",
    inline_min: "1280x720",
    prefer: "original PNG, Hub stores bytes as-is",
    forbidden: [
      "MCP image_base64 of ChatGPT Images",
      "KingDragonHub OpenAI Images API",
      "FLUX / 1024×576 covers",
      "resize or WebP to shrink payload",
      "upscale a tiny file to pass QA",
    ],
  },
  lanes: {
    A_scene: "HARD for cover / editorial_illustration / concept_diagram / case_study: ChatGPT Images in current chat, one at a time, then upload_generated_image_file.",
    B_svg: "HARD for workflow / rubric / timeline / table / comparison / framework with exact Vietnamese labels: generate_and_upload_blog_image SVG only.",
  },
  primary: {
    scene: "chatgpt_images_in_chat_then_native_file_param",
    structured_text: "svg",
    server_fallback: [],
  },
  external_client: {
    scene: "start_image_upload_then_http_post_binary",
  },
  routing: {
    article_cover: { engine: "chatgpt_images_in_chat", text_policy: "no_text", aspect: "16:9" },
    editorial_illustration: { engine: "chatgpt_images_in_chat", text_policy: "no_text" },
    concept_diagram: { engine: "chatgpt_images_in_chat", text_policy: "no_text" },
    case_study: { engine: "chatgpt_images_in_chat", text_policy: "no_text" },
    explainer: { engine: "svg_if_labels_else_chat", text_policy: "exact_text_if_labels" },
    workflow: { engine: "svg", text_policy: "exact_text" },
    comparison: { engine: "svg", text_policy: "exact_text" },
    rubric: { engine: "svg", text_policy: "exact_text" },
    timeline: { engine: "svg", text_policy: "exact_text" },
    table: { engine: "svg", text_policy: "exact_text" },
    framework: { engine: "svg", text_policy: "exact_text" },
  },
  cover_prompt_standard: getCoverPromptContract(),
  sequence: ["cover", "img-01", "img-02", "img-03"],
  body_plan: {
    short: 3,
    standard: 3,
    deep: 3,
    split: ["concept", "practice", "application"],
    inline_exact: 3,
    cover_exact: 1,
  },
  when_writing_article: {
    automatic: true,
    hard_rule: true,
    resumable: true,
    one_user_message: false,
    steps: [
      "Research and prepare Article Package v7, call start_article_workflow, then generate the returned cover as the final action.",
      "On each user 'Tiếp tục', call continue_article_workflow with the previous native image file.",
      "Generate each returned next image as the final action; sequence cover, img-01, img-02, img-03.",
      "After img-03, continue_article_workflow creates the draft automatically.",
    ],
  },
  agent_must: [
    "AUTOMATION: the initial user sentence starts research, article preparation, durable state, and cover generation.",
    "HARD: scene pixels from ChatGPT Images in this chat. No Hub OpenAI API key.",
    "HARD: on 'Tiếp tục', pass the previous native file to continue_article_workflow. ChatGPT must not call start_image_upload.",
    "HARD: generate_and_upload_blog_image is SVG-only. Never for article_cover.",
    "ChatGPT Images is native in-chat, not an MCP tool. Image generation may end a response, so resume from durable server state.",
    "Do not create or update a draft until cover + ≥3 body GitHub RAW URLs exist.",
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
