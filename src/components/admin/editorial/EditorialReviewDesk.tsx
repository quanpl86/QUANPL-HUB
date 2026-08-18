'use client';

import React, { useMemo, useState, useTransition } from 'react';
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
  releaseEditorialSlotNow,
  reorderEditorialSlots,
  requestEditorialRevision,
  requestEditorialWeekRevision,
  updateEditorialSlot,
  updateEditorialWeekMeta,
} from '@/app/actions/editorial-calendar';
import { isSlotDue, type EditorialSlot } from '@/lib/content/editorial-calendar';
import type { EditorialComment } from '@/lib/content/editorial-comments';
import { DEFAULT_REVISION_CONSTRAINTS, isoWeekLabel, type RevisionConstraints } from '@/lib/content/editorial-plan';
import type { EditorialWeek } from '@/lib/content/editorial-week';

const WEEK_LABELS: Record<string, string> = {
  proposed: 'Chờ duyệt danh sách',
  revision_requested: 'Đã gửi ChatGPT — chờ sửa',
  revision_ready: 'GPT đã sửa — chờ xem lại',
  approved: 'Đã duyệt — LOCKED',
  cancelled: 'Đã hủy',
};

const PIPELINE: { key: string; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'proposed', label: 'Chờ duyệt' },
  { key: 'revision_requested', label: 'Cần sửa' },
  { key: 'revision_ready', label: 'Revision ready' },
  { key: 'approved', label: 'Đã duyệt' },
];

const SLOT_LABELS: Record<string, string> = {
  proposed: 'Chờ duyệt',
  approved: 'Đã duyệt',
  revision_requested: 'Yêu cầu GPT sửa',
  writing: 'Đang viết',
  drafted: 'Đã có bản nháp',
  cancelled: 'Đã hủy',
};

