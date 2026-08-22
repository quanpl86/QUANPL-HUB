export const COVER_PROMPT_STANDARD_VERSION = 'cover-standard/2.0';

export type ArticleCoverIntent = {
  topic: string;
  visual_intent: string;
  subject_context_action: string;
  primary_focus?: string;
  technology_cue?: string;
  avoid?: string[];
};

export const COVER_STANDARD = `KDH EDITORIAL COVER — CLEAN & CLEAR STANDARD

Apply these requirements to every KingDragonHub article cover.

Create a clean, clear, restrained 16:9 editorial cover image that works equally well as a full-width article hero and as a small 16:9 article-card thumbnail.

1. VISUAL PURPOSE
The image must communicate the article topic quickly through one clear visual idea. The cover is a visual introduction, not an infographic and not a poster. The article card already displays the title, description, category and metadata, so the image must not repeat textual information.

2. COMPOSITION
Use one primary visual idea, one clear focal subject, no more than one supporting subject, and at most one subtle symbolic or technological element. Keep the scene understandable within 1–2 seconds. Important subjects must remain inside the central 70–80% safe area. Keep approximately 20–35% of the frame visually quiet or low-detail. Keep the upper-left area relatively uncluttered for a category label. The main subject must remain clearly recognizable at approximately 480 × 270 pixels.

3. CLEAN & CLEAR REQUIREMENT
Prioritize clear subject-background separation, simple visual hierarchy, restrained environmental detail, believable spaces, natural depth, moderate contrast, moderate color saturation, soft or controlled lighting, intentional negative space, and one obvious first point of attention. The background must support the subject without competing with it. Do not fill empty areas merely for decoration.

4. COLOR TREATMENT
Use a restrained editorial palette with one dominant color family, one supporting accent color, and neutral environmental colors. Avoid excessive cyan-orange contrast, oversaturated colors, heavy neon, extreme HDR, competing accent colors, excessive lens flare, and strong glowing outlines. KingDragonHub orange or technology blue may appear only as subtle accents; neither is mandatory as a dominant color.

5. TECHNOLOGY REPRESENTATION
Technology must appear naturally within the scene. Prefer real devices, classroom displays, tablets, computers, physical robots, educational tools, or restrained abstract interface cues. Avoid generic AI clichés unless essential: glowing brains, dense neural networks, multiple floating holograms, rings of icons, dozens of interface panels, excessive circuits, generic humanoid robots, and futuristic sci-fi control rooms. Use no more than 0–2 subtle interface or symbolic technology elements.

6. HUMAN-CENTERED RULE
For education-related articles, prioritize real educational context: a teacher, student, classroom, learning activity, student work, or educational technology in use. AI and technology should normally support human activity rather than dominate it. People must appear natural, engaged and believable rather than posed like advertising models.

7. TEXT POLICY — HARD RULE
Do not include any visible text. No article title, subtitle, letters, numbers, captions, labels, logos, brand names, watermarks, readable application interfaces, charts with labels, signs, code, or UI text. If a screen or interface appears, use simple abstract visual elements with no readable words, letters or numbers.

8. DETAIL RESTRICTION
Avoid visually dense compositions. Do not create infographic-like covers, dashboards filled with panels, tables, timelines, diagrams, many small icons, many equal-priority subjects, highly detailed backgrounds, crowds unless essential, or unnecessary props. The viewer should not need to track more than 3–4 meaningful visual elements.

9. THUMBNAIL-FIRST REQUIREMENT
At approximately 480 × 270 pixels, the article topic must remain understandable, the primary subject must remain obvious, important subjects must not be cropped, the image must not become visually noisy, small details must not be necessary, the category overlay area must remain usable, and the image must not become a dark or oversaturated block. If the image works only at full resolution, it is not acceptable.

10. VISUAL DIFFERENTIATION
Avoid repeating the same composition, metaphor, dominant prop, camera angle, or lighting scheme used by recent KingDragonHub covers. In particular, do not repeatedly default to chess boards, hands moving chess pieces, circular AI interfaces, glowing AI heads, or blue-orange holographic scenes. Maintain consistent editorial quality without making different articles look like variations of one image.

11. OVERALL STYLE
Target clean editorial photography or realistic editorial illustration: contemporary, human-centered, intelligent, calm, professional, believable, visually restrained, and premium educational technology. Avoid overly cinematic, epic, spectacular, futuristic, sci-fi, cyberpunk, hyper-detailed, neon-heavy, or advertisement-like imagery.

12. TECHNICAL REQUIREMENTS
Landscape 16:9. Minimum 1536 × 864 pixels. Prefer an original high-resolution PNG. No text, logo, watermark, or artificial border. Composition must remain safe for responsive card display using aspect-ratio: 16 / 9 and object-fit: cover.

FINAL GENERATION INSTRUCTION
Create the simplest strong visual that communicates the article topic. When deciding whether to add an extra object, icon, effect, interface, or background detail, remove it unless it materially improves understanding of the article.`;

