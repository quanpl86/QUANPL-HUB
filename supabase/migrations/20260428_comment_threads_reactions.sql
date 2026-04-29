-- Cập nhật bảng comments để hỗ trợ trả lời (threaded comments)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Tạo bảng comment_reactions để lưu trữ tương tác trên bình luận
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    ip_address TEXT NOT NULL,
    reaction_type TEXT DEFAULT 'like',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, ip_address)
);

-- Kích hoạt RLS cho bảng mới
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Chính sách bảo mật (RLS)
CREATE POLICY "Cho phép mọi người xem tương tác" ON public.comment_reactions
    FOR SELECT USING (true);

CREATE POLICY "Cho phép khách tương tác" ON public.comment_reactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cho phép khách xóa tương tác của mình" ON public.comment_reactions
    FOR DELETE USING (true); -- Dựa trên IP sẽ check ở Action

-- Index tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON public.comment_reactions(comment_id);
