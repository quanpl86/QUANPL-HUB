'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ChevronRight } from 'lucide-react';

export function TopicPromptModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (topic: string) => void 
}) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onConfirm(topic);
      setTopic('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[var(--card-bg)] border-4 border-slate-900 dark:border-white w-full max-w-lg shadow-[12px_12px_0px_var(--foreground)] relative overflow-hidden"
          >
            {/* Cyber Header */}
            <div className="bg-brand-orange p-4 border-b-4 border-slate-900 dark:border-white flex justify-between items-center">
              <h3 className="text-white font-black font-orbitron uppercase tracking-widest flex items-center gap-3 text-sm">
                <Zap size={18} fill="currentColor" />
                KHỞI_TẠO_PIPELINE
              </h3>
              <button onClick={onClose} className="text-white hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <p className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-widest mb-6 leading-relaxed">
                Nhập chủ đề hoặc từ khóa mục tiêu. King Dragon OS sẽ tiến hành nghiên cứu đa tầng và lập dàn ý chiến lược cho bạn.
              </p>

              <div className="relative group">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-brand-orange opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <ChevronRight size={24} />
                </div>
                <input
                  autoFocus
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VÍ DỤ: TƯƠNG LAI CỦA ROBOTICS 2026..."
                  className="w-full bg-transparent border-b-4 border-slate-900 dark:border-white/20 focus:border-brand-orange py-4 px-2 font-orbitron font-black text-xl outline-none transition-all placeholder:text-slate-500 uppercase"
                />
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-slate-900 dark:border-white font-black uppercase text-[10px] font-mono hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={!topic.trim()}
                  className="flex-[2] py-3 bg-brand-orange text-white border-4 border-slate-900 dark:border-white font-black uppercase text-[10px] font-mono shadow-[4px_4px_0px_var(--foreground)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
                >
                  KÍCH HOẠT HỆ THỐNG
                </button>
              </div>
            </form>

            {/* Decorative Grid */}
            <div className="absolute bottom-0 right-0 w-20 h-20 opacity-5 pointer-events-none">
              <div className="grid grid-cols-4 grid-rows-4 w-full h-full">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="border border-current"></div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
