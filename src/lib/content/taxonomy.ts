import type { PackageIssue } from "./article-package";

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  subject_id?: number | null;
  subject?: { id: number; name: string; slug: string; field_id?: number | null } | null;
  field?: { id: number; name: string; slug: string } | null;
};

export type TaxonomyResolution = {
  category_id: number;
  category: CategoryRow & { created: boolean };
  tags: string[];
  keywords: string[];
  warnings: PackageIssue[];
};

export const CATEGORY_ALIASES: Record<string, string[]> = {
  "stem-education": ["stem", "steam", "khoa hoc", "ky thuat", "toan", "giao duc", "hoc lieu"],
  "project-based-learning": ["pbl", "du an", "san pham hoc tap", "project based"],
  "instructional-models": ["5e", "inquiry", "bloom", "ngss", "mo hinh giang day"],
  "early-childhood-education": ["mam non", "tre nho", "early childhood", "play based", "choi ma hoc"],
  "teacher-development": ["giao vien", "boi duong", "soan giang", "professional development", "workflow giao vien"],
  "artificial-intelligence": ["ai", "machine learning", "tri tue nhan tao", "neural", "ml"],
  "ai-in-education": ["ai trong giao duc", "ai giao duc", "ai hoc lieu", "ai day hoc"],
  "generative-ai-tools": ["chatgpt", "generative", "prompt", "llm", "tao sinh"],
  "robotics-hardware": ["robot", "ev3", "spike", "arduino", "hardware", "mach dien", "cam bien"],
  "competition-robotics": ["wro", "ftc", "thi dau", "competition"],
  "fullstack-development": ["fullstack", "full-stack", "nextjs", "web", "frontend", "backend"],
  "scratch-block-coding": ["scratch", "blockly", "lap trinh khoi", "block coding"],
  "python-for-education": ["python", "cham bai python"],
  "computer-science-education": ["tin hoc", "csta", "thuat toan", "computer science"],
  "learning-assessment": ["rubric", "danh gia", "assessment", "bang chung hoc tap"],
  "3d-design-printing": ["3d", "in 3d", "cad", "blender", "thiet ke 3d"],
  "multimedia-for-learning": ["infographic", "video bai giang", "multimedia", "hoc lieu hinh anh"],
};

export const CATEGORY_TAG_HINTS: Record<string, string[]> = {
  "stem-education": ["STEM", "giáo dục STEM", "học liệu"],
  "project-based-learning": ["PBL", "dự án học tập"],
  "instructional-models": ["5E", "Bloom", "NGSS"],
  "early-childhood-education": ["mầm non", "chơi mà học", "học liệu tuổi nhỏ"],
  "teacher-development": ["giáo viên", "soạn giảng", "bồi dưỡng"],
  "ai-in-education": ["AI trong giáo dục", "học liệu AI"],
  "generative-ai-tools": ["ChatGPT", "prompt", "AI tạo sinh"],
  "robotics-hardware": ["robot", "phần cứng"],
  "scratch-block-coding": ["Scratch", "lập trình khối"],
  "python-for-education": ["Python", "dạy lập trình"],
  "learning-assessment": ["rubric", "đánh giá"],
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
  if (category.slug === "early-childhood-education" && haystack.includes("mam non")) {
    score += 4;
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

export async function loadTaxonomyCatalog(supabase: { from: (table: string) => any }) {
  const fieldsRes = await supabase.from("fields").select("id, name, slug, description").order("name");
  const subjectsRes = await supabase.from("subjects").select("id, name, slug, description, field_id").order("name");
  let categoriesRes = await supabase
    .from("categories")
    .select("id, name, slug, description, subject_id")
    .order("name");
  if (categoriesRes.error && String(categoriesRes.error.message || "").includes("subject_id")) {
    categoriesRes = await supabase.from("categories").select("id, name, slug, description").order("name");
  }

  if (fieldsRes.error) throw new Error(`DATABASE_ERROR: ${fieldsRes.error.message}`);
  if (subjectsRes.error) throw new Error(`DATABASE_ERROR: ${subjectsRes.error.message}`);
  if (categoriesRes.error) throw new Error(`DATABASE_ERROR: ${categoriesRes.error.message}`);

  const fields = fieldsRes.data || [];
  const subjects = subjectsRes.data || [];
  const categories = (categoriesRes.data || []) as CategoryRow[];
  const fieldById = new Map(fields.map((item: any) => [item.id, item]));
  const subjectById = new Map(subjects.map((item: any) => [item.id, item]));

  const hydrated = categories.map((category) => {
    const subject = category.subject_id ? subjectById.get(category.subject_id) : null;
    const field = subject?.field_id ? fieldById.get(subject.field_id) : null;
    return {
      ...category,
      subject: subject ? { id: subject.id, name: subject.name, slug: subject.slug, field_id: subject.field_id } : null,
      field: field ? { id: field.id, name: field.name, slug: field.slug } : null,
    };
  });

  const tree = fields.map((field: any) => ({
    ...field,
    type: "field",
    subjects: subjects
      .filter((subject: any) => subject.field_id === field.id)
      .map((subject: any) => ({
        ...subject,
        type: "subject",
        categories: hydrated
          .filter((category) => category.subject_id === subject.id)
          .map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            type: "category",
            suggested_tags: CATEGORY_TAG_HINTS[category.slug] || [],
          })),
      })),
  }));

  return { fields, subjects, categories: hydrated, tree };
}

