import { createHash, randomBytes } from "crypto";
import {
  assertInfographicContract,
  renderInfographicSvg,
  shouldRenderInfographic,
  type InfographicLayout,
} from "./blog-infographic.ts";
import { assertCompleteRaster, assertImageQa, sniffImage } from "./image-qa.ts";
import { isRateLimitImageError, isTransientImageError, resolveTextPolicy } from "./image-generation-standard.ts";

export function flattenImageError(error: unknown): string {
  if (error instanceof Error) {
    const grouped = (error as Error & { errors?: unknown[] }).errors;
    if (Array.isArray(grouped) && grouped.length) {
      return `${error.name}: ${grouped.map((item) => (item instanceof Error ? item.message : String(item))).join(" | ")}`;
    }
    return error.message;
  }
  return String(error);
}

export const UNSAFE_IMAGE_PROMPT_PATTERNS = [
  /(?<!no )(?<!not )photorealistic (child|children|kid|kids|toddler|preschooler|minor)/i,
  /photo of a (girl|boy) aged/i,
  /real (child|children|student) face/i,
  /nude|nsfw|sexual/i,
];

const ASPECT_SIZE: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "4:3": { width: 1600, height: 1200 },
  "1:1": { width: 1280, height: 1280 },
};

export function assertSafeImagePrompt(prompt: string): void {
  const hit = UNSAFE_IMAGE_PROMPT_PATTERNS.find((pattern) => pattern.test(prompt));
  if (hit) {
    throw new Error("QUALITY_GATE_FAILED: IMAGE_PROMPT_UNSAFE: preschool/child imagery must be illustration-only; no photorealistic minors");
  }
}

export function slugAssetPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "asset";
}

export function buildIdempotentAssetPath(
  idempotencyKey: string,
  imageId: string,
  filename?: string
): string {
  const basePath = (process.env.GITHUB_ASSET_PATH || "public/editor-assets").replace(/\/$/, "");
  const name = slugAssetPart(filename || imageId);
  return `${basePath}/v7/${slugAssetPart(idempotencyKey)}/${name}.png`;
}

export function githubAssetRepo(): string {
  return process.env.GITHUB_ASSET_REPO || "quanpl86/imgBlog";
}

export function githubAssetBasePath(): string {
  return (process.env.GITHUB_ASSET_PATH || "public/editor-assets").replace(/\/$/, "");
}

export function assertGithubAssetPath(filePath: string): string {
  const base = githubAssetBasePath();
  const cleaned = filePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!cleaned || cleaned.includes("..")) {
    throw new Error("GITHUB_PATH_DENIED: path traversal is not allowed");
  }
  if (cleaned !== base && !cleaned.startsWith(`${base}/`)) {
    throw new Error(`GITHUB_PATH_DENIED: ChatGPT may only write under ${base}/`);
  }
  return cleaned;
}

export function buildVersionedAssetPath(
  idempotencyKey: string,
  imageId: string,
  ext: string,
  filename?: string
): string {
  const basePath = githubAssetBasePath();
  const name = slugAssetPart(filename || imageId);
  const revision = randomBytes(4).toString("hex");
  return `${basePath}/v7/${slugAssetPart(idempotencyKey)}/${name}-${revision}.${ext}`;
}

function withEditorialSuffix(prompt: string, purpose: string, extraLabels?: string[]): string {
  const base = prompt.trim();
  const labels = (extraLabels || []).map((item) => item.trim()).filter(Boolean);
  const labelBlock = labels.length
    ? ` If any text appears, it MUST be exactly these Vietnamese strings and nothing else: ${labels.map((item) => `"${item}"`).join("; ")}.`
    : "";
  if (purpose === "article_cover" || !labels.length) {
    return `${base}, sharp high-resolution educational editorial illustration, crisp edges, no photorealistic children, no readable text, no watermark, no gibberish letters`;
  }
  return `${base}, sharp high-resolution educational editorial illustration, crisp detail, no photorealistic children, no watermark, no gibberish fake text.${labelBlock}`;
}

