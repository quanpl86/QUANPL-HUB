import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSystemSeo, SEO_SCORE_MIN, formatSeoGateError } from "../src/lib/content/seo-advisor.ts";

const passing = {
  title: "AI thiết kế học liệu mầm non: quy trình 5 bước an toàn",
  meta_title: "AI thiết kế học liệu mầm non: quy trình 5 bước an toàn",
  meta_description: "Hướng dẫn giáo viên mầm non dùng AI để thiết kế học liệu an toàn, kiểm chứng nội dung và bảo vệ dữ liệu trẻ trước khi đưa vào lớp học.",
  excerpt: "Quy trình 5 bước dùng AI thiết kế học liệu mầm non: xác định mục tiêu, tạo bản nháp, kiểm chứng, bảo vệ dữ liệu trẻ và thử nghiệm trước khi dùng.",
  image_url: "https://raw.githubusercontent.com/quanpl86/imgBlog/main/cover.png",
  image_alt: "Giáo viên mầm non thiết kế học liệu bằng AI",
  content: '<h2>Bước 1</h2><figure><img alt="sơ đồ" src="https://example.com/a.png"></figure><details class="faq-block"></details>',
  content_markdown: "## Bước 1\nAI thiết kế học liệu mầm non bắt đầu từ mục tiêu.\n\n## Bước 2\n{{IMAGE:img-01}}",
  primary_keyword: "AI thiết kế học liệu mầm non",
  faq_count: 3,
};

test("passing package reaches 95-100", () => {
  const report = analyzeSystemSeo(passing);
  assert.ok(report.score >= SEO_SCORE_MIN, `score ${report.score}`);
  assert.equal(report.failed.length, 0);
});

test("missing cover fails below 95", () => {
  const report = analyzeSystemSeo({ ...passing, image_url: null });
  assert.ok(report.score < SEO_SCORE_MIN);
  assert.ok(report.failed.some((item) => item.id === "cover_image"));
  assert.match(formatSeoGateError(report), /SEO_SCORE_/);
});

test("short meta title is not success", () => {
  const report = analyzeSystemSeo({ ...passing, meta_title: "AI mầm non" });
  assert.ok(report.failed.some((item) => item.id === "meta_title"));
});
