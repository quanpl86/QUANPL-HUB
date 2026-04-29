-- Tạo bảng quản lý các nút MCP
CREATE TABLE IF NOT EXISTS public.automation_mcp_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'Trực tuyến',
    last_ping TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Thêm dữ liệu mẫu ban đầu
INSERT INTO public.automation_mcp_nodes (name, url, status)
VALUES 
('NotebookLM Bridge', '127.0.0.1:8080', 'Trực tuyến'),
('G-Drive Indexer', 'hub.internal:3000', 'Trực tuyến'),
('Search Orcherstrator', 'edge.perplexity:443', 'Cảnh báo');
