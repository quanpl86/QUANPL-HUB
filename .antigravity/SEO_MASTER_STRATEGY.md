# CHIẾN LƯỢC SEO TOÀN DIỆN (SEO MASTER STRATEGY)

Tài liệu này quy định các tiêu chuẩn SEO bắt buộc cho **QUAN-PL BLOG-HUB**, nhằm mục đích đưa thương hiệu cá nhân **QUÂN PL** cùng các bài viết về STEM, 3D, Công nghệ lên Top đầu tìm kiếm. 

AI Agent làm việc trên dự án này phải đảm bảo mọi tính năng và kiến trúc đều phục vụ cho chiến lược dưới đây.

## 1. KIẾN TRÚC SEO (TECHNICAL SEO)

### 1.1. Server-Side Rendering (SSR) & Static Site Generation (SSG)
- Sử dụng Next.js App Router mặc định cho mọi trang Blog.
- Các bài viết blog phải được render từ server (SSR) hoặc được tạo sẵn tĩnh (SSG) để các bot tìm kiếm (Googlebot, Bingbot) có thể đọc ngay nội dung HTML khi crawl.

### 1.2. Dynamic Metadata API
Mọi trang (`page.tsx`) đều phải xuất (export) object `metadata` hoặc hàm `generateMetadata()`.
- **Title:** Định dạng: `[Tiêu đề bài viết] | QUAN-PL BLOG-HUB`
- **Description:** Tóm tắt chính xác nội dung, chứa từ khóa chính, tối đa 160 ký tự.
- **Open Graph (OG) & Twitter Cards:** Đầy đủ thẻ `og:title`, `og:image`, `og:description` để khi chia sẻ lên mạng xã hội hiển thị hình ảnh chuẩn.

### 1.3. Tốc độ trang (Core Web Vitals)
- Tối ưu LCP (Largest Contentful Paint): Lazy-load cho ảnh dưới màn hình (below the fold), dùng `<Image>` của Next.js với định dạng WebP/AVIF.
- Giảm thiểu CLS (Cumulative Layout Shift): Phải khai báo sẵn chiều cao, chiều rộng cho mọi ảnh, model 3D và iframe.

## 2. HỆ THỐNG TRỢ LÝ SEO KHI VIẾT BÀI (AI-ASSISTED EDITOR)

Tính năng quan trọng nhất cho Tiptap Editor của QUÂN PL: Hệ thống AI phân tích và tối ưu SEO thời gian thực (Real-time SEO).

### 2.1. Tự động đề xuất Keyword & Cấu trúc
- Khi Quân bắt đầu viết bài, hệ thống dựa vào Title để gợi ý **LSI Keywords** (Từ khóa ngữ nghĩa liên quan).
- **Cảnh báo thẻ Heading:** Nhắc nhở nếu bài viết thiếu `<h2>`, `<h3>` hoặc sử dụng `<h1>` quá 1 lần.

### 2.2. Auto-Generation (Tạo tự động)
- **Alt Text cho Image & 3D Model:** Tự động dùng AI Image Recognition phân tích ảnh Quân upload lên để điền thẻ `alt` chuẩn SEO.
- **Meta Description:** Tự động tóm tắt bài viết thành 1 đoạn ngắn 150 ký tự chuẩn SEO khi lưu bài.
- **URL Slug:** Tự động chuyển đổi Tiêu đề thành dạng `slug-than-thien-voi-seo` (Bỏ dấu tiếng Việt, nối bằng dấu `-`).

### 2.3. Schema Markup (JSON-LD)
Mọi bài viết khi xuất bản phải tự động chèn một đoạn `<script type="application/ld+json">` vào `<head>` chứa cấu trúc dữ liệu theo chuẩn Schema.org:
- Dạng `Article` hoặc `TechArticle` cho bài viết công nghệ.
- Định danh rõ tác giả (Author): `QUÂN PL`.
- Ngày tạo (datePublished), ngày sửa (dateModified).

### 2.4. SEO Matrix v2 (Metadata Experience)
Hệ thống quản lý Metadata trong trang chỉnh sửa bài viết (`/admin/posts/edit/[id]`) được thiết kế để tối ưu hóa luồng làm việc của biên tập viên:
- **Auto-resize Metadata Interface**: Sử dụng component `AutoResizeTextarea` cho các trường Meta Title, Meta Description và Keywords.
- **Không giới hạn tầm nhìn**: Các ô nhập liệu tự động co giãn chiều cao theo nội dung, giúp biên tập viên quan sát toàn bộ danh sách từ khóa hoặc đoạn mô tả dài mà không cần thanh cuộn.
- **Real-time UX**: Đảm bảo mọi thay đổi về SEO Metadata được phản ánh trực quan ngay trong quá trình soạn thảo.

## 3. CHECKLIST DÀNH CHO AI AGENT
Mỗi khi Agent (Role 4) tạo một tính năng liên quan đến bài viết:
- [ ] Tính năng này có sinh ra URL tĩnh không?
- [ ] Tính năng này có hỗ trợ Metadata không?
- [ ] Có cung cấp Sitemap (`sitemap.xml`) và `robots.txt` không?
- [ ] Tích hợp tính năng AI Suggestion vào Editor đã có chưa?

> Mọi thiết kế phải xoay quanh mục tiêu **Người đọc thấy hữu ích - Bot Google thấy rõ ràng.**
