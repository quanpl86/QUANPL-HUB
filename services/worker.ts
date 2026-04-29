/**
 * ============================================
 * QUAN-PL HUB — LOCAL WORKER
 * Content OS Hybrid Mode (NotebookLM + MCP)
 * ============================================
 * 
 * Script này chạy trên máy local của Quân.
 * Nhiệm vụ: Polling tasks từ Supabase → Xử lý qua MCP/NotebookLM → Đẩy draft lên CMS.
 * 
 * Cách chạy:
 *   cd services
 *   cp .env.example .env  (rồi điền thông tin)
 *   npm install
 *   npm start
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';
import { fetchPendingTasks, updateTaskStatus, insertDraftPost, sendHeartbeat } from './supabase-client.js';
import { initMCPClient, selectNotebook, askNotebookLM, closeMCPClient } from './mcp-client.js';
import { buildContentPrompt, parseNotebookResponse } from './prompt-templates.js';

// ============================================
// CONFIG
// ============================================
const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '30000');
const WORKER_ID = process.env.WORKER_ID || 'local-worker';
const DEFAULT_NOTEBOOK = process.env.NOTEBOOK_DEFAULT_ID || '';

let isProcessing = false;
let cycleCount = 0;

// ============================================
// MAIN LOOP
// ============================================
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🐉 KING DRAGON WORKER — Content OS v1.0   ║');
  console.log('║   Hybrid Mode: NotebookLM + MCP Bridge      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`[Worker] ID: ${WORKER_ID}`);
  console.log(`[Worker] Poll Interval: ${POLL_INTERVAL}ms`);
  console.log(`[Worker] Default Notebook: ${DEFAULT_NOTEBOOK || '(chưa cấu hình)'}`);
  console.log('');

  // Khởi tạo MCP Client
  try {
    await initMCPClient();
    console.log('[Worker] ✅ MCP Client đã sẵn sàng.');
  } catch (error: any) {
    console.error('[Worker] ❌ Không thể kết nối MCP Server:', error.message);
    console.error('[Worker] Hãy đảm bảo notebooklm-mcp-secure đã được cài đặt.');
    console.error('[Worker] Chạy: npx @pan-sec/notebooklm-mcp@latest setup_auth');
    process.exit(1);
  }

  // Gửi heartbeat đầu tiên
  await sendHeartbeat();
  console.log('[Worker] 💓 Heartbeat đã gửi.');
  console.log('[Worker] 🔄 Bắt đầu polling...\n');

  // Polling loop
  setInterval(pollAndProcess, POLL_INTERVAL);

  // Heartbeat mỗi 60s
  setInterval(sendHeartbeat, 60000);
}

// ============================================
// POLL & PROCESS
// ============================================
async function pollAndProcess() {
  if (isProcessing) {
    return; // Tránh xử lý chồng chéo
  }

  cycleCount++;
  const timestamp = new Date().toLocaleTimeString('vi-VN');

  try {
    const tasks = await fetchPendingTasks();

    if (tasks.length === 0) {
      // Log mỗi 10 chu kỳ để tránh spam
      if (cycleCount % 10 === 0) {
        console.log(`[${timestamp}] Hàng đợi trống. Chu kỳ #${cycleCount}`);
      }
      return;
    }

    console.log(`[${timestamp}] 📋 Tìm thấy ${tasks.length} task(s) đang chờ.`);

    for (const task of tasks) {
      isProcessing = true;
      await processTask(task);
      isProcessing = false;
    }
  } catch (error: any) {
    console.error(`[${timestamp}] ❌ Lỗi polling:`, error.message);
    isProcessing = false;
  }
}

// ============================================
// PROCESS SINGLE TASK
// ============================================
async function processTask(task: any) {
  const { id, topic_name, notebook_id } = task;
  const ts = () => new Date().toLocaleTimeString('vi-VN');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${ts()}] 🚀 XỬ LÝ: "${topic_name}"`);
  console.log(`[${ts()}] Task ID: ${id}`);
  console.log(`${'='.repeat(60)}`);

  // 1. Cập nhật status → processing
  await updateTaskStatus(id, 'processing', `[${ts()}] Worker ${WORKER_ID} đã nhận task.`);

  try {
    // 2. Chọn Notebook
    const targetNotebook = notebook_id || DEFAULT_NOTEBOOK;
    if (!targetNotebook) {
      throw new Error('Không có Notebook ID. Hãy cấu hình NOTEBOOK_DEFAULT_ID hoặc chỉ định trong task.');
    }

    console.log(`[${ts()}] 📓 Chọn Notebook: ${targetNotebook}`);
    const selected = await selectNotebook(targetNotebook);
    if (!selected) {
      throw new Error(`Không thể truy cập Notebook: ${targetNotebook}`);
    }

    await updateTaskStatus(id, 'processing',
      `[${ts()}] Đã kết nối Notebook: ${targetNotebook}\n` +
      `[${ts()}] Đang yêu cầu NotebookLM AI soạn bài...`
    );

    // 3. Gọi NotebookLM viết bài
    console.log(`[${ts()}] ✍️ Đang gửi prompt đến NotebookLM...`);
    const prompt = buildContentPrompt(topic_name);
    let rawResponse: any;
    
    try {
      rawResponse = await askNotebookLM(prompt, targetNotebook);
    } catch (err: any) {
      console.error(`[${ts()}] ❌ Lỗi gọi NotebookLM:`, err.message);
      throw err;
    }

    if (!rawResponse) {
      throw new Error('NotebookLM không trả về nội dung nào.');
    }

    // Đảm bảo là chuỗi
    const safeContent = String(rawResponse);
    console.log(`[${ts()}] 📝 Đã nhận response (${safeContent.length} chars).`);

    // 4. Parse JSON response
    const parsed = parseNotebookResponse(safeContent);

    // Kiểm tra xem có parse được JSON và có nội dung không
    if (!parsed || !parsed.content) {
      // Fallback: Nếu NotebookLM không trả JSON hoặc thiếu content, dùng raw response làm content
      console.warn(`[${ts()}] ⚠️ Không parse được JSON hoặc thiếu content, sử dụng raw content làm nội dung bài viết.`);

      const fallbackPost = await insertDraftPost({
        title: (parsed && parsed.title) ? parsed.title : topic_name,
        content: safeContent,
        excerpt: safeContent.length > 160 ? safeContent.substring(0, 160) + '...' : safeContent,
        meta_title: (parsed && parsed.title) ? parsed.title : topic_name,
        meta_description: safeContent.length > 160 ? safeContent.substring(0, 160) : safeContent,
        source_task_id: id,
      });

      if (!fallbackPost) {
        throw new Error('Lỗi lưu bài viết (Fallback mode).');
      }

      await updateTaskStatus(id, 'completed',
        `[${ts()}] ⚠️ Hoàn thành (Fallback mode - raw content)\n` +
        `[${ts()}] Draft ID: ${fallbackPost.id}\n` +
        `[${ts()}] Slug: ${fallbackPost.slug}`,
        fallbackPost.id
      );

      console.log(`[${ts()}] ✅ Hoàn thành (fallback). Slug: ${fallbackPost.slug}`);
      return;
    }

    // 5. Lưu bài viết chính thức (đã parse thành công)
    console.log(`[${ts()}] 💾 Đang lưu bài viết vào CMS...`);
    
    const post = await insertDraftPost({
      title: parsed.title || topic_name,
      content: parsed.content,
      excerpt: parsed.seo?.excerpt || (typeof parsed.content === 'string' ? parsed.content.substring(0, 160) : ''),
      meta_title: parsed.seo?.meta_title || parsed.title || topic_name,
      meta_description: parsed.seo?.meta_description || parsed.seo?.excerpt || '',
      keywords: parsed.seo?.keywords || [],
      schema_org: parsed.schema || undefined,
      source_task_id: id,
    });

    if (!post) {
      throw new Error('Lỗi khi chèn bài viết vào cơ sở dữ liệu.');
    }

    // 6. Cập nhật status → completed
    await updateTaskStatus(id, 'completed', 
      `[${ts()}] ✅ Hoàn thành thành công!\n` +
      `[${ts()}] Draft ID: ${post.id}\n` +
      `[${ts()}] Slug: ${post.slug}`,
      post.id
    );

    console.log(`[${ts()}] ✅ HOÀN THÀNH! Slug: ${post.slug}`);
    console.log(`[${ts()}] 📊 Title: ${parsed.title}`);
    console.log(`[${ts()}] 🔑 Keywords: ${parsed.seo?.keywords?.join(', ') || 'N/A'}`);

    // 7. Notification (optional)
    await Promise.allSettled([
      sendNotification(topic_name, post.slug),
      sendEmailNotification(topic_name, post.slug)
    ]);

  } catch (error: any) {
    console.error(`[${ts()}] ❌ THẤT BẠI: ${error.message}`);
    await updateTaskStatus(id, 'failed',
      `[${ts()}] ❌ Lỗi: ${error.message}`
    );
  }
}

// ============================================
// NOTIFICATIONS (Optional)
// ============================================

// --- Telegram ---
async function sendNotification(topic: string, slug: string) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !chatId) return;

  try {
    const message = `🐉 *KING DRAGON — Bài viết mới!*\n\n📝 *${topic}*\n\n🔗 Kiểm duyệt: /admin/posts/edit/${slug}`;

    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    console.log('[Notify] Đã gửi thông báo Telegram.');
  } catch (error: any) {
    console.warn('[Notify] Lỗi gửi Telegram:', error.message);
  }
}

// --- Email via Gmail ---
async function sendEmailNotification(topic: string, slug: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const toEmail = process.env.NOTIFICATION_EMAIL || user;

  if (!user || !pass) return; // Nếu không cấu hình thì bỏ qua

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    const editUrl = `${process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : 'http://localhost:3000'}/admin/posts/edit/${slug}`;

    await transporter.sendMail({
      from: `"KING DRAGON AI" <${user}>`,
      to: toEmail,
      subject: `[AI Content] Bài viết mới: ${topic}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #f97316; border-radius: 5px; background: #fff;">
          <h2 style="color: #f97316;">🐉 KING DRAGON AI</h2>
          <p>Hệ thống AI vừa hoàn thành một bài viết mới.</p>
          <div style="padding: 15px; background: #f3f4f6; border-left: 4px solid #f97316; margin: 20px 0;">
            <strong>Chủ đề:</strong> ${topic}
          </div>
          <a href="${editUrl}" style="display: inline-block; padding: 10px 20px; background: #f97316; color: white; text-decoration: none; font-weight: bold; border-radius: 3px;">
            Kiểm duyệt bản nháp
          </a>
        </div>
      `,
    });

    console.log('[Notify] Đã gửi thông báo Email.');
  } catch (error: any) {
    console.warn('[Notify] Lỗi gửi Email:', error.message);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
async function shutdown() {
  console.log('\n[Worker] 🛑 Đang tắt Worker...');
  await closeMCPClient();
  console.log('[Worker] 👋 Đã tắt. Hẹn gặp lại!');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ============================================
// START
// ============================================
main().catch((error) => {
  console.error('[Worker] Fatal Error:', error);
  process.exit(1);
});
