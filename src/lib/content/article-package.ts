import { ARTICLE_ASSET_HARD_RULE } from "./article-asset-rule.ts";

export const ARTICLE_PACKAGE_SCHEMA_VERSION = "article-package/7.0";
export const ARTICLE_INLINE_IMAGE_MIN = ARTICLE_ASSET_HARD_RULE.inline_exact;
export const ARTICLE_INLINE_IMAGE_MAX = ARTICLE_ASSET_HARD_RULE.inline_exact;
export const ARTICLE_REQUIRED_INLINE_IDS = ARTICLE_ASSET_HARD_RULE.required_inline_ids;

export const INLINE_IMAGE_PURPOSES = [
  "concept_diagram",
  "workflow",
  "comparison",
  "case_study",
  "explainer",
] as const;

export type InlineImagePurpose = (typeof INLINE_IMAGE_PURPOSES)[number];

export type FeaturedImage = {
  purpose: "article_cover";
  prompt: string;
  alt: string;
  caption?: string;
  suggested_filename?: string;
  url?: string | null;
};

export type InlineImage = {
  id: string;
  purpose: InlineImagePurpose;
  position?: {
    placeholder?: string;
    after_heading_id?: string;
  };
  prompt: string;
  alt: string;
  caption?: string;
  suggested_filename?: string;
  url?: string | null;
};

export type SearchIntentV7 = {
  primary: string;
  secondary_questions?: string[];
};

export type NormalizedArticlePackage = {
  schema_version: typeof ARTICLE_PACKAGE_SCHEMA_VERSION;
  task_id: string | null;
  idempotency_key: string;
  policy_version: string;
  policy_hash: string;
  title: string;
  slug: string;
  excerpt: string;
  category_id?: string;
  tags?: string[];
  featured_image: FeaturedImage | null;
  featured_image_source: "v7_object" | "v6_string" | "missing";
  inline_images: InlineImage[];
  seo: {
    title: string;
    description: string;
    primary_keyword: string;
    secondary_keywords: string[];
    search_intent?: SearchIntentV7;
    semantic_entities?: string[];
  };
  aio: {
    direct_answer?: string;
    tldr: string;
    key_takeaways: string[];
    faq: Array<{ question: string; answer: string }>;
  };
  content_markdown: string;
  references: Array<{ title: string; url: string; source_type: string }>;
  internal_links: Array<{ post_id: string; anchor: string }>;
  schema_org?: Record<string, unknown>;
  quality: {
    overall: number;
    factual_accuracy: number;
    source_quality: number;
    seo: number;
    aio: number;
    editorial: number;
    hard_fail_conditions: string[];
  };
};

export type PackageIssue = {
  code: string;
  message: string;
  image_id?: string;
};

const INLINE_ID_RE = /^[A-Za-z0-9_-]+$/;
const INLINE_PURPOSE_SET = new Set<string>(INLINE_IMAGE_PURPOSES);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return asString(value);
}

export function normalizeFeaturedImage(
  featuredImage: unknown,
  featuredImageAlt?: unknown,
  featuredImageUrl?: unknown
): { image: FeaturedImage | null; source: NormalizedArticlePackage["featured_image_source"] } {
  if (typeof featuredImage === "string" || (featuredImage == null && typeof featuredImageUrl === "string")) {
    const url = (typeof featuredImage === "string" ? featuredImage : String(featuredImageUrl)).trim();
    return {
      source: "v6_string",
      image: {
        purpose: "article_cover",
        prompt: "",
        alt: typeof featuredImageAlt === "string" ? featuredImageAlt : "",
        url: url === "" ? null : url,
      },
    };
  }

  const rec = asRecord(featuredImage);
  if (!rec) {
    return { image: null, source: "missing" };
  }

  return {
    source: "v7_object",
    image: {
      purpose: rec.purpose === "article_cover" ? "article_cover" : (rec.purpose as FeaturedImage["purpose"]),
      prompt: asString(rec.prompt) ?? "",
      alt: asString(rec.alt) ?? (typeof featuredImageAlt === "string" ? featuredImageAlt : ""),
      caption: asString(rec.caption),
      suggested_filename: asString(rec.suggested_filename),
      url: asNullableString(rec.url) ?? null,
    },
  };
}

