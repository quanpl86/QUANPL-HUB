/**
 * ============================================
 * KING DRAGON HUB — LOCAL WORKER v2.6 PLATINUM
 * Content OS Hybrid Mode (NotebookLM + MCP)
 * ============================================
 * Final Architect Edition • Refactored & Optimized
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';
import pino from 'pino';
import express from 'express';
import cors from 'cors';

import {
  supabase,
  fetchPendingTasks,
  updateTaskStatus,
  insertDraftPost,
  sendHeartbeat as sendDbHeartbeat,
  uploadAsset,
  updatePostMultimedia
} from './supabase-client.js';

import mcp, {
  initMCPClient,
  closeMCPClient
} from './mcp-client.js';

import { createTaskWorker, closeBullMQ, taskQueue } from './bullmq.js';
import { buildContentPrompt, parseNotebookResponse } from './prompt-templates.js';
import { marked } from 'marked';

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const CONFIG = {
  WORKER_ID: process.env.WORKER_ID || 'local-worker-quan',
  HEARTBEAT_INTERVAL: 30000,      // 30s
  METRICS_INTERVAL: 1800000,      // 30m
  TASK_TIMEOUT_MS: 7200000,       // 120m
  CIRCUIT_THRESHOLD: 5,           // 5 fails to open
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  HEALTH_CHECK_PORT: process.env.HEALTH_CHECK_PORT || 3030,
  AUDIO_WAIT_BASE_MS: 450000,     // 7.5m (Khôi phục theo yêu cầu USER)
  VIDEO_WAIT_BASE_MS: 600000,     // 10m
  MAX_ATTEMPTS: 40,
};

export enum TaskType {
  BLOG = 'BLOG',
  RESEARCH_BLOG = 'RESEARCH_BLOG',
  AUDIO = 'AUDIO',
  PODCAST = 'PODCAST',
  VIDEO = 'VIDEO'
}

/**
 * Interface chuẩn hóa cấu trúc dữ liệu đẩy vào BullMQ Job
 */
export interface TaskPayload {
  id: string;
  topic_name: string;
  type: TaskType;
  prompt_custom?: string;
  notebook_id?: string;
  post_id?: string;
}

// ============================================
// STATE & OBSERVABILITY
// ============================================

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const WORKER_LOCK_KEY = 'quan-pl-worker-lock';
const WORKER_ID = process.env.WORKER_ID || `worker-${Math.random().toString(36).substr(2, 9)}`;
const activeTasks = new Map<string, any>();

/**
 * TỰ ĐỘNG DỌN DẸP ZOMBIE CHROME & KHÓA DISTRIBUTED LOCK
 */
/**
 * TỰ ĐỘNG DỌN DẸP ZOMBIE CHROME & KHÓA DISTRIBUTED LOCK
 */
async function cleanupZombies() {
  try {
    const { execSync } = await import('child_process');
    execSync('pkill -f "Google Chrome" || true');
    execSync('pkill -f "Chromium" || true');
  } catch (e) { /* ignore */ }
}

async function ensureSingleton() {
  const redis = await taskQueue.client;
  const lock = await (redis as any).set(WORKER_LOCK_KEY, WORKER_ID, 'PX', 30000, 'NX');
  if (!lock) return false;
  
  // Duy trì lock (Heartbeat)
  setInterval(async () => {
    await redis.pexpire(WORKER_LOCK_KEY, 30000);
  }, 10000);
  
  return true;
}

const metrics = {
  startTime: new Date(),
  lastHeartbeat: new Date(),
  totalProcessed: 0,
  success: 0,
  failed: 0,
  circuitFailures: 0,
  activeTasks: 0,
};

// ============================================
// RESILIENCE PATTERNS
// ============================================

const isCircuitOpen = () => metrics.circuitFailures >= CONFIG.CIRCUIT_THRESHOLD;

function recordFailure() {
  metrics.circuitFailures++;
  if (isCircuitOpen()) {
    logger.error({ failures: metrics.circuitFailures }, '🚨 CIRCUIT BREAKER OPENED');
  }
}

function recordSuccess() {
  metrics.circuitFailures = 0; // Reset hoàn toàn khi có thành công
}

