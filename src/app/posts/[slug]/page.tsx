import React from 'react';
import { getSupabaseServer } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import Image from 'next/image';
import Link from 'next/link';
import { sanitize } from '@/lib/sanitize';
import { parseHtmlWithToc } from '@/lib/toc-parser';
import { TableOfContents } from '@/components/blog/TableOfContents';

interface PostPageProps {
  params: { slug: string };
}

// 1. Tự động tạo Metadata cho SEO (Dynamic Metadata)
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const { data: post } = await supabase
    .from('posts')
    .select('title, meta_title, meta_description, excerpt, image_url, keywords')
    .eq('slug', slug)
    .single();

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    keywords: post.keywords || [],
    alternates: {
      canonical: `https://kingdragonhub.com/posts/${slug}`,
    },
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.image_url ? [post.image_url] : [],
      type: 'article',
      url: `https://kingdragonhub.com/posts/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.image_url ? [post.image_url] : [],
    }
  };
}

import { LikeButton } from '@/components/blog/LikeButton';
import { headers } from 'next/headers';
import dynamic from 'next/dynamic';

const CommentSection = dynamic(() => import('@/components/blog/CommentSection').then(mod => mod.CommentSection), {
  loading: () => <div className="mt-24 pt-16 border-t border-brand-orange/10 animate-pulse font-mono text-xs text-brand-orange uppercase tracking-widest text-center">ĐANG_TẢI_MA_TRẬN_BÌNH_LUẬN...</div>
});

const RelatedArticles = dynamic(() => import('@/components/blog/RelatedArticles').then(mod => mod.RelatedArticles), {
  loading: () => <div className="mt-24 pt-16 border-t border-brand-orange/10 h-64 bg-brand-orange/5 animate-pulse"></div>
});

import { CollapsibleTags } from '@/components/blog/CollapsibleTags';
import { SeriesNavigation } from '@/components/blog/SeriesNavigation';

const PremiumMultimedia = dynamic(() => import('@/components/blog/PremiumMultimedia').then(mod => mod.PremiumMultimedia), {
  loading: () => <div className="h-20 bg-brand-orange/5 animate-pulse border border-brand-orange/10 mb-12"></div>
});

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'anonymous';

  // Fetch Post with Profile and Category
  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(full_name), categories(name, slug)')
    .eq('slug', slug)
    .single();

  if (!post) notFound();

  // Fetch Comments with Replies and Reactions
  const { data: comments } = await supabase
    .from('comments')
    .select('*, comment_reactions(id, ip_address)')
    .eq('post_id', post.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true }); // Dùng ascending để dễ xử lý cây bình luận

  // Fetch Likes count and check if user liked
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id);

  const { data: userLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', post.id)
    .eq('ip_address', ip)
    .single();

  // Fetch up to 20 posts in the same category for semantic scoring
  const { data: categoryPosts } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, image_url, created_at, profiles(full_name), categories(name), tags')
    .eq('is_published', true)
    .eq('category_id', post.category_id)
    .neq('id', post.id)
    .limit(20);

  let scoredPosts = categoryPosts || [];
  if (post.tags && post.tags.length > 0) {
    scoredPosts = scoredPosts.map(p => {
      const overlap = (p.tags || []).filter((t: string) => post.tags.includes(t)).length;
      return { ...p, overlap };
    }).sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else {
    scoredPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const recentPosts = scoredPosts.slice(0, 3);

  // Fetch Series Posts if applicable
  const seriesTag = post.tags?.find((tag: string) => tag.startsWith('Series: '));
  const seriesName = seriesTag ? seriesTag.replace('Series: ', '').trim() : null;
  let seriesPosts: any[] = [];
  
  if (seriesTag) {
    const { data: sData } = await supabase
      .from('posts')
      .select('id, slug, title, created_at')
      .eq('is_published', true)
      .contains('tags', [seriesTag]);
    if (sData) seriesPosts = sData;
  }

  // Dữ liệu cấu trúc bài viết (Article Schema + E-E-A-T)
  const authorName = (Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'KING DRAGON';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.image_url,
    author: {
      '@type': 'Person',
      name: authorName,
      url: 'https://kingdragonhub.com',
      jobTitle: 'STEM Education Specialist & System Architect',
      worksFor: {
        '@type': 'Organization',
        name: 'KING DRAGON HUB',
      },
      sameAs: [
        'https://kingdragonhub.com',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'KING DRAGON HUB',
      url: 'https://kingdragonhub.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kingdragonhub.com/logo.png',
      },
    },
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    description: post.excerpt,
    keywords: post.tags?.join(', ') || post.keywords?.join(', ') || '',
    inLanguage: 'vi',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kingdragonhub.com/posts/${slug}`,
    },
  };

  // Trích xuất FAQ block để tạo FAQPage Schema
  const faqRegex = /<details[^>]*class="[^"]*faq-block[^"]*"[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<div[^>]*class="[^"]*faq-answer[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/details>/g;
  const faqs = [];
  let match;
  while ((match = faqRegex.exec(post.content || '')) !== null) {
    faqs.push({
      '@type': 'Question',
      name: match[1].replace(/<[^>]*>?/gm, '').trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: match[2].replace(/<[^>]*>?/gm, '').trim(),
      }
    });
  }

  let faqSchema = null;
  if (faqs.length > 0) {
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs
    };
  }

  return (
    <article className="min-h-screen pb-20 bg-background text-foreground selection:bg-brand-orange selection:text-white transition-colors duration-300">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      
      {/* Editorial Header */}
      <div className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-[1200px] mx-auto">
          {/* Date */}
          <div className="tech-mono text-[0.7rem] tracking-[0.1em] text-foreground mb-6 uppercase font-bold">
            {post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'NEURAL_LINK_PENDING'}
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-inter)] font-medium text-[3.5rem] md:text-[5rem] lg:text-[5.5rem] leading-[1.05] tracking-[-0.03em] mb-16 text-foreground w-full">
            {post.title}
          </h1>

          {/* Metadata Row: Author & Categories */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-brand-orange/30 flex items-center justify-center bg-brand-orange/10 overflow-hidden">
                <span className="font-orbitron text-brand-orange font-bold text-xs">Q</span>
              </div>
              <div className="flex items-center gap-2 font-[family-name:var(--font-inter)] text-sm">
                <Link href="/author/quanpl86" className="font-semibold text-foreground hover:text-brand-orange transition-colors">
                  {(Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'KING DRAGON (Quan PL)'}
                </Link>
                <span className="text-foreground/70 hidden md:inline">System Architect & STEM Educator</span>
              </div>
            </div>

            {/* Categories / Tags */}
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const categoryName = (Array.isArray(post.categories) ? (post.categories as any)[0]?.name : (post.categories as any)?.name) || 'REDACTED';
                const categorySlug = (Array.isArray(post.categories) ? (post.categories as any)[0]?.slug : (post.categories as any)?.slug) || 'all';
                return (
                  <Link 
                    href={`/blog?category=${categorySlug}`}
                    className="px-3 py-1 text-[0.65rem] tech-mono font-bold uppercase tracking-wider border border-foreground/30 rounded-full text-foreground/80 hover:border-brand-orange hover:text-brand-orange transition-colors"
                  >
                    {categoryName}
                  </Link>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image as a Poster */}
      {post.image_url && (
        <div className="container mx-auto px-6 mb-16 md:mb-24">
          <div className="relative aspect-video w-full max-w-[1200px] mx-auto overflow-hidden bg-background border border-brand-orange/10">
            
            {/* Ambient Adaptive Background */}
            <div className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30">
              <Image 
                src={post.image_url} 
                alt="" 
                fill
                sizes="100vw"
                className="object-cover blur-[80px] scale-125"
              />
            </div>

            {/* Main Contained Image */}
            <Image 
              src={post.image_url} 
              alt={post.seo_keywords?.image_alt || post.title} 
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              className="object-contain z-10"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="container mx-auto px-6 mt-8 md:mt-16">
        <div className="max-w-4xl mx-auto">
          {/* Post Excerpt/Lead */}
          {post.excerpt && (
            <div className="mb-12 relative group">
              <div className="absolute -left-12 top-0 bottom-0 w-2 bg-brand-orange/60 shadow-[0_0_20px_rgba(255,87,34,0.2)] transform -skew-x-12 transition-all group-hover:w-3"></div>
              <p className="body-lg !text-xl md:!text-2xl lg:!text-3xl text-foreground/80 font-light pl-6 tracking-wide italic">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* PREMIUM MULTIMEDIA EXPERIENCE */}
          <PremiumMultimedia 
            audioUrl={post.audio_url} 
            videoUrl={post.video_url} 
            title={post.title} 
          />

          {/* Table of Contents (Auto-generated from headings) */}
          {(() => {
            const { toc, html: tocHtml } = parseHtmlWithToc(post.content || '');
            return (
              <>
                <TableOfContents items={toc} />
                {/* Dynamic Content from Tiptap v3 / Markdown */}
                <section 
                  className="king-dragon-content prose prose-brand max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitize(tocHtml) }}
                />
              </>
            );
          })()}

          {/* Series Navigation */}
          {seriesName && seriesPosts.length > 1 && (
            <SeriesNavigation 
              seriesName={seriesName} 
              posts={seriesPosts} 
              currentPostId={post.id} 
            />
          )}

          {/* Post Tags (Bottom) */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t border-brand-orange/10 flex flex-wrap gap-3">
              <CollapsibleTags tags={post.tags} maxVisible={10} />
            </div>
          )}

          {/* Interactions Section */}
          <div className="mt-20 flex justify-center">
            <LikeButton 
              postId={post.id} 
              initialLikes={likesCount || 0} 
              isLikedInitially={!!userLike} 
            />
          </div>
          
          {/* Discussion Section */}
          {post.comments_enabled !== false ? (
            <CommentSection 
              postId={post.id} 
              initialComments={comments || []} 
              currentUserIp={ip}
            />
          ) : (
            <div className="mt-24 pt-16 border-t border-brand-orange/10 text-center">
              <div className="inline-block px-8 py-4 border border-dashed border-brand-orange/30 bg-brand-orange/5 font-mono text-xs uppercase tracking-[0.2em] text-brand-orange/60">
                // CHỨC_NĂNG_BÌNH_LUẬN_ĐÃ_BỊ_KHÓA_CHO_BÀI_VIẾT_NÀY //
              </div>
            </div>
          )}
        </div>

        <div className="max-w-[1200px] mx-auto">
          {/* Related Articles Section */}
          <RelatedArticles posts={recentPosts || []} />
          
          {/* Footer Metadata */}
          <footer className="mt-32 pt-12 border-t border-brand-orange/10 flex flex-wrap gap-12 justify-between items-center text-foreground/70 dark:text-muted tech-mono !text-[11px]">
            <div className="flex flex-col gap-2">
              <span className="text-brand-orange/80 dark:text-brand-orange/60">SOURCE_ENCRYPTION_HASH:</span>
              <span className="text-foreground/50 dark:opacity-50 break-all">{slug.toUpperCase()}_v3.22.4_SYNCED</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="opacity-40">End of Transmission</span>
              <div className="w-12 h-[1px] bg-brand-orange/30"></div>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}
