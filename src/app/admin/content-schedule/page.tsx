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
    <div>
      <div className="mb-10">
        <span className="admin-eyebrow">Quy trình biên tập</span>
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">
          Lịch <span className="cyber-text-gradient">nội dung</span>
        </h1>
        <p className="text-muted text-sm">Lập kế hoạch, theo dõi tiến độ và chuẩn bị nội dung cho AI Agent.</p>
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
