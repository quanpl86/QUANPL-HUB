import assert from "node:assert/strict";
import test from "node:test";
import {
  assertGithubAssetPath,
  assertSafeImagePrompt,
  buildIdempotentAssetPath,
  buildVersionedAssetPath,
  githubAssetBasePath,
  imageGeneratorChain,
  openaiImageSize,
  slugAssetPart,
  decodeImageBase64,
  chatGptFileDownloadUrl,
} from "../src/lib/content/blog-image.ts";
import {
  assertInfographicContract,
  renderInfographicSvg,
  shouldRenderInfographic,
} from "../src/lib/content/blog-infographic.ts";
import { assertCompleteRaster, assertImageQa, minRasterBytes, sniffImage } from "../src/lib/content/image-qa.ts";
import { IMAGE_GENERATION_STANDARD, resolveTextPolicy } from "../src/lib/content/image-generation-standard.ts";
import { ARTICLE_ASSET_HARD_RULE } from "../src/lib/content/article-asset-rule.ts";

test("rejects photorealistic child prompts", () => {
  assert.throws(
    () => assertSafeImagePrompt("photorealistic child in a classroom photo of a girl aged 5"),
    /IMAGE_PROMPT_UNSAFE/
  );
});

test("allows illustration prompts", () => {
  assert.doesNotThrow(() =>
    assertSafeImagePrompt("Warm editorial illustration of a preschool classroom, flat vector, no text")
  );
});

test("idempotent path is stable for the same keys", () => {
  const a = buildIdempotentAssetPath("free-20260818-v1", "cover", "ai-game-hoa-cover");
  const b = buildIdempotentAssetPath("free-20260818-v1", "cover", "ai-game-hoa-cover");
  assert.equal(a, b);
  assert.match(a, /\/v7\/free-20260818-v1\/ai-game-hoa-cover\.png$/);
});

test("slug strips vietnamese diacritics", () => {
  assert.equal(slugAssetPart("Ảnh bìa mầm non"), "anh-bia-mam-non");
});

test("text policy is no_text for covers and exact_text for workflow labels", () => {
  assert.equal(resolveTextPolicy({ purpose: "article_cover" }), "no_text");
  assert.equal(resolveTextPolicy({ purpose: "workflow", required_labels: ["Quan sát"] }), "exact_text");
  assert.equal(resolveTextPolicy({ purpose: "editorial_illustration", text_policy: "no_text" }), "no_text");
});

test("image generator chain is OpenAI then Gemini then Stability", () => {
  const chain = imageGeneratorChain({
    OPENAI_API_KEY: "sk-test",
    GEMINI_API_KEY: "gem-test",
    STABILITY_API_KEY: "sk-stab",
  } as unknown as NodeJS.ProcessEnv);
  assert.deepEqual(chain, ["openai", "gemini", "stability"]);
});

test("image generator chain without paid keys does not use Flux", () => {
  const chain = imageGeneratorChain({} as unknown as NodeJS.ProcessEnv);
  assert.deepEqual(chain, []);
});

test("decodeImageBase64 accepts a data URL", () => {
  const png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const fromRaw = decodeImageBase64(png);
  const fromData = decodeImageBase64(`data:image/png;base64,${png}`);
  assert.equal(fromRaw.length, fromData.length);
  assert.ok(fromRaw.length > 32);
  assertCompleteRaster(fromRaw);
});

test("rejects truncated PNG base64 the way the ChatGPT connector cuts it", () => {
  const png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const cut = png.slice(0, 40);
  assert.throws(() => decodeImageBase64(cut), /BASE64_TRUNCATED/);
});

test("OpenAI image size maps Hub aspects", () => {
  assert.equal(openaiImageSize("16:9"), "1536x1024");
  assert.equal(openaiImageSize("4:3"), "1536x1024");
  assert.equal(openaiImageSize("1:1"), "1024x1024");
});

test("versioned asset paths do not overwrite", () => {
  const a = buildVersionedAssetPath("free-20260818-v1", "img-01", "svg", "rubric");
  const b = buildVersionedAssetPath("free-20260818-v1", "img-01", "svg", "rubric");
  assert.notEqual(a, b);
  assert.match(a, /\/v7\/free-20260818-v1\/rubric-[0-9a-f]{8}\.svg$/);
});

test("workflow purpose without labels is IMAGE_LAYOUT_REQUIRED", () => {
  assert.throws(
    () => assertInfographicContract({ purpose: "workflow", required_labels: [] }),
    /IMAGE_LAYOUT_REQUIRED/
  );
});

test("rubric SVG contains exact Vietnamese labels", () => {
  const bytes = renderInfographicSvg({
    visual_goal: "Bảng tiêu chí STEM",
    required_labels: [
      "Sản phẩm hoạt động & được kiểm thử",
      "Giải thích lựa chọn bằng bằng chứng",
      "Nhận ra điểm cần cải tiến",
      "Mức 4 – Vững chắc",
      "Mức 3 – Đạt",
      "Mức 2 – Đang hình thành",
      "Mức 1 – Cần hỗ trợ",
    ],
    layout: { type: "rubric_matrix", rows: 3, columns: 4 },
  });
  const svg = bytes.toString("utf8");
  assert.match(svg, /Sản phẩm hoạt động/);
  assert.match(svg, /Mức 4/);
  assert.match(svg, /<svg /);
  const sniff = sniffImage(bytes);
  assert.equal(sniff.ext, "svg");
  assert.equal(sniff.mime, "image/svg+xml");
});

