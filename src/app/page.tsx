import { HeroSection } from "@/components/layout/HeroSection";
import { getSupabaseServer } from '@/lib/supabase-server';
import { ExploreContent } from '@/components/layout/ExploreContent';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = params.q as string;
  const category = params.category as string;

  const supabase = await getSupabaseServer();

  // 1. Fetch Categories for the filter bar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  // 2. Build Post Query
  let query = supabase
    .from('posts')
    .select('*, categories(name, slug)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  if (category && category !== 'all') {
    query = query.filter('categories.slug', 'eq', category);
  }

  const { data: posts } = await query.limit(9);

  // Filter posts where category match (supabase-js filter on joined table can be tricky)
  const filteredPosts = posts?.filter(post => {
    if (!category || category === 'all') return true;
    return post.categories?.slug === category;
  }) || [];

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      
      <ExploreContent 
        initialPosts={filteredPosts} 
        categories={categories || []} 
        subtitle="KHỞI_ĐỘNG_HÀNH_TRÌNH_KHAI_PHÁ_DỮ_LIỆU"
      />
    </div>
  );
}
