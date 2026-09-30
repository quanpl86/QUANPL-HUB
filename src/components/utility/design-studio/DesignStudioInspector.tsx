'use client';

import React from 'react';
import {
  Sparkles,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Loader2,
  Wand2,
  Sun,
  Contrast,
  Droplets,
  Layers2,
  Type,
  ChevronRight,
} from 'lucide-react';
import { ImageAdjustments } from '@/types/design-studio';
import { GRADIENT_PRESETS } from './templates/background-presets';

interface InspectorProps {
  width: number;
  onToggleCollapse: () => void;
  selectedObject: Record<string, unknown> | null;
  selectedType: string | null;
  canvasBgColor: string;
  onCanvasBgColorChange: (color: string, gradientStops?: [string, string]) => void;
  onUpdateTextProps: (props: Record<string, unknown>) => void;
  onUpdateShapeProps: (props: Record<string, unknown>) => void;
  onAddTextToShape: () => void;
  onApplyImageAdjustments: (adjustments: ImageAdjustments) => void;
  imageAdjustments: ImageAdjustments;
  onResetImageAdjustments: () => void;
  onRotate: (delta: number) => void;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAiRemoveBgSelected: () => void;
  isAiProcessing: boolean;
  aiProgressMessage: string;
  isDark: boolean;
}

const PRESET_COLORS = [
  '#ffffff', '#000000', '#0f172a', '#1e293b',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#a855f7', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#84cc16', '#64748b',
];

const FONTS = [
  'Inter',
  'Roboto',
  'Montserrat',
  'Arial',
  'Courier New',
  'Times New Roman',
  'Georgia',
  'Impact',
];

const FILTER_PRESETS: Array<{ id: string; label: string }> = [
  { id: 'none', label: 'Gốc' },
  { id: 'grayscale', label: 'Đen trắng' },
  { id: 'sepia', label: 'Cổ điển' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'kodachrome', label: 'Kodak' },
  { id: 'invert', label: 'Đảo màu' },
];

