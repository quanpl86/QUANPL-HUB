import {
  EditorialCalendarRepository,
  assertWeeklySlots,
  mondayOf,
  type EditorialSlot,
  type EditorialSlotInput,
} from "./editorial-calendar";
import { EditorialCommentRepository, type EditorialComment } from "./editorial-comments";
import {
  DEFAULT_REVISION_CONSTRAINTS,
  EditorialPlanAudit,
  applySlotAliases,
  assertPlanUnlocked,
  assertRevisionBase,
  diffSnapshots,
  enforceRevisionConstraints,
  parseConstraints,
  snapshotSlots,
  type EditorialActivity,
  type FieldDiff,
  type PlanRevision,
  type RevisionConstraints,
} from "./editorial-plan";
import { sendEditorialWeekReviewEmail } from "../notifications/email";

export const EDITORIAL_WEEK_STATUSES = [
  "proposed",
  "revision_requested",
  "revision_ready",
  "approved",
  "cancelled",
] as const;

export type EditorialWeekStatus = (typeof EDITORIAL_WEEK_STATUSES)[number];

export type EditorialWeek = {
  id: string;
  week_start: string;
  title: string | null;
  summary: string | null;
  status: EditorialWeekStatus;
  admin_feedback: string | null;
  revision_number: number;
  revision_constraints: RevisionConstraints;
  locked_at: string | null;
  latest_revision: PlanRevision | null;
  activity: EditorialActivity[];
  diff: FieldDiff[];
  created_at: string;
  updated_at: string;
  comments: EditorialComment[];
  slots: EditorialSlot[];
};

export type EditorialWeekInput = {
  week_start: string;
  title?: string;
  summary?: string;
  slots: EditorialSlotInput[];
  based_on_revision?: number;
};

function toWeek(
  row: any,
  slots: EditorialSlot[] = [],
  extras: Partial<Pick<EditorialWeek, "comments" | "latest_revision" | "activity" | "diff">> = {}
): EditorialWeek {
  return {
    id: row.id,
    week_start: row.week_start,
    title: row.title,
    summary: row.summary,
    status: row.status,
    admin_feedback: row.admin_feedback,
    revision_number: Number(row.revision_number || 1),
    revision_constraints: parseConstraints(row.revision_constraints),
    locked_at: row.locked_at || null,
    latest_revision: extras.latest_revision || null,
    activity: extras.activity || [],
    diff: extras.diff || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    comments: extras.comments || [],
    slots,
  };
}

function weekSnapshot(week: EditorialWeek) {
  return {
    title: week.title,
    summary: week.summary,
    week_start: week.week_start,
    slots: snapshotSlots(week.slots),
  };
}

async function hydrate(supabase: any, weeks: EditorialWeek[]): Promise<EditorialWeek[]> {
  const withComments = await attachWeekComments(supabase, weeks);
  const result: EditorialWeek[] = [];
  for (const week of withComments) {
    const revisions = await EditorialPlanAudit.listRevisions(supabase, week.id);
    const activity = await EditorialPlanAudit.listActivity(supabase, week.id, 20);
    const latest = revisions[0] || null;
    const previous = revisions[1] || null;
    result.push({
      ...week,
      latest_revision: latest,
      activity,
      diff: diffSnapshots(previous?.snapshot, latest?.snapshot),
    });
  }
  return result;
}

export async function attachWeekComments(supabase: any, weeks: EditorialWeek[]): Promise<EditorialWeek[]> {
  const comments = await EditorialCommentRepository.listForWeeks(
    supabase,
    weeks.map((week) => week.id)
  );
  return weeks.map((week) => ({
    ...week,
    comments: comments.filter((comment) => comment.week_id === week.id && !comment.slot_id),
    slots: week.slots
      .slice()
      .sort((a, b) => a.item_order - b.item_order)
      .map((slot) => ({
        ...slot,
        comments: comments.filter((comment) => comment.slot_id === slot.id),
      })),
  }));
}

