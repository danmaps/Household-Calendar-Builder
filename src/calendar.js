import { normalizeConfig } from "./config.js";

const WEEKDAY_NAMES = Object.freeze(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function assertMonth(year, month) {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError("year must be a whole number from 1000 to 9999");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("month must be a whole number from 1 to 12");
  }
}

function dateString(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function utcDayNumber(date) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(0);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCFullYear(year, month - 1, day);
  return value.getTime() / DAY_MS;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Return stable month metadata and a Sunday- or Monday-first grid of date strings. */
export function getMonthGrid(year, month, weekStartsOn = 0) {
  assertMonth(year, month);
  if (weekStartsOn !== 0 && weekStartsOn !== 1) {
    throw new RangeError("weekStartsOn must be 0 (Sunday) or 1 (Monday)");
  }

  const count = daysInMonth(year, month);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const firstColumn = (firstWeekday - weekStartsOn + 7) % 7;
  const weekRows = Math.ceil((firstColumn + count) / 7);
  const cells = Array(firstColumn).fill(null);
  for (let day = 1; day <= count; day += 1) cells.push(dateString(year, month, day));
  while (cells.length < weekRows * 7) cells.push(null);

  const weeks = Array.from({ length: weekRows }, (_, row) => cells.slice(row * 7, row * 7 + 7));
  return {
    year,
    month,
    daysInMonth: count,
    firstWeekday,
    firstWeekdayName: WEEKDAY_NAMES[firstWeekday],
    firstColumn,
    weekStartsOn,
    weekRows,
    weeks,
  };
}

/** Return all ISO date strings on which task is due in the requested month. */
export function getTaskOccurrences(task, year, month) {
  assertMonth(year, month);
  const { daysInMonth: count } = getMonthGrid(year, month);
  const recurrence = task?.recurrence;
  if (!recurrence || typeof recurrence !== "object") {
    throw new TypeError("task must have a recurrence rule");
  }

  const dueDays = [];
  switch (recurrence.type) {
    case "interval": {
      const interval = recurrence.days;
      if (!Number.isInteger(interval) || interval < 1) throw new RangeError("interval recurrence days must be a positive integer");
      const firstDue = recurrence.firstDue;
      const startOfMonth = utcDayNumber(dateString(year, month, 1));
      const anchor = utcDayNumber(firstDue);
      for (let day = 1; day <= count; day += 1) {
        const offset = startOfMonth + day - 1 - anchor;
        if (offset >= 0 && offset % interval === 0) dueDays.push(day);
      }
      break;
    }
    case "weekdays":
      for (let day = 1; day <= count; day += 1) {
        if (recurrence.weekdays.includes(new Date(Date.UTC(year, month - 1, day)).getUTCDay())) dueDays.push(day);
      }
      break;
    case "monthDates":
      for (const day of recurrence.dates) if (day <= count) dueDays.push(day);
      break;
    case "once":
      for (const date of recurrence.dates) {
        if (date.startsWith(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-`)) {
          dueDays.push(Number(date.slice(-2)));
        }
      }
      break;
    default:
      throw new RangeError(`unsupported recurrence type: ${String(recurrence.type)}`);
  }

  return [...new Set(dueDays)].sort((a, b) => a - b).map((day) => dateString(year, month, day));
}

/** Build month grids with task occurrences from a validated configuration. */
export function buildCalendar(input) {
  const config = normalizeConfig(input);
  const tasks = config.tasks.filter((task) => task.enabled);
  return {
    calendar: config.calendar,
    months: config.calendar.months.map(({ year, month }) => {
      const grid = getMonthGrid(year, month, config.calendar.weekStartsOn);
      const occurrences = tasks.flatMap((task) =>
        getTaskOccurrences(task, year, month).map((date) => ({ date, task })),
      );
      const byDate = new Map();
      for (const occurrence of occurrences) {
        if (!byDate.has(occurrence.date)) byDate.set(occurrence.date, []);
        byDate.get(occurrence.date).push(occurrence.task);
      }
      return {
        ...grid,
        weeks: grid.weeks.map((week) => week.map((date) => ({
          date,
          day: date ? Number(date.slice(-2)) : null,
          tasks: date ? (byDate.get(date) ?? []) : [],
        }))),
        occurrences,
      };
    }),
  };
}
