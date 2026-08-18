import { ContentScheduleBoard } from '@/components/admin/content-planner/ContentScheduleBoard';
import { EditorialCalendarBoard } from '@/components/admin/editorial/EditorialCalendarBoard';
import { getContentScheduleState } from '@/app/actions/content-schedules';
import { listEditorialCalendar } from '@/app/actions/editorial-calendar';

export default async function ContentSchedulePage() {
  const scheduleState = await getContentScheduleState();
  let editorialSlots = [];
  try {
    editorialSlots = await listEditorialCalendar();
  } catch {
    editorialSlots = [];
  }

  return (
    <div className="min-h-screen dragon-grid">
      <div className="mb-10">
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">
          LỊCH TRÌNH <span className="cyber-text-gradient">NỘI DUNG</span>
        </h1>
        <p className="tech-mono text-brand-orange text-[11px] uppercase tracking-[0.3em] font-bold">
          {'// CHATGPT_CALENDAR + HUMAN_ROADMAP //'}
        </p>
      </div>

      <EditorialCalendarBoard initialSlots={editorialSlots} />

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
