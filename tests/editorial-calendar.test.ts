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
import { EDITORIAL_COMMANDS } from "../src/lib/content/editorial-commands.ts";
import { EDITORIAL_PROMPT_KIT } from "../src/lib/content/editorial-prompt-kit.ts";
import {
  DEFAULT_REVISION_CONSTRAINTS,
  applySlotAliases,
  assertPlanUnlocked,
  assertRevisionBase,
  assertRichWeeklySlots,
  computeEditorialPerformance,
  enforceRevisionConstraints,
  shouldMarkWeekRevisionReady,
} from "../src/lib/content/editorial-plan.ts";

test("short command map covers plan, check, revise, and both write modes", () => {
  const ids = EDITORIAL_COMMANDS.commands.map((item) => item.id);
  for (const id of [
    "propose_week",
    "check_week_plan",
    "report_week_detail",
    "check_due_status",
    "revise_week_plan",
    "free_write",
    "write_due_from_week",
    "write_one_slot",
    "fix_rejected_draft",
    "regen_images",
    "use_existing_taxonomy",
  ]) {
    assert.ok(ids.includes(id), `missing command ${id}`);
  }
  assert.ok(EDITORIAL_COMMANDS.refuse.some((item) => /publish/i.test(item)));
});

test("admin prompt kit has all editorial job groups", () => {
  const titles = EDITORIAL_PROMPT_KIT.map((section) => section.title).join(" ");
  assert.match(titles, /Lập lịch/);
  assert.match(titles, /Check lịch/);
  assert.match(titles, /tự do/);
  assert.match(titles, /theo tuần/);
  assert.match(titles, /bị trả/);
  assert.ok(EDITORIAL_PROMPT_KIT.every((section) => section.items.length > 0));
});

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

test("week becomes revision_ready only after the last returned slot is revised", () => {
  const slots = [
    { id: "a", status: "proposed" },
    { id: "b", status: "revision_requested" },
    { id: "c", status: "revision_requested" },
  ];
  assert.equal(shouldMarkWeekRevisionReady("revision_requested", slots, "b"), false);
  assert.equal(
    shouldMarkWeekRevisionReady(
      "revision_requested",
      slots.map((slot) => slot.id === "b" ? { ...slot, status: "proposed" } : slot),
      "c"
    ),
    true
  );
  assert.equal(shouldMarkWeekRevisionReady("proposed", [{ id: "a", status: "proposed" }], "a"), true);
  assert.equal(shouldMarkWeekRevisionReady("approved", slots, "b"), false);
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

test("reopen rejects a slot that already has a draft", async () => {
  const mock = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({
          data: { id: "s1", status: "approved", result_post_id: "post-1", tags: [] },
          error: null,
        }),
      };
    },
  };
  await assert.rejects(
    () => EditorialCalendarRepository.reopen(mock, "s1"),
    /bản nháp/
  );
});

test("due list keeps a slot blocked when the week is not approved", async () => {
  const slots = [{
    id: "slot-1",
    week_id: "week-1",
    title: "Due but week proposed",
    status: "approved",
    scheduled_date: "2020-01-01",
    scheduled_time: "00:00",
    tags: [],
    item_order: 0,
  }];
  const mock = {
    from(table: string) {
      const query: any = {
        select() { return query; },
        eq() { return query; },
        in() { return query; },
        order() { return query; },
        limit() { return query; },
        is() { return query; },
        then(resolve: any) {
          if (table === "editorial_weeks") resolve({ data: [{ id: "week-1", status: "proposed" }], error: null });
          else resolve({ data: slots, error: null });
        },
      };
      return query;
    },
  };
  const result = await EditorialCalendarRepository.listDue(mock, new Date("2026-08-18T12:00:00.000Z"));
  assert.equal(result.due.length, 0);
  assert.equal(result.blocked.length, 1);
  assert.match(result.blocked[0].blocked_reason, /WEEK_NOT_APPROVED/);
});

test("performance treats published as write pass and rejected drafts as write fail", () => {
  const stats = computeEditorialPerformance([
    {
      status: "approved",
      revision_number: 2,
      slots: [
        { status: "published", last_seo_score: 96 },
        { status: "revision_requested", result_post_id: "p1", write_fails: 1 },
        { status: "drafted", last_seo_score: 95 },
      ],
    },
    { status: "cancelled", revision_number: 1, slots: [] },
  ]);
  assert.equal(stats.planning.passed, 1);
  assert.equal(stats.planning.failed, 1);
  assert.equal(stats.planning.pass_rate, 50);
  assert.equal(stats.writing.published, 1);
  assert.equal(stats.writing.rejected, 1);
  assert.equal(stats.writing.pass_rate, 33);
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
