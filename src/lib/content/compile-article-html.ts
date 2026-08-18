import { marked } from "marked";
import { parseHtmlWithToc, slugifyHeading } from "../toc-parser.ts";
import type { InlineImage, NormalizedArticlePackage, PackageIssue } from "./article-package.ts";

export type CompileArticleResult = {
  html: string;
  warnings: PackageIssue[];
};

const IMAGE_PLACEHOLDER_RE = /\{\{IMAGE:([A-Za-z0-9_-]+)\}\}/g;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^#\s+[^\n]+\n+/, "");
}

function wrapPlaceholderParagraphs(html: string): string {
  return html.replace(/<p>\s*(\{\{IMAGE:[A-Za-z0-9_-]+\}\})\s*<\/p>/g, "$1");
}

function renderFigure(image: InlineImage): string {
  const caption = image.caption?.trim()
    ? `<figcaption>${escapeHtml(image.caption.trim())}</figcaption>`
    : "";
  return `<figure class="kd-inline-figure">
  <img src="${escapeHtml(image.url || "")}" alt="${escapeHtml(image.alt)}" loading="lazy" />
  ${caption}
</figure>`;
}

function renderTakeaways(pkg: NormalizedArticlePackage): string {
  const points = [...pkg.aio.key_takeaways];
  if (pkg.aio.tldr?.trim() && !points.some((point) => point.includes(pkg.aio.tldr.trim()))) {
    points.unshift(pkg.aio.tldr.trim());
  }
  if (points.length === 0) return "";

  const items = points
    .map((point) => `<li>${escapeHtml(String(point))}</li>`)
    .join("");

  return `<details class="kd-key-takeaways mb-8 border border-brand-orange/30 bg-brand-orange/5 rounded-lg overflow-hidden group">
<summary class="font-orbitron font-bold text-xl p-6 cursor-pointer text-brand-orange uppercase tracking-wider flex items-center gap-2 hover:bg-brand-orange/10 transition-colors outline-none list-none"><span class="text-2xl">💡</span>TL;DR / KEY TAKEAWAYS</summary>
<div class="kd-takeaways-content p-6 pt-0 font-be-vietnam text-foreground/90"><ul>${items}</ul></div>
</details>`;
}

function renderFaq(pkg: NormalizedArticlePackage): string {
  if (!pkg.aio.faq.length) return "";
  return pkg.aio.faq
    .map((item) => {
      const question = escapeHtml(item.question);
      return `<details class="faq-block group mb-4 rounded-sm overflow-hidden" question="${question}">
<summary class="font-orbitron font-semibold p-4 cursor-pointer text-brand-orange hover:bg-brand-orange/10 transition-colors list-none outline-none">${question}</summary>
<div class="faq-answer p-4 font-be-vietnam leading-relaxed">${escapeHtml(item.answer)}</div>
</details>`;
    })
    .join("\n");
}

function renderCitations(pkg: NormalizedArticlePackage): string {
  if (!pkg.references.length) return "";
  const items = pkg.references
    .map((ref) => {
      const title = escapeHtml(ref.title || ref.url);
      const href = escapeHtml(ref.url);
      return `<li><a href="${href}">${title}</a></li>`;
    })
    .join("");
  return `<section class="kd-citations">
<h2>Nguồn tham chiếu nghiên cứu (Citations):</h2>
<ol>${items}</ol>
</section>`;
}

function renderDirectAnswer(pkg: NormalizedArticlePackage): string {
  const answer = pkg.aio.direct_answer?.trim();
  if (!answer) return "";
  return `<p class="kd-direct-answer">${escapeHtml(answer)}</p>`;
}

function imageById(pkg: NormalizedArticlePackage): Map<string, InlineImage> {
  return new Map(pkg.inline_images.map((image) => [image.id, image]));
}

