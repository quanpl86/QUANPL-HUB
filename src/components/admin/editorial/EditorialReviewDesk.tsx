'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  addEditorialReviewComment,
  approveEditorialSlot,
  approveEditorialWeek,
  cancelEditorialSlot,
  cancelEditorialWeek,
  rejectEditorialDraft,
  releaseEditorialSlotNow,
  reopenEditorialSlot,
  reorderEditorialSlots,
  requestEditorialRevision,
  requestEditorialWeekRevision,
  listEditorialWeeks,
  updateEditorialSlot,
  updateEditorialWeekMeta,
} from '@/app/actions/editorial-calendar';
import { isSlotDue, type EditorialSlot } from '@/lib/content/editorial-calendar';
import type { EditorialComment } from '@/lib/content/editorial-comments';
import { DEFAULT_REVISION_CONSTRAINTS, computeEditorialPerformance, isoWeekLabel, type RevisionConstraints } from '@/lib/content/editorial-plan';
import type { EditorialWeek } from '@/lib/content/editorial-week';
import { EditorialPromptKitDialog } from '@/components/admin/editorial/EditorialPromptKitDialog';

const WEEK_LABELS: Record<string, string> = {
  proposed: 'Chờ bạn duyệt',
  revision_requested: 'Đã gửi ChatGPT — đang chờ sửa',
  revision_ready: 'ChatGPT đã sửa — chờ bạn xem lại',
  approved: 'Đã duyệt — đã khóa',
  cancelled: 'Đã hủy',
};

const PIPELINE: { key: string; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'proposed', label: 'Chờ duyệt' },
  { key: 'revision_requested', label: 'Đang chờ sửa' },
  { key: 'revision_ready', label: 'Đã sửa, chờ xem' },
  { key: 'approved', label: 'Tuần đã duyệt' },
];

const SLOT_LABELS: Record<string, string> = {
  proposed: 'Chờ duyệt',
  approved: 'Đã duyệt',
  revision_requested: 'Đã yêu cầu ChatGPT sửa',
  writing: 'Đang viết bài',
  drafted: 'Chờ bạn đọc bài',
  published: 'Đã đăng — xong',
  cancelled: 'Đã hủy',
};

const ACTOR_LABELS: Record<string, string> = {
  admin: 'Bạn',
  chatgpt: 'ChatGPT',
  system: 'Hệ thống',
};

const EVENT_LABELS: Record<string, string> = {
  proposed: 'ChatGPT gửi danh sách tuần',
  brief_edited: 'Bạn đã chỉnh nội dung đề xuất',
  reordered: 'Bạn đã đổi thứ tự bài',
  comment_added: 'Có ghi chú mới',
  revision_requested: 'Bạn yêu cầu ChatGPT sửa',
  revised: 'ChatGPT gửi bản sửa',
  slot_revised: 'ChatGPT đã sửa một bài',
  approved: 'Bạn đã duyệt và khóa tuần',
  cancelled: 'Bạn đã hủy tuần',
  article_rejected: 'Bạn trả bài — ChatGPT cần sửa',
  article_published: 'Bạn đã đăng bài — task xong',
  slot_reopened: 'Bạn hoàn bài về chờ duyệt',
};

const DIFF_FIELD_LABELS: Record<string, string> = {
  title: 'Tiêu đề',
  summary: 'Tóm tắt tuần',
  week_start: 'Ngày bắt đầu tuần',
  angle: 'Góc viết',
  audience: 'Đối tượng đọc',
  goal: 'Mục tiêu',
  outline: 'Dàn ý',
  scheduled_date: 'Ngày đăng',
  scheduled_time: 'Giờ đăng',
  field: 'Lĩnh vực',
  subject: 'Chủ đề',
  category: 'Danh mục',
  primary_keyword: 'Từ khóa chính',
  search_intent: 'Người đọc đang tìm gì',
  why_this_article: 'Vì sao viết bài này',
  source_strategy: 'Nguồn sẽ dùng',
};

function weekTitleVi(iso: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(iso);
  if (!match) return iso ? `Tuần ${iso}` : 'Chưa có tuần';
  return `Tuần ${Number(match[2])}/${match[1]}`;
}

function diffPathLabel(path: string) {
  if (path === 'title' || path === 'summary' || path === 'week_start') {
    return DIFF_FIELD_LABELS[path];
  }
  const slotMatch = /^slot\.[^.]+\.(.+)$/.exec(path);
  if (slotMatch) return `Bài · ${DIFF_FIELD_LABELS[slotMatch[1]] || slotMatch[1]}`;
  if (path.startsWith('slot.')) return 'Bài (đã xóa hoặc đổi)';
  return path;
}

