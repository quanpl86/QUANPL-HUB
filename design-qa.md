# KingDragonHub code-native logo — Design QA

## Evidence

- Source visual truth: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-logo-code-reference.png`
- Desktop implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-logo-code-native-header.png`
- Mobile implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-logo-code-native-mobile.png`
- Focused side-by-side comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-logo-code-native-comparison.png`
- Route: `http://localhost:5560/`
- State: homepage header in light and dark themes.

## Normalization

- The DevTools source screenshot is 335 × 322 px; its visible logo region was cropped to 190 × 40 px.
- The desktop implementation was captured at a 1280 × 800 CSS viewport.
- The rendered logo is 189.84 × 40 CSS px and was compared at 190 × 40 px.
- The mobile implementation was captured at a 390 × 844 viewport with a 375 px effective page width.
- Device scale factor is 1×. The source DevTools selection overlay changes its apparent colors, so it is used as layout and structure evidence; color values are verified from computed styles.

## Required fidelity surfaces

- Fonts and typography: Both parts are live text in Space Grotesk at 18 px, bold, with tight tracking. No raster wordmark is rendered.
- Spacing and layout rhythm: Both spans use 6 px vertical and 12 px horizontal padding. The combined lockup is 189.84 × 40 px on desktop and mobile, matching the original component.
- Colors and visual tokens: The wordmark follows the foreground token; HUB uses `#f97316` with white text. Dark mode changes the wordmark color while retaining the orange HUB block.
- Image quality and asset fidelity: The production logo contains zero `img` elements and therefore remains sharp at every device density. The combined wrapper uses the existing `cyber-cut-sm` polygon for the 8 px cut corners.
- Copy and content: The live text is exactly `KING-DRAGON` and `HUB`.

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- The blue/green tint in the source half of the comparison is Chrome DevTools' element-selection overlay, not a brand color.

## Comparison history

1. The previous pass incorrectly replaced the code-native logo with PNG assets, causing visible softness and changing the original implementation model.
2. Restored the exact two-span structure and styling from repository history.
3. Removed both production PNG logo files and all corresponding CSS/image references.
4. Post-fix browser evidence confirms two `SPAN` children, zero `IMG` elements, correct 18 px font and 6 × 12 px padding, correct theme behavior, no horizontal overflow, and no console errors.

## Implementation checklist

- [x] Restore the two-span text-and-shape component.
- [x] Restore the original font, padding, color tokens and cut corners.
- [x] Reuse the component in header and footer.
- [x] Remove production PNG logo assets.
- [x] Verify desktop, dark theme and mobile rendering.
- [x] Verify no horizontal overflow or console errors.

Previous result: passed

---

# KingDragonHub performance + social links — Design QA

## Evidence

- Source icon set: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_OuJIrm/Screenshot 2026-08-22 at 09.34.39.png`
- Source status state: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_AXhilu/Screenshot 2026-08-22 at 09.34.04.png`
- Desktop implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-performance-home-desktop.png`
- Mobile implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-performance-home-mobile.png`
- Article implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-performance-article-desktop.png`
- Focused source/implementation comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-social-icons-comparison.png`
- Routes: `http://localhost:5560/` and `http://localhost:5560/posts/khung-5c-giao-tiep-voi-ai`
- State: production Docker build, light theme, cached public content.

## Normalization

- Source icon screenshot: 49 × 175 px at supplied density.
- Desktop: 1425 × 5047 px from a 1440 × 1000 CSS viewport, device scale factor 1×.
- Mobile: 375 × 11558 px from a 390 × 844 CSS viewport, device scale factor 1×.
- Article: 1425 × 28671 px from a 1440 × 1000 CSS viewport, device scale factor 1×.
- The focused comparison scales both crops only for legibility. Moving the original vertical rail to a horizontal group is intentional because the requested target is the compact status position.

## Required fidelity surfaces

- Fonts and typography: existing Space Grotesk/Inter hierarchy is unchanged; icon links use accessible labels.
- Spacing and layout rhythm: four 40 × 36 CSS px targets form one compact group aligned with the metrics row. No desktop/mobile overflow was found.
- Colors and visual tokens: navy foreground, orange hover/focus and existing border tokens remain; the green status treatment is removed.
- Image quality and asset fidelity: the existing Lucide `Code`, `MessageCircle`, `UserCircle` and `PlayCircle` icons are used. The code-native logo remains unchanged.
- Copy and content: visible `System online` count is zero. GitHub, Facebook, LinkedIn and YouTube point to the verified existing URLs.

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- The source rail is vertical and the implementation horizontal by design because its new location is inline.
- P3: archive cover images are lazy-loaded and can appear blank in an immediate full-page automation capture before entering the viewport; normal scroll loading is unaffected.

## Performance verification

