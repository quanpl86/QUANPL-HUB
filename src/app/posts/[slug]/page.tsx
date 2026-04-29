import React from 'react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';

interface PostPageProps {
  params: { slug: string };
}

// 1. Tự động tạo Metadata cho SEO (Dynamic Metadata)
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
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
import { CommentSection } from '@/components/blog/CommentSection';
import { headers } from 'next/headers';

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
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
      name: post.profiles?.full_name || 'QuanPL',
    },
    publisher: {
      '@type': 'Organization',
      name: 'QUAN-PL BLOG-HUB',
      logo: {
        '@type': 'ImageObject',
        url: 'https://quanpl-hub.com/logo.png'
      }
    },
    datePublished: post.created_at,
    description: post.excerpt,
  };

  return (
    <article className="min-h-screen pb-20 bg-background text-foreground selection:bg-brand-orange selection:text-white">
      <JsonLd data={articleSchema} />
      
      {/* Hero Header Full-width */}
      <div className="relative h-[80vh] min-h-[600px] w-full overflow-hidden border-b border-brand-orange/20 bg-cyber-black">
        {post.image_url ? (
          <img 
            src={post.image_url} 
            alt={post.title} 
            className="w-full h-full object-cover opacity-60 dark:opacity-50"
          />
        ) : (
          <div className="w-full h-full bg-cyber-black flex items-center justify-center">
            <div className="cyber-glow-text opacity-5 font-orbitron text-[15vw] select-none uppercase tracking-tighter">QUAN-PL</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-6 pb-24">
            <div className="max-w-5xl">
              <div className="flex items-center gap-8 mb-12 animate-fade-in-up">
                <span className="px-6 py-2 bg-brand-orange text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-sm shadow-[0_5px_15px_rgba(249,115,22,0.4)]">
                  {(Array.isArray(post.categories) ? (post.categories as any)[0]?.name : (post.categories as any)?.name) || 'REDACTED'}
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-brand-orange/40"></div>
                  <span className="text-[11px] font-mono text-foreground font-bold tracking-[0.4em]">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'NEURAL_LINK_PENDING'}
                  </span>
                </div>
              </div>
              <h1 className="font-orbitron font-bold text-6xl md:text-8xl text-foreground mb-10 leading-[1] drop-shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] uppercase tracking-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 mt-12 group">
                <div className="w-14 h-14 rounded-full border-2 border-brand-orange/40 flex items-center justify-center bg-background/80 backdrop-blur-md shadow-lg">
                  <span className="font-orbitron text-brand-orange font-bold text-lg">Q</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-brand-orange/80 dark:text-brand-orange/60 tracking-[0.3em] mb-1 font-black">AUTHORISED BY:</span>
                  <span className="text-sm font-orbitron text-foreground tracking-widest uppercase font-bold">
                    {(Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'QUAN PL ADMIN'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 mt-32">
        <div className="max-w-4xl mx-auto">
          {/* Post Excerpt/Lead */}
          {post.excerpt && (
            <div className="mb-24 relative group">
              <div className="absolute -left-12 top-0 bottom-0 w-2 bg-brand-orange/60 shadow-[0_0_20px_rgba(255,87,34,0.2)] transform -skew-x-12 transition-all group-hover:w-3"></div>
              <p className="text-3xl md:text-4xl font-sans text-foreground/80 leading-relaxed font-light pl-6 tracking-wide italic">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Dynamic Content from Tiptap v3 / Markdown */}
          <section 
            className="king-dragon-content prose prose-brand max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
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
          <footer className="mt-32 pt-12 border-t border-brand-orange/10 flex flex-wrap gap-12 justify-between items-center text-foreground/70 dark:text-muted font-mono text-[11px] uppercase tracking-[0.2em]">
            <div className="flex flex-col gap-2">
              <span className="text-brand-orange/80 dark:text-brand-orange/60 font-bold">SOURCE_ENCRYPTION_HASH:</span>
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
