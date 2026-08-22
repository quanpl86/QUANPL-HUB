import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getCardReadingMinutes } from '@/lib/content/article-card';

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  created_at: string;
  tags?: string[];
  reading_minutes: number;
  categories: {
    name: string;
    slug?: string;
    subjects?: { fields?: { slug?: string } | null } | null;
  } | null;
};

export type SocialLinks = {
  github: string;
  facebook: string;
  linkedin: string;
  youtube: string;
};

export const verifiedPublicSocialLinks: SocialLinks = {
  github: 'https://github.com/quanpl86',
  facebook: 'https://www.facebook.com/plquan.86/',
  linkedin: 'https://www.linkedin.com/in/long-qu%C3%A2n-phan-6a9388125/',
  youtube: 'https://www.youtube.com/@Qu%C3%A2nPhanLong',
};

export const getPublicCategories = unstable_cache(
  async (): Promise<PublicCategory[]> => {
    const { data, error } = await getSupabaseAdmin()
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (error) throw error;
    return (data || []) as PublicCategory[];
  },
  ['public-categories'],
  { revalidate: 3600, tags: ['public-taxonomy'] },
);

export const getPublicPostIndex = unstable_cache(
  async (): Promise<PublicPostCard[]> => {
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .select('id, title, slug, excerpt, image_url, created_at, tags, reading_minutes:article_package->>reading_minutes, categories(name, slug, subjects(name, slug, fields(name, slug)))')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((post) => ({
      ...post,
      reading_minutes: getCardReadingMinutes(post.slug, post.reading_minutes),
    })) as unknown as PublicPostCard[];
  },
  ['public-post-index'],
  { revalidate: 300, tags: ['public-posts'] },
);

export const getPublicSocialLinks = unstable_cache(
  async (): Promise<SocialLinks> => {
    const { data, error } = await getSupabaseAdmin()
      .from('site_settings')
      .select('github_url, facebook_url, linkedin_url, youtube_url')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Không thể tải liên kết mạng xã hội:', error.message);
    }

    return {
      github: data?.github_url || verifiedPublicSocialLinks.github,
      facebook: data?.facebook_url || verifiedPublicSocialLinks.facebook,
      linkedin: data?.linkedin_url || verifiedPublicSocialLinks.linkedin,
      youtube: data?.youtube_url || verifiedPublicSocialLinks.youtube,
    };
  },
  ['public-social-links'],
  { revalidate: 3600, tags: ['site-settings'] },
);

export function matchesPostQuery(post: PublicPostCard, query: string) {
  if (!query.trim()) return true;
  const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const searchable = [post.title, post.excerpt, ...(post.tags || [])]
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return searchable.includes(normalizedQuery);
}