- Deployed homepage: browser loads 4305/1741 ms; rendered HTML about 619,396 characters.
- Local homepage: browser loads 361/326/424 ms; rendered HTML about 163,062 characters, about 74% smaller.
- Deployed article: browser loads 4736/3358 ms.
- Local article: browser loads 1986/1017/793 ms; warm runs are below 1.1 seconds.
- Article rendered 32,111 text characters with no horizontal overflow and no browser console errors.

## Interaction and accessibility checks

- [x] Four social links render on desktop and mobile.
- [x] Verified URLs, new-tab behavior and `noopener noreferrer` are present.
- [x] Each icon has a Vietnamese accessible label and visible keyboard focus.
- [x] `System online` is absent from Hero and Footer.
- [x] Header/footer code-native logo remains intact.
- [x] Homepage and article have no horizontal overflow.
- [x] Article loading boundary resolves to the full article.
- [x] Article console error/warning check returned no entries.

## Comparison history

1. Baseline used a green `System online` status and omitted the old Hero social links.
2. Restored the four original icon semantics and verified URLs as a code-native horizontal group.
3. Removed the status from Hero and Footer, then captured desktop/mobile evidence.
4. The performance pass found full bodies serialized into archive cards and sequential article queries. The implementation now uses lightweight cached indexes, cached prepared article HTML, shared metadata data, parallel related/series fetches, streamed interactions and one cover image request.
5. Post-fix comparison found no P0/P1/P2 visual or functional regressions.

Previous result: passed

---

# KingDragonHub navigation, search, About + MCP cover prompt — Design QA

## Evidence

- Mega-menu source: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_gUD0gP/Screenshot 2026-08-22 at 09.37.46.png`
- Search source: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_KF871T/Screenshot 2026-08-22 at 09.38.34.png`
- About source: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_O176SQ/Screenshot 2026-08-22 at 09.38.59.png`
- Mega-menu implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-menu-open-fixed.png`
- Search implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-search-light-fixed.png`
- About desktop implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-about-unified-desktop-final.png`
- About mobile implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-about-unified-mobile.png`
- Combined comparisons: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-menu-comparison.png`, `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-search-comparison.png`, `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-about-comparison.png`
- Routes: `http://localhost:5560/` and `http://localhost:5560/about`
- State: production Docker build, light theme, open hover menu, focused populated search, desktop and mobile About.

## Normalization

- Menu and search sources are 982 × 319 px. Their implementation captures are 1185 × 751 px from a 1200 × 760 CSS viewport at 1× density.
- About source is 1455 × 1043 px. Desktop implementation is 1440 × 1476 px from a 1455 × 1043 CSS viewport at 1× density; browser chrome accounts for the effective screenshot width difference.
- Mobile About uses a 390 × 844 CSS viewport with a 375 px effective page width at 1× density.
- Combined comparisons retain the complete source and implementation frames side by side; they are scaled only to fit the comparison canvas.

## Required fidelity surfaces

- Fonts and typography: About now uses Inter consistently for headings, narrative copy, callouts, buttons and metrics. The desktop heading stays on two intentional lines and remains fluid on mobile.
- Spacing and layout rhythm: the mega-menu is fixed below the 64 px header, begins at y = 72 px, is centered in the viewport and capped at 900 px. The About two-column rhythm and responsive stacking are preserved.
- Colors and visual tokens: menu, search dialog and input use opaque theme surfaces. Light-theme search text computes to slate `rgb(15, 23, 42)`, while focus/caret retain the orange brand token.
- Image quality and asset fidelity: the existing King Dragon mascot is preserved without replacement or distortion. Existing Lucide navigation/search icons remain code-native.
- Copy and content: menu labels, search suggestions and About copy are unchanged except for visual hierarchy; no placeholder or decorative replacement content was introduced.

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- The mega-menu computes to an opaque white background, opacity 1, z-index 70 and a 900 × 236 px panel at the tested desktop viewport.
- Search dialog and input compute to opaque white/slate surfaces, and entered text remains clearly legible in the light theme.
- About desktop and mobile have no horizontal overflow.
- Final browser console check returned no errors or warnings.

## Comparison history

1. Baseline mega-menu overlapped the Hero at an inconsistent position and allowed the underlying content to interfere visually. It is now viewport-centered below the header on a solid surface with a stronger border and shadow.
2. Baseline search rendered a transparent field over a dimmed page, reducing contrast. The dialog and field now use opaque theme surfaces with explicit foreground, placeholder, caret and focus colors.
3. First About typography pass was visually consistent but wrapped the headline too aggressively. The final pass uses an Inter editorial scale with exactly two desktop title lines and responsive mobile wrapping.
4. MCP cover generation previously accepted a topic prompt without a guaranteed visual standard. Draft creation now adds a versioned, idempotent four-layer Clean & Clear contract: standard, topic prompt, thumbnail safety and negative rules.

## Interaction, accessibility and contract checks

