'use client';

import React, { useRef, useState } from 'react';
import {
  LayoutTemplate,
  Grid,
  Type,
  Shapes,
  Award,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Plus,
  Wand2,
  CheckCircle2,
  Loader2,
  Palette,
  ChevronLeft,
  PenTool,
  Paintbrush,
  Search,
  X,
  Eraser,
  Highlighter,
  CircleDot,
  Sparkle,
  Trash2,
} from 'lucide-react';
import {
  ToolTab,
  DesignTemplate,
  DesignLayout,
  StickerItem,
  ShapeType,
  DrawingSettings,
  DrawingTool,
  BrushType,
  BrushLineCap,
  BrushDashStyle,
  EraserType,
} from '@/types/design-studio';
import { PRESET_TEMPLATES } from './templates/preset-templates';
import { DESIGN_LAYOUTS, LUCIDE_ICONS, STEM_BADGES, buildLucideSvg } from './templates/stickers-badges';
import { QUICK_BACKGROUNDS, SOLID_PALETTES, GRADIENT_PRESETS } from './templates/background-presets';
import { QUICK_VECTOR_SHAPES } from './templates/vector-shapes';

interface SidebarProps {
  width: number;
  onToggleCollapse: () => void;
  activeTab: ToolTab;
  onTabChange: (tab: ToolTab) => void;
  onAddText: (type: 'title' | 'subtitle' | 'body' | 'neon') => void;
  onAddShape: (type: ShapeType) => void;
  onUploadImage: (file: File) => void;
  onSelectTemplate: (template: DesignTemplate) => void;
  onApplyLayout: (layout: DesignLayout) => void;
  onAddSvgSticker: (svg: string) => void;
  onQuickAiRemoveBg: (file: File) => void;
  isAiProcessing: boolean;
  aiProgressMessage: string;
  isDark: boolean;
  canvasBgColor: string;
  onCanvasBgColorChange: (color: string, gradientStops?: [string, string]) => void;
  drawingSettings?: DrawingSettings;
  onUpdateDrawingSettings?: (updater: Partial<DrawingSettings> | ((prev: DrawingSettings) => DrawingSettings)) => void;
  onClearAllDrawings?: () => void;
  isDrawingMode?: boolean;
  onToggleDrawingMode?: (enabled: boolean) => void;
  drawingColor?: string;
  onDrawingColorChange?: (color: string) => void;
  drawingWidth?: number;
  onDrawingWidthChange?: (width: number) => void;
}

