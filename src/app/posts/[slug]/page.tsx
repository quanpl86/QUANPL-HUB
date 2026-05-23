import React from 'react';
import { getSupabaseServer } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import Image from 'next/image';
import { sanitize } from '@/lib/sanitize';

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
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.image_url ? [post.image_url] : [],
      type: 'article',
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
    .select('*, profiles(full_name), categories(name)')
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

  // Dữ liệu cấu trúc bài viết (Article Schema)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.image_url,
    author: {
      '@type': 'Person',
      name: (Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'KING DRAGON',
    },
    publisher: {
      '@type': 'Organization',
      name: 'KING DRAGON HUB',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kingdragonhub.com/logo.png'
      }
    },
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    description: post.excerpt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kingdragonhub.com/posts/${slug}`
    }
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
    <article className="min-h-screen pb-20 bg-background text-foreground selection:bg-brand-orange selection:text-white">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      
      {/* Editorial Header */}
      <div className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Date */}
          <div className="tech-mono text-sm tracking-widest text-foreground/60 mb-6 uppercase">
            {post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'NEURAL_LINK_PENDING'}
          </div>

          {/* Title */}
          <h1 className="cyber-h1 !text-5xl md:!text-6xl lg:!text-7xl mb-12 text-foreground leading-[1.1]">
            {post.title}
          </h1>

          {/* Metadata Row: Author & Categories */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-brand-orange/30 flex items-center justify-center bg-brand-orange/10 overflow-hidden">
                <span className="font-orbitron text-brand-orange font-bold text-sm">Q</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-be-vietnam font-bold text-foreground">
                  {(Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'KING DRAGON ADMIN'}
                </span>
                <span className="text-foreground/40 hidden md:inline">•</span>
                <span className="tech-mono text-xs text-foreground/50 hidden md:inline tracking-wider">AUTHORISED</span>
              </div>
            </div>

            {/* Categories / Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 text-xs tech-mono font-bold uppercase border border-foreground/20 rounded-full text-foreground/80 hover:border-brand-orange/50 transition-colors">
                {(Array.isArray(post.categories) ? (post.categories as any)[0]?.name : (post.categories as any)?.name) || 'REDACTED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image as a Poster */}
      {post.image_url && (
        <div className="container mx-auto px-6 mb-16 md:mb-24">
          <div className="relative aspect-video w-full max-w-[1200px] mx-auto overflow-hidden bg-cyber-black/5 border border-brand-orange/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <Image 
              src={post.image_url} 
              alt={post.seo_keywords?.image_alt || post.title} 
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              className="object-cover"
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

          {/* Dynamic Content from Tiptap v3 / Markdown */}
          <section 
            className="king-dragon-content prose prose-brand max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitize(post.content || '') }}
          />

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
