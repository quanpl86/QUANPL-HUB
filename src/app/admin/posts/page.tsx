import React from 'react';
import { getSupabaseServer } from '@/lib/supabase-server';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit2, ExternalLink } from 'lucide-react';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { deletePost } from '@/app/actions/posts';
import { SeoAdvisor } from '@/components/admin/SeoAdvisor';

export default async function AdminPostsPage() {
  const supabase = await getSupabaseServer();
  const { data: posts } = await supabase
    .from('posts')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="admin-eyebrow">Thư viện nội dung</span>
          <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">Quản lý <span className="cyber-text-gradient">bài viết</span></h1>
          <p className="text-muted text-sm">Theo dõi trạng thái xuất bản, chất lượng SEO và chỉnh sửa nội dung.</p>
        </div>
        <Link href="/admin/posts/new">
          <CyberButton variant="primary" className="flex items-center gap-3">
            <Plus size={18} />
            Tạo bài viết mới
          </CyberButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {posts?.map((post) => (
          <div key={post.id} className="group relative bg-cyber-black/5 dark:bg-cyber-black/40 border border-brand-orange/20 dark:border-brand-orange/10 p-5 hover:border-brand-orange/40 transition-all flex flex-col md:flex-row justify-between items-center gap-6 cyber-cut-sm">
            <div className="flex gap-6 items-center flex-1">
              {post.image_url ? (
                <div className="relative w-24 h-16 shrink-0">
                  <Image 
                    src={post.image_url} 
                    alt={post.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover border border-brand-orange/20" 
                  />
                </div>
              ) : (
                <div className="w-24 h-16 bg-brand-orange/5 border border-dashed border-brand-orange/20 flex items-center justify-center">
                  <span className="font-mono text-[8px] text-brand-orange/40">TRỐNG</span>
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <h3 className="font-orbitron font-bold text-foreground text-lg group-hover:text-brand-orange transition-colors">{post.title}</h3>
                  <span className={`tech-mono text-[10px] px-3 py-1 border cyber-cut-sm font-black ${post.is_published ? 'border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5' : 'border-brand-orange/30 text-brand-orange bg-brand-orange/5'}`}>
                    {post.is_published ? 'CÔNG KHAI' : 'BẢN NHÁP'}
                  </span>
                  <SeoAdvisor post={post} />
                </div>
                <div className="flex items-center gap-5">
                  <span className="tech-mono text-xs text-brand-orange font-black uppercase">[{post.categories?.name || 'Chưa phân loại'}]</span>
                  <span className="tech-mono text-xs text-muted font-bold uppercase">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href={`/posts/${post.slug}`} target="_blank" className="text-muted hover:text-blue-400 transition-colors">
                <ExternalLink size={18} />
              </Link>
              <Link href={`/admin/posts/edit/${post.id}`} className="text-muted hover:text-brand-orange transition-colors">
                <Edit2 size={18} />
              </Link>
              <DeleteButton id={post.id} onDelete={deletePost} label="bài viết" />
            </div>
          </div>
        ))}

        {posts?.length === 0 && (
          <div className="text-center py-32 border border-dashed border-brand-orange/20">
            <p className="font-mono text-muted text-xs">Chưa có bài viết nào.</p>
            <Link href="/admin/posts/new" className="mt-4 inline-block text-brand-orange font-orbitron text-[10px] uppercase hover:underline">
              Bắt đầu bài đăng đầu tiên của bạn
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
