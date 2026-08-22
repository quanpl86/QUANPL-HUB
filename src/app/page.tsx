import { HeroSection } from "@/components/layout/HeroSection";
import { ExploreContent } from '@/components/layout/ExploreContent';
import { StartHereSection } from '@/components/layout/StartHereSection';
import { KnowledgeGateway } from '@/components/layout/KnowledgeGateway';
import { getPublicCategories, getPublicPostIndex, matchesPostQuery } from '@/lib/content/public-content';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = params.q as string;
  const category = params.category as string;
  const field = params.field as string;

  const [categories, posts] = await Promise.all([
    getPublicCategories(),
    getPublicPostIndex(),
  ]);

  // Filter posts where category match (supabase-js filter on joined table can be tricky)
  const filteredPosts = posts.filter(post => {
    const postCategory = post.categories as unknown as {
      slug?: string;
      subjects?: { fields?: { slug?: string } | null } | null;
    } | null;
    if (category && category !== 'all' && postCategory?.slug !== category) return false;
    if (field && field !== 'all' && postCategory?.subjects?.fields?.slug !== field) return false;
    if (q && !matchesPostQuery(post, q)) return false;
    return true;
  }).slice(0, 9);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <StartHereSection />
      <KnowledgeGateway />
      
      <ExploreContent 
        initialPosts={filteredPosts} 
        categories={categories}
        subtitle="Bài viết chuyên sâu, hướng dẫn thực hành và các nội dung mới nhất."
        variant="homepage"
      />
    </div>
  );
}
