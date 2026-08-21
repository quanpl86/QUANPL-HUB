import { ARTICLE_MODE_CONFIG } from "./article-modes.ts";

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
    title: "5. Viết bài — tự do, chọn 1 trong 4 chế độ",
    items: [
      {
        text: ARTICLE_MODE_CONFIG.text_only.prompt_hint,
        note: "GPT research, viết và tạo draft ngay; không cover, không ảnh nội dung, không image holder.",
      },
      {
        text: ARTICLE_MODE_CONFIG.gpt_scenes.prompt_hint,
        note: "GPT research, viết rồi tạo tuần tự cover + 3 ảnh nội dung. Sau mỗi ảnh, dùng prompt “Tiếp tục nhé.” ở mục 6.",
      },
      {
        text: ARTICLE_MODE_CONFIG.structured_graphics.prompt_hint,
        note: "GPT tạo tuần tự 3 SVG thông tin có frame và chữ tiếng Việt chính xác; không bắt buộc cover.",
      },
      {
        text: ARTICLE_MODE_CONFIG.image_placeholders.prompt_hint,
        note: "Không tạo ảnh. Draft có brief cover trong alt text và 3 image holder chi tiết để reviewer bổ sung.",
      },
      {
        text: "Hãy viết bài về [chủ đề].",
        note: "Không nêu loại media thì mặc định dùng ảnh GPT.",
      },
    ],
  },
  {
    title: "6. Tiếp tục workflow bài có ảnh GPT",
    items: [
      { text: "Tiếp tục nhé.", note: "Upload native ảnh vừa tạo, nhận prompt ảnh kế tiếp; sau img-03 MCP tự tạo draft." },
      { text: "Tiếp tục bài đang dở.", note: "Tìm workflow active trên server và tiếp tục đúng bước, không research hoặc tạo lại bài." },
      { text: "Báo tiến độ bài đang dở, chưa thực hiện bước mới." },
    ],
  },
  {
    title: "7. Viết bài — theo tuần",
    items: [
      { text: "Tuần đã duyệt chưa? Đến hạn hoặc trễ hạn thì viết.", note: "Chỉ sau khi bấm Duyệt cả tuần." },
      { text: "Viết các bài đến hạn hôm nay." },
      { text: "Viết đúng 1 bài đến hạn: [tên bài]." },
      { text: "Viết bài theo calendar_id [id], không viết bài khác." },
    ],
  },
  {
    title: "8. Sửa bài bị trả",
    items: [
      { text: "Bài nào ChatGPT đã viết? Đã đăng, chờ đọc, hay đang bị trả?" },
      { text: "Check tuần. Có bài bị trả thì sửa draft." },
      { text: "Sửa bài bị trả: get_editorial_draft rồi update_blog_draft, đừng tạo bài mới. Ảnh mờ thì tạo lại cover/body." },
    ],
  },
  {
    title: "9. Ảnh / danh mục",
    items: [
      { text: "Tạo lại ảnh cho draft đang bị trả, giữ nguyên nội dung bài." },
      { text: "Tạo lại cover cho draft đang bị trả, PNG gốc 16:9 ≥1536×864, không chữ." },
      { text: "Tạo flow/chart/table cho draft đang bị trả, dùng SVG và required_labels tiếng Việt chính xác." },
      { text: "Tạo 1 cover 16:9 ≥1536px, minh họa giáo dục, sạch, rõ, không chữ, PNG gốc không nén." },
      { text: "Ảnh quy trình/bảng tiêu chí: required_labels tiếng Việt, layout_spec rubric_matrix hoặc workflow_steps. Đừng bảo model vẽ chữ." },
      { text: "Gắn danh mục có sẵn, đừng tạo danh mục mới." },
    ],
  },
];

export const EDITORIAL_PROMPT_KIT_NOTES = [
  "Mỗi lần gửi ChatGPT một câu.",
  "Khi viết bài, chọn đúng một trong bốn chế độ ảnh ở mục 5.",
  "Không nhờ GPT publish, duyệt tuần, hoặc xóa bài — những việc đó làm trên trang này.",
  "Đừng gộp viết tự do với viết theo tuần trong một tin.",
];
