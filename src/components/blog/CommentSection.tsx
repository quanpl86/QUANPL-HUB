'use client';

import React, { useTransition, useState } from 'react';
import { MessageSquare, Send, User, Mail, Reply, Heart } from 'lucide-react';
import { submitComment, toggleCommentReaction } from '@/app/actions/interactions';
import { toast } from 'sonner';
import { CyberButton } from '@/components/ui/CyberButton';

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  comment_reactions?: { id: string, ip_address: string }[];
}

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  currentUserIp: string;
}

export function CommentSection({ postId, initialComments, currentUserIp }: CommentSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await submitComment(formData);
        toast.success('Bình luận đã được gửi!');
        setReplyingTo(null);
        (document.getElementById('comment-form') as HTMLFormElement)?.reset();
        (document.getElementById(`reply-form-${replyingTo}`) as HTMLFormElement)?.reset();
      } catch (error) {
        toast.error('LỖI_HỆ_THỐNG: Không thể gửi bình luận');
      }
    });
  };

  const handleReaction = async (commentId: string) => {
    startTransition(async () => {
      try {
        await toggleCommentReaction(commentId);
      } catch (error) {
        toast.error('LỖI: Không thể thực hiện tương tác');
      }
    });
  };

  // Hàm xây dựng cây bình luận
  const buildCommentTree = (comments: Comment[], parentId: string | null = null): any[] => {
    return comments
      .filter(c => c.parent_id === parentId)
      .map(c => ({
        ...c,
        replies: buildCommentTree(comments, c.id)
      }));
  };

  const commentTree = buildCommentTree(initialComments);

  const CommentItem = ({ comment, isReply = false }: { comment: any, isReply?: boolean }) => {
    const reactions = comment.comment_reactions || [];
    const hasReacted = reactions.some((r: any) => r.ip_address === currentUserIp);
    const reactionCount = reactions.length;

    return (
      <div id={`comment-${comment.id}`} className={`relative ${isReply ? 'ml-4 md:ml-12 mt-4' : 'mt-8'} scroll-mt-32`}>
        {/* Visual connector for replies */}
        {isReply && (
          <div className="absolute -left-3 md:-left-6 top-0 bottom-0 w-[1px] bg-brand-orange/20"></div>
        )}
        
        <div className="bg-white/[0.02] border border-brand-orange/5 p-6 md:p-8 transition-all hover:bg-brand-orange/[0.01] hover:border-brand-orange/20 overflow-hidden rounded-sm backdrop-blur-sm group/item">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20 flex-shrink-0">
                <User className="w-5 h-5 text-brand-orange" />
              </div>
              <div className="min-w-0">
                <h4 className="font-orbitron font-bold text-sm text-foreground tracking-wider">{comment.user_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                    {new Date(comment.created_at).toLocaleString('vi-VN')}
                  </span>
                  {isReply && (
                    <span className="font-mono text-[8px] bg-brand-orange/10 text-brand-orange/70 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Phản hồi</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleReaction(comment.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all duration-300 ${
                  hasReacted 
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' 
                    : 'border-white/5 bg-white/5 text-muted-foreground hover:border-brand-orange/40 hover:text-foreground'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasReacted ? 'fill-current' : ''}`} />
                <span className="font-mono text-[11px] font-bold">{reactionCount}</span>
              </button>

              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all duration-300 ${
                  replyingTo === comment.id
                    ? 'border-brand-orange bg-brand-orange/20 text-brand-orange'
                    : 'border-white/5 bg-white/5 text-muted-foreground hover:border-brand-orange/40 hover:text-foreground'
                }`}
              >
                <Reply className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest">REP</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <p className="font-sans text-foreground/80 leading-relaxed text-base pl-6 border-l-2 border-brand-orange/10 ml-5 py-1">
              {comment.content}
            </p>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-8 ml-5 pl-6 border-l-2 border-brand-orange/30 animate-in fade-in slide-in-from-left-4 duration-500">
              <form id={`reply-form-${comment.id}`} action={handleSubmit} className="space-y-6 bg-cyber-black/20 p-6 border border-white/5 rounded-sm">
                <input type="hidden" name="post_id" value={postId} />
                <input type="hidden" name="parent_id" value={comment.id} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-brand-orange transition-colors" />
                    <input 
                      name="user_name" 
                      placeholder="Danh tính..."
                      className="w-full bg-cyber-black/40 border border-brand-orange/10 p-2.5 pl-9 font-mono text-xs outline-none focus:border-brand-orange transition-all text-foreground"
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-brand-orange transition-colors" />
                    <input 
                      name="user_email" 
                      type="email"
                      placeholder="Email (không bắt buộc)..."
                      className="w-full bg-cyber-black/40 border border-brand-orange/10 p-2.5 pl-9 font-mono text-xs outline-none focus:border-brand-orange transition-all text-foreground"
                    />
                  </div>
                </div>

                <textarea 
                  name="content"
                  required
                  rows={3}
                  autoFocus
                  placeholder={`Phản hồi gửi tới ${comment.user_name}...`}
                  className="w-full bg-cyber-black/40 border border-brand-orange/10 p-4 font-mono text-xs outline-none focus:border-brand-orange transition-all resize-none text-foreground"
                />

                <div className="flex justify-end gap-3 items-center">
                  <button 
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="font-mono text-[10px] uppercase text-muted hover:text-red-400 transition-colors tracking-widest"
                  >
                    HỦY BỎ
                  </button>
                  <CyberButton variant="primary" className="px-8 py-2.5 h-auto text-[10px]" disabled={isPending}>
                    GỬI PHẢN HỒI
                  </CyberButton>
                </div>
              </form>
            </div>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map((reply: any) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-24 pt-16 border-t border-brand-orange/10">
      <div className="flex items-center gap-4 mb-12">
        <MessageSquare className="text-brand-orange w-8 h-8" />
        <h2 className="font-orbitron font-bold text-3xl uppercase tracking-[0.2em] text-foreground">
          Ma trận <span className="text-brand-orange">Thảo luận</span>
        </h2>
      </div>

      <div className="max-w-4xl mx-auto space-y-16">
        {/* Form chính - Đưa lên trên và mở rộng */}
        <div className="bg-cyber-black/40 border border-brand-orange/10 p-8 md:p-10 backdrop-blur-md rounded-sm relative overflow-hidden group">
          {/* Decorative accents */}
          <div className="absolute top-0 left-0 w-2 h-2 bg-brand-orange"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-brand-orange"></div>
          
          <h3 className="font-orbitron font-bold text-sm mb-10 uppercase tracking-[0.3em] text-brand-orange/90 flex items-center gap-4">
            <span className="w-12 h-[1px] bg-brand-orange/30"></span>
            Khởi tạo luồng mới
          </h3>

          <form id="comment-form" action={handleSubmit} className="space-y-8">
            <input type="hidden" name="post_id" value={postId} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-colors group-focus-within/input:text-brand-orange" />
                <input 
                  name="user_name"
                  placeholder="Định danh của bạn..."
                  className="w-full bg-cyber-black/60 border border-brand-orange/10 p-4 pl-12 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-colors group-focus-within/input:text-brand-orange" />
                <input 
                  name="user_email"
                  type="email"
                  placeholder="Email liên kết (không bắt buộc)..."
                  className="w-full bg-cyber-black/60 border border-brand-orange/10 p-4 pl-12 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>
            </div>

            <div className="relative">
              <textarea 
                name="content"
                required
                rows={5}
                placeholder="Truyền tải ý kiến của bạn vào ma trận..."
                className="w-full bg-cyber-black/60 border border-brand-orange/10 p-6 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground resize-y min-h-[150px]"
              />
              <div className="absolute bottom-4 right-4 font-mono text-[8px] text-brand-orange/30 uppercase tracking-widest pointer-events-none">
                input_stream_ready
              </div>
            </div>

            <div className="flex justify-end">
              <CyberButton variant="primary" className="px-12 py-5 group min-w-[250px]" disabled={isPending}>
                <Send className={`w-5 h-5 mr-3 transition-transform ${isPending ? 'animate-pulse' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} />
                {isPending ? 'ĐANG ĐƯA TIN...' : 'PHÁT HÀNH BÌNH LUẬN'}
              </CyberButton>
            </div>
          </form>
        </div>

        {/* Danh sách bình luận - Xếp bên dưới */}
        <div className="space-y-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-brand-orange/10"></div>
            <span className="font-orbitron text-[10px] text-muted-foreground uppercase tracking-[0.5em]">Tất cả tương tác</span>
            <div className="h-[1px] flex-1 bg-brand-orange/10"></div>
          </div>

          {initialComments.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-brand-orange/10 opacity-40 font-mono text-xs uppercase tracking-[0.4em]">
              // CHƯA_CÓ_DỮ_LIỆU_TRUYỀN_TẢI //
            </div>
          ) : (
            <div className="space-y-4">
              {commentTree.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
