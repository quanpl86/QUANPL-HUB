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

CREATE INDEX IF NOT EXISTS editorial_calendar_status_idx
  ON public.editorial_calendar (status, scheduled_date);

CREATE OR REPLACE FUNCTION update_editorial_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_editorial_calendar_ts ON public.editorial_calendar;
CREATE TRIGGER trigger_update_editorial_calendar_ts
BEFORE UPDATE ON public.editorial_calendar
FOR EACH ROW
EXECUTE FUNCTION update_editorial_calendar_updated_at();

ALTER TABLE public.editorial_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read editorial_calendar" ON public.editorial_calendar;
CREATE POLICY "Authenticated read editorial_calendar"
ON public.editorial_calendar FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write editorial_calendar" ON public.editorial_calendar;
CREATE POLICY "Authenticated write editorial_calendar"
ON public.editorial_calendar FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
