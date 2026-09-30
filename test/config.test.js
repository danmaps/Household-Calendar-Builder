import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CALENDAR_DEFAULTS,
  ConfigValidationError,
  TASK_DEFAULTS,
  isDateOnly,
  normalizeConfig,
  parseConfig,
  serializeConfig,
  validateConfig,
} from "../src/config.js";
import { ICON_IDS } from "../src/icon-ids.js";

const fixtureText = readFileSync(new URL("../fixtures/october-2026-dog-care.json", import.meta.url), "utf8");
const expected = JSON.parse(
  readFileSync(new URL("../fixtures/october-2026-dog-care.expected.json", import.meta.url), "utf8"),
);

function minimalConfig() {
  return {
    schemaVersion: 1,
    calendar: { months: [{ year: 2026, month: 10 }] },
    tasks: [
      {
        id: "brush-teeth",
        name: "Brush teeth",
        recurrence: { type: "interval", days: 2, firstDue: "2026-10-01" },
        icon: "toothbrush",
      },
    ],
  };
}

function pathsOf(config) {
  return validateConfig(config).map((e) => e.path);
}

test("fixture is valid", () => {
  assert.deepEqual(validateConfig(JSON.parse(fixtureText)), []);
});

test("fixture round-trips through parse and serialize without losing fields", () => {
  const parsed = parseConfig(fixtureText);
  assert.deepEqual(parsed, JSON.parse(fixtureText));
  const text = serializeConfig(parsed);
  assert.deepEqual(JSON.parse(text), JSON.parse(fixtureText));
  assert.equal(serializeConfig(parseConfig(text)), text);
});

test("fixture documents October 2026 starting on Thursday in a Sunday-first calendar", () => {
  const config = parseConfig(fixtureText);
  const { year, month } = config.calendar.months[0];
  assert.deepEqual({ year, month }, expected.month);
  assert.equal(config.calendar.weekStartsOn, expected.weekStartsOn);

  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  assert.equal(names[weekday], expected.firstDayWeekday);
  const column = (weekday - config.calendar.weekStartsOn + 7) % 7;
  assert.equal(column, expected.firstDayColumn);

  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  assert.equal(days, expected.daysInMonth);
  assert.equal(Math.ceil((column + days) / 7), expected.weekRows);
});

test("fixture brushes teeth every other day from October 1", () => {
  const config = parseConfig(fixtureText);
  const brush = config.tasks.find((t) => t.id === "brush-teeth");
  assert.deepEqual(brush.recurrence, { type: "interval", days: 2, firstDue: "2026-10-01" });
  assert.equal(brush.icon, "toothbrush");

  const due = [];
  for (let day = 1; day <= expected.daysInMonth; day += brush.recurrence.days) {
    due.push(`2026-10-${String(day).padStart(2, "0")}`);
  }
  assert.deepEqual(due, expected.brushTeethDueDates);
});

test("defaults are filled in for optional fields", () => {
  const config = normalizeConfig(minimalConfig());
  assert.deepEqual(config.calendar, { months: [{ year: 2026, month: 10 }], ...CALENDAR_DEFAULTS });
  assert.deepEqual(
    { color: config.tasks[0].color, assignee: config.tasks[0].assignee, enabled: config.tasks[0].enabled },
    TASK_DEFAULTS,
  );
  assert.equal(config.calendar.weekStartsOn, 0);
  assert.equal(config.calendar.orientation, "landscape");
  assert.equal(config.calendar.colorMode, "monochrome");
  assert.equal(config.calendar.decoration, "none");
});

test("every supported recurrence type validates", () => {
  const config = minimalConfig();
  config.tasks.push(
    { id: "walk", name: "Walk", recurrence: { type: "weekdays", weekdays: [1, 4] }, icon: "paw" },
    { id: "meds", name: "Meds", recurrence: { type: "monthDates", dates: [1, 15] }, icon: "pills" },
    { id: "vet", name: "Vet", recurrence: { type: "once", dates: ["2026-10-20"] }, icon: "syringe" },
  );
  assert.deepEqual(validateConfig(config), []);
  assert.deepEqual(parseConfig(serializeConfig(config)).tasks.map((t) => t.recurrence.type), [
    "interval",
    "weekdays",
    "monthDates",
    "once",
  ]);
});

test("missing required fields produce actionable errors", () => {
  assert.deepEqual(pathsOf({}), ["schemaVersion", "calendar", "tasks"]);

  const config = minimalConfig();
  delete config.calendar.months;
  delete config.tasks[0].name;
  delete config.tasks[0].icon;
  delete config.tasks[0].recurrence.firstDue;
  const errors = validateConfig(config);
  assert.deepEqual(errors.map((e) => e.path), [
    "calendar.months",
    "tasks[0].name",
    "tasks[0].recurrence.firstDue",
    "tasks[0].icon",
  ]);
  assert.match(errors[2].message, /first due date/);
});

