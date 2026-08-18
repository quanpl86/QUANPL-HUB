export type PromptKitItem = {
  text: string;
  note?: string;
};

export type PromptKitSection = {
  title: string;
  items: PromptKitItem[];
};

export const EDITORIAL_PROMPT_KIT: PromptKitSection[] = [
  {
    title: "1. Lập lịch",
    items: [
      { text: "Đề xuất lịch tuần này, 3 bài. Chưa viết." },
      { text: "Đề xuất lịch tuần sau, 4 bài, bắt đầu 24/08. Chưa viết." },
    ],
  },
  {
    title: "2. Check lịch / trạng thái",
    items: [
      { text: "Tuần này đã có kế hoạch chưa?" },
      { text: "Báo trạng thái tuần hiện tại." },
      { text: "Báo lịch chi tiết: từng bài, ngày giờ, trạng thái, đã có nháp chưa." },
    ],
  },
  {
    title: "3. Check hạn / check bài",
    items: [
      { text: "Bài nào đến hạn, sắp đến hạn, trễ hạn, bị chặn?" },
      { text: "Check bài trong tuần: bài nào chờ đọc, bị trả, đã đăng." },
      { text: "Chỉ báo upcoming, chưa viết." },
    ],
  },
  {
    title: "4. Sửa lịch",
    items: [
      { text: "Sửa kế hoạch tuần.", note: "Sau khi bạn bấm Gửi yêu cầu sửa trên trang này." },
      { text: "Đọc lại rồi sửa. Đừng dùng revision cũ." },
      { text: "Sửa lịch tuần. Tôn trọng phần tôi bảo giữ." },
    ],
  },
  {
    title: "5. Viết bài — tự do",
    items: [
      { text: "Viết bài mới chế độ tự do, nội dung là [điền chủ đề]." },
    ],
  },
  {
    title: "6. Viết bài — theo tuần",
    items: [
      { text: "Tuần đã duyệt chưa? Đến hạn hoặc trễ hạn thì viết.", note: "Chỉ sau khi bấm Duyệt cả tuần." },
      { text: "Viết các bài đến hạn hôm nay." },
      { text: "Viết đúng 1 bài đến hạn: [tên bài]." },
      { text: "Viết bài theo calendar_id [id], không viết bài khác." },
    ],
  },
  {
    title: "7. Sửa bài bị trả",
    items: [
      { text: "Check tuần. Có bài bị trả thì sửa draft." },
      { text: "Sửa bài bị trả. Dùng update_blog_draft, đừng tạo bài mới." },
    ],
  },
  {
    title: "8. Ảnh / danh mục",
    items: [
      { text: "Tạo lại cover, giữ 2 ảnh body." },
      { text: "Gắn danh mục có sẵn, đừng tạo danh mục mới." },
    ],
  },
];

export const EDITORIAL_PROMPT_KIT_NOTES = [
  "Mỗi lần gửi ChatGPT một câu.",
  "Không nhờ GPT publish, duyệt tuần, hoặc xóa bài — những việc đó làm trên trang này.",
  "Đừng gộp viết tự do với viết theo tuần trong một tin.",
];
