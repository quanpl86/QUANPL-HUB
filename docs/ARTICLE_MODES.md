# Chế độ viết bài qua ChatGPT + KingDragonHub MCP

Người dùng chỉ cần nêu chủ đề và nhu cầu hình ảnh. MCP tự chọn `article_mode`, research, viết nội dung và tạo draft chờ review. Không mode nào tự publish.

## 1. Chỉ viết nội dung (`text_only`)

Prompt ngắn:

> Hãy viết bài không ảnh về [chủ đề].

GPT research rồi tạo draft ngay. Bài không có cover, ảnh nội dung hoặc image holder.

## 2. Ảnh minh họa ChatGPT (`gpt_scenes`)

Prompt ngắn:

> Hãy viết bài có ảnh GPT về [chủ đề].

Nếu chỉ nói “Hãy viết bài về…”, đây là mode mặc định. GPT research, viết bài, tạo lần lượt cover → img-01 → img-02 → img-03. Mỗi ảnh được bridge bằng native file attachment; người dùng nói “Tiếp tục nhé” để tiến tới bước kế tiếp. Sau ảnh cuối, MCP tạo draft.

## 3. Flow, chart, table (`structured_graphics`)

Prompt ngắn:

> Hãy viết bài có flow/chart/table về [chủ đề].

GPT research rồi tạo tuần tự ba SVG thông tin bằng `generate_and_upload_blog_image`. Nhãn tiếng Việt chính xác được truyền qua `required_labels`. Mode này không bắt buộc ảnh cover.

## 4. Giữ chỗ ảnh (`image_placeholders`)

Prompt ngắn:

> Hãy viết bài để placeholder ảnh về [chủ đề].

GPT không gọi công cụ tạo ảnh. Draft gồm brief cover chi tiết trong `prompt` và `alt`, cùng đúng ba holder `img-01`–`img-03` tại vị trí nội dung phù hợp. Mỗi holder hiển thị prompt, alt, caption và lý do cần bổ sung ảnh. Email có tiêu đề `[CẦN BỔ SUNG ẢNH]`; draft bị khóa publish tới khi reviewer thay đủ ảnh.

## Quy tắc định tuyến

- Từ khóa “không ảnh” chọn `text_only`.
- Từ khóa “ảnh GPT”, “ảnh minh họa” chọn `gpt_scenes`.
- Từ khóa “flow”, “chart”, “table”, “biểu đồ”, “framework”, “timeline” chọn `structured_graphics`.
- Từ khóa “placeholder”, “giữ chỗ ảnh”, “để người review bổ sung ảnh” chọn `image_placeholders`.
- Yêu cầu viết bài không nói rõ media mặc định dùng `gpt_scenes`.
- Khi người dùng chỉ nói “Tiếp tục”, GPT phải resume workflow đang active, không research hay tạo lại bài.
