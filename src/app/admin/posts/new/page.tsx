'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { createPost } from '@/app/actions/posts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, Loader2 } from 'lucide-react';
import { PreviewModal } from '@/components/admin/PreviewModal';
import { CoverImageUpload } from '@/components/admin/CoverImageUpload';
import dynamic from 'next/dynamic';

const CyberEditor = dynamic(() => import('@/components/admin/editor/CyberEditor').then(mod => mod.CyberEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-cyber-black/20 animate-pulse border border-brand-orange/10 flex items-center justify-center font-mono text-xs text-brand-orange">ĐANG_TẢI_TRÌNH_SOẠN_THẢO...</div>
});

export default function NewPostPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  // Load categories for selection
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    };
    fetchCats();
  }, []);

  const getPreviewData = () => {
    if (!formRef.current) return null;
    const formData = new FormData(formRef.current);
    const catId = formData.get('category_id');
    const category = categories.find(c => c.id.toString() === catId);
    
    return {
      title: formData.get('title') as string,
      excerpt: formData.get('excerpt') as string,
      content: content,
      image_url: formData.get('image_url') as string,
      category_name: category?.name
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createPost(formData, content);
      if (result.success) {
        toast.success('KHỞI_TẠO_THÀNH_CÔNG: Bài viết đã được đưa vào ma trận tri thức');
        router.push('/admin/posts');
      } else {
        toast.error(`LỖI_HỆ_THỐNG: ${result.error}`);
      }
    } catch (error) {
      toast.error('THẤT_BẠI_NGHIÊM_TRỌNG: Không thể truyền tải dữ liệu');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="cyber-h1 text-3xl mb-2">KHỞI TẠO <span className="cyber-text-gradient">BÀI VIẾT</span></h1>
          <p className="font-mono text-muted text-xs uppercase tracking-widest">// GIAO_DIỆN_SÁNG_TẠO_NỘI_DUNG //</p>
        </div>

        <div className="flex gap-4">
          <CyberButton 
            type="button" 
            variant="outline" 
            className="flex items-center gap-2 border-brand-orange/20 text-brand-orange hover:bg-brand-orange/5"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye size={16} />
            XEM TRƯỚC
          </CyberButton>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Editor Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Tiêu đề bài viết</label>
            <input 
              name="title"
              required
              placeholder="NHẬP_TIÊU_ĐỀ_TẠI_ĐÂY..."
              className="w-full bg-transparent border-b border-brand-orange/20 py-4 text-4xl font-orbitron font-bold text-foreground outline-none focus:border-brand-orange transition-colors placeholder:text-brand-orange/20"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Dẫn nhập (Excerpt)</label>
            <textarea 
              name="excerpt"
              rows={2}
              className="w-full bg-cyber-black/40 border border-brand-orange/10 p-4 font-mono text-sm outline-none focus:border-brand-orange/40 transition-colors text-foreground"
              placeholder="Cung cấp một đoạn tóm tắt ngắn cho bài viết..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Nội dung chi tiết</label>
            <CyberEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar Settings Column */}
        <div className="space-y-6">
          <StaticCyberCard className="p-6 space-y-6">
            <h2 className="font-orbitron font-bold text-xs uppercase border-b border-brand-orange/10 pb-2 mb-4">Cấu hình Metadata</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-muted uppercase">Danh mục</label>
                <select name="category_id" className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-xs outline-none focus:border-brand-orange text-foreground">
                  <option value="">-- CHƯA LIÊN KẾT --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-muted uppercase">Tags (Cách nhau bằng dấu phẩy)</label>
                <input 
                  name="tags" 
                  placeholder="AI, Robotics, Figma..."
                  className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-xs outline-none focus:border-brand-orange text-foreground" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <CoverImageUpload />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-muted uppercase">Alt text (Mô tả ảnh bìa)</label>
                <input 
                  name="image_alt" 
                  placeholder="Mô tả ngắn gọn nội dung bức ảnh..."
                  className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] outline-none focus:border-brand-orange text-foreground" 
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" name="is_published" id="is_published" defaultChecked className="accent-brand-orange w-4 h-4" />
                <label htmlFor="is_published" className="font-mono text-[10px] text-brand-orange uppercase cursor-pointer">Công khai bài viết</label>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" name="comments_enabled" id="comments_enabled" defaultChecked className="accent-brand-orange w-4 h-4" />
                <label htmlFor="comments_enabled" className="font-mono text-[10px] text-brand-orange uppercase cursor-pointer">Cho phép bình luận</label>
              </div>
            </div>
          </StaticCyberCard>

          <StaticCyberCard className="p-6">
            <h2 className="font-orbitron font-bold text-xs uppercase border-b border-brand-orange/10 pb-2 mb-4 text-blue-400">SEO Matrix</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-muted uppercase">Meta Title</label>
                <input name="meta_title" className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-muted uppercase">Meta Description</label>
                <textarea name="meta_description" rows={3} className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-muted uppercase">Từ khóa (Keywords)</label>
                <input name="keywords" className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" placeholder="Cách nhau bởi dấu phẩy..." />
              </div>
            </div>
          </StaticCyberCard>

          <CyberButton variant="primary" className="w-full h-14" disabled={isPending}>
            {isPending ? 'ĐANG_TRUYỀN_TẢI...' : 'XÁC NHẬN ĐĂNG BÀI'}
          </CyberButton>
        </div>
      </form>

      {isPreviewOpen && (
        <PreviewModal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          data={getPreviewData()!} 
        />
      )}
    </div>
  );
}
