-- Phase 1 Editorial Plan Review OS.
-- Rich brief + revision_ready + snapshots + activity.
-- Does not add queue, scheduler, or draft-revision tables.

ALTER TABLE public.editorial_calendar
  ADD COLUMN IF NOT EXISTS search_intent TEXT,
  ADD COLUMN IF NOT EXISTS primary_keyword TEXT,
  ADD COLUMN IF NOT EXISTS secondary_keywords JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS why_this_article TEXT,
  ADD COLUMN IF NOT EXISTS source_strategy TEXT,
  ADD COLUMN IF NOT EXISTS internal_link_suggestions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS article_objectives JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS revision_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS based_on_revision INTEGER;

ALTER TABLE public.editorial_weeks
  ADD COLUMN IF NOT EXISTS revision_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revision_constraints JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

ALTER TABLE public.editorial_weeks DROP CONSTRAINT IF EXISTS editorial_weeks_status_check;
ALTER TABLE public.editorial_weeks
  ADD CONSTRAINT editorial_weeks_status_check
  CHECK (status IN ('proposed', 'revision_requested', 'revision_ready', 'approved', 'cancelled'));

CREATE TABLE IF NOT EXISTS public.editorial_plan_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.editorial_weeks(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  author TEXT NOT NULL CHECK (author IN ('admin', 'chatgpt')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week_id, revision_number)
);

CREATE INDEX IF NOT EXISTS editorial_plan_revisions_week_idx
  ON public.editorial_plan_revisions (week_id, revision_number DESC);

CREATE TABLE IF NOT EXISTS public.editorial_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.editorial_weeks(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.editorial_calendar(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('admin', 'chatgpt', 'system')),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS editorial_activity_week_idx
  ON public.editorial_activity (week_id, created_at DESC);

ALTER TABLE public.editorial_plan_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read editorial_plan_revisions" ON public.editorial_plan_revisions;
CREATE POLICY "Authenticated read editorial_plan_revisions"
ON public.editorial_plan_revisions FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write editorial_plan_revisions" ON public.editorial_plan_revisions;
CREATE POLICY "Authenticated write editorial_plan_revisions"
ON public.editorial_plan_revisions FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated read editorial_activity" ON public.editorial_activity;
CREATE POLICY "Authenticated read editorial_activity"
ON public.editorial_activity FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write editorial_activity" ON public.editorial_activity;
CREATE POLICY "Authenticated write editorial_activity"
ON public.editorial_activity FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
