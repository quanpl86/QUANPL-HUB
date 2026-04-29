'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout, Check, Edit3, Loader2 } from 'lucide-react';

export function OutlineEditor({ 
  initialOutline, 
  onConfirm, 
  onCancel,
  isGenerating
}: { 
  initialOutline: string, 
  onConfirm: (outline: string) => void,
  onCancel: () => void,
  isGenerating: boolean
}) {
  const [outline, setOutline] = useState(initialOutline);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[var(--card-bg)] border-2 border-brand-orange w-full max-w-3xl shadow-[0_0_50px_rgba(249,115,22,0.2)]">
        <div className="bg-brand-orange p-4 flex justify-between items-center">
          <h3 className="text-white font-black font-orbitron uppercase tracking-widest flex items-center gap-3 text-sm">
            <Layout size={18} />
            PHÊ DUYỆT DÀN Ý NỘI DUNG
          </h3>
          <span className="text-[10px] text-white/80 font-mono uppercase font-bold tracking-tighter">
            KING DRAGON OS // STEP 2: REFINEMENT
          </span>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-[var(--muted)]">
            <Edit3 size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Biên tập dàn ý của bạn bên dưới:</p>
          </div>

          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            className="w-full h-80 bg-[var(--background)] border-2 border-[var(--card-border)] p-5 font-mono text-xs text-[var(--foreground)] focus:border-brand-orange outline-none resize-none transition-all custom-scrollbar"
            placeholder="Dàn ý đang được tải..."
          />

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 border-2 border-[var(--card-border)] text-[var(--muted)] font-black uppercase text-[10px] font-mono hover:bg-[var(--card-border)] transition-all"
            >
              HỦY BỎ
            </button>
            <button
              onClick={() => onConfirm(outline)}
              disabled={isGenerating}
              className="px-8 py-2 bg-brand-orange text-white border-2 border-brand-orange font-black uppercase text-[10px] font-mono shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none flex items-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
              XÁC NHẬN & TẠO BÀI VIẾT
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
