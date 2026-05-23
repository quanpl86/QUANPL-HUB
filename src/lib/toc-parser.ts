import { JSDOM } from 'jsdom';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Slugify a heading text to create a valid HTML id attribute.
 * Handles Vietnamese diacritics by normalizing and stripping accents.
 */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // Remove non-alphanumeric
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '')          // Trim leading/trailing hyphens
    .slice(0, 80);                  // Limit length
}

/**
 * Parses HTML content string and extracts H2/H3 headings for Table of Contents.
 * Injects `id` attributes into the headings for jump-link navigation.
 * 
 * @param htmlString - Raw HTML content from Tiptap/CMS
 * @returns Object containing the TOC items array and the modified HTML with injected IDs
 */
export function parseHtmlWithToc(htmlString: string): { toc: TocItem[]; html: string } {
  if (!htmlString) return { toc: [], html: '' };

  const dom = new JSDOM(`<!DOCTYPE html><body>${htmlString}</body>`);
  const doc = dom.window.document;
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  const headings = doc.querySelectorAll('h2, h3');

  headings.forEach((heading) => {
    const text = heading.textContent?.trim() || '';
    if (!text) return;

    let baseId = slugify(text);
    if (!baseId) baseId = 'section';

    // Ensure uniqueness
    let id = baseId;
    let counter = 1;
    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    usedIds.add(id);

    // Inject the id attribute into the heading element
    heading.setAttribute('id', id);

    const level = heading.tagName === 'H2' ? 2 : 3;
    toc.push({ id, text, level });
  });

  // Extract the modified body innerHTML (preserves original structure)
  const modifiedHtml = doc.body.innerHTML;

  return { toc, html: modifiedHtml };
}
