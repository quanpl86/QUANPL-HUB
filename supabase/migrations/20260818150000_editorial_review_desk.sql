-- Review desk: slot order + threaded comments for weeks and articles.

ALTER TABLE public.editorial_calendar
  ADD COLUMN IF NOT EXISTS item_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS editorial_calendar_week_order_idx
  ON public.editorial_calendar (week_id, item_order, scheduled_date);

CREATE TABLE IF NOT EXISTS public.editorial_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.editorial_weeks(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.editorial_calendar(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('admin', 'chatgpt')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS editorial_review_comments_week_idx
  ON public.editorial_review_comments (week_id, created_at);

CREATE INDEX IF NOT EXISTS editorial_review_comments_slot_idx
  ON public.editorial_review_comments (slot_id, created_at);

ALTER TABLE public.editorial_review_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read editorial_review_comments" ON public.editorial_review_comments;
CREATE POLICY "Authenticated read editorial_review_comments"
ON public.editorial_review_comments FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write editorial_review_comments" ON public.editorial_review_comments;
CREATE POLICY "Authenticated write editorial_review_comments"
ON public.editorial_review_comments FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
