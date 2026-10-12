export function normalizeArticleHeadingLevels(content: string): string {
  // The page template already owns the single document H1 (post.title).
  // Legacy/editor-authored body HTML may still contain H1 tags; demote them
  // to H2 so article pages expose one primary H1 without discarding content.
  return content
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>');
}