/**
 * Wrapper giới hạn thời gian thực thi (Timeout Pattern)
 * Ngăn chặn các tác vụ AI bị treo vô thời hạn (Ví dụ: chờ render video quá lâu).
 * @param {() => Promise<T>} fn - Hàm bất đồng bộ cần thực thi
 * @param {number} ms - Thời gian timeout tối đa (milliseconds)
 * @param {string} name - Tên định danh của tác vụ để log lỗi
 * @returns {Promise<T>} Kết quả trả về từ hàm fn nếu thành công trước thời hạn
 * @throws {Error} Ném lỗi nếu quá thời gian ms
 */
async function withTimeout<T>(fn: () => Promise<T>, ms: number, name: string): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error(`Timeout: ${name}`)));
      })
    ]);
  } finally {
    clearTimeout(id);
  }
}

/**
 * Wrapper tự động thử lại khi lỗi (Retry Pattern với Exponential Backoff & Jitter)
 * Giúp hệ thống tự phục hồi trước các lỗi mạng tạm thời hoặc rate-limit từ API.
 * Kích hoạt báo cáo Circuit Breaker nếu vượt quá số lần Retry cho phép.
 * @param {() => Promise<T>} fn - Hàm bất đồng bộ cần thực thi
 * @param {string} operation - Tên thao tác để ghi log
 * @param {number} retries - Số lần thử lại tối đa (Mặc định: CONFIG.RETRY_ATTEMPTS)
 * @returns {Promise<T>} Kết quả trả về từ hàm fn
 */
async function withRetry<T>(fn: () => Promise<T>, operation: string, retries = CONFIG.RETRY_ATTEMPTS): Promise<T> {
  for (let i = 1; i <= retries; i++) {
    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (err: any) {
      logger.warn({ operation, attempt: i, error: err.message }, 'Retry candidate');
      if (i === retries) {
        recordFailure();
        throw err;
      }
      // Exponential backoff with Jitter
      const jitter = Math.random() * 1000;
      await new Promise(r => setTimeout(r, (CONFIG.RETRY_DELAY * i) + jitter));
    }
  }
  throw new Error(`${operation} failed after ${retries} tries`);
}

// ============================================
// UTILITIES
// ============================================

const getFileExtension = (mime: string) => {
  const map: Record<string, string> = { 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'video/mp4': 'mp4', 'application/pdf': 'pdf' };
  return map[mime] || 'bin';
};

// ============================================
// MULTIMEDIA PIPELINE
// ============================================

/**
 * Đợi AI tạo multimedia với Exponential Backoff + Jitter
 */
