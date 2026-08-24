import type { PDFPageProxy } from 'pdfjs-dist';
import { parsePdfFontName } from './fonts';
import { clusterGlyphsIntoLines, groupParagraphs, joinGlyphLine } from './group-text';
import { loadPdfJs } from './pdf-runtime';
import type { ImportedPdfDocument, PdfImageBox, PdfPageModel, PdfTextBox } from './types';

export type { ImportedPdfDocument, PdfImageBox, PdfPageModel, PdfTextBox } from './types';

type PdfJsLib = Awaited<ReturnType<typeof loadPdfJs>>;

type PdfImageObject = {
  data?: Uint8Array | Uint8ClampedArray | Uint16Array;
  width?: number;
  height?: number;
  kind?: number;
  bitmap?: ImageBitmap;
};

type PdfObjectStore = {
  get: (name: string, callback?: (data: unknown) => void) => unknown;
};

type RawTextItem = {
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
  ascent: number;
  descent: number;
};

function normalizeFontMetric(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return fallback;
  const magnitude = Math.abs(value);
  return magnitude > 3 ? magnitude / 1000 : magnitude;
}

const RENDER_SCALE = 2;
const MAX_IMAGE_EDGE = 1800;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isPdfImageObject(value: unknown): value is PdfImageObject {
  return typeof value === 'object' && value !== null;
}

function asNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'number')) return null;
  return value as number[];
}

async function resolvePdfFont(
  page: PDFPageProxy,
  fontName: string,
  styles: Record<string, { fontFamily?: string }> | undefined,
): Promise<ReturnType<typeof parsePdfFontName>> {
  const styleFamily = styles?.[fontName]?.fontFamily || '';
  const fontObj =
    (await readObj(page.commonObjs as unknown as PdfObjectStore, fontName)) ||
    (await readObj(page.objs as unknown as PdfObjectStore, fontName));
  let raw = styleFamily || fontName;
  if (fontObj && typeof fontObj === 'object') {
    const record = fontObj as { name?: string; fallbackName?: string; fontName?: string };
    raw = record.name || record.fallbackName || record.fontName || raw;
  }
  return parsePdfFontName(raw);
}

function bitmapToDataUrl(bitmap: ImageBitmap) {
  const canvas = document.createElement('canvas');
  let { width, height } = bitmap;
  if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE) {
    const scale = MAX_IMAGE_EDGE / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function toRgba(
  data: Uint8Array | Uint8ClampedArray | Uint16Array,
  width: number,
  height: number,
  kind?: number,
) {
  const pixelCount = width * height;
  const rgba = new Uint8ClampedArray(pixelCount * 4);

  if (kind === 1 || data.length === pixelCount) {
    for (let i = 0; i < pixelCount; i += 1) {
      const v = data[i] ?? 0;
      const o = i * 4;
      rgba[o] = v;
      rgba[o + 1] = v;
      rgba[o + 2] = v;
      rgba[o + 3] = 255;
    }
    return rgba;
  }

  if (kind === 2 || data.length === pixelCount * 3) {
    for (let i = 0, j = 0; i < pixelCount; i += 1, j += 3) {
      const o = i * 4;
      rgba[o] = data[j] ?? 0;
      rgba[o + 1] = data[j + 1] ?? 0;
      rgba[o + 2] = data[j + 2] ?? 0;
      rgba[o + 3] = 255;
    }
    return rgba;
  }

  if (kind === 3 || data.length === pixelCount * 4) {
    rgba.set(data.subarray(0, pixelCount * 4));
    return rgba;
  }

  return null;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.92) {
  if (canvas.width > MAX_IMAGE_EDGE || canvas.height > MAX_IMAGE_EDGE) {
    const scale = MAX_IMAGE_EDGE / Math.max(canvas.width, canvas.height);
    const resized = document.createElement('canvas');
    resized.width = Math.max(1, Math.round(canvas.width * scale));
    resized.height = Math.max(1, Math.round(canvas.height * scale));
    const ctx = resized.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/jpeg', quality);
    ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
    return resized.toDataURL('image/jpeg', quality);
  }
  return canvas.toDataURL('image/jpeg', quality);
}

async function imageObjToDataUrl(img: unknown): Promise<string | null> {
  if (!img) return null;

  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    return bitmapToDataUrl(img);
  }
  if (!isPdfImageObject(img)) return null;
  if (img.bitmap && typeof ImageBitmap !== 'undefined' && img.bitmap instanceof ImageBitmap) {
    return bitmapToDataUrl(img.bitmap);
  }

  const width = Number(img.width);
  const height = Number(img.height);
  if (!width || !height) return null;
  if (width < 8 && height < 8) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx || !img.data) return null;

  const rgba = toRgba(img.data, width, height, img.kind);
  if (!rgba) return null;
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvasToJpeg(canvas, 0.9);
}

