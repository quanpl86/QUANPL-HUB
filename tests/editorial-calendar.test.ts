import assert from "node:assert/strict";
import test from "node:test";
import {
  EditorialCalendarRepository,
  assertWeeklySlots,
  isSlotDue,
  mondayOf,
  normalizeDate,
  normalizeTime,
  parseSlotDueAt,
} from "../src/lib/content/editorial-calendar.ts";
import { EditorialCommentRepository } from "../src/lib/content/editorial-comments.ts";
import {
  DEFAULT_REVISION_CONSTRAINTS,
  applySlotAliases,
  assertPlanUnlocked,
  assertRevisionBase,
  assertRichWeeklySlots,
  enforceRevisionConstraints,
} from "../src/lib/content/editorial-plan.ts";

test("propose rejects an empty calendar", async () => {
  await assert.rejects(
    () => EditorialCalendarRepository.propose({}, []),
    /EMPTY_CALENDAR/
  );
});

test("propose rejects more than 12 slots", async () => {
  const slots = Array.from({ length: 13 }, (_, index) => ({ title: `Slot ${index}` }));
  await assert.rejects(
    () => EditorialCalendarRepository.propose({}, slots),
    /CALENDAR_LIMIT/
  );
});

test("propose rejects a slot without title", async () => {
  await assert.rejects(
    () => EditorialCalendarRepository.propose({}, [{ title: "   " }]),
    /INVALID_SLOT/
  );
});

test("mondayOf normalizes any day to Monday", () => {
  assert.equal(mondayOf("2026-08-19"), "2026-08-17");
  assert.equal(mondayOf("2026-08-17"), "2026-08-17");
  assert.equal(mondayOf("2026-08-16"), "2026-08-10");
});

test("normalizeDate and normalizeTime reject bad values", () => {
  assert.equal(normalizeDate("2026-08-18"), "2026-08-18");
  assert.equal(normalizeTime("9:05"), "09:05");
  assert.throws(() => normalizeDate("18/08/2026"), /INVALID_DATE/);
  assert.throws(() => normalizeTime("25:00"), /INVALID_TIME/);
});

test("isSlotDue treats missing datetime as immediately due", () => {
  assert.equal(isSlotDue({ scheduled_date: null, scheduled_time: null }), true);
});

test("isSlotDue respects Asia/Ho_Chi_Minh wall clock", () => {
  const slot = { scheduled_date: "2026-08-18", scheduled_time: "09:00" };
  assert.equal(isSlotDue(slot, new Date("2026-08-18T01:59:00.000Z")), false);
  assert.equal(isSlotDue(slot, new Date("2026-08-18T02:00:00.000Z")), true);
  assert.equal(parseSlotDueAt(slot.scheduled_date, slot.scheduled_time)?.toISOString(), "2026-08-18T02:00:00.000Z");
});

test("weekly slots require outline and scheduled_date", () => {
  assert.throws(
    () => assertWeeklySlots([{ title: "A", scheduled_date: "2026-08-19" }]),
    /outline/
  );
  assert.throws(
    () => assertWeeklySlots([{ title: "A", outline: "Dàn ý" }]),
    /scheduled_date/
  );
});

const richSlot = {
  id: "slot-1",
  title: "AI Literacy cho giáo viên tiểu học",
  outline: "Định nghĩa + framework",
  scheduled_date: "2026-08-20",
  scheduled_time: "09:00",
  search_intent: "informational",
  primary_keyword: "AI literacy cho giáo viên",
  why_this_article: "Kho bài chưa có nội dung chuyên sâu",
  source_strategy: "UNESCO + OECD",
  field: "Education",
  subject: "PEDAGOGY",
  category: "Early Childhood Education",
  angle: "literacy",
};

test("propose missing rich required field is INVALID_SLOT", () => {
  assert.throws(
    () => assertRichWeeklySlots([{ ...richSlot, primary_keyword: "" }]),
    /INVALID_SLOT: primary_keyword/
  );
  assert.throws(
    () => assertWeeklySlots([{ title: "A", outline: "x", scheduled_date: "2026-08-20" }]),
    /INVALID_SLOT/
  );
});

