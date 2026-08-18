'use server';

import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';
import { getSupabaseAdmin } from '@/lib/supabase';
import { EditorialCalendarRepository, type EditorialSlotInput } from '@/lib/content/editorial-calendar';
import { EditorialWeekRepository } from '@/lib/content/editorial-week';
import { EditorialCommentRepository } from '@/lib/content/editorial-comments';
import { EditorialPlanAudit, type RevisionConstraints } from '@/lib/content/editorial-plan';

async function requireAdmin() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  return getSupabaseAdmin();
}

function revalidateDesk() {
  revalidatePath('/admin/editorial');
  revalidatePath('/admin/content-schedule');
}

export async function listEditorialCalendar(status?: string) {
  const supabase = await requireAdmin();
  return EditorialCalendarRepository.list(supabase, status);
}

export async function listLooseEditorialSlots() {
  const supabase = await requireAdmin();
  return EditorialCalendarRepository.list(supabase, undefined, { unassignedOnly: true });
}

export async function listEditorialWeeks(status?: string) {
  const supabase = await requireAdmin();
  return EditorialWeekRepository.list(supabase, status);
}

export async function getEditorialWeek(id: string) {
  const supabase = await requireAdmin();
  return EditorialWeekRepository.get(supabase, id);
}

export async function updateEditorialWeekMeta(id: string, patch: { title?: string; summary?: string }) {
  const supabase = await requireAdmin();
  const updated = await EditorialWeekRepository.updateMeta(supabase, id, patch);
  revalidateDesk();
  return updated;
}

export async function updateEditorialSlot(id: string, patch: Partial<EditorialSlotInput>) {
  const supabase = await requireAdmin();
  const current = await EditorialCalendarRepository.get(supabase, id);
  const updated = await EditorialCalendarRepository.adminUpdate(supabase, id, patch);
  if (current.week_id) {
    await EditorialWeekRepository.bumpAfterAdminEdit(supabase, current.week_id, 'brief_edited');
  }
  revalidateDesk();
  return updated;
}

export async function reorderEditorialSlots(weekId: string, orderedIds: string[]) {
  const supabase = await requireAdmin();
  const slots = await EditorialCalendarRepository.reorder(supabase, weekId, orderedIds);
  await EditorialWeekRepository.bumpAfterAdminEdit(supabase, weekId, 'reordered');
  revalidateDesk();
  return slots;
}

export async function addEditorialReviewComment(input: {
  week_id: string;
  slot_id?: string | null;
  body: string;
}) {
  const supabase = await requireAdmin();
  const comment = await EditorialCommentRepository.add(supabase, {
    ...input,
    author: 'admin',
  });
  await EditorialPlanAudit.log(supabase, {
    week_id: input.week_id,
    slot_id: input.slot_id,
    event: 'comment_added',
    actor: 'admin',
  });
  revalidateDesk();
  return comment;
}

export async function approveEditorialWeek(id: string) {
  const supabase = await requireAdmin();
  const updated = await EditorialWeekRepository.setStatus(supabase, id, 'approved', '');
  revalidateDesk();
  return updated;
}

export async function requestEditorialWeekRevision(
  id: string,
  feedback: string,
  constraints?: Partial<RevisionConstraints>
) {
  const supabase = await requireAdmin();
  const note = feedback.trim();
  if (note) {
    await EditorialCommentRepository.add(supabase, {
      week_id: id,
      author: 'admin',
      body: note,
    });
    await EditorialPlanAudit.log(supabase, {
      week_id: id,
      event: 'comment_added',
      actor: 'admin',
    });
  }
  const week = await EditorialWeekRepository.get(supabase, id);
  const hasComments = week.comments.length > 0 || week.slots.some((slot) => slot.comments.length > 0);
  if (!hasComments) throw new Error('Cần ít nhất một comment chi tiết trước khi gửi yêu cầu cho ChatGPT');
  const summary = note || week.comments.at(-1)?.body || 'Xem comment chi tiết trên bàn duyệt';
  const updated = await EditorialWeekRepository.requestRevision(supabase, id, summary, constraints);
  revalidateDesk();
  return updated;
}

export async function cancelEditorialWeek(id: string) {
  const supabase = await requireAdmin();
  const updated = await EditorialWeekRepository.setStatus(supabase, id, 'cancelled');
  revalidateDesk();
  return updated;
}

export async function approveEditorialSlot(id: string) {
  const supabase = await requireAdmin();
  const slot = await EditorialCalendarRepository.get(supabase, id);
  if (slot.status !== 'proposed' && slot.status !== 'revision_requested') {
    throw new Error('Chỉ duyệt được slot đang chờ hoặc đã gửi lại sau hiệu chỉnh');
  }
  const updated = await EditorialCalendarRepository.setStatus(supabase, id, 'approved', '');
  revalidateDesk();
  return updated;
}

