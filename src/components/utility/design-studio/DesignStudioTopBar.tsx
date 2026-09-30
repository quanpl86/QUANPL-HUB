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
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
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

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur px-4 flex items-center justify-between gap-3 select-none z-30 shrink-0 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Left: Back & Project Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/utility-hub"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition text-xs font-medium"
          title="Quay lại Utility Hub"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hub</span>
        </Link>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />

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
              className="bg-slate-100 dark:bg-slate-900 border border-emerald-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none w-48"
            />
            <button
              onClick={handleNameSubmit}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-emerald-600 dark:text-emerald-400"
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
            className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900 text-left transition-colors"
            title="Bấm để đổi tên dự án"
          >
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 max-w-[180px] sm:max-w-xs truncate">
              {projectName}
            </span>
            <Edit2 className="w-3 h-3 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Canvas Size Selector & Custom Size */}
        <div className="relative">
          <button
            onClick={() => {
              setCustomW(canvasWidth);
              setCustomH(canvasHeight);
              setShowPresetsMenu(!showPresetsMenu);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 transition"
          >
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {activePresetName || `${canvasWidth}×${canvasHeight}`}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPresetsMenu && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2.5 z-50 text-slate-800 dark:text-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 py-1">
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
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <button
                    onClick={handleSwapDimensions}
                    className="p-1.5 mt-3 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-500 transition"
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono"
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
      </div>

      {/* Center: Undo / Redo & Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={onZoomOut}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomReset}
          className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          title="Tỉ lệ 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
          title="Phóng to"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomFit}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
          title="Vừa màn hình"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Save Project & Export */}
      <div className="flex items-center gap-2">
        {/* Hidden File Input for Open Project */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.hubdesign"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium transition"
          title="Mở file thiết kế .hubdesign đã lưu"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span className="hidden md:inline">Mở dự án</span>
        </button>

        <button
          onClick={onSaveProject}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium transition"
          title="Lưu toàn bộ layer và vector thành file .hubdesign"
        >
          <Save className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
            <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-slate-800 dark:text-slate-200">
              <button
                onClick={() => {
                  onExportImage('png');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Ảnh PNG (Chuẩn nét)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">.PNG</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('jpeg');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Ảnh JPEG (Nhẹ)</span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">.JPG</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('webp');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Ảnh WebP (Web tối ưu)</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">.WEBP</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('svg');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Vector SVG</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">.SVG</span>
              </button>
              <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1" />
              <button
                onClick={() => {
                  onExportImage('pdf');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center justify-between"
              >
                <span>Tài liệu PDF</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">.PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
