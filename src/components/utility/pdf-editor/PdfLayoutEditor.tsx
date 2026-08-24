'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crop as CropIcon,
  Eraser,
  GripVertical,
  Highlighter,
  ImagePlus,
  Italic,
  Keyboard,
  Maximize2,
  Minimize2,
  Plus,
  Scissors,
  Redo2,
  RefreshCw,
  RotateCw,
  Strikethrough,
  Trash2,
  Type,
  Underline as UnderIcon,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropModal } from '@/components/admin/editor/ImageCropModal';
import {
  buildImageMenuItems,
  buildPageMenuItems,
  buildTextMenuItems,
  PdfContextMenu,
} from '@/components/utility/pdf-editor/PdfContextMenu';
import {
  hasFieldTextSelection,
  isMacPlatform,
  isModifier,
  isTypingTarget,
  parsePdfClipboard,
  PDF_CLIP_MARK,
  serializePdfClipboard,
  SHORTCUTS,
  type PdfClipboardPayload,
} from '@/lib/pdf/editor-shortcuts';
import { fontPickerOptions } from '@/lib/pdf/fonts';
import { collectParagraphRun, mergeTextBoxes } from '@/lib/pdf/group-text';
import { flipImageSrc } from '@/lib/pdf/image-ops';
import { reflowColumn } from '@/lib/pdf/reflow';
import type { PdfImageBox, PdfPageModel, PdfTextBox } from '@/lib/pdf/types';

type ContextMenuState = {
  clientX: number;
  clientY: number;
  pageIndex: number;
  kind: 'text' | 'image' | 'page';
  id?: string;
  pageX: number;
  pageY: number;
};

type ToolTab = 'text' | 'structure' | 'ai-media';
type Selection = { pageIndex: number; kind: 'text' | 'image'; id: string } | null;
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';
type DragMode = {
  pageIndex: number;
  kind: 'text' | 'image';
  id: string;
  action: 'move' | 'resize';
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  origin: { x: number; y: number; width: number; height: number };
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob) {
  return fileToDataUrl(new File([blob], 'crop.jpg', { type: blob.type || 'image/jpeg' }));
}

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function clonePages(pages: PdfPageModel[]) {
  return structuredClone(pages);
}

function getBox(page: PdfPageModel, kind: 'text' | 'image', id: string) {
  return kind === 'text'
    ? page.texts.find((box) => box.id === id)
    : page.images.find((box) => box.id === id);
}

function containsBox(box: { x: number; y: number; width: number; height: number }, x: number, y: number, pad = 2) {
  return x >= box.x - pad && x <= box.x + box.width + pad && y >= box.y - pad && y <= box.y + box.height + pad;
}

function hitTest(page: PdfPageModel, x: number, y: number) {
  const texts = page.texts
    .filter((box) => !box.deleted && containsBox(box, x, y, 10))
    .sort((a, b) => a.width * a.height - b.width * b.height);
  if (texts[0]) return { kind: 'text' as const, id: texts[0].id };

  const images = page.images
    .filter((box) => !box.deleted && containsBox(box, x, y, 6))
    .sort((a, b) => a.width * a.height - b.width * b.height);
  if (images[0]) return { kind: 'image' as const, id: images[0].id };

  return null;
}

function stackZ(kind: 'text' | 'image', box: { width: number; height: number; layer?: number }) {
  const area = Math.max(1, box.width * box.height);
  return (kind === 'text' ? 40 : 8) + Math.max(0, 80 - Math.round(Math.log2(area))) + (box.layer || 0) * 250;
}

function measureTextHeight(box: PdfTextBox, textarea: HTMLTextAreaElement | null, zoom: number) {
  if (!textarea) return Math.max(box.height, box.fontSize * 1.2);
  return Math.max(box.fontSize * 1.2, textarea.scrollHeight / Math.max(0.2, zoom));
}

