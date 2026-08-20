'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';
import { EditorialCalendarRepository } from '@/lib/content/editorial-calendar';
import { EditorialPlanAudit } from '@/lib/content/editorial-plan';

// Helper để tạo slug chuẩn tiếng Việt
function slugify(text: string) {
  const from = "áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ·/_,:;";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";
  
  let str = text.toLowerCase().trim();
  for (let i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  return str
    .replace(/[^a-z0-9 -]/g, '') // xóa ký tự đặc biệt
    .replace(/\s+/g, '-')        // thay khoảng trắng bằng -
    .replace(/-+/g, '-');       // xóa gạch ngang thừa
}

export async function createPost(formData: FormData, content: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const title = formData.get('title') as string;
  const excerpt = formData.get('excerpt') as string;
  const categoryId = formData.get('category_id') as string;
  const imageUrl = formData.get('image_url') as string;
  const imageAlt = formData.get('image_alt') as string;
  const isPublished = formData.get('is_published') === 'on';
  const commentsEnabled = formData.get('comments_enabled') === 'on';
  
  // SEO Fields
  const metaTitle = formData.get('meta_title') as string;
  const metaDescription = formData.get('meta_description') as string;
  const keywordsRaw = formData.get('keywords') as string;
  const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];
  
  // Content Tags
  const tagsRaw = formData.get('tags') as string;
  const tags = tagsRaw ? tagsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];

  const slug = slugify(title) + '-' + Math.random().toString(36).substring(2, 7);

  const { data, error } = await supabase
    .from('posts')
    .insert([{
      title,
      slug,
      content,
      excerpt,
      image_url: imageUrl,
      category_id: categoryId ? parseInt(categoryId) : null,
      author_id: user?.id,
      is_published: isPublished,
      comments_enabled: commentsEnabled,
      meta_title: metaTitle,
      meta_description: metaDescription,
      keywords,
      tags,
      seo_keywords: { image_alt: imageAlt }
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/posts');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  return { success: true, slug: data.slug };
}

export async function updatePost(id: any, formData: FormData, content: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const title = formData.get('title') as string;
  const excerpt = formData.get('excerpt') as string;
  const categoryId = formData.get('category_id') as string;
  const imageUrl = formData.get('image_url') as string;
  const imageAlt = formData.get('image_alt') as string;
  const isPublished = formData.get('is_published') === 'on';
  const commentsEnabled = formData.get('comments_enabled') === 'on';
  
  // SEO Fields
  const metaTitle = formData.get('meta_title') as string;
  const metaDescription = formData.get('meta_description') as string;
  const keywordsRaw = formData.get('keywords') as string;
  const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];

  // Content Tags
  const tagsRaw = formData.get('tags') as string;
  const tags = tagsRaw ? tagsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];

  const { data: existingPost } = await supabase.from('posts').select('slug, seo_keywords, article_package').eq('id', id).single();
  const existingSeoKeywords = existingPost?.seo_keywords || {};
  const slug = existingPost?.slug;
  if (isPublished && existingPost?.article_package?.media_status === 'INCOMPLETE') {
    return {
      success: false,
      error: 'MEDIA_INCOMPLETE: Bài còn image holder. Hãy bổ sung đủ cover và ảnh trong bài trước khi công khai.',
    };
  }

  const { error } = await supabase
    .from('posts')
    .update({
      title,
      content,
      excerpt,
      image_url: imageUrl,
      category_id: categoryId ? parseInt(categoryId) : null,
      is_published: isPublished,
      comments_enabled: commentsEnabled,
      meta_title: metaTitle,
      meta_description: metaDescription,
      keywords,
      tags,
      seo_keywords: { ...(typeof existingSeoKeywords === 'object' ? existingSeoKeywords : {}), image_alt: imageAlt },
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating post:', error);
    return { success: false, error: error.message };
  }

  if (isPublished) {
    const slots = await EditorialCalendarRepository.markPublishedByPostId(getSupabaseAdmin(), id);
    for (const slot of slots) {
      if (slot.week_id) {
        await EditorialPlanAudit.log(getSupabaseAdmin(), {
          week_id: slot.week_id,
          slot_id: slot.id,
          event: 'article_published',
          actor: 'admin',
          payload: { post_id: id },
        }).catch(console.error);
      }
    }
  }

  revalidatePath('/admin/posts');
  revalidatePath('/admin/editorial');
  revalidatePath('/sitemap.xml');
  if (slug) revalidatePath(`/posts/${slug}`); // Revalidate bài viết cụ thể
  revalidatePath('/');
  return { success: true };
}

export async function deletePost(id: string | number) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = getSupabaseAdmin();

  await supabase
    .from('content_tasks')
    .update({ result_post_id: null })
    .eq('result_post_id', id);

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting post:', error);
    throw new Error(error.message);
  }

  revalidatePath('/admin/posts');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
}

/**
 * Tạo bản nháp tự động từ hệ thống AI
 */
export async function createAIDraft(data: {
  title: string;
  content: string;
  excerpt?: string;
  category_id?: number;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  // Hybrid Mode fields
  is_ai_generated?: boolean;
  seo_keywords?: Record<string, any>;
  schema_org?: Record<string, any>;
  source_task_id?: string;
}) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const slug = slugify(data.title) + '-ai-' + Math.random().toString(36).substring(2, 7);

  const { data: post, error } = await supabase
    .from('posts')
    .insert([{
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 160) + '...',
      category_id: data.category_id || null,
      image_url: data.image_url || null,
      author_id: user?.id,
      is_published: false,
      comments_enabled: true,
      meta_title: data.meta_title || data.title,
      meta_description: data.meta_description || data.excerpt || data.content.substring(0, 160),
      keywords: data.keywords || [],
      // Hybrid Mode fields
      is_ai_generated: data.is_ai_generated ?? false,
      seo_keywords: data.seo_keywords || null,
      schema_org: data.schema_org || null,
      source_task_id: data.source_task_id || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating AI draft:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/posts');
  return { success: true, slug: post.slug, id: post.id };
}
