import { NextResponse } from "next/server";
import { EditorialCalendarRepository, type EditorialSlot } from "@/lib/content/editorial-calendar";
import { sendEditorialDueReminderEmail } from "@/lib/notifications/email";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function remindedToday(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const vnLast = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return vnNow === vnLast;
}

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.EDITORIAL_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const result = await EditorialCalendarRepository.listDue(getSupabaseAdmin(), now);
  const fresh = result.due.filter((slot: EditorialSlot) => !remindedToday(slot.last_due_reminder_at, now));

  let emailed = false;
  if (fresh.length) {
    emailed = await sendEditorialDueReminderEmail(fresh);
    if (emailed) {
      await EditorialCalendarRepository.markDueReminded(
        getSupabaseAdmin(),
        fresh.map((slot: EditorialSlot) => slot.id),
        now
      );
    }
  }

  return NextResponse.json({
    timezone: result.timezone,
    now: result.now,
    due: result.due.length,
    upcoming: result.upcoming.length,
    emailed: emailed ? fresh.length : 0,
  });
}

export const POST = GET;