function parseCssColor(color: string): { r: number; g: number; b: number } | null {
  const hex = color.trim();
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

function luminance(color: { r: number; g: number; b: number }) {
  return color.r * 0.3 + color.g * 0.59 + color.b * 0.11;
}

function readableTextColor(color: string, background: string) {
  const fg = parseCssColor(color);
  const bg = parseCssColor(background) || { r: 255, g: 255, b: 255 };
  if (!fg) return luminance(bg) > 140 ? '#111111' : '#f8fafc';
  if (Math.abs(luminance(fg) - luminance(bg)) < 80) return luminance(bg) > 140 ? '#111111' : '#f8fafc';
  return color;
}

export function PdfLayoutEditor({
  pages: initialPages,
  onChange,
}: {
  pages: PdfPageModel[];
  onChange: (pages: PdfPageModel[]) => void;
}) {
  const deskRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(initialPages);
  const pagesRef = useRef(pages);
  const onChangeRef = useRef(onChange);
  const historyRef = useRef<PdfPageModel[][]>([]);
  const futureRef = useRef<PdfPageModel[][]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const fittedRef = useRef(false);
  const dragRef = useRef<DragMode | null>(null);
  const pendingPointerRef = useRef<DragMode | null>(null);
  const dragOriginPagesRef = useRef<PdfPageModel[] | null>(null);
  const selectionRef = useRef<Selection>(null);
  const editingIdRef = useRef<string | null>(null);
  const zoomRef = useRef(1);
  const currentPageRef = useRef(0);
  const clipboardRef = useRef<PdfClipboardPayload | null>(null);
  const typingSnapshotRef = useRef(false);
  const composingRef = useRef(false);
  const showHelpRef = useRef(false);

  const [isFullView, setIsFullView] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('text');
  const [selection, setSelection] = useState<Selection>(null);
  const [zoom, setZoom] = useState(1);
  const [showBoxes, setShowBoxes] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imeDraft, setImeDraft] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<ContextMenuState | null>(null);
  const insertAtRef = useRef<{ pageIndex: number; x: number; y: number } | null>(null);
  const modLabel = isMacPlatform() ? '⌘' : 'Ctrl';

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => { selectionRef.current = selection; }, [selection]);
  useEffect(() => { editingIdRef.current = editingId; }, [editingId]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { showHelpRef.current = showHelp; }, [showHelp]);
  useEffect(() => { contextMenuRef.current = contextMenu; }, [contextMenu]);

  const selectedPage = selection ? pages[selection.pageIndex] : pages[currentPage];
  const selectedText = selection?.kind === 'text'
    ? pages[selection.pageIndex]?.texts.find((box) => box.id === selection.id)
    : null;
  const selectedImage = selection?.kind === 'image'
    ? pages[selection.pageIndex]?.images.find((box) => box.id === selection.id)
    : null;

  const fontOptions = useMemo(() => {
    const detected = pages.flatMap((page) => page.texts.map((box) => box.fontFamily));
    return fontPickerOptions(detected);
  }, [pages]);

  const commit = useCallback((next: PdfPageModel[], record = true) => {
    if (record) {
      historyRef.current.push(clonePages(pagesRef.current));
      if (historyRef.current.length > 60) historyRef.current.shift();
      futureRef.current = [];
    }
    pagesRef.current = next;
    setPages(next);
    onChangeRef.current(next);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const updatePage = useCallback((pageIndex: number, updater: (page: PdfPageModel) => PdfPageModel, record = true) => {
    commit(pagesRef.current.map((page, index) => (index === pageIndex ? updater(page) : page)), record);
  }, [commit]);

  const patchTextById = useCallback((pageIndex: number, id: string, patch: Partial<PdfTextBox>, record = true) => {
    updatePage(pageIndex, (page) => {
      const current = page.texts.find((box) => box.id === id);
      if (!current) return page;
      const oldBottom = current.y + current.height;
      const next = { ...current, ...patch, dirty: true };
      const texts = page.texts.map((box) => (box.id === id ? next : box));
      const updated = { ...page, texts };
      if (Math.abs(next.y + next.height - oldBottom) > 0.8) {
        return reflowColumn(updated, next.id, oldBottom, next.y + next.height);
      }
      return updated;
    }, record);
  }, [updatePage]);

  const patchText = useCallback((patch: Partial<PdfTextBox>, record = true) => {
    const selected = selectionRef.current;
    if (!selected || selected.kind !== 'text') return;
    patchTextById(selected.pageIndex, selected.id, patch, record);
  }, [patchTextById]);

  const applyTextValue = useCallback((pageIndex: number, id: string, text: string, textarea: HTMLTextAreaElement | null, record: boolean) => {
    const box = pagesRef.current[pageIndex]?.texts.find((item) => item.id === id);
    if (!box) return;
    patchTextById(pageIndex, id, {
      text,
      height: measureTextHeight(box, textarea, zoomRef.current),
    }, record);
  }, [patchTextById]);

  const selectTextBox = useCallback((pageIndex: number, id: string) => {
    const nextSelection = { pageIndex, kind: 'text' as const, id };
    selectionRef.current = nextSelection;
    editingIdRef.current = id;
    setSelection(nextSelection);
    setEditingId(id);
    setCurrentPage(pageIndex);
    setActiveToolTab('text');
  }, []);

  const selectImageBox = useCallback((pageIndex: number, id: string) => {
    const nextSelection = { pageIndex, kind: 'image' as const, id };
    selectionRef.current = nextSelection;
    editingIdRef.current = null;
    setSelection(nextSelection);
    setEditingId(null);
    setCurrentPage(pageIndex);
    setActiveToolTab('ai-media');
  }, []);

  const mergeSelectedParagraph = useCallback(() => {
    const selected = selectionRef.current;
    if (!selected || selected.kind !== 'text') return;
    const page = pagesRef.current[selected.pageIndex];
    if (!page) return;
    const run = collectParagraphRun(page.texts, selected.id);
    if (run.length < 2) {
      toast.message('Không có dòng nào kề để gộp.');
      return;
    }
    const keepId = run[0].id;
    const merged = { ...mergeTextBoxes(run, 'para', 0), id: keepId, dirty: true };
    const drop = new Set(run.slice(1).map((box) => box.id));
    updatePage(selected.pageIndex, (current) => ({
      ...current,
      texts: current.texts
        .filter((box) => !drop.has(box.id))
        .map((box) => (box.id === keepId ? merged : box)),
    }));
    selectTextBox(selected.pageIndex, keepId);
    toast.success(`Đã gộp ${run.length} dòng thành một đoạn.`);
  }, [selectTextBox, updatePage]);

  const setBoxLayer = useCallback((pageIndex: number, kind: 'text' | 'image', id: string, mode: 'front' | 'back') => {
    updatePage(pageIndex, (page) => {
      const layers = [
        ...page.texts.map((box) => box.layer || 0),
        ...page.images.map((box) => box.layer || 0),
      ];
      const nextLayer = mode === 'front'
        ? Math.max(0, ...layers) + 1
        : Math.min(0, ...layers) - 1;
      if (kind === 'text') {
        return { ...page, texts: page.texts.map((box) => box.id === id ? { ...box, layer: nextLayer } : box) };
      }
      return { ...page, images: page.images.map((box) => box.id === id ? { ...box, layer: nextLayer } : box) };
    });
  }, [updatePage]);

  const patchImage = useCallback((patch: Partial<PdfImageBox>, record = true) => {
    const selected = selectionRef.current;
    if (!selected || selected.kind !== 'image') return;
    updatePage(selected.pageIndex, (page) => ({
      ...page,
      images: page.images.map((box) => box.id === selected.id ? { ...box, ...patch, dirty: true } : box),
    }), record);
  }, [updatePage]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(clonePages(pagesRef.current));
    pagesRef.current = prev;
    setPages(prev);
    onChangeRef.current(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(clonePages(pagesRef.current));
    pagesRef.current = next;
    setPages(next);
    onChangeRef.current(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const deleteSelected = useCallback(() => {
    const selected = selectionRef.current;
    if (!selected) return;
    updatePage(selected.pageIndex, (page) => {
      const current = selected.kind === 'text'
        ? page.texts.find((box) => box.id === selected.id)
        : page.images.find((box) => box.id === selected.id);
      if (!current) return page;
      const oldBottom = current.y + current.height;
      const texts = selected.kind === 'text'
        ? page.texts.map((box) => box.id === selected.id ? { ...box, deleted: true, dirty: true, text: '' } : box)
        : page.texts;
      const images = selected.kind === 'image'
        ? page.images.map((box) => box.id === selected.id ? { ...box, deleted: true, dirty: true } : box)
        : page.images;
      return reflowColumn({ ...page, texts, images }, selected.id, oldBottom, current.y);
    });
    setSelection(null);
    setEditingId(null);
  }, [updatePage]);

  const duplicateSelected = useCallback(() => {
    const selected = selectionRef.current;
    if (!selected) return;
    const page = pagesRef.current[selected.pageIndex];
    if (!page) return;
    if (selected.kind === 'text') {
      const box = page.texts.find((item) => item.id === selected.id);
      if (!box) return;
      const copy = { ...box, id: uid('text'), x: box.x + 16, y: box.y + 16, dirty: true };
      updatePage(selected.pageIndex, (current) => ({ ...current, texts: [...current.texts, copy] }));
      setSelection({ ...selected, id: copy.id });
    } else {
      const box = page.images.find((item) => item.id === selected.id);
      if (!box) return;
      const copy = { ...box, id: uid('img'), x: box.x + 16, y: box.y + 16, dirty: true };
      updatePage(selected.pageIndex, (current) => ({ ...current, images: [...current.images, copy] }));
      setSelection({ ...selected, id: copy.id });
    }
  }, [updatePage]);

  const getSelectedPayload = useCallback((): PdfClipboardPayload | null => {
    const selected = selectionRef.current;
    if (!selected) return null;
    const page = pagesRef.current[selected.pageIndex];
    if (!page) return null;
    const object = selected.kind === 'text'
      ? page.texts.find((item) => item.id === selected.id)
      : page.images.find((item) => item.id === selected.id);
    if (!object || object.deleted) return null;
    return { [PDF_CLIP_MARK]: 1, kind: selected.kind, object: structuredClone(object) };
  }, []);

  const copySelected = useCallback((clipboard?: DataTransfer | null) => {
    const payload = getSelectedPayload();
    if (!payload) return false;
    clipboardRef.current = payload;
    const json = serializePdfClipboard(payload);
    clipboard?.setData('text/plain', json);
    void navigator.clipboard?.writeText(json).catch(() => undefined);
    toast.success('Đã copy.');
    return true;
  }, [getSelectedPayload]);

  const pastePayload = useCallback((payload: PdfClipboardPayload) => {
    const pageIndex = selectionRef.current?.pageIndex ?? currentPageRef.current;
    const page = pagesRef.current[pageIndex];
    if (!page) return;
    const source = payload.object;
    if (payload.kind === 'text') {
      const copy: PdfTextBox = {
        ...(source as PdfTextBox),
        id: uid('text'),
        x: Math.min(page.width - 40, (source.x || 40) + 16),
        y: Math.min(page.height - 24, (source.y || 40) + 16),
        dirty: true,
        deleted: false,
      };
      updatePage(pageIndex, (current) => ({ ...current, texts: [...current.texts, copy] }));
      setSelection({ pageIndex, kind: 'text', id: copy.id });
      setEditingId(copy.id);
    } else {
      const copy: PdfImageBox = {
        ...(source as PdfImageBox),
        id: uid('img'),
        x: Math.min(page.width - 40, (source.x || 40) + 16),
        y: Math.min(page.height - 24, (source.y || 40) + 16),
        dirty: true,
        deleted: false,
      };
      updatePage(pageIndex, (current) => ({ ...current, images: [...current.images, copy] }));
      setSelection({ pageIndex, kind: 'image', id: copy.id });
    }
    toast.success('Đã dán.');
  }, [updatePage]);

  const pastePlainText = useCallback((text: string) => {
    const pageIndex = selectionRef.current?.pageIndex ?? currentPageRef.current;
    const page = pagesRef.current[pageIndex];
    if (!page) return;
    const box: PdfTextBox = {
      id: uid('text'),
      x: page.width * 0.12,
      y: page.height * 0.12,
      width: Math.min(page.width * 0.7, 360),
      height: 48,
      text,
      fontSize: 16,
      fontFamily: 'Arial, Helvetica, sans-serif',
      sourceFont: 'Arial',
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      color: '#111111',
      highlight: '',
      align: 'left',
      background: '#ffffff',
      dirty: true,
      deleted: false,
    };
    updatePage(pageIndex, (current) => ({ ...current, texts: [...current.texts, box] }));
    setSelection({ pageIndex, kind: 'text', id: box.id });
    setEditingId(box.id);
    toast.success('Đã dán văn bản.');
  }, [updatePage]);

  const pasteImageFile = useCallback(async (file: File) => {
    const pageIndex = selectionRef.current?.pageIndex ?? currentPageRef.current;
    const src = await fileToDataUrl(file);
    const page = pagesRef.current[pageIndex];
    if (!page) return;
    const box: PdfImageBox = {
      id: uid('img'),
      x: page.width * 0.18,
      y: page.height * 0.18,
      width: page.width * 0.4,
      height: page.height * 0.28,
      src,
      rotation: 0,
      opacity: 1,
      dirty: true,
      deleted: false,
    };
    updatePage(pageIndex, (current) => ({ ...current, images: [...current.images, box] }));
    setSelection({ pageIndex, kind: 'image', id: box.id });
    toast.success('Đã dán ảnh.');
  }, [updatePage]);

  const pasteFromMenu = useCallback(async () => {
    if (clipboardRef.current) {
      pastePayload(clipboardRef.current);
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parsePdfClipboard(text);
      if (parsed) pastePayload(parsed);
      else if (text.trim()) pastePlainText(text);
      else toast.error('Clipboard trống.');
    } catch {
      toast.error('Không đọc được clipboard.');
    }
  }, [pastePayload, pastePlainText]);

  const fitWidth = useCallback(() => {
    const desk = deskRef.current;
    const page = pagesRef.current[0];
    if (!desk || !page) return;
    const next = Math.min(2, Math.max(0.45, (desk.clientWidth - 56) / page.width));
    setZoom(Number(next.toFixed(2)));
  }, []);

  const fitPage = useCallback(() => {
    const desk = deskRef.current;
    const page = pagesRef.current[currentPage] || pagesRef.current[0];
    if (!desk || !page) return;
    const next = Math.min(
      (desk.clientWidth - 56) / page.width,
      (desk.clientHeight - 72) / page.height,
    );
    setZoom(Number(Math.min(2, Math.max(0.45, next)).toFixed(2)));
  }, [currentPage]);

  useEffect(() => {
    if (fittedRef.current || pages.length === 0) return;
    fittedRef.current = true;
    requestAnimationFrame(fitWidth);
  }, [pages.length, fitWidth]);

  useEffect(() => {
    const onCopy = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target) && hasFieldTextSelection()) return;
      if (copySelected(event.clipboardData)) event.preventDefault();
    };

    const onCut = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target) && hasFieldTextSelection()) return;
      if (!copySelected(event.clipboardData)) return;
      event.preventDefault();
      deleteSelected();
    };

    const onPaste = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const data = event.clipboardData;
      const file = data?.files?.[0];
      if (file?.type.startsWith('image/')) {
        event.preventDefault();
        void pasteImageFile(file);
        return;
      }
      const text = data?.getData('text/plain') || '';
      const parsed = parsePdfClipboard(text) || clipboardRef.current;
      if (parsed) {
        event.preventDefault();
        pastePayload(parsed);
        return;
      }
      if (text.trim()) {
        event.preventDefault();
        pastePlainText(text);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      const typing = isTypingTarget(event.target);
      const mod = isModifier(event);
      const key = event.key.toLowerCase();

      if (event.key === 'Escape') {
        event.preventDefault();
        if (contextMenuRef.current) {
          setContextMenu(null);
          return;
        }
        if (showHelpRef.current) {
          setShowHelp(false);
          return;
        }
        setEditingId(null);
        setSelection(null);
        return;
      }

      if (mod && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (mod && key === 'd') {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (mod && (key === '/' || key === '?')) {
        event.preventDefault();
        setShowHelp((value) => !value);
        return;
      }
      if (mod && (key === '=' || key === '+')) {
        event.preventDefault();
        setZoom((value) => Math.min(2, Number((value + 0.1).toFixed(2))));
        return;
      }
      if (mod && key === '-') {
        event.preventDefault();
        setZoom((value) => Math.max(0.45, Number((value - 0.1).toFixed(2))));
        return;
      }
      if (mod && key === '0') {
        event.preventDefault();
        fitWidth();
        return;
      }
      if (mod && key === '1') {
        event.preventDefault();
        setZoom(1);
        return;
      }
      if (mod && key === '2') {
        event.preventDefault();
        fitPage();
        return;
      }
      if (mod && key === 'b') {
        const selected = selectionRef.current;
        if (selected?.kind !== 'text') return;
        event.preventDefault();
        const page = pagesRef.current[selected.pageIndex];
        const box = page?.texts.find((item) => item.id === selected.id);
        if (box) patchText({ bold: !box.bold });
        return;
      }
      if (mod && key === 'i') {
        const selected = selectionRef.current;
        if (selected?.kind !== 'text') return;
        event.preventDefault();
        const page = pagesRef.current[selected.pageIndex];
        const box = page?.texts.find((item) => item.id === selected.id);
        if (box) patchText({ italic: !box.italic });
        return;
      }
      if (mod && key === 'u') {
        const selected = selectionRef.current;
        if (selected?.kind !== 'text') return;
        event.preventDefault();
        const page = pagesRef.current[selected.pageIndex];
        const box = page?.texts.find((item) => item.id === selected.id);
        if (box) patchText({ underline: !box.underline });
        return;
      }

      if (typing) return;

      if (!typing && event.key === 'Enter') {
        const selected = selectionRef.current;
        if (selected?.kind === 'text') {
          event.preventDefault();
          selectTextBox(selected.pageIndex, selected.id);
        }
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectionRef.current) {
        event.preventDefault();
        deleteSelected();
        return;
      }
      if (event.key === 'PageDown') {
        event.preventDefault();
        const next = Math.min(pagesRef.current.length - 1, currentPageRef.current + 1);
        currentPageRef.current = next;
        setCurrentPage(next);
        document.getElementById(`pdf-page-${pagesRef.current[next]?.pageNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (event.key === 'PageUp') {
        event.preventDefault();
        const next = Math.max(0, currentPageRef.current - 1);
        currentPageRef.current = next;
        setCurrentPage(next);
        document.getElementById(`pdf-page-${pagesRef.current[next]?.pageNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (selectionRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const selected = selectionRef.current;
        const page = pagesRef.current[selected.pageIndex];
        const box = selected.kind === 'text'
          ? page?.texts.find((item) => item.id === selected.id)
          : page?.images.find((item) => item.id === selected.id);
        if (!box) return;
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        if (selected.kind === 'text') patchText({ x: box.x + dx, y: box.y + dy });
        else patchImage({ x: box.x + dx, y: box.y + dy });
      }
    };

    window.addEventListener('copy', onCopy);
    window.addEventListener('cut', onCut);
    window.addEventListener('paste', onPaste);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('cut', onCut);
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [copySelected, deleteSelected, duplicateSelected, fitPage, fitWidth, pasteImageFile, pastePayload, pastePlainText, patchImage, patchText, redo, selectTextBox, undo]);

  const addTextToPage = (pageIndex: number, at?: { x: number; y: number }) => {
    const page = pagesRef.current[pageIndex] || pages[pageIndex];
    if (!page) return;
    const box: PdfTextBox = {
      id: uid('text'),
      x: at ? Math.min(page.width - 80, Math.max(8, at.x - 12)) : page.width * 0.12,
      y: at ? Math.min(page.height - 36, Math.max(8, at.y - 10)) : page.height * 0.12,
      width: page.width * 0.62,
      height: 42,
      text: 'Nhập nội dung...',
      fontSize: 18,
      fontFamily: selectedText?.fontFamily || 'Arial, Helvetica, sans-serif',
      sourceFont: selectedText?.sourceFont || 'Arial',
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      color: '#111111',
      highlight: '',
      align: 'left',
      background: '#ffffff',
      dirty: true,
      deleted: false,
    };
    updatePage(pageIndex, (current) => ({ ...current, texts: [...current.texts, box] }));
    setSelection({ pageIndex, kind: 'text', id: box.id });
    setEditingId(box.id);
    setActiveToolTab('text');
  };

  const addImageToPage = async (pageIndex: number, file: File, at?: { x: number; y: number }) => {
    const page = pagesRef.current[pageIndex] || pages[pageIndex];
    if (!page) return;
    const src = await fileToDataUrl(file);
    const box: PdfImageBox = {
      id: uid('img'),
      x: at ? Math.min(page.width - 80, Math.max(8, at.x - 20)) : page.width * 0.18,
      y: at ? Math.min(page.height - 80, Math.max(8, at.y - 20)) : page.height * 0.18,
      width: page.width * 0.4,
      height: page.height * 0.28,
      src,
      rotation: 0,
      opacity: 1,
      dirty: true,
      deleted: false,
    };
    updatePage(pageIndex, (current) => ({ ...current, images: [...current.images, box] }));
    setSelection({ pageIndex, kind: 'image', id: box.id });
    toast.success('Đã thêm ảnh lên trang.');
  };

  const openContextMenu = (
    event: React.MouseEvent,
    pageIndex: number,
    page: PdfPageModel,
    forced?: { kind: 'text' | 'image'; id: string },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).closest('.pdf-layout-sheet')?.getBoundingClientRect();
    const sheet = rect || event.currentTarget.getBoundingClientRect();
    const pageX = ((event.clientX - sheet.left) / Math.max(1, sheet.width)) * page.width;
    const pageY = ((event.clientY - sheet.top) / Math.max(1, sheet.height)) * page.height;
    const hit = forced || hitTest(pagesRef.current[pageIndex] || page, pageX, pageY);
    setCurrentPage(pageIndex);
    if (hit?.kind === 'text') selectTextBox(pageIndex, hit.id);
    else if (hit?.kind === 'image') selectImageBox(pageIndex, hit.id);
    else {
      selectionRef.current = null;
      setSelection(null);
      setEditingId(null);
    }
    const next: ContextMenuState = {
      clientX: event.clientX,
      clientY: event.clientY,
      pageIndex,
      kind: hit?.kind || 'page',
      id: hit?.id,
      pageX,
      pageY,
    };
    contextMenuRef.current = next;
    setContextMenu(next);
  };

  const runContextAction = async (actionId: string) => {
    const menu = contextMenuRef.current;
    setContextMenu(null);
    if (!menu) return;
    const selected = selectionRef.current;
    const livePage = pagesRef.current[selected?.pageIndex ?? menu.pageIndex];
    const liveText = selected?.kind === 'text'
      ? livePage?.texts.find((box) => box.id === selected.id)
      : null;
    const liveImage = selected?.kind === 'image'
      ? livePage?.images.find((box) => box.id === selected.id)
      : null;

    if (actionId === 'edit' && menu.kind === 'text' && menu.id) {
      selectTextBox(menu.pageIndex, menu.id);
      return;
    }
    if (actionId === 'cut') {
      if (copySelected()) deleteSelected();
      return;
    }
    if (actionId === 'copy') {
      copySelected();
      return;
    }
    if (actionId === 'paste') {
      await pasteFromMenu();
      return;
    }
    if (actionId === 'duplicate') {
      duplicateSelected();
      return;
    }
    if (actionId === 'merge-paragraph') {
      mergeSelectedParagraph();
      return;
    }
    if (actionId === 'delete') {
      deleteSelected();
      return;
    }
    if (actionId === 'bold' && liveText) {
      patchText({ bold: !liveText.bold });
      return;
    }
    if (actionId === 'italic' && liveText) {
      patchText({ italic: !liveText.italic });
      return;
    }
    if (actionId === 'underline' && liveText) {
      patchText({ underline: !liveText.underline });
      return;
    }
    if (actionId === 'strike' && liveText) {
      patchText({ strike: !liveText.strike });
      return;
    }
    if (actionId === 'highlight' && liveText) {
      patchText({
        highlight: liveText.highlight ? '' : '#fff59d',
        background: liveText.highlight ? liveText.background : '#fff59d',
      });
      return;
    }
    if (actionId === 'clear-format') {
      patchText({ bold: false, italic: false, underline: false, strike: false, highlight: '', color: '#111111' });
      return;
    }
    if (actionId === 'align-left') { patchText({ align: 'left' }); return; }
    if (actionId === 'align-center') { patchText({ align: 'center' }); return; }
    if (actionId === 'align-right') { patchText({ align: 'right' }); return; }
    if (actionId === 'bring-front' && selected) {
      setBoxLayer(selected.pageIndex, selected.kind, selected.id, 'front');
      return;
    }
    if (actionId === 'send-back' && selected) {
      setBoxLayer(selected.pageIndex, selected.kind, selected.id, 'back');
      return;
    }
    if (actionId === 'crop' && liveImage?.src) {
      setCropSrc(liveImage.src);
      return;
    }
    if (actionId === 'replace') {
      replaceInputRef.current?.click();
      return;
    }
    if (actionId === 'rotate-90') {
      patchImage({ rotation: ((liveImage?.rotation || 0) + 90) % 360 });
      return;
    }
    if (actionId === 'rotate-270') {
      patchImage({ rotation: ((liveImage?.rotation || 0) + 270) % 360 });
      return;
    }
    if (actionId === 'reset-rotation') {
      patchImage({ rotation: 0 });
      return;
    }
    if ((actionId === 'flip-h' || actionId === 'flip-v') && liveImage?.src) {
      try {
        const src = await flipImageSrc(liveImage.src, actionId === 'flip-h' ? 'h' : 'v');
        patchImage({ src });
        toast.success(actionId === 'flip-h' ? 'Đã lật ngang.' : 'Đã lật dọc.');
      } catch {
        toast.error('Không lật được ảnh.');
      }
      return;
    }
    if (actionId === 'add-text') {
      addTextToPage(menu.pageIndex, { x: menu.pageX, y: menu.pageY });
      return;
    }
    if (actionId === 'add-image') {
      currentPageRef.current = menu.pageIndex;
      setCurrentPage(menu.pageIndex);
      insertAtRef.current = { pageIndex: menu.pageIndex, x: menu.pageX, y: menu.pageY };
      imageInputRef.current?.click();
      return;
    }
    if (actionId === 'undo') { undo(); return; }
    if (actionId === 'redo') { redo(); return; }
  };

  const beginPointer = (
    event: React.PointerEvent,
    pageIndex: number,
    kind: 'text' | 'image',
    id: string,
    action: 'move' | 'resize',
    handle?: ResizeHandle,
  ) => {
    if (event.button !== 0) return;
    const page = pagesRef.current[pageIndex];
    const box = page ? getBox(page, kind, id) : null;
    if (!box) return;
    event.stopPropagation();
    pendingPointerRef.current = {
      pageIndex,
      kind,
      id,
      action,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: box.x, y: box.y, width: box.width, height: box.height },
    };
    if (!dragOriginPagesRef.current) dragOriginPagesRef.current = clonePages(pagesRef.current);
    setSelection({ pageIndex, kind, id });
    setCurrentPage(pageIndex);
    if (action === 'resize') {
      pendingPointerRef.current = null;
      dragRef.current = {
        pageIndex,
        kind,
        id,
        action,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        origin: { x: box.x, y: box.y, width: box.width, height: box.height },
      };
      setEditingId(null);
    }
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingPointerRef.current;
      if (pending && !dragRef.current) {
        const dist = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (dist < 6) return;
        dragRef.current = pending;
        pendingPointerRef.current = null;
        editingIdRef.current = null;
        setEditingId(null);
      }
      const drag = dragRef.current;
      if (!drag) return;
      event.preventDefault();
      const dx = (event.clientX - drag.startX) / zoomRef.current;
      const dy = (event.clientY - drag.startY) / zoomRef.current;
      const page = pagesRef.current[drag.pageIndex];
      if (!page) return;
      const handle = drag.handle || 'se';
      const next = drag.action === 'move'
        ? {
            x: Math.max(0, drag.origin.x + dx),
            y: Math.max(0, drag.origin.y + dy),
            width: drag.origin.width,
            height: drag.origin.height,
          }
        : {
            x: handle.includes('w') ? drag.origin.x + dx : drag.origin.x,
            y: handle.includes('n') ? drag.origin.y + dy : drag.origin.y,
            width: handle.includes('e') ? Math.max(16, drag.origin.width + dx) : handle.includes('w') ? Math.max(16, drag.origin.width - dx) : drag.origin.width,
            height: handle.includes('s') ? Math.max(12, drag.origin.height + dy) : handle.includes('n') ? Math.max(12, drag.origin.height - dy) : drag.origin.height,
          };
      const live = pagesRef.current.map((item, index) => {
        if (index !== drag.pageIndex) return item;
        if (drag.kind === 'text') {
          return {
            ...item,
            texts: item.texts.map((box) => box.id === drag.id ? { ...box, ...next, dirty: true } : box),
          };
        }
        return {
          ...item,
          images: item.images.map((box) => box.id === drag.id ? { ...box, ...next, dirty: true } : box),
        };
      });
      pagesRef.current = live;
      setPages(live);
      onChangeRef.current(live);
    };

    const onPointerUp = () => {
      pendingPointerRef.current = null;
      const drag = dragRef.current;
      if (!drag) return;
      const currentBox = getBox(pagesRef.current[drag.pageIndex], drag.kind, drag.id);
      const changed = currentBox && (
        Math.abs(currentBox.x - drag.origin.x) > 0.4 ||
        Math.abs(currentBox.y - drag.origin.y) > 0.4 ||
        Math.abs(currentBox.width - drag.origin.width) > 0.4 ||
        Math.abs(currentBox.height - drag.origin.height) > 0.4
      );
      if (changed && dragOriginPagesRef.current) {
        historyRef.current.push(dragOriginPagesRef.current);
        if (historyRef.current.length > 60) historyRef.current.shift();
        futureRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
      }
      dragRef.current = null;
      dragOriginPagesRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  const scrollToPage = (index: number) => {
    const safe = Math.max(0, Math.min(pages.length - 1, index));
    setCurrentPage(safe);
    document.getElementById(`pdf-page-${pages[safe]?.pageNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const targetPageIndex = selection?.pageIndex ?? currentPage;
  const toolClass = (active: boolean) => `p-2 rounded ${active ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:text-rose-600'}`;

  return (
    <div className={`pdf-layout-editor flex h-full min-h-0 flex-col border border-slate-200 bg-white text-slate-700 ${isFullView ? 'fixed inset-0 z-[200]' : 'relative'}`}>
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-white shrink-0 px-2 gap-2">
        <div className="flex items-center">
          {[
            { id: 'text', label: 'ĐỊNH DẠNG & VĂN BẢN' },
            { id: 'structure', label: 'CẤU TRÚC & CĂN LỀ' },
            { id: 'ai-media', label: 'ẢNH & ĐA PHƯƠNG TIỆN' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveToolTab(tab.id as ToolTab)}
              className={`px-4 sm:px-5 py-3 text-xs font-semibold transition-all border-b-2 ${
                activeToolTab === tab.id ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 py-1.5 flex-wrap">
          <button type="button" onClick={undo} disabled={!canUndo} className="p-2 text-slate-500 hover:text-rose-600 disabled:opacity-30" title={`Hoàn tác (${modLabel}+Z)`}><Undo2 size={16} /></button>
          <button type="button" onClick={redo} disabled={!canRedo} className="p-2 text-slate-500 hover:text-rose-600 disabled:opacity-30" title={`Làm lại (${modLabel}+Shift+Z)`}><Redo2 size={16} /></button>
          <button type="button" onClick={() => copySelected()} disabled={!selection} className="p-2 text-slate-500 hover:text-rose-600 disabled:opacity-30" title={`Copy (${modLabel}+C)`}><Copy size={16} /></button>
          <button type="button" onClick={() => { if (copySelected()) deleteSelected(); }} disabled={!selection} className="p-2 text-slate-500 hover:text-rose-600 disabled:opacity-30" title={`Cut (${modLabel}+X)`}><Scissors size={16} /></button>
          <button type="button" onClick={() => setShowHelp((value) => !value)} className={`p-2 ${showHelp ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'}`} title={`Phím tắt (${modLabel}+/)`}><Keyboard size={16} /></button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button type="button" onClick={() => scrollToPage(currentPage - 1)} className="p-2 text-slate-500 hover:text-rose-600"><ChevronLeft size={16} /></button>
          <span className="text-xs text-rose-600 w-16 text-center">{currentPage + 1}/{pages.length}</span>
          <button type="button" onClick={() => scrollToPage(currentPage + 1)} className="p-2 text-slate-500 hover:text-rose-600"><ChevronRight size={16} /></button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button type="button" onClick={() => setZoom((value) => Math.max(0.45, Number((value - 0.1).toFixed(2))))} className="p-2 text-slate-500 hover:text-rose-600"><ZoomOut size={16} /></button>
          <span className="text-xs text-rose-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(2, Number((value + 0.1).toFixed(2))))} className="p-2 text-slate-500 hover:text-rose-600"><ZoomIn size={16} /></button>
          <button type="button" onClick={fitWidth} className="px-2 text-xs text-slate-500 hover:text-rose-600">Vừa rộng</button>
          <button type="button" onClick={fitPage} className="px-2 text-xs text-slate-500 hover:text-rose-600">Vừa trang</button>
          <button type="button" onClick={() => setZoom(1)} className="px-2 text-xs text-slate-500 hover:text-rose-600">100%</button>
          <button type="button" onClick={() => setShowBoxes((value) => !value)} className={`px-2 py-1 text-xs ${showBoxes ? 'text-rose-600' : 'text-slate-500'}`}>
            {showBoxes ? 'Hiện ô chữ' : 'Ẩn ô chữ'}
          </button>
          <button type="button" onClick={() => setIsFullView((value) => !value)} className="p-2 text-rose-600" title={isFullView ? 'Thu nhỏ' : 'Toàn màn hình'}>
            {isFullView ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 p-2 flex flex-wrap items-center gap-1 min-h-[52px]">
        {activeToolTab === 'text' && (
          <>
            <select
              value={selectedText?.fontFamily || ''}
              disabled={!selectedText}
              onChange={(event) => patchText({ fontFamily: event.target.value, sourceFont: event.target.selectedOptions[0]?.label || selectedText?.sourceFont || '' })}
              className="bg-white text-muted-foreground border border-slate-200 px-2 py-1 text-xs max-w-[190px]"
              title="Font chữ"
            >
              <option value="">Font...</option>
              {fontOptions.detected.length > 0 && (
                <optgroup label="Font nhận diện từ PDF">
                  {fontOptions.detected.map((font) => (
                    <option key={font.css} value={font.css} style={{ fontFamily: font.css }}>{font.label}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Font hệ thống">
                {fontOptions.system.map((font) => (
                  <option key={font.css} value={font.css} style={{ fontFamily: font.css }}>{font.label}</option>
                ))}
              </optgroup>
            </select>
            <button type="button" onClick={() => patchText({ fontSize: Math.max(6, Math.round((selectedText?.fontSize || 14) - 1)) })} disabled={!selectedText} className="p-2 text-slate-500 hover:text-rose-600" title="Giảm cỡ">−</button>
            <input
              type="number"
              min={6}
              max={200}
              disabled={!selectedText}
              value={selectedText ? Math.round(selectedText.fontSize) : ''}
              onChange={(event) => patchText({ fontSize: Number(event.target.value) })}
              className="w-14 bg-white border border-slate-200 px-1 py-1 text-xs text-center text-muted-foreground"
            />
            <button type="button" onClick={() => patchText({ fontSize: Math.min(200, Math.round((selectedText?.fontSize || 14) + 1)) })} disabled={!selectedText} className="p-2 text-slate-500 hover:text-rose-600" title="Tăng cỡ">+</button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button type="button" onClick={() => patchText({ bold: !selectedText?.bold })} disabled={!selectedText} className={toolClass(Boolean(selectedText?.bold))} title={`Đậm (${modLabel}+B)`}><Bold size={16} /></button>
            <button type="button" onClick={() => patchText({ italic: !selectedText?.italic })} disabled={!selectedText} className={toolClass(Boolean(selectedText?.italic))} title={`Nghiêng (${modLabel}+I)`}><Italic size={16} /></button>
            <button type="button" onClick={() => patchText({ underline: !selectedText?.underline })} disabled={!selectedText} className={toolClass(Boolean(selectedText?.underline))} title={`Gạch chân (${modLabel}+U)`}><UnderIcon size={16} /></button>
            <button type="button" onClick={() => patchText({ strike: !selectedText?.strike })} disabled={!selectedText} className={toolClass(Boolean(selectedText?.strike))} title="Gạch ngang"><Strikethrough size={16} /></button>
            <input type="color" disabled={!selectedText} value={selectedText?.color || '#111111'} onChange={(event) => patchText({ color: event.target.value })} className="w-8 h-8 bg-transparent border border-slate-200" title="Màu chữ" />
            <button type="button" disabled={!selectedText} onClick={() => patchText({ highlight: selectedText?.highlight ? '' : '#fff59d', background: selectedText?.highlight ? selectedText.background : '#fff59d' })} className={toolClass(Boolean(selectedText?.highlight))} title="Tô nền"><Highlighter size={16} /></button>
            <button type="button" onClick={() => patchText({ bold: false, italic: false, underline: false, strike: false, highlight: '', color: '#111111' })} disabled={!selectedText} className="p-2 text-slate-500" title="Xóa định dạng"><Eraser size={16} /></button>
            <button
              type="button"
              disabled={!selectedText || !selection}
              onClick={() => {
                if (!selectedText || !selection) return;
                selectTextBox(selection.pageIndex, selectedText.id);
              }}
              className="ml-1 px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold disabled:opacity-40"
            >
              Sửa chữ
            </button>
          </>
        )}

        {activeToolTab === 'structure' && (
          <>
            <button type="button" onClick={() => patchText({ align: 'left' })} disabled={!selectedText} className={toolClass(selectedText?.align === 'left')} title="Căn trái"><AlignLeft size={16} /></button>
            <button type="button" onClick={() => patchText({ align: 'center' })} disabled={!selectedText} className={toolClass(selectedText?.align === 'center')} title="Căn giữa"><AlignCenter size={16} /></button>
            <button type="button" onClick={() => patchText({ align: 'right' })} disabled={!selectedText} className={toolClass(selectedText?.align === 'right')} title="Căn phải"><AlignRight size={16} /></button>
            <button type="button" onClick={() => patchText({ align: 'left', width: (selectedPage?.width || 500) * 0.8 })} disabled={!selectedText} className="p-2 text-slate-500 hover:text-rose-600" title="Giãn khung"><AlignJustify size={16} /></button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button type="button" onClick={() => addTextToPage(targetPageIndex)} className="p-2 text-slate-500 hover:text-rose-600 flex items-center gap-1 text-xs"><Type size={16} /><Plus size={12} /> Thêm chữ</button>
            <button type="button" onClick={duplicateSelected} disabled={!selection} className="p-2 text-slate-500 hover:text-rose-600" title={`Nhân bản (${modLabel}+D)`}><Copy size={16} /></button>
            <button type="button" onClick={deleteSelected} disabled={!selection} className="p-2 text-muted-foreground hover:text-red-500" title="Xóa"><Trash2 size={16} /></button>
          </>
        )}

        {activeToolTab === 'ai-media' && (
          <>
            <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-500 hover:text-rose-600 flex items-center gap-1 text-xs"><ImagePlus size={16} /> Thêm ảnh</button>
            <button type="button" onClick={() => selectedImage && setCropSrc(selectedImage.src)} disabled={!selectedImage} className="p-2 text-slate-500 hover:text-rose-600" title="Cắt / chỉnh ảnh"><CropIcon size={16} /></button>
            <button type="button" onClick={() => replaceInputRef.current?.click()} disabled={!selectedImage} className="p-2 text-slate-500 hover:text-rose-600" title="Thay ảnh"><RefreshCw size={16} /></button>
            <button type="button" onClick={() => patchImage({ rotation: ((selectedImage?.rotation || 0) + 90) % 360 })} disabled={!selectedImage} className="p-2 text-slate-500 hover:text-rose-600" title="Xoay 90°"><RotateCw size={16} /></button>
            <label className="flex items-center gap-2 text-[10px] text-muted-foreground px-2">
              Mờ
              <input type="range" min={20} max={100} disabled={!selectedImage} value={Math.round((selectedImage?.opacity ?? 1) * 100)} onChange={(event) => patchImage({ opacity: Number(event.target.value) / 100 })} />
            </label>
            <button type="button" onClick={duplicateSelected} disabled={!selection} className="p-2 text-slate-500 hover:text-rose-600" title="Nhân bản"><Copy size={16} /></button>
            <button type="button" onClick={deleteSelected} disabled={!selection} className="p-2 text-muted-foreground hover:text-red-500" title="Xóa"><Trash2 size={16} /></button>
          </>
        )}
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        const at = insertAtRef.current;
        insertAtRef.current = null;
        if (file) addImageToPage(at?.pageIndex ?? targetPageIndex, file, at || undefined);
        event.target.value = '';
      }} />
      <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (file) patchImage({ src: await fileToDataUrl(file), deleted: false });
        event.target.value = '';
      }} />

      <div className={`flex-grow overflow-hidden flex ${isFullView ? 'h-full' : ''}`}>
        <aside className="hidden md:flex w-32 shrink-0 flex-col gap-2 overflow-y-auto bg-slate-100 p-2 border-r border-slate-200">
          {pages.map((page, pageIndex) => (
            <button
              key={page.pageNumber}
              type="button"
              onClick={() => scrollToPage(pageIndex)}
              className={`block rounded-lg border overflow-hidden bg-white ${currentPage === pageIndex ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {page.background ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.background} alt={`Trang ${page.pageNumber}`} className="w-full h-auto" />
              ) : <div className="aspect-[210/297] bg-white" />}
              <span className="block text-center text-[11px] py-1 text-slate-500">{page.pageNumber}</span>
            </button>
          ))}
        </aside>

        <div
          ref={deskRef}
          className="flex-grow overflow-auto pdf-layout-desk"
          onContextMenu={(event) => {
            if ((event.target as HTMLElement).closest('.pdf-layout-sheet, [data-pdf-context-menu]')) return;
            event.preventDefault();
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            if ((event.target as HTMLElement).closest('.pdf-layout-sheet, textarea, input, [data-resize-handle], [data-move-handle], [data-pdf-context-menu]')) return;
            selectionRef.current = null;
            editingIdRef.current = null;
            setSelection(null);
            setEditingId(null);
            setImeDraft(null);
            setContextMenu(null);
          }}
        >
          <div className="flex flex-col items-center gap-8 py-8 px-4">
            {/* The page loop only uses props/state; handlers close over refs. */}
            {/* eslint-disable-next-line react-hooks/refs -- page render reads props, not refs */}
            {pages.map((page, pageIndex) => {
              const width = page.width * zoom;
              const height = page.height * zoom;
              return (
                <div key={page.pageNumber} id={`pdf-page-${page.pageNumber}`} className="flex flex-col items-center gap-2">
                  <div
                    className="pdf-layout-sheet relative bg-white"
                    style={{ width, height }}
                    onContextMenu={(event) => openContextMenu(event, pageIndex, page)}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      if ((event.target as HTMLElement).closest('textarea, input, [data-resize-handle], [data-move-handle], .pdf-hit')) return;
                      event.stopPropagation();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * page.width;
                      const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * page.height;
                      const hit = hitTest(pagesRef.current[pageIndex] || page, x, y);
                      setCurrentPage(pageIndex);
                      if (!hit) {
                        selectionRef.current = null;
                        editingIdRef.current = null;
                        setSelection(null);
                        setEditingId(null);
                        setImeDraft(null);
                        return;
                      }
                      if (hit.kind === 'text') {
                        selectTextBox(pageIndex, hit.id);
                        return;
                      }
                      const nextSelection = { pageIndex, kind: hit.kind, id: hit.id };
                      selectionRef.current = nextSelection;
                      setSelection(nextSelection);
                      setEditingId(null);
                      setActiveToolTab('ai-media');
                      beginPointer(event, pageIndex, hit.kind, hit.id, 'move');
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * page.width;
                      const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * page.height;
                      const hit = hitTest(pagesRef.current[pageIndex] || page, x, y);
                      if (!hit) return;
                      if (hit.kind === 'text') {
                        selectTextBox(pageIndex, hit.id);
                        return;
                      }
                      const nextSelection = { pageIndex, kind: hit.kind, id: hit.id };
                      selectionRef.current = nextSelection;
                      setSelection(nextSelection);
                      const image = (pagesRef.current[pageIndex] || page).images.find((box) => box.id === hit.id);
                      if (image?.src) setCropSrc(image.src);
                      setActiveToolTab('ai-media');
                    }}
                  >
                    {page.background ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={page.background} alt="" className="absolute inset-0 w-full h-full select-none pointer-events-none" draggable={false} />
                    ) : <div className="absolute inset-0 bg-white" />}

                    {(page.patches || []).map((patch, patchIndex) => (
                      <div
                        key={`patch-${patchIndex}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: percent(patch.x, page.width),
                          top: percent(patch.y, page.height),
                          width: percent(patch.width, page.width),
                          height: percent(patch.height, page.height),
                          background: patch.color,
                        }}
                      />
                    ))}

                    {page.texts.filter((box) => box.deleted).map((box) => (
                      <div key={`${box.id}-erase`} className="absolute" style={{ left: percent(box.x, page.width), top: percent(box.y, page.height), width: percent(box.width, page.width), height: percent(box.height, page.height), background: box.background }} />
                    ))}
                    {page.images.filter((box) => box.deleted).map((box) => (
                      <div key={`${box.id}-erase`} className="absolute bg-white" style={{ left: percent(box.x, page.width), top: percent(box.y, page.height), width: percent(box.width, page.width), height: percent(box.height, page.height) }} />
                    ))}
                    {page.images.filter((box) => !box.deleted && box.dirty).map((box) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`${box.id}-draw`} src={box.src} alt="" className="absolute object-fill pointer-events-none" style={{ left: percent(box.x, page.width), top: percent(box.y, page.height), width: percent(box.width, page.width), height: percent(box.height, page.height), opacity: box.opacity, transform: box.rotation ? `rotate(${box.rotation}deg)` : undefined }} />
                    ))}

                    {page.texts.filter((box) => !box.deleted).map((box) => {
                      const active = selection?.pageIndex === pageIndex && selection?.id === box.id;
                      const editing = editingId === box.id;
                      const covering = box.dirty;
                      const displayValue = editing && imeDraft !== null ? imeDraft : box.text;
                      const fill = box.highlight || box.background || '#ffffff';
                      const ink = readableTextColor(box.color, fill);
                      const hitH = Math.max(box.height, box.fontSize * 1.35, 16);
                      return (
                        <div
                          key={box.id}
                          data-pdf-box="text"
                          data-box-id={box.id}
                          className={`absolute pdf-hit pdf-text-hit ${active ? 'is-selected' : ''} ${showBoxes && !active ? 'is-outlined' : ''}`}
                          style={{
                            left: percent(Math.max(0, box.x - 2), page.width),
                            top: percent(Math.max(0, box.y - 2), page.height),
                            width: percent(Math.max(box.width + 4, 12), page.width),
                            height: percent(hitH + 4, page.height),
                            zIndex: stackZ('text', box),
                            background: covering ? fill : 'transparent',
                            pointerEvents: 'auto',
                          }}
                        >
                          {active && (
                            <div className="absolute left-5 -top-6 max-w-[280px] truncate rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm pointer-events-none">
                              {box.sourceFont || 'Font'} · {Math.round(box.fontSize)}px · {box.text.slice(0, 42) || 'ô trống'}
                            </div>
                          )}
                          <textarea
                            value={displayValue}
                            spellCheck={false}
                            data-pdf-text-input={box.id}
                            onContextMenu={(event) => openContextMenu(event, pageIndex, page, { kind: 'text', id: box.id })}
                            onPointerDown={(event) => {
                              if (event.button !== 0) return;
                              event.stopPropagation();
                              selectTextBox(pageIndex, box.id);
                            }}
                            onChange={(event) => {
                              const value = event.target.value;
                              if (composingRef.current) {
                                setImeDraft(value);
                                return;
                              }
                              setImeDraft(null);
                              const record = !typingSnapshotRef.current;
                              typingSnapshotRef.current = true;
                              applyTextValue(pageIndex, box.id, value, event.currentTarget, record);
                            }}
                            onCompositionStart={() => {
                              composingRef.current = true;
                            }}
                            onCompositionEnd={(event) => {
                              composingRef.current = false;
                              const value = event.currentTarget.value;
                              setImeDraft(null);
                              const record = !typingSnapshotRef.current;
                              typingSnapshotRef.current = true;
                              applyTextValue(pageIndex, box.id, value, event.currentTarget, record);
                            }}
                            onBlur={() => {
                              typingSnapshotRef.current = false;
                              composingRef.current = false;
                              setImeDraft(null);
                            }}
                            className="pdf-text-input pointer-events-auto w-full h-full resize-none bg-transparent outline-none p-0 overflow-hidden"
                            style={{
                              fontSize: box.fontSize * zoom,
                              fontFamily: box.fontFamily,
                              fontWeight: box.bold ? 700 : 400,
                              fontStyle: box.italic ? 'italic' : 'normal',
                              textDecoration: `${box.underline ? 'underline' : ''} ${box.strike ? 'line-through' : ''}`.trim() || 'none',
                              color: covering ? ink : 'transparent',
                              caretColor: '#e11d48',
                              textAlign: box.align,
                              lineHeight: 1.15,
                              cursor: 'text',
                            }}
                          />
                          {active && (
                            <button
                              type="button"
                              data-move-handle="true"
                              title="Kéo để di chuyển"
                              onPointerDown={(event) => {
                                if (event.button !== 0) return;
                                event.preventDefault();
                                beginPointer(event, pageIndex, 'text', box.id, 'move');
                              }}
                              className="pointer-events-auto absolute -left-5 top-0 z-30 flex h-5 w-5 items-center justify-center rounded-sm bg-rose-500 text-white shadow"
                            >
                              <GripVertical size={12} />
                            </button>
                          )}
                          {active && (['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => (
                            <span
                              key={handle}
                              data-resize-handle="true"
                              onPointerDown={(event) => {
                                event.preventDefault();
                                beginPointer(event, pageIndex, 'text', box.id, 'resize', handle);
                              }}
                              className={`pointer-events-auto absolute w-2.5 h-2.5 bg-rose-500 border border-white z-30 ${handle.includes('n') ? '-top-1' : '-bottom-1'} ${handle.includes('w') ? '-left-1' : '-right-1'}`}
                              style={{ cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize' }}
                            />
                          ))}
                        </div>
                      );
                    })}

                    {page.images.filter((box) => !box.deleted).map((box) => {
                      const active = selection?.pageIndex === pageIndex && selection?.id === box.id;
                      return (
                        <div
                          key={box.id}
                          data-pdf-box="image"
                          data-box-id={box.id}
                          className={`absolute pdf-hit ${active ? 'is-selected bg-rose-500/10' : ''} ${showBoxes && !active ? 'is-outlined' : ''}`}
                          style={{
                            left: percent(box.x, page.width),
                            top: percent(box.y, page.height),
                            width: percent(Math.max(box.width, 18), page.width),
                            height: percent(Math.max(box.height, 18), page.height),
                            zIndex: stackZ('image', box),
                            pointerEvents: 'auto',
                            cursor: 'move',
                          }}
                          onContextMenu={(event) => openContextMenu(event, pageIndex, page, { kind: 'image', id: box.id })}
                          onPointerDown={(event) => {
                            if (event.button !== 0) return;
                            if ((event.target as HTMLElement).closest('[data-resize-handle]')) return;
                            event.stopPropagation();
                            const nextSelection = { pageIndex, kind: 'image' as const, id: box.id };
                            selectionRef.current = nextSelection;
                            setSelection(nextSelection);
                            setEditingId(null);
                            setCurrentPage(pageIndex);
                            setActiveToolTab('ai-media');
                            beginPointer(event, pageIndex, 'image', box.id, 'move');
                          }}
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            if (box.src) setCropSrc(box.src);
                          }}
                        >
                          {active && (
                            <div className="absolute left-0 -top-6 whitespace-nowrap rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm pointer-events-none">
                              Ảnh · double-click để cắt
                            </div>
                          )}
                          {active && (['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => (
                            <span
                              key={handle}
                              data-resize-handle="true"
                              onPointerDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                beginPointer(event, pageIndex, 'image', box.id, 'resize', handle);
                              }}
                              className={`pointer-events-auto absolute w-2.5 h-2.5 bg-rose-500 border border-white z-30 ${handle.includes('n') ? '-top-1' : '-bottom-1'} ${handle.includes('w') ? '-left-1' : '-right-1'}`}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-slate-500">Trang {page.pageNumber} / {pages.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-3 overflow-y-auto bg-white border-l border-slate-200 p-4 text-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Thuộc tính</div>
          {!selectedText && !selectedImage && (
            <p className="text-slate-500 leading-relaxed">Click vào chữ để sửa và bôi đen. Kéo chấm cạnh trái để di chuyển, góc hồng để đổi kích thước.</p>
          )}
          {selectedText && (
            <div className="space-y-3 text-slate-600">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Font gốc PDF</div>
                <div className="text-rose-600 font-medium">{selectedText.sourceFont || 'Không rõ'}</div>
              </div>
              <label className="block">Font đang dùng
                <select value={selectedText.fontFamily} onChange={(event) => patchText({ fontFamily: event.target.value, sourceFont: event.target.selectedOptions[0]?.label || selectedText.sourceFont })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1">
                  {fontOptions.detected.map((font) => <option key={`d-${font.css}`} value={font.css}>{font.label}</option>)}
                  {fontOptions.system.map((font) => <option key={font.css} value={font.css}>{font.label}</option>)}
                </select>
              </label>
              <label className="block">Cỡ chữ
                <input type="number" min={6} max={200} value={Math.round(selectedText.fontSize)} onChange={(event) => patchText({ fontSize: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" />
              </label>
              <label className="block">Nội dung
                <textarea
                  value={selectedText.text}
                  rows={6}
                  onChange={(event) => patchText({ text: event.target.value })}
                  className="mt-1 w-full min-h-[120px] bg-white border border-slate-200 px-2 py-1 text-[12px] leading-relaxed text-slate-800"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label>X<input type="number" value={Math.round(selectedText.x)} onChange={(event) => patchText({ x: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
                <label>Y<input type="number" value={Math.round(selectedText.y)} onChange={(event) => patchText({ y: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
                <label>Rộng<input type="number" value={Math.round(selectedText.width)} onChange={(event) => patchText({ width: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
                <label>Cao<input type="number" value={Math.round(selectedText.height)} onChange={(event) => patchText({ height: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
              </div>
              <p className="leading-relaxed text-white/50">Mũi tên: dịch 1px · Shift+mũi tên: 10px · Delete: xóa · ⌘D: nhân bản</p>
            </div>
          )}
          {selectedImage && (
            <div className="space-y-3 text-muted-foreground">
              <div className="text-rose-600 font-medium">Ảnh</div>
              <div className="grid grid-cols-2 gap-2">
                <label>X<input type="number" value={Math.round(selectedImage.x)} onChange={(event) => patchImage({ x: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
                <label>Y<input type="number" value={Math.round(selectedImage.y)} onChange={(event) => patchImage({ y: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
                <label>Rộng<input type="number" value={Math.round(selectedImage.width)} onChange={(event) => patchImage({ width: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
                <label>Cao<input type="number" value={Math.round(selectedImage.height)} onChange={(event) => patchImage({ height: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" /></label>
              </div>
              <label className="block">Xoay
                <input type="number" value={selectedImage.rotation} onChange={(event) => patchImage({ rotation: Number(event.target.value) })} className="mt-1 w-full bg-white border border-slate-200 px-2 py-1" />
              </label>
            </div>
          )}
        </aside>
      </div>

      <div className="border-t border-slate-200 px-4 py-2 bg-white flex justify-between items-center text-[11px] text-slate-500 shrink-0 gap-3">
        <span>
          {selectedText ? `Chữ · ${selectedText.sourceFont} · ${Math.round(selectedText.fontSize)}px · chuột phải: menu` : selectedImage ? 'Ảnh đang chọn · chuột phải: cắt / thay ảnh' : `Click chữ để sửa · chuột phải mở menu · ${modLabel}+Z undo`}
        </span>
        <button type="button" onClick={() => setShowHelp(true)} className="text-rose-600 hover:underline">
          {pages.length} trang · Phím tắt {modLabel}+/
        </button>
      </div>

      {showHelp && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-rose-600">Phím tắt</h3>
              <button type="button" onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-700 text-xs">Esc</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {SHORTCUTS.map((item) => (
                <div key={item.action} className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5">
                  <span className="text-slate-600">{item.action}</span>
                  <kbd className="font-mono text-[10px] text-rose-600 whitespace-nowrap">{item.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <PdfContextMenu
          x={contextMenu.clientX}
          y={contextMenu.clientY}
          title={contextMenu.kind === 'text' ? 'Chữ' : contextMenu.kind === 'image' ? 'Ảnh' : 'Trang'}
          items={(() => {
            const menuPage = pages[contextMenu.pageIndex];
            const menuText = contextMenu.kind === 'text' && contextMenu.id
              ? menuPage?.texts.find((box) => box.id === contextMenu.id)
              : null;
            const menuImage = contextMenu.kind === 'image' && contextMenu.id
              ? menuPage?.images.find((box) => box.id === contextMenu.id)
              : null;
            if (menuText) return buildTextMenuItems(menuText, modLabel);
            if (menuImage) return buildImageMenuItems(menuImage, modLabel);
            return buildPageMenuItems(modLabel, canUndo, canRedo);
          })()}
          onAction={(id) => { void runContextAction(id); }}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ImageCropModal
        isOpen={Boolean(cropSrc)}
        src={cropSrc || ''}
        onCancel={() => setCropSrc(null)}
        onConfirm={async (blob) => {
          const src = await blobToDataUrl(blob);
          patchImage({ src, deleted: false });
          setCropSrc(null);
          toast.success('Đã cập nhật ảnh.');
        }}
      />
    </div>
  );
}
