--
-- SQL MIGRATION: CONTENT OS HYBRID MODE (NotebookLM + MCP)
-- Author: QUAN-PL HUB AI AGENT
-- Date: 2026-04-29
-- Purpose: Task queue system for AI content pipeline
--

-- 1. Bảng content_tasks — Trung tâm điều phối tác vụ AI
CREATE TABLE IF NOT EXISTS public.content_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_name TEXT NOT NULL,
    notebook_id TEXT,                    -- NotebookLM Notebook ID tương ứng
    priority INT DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    logs TEXT,                           -- Ghi lại quá trình thực hiện hoặc lỗi
    result_post_id UUID,                 -- FK tới posts sau khi hoàn thành
    worker_id TEXT,                      -- ID của worker đang xử lý (bảo mật)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cập nhật bảng posts: thêm trường AI tracking
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seo_keywords JSONB,
ADD COLUMN IF NOT EXISTS schema_org JSONB,
ADD COLUMN IF NOT EXISTS source_task_id UUID REFERENCES public.content_tasks(id) ON DELETE SET NULL;

-- 3. Trigger cập nhật updated_at cho content_tasks
CREATE OR REPLACE FUNCTION update_content_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_tasks_ts
BEFORE UPDATE ON public.content_tasks
FOR EACH ROW
EXECUTE FUNCTION update_content_tasks_updated_at();

-- 4. Bật RLS
ALTER TABLE public.content_tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Admin (qua Dashboard): Toàn quyền đọc/tạo/hủy task
CREATE POLICY "Admin full access on content_tasks"
ON public.content_tasks
FOR ALL
USING (auth.role() = 'authenticated');

-- Service Role (Worker local): Bypass RLS tự động khi dùng service_role key
-- Không cần policy riêng vì service_role bypasses RLS by default.

-- 6. Index cho hiệu năng polling
CREATE INDEX IF NOT EXISTS idx_content_tasks_status ON public.content_tasks(status);
CREATE INDEX IF NOT EXISTS idx_content_tasks_priority ON public.content_tasks(priority DESC, created_at ASC);

-- 7. Danh sách Notebooks mẫu trong automation_settings
INSERT INTO public.automation_settings (key_name, key_value, description, category)
VALUES 
    ('NOTEBOOK_DEFAULT_ID', '', 'NotebookLM Notebook ID mặc định cho Content OS', 'mcp'),
    ('MCP_WORKER_HEARTBEAT', '', 'Timestamp heartbeat cuối cùng từ Local Worker', 'system'),
    ('WORKER_POLL_INTERVAL_MS', '30000', 'Khoảng thời gian polling (ms) của Local Worker', 'system')
ON CONFLICT (key_name) DO NOTHING;
