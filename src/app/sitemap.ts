import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kingdragonhub.com';

  // Lấy danh sách các slug bài viết (giả định)
  const { data: posts } = await supabase.from('posts').select('slug, updated_at').eq('is_published', true);
  const { data: fields } = await supabase.from('fields').select('slug');

  const postEntries = (posts || []).map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: new Date(post.updated_at),
  }));

  const fieldEntries = (fields || []).map((field) => ({
    url: `${baseUrl}/fields/${field.slug}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...postEntries,
    ...fieldEntries,
  ];
}
