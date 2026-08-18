-- Article review after draft: published + write metrics.
-- Does not add ChatGPT scheduled tasks.

ALTER TABLE public.editorial_calendar
  ADD COLUMN IF NOT EXISTS write_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS write_fails INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_write_error TEXT,
  ADD COLUMN IF NOT EXISTS last_seo_score INTEGER;

ALTER TABLE public.editorial_calendar DROP CONSTRAINT IF EXISTS editorial_calendar_status_check;
ALTER TABLE public.editorial_calendar
  ADD CONSTRAINT editorial_calendar_status_check
  CHECK (status IN (
    'proposed',
    'approved',
    'revision_requested',
    'writing',
    'drafted',
    'published',
    'cancelled'
  ));
