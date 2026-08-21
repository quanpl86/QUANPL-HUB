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
    content_markdown: "## Section\n{{IMAGE:img-01}}\n\n## Next\n{{IMAGE:img-02}}\n\n## More\n{{IMAGE:img-03}}\n",
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
    inline_images: threeInlineImages(),
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
    featured_image: {
      purpose: "article_cover",
      prompt: "prompt",
      alt: "alt",
      url: "https://raw.githubusercontent.com/x/y/cover.webp",
    },
    inline_images: threeInlineImages(),
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

test("A10 missing cover or fewer than 3 inline URLs is rejected", () => {
  const noCover = validateArticlePackage(normalizeArticlePackage(baseDraft({
    featured_image: {
      purpose: "article_cover",
      prompt: "prompt",
      alt: "alt",
      url: null,
    },
    inline_images: threeInlineImages(),
  })));
  assert.ok(noCover.errors.some((issue) => issue.code === "COVER_URL_MISSING"));

  const oneInline = validateArticlePackage(normalizeArticlePackage(baseDraft({
    featured_image: {
      purpose: "article_cover",
      prompt: "prompt",
      alt: "alt",
      url: "https://raw.githubusercontent.com/x/y/cover.webp",
    },
    inline_images: threeInlineImages().slice(0, 2),
  })));
  assert.ok(oneInline.errors.some((issue) => issue.code === "IMAGE_SET_INCOMPLETE"));
  assert.match(oneInline.errors.find((issue) => issue.code === "IMAGE_SET_INCOMPLETE")?.message || "", /img-03/);
});

function threeInlineImages() {
  return [
    {
      id: "img-01",
      purpose: "workflow",
      prompt: "p",
      alt: "a",
      caption: "c1",
      url: "https://raw.githubusercontent.com/x/y/one.webp",
    },
    {
      id: "img-02",
      purpose: "explainer",
      prompt: "p",
      alt: "b",
      caption: "c2",
      url: "https://raw.githubusercontent.com/x/y/two.webp",
    },
    {
      id: "img-03",
      purpose: "case_study",
      prompt: "p",
      alt: "c",
      caption: "c3",
      url: "https://raw.githubusercontent.com/x/y/three.webp",
    },
  ];
}

test("more than 3 inline images is rejected", () => {
  const images = ["a", "b", "c", "d"].map((id) => ({
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

test("article mode text_only accepts a package without media", () => {
  const check = validateArticlePackage(normalizeArticlePackage(baseDraft({
    article_mode: "text_only",
    featured_image: null,
    featured_image_url: null,
    inline_images: [],
    content_markdown: "## Nội dung\n\nBài viết thuần văn bản.",
  })));
  assert.deepEqual(check.errors, []);
});

test("article mode text_only rejects image placeholders", () => {
  const check = validateArticlePackage(normalizeArticlePackage(baseDraft({
    article_mode: "text_only",
    featured_image: null,
    inline_images: [],
    content_markdown: "## Nội dung\n\n{{IMAGE:img-01}}",
  })));
  assert.ok(check.errors.some((issue) => issue.code === "TEXT_ONLY_HAS_MEDIA"));
});

test("article mode structured_graphics accepts 3 persisted graphics without cover", () => {
  const check = validateArticlePackage(normalizeArticlePackage(baseDraft({
    article_mode: "structured_graphics",
    featured_image: null,
    featured_image_url: null,
    inline_images: threeInlineImages().map((image, index) => ({
      ...image,
      purpose: (["workflow", "comparison", "concept_diagram"] as const)[index],
    })),
  })));
  assert.deepEqual(check.errors, []);
});

test("article mode image_placeholders requires and accepts detailed briefs", () => {
  const inline = ["img-01", "img-02", "img-03"].map((id, index) => ({
    id,
    purpose: "explainer",
    prompt: `Minh họa chi tiết số ${index + 1} với chủ thể, bối cảnh, bố cục, ánh sáng và màu sắc giáo dục rõ ràng`,
    alt: `Mô tả chi tiết ảnh giữ chỗ số ${index + 1} trong bài viết giáo dục`,
    caption: `Ảnh minh họa số ${index + 1}`,
    url: null,
    status: "missing",
  }));
  const check = validateArticlePackage(normalizeArticlePackage(baseDraft({
    article_mode: "image_placeholders",
    featured_image: {
      purpose: "article_cover",
      prompt: "Ảnh bìa giáo dục chi tiết, lớp học hiện đại, bố cục rộng 16:9, ánh sáng tự nhiên, không chữ",
      alt: "Ảnh bìa mô tả lớp học hiện đại và hoạt động học tập chủ động",
      url: null,
      status: "missing",
    },
    inline_images: inline,
  })));
  assert.deepEqual(check.errors, []);
  assert.ok(check.warnings.some((issue) => issue.code === "COVER_URL_MISSING"));
});
