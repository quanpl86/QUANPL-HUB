import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitizes HTML content for safe rendering.
 * @param html The raw HTML string.
 * @returns A sanitized HTML string.
 */
export function sanitize(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'iframe'
    ],
    ALLOWED_ATTR: [
      'href', 'name', 'target', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp|sms):|[^a-z0-9+.-]|(?:[a-z0-9+.-]+:)?\/\/)/i
  });
}
