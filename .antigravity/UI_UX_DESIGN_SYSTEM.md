# UI/UX DESIGN SYSTEM & GUIDELINES

Tài liệu này là bộ quy chuẩn UI/UX bắt buộc dành cho mọi AI Agent (đặc biệt là Role 2: The Cyber-Designer) khi xây dựng các component và layout cho **QUAN-PL BLOG-HUB**. Mục tiêu là đảm bảo tính nhất quán tuyệt đối về thị giác và trải nghiệm người dùng trên toàn hệ thống.

## 1. NGÔN NGỮ THIẾT KẾ (DESIGN LANGUAGE)
- **Phong cách chủ đạo:** Neo-Brutalist Cyber-Tech.
- **Tinh thần:** Kỹ thuật, cơ học, dứt khoát, hiện đại nhưng không lòe loẹt.
- **Đặc trưng thị giác:**
  - Viền đậm, nổi khối (Brutalist Borders).
  - Vát góc cơ khí (Cyber-cuts).
  - Họa tiết nền mang tính công nghệ (Grid, Radar, Hexagon).
  - **Glow & Hard Shadows:** Kết hợp ánh sáng mờ (Glow) trong bóng tối và đổ bóng cứng (Hard Shadow) để tạo chiều sâu.

## 2. QUY TẮC PHÁT TRIỂN SONG HÀNH DARK / LIGHT MODE (BẮT BUỘC)
Mọi component, layout khi được tạo ra **phải luôn được code song song cho cả giao diện Sáng (Light) và Tối (Dark)**.
- Hệ thống sử dụng Tailwind CSS v4 với cấu hình chế độ Dark dựa trên System Preferences hoặc tuỳ chọn của người dùng (nút Toggle).
- Các class màu sắc phải luôn đi theo cặp: ví dụ `bg-slate-50 dark:bg-cyber-black`.

### Bảng Ma trận Màu sắc Đa chế độ (Semantic Tokens Matrix)

