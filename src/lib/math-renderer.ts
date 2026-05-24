import katex from 'katex';

type MathToken = {
  displayMode: boolean;
  end: number;
  latex: string;
  start: number;
};

function isEscaped(source: string, index: number) {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function findClosingDelimiter(source: string, delimiter: '$' | '$$', from: number) {
  for (let cursor = from; cursor < source.length; cursor += 1) {
    if (isEscaped(source, cursor)) continue;
    if (source.startsWith(delimiter, cursor)) return cursor;
  }
  return -1;
}

export function extractMathTokens(source: string): MathToken[] {
  const tokens: MathToken[] = [];

  for (let cursor = 0; cursor < source.length; cursor += 1) {
    if (source[cursor] !== '$' || isEscaped(source, cursor)) continue;

    const displayMode = source[cursor + 1] === '$';
    const delimiter = displayMode ? '$$' : '$';
    const contentStart = cursor + delimiter.length;
    const contentEnd = findClosingDelimiter(source, delimiter, contentStart);

    if (contentEnd === -1) continue;

    const latex = source.slice(contentStart, contentEnd).trim();
    const tokenEnd = contentEnd + delimiter.length;

    if (latex) {
      tokens.push({
        displayMode,
        end: tokenEnd,
        latex,
        start: cursor,
      });
    }

    cursor = tokenEnd - 1;
  }

  return tokens;
}

export function renderLatex(latex: string, displayMode: boolean) {
  try {
    return katex.renderToString(latex, {
      displayMode,
      output: 'htmlAndMathml',
      strict: false,
      throwOnError: false,
      trust: false,
    });
  } catch {
    return null;
  }
}

export function renderMathInHtml(html: string) {
  if (!html || !html.includes('$')) return html;

  return html.replace(/(<(?:p|li|blockquote|td|th|span|div)(?:\s[^>]*)?>)([\s\S]*?)(<\/(?:p|li|blockquote|td|th|span|div)>)/gi, (match, openTag, inner, closeTag) => {
    if (!inner.includes('$') || /<(?:script|style|pre|code|iframe|math|span[^>]*class="[^"]*katex)/i.test(inner)) {
      return match;
    }

    const tokens = extractMathTokens(inner);
    if (tokens.length === 0) return match;

    let rendered = '';
    let cursor = 0;

    for (const token of tokens) {
      rendered += inner.slice(cursor, token.start);
      const mathHtml = renderLatex(token.latex, token.displayMode);
      rendered += mathHtml
        ? `<span class="${token.displayMode ? 'kd-math-block' : 'kd-math-inline'}">${mathHtml}</span>`
        : inner.slice(token.start, token.end);
      cursor = token.end;
    }

    rendered += inner.slice(cursor);
    return `${openTag}${rendered}${closeTag}`;
  });
}
