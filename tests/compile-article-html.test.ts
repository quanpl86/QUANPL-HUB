import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { normalizeArticlePackage } from "../src/lib/content/article-package.ts";
import {
  compileArticleHtml,
  expectedHeadingId,
} from "../src/lib/content/compile-article-html.ts";
import { sanitize } from "../src/lib/sanitize.ts";

function pkg(overrides: Record<string, unknown> = {}) {
  return normalizeArticlePackage({
    title: "Test",
    slug: "test",
    excerpt: "excerpt",
    content_markdown: "## Quy trình 7 bước triển khai\n\nNội dung.\n",
    aio: {
      tldr: "Tóm tắt ngắn.",
      key_takeaways: ["Ý 1", "Ý 2", "Ý 3"],
      faq: [
        { question: "Câu 1?", answer: "Trả lời 1" },
        { question: "Câu 2?", answer: "Trả lời 2" },
        { question: "Câu 3?", answer: "Trả lời 3" },
      ],
    },
    references: [
      { title: "UNESCO guidance", url: "https://www.unesco.org/ai", source_type: "A" },
    ],
    seo: {
      title: "t",
      description: "d",
      primary_keyword: "k",
      secondary_keywords: ["a", "b"],
    },
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
  });
}

test("B01 placeholder with URL becomes native figure", async () => {
  const result = await compileArticleHtml(pkg({
    content_markdown: "## Mục\n\n{{IMAGE:img-01}}\n",
    inline_images: [{
      id: "img-01",
      purpose: "workflow",
      prompt: "p",
      alt: "Quy trình AI",
      caption: "Giáo viên vẫn kiểm duyệt.",
      url: "https://raw.githubusercontent.com/quanpl86/imgBlog/main/ai.webp",
    }],
  }));
  assert.match(result.html, /<figure class="kd-inline-figure">/);
  assert.match(result.html, /src="https:\/\/raw\.githubusercontent\.com\/quanpl86\/imgBlog\/main\/ai\.webp"/);
  assert.match(result.html, /alt="Quy trình AI"/);
  assert.match(result.html, /<figcaption>Giáo viên vẫn kiểm duyệt\.<\/figcaption>/);
  assert.doesNotMatch(result.html, /\{\{IMAGE:img-01\}\}/);
});

test("B02 invalid placeholder hard fails", async () => {
  await assert.rejects(
    () => compileArticleHtml(pkg({
      content_markdown: "## Mục\n\n{{IMAGE:img-99}}\n",
      inline_images: [],
    })),
    /UNKNOWN_IMAGE_PLACEHOLDER/
  );
});

test("B03 null URL removes placeholder cleanly", async () => {
  const result = await compileArticleHtml(pkg({
    content_markdown: "## Mục\n\nTrước\n\n{{IMAGE:img-01}}\n\nSau\n",
    inline_images: [{
      id: "img-01",
      purpose: "explainer",
      prompt: "p",
      alt: "a",
      url: null,
    }],
  }));
  assert.doesNotMatch(result.html, /\{\{IMAGE:img-01\}\}/);
  assert.doesNotMatch(result.html, /<img src=""/);
  assert.ok(result.warnings.some((issue) => issue.code === "MEDIA_URL_MISSING"));
});

test("B03b missing workflow image becomes a detailed holder", async () => {
  const result = await compileArticleHtml(pkg({
    content_markdown: "## Mục\n\n{{IMAGE:img-01}}\n",
    inline_images: [{
      id: "img-01",
      purpose: "explainer",
      prompt: "Lớp học STEM hiện đại, không chữ",
      alt: "Học sinh thực hành STEM",
      url: null,
      status: "missing",
      failure_reason: "Native upload failed twice",
    }],
  }));
  assert.match(result.html, /kd-image-holder/);
  assert.match(result.html, /ẢNH CẦN BỔ SUNG/);
  assert.match(result.html, /Native upload failed twice/);
  assert.match(result.html, /1280×720/);
});

test("image_placeholders mode renders editorial holders without generated assets", async () => {
  const result = await compileArticleHtml(pkg({
    article_mode: "image_placeholders",
    content_markdown: "## Mục\n\n{{IMAGE:img-01}}\n",
    inline_images: [{
      id: "img-01",
      purpose: "workflow",
      prompt: "Sơ đồ quy trình ba bước có khung rõ ràng và nhãn tiếng Việt chính xác",
      alt: "Sơ đồ ba bước triển khai hoạt động học tập trong lớp học",
      url: null,
      status: "missing",
      failure_reason: "EDITORIAL_PLACEHOLDER",
    }],
  }));
  assert.match(result.html, /kd-image-holder/);
  assert.match(result.html, /Sơ đồ quy trình ba bước/);
  assert.match(result.html, /EDITORIAL_PLACEHOLDER/);
});

