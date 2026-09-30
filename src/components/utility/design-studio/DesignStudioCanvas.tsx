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
      className="flex-1 bg-slate-900/60 overflow-auto flex items-center justify-center p-8 relative select-none"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Canvas Wrap with shadow and smooth zoom transform */}
      <div
        className="transition-transform duration-75 ease-out shadow-2xl shadow-black/80 rounded-sm relative"
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
      <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-3 text-[11px] font-mono text-slate-400 pointer-events-none z-10">
        <span className="text-emerald-400 font-semibold">{canvasWidth} × {canvasHeight} px</span>
        <span className="text-slate-600">|</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">Dán Ctrl+V để chèn ảnh</span>
      </div>
    </main>
  );
};
