import { ExploreContent } from '@/components/layout/ExploreContent';
import { getPublicCategories, getPublicPostIndex, matchesPostQuery } from '@/lib/content/public-content';

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
  const field = params.field as string;

  const [categories, posts] = await Promise.all([
    getPublicCategories(),
    getPublicPostIndex(),
  ]);

  const filteredPosts = posts.filter(post => {
    let match = true;
    if (q) match = match && matchesPostQuery(post, q);
    if (category && category !== 'all') {
      match = match && post.categories?.slug === category;
    }
    if (field && field !== 'all') {
      const postCategory = post.categories as unknown as {
        subjects?: { fields?: { slug?: string } | null } | null;
      } | null;
      match = match && postCategory?.subjects?.fields?.slug === field;
    }
    if (tag) {
      match = match && isTagMatch(post.tags || [], tag);
    }
    return match;
  });

  return (
    <div>
      <ExploreContent 
        initialPosts={filteredPosts} 
        categories={categories}
        title={
          <><p className="editorial-kicker">Kho nội dung</p><h1 key="blog-header-title" className="editorial-title mt-4 !text-4xl md:!text-6xl">Thư viện tri thức</h1></>
        }
        subtitle={tag ? `Đang lọc theo thẻ: ${tag}` : "Tìm bài viết theo lĩnh vực, danh mục hoặc mục tiêu học tập."}
        variant="archive"
      />
    </div>
  );
}
