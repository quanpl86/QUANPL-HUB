import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kingdragonhub.com';

  // Lấy danh sách bài viết đã xuất bản
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('is_published', true);

  const postEntries: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Xác định ngày cập nhật bài viết mới nhất để làm lastModified cho /blog
  const latestPostDate = (posts && posts.length > 0)
    ? new Date(Math.max(...posts.map(p => new Date(p.updated_at).getTime())))
    : new Date('2026-09-27T12:00:00.000Z');

  // Các trang canonical công khai thực tế trên hệ thống
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-09-27T12:00:00.000Z'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ai-in-education`,
      lastModified: new Date('2026-09-27T12:00:00.000Z'),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date('2026-08-20T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/author/quanpl86`,
      lastModified: new Date('2026-09-20T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/utility-hub`,
      lastModified: new Date('2026-09-20T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lop-control-center/`,
      lastModified: new Date('2026-09-25T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/lop-control-center/privacy/`,
      lastModified: new Date('2026-09-25T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/lop-control-center/terms/`,
      lastModified: new Date('2026-09-25T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [
    ...staticPages,
    ...postEntries,
  ];
}