function humanError(message: string) {
  if (message.includes('PLAN_LOCKED')) return 'Tuần đã duyệt nên bị khóa. Không sửa đề xuất được nữa.';
  if (message.includes('REVISION_CONFLICT')) return 'ChatGPT đang sửa trên bản cũ. Hãy bảo nó đọc lại tuần rồi sửa tiếp.';
  if (message.includes('CONSTRAINT_VIOLATION')) {
    const field = message.replace('CONSTRAINT_VIOLATION: ', '').trim();
    return `ChatGPT sửa sai phần bị khóa: ${DIFF_FIELD_LABELS[field] || field}`;
  }
  if (message.includes('INVALID_SLOT')) return `Thiếu thông tin bắt buộc: ${message.replace('INVALID_SLOT: ', '')}`;
  if (message.includes('Unauthorized')) return 'Bạn chưa đăng nhập quyền quản trị.';
  return message;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted mb-1">{children}</p>;
}

const BTN_PRIMARY =
  'px-4 py-2 bg-brand-orange text-white font-orbitron text-xs uppercase cursor-pointer transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_SECONDARY =
  'px-3 py-2 border border-brand-orange text-brand-orange bg-[var(--card-bg)] font-orbitron text-[11px] uppercase cursor-pointer transition-colors hover:bg-brand-orange hover:text-white disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_GHOST =
  'px-3 py-2 border border-brand-orange/50 text-foreground bg-[var(--card-bg)] font-orbitron text-[11px] uppercase cursor-pointer transition-colors hover:border-brand-orange hover:bg-brand-orange/10 disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_DANGER =
  'px-3 py-2 border border-red-400 text-red-500 bg-[var(--card-bg)] font-orbitron text-[11px] uppercase cursor-pointer transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed';

