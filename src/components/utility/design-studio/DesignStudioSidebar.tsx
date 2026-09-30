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
  Square,
  Circle,
  Triangle,
  Minus,
  Wand2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ToolTab, DesignTemplate, DesignLayout, StickerItem } from '@/types/design-studio';
import { PRESET_TEMPLATES } from './templates/preset-templates';
import { DESIGN_LAYOUTS, LUCIDE_ICONS, STEM_BADGES } from './templates/stickers-badges';

interface SidebarProps {
  activeTab: ToolTab;
  onTabChange: (tab: ToolTab) => void;
  onAddText: (type: 'title' | 'subtitle' | 'body' | 'neon') => void;
  onAddShape: (type: 'rect' | 'circle' | 'triangle' | 'line') => void;
  onUploadImage: (file: File) => void;
  onSelectTemplate: (template: DesignTemplate) => void;
  onApplyLayout: (layout: DesignLayout) => void;
  onAddSvgSticker: (svg: string) => void;
  onQuickAiRemoveBg: (file: File) => void;
  isAiProcessing: boolean;
  aiProgressMessage: string;
}

export const DesignStudioSidebar: React.FC<SidebarProps> = ({
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [stickerFilter, setStickerFilter] = useState<'all' | 'lucide' | 'badge'>('all');

  const tabs: Array<{ id: ToolTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'templates', label: 'Mẫu', icon: LayoutTemplate },
    { id: 'layouts', label: 'Bố cục', icon: Grid },
    { id: 'text', label: 'Văn bản', icon: Type },
    { id: 'shapes', label: 'Hình học', icon: Shapes },
    { id: 'stickers', label: 'Huy hiệu', icon: Award },
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

  const filteredStickers: StickerItem[] =
    stickerFilter === 'lucide'
      ? LUCIDE_ICONS
      : stickerFilter === 'badge'
      ? STEM_BADGES
      : [...STEM_BADGES, ...LUCIDE_ICONS];

  return (
    <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0 select-none z-20 h-full text-slate-800 dark:text-slate-100 transition-colors">
      {/* Tab Navigation Icons */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1.5 gap-1 shrink-0 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-1.5 px-1 rounded-lg flex flex-col items-center gap-1 transition text-[10px] font-medium min-w-[42px] ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{tab.label}</span>
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
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Mẫu STEM Thiết kế sẵn</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Chọn mẫu để áp dụng ngay vào canvas</p>
            </div>

            <div className="space-y-2.5">
              {PRESET_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl)}
                  className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-emerald-500/50 cursor-pointer transition flex items-start gap-3"
                >
                  <div className="text-2xl p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 group-hover:scale-105 transition shrink-0">
                    {tmpl.thumbnail}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                      {tmpl.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
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
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Bố Cục Chia Khung Hình</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Tạo khung sẵn kiểu Canva để ghép ảnh và chỉnh sửa nhanh chóng
              </p>
            </div>

            <div className="space-y-2.5">
              {DESIGN_LAYOUTS.map((layout) => (
                <div
                  key={layout.id}
                  onClick={() => onApplyLayout(layout)}
                  className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-emerald-500/50 cursor-pointer transition flex items-start gap-3"
                >
                  <div className="text-2xl p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 group-hover:scale-105 transition shrink-0">
                    {layout.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                      {layout.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {layout.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Chèn Văn Bản</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Bấm vào khối chữ để chèn vào giữa màn hình</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onAddText('title')}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-emerald-500/40 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Tiêu đề lớn (Heading 1)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Font 48px • Đậm</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onAddText('subtitle')}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-emerald-500/40 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Tiêu đề phụ (Heading 2)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Font 28px • Trung bình</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onAddText('body')}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-emerald-500/40 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-normal text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Đoạn nội dung (Body text)</div>
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

        {/* TAB 4: SHAPES */}
        {activeTab === 'shapes' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Hình Khối & Vector</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Thêm hình học làm khung. <strong>Nhấp đúp vào hình</strong> để gõ chữ trực tiếp vào giữa!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAddShape('rect')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-emerald-500/40 flex flex-col items-center gap-2 group transition"
              >
                <div className="w-10 h-8 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                  <Square className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Hình chữ nhật</span>
              </button>

              <button
                onClick={() => onAddShape('circle')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-sky-500/40 flex flex-col items-center gap-2 group transition"
              >
                <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500 flex items-center justify-center">
                  <Circle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Hình tròn</span>
              </button>

              <button
                onClick={() => onAddShape('triangle')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-amber-500/40 flex flex-col items-center gap-2 group transition"
              >
                <div className="w-10 h-8 flex items-center justify-center">
                  <Triangle className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Hình tam giác</span>
              </button>

              <button
                onClick={() => onAddShape('line')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-400 flex flex-col items-center gap-2 group transition"
              >
                <div className="w-10 h-8 flex items-center justify-center">
                  <Minus className="w-6 h-6 text-slate-500" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Đường kẻ ngang</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: HUY HIỆU & LUCIDE STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Huy Hiệu & Sticker SVG</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Bấm vào biểu tượng hoặc huy hiệu để chèn vector chuẩn nét vào canvas
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => setStickerFilter('all')}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                  stickerFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStickerFilter('badge')}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                  stickerFilter === 'badge'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Huy hiệu STEM
              </button>
              <button
                onClick={() => setStickerFilter('lucide')}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                  stickerFilter === 'lucide'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Lucide Icons
              </button>
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-3 gap-2">
              {filteredStickers.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAddSvgSticker(item.svg)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-850 flex flex-col items-center justify-center gap-1.5 transition group"
                  title={item.name}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition shrink-0"
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                  />
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white truncate max-w-full">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: IMAGES / UPLOAD */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Tải Ảnh Lên</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Kéo thả, dán (Ctrl+V) hoặc chọn từ máy</p>
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
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/60'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Bấm để chọn file hoặc kéo thả</p>
                <p className="text-[10px] text-slate-500 mt-1">Hỗ trợ PNG, JPG, WebP, SVG (Có thể dán Ctrl+V)</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AI STUDIO */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Công cụ Trí Tuệ Nhân Tạo (AI)
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Xử lý ảnh bằng model IS-Net chạy cục bộ trong trình duyệt</p>
            </div>

            {/* Tách nền AI từ ảnh mới */}
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
                <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 text-xs">Tải ảnh lên & Tự động tách nền AI</h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
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

            {/* Mẹo sử dụng */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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