| Token | Chế độ Sáng (Light) | Chế độ Tối (Dark) | Áp dụng cho |
| :--- | :--- | :--- | :--- |
| `--background` | `Slate 50` (#f8fafc) | `Cyber Gray` (#121212) | Nền toàn trang |
| `--foreground` | `Slate 900` (#0f172a) | `Slate 50` (#f8fafc) | Chữ chính, tiêu đề |
| `--muted` | `Slate 600` (#475569) | `Slate 400` (#94a3b8) | Chữ phụ, chú thích |
| `--card-bg` | `White` (#ffffff) | `Cyber Black` (#050505) | Nền Card, Modal |
| `--card-border` | `Slate 900` (Op: 0.1) | `Brand Orange` (Op: 0.3) | Viền khối nội dung |
| `--brand` | `Orange` (#f97316) | `Orange` (#f97316) | Nhấn thương hiệu |

## 3. QUY TẮC TƯƠNG TÁC (INTERACTION & ANIMATION RULES)
- **Tránh sự mềm mại quá mức:** Các hiệu ứng chuyển động không nên dùng kiểu "mềm mại, nảy" (bouncy/springy) của các web thời trang. Hãy dùng kiểu "cơ khí, chớp nháy" (crisp, mechanical, ease-in-out nhanh).
- **Glow Effects:** Ở chế độ Dark Mode, các phần tử quan trọng khi được Hover sẽ phát sáng (Glow). Ở chế độ Light Mode, hiệu ứng này sẽ chuyển thành bóng đổ khối cứng (Solid Shadow).
- **Phản hồi tức thì:** Mọi nút bấm, link khi chạm vào phải có phản hồi thị giác ngay lập tức (Scale down, đổi màu viền, hoặc chớp tắt).

## 4. CHUẨN RESPONSIVE ĐA THIẾT BỊ (BẮT BUỘC)
Mọi Layout đều phải thiết kế theo triết lý **Mobile-First** (thiết kế cho điện thoại trước, sau đó phóng to dần). Hệ thống sử dụng 3 mốc màn hình (Breakpoints) tiêu chuẩn của Tailwind v4:

### 4.1. Điện thoại (Mobile - Dưới 768px)
- **Class áp dụng:** Class mặc định (không có tiền tố).
- **Quy tắc Layout:** Xếp chồng dọc 1 cột (`flex-col` hoặc `grid-cols-1`). 
- **Quy tắc UI:** Thanh điều hướng (Header) phải thu gọn thành Hamburger Menu. Nút bấm phải đủ to (min-height 44px) để dễ chạm. Các mô hình 3D phức tạp phải chuyển sang dạng ảnh tĩnh (Fallback) để tiết kiệm pin và dữ liệu mạng.

### 4.2. Máy tính bảng (Tablet - Màn hình từ 768px đến 1024px)
- **Class áp dụng:** Tiền tố `md:` (ví dụ: `md:grid-cols-2`).
- **Quy tắc Layout:** Sử dụng lưới 2 cột. Các khối nội dung bắt đầu có khoảng trắng (padding/margin) lớn hơn để mắt nghỉ.
- **Quy tắc UI:** Thanh điều hướng hiển thị đầy đủ. Các thanh công cụ phụ (Sidebar) có thể ẩn đi hoặc thu nhỏ dạng biểu tượng (Icons).

### 4.3. Laptop / Màn hình lớn (Desktop - Màn hình từ 1024px trở lên)
- **Class áp dụng:** Tiền tố `lg:` và `xl:`.
- **Quy tắc Layout:** Sử dụng lưới 3-4 cột (`lg:grid-cols-3`). Giao diện dàn trải toàn màn hình, sử dụng tối đa không gian trống (Negative Space) theo phong cách Brutalism.
- **Quy tắc UI:** Kích hoạt toàn bộ hiệu ứng 3D, WebGL. Cột thông tin phụ (Sidebar) hiển thị cố định. Các hiệu ứng rê chuột (Hover) như Glow, Scale được ưu tiên hiển thị mạnh mẽ.

## 6. QUY CHUẨN GIAO DIỆN BỀN BỈ (RESILIENT UI PATTERNS)
Để tránh lỗi màn hình đen hoặc nội dung không hiển thị khi truy cập qua mạng LAN/Thiết bị di động:

- **6.1. Hydration-Safe Mounting:**
  - Luôn sử dụng trạng thái `isMounted` để kiểm soát các thành phần phụ thuộc vào Client (Framer Motion).
  - Tránh trả về `null` hoặc một đoạn HTML trống khi chưa mount. Thay vào đó, trả về một bản dựng tĩnh (Skeleton/Static fallback).

- **6.2. Animation Resilience:**
  - Cấu hình `initial={isMounted ? "hidden" : "visible"}`. Điều này đảm bảo nếu JavaScript bị lỗi, nội dung vẫn hiển thị ở trạng thái `visible`.
  - Hạn chế sử dụng Imperative Animation (`controls.start()`) cho các thành phần chính của trang.

- **6.3. Graphic Optimization for Remote Access:**
  - Không sử dụng hiệu ứng `blur` vượt quá `80px` cho các thiết bị di động (Mobile).
  - Sử dụng `perspective` và `preserve-3d` một cách cẩn trọng, luôn có fallback cho các trình duyệt không hỗ trợ 3D tốt (như Safari cũ).

## 7. KIỂM ĐỊNH AI AGENT (CHECKLIST KHI VIẾT CODE UI)
Bất cứ khi nào Agent tạo/sửa đổi UI, phải kiểm tra danh sách này trước khi hoàn thành:
- [x] Code có class `dark:` đi kèm chưa? (Ví dụ: `text-black dark:text-white`).
- [x] Component có tuân thủ thiết kế vát góc (Cyber-cut) ở nút bấm quan trọng không?
- [x] Màu sắc đang sử dụng có nằm trong Bảng Token cho phép không?
- [x] Đã áp dụng cơ chế **Resilient UI** (Hiển thị ngay cả khi lỗi Animation) chưa?
- [x] Hiệu ứng Hover/Active có phù hợp với cảm giác "cơ học" không?
- [x] Trên giao diện Mobile, layout có bị vỡ hoặc các khối viền Brutalist có chiếm quá nhiều diện tích không?
