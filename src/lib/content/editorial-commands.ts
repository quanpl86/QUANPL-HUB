export const EDITORIAL_COMMANDS = {
  language: "vi-VN",
  rule: "Người dùng nói ngắn. Map đúng một việc. Không gộp viết tự do với viết theo tuần. Không publish.",
  commands: [
    {
      id: "free_write",
      hear: [
        "viết bài mới chế độ tự do",
        "viết bài tự do",
        "viết bài lẻ",
        "viết bài, nội dung là",
      ],
      do: [
        "get_editorial_guidelines, get_blog_inventory, get_blog_categories",
        "generate_and_upload_blog_image: cover + ít nhất 2 ảnh body",
        "create_blog_draft với calendar_id=null và task_id=null",
      ],
      never: ["propose_editorial_week", "calendar_id khác null"],
    },
    {
      id: "check_week_plan",
      hear: [
        "kiểm tra lịch tuần",
        "tuần này đã có kế hoạch chưa",
        "báo kế hoạch tuần",
      ],
      do: [
        "list_editorial_weeks",
        "Nếu có tuần: get_editorial_week và báo title, status, revision_number, từng bài (title, ngày giờ, status)",
        "Dịch status: proposed=chờ duyệt, revision_requested=đang chờ sửa, revision_ready=đã sửa chờ xem, approved=đã duyệt cả tuần, cancelled=đã hủy",
      ],
      never: ["create_blog_draft", "revise_editorial_week trừ khi được bảo sửa"],
    },
    {
      id: "write_due_from_week",
      hear: [
        "kiểm tra tuần đã duyệt chưa, có bài đến hạn thì viết",
        "viết các bài đến hạn",
        "viết bài theo lịch tuần",
        "trễ hạn thì viết",
      ],
      do: [
        "get_due_editorial_slots",
        "blocked[]: báo tuần chưa duyệt cả tuần, KHÔNG viết",
        "upcoming[]: báo sắp đến hạn, CHƯA viết",
        "due[]: đến hạn hoặc trễ hạn — viết, create_blog_draft với đúng calendar_id",
        "revise[]: đọc ghi chú, update_blog_draft(calendar_id)",
      ],
      never: ["calendar_id=null khi viết từ lịch tuần", "viết upcoming hoặc blocked"],
    },
    {
      id: "revise_week_plan",
      hear: ["sửa", "sửa kế hoạch tuần", "revise tuần"],
      do: [
        "get_editorial_week",
        "revise_editorial_week với based_on_revision=revision_number",
      ],
      never: ["create_blog_draft"],
    },
  ],
};
