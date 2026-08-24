import type { PdfTextBox } from './types';

export type PdfGlyph = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  sourceFont: string;
  bold: boolean;
  italic: boolean;
  ascent?: number;
  descent?: number;
};

function parseCssColor(color: string): { r: number; g: number; b: number } | null {
  const hex = (color || '').trim();
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  if (short) {
    const [r, g, b] = short[1].split('').map((ch) => Number.parseInt(ch + ch, 16));
    return { r, g, b };
  }
  const long = /^#([0-9a-f]{6})$/i.exec(hex);
  if (long) {
    return {
      r: Number.parseInt(long[1].slice(0, 2), 16),
      g: Number.parseInt(long[1].slice(2, 4), 16),
      b: Number.parseInt(long[1].slice(4, 6), 16),
    };
  }
  const rgb = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(hex);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

export function inkSimilar(a: string, b: string) {
  if (!a || !b || a === b) return true;
  const pa = parseCssColor(a);
  const pb = parseCssColor(b);
  if (!pa || !pb) return true;
  const dist = Math.abs(pa.r - pb.r) + Math.abs(pa.g - pb.g) + Math.abs(pa.b - pb.b);
  return dist <= 96;
}

export function horizontalOverlap(a: { x: number; width: number }, b: { x: number; width: number }) {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
}

export function shouldMergeParagraphLines(prev: PdfTextBox, next: PdfTextBox) {
  if (prev.deleted || next.deleted) return false;
  const fs = Math.max(prev.fontSize, next.fontSize, 8);
  const step = next.y - prev.y;
  const gap = next.y - (prev.y + prev.height);

  // Side-by-side on the same row (label | body, title | ETA).
  if (step < fs * 0.52) return false;

  // New section: extra blank line.
  if (step > fs * 1.95 && gap > fs * 0.55) return false;
  if (gap > fs * 1.75) return false;

  const sizeRatio = Math.abs(prev.fontSize - next.fontSize) / fs;
  if (sizeRatio > 0.22) return false;
  if (!inkSimilar(prev.color, next.color)) return false;

  const overlap = horizontalOverlap(prev, next);
  const minW = Math.min(prev.width, next.width);
  const leftDrift = Math.abs(next.x - prev.x);
  const wrapped =
    overlap > minW * 0.28
    || leftDrift <= Math.max(16, fs * 1.85)
    || (next.x >= prev.x - 10 && next.x <= prev.x + Math.max(24, prev.width * 0.62));
  if (!wrapped) return false;

  return step <= fs * 1.9 || gap <= fs * 0.85;
}

export function clusterGlyphsIntoLines(items: PdfGlyph[]): PdfGlyph[][] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: PdfGlyph[][] = [];

  sorted.forEach((item) => {
    const current = lines[lines.length - 1];
    if (!current) {
      lines.push([item]);
      return;
    }
    const refY = current.reduce((sum, glyph) => sum + glyph.y, 0) / current.length;
    const fs = Math.max(current[0].fontSize, item.fontSize, 8);
    const sameLine = Math.abs(item.y - refY) <= fs * 0.68;
    if (sameLine) current.push(item);
    else lines.push([item]);
  });

  return lines;
}

export function joinGlyphLine(line: PdfGlyph[]) {
  const ordered = [...line].sort((a, b) => a.x - b.x);
  let text = '';
  ordered.forEach((item, index) => {
    if (index > 0) {
      const prev = ordered[index - 1];
      const gap = item.x - (prev.x + prev.width);
      text += gap > prev.fontSize * 0.28 ? ' ' : '';
    }
    text += item.str;
  });
  return text.replace(/\s+/g, ' ').trim();
}

export function mergeTextBoxes(group: PdfTextBox[], idPrefix: string, index: number): PdfTextBox {
  const first = group[0];
  const last = group[group.length - 1];
  const x = Math.min(...group.map((item) => item.x));
  const right = Math.max(...group.map((item) => item.x + item.width));
  return {
    ...first,
    id: `${idPrefix}-${index}-${Math.round(x)}-${Math.round(first.y)}`,
    x,
    y: first.y,
    width: Math.max(8, right - x),
    height: Math.max(first.height, last.y + last.height - first.y),
    text: group.map((item) => item.text).join('\n'),
    bold: group.some((item) => item.bold),
    italic: group.some((item) => item.italic),
    dirty: group.some((item) => item.dirty) || first.dirty,
  };
}

export function groupParagraphs(lines: PdfTextBox[]): PdfTextBox[] {
  const ordered = [...lines].filter((box) => !box.deleted).sort((a, b) => a.y - b.y || a.x - b.x);
  const groups: PdfTextBox[][] = [];

  ordered.forEach((line) => {
    const current = groups[groups.length - 1];
    if (!current) {
      groups.push([line]);
      return;
    }
    const prev = current[current.length - 1];
    if (shouldMergeParagraphLines(prev, line)) current.push(line);
    else groups.push([line]);
  });

  return groups.map((group, index) => (group.length === 1 ? group[0] : mergeTextBoxes(group, 'para', index)));
}

export function collectParagraphRun(boxes: PdfTextBox[], startId: string) {
  const live = boxes.filter((box) => !box.deleted).sort((a, b) => a.y - b.y || a.x - b.x);
  const start = live.findIndex((box) => box.id === startId);
  if (start < 0) return [];
  let from = start;
  let to = start;
  while (from > 0 && shouldMergeParagraphLines(live[from - 1], live[from])) from -= 1;
  while (to < live.length - 1 && shouldMergeParagraphLines(live[to], live[to + 1])) to += 1;
  return live.slice(from, to + 1);
}