export function openaiImageSize(aspect?: string): "1536x1024" | "1024x1024" | "1024x1536" {
  if (aspect === "1:1") return "1024x1024";
  if (aspect === "9:16") return "1024x1536";
  return "1536x1024";
}

export type SceneGenerator = "openai" | "gemini" | "flux" | "stability";

export function imageGeneratorChain(env: NodeJS.ProcessEnv = process.env): SceneGenerator[] {
  const forced = (env.BLOG_IMAGE_PROVIDER || "auto").toLowerCase();
  const available: SceneGenerator[] = [];
  if (env.OPENAI_API_KEY) available.push("openai");
  if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) available.push("gemini");
  if (env.STABILITY_API_KEY) available.push("stability");
  // Pollinations Flux caps ~1024×576 for 16:9 — below cover/inline QA. Opt-in only.
  if (env.BLOG_IMAGE_ALLOW_FLUX === "true" || forced === "flux") available.push("flux");
  if (forced === "openai" || forced === "gemini" || forced === "flux" || forced === "stability") {
    return [forced, ...available.filter((item) => item !== forced)];
  }
  return available;
}

export function preferredImageGenerator(): SceneGenerator {
  return imageGeneratorChain()[0] || "flux";
}

async function fetchOpenAiImage(prompt: string, aspect: string, purpose: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("IMAGE_GENERATE_FAILED: missing OPENAI_API_KEY");
  const preferred = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
  const models = [...new Set([preferred, "gpt-image-1"])];
  let lastError = "IMAGE_GENERATE_FAILED: openai";
  for (const model of models) {
    const body = {
      model,
      prompt: withEditorialSuffix(prompt, purpose),
      n: 1,
      size: openaiImageSize(aspect),
      quality: "high",
      output_format: "png",
    };
    const run = async () => {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000),
      });
      if (response.status === 429) {
        throw new Error("IMAGE_GENERATE_FAILED: 429 openai rate limit");
      }
      const json = await response.json() as {
        error?: { message?: string };
        data?: Array<{ b64_json?: string; url?: string }>;
      };
      if (!response.ok) {
        throw new Error(`IMAGE_GENERATE_FAILED: openai ${response.status} ${json.error?.message || ""}`.trim());
      }
      const item = json.data?.[0];
      if (item?.b64_json) {
        return { bytes: Buffer.from(item.b64_json, "base64"), mimeType: "image/png" as const };
      }
      if (item?.url) {
        const download = await fetch(item.url, { signal: AbortSignal.timeout(30000) });
        if (!download.ok) throw new Error(`IMAGE_GENERATE_FAILED: openai image download ${download.status}`);
        return {
          bytes: Buffer.from(await download.arrayBuffer()),
          mimeType: download.headers.get("content-type") || "image/png",
        };
      }
      throw new Error("IMAGE_GENERATE_FAILED: openai returned no image");
    };
    try {
      return await run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = message;
      if (isRateLimitImageError(message)) throw error;
      if (isTransientImageError(message)) {
        try {
          return await run();
        } catch (retryError) {
          lastError = retryError instanceof Error ? retryError.message : String(retryError);
        }
      }
    }
  }
  throw new Error(lastError);
}

function geminiAspect(aspect?: string): string {
  if (aspect === "1:1" || aspect === "4:3" || aspect === "16:9" || aspect === "9:16" || aspect === "3:4") return aspect;
  return "16:9";
}

async function fetchGeminiImage(prompt: string, aspect: string, purpose: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("IMAGE_GENERATE_FAILED: missing GEMINI_API_KEY");
  const model = process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-generate-001";
  let response: Response;
  try {
    response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: withEditorialSuffix(prompt, purpose) }],
        parameters: { sampleCount: 1, aspectRatio: geminiAspect(aspect) },
      }),
      signal: AbortSignal.timeout(90000),
    }
  );
  } catch (error) {
    throw new Error(`IMAGE_GENERATE_FAILED: gemini ${flattenImageError(error)}`);
  }
  const json = await response.json() as {
    error?: { message?: string };
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };
  if (response.status === 429) throw new Error("IMAGE_GENERATE_FAILED: 429 gemini rate limit");
  if (!response.ok) {
    throw new Error(`IMAGE_GENERATE_FAILED: gemini ${response.status} ${json.error?.message || ""}`.trim());
  }
  const b64 = json.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("IMAGE_GENERATE_FAILED: gemini returned no image");
  return { bytes: Buffer.from(b64, "base64"), mimeType: json.predictions?.[0]?.mimeType || "image/png" };
}

