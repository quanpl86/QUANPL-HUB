import assert from "node:assert/strict";
import test from "node:test";
import { normalizeArticleHeadingLevels } from "../src/lib/content/public-article.ts";

test("demotes body H1 tags to H2 while preserving attributes", () => {
  const html = '<h1 id="intro" class="hero">Intro</h1><p>Body</p><h2>Existing</h2>';
  const normalized = normalizeArticleHeadingLevels(html);

  assert.equal(
    normalized,
    '<h2 id="intro" class="hero">Intro</h2><p>Body</p><h2>Existing</h2>',
  );
});

test("leaves content without H1 unchanged", () => {
  const html = '<h2>Section</h2><p>Body</p>';
  assert.equal(normalizeArticleHeadingLevels(html), html);
});