function readObj(objs: PdfObjectStore, name: string) {
  return new Promise<unknown>((resolve) => {
    try {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, 2500);
      objs.get(name, (data: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(data);
      });
    } catch {
      resolve(null);
    }
  });
}

function multiply(a: number[], b: number[]) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function sampleBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  pageWidth: number,
  pageHeight: number,
  box: { x: number; y: number; width: number; height: number },
) {
  const toCanvas = (x: number, y: number) => [
    Math.max(0, Math.min(canvasWidth - 1, Math.round((x / pageWidth) * canvasWidth))),
    Math.max(0, Math.min(canvasHeight - 1, Math.round((y / pageHeight) * canvasHeight))),
  ] as const;

  const points = [
    toCanvas(box.x - 4, box.y - 4),
    toCanvas(box.x + box.width + 4, box.y - 4),
    toCanvas(box.x - 4, box.y + box.height + 4),
    toCanvas(box.x + box.width / 2, box.y - 6),
  ];

  try {
    const samples = points.map(([sx, sy]) => {
      const pixel = ctx.getImageData(sx, sy, 1, 1).data;
      return { r: pixel[0], g: pixel[1], b: pixel[2], lum: pixel[0] * 0.3 + pixel[1] * 0.59 + pixel[2] * 0.11 };
    });
    samples.sort((a, b) => b.lum - a.lum);
    const pick = samples[0];
    return `rgb(${pick.r}, ${pick.g}, ${pick.b})`;
  } catch {
    return '#ffffff';
  }
}

