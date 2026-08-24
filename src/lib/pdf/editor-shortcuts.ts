import type { PdfImageBox, PdfTextBox } from './types';

export const PDF_CLIP_MARK = '__kdPdfObject';

export type PdfClipboardPayload = {
  [PDF_CLIP_MARK]: 1;
  kind: 'text' | 'image';
  object: PdfTextBox | PdfImageBox;
};

export const SHORTCUTS = [
  { keys: '⌘Z / Ctrl+Z', action: 'Hoàn tác' },
  { keys: '⌘⇧Z / Ctrl+Y', action: 'Làm lại' },
  { keys: '⌘C / Ctrl+C', action: 'Copy đối tượng' },
  { keys: '⌘X / Ctrl+X', action: 'Cut đối tượng' },
  { keys: '⌘V / Ctrl+V', action: 'Paste chữ / ảnh / đối tượng' },
  { keys: '⌘D / Ctrl+D', action: 'Nhân bản' },
  { keys: '⌘B / Ctrl+B', action: 'In đậm' },
  { keys: '⌘I / Ctrl+I', action: 'In nghiêng' },
  { keys: '⌘U / Ctrl+U', action: 'Gạch chân' },
  { keys: 'Delete / Backspace', action: 'Xóa đối tượng' },
  { keys: 'Mũi tên', action: 'Dịch 1px' },
  { keys: 'Shift + mũi tên', action: 'Dịch 10px' },
  { keys: '⌘+ / Ctrl+=', action: 'Phóng to' },
  { keys: '⌘- / Ctrl+-', action: 'Thu nhỏ' },
  { keys: '⌘0 / Ctrl+0', action: 'Vừa rộng' },
  { keys: '⌘1 / Ctrl+1', action: 'Zoom 100%' },
  { keys: '⌘2 / Ctrl+2', action: 'Vừa trang' },
  { keys: 'PageUp / PageDown', action: 'Trang trước / sau' },
  { keys: 'Escape', action: 'Bỏ chọn' },
  { keys: 'Enter', action: 'Sửa chữ đang chọn' },
  { keys: 'Chuột phải', action: 'Menu đối tượng (chữ / ảnh / trang)' },
  { keys: '⌘/ / Ctrl+/', action: 'Bảng phím tắt' },
] as const;

export function isMacPlatform() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes('Mac');
}

export function isModifier(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return true;
  return target.isContentEditable;
}

export function hasFieldTextSelection() {
  const el = document.activeElement;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.selectionStart !== el.selectionEnd;
  }
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().length > 0);
}

export function parsePdfClipboard(text: string): PdfClipboardPayload | null {
  try {
    const parsed = JSON.parse(text) as PdfClipboardPayload;
    if (parsed && parsed[PDF_CLIP_MARK] === 1 && (parsed.kind === 'text' || parsed.kind === 'image') && parsed.object) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function serializePdfClipboard(payload: PdfClipboardPayload) {
  return JSON.stringify(payload);
}
