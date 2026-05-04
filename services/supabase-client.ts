import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('[Supabase] Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

/** Helper slugify */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Fetch pending tasks */
export async function fetchPendingTasks() {
  const { data, error } = await supabase
    .from('content_tasks')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) logger.error({ err: error.message }, '[DB] Lỗi lấy pending tasks');
  return data || [];
}

/** Recover stale tasks */
export async function recoverStaleTasks(force = false) {
  const threshold = force 
    ? new Date().toISOString() 
    : new Date(Date.now() - 120 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('content_tasks')
    .update({ 
      status: 'pending',
      logs: force ? '🔄 Khôi phục khi Worker restart' : '🔄 Reset do timeout'
    })
    .eq('status', 'processing')
    .lt('updated_at', threshold)
    .select();

  if (error) logger.error({ err: error.message }, '[DB] Lỗi recover stale tasks');
  else if (data && data.length > 0) logger.info(`♻️ Đã khôi phục ${data.length} task stale`);
}

/** Cập nhật status task */
export async function updateTaskStatus(
  taskId: string,
  status: string,
  logs?: string,
  resultPostId?: string
) {
  const update: Record<string, any> = {
    status,
    worker_id: process.env.WORKER_ID || 'local-worker',
  };

  if (logs) update.logs = logs;
  if (resultPostId) update.result_post_id = resultPostId;

  const { error } = await supabase
    .from('content_tasks')
    .update(update)
    .eq('id', taskId);

  if (error) {
    logger.error({ err: error.message }, `[DB] Lỗi cập nhật task ${taskId}`);
  }
}

/** Insert draft post */
export async function insertDraftPost(data: any) {
  const slug = slugify(data.title) + '-ai-' + Date.now().toString(36);

  const { data: post, error } = await supabase
    .from('posts')
    .insert([{
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      is_published: false,
      is_ai_generated: true,
      comments_enabled: true,
      meta_title: data.meta_title || data.title,
      meta_description: data.meta_description,
      keywords: data.keywords || [],
      seo_keywords: data.seo_keywords || null,
      schema_org: data.schema_org || null,
      source_task_id: data.source_task_id,
      notebook_id: data.notebook_id,
    }])
    .select('id, slug')
    .single();

  if (error) {
    logger.error({ err: error.message }, '[DB] Lỗi tạo draft post');
    throw error;
  }
  return post;
}

/** Gửi heartbeat */
export async function sendHeartbeat() {
  const { error } = await supabase
    .from('automation_settings')
    .upsert({
      key_name: 'MCP_WORKER_HEARTBEAT',
      key_value: new Date().toISOString(),
    }, { onConflict: 'key_name' });

  if (error) {
    logger.error({ err: error.message }, '[DB] Lỗi gửi heartbeat');
  }
}

/** Upload asset to Storage */
export async function uploadAsset(bucket: string, filePath: string, body: Buffer | ArrayBuffer | string, contentType: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, body, { contentType, upsert: true });

  if (error) {
    logger.error({ err: error.message }, `[Storage] Upload failed: ${filePath}`);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

/** Cập nhật URL Đa phương tiện cho bài viết */
export async function updatePostMultimedia(postId: string, field: 'audio_url' | 'video_url', url: string) {
  const { error } = await supabase
    .from('posts')
    .update({ [field]: url })
    .eq('id', postId);

  if (error) {
    logger.error({ err: error.message }, `[DB] Lỗi cập nhật multimedia cho bài ${postId}`);
    return false;
  }
  return true;
}

/** Đồng bộ danh sách NotebookLM từ Local lên Supabase */
export async function syncNotebooksToSupabase(notebooks: any[]) {
  const validIds = notebooks.map(nb => nb.id);
  
  if (validIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('automation_notebooks')
      .delete()
      .not('id', 'in', `(${validIds.join(',')})`);
    
    if (deleteError) {
      logger.error({ err: deleteError.message }, '[DB] Lỗi xóa Notebook cũ');
    }
  }

  const records = notebooks.map(nb => ({
    id: nb.id,
    name: nb.name,
    description: nb.description || '',
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('automation_notebooks')
    .upsert(records, { onConflict: 'id' });

  if (error) {
    logger.error({ err: error.message }, '[DB] Lỗi đồng bộ Notebooks');
    throw error;
  }
  return true;
}

/** Lấy nội dung bài viết theo ID */
export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('title, content, audio_url, video_url')
    .eq('id', postId)
    .single();

  if (error) {
    logger.error({ err: error.message }, `[DB] Lỗi lấy bài viết ${postId}`);
    return null;
  }
  return data;
}
