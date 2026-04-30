import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mcp from './mcp-client.js';
import { syncNotebooksToSupabase } from './supabase-client.js';
import { startNeuralSync, saveMapping } from './neural-sync.js';
import { getSyncLogs } from './logger.js';
import fs from 'fs-extra';

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

// 5. Tạo Notebook mới + Tạo thư mục Local
app.post('/api/notebooks', async (req, res) => {
    const { name, description } = req.body;
    try {
        // 1. Tạo thư mục local trước để có chỗ chứa file mồi
        const folderName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const storagePath = path.resolve('/Users/mac/Downloads/QUAN-PL-HUB/storage/notebooks', folderName);
        await fs.ensureDir(storagePath);

        // 2. Tạo file CSV mồi (Google AI không bao giờ tóm tắt file CSV để đặt tên)
        const fileName = `${name.replace(/[^a-z0-9]/gi, '_')}.csv`;
        const tempFilePath = path.join(storagePath, fileName);
        await fs.writeFile(tempFilePath, `id,name\n1,${name}`);

        // 3. Gọi lệnh tạo Notebook - Ép mọi thông số title đều trùng khít
        const result = await mcp.createNotebook(name, [{ 
            type: 'file', 
            value: tempFilePath,
            title: name
        }], description);
        
        // Trích xuất notebook_id từ kết quả
        let notebookId = "";
        const text = (result.content as any[])?.[0]?.text || "";
        try {
            const parsed = JSON.parse(text);
            notebookId = parsed.notebook_id || parsed.id || "";
        } catch (e) {}

        if (notebookId) {
            // 4. Lưu mapping NGAY LẬP TỨC (không đợi đổi tên) để tránh mất dữ liệu nếu user dừng process
            await saveMapping(folderName, notebookId, name);
            console.log(`[API] ✅ Đã lưu mapping ngay lập tức: ${folderName}`);

            // 5. Chiến thuật đổi tên 2 lớp (Dual-Naming Strategy)
            (async () => {
                try {
                    // Lớp 1: Mở Notebook ra trước để trình duyệt tập trung vào đúng trang
                    await mcp.selectNotebook(notebookId);
                    console.log(`[API] 🎯 Đã chọn Notebook: ${notebookId}`);

                    // Lớp 2: Lệnh ép tên ngay lập tức
                    await mcp.updateNotebook(notebookId, name);
                    console.log(`[API] 🏷️ Đã ép tên lần 1 cho: ${name}`);
                    
                    // Lớp 3: Đợi Google AI ổn định rồi ép lại lần cuối
                    await new Promise(resolve => setTimeout(resolve, 15000));
                    await mcp.updateNotebook(notebookId, name);
                    console.log(`[API] 🏷️ Đã ép tên lần 2 (Final) cho: ${name}`);
                } catch (e) {
                    console.warn(`[API] ⚠️ Tiến trình ép tên chạy ngầm gặp lỗi nhỏ, nhưng mapping đã an toàn.`);
                }
            })();
        }

        res.json({ success: true, notebook_id: notebookId, folder: folderName });
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

// 7. Lấy nhật ký đồng bộ
app.get('/api/sync/logs', (req, res) => {
    res.json(getSyncLogs());
});

// 8. Mở thư mục local trong Finder
app.post('/api/sync/open', async (req, res) => {
    const { exec } = await import('child_process');
    const folderPath = path.resolve('/Users/mac/Downloads/QUAN-PL-HUB/storage/notebooks');
    exec(`open "${folderPath}"`, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`🚀 MCP DASHBOARD SERVER RUNNING`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`=========================================`);

    // Khởi động Neural Sync
    try {
        await startNeuralSync();
    } catch (e: any) {
        console.error(`[API] ❌ Không thể khởi động Neural Sync:`, e.message);
    }
});