export async function requestEditorialRevision(id: string, feedback: string) {
  const supabase = await requireAdmin();
  const slot = await EditorialCalendarRepository.get(supabase, id);
  const note = feedback.trim();
  if (!slot.week_id) {
    if (!note) throw new Error('Cần ghi rõ yêu cầu hiệu chỉnh');
    const updated = await EditorialCalendarRepository.setStatus(supabase, id, 'revision_requested', note);
    revalidateDesk();
    return updated;
  }
  if (note) {
    await EditorialCommentRepository.add(supabase, {
      week_id: slot.week_id,
      slot_id: id,
      author: 'admin',
      body: note,
    });
  }
  const week = await EditorialWeekRepository.get(supabase, slot.week_id);
  const current = week.slots.find((item) => item.id === id);
  if (!note && !current?.comments.length) {
    throw new Error('Cần comment chi tiết trước khi yêu cầu ChatGPT sửa bài này');
  }
  const updated = await EditorialCalendarRepository.setStatus(
    supabase,
    id,
    'revision_requested',
    note || current?.comments.at(-1)?.body || ''
  );
  revalidateDesk();
  return updated;
}

export async function reopenEditorialSlot(id: string) {
  const supabase = await requireAdmin();
  const slot = await EditorialCalendarRepository.get(supabase, id);
  let restore: { scheduled_date?: string | null; scheduled_time?: string | null } | undefined;
  if (slot.week_id) {
    const week = await EditorialWeekRepository.get(supabase, slot.week_id);
    const snapSlots = Array.isArray(week.latest_revision?.snapshot?.slots)
      ? (week.latest_revision?.snapshot?.slots as Array<{ id?: string; scheduled_date?: string; scheduled_time?: string }>)
      : [];
    const previous = snapSlots.find((item) => item.id === slot.id);
    if (previous) {
      restore = {
        scheduled_date: previous.scheduled_date || slot.scheduled_date,
        scheduled_time: previous.scheduled_time || slot.scheduled_time,
      };
    }
    const updated = await EditorialCalendarRepository.reopen(supabase, id, restore);
    await EditorialPlanAudit.log(supabase, {
      week_id: slot.week_id,
      slot_id: id,
      event: 'slot_reopened',
      actor: 'admin',
    });
    revalidateDesk();
    return updated;
  }
  const updated = await EditorialCalendarRepository.reopen(supabase, id, restore);
  revalidateDesk();
  return updated;
}

export async function cancelEditorialSlot(id: string) {
  const supabase = await requireAdmin();
  const updated = await EditorialCalendarRepository.setStatus(supabase, id, 'cancelled');
  revalidateDesk();
  return updated;
}

export async function releaseEditorialSlotNow(id: string) {
  const supabase = await requireAdmin();
  const slot = await EditorialCalendarRepository.get(supabase, id);
  if (slot.week_id) {
    const week = await EditorialWeekRepository.get(supabase, slot.week_id);
    if (week.status !== 'approved') {
      throw new Error('Cần duyệt cả tuần trước khi cho viết bài');
    }
  }
  const updated = await EditorialCalendarRepository.releaseNow(supabase, id);
  revalidateDesk();
  return updated;
}

export async function getEditorialSlotByPostId(postId: string) {
  const supabase = await requireAdmin();
  return EditorialCalendarRepository.getByPostId(supabase, postId);
}

export async function rejectEditorialDraft(slotId: string, feedback: string) {
  const supabase = await requireAdmin();
  const note = feedback.trim();
  if (!note) throw new Error('Cần ghi rõ vì sao trả bài và ChatGPT phải sửa gì');
  const slot = await EditorialCalendarRepository.get(supabase, slotId);
  if (slot.status !== 'drafted' && slot.status !== 'writing') {
    throw new Error('Chỉ trả được bài đang chờ duyệt');
  }
  if (!slot.result_post_id) throw new Error('Bài này chưa có bản nháp');
  if (slot.week_id) {
    await EditorialCommentRepository.add(supabase, {
      week_id: slot.week_id,
      slot_id: slotId,
      author: 'admin',
      body: note,
    });
    await EditorialPlanAudit.log(supabase, {
      week_id: slot.week_id,
      slot_id: slotId,
      event: 'article_rejected',
      actor: 'admin',
      payload: { feedback: note },
    });
  }
  const updated = await EditorialCalendarRepository.setStatus(supabase, slotId, 'revision_requested', note);
  revalidateDesk();
  revalidatePath(`/admin/posts/edit/${slot.result_post_id}`);
  return updated;
}
