'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';

// ============================================
// CONTENT TASKS — Server Actions cho Hybrid Mode
// ============================================

/**
 * Tạo một Content Task mới (Admin "đặt hàng" AI)
 */
export async function createContentTask(
  topicName: string,
  notebookId: string,
  priority: number = 5
) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_tasks')
    .insert([{
      topic_name: topicName,
      notebook_id: notebookId || null,
      priority,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating content task:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/automation');
  return { success: true, taskId: data.id };
}

/**
 * Lấy danh sách Content Tasks (có thể lọc theo status)
 */
export async function getContentTasks(statusFilter?: string, limit: number = 20) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('content_tasks')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching content tasks:', error);
    return [];
  }
  return data;
}

/**
 * Hủy một task đang pending
 */
export async function cancelTask(taskId: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('content_tasks')
    .update({ status: 'cancelled', logs: 'Đã hủy bởi Admin.' })
    .eq('id', taskId)
    .eq('status', 'pending'); // Chỉ hủy được task chưa xử lý

  if (error) {
    console.error('Error cancelling task:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/automation');
  return { success: true };
}

/**
 * Retry một task đã thất bại
 */
export async function retryTask(taskId: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('content_tasks')
    .update({ status: 'pending', logs: null, worker_id: null })
    .eq('id', taskId)
    .eq('status', 'failed'); // Chỉ retry được task đã thất bại

  if (error) {
    console.error('Error retrying task:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/automation');
  return { success: true };
}

/**
 * Xóa task (chỉ xóa được pending hoặc cancelled)
 */
export async function deleteTask(taskId: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('content_tasks')
    .delete()
    .eq('id', taskId)
    .in('status', ['pending', 'cancelled']);

  if (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/automation');
  return { success: true };
}

/**
 * Lấy danh sách Notebook IDs đã cấu hình
 */
export async function getNotebookConfigs() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('automation_settings')
    .select('key_name, key_value')
    .like('key_name', 'NOTEBOOK_%');

  return data || [];
}

/**
 * Kiểm tra Worker có đang online không (dựa trên heartbeat)
 */
export async function getWorkerStatus() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('automation_settings')
    .select('key_value')
    .eq('key_name', 'MCP_WORKER_HEARTBEAT')
    .single();

  if (!data?.key_value) return { online: false, lastSeen: null };

  const lastHeartbeat = new Date(data.key_value);
  const now = new Date();
  const diffMs = now.getTime() - lastHeartbeat.getTime();

  // Worker is online if heartbeat < 2 minutes ago
  return {
    online: diffMs < 120000,
    lastSeen: data.key_value
  };
}