export function EditorialReviewDesk({ initialWeeks }: { initialWeeks: EditorialWeek[] }) {
  const [weeks, setWeeks] = useState(initialWeeks);
  const [selectedId, setSelectedId] = useState(initialWeeks[0]?.id || '');
  const [filter, setFilter] = useState('all');
  const [pending, startTransition] = useTransition();
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

  const dueCount = weeks.flatMap((week) => week.slots).filter((slot) =>
    (slot.status === 'approved' || slot.status === 'writing') && !slot.result_post_id && isSlotDue(slot)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">
          BÀN DUYỆT <span className="cyber-text-gradient">CHATGPT</span>
        </h1>
        <p className="tech-mono text-brand-orange text-[11px] uppercase tracking-[0.3em] font-bold">
          {`// TRUNG TÂM ĐIỀU HÀNH NỘI DUNG · ${iso || 'CHƯA CÓ TUẦN'} //`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          [`${kpi.total} bài`, 'Tổng slot'],
          [`${kpi.proposed} chờ duyệt`, 'proposed'],
          [`${kpi.requested} cần sửa`, 'revision_requested'],
          [`${kpi.ready} xem lại`, 'revision_ready'],
          [`${kpi.approved} đã duyệt`, 'approved'],
        ].map(([value, hint]) => (
          <div key={hint} className="border border-brand-orange/20 p-3 bg-cyber-black/5">
            <p className="font-orbitron text-sm font-bold">{value}</p>
            <p className="tech-mono text-[10px] text-muted uppercase">{hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PIPELINE.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-3 py-1 font-orbitron text-[11px] uppercase border ${
              filter === item.key ? 'border-brand-orange bg-brand-orange text-white' : 'border-brand-orange/30'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {dueCount > 0 && (
        <div className="border border-brand-orange bg-brand-orange/10 p-4 tech-mono text-xs uppercase">
          {dueCount} bài đến hạn. Mở ChatGPT: viết các slot đến hạn hôm nay.
        </div>
      )}

      {weeks.length === 0 ? (
        <div className="border border-dashed border-brand-orange/30 p-10 text-center tech-mono text-xs text-muted uppercase">
          Chưa có lịch tuần. ChatGPT gọi propose_editorial_week — danh sách sẽ hiện ở đây để bạn kéo thứ tự, sửa brief và comment.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="space-y-2">
            {visibleWeeks.map((week) => (
              <button
                key={week.id}
                onClick={() => setSelectedId(week.id)}
                className={`w-full text-left border p-4 ${
                  selected?.id === week.id
                    ? 'border-brand-orange bg-brand-orange/10'
                    : 'border-brand-orange/20 bg-cyber-black/5'
                }`}
              >
                <p className="font-orbitron text-sm font-bold">{week.title || `Tuần ${week.week_start}`}</p>
                <p className="tech-mono text-[10px] text-brand-orange uppercase mt-1">{WEEK_LABELS[week.status]}</p>
                <p className="tech-mono text-[10px] text-muted uppercase mt-1">
                  {week.slots.length} bài · {week.comments.length} comment tuần
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
}: {
  week: EditorialWeek;
  pending: boolean;
  startTransition: (action: () => void | Promise<void>) => void;
  onWeek: (week: EditorialWeek) => void;
  onSlot: (slot: EditorialSlot) => void;
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
        toast.success('Đã đổi thứ tự. ChatGPT sẽ thấy item_order mới.');
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  return (
    <section className="border border-brand-orange/20 p-5 bg-cyber-black/5 space-y-6">
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
                  toast.error(error.message);
                }
              });
            }
          }}
          className="w-full bg-transparent border border-brand-orange/20 px-3 py-2 font-orbitron font-bold"
        />
        <p className="tech-mono text-[11px] text-brand-orange uppercase">
          {WEEK_LABELS[week.status]} · {isoWeekLabel(week.week_start)} · rev #{week.revision_number}
          {locked ? ' · LOCKED' : ''}
        </p>
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
                  toast.error(error.message);
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
        placeholder="Comment chi tiết cho cả kế hoạch tuần..."
        onSubmit={(body) => startTransition(async () => {
          try {
            const comment = await addEditorialReviewComment({ week_id: week.id, body });
            onWeek({ ...week, comments: [...week.comments, comment] });
            toast.success('Đã lưu comment tuần.');
          } catch (error: any) {
            toast.error(error.message);
          }
        })}
      />

      {!cancelled && (week.status === 'proposed' || week.status === 'revision_ready') && (
        <div className="space-y-3 border border-brand-orange/20 p-4">
          <p className="tech-mono text-[11px] uppercase text-muted">Yêu cầu hiệu chỉnh — constraint server enforce</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {(
              [
                ['keep_schedule', 'Giữ lịch'],
                ['keep_category', 'Giữ category'],
                ['keep_cluster', 'Giữ cluster (field/subject)'],
                ['keep_keyword', 'Giữ keyword'],
                ['allow_title_change', 'Cho đổi title'],
                ['allow_angle_change', 'Cho đổi content angle'],
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
                  toast.success('Đã duyệt và khóa plan.');
                } catch (error: any) {
                  toast.error(error.message);
                }
              })}
              className="px-4 py-2 bg-brand-orange text-white font-orbitron text-xs uppercase"
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
                  onWeek(await requestEditorialWeekRevision(week.id, weekNote, constraints));
                  setWeekNote('');
                  toast.success('Đã gửi revision_requested. GPT phải dựa trên revision hiện tại.');
                } catch (error: any) {
                  toast.error(error.message);
                }
              })}
              className="px-4 py-2 border border-brand-orange text-brand-orange font-orbitron text-xs uppercase"
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
                  toast.error(error.message);
                }
              })}
              className="px-4 py-2 text-red-500 font-orbitron text-xs uppercase"
            >
              Hủy tuần
            </button>
          </div>
        </div>
      )}

      {week.diff?.length > 0 && (
        <div className="border border-brand-orange/20 p-4 space-y-2">
          <p className="tech-mono text-[11px] uppercase">Diff revision #{Math.max(1, week.revision_number - 1)} → #{week.revision_number}</p>
          {week.diff.slice(0, 20).map((item) => (
            <p key={item.path} className="text-sm font-mono">
              <span className="text-muted">{item.path}</span>
              <br />
              <span className="text-red-400">- {item.before || '∅'}</span>
              <br />
              <span className="text-green-500">+ {item.after || '∅'}</span>
            </p>
          ))}
        </div>
      )}

      {week.activity?.length > 0 && (
        <div className="border border-brand-orange/20 p-4 space-y-2">
          <p className="tech-mono text-[11px] uppercase">Hoạt động</p>
          {week.activity.map((item) => (
            <p key={item.id} className="text-sm">
              <span className="tech-mono text-[10px] text-muted uppercase">
                {new Date(item.created_at).toLocaleString('vi-VN')} · {item.actor}
              </span>
              <br />
              {item.event}
            </p>
          ))}
        </div>
      )}

      <div>
        <p className="tech-mono text-[11px] text-muted uppercase mb-3">
          {briefLocked ? 'Plan đã khóa — không kéo thả / không sửa brief' : 'Kéo tay cầm để đổi thứ tự bài gửi review'}
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
                  startTransition={startTransition}
                  onSlot={onSlot}
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
  startTransition: (action: () => void | Promise<void>) => void;
  onSlot: (slot: EditorialSlot) => void;
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
  startTransition,
  onSlot,
  dragHandle,
}: {
  slot: EditorialSlot;
  index: number;
  pending: boolean;
  planLocked?: boolean;
  startTransition: (action: () => void | Promise<void>) => void;
  onSlot: (slot: EditorialSlot) => void;
  dragHandle: { attributes: any; listeners: any };
}) {
  const [draft, setDraft] = useState(toDraft(slot));
  const [note, setNote] = useState('');
  const due = isSlotDue(slot);
  const locked = Boolean(planLocked) || slot.status === 'cancelled' || slot.status === 'drafted';

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
        toast.success('Đã lưu brief. ChatGPT sẽ thấy bản mới.');
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  return (
    <article className="border border-brand-orange/15 p-4 bg-black/10 space-y-3">
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
            </p>
            {slot.result_post_id && (
              <a href={`/admin/posts/edit/${slot.result_post_id}`} className="tech-mono text-[11px] text-brand-orange underline uppercase">
                Mở bản nháp
              </a>
            )}
          </div>
          <input
            value={draft.title}
            disabled={locked || pending}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            className="w-full bg-transparent border border-brand-orange/20 px-3 py-2 font-semibold"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              value={draft.scheduled_date}
              disabled={locked || pending}
              onChange={(event) => setDraft((current) => ({ ...current, scheduled_date: event.target.value }))}
              className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={draft.scheduled_time}
              disabled={locked || pending}
              onChange={(event) => setDraft((current) => ({ ...current, scheduled_time: event.target.value }))}
              className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <input
            value={draft.angle}
            disabled={locked || pending}
            onChange={(event) => setDraft((current) => ({ ...current, angle: event.target.value }))}
            placeholder="Góc viết"
            className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
          />
          <textarea
            value={draft.outline}
            disabled={locked || pending}
            onChange={(event) => setDraft((current) => ({ ...current, outline: event.target.value }))}
            rows={4}
            placeholder="Nội dung / dàn ý"
            className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={draft.audience} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))} placeholder="Đối tượng" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.goal} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, goal: event.target.value }))} placeholder="Mục tiêu" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.field} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, field: event.target.value }))} placeholder="Lĩnh vực" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.subject} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Chủ đề" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.category} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Danh mục" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.tags} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags, cách nhau bởi dấu phẩy" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.search_intent} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, search_intent: event.target.value }))} placeholder="Search intent" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.primary_keyword} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, primary_keyword: event.target.value }))} placeholder="Primary keyword" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
            <input value={draft.secondary_keywords} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, secondary_keywords: event.target.value }))} placeholder="Secondary keywords" className="border border-brand-orange/20 bg-transparent px-3 py-2 text-sm md:col-span-2" />
          </div>
          <textarea value={draft.why_this_article} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, why_this_article: event.target.value }))} rows={2} placeholder="Why this article" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
          <textarea value={draft.source_strategy} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, source_strategy: event.target.value }))} rows={2} placeholder="Source strategy" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
          <input value={draft.article_objectives} disabled={locked || pending} onChange={(event) => setDraft((current) => ({ ...current, article_objectives: event.target.value }))} placeholder="Article objectives, cách nhau bởi |" className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm" />
          {!locked && (
            <button
              disabled={pending}
              onClick={save}
              className="px-3 py-2 border border-brand-orange text-brand-orange font-orbitron text-[11px] uppercase"
            >
              Lưu brief
            </button>
          )}

          <CommentThread
            comments={slot.comments}
            pending={pending}
            placeholder="Comment chi tiết cho bài này..."
            onSubmit={(body) => startTransition(async () => {
              try {
                if (!slot.week_id) throw new Error('Slot lẻ không có tuần để gắn comment');
                const comment = await addEditorialReviewComment({
                  week_id: slot.week_id,
                  slot_id: slot.id,
                  body,
                });
                onSlot({ ...slot, comments: [...slot.comments, comment] });
                toast.success('Đã lưu comment bài.');
              } catch (error: any) {
                toast.error(error.message);
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
                    toast.error(error.message);
                  }
                })}
                className="px-3 py-2 bg-brand-orange text-white font-orbitron text-[11px] uppercase"
              >
                Duyệt bài
              </button>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ghi chú gửi kèm (tuỳ chọn nếu đã comment)"
                className="flex-1 border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
              />
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  try {
                    onSlot({ ...(await requestEditorialRevision(slot.id, note)), comments: slot.comments });
                    setNote('');
                    toast.success('Đã gửi ChatGPT sửa bài này.');
                  } catch (error: any) {
                    toast.error(error.message);
                  }
                })}
                className="px-3 py-2 border border-brand-orange text-brand-orange font-orbitron text-[11px] uppercase"
              >
                Gửi GPT sửa bài
              </button>
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  try {
                    onSlot({ ...(await cancelEditorialSlot(slot.id)), comments: slot.comments });
                    toast.success('Đã hủy bài.');
                  } catch (error: any) {
                    toast.error(error.message);
                  }
                })}
                className="px-3 py-2 text-red-500 font-orbitron text-[11px] uppercase"
              >
                Hủy
              </button>
            </div>
          )}
          {slot.status === 'approved' && !due && (
            <button
              disabled={pending}
              onClick={() => startTransition(async () => {
                try {
                  onSlot({ ...(await releaseEditorialSlotNow(slot.id)), comments: slot.comments });
                  toast.success('Đã mở viết ngay.');
                } catch (error: any) {
                  toast.error(error.message);
                }
              })}
              className="px-3 py-2 border border-brand-orange text-brand-orange font-orbitron text-[11px] uppercase"
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
          className="px-3 py-2 border border-brand-orange/40 font-orbitron text-[11px] uppercase"
        >
          Thêm comment
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
