'use client';

import React, { useRef } from 'react';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onDropImage: (file: File) => void;
}

export const DesignStudioCanvas: React.FC<CanvasProps> = ({
  canvasRef,
  canvasWidth,
  canvasHeight,
  zoom,
  onDropImage,
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

  return (
    <main
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 bg-slate-100 dark:bg-slate-900/60 overflow-auto flex items-center justify-center p-8 relative select-none transition-colors"
      style={{
        backgroundImage: `radial-gradient(rgba(100, 116, 139, 0.2) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Canvas Wrap with shadow and smooth zoom transform */}
      <div
        className="transition-transform duration-75 ease-out shadow-2xl shadow-black/20 dark:shadow-black/80 rounded-sm relative"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Floating Info Badge */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-950/80 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-400 pointer-events-none z-10 shadow-sm">
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{canvasWidth} × {canvasHeight} px</span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-slate-500">Dán Ctrl+V để chèn ảnh • Nhấp đúp hình để gõ chữ</span>
      </div>
    </main>
  );
};