function replacePlaceholders(
  html: string,
  pkg: NormalizedArticlePackage,
  usedIds: Set<string>
): { html: string; warnings: PackageIssue[] } {
  const warnings: PackageIssue[] = [];
  const images = imageById(pkg);

  const nextHtml = html.replace(IMAGE_PLACEHOLDER_RE, (_match, id: string) => {
    const image = images.get(id);
    if (!image) {
      throw new Error(`QUALITY_GATE_FAILED: UNKNOWN_IMAGE_PLACEHOLDER: {{IMAGE:${id}}} has no matching inline_images id`);
    }
    usedIds.add(id);
    if (!image.url) {
      warnings.push({
        code: "MEDIA_URL_MISSING",
        image_id: id,
        message: `{{IMAGE:${id}}} removed because url is null`,
      });
      return "";
    }
    return renderFigure(image);
  });

  return { html: nextHtml, warnings };
}

function insertAfterHeading(html: string, headingId: string, snippet: string): string | null {
  const headingRe = new RegExp(
    `<(h[23])([^>]*\\sid="${headingId}"[^>]*)>[\\s\\S]*?<\\/\\1>`,
    "i"
  );
  const match = headingRe.exec(html);
  if (!match || match.index === undefined) return null;
  const insertAt = match.index + match[0].length;
  return html.slice(0, insertAt) + snippet + html.slice(insertAt);
}

function applyHeadingFallbacks(
  html: string,
  pkg: NormalizedArticlePackage,
  usedIds: Set<string>
): { html: string; warnings: PackageIssue[] } {
  const warnings: PackageIssue[] = [];
  let nextHtml = html;

  for (const image of pkg.inline_images) {
    if (usedIds.has(image.id)) continue;

    const headingId = image.position?.after_heading_id?.trim();
    if (!headingId) {
      warnings.push({
        code: "MEDIA_POSITION_UNRESOLVED",
        message: `inline image "${image.id}" has no placeholder and no after_heading_id`,
      });
      continue;
    }

    if (!image.url) {
      warnings.push({
        code: "MEDIA_URL_MISSING",
        image_id: image.id,
        message: `inline image "${image.id}" heading fallback skipped because url is null`,
      });
      continue;
    }

    const inserted = insertAfterHeading(nextHtml, headingId, renderFigure(image));
    if (!inserted) {
      warnings.push({
        code: "MEDIA_HEADING_NOT_FOUND",
        message: `after_heading_id "${headingId}" was not found for image "${image.id}"`,
      });
      continue;
    }

    usedIds.add(image.id);
    nextHtml = inserted;
  }

  return { html: nextHtml, warnings };
}

function injectTakeaways(html: string, takeawaysHtml: string): string {
  if (!takeawaysHtml) return html;
  const firstH2 = /<h2\b[^>]*>[\s\S]*?<\/h2>/i.exec(html);
  if (!firstH2 || firstH2.index === undefined) {
    return takeawaysHtml + html;
  }
  const at = firstH2.index + firstH2[0].length;
  return html.slice(0, at) + takeawaysHtml + html.slice(at);
}

export async function compileArticleHtml(
  pkg: NormalizedArticlePackage
): Promise<CompileArticleResult> {
  const warnings: PackageIssue[] = [];
  const markdown = stripLeadingH1(pkg.content_markdown || "");
  const parsed = marked.parse(markdown, { gfm: true, breaks: true });
  const rawHtml = typeof parsed === "string" ? parsed : await parsed;
  const withIds = parseHtmlWithToc(wrapPlaceholderParagraphs(rawHtml)).html;

  const usedIds = new Set<string>();
  const placeholders = replacePlaceholders(withIds, pkg, usedIds);
  warnings.push(...placeholders.warnings);

  const fallback = applyHeadingFallbacks(placeholders.html, pkg, usedIds);
  warnings.push(...fallback.warnings);

  const withTakeaways = injectTakeaways(fallback.html, renderTakeaways(pkg));
  const html = [
    renderDirectAnswer(pkg),
    withTakeaways,
    renderFaq(pkg),
    renderCitations(pkg),
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { html, warnings };
}

export function expectedHeadingId(text: string): string {
  return slugifyHeading(text);
}
