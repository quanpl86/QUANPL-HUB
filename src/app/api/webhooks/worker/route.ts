import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * API Webhook nhận thông báo từ AI Worker
 * Bảo mật bằng WORKER_WEBHOOK_SECRET
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.WORKER_WEBHOOK_SECRET;

    // Task 1.2: Kiểm tra tính hợp lệ của Token
    if (!secret || authHeader !== `Bearer ${secret}`) {
      console.error('[Webhook] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, status, result, error } = body;

    console.log(`[Webhook] Nhận cập nhật cho Task ${taskId}: ${status}`);

    const supabase = await getSupabaseServer();

    // Cập nhật trạng thái Task trong Database
    const { error: updateError } = await supabase
      .from('content_tasks')
      .update({
        status: status === 'success' ? 'completed' : 'failed',
        error_message: error || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('[Webhook] Lỗi cập nhật Supabase:', updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Webhook] Lỗi xử lý Request:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
