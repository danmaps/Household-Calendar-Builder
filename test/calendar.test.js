import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildCalendar, getMonthGrid, getTaskOccurrences } from "../src/calendar.js";
import { parseConfig } from "../src/config.js";

const fixture = parseConfig(readFileSync(new URL("../fixtures/october-2026-dog-care.json", import.meta.url), "utf8"));
const expected = JSON.parse(readFileSync(new URL("../fixtures/october-2026-dog-care.expected.json", import.meta.url), "utf8"));
const isoDates = (days, year = 2026, month = 10) => days.map((day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);

test("October 2026 month grid aligns Thursday and has five Sunday-first rows", () => {
  const grid = getMonthGrid(2026, 10, 0);
  assert.equal(grid.daysInMonth, 31);
  assert.equal(grid.firstWeekdayName, "Thursday");
  assert.equal(grid.firstColumn, 4);
  assert.equal(grid.weekRows, 5);
  assert.equal(grid.weeks[0][4], "2026-10-01");
  assert.equal(grid.weeks[4][6], "2026-10-31");
  assert.equal(grid.weeks.flat().filter(Boolean).length, 31);
});

test("month grid supports Monday-first layout and six-row months", () => {
  const mondayFirst = getMonthGrid(2026, 10, 1);
  assert.equal(mondayFirst.firstColumn, 3);
  assert.equal(mondayFirst.weeks[0][3], "2026-10-01");
  const sixRows = getMonthGrid(2026, 8, 0);
  assert.equal(sixRows.weekRows, 6);
  assert.equal(sixRows.weeks[5][1], "2026-08-31");
});

test("month grid handles leap years and century boundaries", () => {
  assert.equal(getMonthGrid(2024, 2).daysInMonth, 29);
  assert.equal(getMonthGrid(2000, 2).daysInMonth, 29);
  assert.equal(getMonthGrid(1900, 2).daysInMonth, 28);
  assert.equal(getMonthGrid(2023, 2).daysInMonth, 28);
});

test("interval recurrence is anchored within a month and on a prior month boundary", () => {
  const inMonth = { recurrence: { type: "interval", days: 2, firstDue: "2026-10-01" } };
  assert.deepEqual(getTaskOccurrences(inMonth, 2026, 10), expected.brushTeethDueDates);
  const beforeMonth = { recurrence: { type: "interval", days: 3, firstDue: "2026-09-30" } };
  assert.deepEqual(getTaskOccurrences(beforeMonth, 2026, 10), isoDates([3, 6, 9, 12, 15, 18, 21, 24, 27, 30]));
});

test("weekday, month-date, and one-time recurrence rules generate only matching dates", () => {
  assert.deepEqual(getTaskOccurrences({ recurrence: { type: "weekdays", weekdays: [1, 4] } }, 2026, 10),
    isoDates([1, 5, 8, 12, 15, 19, 22, 26, 29]));
  assert.deepEqual(getTaskOccurrences({ recurrence: { type: "monthDates", dates: [1, 15, 31] } }, 2026, 10),
    isoDates([1, 15, 31]));
  assert.deepEqual(getTaskOccurrences({ recurrence: { type: "monthDates", dates: [29, 30, 31] } }, 2026, 2),
    []);
  assert.deepEqual(getTaskOccurrences({ recurrence: { type: "once", dates: ["2026-09-30", "2026-10-01", "2026-10-20", "2026-11-01"] } }, 2026, 10),
    isoDates([1, 20]));
});

test("buildCalendar applies the configuration week start and groups enabled task occurrences by date", () => {
  const result = buildCalendar(fixture);
  assert.equal(result.months.length, 1);
  const month = result.months[0];
  assert.equal(month.weeks[0][4].date, "2026-10-01");
  assert.deepEqual(month.weeks[0][4].tasks.map((task) => task.id), ["brush-teeth"]);
  assert.ok(month.occurrences.some(({ date, task }) => date === "2026-10-03" && task.id === "brush-teeth"));

  const disabled = structuredClone(fixture);
  disabled.tasks[0].enabled = false;
  const withoutDisabled = buildCalendar(disabled).months[0];
  assert.deepEqual(withoutDisabled.weeks[0][4].tasks, []);
});

test("invalid month grid parameters are rejected", () => {
  assert.throws(() => getMonthGrid(2026, 13), RangeError);
  assert.throws(() => getMonthGrid(999, 1), RangeError);
  assert.throws(() => getMonthGrid(2026, 1, 7), RangeError);
});
