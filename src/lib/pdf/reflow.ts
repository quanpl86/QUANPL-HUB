import type { PdfImageBox, PdfPageModel, PdfTextBox } from './types';

function columnOverlap(a: { x: number; width: number }, b: { x: number; width: number }) {
  const overlap = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  return overlap > Math.min(a.width, b.width) * 0.32;
}

function estimateTextHeight(box: PdfTextBox) {
  const lines = box.text.split('\n');
  const charWidth = Math.max(4, box.fontSize * 0.52);
  const wrapped = lines.reduce((sum, line) => {
    const row = Math.max(1, Math.ceil((line.length * charWidth) / Math.max(24, box.width)));
    return sum + row;
  }, 0);
  return Math.max(box.fontSize * 1.15, wrapped * box.fontSize * 1.28);
}

export function reflowColumn(
  page: PdfPageModel,
  anchorId: string,
  oldBottom: number,
  newBottom: number,
): PdfPageModel {
  const delta = newBottom - oldBottom;
  if (Math.abs(delta) < 0.8) return page;

  const anchor =
    page.texts.find((box) => box.id === anchorId) ||
    page.images.find((box) => box.id === anchorId);
  if (!anchor) return page;

  const patches = [...(page.patches || [])];
  const shift = <T extends PdfTextBox | PdfImageBox>(box: T, fillColor: string): T => {
    if (box.id === anchorId || box.deleted) return box;
    if (box.y < oldBottom - 1) return box;
    if (!columnOverlap(anchor, box)) return box;
    patches.push({
      x: box.x - 1,
      y: box.y - 1,
      width: box.width + 2,
      height: box.height + 2,
      color: 'background' in box && box.background ? String(box.background) : fillColor,
    });
    return { ...box, y: Math.max(0, box.y + delta), dirty: true };
  };

  return {
    ...page,
    texts: page.texts.map((box) => shift(box, box.background || page.pageColor || '#ffffff')),
    images: page.images.map((box) => shift(box, page.pageColor || '#ffffff')),
    patches,
  };
}

export function withAutoHeight(box: PdfTextBox, measuredHeight?: number): PdfTextBox {
  const height = Math.max(box.fontSize * 1.1, measuredHeight || estimateTextHeight(box));
  return { ...box, height };
}
