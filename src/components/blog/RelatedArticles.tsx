import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CollapsibleTags } from './CollapsibleTags';
import { getVietnameseTaxonomyLabel } from '@/config/knowledge-taxonomy';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string;
  created_at: string;
  profiles: { full_name?: string | null } | { full_name?: string | null }[] | null;
  categories: { name?: string | null; slug?: string | null } | { name?: string | null; slug?: string | null }[] | null;
  tags?: string[];
}

interface RelatedArticlesProps {
  posts: Post[];
}

export function RelatedArticles({ posts }: RelatedArticlesProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-24 pt-16 border-t border-brand-orange/10">
      <h2 className="font-[family-name:var(--font-inter)] text-3xl md:text-4xl font-medium mb-10 text-foreground">Bài viết liên quan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => {
          // Extract Author Name
          const authorName = (Array.isArray(post.profiles) ? post.profiles[0]?.full_name : post.profiles?.full_name) || 'KING DRAGON Admin';
          
          // Extract Category
          const category = Array.isArray(post.categories) ? post.categories[0] : post.categories;
          const categoryName = getVietnameseTaxonomyLabel(category?.name, category?.slug);
          
          return (
            <Link key={post.id} href={`/posts/${post.slug}`} className="group flex flex-col h-full bg-transparent hover:bg-white/[0.02] transition-colors duration-300">
              {/* Cover Image */}
              <div className="relative aspect-[16/9] w-full mb-6 overflow-hidden bg-brand-orange/5 border border-brand-orange/10">
                {post.image_url ? (
                  <Image 
                    src={post.image_url} 
                    alt={post.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-foreground/45">Chưa có ảnh</div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex flex-col flex-1 px-2">
                <h3 className="font-[family-name:var(--font-inter)] text-[1.35rem] font-medium leading-tight text-foreground mb-3 group-hover:text-brand-orange transition-colors">
                  {post.title}
                </h3>
                
                <div className="text-foreground/70 text-sm mb-4">
                  {new Date(post.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                
                <div className="text-foreground text-sm font-semibold mb-4">
                  Tác giả: {authorName}
                </div>
                
                <p className="text-foreground/70 text-[0.95rem] line-clamp-3 mb-8 flex-1">
                  {post.excerpt}
                </p>
                
                {/* Categories / Tags */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="px-3 py-1.5 bg-foreground/5 border border-foreground/20 rounded-full text-[10px] tech-mono uppercase tracking-widest text-foreground/80 hover:bg-foreground/10 hover:border-foreground/40 transition-colors">
                    {categoryName}
                  </span>
                  <CollapsibleTags 
                    tags={post.tags || []} 
                    maxVisible={2} 
                    baseClassName="px-3 py-1.5 bg-foreground/5 border border-foreground/20 rounded-full text-[10px] tech-mono uppercase tracking-widest text-foreground/80 hover:bg-foreground/10 hover:border-foreground/40 transition-colors"
                    asLinks={false}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
