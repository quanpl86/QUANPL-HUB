# 🗺️ QUAN-PL HUB: PROJECT INFORMATION & INFRASTRUCTURE

Tài liệu tổng hợp các thông số kỹ thuật, cấu hình và sơ đồ kết nối của hệ thống.

---

## 🏗️ SƠ ĐỒ KẾT NỐI (SYSTEM TOPOLOGY)
1.  **Frontend/CMS:** Next.js (Deploy trên Netlify).
2.  **Database/Realtime:** Supabase.
3.  **Content Brain:** Google NotebookLM (Thông qua MCP Server).
4.  **Worker:** Chạy tại Local (MacBook/VPS) — "Cánh tay nối dài" điều khiển AI.

---

## 🔑 BIẾN MÔI TRƯỜNG CỐT LÕI (CORE ENV)
| Biến | Ý nghĩa | Trạng thái |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Kết nối Database | ✅ Đã cấu hình |
| `NLMCP_AUTH_TOKEN` | Token xác thực MCP | ✅ Đã cấu hình |
| `GEMINI_API_KEY` | Dùng cho Deep Research | ⚠️ Chưa có |
| `NOTEBOOK_DEFAULT_ID` | Notebook STEM mục tiêu | ✅ 4ae8fe58... |

---

## 📂 CẤU TRÚC THƯ MỤC QUAN TRỌNG
- `/src`: Giao diện Web Next.js (Admin + Frontend).
- `/services`: Bộ não Worker và MCP Client.
- `/.antigravity`: Trung tâm chỉ huy (Master Plan, Specification).
- `/supabase`: Script khởi tạo Database và Migrations.

---

## 🛡️ CƠ CHẾ BẢO MẬT
- **Encryption:** ML-KEM-768 (Kyber) cho Session.
- **Protocol:** MCP stdio transport.
- **Audit:** Lưu nhật ký truy vấn tự động thông qua `getQueryHistory`.

---

## 🚀 LỆNH VẬN HÀNH NHANH (QUICK COMMANDS)
- **Khởi chạy Web Local:** `npm run dev` (tại gốc).
- **Khởi chạy Worker:** `npm run dev` (tại `/services`).
- **Check sức khỏe AI:** `npx tsx -e "import { getHealth } from './mcp-client'; getHealth().then(console.log)"`

---
*Cập nhật lần cuối: 30/04/2026 bởi Antigravity Agent.*