async function fetchStabilityImage(prompt: string, aspect: string, purpose: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const key = process.env.STABILITY_API_KEY;
  if (!key) throw new Error("IMAGE_GENERATE_FAILED: missing STABILITY_API_KEY");
  const form = new FormData();
  form.set("prompt", withEditorialSuffix(prompt, purpose));
  form.set("output_format", "png");
  form.set("aspect_ratio", geminiAspect(aspect));
  const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, Accept: "image/*" },
    body: form,
    signal: AbortSignal.timeout(90000),
  });
  if (response.status === 429) throw new Error("IMAGE_GENERATE_FAILED: 429 stability rate limit");
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`IMAGE_GENERATE_FAILED: stability ${response.status} ${text.slice(0, 200)}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error("IMAGE_GENERATE_FAILED: stability empty image");
  return { bytes, mimeType: response.headers.get("content-type") || "image/png" };
}

async function fetchFluxImage(prompt: string, aspect: string, purpose: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const size = ASPECT_SIZE[aspect] || ASPECT_SIZE["16:9"];
  const encoded = encodeURIComponent(withEditorialSuffix(prompt, purpose));
  const query = `width=${size.width}&height=${size.height}&model=flux&nologo=true`;
  const urls = [
    `https://image.pollinations.ai/prompt/${encoded}?${query}`,
    `https://gen.pollinations.ai/image/${encoded}?${query}`,
  ];
  const run = async (url: string) => {
    const response = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(45000),
    });
    if (response.status === 429) throw new Error("IMAGE_GENERATE_FAILED: 429 flux rate limit");
    if (!response.ok) throw new Error(`IMAGE_GENERATE_FAILED: flux ${response.status}`);
    const mimeType = response.headers.get("content-type") || "image/png";
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1000) throw new Error("IMAGE_GENERATE_FAILED: empty or invalid image bytes");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("IMAGE_GENERATE_FAILED: image exceeds 10MB");
    return { bytes, mimeType };
  };
  let lastError = "IMAGE_GENERATE_FAILED: flux";
  for (const url of urls) {
    try {
      return await run(url);
    } catch (error) {
      const message = flattenImageError(error);
      lastError = message.startsWith("IMAGE_GENERATE_FAILED") ? message : `IMAGE_GENERATE_FAILED: flux ${message}`;
      if (isRateLimitImageError(message)) throw new Error(lastError);
    }
  }
  throw new Error(lastError);
}

export type ProviderAttempt = { provider: string; result: string };

async function fetchGeneratedImage(
  prompt: string,
  aspect: string,
  purpose: string
): Promise<{ bytes: Buffer; generator: SceneGenerator; attempts: ProviderAttempt[] }> {
  const chain = imageGeneratorChain();
  if (!chain.length) {
    throw new Error(
      "IMAGE_GENERATE_FAILED: NO_HQ_PROVIDER. Hub has no OpenAI/Gemini/Stability key, and Flux cannot meet ≥1536×864. Create the image with ChatGPT Images in this chat (one at a time), then start_image_upload and POST the original PNG to put_url. Do not upscale Flux 1024×576."
    );
  }
  const attempts: ProviderAttempt[] = [];
  for (const generator of chain) {
    try {
      let bytes: Buffer;
      if (generator === "openai") bytes = (await fetchOpenAiImage(prompt, aspect, purpose)).bytes;
      else if (generator === "gemini") bytes = (await fetchGeminiImage(prompt, aspect, purpose)).bytes;
      else if (generator === "stability") bytes = (await fetchStabilityImage(prompt, aspect, purpose)).bytes;
      else bytes = (await fetchFluxImage(prompt, aspect, purpose)).bytes;
      attempts.push({ provider: generator, result: "success" });
      return { bytes, generator, attempts };
    } catch (error) {
      const message = flattenImageError(error);
      const result = isRateLimitImageError(message) ? "429" : message.replace(/^IMAGE_GENERATE_FAILED:\s*/, "").slice(0, 80);
      attempts.push({ provider: generator, result });
      console.error(`[blog-image] ${generator} failed, trying next:`, message);
    }
  }
  throw new Error(`ALL_IMAGE_PROVIDERS_FAILED: ${JSON.stringify(attempts)}`);
}

