import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * SEO Internal Linker Service
 */

export async function getInternalLinksContext() {
  const supabase = await getSupabaseServer();
  
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('title, slug')
      .eq('is_published', true)
      .limit(20)
      .order('created_at', { ascending: false });

    if (!posts || posts.length === 0) return "";

    let context = "Dưới đây là danh sách các bài viết hiện có trên trang web. Nếu nội dung bài viết mới có liên quan, hãy tự động chèn liên kết nội bộ theo định dạng Markdown [Tiêu đề](/posts/slug) vào văn bản một cách tự nhiên:\n";
    
    posts.forEach(post => {
      context += `- ${post.title} (URL: /posts/${post.slug})\n`;
    });

    return context;
  } catch (error) {
    console.error('Error fetching internal links:', error);
    return "";
  }
}
