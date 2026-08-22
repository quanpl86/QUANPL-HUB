'use client';

import { useState, useTransition } from 'react';
import { Heart, Mail, MessageSquare, Reply, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { submitComment, toggleCommentReaction } from '@/app/actions/interactions';

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  comment_reactions?: { id: string; ip_address: string }[];
}

interface CommentNode extends Comment {
  replies: CommentNode[];
}

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  currentUserIp: string;
}

function buildCommentTree(comments: Comment[], parentId: string | null = null): CommentNode[] {
  return comments
    .filter((comment) => comment.parent_id === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id),
    }));
}

export function CommentSection({ postId, initialComments, currentUserIp }: CommentSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const commentTree = buildCommentTree(initialComments);

  const handleSubmit = async (formData: FormData) => {
    const activeReplyId = replyingTo;
    startTransition(async () => {
      try {
        await submitComment(formData);
        toast.success('Bình luận đã được gửi và đang chờ duyệt.');
        (document.getElementById('comment-form') as HTMLFormElement | null)?.reset();
        if (activeReplyId) {
          (document.getElementById(`reply-form-${activeReplyId}`) as HTMLFormElement | null)?.reset();
        }
        setReplyingTo(null);
      } catch {
        toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
      }
    });
  };

  const handleReaction = async (commentId: string) => {
    startTransition(async () => {
      try {
        await toggleCommentReaction(commentId);
      } catch {
        toast.error('Không thể cập nhật lượt thích. Vui lòng thử lại.');
      }
    });
  };

  const CommentItem = ({ comment, isReply = false }: { comment: CommentNode; isReply?: boolean }) => {
    const reactions = comment.comment_reactions || [];
    const hasReacted = reactions.some((reaction) => reaction.ip_address === currentUserIp);

    return (
      <article id={`comment-${comment.id}`} className={`scroll-mt-32 ${isReply ? 'ml-4 mt-4 border-l border-brand-orange/20 pl-4 md:ml-10 md:pl-7' : 'mt-6'}`}>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 transition hover:border-brand-orange/25 md:p-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand-orange/20 bg-brand-orange/[0.08] text-brand-orange">
                <User size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">{comment.user_name}</h3>
                <p className="mt-1 text-xs text-foreground/45">
                  {new Date(comment.created_at).toLocaleString('vi-VN')}{isReply ? ' · Phản hồi' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleReaction(comment.id)}
                aria-pressed={hasReacted}
                aria-label={`${hasReacted ? 'Bỏ thích' : 'Thích'} bình luận của ${comment.user_name}`}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${hasReacted ? 'border-brand-orange bg-brand-orange/[0.08] text-brand-orange' : 'border-foreground/12 text-foreground/55 hover:border-brand-orange/40 hover:text-brand-orange'}`}
              >
                <Heart size={15} className={hasReacted ? 'fill-current' : ''} aria-hidden="true" />
                {reactions.length}
              </button>
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                aria-expanded={replyingTo === comment.id}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-foreground/12 px-3 text-xs font-semibold text-foreground/60 transition hover:border-brand-orange/40 hover:text-brand-orange"
              >
                <Reply size={15} aria-hidden="true" />
                Trả lời
              </button>
            </div>
          </header>

          <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-foreground/75">{comment.content}</p>

          {replyingTo === comment.id && (
            <form id={`reply-form-${comment.id}`} action={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-brand-orange/15 bg-background p-5">
              <input type="hidden" name="post_id" value={postId} />
              <input type="hidden" name="parent_id" value={comment.id} />
              <p className="text-sm font-semibold text-foreground">Trả lời {comment.user_name}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="comment-field">
                  <span className="sr-only">Tên của bạn</span>
                  <User size={16} aria-hidden="true" />
                  <input name="user_name" required placeholder="Tên của bạn" />
                </label>
                <label className="comment-field">
                  <span className="sr-only">Email không bắt buộc</span>
                  <Mail size={16} aria-hidden="true" />
                  <input name="user_email" type="email" placeholder="Email (không bắt buộc)" />
                </label>
              </div>
              <textarea name="content" required rows={3} autoFocus placeholder={`Viết phản hồi cho ${comment.user_name}...`} className="comment-textarea" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setReplyingTo(null)} className="secondary-editorial-cta px-5 py-2.5">Hủy</button>
                <button type="submit" disabled={isPending} className="primary-editorial-cta px-5 py-2.5">
                  <Send size={16} aria-hidden="true" />{isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </form>
          )}
        </div>

        {comment.replies.map((reply) => <CommentItem key={reply.id} comment={reply} isReply />)}
      </article>
    );
  };

  return (
    <section className="mt-24 border-t border-foreground/10 pt-16" aria-labelledby="discussion-title">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-brand-orange" size={27} aria-hidden="true" />
          <h2 id="discussion-title" className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Thảo luận</h2>
        </div>
        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/60">
          Bạn nghĩ gì về chủ đề này? Hãy chia sẻ góc nhìn, câu hỏi hoặc kinh nghiệm của bạn.
        </p>

        <form id="comment-form" action={handleSubmit} className="mt-9 space-y-5 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 md:p-8">
          <input type="hidden" name="post_id" value={postId} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Tên của bạn</span>
              <span className="comment-field"><User size={17} aria-hidden="true" /><input name="user_name" required placeholder="Nhập tên của bạn" /></span>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Email <span className="font-normal text-foreground/45">(không bắt buộc)</span></span>
              <span className="comment-field"><Mail size={17} aria-hidden="true" /><input name="user_email" type="email" placeholder="you@example.com" /></span>
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">Bình luận</span>
            <textarea name="content" required rows={5} placeholder="Viết bình luận của bạn..." className="comment-textarea min-h-[150px]" />
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={isPending} className="primary-editorial-cta min-w-[170px] justify-center">
              <Send size={17} aria-hidden="true" />{isPending ? 'Đang gửi...' : 'Gửi bình luận'}
            </button>
          </div>
        </form>

        <div className="mt-14">
          <div className="flex items-center justify-between gap-5 border-b border-foreground/10 pb-4">
            <h3 className="text-xl font-semibold text-foreground">Bình luận</h3>
            <span className="text-sm text-foreground/45">{initialComments.length} bình luận</span>
          </div>

          {initialComments.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-foreground/15 px-6 py-14 text-center">
              <MessageSquare className="mx-auto text-brand-orange/60" size={28} aria-hidden="true" />
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-foreground/55">
                Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ góc nhìn về bài viết này.
              </p>
            </div>
          ) : (
            <div>{commentTree.map((comment) => <CommentItem key={comment.id} comment={comment} />)}</div>
          )}
        </div>
      </div>
    </section>
  );
}
