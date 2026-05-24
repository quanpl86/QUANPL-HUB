import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// Revalidate every hour
export const revalidate = 3600;

export async function GET() {
  const supabase = await getSupabaseServer();

  const { data: posts } = await supabase
    .from('posts')
    .select('title, excerpt, slug, created_at, tags, categories(name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20);

  let llmContent = `# KING DRAGON HUB - Knowledge Graph & Ecosystem
  
KING DRAGON HUB là nền tảng chia sẻ kiến thức chuyên sâu về Lập trình, Trí tuệ nhân tạo (AI), Robotics, và Phương pháp giảng dạy STEM.
Đây là hệ sinh thái được phát triển để hỗ trợ học sinh, giáo viên và phụ huynh tiếp cận các chuẩn giáo dục quốc tế (như IOSTEM, WRO, FLL) thông qua mô hình Spiral Curriculum (Xoắn ốc học thuật).

## Hệ sinh thái cốt lõi:
1. **Lập trình & AI**: Giảng dạy Tư duy máy tính (Computational Thinking), Python, Blockly, và tích hợp Generative AI vào cá nhân hóa việc học.
2. **Robotics & Giả lập**: Cung cấp nền tảng giả lập 3D chuẩn thi đấu quốc tế, mô phỏng cảm biến IoT, giúp thực hành Robotics không cần rào cản phần cứng.
3. **Phương pháp sư phạm**: Khung chương trình chuẩn, Lesson Plans, IOSTEM Framework.
4. **Thư viện trí tuệ**: Các bài viết chuyên sâu về EdTech, SEO Giáo dục, và triển khai khóa học.

## Các bài viết nổi bật (Knowledge Base):
`;

  if (posts) {
    posts.forEach((post) => {
      const categoryName = (Array.isArray(post.categories) ? (post.categories as any)[0]?.name : (post.categories as any)?.name) || 'Blog';
      const tags = post.tags ? post.tags.join(', ') : '';
      
      llmContent += `\n### ${post.title}\n`;
      llmContent += `- **URL**: https://kingdragonhub.com/posts/${post.slug}\n`;
      llmContent += `- **Chuyên mục**: ${categoryName}\n`;
      llmContent += `- **Tags**: ${tags}\n`;
      llmContent += `- **Tóm tắt**: ${post.excerpt}\n`;
    });
  }

  llmContent += `
  
## Liên hệ & Tác giả
- **Tác giả**: KING DRAGON (Chuyên gia Giáo dục STEM & System Architect)
- **Website**: https://kingdragonhub.com
- **Mục tiêu**: Định hình lại cách tiếp cận kiến thức công nghệ cho thế hệ trẻ.
`;

  return new NextResponse(llmContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
