/**
 * ============================================
 * QUAN-PL HUB — LOCAL WORKER
 * Content OS Hybrid Mode (NotebookLM + MCP)
 * ============================================
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';
import { fetchPendingTasks, updateTaskStatus, insertDraftPost, sendHeartbeat, uploadAsset, updatePostMultimedia } from './supabase-client.js';
import mcp, { initMCPClient, selectNotebook, askNotebookLM, closeMCPClient } from './mcp-client.js';
import { buildContentPrompt, parseNotebookResponse } from './prompt-templates.js';
import { marked } from 'marked';
import fs from 'fs';

// ============================================
// CONFIG
// ============================================
const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '30000');
const WORKER_ID = process.env.WORKER_ID || 'local-worker';
const DEFAULT_NOTEBOOK = process.env.NOTEBOOK_DEFAULT_ID || '';

console.log(`[Worker] 🌐 Kết nối Supabase: ${process.env.SUPABASE_URL}`);

let isProcessing = false;
let cycleCount = 0;

// ============================================
// MAIN LOOP
// ============================================
async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🐉 KING DRAGON WORKER — Content OS v2.0   ║');
  console.log('║   Multi-tasking: Blog, Audio, Video         ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  try {
    await initMCPClient();
    console.log('[Worker] ✅ MCP Client đã sẵn sàng.');
  } catch (error: any) {
    console.error('[Worker] ❌ Lỗi kết nối MCP:', error.message);
    process.exit(1);
  }

  await sendHeartbeat();
  
  // Chạy ngay lần đầu
  pollAndProcess();
  
  setInterval(pollAndProcess, POLL_INTERVAL);
  setInterval(sendHeartbeat, 60000);
}

// ============================================
// POLL & PROCESS
// ============================================
async function pollAndProcess() {
  if (isProcessing) return;
  console.log(`[${new Date().toLocaleTimeString()}] ⚡ Đang quét hàng đợi...`);

  try {
    const tasks = await fetchPendingTasks();
    if (tasks.length === 0) {
      cycleCount++;
      if (cycleCount % 10 === 0) console.log(`[${new Date().toLocaleTimeString()}] Đang đợi task...`);
      return;
    }

    for (const task of tasks) {
      isProcessing = true;
      await processTask(task);
      isProcessing = false;
    }
  } catch (error: any) {
    console.error('[Worker] Lỗi polling:', error.message);
    isProcessing = false;
  }
}

// ============================================
// TASK DISPATCHER
// ============================================
async function processTask(task: any) {
  const { id, topic_name, type = 'BLOG' } = task;
  const ts = () => new Date().toLocaleTimeString('vi-VN');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${ts()}] 🚀 XỬ LÝ (${type}): "${topic_name}"`);
  console.log(`${'='.repeat(60)}`);

  await updateTaskStatus(id, 'processing', `Worker nhận Task loại ${type}.`);

  try {
    switch (type.toUpperCase()) {
      case 'BLOG':
        await handleBlogTask(task);
        break;
      case 'RESEARCH_BLOG':
        await handleDeepResearchTask(task);
        break;
      case 'AUDIO':
      case 'PODCAST':
        await handleAudioTask(task);
        break;
      case 'VIDEO':
        await handleVideoTask(task);
        break;
      default:
        throw new Error(`Loại task ${type} chưa hỗ trợ.`);
    }
  } catch (error: any) {
    console.error(`[${ts()}] ❌ Lỗi: ${error.message}`);
    await updateTaskStatus(id, 'failed', `❌ Lỗi: ${error.message}`);
  }
}

/**
 * Task 1.1: Viết bài Blog
 */