async function waitForGeneration(taskId: string, notebookId: string, type: 'audio' | 'video'): Promise<boolean> {
  let attempts = 0;
  let delay = type === 'audio' ? CONFIG.AUDIO_WAIT_BASE_MS : CONFIG.VIDEO_WAIT_BASE_MS;
  const maxWaitTime = type === 'audio' ? 1200000 : 1800000; // 20 phút audio, 30 phút video

  let consecutiveErrors = 0;
  const startTime = Date.now();

  while (attempts < CONFIG.MAX_ATTEMPTS && (Date.now() - startTime) < maxWaitTime) {
    attempts++;
    try {
      logger.info({ type, notebookId, attempts }, `🔍 [${type}] Checking status (Attempt ${attempts})...`);
      const statusObj = await withRetry(
        () => type === 'audio' ? mcp.getAudioStatus(notebookId) : mcp.getVideoStatus(notebookId),
        `${type} Status Check`
      );
      consecutiveErrors = 0;

      const status = (
        (typeof statusObj?.data?.status === 'string' ? statusObj.data.status : '') ||
        statusObj?.status ||
        statusObj?.text ||
        (typeof statusObj === 'string' ? statusObj : '') ||
        ''
      ).toLowerCase();

      const logMsg = `⏳ [${type}] Attempt ${attempts}: Status "${status || 'polling'}"`;
      logger.info({ type, status, raw: statusObj }, logMsg);
      await updateTaskStatus(taskId, 'processing', logMsg);

      if (statusObj?.success === false || statusObj?.error) {
        throw new Error(`MCP Error: ${statusObj.error || 'Unknown error'}`);
      }

      if (['completed', 'ready', 'done', 'generated', 'success'].includes(status)) {
        logger.info({ type, notebookId }, '✅ Generation Completed');
        return true;
      }

      if (['error', 'failed', 'not_found'].includes(status)) {
        throw new Error(`Google AI reported ${type} failure or status not found: ${status}`);
      }

      const jitter = Math.random() * 10000;
      await new Promise(r => setTimeout(r, delay + jitter));
      delay = Math.min(delay * 1.2, 120000);
    } catch (err: any) {
      consecutiveErrors++;
      const isBrowserError = err.message.includes('Target page') || err.message.includes('closed') || err.message.includes('context');

      logger.error({ error: err.message, consecutiveErrors, isBrowserError }, 'Polling error');

      if (isBrowserError) {
        const errorMsg = '❌ Lỗi: Trình duyệt bị đóng hoặc Profile bị chiếm dụng. Vui lòng chạy "npm run auth" để reset.';
        await updateTaskStatus(taskId, 'failed', errorMsg);
        // Không throw nữa để BullMQ không tự động retry gây lặp vô tận
        logger.warn({ taskId }, '🛑 Stopping task due to browser error, preventing BullMQ retry.');
        return false;
      }

      await updateTaskStatus(taskId, 'processing', `⚠️ [${type}] Lỗi tạm thời: ${err.message} (Thử lại ${consecutiveErrors}/5)`);

      if (consecutiveErrors > 5) {
        await updateTaskStatus(taskId, 'failed', `❌ Thất bại sau 5 lần thử: ${err.message}`);
        throw new Error(`Too many polling errors: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  logger.warn({ type, notebookId }, `⏰ ${type} generation timed out after ${Math.round((Date.now() - startTime) / 60000)} minutes`);
  return false;
}

/**
 * Quy trình tải từ MCP và đẩy lên Supabase Storage (Memory Optimized)
 */
async function processAndUploadFile(notebookId: string, type: 'audio' | 'video') {
  logger.info({ notebookId, type }, '📥 Downloading asset from MCP');
  
  // Trích xuất ID nguyên bản từ URL
  const rawNotebookId = notebookId.includes('/notebook/') 
    ? notebookId.split('/notebook/')[1].split('?')[0] 
    : notebookId;

  logger.info({ notebookId, rawId: rawNotebookId, type }, `⏳ Chờ 20 giây để UI Google ổn định...`);
  await new Promise(resolve => setTimeout(resolve, 20000));

  // Lệnh tải file - Dùng chiến thuật "Chỉ tay tận nơi" bằng lệnh AskQuestion nếu download_audio hụt
  logger.info({ notebookId, type }, `📥 Đang ép MCP tìm và bấm nút Download bằng AI...`);
  
  // Thử dùng lệnh download_audio trước, nếu nó hụt (như bạn thấy) thì nó sẽ báo lỗi hoặc hụt file
  await mcp.downloadAudio(notebookId).catch(e => logger.warn('download_audio hụt, đang dùng AI dự phòng...'));

  // CÚ ĐẤM QUYẾT ĐỊNH: Dùng lệnh AskQuestion để ép trình duyệt tìm đúng chữ "Download"
  await mcp.askQuestion(notebookId, 'Please click the "Download" button in the audio player menu. It is the item with text "Download".').catch(e => logger.error('AskQuestion failed'));

  // CHIẾN THUẬT: Tự đi tìm file trong Downloads
  logger.info({ notebookId }, '⚠️ Đang chờ file xuất hiện trong thư mục Downloads...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const downloadDir = path.join(os.homedir(), 'Downloads');
    
    try {
      const files = fs.readdirSync(downloadDir);
      const now = Date.now();
      const recentFiles = files
        .map(file => {
          const filePath = path.join(downloadDir, file);
          try {
            const stats = fs.statSync(filePath);
            return { name: file, path: filePath, mtime: stats.mtimeMs };
          } catch { return null; }
        })
        .filter(f => f && (now - f.mtime) < 300000 && !f.name.startsWith('.')) // 5 phút cho chắc
        .sort((a, b) => b!.mtime - a!.mtime);

      if (recentFiles.length > 0) {
        const targetFile = recentFiles[0]!;
        logger.info({ fileName: targetFile.name }, '🎯 [BINGO] Đã tìm thấy file! Đang tiến hành Upload...');
        return await processFinalUpload({ url: targetFile.path }, notebookId, type);
      }
    } catch (err: any) {
      logger.error({ err: err.message }, '❌ Lỗi quét Downloads');
    }
    
    throw new Error(`Failed to capture ${type} file after AI click.`);
}

/**
 * Hàm phụ để xử lý Upload sau khi đã có link/path
 */
async function processFinalUpload(fileData: any, notebookId: string, type: string) {
  let buffer: Buffer;
  let mimeType: string;

  if (fileData.url.startsWith('http')) {
    const response = await fetch(fileData.url);
    if (!response.ok) throw new Error(`Failed to fetch ${type} from proxy`);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    mimeType = response.headers.get('content-type') || (type === 'audio' ? 'audio/mpeg' : 'video/mp4');
  } else {
    const fs = await import('fs');
    buffer = fs.readFileSync(fileData.url);
    mimeType = type === 'audio' ? 'audio/mpeg' : 'video/mp4';
  }

  const ext = getFileExtension(mimeType);
  const fileName = `${type}_${notebookId}_${Date.now()}.${ext}`;

  logger.info({ fileName, size: buffer.length }, '📤 Uploading to Supabase Storage');
  return await uploadAsset('multimedia', fileName, buffer, mimeType);
}

// ============================================
// STRATEGY HANDLERS
// ============================================

/**
 * Xử lý tác vụ tạo Blog Content bằng NotebookLM
 * @param {TaskPayload} task - Payload công việc
 */
async function handleBlogTask(task: TaskPayload) {
  const notebookId = task.notebook_id || process.env.NOTEBOOK_DEFAULT_ID || '';
  const prompt = buildContentPrompt(task.topic_name, task.prompt_custom);

  logger.info({ notebookId, taskId: task.id }, '🧠 Asking NotebookLM to write...');
  const response = await withRetry(() => mcp.askNotebookLM(prompt, notebookId), 'Blog Generation', 5);

  logger.info({ length: response?.length }, '📝 Received response from NotebookLM');

  const parsed = parseNotebookResponse(response);
  logger.info({ parsedTitle: parsed?.title, contentLength: parsed?.content?.length, hasKeywords: !!parsed?.seo?.keywords?.length }, '🔍 Parsed NotebookLM response');

  if (!parsed?.content || parsed.content.length < 500) {
    logger.warn({ length: response?.length, parsedContentLength: parsed?.content?.length }, '⚠️ AI response quá ngắn hoặc chưa hoàn tất. Đang thử lại...');
    throw new Error('AI response quá ngắn hoặc chưa hoàn tất. Đang thử lại...');
  }

  // Ép buộc kiểm tra SEO và Keywords để chống AI lười biếng (sinh văn bản thô)
  if (!parsed.seo || !parsed.seo.keywords || parsed.seo.keywords.length === 0) {
    logger.warn({ parsedTitle: parsed?.title }, '⚠️ AI response thiếu SEO Keywords, khả năng format bị hỏng. Đang thử lại...');
    throw new Error('AI response thiếu định dạng SEO. Đang thử lại...');
  }

  // Tự động thêm xuống dòng nếu tiêu đề dính liền nội dung (Fix lỗi mất format)
  let markdownContent = parsed.content.replace(/^(#{1,6}\s+.*?)(\s*\n\s*[^\s#])/gm, '$1\n\n$2');

  // Chuyển Markdown sang HTML hoàn chỉnh
  const htmlContent = await marked.parse(markdownContent, {
    gfm: true,
    breaks: true
  });

  const post = await insertDraftPost({
    title: parsed.title || task.topic_name,
    content: htmlContent,
    meta_title: parsed.seo?.meta_title,
    meta_description: parsed.seo?.meta_description,
    keywords: parsed.seo?.keywords,
    excerpt: parsed.seo?.excerpt,
    notebook_id: notebookId,
    source_task_id: task.id
  });

  if (post?.slug) {
    await sendTelegramNotification(task.topic_name, post.slug);
    await sendEmailNotification(task.topic_name, post.slug);
  }

  return { resultPostId: post.id };
}

/**
 * Đảm bảo có Notebook cho bài viết (Tìm trong mapping hoặc tạo mới)
 */
async function getOrCreateNotebookForPost(postId: string): Promise<string> {
  // 1. Kiểm tra mapping đã tồn tại trong DB chưa (Check cả bảng mappings và bảng posts)
  const { data: mapping } = await supabase
    .from('automation_mappings')
    .select('notebook_id')
    .eq('blog_id', postId)
    .maybeSingle();

  if (mapping?.notebook_id) {
    logger.info({ postId, notebookId: mapping.notebook_id }, '♻️ Found existing notebook mapping in DB. Reusing...');
    return mapping.notebook_id;
  }

  const { data: postData } = await supabase
    .from('posts')
    .select('notebook_id')
    .eq('id', postId)
    .maybeSingle();

  if (postData?.notebook_id) {
    logger.info({ postId, notebookId: postData.notebook_id }, '♻️ Found existing notebook ID in posts table. Reusing...');
    return postData.notebook_id;
  }

  // 🎯 PHÒNG CHỐNG SPAM: Kiểm tra Distributed Lock & ID tạm thời trên Redis
  const redis = await taskQueue.client;
  const postLockKey = `lock:notebook:post:${postId}`;
  const pendingIdKey = `pending:notebook:post:${postId}`;

  // 1. Kiểm tra xem có ID nào đang chờ xử lý (từ lần fail trước) không
  const pendingId = await redis.get(pendingIdKey);
  if (pendingId) {
    logger.info({ postId, pendingId }, '♻️ Found a pending Notebook ID from previous attempt. Reusing...');
    await supabase.from('automation_mappings').insert([{
      blog_id: postId,
      notebook_id: pendingId,
      platform: 'google_notebooklm'
    }]);
    await redis.del(pendingIdKey);
    return pendingId;
  }

  const isCreating = await (redis as any).set(postLockKey, WORKER_ID, 'NX', 'PX', 120000); // Khóa 2 phút
  if (!isCreating) {
    logger.warn({ postId }, '⏳ Một Worker khác đang tạo Notebook cho bài này. Đợi 5s rồi thử lấy Mapping...');
    await new Promise(r => setTimeout(r, 5000));
    const { data: retryMapping } = await supabase.from('automation_mappings').select('notebook_id').eq('blog_id', postId).single();
    if (retryMapping?.notebook_id) return retryMapping.notebook_id;
  }

  // 2. Lấy nội dung bài viết từ Supabase
  logger.info({ postId }, '🔍 Fetching post content for notebook creation...');
  const { data: post, error } = await supabase
    .from('posts')
    .select('title, content')
    .eq('id', postId)
    .single();

  if (error || !post) {
    await (redis as any).del(postLockKey);
    throw new Error(`Không tìm thấy bài viết ID: ${postId}`);
  }

  // 3. Tạo Notebook mới qua MCP
  logger.info({ title: post.title }, '🏗️ Creating new Notebook for post...');
  try {
    const result = await withRetry(
      () => mcp.createNotebook(post.title, [{ type: 'text', name: 'Post Content', value: post.content }]),
      'Create Notebook',
      3
    );

    const data = result?.data || result; // Hỗ trợ cả format có .data hoặc không
    const newNotebookId = data?.id || data?.notebook_id || (data?.url ? data.url.split('/').pop()?.split('?')[0] : null);

    if (!newNotebookId) {
      logger.error({ result }, '❌ MCP returned success but ID extraction failed (check format)');
      throw new Error('MCP failed to return a valid Notebook ID or URL');
    }

    // 🌟 LƯU VẾT NGAY LẬP TỨC: Đề phòng sập nguồn trước khi lưu Supabase
    await redis.set(pendingIdKey, newNotebookId, 'EX', 3600); // Giữ vết 1 tiếng

    // 4. Lưu mapping mới
    await supabase.from('automation_mappings').insert([{
      blog_id: postId,
      notebook_id: newNotebookId,
      platform: 'google_notebooklm'
    }]);

    await redis.del(pendingIdKey);
    await (redis as any).del(postLockKey);
    logger.info({ postId, newNotebookId }, '✅ New notebook created and mapped');
    return newNotebookId;
  } catch (err: any) {
    await (redis as any).del(postLockKey);
    const isBrowserError = err.message.includes('Target page') || err.message.includes('closed') || err.message.includes('context');
    if (isBrowserError) {
      const errorMsg = '❌ Lỗi: Trình duyệt bị kẹt khi đang tạo Notebook. Vui lòng chạy "npm run auth" để reset.';
      throw new Error(errorMsg);
    }
    throw err;
  }
}

/**
 * Xử lý tác vụ tạo và tải Multimedia (Audio/Video)
 * @param {TaskPayload} task - Payload công việc
 * @param {'audio'|'video'} type - Loại đa phương tiện
 */
async function handleMultimediaTask(task: TaskPayload, type: 'audio' | 'video') {
  let notebookId: string | undefined;

  // 🎯 PHÂN ĐỊNH 2 CÁCH TẠO AUDIO:
  if (task.post_id) {
    // CÁCH 2: Tạo từ bài viết thành phẩm (Luôn tạo/lấy Notebook chuyên biệt cho Post)
    logger.info({ postId: task.post_id }, '✨ Generating focused multimedia from Post content...');
    notebookId = await getOrCreateNotebookForPost(task.post_id);
  } else {
    // CÁCH 1: Tạo từ Notebook nguồn (Dùng ID có sẵn)
    logger.info({ notebookId: task.notebook_id }, '📚 Generating multimedia from existing Notebook sources...');
    notebookId = task.notebook_id || process.env.NOTEBOOK_DEFAULT_ID || '';
  }

  const notebookIdOrUrl = notebookId.startsWith('http') ? notebookId : `https://notebooklm.google.com/notebook/${notebookId}`;

  logger.info({ notebookUrl: notebookIdOrUrl, type, taskId: task.id }, `🎬 Checking ${type} status before trigger`);

  // Kiểm tra xem đã có sẵn chưa để tránh trigger đè hoặc bị treo
  const initialStatusObj = await withRetry(
    () => type === 'audio' ? mcp.getAudioStatus(notebookIdOrUrl) : mcp.getVideoStatus(notebookIdOrUrl),
    `${type} Pre-check`,
    2
  ).catch(() => null);

  const initialStatus = (
    (typeof initialStatusObj?.data?.status === 'string' ? initialStatusObj.data.status : '') ||
    initialStatusObj?.status ||
    initialStatusObj?.text ||
    ''
  ).toLowerCase();

  if (['completed', 'ready', 'done', 'generated', 'success'].includes(initialStatus)) {
    logger.info({ type, notebookUrl: notebookIdOrUrl }, `✅ ${type} already exists. Skipping trigger.`);
  } else {
    logger.info({ type, notebookUrl: notebookIdOrUrl, status: initialStatus }, `🎬 Triggering ${type} generation`);
    const genResult = await withRetry(
      () => type === 'audio' ? mcp.generateAudioOverview(notebookIdOrUrl) : mcp.generateVideoOverview(notebookIdOrUrl),
      `${type} Trigger`,
      3
    );
    
    if (genResult?.success === false) {
      throw new Error(`MCP Error: ${genResult.error || 'Unknown generation error'}`);
    }
    
    // Đợi 15s để trình duyệt ổn định trước khi bắt đầu polling
    await new Promise(r => setTimeout(r, 15000));
  }

  const ready = await waitForGeneration(task.id, notebookIdOrUrl, type);
  if (!ready) throw new Error(`${type} generation timed out or failed`);

  const publicUrl = await processAndUploadFile(notebookIdOrUrl, type);

  if (publicUrl && task.post_id) {
    await updatePostMultimedia(task.post_id, type === 'audio' ? 'audio_url' : 'video_url', publicUrl);
  } else if (!task.post_id) {
    logger.warn({ taskId: task.id }, '⚠️ Multimedia generated but no post_id provided to attach to');
  }
}

/**
 * Strategy Map for Task Routing
 */
const TASK_HANDLERS: Record<string, (task: TaskPayload) => Promise<any>> = {
  [TaskType.BLOG]: handleBlogTask,
  [TaskType.RESEARCH_BLOG]: handleBlogTask,
  [TaskType.AUDIO]: (t) => handleMultimediaTask(t, 'audio'),
  [TaskType.PODCAST]: (t) => handleMultimediaTask(t, 'audio'),
  [TaskType.VIDEO]: (t) => handleMultimediaTask(t, 'video'),
};

/**
 * Điều phối xử lý Task (Được gọi bởi BullMQ Worker)
 * Sử dụng pattern Strategy để phân loại xử lý.
 * @param {TaskPayload} task - Task payload truyền từ Redis Queue
 */
export async function processTaskDispatcher(payload: TaskPayload) {
  const { id, type, topic_name } = payload;
  const startTime = Date.now();

  // 🔍 KIỂM TRA SỐNG CÒN: Kiểm tra xem Task còn tồn tại trên Supabase không
  const { data: taskExists, error: checkError } = await supabase
    .from('content_tasks')
    .select('id, status')
    .eq('id', id)
    .single();

  if (checkError || !taskExists) {
    logger.warn({ taskId: id }, '⚠️ Task đã bị xoá khỏi Supabase hoặc không tìm thấy. Hủy bỏ xử lý.');
    return;
  }

  if (taskExists.status === 'completed' || taskExists.status === 'cancelled') {
    logger.info({ taskId: id, status: taskExists.status }, '⏭️ Task đã kết thúc trước đó, bỏ qua.');
    return;
  }

  logger.info({ taskId: id, type }, '⚡ Task processing started');
  activeTasks.set(id, { startTime, type });
  metrics.activeTasks = activeTasks.size;

  try {
    logger.info({ id }, '📡 Updating Supabase status to "processing"...');
    await updateTaskStatus(id, 'processing');
    metrics.activeTasks++;

    const handler = TASK_HANDLERS[type.toUpperCase()];
    if (!handler) throw new Error(`Unsupported task type: ${type}`);

    logger.info({ type, id }, '🎬 Calling task handler...');
    const result = await withTimeout(() => handler(payload), CONFIG.TASK_TIMEOUT_MS, type);
    logger.info({ id, type }, '✅ Task handler finished. Updating status to "completed".');

    await updateTaskStatus(id, 'completed', undefined, result?.resultPostId);
    metrics.success++;
    logger.info({ taskId: id, duration: `${(Date.now() - startTime) / 1000}s` }, '🏁 Task Completed');
  } catch (err: any) {
    metrics.failed++;
    logger.error({ taskId: id, error: err.message }, '❌ Task Failed');
    await updateTaskStatus(id, 'failed', err.message);
    throw err; // Ném ra cho BullMQ bắt để kích hoạt auto-retry
  } finally {
    metrics.activeTasks = Math.max(0, metrics.activeTasks - 1);
    metrics.totalProcessed++;
  }
}

// ============================================
// SYSTEM BOOTSTRAP
// ============================================

async function startHealthServer() {
  const app = express();
  app.use(cors());

  app.get('/health', (req, res) => {
    res.status(isCircuitOpen() ? 503 : 200).json({
      status: isCircuitOpen() ? 'unhealthy' : 'healthy',
      circuit: isCircuitOpen() ? 'OPEN' : 'CLOSED'
    });
  });

  app.get('/metrics', (req, res) => res.json({
    workerId: CONFIG.WORKER_ID,
    uptime_minutes: Math.round((new Date().getTime() - metrics.startTime.getTime()) / 60000),
    performance: {
      total: metrics.totalProcessed,
      success: metrics.success,
      failed: metrics.failed,
      rate: metrics.totalProcessed > 0 ? `${(metrics.success / metrics.totalProcessed * 100).toFixed(1)}%` : '0%'
    },
    system: {
      active_tasks: metrics.activeTasks,
      circuit_failures: metrics.circuitFailures,
      is_circuit_open: isCircuitOpen()
    }
  }));

  app.listen(CONFIG.HEALTH_CHECK_PORT, () => logger.info({ port: CONFIG.HEALTH_CHECK_PORT }, '🩺 Metrics API ready'));
}

async function queueTaskSafe(t: any) {
  const jobId = `task-${t.id}`;
  const existingJob = await taskQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'failed' || state === 'completed') {
      await existingJob.remove(); // Xóa lịch sử cũ để cho phép xếp hàng lại
    } else {
      logger.info({ jobId, state }, '⏭️ Job already active/waiting, skipping re-queue');
      return;
    }
  }

  await taskQueue.add('process-task', {
    id: t.id,
    type: t.type,
    topic_name: t.topic_name,
    prompt_custom: t.prompt_custom,
    notebook_id: t.notebook_id,
    post_id: t.result_post_id
  }, {
    jobId,
    attempts: 5,
    backoff: { type: 'exponential', delay: 15000 },
    removeOnComplete: { age: 3600 * 24 * 7 },
    removeOnFail: { age: 3600 * 24 * 30 },
    priority: 10,
  });
  logger.info({ jobId }, '➕ Task added to BullMQ');
}

async function recoverStaleTasks(isStartup = false) {
  try {
    const statuses = isStartup ? ['processing', 'queued', 'failed'] : ['processing', 'queued'];
    const { data: staleTasks } = await supabase
      .from('content_tasks')
      .select('*')
      .eq('worker_id', CONFIG.WORKER_ID)
      .in('status', statuses);

    if (staleTasks && staleTasks.length > 0) {
      if (isStartup) {
        logger.info({ count: staleTasks.length }, '♻️ Startup Recovery: Re-queueing all tasks (including failed ones)');
      } else {
        logger.info({ count: staleTasks.length }, `♻️ Đã khôi phục ${staleTasks.length} task stale`);
      }
      
      for (const task of staleTasks) {
        // Reset trạng thái về queued để Worker mới có thể nhặt và xử lý
        const { error: updErr } = await supabase
          .from('content_tasks')
          .update({ 
            status: 'pending', 
            logs: `🔄 Hồi sinh task từ trạng thái ${task.status} (Worker Restart)` 
          })
          .eq('id', task.id);
        
        if (updErr) {
          logger.error({ taskId: task.id, err: updErr.message }, '❌ Lỗi khi cập nhật trạng thái hồi sinh task');
          continue;
        }

        await queueTaskSafe(task);
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to recover stale tasks');
  }
}


async function pollPendingTasks() {
  try {
    await recoverStaleTasks(false);
    const tasks = await fetchPendingTasks();
    if (tasks.length > 0) {
      for (const t of tasks) {
        await queueTaskSafe(t);
      }
    }
  } catch (err: any) { logger.error({ err: err.message }, 'Polling pending tasks failed'); }
}



async function bootstrap() {
  // 🛡️ CHỐT CHẶN TRIỆT ĐỂ: Chống chạy trùng lặp
  const isUnique = await ensureSingleton();
  if (!isUnique) {
    logger.error('❌ CẢNH BÁO: Đã có một Worker khác đang chạy! Bản Worker này sẽ tự hủy.');
    process.exit(1);
  }

  // CHỈ dọn dẹp Zombie nếu mình là duy nhất
  logger.info('🧹 (Skip) Aggressive zombie cleanup disabled to protect active downloads.');
  // await cleanupZombies(); 

  logger.info({ id: CONFIG.WORKER_ID }, '🚀 KING DRAGON v2.6 PLATINUM starting...');

  await startHealthServer();

  // Khởi động Worker và Polling ngay để xử lý task gấp
  createTaskWorker();
  logger.info('⛓️ BullMQ Worker listener started');
  // Tăng lên 30s để tránh dồn dập
  setInterval(pollPendingTasks, 60000);

  try {
    await withRetry(() => initMCPClient(), 'MCP Init');
    // ĐÃ VÔ HIỆU HÓA TỰ ĐỘNG SYNC - Chỉ sync khi có yêu cầu từ Dashboard
  } catch (err: any) {
    logger.fatal({ err: err.message }, '🔥 Startup crash');
    process.exit(1);
  }

  // 1. Khôi phục các task bị kẹt của chính mình
  await recoverStaleTasks(true);

  // 2. Lấy danh sách task pending và nạp vào hàng đợi
  const tasks = await fetchPendingTasks();
  if (tasks.length > 0) {
    logger.info({ count: tasks.length }, '🆘 Startup Recovery: Re-queueing tasks');
    for (const t of tasks) {
      await queueTaskSafe(t);
    }
  }

  setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL);
  setInterval(() => logger.info({ metrics }, '📊 Metrics Report'), CONFIG.METRICS_INTERVAL);
}

async function sendHeartbeat() {
  metrics.lastHeartbeat = new Date();
  await sendDbHeartbeat().catch(e => logger.warn({ err: e.message }, 'Failed to send DB heartbeat'));
}

// ============================================
// NOTIFICATIONS
// ============================================

async function sendTelegramNotification(topic: string, slug: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    const message = `🐉 *KING DRAGON HUB*\n\n📝 Bài viết: *${topic}*\n\n🔗 ${dashboardUrl}/admin/posts/edit/${slug}`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
    });
  } catch (err) { logger.warn('Telegram failed'); }
}

