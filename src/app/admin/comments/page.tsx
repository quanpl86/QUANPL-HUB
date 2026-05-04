import React from 'react';
import { supabase } from '@/lib/supabase';
import { CyberCard } from '@/components/ui/CyberCard';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { revalidatePath } from 'next/cache';

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
    <div className="max-w-5xl">
      <div className="mb-12">
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">QUẢN LÝ <span className="cyber-text-gradient">BÌNH LUẬN</span></h1>
        <p className="tech-mono text-brand-orange/60 text-[11px] uppercase tracking-[0.3em] font-bold animate-pulse">// TRUNG_TÂM_KIỂM_DUYỆT_NỘI_DUNG //</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <CyberCard key={comment.id} className="p-6 border-brand-orange/10 bg-cyber-black/20 hover:border-brand-orange/30 transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-orbitron font-bold text-brand-orange">
                      {comment.user_name?.charAt(0) || 'G'}
                    </div>
                    <div>
                      <h3 className="font-orbitron font-bold text-foreground text-base tracking-wide">{comment.user_name}</h3>
                      <p className="tech-mono text-[11px] text-muted uppercase tracking-[0.1em]">{comment.user_email || 'ẨN DANH'}</p>
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
                          BÀI VIẾT: <span className="text-foreground truncate max-w-[200px]">{comment.posts?.title}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-cyber-black/40 border border-white/5 p-4 rounded-sm">
                    <p className="font-mono text-sm text-foreground/80 leading-relaxed italic">
                      "{comment.content}"
                    </p>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap items-center gap-6 pt-4 border-t border-black/5 dark:border-white/5">
                    <span className="tech-mono text-[11px] text-muted uppercase font-bold">
                      NGÀY GỬI: {new Date(comment.created_at).toLocaleString('vi-VN')}
                    </span>
                    <span className="w-1.5 h-1.5 bg-brand-orange/40 rounded-full animate-pulse"></span>
                    <span className={`tech-mono text-[11px] font-black uppercase ${comment.status === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      TRẠNG THÁI: {comment.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end">
                  <DeleteButton id={comment.id} onDelete={deleteCommentAction} label="bình luận" />
                </div>
              </div>
            </CyberCard>
          ))
        ) : (
          <div className="text-center py-20 border border-dashed border-brand-orange/20 font-mono text-xs text-muted uppercase">
            // CHƯA_CÓ_BÌNH_LUẬN_NÀO_ĐƯỢC_GHI_NHẬN //
          </div>
        )}
      </div>
    </div>
  );
}
