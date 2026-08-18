import { foldTaxonomyText } from "./taxonomy.ts";

export type SeoCheckStatus = "success" | "warning" | "error";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  message: string;
  suggestion: string;
};

export type SeoReport = {
  score: number;
  checks: SeoCheck[];
  failed: SeoCheck[];
};

export type SeoAdvisorInput = {
  title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  excerpt?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  content?: string | null;
  content_markdown?: string | null;
  primary_keyword?: string | null;
  faq_count?: number;
};

const TARGET_SCORE = 95;

function hasHttpsUrl(value?: string | null): boolean {
  if (!value?.trim()) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function containsKeyword(haystack: string | null | undefined, keyword: string | null | undefined): boolean {
  if (!haystack || !keyword) return false;
  return foldTaxonomyText(haystack).includes(foldTaxonomyText(keyword));
}

function headingCount(markdown: string, html: string): number {
  const fromMd = (markdown.match(/^#{2,3}\s+/gm) || []).length;
  const fromHtml = (html.match(/<h[23]\b/gi) || []).length;
  return Math.max(fromMd, fromHtml);
}

export function analyzeSystemSeo(input: SeoAdvisorInput): SeoReport {
  const metaTitle = input.meta_title?.trim() || "";
  const metaDescription = input.meta_description?.trim() || "";
  const excerpt = input.excerpt?.trim() || "";
  const content = input.content || "";
  const markdown = input.content_markdown || "";
  const keyword = input.primary_keyword?.trim() || "";

  const checks: SeoCheck[] = [
    {
      id: "meta_title",
      label: "Tiêu đề Meta",
      status: !metaTitle
        ? "error"
        : metaTitle.length >= 50 && metaTitle.length <= 70
          ? "success"
          : "warning",
      message: !metaTitle
        ? "Thiếu Tiêu đề Meta. Đây là yếu tố sống còn để xuất hiện trên kết quả tìm kiếm."
        : metaTitle.length < 50
          ? `Tiêu đề quá ngắn (${metaTitle.length} ký tự). Mục tiêu nên từ 50-70 ký tự.`
          : metaTitle.length > 70
            ? `Tiêu đề quá dài (${metaTitle.length} ký tự). Google sẽ cắt bớt phần thừa.`
            : "Độ dài hoàn hảo để hiển thị tốt nhất trên công cụ tìm kiếm.",
      suggestion: "Sử dụng từ khóa chính ngay ở đầu tiêu đề và giữ độ dài trong khoảng 50-70 ký tự.",
    },
    {
      id: "meta_description",
      label: "Mô tả Meta",
      status: !metaDescription
        ? "error"
        : metaDescription.length >= 120 && metaDescription.length <= 160
          ? "success"
          : "warning",
      message: !metaDescription
        ? "Thiếu Mô tả Meta. Công cụ tìm kiếm sẽ tự chọn nội dung ngẫu nhiên để hiển thị."
        : metaDescription.length < 120
          ? `Mô tả quá ngắn (${metaDescription.length} ký tự). Nên từ 120-160 ký tự.`
          : metaDescription.length > 160
            ? `Mô tả quá dài (${metaDescription.length} ký tự). Sẽ bị cắt bớt khi hiển thị.`
            : "Độ dài tối ưu giúp tăng tỷ lệ người dùng bấm vào bài viết (CTR).",
      suggestion: "Tóm tắt nội dung hấp dẫn, chứa từ khóa chính và lời kêu gọi hành động.",
    },
    {
      id: "excerpt",
      label: "Đoạn trích (Excerpt)",
      status: !excerpt ? "error" : excerpt.length >= 50 ? "success" : "warning",
      message: !excerpt
        ? "Thiếu đoạn trích. Rất quan trọng để hiển thị bản xem trước và cho AI tóm tắt."
        : excerpt.length < 50
          ? "Đoạn trích quá ngắn. AI có thể gặp khó khăn khi hiểu nội dung chính."
          : "Độ dài đoạn trích tốt cho việc lập chỉ mục hệ thống.",
      suggestion: "Viết một đoạn dẫn nhập thu hút từ 50-160 ký tự để làm nổi bật nội dung.",
    },
    {
      id: "cover_image",
      label: "Tài nguyên hình ảnh",
      status: hasHttpsUrl(input.image_url) ? "success" : "error",
      message: hasHttpsUrl(input.image_url)
        ? "Đã phát hiện hình ảnh đại diện chất lượng."
        : "Thiếu ảnh đại diện. Bài viết có hình ảnh tăng 80% khả năng được click.",
      suggestion: "Luôn thêm ảnh đại diện sắc nét, liên quan đến nội dung bài viết.",
    },
    {
      id: "cover_alt",
      label: "Alt text ảnh bìa",
      status: input.image_alt?.trim() ? "success" : "error",
      message: input.image_alt?.trim()
        ? "Ảnh bìa đã có mô tả alt."
        : "Thiếu alt text ảnh bìa.",
      suggestion: "Viết alt tiếng Việt, mô tả đúng nội dung ảnh bìa và chứa từ khóa chính khi tự nhiên.",
    },
    {
      id: "inline_alt",
      label: "Alt Text Nội dung",
      status: content.includes("alt=") || markdown.includes("{{IMAGE:") ? "success" : "warning",
      message: content.includes("alt=") || markdown.includes("{{IMAGE:")
        ? "Các hình ảnh trong bài viết đã có thuộc tính mô tả (alt)."
        : "Một số hình ảnh trong nội dung có thể thiếu mô tả (alt).",
      suggestion: "Đảm bảo mọi hình ảnh chèn trong bài viết đều có thẻ Alt.",
    },
    {
      id: "keyword_in_title",
      label: "Từ khóa trong tiêu đề",
      status: containsKeyword(metaTitle || input.title, keyword) ? "success" : "error",
      message: containsKeyword(metaTitle || input.title, keyword)
        ? "Từ khóa chính xuất hiện trong tiêu đề."
        : "Từ khóa chính chưa có trong tiêu đề / meta title.",
      suggestion: "Đặt primary_keyword gần đầu seo.title và title.",
    },
    {
      id: "keyword_in_intro",
      label: "Từ khóa trong mở bài",
      status: containsKeyword(excerpt, keyword) || containsKeyword(markdown.slice(0, 500), keyword)
        ? "success"
        : "error",
      message: containsKeyword(excerpt, keyword) || containsKeyword(markdown.slice(0, 500), keyword)
        ? "Từ khóa chính xuất hiện trong excerpt hoặc đoạn mở."
        : "Từ khóa chính chưa xuất hiện trong excerpt / 10% đầu nội dung.",
      suggestion: "Nhắc primary_keyword tự nhiên trong excerpt và đoạn mở bài.",
    },
    {
      id: "heading_hierarchy",
      label: "Hệ thống tiêu đề H2/H3",
      status: headingCount(markdown, content) >= 2 ? "success" : "warning",
      message: headingCount(markdown, content) >= 2
        ? "Đã có hệ thống heading H2/H3."
        : "Chưa đủ heading mô tả. Cần ít nhất 2 tiêu đề H2/H3.",
      suggestion: "Chia bài thành các H2/H3 mô tả đúng ý định tìm kiếm, không clickbait.",
    },
    {
      id: "faq",
      label: "FAQ / AIO",
      status: (input.faq_count || 0) >= 3 || content.includes("faq-block") ? "success" : "warning",
      message: (input.faq_count || 0) >= 3 || content.includes("faq-block")
        ? "Đã có FAQ phục vụ AIO."
        : "Thiếu FAQ. Nên có 3-6 câu hỏi.",
      suggestion: "Thêm aio.faq với 3-6 câu hỏi người dùng thật sự tìm.",
    },
  ];

  const passed = checks.filter((item) => item.status === "success").length;
  const score = Math.round((passed / checks.length) * 100);
  return {
    score,
    checks,
    failed: checks.filter((item) => item.status !== "success"),
  };
}

export const SEO_SCORE_MIN = TARGET_SCORE;

export function formatSeoGateError(report: SeoReport): string {
  const details = report.failed
    .map((item) => `${item.id}: ${item.message}`)
    .join(" | ");
  return `QUALITY_GATE_FAILED: SEO_SCORE_${report.score}: cần >= ${TARGET_SCORE}. ${details}`;
}