async function persistSnapshot(
  supabase: any,
  week: EditorialWeek,
  author: "admin" | "chatgpt",
  event: string,
  note?: string
) {
  await EditorialPlanAudit.saveRevision(supabase, week.id, week.revision_number, weekSnapshot(week), author, note);
  await EditorialPlanAudit.log(supabase, {
    week_id: week.id,
    event,
    actor: author === "chatgpt" ? "chatgpt" : "admin",
    payload: { revision_number: week.revision_number, note: note || null },
  });
}

export class EditorialWeekRepository {
  static async list(supabase: any, status?: string): Promise<EditorialWeek[]> {
    let query = supabase
      .from("editorial_weeks")
      .select("*")
      .order("week_start", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    const weeks = data || [];
    const slots = await EditorialCalendarRepository.listByWeekIds(
      supabase,
      weeks.map((week: any) => week.id)
    );
    return hydrate(
      supabase,
      weeks.map((week: any) =>
        toWeek(week, slots.filter((slot: EditorialSlot) => slot.week_id === week.id))
      )
    );
  }

  static async get(supabase: any, id: string): Promise<EditorialWeek> {
    const { data, error } = await supabase.from("editorial_weeks").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("UNKNOWN_WEEK_ID");
    const slots = await EditorialCalendarRepository.list(supabase, undefined, { weekId: id });
    const [week] = await hydrate(supabase, [toWeek(data, slots)]);
    return week;
  }

  static async propose(supabase: any, input: EditorialWeekInput): Promise<EditorialWeek> {
    const slots = (input.slots || []).map((slot) => applySlotAliases(slot));
    assertWeeklySlots(slots);
    const weekStart = mondayOf(input.week_start);
    const { data, error } = await supabase
      .from("editorial_weeks")
      .insert({
        week_start: weekStart,
        title: input.title?.trim() || `Lịch tuần ${weekStart}`,
        summary: input.summary?.trim() || null,
        status: "proposed",
        revision_number: 1,
        revision_constraints: DEFAULT_REVISION_CONSTRAINTS,
      })
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    await EditorialCalendarRepository.propose(supabase, slots, data.id);
    const week = await this.get(supabase, data.id);
    await persistSnapshot(supabase, week, "chatgpt", "proposed");
    sendEditorialWeekReviewEmail(week, "proposed").catch(console.error);
    return this.get(supabase, data.id);
  }

  static async updateMeta(supabase: any, id: string, patch: { title?: string; summary?: string }) {
    const current = await this.get(supabase, id);
    if (current.status === "cancelled") throw new Error("Không sửa được lịch tuần đã hủy");
    assertPlanUnlocked(current.status);
    const nextRevision = current.revision_number + 1;
    const { error } = await supabase
      .from("editorial_weeks")
      .update({
        title: patch.title?.trim() || current.title,
        summary: patch.summary?.trim() ?? current.summary,
        revision_number: nextRevision,
      })
      .eq("id", id);
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    const week = await this.get(supabase, id);
    await persistSnapshot(supabase, week, "admin", "brief_edited", "week meta");
    return this.get(supabase, id);
  }

  static async bumpAfterAdminEdit(supabase: any, id: string, note = "brief_edited") {
    const current = await this.get(supabase, id);
    assertPlanUnlocked(current.status);
    const nextRevision = current.revision_number + 1;
    const { error } = await supabase
      .from("editorial_weeks")
      .update({ revision_number: nextRevision })
      .eq("id", id);
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    const week = await this.get(supabase, id);
    await persistSnapshot(supabase, week, "admin", note);
    return this.get(supabase, id);
  }

  static async revise(supabase: any, id: string, patch: Partial<EditorialWeekInput>): Promise<EditorialWeek> {
    const current = await this.get(supabase, id);
    assertPlanUnlocked(current.status);
    const slotNeedsRevise = current.slots.some((slot) => slot.status === "revision_requested");
    if (current.status !== "revision_requested" && !(current.status === "proposed" && slotNeedsRevise)) {
      throw new Error("INVALID_STATUS: week can only be revised when status is revision_requested, or when some slots were sent back");
    }
    assertRevisionBase(current.revision_number, patch.based_on_revision);
    const nextSlots = (patch.slots || []).map((slot) => applySlotAliases(slot));
    if (nextSlots.length) {
      assertWeeklySlots(nextSlots);
      enforceRevisionConstraints(current.slots, nextSlots, current.revision_constraints);
      for (const slot of nextSlots) {
        await EditorialCalendarRepository.upsertForWeek(supabase, id, slot);
      }
    }
    const nextRevision = current.revision_number + 1;
    const { error } = await supabase
      .from("editorial_weeks")
      .update({
        title: patch.title?.trim() || current.title,
        summary: patch.summary?.trim() ?? current.summary,
        week_start: patch.week_start ? mondayOf(patch.week_start) : current.week_start,
        status: "revision_ready",
        revision_number: nextRevision,
      })
      .eq("id", id);
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    const week = await this.get(supabase, id);
    await persistSnapshot(supabase, week, "chatgpt", "revised");
    sendEditorialWeekReviewEmail(week, "revised").catch(console.error);
    return this.get(supabase, id);
  }

  static async requestRevision(
    supabase: any,
    id: string,
    feedback: string,
    constraints?: Partial<RevisionConstraints>
  ): Promise<EditorialWeek> {
    const current = await this.get(supabase, id);
    if (current.status !== "proposed" && current.status !== "revision_ready") {
      throw new Error("Chỉ gửi yêu cầu sửa khi tuần đang chờ duyệt hoặc revision_ready");
    }
    const nextConstraints = parseConstraints({ ...current.revision_constraints, ...constraints });
    const { error } = await supabase
      .from("editorial_weeks")
      .update({
        status: "revision_requested",
        admin_feedback: feedback,
        revision_constraints: nextConstraints,
      })
      .eq("id", id);
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    await EditorialPlanAudit.log(supabase, {
      week_id: id,
      event: "revision_requested",
      actor: "admin",
      payload: { feedback, constraints: nextConstraints },
    });
    return this.get(supabase, id);
  }

  static async setStatus(
    supabase: any,
    id: string,
    status: EditorialWeekStatus,
    adminFeedback?: string
  ): Promise<EditorialWeek> {
    const current = await this.get(supabase, id);
    const payload: Record<string, unknown> = { status };
    if (adminFeedback !== undefined) payload.admin_feedback = adminFeedback;
    if (status === "approved") {
      if (current.status !== "proposed" && current.status !== "revision_ready") {
        throw new Error("Chỉ duyệt được lịch tuần đang proposed hoặc revision_ready");
      }
      payload.locked_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("editorial_weeks")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    if (status === "approved") {
      const slots = await EditorialCalendarRepository.list(supabase, undefined, { weekId: id });
      const pending = slots
        .filter((slot: EditorialSlot) => slot.status === "proposed" || slot.status === "revision_requested")
        .map((slot: EditorialSlot) => slot.id);
      await EditorialCalendarRepository.approveMany(supabase, pending);
      await EditorialPlanAudit.log(supabase, {
        week_id: id,
        event: "approved",
        actor: "admin",
        payload: { revision_number: current.revision_number },
      });
      return this.get(supabase, id);
    }
    if (status === "cancelled") {
      const slots = await EditorialCalendarRepository.list(supabase, undefined, { weekId: id });
      for (const slot of slots) {
        if (slot.status !== "drafted" && slot.status !== "cancelled") {
          await EditorialCalendarRepository.setStatus(supabase, slot.id, "cancelled");
        }
      }
      await EditorialPlanAudit.log(supabase, { week_id: id, event: "cancelled", actor: "admin" });
    }
    return this.get(supabase, id);
  }
}
