'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Monitor, Smartphone, Layout } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    content: string;
    excerpt: string;
    image_url?: string;
    category_name?: string;
  };
}

export const PreviewModal = ({ isOpen, onClose, data }: PreviewModalProps) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-10"
        >
          {/* Header Controls */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-brand-orange">
                <Eye size={20} />
                <span className="font-orbitron font-bold text-sm tracking-widest uppercase">Matrix_Preview</span>
              </div>
              
              {/* View Mode Toggles */}
              <div className="hidden md:flex items-center bg-cyber-black/80 border border-brand-orange/20 p-1 cyber-cut-sm">
                <button 
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 transition-all ${viewMode === 'desktop' ? 'bg-brand-orange text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'text-muted hover:text-white'}`}
                >
                  <Monitor size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 transition-all ${viewMode === 'mobile' ? 'bg-brand-orange text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'text-muted hover:text-white'}`}
                >
                  <Smartphone size={16} />
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-brand-orange hover:border-brand-orange transition-all cyber-cut-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Preview Container */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`bg-cyber-gray border border-brand-orange/20 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 flex flex-col h-full ${
              viewMode === 'desktop' ? 'w-full max-w-6xl' : 'w-full max-w-[420px]'
            }`}
          >
            {/* Simulation Header */}
            <div className="bg-cyber-black border-b border-brand-orange/10 px-6 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
              </div>
              <div className="flex-grow text-center">
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.4em]">Trình_chiếu_mô_phỏng // v1.0</span>
              </div>
            </div>

            {/* Actual Content (Scrollable) */}
            <div className="flex-grow overflow-y-auto bg-cyber-gray">
              <article className="pb-20">
                {/* Hero Header */}
                <div className="relative h-[50vh] min-h-[300px] w-full overflow-hidden border-b border-brand-orange/10 bg-[#0a0a0a]">
                  {data.image_url ? (
                    <img src={data.image_url} alt="" className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <Layout size={120} className="text-brand-orange" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  <div className="absolute inset-0 flex items-end">
                    <div className="container mx-auto px-6 pb-12">
                      <div className="max-w-4xl">
                        <div className="mb-4">
                          <span className="px-4 py-1 bg-brand-orange text-cyber-black font-orbitron text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(255,87,34,0.3)]">
                            {data.category_name || 'CHƯA_PHÂN_LOẠI'}
                          </span>
                        </div>
                        <h1 className="font-orbitron font-bold text-3xl md:text-5xl text-white mb-6 leading-tight uppercase tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                          {data.title || 'TIÊU_ĐỀ_BẢN_NHÁP'}
                        </h1>
                        <div className="flex items-center gap-3 text-white/60 font-mono text-[10px] uppercase tracking-widest">
                          <div className="w-8 h-8 rounded-full bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange font-bold font-orbitron">Q</div>
                          <span>ĐƯỢC DUYỆT BỞI: QUẢN TRỊ VIÊN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="container mx-auto px-6 mt-12">
                  <div className="max-w-4xl mx-auto">
                    {data.excerpt && (
                      <div className="mb-12 relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-brand-orange/40"></div>
                        <p className="text-xl font-mono text-brand-orange/90 leading-relaxed italic pl-4">
                          "{data.excerpt}"
                        </p>
                      </div>
                    )}

                    <section 
                      className="prose dark:prose-invert prose-brand max-w-none 
                        prose-headings:font-orbitron prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-white
                        prose-p:font-sans prose-p:text-lg prose-p:leading-[1.8] prose-p:text-slate-300
                        prose-strong:text-brand-orange prose-a:text-brand-orange
                        prose-blockquote:border-brand-orange prose-blockquote:bg-brand-orange/5"
                      dangerouslySetInnerHTML={{ __html: data.content || '<p class="text-muted italic opacity-50 uppercase tracking-widest text-sm">// ĐANG_CHỜ_TRUYỀN_TẢI_NỘI_DUNG //</p>' }}
                    />
                  </div>
                </div>
              </article>
            </div>
          </motion.div>

          {/* Decorative Corner Lines */}
          <div className="fixed top-20 left-20 w-10 h-10 border-t-2 border-l-2 border-brand-orange/30 pointer-events-none"></div>
          <div className="fixed bottom-20 right-20 w-10 h-10 border-b-2 border-r-2 border-brand-orange/30 pointer-events-none"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
