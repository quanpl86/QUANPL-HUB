# DECISION_LOG

## D-001 — Chuyển KPI từ SEO Score sang Search Outcomes
- Date: 2026-09-27
- Status: Active
- Decision:
  SEO Score CMS chỉ là quality gate.
  KPI thật là indexation, impressions, queries, position, CTR, backlinks, AI referrals và AI citations.
- Reason:
  Điểm SEO cao không đảm bảo crawl/index/ranking.

## D-002 — Ưu tiên Index → Cluster → Authority → Citation → Update
- Date: 2026-09-27
- Status: Active
- Decision:
  Không mặc định tăng số lượng bài.
  Tối ưu 20–30 bài trụ cột trước.
- Reason:
  Website đã có nền nội dung đủ để chuyển sang giai đoạn distribution/authority.

## D-003 — Mỗi bài strategic cần Original Asset
- Date: 2026-09-27
- Status: Active
- Decision:
  Mỗi bài trụ cột cố gắng có ít nhất một framework/tool/template/rubric/checklist/dataset/benchmark/worksheet.
- Reason:
  Tăng giá trị độc đáo, backlinkability và AI citation.

## D-004 — AI trong giáo dục phải human-centered
- Date: 2026-09-27
- Status: Active
- Decision:
  Nội dung AI Education luôn ưu tiên human agency, teacher capacity, critical thinking, safety, privacy, ethics, assessment và learning outcomes.
- Reason:
  Tránh biến AI Education thành hướng dẫn dùng công cụ đơn thuần.

## D-005 — Visual phải giải thích nội dung
- Date: 2026-09-27
- Status: Active
- Decision:
  Không dùng ảnh generic AI chỉ để trang trí.
- Reason:
  Trải nghiệm đọc và độ tin cậy.


## D-006 — Dùng GSC URL Inspection làm nguồn xác minh index chính
- Date: 2026-09-27
- Status: Active
- Decision:
  Không dùng `site:` search hoặc sitemap indexed count đơn lẻ để kết luận index.
  Trạng thái per-URL phải ưu tiên Google URL Inspection / Indexing Tracker.
- Reason:
  Sitemap report hiện cho thấy 36 submitted / 0 indexed, trong khi URL Inspection xác nhận nhiều URL đã `Submitted and indexed`.


## D-007 — Production verification là gate trước resubmit/measurement
- Date: 2026-09-27
- Status: Active
- Decision:
  Các thay đổi SEO kỹ thuật/cluster chỉ được coi là hoàn thành sau khi deploy và xác minh trên production.
  Không resubmit sitemap hoặc bắt đầu cửa sổ đo 3–7 ngày dựa trên build local בלבד.
- Reason:
  GSC hiện xác nhận homepage PASS/Indexed nhưng `/ai-in-education` vẫn `URL is unknown to Google`; build local không chứng minh crawler đang thấy phiên bản mới.


## D-008 — Chốt T0 production cho EXP-003
- Date: 2026-09-27
- Status: Active
- Decision:
  Chốt **2026-09-27 13:10 GMT+7** là T0 chính thức của thử nghiệm AI Education Hub sau khi production verification PASS.
  Sitemap chỉ được re-submit sau gate này; cohort được mở rộng từ 21 lên 22 URL bằng cách thêm `/ai-in-education`.
- Reason:
  Tách rõ hiệu quả của thay đổi production khỏi build local và tạo mốc đo có thể so sánh sau 3–7 ngày.


## D-009 — Tách Taxonomy khỏi Topic Cluster; Dynamic Hub chỉ bật sau EXP-003
- Date: 2026-09-27
- Status: Active
- Decision:
  Taxonomy dùng để mô tả bài viết thuộc lĩnh vực/chủ đề gì; Topic Cluster dùng để mô tả bài đang hỗ trợ Hub/Pillar nào.
  Không dùng tag tự do làm logic lõi để chọn 6 bài trụ cột. Sau Checkpoint 2 (2026-10-04), chuyển sang metadata có cấu trúc trong Supabase và quan hệ Hub Membership.
  Trong cửa sổ EXP-003 đến hết 2026-10-04, giữ nguyên 6 pillar URL, thứ tự, anchor text, schema và cấu trúc internal-link chính của `/ai-in-education`, trừ sửa lỗi kỹ thuật/factual bắt buộc.
- Target architecture:
  - Pillar metadata: `is_pillar`, `pillar_hub`, `pillar_order`, `pillar_label`, `pillar_tagline`.
  - Cluster membership: ưu tiên bảng junction `post_hubs` (hoặc `hub_memberships` có kiểm soát) để một bài có thể thuộc nhiều Hub mà không làm méo taxonomy.
  - Homepage, Hub và Cluster Nav đọc từ cùng một nguồn dữ liệu sau migration.
- Reason:
  Bảo toàn khả năng diễn giải của EXP-003, giảm lỗi do tag tự do và tách rõ taxonomy thư viện khỏi kiến trúc topical authority/SEO-AIO.
