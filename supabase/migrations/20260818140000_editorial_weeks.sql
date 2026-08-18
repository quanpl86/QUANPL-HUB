-- Weekly editorial plan: ChatGPT proposes a week's article list,
-- admin reviews/replies, GPT revises until the week is approved.
-- Individual slots then become writable only after their scheduled datetime.

CREATE TABLE IF NOT EXISTS public.editorial_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  angle TEXT,
  audience TEXT,
  goal TEXT,
  scheduled_date DATE,
  field TEXT,
  subject TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  admin_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'revision_requested', 'writing', 'drafted', 'cancelled')),
  result_post_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.editorial_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  title TEXT,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'revision_requested', 'approved', 'cancelled')),
  admin_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS editorial_weeks_status_idx
  ON public.editorial_weeks (status, week_start DESC);

ALTER TABLE public.editorial_calendar
  ADD COLUMN IF NOT EXISTS week_id UUID REFERENCES public.editorial_weeks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS outline TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time TIME,
  ADD COLUMN IF NOT EXISTS last_due_reminder_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS editorial_calendar_week_idx
  ON public.editorial_calendar (week_id, scheduled_date, scheduled_time);

CREATE OR REPLACE FUNCTION update_editorial_weeks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_editorial_weeks_ts ON public.editorial_weeks;
CREATE TRIGGER trigger_update_editorial_weeks_ts
BEFORE UPDATE ON public.editorial_weeks
FOR EACH ROW
EXECUTE FUNCTION update_editorial_weeks_updated_at();

ALTER TABLE public.editorial_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read editorial_weeks" ON public.editorial_weeks;
CREATE POLICY "Authenticated read editorial_weeks"
ON public.editorial_weeks FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write editorial_weeks" ON public.editorial_weeks;
CREATE POLICY "Authenticated write editorial_weeks"
ON public.editorial_weeks FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