function groupTextItems(items: RawTextItem[], pageWidth: number, pageHeight: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): PdfTextBox[] {
  if (items.length === 0) return [];

  return clusterGlyphsIntoLines(items).map((line, index) => {
    const ordered = [...line].sort((a, b) => a.x - b.x);
    const text = joinGlyphLine(ordered);
    const fontSize = Math.max(...ordered.map((item) => item.fontSize));
    const ascent = Math.max(...ordered.map((item) => item.ascent ?? 0.8));
    const descent = Math.max(...ordered.map((item) => item.descent ?? 0.2));
    const x = Math.min(...ordered.map((item) => item.x)) - 1;
    const baseline = Math.min(...ordered.map((item) => item.y));
    const right = Math.max(...ordered.map((item) => item.x + item.width));
    const y = Math.max(0, baseline - fontSize * ascent - 1);
    const width = Math.max(12, right - x + 4);
    const height = Math.max(fontSize * 1.15, fontSize * (ascent + descent) + 3);
    const box = { x, y, width, height };

    return {
      id: `text-${index}-${Math.round(x)}-${Math.round(y)}`,
      x,
      y,
      width,
      height,
      text,
      fontSize,
      fontFamily: ordered[0].fontFamily,
      sourceFont: ordered[0].sourceFont,
      bold: ordered.some((item) => item.bold),
      italic: ordered.some((item) => item.italic),
      underline: false,
      strike: false,
      color: '#111111',
      highlight: '',
      align: 'left' as const,
      background: sampleBackground(ctx, canvas.width, canvas.height, pageWidth, pageHeight, box),
      dirty: false,
      deleted: false,
    };
  }).filter((box) => box.text.length > 0 && box.width > 1 && box.height > 1).map((box) => ({
    ...box,
    color: sampleTextColor(ctx, canvas, pageWidth, pageHeight, box, box.background),
  }));
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function sampleTextColor(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  box: { x: number; y: number; width: number; height: number },
  background: string,
) {
  const counts = new Map<string, { r: number; g: number; b: number; n: number }>();
  const stepsX = 8;
  const stepsY = 4;
  for (let iy = 0; iy < stepsY; iy += 1) {
    for (let ix = 0; ix < stepsX; ix += 1) {
      const px = box.x + ((ix + 0.5) / stepsX) * box.width;
      const py = box.y + ((iy + 0.4) / stepsY) * box.height;
      const sx = Math.max(0, Math.min(canvas.width - 1, Math.round((px / pageWidth) * canvas.width)));
      const sy = Math.max(0, Math.min(canvas.height - 1, Math.round((py / pageHeight) * canvas.height)));
      try {
        const pixel = ctx.getImageData(sx, sy, 1, 1).data;
        const lum = pixel[0] * 0.3 + pixel[1] * 0.59 + pixel[2] * 0.11;
        const bgLum = 220;
        if (Math.abs(lum - bgLum) < 18 && pixel[0] > 200 && pixel[1] > 200 && pixel[2] > 200) continue;
        const key = `${Math.round(pixel[0] / 12) * 12}-${Math.round(pixel[1] / 12) * 12}-${Math.round(pixel[2] / 12) * 12}`;
        const current = counts.get(key) || { r: 0, g: 0, b: 0, n: 0 };
        current.r += pixel[0];
        current.g += pixel[1];
        current.b += pixel[2];
        current.n += 1;
        counts.set(key, current);
      } catch {
        continue;
      }
    }
  }
  const ranked = [...counts.values()].sort((a, b) => b.n - a.n);
  const ink = ranked.find((item) => {
    const r = item.r / item.n;
    const g = item.g / item.n;
    const b = item.b / item.n;
    return r * 0.3 + g * 0.59 + b * 0.11 < 170 && item.n >= 1;
  }) || ranked[0];
  if (!ink) return '#111111';
  void background;
  const r = Math.round(ink.r / ink.n);
  const g = Math.round(ink.g / ink.n);
  const b = Math.round(ink.b / ink.n);
  if (r * 0.3 + g * 0.59 + b * 0.11 > 170) return '#111111';
  return rgbToHex(r, g, b);
}

function detectGraphicFrames(
  canvas: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  textBoxes: PdfTextBox[],
  existing: PdfImageBox[],
): PdfImageBox[] {
  const dw = 240;
  const dh = Math.max(1, Math.round((canvas.height * dw) / canvas.width));
  const small = document.createElement('canvas');
  small.width = dw;
  small.height = dh;
  const sctx = small.getContext('2d');
  if (!sctx) return [];
  sctx.drawImage(canvas, 0, 0, dw, dh);
  const image = sctx.getImageData(0, 0, dw, dh);
  const data = image.data;
  const idx = (x: number, y: number) => (y * dw + x) * 4;
  const corner = (x: number, y: number) => ({ r: data[idx(x, y)], g: data[idx(x, y) + 1], b: data[idx(x, y) + 2] });
  const bg = {
    r: (corner(1, 1).r + corner(dw - 2, 1).r + corner(1, dh - 2).r + corner(dw - 2, dh - 2).r) / 4,
    g: (corner(1, 1).g + corner(dw - 2, 1).g + corner(1, dh - 2).g + corner(dw - 2, dh - 2).g) / 4,
    b: (corner(1, 1).b + corner(dw - 2, 1).b + corner(1, dh - 2).b + corner(dw - 2, dh - 2).b) / 4,
  };
  const marked = new Uint8Array(dw * dh);
  const toSmall = (pageX: number, pageY: number) => ({
    x: Math.floor((pageX / pageWidth) * dw),
    y: Math.floor((pageY / pageHeight) * dh),
  });
  textBoxes.forEach((box) => {
    const a = toSmall(box.x - 2, box.y - 2);
    const b = toSmall(box.x + box.width + 2, box.y + box.height + 2);
    for (let y = Math.max(0, a.y); y < Math.min(dh, b.y); y += 1) {
      for (let x = Math.max(0, a.x); x < Math.min(dw, b.x); x += 1) marked[y * dw + x] = 2;
    }
  });
  for (let i = 0; i < dw * dh; i += 1) {
    if (marked[i] === 2) continue;
    const o = i * 4;
    const dist = Math.abs(data[o] - bg.r) + Math.abs(data[o + 1] - bg.g) + Math.abs(data[o + 2] - bg.b);
    if (dist > 55) marked[i] = 1;
  }

  const seen = new Uint8Array(dw * dh);
  const frames: PdfImageBox[] = [];
  const stack: number[] = [];
  for (let start = 0; start < dw * dh; start += 1) {
    if (marked[start] !== 1 || seen[start]) continue;
    stack.push(start);
    seen[start] = 1;
    let minX = dw;
    let minY = dh;
    let maxX = 0;
    let maxY = 0;
    let count = 0;
    while (stack.length) {
      const i = stack.pop() as number;
      const x = i % dw;
      const y = Math.floor(i / dw);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      count += 1;
      const neighbors = [i - 1, i + 1, i - dw, i + dw];
      neighbors.forEach((n) => {
        if (n < 0 || n >= dw * dh || seen[n] || marked[n] !== 1) return;
        if (Math.abs((n % dw) - x) + Math.abs(Math.floor(n / dw) - y) !== 1) return;
        seen[n] = 1;
        stack.push(n);
      });
    }
    if (count < 28) continue;
    const x = (minX / dw) * pageWidth;
    const y = (minY / dh) * pageHeight;
    const width = ((maxX - minX + 1) / dw) * pageWidth;
    const height = ((maxY - minY + 1) / dh) * pageHeight;
    if (width < 14 || height < 14) continue;
    if (width > pageWidth * 0.88 && height > pageHeight * 0.88) continue;
    const overlapsText = textBoxes.some((box) => {
      const ox = Math.min(x + width, box.x + box.width) - Math.max(x, box.x);
      const oy = Math.min(y + height, box.y + box.height) - Math.max(y, box.y);
      if (ox <= 0 || oy <= 0) return false;
      return (ox * oy) / (width * height) > 0.72;
    });
    if (overlapsText) continue;
    const overlapsExisting = existing.some((box) => {
      const ox = Math.min(x + width, box.x + box.width) - Math.max(x, box.x);
      const oy = Math.min(y + height, box.y + box.height) - Math.max(y, box.y);
      if (ox <= 0 || oy <= 0) return false;
      return (ox * oy) / (width * height) > 0.6;
    });
    if (overlapsExisting) continue;

    const crop = document.createElement('canvas');
    const sx = Math.max(0, Math.floor((minX / dw) * canvas.width));
    const sy = Math.max(0, Math.floor((minY / dh) * canvas.height));
    const sw = Math.min(canvas.width - sx, Math.ceil(((maxX - minX + 1) / dw) * canvas.width));
    const sh = Math.min(canvas.height - sy, Math.ceil(((maxY - minY + 1) / dh) * canvas.height));
    if (sw < 4 || sh < 4) continue;
    crop.width = sw;
    crop.height = sh;
    const cctx = crop.getContext('2d');
    if (!cctx) continue;
    cctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    frames.push({
      id: `frame-${Math.round(x)}-${Math.round(y)}`,
      x,
      y,
      width,
      height,
      src: crop.toDataURL('image/png'),
      rotation: 0,
      opacity: 1,
      dirty: false,
      deleted: false,
    });
  }
  return frames;
}

async function extractPageImages(
  page: PDFPageProxy,
  pdfjsLib: PdfJsLib,
  pageWidth: number,
  pageHeight: number,
): Promise<PdfImageBox[]> {
  const ops = await page.getOperatorList();
  const images: PdfImageBox[] = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  const viewport = page.getViewport({ scale: 1 });

  const paintOps = new Set([
    pdfjsLib.OPS.paintImageXObject,
    pdfjsLib.OPS.paintImageXObjectRepeat,
    pdfjsLib.OPS.paintInlineImageXObject,
    pdfjsLib.OPS.paintInlineImageXObjectGroup,
  ]);

  for (let i = 0; i < ops.fnArray.length; i += 1) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];

    if (fn === pdfjsLib.OPS.save) {
      stack.push(ctm.slice());
      continue;
    }
    if (fn === pdfjsLib.OPS.restore) {
      ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
      continue;
    }
    if (fn === pdfjsLib.OPS.transform) {
      const matrix = asNumberArray(args);
      if (matrix && matrix.length >= 6) ctm = multiply(ctm, matrix);
      continue;
    }
    if (!paintOps.has(fn)) continue;

    const imgName = Array.isArray(args) && typeof args[0] === 'string' ? args[0] : `inline-${i}`;
    const img =
      (await readObj(page.objs as unknown as PdfObjectStore, imgName)) ||
      (await readObj(page.commonObjs as unknown as PdfObjectStore, imgName)) ||
      (Array.isArray(args) && typeof args[0] === 'object' ? args[0] : null);

    const src = await imageObjToDataUrl(img);
    if (!src) continue;

    const origin = viewport.convertToViewportPoint(ctm[4], ctm[5]);
    const xAxis = viewport.convertToViewportPoint(ctm[4] + ctm[0], ctm[5] + ctm[1]);
    const yAxis = viewport.convertToViewportPoint(ctm[4] + ctm[2], ctm[5] + ctm[3]);
    const xs = [origin[0], xAxis[0], yAxis[0]];
    const ys = [origin[1], xAxis[1], yAxis[1]];
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(8, Math.max(...xs) - x);
    const height = Math.max(8, Math.max(...ys) - y);

    if (width < 12 && height < 12) continue;
    if (width > pageWidth * 0.94 && height > pageHeight * 0.94) continue;

    images.push({
      id: `img-${i}-${Math.round(x)}-${Math.round(y)}`,
      x,
      y,
      width,
      height,
      src,
      rotation: 0,
      opacity: 1,
      dirty: false,
      deleted: false,
    });
  }

  return images;
}

