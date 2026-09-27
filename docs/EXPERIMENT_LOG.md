# EXPERIMENT_LOG

## Template
### EXP-ID — Tên thử nghiệm
- Hypothesis:
- Change:
- URLs:
- Start:
- End:
- Metrics:
- Result:
- Decision:
- Follow-up:

---

## EXP-001 — Answer-first + AIO structure
- Hypothesis:
  Bài có direct answer, heading rõ và citation gần claim sẽ dễ được Search/AI Search hiểu hơn.
- Change:
  Áp dụng Article Package mới cho các bài AI chiến lược.
- Metrics:
  impressions, long-tail queries, AI referrals/citations.
- Status: Running

## EXP-002 — Original Asset Requirement
- Hypothesis:
  Bài có framework/tool độc quyền tăng backlink và citation.
- Candidate URLs:
  - Khung 5C giao tiếp với AI
  - Khung năng lực AI giáo viên
  - STEM rubric 40 phút
- Status: Planned

## EXP-003 — Topic Hub
- Hypothesis:
  Pillar + internal linking hai chiều cải thiện crawl, relevance và topical authority.
- Candidate:
  AI in Education hub.
- Change:
  Hub + homepage/Header/Footer/StartHere + article cluster navigation đã deploy production; `Organization.logo` schema và sitemap cũng được sửa đồng thời.
- Start / T0:
  **2026-09-27 13:10 GMT+7**.
- Baseline at T0:
  - homepage: `PASS / Submitted and indexed`;
  - `/ai-in-education`: `URL is unknown to Google`, chưa có last crawl;
  - tracker: 21 URL trước thay đổi, thêm Hub thành **22 URL**;
  - sitemap re-submit: accepted/confirmed; Google downloaded lại lúc ~13:10 GMT+7; 37 URL submitted, 0 warnings / 0 errors.
- Metrics:
  discovery state, last crawl, indexed %, impressions, non-brand queries.
- Status: **Running**.
- Checkpoints:
  - 2026-09-30: discovery/crawl/index checkpoint;
  - 2026-10-04: 7-day checkpoint;
  - 2–4 tuần: success-threshold review.
- Follow-up:
  Không kết luận từ sitemap indexed count đơn lẻ; ưu tiên URL Inspection/Tracker và Search Analytics.

- Experiment discipline:
  - Structure Freeze duy trì đến hết 2026-10-04.
  - Không thay 6 pillar URL/order/anchor text chính, Hub schema hoặc internal-link network trong cửa sổ đo, trừ lỗi kỹ thuật/factual bắt buộc.
  - Original assets có thể được chuẩn bị ngoài production nhưng không nhúng vào các URL thuộc experiment trước Checkpoint 2 nếu không cần thiết.
- Post-experiment decision gate:
  Sau 2026-10-04 mới xem xét chuyển AI Education Hub từ hardcoded sang Supabase-driven Pillar/Hub Membership architecture.