export const DesignStudioInspector: React.FC<InspectorProps> = ({
  width,
  onToggleCollapse,
  selectedObject,
  selectedType,
  canvasBgColor,
  onCanvasBgColorChange,
  onUpdateTextProps,
  onUpdateShapeProps,
  onAddTextToShape,
  onApplyImageAdjustments,
  imageAdjustments,
  onResetImageAdjustments,
  onRotate,
  onFlip,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onAiRemoveBgSelected,
  isAiProcessing,
  aiProgressMessage,
  isDark,
}) => {
  const panelBg = isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm';
  const headingColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const labelColor = isDark ? 'text-slate-300' : 'text-slate-700';
  const subtextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600';
  const btnBg = isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700';
  const cardBg = isDark ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600';
  const sliderTrack = isDark ? 'bg-slate-800' : 'bg-slate-200';
  const dividerBorder = isDark ? 'border-slate-800' : 'border-slate-200';

  // 1. CHƯA CHỌN VẬT THỂ: HIỂN THỊ THUỘC TÍNH CANVAS
  if (!selectedObject || !selectedType) {
    return (
      <aside
        style={{ width: `${width}px` }}
        className={`border-l p-4 overflow-y-auto shrink-0 select-none z-20 space-y-4 text-xs transition-[width] duration-75 relative ${panelBg}`}
      >
        <div className="flex items-center justify-between pb-1 border-b">
          <div>
            <h3 className={`font-semibold text-sm flex items-center gap-1.5 ${headingColor}`}>
              <Palette className="w-4 h-4 text-emerald-500" />
              Cài Đặt Nền Canvas
            </h3>
            <p className={`text-[11px] mt-0.5 ${subtextColor}`}>Bấm vào bất kỳ vật thể nào trên canvas để chỉnh sửa thuộc tính</p>
          </div>
          <button
            onClick={onToggleCollapse}
            className={`p-1 rounded-md transition ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Thu gọn bảng thuộc tính (Ẩn)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick transparent & basic color options */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-medium ${labelColor}`}>Kiểu nền cơ bản</label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onCanvasBgColorChange('transparent')}
              className={`py-2 px-1.5 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-1 transition ${
                canvasBgColor === 'transparent' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 ring-2 ring-emerald-500/20' : btnBg
              }`}
              title="Nền Trong Suốt (PNG Alpha)"
            >
              <div
                className="w-5 h-5 rounded border border-black/20"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #94a3b8 75%), linear-gradient(-45deg, transparent 75%, #94a3b8 75%)',
                  backgroundSize: '4px 4px',
                }}
              />
              <span className="text-[10px]">Trong suốt</span>
            </button>

            <button
              onClick={() => onCanvasBgColorChange('#ffffff')}
              className={`py-2 px-1.5 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-1 transition ${
                canvasBgColor === '#ffffff' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 ring-2 ring-emerald-500/20' : btnBg
              }`}
              title="Nền Trắng"
            >
              <div className="w-5 h-5 rounded border border-slate-300 bg-white shadow-2xs" />
              <span className="text-[10px]">Trắng</span>
            </button>

            <button
              onClick={() => onCanvasBgColorChange('#090d16')}
              className={`py-2 px-1.5 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-1 transition ${
                canvasBgColor === '#090d16' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 ring-2 ring-emerald-500/20' : btnBg
              }`}
              title="Nền Đen Cyber"
            >
              <div className="w-5 h-5 rounded border border-slate-700 bg-[#090d16] shadow-2xs" />
              <span className="text-[10px]">Đen Cyber</span>
            </button>
          </div>
        </div>

        {/* Canvas Background Color Picker */}
        <div className="space-y-2">
          <label className={`text-[11px] font-medium ${labelColor}`}>Màu đơn sắc tùy chọn</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={canvasBgColor.startsWith('#') ? canvasBgColor : '#0f172a'}
              onChange={(e) => onCanvasBgColorChange(e.target.value)}
              className={`w-8 h-8 rounded-lg border cursor-pointer p-0.5 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}
            />
            <input
              type="text"
              value={canvasBgColor}
              onChange={(e) => onCanvasBgColorChange(e.target.value)}
              className={`flex-1 border rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none ${inputBg}`}
            />
          </div>

          <div className="grid grid-cols-8 gap-1.5 pt-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onCanvasBgColorChange(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-md border transition ${
                  canvasBgColor === c ? 'border-emerald-500 scale-110 shadow-sm ring-2 ring-emerald-500/40' : isDark ? 'border-slate-800 hover:scale-105' : 'border-slate-300 hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Gradient Presets */}
        <div className="space-y-1.5 pt-1">
          <label className={`text-[11px] font-medium ${labelColor}`}>Màu Gradient chuyển sắc</label>
          <div className="grid grid-cols-2 gap-1.5">
            {GRADIENT_PRESETS.slice(0, 6).map((g) => (
              <button
                key={g.id}
                onClick={() => onCanvasBgColorChange(g.value, g.gradientStops)}
                className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition text-left ${
                  canvasBgColor === g.value ? 'border-emerald-500 ring-2 ring-emerald-500/30' : btnBg
                }`}
              >
                <div
                  className="w-5 h-5 rounded shrink-0 border border-white/20"
                  style={{ background: `linear-gradient(135deg, ${g.gradientStops?.[0]}, ${g.gradientStops?.[1]})` }}
                />
                <span className="text-[10px] truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className={`p-3 rounded-xl border space-y-2 text-[11px] ${cardBg}`}>
          <div className={`font-semibold ${headingColor}`}>Mẹo thao tác:</div>
          <ul className="space-y-1 font-mono text-[10px]">
            <li>• <kbd className={`px-1 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'}`}>Nhấp đúp hình</kbd>: Gõ chữ vào giữa hình</li>
            <li>• <kbd className={`px-1 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'}`}>Ctrl + Z</kbd>: Hoàn tác</li>
            <li>• <kbd className={`px-1 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'}`}>Delete</kbd>: Xóa vật thể</li>
            <li>• <kbd className={`px-1 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'}`}>Ctrl + V</kbd>: Dán ảnh từ clipboard</li>
          </ul>
        </div>
      </aside>
    );
  }

  // Common Layer Order & Action Buttons
  const renderCommonActions = () => (
    <div className={`space-y-2 pt-2 border-t ${dividerBorder}`}>
      <div className={`text-[11px] font-semibold uppercase tracking-wider ${subtextColor}`}>
        Thứ tự lớp & Thao tác
      </div>
      <div className="grid grid-cols-4 gap-1">
        <button
          onClick={onBringForward}
          className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition ${btnBg}`}
          title="Lên trên 1 lớp"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="text-[9px]">Lên lớp</span>
        </button>
        <button
          onClick={onSendBackward}
          className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition ${btnBg}`}
          title="Xuống dưới 1 lớp"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span className="text-[9px]">Xuống lớp</span>
        </button>
        <button
          onClick={onBringToFront}
          className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition ${btnBg}`}
          title="Lên trên cùng"
        >
          <ChevronsUp className="w-3.5 h-3.5" />
          <span className="text-[9px]">Lên đầu</span>
        </button>
        <button
          onClick={onSendToBack}
          className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition ${btnBg}`}
          title="Xuống đáy cùng"
        >
          <ChevronsDown className="w-3.5 h-3.5" />
          <span className="text-[9px]">Xuống đáy</span>
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onDuplicate}
          className={`flex-1 py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition ${btnBg}`}
        >
          <Copy className="w-3.5 h-3.5 text-sky-500" />
          <span>Nhân bản</span>
        </button>
        <button
          onClick={onDelete}
          className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`border-l p-4 overflow-y-auto shrink-0 select-none z-20 space-y-4 text-xs transition-[width] duration-75 relative ${panelBg}`}
    >
      {/* Top Header with Collapse Button */}
      <div className="flex items-center justify-between pb-2 border-b">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Thuộc Tính & Lớp
        </span>
        <button
          onClick={onToggleCollapse}
          className={`p-1 rounded-md transition ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
          }`}
          title="Thu gọn bảng thuộc tính (Ẩn)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {/* 2. KHI ĐANG CHỌN HÌNH ẢNH (PHOTO EDITOR & AI TÁCH NỀN) */}
      {selectedType === 'image' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm ${headingColor}`}>Chỉnh Sửa Hình Ảnh</h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
              PHOTO
            </span>
          </div>

          {/* AI REMOVE BACKGROUND 1-CLICK */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Tách Nền AI 1-Click</span>
            </div>
            <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Tách vật thể và biến nền ảnh này thành trong suốt ngay tại vị trí cũ.
            </p>
            <button
              onClick={onAiRemoveBgSelected}
              disabled={isAiProcessing}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isAiProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{aiProgressMessage || 'Đang tách nền...'}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Thực hiện Tách nền AI</span>
                </>
              )}
            </button>
          </div>

          {/* Transform Controls: Rotate & Flip */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-semibold uppercase tracking-wider ${subtextColor}`}>
              Xoay & Lật ảnh
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => onRotate(-90)}
                className={`p-2 rounded-lg border flex items-center justify-center transition ${btnBg}`}
                title="Xoay trái 90 độ"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRotate(90)}
                className={`p-2 rounded-lg border flex items-center justify-center transition ${btnBg}`}
                title="Xoay phải 90 độ"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onFlip('horizontal')}
                className={`p-2 rounded-lg border flex items-center justify-center transition ${btnBg}`}
                title="Lật gương ngang"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => onFlip('vertical')}
                className={`p-2 rounded-lg border flex items-center justify-center transition ${btnBg}`}
                title="Lật gương dọc"
              >
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Filters */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-semibold uppercase tracking-wider ${subtextColor}`}>
              Bộ lọc màu cài sẵn
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {FILTER_PRESETS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() =>
                    onApplyImageAdjustments({
                      ...imageAdjustments,
                      presetFilter: filter.id,
                    })
                  }
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition ${
                    imageAdjustments.presetFilter === filter.id
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                      : btnBg
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photoshop Lite Sliders */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-semibold uppercase tracking-wider ${subtextColor}`}>
                Tinh chỉnh màu sắc
              </label>
              <button
                onClick={onResetImageAdjustments}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Đặt lại
              </button>
            </div>

            {/* Brightness */}
            <div className="space-y-1">
              <div className={`flex justify-between text-[11px] ${labelColor}`}>
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-500" /> Độ sáng
                </span>
                <span className="font-mono text-slate-500">
                  {Math.round(imageAdjustments.brightness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="-0.8"
                max="0.8"
                step="0.05"
                value={imageAdjustments.brightness}
                onChange={(e) =>
                  onApplyImageAdjustments({
                    ...imageAdjustments,
                    brightness: parseFloat(e.target.value),
                  })
                }
                className={`w-full accent-emerald-500 ${sliderTrack} h-1.5 rounded-lg appearance-none cursor-pointer`}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className={`flex justify-between text-[11px] ${labelColor}`}>
                <span className="flex items-center gap-1">
                  <Contrast className="w-3 h-3 text-sky-500" /> Độ tương phản
                </span>
                <span className="font-mono text-slate-500">
                  {Math.round(imageAdjustments.contrast * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="-0.8"
                max="0.8"
                step="0.05"
                value={imageAdjustments.contrast}
                onChange={(e) =>
                  onApplyImageAdjustments({
                    ...imageAdjustments,
                    contrast: parseFloat(e.target.value),
                  })
                }
                className={`w-full accent-emerald-500 ${sliderTrack} h-1.5 rounded-lg appearance-none cursor-pointer`}
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className={`flex justify-between text-[11px] ${labelColor}`}>
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-purple-500" /> Độ bão hòa màu
                </span>
                <span className="font-mono text-slate-500">
                  {Math.round(imageAdjustments.saturation * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={imageAdjustments.saturation}
                onChange={(e) =>
                  onApplyImageAdjustments({
                    ...imageAdjustments,
                    saturation: parseFloat(e.target.value),
                  })
                }
                className={`w-full accent-emerald-500 ${sliderTrack} h-1.5 rounded-lg appearance-none cursor-pointer`}
              />
            </div>

            {/* Blur */}
            <div className="space-y-1">
              <div className={`flex justify-between text-[11px] ${labelColor}`}>
                <span className="flex items-center gap-1">
                  <Layers2 className="w-3 h-3 text-emerald-500" /> Làm mờ (Blur)
                </span>
                <span className="font-mono text-slate-500">
                  {Math.round(imageAdjustments.blur * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={imageAdjustments.blur}
                onChange={(e) =>
                  onApplyImageAdjustments({
                    ...imageAdjustments,
                    blur: parseFloat(e.target.value),
                  })
                }
                className={`w-full accent-emerald-500 ${sliderTrack} h-1.5 rounded-lg appearance-none cursor-pointer`}
              />
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-1 pt-1">
            <div className={`flex justify-between text-[11px] ${labelColor}`}>
              <span>Độ trong suốt (Opacity)</span>
              <span className="font-mono text-slate-500">
                {Math.round(((selectedObject.opacity as number) ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={(selectedObject.opacity as number) ?? 1}
              onChange={(e) => onUpdateShapeProps({ opacity: parseFloat(e.target.value) })}
              className={`w-full accent-emerald-500 ${sliderTrack} h-1.5 rounded-lg appearance-none cursor-pointer`}
            />
          </div>

          {renderCommonActions()}
        </div>
      )}

      {/* 3. KHI ĐANG CHỌN VĂN BẢN (TYPOGRAPHY) */}
      {selectedType === 'textbox' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm ${headingColor}`}>Thuộc Tính Chữ</h3>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded font-mono">
              TEXT
            </span>
          </div>

          {/* Font Family */}
          <div className="space-y-1">
            <label className={`text-[11px] font-medium ${labelColor}`}>Phông chữ</label>
            <select
              value={(selectedObject.fontFamily as string) || 'Inter'}
              onChange={(e) => onUpdateTextProps({ fontFamily: e.target.value })}
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${inputBg}`}
            >
              {FONTS.map((f) => (
                <option key={f} value={f} className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={`text-[11px] font-medium ${labelColor}`}>Cỡ chữ</label>
              <input
                type="number"
                min="10"
                max="200"
                value={(selectedObject.fontSize as number) || 32}
                onChange={(e) => onUpdateTextProps({ fontSize: parseInt(e.target.value) || 32 })}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none ${inputBg}`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-[11px] font-medium ${labelColor}`}>Định dạng</label>
              <div className="flex gap-1 h-8">
                <button
                  onClick={() =>
                    onUpdateTextProps({
                      fontWeight: selectedObject.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  className={`flex-1 rounded border flex items-center justify-center transition ${
                    selectedObject.fontWeight === 'bold'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                      : btnBg
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateTextProps({
                      fontStyle: selectedObject.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  className={`flex-1 rounded border flex items-center justify-center transition ${
                    selectedObject.fontStyle === 'italic'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                      : btnBg
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateTextProps({
                      underline: !selectedObject.underline,
                    })
                  }
                  className={`flex-1 rounded border flex items-center justify-center transition ${
                    selectedObject.underline
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                      : btnBg
                  }`}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="space-y-1">
            <label className={`text-[11px] font-medium ${labelColor}`}>Căn lề</label>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => onUpdateTextProps({ textAlign: 'left' })}
                className={`py-1.5 rounded border flex items-center justify-center transition ${
                  selectedObject.textAlign === 'left'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                    : btnBg
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateTextProps({ textAlign: 'center' })}
                className={`py-1.5 rounded border flex items-center justify-center transition ${
                  selectedObject.textAlign === 'center'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                    : btnBg
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateTextProps({ textAlign: 'right' })}
                className={`py-1.5 rounded border flex items-center justify-center transition ${
                  selectedObject.textAlign === 'right'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                    : btnBg
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <label className={`text-[11px] font-medium ${labelColor}`}>Màu chữ</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedObject.fill?.toString().startsWith('#') ? (selectedObject.fill as string) : '#ffffff'}
                onChange={(e) => onUpdateTextProps({ fill: e.target.value })}
                className={`w-8 h-8 rounded-lg border cursor-pointer p-0.5 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}
              />
              <input
                type="text"
                value={(selectedObject.fill as string) || '#ffffff'}
                onChange={(e) => onUpdateTextProps({ fill: e.target.value })}
                className={`flex-1 border rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none ${inputBg}`}
              />
            </div>
            <div className="grid grid-cols-8 gap-1.5 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateTextProps({ fill: c })}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-md border hover:scale-105 transition ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
                />
              ))}
            </div>
          </div>

          {renderCommonActions()}
        </div>
      )}

      {/* 4. KHI ĐANG CHỌN HÌNH KHỐI / SHAPE */}
      {selectedType !== 'image' && selectedType !== 'textbox' && selectedObject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm ${headingColor}`}>Thuộc Tính Hình Khối</h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono uppercase">
              {selectedType}
            </span>
          </div>

          {/* Quick Button: Add Text inside Shape */}
          <button
            onClick={onAddTextToShape}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 transition text-xs shadow-sm"
          >
            <Type className="w-3.5 h-3.5" />
            <span>➕ Thêm chữ vào giữa hình</span>
          </button>

          {/* Fill Color */}
          <div className="space-y-2">
            <label className={`text-[11px] font-medium ${labelColor}`}>Màu đổ (Fill)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedObject.fill?.toString().startsWith('#') ? (selectedObject.fill as string) : '#10b981'}
                onChange={(e) => onUpdateShapeProps({ fill: e.target.value })}
                className={`w-8 h-8 rounded-lg border cursor-pointer p-0.5 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}
              />
              <button
                onClick={() => onUpdateShapeProps({ fill: 'transparent' })}
                className={`px-2.5 py-1 border rounded text-[11px] hover:text-emerald-500 transition ${btnBg}`}
              >
                Trong suốt
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1.5 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateShapeProps({ fill: c })}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-md border hover:scale-105 transition ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
                />
              ))}
            </div>
          </div>

          {/* Stroke / Viền */}
          <div className="space-y-2">
            <label className={`text-[11px] font-medium ${labelColor}`}>Màu viền & Độ dày</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedObject.stroke?.toString().startsWith('#') ? (selectedObject.stroke as string) : '#ffffff'}
                onChange={(e) => onUpdateShapeProps({ stroke: e.target.value })}
                className={`w-8 h-8 rounded-lg border cursor-pointer p-0.5 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}
              />
              <input
                type="number"
                min="0"
                max="20"
                value={(selectedObject.strokeWidth as number) ?? 0}
                onChange={(e) => onUpdateShapeProps({ strokeWidth: parseInt(e.target.value) || 0 })}
                className={`w-20 border rounded-lg px-2 py-1.5 text-xs font-mono ${inputBg}`}
                placeholder="Độ dày"
              />
              <span className={`text-[10px] ${subtextColor}`}>px</span>
            </div>
          </div>

          {/* Corner Radius (for rect) */}
          {selectedType === 'rect' && (
            <div className="space-y-1">
              <div className={`flex justify-between text-[11px] ${labelColor}`}>
                <span>Bo tròn góc (Radius)</span>
                <span className="font-mono text-slate-500">{(selectedObject.rx as number) || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={(selectedObject.rx as number) || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onUpdateShapeProps({ rx: val, ry: val });
                }}
                className={`w-full accent-emerald-500 ${sliderTrack} h-1.5 rounded-lg appearance-none cursor-pointer`}
              />
            </div>
          )}

          {/* Opacity */}
          <div className="space-y-1">
            <div className={`flex justify-between text-[11px] ${labelColor}`}>
              <span>Độ trong suốt</span>
              <span className="font-mono text-slate-500">
                {Math.round(((selectedObject.opacity as number) ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={(selectedObject.opacity as number) ?? 1}
              onChange={(e) => onUpdateShapeProps({ opacity: parseFloat(e.target.value) })}
              className={`w-full accent-emerald-500 ${sliderTrack} h-1.5 rounded-lg appearance-none cursor-pointer`}
            />
          </div>

          {renderCommonActions()}
        </div>
      )}
    </aside>
  );
};
