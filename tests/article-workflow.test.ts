import assert from "node:assert/strict";
import test from "node:test";
import {
  applyArticleWorkflowAsset,
  applyArticleWorkflowImageFailure,
  createArticleWorkflowRun,
  getArticleWorkflowNextAction,
  type ArticleWorkflowImageId,
} from "../src/lib/content/article-workflow.ts";

function articlePackage() {
  return {
    schema_version: "article-package/7.0",
    idempotency_key: "workflow-test-01",
    featured_image: {
      purpose: "article_cover",
      prompt: "Cover prompt",
      alt: "Cover alt",
      url: null,
    },
    featured_image_url: null,
    inline_images: ["img-01", "img-02", "img-03"].map((id) => ({
      id,
      purpose: "explainer",
      prompt: `${id} prompt`,
      alt: `${id} alt`,
      url: null,
    })),
  };
}

function asset(imageId: ArticleWorkflowImageId) {
  return {
    image_id: imageId,
    raw_url: `https://raw.githubusercontent.com/quanpl86/imgBlog/main/${imageId}.png`,
    width: 1920,
    height: 1080,
    mime_type: "image/png",
    file_bytes: 2_000_000,
    sha256: imageId.padEnd(64, "0"),
  };
}

test("start returns cover generation and exact sequential plan", () => {
  const run = createArticleWorkflowRun({ topic: "STEM", article_package: articlePackage() });
  assert.deepEqual(run.image_plan.map((item) => item.image_id), ["cover", "img-01", "img-02", "img-03"]);
  const next = getArticleWorkflowNextAction(run);
  assert.equal(next.action, "GENERATE_IMAGE");
  if (next.action !== "GENERATE_IMAGE") return;
  assert.equal(next.image_id, "cover");
  assert.equal(next.purpose, "article_cover");
  assert.equal(next.alt, "Cover alt");
  assert.equal(next.aspect, "16:9");
  assert.match(next.prompt, /Scene \/ context \/ action: Cover prompt/);
  assert.match(next.prompt, /KDH EDITORIAL COVER — CLEAN & CLEAR STANDARD/);
});

test("each continuation stores URL and advances to the next image", () => {
  let run = createArticleWorkflowRun({ topic: "STEM", article_package: articlePackage() });
  run = applyArticleWorkflowAsset(run, asset("cover"));
  assert.equal((run.article_package.featured_image as { url: string }).url, asset("cover").raw_url);
  assert.equal(getArticleWorkflowNextAction(run).action, "GENERATE_IMAGE");
  const next = getArticleWorkflowNextAction(run);
  assert.equal(next.action === "GENERATE_IMAGE" ? next.image_id : null, "img-01");

  run = applyArticleWorkflowAsset(run, asset("img-01"));
  run = applyArticleWorkflowAsset(run, asset("img-02"));
  run = applyArticleWorkflowAsset(run, asset("img-03"));
  assert.equal(run.status, "READY_TO_DRAFT");
  assert.equal(getArticleWorkflowNextAction(run).action, "CREATE_DRAFT");
  const inlineImages = run.article_package.inline_images as Array<{ url: string }>;
  assert.deepEqual(inlineImages.map((item) => item.url), [
    asset("img-01").raw_url,
    asset("img-02").raw_url,
    asset("img-03").raw_url,
  ]);
});

test("rejects out-of-order and incomplete image plans", () => {
  const run = createArticleWorkflowRun({ topic: "STEM", article_package: articlePackage() });
  assert.throws(() => applyArticleWorkflowAsset(run, asset("img-01")), /expected cover/);

  const incomplete = articlePackage();
  incomplete.inline_images.pop();
  assert.throws(
    () => createArticleWorkflowRun({ topic: "STEM", article_package: incomplete }),
    /must include img-03/
  );
});

test("retries once, then marks a failed image missing and advances", () => {
  let run = createArticleWorkflowRun({ topic: "STEM", article_package: articlePackage() });
  run = applyArticleWorkflowImageFailure(run, {
    failure_code: "IMAGE_GENERATION_FAILED",
    failure_reason: "provider timeout",
  });
  assert.equal(run.current_index, 0);
  assert.equal(run.image_failures.cover?.attempt_count, 1);
  assert.equal(run.image_failures.cover?.status, "PENDING");
  run = applyArticleWorkflowImageFailure(run, {
    failure_code: "IMAGE_GENERATION_FAILED",
    failure_reason: "provider timeout again",
  });
  assert.equal(run.current_index, 1);
  assert.equal(run.media_status, "INCOMPLETE");
  assert.equal(run.image_failures.cover?.status, "MISSING");
  assert.equal((run.article_package.featured_image as { status: string }).status, "missing");
  const next = getArticleWorkflowNextAction(run);
  assert.equal(next.action === "GENERATE_IMAGE" ? next.image_id : null, "img-01");
});
