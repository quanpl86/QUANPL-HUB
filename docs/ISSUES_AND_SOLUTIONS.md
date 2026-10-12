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
  4. resubmit sitemap — **DONE 2026-09-27 13:10 GMT+7; Google đã download lại thành công, 37 URL submitted, 0 warnings / 0 errors**;
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


## ISSUE-006: GSC non-indexed cohort mixes strategic URLs with stale/legacy URLs
- Status: Mitigated / Monitoring
- Priority: P0
- Symptoms:
  - GSC reports 18 not-indexed URLs across redirect/discovered/crawled-not-indexed reasons;
  - some URLs are valuable strategic articles, while others are legacy slugs or missing posts.
- Evidence:
  - live GSC drilldown on 2026-10-12: 10 discovered-not-indexed; 4 crawled-not-indexed shown in drilldown;
  - legacy NotebookLM slug renders no current article while canonical replacement exists;
  - DragonMind legacy URL has a current Second Brain STEM replacement;
  - multiple removed article URLs render no current article content.
- Root Cause:
  - historical URLs remain known to Google after content/slug lifecycle changes;
  - compliance pages were included in sitemap despite low search value;
  - article body content can contain H1 tags in addition to the template H1;
  - crawl priority is being spent across mixed strategic/non-strategic URLs.
- Diagnosis:
  Separate the cohort into strategic-index targets, public/noindex compliance pages, legacy URLs with canonical replacements, and removed URLs that should stay 404.
- Fix:
  - permanent redirect only where a close canonical replacement is confirmed;
  - explicit noindex for missing post metadata;
  - noindex privacy/terms and remove them from sitemap;
  - normalize article body H1 to H2;
  - strengthen author metadata and strategic internal links.
- Verification:
  - Deploy Preview PASS;
  - production commit `7fe0565` / Netlify deploy `6acc644c9008ec0008cb3549` PASS;
  - redirects, legal noindex, sitemap 31 URLs, author metadata, single-H1 and Hub link verified on production;
  - GSC URL Inspection for strategic targets remains pending crawler refresh;
  - D+3/D+7 re-check.
- Prevention:
  Maintain a URL lifecycle map for renamed/deleted content; never add low-value compliance URLs to strategic indexing targets.
- Owner: KingDragonHub Growth
- Last updated: 2026-10-12


## ISSUE-007: Netlify runtime/dependency security debt
- Status: Open
- Priority: P1
- Symptoms:
  - production/preview builds run Node 20.20.2 while several installed packages declare Node 22+ requirements;
  - npm audit during 2026-10-12 build reported 39 vulnerabilities: 2 low, 10 moderate, 22 high, 5 critical.
- Evidence:
  - Netlify deploy logs for production deploy `6acc644c9008ec0008cb3549`.
- Root Cause:
  - deployment runtime version lags package engine requirements;
  - dependency graph has unresolved advisories.
- Diagnosis:
  Audit whether affected packages are runtime or dev-only, identify reachable advisories, and test Node 22 compatibility before changing production.
- Fix:
  - do not run blind `npm audit fix --force`;
  - prepare Node 22 migration/test branch;
  - run dependency/advisory triage and upgrade only with regression tests.
- Verification:
  build/test on Node 22; critical/high reachable advisories reduced/resolved; production regression PASS.
- Prevention:
  pin supported Node engine and add scheduled dependency/security audit.
- Owner: KingDragonHub Engineering
- Last updated: 2026-10-12


## ISSUE-008: GSC Request Indexing trả lỗi gửi yêu cầu dù Live Test PASS
- Status: Monitoring
- Priority: P1
- Symptoms:
  - Request Indexing cho hai strategic URLs trả “Chúng tôi gặp sự cố khi gửi yêu cầu lập chỉ mục của bạn. Vui lòng thử lại sau.”
- Evidence:
  - 2026-10-12 URL Inspection:
    - “Có nên dạy AI cho học sinh tiểu học?” = live test indexable;
    - “AI tiểu học — lộ trình chính khóa” = fetch thành công, allowed to index = Có.
- Root Cause:
  Chưa có evidence cho thấy lỗi site; UI cho thấy lỗi ở bước gửi yêu cầu của Google Search Console.
- Diagnosis:
  Không coi đây là technical SEO failure. Theo dõi crawl tự nhiên sau sitemap/internal-link update và tránh retry liên tục.
- Fix:
  Sitemap đã resubmit thành công; crawl path đã tăng; chờ GSC refresh rồi kiểm lại D+3/D+7.
- Verification:
  URL chuyển sang indexed hoặc xuất hiện crawl date mới.
- Prevention:
  Manual Request Indexing chỉ là accelerator, không phải dependency của publishing/indexing workflow.
- Owner: KingDragonHub Growth
- Last updated: 2026-10-12
