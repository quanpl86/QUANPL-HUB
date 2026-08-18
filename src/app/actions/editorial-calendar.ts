'use server';

import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';
import { getSupabaseAdmin } from '@/lib/supabase';
import { EditorialCalendarRepository } from '@/lib/content/editorial-calendar';

async function requireAdmin() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  return getSupabaseAdmin();
}

export async function listEditorialCalendar(status?: string) {
  const supabase = await requireAdmin();
  return EditorialCalendarRepository.list(supabase, status);
}

export async function approveEditorialSlot(id: string) {
  const supabase = await requireAdmin();
  const slot = await EditorialCalendarRepository.get(supabase, id);
  if (slot.status !== 'proposed' && slot.status !== 'revision_requested') {
    throw new Error('Chỉ duyệt được slot đang chờ hoặc đã gửi lại sau hiệu chỉnh');
  }
  const updated = await EditorialCalendarRepository.setStatus(supabase, id, 'approved', '');
  revalidatePath('/admin/content-schedule');
  return updated;
}

export async function requestEditorialRevision(id: string, feedback: string) {
  const supabase = await requireAdmin();
  if (!feedback.trim()) throw new Error('Cần ghi rõ yêu cầu hiệu chỉnh');
  const updated = await EditorialCalendarRepository.setStatus(
    supabase,
    id,
    'revision_requested',
    feedback.trim()
  );
  revalidatePath('/admin/content-schedule');
  return updated;
}

export async function cancelEditorialSlot(id: string) {
  const supabase = await requireAdmin();
  const updated = await EditorialCalendarRepository.setStatus(supabase, id, 'cancelled');
  revalidatePath('/admin/content-schedule');
  return updated;
}