test("unsupported display settings are rejected with the allowed values", () => {
  const config = minimalConfig();
  Object.assign(config.calendar, {
    weekStartsOn: 3,
    paper: "legal",
    orientation: "sideways",
    marginInches: 2,
    colorMode: "sepia",
    titleAlign: "justify",
    titleSize: "huge",
    decoration: "glitter",
    showKey: "yes",
    showCheckboxes: 1,
    showTitle: true,
  });
  const errors = validateConfig(config);
  assert.deepEqual(errors.map((e) => e.path), [
    "calendar.weekStartsOn",
    "calendar.paper",
    "calendar.orientation",
    "calendar.marginInches",
    "calendar.colorMode",
    "calendar.titleAlign",
    "calendar.titleSize",
    "calendar.decoration",
    "calendar.showKey",
    "calendar.showCheckboxes",
    "calendar.title",
  ]);
  assert.match(errors[1].message, /"letter", "a4"/);
});

test("invalid months are rejected", () => {
  const config = minimalConfig();
  config.calendar.months = [
    { year: 2026, month: 13 },
    { year: 2026, month: 10 },
    { year: 2026, month: 10 },
  ];
  assert.deepEqual(pathsOf(config), ["calendar.months[0].month", "calendar.months[2]"]);

  config.calendar.months = [];
  assert.deepEqual(pathsOf(config), ["calendar.months"]);
});

test("unsupported recurrence types and bad recurrence values are rejected", () => {
  const config = minimalConfig();
  config.tasks[0].recurrence = { type: "hourly" };
  const [error] = validateConfig(config);
  assert.equal(error.path, "tasks[0].recurrence.type");
  assert.match(error.message, /"interval", "weekdays", "monthDates", "once"/);

  config.tasks[0].recurrence = { type: "interval", days: 0, firstDue: "2026-02-30" };
  assert.deepEqual(pathsOf(config), ["tasks[0].recurrence.days", "tasks[0].recurrence.firstDue"]);

  config.tasks[0].recurrence = { type: "weekdays", weekdays: [1, 7, 1] };
  assert.deepEqual(pathsOf(config), ["tasks[0].recurrence.weekdays[1]", "tasks[0].recurrence.weekdays[2]"]);

  config.tasks[0].recurrence = { type: "monthDates", dates: [] };
  assert.deepEqual(pathsOf(config), ["tasks[0].recurrence.dates"]);

  config.tasks[0].recurrence = { type: "once", dates: ["10/20/2026"], days: 2 };
  assert.deepEqual(pathsOf(config), ["tasks[0].recurrence.days", "tasks[0].recurrence.dates[0]"]);
});

test("unknown icon IDs, bad colors, and duplicate task IDs are rejected", () => {
  const config = minimalConfig();
  config.tasks[0].icon = "unicorn";
  config.tasks[0].color = "blue";
  config.tasks.push({ ...minimalConfig().tasks[0], id: "brush-teeth" });
  const errors = validateConfig(config);
  assert.deepEqual(errors.map((e) => e.path), ["tasks[0].icon", "tasks[0].color", "tasks[1].id"]);
  assert.match(errors[0].message, /Unknown icon ID "unicorn"/);
});

test("unknown fields and unsupported schema versions are rejected", () => {
  const config = minimalConfig();
  config.schemaVersion = 2;
  config.calendar.font = "Comic Sans";
  config.tasks[0].priority = "high";
  assert.deepEqual(pathsOf(config), ["schemaVersion", "calendar.font", "tasks[0].priority"]);
});

test("parseConfig reports invalid JSON and throws ConfigValidationError", () => {
  assert.throws(() => parseConfig("{"), (err) => {
    assert.ok(err instanceof ConfigValidationError);
    assert.match(err.errors[0].message, /not valid JSON/);
    return true;
  });
  assert.throws(() => parseConfig({ schemaVersion: 1 }), ConfigValidationError);
});

test("isDateOnly accepts real dates only", () => {
  assert.ok(isDateOnly("2028-02-29"));
  assert.ok(!isDateOnly("2026-02-29"));
  assert.ok(!isDateOnly("2026-10-1"));
  assert.ok(!isDateOnly("2026-10-01T00:00:00Z"));
});

test("icon IDs are unique", () => {
  assert.equal(new Set(ICON_IDS).size, ICON_IDS.length);
});