export function normalizeInlineImages(raw: unknown): InlineImage[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const rec = asRecord(item) ?? {};
    const positionRec = asRecord(rec.position);
    return {
      id: asString(rec.id) ?? "",
      purpose: rec.purpose as InlineImagePurpose,
      position: positionRec
        ? {
            placeholder: asString(positionRec.placeholder),
            after_heading_id: asString(positionRec.after_heading_id),
          }
        : undefined,
      prompt: asString(rec.prompt) ?? "",
      alt: asString(rec.alt) ?? "",
      caption: asString(rec.caption),
      suggested_filename: asString(rec.suggested_filename),
      url: asNullableString(rec.url) ?? null,
    };
  });
}

export function normalizeArticlePackage(draftData: any): NormalizedArticlePackage {
  const { image, source } = normalizeFeaturedImage(
    draftData?.featured_image,
    draftData?.featured_image_alt,
    draftData?.featured_image_url
  );

  const faq = Array.isArray(draftData?.aio?.faq)
    ? draftData.aio.faq.map((item: any) => ({
        question: String(item?.question ?? ""),
        answer: String(item?.answer ?? ""),
      }))
    : [];

  return {
    schema_version: ARTICLE_PACKAGE_SCHEMA_VERSION,
    task_id: draftData?.task_id ?? null,
    idempotency_key: String(draftData?.idempotency_key ?? ""),
    policy_version: String(draftData?.policy_version ?? ""),
    policy_hash: String(draftData?.policy_hash ?? ""),
    title: String(draftData?.title ?? ""),
    slug: String(draftData?.slug ?? ""),
    excerpt: String(draftData?.excerpt ?? ""),
    category_id: draftData?.category_id,
    tags: Array.isArray(draftData?.tags) ? draftData.tags : undefined,
    featured_image: image,
    featured_image_source: source,
    inline_images: normalizeInlineImages(draftData?.inline_images),
    seo: {
      title: String(draftData?.seo?.title ?? ""),
      description: String(draftData?.seo?.description ?? ""),
      primary_keyword: String(draftData?.seo?.primary_keyword ?? ""),
      secondary_keywords: Array.isArray(draftData?.seo?.secondary_keywords)
        ? draftData.seo.secondary_keywords
        : [],
      search_intent: draftData?.seo?.search_intent,
      semantic_entities: draftData?.seo?.semantic_entities,
    },
    aio: {
      direct_answer: asString(draftData?.aio?.direct_answer),
      tldr: String(draftData?.aio?.tldr ?? ""),
      key_takeaways: Array.isArray(draftData?.aio?.key_takeaways)
        ? draftData.aio.key_takeaways.map(String)
        : [],
      faq,
    },
    content_markdown: String(draftData?.content_markdown ?? ""),
    references: Array.isArray(draftData?.references) ? draftData.references : [],
    internal_links: Array.isArray(draftData?.internal_links) ? draftData.internal_links : [],
    schema_org: draftData?.schema_org,
    quality: draftData?.quality ?? {
      overall: 0,
      factual_accuracy: 0,
      source_quality: 0,
      seo: 0,
      aio: 0,
      editorial: 0,
      hard_fail_conditions: [],
    },
  };
}