async function renderPageCanvas(page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return { canvas, ctx };
}

export async function importPdfFile(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportedPdfDocument> {
  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: PdfPageModel[] = [];
  let textCharacters = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const rendered = await renderPageCanvas(page);
    if (!rendered) continue;

    const textContent = await page.getTextContent();
    const fontCache = new Map<string, ReturnType<typeof parsePdfFontName>>();
    const rawItems: RawTextItem[] = [];
    for (const item of textContent.items) {
      if (!('str' in item) || typeof item.str !== 'string' || item.str.trim().length === 0) continue;
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const [x, y] = viewport.convertToViewportPoint(transform[4], transform[5]);
      const rawWidth = typeof item.width === 'number' ? item.width : item.str.length * 5;
      const [x2] = viewport.convertToViewportPoint(transform[4] + rawWidth, transform[5]);
      const fontSize = Math.hypot(transform[2], transform[3]) || Math.abs(transform[0]) || 12;
      const width = Math.abs(x2 - x) || rawWidth;
      const fontName = String(item.fontName || '');
      let font = fontCache.get(fontName);
      if (!font) {
        font = await resolvePdfFont(page, fontName, textContent.styles);
        fontCache.set(fontName, font);
      }
      const style = textContent.styles?.[fontName];
      rawItems.push({
        str: item.str,
        x,
        y,
        width,
        height: fontSize,
        fontSize,
        fontFamily: font.css,
        sourceFont: font.label,
        bold: font.bold,
        italic: font.italic,
        ascent: normalizeFontMetric(style?.ascent, 0.8),
        descent: normalizeFontMetric(style?.descent, 0.2),
      });
    }

    const lines = groupTextItems(rawItems, viewport.width, viewport.height, rendered.ctx, rendered.canvas);
    const texts = groupParagraphs(lines);
    const images = await extractPageImages(page, pdfjsLib, viewport.width, viewport.height);
    const frames = detectGraphicFrames(rendered.canvas, viewport.width, viewport.height, texts, images);
    textCharacters += texts.reduce((sum, box) => sum + box.text.length, 0);
    const pageColor = sampleBackground(
      rendered.ctx,
      rendered.canvas.width,
      rendered.canvas.height,
      viewport.width,
      viewport.height,
      { x: 4, y: 4, width: 8, height: 8 },
    );

    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      background: canvasToJpeg(rendered.canvas, 0.93),
      pageColor,
      texts,
      images: [...images, ...frames],
      patches: [],
    });
    onProgress?.(pageNumber, pdf.numPages);
  }

  return {
    pages,
    pageCount: pages.length,
    title: file.name.replace(/\.pdf$/i, ''),
    textCharacters,
  };
}

