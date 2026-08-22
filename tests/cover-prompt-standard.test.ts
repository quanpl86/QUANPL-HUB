import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildArticleCoverPrompt,
  buildCoverPrompt,
  COVER_PROMPT_STANDARD_VERSION,
  createArticleCoverNextAction,
  getCoverPromptContract,
} from '../src/lib/content/cover-prompt-standard.ts';
import { buildArticleWorkflowImagePlan } from '../src/lib/content/article-workflow.ts';
import { IMAGE_GENERATION_STANDARD } from '../src/lib/content/image-generation-standard.ts';

const kindergartenIntent = {
  topic: 'Ứng dụng AI trong giảng dạy trẻ mầm non',
  visual_intent: 'AI là công cụ hỗ trợ giáo viên, không thay giáo viên.',
  subject_context_action: 'Một giáo viên mầm non hướng dẫn nhóm nhỏ trẻ 4–6 tuổi trong lớp học ấm áp, sử dụng máy tính bảng với hoạt động học trực quan đơn giản.',
  primary_focus: 'Sự tương tác giữa giáo viên và trẻ.',
  technology_cue: 'Một thiết bị số với hình ảnh học tập thân thiện, không chữ.',
  avoid: ['robot làm nhân vật chính', 'hologram', 'giao diện phức tạp', 'lớp học đông', 'phong cách khoa học viễn tưởng'],
};

test('structured cover prompt uses the frozen four-layer order', () => {
  const prompt = buildArticleCoverPrompt(kindergartenIntent);

  assert.match(prompt, new RegExp(COVER_PROMPT_STANDARD_VERSION.replace('.', '\\.')));
  const visualIntentIndex = prompt.indexOf('ARTICLE VISUAL INTENT');
  const subjectIndex = prompt.indexOf('SUBJECT / CONTEXT / ACTION');
  const standardIndex = prompt.indexOf('KDH EDITORIAL COVER — CLEAN & CLEAR STANDARD');
  const avoidIndex = prompt.indexOf('ARTICLE-SPECIFIC THINGS TO AVOID');
  assert.ok(visualIntentIndex < subjectIndex);
  assert.ok(subjectIndex < standardIndex);
  assert.ok(standardIndex < avoidIndex);
  assert.match(prompt, /AI là công cụ hỗ trợ giáo viên/i);
  assert.match(prompt, /Sự tương tác giữa giáo viên và trẻ/i);
  assert.match(prompt, /robot làm nhân vật chính/i);
});

test('cover standard includes Clean & Clear hard, thumbnail, differentiation and technical rules', () => {
  const prompt = buildArticleCoverPrompt(kindergartenIntent);

  assert.match(prompt, /central 70–80% safe area/i);
  assert.match(prompt, /20–35% of the frame visually quiet/i);
  assert.match(prompt, /480 × 270 pixels/i);
  assert.match(prompt, /Minimum 1536 × 864 pixels/i);
  assert.match(prompt, /Do not include any visible text/i);
  assert.match(prompt, /3–4 meaningful visual elements/i);
  assert.match(prompt, /chess boards/i);
  assert.match(prompt, /circular AI interfaces/i);
  assert.match(prompt, /no busy background/i);
  assert.match(prompt, /aspect-ratio: 16 \/ 9/i);
  assert.match(prompt, /object-fit: cover/i);
});

test('legacy topic prompt is normalized to the same authoritative standard', () => {
  const prompt = buildCoverPrompt('A teacher guiding one student with a subtle tablet learning model.');

  assert.match(prompt, /ARTICLE VISUAL INTENT/);
  assert.match(prompt, /SUBJECT \/ CONTEXT \/ ACTION/);
  assert.match(prompt, /teacher guiding one student/i);
  assert.match(prompt, /no busy background/i);
});

test('cover prompt normalization is idempotent', () => {
  const once = buildCoverPrompt('One robot prototype on a clean workbench.');
  assert.equal(buildCoverPrompt(once), once);
});

test('MCP cover contract exposes the four-layer field mapping', () => {
  const contract = getCoverPromptContract();
  assert.equal(contract.standard_version, COVER_PROMPT_STANDARD_VERSION);
  assert.ok(contract.cover_standard);
  assert.ok(contract.cover_prompt_builder);
  assert.ok(contract.cover_negative_rules);
  assert.ok(contract.thumbnail_safety_rules);
  assert.deepEqual(contract.prompt_layers, [
    'ARTICLE VISUAL INTENT',
    'SUBJECT / CONTEXT / ACTION',
    'KDH CLEAN & CLEAR COVER STANDARD',
    'ARTICLE-SPECIFIC THINGS TO AVOID',
  ]);
  assert.equal(contract.full_article_in_prompt, false);
  assert.equal(contract.composition.minimum_size, '1536x864');
});

test('start_article_workflow next action contains a production-ready article cover prompt', () => {
  const result = createArticleCoverNextAction(kindergartenIntent);
  assert.equal(result.next_action.purpose, 'article_cover');
  assert.equal(result.next_action.aspect_ratio, '16:9');
  assert.equal(result.next_action.minimum_size, '1536x864');
  assert.equal(result.next_action.preferred_format, 'png');
  assert.match(result.next_action.prompt, /KDH EDITORIAL COVER — CLEAN & CLEAR STANDARD/);
  assert.doesNotMatch(result.next_action.prompt, /content_markdown/i);
});

test('resumable MCP workflow appends the cover standard before returning the native image action', () => {
  const plan = buildArticleWorkflowImagePlan({
    featured_image: {
      prompt: 'Một giáo viên hướng dẫn học sinh sử dụng máy tính bảng trong lớp học sáng, tối giản.',
      alt: 'Giáo viên hướng dẫn học sinh sử dụng công nghệ trong lớp học.',
    },
    inline_images: ['img-01', 'img-02', 'img-03'].map((id) => ({
      id,
      prompt: `Minh họa ${id}`,
      alt: `Mô tả ${id}`,
    })),
  });

  assert.equal(plan[0].purpose, 'article_cover');
  assert.match(plan[0].prompt, /KDH EDITORIAL COVER — CLEAN & CLEAR STANDARD/);
  assert.match(plan[0].prompt, /quiet upper-left/i);
  assert.doesNotMatch(plan[1].prompt, /KDH EDITORIAL COVER/);
  assert.equal(
    IMAGE_GENERATION_STANDARD.cover_prompt_standard.standard_version,
    COVER_PROMPT_STANDARD_VERSION,
  );
});
