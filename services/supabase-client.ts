import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client cho Local Worker
 * Sử dụng Service Role Key để bypass RLS
 */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('[Worker] Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong .env');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Lấy danh sách tasks đang pending (sắp xếp theo priority DESC, created_at ASC)
 */
export async function fetchPendingTasks() {
  const { data, error } = await supabase
    .from('content_tasks')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) {
    console.error('[DB] Lỗi lấy tasks:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Cập nhật status task
 */
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
    console.error(`[DB] Lỗi cập nhật task ${taskId}:`, error.message);
  }
}

/**
 * Tạo bản nháp bài viết từ kết quả AI
 */
export async function insertDraftPost(data: {
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  seo_keywords?: Record<string, any>;
  schema_org?: Record<string, any>;
  source_task_id: string;
}) {
  // Tạo slug chuẩn tiếng Việt
  const slug = slugify(data.title) + '-ai-' + Math.random().toString(36).substring(2, 7);

  const { data: post, error } = await supabase
    .from('posts')
    .insert([{
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || (typeof data.content === 'string' ? (data.content.length > 160 ? data.content.substring(0, 160) + '...' : data.content) : ''),
      image_url: data.image_url || null,
      is_published: false,
      is_ai_generated: true,
      comments_enabled: true,
      meta_title: data.meta_title || data.title,
      meta_description: data.meta_description || data.excerpt || (typeof data.content === 'string' ? (data.content.length > 160 ? data.content.substring(0, 160) : data.content) : ''),
      keywords: data.keywords || [],
      seo_keywords: data.seo_keywords || null,
      schema_org: data.schema_org || null,
      source_task_id: data.source_task_id,
    }])
    .select('id, slug')
    .single();

  if (error) {
    console.error('[DB] Lỗi tạo draft post:', error.message);
    return null;
  }

  return post;
}

/**
 * Gửi heartbeat để Dashboard biết Worker đang online
 */
export async function sendHeartbeat() {
  const { error } = await supabase
    .from('automation_settings')
    .upsert({
      key_name: 'MCP_WORKER_HEARTBEAT',
      key_value: new Date().toISOString(),
    }, { onConflict: 'key_name' });

  if (error) {
    console.error('[DB] Lỗi gửi heartbeat:', error.message);
  }
}

/**
 * Tải file lên Supabase Storage
 */
export async function uploadAsset(bucket: string, path: string, body: Buffer | ArrayBuffer | string, contentType: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      contentType,
      upsert: true
    });

  if (error) {
    console.error(`[Storage] Lỗi tải lên ${path}:`, error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Cập nhật URL Đa phương tiện cho bài viết
 */
export async function updatePostMultimedia(postId: string, field: 'audio_url' | 'video_url', url: string) {
  const { error } = await supabase
    .from('posts')
    .update({ [field]: url })
    .eq('id', postId);

  if (error) {
    console.error(`[DB] Lỗi cập nhật multimedia cho bài ${postId}:`, error.message);
    return false;
  }
  return true;
}

// --- Helper ---
function slugify(text: string) {
  const from = "áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ·/_,:;";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";
  let str = text.toLowerCase().trim();
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  return str
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

