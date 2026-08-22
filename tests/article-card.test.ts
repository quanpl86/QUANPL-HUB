import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARTICLE_CARD_EXCERPT_MAX,
  formatCardDate,
  getArticleCardExcerpt,
  getArticleCardKeywords,
  getArticleCardTitle,
  getCardReadingMinutes,
} from '../src/lib/content/article-card.ts';

test('card excerpt ends cleanly within the content contract', () => {
  const excerpt = getArticleCardExcerpt(
    'sample',
    'Đây là một câu mở đầu rất dài để mô tả chủ đề bài viết một cách rõ ràng và có ích cho người đọc. Câu thứ hai bổ sung quá nhiều chi tiết không cần thiết cho card.',
  );
  assert.ok(excerpt.length <= ARTICLE_CARD_EXCERPT_MAX);
  assert.match(excerpt, /[.!?]$/);
});

test('legacy display titles are normalized without changing the canonical post', () => {
  assert.equal(
    getArticleCardTitle('khung-5c-giao-tiep-voi-ai', 'Canonical title'),
    'Khung 5C giao tiếp với AI: Từ câu lệnh đến tư duy phản biện',
  );
});

test('keywords are deduplicated, stripped of hashtag syntax and limited to two', () => {
  assert.deepEqual(
    getArticleCardKeywords(['#AI', 'AI', '#STEM', 'Robot'], (value) => value),
    ['AI', 'STEM'],
  );
});

test('card date and reading time use stable Vietnamese metadata', () => {
  assert.equal(formatCardDate('2026-08-21T00:00:00.000Z'), '21/08/2026');
  assert.equal(getCardReadingMinutes('khung-5c-giao-tiep-voi-ai', null), 28);
  assert.equal(getCardReadingMinutes('new-post', '12'), 12);
});
