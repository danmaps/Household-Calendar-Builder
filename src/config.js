// Versioned calendar configuration shared by the editor, preview, exporter,
// and (later) the API. See docs/configuration.md for the documented shape.
import { ICON_IDS, isKnownIconId } from "./icon-ids.js";

export const SCHEMA_VERSION = 1;

export const WEEK_STARTS = Object.freeze([0, 1]); // 0 = Sunday, 1 = Monday
export const PAPER_SIZES = Object.freeze(["letter", "a4"]);
export const ORIENTATIONS = Object.freeze(["landscape", "portrait"]);
export const COLOR_MODES = Object.freeze(["monochrome", "color"]);
export const TITLE_ALIGNMENTS = Object.freeze(["left", "center", "right"]);
export const TITLE_SIZES = Object.freeze(["small", "medium", "large"]);
export const DECORATIONS = Object.freeze(["none", "border", "paw-prints"]);
export const RECURRENCE_TYPES = Object.freeze(["interval", "weekdays", "monthDates", "once"]);

export const LIMITS = Object.freeze({
  maxMonths: 24,
  minYear: 1000,
  maxYear: 9999,
  maxTasks: 50,
  maxTitleLength: 120,
  maxNameLength: 60,
  maxAssigneeLength: 40,
  maxIntervalDays: 366,
  maxOnceDates: 100,
});

export const CALENDAR_DEFAULTS = Object.freeze({
  weekStartsOn: 0,
  paper: "letter",
  orientation: "landscape",
  colorMode: "monochrome",
  title: "",
  showTitle: false,
  titleAlign: "center",
  titleSize: "medium",
  decoration: "none",
  showKey: true,
  showCheckboxes: false,
});

export const TASK_DEFAULTS = Object.freeze({
  color: null,
  assignee: null,
  enabled: true,
});

const TOP_LEVEL_FIELDS = ["schemaVersion", "calendar", "tasks"];
const CALENDAR_FIELDS = ["months", ...Object.keys(CALENDAR_DEFAULTS)];
const MONTH_FIELDS = ["year", "month"];
const TASK_FIELDS = ["id", "name", "recurrence", "icon", ...Object.keys(TASK_DEFAULTS)];
const RECURRENCE_FIELDS = {
  interval: ["type", "days", "firstDue"],
  weekdays: ["type", "weekdays"],
  monthDates: ["type", "dates"],
  once: ["type", "dates"],
};

const TASK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class ConfigValidationError extends Error {
  constructor(errors) {
    const summary = errors.map((e) => formatError(e)).join("\n");
    super(`Invalid calendar configuration:\n${summary}`);
    this.name = "ConfigValidationError";
    this.errors = errors;
  }
}

export function formatError({ path, message }) {
  return path ? `${path}: ${message}` : message;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "object") return "an object";
  return String(value);
}

function listOf(values) {
  return values.map((v) => JSON.stringify(v)).join(", ");
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Returns true when value is a real calendar date written as YYYY-MM-DD. */
export function isDateOnly(value) {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

function checkUnknownFields(obj, allowed, path, errors) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      errors.push({
        path: path ? `${path}.${key}` : key,
        message: `Unsupported field. Remove it or use one of: ${allowed.join(", ")}.`,
      });
    }
  }
}

function checkEnum(value, allowed, path, errors) {
  if (!allowed.includes(value)) {
    errors.push({ path, message: `Unsupported value ${describe(value)}. Use one of: ${listOf(allowed)}.` });
  }
}

function checkBoolean(value, path, errors) {
  if (typeof value !== "boolean") {
    errors.push({ path, message: `Expected true or false, got ${describe(value)}.` });
  }
}

function checkInteger(value, min, max, path, errors) {
  if (!Number.isInteger(value) || value < min || value > max) {
    errors.push({ path, message: `Expected a whole number from ${min} to ${max}, got ${describe(value)}.` });
    return false;
  }
  return true;
}

