import { EditorialPolicy } from './editorial-policy.types';

export const DEFAULT_EDITORIAL_POLICY: EditorialPolicy = {
  policy_version: "2026.08",
  policy_status: "ACTIVE",
  language: "vi-VN",
  
  editorial: {
    primary_language: "vi-VN",
    voice: ["chuyên gia", "phân tích", "thực tiễn", "dễ hiểu"],
    tone: {
      professional: true,
      evidence_based: true,
      avoid_hype: true,
      avoid_clickbait: true
    },
    audience: [
      "giáo viên",
      "chuyên gia giáo dục",
      "phụ huynh",
      "người làm công nghệ",
      "nhà phát triển STEM"
    ],
    requirements: {
      explain_technical_terms: true,
      distinguish_fact_from_opinion: true,
      state_uncertainty: true
    }
  },

  source_policy: {
    minimum_sources: 5,
    preferred_sources: [
      "peer_reviewed_research",
      "systematic_review",
      "meta_analysis",
      "government",
      "standards_body",
      "university",
      "research_institute",
      "official_documentation",
      "recognized_domain_expert"
    ],
    source_tiers: {
      A: ["peer_reviewed_research", "systematic_review", "government", "official_standard"],
      B: ["university", "research_institute", "official_technical_documentation", "expert_primary_source"],
      C: ["industry_report", "reputable_professional_organization"],
      D: ["secondary_blog", "aggregator"]
    },
    rules: {
      prefer_primary_source: true,
      major_claim_requires_authoritative_source: true,
      cross_verify_major_claims: true,
      avoid_source_laundering: true
    }
  },

  citation_policy: {
    citation_required_for: [
      "statistics",
      "research_findings",
      "scientific_claims",
      "standards",
      "frameworks",
      "historical_facts",
      "technical_specifications"
    ],
    requirements: {
      link_to_original_source: true,
      verify_source_accessibility: true,
      verify_claim_support: true,
      avoid_citation_padding: true
    },
    unsupported_major_claims_allowed: 0
  },

  seo: {
    required: true,
    search_intent_required: true,
    primary_keyword: { required: true },
    secondary_keywords: { required: true, min: 2, max: 8 },
    title: { recommended_max_chars: 60 },
    meta_description: { recommended_min_chars: 120, recommended_max_chars: 160 },
    requirements: {
      keyword_in_title: true,
      keyword_in_intro: true,
      semantic_keywords: true,
      descriptive_headings: true,
      canonical_slug: true,
      avoid_keyword_stuffing: true
    }
  },

  aio: {
    answer_first: true,
    tldr_required: true,
    key_takeaways: { required: true, min: 3, max: 7 },
    faq: { enabled: true, min: 3, max: 6 },
    requirements: {
      direct_answers: true,
      self_contained_sections: true,
      clear_entity_context: true,
      structured_information: true,
      fact_citation_proximity: true,
      avoid_ai_bait_language: true
    }
  },

  internal_linking: {
    required: true,
    minimum_links: 2,
    recommended_links: 4,
    maximum_links: 8,
    rules: {
      semantic_relevance_required: true,
      avoid_exact_match_overuse: true,
      avoid_duplicate_target: true,
      prefer_topic_cluster_links: true
    }
  },

  content_structure: {
    required_sections: [
      "tldr",
      "introduction",
      "main_content",
      "key_takeaways",
      "references"
    ],
    optional_sections: [
      "faq",
      "case_study",
      "implementation_guide",
      "comparison",
      "expert_commentary"
    ],
    requirements: {
      logical_heading_hierarchy: true,
      short_readable_paragraphs: true,
      examples_where_helpful: true,
      tables_only_when_useful: true
    }
  },

  quality_gate: {
    overall_min: 85,
    factual_accuracy_min: 95,
    source_quality_min: 90,
    seo_min: 80,
    aio_min: 80,
    editorial_min: 85,
    hard_fail_conditions: [
      "unsupported_major_claim",
      "fabricated_source",
      "fabricated_quote",
      "invalid_reference",
      "citation_does_not_support_claim",
      "duplicate_topic",
      "plagiarism_risk",
      "unsafe_or_defamatory_claim"
    ]
  }
};
