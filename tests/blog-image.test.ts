import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeImagePrompt,
  buildIdempotentAssetPath,
  buildVersionedAssetPath,
  openaiImageSize,
  slugAssetPart,
} from "../src/lib/content/blog-image.ts";
import {
  assertInfographicContract,
  renderInfographicSvg,
  shouldRenderInfographic,
} from "../src/lib/content/blog-infographic.ts";
import { sniffImage } from "../src/lib/content/image-qa.ts";

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
