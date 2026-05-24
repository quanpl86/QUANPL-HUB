'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Monitor, Smartphone, Layout } from 'lucide-react';
import Image from 'next/image';
import { sanitize } from '@/lib/sanitize';
import { renderMathInHtml } from '@/lib/math-renderer';

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
  const blogPreviewTheme = {
    '--background': '#f8fafc',
    '--foreground': '#0f172a',
    '--card-bg': '#ffffff',
    '--card-border': 'rgba(15, 23, 42, 0.1)',
    '--muted': '#334155',
    '--grid-color': 'rgba(249, 115, 22, 0.15)',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  } as React.CSSProperties;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 md:p-10"
        >
          {/* Header Controls */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-brand-orange">
                <Eye size={20} />
                <span className="font-orbitron font-bold text-sm tracking-widest uppercase">Blog_Detail_Preview</span>
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
            className={`border border-brand-orange/25 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 flex flex-col h-full ${
              viewMode === 'desktop' ? 'w-full max-w-6xl' : 'w-full max-w-[420px]'
            }`}
            style={blogPreviewTheme}
          >
            {/* Simulation Header */}
            <div className="border-b border-brand-orange/20 px-6 py-3 flex items-center gap-3" style={blogPreviewTheme}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
              </div>
              <div className="flex-grow text-center">
                <span className="font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: 'rgba(15, 23, 42, 0.6)' }}>Blog_detail_layout // preview</span>
              </div>
            </div>

            {/* Actual Content (Scrollable) */}
            <div className="flex-grow overflow-y-auto" style={blogPreviewTheme}>
              <article className="min-h-full pb-20 selection:bg-brand-orange selection:text-white" style={blogPreviewTheme}>
                {/* Editorial Header */}
                <div className="container mx-auto px-6 pt-16 pb-10">
                  <div className="max-w-[1200px] mx-auto">
                    <div className="tech-mono text-[0.7rem] tracking-[0.1em] mb-6 uppercase font-bold" style={{ color: '#0f172a' }}>
                      PREVIEW_MODE
                    </div>

                    <h1 className="font-[family-name:var(--font-inter)] font-medium text-[2.7rem] md:text-[4.25rem] lg:text-[4.8rem] leading-[1.05] tracking-[-0.03em] mb-12 w-full" style={{ color: '#0f172a' }}>
                      {data.title || 'TIÊU_ĐỀ_BẢN_NHÁP'}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-brand-orange/40 flex items-center justify-center bg-brand-orange/10 overflow-hidden">
                          <span className="font-orbitron text-brand-orange font-bold text-xs">Q</span>
                        </div>
                        <div className="flex items-center gap-2 font-[family-name:var(--font-inter)] text-sm">
                          <span className="font-semibold" style={{ color: '#0f172a' }}>KING DRAGON Admin</span>
                          <span className="hidden md:inline" style={{ color: 'rgba(15, 23, 42, 0.7)' }}>Authorised System Architect</span>
                        </div>
                      </div>

                      <span className="px-3 py-1 text-[0.65rem] tech-mono font-bold uppercase tracking-wider border rounded-full" style={{ borderColor: 'rgba(15, 23, 42, 0.3)', color: 'rgba(15, 23, 42, 0.8)' }}>
                        {data.category_name || 'REDACTED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cover Image as a Poster */}
                <div className="container mx-auto px-6 mb-16 md:mb-20">
                  <div className="relative aspect-video w-full max-w-[1200px] mx-auto overflow-hidden border border-brand-orange/20" style={{ backgroundColor: '#f8fafc' }}>
                  {data.image_url ? (
                    <>
                      <div className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30">
                        <Image
                          src={data.image_url}
                          alt=""
                          fill
                          sizes="100vw"
                          className="object-cover blur-[80px] scale-125"
                        />
                      </div>
                      <Image
                        src={data.image_url}
                        alt={data.title || 'Preview Image'}
                        fill
                        sizes="(max-width: 1200px) 100vw, 1200px"
                        className="object-contain z-10"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <Layout size={120} className="text-brand-orange" />
                    </div>
                  )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="container mx-auto px-6 mt-8 md:mt-16">
                  <div className="max-w-4xl mx-auto">
                    {data.excerpt && (
                      <div className="mb-12 relative group">
                        <div className="absolute -left-12 top-0 bottom-0 w-2 bg-brand-orange/60 shadow-[0_0_20px_rgba(255,87,34,0.2)] transform -skew-x-12 transition-all group-hover:w-3"></div>
                        <p className="body-lg !text-xl md:!text-2xl lg:!text-3xl font-light pl-6 tracking-wide italic" style={{ color: 'rgba(15, 23, 42, 0.8)' }}>
                          {data.excerpt}
                        </p>
                      </div>
                    )}

                    <section 
                      className="king-dragon-content prose prose-brand max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitize(renderMathInHtml(data.content || '<p class="text-muted italic opacity-50 uppercase tracking-widest text-sm">// ĐANG_CHỜ_TRUYỀN_TẢI_NỘI_DUNG //</p>')) }}
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
