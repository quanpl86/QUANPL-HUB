import { headers } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase-server';
import { LikeButton } from '@/components/blog/LikeButton';
import { CommentSection } from '@/components/blog/CommentSection';

export async function PostInteractions({
  postId,
  commentsEnabled,
}: {
  postId: string;
  commentsEnabled: boolean;
}) {
  const [supabase, headerList] = await Promise.all([getSupabaseServer(), headers()]);
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';

  const [commentsResult, likesResult, userLikeResult] = await Promise.all([
    supabase
      .from('comments')
      .select('*, comment_reactions(id, ip_address)')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true }),
    supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId),
    supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('ip_address', ip)
      .maybeSingle(),
  ]);

  return (
    <>
      <div className="mt-20 flex justify-center">
        <LikeButton
          postId={postId}
          initialLikes={likesResult.count || 0}
          isLikedInitially={!!userLikeResult.data}
        />
      </div>

      {commentsEnabled ? (
        <CommentSection
          postId={postId}
          initialComments={commentsResult.data || []}
          currentUserIp={ip}
        />
      ) : (
        <div className="mt-24 border-t border-brand-orange/10 pt-16 text-center">
          <div className="inline-block border border-dashed border-brand-orange/30 bg-brand-orange/5 px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] text-brand-orange/60">
            Bình luận đang tạm đóng cho bài viết này
          </div>
        </div>
      )}
    </>
  );
}
