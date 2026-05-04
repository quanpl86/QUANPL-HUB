'use client';

import React, { useState } from 'react';
import { Brain, CheckCircle2, AlertTriangle, XCircle, Info, Lightbulb, Zap, Search } from 'lucide-react';
import { CyberCard } from '../ui/CyberCard';

interface Post {
  id: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  image_url: string | null;
  keywords: string[] | null;
}

export const SeoAdvisor = ({ post }: { post: Post }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Phân tích chi tiết bằng Tiếng Việt
  const analysis = [
    {
      label: 'Tiêu đề Meta',
      value: post.meta_title || 'Chưa có',
      status: !post.meta_title ? 'error' : (post.meta_title.length >= 50 && post.meta_title.length <= 70) ? 'success' : 'warning',
      message: !post.meta_title ? 'Thiếu Tiêu đề Meta. Đây là yếu tố sống còn để xuất hiện trên kết quả tìm kiếm.' : 
               (post.meta_title.length < 50) ? `Tiêu đề quá ngắn (${post.meta_title.length} ký tự). Mục tiêu nên từ 50-70 ký tự.` : 
               (post.meta_title.length > 70) ? `Tiêu đề quá dài (${post.meta_title.length} ký tự). Google sẽ cắt bớt phần thừa.` : 
               'Độ dài hoàn hảo để hiển thị tốt nhất trên công cụ tìm kiếm.',
      suggestion: 'Sử dụng từ khóa chính ngay ở đầu tiêu đề và giữ độ dài trong khoảng 50-70 ký tự.'
    },
    {
      label: 'Mô tả Meta',
      value: post.meta_description || 'Chưa có',
      status: !post.meta_description ? 'error' : (post.meta_description.length >= 120 && post.meta_description.length <= 160) ? 'success' : 'warning',
      message: !post.meta_description ? 'Thiếu Mô tả Meta. Công cụ tìm kiếm sẽ tự chọn nội dung ngẫu nhiên để hiển thị.' : 
               (post.meta_description.length < 120) ? `Mô tả quá ngắn (${post.meta_description.length} ký tự). Nên từ 120-160 ký tự.` : 
               (post.meta_description.length > 160) ? `Mô tả quá dài (${post.meta_description.length} ký tự). Sẽ bị cắt bớt khi hiển thị.` : 
               'Độ dài tối ưu giúp tăng tỷ lệ người dùng bấm vào bài viết (CTR).',
      suggestion: 'Tóm tắt nội dung hấp dẫn, chứa từ khóa chính và lời kêu gọi hành động.'
    },
    {
      label: 'Đoạn trích (Excerpt)',
      value: post.excerpt ? 'Đã có' : 'Chưa có',
      status: !post.excerpt ? 'error' : (post.excerpt.length >= 50) ? 'success' : 'warning',
      message: !post.excerpt ? 'Thiếu đoạn trích. Rất quan trọng để hiển thị bản xem trước và cho AI tóm tắt.' : 
               (post.excerpt.length < 50) ? 'Đoạn trích quá ngắn. AI có thể gặp khó khăn khi hiểu nội dung chính.' : 
               'Độ dài đoạn trích tốt cho việc lập chỉ mục hệ thống.',
      suggestion: 'Viết một đoạn dẫn nhập thu hút từ 50-100 ký tự để làm nổi bật nội dung.'
    },
    {
      label: 'Tài nguyên hình ảnh',
      value: post.image_url ? 'Đã thiết lập' : 'Chưa có',
      status: post.image_url ? 'success' : 'error',
      message: post.image_url ? 'Đã phát hiện hình ảnh đại diện chất lượng.' : 'Thiếu ảnh đại diện. Bài viết có hình ảnh tăng 80% khả năng được click.',
      suggestion: 'Luôn thêm ảnh đại diện sắc nét, liên quan đến nội dung bài viết.'
    }
  ];

  const score = Math.round((analysis.filter(a => a.status === 'success').length / analysis.length) * 100);

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

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-cyber-black/90 backdrop-blur-md">
          <div className="w-full max-w-4xl relative">
            <CyberCard className="p-8 border-brand-orange shadow-[0_0_50px_rgba(249,115,22,0.2)]">
              <div className="flex justify-between items-start mb-8 border-b border-brand-orange/20 pb-6">
                <div>
                  <h2 className="font-orbitron font-bold text-2xl text-foreground uppercase tracking-wider flex items-center gap-3">
                    <Brain className="text-brand-orange" />
                    AI_SEO_ADVISOR <span className="text-brand-orange/50 text-sm">// ĐANG PHÂN TÍCH: {post.title}</span>
                  </h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-muted hover:text-brand-orange transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-cyber-black/40 border border-brand-orange/10 cyber-cut-sm h-fit">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-brand-orange/10" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * score) / 100}
                          className={`${score >= 80 ? 'text-green-500' : 'text-brand-orange'} transition-all duration-1000 ease-out`}
                        />
                     </svg>
                     <span className="absolute font-orbitron font-bold text-3xl">{score}%</span>
                  </div>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-center">CHỈ SỐ ĐỒNG NHẤT</h3>
                  <p className="mt-4 font-mono text-[11px] text-muted text-center italic leading-relaxed">
                    "Các công cụ tìm kiếm AI (Perplexity, ChatGPT) dựa vào siêu dữ liệu có cấu trúc để tóm tắt nội dung bài viết của bạn."
                  </p>
                </div>

                <div className="lg:col-span-2 space-y-6 max-h-[550px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-brand-orange/20">
                   {/* Google Preview */}
                   <div className="p-6 bg-white rounded-lg shadow-sm mb-8 border border-slate-200">
                      <div className="flex items-center gap-2 mb-3 border-b pb-2">
                        <Search size={14} className="text-slate-400" />
                        <span className="text-[10px] font-sans font-medium text-slate-500 uppercase tracking-wider">Xem trước trên Google</span>
                      </div>
                      <div className="font-sans text-slate-900">
                        <div className="text-[#1a0dab] text-xl hover:underline cursor-pointer mb-1 truncate max-w-full">
                          {post.meta_title || post.title}
                        </div>
                        <div className="text-[#006621] text-sm mb-1 flex items-center gap-1">
                          kingdragonhub.com <span className="text-[10px]">▼</span>
                        </div>
                        <div className="text-[#545454] text-sm leading-snug line-clamp-2">
                          <span className="text-slate-400">{new Date().toLocaleDateString()} — </span>
                          {post.meta_description || post.excerpt || 'Vui lòng cung cấp mô tả meta để xem trước cách bài viết của bạn hiển thị trên kết quả tìm kiếm...'}
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                     {analysis.map((item, idx) => (
                      <div key={idx} className={`p-4 border border-l-4 ${
                        item.status === 'success' ? 'border-green-500/20 border-l-green-500 bg-green-500/5' :
                        item.status === 'warning' ? 'border-brand-orange/20 border-l-brand-orange bg-brand-orange/5' :
                        'border-red-500/20 border-l-red-500 bg-red-500/5'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-orbitron font-bold text-[11px] uppercase tracking-wider">{item.label}</span>
                           {item.status === 'success' ? <CheckCircle2 size={14} className="text-green-500" /> :
                            item.status === 'warning' ? <AlertTriangle size={14} className="text-brand-orange" /> :
                            <XCircle size={14} className="text-red-500" />}
                        </div>
                        <p className="font-mono text-xs text-foreground mb-3 leading-relaxed">{item.message}</p>
                        
                        <div className="bg-cyber-black/40 p-3 flex gap-3 items-start">
                           <Lightbulb size={14} className="text-brand-orange mt-0.5 flex-shrink-0" />
                           <p className="font-mono text-[11px] text-muted-foreground uppercase leading-normal tracking-wider">
                              <span className="text-brand-orange font-black">GỢI Ý:</span> {item.suggestion}
                           </p>
                        </div>
                      </div>
                     ))}
                   </div>

                   <div className="p-5 bg-blue-500/5 dark:bg-blue-500/10 border-2 border-blue-500/40 border-dashed cyber-cut-sm mt-6">
                      <div className="flex items-center gap-3 mb-4">
                         <Zap size={18} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                         <span className="font-orbitron font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-[0.2em]">GIAO THỨC TỐI ƯU HÓA AI</span>
                      </div>
                      <ul className="space-y-3">
                        {[
                          'Sử dụng các từ khóa liên quan về mặt ngữ nghĩa trong 10% đầu tiên của nội dung.',
                          'Đảm bảo các thẻ tiêu đề (H1, H2, H3) tạo thành một hệ thống phân cấp logic.',
                          'Trích dẫn các nguồn uy tín để tăng độ tin cậy đối với các mô hình ngôn ngữ lớn (LLMs).',
                          'Cung cấp dữ liệu cụ thể và các con số để AI dễ dàng trích xuất thông tin.',
                        ].map((tip, i) => (
                          <li key={i} className="font-mono text-[11px] text-blue-900 dark:text-blue-300/80 uppercase flex gap-3 items-start">
                            <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{'>'}</span> 
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                   </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 font-orbitron text-[10px] text-muted-foreground hover:text-brand-orange uppercase transition-colors"
                >
                  ĐÓNG PHÂN TÍCH
                </button>
                <button 
                  onClick={() => window.location.href = `/admin/posts/edit/${post.id}`}
                  className="px-8 py-2 bg-brand-orange text-cyber-black font-orbitron font-bold text-[10px] uppercase cyber-cut-sm hover:glow-orange transition-all"
                >
                  Cập nhật ngay
                </button>
              </div>
            </CyberCard>
          </div>
        </div>
      )}
    </>
  );
};
