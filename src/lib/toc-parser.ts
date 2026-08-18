export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Slugify a heading text to create a valid HTML id attribute.
 * Handles Vietnamese diacritics by normalizing and stripping accents.
 * Shared with the Article Package compiler so after_heading_id matches the public TOC.
 */
export function slugifyHeading(text: string): string {
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
 * Uses Regex instead of JSDOM to avoid crashing on Edge/Serverless environments (Netlify/Vercel).
 * 
 * @param htmlString - Raw HTML content from Tiptap/CMS
 * @returns Object containing the TOC items array and the modified HTML with injected IDs
 */
export function parseHtmlWithToc(htmlString: string): { toc: TocItem[]; html: string } {
  if (!htmlString) return { toc: [], html: '' };

  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  // Matches <h2 ...>text</h2> or <h3 ...>text</h3>
  const regex = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi;

  const modifiedHtml = htmlString.replace(regex, (match, tag, attrs, innerHtml) => {
    // textContent can be roughly extracted by removing inner HTML tags
    const text = innerHtml
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (!text) return match; // skip empty headings

    let baseId = slugifyHeading(text);
    if (!baseId) baseId = 'section';

    // Ensure uniqueness
    let id = baseId;
    let counter = 1;
    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    usedIds.add(id);

    const level = tag.toLowerCase() === 'h2' ? 2 : 3;
    toc.push({ id, text, level });

    // Inject id into attrs.
    let newAttrs = attrs;
    if (/id="[^"]*"/.test(newAttrs)) {
      newAttrs = newAttrs.replace(/id="[^"]*"/, `id="${id}"`);
    } else {
      newAttrs = ` id="${id}"${newAttrs}`;
    }

    return `<${tag}${newAttrs}>${innerHtml}</${tag}>`;
  });

  return { toc, html: modifiedHtml };
}