function checkString(value, maxLength, path, errors, { required = false } = {}) {
  if (typeof value !== "string") {
    errors.push({ path, message: `Expected text, got ${describe(value)}.` });
    return;
  }
  if (required && value.trim() === "") {
    errors.push({ path, message: "Required. Enter a non-empty value." });
  } else if (value.length > maxLength) {
    errors.push({ path, message: `Too long (${value.length} characters). Use at most ${maxLength} characters.` });
  }
}

function checkUniqueList(value, path, errors, { itemCheck, minItems = 1, maxItems = Infinity, noun }) {
  if (!Array.isArray(value)) {
    errors.push({ path, message: `Expected a list of ${noun}, got ${describe(value)}.` });
    return;
  }
  if (value.length < minItems) {
    errors.push({ path, message: `Add at least ${minItems} ${noun}.` });
  }
  if (value.length > maxItems) {
    errors.push({ path, message: `Too many ${noun} (${value.length}). Use at most ${maxItems}.` });
  }
  const seen = new Set();
  value.forEach((item, i) => {
    const itemPath = `${path}[${i}]`;
    if (itemCheck(item, itemPath) && seen.has(item)) {
      errors.push({ path: itemPath, message: `Duplicate value ${describe(item)}. List each value once.` });
    }
    seen.add(item);
  });
}

function validateMonths(months, path, errors) {
  if (!Array.isArray(months)) {
    errors.push({ path, message: `Required. Provide a list of { "year", "month" } entries, got ${describe(months)}.` });
    return;
  }
  if (months.length === 0) {
    errors.push({ path, message: "Select at least one month." });
  }
  if (months.length > LIMITS.maxMonths) {
    errors.push({ path, message: `Too many months (${months.length}). Select at most ${LIMITS.maxMonths}.` });
  }
  const seen = new Set();
  months.forEach((entry, i) => {
    const entryPath = `${path}[${i}]`;
    if (!isPlainObject(entry)) {
      errors.push({ path: entryPath, message: `Expected { "year", "month" }, got ${describe(entry)}.` });
      return;
    }
    checkUnknownFields(entry, MONTH_FIELDS, entryPath, errors);
    const yearOk = checkInteger(entry.year, LIMITS.minYear, LIMITS.maxYear, `${entryPath}.year`, errors);
    const monthOk = checkInteger(entry.month, 1, 12, `${entryPath}.month`, errors);
    if (yearOk && monthOk) {
      const key = `${entry.year}-${entry.month}`;
      if (seen.has(key)) {
        errors.push({ path: entryPath, message: `Duplicate month ${key}. Each month can appear only once.` });
      }
      seen.add(key);
    }
  });
}

function validateCalendar(calendar, errors) {
  const path = "calendar";
  if (!isPlainObject(calendar)) {
    errors.push({ path, message: `Required. Expected an object, got ${describe(calendar)}.` });
    return;
  }
  checkUnknownFields(calendar, CALENDAR_FIELDS, path, errors);
  validateMonths(calendar.months, `${path}.months`, errors);

  const c = { ...CALENDAR_DEFAULTS, ...calendar };
  if (!WEEK_STARTS.includes(c.weekStartsOn)) {
    errors.push({
      path: `${path}.weekStartsOn`,
      message: `Unsupported value ${describe(c.weekStartsOn)}. Use 0 (Sunday) or 1 (Monday).`,
    });
  }
  checkEnum(c.paper, PAPER_SIZES, `${path}.paper`, errors);
  checkEnum(c.orientation, ORIENTATIONS, `${path}.orientation`, errors);
  checkEnum(c.colorMode, COLOR_MODES, `${path}.colorMode`, errors);
  checkString(c.title, LIMITS.maxTitleLength, `${path}.title`, errors);
  checkBoolean(c.showTitle, `${path}.showTitle`, errors);
  checkEnum(c.titleAlign, TITLE_ALIGNMENTS, `${path}.titleAlign`, errors);
  checkEnum(c.titleSize, TITLE_SIZES, `${path}.titleSize`, errors);
  checkEnum(c.decoration, DECORATIONS, `${path}.decoration`, errors);
  checkBoolean(c.showKey, `${path}.showKey`, errors);
  checkBoolean(c.showCheckboxes, `${path}.showCheckboxes`, errors);
  if (c.showTitle === true && typeof c.title === "string" && c.title.trim() === "") {
    errors.push({ path: `${path}.title`, message: "showTitle is true but the title is empty. Enter a title or set showTitle to false." });
  }
}

