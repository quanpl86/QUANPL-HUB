-- 
-- SQL MIGRATION: AI AUTOMATION CONTENT ENGINE (KING DRAGON MODE)
-- Author: QUAN-PL HUB AI AGENT
-- Date: 2026-04-28
--

-- 1. Create Automation Settings Table
CREATE TABLE IF NOT EXISTS public.automation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name TEXT UNIQUE NOT NULL, -- Ví dụ: 'GEMINI_API_KEY', 'WRITING_STYLE'
    key_value TEXT,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'api', 'agent', 'workflow'
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Create Automation Logs Table
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_name TEXT NOT NULL, -- 'Scan', 'Research', 'Generation', 'Media', 'Sourcing', 'Staging'
    status TEXT NOT NULL, -- 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'GEN'
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Lưu vết dữ liệu chi tiết
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Admin Only)
-- Giả định đã có role 'admin' hoặc kiểm tra qua auth.uid()
CREATE POLICY "Admin can manage automation settings" 
ON public.automation_settings 
FOR ALL 
USING (auth.jwt() ->> 'email' = 'admin@quanpl.com'); -- Thay bằng email của bạn hoặc logic role

CREATE POLICY "Admin can view automation logs" 
ON public.automation_logs 
FOR SELECT 
USING (auth.jwt() ->> 'email' = 'admin@quanpl.com');

-- 5. Helper Function to Update updated_at
CREATE OR REPLACE FUNCTION update_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_automation_settings
BEFORE UPDATE ON public.automation_settings
FOR EACH ROW
EXECUTE FUNCTION update_automation_updated_at();

-- 6. Insert Default Settings Placeholders
INSERT INTO public.automation_settings (key_name, description, category, is_encrypted)
VALUES 
    ('AI_MODEL_PREFERENCE', 'Mô hình AI ưu tiên (Gemini Pro, GPT-4, Claude 3.5)', 'agent', FALSE),
    ('CONTENT_FREQUENCY', 'Tần suất đăng bài tự động', 'workflow', FALSE),
    ('SYSTEM_PROMPT_MASTER', 'System Prompt định nghĩa giọng văn King Dragon', 'agent', FALSE),
    ('GOOGLE_CLOUD_API_KEY', 'API Key cho Drive/Docs/Calendar', 'api', TRUE),
    ('PERPLEXITY_API_KEY', 'API Key cho DeepSearch', 'api', TRUE)
ON CONFLICT (key_name) DO NOTHING;
