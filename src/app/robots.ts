import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/login/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Claude-Web', 'anthropic-ai', 'PerplexityBot'],
        allow: '/',
      }
    ],
    sitemap: 'https://kingdragonhub.com/sitemap.xml',
  };
}