export function validateArticlePackage(
  pkg: NormalizedArticlePackage,
  options: { requireV7Fields?: boolean } = {}
): { errors: PackageIssue[]; warnings: PackageIssue[] } {
  const errors: PackageIssue[] = [];
  const warnings: PackageIssue[] = [];
  const requireV7 = options.requireV7Fields === true;

  if (pkg.featured_image_source === "missing") {
    if (requireV7) {
      errors.push({
        code: "COVER_SPEC_MISSING",
        message: "featured_image spec is required",
      });
    } else {
      warnings.push({
        code: "COVER_SPEC_MISSING",
        message: "featured_image spec is missing; cover URL will be empty",
      });
    }
  } else if (pkg.featured_image_source === "v7_object") {
    const cover = pkg.featured_image;
    if (!cover || cover.purpose !== "article_cover") {
      errors.push({
        code: "COVER_PURPOSE_INVALID",
        message: "featured_image.purpose must be article_cover",
      });
    }
    if (!cover?.prompt?.trim()) {
      errors.push({
        code: "COVER_PROMPT_MISSING",
        message: "featured_image.prompt is required",
      });
    }
    if (!cover?.alt?.trim()) {
      errors.push({
        code: "COVER_ALT_MISSING",
        message: "featured_image.alt is required",
      });
    }
  }

  if (!hasPersistentImageUrl(pkg.featured_image?.url)) {
    errors.push({
      code: "COVER_URL_MISSING",
      image_id: "featured_image",
      message: "featured_image.url is required. Create the cover with ChatGPT Images, then pass its native file attachment to upload_generated_image_file.",
    });
  }

  if (pkg.inline_images.length > ARTICLE_INLINE_IMAGE_MAX) {
    errors.push({
      code: "INLINE_IMAGE_LIMIT",
      message: `inline_images may contain at most ${ARTICLE_INLINE_IMAGE_MAX} items`,
    });
  }

  const seenIds = new Set<string>();
  for (const image of pkg.inline_images) {
    if (!image.id || !INLINE_ID_RE.test(image.id)) {
      errors.push({
        code: "INLINE_ID_INVALID",
        message: `inline image id "${image.id}" is invalid`,
      });
      continue;
    }
    if (seenIds.has(image.id)) {
      errors.push({
        code: "INLINE_ID_DUPLICATE",
        message: `duplicate inline image id "${image.id}"`,
      });
    }
    seenIds.add(image.id);

    if (String(image.purpose) === "decoration") {
      errors.push({
        code: "INLINE_PURPOSE_DECORATION",
        message: `inline image "${image.id}" purpose decoration is not allowed`,
      });
    } else if (!INLINE_PURPOSE_SET.has(image.purpose)) {
      errors.push({
        code: "INLINE_PURPOSE_INVALID",
        message: `inline image "${image.id}" has invalid purpose "${image.purpose}"`,
      });
    }

    if (!image.prompt?.trim() || !image.alt?.trim()) {
      errors.push({
        code: "INLINE_SPEC_INCOMPLETE",
        message: `inline image "${image.id}" requires prompt and alt`,
      });
    }

    if (!hasPersistentImageUrl(image.url)) {
      errors.push({
        code: "INLINE_URL_MISSING",
        image_id: image.id,
        message: `inline image "${image.id}" url is required. ChatGPT Images: pass the native file attachment to upload_generated_image_file. Structured labels: generate_and_upload_blog_image SVG.`,
      });
    } else {
      const hasPlaceholder = pkg.content_markdown.includes(`{{IMAGE:${image.id}}}`);
      const hasHeading = Boolean(image.position?.after_heading_id?.trim());
      if (!hasPlaceholder && !hasHeading) {
        errors.push({
          code: "INLINE_POSITION_MISSING",
          image_id: image.id,
          message: `inline image "${image.id}" must appear via {{IMAGE:${image.id}}} or after_heading_id`,
        });
      }
    }

    if (!image.caption?.trim()) {
      warnings.push({
        code: "MEDIA_CAPTION_EMPTY",
        message: `inline image "${image.id}" has an empty caption`,
      });
    }
  }

  const readyInline = pkg.inline_images.filter((image) => hasPersistentImageUrl(image.url));
  const missingIds = ARTICLE_REQUIRED_INLINE_IDS.filter((id) => {
    const match = pkg.inline_images.find((image) => image.id === id);
    return !match || !hasPersistentImageUrl(match.url);
  });
  const coverReady = hasPersistentImageUrl(pkg.featured_image?.url);
  if (
    !coverReady
    || readyInline.length !== ARTICLE_INLINE_IMAGE_MIN
    || pkg.inline_images.length !== ARTICLE_INLINE_IMAGE_MIN
    || missingIds.length
  ) {
    errors.push({
      code: "IMAGE_SET_INCOMPLETE",
      message: JSON.stringify({
        error: "IMAGE_SET_INCOMPLETE",
        expected: { cover: 1, inline: ARTICLE_INLINE_IMAGE_MIN, ids: [...ARTICLE_ASSET_HARD_RULE.required_ids] },
        received: { cover: coverReady ? 1 : 0, inline: readyInline.length },
        missing: [...(coverReady ? [] : ["cover"]), ...missingIds],
      }),
    });
  }

  return { errors, warnings };
}

function hasPersistentImageUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function buildArticlePackageSnapshot(
  pkg: NormalizedArticlePackage,
  warnings: PackageIssue[]
) {
  return {
    schema_version: pkg.schema_version,
    featured_image: pkg.featured_image,
    inline_images: pkg.inline_images,
    seo: pkg.seo,
    aio: pkg.aio,
    references: pkg.references,
    internal_links: pkg.internal_links,
    quality: pkg.quality,
    warnings,
  };
}

export function formatPackageErrors(errors: PackageIssue[]): string {
  return errors.map((issue) => `${issue.code}: ${issue.message}`).join("; ");
}

export function dedupeIssues(issues: PackageIssue[]): PackageIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = issue.image_id
      ? `${issue.code}:${issue.image_id}`
      : `${issue.code}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
