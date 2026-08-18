export const EDITORIAL_SLOT_STATUSES = [
  "proposed",
  "approved",
  "revision_requested",
  "writing",
  "drafted",
  "cancelled",
] as const;

export type EditorialSlotStatus = (typeof EDITORIAL_SLOT_STATUSES)[number];

export type EditorialSlot = {
  id: string;
  title: string;
  angle: string | null;
  audience: string | null;
  goal: string | null;
  scheduled_date: string | null;
  field: string | null;
  subject: string | null;
  category: string | null;
  tags: string[];
  notes: string | null;
  admin_feedback: string | null;
  status: EditorialSlotStatus;
  result_post_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EditorialSlotInput = {
  title: string;
  angle?: string;
  audience?: string;
  goal?: string;
  scheduled_date?: string;
  field?: string;
  subject?: string;
  category?: string;
  tags?: string[];
  notes?: string;
};

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
}

function toSlot(row: any): EditorialSlot {
  return {
    id: row.id,
    title: row.title,
    angle: row.angle,
    audience: row.audience,
    goal: row.goal,
    scheduled_date: row.scheduled_date,
    field: row.field,
    subject: row.subject,
    category: row.category,
    tags: asTags(row.tags),
    notes: row.notes,
    admin_feedback: row.admin_feedback,
    status: row.status,
    result_post_id: row.result_post_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class EditorialCalendarRepository {
  static async list(supabase: any, status?: string) {
    let query = supabase
      .from("editorial_calendar")
      .select("*")
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return (data || []).map(toSlot);
  }

  static async propose(supabase: any, slots: EditorialSlotInput[]) {
    if (!slots.length) throw new Error("EMPTY_CALENDAR: need at least 1 slot");
    if (slots.length > 12) throw new Error("CALENDAR_LIMIT: max 12 slots per proposal");
    const rows = slots.map((slot) => {
      if (!slot.title?.trim()) throw new Error("INVALID_SLOT: title is required");
      return {
        title: slot.title.trim(),
        angle: slot.angle?.trim() || null,
        audience: slot.audience?.trim() || null,
        goal: slot.goal?.trim() || null,
        scheduled_date: slot.scheduled_date || null,
        field: slot.field?.trim() || null,
        subject: slot.subject?.trim() || null,
        category: slot.category?.trim() || null,
        tags: asTags(slot.tags),
        notes: slot.notes?.trim() || null,
        status: "proposed",
      };
    });
    const { data, error } = await supabase.from("editorial_calendar").insert(rows).select("*");
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return (data || []).map(toSlot);
  }

  static async revise(supabase: any, id: string, patch: Partial<EditorialSlotInput>) {
    const current = await this.get(supabase, id);
    if (current.status !== "revision_requested") {
      throw new Error("INVALID_STATUS: slot can only be revised when status is revision_requested");
    }
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({
        title: patch.title?.trim() || current.title,
        angle: patch.angle?.trim() ?? current.angle,
        audience: patch.audience?.trim() ?? current.audience,
        goal: patch.goal?.trim() ?? current.goal,
        scheduled_date: patch.scheduled_date ?? current.scheduled_date,
        field: patch.field?.trim() ?? current.field,
        subject: patch.subject?.trim() ?? current.subject,
        category: patch.category?.trim() ?? current.category,
        tags: patch.tags ? asTags(patch.tags) : current.tags,
        notes: patch.notes?.trim() ?? current.notes,
        status: "proposed",
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async setStatus(
    supabase: any,
    id: string,
    status: EditorialSlotStatus,
    adminFeedback?: string
  ) {
    const payload: Record<string, unknown> = { status };
    if (adminFeedback !== undefined) payload.admin_feedback = adminFeedback;
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async get(supabase: any, id: string) {
    const { data, error } = await supabase.from("editorial_calendar").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("UNKNOWN_CALENDAR_ID");
    return toSlot(data);
  }

  static async claimForWriting(supabase: any, id: string) {
    const slot = await this.get(supabase, id);
    if (slot.status !== "approved" && slot.status !== "writing") {
      throw new Error("CALENDAR_NOT_APPROVED: only approved slots can be written");
    }
    if (slot.status === "approved") {
      return this.setStatus(supabase, id, "writing");
    }
    return slot;
  }

  static async markDrafted(supabase: any, id: string, postId: string) {
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({ status: "drafted", result_post_id: postId })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }
}
