import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mcp from './mcp-client.js';
import { syncNotebooksToSupabase, supabase } from './supabase-client.js';
import { startNeuralSync, saveMapping, pruneMappings } from './neural-sync.js';
import { getSyncLogs, addSyncLog } from './logger.js';
import { taskQueue, setupBullBoardUI, closeBullMQ } from './bullmq.js';
import fs from 'fs-extra';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logger dùng chung
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const STORAGE_PATH = process.env.STORAGE_PATH || '/Users/mac/Downloads/QUAN-PL-HUB/storage/notebooks';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3005;

app.use(cors());
app.use(express.json());

// Phục vụ giao diện Dashboard
app.use(express.static(path.join(__dirname, 'dashboard')));

// Thiết lập Bull Board UI
setupBullBoardUI(app);

// Simple In-Memory Rate Limiter cho các endpoint nhạy cảm
const syncRateLimiter = (() => {
    const requests = new Map<string, number>();
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || 'unknown';
        const now = Date.now();
        const lastRequest = requests.get(ip) || 0;
        if (now - lastRequest < 5000) { // Limit 1 request per 5 seconds
            return res.status(429).json({ error: 'Too many requests, please try again later.' });
        }
        requests.set(ip, now);
        next();
    };
})();

// Helper Parse Notebooks từ MCP
function parseNotebooksFromMCP(result: any) {
  if (!result?.content?.[0]?.text) return [];
  
  const text = result.content[0].text;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed 
         : parsed?.data?.notebooks || parsed?.notebooks || parsed?.data || [];
  } catch {
    // fallback regex nếu MCP trả về text thô
    const matches = text.match(/ID: ([a-z0-9-]+)\s+Name: (.*)/g);
    if (matches) {
        return matches.map((m: string) => {
            const matchResult = m.match(/ID: ([a-z0-9-]+)\s+Name: (.*)/);
            if (matchResult) {
                return { id: matchResult[1], name: matchResult[2] };
            }
            return { id: 'unknown', name: 'unknown' };
        });
    }
    return [];
  }
}

// --- CÁC ENDPOINT API ---

// 1. Kiểm tra sức khỏe hệ thống
app.get('/api/health', async (req, res, next) => {
    try {
        const health = await mcp.getHealth();
        res.json(health);
    } catch (error: any) {
        next(error);
    }
});

// Cache cho danh sách Notebook
let cachedNotebooks: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

// 2. Danh sách Notebooks (Có Cache để tránh mở Chrome liên tục)
app.get('/api/notebooks', async (req, res, next) => {
    const now = Date.now();
    
    // Nếu có cache và chưa hết hạn, trả về luôn
    if (cachedNotebooks && (now - lastFetchTime < CACHE_TTL)) {
        logger.info("[API] ⚡ Trả về danh sách Notebook từ Cache (Tránh mở Chrome)");
        return res.json(cachedNotebooks);
    }

    try {
        const result = await mcp.listNotebooks();
        const notebooks = parseNotebooksFromMCP(result);
        const rawText = result?.content?.[0]?.text || "";

        logger.info(`[API] 📦 Đã nhận ${notebooks.length} notebooks từ MCP và nạp vào Cache.`);

        const responseData = {
            success: true,
            count: notebooks.length,
            data: notebooks,
            raw: rawText
        };

        // Lưu vào cache
        cachedNotebooks = responseData;
        lastFetchTime = now;

        res.json(responseData);
    } catch (error: any) {
        logger.error({ err: error.message }, "[API] Error fetching notebooks");
        next(error);
    }
});

// 3. Kích hoạt Authentication (Mở trình duyệt)
app.post('/api/auth/setup', async (req, res, next) => {
    try {
        const result = await mcp.setupAuth();
        res.json(result);
    } catch (error: any) {
        next(error);
    }
});

// 4. Lấy hạn mức (Quota)
app.get('/api/quota', async (req, res, next) => {
    try {
        const quota = await mcp.getQuota();
        res.json(quota);
    } catch (error: any) {
        next(error);
    }
});

// 5. Tạo Notebook mới + Tạo thư mục Local (Có Rate Limit)
app.post('/api/notebooks', syncRateLimiter, async (req, res, next) => {
    const { name, description } = req.body;
    try {
        // 1. Tạo thư mục local trước để có chỗ chứa file mồi
        const folderName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const storagePath = path.resolve(STORAGE_PATH, folderName);
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
            logger.info(`[API] ✅ Đã lưu mapping ngay lập tức: ${folderName}`);

            // 5. Chiến thuật đổi tên 2 lớp (Dual-Naming Strategy)
            (async () => {
                try {
                    // Lớp 1: Mở Notebook ra trước để trình duyệt tập trung vào đúng trang
                    await mcp.selectNotebook(notebookId);
                    logger.info(`[API] 🎯 Đã chọn Notebook: ${notebookId}`);

                    // Lớp 2: Lệnh ép tên ngay lập tức
                    await mcp.updateNotebook(notebookId, name);
                    logger.info(`[API] 🏷️ Đã ép tên lần 1 cho: ${name}`);
                    
                    // Lớp 3: Đợi Google AI ổn định rồi ép lại lần cuối
                    await new Promise(resolve => setTimeout(resolve, 15000));
                    await mcp.updateNotebook(notebookId, name);
                    logger.info(`[API] 🏷️ Đã ép tên lần 2 (Final) cho: ${name}`);
                } catch (e) {
                    logger.warn(`[API] ⚠️ Tiến trình ép tên chạy ngầm gặp lỗi nhỏ, nhưng mapping đã an toàn.`);
                }
            })();
        }

        res.json({ success: true, notebook_id: notebookId, folder: folderName });
    } catch (error: any) {
        next(error);
    }
});

