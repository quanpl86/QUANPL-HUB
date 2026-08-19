import { randomBytes } from "crypto";
import {
  assertInfographicContract,
  renderInfographicSvg,
  shouldRenderInfographic,
  type InfographicLayout,
} from "./blog-infographic.ts";
import { assertImageQa, sniffImage } from "./image-qa.ts";

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

export function buildVersionedAssetPath(
  idempotencyKey: string,
  imageId: string,
  ext: string,
  filename?: string
): string {
  const basePath = (process.env.GITHUB_ASSET_PATH || "public/editor-assets").replace(/\/$/, "");
  const name = slugAssetPart(filename || imageId);
  const revision = randomBytes(4).toString("hex");
  return `${basePath}/v7/${slugAssetPart(idempotencyKey)}/${name}-${revision}.${ext}`;
}

function withEditorialSuffix(prompt: string, purpose: string): string {
  const base = prompt.trim();
  if (purpose === "article_cover") {
    return `${base}, sharp high-resolution educational editorial illustration, crisp edges, no photorealistic children, no readable text, no watermark, no gibberish letters`;
  }
  return `${base}, sharp high-resolution educational editorial illustration, crisp detail, no photorealistic children, no watermark, no gibberish fake text`;
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
  available.push("flux");
  if (env.STABILITY_API_KEY) available.push("stability");
  if (forced === "openai" || forced === "gemini" || forced === "flux" || forced === "stability") {
    return [forced, ...available.filter((item) => item !== forced)];
  }
  return available;
}

export function preferredImageGenerator(): SceneGenerator {
  return imageGeneratorChain()[0] || "flux";
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOpenAiImage(prompt: string, aspect: string, purpose: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("IMAGE_GENERATE_FAILED: missing OPENAI_API_KEY");
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const body = {
    model,
    prompt: withEditorialSuffix(prompt, purpose),
    n: 1,
    size: openaiImageSize(aspect),
    quality: "high",
    output_format: "png",
  };
  let lastError = "IMAGE_GENERATE_FAILED: openai";
  for (let attempt = 0; attempt < 3; attempt += 1) {
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
      const wait = Number(response.headers.get("retry-after") || 2 + attempt * 3) * 1000;
      lastError = "IMAGE_GENERATE_FAILED: 429 openai rate limit";
      await sleep(Math.min(wait, 15000));
      continue;
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
      const bytes = Buffer.from(item.b64_json, "base64");
      return { bytes, mimeType: "image/png" };
    }
    if (item?.url) {
      const download = await fetch(item.url, { signal: AbortSignal.timeout(30000) });
      if (!download.ok) throw new Error(`IMAGE_GENERATE_FAILED: openai image download ${download.status}`);
      return { bytes: Buffer.from(await download.arrayBuffer()), mimeType: download.headers.get("content-type") || "image/png" };
    }
    throw new Error("IMAGE_GENERATE_FAILED: openai returned no image");
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
  const response = await fetch(
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
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(withEditorialSuffix(prompt, purpose))}` +
    `?width=${size.width}&height=${size.height}&model=flux&nologo=true&enhance=true`;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(20000),
    });
    lastStatus = response.status;
    if (response.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!response.ok) {
      throw new Error(`IMAGE_GENERATE_FAILED: flux ${response.status}`);
    }
    const mimeType = response.headers.get("content-type") || "image/png";
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1000) throw new Error("IMAGE_GENERATE_FAILED: empty or invalid image bytes");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("IMAGE_GENERATE_FAILED: image exceeds 10MB");
    return { bytes, mimeType };
  }
  throw new Error(`IMAGE_GENERATE_FAILED: flux ${lastStatus || 429} rate limit`);
}

async function fetchGeneratedImage(
  prompt: string,
  aspect: string,
  purpose: string
): Promise<{ bytes: Buffer; generator: SceneGenerator }> {
  const chain = imageGeneratorChain();
  const errors: string[] = [];
  for (const generator of chain) {
    try {
      if (generator === "openai") {
        const result = await fetchOpenAiImage(prompt, aspect, purpose);
        return { bytes: result.bytes, generator };
      }
      if (generator === "gemini") {
        const result = await fetchGeminiImage(prompt, aspect, purpose);
        return { bytes: result.bytes, generator };
      }
      if (generator === "stability") {
        const result = await fetchStabilityImage(prompt, aspect, purpose);
        return { bytes: result.bytes, generator };
      }
      const result = await fetchFluxImage(prompt, aspect, purpose);
      return { bytes: result.bytes, generator: "flux" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${generator}: ${message}`);
      console.error(`[blog-image] ${generator} failed, trying next:`, message);
    }
  }
  throw new Error(`IMAGE_GENERATE_FAILED: all providers failed (${errors.join(" | ")})`);
}

