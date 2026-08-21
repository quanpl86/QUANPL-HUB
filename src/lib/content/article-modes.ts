export const ARTICLE_MODES = [
  "text_only",
  "gpt_scenes",
  "structured_graphics",
  "image_placeholders",
] as const;

export type ArticleMode = (typeof ARTICLE_MODES)[number];

export const DEFAULT_ARTICLE_MODE: ArticleMode = "gpt_scenes";

export const ARTICLE_MODE_CONFIG = {
  text_only: {
    label_vi: "Chỉ nội dung, không ảnh",
    prompt_hint: "Hãy viết bài không ảnh về…",
    route: "research → create_blog_draft(article_mode=text_only)",
    media: "Không tạo cover, không tạo ảnh nội dung, không chèn {{IMAGE:*}}.",
  },
  gpt_scenes: {
    label_vi: "Ảnh minh họa tạo bởi ChatGPT",
    prompt_hint: "Hãy viết bài có ảnh GPT về…",
    route: "research → start_article_workflow → ChatGPT Images tuần tự cover, img-01, img-02, img-03 → draft",
    media: "Đúng 1 cover và 3 ảnh nội dung, dùng native file attachment, không base64.",
  },
  structured_graphics: {
    label_vi: "Flow, chart, table hoặc framework có text",
    prompt_hint: "Hãy viết bài có biểu đồ/flow về…",
    route: "research → generate_and_upload_blog_image tuần tự img-01..img-03 → create_blog_draft(article_mode=structured_graphics)",
    media: "Không bắt buộc cover; đúng 3 SVG thông tin có frame và nhãn tiếng Việt chính xác.",
  },
  image_placeholders: {
    label_vi: "Giữ chỗ và brief ảnh chi tiết",
    prompt_hint: "Hãy viết bài để placeholder ảnh về…",
    route: "research → create_blog_draft(article_mode=image_placeholders)",
    media: "Không tạo ảnh. Cover có brief chi tiết trong prompt và alt; đúng 3 vị trí {{IMAGE:img-01..03}} hiển thị holder kèm brief.",
  },
} as const satisfies Record<ArticleMode, {
  label_vi: string;
  prompt_hint: string;
  route: string;
  media: string;
}>;

export const ARTICLE_MODE_ROUTING_INSTRUCTIONS = [
  "ARTICLE_MODE_ROUTING_V1.",
  "Infer article_mode from the user's wording; if they explicitly name a mode, never switch lanes.",
  "Default is gpt_scenes only when the user simply asks to write an article without specifying media.",
  "text_only: no image tools and no image placeholders; create the draft after research.",
  "gpt_scenes: use the resumable native ChatGPT Images workflow; never parallel and never base64.",
  "structured_graphics: call generate_and_upload_blog_image sequentially for img-01, img-02, img-03, then create the draft; exact Vietnamese labels belong in required_labels.",
  "image_placeholders: do not call image tools; create the draft with a detailed cover brief and exactly three detailed inline holders.",
  "Never publish. Never silently substitute one article mode for another.",
].join(" ");

export function normalizeArticleMode(value: unknown): ArticleMode {
  return ARTICLE_MODES.includes(value as ArticleMode)
    ? value as ArticleMode
    : DEFAULT_ARTICLE_MODE;
}