- [x] Mega-menu opens on hover and remains above page content.
- [x] Search accepts visible text and preserves readable suggestion chips in the light theme.
- [x] Search dialog keeps explicit close/search semantics and keyboard focus treatment.
- [x] About renders consistently on desktop and mobile without overflow.
- [x] MCP exposes `get_cover_prompt_standard` with `cover_standard`, `cover_prompt_builder`, `cover_negative_rules` and `thumbnail_safety_rules`.
- [x] Cover prompts enforce one focal subject, at most one supporting element, quiet upper-left space, thumbnail legibility and no text/UI/logo clutter.
- [x] TypeScript, targeted lint, prompt unit tests and Docker production build pass.

Previous result: passed

---

# KingDragonHub Vietnamese UI and discussion module — Design QA

## Evidence

- Source discussion module: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_Loi10V/Screenshot 2026-08-22 at 09.48.24.png`
- Desktop discussion implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-comments-desktop-aligned.png`
- Populated focus state: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-comments-desktop-filled.png`
- Mobile discussion implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-comments-mobile.png`
- Combined source/implementation comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-comments-comparison.png`
- Vietnamese knowledge map: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-taxonomy-vietnamese-desktop.png`
- Vietnamese archive/card state: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-explore-vietnamese-desktop.png`
- Routes: `http://localhost:5560/` and `http://localhost:5560/posts/khung-5c-giao-tiep-voi-ai`
- State: production Docker build, light theme, empty discussion state, populated focused form, desktop and mobile.

## Normalization

- Source screenshot is 2034 × 1167 px. The aligned desktop implementation is 2033 × 1158 px from a 2048 × 1167 CSS viewport at 1× density.
- The combined comparison normalizes both captures to 1167 px height and presents them side by side.
- Mobile uses a 390 × 844 CSS viewport with a 375 px effective document width at 1× density.
- Homepage knowledge map and archive captures use a 1440 × 1000 CSS viewport at 1× density.

## Required fidelity surfaces

- Fonts and typography: reader actions use the existing Inter/editorial hierarchy. Uppercase monospaced system copy was removed from discussion controls and empty states.
- Spacing and layout rhythm: the discussion module preserves the original centered 4xl content width while introducing clear heading, form and comment-list groups. Desktop fields remain two-column; mobile stacks to one column without overflow.
- Colors and visual tokens: navy foreground, orange primary action, subtle neutral surfaces and existing border tokens are preserved. Focus rings use the brand orange token with readable light/dark contrast.
- Image quality and asset fidelity: no raster or brand assets were replaced. The supplied King Dragon mascot remains intact; its floating control now has a plain-language tooltip and accessible name.
- Copy and content: likes, discussion, form labels, button states, empty state, homepage taxonomy, archive category/tag labels, article breadcrumb, author role, related article metadata and footer are Vietnamese reader-facing copy.

## Findings

- No actionable P0, P1 or P2 visual or interaction mismatch remains in the implemented scope.
- The discussion form accepts realistic populated values, exposes native required/email semantics and retains its server-action submission path.
- Mobile metrics report no horizontal overflow; the form measures 327 CSS px inside the effective 375 px document.
- Final browser console check returned no errors or warnings.
- Legacy article titles are editorial records rather than interface labels. They remain a separate gradual content-normalization backlog, matching the user's P2 recommendation.

## Comparison history

1. Baseline used `0 LIKES`, `Ma trận thảo luận`, `Khởi tạo luồng mới`, machine-like placeholders, `INPUT_STREAM_READY`, `Phát hành bình luận` and a coded empty-state message.
2. First implementation replaced the entire module with plain Vietnamese copy, explicit labels, a normal submit action and a human empty state while preserving the visual design system.
3. Focus-state QA verified readable real input values, orange focus treatment and the full form/empty-state hierarchy.
4. Responsive QA verified one-column mobile fields, usable touch targets and no horizontal overflow.
5. Homepage/article QA verified Vietnamese field, subject, category and tag presentation without modifying backend slugs or editorial data.

## Interaction and accessibility checks

- [x] Name, email and comment inputs have visible labels and meaningful placeholders.
- [x] Name/comment use native required validation; email uses native email validation.
- [x] Submit and reply buttons expose loading copy in Vietnamese.
- [x] Comment reactions expose `aria-pressed`; reply controls expose `aria-expanded`.
- [x] Empty state clearly invites the first contribution.
- [x] Floating mascot exposes `Lên đầu trang` as tooltip, title and accessible name.
- [x] Desktop/mobile layouts have no horizontal overflow.
- [x] TypeScript, targeted ESLint, article-package tests and Docker production build pass.

Previous result: passed

---

# KingDragonHub Article Card V2 — Design QA

## Evidence

