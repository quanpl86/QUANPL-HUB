'use client';

import React from 'react';
import Link from 'next/link';
import { isSlotDue, type EditorialSlot } from '@/lib/content/editorial-calendar';
import type { EditorialWeek } from '@/lib/content/editorial-week';

const WEEK_LABELS: Record<string, string> = {
  proposed: 'Chờ duyệt',
  revision_requested: 'Chờ GPT sửa',
  revision_ready: 'GPT đã sửa',
  approved: 'Đã duyệt',
  cancelled: 'Đã hủy',
};

export function EditorialCalendarBoard({
  initialWeeks,
  initialLooseSlots,
}: {
  initialWeeks: EditorialWeek[];
  initialLooseSlots: EditorialSlot[];
}) {
  const dueCount = [...initialWeeks.flatMap((week) => week.slots), ...initialLooseSlots].filter(
    (slot) =>
      (slot.status === 'approved' || slot.status === 'writing') &&
      !slot.result_post_id &&
      isSlotDue(slot)
  ).length;

  return (
    <section className="mb-16 border border-brand-orange/20 p-5 bg-cyber-black/5 space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-orbitron font-bold text-lg uppercase tracking-widest">
            Lịch tuần <span className="text-brand-orange">ChatGPT</span>
          </h2>
          <p className="tech-mono text-[11px] text-muted uppercase mt-1">
            Kéo thả, sửa đề xuất và ghi chú nằm ở trang Duyệt lịch tuần
          </p>
        </div>
        <Link
          href="/admin/editorial"
          className="px-4 py-2 bg-brand-orange text-white font-orbitron text-xs uppercase self-start"
        >
          Mở trang duyệt
        </Link>
      </div>

      {dueCount > 0 && (
        <p className="tech-mono text-xs text-brand-orange uppercase">{dueCount} bài đến hạn hôm nay</p>
      )}

      {initialWeeks.length === 0 && initialLooseSlots.length === 0 && (
        <p className="tech-mono text-xs text-muted uppercase">
          Chưa có lịch tuần. Bảo ChatGPT đề xuất danh sách bài trong tuần.
        </p>
      )}

      <div className="space-y-2">
        {initialWeeks.map((week) => (
          <Link
            key={week.id}
            href="/admin/editorial"
            className="block border border-brand-orange/15 p-3 hover:border-brand-orange/50"
          >
            <p className="font-semibold">{week.title || `Tuần ${week.week_start}`}</p>
            <p className="tech-mono text-[11px] text-brand-orange uppercase mt-1">
              {WEEK_LABELS[week.status]} · {week.slots.length} bài · {week.comments.length} ghi chú
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
