import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeImagePrompt,
  buildIdempotentAssetPath,
  slugAssetPart,
} from "../src/lib/content/blog-image.ts";

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