- Previous card implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-explore-vietnamese-desktop.png`
- Final homepage desktop: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-card-v2-desktop-final.png`
- Final archive desktop: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-card-v2-archive-final.png`
- Final tablet: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-card-v2-tablet.png`
- Final mobile: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-card-v2-mobile-final.png`
- Side-by-side comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-card-v2-comparison.png`
- Routes: `http://localhost:5560/` and `http://localhost:5560/blog`
- State: Docker production build, light theme, homepage compact variant and archive keyword variant.

## Normalization

- Previous and final desktop captures are both 1425 × 990 px from a 1440 × 1000 CSS viewport at 1× density.
- Tablet uses 1024 × 900; mobile uses 390 × 844 with a 375 px effective screenshot width.
- The comparison places previous and final desktop states side by side at their native dimensions.
- Homepage cards intentionally omit keywords; archive cards display at most two semantic keywords.

## Required fidelity surfaces

- Media: every thumbnail computes to 1.776–1.779, matching 16:9. Images use `object-fit: cover`, centered positioning and no fixed height.
- Layout: desktop computes three equal columns; tablet two; mobile one. The first desktop row has equal 474 px card heights and a shared metadata baseline.
- Typography and hierarchy: category, two-line title, clean excerpt, optional keywords and metadata follow one fixed component hierarchy.
- Copy and data: no hashtag syntax remains. Homepage excerpts are 109–120 characters in the first row and end cleanly without visible mid-sentence truncation. Legacy display-title overrides do not modify canonical article records.
- Interaction: the whole card is one link. Hover uses a 2 px lift, restrained border shift, 1.02 image scale and 4 px arrow movement. Keyboard focus computes to a 3 px orange outline with 3 px offset.
- States: image loading, image error fallback, card skeleton, route loading and filter-transition skeleton states are implemented without changing card geometry.

## Findings

- No actionable P0, P1 or P2 mismatch remains in the implemented Card V2 scope.
- Desktop, tablet and mobile report zero horizontal overflow.
- Archive renders 29 cards, no hashtag characters and exactly two or fewer keyword labels per card.
- Filter interaction updates the URL and sorted content correctly (`?sort=az#explore`).
- The local production homepage reached visible cards in 452 ms on a warm reload after the lightweight metadata change.
- Reading time no longer requires full article bodies in the public index. Existing 29 posts use verified legacy values; new Article Packages persist `reading_minutes` for lightweight JSON-path selection.

## Comparison history

1. Baseline used 16:10 media, hashtag tags, larger hover shadow, inconsistent excerpt truncation and no dedicated loading/error component states.
2. Card V2 moved media to 16:9, made the entire card interactive, aligned equal-height metadata, reduced motion strength and added accessible focus.
3. Homepage/archive variants now tune content density without forking the visual component.
4. A first reading-time implementation queried full bodies and caused a slow cold load. It was replaced with lightweight metadata plus verified legacy fallback values.
5. Final side-by-side review confirms cleaner hierarchy, preserved source composition and a more compact editorial grid without changing the established three-column layout.

## Interaction, accessibility and verification checks

- [x] Whole-card link with meaningful Vietnamese accessible name.
- [x] 16:9 media at every tested breakpoint.
- [x] 3/2/1 responsive grid with no overflow.
- [x] Visible keyboard focus and reduced-motion support.
- [x] Loading, skeleton and image-error fallback component states.
- [x] Vietnamese DD/MM/YYYY dates and consistent reading-time calculation.
- [x] Homepage hides keywords; archive shows no more than two without hashtags.
- [x] TypeScript, targeted ESLint, 4 card tests, 21 Article Package tests and Docker production build pass.

Previous result: passed

---

# KingDragonHub MCP Cover Standard 2.0 — Contract QA

## Scope

- MCP route: `/api/mcp`
- Tool: `start_article_workflow`
- Final storage guard: `create_blog_draft`
- Standard source: `/Users/mac/Downloads/QUAN-PL-HUB/src/lib/content/cover-prompt-standard.ts`
- Test fixture: “Ứng dụng AI trong giảng dạy trẻ mầm non”.

## Contract

- The generated prompt is assembled in four fixed layers: Article Visual Intent; Subject / Context / Action; KDH Clean & Clear Cover Standard; Article-Specific Things to Avoid.
- Workflow input accepts concise visual data only and has no full-article or `content_markdown` field.
- The server appends the authoritative standard inside `start_article_workflow` and normalizes again inside `create_blog_draft` before storage.
- Version marker `cover-standard/2.0` makes normalization idempotent and prevents duplicate standard blocks.
- Technical output is fixed to 16:9, minimum 1536 × 864, preferred PNG and thumbnail QA at 480 × 270.

## Required rule coverage

- [x] One primary idea and one clear focal subject.
- [x] Central 70–80% safe area and 20–35% quiet frame.
- [x] Quiet upper-left category-overlay area.
- [x] Human-centered education rule.
- [x] Hard prohibition on visible text, letters, numbers, logos, labels, code and readable UI.
- [x] Maximum 3–4 meaningful visual elements.
- [x] Restrained color, technology and background detail.
- [x] Visual differentiation rule covering repeated chess, circular AI and blue-orange hologram compositions.
- [x] Responsive `aspect-ratio: 16 / 9` and `object-fit: cover` safety.