async function sendEmailNotification(topic: string, slug: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  try {
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.sendMail({
      from: `"KING DRAGON HUB" <${user}>`,
      to: process.env.NOTIFICATION_EMAIL || user,
      subject: `[AI] Bài viết mới: ${topic}`,
      html: `<p>Hệ thống đã viết xong bài: <b>${topic}</b></p><p><a href="${dashboardUrl}/admin/posts/edit/${slug}">Xem bài viết</a></p>`,
    });
  } catch (err) { logger.warn('Email failed'); }
}

console.log('🚀 WORKER FILE LOADED - WAITING FOR INITIALIZATION...');

// Đợi 1 giây để đảm bảo toàn bộ hệ thống (Redis/BullMQ) đã khởi tạo xong
setTimeout(() => {
  if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('worker.ts')) {
    console.log('🎬 STARTING WORKER BOOTSTRAP...');
    bootstrap().catch(err => {
      logger.fatal({ err: err.message }, '🔥 Global Uncaught Error');
      process.exit(1);
    });
  } else {
    console.log('⏭️ Worker file loaded as module, skipping auto-bootstrap');
  }
}, 1000);


process.on('SIGINT', async () => {
  logger.info('🛑 Graceful shutdown...');
  try {
    const redis = await taskQueue.client;
    await redis.del(WORKER_LOCK_KEY);
    logger.info('🔓 Redis Singleton Lock released.');
  } catch (e) { }
  await closeBullMQ();
  await closeMCPClient();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '🔥 Unhandled Rejection');
});