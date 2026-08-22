import React from 'react';
import { supabase } from '@/lib/supabase';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminUi';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// Action đơn giản để xóa bình luận (Inline Server Action)
async function deleteCommentAction(id: string) {
  'use server';
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/comments');
}

export default async function CommentsAdminPage() {
  const { data: comments } = await supabase
    .from('comments')
    .select('*, posts(title, slug)')
    .order('created_at', { ascending: false });

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Tương tác cộng đồng" title="Quản lý" accent="bình luận" description="Đọc, kiểm tra và xử lý phản hồi của người đọc." />

      <div className="grid grid-cols-1 gap-6">
        {comments && comments.length > 0 ? (
          comments.map((comment: {
            id: string;
            user_name: string;
            user_email?: string | null;
            parent_id?: string | null;
            content: string;
            created_at: string;
            status: string;
            posts: { title: string; slug: string };
          }) => (
            <article key={comment.id} className="admin-panel">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-orbitron font-bold text-brand-orange">
                      {comment.user_name?.charAt(0) || 'G'}
                    </div>
                    <div>
                      <h3 className="font-orbitron font-bold text-foreground text-base tracking-wide">{comment.user_name}</h3>
                      <p className="tech-mono text-[11px] text-muted">{comment.user_email || 'Không có email'}</p>
                    </div>
                    {comment.parent_id && (
                      <span className="tech-mono text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/20 px-3 py-1 uppercase font-bold cyber-cut-sm">
                        PHẢN HỒI
                      </span>
                    )}
                    <div className="ml-auto md:ml-6">
                      <div className="bg-brand-orange/[0.05] dark:bg-cyber-gray/30 border border-brand-orange/20 dark:border-brand-orange/10 p-3 md:p-4 tech-mono text-[11px] uppercase text-brand-orange dark:text-brand-orange/60 cyber-cut-sm font-bold">
                        <a 
                          href={`/posts/${comment.posts.slug}#comment-${comment.id}`} 
                          target="_blank" 
                          className="hover:text-brand-orange transition-colors flex items-center gap-2"
                        >
                          Bài viết: <span className="text-foreground truncate max-w-[200px]">{comment.posts?.title}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-cyber-black/40 border border-white/5 p-4 rounded-sm">
                    <p className="font-mono text-sm text-foreground/80 leading-relaxed italic">
                      &ldquo;{comment.content}&rdquo;
                    </p>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap items-center gap-6 pt-4 border-t border-black/5 dark:border-white/5">
                    <span className="tech-mono text-[11px] text-muted uppercase font-bold">
                      Gửi lúc {new Date(comment.created_at).toLocaleString('vi-VN')}
                    </span>
                    <span className="w-1.5 h-1.5 bg-brand-orange/40 rounded-full animate-pulse"></span>
                    <span className={`tech-mono text-[11px] font-black uppercase ${comment.status === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {comment.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end">
                  <DeleteButton id={comment.id} onDelete={deleteCommentAction} label="bình luận" />
                </div>
              </div>
            </article>
          ))
        ) : (
          <AdminEmptyState title="Chưa có bình luận" description="Các phản hồi mới của người đọc sẽ xuất hiện tại đây để bạn kiểm tra và xử lý." />
        )}
      </div>
    </div>
  );
}
