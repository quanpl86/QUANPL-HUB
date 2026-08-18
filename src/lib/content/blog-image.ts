export const UNSAFE_IMAGE_PROMPT_PATTERNS = [
  /(?<!no )(?<!not )photorealistic (child|children|kid|kids|toddler|preschooler|minor)/i,
  /photo of a (girl|boy) aged/i,
  /real (child|children|student) face/i,
  /nude|nsfw|sexual/i,
];

const ASPECT_SIZE: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1600, height: 900 },
  "4:3": { width: 1200, height: 900 },
  "1:1": { width: 1024, height: 1024 },
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

function withEditorialSuffix(prompt: string): string {
  return `${prompt.trim()}, educational editorial illustration, friendly, no photorealistic children, no readable text, no watermark`;
}

async function fetchGeneratedImage(prompt: string, aspect: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const size = ASPECT_SIZE[aspect] || ASPECT_SIZE["16:9"];
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(withEditorialSuffix(prompt))}` +
    `?width=${size.width}&height=${size.height}&model=flux&nologo=true`;

  const response = await fetch(url, {
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`IMAGE_GENERATE_FAILED: ${response.status}`);
  }
  const mimeType = response.headers.get("content-type") || "image/png";
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) {
    throw new Error("IMAGE_GENERATE_FAILED: empty or invalid image bytes");
  }
  if (bytes.length > 10 * 1024 * 1024) {
    throw new Error("IMAGE_GENERATE_FAILED: image exceeds 10MB");
  }
  return { bytes, mimeType };
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

export async function generateAndUploadBlogImage(input: {
  idempotency_key: string;
  image_id: string;
  purpose: string;
  prompt: string;
  alt: string;
  aspect?: string;
  filename?: string;
}) {
  if (!input.alt.trim()) {
    throw new Error("QUALITY_GATE_FAILED: COVER_ALT_MISSING");
  }
  assertSafeImagePrompt(input.prompt);

  const aspect = input.aspect || (input.purpose === "article_cover" ? "16:9" : "4:3");
  const size = ASPECT_SIZE[aspect] || ASPECT_SIZE["16:9"];
  const filePath = buildIdempotentAssetPath(input.idempotency_key, input.image_id, input.filename);
  const { bytes, mimeType } = await fetchGeneratedImage(input.prompt, aspect);
  const uploaded = await upsertGithubFile(
    filePath,
    bytes,
    `Add editorial image ${input.image_id} (${input.purpose})`
  );

  return {
    image_id: input.image_id,
    purpose: input.purpose,
    alt: input.alt.trim(),
    url: uploaded.url,
    width: size.width,
    height: size.height,
    mime_type: mimeType,
    path: uploaded.path,
    provider: uploaded.provider,
  };
}
