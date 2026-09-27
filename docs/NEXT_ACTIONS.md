# NEXT_ACTIONS

## P0 — Làm ngay
1. Kết nối dữ liệu Google Search Console cho KingDragonHub.
2. Chọn 20–30 bài/URL trụ cột để audit.
3. Kiểm từng URL:
   - HTTP;
   - canonical;
   - indexability;
   - rendered HTML;
   - sitemap;
   - robots;
   - GSC status.
4. Kiểm Bing Webmaster và khả năng crawl.
5. Kiểm OAI-SearchBot/Bingbot có bị chặn không.
6. Tạo baseline SEO_INDEX_TRACKER.

## P1 — Sau khi P0 rõ nguyên nhân
7. Xây AI in Education pillar page.
8. Map internal links cho cluster AI Education.
9. Chọn 5 bài để bổ sung original asset.
10. Xây Teacher AI Competency Self-Assessment.
11. Xây STEM Assessment Toolkit từ bài rubric 40 phút.
12. Chuẩn hóa Author/Organization schema.

## P2 — Tăng authority
13. Xuất tài nguyên public trên GitHub.
14. Tạo downloadable templates.
15. Lập kế hoạch outreach/backlink chất lượng.
16. Theo dõi branded search và referring domains.

## P3 — AI Search
17. Đo AI referral traffic.
18. Theo dõi mention/citation trên ChatGPT/Perplexity/Copilot.
19. Cải thiện các đoạn direct answer cho bài có impression.
20. Cập nhật bài chiến lược theo dữ liệu thật.

## Quy tắc
Không mở rộng mạnh lịch viết bài mới cho đến khi:
- P0 được xử lý;
- baseline indexation rõ;
- 20–30 bài trụ cột được audit.


## Baseline GSC 2026-09-27 — cập nhật
- [x] Kết nối Google Search Console qua GSC Wizard.
- [x] Xác nhận property `sc-domain:kingdragonhub.com`.
- [x] Lấy baseline 28 ngày.
- [x] Kiểm sitemap.
- [x] Chạy URL Inspection cho nhóm URL chiến lược.
- [x] Tạo Indexing Tracker cho 21 URL.
- [x] Chạy on-page audit cho 10 bài chiến lược.
- [x] Fix `Organization.logo` schema toàn site — **production PASS 2026-09-27 13:10 GMT+7**.
- [x] Tăng internal links tới các bài P0 đang UNKNOWN/DISCOVERED — **AI Education Hub + homepage/header/footer/cluster nav đã live trên production**.
- [x] Deploy P0 SEO changes lên production và xác minh live HTML/JSON-LD — **PASS commit `37c0bc7`**.
- [x] Re-submit sitemap sau production verification — **GSC accepted 2026-09-27 13:10 GMT+7; đang pending download**.
- [ ] Kết nối Bing Webmaster Tools.
- [ ] Thiết lập IndexNow key + root key file.


## Checkpoint vận hành sau production — 2026-09-27 13:10 GMT+7
- [x] Production verification gate PASS.
- [x] GSC sitemap re-submitted; Google đã download lại lúc ~13:10 GMT+7; 37 URL submitted; 0 warnings / 0 errors.
- [x] Tạo GSC annotation `EXP-003 AI Education Hub production launch`.
- [x] Thêm `/ai-in-education` vào Indexing Tracker; cohort hiện **22 URL**.
- [x] T0 URL Inspection: homepage = INDEXED; `/ai-in-education` = UNKNOWN, chưa crawl.
- [ ] Checkpoint 1: **2026-09-30** — kiểm discovery/crawl/index của Hub + P0 cohort.
- [ ] Checkpoint 2: **2026-10-04** — so sánh indexed %, impressions và non-brand queries.
- [ ] Kết nối Bing Webmaster Tools API key trong GSC Wizard.
- [ ] Cấu hình IndexNow key trong GSC Wizard + publish root key file trước khi submit.
- [ ] Bắt đầu authority/original-asset work cho 3–5 bài chiến lược trong khi chờ crawl/index.


## Post-EXP-003 architecture — chỉ triển khai sau 2026-10-04
- [ ] Chạy migration Supabase cho Pillar metadata: `is_pillar`, `pillar_hub`, `pillar_order`, `pillar_label`, `pillar_tagline`.
- [ ] Thiết kế Hub Membership có cấu trúc; ưu tiên bảng junction `post_hubs` để hỗ trợ many-to-many.
- [ ] Thêm unique constraint cho `(pillar_hub, pillar_order)` trên các pillar đang publish.
- [ ] Cập nhật Admin: selector Topic Hub + toggle Pillar + order 1..6 + label/tagline + cảnh báo thay thế vị trí.
- [ ] Chuyển Homepage + `/ai-in-education` + Cluster Nav sang cùng một query Supabase; loại bỏ hardcoded sau migration.
- [ ] Giữ tag chỉ như metadata/editorial aid, không làm nguồn sự thật cho pillar/cluster routing.

### Freeze rule đến hết Checkpoint 2
- Không đổi 6 pillar URL, thứ tự, anchor text chính, schema hoặc network internal-link của AI Education Hub trước 2026-10-04, trừ lỗi kỹ thuật/factual bắt buộc.
- Có thể thiết kế original assets ở trạng thái ready-to-publish nhưng chưa nhúng vào các URL thuộc EXP-003 trước Checkpoint 2 nếu không cần thiết.
