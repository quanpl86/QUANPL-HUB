import { ContentScheduleBoard } from '@/components/admin/content-planner/ContentScheduleBoard';
import { getContentScheduleState } from '@/app/actions/content-schedules';

export default async function ContentSchedulePage() {
  const scheduleState = await getContentScheduleState();

  return (
    <div className="min-h-screen dragon-grid">
      <div className="mb-10">
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">
          LỊCH TRÌNH <span className="cyber-text-gradient">NỘI DUNG</span>
        </h1>
        <p className="tech-mono text-brand-orange text-[11px] uppercase tracking-[0.3em] font-bold">
          {'// CONTENT_ROADMAP_PIPELINE // DRAFT → IN_PROGRESS → DONE //'}
        </p>
      </div>

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