test("keep_keyword blocks primary_keyword change without writing", () => {
  assert.throws(
    () => enforceRevisionConstraints(
      [richSlot],
      [{ ...richSlot, primary_keyword: "keyword khác" }],
      { ...DEFAULT_REVISION_CONSTRAINTS, keep_keyword: true }
    ),
    /CONSTRAINT_VIOLATION: primary_keyword/
  );
});

test("stale based_on_revision is REVISION_CONFLICT", () => {
  assert.throws(() => assertRevisionBase(2, 1), /REVISION_CONFLICT/);
  assert.throws(() => assertRevisionBase(1, undefined), /REVISION_CONFLICT/);
  assert.doesNotThrow(() => assertRevisionBase(3, 3));
});

test("approved plan is PLAN_LOCKED", () => {
  assert.throws(() => assertPlanUnlocked("approved"), /PLAN_LOCKED/);
  assert.doesNotThrow(() => assertPlanUnlocked("proposed"));
  assert.doesNotThrow(() => assertPlanUnlocked("revision_ready"));
});

test("target_audience and content_angle aliases map onto existing columns", () => {
  const mapped = applySlotAliases({
    title: "A",
    target_audience: "GV tiểu học",
    content_angle: "case study",
  } as { title: string; target_audience: string; content_angle: string; audience?: string; angle?: string });
  assert.equal(mapped.audience, "GV tiểu học");
  assert.equal(mapped.angle, "case study");
});

test("claimForWriting rejects a slot that is not due yet", async () => {
  const supabase = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({
          data: {
            id: "slot-1",
            title: "Later",
            status: "approved",
            scheduled_date: "2099-01-01",
            scheduled_time: "09:00",
            tags: [],
          },
          error: null,
        }),
      };
    },
  };
  await assert.rejects(
    () => EditorialCalendarRepository.claimForWriting(supabase, "slot-1"),
    /CALENDAR_NOT_DUE/
  );
});

test("claimForWriting rejects a slot whose week is not approved", async () => {
  const supabase = {
    from(table: string) {
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => {
          if (table === "editorial_weeks") {
            return { data: { status: "proposed" }, error: null };
          }
          return {
            data: {
              id: "slot-1",
              week_id: "week-1",
              title: "Now",
              status: "approved",
              scheduled_date: "2020-01-01",
              scheduled_time: "00:00",
              tags: [],
            },
            error: null,
          };
        },
      };
    },
  };
  await assert.rejects(
    () => EditorialCalendarRepository.claimForWriting(supabase, "slot-1"),
    /WEEK_NOT_APPROVED/
  );
});

test("comments require a body", async () => {
  await assert.rejects(
    () => EditorialCommentRepository.add({}, { week_id: "week-1", author: "admin", body: "   " }),
    /EMPTY_COMMENT/
  );
});

test("reorder rejects a partial slot list", async () => {
  const supabase = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        limit() { return this; },
        then: undefined,
      };
    },
  };
  // list() will throw DATABASE_ERROR because query isn't thenable; use a complete mock instead
  const listed = [
    { id: "a", week_id: "w", title: "A", status: "proposed", tags: [], item_order: 0 },
    { id: "b", week_id: "w", title: "B", status: "proposed", tags: [], item_order: 1 },
  ];
  const mock = {
    from() {
      const query: any = {
        select() { return query; },
        eq() { return query; },
        order() { return query; },
        limit() { return query; },
        maybeSingle: async () => ({ data: { status: "proposed" }, error: null }),
        then(resolve: any) { resolve({ data: listed, error: null }); },
      };
      return query;
    },
  };
  await assert.rejects(
    () => EditorialCalendarRepository.reorder(mock, "w", ["a"]),
    /INVALID_ORDER/
  );
});
