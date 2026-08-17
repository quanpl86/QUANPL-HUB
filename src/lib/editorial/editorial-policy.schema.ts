import { z } from 'zod';

export const EditorialSchema = z.object({
  primary_language: z.string(),
  voice: z.array(z.string()),
  tone: z.object({
    professional: z.boolean(),
    evidence_based: z.boolean(),
    avoid_hype: z.boolean(),
    avoid_clickbait: z.boolean(),
  }),
  audience: z.array(z.string()),
  requirements: z.object({
    explain_technical_terms: z.boolean(),
    distinguish_fact_from_opinion: z.boolean(),
    state_uncertainty: z.boolean(),
  }),
});

export const SourcePolicySchema = z.object({
  minimum_sources: z.number(),
  preferred_sources: z.array(z.string()),
  source_tiers: z.object({
    A: z.array(z.string()),
    B: z.array(z.string()),
    C: z.array(z.string()),
    D: z.array(z.string()),
  }),
  rules: z.object({
    prefer_primary_source: z.boolean(),
    major_claim_requires_authoritative_source: z.boolean(),
    cross_verify_major_claims: z.boolean(),
    avoid_source_laundering: z.boolean(),
  })
});

export const CitationPolicySchema = z.object({
  citation_required_for: z.array(z.string()),
  requirements: z.object({
    link_to_original_source: z.boolean(),
    verify_source_accessibility: z.boolean(),
    verify_claim_support: z.boolean(),
    avoid_citation_padding: z.boolean(),
  }),
  unsupported_major_claims_allowed: z.number().max(0),
});

export const SeoSchema = z.object({
  required: z.boolean(),
  search_intent_required: z.boolean(),
  primary_keyword: z.object({ required: z.boolean() }),
  secondary_keywords: z.object({ required: z.boolean(), min: z.number(), max: z.number() }),
  title: z.object({ recommended_max_chars: z.number() }),
  meta_description: z.object({ recommended_min_chars: z.number(), recommended_max_chars: z.number() }),
  requirements: z.object({
    keyword_in_title: z.boolean(),
    keyword_in_intro: z.boolean(),
    semantic_keywords: z.boolean(),
    descriptive_headings: z.boolean(),
    canonical_slug: z.boolean(),
    avoid_keyword_stuffing: z.boolean(),
  })
});

export const AioSchema = z.object({
  answer_first: z.boolean(),
  tldr_required: z.boolean(),
  key_takeaways: z.object({ required: z.boolean(), min: z.number(), max: z.number() }),
  faq: z.object({ enabled: z.boolean(), min: z.number(), max: z.number() }),
  requirements: z.object({
    direct_answers: z.boolean(),
    self_contained_sections: z.boolean(),
    clear_entity_context: z.boolean(),
    structured_information: z.boolean(),
    fact_citation_proximity: z.boolean(),
    avoid_ai_bait_language: z.boolean(),
  })
});

export const InternalLinkingSchema = z.object({
  required: z.boolean(),
  minimum_links: z.number(),
  recommended_links: z.number(),
  maximum_links: z.number(),
  rules: z.object({
    semantic_relevance_required: z.boolean(),
    avoid_exact_match_overuse: z.boolean(),
    avoid_duplicate_target: z.boolean(),
    prefer_topic_cluster_links: z.boolean(),
  })
});

export const ContentStructureSchema = z.object({
  required_sections: z.array(z.string()),
  optional_sections: z.array(z.string()),
  requirements: z.object({
    logical_heading_hierarchy: z.boolean(),
    short_readable_paragraphs: z.boolean(),
    examples_where_helpful: z.boolean(),
    tables_only_when_useful: z.boolean(),
  })
});

export const QualityGateSchema = z.object({
  overall_min: z.number(),
  factual_accuracy_min: z.number(),
  source_quality_min: z.number(),
  seo_min: z.number(),
  aio_min: z.number(),
  editorial_min: z.number(),
  hard_fail_conditions: z.array(z.string()),
});

export const EditorialPolicySchema = z.object({
  policy_version: z.string(),
  policy_status: z.string().optional(),
  language: z.string().optional(),
  editorial: EditorialSchema,
  source_policy: SourcePolicySchema,
  citation_policy: CitationPolicySchema,
  seo: SeoSchema,
  aio: AioSchema,
  internal_linking: InternalLinkingSchema,
  content_structure: ContentStructureSchema,
  quality_gate: QualityGateSchema,
});
