import { EditorialReviewDesk } from '@/components/admin/editorial/EditorialReviewDesk';
import { listEditorialWeeks } from '@/app/actions/editorial-calendar';
import type { EditorialWeek } from '@/lib/content/editorial-week';

export default async function EditorialReviewPage() {
  let weeks: EditorialWeek[] = [];
  try {
    weeks = await listEditorialWeeks();
  } catch {
    weeks = [];
  }

  return (
    <div className="min-h-screen dragon-grid">
      <EditorialReviewDesk initialWeeks={weeks} />
    </div>
  );
}
