'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BringToFront,
  ClipboardPaste,
  Combine,
  Copy,
  Crop,
  Eraser,
  FlipHorizontal,
  FlipVertical,
  Highlighter,
  ImagePlus,
  Italic,
  Pencil,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Scissors,
  SendToBack,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Undo2,
  Redo2,
} from 'lucide-react';
import type { PdfImageBox, PdfTextBox } from '@/lib/pdf/types';

export type PdfContextMenuItem =
  | {
      type: 'item';
      id: string;
      label: string;
      shortcut?: string;
      icon?: LucideIcon;
      danger?: boolean;
      disabled?: boolean;
      checked?: boolean;
    }
  | { type: 'sep' };

export function buildTextMenuItems(box: PdfTextBox, modLabel: string): PdfContextMenuItem[] {
  return [
    { type: 'item', id: 'edit', label: 'Sửa chữ', shortcut: 'Enter', icon: Pencil },
    { type: 'sep' },
    { type: 'item', id: 'cut', label: 'Cắt', shortcut: `${modLabel}+X`, icon: Scissors },
    { type: 'item', id: 'copy', label: 'Sao chép', shortcut: `${modLabel}+C`, icon: Copy },
    { type: 'item', id: 'paste', label: 'Dán', shortcut: `${modLabel}+V`, icon: ClipboardPaste },
    { type: 'item', id: 'duplicate', label: 'Nhân bản', shortcut: `${modLabel}+D`, icon: Copy },
    { type: 'item', id: 'merge-paragraph', label: 'Gộp các dòng thành một đoạn', icon: Combine },
    { type: 'sep' },
    { type: 'item', id: 'bold', label: 'In đậm', shortcut: `${modLabel}+B`, icon: Bold, checked: box.bold },
    { type: 'item', id: 'italic', label: 'In nghiêng', shortcut: `${modLabel}+I`, icon: Italic, checked: box.italic },
    { type: 'item', id: 'underline', label: 'Gạch chân', shortcut: `${modLabel}+U`, icon: Underline, checked: box.underline },
    { type: 'item', id: 'strike', label: 'Gạch ngang', icon: Strikethrough, checked: box.strike },
    { type: 'item', id: 'highlight', label: 'Tô nền', icon: Highlighter, checked: Boolean(box.highlight) },
    { type: 'item', id: 'clear-format', label: 'Xóa định dạng', icon: Eraser },
    { type: 'sep' },
    { type: 'item', id: 'align-left', label: 'Căn trái', icon: AlignLeft, checked: box.align === 'left' },
    { type: 'item', id: 'align-center', label: 'Căn giữa', icon: AlignCenter, checked: box.align === 'center' },
    { type: 'item', id: 'align-right', label: 'Căn phải', icon: AlignRight, checked: box.align === 'right' },
    { type: 'sep' },
    { type: 'item', id: 'bring-front', label: 'Đưa lên trên', icon: BringToFront },
    { type: 'item', id: 'send-back', label: 'Đưa xuống dưới', icon: SendToBack },
    { type: 'sep' },
    { type: 'item', id: 'delete', label: 'Xóa', shortcut: 'Delete', icon: Trash2, danger: true },
  ];
}

export function buildImageMenuItems(_box: PdfImageBox, modLabel: string): PdfContextMenuItem[] {
  return [
    { type: 'item', id: 'crop', label: 'Cắt / chỉnh ảnh', icon: Crop },
    { type: 'item', id: 'replace', label: 'Thay ảnh…', icon: RefreshCw },
    { type: 'sep' },
    { type: 'item', id: 'rotate-90', label: 'Xoay 90°', icon: RotateCw },
    { type: 'item', id: 'rotate-270', label: 'Xoay -90°', icon: RotateCcw },
    { type: 'item', id: 'flip-h', label: 'Lật ngang', icon: FlipHorizontal },
    { type: 'item', id: 'flip-v', label: 'Lật dọc', icon: FlipVertical },
    { type: 'item', id: 'reset-rotation', label: 'Đặt lại xoay', icon: RotateCcw },
    { type: 'sep' },
    { type: 'item', id: 'cut', label: 'Cắt', shortcut: `${modLabel}+X`, icon: Scissors },
    { type: 'item', id: 'copy', label: 'Sao chép', shortcut: `${modLabel}+C`, icon: Copy },
    { type: 'item', id: 'paste', label: 'Dán', shortcut: `${modLabel}+V`, icon: ClipboardPaste },
    { type: 'item', id: 'duplicate', label: 'Nhân bản', shortcut: `${modLabel}+D`, icon: Copy },
    { type: 'sep' },
    { type: 'item', id: 'bring-front', label: 'Đưa lên trên', icon: BringToFront },
    { type: 'item', id: 'send-back', label: 'Đưa xuống dưới', icon: SendToBack },
    { type: 'sep' },
    { type: 'item', id: 'delete', label: 'Xóa', shortcut: 'Delete', icon: Trash2, danger: true },
  ];
}

export function buildPageMenuItems(modLabel: string, canUndo: boolean, canRedo: boolean): PdfContextMenuItem[] {
  return [
    { type: 'item', id: 'paste', label: 'Dán', shortcut: `${modLabel}+V`, icon: ClipboardPaste },
    { type: 'item', id: 'add-text', label: 'Thêm chữ', icon: Type },
    { type: 'item', id: 'add-image', label: 'Thêm ảnh…', icon: ImagePlus },
    { type: 'sep' },
    { type: 'item', id: 'undo', label: 'Hoàn tác', shortcut: `${modLabel}+Z`, icon: Undo2, disabled: !canUndo },
    { type: 'item', id: 'redo', label: 'Làm lại', shortcut: `${modLabel}+Shift+Z`, icon: Redo2, disabled: !canRedo },
  ];
}

export function PdfContextMenu({
  x,
  y,
  title,
  items,
  onAction,
  onClose,
}: {
  x: number;
  y: number;
  title?: string;
  items: PdfContextMenuItem[];
  onAction: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y, items]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    const onScroll = () => onClose();
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      data-pdf-context-menu="true"
      onContextMenu={(event) => event.preventDefault()}
      className="pdf-context-menu fixed z-[400] min-w-[220px] max-h-[min(420px,80vh)] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl"
      style={{ left: x, top: y }}
    >
      {title && (
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600 border-b border-slate-100 mb-1">
          {title}
        </div>
      )}
      {items.map((item, index) => {
        if (item.type === 'sep') {
          return <div key={`sep-${index}`} className="my-1 border-t border-slate-100" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            data-menu-id={item.id}
            onClick={() => {
              if (item.disabled) return;
              onAction(item.id);
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] disabled:opacity-40 ${
              item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            } ${item.checked ? 'bg-rose-50/70' : ''}`}
          >
            {Icon ? <Icon size={14} className="shrink-0" /> : <span className="w-3.5" />}
            <span className="flex-1">{item.label}</span>
            {item.checked && <span className="text-rose-500 text-[11px]">✓</span>}
            {item.shortcut && <span className="ml-3 font-mono text-[10px] text-slate-400">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