export const THUMBNAIL_SAFETY_RULES = `Thumbnail safety check: preview at 480 × 270 pixels. Confirm one obvious focal subject, central safe-area integrity, a quiet upper-left category-overlay area, strong foreground-background separation, no essential detail near crop edges, no embedded text, and no small detail required for meaning.`;

export const COVER_NEGATIVE_RULES = `Global negative guidance: no busy background, no crowded scene unless essential, no multi-panel composition, no collage, no infographic structure, no dense dashboard, no many floating screens, no dense holograms, no floating icon cloud, no tiny decorative details, no heavy sci-fi atmosphere, no neon overload, no excessive background objects, no readable text, and no competing focal points.`;

const STANDARD_MARKER = `[KDH_COVER_STANDARD:${COVER_PROMPT_STANDARD_VERSION}]`;

function formatAvoidList(avoid: string[] | undefined) {
  const cleaned = (avoid || []).map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? cleaned.map((item) => `- ${item}`).join('\n') : '- No additional article-specific restrictions.';
}

export function buildArticleCoverPrompt(intent: ArticleCoverIntent) {
  const requiredFields = [intent.topic, intent.visual_intent, intent.subject_context_action];
  if (requiredFields.some((value) => !value.trim())) {
    throw new Error('topic, visual_intent and subject_context_action are required');
  }

  const subjectLayer = [
    `Topic: ${intent.topic.trim()}`,
    `Scene / context / action: ${intent.subject_context_action.trim()}`,
    intent.primary_focus?.trim() ? `Primary focus: ${intent.primary_focus.trim()}` : null,
    intent.technology_cue?.trim() ? `Technology cue: ${intent.technology_cue.trim()}` : null,
  ].filter(Boolean).join('\n');

  return [
    STANDARD_MARKER,
    'ARTICLE VISUAL INTENT',
    intent.visual_intent.trim(),
    'SUBJECT / CONTEXT / ACTION',
    subjectLayer,
    COVER_STANDARD,
    THUMBNAIL_SAFETY_RULES,
    'ARTICLE-SPECIFIC THINGS TO AVOID',
    formatAvoidList(intent.avoid),
    COVER_NEGATIVE_RULES,
  ].join('\n\n');
}

export function buildCoverPrompt(topicPrompt: string) {
  const topicInstruction = topicPrompt.trim();
  if (topicInstruction.includes(STANDARD_MARKER)) return topicInstruction;

  return buildArticleCoverPrompt({
    topic: 'Use the supplied article-specific instruction as the authoritative topic.',
    visual_intent: 'Communicate the article topic through one simple, strong, human-centered editorial idea.',
    subject_context_action: topicInstruction,
  });
}

export function createArticleCoverNextAction(intent: ArticleCoverIntent) {
  return {
    next_action: {
      action: 'GENERATE_IMAGE',
      purpose: 'article_cover',
      aspect_ratio: '16:9',
      minimum_size: '1536x864',
      preferred_format: 'png',
      prompt: buildArticleCoverPrompt(intent),
    },
  };
}

export function getCoverPromptContract() {
  return {
    standard_version: COVER_PROMPT_STANDARD_VERSION,
    prompt_layers: [
      'ARTICLE VISUAL INTENT',
      'SUBJECT / CONTEXT / ACTION',
      'KDH CLEAN & CLEAR COVER STANDARD',
      'ARTICLE-SPECIFIC THINGS TO AVOID',
    ],
    composition: {
      aspect_ratio: '16:9',
      minimum_size: '1536x864',
      preferred_format: 'png',
      focal_subjects_max: 1,
      supporting_subjects_max: 1,
      meaningful_visual_elements_max: 4,
      quiet_frame_percentage: '20-35%',
      central_safe_area: '70-80%',
      upper_left_quiet_area: true,
      thumbnail_reference_size: '480x270',
    },
    cover_standard: COVER_STANDARD,
    cover_prompt_builder: '[article_visual_intent]\n\n[subject_context_action]\n\n[cover_standard]\n\n[article_specific_avoid]\n\n[global_negative_rules]',
    cover_negative_rules: COVER_NEGATIVE_RULES,
    thumbnail_safety_rules: THUMBNAIL_SAFETY_RULES,
    strict_text_policy: 'HARD RULE: no visible text, letters, numbers, labels, logos, watermarks, captions, code, signs, charts, or readable UI.',
    full_article_in_prompt: false,
  };
}