async function handleBlogTask(task: any) {
  const { id, topic_name, notebook_id, metadata } = task;
  const notebookId = task.notebook_id || process.env.NOTEBOOK_DEFAULT_ID;
  console.log(`[Worker] 🚀 BẮT ĐẦU XỬ LÝ BLOG: "${task.topic_name}"`);
  console.log(`[Worker] 📂 Sử dụng Notebook ID: ${notebookId}`);
  
  await selectNotebook(notebookId);
  const prompt = buildContentPrompt(topic_name, metadata?.prompt);
  const rawResponse = await askNotebookLM(prompt, notebookId);
  const responseStr = String(rawResponse).toLowerCase();
  
  // KIỂM TRA THÔNG MINH: Nếu là JSON thành công thì không báo lỗi
  let isActuallySuccess = false;
  if (rawResponse.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawResponse);
      if (parsed.success === true || (parsed.data && parsed.success !== false)) {
        isActuallySuccess = true;
      }
    } catch (e) {}
  }

  if (!isActuallySuccess) {
    if (!rawResponse || responseStr.includes('failed') || responseStr.includes('error') || responseStr.includes('timeout')) {
        throw new Error(`AI không phản hồi hoặc gặp lỗi: ${rawResponse}`);
    }
  }

  const parsed = parseNotebookResponse(String(rawResponse));
  let markdownContent = parsed?.content || String(rawResponse);
  
  // SỬA LỖI: Tự động thêm xuống dòng nếu tiêu đề dính liền nội dung
  // Tìm các đoạn ## Tiêu đề (không có xuống dòng sau đó) và chèn thêm \n\n
  markdownContent = markdownContent.replace(/^(#{1,6}\s+.*?)(\s*\n\s*[^\s#])/gm, '$1\n\n$2');
  
  const htmlContent = await marked.parse(markdownContent);
  
  const post = await insertDraftPost({
    title: parsed?.title || topic_name,
    content: htmlContent,
    excerpt: parsed?.seo?.excerpt || '',
    meta_title: parsed?.seo?.meta_title || parsed?.title || topic_name,
    meta_description: parsed?.seo?.meta_description || '',
    keywords: parsed?.seo?.keywords || [],
    source_task_id: id,
  });

  if (!post) throw new Error('Không lưu được bài viết vào Database.');

  await updateTaskStatus(id, 'completed', `✅ Đã xong: ${post.slug}`, post.id);
  console.log(`[Worker] ✅ Hoàn thành bài viết: ${post.slug}`);
  
  await Promise.allSettled([
    sendNotification(topic_name, post.slug),
    sendEmailNotification(topic_name, post.slug)
  ]);
}

/**
 * GIAI ĐOẠN 3: Nghiên cứu sâu + Viết bài
 */
async function handleDeepResearchTask(task: any) {
  const { id, topic_name, notebook_id, metadata } = task;
  const targetNotebook = notebook_id || process.env.NOTEBOOK_DEFAULT_ID;

  console.log(`[Worker] 🔬 BẮT ĐẦU DEEP RESEARCH: "${topic_name}"`);
  console.log(`[Worker] 📂 Sử dụng Notebook ID: ${targetNotebook}`);
  
  await updateTaskStatus(id, 'processing', `Đang thực hiện Deep Research trên Web...`);
  
  // 1. Thực hiện nghiên cứu qua Gemini
  const researchResult = await mcp.deepResearch(topic_name);
  const researchText = researchResult?.content?.[0]?.text || researchResult?.text || '';
  
  if (!researchText) throw new Error('Không lấy được kết quả nghiên cứu.');
  console.log(`[Worker] 📊 Đã có kết quả nghiên cứu (${researchText.length} ký tự).`);

  // 2. Nạp kết quả nghiên cứu vào NotebookLM (Task 3.2)
  console.log(`[Worker] 📥 Đang nạp kết quả nghiên cứu vào NotebookLM...`);
  await updateTaskStatus(id, 'processing', `Đang nạp dữ liệu nghiên cứu vào Notebook...`);
  
  // Dùng manageSources để thêm researchText như một text source
  await mcp.manageSources(targetNotebook, 'add', [{
    type: 'text',
    title: `Research: ${topic_name}`,
    content: researchText
  }]);

  // 3. Viết bài dựa trên tri thức mới
  console.log(`[Worker] ✍️ Đang soạn bài viết chuyên sâu...`);
  await selectNotebook(targetNotebook);
  const prompt = buildContentPrompt(topic_name, metadata?.prompt);
  const rawResponse = await askNotebookLM(prompt, targetNotebook);
  const responseStr = String(rawResponse).toLowerCase();
  
  // KIỂM TRA THÔNG MINH: Nếu là JSON thành công thì không báo lỗi
  let isActuallySuccess = false;
  if (rawResponse.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawResponse);
      if (parsed.success === true || (parsed.data && parsed.success !== false)) {
        isActuallySuccess = true;
      }
    } catch (e) {}
  }

  if (!isActuallySuccess) {
    if (!rawResponse || responseStr.includes('failed') || responseStr.includes('error') || responseStr.includes('timeout')) {
        throw new Error(`AI không phản hồi hoặc gặp lỗi (Deep Research): ${rawResponse}`);
    }
  }
  
  // 4. Trích xuất bảng dữ liệu (Task 3.3)
  console.log(`[Worker] 📊 Đang trích xuất bảng dữ liệu so sánh...`);
  let tableHtml = '';
  try {
    const tableResult = await mcp.generateDataTable(targetNotebook);
    const tableData = tableResult?.content?.[0]?.text || '';
    if (tableData) {
      tableHtml = `\n\n<h3>Bảng so sánh kỹ thuật (AI Generated)</h3>\n${tableData}`;
    }
  } catch (err) {
    console.warn('[Worker] Không trích xuất được bảng dữ liệu, bỏ qua.');
  }

  const parsed = parseNotebookResponse(String(rawResponse));
  let markdownBody = parsed?.content || String(rawResponse);
  
  // SỬA LỖI: Tự động thêm xuống dòng nếu tiêu đề dính liền nội dung
  markdownBody = markdownBody.replace(/^(#{1,6}\s+.*?)(\s*\n\s*[^\s#])/gm, '$1\n\n$2');
  
  const fullMarkdown = markdownBody + tableHtml;
  const htmlContent = await marked.parse(fullMarkdown);

  const post = await insertDraftPost({
    title: parsed?.title || topic_name,
    content: htmlContent,
    excerpt: parsed?.seo?.excerpt || '',
    source_task_id: id,
  });

  if (!post) throw new Error('Lỗi lưu bài viết sau nghiên cứu.');

  await updateTaskStatus(id, 'completed', `✅ Đã hoàn thành sau khi Nghiên cứu sâu: ${post.slug}`, post.id);
  console.log(`[Worker] ✅ HOÀN THÀNH (Deep Research Mode): ${post.slug}`);
}

/**
 * Task 2.2 & 2.3: Xử lý tạo Podcast (Polling + Upload)
 */
async function handleAudioTask(task: any) {
  const { id, notebook_id, result_post_id } = task;
  const ts = () => new Date().toLocaleTimeString('vi-VN');
  const targetNotebook = notebook_id || DEFAULT_NOTEBOOK;

  console.log(`[Worker] 🎙️ Bắt đầu tạo Audio Overview...`);
  await mcp.generateAudio(targetNotebook);
  
  let isReady = false;
  let attempts = 0;
  const maxAttempts = 120; // Chờ tối đa 30 phút cho audio cực dài
  
  while (!isReady && attempts < maxAttempts) {
    attempts++;
    const status = await mcp.getAudioStatus(targetNotebook);
    const currentStatus = (status?.status || '').toLowerCase();
    
    if (currentStatus === 'completed' || currentStatus === 'ready') {
      isReady = true;
      break;
    } else if (currentStatus === 'error' || currentStatus === 'failed') {
      throw new Error('AI báo lỗi khi thu âm.');
    }
    
    console.log(`[Worker] ⏳ Đang đợi AI thu âm... (Lần ${attempts}/20)`);
    await new Promise(r => setTimeout(r, 15000)); // Giảm xuống 15s cho nhanh
  }

  if (!isReady) throw new Error('Hết thời gian chờ AI thu âm.');

  // Task 2.3: Tải và Upload
  console.log(`[Worker] 📥 Đang trích xuất link Audio...`);
  const downloadInfo = await mcp.downloadAudio(targetNotebook);
  const audioUrl = downloadInfo?.download_url || downloadInfo?.url;

  if (!audioUrl) throw new Error('Không lấy được link download audio.');

  console.log(`[Worker] ☁️ Đang chuyển tiếp Audio lên Supabase Storage...`);
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const fileName = `podcast-${id}-${Date.now()}.mp3`;
  const publicUrl = await uploadAsset('multimedia', `podcasts/${fileName}`, arrayBuffer, 'audio/mpeg');

  if (publicUrl && result_post_id) {
    await updatePostMultimedia(result_post_id, 'audio_url', publicUrl);
    console.log(`[Worker] ✅ Đã gắn Audio vào bài viết: ${publicUrl}`);
  }

  await updateTaskStatus(id, 'completed', `✅ Podcast đã sẵn sàng: ${publicUrl}`);
}


/**
 * Task 2.4: Xử lý tạo Video (Polling + Upload)
 */
async function handleVideoTask(task: any) {
  const { id, notebook_id, result_post_id, metadata } = task;
  const ts = () => new Date().toLocaleTimeString('vi-VN');
  const targetNotebook = notebook_id || DEFAULT_NOTEBOOK;
  const style = metadata?.style || 'heritage';

  console.log(`[Worker] 🎬 Bắt đầu tạo Video Overview (Style: ${style})...`);
  await mcp.generateVideo(targetNotebook, style);
  
  let isReady = false;
  let attempts = 0;
  const maxAttempts = 30; // Video tốn nhiều thời gian hơn (khoảng 15-20 phút)

  while (!isReady && attempts < maxAttempts) {
    attempts++;
    console.log(`[Worker] ⏳ Đang đợi AI dựng Video... (Lần ${attempts}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, 60000)); // Đợi 60s cho mỗi lần check Video

    const status = await mcp.getVideoStatus(targetNotebook);
    if (status?.status === 'completed' || status?.status === 'ready') {
      isReady = true;
    } else if (status?.status === 'error') {
      throw new Error('AI báo lỗi khi dựng Video.');
    }
  }

  if (!isReady) throw new Error('Hết thời gian chờ AI dựng Video.');

  console.log(`[Worker] 📥 Đang trích xuất link Video...`);
  const downloadInfo = await mcp.downloadVideo(targetNotebook);
  const videoUrl = downloadInfo?.download_url || downloadInfo?.url;

  if (!videoUrl) throw new Error('Không lấy được link download video.');

  console.log(`[Worker] ☁️ Đang chuyển tiếp Video lên Supabase Storage...`);
  const response = await fetch(videoUrl);
  const arrayBuffer = await response.arrayBuffer();
  const fileName = `video-${id}-${Date.now()}.mp4`;
  const publicUrl = await uploadAsset('multimedia', `videos/${fileName}`, arrayBuffer, 'video/mp4');

  if (publicUrl && result_post_id) {
    await updatePostMultimedia(result_post_id, 'video_url', publicUrl);
    console.log(`[Worker] ✅ Đã gắn Video vào bài viết: ${publicUrl}`);
  }

  await updateTaskStatus(id, 'completed', `✅ Video đã sẵn sàng: ${publicUrl}`);
}


// ============================================
// NOTIFICATIONS
// ============================================

async function sendNotification(topic: string, slug: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const message = `🐉 *QUAN-PL HUB — BÀI VIẾT MỚI*\n\n📝 *${topic}*\n\n🔗 /admin/posts/edit/${slug}`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
    });
  } catch (err) { console.warn('Lỗi Telegram:', err); }
}

async function sendEmailNotification(topic: string, slug: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.sendMail({
      from: `"KING DRAGON" <${user}>`,
      to: process.env.NOTIFICATION_EMAIL || user,
      subject: `[AI Content] Bài viết mới: ${topic}`,
      html: `<p>AI vừa hoàn thành bài viết: <b>${topic}</b></p><a href="http://localhost:3000/admin/posts/edit/${slug}">Kiểm duyệt ngay</a>`,
    });
  } catch (err) { console.warn('Lỗi Email:', err); }
}

// ============================================
// START
// ============================================
main().catch(console.error);

process.on('SIGINT', async () => {
  await closeMCPClient();
  process.exit(0);
});
