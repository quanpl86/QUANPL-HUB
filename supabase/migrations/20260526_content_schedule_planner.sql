--
-- SQL MIGRATION: CONTENT SCHEDULE PLANNER
-- Purpose: Persist post planning schedule, prompt packs, and status workflow
--

CREATE TABLE IF NOT EXISTS public.content_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_order INT NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    previous_context TEXT,
    description TEXT,
    goal TEXT,
    audience TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'done')),
    scheduled_date DATE,
    prompt_rule TEXT,
    prompt_brief TEXT,
    prompt_context TEXT,
    source_plan TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_schedule_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    previous_article_content TEXT DEFAULT '',
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_schedules
ADD COLUMN IF NOT EXISTS prompt_instruction_id UUID REFERENCES public.content_instructions(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION update_content_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_content_schedules_ts ON public.content_schedules;
CREATE TRIGGER trigger_update_content_schedules_ts
BEFORE UPDATE ON public.content_schedules
FOR EACH ROW
EXECUTE FUNCTION update_content_schedules_updated_at();

CREATE OR REPLACE FUNCTION update_content_schedule_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_content_schedule_settings_ts ON public.content_schedule_settings;
CREATE TRIGGER trigger_update_content_schedule_settings_ts
BEFORE UPDATE ON public.content_schedule_settings
FOR EACH ROW
EXECUTE FUNCTION update_content_schedule_settings_updated_at();

CREATE OR REPLACE FUNCTION update_content_instructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_content_instructions_ts ON public.content_instructions;
CREATE TRIGGER trigger_update_content_instructions_ts
BEFORE UPDATE ON public.content_instructions
FOR EACH ROW
EXECUTE FUNCTION update_content_instructions_updated_at();

ALTER TABLE public.content_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on content_schedules" ON public.content_schedules;
CREATE POLICY "Admin full access on content_schedules"
ON public.content_schedules
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full access on content_schedule_settings" ON public.content_schedule_settings;
CREATE POLICY "Admin full access on content_schedule_settings"
ON public.content_schedule_settings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full access on content_instructions" ON public.content_instructions;
CREATE POLICY "Admin full access on content_instructions"
ON public.content_instructions
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_content_schedules_status ON public.content_schedules(status);
CREATE INDEX IF NOT EXISTS idx_content_schedules_schedule ON public.content_schedules(scheduled_date ASC, item_order ASC);
CREATE INDEX IF NOT EXISTS idx_content_schedules_slug ON public.content_schedules(slug);
CREATE INDEX IF NOT EXISTS idx_content_schedules_prompt_instruction ON public.content_schedules(prompt_instruction_id);
CREATE INDEX IF NOT EXISTS idx_content_instructions_default ON public.content_instructions(is_default DESC, updated_at DESC);
