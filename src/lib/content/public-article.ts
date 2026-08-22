import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sanitize } from '@/lib/sanitize';
import { parseHtmlWithToc } from '@/lib/toc-parser';
import { renderMathInHtml } from '@/lib/math-renderer';
import { calculateReadingMinutes } from '@/lib/content/article-card';

const loadPreparedArticle = unstable_cache(
  async (slug: string) => {
    const { data: post, error } = await getSupabaseAdmin()
      .from('posts')
      .select('id, title, slug, content, excerpt, image_url, created_at, updated_at, category_id, tags, keywords, seo_keywords, meta_title, meta_description, audio_url, video_url, comments_enabled, profiles(full_name), categories(name, slug, subjects(id, name, field_id, fields(name, slug)))')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) throw error;
    if (!post) return null;

    const content = post.content || '';
    const { toc, html } = parseHtmlWithToc(renderMathInHtml(content));
    const faqRegex = /<details[^>]*class="[^"]*faq-block[^"]*"[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<div[^>]*class="[^"]*faq-answer[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/details>/g;
    const faqs = [];
    let match;

    while ((match = faqRegex.exec(content)) !== null) {
      faqs.push({
        '@type': 'Question',
        name: match[1].replace(/<[^>]*>?/gm, '').trim(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: match[2].replace(/<[^>]*>?/gm, '').trim(),
        },
      });
    }

    return {
      post,
      toc,
      sanitizedHtml: sanitize(html),
      faqs,
      readingMinutes: calculateReadingMinutes(content),
    };
  },
  ['prepared-public-article'],
  { revalidate: 3600, tags: ['public-posts'] },
);

export const getPreparedPublicArticle = cache((slug: string) => loadPreparedArticle(slug));

export const getRelatedPostCandidates = unstable_cache(
  async () => {
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .select('id, slug, title, excerpt, image_url, created_at, category_id, profiles(full_name), categories(name, slug, subjects(id, field_id)), tags')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(80);

    if (error) throw error;
    return data || [];
  },
  ['related-post-candidates'],
  { revalidate: 600, tags: ['public-posts'] },
);

const loadSeriesPosts = unstable_cache(
  async (seriesTag: string) => {
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .select('id, slug, title, created_at')
      .eq('is_published', true)
      .contains('tags', [seriesTag]);

    if (error) throw error;
    return data || [];
  },
  ['public-series-posts'],
  { revalidate: 600, tags: ['public-posts'] },
);

export const getPublicSeriesPosts = cache((seriesTag: string) => loadSeriesPosts(seriesTag));