## Live verification

- Docker production build completed successfully.
- Authenticated local MCP call returned HTTP 200.
- `next_action.action`: `generate_and_upload_blog_image`.
- `next_action.purpose`: `article_cover`.
- Marker, all four layers, hard no-text rule and article-specific avoid list were present.
- Full-article field was absent.
- Final generated prompt length for the test fixture: 6,617 characters.
- TypeScript, targeted ESLint, 6 cover-contract tests and 21 Article Package tests pass.

Previous result: passed

---

# KingDragonHub Admin UI Standardization — Design QA

## Evidence

- Source visual truth: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_Nq2G58/Screenshot 2026-08-22 at 10.32.55.png` plus the nine supplied authenticated admin screenshots from the same review set.
- Browser-rendered implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-admin-login.png`.
- Side-by-side source/implementation comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-admin-login-comparison.png`.
- Route: `http://localhost:5560/login`.
- State: Docker production build, light theme, unauthenticated admin entry.

## Normalization

- Source login image: 2034 × 1167 px at 1× screenshot density.
- Implementation image: 1265 × 1216 px from the in-app browser at 1× density.
- The comparison normalizes both captures into 1000 × 650 px contain frames on one 2000 × 650 px canvas. Browser chrome is excluded from judgment.
- Authenticated admin routes could not be browser-captured without a signed-in session; their shared shell and component states were verified through the same production build and code-level responsive contract.

## Required fidelity surfaces

- Typography: functional copy now uses the public editorial sans stack with normal tracking and sentence case; monospace is limited to short eyebrow and metadata labels.
- Spacing and layout: the admin shell uses a 264 px sticky sidebar, bounded 1440 px content area, responsive padding and a mobile navigation panel below 1024 px.
- Colors and tokens: navy/foreground, restrained orange accent, neutral raised surfaces, semantic success/warning/error colors and one shared border scale replace page-specific neon treatments.
- Image and asset fidelity: the existing code-native King Dragon Hub wordmark and Lucide icon family are preserved; no rasterized logo or placeholder asset was introduced.
- Copy and content: login, dashboard, taxonomy, posts, comments, schedule, automation, users, settings, editor, preview and SEO Advisor use plain Vietnamese interaction copy.
- States and accessibility: form labels are associated with login inputs, fields expose visible focus, buttons retain disabled states, mobile navigation exposes `aria-expanded`/`aria-current`, and dialog surfaces remain scrollable on small screens.

## Findings and comparison history

1. Baseline had excessive uppercase/underscore copy, tiny tracked metadata, decorative system language on primary actions, independently styled modules and a desktop-only sidebar.
2. Shared admin tokens, shell, form normalization, mobile menu, modal/editor treatments and plain-language microcopy were applied across all admin routes without altering data actions or permissions.
3. Initial production build failed because Docker Compose was invoked without `.env.local` substitution. Rebuilding with the existing local environment file completed successfully; no code workaround or secret exposure was introduced.
4. Final login comparison shows a clearer title, human-readable proposition, stronger form hierarchy, consistent public header and restrained orange focus while retaining the established KingDragonHub identity.
5. No actionable P0/P1/P2 issue remains in the visible unauthenticated flow or shared admin component contract. Authenticated screen capture remains a residual test gap, not a known visual defect.

## Verification

- [x] `npx tsc --noEmit` passed.
- [x] `git diff --check` passed.
- [x] Docker production build completed and container started at port 5560.
- [x] Browser-rendered login has one visible labeled email field and one labeled password field.
- [x] Browser console error log is empty on the verified route.
- [x] Side-by-side visual comparison inspected after implementation.
- [x] No commit, push or deployment was performed.

Previous result: passed

---

# KingDragonHub Weekly Editorial Review — Design QA

## Evidence

- Source visual truth: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_lAjFql/Screenshot 2026-08-22 at 10.41.37.png`.
- Browser-rendered implementation: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-editorial-desktop.png`.
- Side-by-side comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-editorial-comparison.png`.
- Production route: `http://localhost:5560/admin/editorial`.
- State: Docker production build, light theme, authenticated component shell rendered with an empty editorial dataset; the delivered route remains protected by Supabase admin authentication.

## Normalization

- Source: 2034 × 1216 px at 1× screenshot density.
- Implementation: 1265 × 712 px at a 1280 × 720 browser viewport, DPR 1.
- The combined evidence places both captures in 960 × 576 contain frames on a 1920 × 576 canvas. Differences in browser chrome and dynamic week data are excluded from fidelity judgment.
- A focused region was not required: navigation, heading, actions, KPI labels, report headings and the visible state controls remain legible in the combined comparison.

## Required fidelity surfaces