// 6. Đồng bộ toàn bộ Notebooks lên Supabase + Dọn dẹp Mapping Local (Có Rate Limit)
app.post('/api/sync-supabase', syncRateLimiter, async (req, res, next) => {
    try {
        logger.info("[API] 🔄 Bắt đầu ĐỒNG BỘ THẬT từ Google NotebookLM...");
        
        // BƯỚC 1: Ép MCP Server đồng bộ với Google (Mở trình duyệt quét lại)
        addSyncLog("🌐 Đang kết nối Google để quét thư viện thực tế...", "info");
        await mcp.syncLibrary();
        
        // BƯỚC 2: Lấy danh sách đã được làm mới
        const result = await mcp.listNotebooks();
        const notebooks = parseNotebooksFromMCP(result);

        logger.info(`[API] 📦 Đã lấy được ${notebooks.length} notebook thực tế.`);

        if (notebooks.length >= 0) {
            // BƯỚC 3: Đồng bộ Supabase
            await syncNotebooksToSupabase(notebooks);
            
            // BƯỚC 4: Dọn dẹp Mapping Local
            const validIds = notebooks.map((nb: any) => nb.id);
            const prunedCount = await pruneMappings(validIds);
            
            addSyncLog(`✅ Đồng bộ hoàn tất: ${notebooks.length} Notebook, đã dọn ${prunedCount} mục cũ.`, "success");
            
            res.json({ 
                success: true, 
                count: notebooks.length, 
                pruned: prunedCount,
                message: `Đã đồng bộ thực tế ${notebooks.length} notebook từ Google.`
            });
        } else {
            res.status(400).json({ error: "Không thể lấy danh sách Notebook." });
        }
    } catch (error: any) {
        logger.error({ err: error.message }, "[API] Sync Error");
        addSyncLog(`❌ Lỗi đồng bộ: ${error.message}`, "error");
        next(error);
    }
});

// 7. Lấy nhật ký đồng bộ
app.get('/api/sync/logs', (req, res) => {
    res.json(getSyncLogs());
});

// 8. Mở thư mục local trong Finder/Explorer (Cross-platform)
app.post('/api/sync/open', async (req, res, next) => {
    try {
        const { exec } = await import('child_process');
        const platform = process.platform;
        let command = 'xdg-open'; // Linux
        if (platform === 'darwin') command = 'open'; // macOS
        else if (platform === 'win32') command = 'start'; // Windows

        exec(`${command} "${STORAGE_PATH}"`, (err) => {
            if (err) return next(err);
            res.json({ success: true });
        });
    } catch (err) {
        next(err);
    }
});

// 9. Lấy danh sách Task đang hoạt động (cho Dashboard Monitor)
app.get('/api/tasks/active', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('content_tasks')
            .select('*')
            .in('status', ['pending', 'processing'])
            .order('updated_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        next(error);
    }
});

// 10. Lấy trạng thái Multimedia của Notebooks
app.get('/api/notebooks/multimedia', async (req, res, next) => {
    try {
        // Query các bài viết có gắn notebook_id để xem đã có audio/video chưa
        const { data, error } = await supabase
            .from('posts')
            .select('notebook_id, audio_url, video_url')
            .not('notebook_id', 'is', null);
            
        if (error) {
            // Nếu column notebook_id chưa được tạo trên Supabase, return [] thay vì crash
            if (error.message.includes('does not exist')) {
                return res.json([]);
            }
            throw error;
        }
        res.json(data || []);
    } catch (error: any) {
        next(error);
    }
});

// 11. Đẩy task vào hàng đợi BullMQ
app.post('/api/tasks/queue', async (req, res, next) => {
    const { id, type, topic_name, prompt_custom, notebook_id, post_id, priority = 2 } = req.body;
    
    // Validation cơ bản
    if (!id || !type || !topic_name) {
        return res.status(400).json({ error: 'Missing required fields: id, type, topic_name' });
    }

    try {
        const jobId = `task-${id}`;
        const existingJob = await taskQueue.getJob(jobId);
        if (existingJob) {
            logger.info({ jobId }, 'Removing existing job before re-queueing');
            await existingJob.remove();
        }

        const job = await taskQueue.add('process-task', {
            id,
            type,
            topic_name,
            prompt_custom,
            notebook_id,
            post_id
        }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 15000 },
            removeOnComplete: { age: 3600 * 24 * 7 },
            removeOnFail: { age: 3600 * 24 * 30 },
            priority,
            jobId
        });
        
        res.json({ success: true, jobId: job.id });
    } catch (error: any) {
        next(error);
    }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err: err.message, stack: err.stack }, '🔥 Unhandled Express Error');
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, async () => {
    logger.info(`=========================================`);
    logger.info(`🚀 MCP DASHBOARD SERVER RUNNING`);
    logger.info(`🔗 URL: http://localhost:${PORT}`);
    logger.info(`=========================================`);

    // Khởi động Neural Sync & Auto-Sync Library
    try {
        await startNeuralSync();
        
        await startNeuralSync();
        // TỰ ĐỘNG ĐỒNG BỘ ĐÃ BỊ VÔ HIỆU HÓA ĐỂ TRÁNH XUNG ĐỘT TAB
        logger.info("[API] ℹ️ Tự động đồng bộ khi khởi động đã được tắt. Hãy sync thủ công nếu cần.");
    } catch (e: any) {
        logger.error({ err: e.message }, `[API] ❌ Không thể khởi động hệ thống`);
    }
});

process.on('SIGINT', async () => {
    logger.info('\n🛑 Đang đóng hệ thống Dashboard...');
    await closeBullMQ();
    process.exit(0);
});
