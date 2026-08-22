import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import Image from 'next/image';
import Link from 'next/link';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { getPreparedPublicArticle, getPublicSeriesPosts, getRelatedPostCandidates } from '@/lib/content/public-article';
import { PostInteractions } from '@/components/blog/PostInteractions';
import { RelatedArticles } from '@/components/blog/RelatedArticles';
import { getVietnameseTaxonomyLabel } from '@/config/knowledge-taxonomy';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// 1. Tự động tạo Metadata cho SEO (Dynamic Metadata)
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const prepared = await getPreparedPublicArticle(slug);
  const post = prepared?.post;

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

import dynamic from 'next/dynamic';

import { CollapsibleTags } from '@/components/blog/CollapsibleTags';
import { SeriesNavigation } from '@/components/blog/SeriesNavigation';

const PremiumMultimedia = dynamic(() => import('@/components/blog/PremiumMultimedia').then(mod => mod.PremiumMultimedia), {
  loading: () => <div className="h-20 bg-brand-orange/5 animate-pulse border border-brand-orange/10 mb-12"></div>
});

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const prepared = await getPreparedPublicArticle(slug);
  if (!prepared) notFound();

  const { post, toc, sanitizedHtml, faqs, readingMinutes } = prepared;
  const seriesTag = post.tags?.find((tag: string) => tag.startsWith('Series: '));
  const [categoryPosts, seriesPosts] = await Promise.all([
    getRelatedPostCandidates(),
    seriesTag ? getPublicSeriesPosts(seriesTag) : Promise.resolve([]),
  ]);

  const postTaxonomy = post.categories as any;
  const scoredPosts = categoryPosts.filter((candidate: any) => candidate.id !== post.id).map((candidate: any) => {
    const taxonomy = candidate.categories;
    const tagOverlap = (candidate.tags || []).filter((tag: string) => (post.tags || []).includes(tag)).length;
    const score = (candidate.category_id === post.category_id ? 3 : 0)
      + (taxonomy?.subjects?.id === postTaxonomy?.subjects?.id ? 2 : 0)
      + (taxonomy?.subjects?.field_id === postTaxonomy?.subjects?.field_id ? 1 : 0)
      + tagOverlap;
    return { ...candidate, overlap: score };
  }).sort((a: any, b: any) => b.overlap - a.overlap || +new Date(b.created_at) - +new Date(a.created_at));
  const recentPosts = scoredPosts.slice(0, 3);

  const seriesName = seriesTag ? seriesTag.replace('Series: ', '').trim() : null;

  // Dữ liệu cấu trúc bài viết (Article Schema + E-E-A-T)
  const authorName = (Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'KING DRAGON';
  const categoryData = (Array.isArray(post.categories) ? (post.categories as any)[0] : post.categories) as any;

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
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs text-foreground/45">
            <Link href="/" className="hover:text-brand-orange">Trang chủ</Link><span>/</span>
            {categoryData?.subjects?.fields && <><Link href={`/blog?field=${categoryData.subjects.fields.slug}`} className="hover:text-brand-orange">{getVietnameseTaxonomyLabel(categoryData.subjects.fields.name, categoryData.subjects.fields.slug)}</Link><span>/</span></>}
            {categoryData?.subjects && <><span>{getVietnameseTaxonomyLabel(categoryData.subjects.name, categoryData.subjects.slug)}</span><span>/</span></>}
            <Link href={`/blog?category=${categoryData?.slug || 'all'}`} className="text-brand-orange">{getVietnameseTaxonomyLabel(categoryData?.name || 'Bài viết', categoryData?.slug)}</Link>
          </nav>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-inter)] font-semibold text-[2.65rem] md:text-[4.4rem] lg:text-[5.2rem] leading-[1.02] tracking-[-0.045em] mb-10 text-foreground w-full">
            {post.title}
          </h1>

          {post.excerpt && <p className="mb-10 max-w-4xl text-lg leading-8 text-foreground/65 md:text-xl">{post.excerpt}</p>}

          {/* Metadata Row: Author & Categories */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-brand-orange/30 flex items-center justify-center bg-brand-orange/10 overflow-hidden">
                <span className="font-orbitron text-brand-orange font-bold text-xs">Q</span>
              </div>
              <div className="font-[family-name:var(--font-inter)] text-sm">
                <Link href="/author/quanpl86" className="font-semibold text-foreground hover:text-brand-orange transition-colors">
                  {(Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'KING DRAGON (Quan PL)'}
                </Link>
                <p className="mt-1 text-xs text-foreground/45">Kiến trúc sư hệ thống & Chuyên gia giáo dục STEM</p>
              </div>
            </div>

            {/* Categories / Tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/50">
              <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : ''}</span>
              <span aria-hidden="true">·</span><span>{readingMinutes} phút đọc</span>
              {(() => {
                const categoryName = (Array.isArray(post.categories) ? (post.categories as any)[0]?.name : (post.categories as any)?.name) || 'REDACTED';
                const categorySlug = (Array.isArray(post.categories) ? (post.categories as any)[0]?.slug : (post.categories as any)?.slug) || 'all';
                return (
                  <Link 
                    href={`/blog?category=${categorySlug}`}
                    className="ml-1 rounded-full border border-brand-orange/25 bg-brand-orange/[0.05] px-3 py-1.5 text-[0.68rem] font-semibold text-brand-orange transition-colors hover:border-brand-orange"
                  >
                    {getVietnameseTaxonomyLabel(categoryName, categorySlug)}
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.14),transparent_68%)]" aria-hidden="true" />

            {/* Main Contained Image */}
            <Image 
              src={post.image_url} 
              alt={post.seo_keywords?.image_alt || post.title} 
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              quality={95}
              priority
              className="object-contain z-10"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="container mx-auto px-6 mt-8 md:mt-16">
        <div className="max-w-4xl mx-auto">
          {/* PREMIUM MULTIMEDIA EXPERIENCE */}
          <PremiumMultimedia 
            audioUrl={post.audio_url} 
            videoUrl={post.video_url} 
            title={post.title} 
          />

          <TableOfContents items={toc} />
          <section
            className="king-dragon-content prose prose-brand max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

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

          <Suspense fallback={<div className="mt-20 h-24 animate-pulse rounded-xl bg-foreground/[0.04]" aria-label="Đang tải tương tác" />}>
            <PostInteractions postId={post.id} commentsEnabled={post.comments_enabled !== false} />
          </Suspense>
        </div>

        <div className="max-w-[1200px] mx-auto">
          {/* Related Articles Section */}
          <RelatedArticles posts={recentPosts || []} />
          
          {/* Footer Metadata */}
          <footer className="mt-24 flex flex-wrap items-center justify-between gap-6 border-t border-brand-orange/10 pt-8 text-xs text-foreground/45">
            <span>Ban biên tập KingDragonHub</span>
            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-orange/60">
              <span>Kết thúc bài viết</span>
              <div className="h-px w-10 bg-brand-orange/30" />
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}
