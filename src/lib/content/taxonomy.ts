import type { PackageIssue } from "./article-package";

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

export type TaxonomyResolution = {
  category_id: number;
  category: CategoryRow & { created: boolean };
  tags: string[];
  keywords: string[];
  warnings: PackageIssue[];
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  "stem-education": ["stem", "giao duc", "giao vien", "mam non", "tieu hoc", "pbl", "5e", "ngss", "bloom", "hoc lieu", "bai hoc"],
  "artificial-intelligence": ["ai", "tri tue nhan tao", "machine learning", "chatgpt", "generative", "llm"],
  "robotics-hardware": ["robot", "robotics", "ev3", "spike", "arduino", "hardware", "mach dien"],
  "3d-design-printing": ["3d", "in 3d", "cad", "blender", "thiet ke 3d"],
  "fullstack-development": ["fullstack", "full-stack", "nextjs", "web", "lap trinh", "frontend", "backend"],
};

export function foldTaxonomyText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugifyTaxonomy(value: string): string {
  return foldTaxonomyText(value).replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) || "category";
}

export function parseCategoryId(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export function normalizeTagList(values: unknown, limit = 12): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of values) {
    const tag = String(raw || "").trim();
    if (!tag) continue;
    const key = foldTaxonomyText(tag);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= limit) break;
  }
  return tags;
}

export function scoreCategory(category: CategoryRow, haystack: string): number {
  const foldedName = foldTaxonomyText(category.name);
  const foldedSlug = foldTaxonomyText(category.slug.replace(/-/g, " "));
  let score = 0;
  if (foldedName && haystack.includes(foldedName)) score += 6;
  if (foldedSlug && haystack.includes(foldedSlug)) score += 5;
  for (const token of `${foldedName} ${foldedSlug}`.split(" ")) {
    if (token.length > 2 && haystack.includes(token)) score += 1;
  }
  for (const alias of CATEGORY_ALIASES[category.slug] || []) {
    if (haystack.includes(alias)) score += 3;
  }
  return score;
}

export function pickExistingCategory(
  categories: CategoryRow[],
  input: { category_id?: unknown; category?: unknown; haystack: string }
): { category: CategoryRow; score: number } | null {
  const requestedId = parseCategoryId(input.category_id);
  if (requestedId != null) {
    const exact = categories.find((item) => item.id === requestedId);
    if (exact) return { category: exact, score: 100 };
  }

  const requested = typeof input.category === "string" ? foldTaxonomyText(input.category) : "";
  if (requested) {
    const exact = categories.find((item) => {
      return foldTaxonomyText(item.name) === requested
        || foldTaxonomyText(item.slug.replace(/-/g, " ")) === requested
        || item.slug === slugifyTaxonomy(String(input.category));
    });
    if (exact) return { category: exact, score: 100 };
  }

  let best: { category: CategoryRow; score: number } | null = null;
  for (const category of categories) {
    const score = scoreCategory(category, input.haystack);
    if (!best || score > best.score) best = { category, score };
  }
  if (best && best.score >= 2) return best;
  return null;
}

export function buildTaxonomyHaystack(input: {
  title?: string;
  category?: unknown;
  tags?: unknown;
  seo?: {
    primary_keyword?: string;
    secondary_keywords?: string[];
    semantic_entities?: string[];
  };
}): string {
  const parts = [
    input.title,
    typeof input.category === "string" ? input.category : "",
    ...(Array.isArray(input.tags) ? input.tags : []),
    input.seo?.primary_keyword,
    ...(input.seo?.secondary_keywords || []),
    ...(input.seo?.semantic_entities || []),
  ];
  return foldTaxonomyText(parts.filter(Boolean).join(" "));
}

export function deriveTags(input: {
  tags?: unknown;
  seo?: {
    primary_keyword?: string;
    secondary_keywords?: string[];
    semantic_entities?: string[];
  };
}): string[] {
  const explicit = normalizeTagList(input.tags);
  if (explicit.length > 0) return explicit;
  return normalizeTagList([
    input.seo?.primary_keyword,
    ...(input.seo?.secondary_keywords || []),
    ...(input.seo?.semantic_entities || []),
  ]);
}

export function deriveKeywords(input: {
  tags: string[];
  seo?: {
    primary_keyword?: string;
    secondary_keywords?: string[];
  };
}): string[] {
  const seoTerms = normalizeTagList([
    input.seo?.primary_keyword,
    ...(input.seo?.secondary_keywords || []),
  ]);
  return seoTerms.length > 0 ? seoTerms : input.tags;
}

export async function resolvePostTaxonomy(
  supabase: { from: (table: string) => any },
  input: {
    category_id?: unknown;
    category?: unknown;
    title?: string;
    tags?: unknown;
    seo?: {
      primary_keyword?: string;
      secondary_keywords?: string[];
      semantic_entities?: string[];
    };
  }
): Promise<TaxonomyResolution> {
  const warnings: PackageIssue[] = [];
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name");
  if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);

  const categories = (data || []) as CategoryRow[];
  const haystack = buildTaxonomyHaystack(input);
  const matched = pickExistingCategory(categories, {
    category_id: input.category_id,
    category: input.category,
    haystack,
  });

  let category: CategoryRow;
  let created = false;

  if (matched) {
    category = matched.category;
  } else {
    const requestedName = typeof input.category === "string" && input.category.trim()
      ? input.category.trim()
      : input.seo?.primary_keyword?.trim() || "Chuyên mục mới";
    const createdCategory = await createCategory(supabase, requestedName, categories);
    category = createdCategory;
    created = true;
    warnings.push({
      code: "CATEGORY_CREATED",
      message: `Created category "${category.name}" (${category.slug})`,
    });
  }

  const tags = deriveTags(input);
  const keywords = deriveKeywords({ tags, seo: input.seo });
  if (tags.length === 0) {
    warnings.push({
      code: "TAGS_EMPTY",
      message: "No tags provided or derived",
    });
  }

  return {
    category_id: category.id,
    category: { ...category, created },
    tags,
    keywords,
    warnings,
  };
}

async function createCategory(
  supabase: { from: (table: string) => any },
  name: string,
  existing: CategoryRow[]
): Promise<CategoryRow> {
  let slug = slugifyTaxonomy(name);
  const slugs = new Set(existing.map((item) => item.slug));
  if (slugs.has(slug)) {
    let i = 2;
    while (slugs.has(`${slug}-${i}`)) i += 1;
    slug = `${slug}-${i}`;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert([{
      name,
      slug,
      description: `Danh mục được Editorial Agent tạo cho nhóm nội dung: ${name}`,
    }])
    .select("id, name, slug, description")
    .single();

  if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
  return data as CategoryRow;
}
