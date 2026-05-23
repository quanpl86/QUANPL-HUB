import { getSupabaseServer } from '@/lib/supabase-server';
import { ExploreContent } from '@/components/layout/ExploreContent';

// Utility for smart/fuzzy tag matching
function removeAccents(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isTagMatch(postTags: string[], searchTag: string) {
  if (!postTags || !searchTag) return false;
  
  const normalizedSearch = removeAccents(searchTag).trim();
  if (!normalizedSearch) return false;

  return postTags.some(t => {
    const normalizedPostTag = removeAccents(t).trim();
    
    // 1. Substring match in either direction (e.g. "robot" matches "robotics", "ai" matches "generative ai")
    if (normalizedPostTag.includes(normalizedSearch) || normalizedSearch.includes(normalizedPostTag)) {
      return true;
    }
    
    // 2. Word-level similarity (e.g. "Giáo dục AI" matches "AI Giáo dục")
    const searchWords = normalizedSearch.split(/\s+/);
    const tagWords = normalizedPostTag.split(/\s+/);
    
    const significantSearchWords = searchWords.filter(w => w.length > 2);
    if (significantSearchWords.length > 0) {
      const matchCount = significantSearchWords.filter(sw => 
        tagWords.some(tw => tw.includes(sw) || sw.includes(tw))
      ).length;
      // If at least 50% of significant words match
      if (matchCount / significantSearchWords.length >= 0.5) return true;
    }

    return false;
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = params.q as string;
  const category = params.category as string;
  const tag = params.tag as string;

  const supabase = await getSupabaseServer();

  // 1. Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  // 2. Build Query
  let query = supabase
    .from('posts')
    .select('*, categories(name, slug), tags')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: posts } = await query;

  const filteredPosts = posts?.filter(post => {
    let match = true;
    if (category && category !== 'all') {
      match = match && post.categories?.slug === category;
    }
    if (tag) {
      match = match && isTagMatch(post.tags || [], tag);
    }
    return match;
  }) || [];

  return (
    <div>
      <ExploreContent 
        initialPosts={filteredPosts} 
        categories={categories || []}
        title={
          <h1 key="blog-header-title" className="cyber-h1 text-5xl mb-4">THƯ VIỆN <span className="cyber-text-gradient">TRI THỨC</span></h1>
        }
        subtitle={tag ? `ĐANG_LỌC_THEO_THẺ: ${tag.toUpperCase()}` : "TRUY_CẬP_KHO_KIẾN_THỨC_TOÀN_CẦU"}
      />
    </div>
  );
}