export function decodeImageBase64(raw: string): Buffer {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("IMAGE_UPLOAD_FAILED: image_base64 is empty");
  const dataUrl = /^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/.exec(trimmed);
  const b64 = (dataUrl ? dataUrl[1] : trimmed).replace(/\s/g, "");
  const bytes = Buffer.from(b64, "base64");
  if (bytes.length < 32) {
    throw new Error(
      "IMAGE_UPLOAD_FAILED: BASE64_TRUNCATED. ChatGPT MCP cuts large image_base64 before Hub. Do NOT compress/resize. Call start_image_upload then HTTP POST original PNG bytes to put_url."
    );
  }
  if (bytes.length > 10 * 1024 * 1024) throw new Error("IMAGE_UPLOAD_FAILED: image_base64 exceeds 10MB");
  try {
    assertCompleteRaster(bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("BASE64_TRUNCATED") || message.includes("IMAGE_FORMAT_UNKNOWN")) {
      throw new Error(
        "IMAGE_UPLOAD_FAILED: BASE64_TRUNCATED. ChatGPT MCP cuts large image_base64 before Hub. Do NOT compress/resize. Call start_image_upload then HTTP POST original PNG bytes to put_url."
      );
    }
    throw error;
  }
  return bytes;
}

async function fetchSourceImage(url: string): Promise<{ bytes: Buffer; generator: "upload" }> {
  if (!/^https:\/\//i.test(url)) throw new Error("IMAGE_UPLOAD_FAILED: source_url must be https");
  const response = await fetch(url, {
    headers: {
      Accept: "image/*,*/*",
      "User-Agent": "Mozilla/5.0 KingDragonHub-MCP",
      Referer: "https://chatgpt.com/",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(
      `IMAGE_UPLOAD_FAILED: source_url ${response.status}. If this is a ChatGPT file URL, call start_image_upload and POST the original PNG bytes instead.`
    );
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error("IMAGE_UPLOAD_FAILED: source_url empty");
  if (bytes.length > 10 * 1024 * 1024) throw new Error("IMAGE_UPLOAD_FAILED: source_url exceeds 10MB");
  assertCompleteRaster(bytes);
  return { bytes, generator: "upload" };
}

async function upsertGithubFile(
  filePath: string,
  bytes: Buffer,
  message: string
): Promise<{ url: string; path: string; provider: "github" }> {
  const token = process.env.GITHUB_ASSET_TOKEN;
  const repo = githubAssetRepo();
  const branch = process.env.GITHUB_ASSET_BRANCH || "main";
  if (!token) {
    throw new Error("IMAGE_UPLOAD_FAILED: missing GITHUB_ASSET_TOKEN");
  }

  const endpoint = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  let sha: string | undefined;
  const existing = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers });
  if (existing.ok) {
    const body = await existing.json() as { sha?: string };
    sha = body.sha;
  }

  const put = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content: bytes.toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!put.ok) {
    throw new Error(`IMAGE_UPLOAD_FAILED: ${await put.text()}`);
  }

  return {
    url: `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`,
    path: filePath,
    provider: "github",
  };
}

export type BlogImageGenerateInput = {
  idempotency_key: string;
  image_id: string;
  purpose: string;
  prompt?: string;
  alt: string;
  aspect?: string;
  filename?: string;
  visual_goal?: string;
  must_show?: string[];
  required_labels?: string[];
  required_values?: string[];
  layout_spec?: InfographicLayout;
  must_not_show?: string[];
  text_language?: string;
  text_accuracy_required?: boolean;
  visual_style?: string;
  source_url?: string;
  image_base64?: string;
  image_bytes?: Buffer;
  article_key?: string;
  text_policy?: "no_text" | "exact_text" | "optional_text";
  provider?: "auto" | SceneGenerator;
  fallback?: boolean;
  qa_required?: boolean;
};

export async function generateAndUploadBlogImage(input: BlogImageGenerateInput) {
  if (!input.alt.trim()) {
    throw new Error("QUALITY_GATE_FAILED: COVER_ALT_MISSING");
  }
  if (input.prompt) assertSafeImagePrompt(input.prompt);
  if (!input.source_url && !input.image_base64 && !input.image_bytes) assertInfographicContract(input);

  const aspect = input.aspect || (input.purpose === "article_cover" ? "16:9" : "4:3");
  const requested = ASPECT_SIZE[aspect] || ASPECT_SIZE["16:9"];
  const textPolicy = resolveTextPolicy(input);
  const uploadedFromChat = Boolean(input.source_url || input.image_base64 || input.image_bytes);
  const infographic = !uploadedFromChat && (textPolicy === "exact_text" || shouldRenderInfographic({ ...input, text_policy: textPolicy }));
  const generatePrompt = input.prompt?.trim() ?? "";
  if (!uploadedFromChat && !infographic) {
    throw new Error(
      "IMAGE_GENERATE_FAILED: SCENE_MUST_BE_CHATGPT_IMAGES. Create the image with ChatGPT Images in this chat, then upload_generated_image_file. Do not call generate_and_upload_blog_image for article_cover."
    );
  }
  const kind = infographic ? "infographic" : input.purpose === "article_cover" ? "cover" : "inline";
  const filename = input.filename
    || (input.article_key ? `${slugAssetPart(input.article_key)}-${slugAssetPart(input.purpose)}-${slugAssetPart(input.image_id)}` : undefined);

  let bytes: Buffer;
  let renderer: "svg" | SceneGenerator | "upload" = "flux";
  let attempts: ProviderAttempt[] = [];
  if (input.image_bytes) {
    assertCompleteRaster(input.image_bytes);
    bytes = input.image_bytes;
    renderer = "upload";
    attempts = [{ provider: "chatgpt_images", result: "success" }];
  } else if (input.image_base64) {
    bytes = decodeImageBase64(input.image_base64);
    renderer = "upload";
    attempts = [{ provider: "chatgpt_images", result: "success" }];
  } else if (input.source_url) {
    const uploadedSource = await fetchSourceImage(input.source_url);
    bytes = uploadedSource.bytes;
    renderer = "upload";
    attempts = [{ provider: "chatgpt_images", result: "success" }];
  } else if (infographic) {
    const layout = input.layout_spec || (
      input.purpose === "rubric" || input.purpose === "table"
        ? { type: "rubric_matrix" as const }
        : input.purpose === "comparison"
          ? { type: "comparison" as const }
          : { type: "workflow_steps" as const }
    );
    bytes = renderInfographicSvg({
      visual_goal: input.visual_goal || input.alt,
      required_labels: input.required_labels,
      must_show: input.must_show,
      layout,
      text_language: input.text_language || "vi",
    });
    renderer = "svg";
    attempts = [{ provider: "svg", result: "success" }];
  } else {
    const generated = await fetchGeneratedImage(generatePrompt, aspect, input.purpose);
    bytes = generated.bytes;
    renderer = generated.generator;
    attempts = generated.attempts;
  }

  let sniff = sniffImage(bytes);
  let qaGates: string[] = [];
  try {
    qaGates = assertImageQa(bytes, sniff, kind);
  } catch (error) {
    if (renderer === "svg" || renderer === "upload") throw error;
    const retry = await fetchGeneratedImage(`${generatePrompt}, ultra sharp, high definition`, aspect, input.purpose);
    bytes = retry.bytes;
    renderer = retry.generator;
    attempts = [...attempts, ...retry.attempts];
    sniff = sniffImage(bytes);
    qaGates = assertImageQa(bytes, sniff, kind);
  }

  const filePath = buildVersionedAssetPath(input.idempotency_key, input.image_id, sniff.ext, filename);
  const uploaded = await upsertGithubFile(
    filePath,
    bytes,
    `Add editorial image ${input.image_id} (${input.purpose}, ${sniff.ext})`
  );

  const gates = [...qaGates, "IMAGE_ASPECT_RATIO_PASS"];
  if (textPolicy === "no_text") gates.push("IMAGE_NO_TEXT_PASS");
  if (infographic) {
    gates.push("IMAGE_TEXT_MATCH_PASS", "IMAGE_LANGUAGE_VI_PASS", "IMAGE_LAYOUT_PASS", "IMAGE_CONTENT_MATCH_PASS");
  }

  return {
    status: "PASS",
    image_id: input.image_id,
    purpose: input.purpose,
    alt: input.alt.trim(),
    url: uploaded.url,
    width: sniff.width || requested.width,
    height: sniff.height || requested.height,
    mime_type: sniff.mime,
    file_bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    raw_url: uploaded.url,
    stored_as_received: true,
    path: uploaded.path,
    provider: uploaded.provider,
    renderer,
    generator: renderer,
    text_policy: textPolicy,
    provider_attempts: attempts,
    fallback_count: Math.max(0, attempts.filter((item) => item.result !== "success").length),
    qa_gates: gates,
  };
}

export async function uploadBlogImage(input: BlogImageGenerateInput) {
  if (!input.image_base64 && !input.source_url && !input.image_bytes) {
    throw new Error("IMAGE_UPLOAD_FAILED: image_base64, image_bytes, or source_url is required. Create the image in ChatGPT first, then upload_generated_image_file.");
  }
  return generateAndUploadBlogImage({
    ...input,
    prompt: input.prompt || "Uploaded from ChatGPT Images",
  });
}

export type ChatGptFileParam = {
  download_url: string;
  file_id: string;
  mime_type?: string;
  file_name?: string;
};

export async function uploadGeneratedImageFile(
  input: BlogImageGenerateInput & {
    file?: string | ChatGptFileParam;
    file_url?: string;
  }
) {
  const attached = input.file;
  const fromString = typeof attached === "string" && attached.trim() ? decodeImageBase64(attached) : undefined;
  const fromChatGptUrl = attached && typeof attached === "object" ? attached.download_url : undefined;
  return uploadBlogImage({
    ...input,
    image_bytes: input.image_bytes || fromString,
    source_url: fromChatGptUrl || input.file_url || input.source_url,
    prompt: input.prompt || "Uploaded from ChatGPT Images",
  });
}

export async function uploadGithubImage(input: {
  image_base64?: string;
  source_url?: string;
  filename?: string;
  idempotency_key?: string;
  image_id?: string;
  alt?: string;
}): Promise<{
  url: string;
  path: string;
  provider: "github";
  repo: string;
  width: number | null;
  height: number | null;
  mime_type: string;
  file_bytes: number;
  stored_as_received: true;
}> {
  if (!input.image_base64 && !input.source_url) {
    throw new Error("GITHUB_UPLOAD_FAILED: image_base64 or source_url is required");
  }
  const bytes = input.image_base64
    ? decodeImageBase64(input.image_base64)
    : (await fetchSourceImage(input.source_url as string)).bytes;
  const sniff = sniffImage(bytes);
  const kind = /cover/i.test(`${input.image_id || ""} ${input.filename || ""}`) ? "cover" : "inline";
  if (sniff.ext !== "svg") assertImageQa(bytes, sniff, kind);
  const filePath = assertGithubAssetPath(
    buildVersionedAssetPath(
      input.idempotency_key || "chatgpt-github",
      input.image_id || "asset",
      sniff.ext,
      input.filename
    )
  );
  const uploaded = await upsertGithubFile(
    filePath,
    bytes,
    `ChatGPT upload ${input.image_id || input.filename || "image"}`
  );
  return {
    url: uploaded.url,
    path: uploaded.path,
    provider: "github",
    repo: githubAssetRepo(),
    width: sniff.width,
    height: sniff.height,
    mime_type: sniff.mime,
    file_bytes: bytes.length,
    stored_as_received: true,
  };
}