- Typography: headline and functional UI use the shared Space Grotesk/editorial sans hierarchy; monospace is limited to the short admin eyebrow and legacy metadata.
- Spacing and layout: the 264 px sticky admin sidebar, bounded content column, five-card KPI row, two-column summary and report grid preserve the source information order with clearer spacing.
- Colors and tokens: neutral raised surfaces and shared borders use restrained orange only for active/primary states; dark/light values inherit the admin workspace tokens.
- Image and asset fidelity: no new raster asset was needed. The existing code-native King Dragon Hub wordmark and Lucide icon family are preserved.
- Copy and content: all primary controls use plain Vietnamese. Existing workflow semantics and performance labels remain intact.
- States and accessibility: filters expose `aria-pressed`; action, filter and week-card focus rings are visible; disabled actions retain state; empty data has a dedicated state; Prompt AI is a working dialog.
- Responsive behavior: five KPI cards collapse through the existing Tailwind breakpoints, report panels become one column, tabs become a 2-column then 1-column control group, and the shared mobile admin menu replaces the desktop sidebar below 1024 px.

## Findings and comparison history

1. Baseline local branch lacked the `/admin/editorial` route, its menu item and every supporting editorial action/component/domain module, while the database migrations remained present.
2. The complete production workflow was restored from the latest repository implementation, including week review, slot editing/reordering, comments, revision requests, approval, cancellation, draft review, activity and performance reports.
3. The first restored view retained small system-style text and legacy border/button treatments. It was aligned to the shared admin shell with a human-readable header, editorial KPI hierarchy, consistent actions, accessible tabs, week selection states and responsive behavior.
4. A development-only visual route exposed a Next development CSS compiler issue and was not used for acceptance. The same component was captured from the Docker production build, where shared admin styles loaded correctly and the browser console remained clear.
5. The temporary QA route was deleted and the final image rebuilt. The final route manifest includes `/admin/editorial` and excludes `/qa-editorial`; unauthenticated access redirects to `/login` with HTTP 307.
6. No actionable P0, P1 or P2 visual or interaction issue remains in the restored screen. Dynamic week content differs from the supplied production screenshot by design because the QA fixture contains no private editorial records.

## Verification

- [x] `npx tsc --noEmit` passed.
- [x] Targeted ESLint for the delivered page, sidebar, performance component, article-mode contract and notification module passed.
- [x] `git diff --check` passed.
- [x] Docker production build completed and the container started at port 5560.
- [x] Production route manifest contains `/admin/editorial` and no QA route.
- [x] Browser console error log is empty on the rendered component.
- [x] Filter state changes `aria-pressed` correctly.
- [x] Prompt AI dialog opens successfully.
- [x] Side-by-side source/implementation comparison was inspected.
- [x] No commit, push or deployment was performed.

Previous result: passed

---

# KingDragonHub Search Focus & Filter Select — Design QA

## Evidence

- Source focus-state visual: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_BjovAs/Screenshot 2026-08-22 at 11.09.13.png`.
- Source native-select visuals: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_PzWMpO/Screenshot 2026-08-22 at 11.09.47.png` and `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_6cR7Pb/Screenshot 2026-08-22 at 11.10.07.png`.
- Browser-rendered search focus: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-search-focus-final.png`.
- Browser-rendered category listbox: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-search-select-open.png`.
- Combined focused comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-search-select-comparison.png`.
- Production route: `http://localhost:5560/blog`.

## Normalization

- Source focus capture: 746 × 300 px; source category-menu capture: 613 × 562 px.
- Implementation captures: 1265 × 712 px from a 1280 × 720 in-app browser viewport at DPR 1.
- The combined comparison uses focused crops normalized into two columns: faulty source state on the left and fixed implementation state on the right. Surrounding browser chrome and unrelated article content are excluded.

## Required fidelity surfaces

- Typography: filter labels, values and menu options use the existing editorial sans stack, normal tracking and readable sentence case.
- Spacing and geometry: the search field has one rounded focus boundary following the outer control; no internal rectangular outline overlaps the icon, placeholder or input padding.
- Colors and tokens: search and select use the shared restrained orange focus token, neutral card background, foreground text and theme-aware borders.
- Assets and icons: existing Lucide Search, ChevronDown, SlidersHorizontal and Check icons are retained with consistent stroke weight; no substitute asset was introduced.
- Copy and content: all filter labels and taxonomy options remain Vietnamese and preserve the current content model.
- States and accessibility: the custom filter exposes button/listbox/option semantics, selected state, expanded state, keyboard ArrowUp/ArrowDown/Enter/Escape behavior, outside-click closing, visible focus, active option and scroll for long category sets.
- Responsiveness: the existing 3/1-column filter breakpoints are preserved; menus anchor to their control, use a safe minimum width and cap height against the viewport.

## Findings and comparison history

