'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { CyberEditor } from '@/components/admin/editor/CyberEditor';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { updatePost } from '@/app/actions/posts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, Eye, Maximize } from 'lucide-react';
import Link from 'next/link';
import { PreviewModal } from '@/components/admin/PreviewModal';

// --- Smart Auto-resize Textarea Component ---
const AutoResizeTextarea = ({ defaultValue, name, placeholder, className, rows = 1 }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
    // Re-adjust on window resize
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [defaultValue]);

  return (
    <textarea
      ref={textareaRef}
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      rows={rows}
      onInput={adjustHeight}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
};

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const formRef = useRef<HTMLFormElement>(null);
  const [post, setPost] = useState<any>(null);
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  // Load post data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, catsRes] = await Promise.all([
          supabase.from('posts').select('*').eq('id', id).single(),
          supabase.from('categories').select('id, name').order('name')
        ]);

        if (postRes.error) throw postRes.error;
        
        setPost(postRes.data);
        setContent(postRes.data.content || '');
        setCategories(catsRes.data || []);
      } catch (error: any) {
        toast.error(`LỖI_TẢI_DỮ_LIỆU: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
    formData.append('slug', post.slug);
    
    try {
      const result = await updatePost(id, formData, content);
      if (result.success) {
        toast.success('ĐÃ_CẬP_NHẬT: Dữ liệu đã được đồng bộ vào ma trận');
        router.push('/admin/posts');
        router.refresh();
      } else {
        toast.error(`LỖI_CẬP_NHẬT: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`LỖI_CRITICAL: ${error.message}`);
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
        <p className="font-mono text-xs text-brand-orange uppercase tracking-[0.3em]">Đang truy xuất dữ liệu từ Core...</p>
      </div>
    );
  }

  if (!post) return <div className="text-center py-20 uppercase font-mono tracking-widest text-red-500">// LỖI: KHÔNG_TÌM_THẤY_BÀI_VIẾT //</div>;

  return (
    <div className={`transition-all duration-500 ${isZenMode ? 'fixed inset-0 z-[100] bg-cyber-black overflow-y-auto p-12' : 'max-w-[1400px] mx-auto'}`}>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <Link href="/admin/posts" className="flex items-center gap-2 text-muted hover:text-brand-orange transition-colors mb-4 font-mono text-[10px] uppercase">
            <ArrowLeft size={14} /> Quay lại danh sách
          </Link>
          <h1 className="cyber-h1 text-3xl mb-2">CHỈNH SỬA <span className="cyber-text-gradient">BÀI VIẾT</span></h1>
          <p className="font-mono text-muted text-xs uppercase tracking-widest">// ID: {id} | {post.slug} //</p>
        </div>

        <div className="flex gap-4">
          <CyberButton 
            type="button" 
            variant="outline" 
            className="flex items-center gap-2 border-brand-orange/20 text-brand-orange hover:bg-brand-orange/5"
            onClick={() => setIsZenMode(!isZenMode)}
          >
            <Maximize size={16} />
            {isZenMode ? 'THOÁT TẬP TRUNG' : 'CHẾ ĐỘ TẬP TRUNG'}
          </CyberButton>
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
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Tiêu đề bài viết</label>
            <AutoResizeTextarea 
              name="title"
              defaultValue={post.title}
              rows={2}
              placeholder="NHẬP_TIÊU_ĐỀ_TẠI_ĐÂY..."
              className="w-full bg-transparent border-b border-brand-orange/20 py-4 text-4xl font-orbitron font-bold text-foreground outline-none focus:border-brand-orange transition-colors placeholder:text-brand-orange/20"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Dẫn nhập (Excerpt)</label>
            <AutoResizeTextarea 
              name="excerpt"
              rows={2}
              defaultValue={post.excerpt}
              className="w-full bg-cyber-black/40 border border-brand-orange/10 p-4 font-mono text-sm outline-none focus:border-brand-orange/40 transition-colors text-foreground"
              placeholder="Cung cấp một đoạn tóm tắt ngắn..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-brand-orange uppercase">Nội dung chi tiết</label>
            <CyberEditor content={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <StaticCyberCard className="p-6 space-y-6">
            <h2 className="font-orbitron font-bold text-xs uppercase border-b border-brand-orange/10 pb-2 mb-4">Cấu hình Metadata</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-muted uppercase">Danh mục</label>
                <select 
                  name="category_id" 
                  defaultValue={post.category_id || ''}
                  className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-xs outline-none focus:border-brand-orange text-foreground"
                >
                  <option value="">-- CHƯA LIÊN KẾT --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-muted uppercase">URL Ảnh đại diện</label>
                <input 
                  name="image_url" 
                  defaultValue={post.image_url}
                  className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] outline-none focus:border-brand-orange text-foreground" 
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  name="is_published" 
                  id="is_published" 
                  defaultChecked={post.is_published}
                  className="accent-brand-orange w-4 h-4" 
                />
                <label htmlFor="is_published" className="font-mono text-[10px] text-brand-orange uppercase cursor-pointer">Công khai bài viết</label>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  name="comments_enabled" 
                  id="comments_enabled" 
                  defaultChecked={post.comments_enabled !== false} // Default to true if undefined
                  className="accent-brand-orange w-4 h-4" 
                />
                <label htmlFor="comments_enabled" className="font-mono text-[10px] text-brand-orange uppercase cursor-pointer">Cho phép bình luận</label>
              </div>
            </div>
          </StaticCyberCard>

          <StaticCyberCard className="p-6">
            <h2 className="font-orbitron font-bold text-xs uppercase border-b border-brand-orange/10 pb-2 mb-4 text-blue-400">SEO Matrix</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-muted uppercase">Meta Title</label>
                <AutoResizeTextarea 
                  name="meta_title" 
                  defaultValue={post.meta_title}
                  className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-muted uppercase">Meta Description</label>
                <AutoResizeTextarea 
                  name="meta_description" 
                  rows={3} 
                  defaultValue={post.meta_description}
                  className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-muted uppercase">Từ khóa (Keywords)</label>
                <AutoResizeTextarea 
                  name="keywords" 
                  defaultValue={post.keywords}
                  className="w-full bg-cyber-gray border border-brand-orange/20 p-2 font-mono text-[10px] text-foreground" 
                  placeholder="Cách nhau bởi dấu phẩy..."
                />
              </div>
            </div>
          </StaticCyberCard>

          <CyberButton variant="primary" className="w-full h-14" disabled={isPending}>
            {isPending ? 'ĐANG_CẬP_NHẬT...' : 'XÁC NHẬN THAY ĐỔI'}
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
