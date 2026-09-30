'use client';

import React, { useRef } from 'react';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onDropImage: (file: File) => void;
  isDark: boolean;
}

export const DesignStudioCanvas: React.FC<CanvasProps> = ({
  canvasRef,
  canvasWidth,
  canvasHeight,
  zoom,
  onDropImage,
  isDark,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onDropImage(file);
    }
  };

  const scaledW = Math.round(canvasWidth * zoom);
  const scaledH = Math.round(canvasHeight * zoom);

  return (
    <main
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex-1 overflow-auto flex p-8 relative select-none transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-200/80 text-slate-900'
      }`}
      style={{
        backgroundImage: isDark
          ? 'radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)'
          : 'radial-gradient(rgba(100, 116, 139, 0.3) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Centered Canvas Container (margin: auto guarantees safe-centering without negative overflow clipping) */}
      <div className="m-auto flex items-center justify-center p-4 shrink-0">
        <div
          className={`relative rounded-sm transition-all duration-75 ${
            isDark
              ? 'shadow-2xl shadow-black/80 ring-1 ring-slate-800'
              : 'shadow-2xl shadow-slate-500/30 ring-1 ring-slate-300'
          }`}
          style={{
            width: scaledW,
            height: scaledH,
          }}
        >
          <div
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* Floating Info Badge */}
      <div
        className={`absolute bottom-4 left-4 backdrop-blur border rounded-lg px-3 py-1.5 flex items-center gap-3 text-[11px] font-mono pointer-events-none z-10 shadow-sm ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
            : 'bg-white/95 border-slate-200 text-slate-700 shadow-md'
        }`}
      >
        <span className="text-emerald-500 font-semibold">{canvasWidth} × {canvasHeight} px</span>
        <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>|</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>|</span>
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dán Ctrl+V để chèn ảnh • Nhấp đúp hình để gõ chữ</span>
      </div>
    </main>
  );
};