1. The source search state rendered both the rounded wrapper focus and the global input `focus-visible` outline, creating an inset orange rectangle that obscured the control geometry.
2. Focus ownership was moved to the rounded wrapper through `focus-within`; the nested input explicitly suppresses only its redundant outline while retaining a visible accessible outer ring.
3. Native macOS select popups imposed an unrelated dark/brown surface and platform typography that CSS could not reliably normalize.
4. The three public filters were replaced with one controlled `FilterSelect` listbox component while preserving URL parameters, category reset behavior, sorting and loading transitions.
5. Final visual comparison shows one clean rounded search ring and a light, theme-aware category menu with orange selected/active states. No actionable P0/P1/P2 issue remains.

## Verification

- [x] Search dialog autofocus lands on the text field without a second rectangular outline.
- [x] Archive search uses the same focus geometry.
- [x] Category menu renders 18 options, selected checkmark and bounded scrolling.
- [x] Escape closes the open listbox.
- [x] ArrowDown + Enter selects “Kỹ thuật & Công nghệ” and updates the URL to `?field=eng-tech#explore`.
- [x] Browser console error log is empty.
- [x] `npx tsc --noEmit`, targeted ESLint and `git diff --check` pass.
- [x] Docker production build completed and `/blog` returns HTTP 200.
- [x] No commit, push or deployment was performed.

Previous result: passed

---

# KingDragonHub Footer Social Links — Design QA

## Evidence

- Source footer placement: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_ipxgGh/Screenshot 2026-08-22 at 14.58.59.png`.
- Source four-button icon group: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_6tX5sg/Screenshot 2026-08-22 at 14.58.33.png`.
- Browser-rendered desktop footer: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-footer-social-desktop.png`.
- Browser-rendered mobile footer: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-footer-social-mobile.png`.
- Combined source/implementation comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-footer-social-comparison.png`.
- Production route: `http://localhost:5560/`.

## Normalization

- Desktop implementation was captured in the in-app browser at 1280 × 720, DPR 1, light theme, scrolled to the footer.
- Mobile implementation was captured at the explicit 390 × 844 responsive viewport, DPR 1, light theme, scrolled to the footer.
- The combined comparison uses a 2 × 2 canvas: supplied footer reference, supplied icon group, final desktop footer and final mobile footer.

## Required fidelity surfaces

- Typography: the footer description, navigation headings and link copy retain the existing editorial sans hierarchy and sentence case.
- Spacing and geometry: the social group sits directly below the description with a 20 px vertical gap; four 40 × 40 px targets share one rounded outer border and aligned internal dividers.
- Colors and tokens: neutral foreground borders and icons use the existing theme tokens; hover and keyboard focus use the restrained KingDragonHub orange accent.
- Assets and icons: the existing Lucide Code, MessageCircle, UserCircle and PlayCircle icons are reused, matching the supplied four-button visual without introducing raster logo assets.
- Copy and content: the footer description remains unchanged, and the four destinations preserve the verified GitHub, Facebook, LinkedIn and YouTube URLs.
- States and accessibility: each external link has a distinct accessible name and title, a 40 px target, visible inset focus ring, hover state and safe `noopener` behavior.
- Responsiveness: the group remains under the description on desktop and mobile, while the existing footer columns collapse without overflow at 390 px.

## Findings and comparison history

1. The four social links previously appeared in the hero, competing with the primary content and leaving the footer brand column without the requested contact controls.
2. The social group was removed from the hero and inserted immediately after “Kiến thức thực hành về AI, STEM và công nghệ giáo dục.” in the shared footer component, so it now appears consistently across public pages.
3. The first server-side implementation attempted to fetch settings during static generation and exposed a missing build-time service-role dependency. The final implementation uses the already verified public fallback URLs and keeps the footer server-renderable without introducing a secret into the image build.
4. Desktop and mobile visual review confirms the group follows the supplied compact segmented-button form, aligns with the logo/description column and does not overflow or collide with footer navigation.
5. No actionable P0, P1 or P2 visual or interaction issue remains for the requested placement.

## Verification

- [x] Four social links are present in the footer navigation and resolve to the verified GitHub, Facebook, LinkedIn and YouTube URLs.
- [x] The hero contains no duplicate social group.
- [x] Desktop and 390 px mobile footer screenshots were inspected against the supplied references.
- [x] Browser console error log is empty.
- [x] `npx tsc --noEmit` passed.
- [x] Targeted ESLint passed.
- [x] `git diff --check` passed.
- [x] Docker production build completed, the container restarted and `/` returns HTTP 200.
- [x] No commit, push or deployment was performed.

Previous result: passed

---

# KingDragonHub Admin UI System — Design QA

## Evidence

- Supplied admin references: the 18 screenshots attached on 22/08/2026 covering dashboard, taxonomy, posts, weekly review, schedule, comments, automation, users, settings, editor, focus mode and SEO modal.
- Browser-rendered local authentication surface: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-admin-system-login-final.png`.
- Production-local route: `http://localhost:5560/login` (protected admin routes correctly redirect when no authenticated session is present).

