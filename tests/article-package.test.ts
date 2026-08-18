import assert from "node:assert/strict";
import test from "node:test";
import {
  ARTICLE_PACKAGE_SCHEMA_VERSION,
  buildArticlePackageSnapshot,
  normalizeArticlePackage,
  normalizeFeaturedImage,
  validateArticlePackage,
} from "../src/lib/content/article-package.ts";

function baseDraft(overrides: Record<string, unknown> = {}) {
  return {
    idempotency_key: "test-key",
    policy_version: "2026.08",
    policy_hash: "sha256:abc",
    title: "AI và game hóa trong giáo dục mầm non",
    slug: "ai-game-hoa-mam-non",
    excerpt: "Hướng dẫn thực hành",
    content_markdown: "## Section\nBody",
    seo: {
      title: "AI và game hóa",
      description: "desc",
      primary_keyword: "AI mầm non",
      secondary_keywords: ["game hóa"],
    },
    aio: {
      tldr: "AI hỗ trợ giáo viên thiết kế.",
      key_takeaways: ["Một", "Hai", "Ba"],
    },
    references: [],
    internal_links: [],
    quality: {
      overall: 90,
      factual_accuracy: 96,
      source_quality: 91,
      seo: 88,
      aio: 90,
      editorial: 90,
      hard_fail_conditions: [],
    },
    ...overrides,
  };
}

test("A01 legacy featured_image string still normalizes", () => {
  const { image, source } = normalizeFeaturedImage(
    "https://raw.githubusercontent.com/quanpl86/imgBlog/main/cover.webp",
    "Alt từ v6"
  );
  assert.equal(source, "v6_string");
  assert.equal(image?.purpose, "article_cover");
  assert.equal(image?.url, "https://raw.githubusercontent.com/quanpl86/imgBlog/main/cover.webp");
  assert.equal(image?.alt, "Alt từ v6");
  const check = validateArticlePackage(normalizeArticlePackage(baseDraft({
    featured_image: "https://raw.githubusercontent.com/quanpl86/imgBlog/main/cover.webp",
    featured_image_alt: "Alt từ v6",
  })));
  assert.equal(check.errors.length, 0);
});

test("A02 featured_image object normalizes", () => {
  const pkg = normalizeArticlePackage(baseDraft({
    featured_image: {
      purpose: "article_cover",
      prompt: "Warm preschool illustration, no text, 16:9",
      alt: "Giáo viên mầm non dùng AI",
      caption: "AI hỗ trợ khâu thiết kế",
      url: null,
    },
  }));
  assert.equal(pkg.featured_image_source, "v7_object");
  assert.equal(pkg.featured_image?.purpose, "article_cover");
  assert.equal(pkg.featured_image?.url, null);
});

test("A03/A04 image_url and image_alt map from normalized cover", () => {
  const pkg = normalizeArticlePackage(baseDraft({
    featured_image: {
      purpose: "article_cover",
      prompt: "prompt",
      alt: "Alt cover",
      url: "https://raw.githubusercontent.com/x/y/cover.webp",
    },
  }));
  assert.equal(pkg.featured_image?.url, "https://raw.githubusercontent.com/x/y/cover.webp");
  assert.equal(pkg.featured_image?.alt, "Alt cover");
});

test("A05 media object persists into article_package snapshot", () => {
  const pkg = normalizeArticlePackage(baseDraft({
    featured_image: {
      purpose: "article_cover",
      prompt: "prompt",
      alt: "alt",
      url: null,
    },
    inline_images: [{
      id: "img-01",
      purpose: "workflow",
      prompt: "workflow prompt",
      alt: "workflow alt",
      caption: "caption",
      url: null,
    }],
  }));
  const snapshot = buildArticlePackageSnapshot(pkg, []);
  assert.equal(snapshot.schema_version, ARTICLE_PACKAGE_SCHEMA_VERSION);
  assert.equal(snapshot.featured_image?.purpose, "article_cover");
  assert.equal(snapshot.inline_images[0].id, "img-01");
});

test("A06 inline_images validate id and purpose", () => {
  const pkg = normalizeArticlePackage(baseDraft({
    inline_images: [{
      id: "img-01",
      purpose: "concept_diagram",
      prompt: "p",
      alt: "a",
      url: null,
    }],
  }));
  const check = validateArticlePackage(pkg);
  assert.equal(check.errors.length, 0);
});

test("A07 duplicate inline id is rejected", () => {
  const pkg = normalizeArticlePackage(baseDraft({
    inline_images: [
      { id: "img-01", purpose: "workflow", prompt: "p", alt: "a", url: null },
      { id: "img-01", purpose: "explainer", prompt: "p", alt: "a", url: null },
    ],
  }));
  const check = validateArticlePackage(pkg);
  assert.ok(check.errors.some((issue) => issue.code === "INLINE_ID_DUPLICATE"));
});

test("A08 purpose decoration is rejected", () => {
  const pkg = normalizeArticlePackage(baseDraft({
    inline_images: [{
      id: "img-01",
      purpose: "decoration",
      prompt: "pretty",
      alt: "pretty",
      url: null,
    }],
  }));
  const check = validateArticlePackage(pkg);
  assert.ok(check.errors.some((issue) => issue.code === "INLINE_PURPOSE_DECORATION"));
});

test("A09 cover object missing prompt or alt is rejected", () => {
  const missingPrompt = validateArticlePackage(normalizeArticlePackage(baseDraft({
    featured_image: { purpose: "article_cover", prompt: "", alt: "alt", url: null },
  })));
  assert.ok(missingPrompt.errors.some((issue) => issue.code === "COVER_PROMPT_MISSING"));

  const missingAlt = validateArticlePackage(normalizeArticlePackage(baseDraft({
    featured_image: { purpose: "article_cover", prompt: "prompt", alt: "  ", url: null },
  })));
  assert.ok(missingAlt.errors.some((issue) => issue.code === "COVER_ALT_MISSING"));
});

test("A10 null URL is warning only", () => {
  const check = validateArticlePackage(normalizeArticlePackage(baseDraft({
    featured_image: {
      purpose: "article_cover",
      prompt: "prompt",
      alt: "alt",
      url: null,
    },
    inline_images: [{
      id: "img-01",
      purpose: "case_study",
      prompt: "p",
      alt: "a",
      caption: "c",
      url: null,
    }],
  })));
  assert.equal(check.errors.length, 0);
  assert.ok(check.warnings.some((issue) => issue.code === "MEDIA_URL_MISSING" && issue.image_id === "featured_image"));
  assert.ok(check.warnings.some((issue) => issue.code === "MEDIA_URL_MISSING" && issue.image_id === "img-01"));
});

test("more than 4 inline images is rejected", () => {
  const images = ["a", "b", "c", "d", "e"].map((id) => ({
    id,
    purpose: "explainer",
    prompt: "p",
    alt: "a",
    url: null,
  }));
  const check = validateArticlePackage(normalizeArticlePackage(baseDraft({
    inline_images: images,
  })));
  assert.ok(check.errors.some((issue) => issue.code === "INLINE_IMAGE_LIMIT"));
});
