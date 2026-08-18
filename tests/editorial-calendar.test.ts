import assert from "node:assert/strict";
import test from "node:test";
import { EditorialCalendarRepository } from "../src/lib/content/editorial-calendar.ts";

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