export function createBlankPdfHtml(title = 'Tài liệu mới') {
  return `<h1>${escapeHtml(title)}</h1><p>Bắt đầu soạn nội dung PDF tại đây. Thêm văn bản, tiêu đề, danh sách và hình ảnh bằng thanh công cụ giống trình soạn bài viết.</p>`;
}

export function createBlankPdfPage(title = 'Tài liệu mới'): PdfPageModel {
  return {
    pageNumber: 1,
    width: 595,
    height: 842,
    background: '',
    pageColor: '#ffffff',
    patches: [],
    texts: [
      {
        id: 'text-title',
        x: 56,
        y: 72,
        width: 480,
        height: 36,
        text: title,
        fontSize: 28,
        fontFamily: 'Arial, Helvetica, sans-serif',
        sourceFont: 'Arial',
        bold: true,
        italic: false,
        underline: false,
        strike: false,
        color: '#111111',
        highlight: '',
        align: 'left',
        background: '#ffffff',
        dirty: true,
        deleted: false,
      },
      {
        id: 'text-body',
        x: 56,
        y: 128,
        width: 480,
        height: 48,
        text: 'Click để sửa văn bản. Dùng thanh công cụ để thêm ảnh, đổi font, căn lề.',
        fontSize: 14,
        fontFamily: 'Arial, Helvetica, sans-serif',
        sourceFont: 'Arial',
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        color: '#333333',
        highlight: '',
        align: 'left',
        background: '#ffffff',
        dirty: true,
        deleted: false,
      },
    ],
    images: [],
  };
}
