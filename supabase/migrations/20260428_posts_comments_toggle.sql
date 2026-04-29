-- Bổ sung tính năng bật/tắt bình luận cho từng bài viết
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true;
