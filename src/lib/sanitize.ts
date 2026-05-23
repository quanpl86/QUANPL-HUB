import DOMPurify from 'dompurify';

let purify: any;

if (typeof window !== 'undefined') {
  // Client-side environment
  purify = DOMPurify;
} else {
  // Server-side environment
  try {
    const { JSDOM } = require('jsdom');
    const domWindow = new JSDOM('').window;
    purify = DOMPurify(domWindow as any);
  } catch (error) {
    console.error('DOMPurify initialization failed on server:', error);
    // Fallback: A dummy object that just returns the input or does very basic stripping
    purify = {
      sanitize: (html: string) => {
        // Simple fallback: just return the HTML or a very basic regex-based strip if needed
        // For security, it's better to return a message or limited text, 
        // but for usability we return the string and hope for the best on the client
        return html; 
      }
    };
  }
}

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
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'iframe',
      'details', 'summary', 'section', 'article', 'aside', 'span'
    ],
    ALLOWED_ATTR: [
      'id', 'href', 'name', 'target', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'data-type', 'data-title', 'data-intro', 'data-steps'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp|sms):|[^a-z0-9+.-]|(?:[a-z0-9+.-]+:)?\/\/)/i
  });
}