test("workflow with labels is rendered as infographic", () => {
  assert.equal(
    shouldRenderInfographic({
      purpose: "workflow",
      required_labels: ["Quan sát", "Ghi nhận", "Phản hồi", "Điều chỉnh"],
      layout_spec: { type: "workflow_steps" },
    }),
    true
  );
  assert.equal(
    shouldRenderInfographic({ purpose: "article_cover", required_labels: [] }),
    false
  );
});

function fakePng(width: number, height: number, byteLength: number): Buffer {
  const bytes = Buffer.alloc(Math.max(byteLength, 32));
  bytes[0] = 0x89;
  bytes[1] = 0x50;
  bytes[2] = 0x4e;
  bytes[3] = 0x47;
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function fakeWebp(width: number, height: number, byteLength: number): Buffer {
  const bytes = Buffer.alloc(Math.max(byteLength, 32));
  bytes.write("RIFF", 0);
  bytes.write("WEBP", 8);
  bytes.write("VP8X", 12);
  const w = width - 1;
  const h = height - 1;
  bytes[24] = w & 255;
  bytes[25] = (w >> 8) & 255;
  bytes[26] = (w >> 16) & 255;
  bytes[27] = h & 255;
  bytes[28] = (h >> 8) & 255;
  bytes[29] = (h >> 16) & 255;
  return bytes;
}

test("rejects ChatGPT-style 800x450 compressed WebP covers", () => {
  const tiny = fakeWebp(800, 450, 40_000);
  const sniff = sniffImage(tiny);
  assert.equal(sniff.width, 800);
  assert.equal(sniff.height, 450);
  assert.throws(() => assertImageQa(tiny, sniff, "cover"), /IMAGE_RESOLUTION_PASS|IMAGE_COMPRESSION_TOO_HIGH/);
});

test("rejects a 1280x720 cover that is still over-compressed", () => {
  const flat = fakePng(1280, 720, 90_000);
  const sniff = sniffImage(flat);
  assert.throws(() => assertImageQa(flat, sniff, "cover"), /IMAGE_RESOLUTION_PASS|IMAGE_COMPRESSION_TOO_HIGH/);
});

test("accepts a full-size PNG cover", () => {
  const png = fakePng(1920, 1080, minRasterBytes(1920, 1080, "png"));
  const sniff = sniffImage(png);
  const gates = assertImageQa(png, sniff, "cover");
  assert.ok(gates.includes("IMAGE_COMPRESSION_PASS"));
  assert.ok(gates.includes("IMAGE_RESOLUTION_PASS"));
});

test("image generation standard forbids compressing to fit the tool call", () => {
  assert.equal(IMAGE_GENERATION_STANDARD.version, "3.0");
  assert.equal(IMAGE_GENERATION_STANDARD.hard_rule, true);
  assert.equal(IMAGE_GENERATION_STANDARD.no_openai_api_key, true);
  assert.match(IMAGE_GENERATION_STANDARD.lanes.A_scene, /upload_generated_image_file/);
  assert.match(IMAGE_GENERATION_STANDARD.external_client.scene, /start_image_upload/);
  assert.match(IMAGE_GENERATION_STANDARD.lanes.B_svg, /SVG/);
});

test("ChatGPT file params require an HTTPS image attachment", () => {
  assert.equal(
    chatGptFileDownloadUrl({
      download_url: "https://files.openai.com/generated/cover.png?sig=test",
      file_id: "file_00000000000000000000000000000001",
      mime_type: "image/png",
      file_name: "cover.png",
    }),
    "https://files.openai.com/generated/cover.png?sig=test"
  );
  assert.throws(
    () => chatGptFileDownloadUrl({ download_url: "https://files.openai.com/a.png", file_id: " " }),
    /file_id is required/
  );
  assert.throws(
    () => chatGptFileDownloadUrl({ download_url: "http://files.openai.com/a.png", file_id: "file_1" }),
    /must be an HTTPS URL/
  );
  assert.throws(
    () => chatGptFileDownloadUrl({ download_url: "https://user:pass@files.openai.com/a.png", file_id: "file_1" }),
    /without credentials/
  );
  assert.throws(
    () => chatGptFileDownloadUrl({ download_url: "https://files.openai.com/a.txt", file_id: "file_1", mime_type: "text/plain" }),
    /expected image file/
  );
});

test("article hard rule uses native ChatGPT file params and reserves upload tickets for external clients", () => {
  assert.equal(ARTICLE_ASSET_HARD_RULE.version, "v5");
  assert.match(ARTICLE_ASSET_HARD_RULE.text, /only when article_mode=gpt_scenes/);
  assert.equal(ARTICLE_ASSET_HARD_RULE.upload_tool, "upload_generated_image_file");
  assert.equal(ARTICLE_ASSET_HARD_RULE.external_upload_tool, "start_image_upload");
  assert.match(ARTICLE_ASSET_HARD_RULE.text, /download_url \+ file_id/);
  assert.match(ARTICLE_ASSET_HARD_RULE.text, /external-client only/);
});

test("GitHub uploads are locked to the asset path", () => {
  const base = githubAssetBasePath();
  assert.equal(assertGithubAssetPath(`${base}/v7/key/cover.png`), `${base}/v7/key/cover.png`);
  assert.throws(() => assertGithubAssetPath("README.md"), /GITHUB_PATH_DENIED/);
  assert.throws(() => assertGithubAssetPath(`${base}/../secret.txt`), /GITHUB_PATH_DENIED/);
});