test("B04 after_heading_id fallback inserts after the matching heading", async () => {
  const heading = "Quy trình 7 bước triển khai";
  const result = await compileArticleHtml(pkg({
    content_markdown: `## ${heading}\n\nĐoạn sau heading.\n`,
    inline_images: [{
      id: "img-01",
      purpose: "workflow",
      prompt: "p",
      alt: "Sơ đồ 7 bước",
      caption: "Workflow",
      url: "https://raw.githubusercontent.com/quanpl86/imgBlog/main/flow.webp",
      position: { after_heading_id: expectedHeadingId(heading) },
    }],
  }));
  assert.equal(expectedHeadingId(heading), "quy-trinh-7-buoc-trien-khai");
  const headingAt = result.html.indexOf(`id="quy-trinh-7-buoc-trien-khai"`);
  const figureAt = result.html.indexOf("kd-inline-figure");
  assert.ok(headingAt >= 0 && figureAt > headingAt);
});

test("B05 invalid heading id is a warning", async () => {
  const result = await compileArticleHtml(pkg({
    inline_images: [{
      id: "img-01",
      purpose: "comparison",
      prompt: "p",
      alt: "a",
      url: "https://raw.githubusercontent.com/quanpl86/imgBlog/main/x.webp",
      position: { after_heading_id: "heading-khong-ton-tai" },
    }],
  }));
  assert.doesNotMatch(result.html, /kd-inline-figure/);
  assert.ok(result.warnings.some((issue) => issue.code === "MEDIA_HEADING_NOT_FOUND"));
});

test("B06 takeaways render native details block", async () => {
  const result = await compileArticleHtml(pkg());
  assert.match(result.html, /<details class="kd-key-takeaways/);
  assert.match(result.html, /kd-takeaways-content/);
  assert.match(result.html, /<li>Ý 1<\/li>/);
  assert.doesNotMatch(result.html, /## 🎯/);
});

test("B07 FAQ renders native faq-block", async () => {
  const result = await compileArticleHtml(pkg());
  assert.match(result.html, /<details class="faq-block/);
  assert.match(result.html, /<div class="faq-answer/);
  assert.match(result.html, /Câu 1\?/);
  assert.doesNotMatch(result.html, /## ❓/);
});

test("B08 citations render native section", async () => {
  const result = await compileArticleHtml(pkg());
  assert.match(result.html, /<section class="kd-citations">/);
  assert.match(result.html, /Nguồn tham chiếu nghiên cứu \(Citations\):/);
  assert.match(result.html, /href="https:\/\/www\.unesco\.org\/ai"/);
  assert.doesNotMatch(result.html, /## 📚/);
});

test("B09/B10 sanitize keeps figure, img, details needed by public page", async () => {
  const result = await compileArticleHtml(pkg({
    content_markdown: "## Mục\n\n{{IMAGE:img-01}}\n",
    inline_images: [{
      id: "img-01",
      purpose: "case_study",
      prompt: "p",
      alt: "Case",
      caption: "Caption",
      url: "https://raw.githubusercontent.com/quanpl86/imgBlog/main/case.webp",
    }],
  }));
  const clean = sanitize(result.html);
  assert.match(clean, /kd-inline-figure/);
  assert.match(clean, /<img /);
  assert.match(clean, /faq-block/);
  assert.match(clean, /kd-key-takeaways/);
  assert.match(clean, /figcaption/);
});

test("B11/B12 compiled HTML matches Tiptap parse selectors", async () => {
  const result = await compileArticleHtml(pkg({
    content_markdown: "## Mục\n\n{{IMAGE:img-01}}\n",
    inline_images: [{
      id: "img-01",
      purpose: "explainer",
      prompt: "p",
      alt: "Alt",
      caption: "Cap",
      url: "https://raw.githubusercontent.com/quanpl86/imgBlog/main/e.webp",
    }],
  }));
  assert.match(result.html, /<details class="kd-key-takeaways/);
  assert.match(result.html, /class="kd-takeaways-content/);
  assert.match(result.html, /<details class="faq-block/);
  assert.match(result.html, /class="faq-answer/);
  assert.match(result.html, /<figure class="kd-inline-figure">/);
});

test("gold 5E/PBL fixture compiles to native gold structure", async () => {
  const fixturePath = path.join(import.meta.dirname, "fixtures/gold-article-v7.json");
  const raw = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const compiled = await compileArticleHtml(normalizeArticlePackage(raw));
  assert.match(compiled.html, /kd-key-takeaways/);
  assert.match(compiled.html, /faq-block/);
  assert.match(compiled.html, /kd-citations/);
  assert.match(compiled.html, /kd-inline-figure/);
  assert.match(compiled.html, /kd-direct-answer/);
  assert.match(
    compiled.html,
    new RegExp(`id="${expectedHeadingId("Cơ sở học thuật & bản chất công nghệ")}"`)
  );
  assert.doesNotMatch(compiled.html, /\{\{IMAGE:/);
  assert.doesNotMatch(compiled.html, /## 🎯|## ❓|## 📚/);
});