async function fetchSourceImage(url: string): Promise<{ bytes: Buffer; generator: "upload" }> {
  if (!/^https:\/\//i.test(url)) throw new Error("IMAGE_UPLOAD_FAILED: source_url must be https");
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`IMAGE_UPLOAD_FAILED: source_url ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error("IMAGE_UPLOAD_FAILED: source_url empty");
  if (bytes.length > 10 * 1024 * 1024) throw new Error("IMAGE_UPLOAD_FAILED: source_url exceeds 10MB");
  return { bytes, generator: "upload" };
}

async function upsertGithubFile(
  filePath: string,
  bytes: Buffer,
  message: string
): Promise<{ url: string; path: string; provider: "github" }> {
  const token = process.env.GITHUB_ASSET_TOKEN;
  const repo = process.env.GITHUB_ASSET_REPO || "quanpl86/imgBlog";
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
  prompt: string;
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
};

export async function generateAndUploadBlogImage(input: BlogImageGenerateInput) {
  if (!input.alt.trim()) {
    throw new Error("QUALITY_GATE_FAILED: COVER_ALT_MISSING");
  }
  if (input.prompt) assertSafeImagePrompt(input.prompt);
  if (!input.source_url) assertInfographicContract(input);

  const aspect = input.aspect || (input.purpose === "article_cover" ? "16:9" : "4:3");
  const requested = ASPECT_SIZE[aspect] || ASPECT_SIZE["16:9"];
  const infographic = !input.source_url && shouldRenderInfographic(input);
  const kind = infographic ? "infographic" : input.purpose === "article_cover" ? "cover" : "inline";

  let bytes: Buffer;
  let renderer: "svg" | SceneGenerator | "upload" = "flux";
  if (input.source_url) {
    const uploadedSource = await fetchSourceImage(input.source_url);
    bytes = uploadedSource.bytes;
    renderer = "upload";
  } else if (infographic) {
    bytes = renderInfographicSvg({
      visual_goal: input.visual_goal || input.alt,
      required_labels: input.required_labels,
      must_show: input.must_show,
      layout: input.layout_spec,
      text_language: input.text_language || "vi",
    });
    renderer = "svg";
  } else {
    const generated = await fetchGeneratedImage(input.prompt, aspect, input.purpose);
    bytes = generated.bytes;
    renderer = generated.generator;
  }

  let sniff = sniffImage(bytes);
  try {
    assertImageQa(bytes, sniff, kind);
  } catch (error) {
    if (renderer === "svg" || renderer === "upload") throw error;
    const retry = await fetchGeneratedImage(`${input.prompt}, ultra sharp, high definition`, aspect, input.purpose);
    bytes = retry.bytes;
    renderer = retry.generator;
    sniff = sniffImage(bytes);
    assertImageQa(bytes, sniff, kind);
  }

  const filePath = buildVersionedAssetPath(input.idempotency_key, input.image_id, sniff.ext, input.filename);
  const uploaded = await upsertGithubFile(
    filePath,
    bytes,
    `Add editorial image ${input.image_id} (${input.purpose}, ${sniff.ext})`
  );

  const gates = ["IMAGE_RESOLUTION_PASS", "IMAGE_SHARPNESS_PASS", "IMAGE_FORMAT_PASS"];
  if (infographic) {
    gates.push("IMAGE_TEXT_MATCH_PASS", "IMAGE_LAYOUT_PASS", "IMAGE_CONTENT_MATCH_PASS");
  }

  return {
    image_id: input.image_id,
    purpose: input.purpose,
    alt: input.alt.trim(),
    url: uploaded.url,
    width: sniff.width || requested.width,
    height: sniff.height || requested.height,
    mime_type: sniff.mime,
    path: uploaded.path,
    provider: uploaded.provider,
    renderer,
    generator: renderer,
    qa_gates: gates,
  };
}
