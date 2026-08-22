'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Brain, CheckCircle2, AlertTriangle, XCircle, Info, Lightbulb, Zap, Search } from 'lucide-react';
import { CyberCard } from '../ui/CyberCard';

import { analyzeSystemSeo } from '@/lib/content/seo-advisor';

interface Post {
  id: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  image_url: string | null;
  keywords: string[] | null;
  content?: string | null;
  seo_keywords?: { image_alt?: string; primary?: string } | null;
}

export const SeoAdvisor = ({ post }: { post: Post }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const report = analyzeSystemSeo({
    title: post.title,
    meta_title: post.meta_title,
    meta_description: post.meta_description,
    excerpt: post.excerpt,
    image_url: post.image_url,
    image_alt: post.seo_keywords?.image_alt,
    content: post.content,
    primary_keyword: post.seo_keywords?.primary || post.keywords?.[0] || null,
  });
  const analysis = report.checks;
  const score = report.score;

  const modalContent = (
    <div className="admin-modal fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="admin-modal__dialog w-full max-w-5xl my-auto relative animate-in fade-in zoom-in duration-200">
        <CyberCard className="p-6 md:p-10 border-brand-orange shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white dark:bg-cyber-black">
          <div className="flex justify-between items-start mb-8 border-b-2 border-brand-orange/20 pb-6">
            <div>
              <h2 className="font-orbitron font-bold text-xl md:text-2xl text-foreground uppercase tracking-wider flex items-center gap-3">
                <Brain className="text-brand-orange" size={28} />
                Trợ lý SEO <span className="text-brand-orange font-black text-sm hidden md:inline ml-2">Phân tích: {post.title}</span>
              </h2>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-muted hover:text-brand-orange transition-all p-2 hover:bg-brand-orange/10 cyber-cut-sm"
            >
              <XCircle size={28} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-brand-orange/[0.03] dark:bg-cyber-black/40 border-2 border-brand-orange/20 cyber-cut-sm h-fit">
              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-brand-orange/20" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={439.8} strokeDashoffset={439.8 - (439.8 * score) / 100}
                      className={`${score >= 80 ? 'text-green-500' : 'text-brand-orange'} transition-all duration-1000 ease-out`}
                      strokeLinecap="round"
                    />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                    <span className="font-orbitron font-black text-4xl">{score}%</span>
                    <span className="tech-mono text-[10px] text-brand-orange font-bold uppercase">Điểm SEO</span>
                 </div>
              </div>
              <h3 className="font-orbitron font-bold text-xs text-center border-t border-brand-orange/20 pt-4 w-full">Mức độ hoàn thiện</h3>
              <p className="mt-4 tech-mono text-[11px] text-muted text-center font-bold italic leading-relaxed">
                "AI (Perplexity, ChatGPT) dựa vào siêu dữ liệu có cấu trúc để trích xuất nội dung."
              </p>
            </div>

            <div className="lg:col-span-2 space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
               <div className="p-6 bg-slate-50 dark:bg-cyber-black/20 rounded-lg border-2 border-slate-200 dark:border-brand-orange/10">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-brand-orange/10 pb-2">
                    <Search size={16} className="text-brand-orange" />
                    <span className="text-[11px] font-orbitron font-bold text-muted uppercase tracking-wider">Xem trước trên Google Search</span>
                  </div>
                  <div className="font-sans">
                    <div className="text-[#1a0dab] dark:text-blue-400 text-xl hover:underline cursor-pointer mb-1 truncate font-medium">
                      {post.meta_title || post.title}
                    </div>
                    <div className="text-[#006621] dark:text-green-400 text-sm mb-1 flex items-center gap-1">
                      kingdragonhub.com <span className="text-[10px]">▼</span>
                    </div>
                    <div className="text-[#4d5156] dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                      <span className="font-bold">{new Date().toLocaleDateString()} — </span>
                      {post.meta_description || post.excerpt || 'Vui lòng cung cấp mô tả meta để xem trước cách bài viết của bạn hiển thị trên kết quả tìm kiếm...'}
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4">
                 {analysis.map((item, idx) => (
                  <div key={idx} className={`p-5 border-2 border-l-8 ${
                    item.status === 'success' ? 'border-green-500/20 border-l-green-500 bg-green-500/[0.03]' :
                    item.status === 'warning' ? 'border-brand-orange/20 border-l-brand-orange bg-brand-orange/[0.03]' :
                    'border-red-500/20 border-l-red-500 bg-red-500/[0.03]'
                  } cyber-cut-sm`}>
                    <div className="flex justify-between items-center mb-3">
                       <span className="font-orbitron font-bold text-xs uppercase tracking-wider">{item.label}</span>
                       {item.status === 'success' ? <CheckCircle2 size={18} className="text-green-500" /> :
                        item.status === 'warning' ? <AlertTriangle size={18} className="text-brand-orange" /> :
                        <XCircle size={18} className="text-red-500" />}
                    </div>
                    <p className="tech-mono text-[13px] text-foreground mb-4 leading-relaxed font-bold">{item.message}</p>
                    
                    <div className="bg-white dark:bg-cyber-black/40 p-4 flex gap-4 items-start border-2 border-brand-orange/10">
                       <Lightbulb size={18} className="text-brand-orange shrink-0" />
                       <p className="tech-mono text-[11px] text-foreground uppercase leading-relaxed font-black">
                          <span className="text-brand-orange">GỢI Ý:</span> {item.suggestion}
                       </p>
                    </div>
                  </div>
                 ))}
               </div>

               <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-500/30 border-dashed cyber-cut-sm">
                  <div className="flex items-center gap-3 mb-5">
                     <Zap size={20} className="text-blue-600 dark:text-blue-400" />
                     <span className="font-orbitron font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-widest">GIAO THỨC TỐI ƯU HÓA AI</span>
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Sử dụng các từ khóa liên quan về mặt ngữ nghĩa trong 10% đầu tiên của nội dung.',
                      'Đảm bảo các thẻ tiêu đề (H1, H2, H3) tạo thành một hệ thống phân cấp logic.',
                      'Trích dẫn các nguồn uy tín để tăng độ tin cậy đối với các LLMs.',
                      'Cung cấp dữ liệu cụ thể và các con số để AI dễ dàng trích xuất thông tin.',
                    ].map((tip, i) => (
                      <li key={i} className="tech-mono text-[12px] text-blue-900 dark:text-blue-300 font-black uppercase flex gap-4 items-start">
                        <span className="text-blue-600 dark:text-blue-400 shrink-0">{'>'}</span> 
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row justify-end gap-4 border-t-2 border-brand-orange/10 pt-8">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-8 py-3 tech-mono text-xs text-muted hover:text-brand-orange uppercase transition-all font-bold"
            >
              [ ĐÓNG PHÂN TÍCH ]
            </button>
            <button 
              onClick={() => window.location.href = `/admin/posts/edit/${post.id}`}
              className="px-10 py-3 bg-brand-orange text-white font-orbitron font-black text-xs uppercase cyber-cut-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all"
            >
              Cập nhật ngay
            </button>
          </div>
        </CyberCard>
      </div>
    </div>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] border transition-all ${
          score >= 80 ? 'border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/20' : 
          score >= 50 ? 'border-brand-orange/30 text-brand-orange bg-brand-orange/5 hover:bg-brand-orange/20' : 
          'border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/20'
        }`}
      >
        <Brain size={12} className={score >= 80 ? 'animate-pulse' : ''} />
        SEO_{score}%
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
