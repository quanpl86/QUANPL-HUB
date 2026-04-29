# 📘 Đặc Tả Kỹ Thuật & Quy Trình Vận Hành MCP Client (QUAN-PL HUB) - Bản Cập Nhật 2026

Bản đặc tả này cung cấp chi tiết về kiến trúc, các công cụ (tools), và quy trình tương tác với hệ thống NotebookLM MCP Server nhằm tối ưu hóa việc sáng tạo nội dung đa phương tiện tự động.

---

## 1. Tổng Quan Kiến Trúc (Architecture)
Hệ thống sử dụng giao thức **Model Context Protocol (MCP)** để tạo cầu nối giữa AI Agent và trình duyệt ẩn (Headless Browser) điều khiển Google NotebookLM.

- **Bảo mật:** Sử dụng mã hóa hậu siêu máy tính **ML-KEM-768 (Kyber)** kết hợp **ChaCha20-Poly1305** để bảo vệ phiên đăng nhập.
- **Cơ chế Hybrid:** Kết hợp giữa Tự động hóa trình duyệt (Browser Automation) và Gemini API trực tiếp (Interactions API).

---

## 🏗️ Kiến Trúc Hybrid (Hybrid Architecture)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                  NotebookLM MCP Server v2026.3.x                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────┐      ┌──────────────────────────────────┐  │
│  │      BROWSER AUTOMATION        │      │           GEMINI API             │  │
│  │     ✅ NO API KEY NEEDED       │      │   ⚡ OPTIONAL - needs API key     │  │
│  ├────────────────────────────────┤      ├──────────────────────────────────┤  │
│  │                                │      │                                  │  │
│  │  QUERY                         │      │  RESEARCH                        │  │
│  │  • ask_question                │      │  • deep_research                 │  │
│  │  • get_notebook_chat_history   │      │  • gemini_query                  │  │
│  │                                │      │  • get_research_status           │  │
│  │  CREATE & MANAGE               │      │                                  │  │
│  │  • create_notebook             │      │  DOCUMENTS                       │  │
│  │  • batch_create_notebooks      │      │  • upload_document               │  │
│  │  • manage_sources              │      │  • query_document                │  │
│  │  • generate_audio              │      │  • query_chunked_document        │  │
│  │  • generate_video_overview     │      │  • list/delete_document          │  │
│  │  • generate_data_table         │      │                                  │  │
│  │  • sync_notebook               │      │                                  │  │
│  │                                │      │                                  │  │
│  │  HEALTH & SESSIONS     v2026   │      │  Fast API • 48h retention        │  │
│  │  • get_health (deep_check)     │      │  Auto-chunking for large PDFs    │  │
│  │  • get_query_history           │      │                                  │  │
│  └────────────────────────────────┘      └──────────────────────────────────┘  │
│                                                                              │
│                 ┌─────────────────────────────────┐                          │
│                 │       17 SECURITY LAYERS        │                          │
│                 │   Post-Quantum • Audit Logs     │                          │
│                 │   Secrets Scan • Memory Wipe    │                          │
│                 │   GDPR • SOC2 • CSSF Ready*     │                          │
│                 └─────────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

💡 **Ghi chú:** Các tính năng cốt lõi (Hỏi đáp, tạo Notebook, Podcast) hoạt động hoàn toàn dựa trên tự động hóa trình duyệt, **không tốn phí API**. Các tính năng Gemini API là phần bổ trợ cho nghiên cứu chuyên sâu.

---

## 2. Danh Mục Công Cụ & API (Tools Reference)

### ✍️ Nhóm Sáng Tạo & Nghiên Cứu (Content & Research)
#### `askNotebookLM(prompt, notebookId)`
- **Mục tiêu:** Tạo nội dung bài viết chuyên sâu dựa trên tri thức của Notebook.

#### `deep_research(query)` [Yêu cầu Gemini API Key]
- **Mục tiêu:** Kích hoạt Agent nghiên cứu sâu của Google.
- **Khả năng:** Quét web, tổng hợp nguồn và trả về báo cáo 1-5 phút. Không chỉ giới hạn trong Notebook.

#### `get_notebook_chat_history(notebookId)`
- **Mục tiêu:** Trích xuất lịch sử chat từ giao diện Web về máy để lưu trữ hoặc phân tích lại.

---

### 🎙️ Nhóm Đa Phương Tiện (Multimedia Studio)
#### `generateAudioOverview(notebookId)`
- **Mục tiêu:** Tạo Podcast "Deep Dive" sinh động.

#### `generate_video_overview(notebookId, style)`
- **Mục tiêu:** Tạo video tóm tắt với 10 phong cách:
  - `heritage`: Cực hợp với dự án di sản/robot.
  - `modern`, `paper-craft`, `whiteboard`, `anime`, `kawaii`...
- **Định dạng:** `Explainer` (5-15p) hoặc `Brief` (1-3p).

#### `generate_data_table(notebookId)`
- **Mục tiêu:** Trích xuất bảng dữ liệu cấu trúc JSON từ các nguồn PDF/Docs hỗn loạn.

---

### 📂 Nhóm Quản Lý Tri Thức (Knowledge Management)
#### `batch_create_notebooks(data)`
- **Mục tiêu:** Tạo hàng loạt (lên đến 10) Notebook cùng lúc từ code.

#### `sync_notebook(notebookId, directory)`
- **Mục tiêu:** Đồng bộ thư mục local trên máy Mac của Quân với NotebookLM. Bất kỳ file mới nào Quân thả vào folder sẽ tự động được MCP đẩy lên Notebook.

#### `upload_document(path)` [Dùng Gemini API]
- **Mục tiêu:** Đẩy file trực tiếp lên Gemini mà không cần qua giao diện Notebook (tốc độ cao, hỗ trợ PDF 2000 trang).

---

## 3. Quy Trình Triển Khai & Chạy (Deployment)

### Yêu Cầu Hệ Thống
- **Node.js**: v20+
- **Biến môi trường (.env)**:
  - `NLMCP_AUTH_TOKEN`: Token định danh.
  - `GEMINI_API_KEY`: (Tùy chọn) Để dùng Deep Research và File API.
  - `MCP_SERVER_COMMAND`: `npx @pan-sec/notebooklm-mcp@latest`

---

## 4. Kỹ Thuật Tương Tác (Prompt Engineering)

**Cấu trúc Prompt Mẫu để lấy JSON chuẩn:**
```text
Dựa trên tri thức [Notebook], hãy viết [Yêu cầu].
Yêu cầu trả về định dạng JSON:
{
  "title": "...",
  "content": "...",
  "seo": { ... }
}
```

---

## 5. Quy Trình Xử Lý Tác Vụ (Workflow)
1. **Sync**: Dùng `sync_notebook` để cập nhật tri thức mới nhất từ máy Mac.
2. **Research**: Dùng `deep_research` để lấy thêm thông tin thời sự trên Web.
3. **Write**: Dùng `askNotebookLM` để viết bài Blog.
4. **Produce**: Gọi đồng thời `generateAudioOverview` và `generateVideoOverview(style='heritage')`.
5. **Publish**: Đẩy toàn bộ Bài viết + Audio + Video lên Website QUAN-PL HUB.

---
*Bản quyền tài liệu thuộc về QUAN-PL HUB Content OS.*
