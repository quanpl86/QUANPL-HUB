-- Article Package v7 snapshot. posts.content remains the compiled gold HTML.
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS article_package jsonb;

COMMENT ON COLUMN posts.article_package IS
  'Lossless Editorial Agent v7 Article Package snapshot at ingest. posts.content is the compiled gold HTML.';
