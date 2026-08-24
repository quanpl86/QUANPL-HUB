import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectParagraphRun,
  groupParagraphs,
  inkSimilar,
  shouldMergeParagraphLines,
} from '../src/lib/pdf/group-text.ts';
import type { PdfTextBox } from '../src/lib/pdf/types.ts';

function line(overrides: Partial<PdfTextBox> & { id: string; y: number; text: string }): PdfTextBox {
  return {
    x: 72,
    width: 420,
    height: 14,
    fontSize: 11,
    fontFamily: 'Arial, Helvetica, sans-serif',
    sourceFont: 'Arial',
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    color: '#222222',
    highlight: '',
    align: 'left',
    background: '#ffffff',
    dirty: false,
    deleted: false,
    ...overrides,
  };
}

test('merges wrapped paragraph lines even when sampled colors differ slightly', () => {
  const boxes = [
    line({ id: 'a', y: 120, text: 'Throughout Early Access, this outline is provided for reference only.', color: '#1f1f1f' }),
    line({ id: 'b', y: 136, text: 'It remains subject to modification based on user feedback.', color: '#2a2a2a', height: 15 }),
  ];
  const grouped = groupParagraphs(boxes);
  assert.equal(grouped.length, 1);
  assert.match(grouped[0].text, /Throughout Early Access[\s\S]*subject to modification/);
});

test('does not merge a colored heading into the body paragraph', () => {
  const boxes = [
    line({ id: 'h', y: 80, text: 'Important Notice:', color: '#c026d3', fontSize: 14, height: 18, width: 160 }),
    line({ id: 'a', y: 104, text: 'Throughout Early Access, this outline is provided for reference only.' }),
    line({ id: 'b', y: 120, text: 'It remains subject to modification based on user feedback.' }),
  ];
  const grouped = groupParagraphs(boxes);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].text, 'Important Notice:');
  assert.match(grouped[1].text, /Throughout Early Access/);
});

test('does not merge a larger module title into the body', () => {
  const boxes = [
    line({ id: 't', y: 200, text: 'Module 4. Patrol, Alert, Attack!', fontSize: 16, height: 20, color: '#5b21b6', width: 360 }),
    line({ id: 'b1', y: 228, text: 'Code two mobs that attack the player with behaviors.' }),
    line({ id: 'b2', y: 244, text: 'One is a flying mob that charges the player.' }),
  ];
  const grouped = groupParagraphs(boxes);
  assert.equal(grouped.length, 2);
  assert.match(grouped[0].text, /Module 4/);
  assert.equal(grouped[1].text.split('\n').length, 2);
});

test('keeps a left label beside a body column instead of merging across', () => {
  const boxes = [
    line({ id: 'label', x: 72, y: 300, width: 90, text: 'GDSchool:', color: '#16a34a', fontSize: 12 }),
    line({ id: 'body1', x: 170, y: 300, width: 360, text: 'GDQuest\'s unique learning platform.' }),
    line({ id: 'body2', x: 170, y: 316, width: 360, text: 'Packed with interactive tools and quizzes.' }),
  ];
  const grouped = groupParagraphs(boxes);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].id, 'label');
  assert.match(grouped[1].text, /unique learning platform/);
});

test('merges overlapping line boxes that used to fail because gap was negative', () => {
  const prev = line({ id: 'a', y: 400, height: 18, text: 'First wrapped line of a paragraph.' });
  const next = line({ id: 'b', y: 414, height: 16, text: 'Second wrapped line continues here.' });
  assert.equal(next.y - (prev.y + prev.height), -4);
  assert.equal(shouldMergeParagraphLines(prev, next), true);
});

test('inkSimilar treats near-black samples as the same paragraph color', () => {
  assert.equal(inkSimilar('#111111', '#1c1c1c'), true);
  assert.equal(inkSimilar('#111111', '#c026d3'), false);
});

test('collectParagraphRun walks up and down from the clicked line', () => {
  const boxes = [
    line({ id: 'h', y: 10, text: 'Title', fontSize: 18, height: 22 }),
    line({ id: 'a', y: 50, text: 'Line one of the body paragraph.' }),
    line({ id: 'b', y: 66, text: 'Line two of the body paragraph.' }),
    line({ id: 'c', y: 82, text: 'Line three of the body paragraph.' }),
    line({ id: 'n', y: 130, text: 'Next section starts later.' }),
  ];
  const run = collectParagraphRun(boxes, 'b');
  assert.deepEqual(run.map((box) => box.id), ['a', 'b', 'c']);
});
