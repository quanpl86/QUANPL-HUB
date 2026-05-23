import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const revalidate = 3600; // Cache 1 hour

export async function GET() {
  const supabase = await getSupabaseServer();
  
  // Fetch 20 latest published posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('title, slug, excerpt, created_at, profiles(full_name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !posts) {
    return new NextResponse('Error fetching posts', { status: 500 });
  }

  const siteUrl = 'https://kingdragonhub.com';
  
  const rssItemsXml = posts.map(post => {
    const postUrl = `${siteUrl}/posts/${post.slug}`;
    const author = (Array.isArray(post.profiles) ? (post.profiles as any)[0]?.full_name : (post.profiles as any)?.full_name) || 'KING DRAGON';
    
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <author><![CDATA[${author}]]></author>
    </item>`;
  }).join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>KING DRAGON HUB</title>
      <link>${siteUrl}</link>
      <description>Matrix thông tin dành cho những nhà khai phá AI, Robotics và Lập trình.</description>
      <language>vi</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
      ${rssItemsXml}
    </channel>
  </rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
