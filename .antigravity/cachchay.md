# 🐉 HƯỚNG DẪN VẬN HÀNH QUAN-PL HUB — CONTENT OS (v2.6 Platinum)

Tài liệu hướng dẫn cách khởi chạy và quản lý hệ thống tự động hóa NotebookLM sử dụng kiến trúc Event-Driven (BullMQ), Neural Sync và MCP Server tích hợp.

---

## 🛠️ ĐIỀU KIỆN TIÊN QUYẾT
Hệ thống lõi yêu cầu **Redis Server** phải hoạt động để quản lý hàng đợi tác vụ một cách ổn định.
- **Cài đặt (Mac):** `brew install redis`
- **Khởi chạy ngầm:** `brew services start redis` (khuyên dùng)
- Đảm bảo file `.env` đã được cấu hình đầy đủ (Supabase Keys, Ports, Storage Paths...).

---

## 1. Cứu hộ Bảo mật (Khởi tạo Phiên Đăng Nhập)
Thực hiện bước này nếu là **lần chạy đầu tiên** hoặc khi hệ thống báo lỗi **Cookie hết hạn**.
- **Thư mục:** `/services`
- **Lệnh:** `npm run auth`
- **Cách làm:** Một cửa sổ trình duyệt Chromium sẽ hiện ra -> Hãy đăng nhập tài khoản Google của bạn -> Đợi trang NotebookLM tải xong -> Quay lại Terminal bấm `Ctrl + C` để đóng và lưu trữ phiên bản mã hoá (ChaCha20).

---

## 2. Khởi chạy Dashboard Server (Trung tâm Điều khiển & Neural Sync)
API Server này phục vụ cả Giao diện điều khiển (UI), Hệ thống theo dõi Queue (Bull Board), và tự động kích hoạt tiến trình rình rập thư mục (Neural Sync).
- **Thư mục:** `/services`
- **Lệnh:** `npm run dashboard`
- **Trang Dashboard Tổng (Control Center):** `http://localhost:3005`
- **Giao diện Giám sát Hàng đợi (Bull Board):** `http://localhost:3005/admin/queues`

---

## 3. Khởi chạy Main Worker (Linh hồn Xử lý AI)
Worker hoạt động theo cơ chế lắng nghe Queue (Listener) và tự động spawn MCP Server bên trong nó. Cực kỳ bền bỉ và tiết kiệm tài nguyên.
- **Thư mục:** `/services`
- **Lệnh:** `npm run dev` (hoặc `npm run start` ở Production)

**Điểm nổi bật của v2.6 Platinum:**
- Khi khởi động, Worker tự động kết nối MCP, sau đó tự quét Database để vớt và khôi phục (Recover) các task bị kẹt do lỗi crash trước đó.
- Chỉ gọi MCP AI xử lý khi có Job đẩy vào Redis.
- Tự động thử lại (Auto-Retry) với cơ chế Exponential Backoff.
- Báo cáo Metrics theo thời gian thực về Dashboard qua port `3030`.

---

## 4. Quy trình xử lý Task (Workflow)
1. **Tạo Task:** Bấm "Tạo Notebook" hoặc đẩy file trực tiếp vào thư mục local (Neural Sync).
2. **Đẩy vào Queue:** Dashboard API nhận diện thay đổi và tự đẩy yêu cầu vào BullMQ (Redis).
3. **Xử lý:** Worker nhận tín hiệu từ Queue, điều khiển MCP Server làm việc với NotebookLM.
4. **Giám sát:** Bạn có thể theo dõi mọi tiến độ, log hệ thống, và sự cố ngay tại `http://localhost:3005`.

---

### ⚠️ Lưu ý quan trọng:
- **Thứ tự khởi chạy bắt buộc:** 1. Redis ➡️ 2. `npm run auth` (nếu cần) ➡️ 3. `npm run dashboard` ➡️ 4. `npm run dev`.
- **Redis Offline:** Nếu Redis không chạy, cả Dashboard API và Worker đều sẽ báo lỗi sập hệ thống (Global Error Handler).
- **Headless Mode:** Mặc định hệ thống AI chạy ẩn (Stealth mode). Để hiện UI trình duyệt của AI lên lúc nó đang làm việc, chỉnh `NLMCP_HEADLESS=false` trong `.env`.