export async function resolvePostTaxonomy(
  supabase: { from: (table: string) => any },
  input: {
    category_id?: unknown;
    category?: unknown;
    subject?: unknown;
    field?: unknown;
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
  const catalog = await loadTaxonomyCatalog(supabase);
  let pool = catalog.categories;

  const requestedSubject = typeof input.subject === "string" ? foldTaxonomyText(input.subject) : "";
  if (requestedSubject) {
    const subject = catalog.subjects.find((item: any) =>
      foldTaxonomyText(item.name) === requestedSubject || item.slug === slugifyTaxonomy(String(input.subject))
    );
    if (subject) {
      const scoped = pool.filter((item) => item.subject_id === subject.id);
      if (scoped.length > 0) pool = scoped;
    }
  }

  const haystack = buildTaxonomyHaystack({
    ...input,
    category: [input.category, input.subject, input.field].filter(Boolean).join(" "),
  });
  const matched = pickExistingCategory(pool, {
    category_id: input.category_id,
    category: input.category,
    haystack,
  }) || pickExistingCategory(catalog.categories, {
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
    const parentSubject = pickSubjectForNewCategory(catalog.subjects, haystack, input.subject);
    const createdCategory = await createCategory(supabase, requestedName, catalog.categories, parentSubject?.id);
    category = createdCategory;
    created = true;
    warnings.push({
      code: "CATEGORY_CREATED",
      message: `Created category "${category.name}" (${category.slug})`,
    });
  }

  const hintTags = CATEGORY_TAG_HINTS[category.slug] || [];
  const tags = deriveTags({
    tags: [...(Array.isArray(input.tags) ? input.tags : []), ...hintTags],
    seo: input.seo,
  });
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

function pickSubjectForNewCategory(
  subjects: Array<{ id: number; name: string; slug: string }>,
  haystack: string,
  requested?: unknown
) {
  if (typeof requested === "string" && requested.trim()) {
    const folded = foldTaxonomyText(requested);
    const exact = subjects.find((item) =>
      foldTaxonomyText(item.name) === folded || item.slug === slugifyTaxonomy(requested)
    );
    if (exact) return exact;
  }
  let best: { item: { id: number; name: string; slug: string }; score: number } | null = null;
  for (const item of subjects) {
    let score = 0;
    if (haystack.includes(foldTaxonomyText(item.name))) score += 4;
    if (haystack.includes(item.slug.replace(/-/g, " "))) score += 3;
    if (!best || score > best.score) best = { item, score };
  }
  return best && best.score > 0 ? best.item : subjects.find((item) => item.slug === "pedagogy") || subjects[0];
}

async function createCategory(
  supabase: { from: (table: string) => any },
  name: string,
  existing: CategoryRow[],
  subjectId?: number
): Promise<CategoryRow> {
  let slug = slugifyTaxonomy(name);
  const slugs = new Set(existing.map((item) => item.slug));
  if (slugs.has(slug)) {
    let i = 2;
    while (slugs.has(`${slug}-${i}`)) i += 1;
    slug = `${slug}-${i}`;
  }

  const payload: Record<string, unknown> = {
    name,
    slug,
    description: `Danh mục được Editorial Agent tạo cho nhóm nội dung: ${name}`,
  };
  if (subjectId != null) payload.subject_id = subjectId;

  let { data, error } = await supabase
    .from("categories")
    .insert([payload])
    .select("id, name, slug, description, subject_id")
    .single();

  if (error && String(error.message || "").includes("subject_id")) {
    delete payload.subject_id;
    const fallback = await supabase
      .from("categories")
      .insert([payload])
      .select("id, name, slug, description")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
  return data as CategoryRow;
}
