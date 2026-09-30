'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Edit2,
  Check,
  ArrowLeftRight,
  PanelLeft,
  PanelRight,
  Expand,
  Shrink,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CANVAS_PRESETS } from './templates/preset-templates';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
  canvasWidth: number;
  canvasHeight: number;
  onResizeCanvas: (width: number, height: number, presetName?: string) => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onExportImage: (format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf') => void;
  isExporting: boolean;
  activePresetName: string;
  isDark: boolean;
  canvasBgColor: string;
  onCanvasBgColorChange: (color: string, gradientStops?: [string, string]) => void;
  onOpenBackgroundTab?: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightInspectorOpen: boolean;
  onToggleRightInspector: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  autoSaveStatus?: 'saved' | 'saving';
  lastSavedTime?: string;
  onNewProject?: () => void;
}

export const DesignStudioTopBar: React.FC<TopBarProps> = ({
  projectName,
  onProjectNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomReset,
  canvasWidth,
  canvasHeight,
  onResizeCanvas,
  onSaveProject,
  onLoadProject,
  onExportImage,
  isExporting,
  activePresetName,
  isDark,
  canvasBgColor,
  onCanvasBgColorChange,
  onOpenBackgroundTab,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightInspectorOpen,
  onToggleRightInspector,
  isFocusMode,
  onToggleFocusMode,
  autoSaveStatus = 'saved',
  lastSavedTime,
  onNewProject,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom dimensions state
  const [customW, setCustomW] = useState<number>(canvasWidth);
  const [customH, setCustomH] = useState<number>(canvasHeight);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onProjectNameChange(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProject(file);
      e.target.value = '';
    }
  };

  const handleApplyCustomSize = () => {
    if (customW > 100 && customH > 100) {
      onResizeCanvas(customW, customH, `Tùy chỉnh: ${customW}×${customH}`);
      setShowPresetsMenu(false);
    }
  };

  const handleSwapDimensions = () => {
    const temp = customW;
    setCustomW(customH);
    setCustomH(temp);
  };

  const headerBg = isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const controlBox = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';
  const btnHover = isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700';
  const dropdownBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-2xl';

  return (
    <header className={`h-14 border-b px-4 flex items-center justify-between gap-3 select-none relative z-50 shrink-0 transition-colors ${headerBg}`}>
      {/* Left: Back & Project Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/utility-hub"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs font-medium ${
            isDark
              ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900 border-slate-800'
              : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100 border-slate-200'
          }`}
          title="Quay lại Utility Hub"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hub</span>
        </Link>

        {/* Toggle Left Sidebar */}
        <button
          onClick={onToggleLeftSidebar}
          className={`p-1.5 px-2 rounded-lg border transition text-xs flex items-center gap-1.5 font-medium ${
            isLeftSidebarOpen
              ? isDark
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
          }`}
          title={isLeftSidebarOpen ? 'Thu gọn thanh công cụ (Ẩn)' : 'Mở rộng thanh công cụ (Hiện)'}
        >
          <PanelLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">Công cụ</span>
        </button>

        <div className={`h-5 w-[1px] ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Project Name */}
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              autoFocus
              className={`border border-emerald-500 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none w-48 ${
                isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
              }`}
            />
            <button
              onClick={handleNameSubmit}
              className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-emerald-400' : 'hover:bg-slate-100 text-emerald-600'}`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTempName(projectName);
              setIsEditingName(true);
            }}
            className={`group flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors ${
              isDark ? 'hover:bg-slate-900' : 'hover:bg-slate-100'
            }`}
            title="Bấm để đổi tên dự án"
          >
            <span className={`text-xs font-semibold max-w-[180px] sm:max-w-xs truncate ${
              isDark ? 'text-slate-200 group-hover:text-emerald-400' : 'text-slate-800 group-hover:text-emerald-600'
            }`}>
              {projectName}
            </span>
            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Auto-Save Indicator */}
        <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono select-none transition-colors border-emerald-500/20 bg-emerald-500/5">
          {autoSaveStatus === 'saving' ? (
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              <span>Đang lưu...</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"
              title={lastSavedTime ? `Đã tự động lưu vào trình duyệt lúc ${lastSavedTime}` : 'Đã tự động lưu'}
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Tự động lưu</span>
              {lastSavedTime && <span className="opacity-60 text-[9px]">({lastSavedTime})</span>}
            </span>
          )}
        </div>

        {/* Canvas Size Selector & Custom Size */}
        <div className="relative">
          <button
            onClick={() => {
              setCustomW(canvasWidth);
              setCustomH(canvasHeight);
              setShowPresetsMenu(!showPresetsMenu);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className={isDark ? 'text-emerald-400 font-medium' : 'text-emerald-600 font-medium'}>
              {activePresetName || `${canvasWidth}×${canvasHeight}`}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showPresetsMenu && (
            <div className={`absolute top-full left-0 mt-1 w-72 border rounded-xl shadow-2xl p-2.5 z-50 ${dropdownBg}`}>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 py-1">
                Kích thước Chuẩn
              </div>
              <div className="space-y-1 mt-1 max-h-52 overflow-y-auto">
                {CANVAS_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      onResizeCanvas(preset.width, preset.height, preset.name);
                      setShowPresetsMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      canvasWidth === preset.width && canvasHeight === preset.height
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : isDark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {preset.width} × {preset.height} px ({preset.aspectRatio})
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Size Form */}
              <div className={`mt-3 pt-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Nhập kích thước tùy chỉnh
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-slate-500 block mb-0.5">Rộng (px)</label>
                    <input
                      type="number"
                      min="200"
                      max="8000"
                      value={customW}
                      onChange={(e) => setCustomW(parseInt(e.target.value) || 0)}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleSwapDimensions}
                    className={`p-1.5 mt-3 rounded transition ${
                      isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400' : 'hover:bg-slate-100 text-slate-500 hover:text-emerald-600'
                    }`}
                    title="Đảo chiều (W ⇄ H)"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1">
                    <label className="text-[9px] text-slate-500 block mb-0.5">Cao (px)</label>
                    <input
                      type="number"
                      min="200"
                      max="8000"
                      value={customH}
                      onChange={(e) => setCustomH(parseInt(e.target.value) || 0)}
                      className={`w-full border rounded px-2 py-1 text-xs font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <button
                  onClick={handleApplyCustomSize}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
                >
                  Áp dụng kích thước mới
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Canvas Background Color Button */}
        <div className="relative">
          <button
            onClick={() => setShowBgMenu(!showBgMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
            title="Đổi màu nền Canvas nhanh"
          >
            <div
              className="w-3.5 h-3.5 rounded border border-black/20 shadow-xs shrink-0"
              style={{
                backgroundColor: canvasBgColor === 'transparent' ? 'transparent' : canvasBgColor.startsWith('gradient:') ? undefined : canvasBgColor,
                backgroundImage: canvasBgColor === 'transparent'
                  ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)'
                  : canvasBgColor.startsWith('gradient:')
                  ? `linear-gradient(135deg, ${canvasBgColor.split(':')[1]}, ${canvasBgColor.split(':')[2]})`
                  : undefined,
                backgroundSize: canvasBgColor === 'transparent' ? '6px 6px' : undefined,
              }}
            />
            <span className="font-medium truncate max-w-[85px]">
              {canvasBgColor === 'transparent' ? 'Trong suốt' : canvasBgColor.startsWith('gradient:') ? 'Gradient' : canvasBgColor}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showBgMenu && (
            <div className={`absolute top-full left-0 mt-1 w-64 border rounded-xl shadow-2xl p-3 z-50 space-y-2.5 ${dropdownBg}`}>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Màu nền Canvas</span>
                <button
                  onClick={() => {
                    setShowBgMenu(false);
                    onOpenBackgroundTab?.();
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline normal-case text-[10px]"
                >
                  Tab Nền →
                </button>
              </div>

              {/* Quick transparent & basic buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    onCanvasBgColorChange('transparent');
                    setShowBgMenu(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-1 transition ${
                    canvasBgColor === 'transparent' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : isDark ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Nền trong suốt"
                >
                  <div
                    className="w-4 h-4 rounded border border-black/20"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #94a3b8 75%), linear-gradient(-45deg, transparent 75%, #94a3b8 75%)',
                      backgroundSize: '4px 4px',
                    }}
                  />
                  <span>Trong suốt</span>
                </button>

                <button
                  onClick={() => {
                    onCanvasBgColorChange('#ffffff');
                    setShowBgMenu(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-1 transition ${
                    canvasBgColor === '#ffffff' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : isDark ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Nền Trắng"
                >
                  <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                  <span>Trắng</span>
                </button>

                <button
                  onClick={() => {
                    onCanvasBgColorChange('#090d16');
                    setShowBgMenu(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-1 transition ${
                    canvasBgColor === '#090d16' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : isDark ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Nền Đen Cyber"
                >
                  <div className="w-4 h-4 rounded border border-slate-700 bg-[#090d16]" />
                  <span>Đen Cyber</span>
                </button>
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <input
                  type="color"
                  value={canvasBgColor.startsWith('#') ? canvasBgColor : '#0f172a'}
                  onChange={(e) => onCanvasBgColorChange(e.target.value)}
                  className={`w-7 h-7 rounded border cursor-pointer p-0.5 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'}`}
                />
                <input
                  type="text"
                  value={canvasBgColor}
                  onChange={(e) => onCanvasBgColorChange(e.target.value)}
                  placeholder="#hex..."
                  className={`flex-1 border rounded px-2 py-1 text-xs font-mono focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>

              {/* Quick Color Swatches */}
              <div className="grid grid-cols-6 gap-1 pt-1">
                {['#f8fafc', '#f1f5f9', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#1e293b'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onCanvasBgColorChange(c);
                      setShowBgMenu(false);
                    }}
                    style={{ backgroundColor: c }}
                    className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 hover:scale-110 transition shadow-2xs"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Undo / Redo & Zoom Controls */}
      <div className={`flex items-center gap-1 border rounded-lg p-1 ${controlBox}`}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded disabled:opacity-30 disabled:hover:bg-transparent transition ${btnHover}`}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded disabled:opacity-30 disabled:hover:bg-transparent transition ${btnHover}`}
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className={`h-4 w-[1px] mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

        <button
          onClick={onZoomOut}
          className={`p-1.5 rounded transition ${btnHover}`}
          title="Thu nhỏ"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomReset}
          className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${btnHover}`}
          title="Tỉ lệ 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          className={`p-1.5 rounded transition ${btnHover}`}
          title="Phóng to"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomFit}
          className={`p-1.5 rounded transition ${btnHover}`}
          title="Vừa màn hình"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Save Project & Export */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.hubdesign"
          className="hidden"
        />

        {onNewProject && (
          <button
            onClick={onNewProject}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isDark
                ? 'text-slate-300 hover:bg-slate-900 border-slate-800 hover:text-emerald-400'
                : 'text-slate-700 hover:bg-slate-100 border-slate-200 hover:text-emerald-600'
            }`}
            title="Tạo dự án mới từ trang trắng"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Tạo mới</span>
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
            isDark
              ? 'text-slate-300 hover:bg-slate-900 border-slate-800'
              : 'text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
          title="Mở file thiết kế .hubdesign đã lưu"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline">Mở dự án</span>
        </button>

        <button
          onClick={onSaveProject}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
            isDark
              ? 'text-slate-300 hover:bg-slate-900 border-slate-800'
              : 'text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
          title="Lưu toàn bộ layer và vector thành file .hubdesign"
        >
          <Save className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Lưu JSON</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div className={`absolute top-full right-0 mt-2 w-56 border rounded-xl shadow-2xl p-1.5 z-[100] ${dropdownBg}`}>
              <button
                onClick={() => {
                  onExportImage('png');
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                  isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-emerald-400' : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
                }`}
              >
                <span>Ảnh PNG (Chuẩn nét)</span>
                <span className="text-[10px] text-emerald-500 font-mono">.PNG</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('jpeg');
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                  isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-emerald-400' : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
                }`}
              >
                <span>Ảnh JPEG (Nhẹ)</span>
                <span className="text-[10px] text-sky-500 font-mono">.JPG</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('webp');
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                  isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-emerald-400' : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
                }`}
              >
                <span>Ảnh WebP (Web tối ưu)</span>
                <span className="text-[10px] text-purple-500 font-mono">.WEBP</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('svg');
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                  isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-emerald-400' : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
                }`}
              >
                <span>Vector SVG</span>
                <span className="text-[10px] text-amber-500 font-mono">.SVG</span>
              </button>
              <div className={`h-[1px] my-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <button
                onClick={() => {
                  onExportImage('pdf');
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                  isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-rose-400' : 'text-slate-700 hover:bg-slate-100 hover:text-rose-600'
                }`}
              >
                <span>Tài liệu PDF</span>
                <span className="text-[10px] text-rose-500 font-mono">.PDF</span>
              </button>
            </div>
          )}
        </div>

        <div className={`h-5 w-[1px] hidden sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Toggle Right Inspector */}
        <button
          onClick={onToggleRightInspector}
          className={`p-1.5 px-2 rounded-lg border transition text-xs flex items-center gap-1.5 font-medium ${
            isRightInspectorOpen
              ? isDark
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
          }`}
          title={isRightInspectorOpen ? 'Thu gọn bảng thuộc tính (Ẩn)' : 'Mở rộng bảng thuộc tính (Hiện)'}
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">Thuộc tính</span>
        </button>

        <div className={`h-5 w-[1px] hidden sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Toggle Focus Mode (Toàn màn hình) */}
        <button
          onClick={onToggleFocusMode}
          className={`p-1.5 px-2.5 rounded-lg border transition text-xs flex items-center gap-1.5 font-semibold ${
            isFocusMode
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 shadow-xs ring-2 ring-amber-500/20'
              : isDark
              ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900 border-slate-800'
              : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100 border-slate-200'
          }`}
          title={isFocusMode ? 'Thoát chế độ tập trung [Esc]' : 'Bật chế độ tập trung toàn màn hình [F]'}
        >
          {isFocusMode ? (
            <>
              <Shrink className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-[11px]">Thoát tập trung</span>
            </>
          ) : (
            <>
              <Expand className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline text-[11px]">Tập trung</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