export const DesignStudioSidebar: React.FC<SidebarProps> = ({
  width,
  onToggleCollapse,
  activeTab,
  onTabChange,
  onAddText,
  onAddShape,
  onUploadImage,
  onSelectTemplate,
  onApplyLayout,
  onAddSvgSticker,
  onQuickAiRemoveBg,
  isAiProcessing,
  aiProgressMessage,
  isDark,
  canvasBgColor,
  onCanvasBgColorChange,
  drawingSettings,
  onUpdateDrawingSettings,
  onClearAllDrawings,
  isDrawingMode = false,
  onToggleDrawingMode,
  drawingColor = '#10b981',
  onDrawingColorChange,
  drawingWidth = 4,
  onDrawingWidthChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [stickerFilter, setStickerFilter] = useState<'all' | 'stem' | 'education' | 'badge' | 'arrow' | 'ui'>('all');
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [iconColor, setIconColor] = useState('#10b981');
  const [shapeCategory, setShapeCategory] = useState<'all' | 'basic' | 'polygon' | 'arrows' | 'callouts' | 'lines'>('all');
  const [vectorCategory, setVectorCategory] = useState<'all' | 'flowchart' | 'stem' | 'arrows' | 'badges'>('all');

  const tabs: Array<{ id: ToolTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'templates', label: 'Mẫu', icon: LayoutTemplate },
    { id: 'layouts', label: 'Bố cục', icon: Grid },
    { id: 'background', label: 'Nền', icon: Palette },
    { id: 'text', label: 'Văn bản', icon: Type },
    { id: 'shapes', label: 'Hình học', icon: Shapes },
    { id: 'stickers', label: 'Icon & Sticker', icon: Award },
    { id: 'images', label: 'Tải ảnh', icon: ImageIcon },
    { id: 'ai', label: 'AI Studio', icon: Sparkles },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUploadImage(file);
    }
  };

  const allStickersAndIcons: StickerItem[] = [...STEM_BADGES, ...LUCIDE_ICONS];
  const query = stickerSearchQuery.trim().toLowerCase();

  const filteredStickers = allStickersAndIcons.filter((item) => {
    if (stickerFilter !== 'all') {
      if (stickerFilter === 'badge') {
        if (item.category !== 'badge' && item.category !== 'ribbon') return false;
      } else if (item.category !== stickerFilter) {
        return false;
      }
    }

    if (query) {
      const matchName = item.name.toLowerCase().includes(query);
      const matchTag = item.tags ? item.tags.some((t) => t.toLowerCase().includes(query)) : false;
      return matchName || matchTag;
    }

    return true;
  });

  const sidebarBg = isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const tabHeaderBg = isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200';
  const cardBg = isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100';
  const subtextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingColor = isDark ? 'text-slate-200' : 'text-slate-800';

  const effectiveIsDrawing = drawingSettings?.isDrawingMode ?? isDrawingMode;
  const currentTool = drawingSettings?.tool ?? 'brush';
  const currentBrushType = drawingSettings?.brushType ?? 'pencil';
  const currentColor = drawingSettings?.color ?? drawingColor;
  const currentOpacity = drawingSettings?.opacity ?? 1;
  const currentWidth = drawingSettings?.width ?? drawingWidth;
  const currentLineCap = drawingSettings?.lineCap ?? 'round';
  const currentDashStyle = drawingSettings?.dashStyle ?? 'solid';
  const currentEraserType = drawingSettings?.eraserType ?? 'brush';
  const currentEraserWidth = drawingSettings?.eraserWidth ?? 24;

  const updateSettings = (partial: Partial<DrawingSettings>) => {
    if (onUpdateDrawingSettings) {
      onUpdateDrawingSettings(partial);
    } else {
      if (partial.isDrawingMode !== undefined) onToggleDrawingMode?.(partial.isDrawingMode);
      if (partial.color !== undefined) onDrawingColorChange?.(partial.color);
      if (partial.width !== undefined) onDrawingWidthChange?.(partial.width);
    }
  };

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`border-r flex flex-col shrink-0 select-none z-20 h-full transition-[width] duration-75 relative ${sidebarBg}`}
    >
      {/* Sidebar Top Header with Collapse Button */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-b shrink-0 ${tabHeaderBg}`}>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Bảng Công Cụ
        </span>
        <button
          onClick={onToggleCollapse}
          className={`p-1 rounded-md transition ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
          }`}
          title="Thu gọn bảng công cụ (Ẩn)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation Icons - 2 responsive rows (4x2) */}
      <div className={`grid grid-cols-4 gap-1 p-2 border-b shrink-0 ${tabHeaderBg}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition text-[11px] font-medium min-w-0 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center tracking-tight text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <div>
              <h3 className={`font-semibold text-sm ${headingColor}`}>Mẫu STEM Thiết kế sẵn</h3>
              <p className={`text-[11px] mt-0.5 ${subtextColor}`}>Chọn mẫu để áp dụng ngay vào canvas</p>
            </div>

            <div className="space-y-2.5">
              {PRESET_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl)}
                  className={`group p-3 rounded-xl border hover:border-emerald-500/50 cursor-pointer transition flex items-start gap-3 ${cardBg}`}
                >
                  <div className={`text-2xl p-2 rounded-lg border group-hover:scale-105 transition shrink-0 ${
                    isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    {tmpl.thumbnail}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold group-hover:text-emerald-500 transition truncate ${headingColor}`}>
                      {tmpl.name}
                    </h4>
                    <p className={`text-[11px] line-clamp-2 mt-0.5 leading-relaxed ${subtextColor}`}>
                      {tmpl.description}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {tmpl.dimensions.width} × {tmpl.dimensions.height}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LAYOUTS (BỐ CỤC) */}
        {activeTab === 'layouts' && (
          <div className="space-y-3">
            <div>
              <h3 className={`font-semibold text-sm ${headingColor}`}>Bố Cục Chia Khung Hình</h3>
              <p className={`text-[11px] mt-0.5 ${subtextColor}`}>
                Tạo khung sẵn kiểu Canva để ghép ảnh và chỉnh sửa nhanh chóng
              </p>
            </div>

            <div className="space-y-2.5">
              {DESIGN_LAYOUTS.map((layout) => (
                <div
                  key={layout.id}
                  onClick={() => onApplyLayout(layout)}
                  className={`group p-3 rounded-xl border hover:border-emerald-500/50 cursor-pointer transition flex items-start gap-3 ${cardBg}`}
                >
                  <div className={`text-2xl p-2 rounded-lg border group-hover:scale-105 transition shrink-0 ${
                    isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    {layout.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold group-hover:text-emerald-500 transition truncate ${headingColor}`}>
                      {layout.name}
                    </h4>
                    <p className={`text-[11px] line-clamp-2 mt-0.5 leading-relaxed ${subtextColor}`}>
                      {layout.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BACKGROUND (CÀI ĐẶT NỀN CANVAS) */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <div>
              <h3 className={`font-semibold text-sm ${headingColor}`}>Cài Đặt Nền Canvas</h3>
              <p className={`text-[11px] mt-0.5 ${subtextColor}`}>
                Tùy biến nền trong suốt, màu đơn sắc hoặc gradient chuyển sắc
              </p>
            </div>

            {/* Quick Background Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Kiểu nền thông dụng
              </label>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                {QUICK_BACKGROUNDS.map((item) => {
                  const isSelected = canvasBgColor === item.value;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onCanvasBgColorChange(item.value)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left group min-w-0 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : cardBg
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg border border-black/20 shrink-0 shadow-xs"
                        style={{
                          backgroundColor: item.value === 'transparent' ? 'transparent' : item.value,
                          backgroundImage: item.value === 'transparent'
                            ? 'linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #94a3b8 75%), linear-gradient(-45deg, transparent 75%, #94a3b8 75%)'
                            : undefined,
                          backgroundSize: item.value === 'transparent' ? '6px 6px' : undefined,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold leading-snug break-words ${
                          isSelected ? 'text-emerald-600 dark:text-emerald-400' : headingColor
                        }`}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {item.id === 'transparent' ? 'PNG trong suốt' : item.value}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Input */}
            <div className={`p-3 rounded-xl border space-y-2 ${cardBg}`}>
              <label className={`text-[11px] font-semibold block ${headingColor}`}>
                Màu tùy chỉnh (Hex Code)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={canvasBgColor.startsWith('#') ? canvasBgColor : '#0f172a'}
                  onChange={(e) => onCanvasBgColorChange(e.target.value)}
                  className={`w-9 h-9 rounded-lg border cursor-pointer p-0.5 ${
                    isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'
                  }`}
                />
                <input
                  type="text"
                  value={canvasBgColor}
                  onChange={(e) => onCanvasBgColorChange(e.target.value)}
                  placeholder="#000000"
                  className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Gradient Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Màu Gradient Chuyển Sắc (Đa Chiều)
              </label>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                {GRADIENT_PRESETS.map((grad) => {
                  const isSelected = canvasBgColor === grad.value;
                  return (
                    <button
                      key={grad.id}
                      onClick={() => onCanvasBgColorChange(grad.value, grad.gradientStops)}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition text-left group min-w-0 ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : cardBg
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shrink-0 shadow-xs"
                        style={{
                          background: `linear-gradient(135deg, ${grad.gradientStops?.[0]}, ${grad.gradientStops?.[1]})`,
                        }}
                      />
                      <span className={`text-[11px] font-medium leading-tight break-words flex-1 ${
                        isSelected ? 'text-emerald-600 dark:text-emerald-400' : headingColor
                      }`}>
                        {grad.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Curated Solid Palettes */}
            <div className="space-y-3 pt-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Bảng màu đơn sắc chọn lọc
              </label>
              {SOLID_PALETTES.map((palette) => (
                <div key={palette.group} className="space-y-1">
                  <div className="text-[10px] text-slate-500 font-medium">{palette.group}</div>
                  <div className="grid grid-cols-11 gap-1">
                    {palette.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => onCanvasBgColorChange(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-md border transition ${
                          canvasBgColor === c
                            ? 'border-emerald-500 scale-110 shadow-sm ring-2 ring-emerald-500/40'
                            : isDark
                            ? 'border-slate-800 hover:scale-105'
                            : 'border-slate-300 hover:scale-105'
                        }`}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <h3 className={`font-semibold text-sm ${headingColor}`}>Chèn Văn Bản</h3>
              <p className={`text-[11px] mt-0.5 ${subtextColor}`}>Bấm vào khối chữ để chèn vào giữa màn hình</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onAddText('title')}
                className={`w-full py-3 px-4 rounded-xl border hover:border-emerald-500/40 text-left transition flex items-center justify-between group ${cardBg}`}
              >
                <div>
                  <div className={`text-base font-bold group-hover:text-emerald-500 ${headingColor}`}>Tiêu đề lớn (Heading 1)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Font 48px • Đậm</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onAddText('subtitle')}
                className={`w-full py-2.5 px-4 rounded-xl border hover:border-emerald-500/40 text-left transition flex items-center justify-between group ${cardBg}`}
              >
                <div>
                  <div className={`text-sm font-semibold group-hover:text-emerald-500 ${headingColor}`}>Tiêu đề phụ (Heading 2)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Font 28px • Trung bình</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onAddText('body')}
                className={`w-full py-2 px-4 rounded-xl border hover:border-emerald-500/40 text-left transition flex items-center justify-between group ${cardBg}`}
              >
                <div>
                  <div className={`text-xs font-normal group-hover:text-emerald-500 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Đoạn nội dung (Body text)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Font 18px • Thường</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onAddText('neon')}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-300">
                    ⚡ Chữ Phát Sáng Neon Cyber
                  </div>
                  <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-mono">Hiệu ứng phát quang</div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SHAPES & QUICK VECTORS */}
        {activeTab === 'shapes' && (
          <div className="space-y-4">
            <div>
              <h3 className={`font-semibold text-sm ${headingColor}`}>Hình Khối, Vector & Bút Vẽ</h3>
              <p className={`text-[11px] mt-0.5 ${subtextColor}`}>
                Thêm khối hình, vector kỹ thuật hoặc vẽ tự do. <strong>Nhấp đúp vào hình</strong> để gõ chữ vào giữa!
              </p>
            </div>

            {/* 1. FREEHAND VECTOR PEN & ERASER TOOL */}
            <div className={`p-3 rounded-xl border space-y-3 transition ${
              effectiveIsDrawing
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                : cardBg
            }`}>
              {/* Header with Master Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                  {currentTool === 'eraser' ? (
                    <Eraser className="w-4 h-4 text-amber-500" />
                  ) : (
                    <PenTool className="w-4 h-4" />
                  )}
                  <span>{currentTool === 'eraser' ? 'Dụng Cụ Tẩy Nét' : 'Bút Vẽ Vector Tự Do'}</span>
                </div>
                <button
                  onClick={() => {
                    const nextMode = !effectiveIsDrawing;
                    updateSettings({ isDrawingMode: nextMode });
                    onToggleDrawingMode?.(nextMode);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    effectiveIsDrawing
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>{effectiveIsDrawing ? 'Đang bật (Tắt)' : 'Bật vẽ/tẩy'}</span>
                </button>
              </div>

              {effectiveIsDrawing && (
                <div className="space-y-3 pt-2 border-t border-emerald-500/20">
                  {/* Tool Switcher: Brush vs Eraser */}
                  <div className={`flex rounded-lg p-0.5 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/80 border-slate-300'}`}>
                    <button
                      onClick={() => updateSettings({ tool: 'brush' })}
                      className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        currentTool === 'brush'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Bút Vẽ</span>
                    </button>
                    <button
                      onClick={() => updateSettings({ tool: 'eraser' })}
                      className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        currentTool === 'eraser'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Dụng Cụ Tẩy</span>
                    </button>
                  </div>

                  {/* BRUSH MODE CONTROLS */}
                  {currentTool === 'brush' && (
                    <div className="space-y-2.5">
                      {/* 1. Brush Types */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Dạng Bút Vẽ
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'pencil' as BrushType, label: 'Bút mực / chì', desc: 'Chuẩn nét', icon: PenTool },
                            { id: 'highlighter' as BrushType, label: 'Dạ quang', desc: 'Nhớ dòng mờ', icon: Highlighter },
                            { id: 'circle' as BrushType, label: 'Cọ tròn', desc: 'Chấm đốm', icon: CircleDot },
                            { id: 'spray' as BrushType, label: 'Phun sương', desc: 'Bụi lấp lánh', icon: Sparkle },
                          ].map((b) => {
                            const IconComponent = b.icon;
                            const isSel = currentBrushType === b.id;
                            return (
                              <button
                                key={b.id}
                                onClick={() => updateSettings({ brushType: b.id })}
                                className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition ${
                                  isSel
                                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                                    : isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[11px] leading-tight truncate">{b.label}</div>
                                  <div className="text-[9px] text-slate-400 leading-none truncate">{b.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Brush Tip Cap & Dash Style */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block mb-1">Đầu bút:</span>
                          <div className={`flex rounded-md p-0.5 border text-[10px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                            {[
                              { id: 'round' as BrushLineCap, label: 'Tròn' },
                              { id: 'square' as BrushLineCap, label: 'Vuông' },
                              { id: 'butt' as BrushLineCap, label: 'Phẳng' },
                            ].map((c) => (
                              <button
                                key={c.id}
                                onClick={() => updateSettings({ lineCap: c.id })}
                                className={`flex-1 py-0.5 rounded transition ${
                                  currentLineCap === c.id
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block mb-1">Kiểu nét:</span>
                          <div className={`flex rounded-md p-0.5 border text-[10px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                            {[
                              { id: 'solid' as BrushDashStyle, label: 'Liền' },
                              { id: 'dashed' as BrushDashStyle, label: 'Đứt' },
                              { id: 'dotted' as BrushDashStyle, label: 'Chấm' },
                            ].map((d) => (
                              <button
                                key={d.id}
                                onClick={() => updateSettings({ dashStyle: d.id })}
                                className={`flex-1 py-0.5 rounded transition ${
                                  currentDashStyle === d.id
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3. Detailed Opacity Adjustment */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Độ đậm nhạt (Opacity):</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={5}
                              max={100}
                              value={Math.round(currentOpacity * 100)}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(5, Number(e.target.value) || 100));
                                updateSettings({ opacity: val / 100 });
                              }}
                              className={`w-12 px-1.5 py-0.5 text-center text-xs rounded border font-mono outline-none ${
                                isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-700'
                              }`}
                            />
                            <span className="text-[10px] text-slate-500 font-mono">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={100}
                          value={Math.round(currentOpacity * 100)}
                          onChange={(e) => updateSettings({ opacity: Number(e.target.value) / 100 })}
                          className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* 4. Detailed Brush Width Adjustment */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Độ dày nét bút:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={currentWidth}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(1, Number(e.target.value) || 4));
                                updateSettings({ width: val });
                                onDrawingWidthChange?.(val);
                              }}
                              className={`w-12 px-1.5 py-0.5 text-center text-xs rounded border font-mono outline-none ${
                                isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-700'
                              }`}
                            />
                            <span className="text-[10px] text-slate-500 font-mono">px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={currentWidth}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateSettings({ width: val });
                            onDrawingWidthChange?.(val);
                          }}
                          className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />

                        {/* Quick Width Chips */}
                        <div className="flex items-center gap-1 pt-0.5">
                          {[2, 4, 8, 16, 32].map((sz) => (
                            <button
                              key={sz}
                              onClick={() => {
                                updateSettings({ width: sz });
                                onDrawingWidthChange?.(sz);
                              }}
                              className={`flex-1 py-0.5 rounded text-[10px] font-mono transition ${
                                currentWidth === sz
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {sz}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 5. Brush Color Swatches */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Màu nét vẽ:</span>
                          <span className="font-mono text-[10px] text-emerald-500 font-semibold">{currentColor}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#ffffff', '#000000'].map((col) => (
                            <button
                              key={col}
                              onClick={() => {
                                updateSettings({ color: col });
                                onDrawingColorChange?.(col);
                              }}
                              style={{ backgroundColor: col }}
                              className={`w-5 h-5 rounded-full border transition ${
                                currentColor === col
                                  ? 'scale-125 ring-2 ring-emerald-500 ring-offset-1 ring-offset-slate-900 border-white'
                                  : 'border-slate-400/40 hover:scale-110'
                              }`}
                              title={col}
                            />
                          ))}
                          <label className="relative w-5 h-5 rounded-full border border-dashed border-slate-400 cursor-pointer flex items-center justify-center overflow-hidden hover:scale-110 transition shrink-0" title="Chọn màu tự do">
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) => {
                                updateSettings({ color: e.target.value });
                                onDrawingColorChange?.(e.target.value);
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                            <span className="text-[9px] font-bold text-slate-400">+</span>
                          </label>
                        </div>
                      </div>

                      {/* Live Brush Preview Box */}
                      <div className={`p-2 rounded-lg border flex items-center justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                        <span className="text-[10px] text-slate-400">Xem trước đầu bút:</span>
                        <div className="h-6 flex items-center justify-center px-4 overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(currentWidth, 40)}px`,
                              height: `${Math.min(currentWidth, 40)}px`,
                              backgroundColor: currentColor,
                              opacity: currentOpacity,
                              borderRadius: currentLineCap === 'round' ? '50%' : currentLineCap === 'square' ? '2px' : '0px',
                            }}
                            className="shadow-xs transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ERASER MODE CONTROLS */}
                  {currentTool === 'eraser' && (
                    <div className="space-y-2.5">
                      {/* 1. Eraser Sub-Type */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Chế Độ Tẩy
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => updateSettings({ eraserType: 'brush' })}
                            className={`p-2 rounded-lg border text-left transition flex items-center gap-1.5 ${
                              currentEraserType === 'brush'
                                ? 'border-amber-500 bg-amber-500/15 text-amber-500 font-semibold'
                                : isDark ? 'border-slate-800 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <Paintbrush className="w-3.5 h-3.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[11px] leading-tight font-medium">Tẩy kéo tự do</div>
                              <div className="text-[9px] text-slate-400">Kéo chuột tẩy vùng</div>
                            </div>
                          </button>

                          <button
                            onClick={() => updateSettings({ eraserType: 'stroke' })}
                            className={`p-2 rounded-lg border text-left transition flex items-center gap-1.5 ${
                              currentEraserType === 'stroke'
                                ? 'border-amber-500 bg-amber-500/15 text-amber-500 font-semibold'
                                : isDark ? 'border-slate-800 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <Eraser className="w-3.5 h-3.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[11px] leading-tight font-medium">Tẩy chạm xóa nét</div>
                              <div className="text-[9px] text-slate-400">Bấm nét là xóa ngay</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* 2. Detailed Eraser Width */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Kích thước đầu tẩy:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={2}
                              max={120}
                              value={currentEraserWidth}
                              onChange={(e) => {
                                const val = Math.min(120, Math.max(2, Number(e.target.value) || 20));
                                updateSettings({ eraserWidth: val });
                              }}
                              className={`w-12 px-1.5 py-0.5 text-center text-xs rounded border font-mono outline-none ${
                                isDark ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-white border-slate-300 text-amber-700'
                              }`}
                            />
                            <span className="text-[10px] text-slate-500 font-mono">px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={120}
                          value={currentEraserWidth}
                          onChange={(e) => updateSettings({ eraserWidth: Number(e.target.value) })}
                          className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />

                        {/* Quick Eraser Width Chips */}
                        <div className="flex items-center gap-1 pt-0.5">
                          {[8, 16, 24, 48, 80].map((sz) => (
                            <button
                              key={sz}
                              onClick={() => updateSettings({ eraserWidth: sz })}
                              className={`flex-1 py-0.5 rounded text-[10px] font-mono transition ${
                                currentEraserWidth === sz
                                  ? 'bg-amber-600 text-white font-bold'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {sz}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Eraser Preview Box */}
                      <div className={`p-2 rounded-lg border flex items-center justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                        <span className="text-[10px] text-slate-400">Kích thước đầu tẩy:</span>
                        <div className="h-8 flex items-center justify-center px-4">
                          <div
                            style={{
                              width: `${Math.min(currentEraserWidth, 50)}px`,
                              height: `${Math.min(currentEraserWidth, 50)}px`,
                            }}
                            className="rounded-full border-2 border-dashed border-amber-500 bg-amber-500/20 shadow-xs transition-all"
                          />
                        </div>
                      </div>

                      {/* Clear All Drawings Action Button */}
                      <button
                        onClick={onClearAllDrawings}
                        className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        title="Xóa nhanh mọi nét vẽ tự do trên canvas mà không ảnh hưởng ảnh hay chữ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Sạch Tất Cả Nét Vẽ</span>
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 italic">
                    💡 Rê chuột trên canvas để vẽ/tẩy. Tắt bút để chọn và di chuyển nét vẽ như vật thể vector.
                  </p>
                </div>
              )}
            </div>

            {/* 2. DIVERSE SHAPES LIBRARY (21 SHAPES) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Khối Hình Học Đa Dạng
                </span>
                <span className="text-[10px] text-slate-400 font-mono">21 hình</span>
              </div>

              {/* Category Filter Pills */}
              <div className={`flex flex-wrap gap-1 p-1 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'basic', label: 'Cơ bản' },
                  { id: 'polygon', label: 'Đa giác' },
                  { id: 'arrows', label: 'Mũi tên' },
                  { id: 'callouts', label: 'Thoại' },
                  { id: 'lines', label: 'Đường kẻ' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setShapeCategory(cat.id as typeof shapeCategory)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      shapeCategory === cat.id
                        ? isDark
                          ? 'bg-slate-800 text-emerald-400 shadow-xs'
                          : 'bg-white text-emerald-600 shadow-xs'
                        : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Shapes Grid */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2 max-h-72 overflow-y-auto pr-0.5">
                {[
                  { id: 'rect' as ShapeType, name: 'Chữ nhật', iconPath: 'M 4 4 H 20 V 20 H 4 Z', cat: 'basic', color: '#10b981' },
                  { id: 'rounded-rect' as ShapeType, name: 'Bo góc mềm', iconPath: 'M 7 4 H 17 A 3 3 0 0 1 20 7 V 17 A 3 3 0 0 1 17 20 H 7 A 3 3 0 0 1 4 17 V 7 A 3 3 0 0 1 7 4 Z', cat: 'basic', color: '#10b981' },
                  { id: 'circle' as ShapeType, name: 'Hình tròn', iconPath: 'M 12 3 A 9 9 0 1 0 12 21 A 9 9 0 1 0 12 3 Z', cat: 'basic', color: '#38bdf8' },
                  { id: 'ellipse' as ShapeType, name: 'Bầu dục', iconPath: 'M 12 6 C 17 6 21 8.5 21 12 C 21 15.5 17 18 12 18 C 7 18 3 15.5 3 12 C 3 8.5 7 6 12 6 Z', cat: 'basic', color: '#6366f1' },
                  { id: 'triangle' as ShapeType, name: 'Tam giác', iconPath: 'M 12 3 L 21 19 H 3 Z', cat: 'basic', color: '#f59e0b' },
                  { id: 'diamond' as ShapeType, name: 'Hình thoi', iconPath: 'M 12 3 L 21 12 L 12 21 L 3 12 Z', cat: 'basic', color: '#ec4899' },
                  { id: 'star' as ShapeType, name: 'Ngôi sao', iconPath: 'M 12 2 L 15 8 L 22 9 L 17 14 L 18 21 L 12 17 L 6 21 L 7 14 L 2 9 L 9 8 Z', cat: 'basic', color: '#fbbf24' },
                  { id: 'heart' as ShapeType, name: 'Trái tim', iconPath: 'M 12 21 C 12 21 3 14 3 8.5 A 5.5 5.5 0 0 1 12 5 A 5.5 5.5 0 0 1 21 8.5 C 21 14 12 21 12 21 Z', cat: 'basic', color: '#f43f5e' },
                  { id: 'hexagon' as ShapeType, name: 'Lục giác', iconPath: 'M 7 3 H 17 L 22 12 L 17 21 H 7 L 2 12 Z', cat: 'polygon', color: '#06b6d4' },
                  { id: 'pentagon' as ShapeType, name: 'Ngũ giác', iconPath: 'M 12 2 L 22 9 L 18 21 H 6 L 2 9 Z', cat: 'polygon', color: '#8b5cf6' },
                  { id: 'octagon' as ShapeType, name: 'Bát giác', iconPath: 'M 8 2 H 16 L 22 8 V 16 L 16 22 H 8 L 2 16 V 8 Z', cat: 'polygon', color: '#14b8a6' },
                  { id: 'cross' as ShapeType, name: 'Chữ thập (+)', iconPath: 'M 9 2 H 15 V 9 H 22 V 15 H 15 V 22 H 9 V 15 H 2 V 9 H 9 Z', cat: 'polygon', color: '#ef4444' },
                  { id: 'arrow-right' as ShapeType, name: 'Mũi tên phải', iconPath: 'M 3 9 H 14 V 5 L 21 12 L 14 19 V 15 H 3 Z', cat: 'arrows', color: '#10b981' },
                  { id: 'arrow-left' as ShapeType, name: 'Mũi tên trái', iconPath: 'M 21 9 H 10 V 5 L 3 12 L 10 19 V 15 H 21 Z', cat: 'arrows', color: '#10b981' },
                  { id: 'arrow-double' as ShapeType, name: 'Mũi tên 2 đầu', iconPath: 'M 7 6 L 2 12 L 7 18 V 14 H 17 V 18 L 22 12 L 17 6 V 10 H 7 Z', cat: 'arrows', color: '#0284c7' },
                  { id: 'speech-bubble' as ShapeType, name: 'Bong bóng thoại', iconPath: 'M 4 4 H 20 V 16 H 9 L 5 20 V 16 H 4 Z', cat: 'callouts', color: '#3b82f6' },
                  { id: 'thought-bubble' as ShapeType, name: 'Đám mây', iconPath: 'M 6 18 A 4 4 0 0 1 4 14 A 5 5 0 0 1 9 9 A 6 6 0 0 1 18 9 A 4 4 0 0 1 20 14 A 4 4 0 0 1 17 18 Z', cat: 'callouts', color: '#8b5cf6' },
                  { id: 'lightning' as ShapeType, name: 'Tia chớp', iconPath: 'M 13 2 L 4 13 H 11 L 9 22 L 20 10 H 13 Z', cat: 'callouts', color: '#eab308' },
                  { id: 'badge-ribbon' as ShapeType, name: 'Ruy băng', iconPath: 'M 3 4 H 19 L 21 10 L 19 16 H 3 L 6 10 Z', cat: 'callouts', color: '#e11d48' },
                  { id: 'line' as ShapeType, name: 'Đường thẳng', iconPath: 'M 3 12 H 21', cat: 'lines', color: '#94a3b8' },
                  { id: 'dashed-line' as ShapeType, name: 'Nét đứt', iconPath: 'M 3 12 H 7 M 10 12 H 14 M 17 12 H 21', cat: 'lines', color: '#38bdf8' },
                  { id: 'arrow-line' as ShapeType, name: 'Đường mũi tên', iconPath: 'M 3 12 H 18 M 14 8 L 19 12 L 14 16', cat: 'lines', color: '#10b981' },
                ]
                  .filter((s) => shapeCategory === 'all' || s.cat === shapeCategory)
                  .map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => onAddShape(shape.id)}
                      className={`p-2.5 rounded-xl border hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1.5 group transition text-center min-w-0 ${cardBg}`}
                      title={shape.name}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition shrink-0">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-6 h-6"
                          fill={shape.cat === 'lines' ? 'none' : shape.color}
                          stroke={shape.color}
                          strokeWidth={shape.cat === 'lines' ? 2.5 : 1}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d={shape.iconPath} />
                        </svg>
                      </div>
                      <span className={`text-[10px] font-medium leading-tight truncate w-full group-hover:text-emerald-500 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {shape.name}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* 3. QUICK VECTOR LIBRARY (FLOWCHART, STEM, ARROWS, BADGES) */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-semibold ${headingColor}`}>Kho Vector Đồ Họa Vẽ Nhanh</h4>
                  <p className={`text-[10px] ${subtextColor}`}>Bấm để chèn ngay vector đồ họa chuyên nghiệp</p>
                </div>
                <span className="text-[10px] text-emerald-500 font-mono font-semibold">
                  {QUICK_VECTOR_SHAPES.length} mẫu
                </span>
              </div>

              {/* Vector Filter Pills */}
              <div className={`flex flex-wrap gap-1 p-1 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'flowchart', label: 'Sơ đồ luồng' },
                  { id: 'stem', label: 'STEM & Tech' },
                  { id: 'arrows', label: 'Mũi tên' },
                  { id: 'badges', label: 'Huy hiệu' },
                ].map((vcat) => (
                  <button
                    key={vcat.id}
                    onClick={() => setVectorCategory(vcat.id as typeof vectorCategory)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      vectorCategory === vcat.id
                        ? isDark
                          ? 'bg-slate-800 text-emerald-400 shadow-xs'
                          : 'bg-white text-emerald-600 shadow-xs'
                        : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {vcat.label}
                  </button>
                ))}
              </div>

              {/* Quick Vectors Grid */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 max-h-72 overflow-y-auto pr-0.5">
                {QUICK_VECTOR_SHAPES
                  .filter((v) => vectorCategory === 'all' || v.category === vectorCategory)
                  .map((vector) => (
                    <button
                      key={vector.id}
                      onClick={() => onAddSvgSticker(vector.svg)}
                      className={`p-2.5 rounded-xl border hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1.5 group transition text-center min-w-0 ${cardBg}`}
                      title={vector.name}
                    >
                      <div
                        className="w-12 h-10 flex items-center justify-center group-hover:scale-110 transition shrink-0"
                        dangerouslySetInnerHTML={{ __html: vector.svg }}
                      />
                      <span className={`text-[10px] font-medium leading-tight truncate w-full group-hover:text-emerald-500 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {vector.name}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HUY HIỆU & LUCIDE STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold text-sm ${headingColor}`}>Kho Icon & Sticker Chuẩn Lucide</h3>
                <p className={`text-[11px] mt-0.5 ${subtextColor}`}>
                  Tìm kiếm icon vector, đổi màu và chèn trực tiếp vào canvas
                </p>
              </div>
              <span className="text-[10px] text-emerald-500 font-mono font-semibold shrink-0">
                {filteredStickers.length} icon
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={stickerSearchQuery}
                onChange={(e) => setStickerSearchQuery(e.target.value)}
                placeholder="Tìm icon (robot, cúp, sao, code, sách...)"
                className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border outline-none transition ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'
                }`}
              />
              {stickerSearchQuery && (
                <button
                  onClick={() => setStickerSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Pre-insert Color Palette */}
            <div className={`p-2.5 rounded-xl border space-y-1.5 ${cardBg}`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Màu viền Icon:
                </span>
                <span className="font-mono text-[10px] text-emerald-500 font-bold">{iconColor}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  '#10b981', // emerald
                  '#06b6d4', // cyan
                  '#3b82f6', // blue
                  '#a855f7', // purple
                  '#ec4899', // pink
                  '#ef4444', // red
                  '#f59e0b', // amber
                  '#ffffff', // white
                  '#0f172a', // dark slate
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => setIconColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border transition transform hover:scale-110 ${
                      iconColor === color
                        ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-slate-900 border-white'
                        : 'border-slate-400/40'
                    }`}
                    title={color}
                  />
                ))}
                {/* Custom Color Input */}
                <label className="relative w-5 h-5 rounded-full border border-dashed border-slate-400 cursor-pointer flex items-center justify-center overflow-hidden hover:scale-110 transition shrink-0" title="Chọn màu tự do">
                  <input
                    type="color"
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <span className="text-[9px] font-bold text-slate-400">+</span>
                </label>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className={`flex flex-wrap gap-1 p-1 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'stem', label: 'STEM & Robot' },
                { id: 'education', label: 'Giáo dục' },
                { id: 'badge', label: 'Huy hiệu' },
                { id: 'arrow', label: 'Mũi tên' },
                { id: 'ui', label: 'UI & Đồ họa' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setStickerFilter(cat.id as typeof stickerFilter)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                    stickerFilter === cat.id
                      ? isDark
                        ? 'bg-slate-800 text-emerald-400 shadow-xs'
                        : 'bg-white text-emerald-600 shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sticker / Icon Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2 max-h-80 overflow-y-auto pr-0.5">
              {filteredStickers.map((item) => {
                const previewSvg = item.paths
                  ? buildLucideSvg(item.paths, iconColor, 'none', 2, 40)
                  : item.svg;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      const finalSvg = item.paths
                        ? buildLucideSvg(item.paths, iconColor, 'none', 2, 96)
                        : item.svg;
                      onAddSvgSticker(finalSvg);
                    }}
                    className={`p-2 rounded-xl border hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1.5 transition group text-center min-w-0 ${cardBg}`}
                    title={item.name}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition shrink-0"
                      dangerouslySetInnerHTML={{ __html: previewSvg }}
                    />
                    <span className={`text-[10px] font-medium leading-tight truncate w-full group-hover:text-emerald-500 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredStickers.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không tìm thấy icon hoặc sticker phù hợp
              </div>
            )}
          </div>
        )}

        {/* TAB 6: IMAGES / UPLOAD */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <div>
              <h3 className={`font-semibold text-sm ${headingColor}`}>Tải Ảnh Lên</h3>
              <p className={`text-[11px] mt-0.5 ${subtextColor}`}>Kéo thả, dán (Ctrl+V) hoặc chọn từ máy</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadImage(f);
                e.target.value = '';
              }}
              accept="image/*"
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isDark
                  ? 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}>
                <Upload className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${headingColor}`}>Bấm để chọn file hoặc kéo thả</p>
                <p className="text-[10px] text-slate-500 mt-1">Hỗ trợ PNG, JPG, WebP, SVG (Có thể dán Ctrl+V)</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AI STUDIO */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div>
              <h3 className={`font-semibold text-sm flex items-center gap-1.5 ${headingColor}`}>
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Công cụ Trí Tuệ Nhân Tạo (AI)
              </h3>
              <p className={`text-[11px] mt-0.5 ${subtextColor}`}>Xử lý ảnh bằng model IS-Net chạy cục bộ trong trình duyệt</p>
            </div>

            <input
              type="file"
              ref={aiFileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onQuickAiRemoveBg(f);
                e.target.value = '';
              }}
              accept="image/*"
              className="hidden"
            />

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 text-xs">Tải ảnh lên & Tự động tách nền AI</h4>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Tải ảnh bất kỳ từ máy tính, AI sẽ tự động cô lập nhân vật, sản phẩm, linh kiện robot thành ảnh PNG trong suốt và đưa ngay vào thiết kế.
              </p>

              <button
                onClick={() => aiFileInputRef.current?.click()}
                disabled={isAiProcessing}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 text-xs transition disabled:opacity-50"
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{aiProgressMessage || 'Đang xử lý AI...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn ảnh để Tách nền AI ngay</span>
                  </>
                )}
              </button>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-1.5 text-[11px] ${
              isDark ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
              <div className={`font-semibold flex items-center gap-1.5 ${headingColor}`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Tách nền layer đang chọn trên Canvas
              </div>
              <p className="leading-relaxed">
                Khi bạn bấm chọn một layer ảnh bất kỳ trên canvas, bên cột phải (Bảng thuộc tính) sẽ xuất hiện nút bấm <strong>✨ Tách nền AI (1-Click)</strong> để tách nền trực tiếp layer đó mà không làm mất vị trí!
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
