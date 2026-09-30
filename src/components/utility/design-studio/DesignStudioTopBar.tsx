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

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 flex items-center justify-between gap-3 select-none z-30 shrink-0">
      {/* Left: Back & Project Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/utility-hub"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-900 border border-slate-800/80 transition-all text-xs font-medium"
          title="Quay lại Utility Hub"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hub</span>
        </Link>

        <div className="h-5 w-[1px] bg-slate-800" />

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
              className="bg-slate-900 border border-emerald-500/50 rounded px-2 py-0.5 text-xs text-slate-100 font-semibold focus:outline-none w-48"
            />
            <button
              onClick={handleNameSubmit}
              className="p-1 hover:bg-slate-800 rounded text-emerald-400"
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
            className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-900 text-left transition-colors"
            title="Bấm để đổi tên dự án"
          >
            <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 max-w-[180px] sm:max-w-xs truncate">
              {projectName}
            </span>
            <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Canvas Size Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPresetsMenu(!showPresetsMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <span className="text-emerald-400 font-medium">{activePresetName || `${canvasWidth}×${canvasHeight}`}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPresetsMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Kích thước Canvas
              </div>
              <div className="space-y-1 mt-1">
                {CANVAS_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      onResizeCanvas(preset.width, preset.height, preset.name);
                      setShowPresetsMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      canvasWidth === preset.width && canvasHeight === preset.height
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-[10px] text-slate-500">{preset.width} × {preset.height} px ({preset.aspectRatio})</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Undo / Redo & Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 rounded-lg p-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          onClick={onZoomOut}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomReset}
          className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 hover:bg-slate-800 transition"
          title="Tỉ lệ 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="Phóng to"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomFit}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-900 border border-slate-800 text-xs font-medium transition"
          title="Mở file thiết kế .hubdesign đã lưu"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Mở dự án</span>
        </button>

        <button
          onClick={onSaveProject}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-900 border border-slate-800 text-xs font-medium transition"
          title="Lưu toàn bộ layer và vector thành file .hubdesign"
        >
          <Save className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Lưu JSON</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50">
              <button
                onClick={() => {
                  onExportImage('png');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Ảnh PNG (Chuẩn nét)</span>
                <span className="text-[10px] text-emerald-400 font-mono">.PNG</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('jpeg');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Ảnh JPEG (Nhẹ)</span>
                <span className="text-[10px] text-sky-400 font-mono">.JPG</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('webp');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Ảnh WebP (Web tối ưu)</span>
                <span className="text-[10px] text-purple-400 font-mono">.WEBP</span>
              </button>
              <button
                onClick={() => {
                  onExportImage('svg');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition flex items-center justify-between"
              >
                <span>Vector SVG</span>
                <span className="text-[10px] text-amber-400 font-mono">.SVG</span>
              </button>
              <div className="h-[1px] bg-slate-800 my-1" />
              <button
                onClick={() => {
                  onExportImage('pdf');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-rose-400 transition flex items-center justify-between"
              >
                <span>Tài liệu PDF</span>
                <span className="text-[10px] text-rose-400 font-mono">.PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
