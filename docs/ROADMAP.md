# ROADMAP

## PHASE 1 — Technical Discoverability
**Priority: P0**
### Mục tiêu
Đảm bảo crawler có thể truy cập, hiểu và index các bài chiến lược.

### Tasks
- [x] Kết nối Google Search Console data.
- [ ] Audit robots.txt.
- [x] Audit sitemap.xml.
- [x] Audit canonical/noindex.
- [x] Audit rendered HTML cho cohort audit; cần verify lại sau deploy P0.
- [x] Kiểm redirect/HTTP status cho cohort audit; cần verify lại sau deploy P0.
- [ ] Kiểm bot protection/CDN.
- [ ] Kiểm Bing Webmaster.
- [ ] Kiểm OAI-SearchBot access.
- [x] Xác định cohort chiến lược ban đầu: 21 URL.

### Deployment gate — 2026-09-27
- [x] Deploy thay đổi P0 schema + Hub + internal links lên production — commit `37c0bc7`.
- [x] Verify `Organization.logo`, `/ai-in-education`, crawl links và sitemap trên production — PASS 2026-09-27 13:10 GMT+7.
- [x] Resubmit sitemap sau PASS; bắt đầu cửa sổ đo 3–7 ngày từ T0 2026-09-27 13:10 GMT+7.

## PHASE 2 — Topic Cluster Architecture
**Priority: P0/P1**
- [x] Xây pillar AI in Education — production live tại `/ai-in-education`.
- [ ] Xây pillar STEM/STEAM.
- [ ] Xây pillar AI & Future Skills.
- [x] Map internal links AI Education — production live từ homepage/Header/Footer/StartHere/article cluster nav.
- [ ] Chuẩn hóa entity/author/category/tag.

### Measurement gate — EXP-003
- T0: **2026-09-27 13:10 GMT+7**.
- Checkpoint 1: **2026-09-30**.
- Checkpoint 2: **2026-10-04**.
- Không chỉnh mạnh cấu trúc Hub trong cửa sổ 3–7 ngày trừ khi có lỗi kỹ thuật, để giữ experiment interpretable.

## PHASE 3 — Original Value
**Priority: P1**
- [ ] Teacher AI Competency Self-Assessment.
- [ ] STEM rubric toolkit.
- [ ] AI classroom safety checklist.
- [ ] AI lesson design template.
- [ ] AI learning workflow cards.
- [ ] Interactive tools/calculators khi phù hợp.

## PHASE 4 — Authority Building
**Priority: P1**
- [ ] GitHub public resources.
- [ ] Downloadable templates.
- [ ] Community distribution.
- [ ] Outreach tới giáo viên/trường/EdTech.
- [ ] Guest/citation opportunities.
- [ ] Backlink monitoring.

## PHASE 5 — AI Search Visibility
**Priority: P1**
- [ ] Theo dõi AI referrals.
- [ ] Theo dõi AI mentions/citations.
- [ ] Cải thiện answer-first blocks.
- [ ] Citation/entity refinement.
- [ ] Update bài được trích nhiều.

## PHASE 6 — Continuous Update
**Priority: Ongoing**
- [ ] Quarterly content refresh.
- [ ] Update policy/AI news.
- [ ] Content decay review.
- [ ] CTR optimization.
- [ ] Consolidate cannibalizing content.


## PHASE 2B — Dynamic Hub Management (sau EXP-003)
**Earliest start: 2026-10-05, sau Checkpoint 2**
- [ ] Tách data model Taxonomy khỏi Topic Cluster.
- [ ] Migration Pillar metadata trong Supabase.
- [ ] Tạo quan hệ Hub Membership many-to-many (ưu tiên `post_hubs`).
- [ ] Admin UI để gán Hub/Pillar/order/label/tagline có validation.
- [ ] Homepage + Hub + Cluster Nav dùng cùng data source/query.
- [ ] Loại bỏ hardcoded `STRATEGIC_AI_CLUSTER_POSTS` sau khi migration và verification PASS.
- [ ] Regression test SEO: canonical, schema, internal links, sitemap, SSR/rendered HTML.

### EXP-003 structure freeze
Từ T0 2026-09-27 13:10 GMT+7 đến hết Checkpoint 2 2026-10-04: không thay đổi cấu trúc cốt lõi của `/ai-in-education` và 6 pillar, trừ lỗi kỹ thuật/factual bắt buộc.
