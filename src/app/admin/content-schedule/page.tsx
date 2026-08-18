import { ContentScheduleBoard } from '@/components/admin/content-planner/ContentScheduleBoard';
import { EditorialCalendarBoard } from '@/components/admin/editorial/EditorialCalendarBoard';
import { getContentScheduleState } from '@/app/actions/content-schedules';
import { listEditorialWeeks, listLooseEditorialSlots } from '@/app/actions/editorial-calendar';
import type { EditorialSlot } from '@/lib/content/editorial-calendar';
import type { EditorialWeek } from '@/lib/content/editorial-week';

export default async function ContentSchedulePage() {
  const scheduleState = await getContentScheduleState();
  let editorialWeeks: EditorialWeek[] = [];
  let looseSlots: EditorialSlot[] = [];
  try {
    editorialWeeks = await listEditorialWeeks();
    looseSlots = await listLooseEditorialSlots();
  } catch {
    editorialWeeks = [];
    looseSlots = [];
  }

  return (
    <div className="min-h-screen dragon-grid">
      <div className="mb-10">
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">
          LỊCH TRÌNH <span className="cyber-text-gradient">NỘI DUNG</span>
        </h1>
        <p className="tech-mono text-brand-orange text-[11px] uppercase tracking-[0.3em] font-bold">
          {'// CHATGPT_WEEKLY_PLAN + HUMAN_ROADMAP //'}
        </p>
      </div>

      <EditorialCalendarBoard initialWeeks={editorialWeeks} initialLooseSlots={looseSlots} />

      <ContentScheduleBoard
        initialItems={scheduleState.items}
        initialPreviousArticleContent={scheduleState.previousArticleContent}
        initialInstructions={scheduleState.instructions}
        initialReferencePosts={scheduleState.referencePosts}
        initialLoadError={scheduleState.success ? '' : scheduleState.error}
      />
    </div>
  );
}
