import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mcp from './mcp-client.js';
import { syncNotebooksToSupabase } from './supabase-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3005;

app.use(cors());
app.use(express.json());

// Phục vụ giao diện Dashboard
app.use(express.static(path.join(__dirname, 'dashboard')));

// --- CÁC ENDPOINT API ---

// 1. Kiểm tra sức khỏe hệ thống
app.get('/api/health', async (req, res) => {
    try {
        const health = await mcp.getHealth();
        res.json(health);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Danh sách Notebooks
app.get('/api/notebooks', async (req, res) => {
    try {
        const result = await mcp.listNotebooks();
        let notebooks = [];
        let rawText = "";

        if (result.content && Array.isArray(result.content)) {
            const textContent = result.content.find((c: any) => c.text);
            if (textContent) {
                rawText = textContent.text;
                try {
                    const parsed = JSON.parse(rawText);
                    if (Array.isArray(parsed)) {
                        notebooks = parsed;
                    } else if (parsed && parsed.data && Array.isArray(parsed.data.notebooks)) {
                        notebooks = parsed.data.notebooks;
                    } else if (parsed && Array.isArray(parsed.notebooks)) {
                        notebooks = parsed.notebooks;
                    }
                } catch (e) {
                    console.log("[API] Raw text detected, not JSON");
                }
            }
        }

        // Nếu không parse được thành mảng, trả về rawText để frontend xử lý
        res.json({
            success: true,
            count: notebooks.length,
            data: notebooks,
            raw: rawText
        });
    } catch (error: any) {
        console.error("[API] Error fetching notebooks:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Kích hoạt Authentication (Mở trình duyệt)
app.post('/api/auth/setup', async (req, res) => {
    try {
        const result = await mcp.setupAuth();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Lấy hạn mức (Quota)
app.get('/api/quota', async (req, res) => {
    try {
        const quota = await mcp.getQuota();
        res.json(quota);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Tạo Notebook mới
app.post('/api/notebooks', async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await mcp.createNotebook(name, [], description);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Đồng bộ toàn bộ Notebooks lên Supabase
app.post('/api/sync-supabase', async (req, res) => {
    try {
        const result = await mcp.listNotebooks();
        let notebooks: any[] = [];

        if (result.content && Array.isArray(result.content)) {
            const textContent = result.content.find((c: any) => c.text);
            if (textContent) {
                const parsed = JSON.parse(textContent.text);
                if (Array.isArray(parsed)) notebooks = parsed;
                else if (parsed?.data?.notebooks) notebooks = parsed.data.notebooks;
                else if (parsed?.notebooks) notebooks = parsed.notebooks;
            }
        }

        if (notebooks.length > 0) {
            await syncNotebooksToSupabase(notebooks);
            res.json({ success: true, count: notebooks.length });
        } else {
            res.status(400).json({ error: "Không tìm thấy dữ liệu Notebook để đồng bộ." });
        }
    } catch (error: any) {
        console.error("[API] Sync Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 MCP DASHBOARD SERVER RUNNING`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`=========================================`);
});
