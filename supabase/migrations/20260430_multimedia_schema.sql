--
-- SQL MIGRATION: MULTIMEDIA & RESEARCH EXPANSION
-- Author: QUAN-PL HUB AI AGENT
-- Date: 2026-04-30
-- Purpose: Add support for Podcast/Video production and Deep Research metadata
--

-- 1. Bổ sung cột 'type' vào bảng content_tasks để phân loại tác vụ
ALTER TABLE public.content_tasks 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'BLOG';

-- 2. Bổ sung các cột đa phương tiện vào bảng posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Chỉ mục (Index) để tối ưu hóa truy vấn tác vụ theo loại
CREATE INDEX IF NOT EXISTS idx_content_tasks_type ON public.content_tasks(type);

-- 4. Thông báo làm mới bộ nhớ đệm PostgREST (Supabase Schema Cache)
NOTIFY pgrst, 'reload schema';