function validateRecurrence(recurrence, path, errors) {
  if (!isPlainObject(recurrence)) {
    errors.push({ path, message: `Required. Expected an object with a "type" of ${listOf(RECURRENCE_TYPES)}, got ${describe(recurrence)}.` });
    return;
  }
  if (!RECURRENCE_TYPES.includes(recurrence.type)) {
    errors.push({
      path: `${path}.type`,
      message: `Unsupported recurrence type ${describe(recurrence.type)}. Use one of: ${listOf(RECURRENCE_TYPES)}.`,
    });
    return;
  }
  checkUnknownFields(recurrence, RECURRENCE_FIELDS[recurrence.type], path, errors);

  const isValidDate = (value, p) => {
    if (!isDateOnly(value)) {
      errors.push({ path: p, message: `Expected a real date written as YYYY-MM-DD, got ${describe(value)}.` });
      return false;
    }
    return true;
  };

  switch (recurrence.type) {
    case "interval":
      checkInteger(recurrence.days, 1, LIMITS.maxIntervalDays, `${path}.days`, errors);
      if (recurrence.firstDue === undefined) {
        errors.push({
          path: `${path}.firstDue`,
          message: "Required for interval tasks. Enter the first due date (YYYY-MM-DD) that anchors the repeat.",
        });
      } else {
        isValidDate(recurrence.firstDue, `${path}.firstDue`);
      }
      break;
    case "weekdays":
      checkUniqueList(recurrence.weekdays, `${path}.weekdays`, errors, {
        noun: "weekdays (0 = Sunday … 6 = Saturday)",
        maxItems: 7,
        itemCheck: (v, p) => checkInteger(v, 0, 6, p, errors),
      });
      break;
    case "monthDates":
      checkUniqueList(recurrence.dates, `${path}.dates`, errors, {
        noun: "days of the month (1–31)",
        maxItems: 31,
        itemCheck: (v, p) => checkInteger(v, 1, 31, p, errors),
      });
      break;
    case "once":
      checkUniqueList(recurrence.dates, `${path}.dates`, errors, {
        noun: "dates (YYYY-MM-DD)",
        maxItems: LIMITS.maxOnceDates,
        itemCheck: isValidDate,
      });
      break;
  }
}

function validateTask(task, path, errors) {
  if (!isPlainObject(task)) {
    errors.push({ path, message: `Expected a task object, got ${describe(task)}.` });
    return;
  }
  checkUnknownFields(task, TASK_FIELDS, path, errors);

  if (typeof task.id !== "string" || !TASK_ID_PATTERN.test(task.id)) {
    errors.push({
      path: `${path}.id`,
      message: `Required. Use lowercase letters, numbers, and single hyphens (for example "brush-teeth"), got ${describe(task.id)}.`,
    });
  }
  checkString(task.name, LIMITS.maxNameLength, `${path}.name`, errors, { required: true });
  validateRecurrence(task.recurrence, `${path}.recurrence`, errors);
  if (!isKnownIconId(task.icon)) {
    errors.push({
      path: `${path}.icon`,
      message: `Unknown icon ID ${describe(task.icon)}. Choose a bundled icon such as ${listOf(ICON_IDS.slice(0, 5))} (see src/icon-ids.js).`,
    });
  }

  const t = { ...TASK_DEFAULTS, ...task };
  if (t.color !== null && (typeof t.color !== "string" || !COLOR_PATTERN.test(t.color))) {
    errors.push({ path: `${path}.color`, message: `Expected null or a hex color such as "#1f6feb", got ${describe(t.color)}.` });
  }
  if (t.assignee !== null) {
    checkString(t.assignee, LIMITS.maxAssigneeLength, `${path}.assignee`, errors);
  }
  checkBoolean(t.enabled, `${path}.enabled`, errors);
}