export function EditorialReviewDesk({ initialWeeks }: { initialWeeks: EditorialWeek[] }) {
  const [weeks, setWeeks] = useState(initialWeeks);
  const [selectedId, setSelectedId] = useState(initialWeeks[0]?.id || '');
  const [filter, setFilter] = useState('all');
  const [promptOpen, setPromptOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setWeeks(initialWeeks);
  }, [initialWeeks]);
  const visibleWeeks = filter === 'all' ? weeks : weeks.filter((week) => week.status === filter);
  const selected = visibleWeeks.find((week) => week.id === selectedId) || visibleWeeks[0] || null;
  const focusWeek = weeks.find((week) => week.id === selectedId) || weeks[0];
  const iso = focusWeek ? isoWeekLabel(focusWeek.week_start) : '';
  const kpi = {
    total: weeks.reduce((sum, week) => sum + week.slots.length, 0),
    proposed: weeks.filter((week) => week.status === 'proposed').length,
    requested: weeks.filter((week) => week.status === 'revision_requested').length,
    ready: weeks.filter((week) => week.status === 'revision_ready').length,
    approved: weeks.filter((week) => week.status === 'approved').length,
  };
  const performance = computeEditorialPerformance(weeks);

  const replaceWeek = (updated: EditorialWeek) => {
    setWeeks((current) => current.map((week) => (week.id === updated.id ? updated : week)));
  };

  const patchSlot = (updated: EditorialSlot) => {
    setWeeks((current) =>
      current.map((week) =>
        week.id === updated.week_id
          ? {
              ...week,
              slots: week.slots
                .map((slot) => (slot.id === updated.id ? { ...slot, ...updated, comments: updated.comments || slot.comments } : slot))
                .sort((a, b) => a.item_order - b.item_order),
            }
          : week
      )
    );
  };

  const dueSlots = weeks.flatMap((week) =>
    week.slots
      .filter((slot) =>
        (slot.status === 'approved' || slot.status === 'writing') && !slot.result_post_id && isSlotDue(slot)
      )
      .map((slot) => ({ slot, week }))
  );
  const writeReadyCount = dueSlots.filter((item) => item.week.status === 'approved').length;
  const waitingWeekCount = dueSlots.filter((item) => item.week.status !== 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">
            DUYỆT LỊCH <span className="cyber-text-gradient">TUẦN</span>
          </h1>
          <p className="text-sm text-muted">
            {weekTitleVi(iso)} — xem đề xuất của ChatGPT, góp ý, rồi duyệt hoặc yêu cầu sửa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              try {
                const next = await listEditorialWeeks();
                setWeeks(next);
                if (next.length && !next.some((week) => week.id === selectedId)) {
                  setSelectedId(next[0].id);
                }
                toast.success('Đã tải lại từ Hub.');
              } catch (error: any) {
                toast.error(humanError(error.message));
              }
            })}
            className={BTN_GHOST}
          >
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => setPromptOpen(true)}
            className={BTN_PRIMARY}
          >
            Prompt AI
          </button>
        </div>
      </div>

      <EditorialPromptKitDialog open={promptOpen} onClose={() => setPromptOpen(false)} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          [`${kpi.total} bài`, 'Tổng số bài trong các tuần'],
          [`${kpi.proposed}`, 'Tuần chờ bạn duyệt'],
          [`${kpi.requested}`, 'Tuần đang chờ ChatGPT sửa'],
          [`${kpi.ready}`, 'Tuần ChatGPT đã sửa, chờ xem'],
          [`${kpi.approved}`, 'Tuần đã duyệt cả tuần'],
        ].map(([value, hint]) => (
          <div key={hint} className="border border-brand-orange/20 p-3 bg-cyber-black/5">
            <p className="font-orbitron text-sm font-bold">{value}</p>
            <p className="text-[11px] text-muted mt-1">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-brand-orange/20 p-4 space-y-1">
          <p className="text-sm font-semibold">Hiệu suất lập kế hoạch</p>
          <p className="text-sm">Đạt: {performance.planning.passed} tuần · Không đạt: {performance.planning.failed} tuần</p>
          <p className="text-sm">Đang xem: {performance.planning.in_review} · Trung bình số lần sửa: {performance.planning.avg_revisions}</p>
          <p className="text-sm font-semibold">
            {performance.planning.passed + performance.planning.failed
              ? `Tỉ lệ đạt: ${performance.planning.pass_rate}%`
              : 'Chưa chốt tuần nào — tỉ lệ đạt sẽ hiện sau khi bạn duyệt hoặc hủy'}
          </p>
        </div>
        <div className="border border-brand-orange/20 p-4 space-y-1">
          <p className="text-sm font-semibold">Hiệu suất viết bài</p>
          <p className="text-sm">Chờ đọc: {performance.writing.drafted} · Đã đăng: {performance.writing.published} · Bị trả: {performance.writing.rejected}</p>
          <p className="text-sm">Lần gửi draft lỗi: {performance.writing.write_fails}{performance.writing.avg_seo != null ? ` · Điểm SEO TB: ${performance.writing.avg_seo}` : ''}</p>
          <p className="text-sm font-semibold">
            {performance.writing.drafted + performance.writing.published + performance.writing.rejected
              ? `Tỉ lệ đăng / bài đã viết: ${performance.writing.pass_rate}%`
              : 'Chưa có bản nháp — tỉ lệ viết sẽ hiện sau khi ChatGPT gửi draft'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PIPELINE.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-3 py-1 text-[12px] border cursor-pointer transition-colors ${
              filter === item.key
                ? 'border-brand-orange bg-brand-orange text-white'
                : 'border-brand-orange/30 hover:border-brand-orange hover:bg-brand-orange/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        Các nút lọc theo <strong>cả tuần</strong>.
        “Gửi ChatGPT sửa bài” trong một bài cũng đưa cả tuần sang tab <strong>Đang chờ sửa</strong>.
        “Duyệt bài” riêng thì tuần vẫn ở “Chờ duyệt” — mở tab Tất cả để thấy bài đó.
      </p>
      {filter === 'approved' && visibleWeeks.length === 0 && (
        <p className="text-sm">
          Chưa có tuần nào được bấm <strong>Duyệt cả tuần</strong>. Bài bạn đã duyệt riêng không hiện ở đây.
        </p>
      )}

      {waitingWeekCount > 0 && (
        <div className="border border-brand-orange bg-brand-orange/10 p-4 text-sm">
          Có {waitingWeekCount} bài đã đến ngày giờ nhưng tuần chưa duyệt.
          Bấm <strong>Duyệt cả tuần</strong> trước. ChatGPT chưa viết được nếu chỉ duyệt từng bài.
        </div>
      )}
      {writeReadyCount > 0 && (
        <div className="border border-brand-orange bg-brand-orange/10 p-4 text-sm">
          {writeReadyCount} bài đã duyệt cả tuần và đến hạn.
          Mở ChatGPT và bảo: viết các bài đến hạn hôm nay.
        </div>
      )}

      {weeks.length === 0 ? (
        <div className="border border-dashed border-brand-orange/30 p-10 text-center tech-mono text-xs text-muted uppercase">
          Chưa có lịch tuần. Bảo ChatGPT đề xuất danh sách bài trong tuần — danh sách sẽ hiện ở đây để bạn kéo thứ tự, sửa nội dung và ghi chú.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="space-y-2">
            {visibleWeeks.map((week) => (
              <button
                key={week.id}
                onClick={() => setSelectedId(week.id)}
                className={`w-full text-left border p-4 cursor-pointer transition-colors ${
                  selected?.id === week.id
                    ? 'border-brand-orange bg-brand-orange/10'
                    : 'border-brand-orange/20 bg-[var(--card-bg)] hover:border-brand-orange/60'
                }`}
              >
                <p className="font-orbitron text-sm font-bold">{week.title || `Tuần ${week.week_start}`}</p>
                <p className="tech-mono text-[10px] text-brand-orange uppercase mt-1">{WEEK_LABELS[week.status]}</p>
                <p className="tech-mono text-[10px] text-muted uppercase mt-1">
                  {week.slots.length} bài · {week.slots.filter((slot) => slot.status === 'approved').length} đã duyệt riêng · {week.comments.length} ghi chú
                </p>
              </button>
            ))}
          </aside>

          {selected && (
            <WeekWorkspace
              week={selected}
              pending={pending}
              startTransition={startTransition}
              onWeek={replaceWeek}
              onSlot={patchSlot}
              onRevisionRequested={(weekId) => {
                setSelectedId(weekId);
                setFilter('revision_requested');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function WeekWorkspace({
  week,
  pending,
  startTransition,
  onWeek,
  onSlot,
  onRevisionRequested,
}: {
  week: EditorialWeek;
  pending: boolean;
  startTransition: (action: () => void | Promise<void>) => void;
  onWeek: (week: EditorialWeek) => void;
  onSlot: (slot: EditorialSlot) => void;
  onRevisionRequested: (weekId: string) => void;
}) {
  const [title, setTitle] = useState(week.title || '');
  const [summary, setSummary] = useState(week.summary || '');
  const [weekNote, setWeekNote] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    setTitle(week.title || '');
    setSummary(week.summary || '');
  }, [week.id, week.title, week.summary]);

  const [constraints, setConstraints] = useState<RevisionConstraints>(
    week.revision_constraints || DEFAULT_REVISION_CONSTRAINTS
  );
  const slotIds = useMemo(() => week.slots.map((slot) => slot.id), [week.slots]);
  const cancelled = week.status === 'cancelled';
  const locked = week.status === 'approved';
  const briefLocked = locked || cancelled;

  React.useEffect(() => {
    setConstraints(week.revision_constraints || DEFAULT_REVISION_CONSTRAINTS);
  }, [week.id, week.revision_number]);

  const onDragEnd = (event: DragEndEvent) => {
    if (briefLocked) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = week.slots.findIndex((slot) => slot.id === active.id);
    const newIndex = week.slots.findIndex((slot) => slot.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(week.slots, oldIndex, newIndex).map((slot, index) => ({ ...slot, item_order: index }));
    onWeek({ ...week, slots: next });
    startTransition(async () => {
      try {
        const saved = await reorderEditorialSlots(week.id, next.map((slot) => slot.id));
        onWeek({
          ...week,
          slots: saved.map((slot, index) => ({
            ...slot,
            item_order: index,
            comments: next.find((item) => item.id === slot.id)?.comments || [],
          })),
        });
        toast.success('Đã đổi thứ tự bài. ChatGPT sẽ thấy thứ tự mới.');
      } catch (error: any) {
        toast.error(humanError(error.message));
      }
    });
  };

  return (
    <section className="border border-brand-orange/20 p-5 bg-[var(--card-bg)] space-y-6">
      <div className="space-y-3">
        <input
          value={title}
          disabled={briefLocked || pending}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (title.trim() && title.trim() !== week.title) {
              startTransition(async () => {
                try {
                  onWeek(await updateEditorialWeekMeta(week.id, { title, summary }));
                  toast.success('Đã lưu tiêu đề tuần.');
                } catch (error: any) {
                  toast.error(humanError(error.message));
                }
              });
            }
          }}
          className="w-full bg-transparent border border-brand-orange/20 px-3 py-2 font-orbitron font-bold"
        />
        <p className="text-xs text-brand-orange uppercase">
          {WEEK_LABELS[week.status]} · {weekTitleVi(isoWeekLabel(week.week_start))} · bản {week.revision_number}
          {locked ? ' · Đã khóa' : ''}
        </p>
        {!locked && week.status === 'proposed' && (
          <p className="text-sm">
            Bước tiếp: đọc 3 bài bên dưới. Ổn thì bấm <strong>Duyệt cả tuần</strong>.
            Cần chỉnh thì ghi chú rồi <strong>Gửi yêu cầu sửa</strong>.
            Chỉ sau khi duyệt cả tuần, ChatGPT mới viết bài được.
          </p>
        )}
        {locked && (
          <p className="text-sm">
            Bước tiếp: mở ChatGPT và bảo viết các bài đến hạn hôm nay (hoặc bấm Cho viết ngay nếu chưa tới giờ).
          </p>
        )}
        <textarea
          value={summary}
          disabled={briefLocked || pending}
          onChange={(event) => setSummary(event.target.value)}
          onBlur={() => {
            if ((summary || '') !== (week.summary || '')) {
              startTransition(async () => {
                try {
                  onWeek(await updateEditorialWeekMeta(week.id, { title, summary }));
                  toast.success('Đã lưu tóm tắt tuần.');
                } catch (error: any) {
                  toast.error(humanError(error.message));
                }
              });
            }
          }}
          rows={3}
          placeholder="Tóm tắt / định hướng tuần..."
          className="w-full bg-transparent border border-brand-orange/20 px-3 py-2 text-sm"
        />
      </div>

      <CommentThread
        comments={week.comments}
        pending={pending}
        placeholder="Ghi chú cho cả kế hoạch tuần..."
        onSubmit={(body) => startTransition(async () => {
          try {
            const comment = await addEditorialReviewComment({ week_id: week.id, body });
            onWeek({ ...week, comments: [...week.comments, comment] });
            toast.success('Đã lưu ghi chú tuần.');
          } catch (error: any) {
            toast.error(humanError(error.message));
          }
        })}
      />

      {!cancelled && (week.status === 'proposed' || week.status === 'revision_ready') && (
        <div className="space-y-3 border border-brand-orange/20 p-4">
          <p className="text-sm font-semibold">Khi yêu cầu sửa, ChatGPT được phép đổi gì?</p>
          <p className="text-xs text-muted">
            Nhóm “Giữ”: tick = không được đổi. Nhóm “Cho phép”: tick = được đổi.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {(
              [
                ['keep_schedule', 'Giữ ngày giờ đăng (không cho đổi)'],
                ['keep_category', 'Giữ danh mục (không cho đổi)'],
                ['keep_cluster', 'Giữ lĩnh vực và chủ đề (không cho đổi)'],
                ['keep_keyword', 'Giữ từ khóa chính (không cho đổi)'],
                ['allow_title_change', 'Cho phép đổi tiêu đề'],
                ['allow_angle_change', 'Cho phép đổi góc viết'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={constraints[key]}
                  onChange={(event) => setConstraints((current) => ({ ...current, [key]: event.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              disabled={pending}
              onClick={() => startTransition(async () => {
                try {
                  onWeek(await approveEditorialWeek(week.id));
                  toast.success('Đã duyệt và khóa lịch tuần.');
                } catch (error: any) {
                  toast.error(humanError(error.message));
                }
              })}
              className={BTN_PRIMARY}
            >
              Duyệt cả tuần
            </button>
            <input
              value={weekNote}
              onChange={(event) => setWeekNote(event.target.value)}
              placeholder="Bạn muốn ChatGPT thay đổi gì?"
              className="flex-1 border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
            />
            <button
              disabled={pending}
              onClick={() => startTransition(async () => {
                try {
                  const updated = await requestEditorialWeekRevision(week.id, weekNote, constraints);
                  setWeekNote('');
                  onWeek(updated);
                  onRevisionRequested(updated.id);
                  toast.success('Đã gửi yêu cầu sửa. Hãy bảo ChatGPT: sửa.');
                } catch (error: any) {
                  toast.error(humanError(error.message));
                }
              })}
              className={BTN_SECONDARY}
            >
              Gửi yêu cầu sửa
            </button>
            <button
              disabled={pending}
              onClick={() => startTransition(async () => {
                try {
                  onWeek(await cancelEditorialWeek(week.id));
                  toast.success('Đã hủy tuần.');
                } catch (error: any) {
                  toast.error(humanError(error.message));
                }
              })}
              className={BTN_DANGER}
            >
              Hủy tuần
            </button>
          </div>
        </div>
      )}

      {week.diff?.length > 0 && (
        <div className="border border-brand-orange/20 p-4 space-y-2">
          <p className="text-sm font-semibold">So sánh bản {Math.max(1, week.revision_number - 1)} → bản {week.revision_number}</p>
          {week.diff.slice(0, 20).map((item) => (
            <p key={item.path} className="text-sm">
              <span className="text-muted">{diffPathLabel(item.path)}</span>
              <br />
              <span className="text-red-500">Trước: {item.before || '(trống)'}</span>
              <br />
              <span className="text-green-600">Sau: {item.after || '(trống)'}</span>
            </p>
          ))}
        </div>
      )}

      <div className="border border-brand-orange/20 p-4 space-y-2">
        <p className="text-sm font-semibold">Nhật ký</p>
        {week.activity?.length > 0 ? (
          week.activity.map((item) => (
            <p key={item.id} className="text-sm">
              <span className="text-[11px] text-muted">
                {new Date(item.created_at).toLocaleString('vi-VN')} · {ACTOR_LABELS[item.actor] || item.actor}
              </span>
              <br />
              {EVENT_LABELS[item.event] || item.event}
            </p>
          ))
        ) : (
          <p className="text-sm text-muted">
            Chưa có hành động nào ghi vào Hub. Nếu ChatGPT báo đã sửa trên chat nhưng không có dòng ở đây thì tool chưa ghi thành công — bấm Tải lại, rồi bảo nó gọi lại <code>revise_editorial_week</code> với <code>based_on_revision</code>.
          </p>
        )}
      </div>

      <div>
        <p className="tech-mono text-[11px] text-muted uppercase mb-3">
          {briefLocked ? 'Tuần đã khóa — không kéo thả và không sửa đề xuất' : 'Kéo biểu tượng bên trái để đổi thứ tự bài'}
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={slotIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {week.slots.map((slot, index) => (
                <SortableSlotCard
                  key={slot.id}
                  slot={slot}
                  index={index}
                  pending={pending}
                  planLocked={briefLocked}
                  weekApproved={week.status === 'approved'}
                  startTransition={startTransition}
                  onSlot={onSlot}
                  onWeek={onWeek}
                  onRevisionRequested={onRevisionRequested}
                  constraints={constraints}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}

function SortableSlotCard(props: {
  slot: EditorialSlot;
  index: number;
  pending: boolean;
  planLocked: boolean;
  weekApproved: boolean;
  startTransition: (action: () => void | Promise<void>) => void;
  onSlot: (slot: EditorialSlot) => void;
  onWeek: (week: EditorialWeek) => void;
  onRevisionRequested: (weekId: string) => void;
  constraints: RevisionConstraints;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.slot.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <SlotEditor {...props} dragHandle={{ attributes, listeners }} />
    </div>
  );
}

function SlotEditor({
  slot,
  index,
  pending,
  planLocked,
  weekApproved,
  startTransition,
  onSlot,
  onWeek,
  onRevisionRequested,
  constraints,
  dragHandle,
}: {
  slot: EditorialSlot;
  index: number;
  pending: boolean;
  planLocked?: boolean;
  weekApproved?: boolean;
  startTransition: (action: () => void | Promise<void>) => void;
  onSlot: (slot: EditorialSlot) => void;
  onWeek?: (week: EditorialWeek) => void;
  onRevisionRequested?: (weekId: string) => void;
  constraints?: RevisionConstraints;
  dragHandle: { attributes: any; listeners: any };
}) {
  const [draft, setDraft] = useState(toDraft(slot));
  const [note, setNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const due = isSlotDue(slot);
  const locked = Boolean(planLocked) || slot.status === 'cancelled' || slot.status === 'drafted' || slot.status === 'published';
  const canWrite = Boolean(weekApproved) && (slot.status === 'approved' || slot.status === 'writing');

  React.useEffect(() => {
    setDraft(toDraft(slot));
  }, [slot.id, slot.updated_at]);

  const save = () => {
    startTransition(async () => {
      try {
        const saved = await updateEditorialSlot(slot.id, {
          ...draft,
          tags: draft.tags.split(',').map((item) => item.trim()).filter(Boolean),
          secondary_keywords: draft.secondary_keywords.split(',').map((item) => item.trim()).filter(Boolean),
          article_objectives: draft.article_objectives.split('|').map((item) => item.trim()).filter(Boolean),
        });
        onSlot({ ...saved, comments: slot.comments });
        toast.success('Đã lưu đề xuất bài. ChatGPT sẽ thấy bản mới.');
      } catch (error: any) {
        toast.error(humanError(error.message));
      }
    });
  };

  return (
    <article className="border border-brand-orange/20 p-4 bg-[var(--card-bg)] space-y-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={locked}
          className="mt-2 text-muted hover:text-brand-orange cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed"
          {...(locked ? {} : dragHandle.attributes)}
          {...(locked ? {} : dragHandle.listeners)}
          aria-label="Kéo đổi thứ tự"
        >
          <GripVertical size={18} />
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="tech-mono text-[11px] text-brand-orange uppercase">
              #{index + 1} · {SLOT_LABELS[slot.status]}
              {slot.scheduled_date ? ` · ${slot.scheduled_date}` : ''}
              {slot.scheduled_time ? ` ${slot.scheduled_time}` : ''}
              {slot.status === 'approved' && due ? ' · đến hạn' : ''}
              {slot.status === 'approved' && !due ? ' · chưa đến giờ' : ''}
              {canWrite ? '' : slot.status === 'approved' ? ' · chưa duyệt cả tuần nên chưa viết được' : ''}
            </p>
            {slot.result_post_id && (
              <a href={`/admin/posts/edit/${slot.result_post_id}`} className="tech-mono text-[11px] text-brand-orange underline uppercase">
                Mở bản nháp
              </a>
            )}
          </div>
          <div>
            <FieldLabel>Tiêu đề bài</FieldLabel>
            <input
              value={draft.title}
              disabled={locked || pending}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Tên bài sẽ đăng"
              className="w-full bg-transparent border border-brand-orange/20 px-3 py-2 font-semibold"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Ngày đăng</FieldLabel>
              <input
                type="date"
                value={draft.scheduled_date}
                disabled={locked || pending}
                onChange={(event) => setDraft((current) => ({ ...current, scheduled_date: event.target.value }))}
                className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <FieldLabel>Giờ đăng</FieldLabel>
              <input
                type="time"
                value={draft.scheduled_time}
                disabled={locked || pending}
                onChange={(event) => setDraft((current) => ({ ...current, scheduled_time: event.target.value }))}
                className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Góc viết — bài này khác các bài khác ở điểm nào</FieldLabel>
            <input
              value={draft.angle}
              disabled={locked || pending}
              onChange={(event) => setDraft((current) => ({ ...current, angle: event.target.value }))}
              placeholder="Ví dụ: không hỏi AI có thay giáo viên không, mà chia việc máy / việc người"
              className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <FieldLabel>Dàn ý nội dung</FieldLabel>
            <textarea
              value={draft.outline}
              disabled={locked || pending}
              onChange={(event) => setDraft((current) => ({ ...current, outline: event.target.value }))}
              rows={4}
              placeholder="Các ý chính sẽ viết trong bài"
              className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Đối tượng đọc</FieldLabel>
              <input value={draft.audience} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))} placeholder="Ai sẽ đọc bài này" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Mục tiêu bài viết</FieldLabel>
              <input value={draft.goal} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, goal: event.target.value }))} placeholder="Đọc xong người ta làm được gì" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Lĩnh vực</FieldLabel>
              <input value={draft.field} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, field: event.target.value }))} placeholder="Ví dụ: Giáo dục" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Chủ đề</FieldLabel>
              <input value={draft.subject} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Ví dụ: Phương pháp giảng dạy" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Danh mục</FieldLabel>
              <input value={draft.category} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Danh mục trên website" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Thẻ (cách nhau bởi dấu phẩy)</FieldLabel>
              <input value={draft.tags} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="ví dụ: 5E, AI, giáo viên" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Người đọc đang tìm gì</FieldLabel>
              <input value={draft.search_intent} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, search_intent: event.target.value }))} placeholder="Họ gõ gì trên Google, muốn biết điều gì" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Từ khóa chính</FieldLabel>
              <input value={draft.primary_keyword} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, primary_keyword: event.target.value }))} placeholder="Cụm từ chính của bài" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Từ khóa phụ (cách nhau bởi dấu phẩy)</FieldLabel>
              <input value={draft.secondary_keywords} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, secondary_keywords: event.target.value }))} placeholder="Các cụm từ liên quan" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <FieldLabel>Vì sao viết bài này</FieldLabel>
            <textarea value={draft.why_this_article} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, why_this_article: event.target.value }))} rows={2} placeholder="Bài này lấp chỗ trống gì trên blog" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <FieldLabel>Nguồn sẽ dùng</FieldLabel>
            <textarea value={draft.source_strategy} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, source_strategy: event.target.value }))} rows={2} placeholder="Ví dụ: UNESCO, nghiên cứu 2025–2026, case lớp học" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <FieldLabel>Các mục tiêu cụ thể (cách nhau bởi dấu | )</FieldLabel>
            <input value={draft.article_objectives} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, article_objectives: event.target.value }))} placeholder="Mục tiêu 1 | Mục tiêu 2" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
          </div>
          {!locked && (
            <button
              disabled={pending}
              onClick={save}
              className={BTN_SECONDARY}
            >
              Lưu đề xuất bài
            </button>
          )}

          <CommentThread
            comments={slot.comments}
            pending={pending}
            placeholder="Ghi chú cho bài này..."
            onSubmit={(body) => startTransition(async () => {
              try {
                if (!slot.week_id) throw new Error('Bài này chưa thuộc tuần nào nên chưa gắn ghi chú được');
                const comment = await addEditorialReviewComment({
                  week_id: slot.week_id,
                  slot_id: slot.id,
                  body,
                });
                onSlot({ ...slot, comments: [...slot.comments, comment] });
                toast.success('Đã lưu ghi chú bài.');
              } catch (error: any) {
                toast.error(humanError(error.message));
              }
            })}
          />

          {(slot.status === 'proposed' || slot.status === 'revision_requested') && (
            <div className="flex flex-col md:flex-row gap-3">
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  try {
                    onSlot({ ...(await approveEditorialSlot(slot.id)), comments: slot.comments });
                    toast.success('Đã duyệt bài.');
                  } catch (error: any) {
                    toast.error(humanError(error.message));
                  }
                })}
                className={BTN_PRIMARY}
              >
                Duyệt bài
              </button>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ghi chú gửi kèm (không bắt buộc nếu đã viết ở trên)"
                className="flex-1 border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
              />
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  try {
                    const result = await requestEditorialRevision(slot.id, note, constraints);
                    setNote('');
                    if (result.week && onWeek) {
                      onWeek(result.week);
                      onRevisionRequested?.(result.week.id);
                    } else {
                      onSlot({ ...result.slot, comments: slot.comments });
                    }
                    toast.success('Đã gửi ChatGPT sửa bài này. Cả tuần đang ở tab Đang chờ sửa.');
                  } catch (error: any) {
                    toast.error(humanError(error.message));
                  }
                })}
                className={BTN_SECONDARY}
              >
                Gửi ChatGPT sửa bài
              </button>
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  try {
                    onSlot({ ...(await cancelEditorialSlot(slot.id)), comments: slot.comments });
                    toast.success('Đã hủy bài.');
                  } catch (error: any) {
                    toast.error(humanError(error.message));
                  }
                })}
                className={BTN_DANGER}
              >
                Hủy
              </button>
            </div>
          )}
          {(slot.status === 'approved' || slot.status === 'writing') && !slot.result_post_id && (
            <div className="space-y-2">
              {slot.status === 'approved' && !weekApproved && (
                <p className="text-sm text-brand-orange">
                  Bài này đã duyệt riêng nhưng cả tuần chưa duyệt. ChatGPT không viết được cho đến khi bạn bấm Duyệt cả tuần.
                </p>
              )}
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  try {
                    onSlot({ ...(await reopenEditorialSlot(slot.id)), comments: slot.comments });
                    toast.success('Đã hoàn bài về chờ duyệt. Ngày giờ được trả về bản trước khi mở viết ngay (nếu có).');
                  } catch (error: any) {
                    toast.error(humanError(error.message));
                  }
                })}
                className={BTN_GHOST}
              >
                Hoàn về chờ duyệt
              </button>
            </div>
          )}
          {slot.status === 'drafted' && slot.result_post_id && (
            <div className="space-y-2 border border-brand-orange/20 p-3">
              <p className="text-sm">Hệ thống đã nhận bản nháp. Đọc bài rồi đăng hoặc trả lại ChatGPT.</p>
              <textarea
                value={rejectNote}
                onChange={(event) => setRejectNote(event.target.value)}
                placeholder="Nếu trả bài: ghi vì sao và cần sửa gì"
                className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => {
                    try {
                      onSlot({ ...(await rejectEditorialDraft(slot.id, rejectNote)), comments: slot.comments });
                      setRejectNote('');
                      toast.success('Đã trả bài. Lần sau bảo ChatGPT: check tuần và sửa bài bị trả.');
                    } catch (error: any) {
                      toast.error(humanError(error.message));
                    }
                  })}
                  className={BTN_SECONDARY}
                >
                  Trả bài cho ChatGPT
                </button>
              </div>
            </div>
          )}
          {slot.status === 'revision_requested' && slot.result_post_id && (
            <p className="text-sm text-brand-orange">
              Đã trả bài. ChatGPT sẽ thấy khi bạn bảo: check tuần / sửa bài bị trả.
            </p>
          )}
          {canWrite && !due && (
            <button
              disabled={pending}
              onClick={() => startTransition(async () => {
                try {
                  onSlot({ ...(await releaseEditorialSlotNow(slot.id)), comments: slot.comments });
                  toast.success('Đã mở viết ngay.');
                } catch (error: any) {
                  toast.error(humanError(error.message));
                }
              })}
              className={BTN_SECONDARY}
            >
              Cho viết ngay
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CommentThread({
  comments,
  pending,
  placeholder,
  onSubmit,
}: {
  comments: EditorialComment[];
  pending: boolean;
  placeholder: string;
  onSubmit: (body: string) => void;
}) {
  const [body, setBody] = useState('');
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div key={comment.id} className="border-l-4 border-brand-orange/50 pl-3 py-1">
          <p className="tech-mono text-[10px] uppercase text-muted">
            {comment.author === 'admin' ? 'Bạn' : 'ChatGPT'} · {new Date(comment.created_at).toLocaleString('vi-VN')}
          </p>
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
        </div>
      ))}
      <div className="flex flex-col md:flex-row gap-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={2}
          placeholder={placeholder}
          className="flex-1 border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
        />
        <button
          disabled={pending || !body.trim()}
          onClick={() => {
            const next = body.trim();
            setBody('');
            onSubmit(next);
          }}
          className={BTN_GHOST}
        >
          Thêm ghi chú
        </button>
      </div>
    </div>
  );
}

function toDraft(slot: EditorialSlot) {
  return {
    title: slot.title,
    angle: slot.angle || '',
    audience: slot.audience || '',
    goal: slot.goal || '',
    outline: slot.outline || '',
    scheduled_date: slot.scheduled_date || '',
    scheduled_time: slot.scheduled_time || '',
    field: slot.field || '',
    subject: slot.subject || '',
    category: slot.category || '',
    tags: slot.tags.join(', '),
    notes: slot.notes || '',
    search_intent: slot.search_intent || '',
    primary_keyword: slot.primary_keyword || '',
    secondary_keywords: (slot.secondary_keywords || []).join(', '),
    why_this_article: slot.why_this_article || '',
    source_strategy: slot.source_strategy || '',
    article_objectives: (slot.article_objectives || []).join(' | '),
  };
}
