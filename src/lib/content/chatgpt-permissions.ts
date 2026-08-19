export const CHATGPT_MCP_PERMISSIONS = {
  github_upload: true,
  github_repo: "quanpl86/imgBlog",
  github_path: "public/editor-assets/",
  allow: [
    "upload_github_image — ghi PNG gốc lên GitHub imgBlog (token Hub, không cần GitHub login riêng)",
    "upload_blog_image / generate_and_upload_blog_image — QA rồi lưu bản versioned trên GitHub",
    "create_blog_draft / update_blog_draft",
    "propose_editorial_week / revise_editorial_week / revise_editorial_slot",
    "add_editorial_comment",
    "đọc inventory, taxonomy, policy, lịch tuần, draft",
  ],
  deny: [
    "publish / đăng bài",
    "duyệt tuần / duyệt bài",
    "xóa bài / xóa tuần",
    "ghi GitHub ngoài public/editor-assets/",
  ],
} as const;