## Shared UI contract

- Typography: page titles, panels, forms, buttons and descriptive text use the Space Grotesk/editorial sans stack; monospace remains limited to taxonomy level, slug, ID and compact system metadata.
- Geometry: all admin panels, list rows, buttons and controls use the same restrained 1 px border, small radius and focus ring. Legacy clipped corners and decorative cyber corner blocks are suppressed inside admin only.
- Hierarchy: every normalized page follows kicker → page title → supporting description → primary work area. Panel headings and form labels use sentence case.
- Interaction: buttons share 44 px minimum height, consistent primary/secondary/danger states and keyboard focus. Delete and role actions use plain Vietnamese confirmations and feedback.
- Empty states: Users, Fields, Subjects, Categories and Comments now explain the empty/error condition instead of leaving a large blank surface.
- Data freshness: Dashboard, taxonomy, comments and users are forced dynamic so the management UI does not show stale build-time data.
- Responsiveness: shared page headers stack actions below titles on mobile, panels retain readable padding, and the existing mobile admin navigator remains unchanged.

## Verification

- [x] `npx tsc --noEmit` passed.
- [x] Targeted ESLint passed for all new and modified shared-admin/taxonomy/user/comment components.
- [x] Docker production build completed with `.env.local`; all 53 routes compiled.
- [x] Dashboard, fields, subjects, categories, comments and users are listed as dynamic server routes in the production build.
- [x] Container was recreated and started at port 5560.
- [x] Browser-rendered local login has no console errors and the admin guard redirects correctly.
- [x] Logo remains code-native text and shape; no PNG replacement was introduced.
- [x] No commit, push or deployment was performed.

Previous result: passed

---

# KingDragonHub Hero Motion Restoration — Design QA

## Evidence

- Supplied old animated mascot reference: `/var/folders/vb/kb6nt89j7zqc5dbxjn8p7pg40000gn/T/TemporaryItems/NSIRD_screencaptureui_0IeXIG/Screenshot 2026-08-22 at 18.02.19.png`.
- Browser-rendered wide desktop hero: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-hero-motion-wide.png`.
- Browser-rendered 1013 × 1051 hero: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-hero-motion-desktop.png`.
- Browser-rendered focused mascot scene: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-hero-motion-scene.png`.
- Browser-rendered mobile viewport: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-hero-motion-mobile.png`.
- Combined source/implementation comparison: `/Users/mac/Downloads/QUAN-PL-HUB/design-qa-hero-motion-comparison.png`.
- Production-local route: `http://localhost:5560/`.

## Normalization

- The supplied 1013 × 1051 reference and focused implementation were reviewed together at the same 1013 × 1051 viewport size.
- A 1440 × 900 capture confirms that the animated mascot scene remains on the right side of the two-column desktop hero.
- A 390 × 844 capture confirms that the existing responsive hero content stays readable and free of horizontal overflow.

## Required fidelity surfaces

- Mascot: the existing `/images/mascot.png` asset is preserved and now uses a subtle five-second float/tilt loop modeled on the previous implementation.
- Matrix layer: deterministic orange binary columns fall vertically through a masked overlay with `z-index: 30`, above the mascot at `z-index: 10`, so the digits visibly pass over the image rather than behind it.
- Planet/orbit motion: two elliptical orbital paths and their planet markers rotate continuously in opposing directions, while two restrained technical rings rotate more slowly in the background.
- Visual balance: the restored effects use the existing orange, foreground and background tokens; no new text, CTA, layout or mascot asset was introduced.
- Performance and accessibility: the effect is pure CSS after deterministic server/client render, avoids timers and random hydration, reduces visible columns on small screens and honors the existing `prefers-reduced-motion` rule.

## Runtime verification

- [x] `hero-orbit-one-spin` is active and its computed transform changes across a 1.2-second sample.
- [x] `hero-mascot-float` is active and its computed transform changes across the same sample.
- [x] `hero-binary-fall` is active and its computed vertical transform changes from 129.05 px to 215.008 px in the sample.
- [x] Binary overlay rectangle intersects the mascot image rectangle and its computed stacking level is above the mascot (`30 > 10`).
- [x] Browser console error log is empty.
- [x] `npx tsc --noEmit` passed.
- [x] Targeted ESLint passed.
- [x] Docker production build completed, the container restarted and the homepage loaded locally.
- [x] No commit, push or deployment was performed.

## Findings

1. The immediately previous hero retained static orbit outlines but no continuous orbit, planet, mascot or matrix movement.
2. The restored version matches the recognizable old visual behavior while retaining the current editorial hero structure and copy.
3. No actionable P0, P1 or P2 mismatch remains for the requested motion layers. The older `TRI THỨC` badge and long terminal caption were intentionally not restored because the request targeted motion, not legacy microcopy.

final result: passed
