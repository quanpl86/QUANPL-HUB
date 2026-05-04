'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function submitComment(formData: FormData) {
  const postId = formData.get('post_id') as string;
  const parentId = formData.get('parent_id') as string | null;
  const userName = formData.get('user_name') as string;
  const userEmail = formData.get('user_email') as string;
  const content = formData.get('content') as string;

  if (!postId || !content) {
    throw new Error('MISSING_DATA: Post ID and content are required');
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      parent_id: parentId || null,
      user_name: userName || 'Ẩn danh',
      user_email: userEmail,
      content: content,
      status: 'pending'
    });

  if (error) {
    console.error('COMMENT_ERROR:', error);
    throw new Error('DATABASE_ERROR: Failed to submit comment');
  }

  revalidatePath(`/posts/[slug]`, 'page');
  return { success: true };
}

export async function toggleLike(postId: string) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'anonymous';

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('ip_address', ip)
    .single();

  if (existingLike) {
    // Unlike
    await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        ip_address: ip
      });
      
    if (error && error.code !== '23505') {
      console.error('LIKE_ERROR:', error);
      throw new Error('DATABASE_ERROR: Failed to toggle like');
    }
  }

  revalidatePath(`/posts/[slug]`, 'page');
  return { success: true };
}

export async function toggleCommentReaction(commentId: string) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'anonymous';

  // Check if already reacted
  const { data: existingReaction } = await supabase
    .from('comment_reactions')
    .select('id')
    .eq('comment_id', commentId)
    .eq('ip_address', ip)
    .single();

  if (existingReaction) {
    await supabase
      .from('comment_reactions')
      .delete()
      .eq('id', existingReaction.id);
  } else {
    const { error } = await supabase
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        ip_address: ip,
        reaction_type: 'like'
      });
      
    if (error && error.code !== '23505') {
      console.error('REACTION_ERROR:', error);
      throw new Error('DATABASE_ERROR: Failed to toggle reaction');
    }
  }

  revalidatePath(`/posts/[slug]`, 'page');
  return { success: true };
}
