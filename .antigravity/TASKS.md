# 📝 DANH MỤC NHIỆM VỤ CHI TIẾT (AI AGENT TASK LIST)

Tài liệu này dùng để điều phối hoạt động của AI Agent bám sát Master Plan.

---

## 🏗️ GIAI ĐOẠN 1: WEBHOOK & HOÀN THIỆN NỀN TẢNG
- [ ] **Task 1.1:** Tạo API Route `/api/webhooks/worker` trên Next.js để nhận tín hiệu từ Worker.
- [ ] **Task 1.2:** Thiết lập cơ chế bảo mật (Auth Header) cho Webhook.
- [ ] **Task 1.3:** Cấu hình tự động Retry nếu Worker gặp lỗi kết nối MCP.

## 🎙️ GIAI ĐOẠN 2: DÂY CHUYỀN MULTIMEDIA (AUDIO/VIDEO)
- [ ] **Task 2.1:** Nâng cấp `worker.ts` để nhận diện `task_type` (`BLOG`, `AUDIO`, `VIDEO`).
- [ ] **Task 2.2:** Lập trình luồng Polling: Gọi `getAudioStatus` mỗi 30 giây cho đến khi `ready`.
- [ ] **Task 2.3:** Tích hợp tải file: Tải MP3 từ MCP -> Đẩy lên Supabase Storage -> Lưu URL vào DB.
- [ ] **Task 2.4:** Tương tự Task 2.3 cho Video (phong cách Heritage).

## 🔬 GIAI ĐOẠN 3: NGHIÊN CỨU SÂU (DEEP RESEARCH)
- [ ] **Task 3.1:** Xây dựng luồng "Tiền xử lý": Gọi `deepResearch` lấy thông tin Web trước khi viết bài.
- [ ] **Task 3.2:** Tự động nạp kết quả nghiên cứu vào NotebookLM dưới dạng "Text Source".
- [ ] **Task 3.3:** Sử dụng `generateDataTable` để trích xuất JSON so sánh.

## 🖥️ GIAI ĐOẠN 4: UI ADMIN STUDIO
- [ ] **Task 4.1:** Tạo Component `MultimediaStudio` trong trang Admin.
- [ ] **Task 4.2:** Kết nối Supabase Realtime để hiển thị tiến độ "AI đang làm việc" mà không cần F5 trang.
- [ ] **Task 4.3:** Thêm chức năng xem trước (Preview) Audio/Video ngay trong Admin.

## 💎 GIAI ĐOẠN 5: FRONTEND PREMIUM COMPONENTS
- [ ] **Task 5.1:** Xây dựng `AudioPlayer` component đẹp mắt cho Blog.
- [ ] **Task 5.2:** Xây dựng `VideoPlayer` hỗ trợ Lazy Loading.
- [ ] **Task 5.3:** Thiết kế bảng dữ liệu (Data Table) hiển thị từ JSON.

## 🖥️ GIAI ĐOẠN 6: LOCAL CONTROL CENTER (DASHBOARD TRÊN MAC)
- [ ] **Task 6.1:** Khởi tạo App Local (Next.js hoặc Electron nhẹ) chạy trên port 3001.
- [ ] **Task 6.2:** Xây dựng UI theo dõi tiến độ Worker bằng Supabase Realtime.
- [ ] **Task 6.3:** Implement `fs-watch` để tự động đẩy tài liệu từ một thư mục chỉ định lên NotebookLM.
- [ ] **Task 6.4:** Nút "One-click Re-auth" để xử lý nhanh lỗi mất Session Google.

---
### 🤖 HƯỚNG DẪN CHO AI AGENT:
1. Đọc file này trước khi bắt đầu bất kỳ Task nào.
2. Sau khi hoàn thành 1 Task, cập nhật `[x]`.
3. Đồng thời cập nhật bảng tiến độ tại `MASTER_PLAN.md`.
4. Nếu có lỗi phát sinh, ghi chú vào phần `Xử lý lỗi` cuối file này.

---
*Cập nhật lần cuối: 30/04/2026 bởi Antigravity Agent.*
