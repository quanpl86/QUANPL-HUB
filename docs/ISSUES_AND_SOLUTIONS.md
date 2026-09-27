# ISSUES_AND_SOLUTIONS

## Template
### ISSUE-ID: Tên vấn đề
- Status:
- Priority:
- Symptoms:
- Evidence:
- Suspected root cause:
- Diagnosis:
- Fix:
- Verification:
- Prevention:
- Owner:
- Last updated:

---

## ISSUE-001: Bài viết không xuất hiện rõ trên Search/AI Search
- Status: Open
- Priority: P0
- Symptoms:
  - nhiều bài chất lượng nhưng exact-title search khó thấy;
  - SEO score CMS cao nhưng organic visibility thấp.
- Evidence:
  - trang chủ có thể được tìm thấy;
  - nhiều bài cụ thể chưa có tín hiệu discover/index mạnh qua search công khai.
- Suspected root cause:
  - indexability/crawlability;
  - sitemap/canonical;
  - authority thấp;
  - thiếu original information;
  - chưa vận hành bằng dữ liệu GSC/Bing.
- Diagnosis:
  1. GSC URL Inspection từng URL.
  2. Kiểm robots.txt/sitemap.
  3. Kiểm canonical/noindex.
  4. Kiểm rendered HTML.
  5. Kiểm server logs/CDN/bot protection.
  6. Kiểm Bing Webmaster.
  7. Kiểm OAI-SearchBot access.
- Fix:
  - xử lý technical blockers;
  - submit sitemap;
  - internal link mạnh;
  - original asset;
  - author/entity;
  - authority building.
- Verification:
  - Indexed = Yes;
  - impressions bắt đầu xuất hiện;
  - URL có query;
  - crawl success;
  - AI referral/citation nếu có.
- Prevention:
  - checklist post-publish;
  - tracker bắt buộc.
- Owner: KingDragonHub Growth
- Last updated: 2026-09-27

## ISSUE-002: Hình ảnh bài post không đạt nội dung
- Status: Recurring
- Priority: P1
- Symptoms:
  - ảnh generic;
  - ảnh sai ý section;
  - AI visual quá sci-fi;
  - infographic không đúng dữ liệu.
- Root cause:
  - prompt tập trung style hơn semantic purpose;
  - thiếu mapping ảnh ↔ section.
- Fix:
  - xác định purpose từng ảnh;
  - human-centered;
  - no text;
  - tránh generic AI visual;
  - QC theo section.
- Prevention:
  - image plan trước generation.

## ISSUE-003: Nội dung tốt nhưng thiếu original asset
- Status: Open
- Priority: P1
- Symptoms:
  - bài chủ yếu tổng hợp nguồn quốc tế.
- Root cause:
  - pipeline chưa bắt buộc original value.
- Fix:
  - thêm asset bắt buộc với bài strategic.
- Verification:
  - asset có thể tải/dùng lại;
  - có thể được citation độc lập.


## ISSUE-004: Strategic posts unknown/discovered but not indexed
- Status: Open
- Priority: P0
- Evidence date: 2026-09-27
- Symptoms:
  - nhiều bài AI/Education chiến lược có `URL is unknown to Google` hoặc `Discovered - currently not indexed`;
  - các bài audit vẫn trả HTTP 200, canonical self, indexable=true, noindex=false.
- Evidence:
  - GSC URL Inspection;
  - sitemap valid: 36 submitted, 0 indexed shown in sitemap report;
  - site performance only 16 impressions / 1 click over last 28 settled days.
- Root cause assessment:
  - crawl/discovery priority yếu;
  - authority thấp;
  - internal-link architecture chưa đủ mạnh;
  - nhiều URL còn mới.
- Fix:
  1. xây AI Education hub — **production PASS**;
  2. link từ homepage + indexed pages — **production PASS**;
  3. accurate lastmod — **production PASS**;
  4. resubmit sitemap — **DONE 2026-09-27 13:10 GMT+7; GSC accepted, pending download**;
  5. tracker 20–30 URLs;
  6. authority/original-asset campaign.
- Verification:
  - GSC URL Inspection PASS;
  - impressions begin appearing.
- Prevention:
  - post-publish indexing checklist + tracker.


## ISSUE-005: P0 SEO changes chưa được xác minh trên production
- Status: Resolved
- Priority: P0
- Evidence date: 2026-09-27 13:10 GMT+7
- Resolution:
  - commit `37c0bc7` deployed successfully to Netlify Production;
  - `/logo.png` HTTP 200 and valid PNG;
  - `/ai-in-education` HTTP 200 + self-canonical + CollectionPage/ItemList;
  - homepage Organization.logo = ImageObject and crawl links are live;
  - strategic post publisher schema + cluster nav live;
  - sitemap live contains Hub, accurate homepage `lastmod`, no `/fields/` junk URLs.
- Verification:
  Production gate PASS 100%. GSC sitemap was subsequently re-submitted and EXP-003 T0 started.
- Prevention:
  Keep local QC + production QC as mandatory deployment gate for technical SEO changes.
- Owner: KingDragonHub Growth
- Last updated: 2026-09-27
