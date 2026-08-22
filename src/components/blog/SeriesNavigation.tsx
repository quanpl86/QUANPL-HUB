'use client';

import React from 'react';
import Link from 'next/link';

interface PostInSeries {
  id: string;
  slug: string;
  title: string;
  created_at: string;
}

interface SeriesNavigationProps {
  seriesName: string;
  posts: PostInSeries[];
  currentPostId: string;
}

export function SeriesNavigation({ seriesName, posts, currentPostId }: SeriesNavigationProps) {
  if (!posts || posts.length < 2) return null;

  // Sort posts by date (ascending) to get chronological order in the series
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const currentIndex = sortedPosts.findIndex(p => p.id === currentPostId);
  if (currentIndex === -1) return null;

  const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  return (
    <div className="my-12 p-6 rounded-lg border border-brand-orange/20 bg-brand-orange/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-1 bg-brand-orange"></div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
          Chuỗi bài: <span className="text-brand-orange">{seriesName}</span>
        </h3>
      </div>
      
      <div className="space-y-3 mb-8">
        {sortedPosts.map((post, index) => (
          <Link 
            key={post.id} 
            href={`/posts/${post.slug}`}
            className={`flex items-start gap-4 p-3 rounded-md transition-all ${
              post.id === currentPostId 
                ? 'bg-brand-orange/10 border-l-2 border-brand-orange' 
                : 'hover:bg-foreground/5 opacity-70 hover:opacity-100'
            }`}
          >
            <div className={`tech-mono text-xs w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
              post.id === currentPostId ? 'bg-brand-orange text-white' : 'bg-foreground/10 text-foreground/50'
            }`}>
              {index + 1}
            </div>
            <div className="font-semibold text-sm line-clamp-2">
              {post.title}
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 border-t border-brand-orange/10 pt-6">
        {prevPost ? (
          <Link 
            href={`/posts/${prevPost.slug}`}
            className="flex-1 flex flex-col group p-4 border border-foreground/10 rounded-md hover:border-brand-orange transition-colors"
          >
            <span className="tech-mono text-[10px] text-foreground/50 mb-1 uppercase group-hover:text-brand-orange transition-colors">
              &laquo; BÀI TRƯỚC
            </span>
            <span className="font-semibold text-sm line-clamp-1">{prevPost.title}</span>
          </Link>
        ) : (
          <div className="flex-1"></div>
        )}

        {nextPost ? (
          <Link 
            href={`/posts/${nextPost.slug}`}
            className="flex-1 flex flex-col items-end text-right group p-4 border border-foreground/10 rounded-md hover:border-brand-orange transition-colors"
          >
            <span className="tech-mono text-[10px] text-foreground/50 mb-1 uppercase group-hover:text-brand-orange transition-colors">
              BÀI TIẾP THEO &raquo;
            </span>
            <span className="font-semibold text-sm line-clamp-1">{nextPost.title}</span>
          </Link>
        ) : (
          <div className="flex-1"></div>
        )}
      </div>
    </div>
  );
}