function validateTasks(tasks, errors) {
  const path = "tasks";
  if (!Array.isArray(tasks)) {
    errors.push({ path, message: `Required. Expected a list of tasks (it may be empty), got ${describe(tasks)}.` });
    return;
  }
  if (tasks.length > LIMITS.maxTasks) {
    errors.push({ path, message: `Too many tasks (${tasks.length}). Use at most ${LIMITS.maxTasks}.` });
  }
  const ids = new Set();
  tasks.forEach((task, i) => {
    validateTask(task, `${path}[${i}]`, errors);
    if (isPlainObject(task) && typeof task.id === "string") {
      if (ids.has(task.id)) {
        errors.push({ path: `${path}[${i}].id`, message: `Duplicate task ID ${describe(task.id)}. Each task needs a unique ID.` });
      }
      ids.add(task.id);
    }
  });
}

/**
 * Validates a configuration object.
 * @returns {{ path: string, message: string }[]} An empty list when valid.
 */
export function validateConfig(config) {
  const errors = [];
  if (!isPlainObject(config)) {
    errors.push({ path: "", message: `Expected a configuration object, got ${describe(config)}.` });
    return errors;
  }
  checkUnknownFields(config, TOP_LEVEL_FIELDS, "", errors);
  if (config.schemaVersion !== SCHEMA_VERSION) {
    errors.push({
      path: "schemaVersion",
      message: `Unsupported schema version ${describe(config.schemaVersion)}. This builder reads schemaVersion ${SCHEMA_VERSION}.`,
    });
  }
  validateCalendar(config.calendar, errors);
  validateTasks(config.tasks, errors);
  return errors;
}

function normalizeRecurrence(r) {
  switch (r.type) {
    case "interval":
      return { type: r.type, days: r.days, firstDue: r.firstDue };
    case "weekdays":
      return { type: r.type, weekdays: [...r.weekdays] };
    default:
      return { type: r.type, dates: [...r.dates] };
  }
}

/**
 * Validates a configuration and returns a copy with defaults filled in and a
 * canonical field order. Throws ConfigValidationError when invalid.
 */
export function normalizeConfig(config) {
  const errors = validateConfig(config);
  if (errors.length > 0) throw new ConfigValidationError(errors);
  const calendar = { ...CALENDAR_DEFAULTS, ...config.calendar };
  return {
    schemaVersion: SCHEMA_VERSION,
    calendar: {
      months: calendar.months.map(({ year, month }) => ({ year, month })),
      ...Object.fromEntries(Object.keys(CALENDAR_DEFAULTS).map((key) => [key, calendar[key]])),
    },
    tasks: config.tasks.map((task) => {
      const t = { ...TASK_DEFAULTS, ...task };
      return {
        id: t.id,
        name: t.name,
        recurrence: normalizeRecurrence(t.recurrence),
        icon: t.icon,
        color: t.color,
        assignee: t.assignee,
        enabled: t.enabled,
      };
    }),
  };
}

/** Parses JSON text (or an object) into a validated, normalized configuration. */
export function parseConfig(input) {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (err) {
      throw new ConfigValidationError([{ path: "", message: `Configuration is not valid JSON: ${err.message}` }]);
    }
  }
  return normalizeConfig(data);
}

/** Serializes a configuration to stable, pretty-printed JSON text. */
export function serializeConfig(config) {
  return `${JSON.stringify(normalizeConfig(config), null, 2)}\n`;
}
