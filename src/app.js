import { formatError, normalizeConfig, parseConfig, serializeConfig, ConfigValidationError, LIMITS } from "./config.js";
import { ICON_IDS } from "./icon-ids.js";
import { buildCalendar } from "./calendar.js";

const EXAMPLE_URL = "fixtures/october-2026-dog-care.json";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_NAMES = ["Sunday", "Monday"];

const FALLBACK_CONFIG = {
  schemaVersion: 1,
  calendar: { months: [{ year: 2026, month: 10 }] },
  tasks: [],
};

const els = {
  json: document.getElementById("config-json"),
  apply: document.getElementById("apply-config"),
  loadExample: document.getElementById("load-example"),
  download: document.getElementById("download-config"),
  status: document.getElementById("config-status"),
  errors: document.getElementById("config-errors"),
  summary: document.getElementById("settings-summary"),
  pages: document.getElementById("pages"),
  form: document.getElementById("calendar-form"),
  taskList: document.getElementById("task-list"),
  months: document.getElementById("month-range"),
};

let currentConfig = normalizeConfig(FALLBACK_CONFIG);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "dataset") Object.assign(node.dataset, value);
    else if (typeof value === "boolean") {
      if (value) node.setAttribute(key, "");
    }
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("is-error", isError);
}

function showErrors(errors) {
  els.errors.replaceChildren(
    ...errors.map(({ path, message }) =>
      el("li", {}, path ? [el("code", { text: path }), `: ${message}`] : [message]),
    ),
  );
}

function renderSummary(config) {
  const c = config.calendar;
  const months = c.months.map((m) => `${MONTH_NAMES[m.month - 1]} ${m.year}`).join(", ");
  const rows = [
    ["Months", months],
    ["Week starts on", WEEKDAY_NAMES[c.weekStartsOn]],
    ["Paper", `${c.paper === "a4" ? "A4" : "US Letter"}, ${c.orientation}`],
    ["Color mode", c.colorMode],
    ["Title", c.showTitle ? c.title : "(hidden)"],
    ["Decoration", c.decoration],
    ["Tasks", String(config.tasks.filter((t) => t.enabled).length)],
  ];
  els.summary.replaceChildren(...rows.flatMap(([term, value]) => [el("dt", { text: term }), el("dd", { text: value })]));
}

function field(label, control, hint = "") {
  const wrapper = el("label", { class: "field" }, [el("span", { class: "field-label", text: label }), control]);
  if (hint) wrapper.append(el("small", { class: "hint", text: hint }));
  return wrapper;
}

function input(type, value, attrs = {}) {
  return el("input", { type, value, ...attrs });
}

function select(value, options, attrs = {}) {
  const node = el("select", attrs, options.map(([v, label]) => el("option", { value: v, selected: String(v) === String(value), text: label })));
  return node;
}

function renderCalendarControls(config) {
  const c = config.calendar;
  const first = c.months[0];
  const last = c.months.at(-1);
  els.months.replaceChildren(
    field("From", select(first.month, MONTH_NAMES.map((name, i) => [i + 1, name]), { "data-calendar": "startMonth" })),
    field("Year", input("number", first.year, { min: LIMITS.minYear, max: LIMITS.maxYear, required: "", "data-calendar": "startYear" })),
    field("Through", select(last.month, MONTH_NAMES.map((name, i) => [i + 1, name]), { "data-calendar": "endMonth" })),
    field("Year", input("number", last.year, { min: LIMITS.minYear, max: LIMITS.maxYear, required: "", "data-calendar": "endYear" })),
    field("Week starts", select(c.weekStartsOn, [[0, "Sunday"], [1, "Monday"]], { "data-calendar": "weekStartsOn" })),
    field("Paper", select(c.paper, [["letter", "US Letter"], ["a4", "A4"]], { "data-calendar": "paper" })),
    field("Orientation", select(c.orientation, [["landscape", "Landscape"], ["portrait", "Portrait"]], { "data-calendar": "orientation" })),
    field("Color", select(c.colorMode, [["monochrome", "Monochrome"], ["color", "Color"]], { "data-calendar": "colorMode" })),
  );
}

function recurrenceControl(task, index) {
  const r = task.recurrence;
  const wrap = el("div", { class: "recurrence-fields" });
  const attr = (name) => ({ "data-task": index, "data-recurrence": name });
  if (r.type === "interval") {
    wrap.append(field("Every N days", input("number", r.days, { min: 1, max: LIMITS.maxIntervalDays, required: "", ...attr("days") })),
      field("First due date", input("date", r.firstDue, { required: "", ...attr("firstDue") }), "Repeats at this interval from the anchor date."));
  } else if (r.type === "weekdays") {
    const group = el("fieldset", { class: "weekday-group" }, [el("legend", { text: "Weekdays" })]);
    group.append(el("div", { class: "checks" }, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name, day) => {
      const box = input("checkbox", "", { checked: r.weekdays.includes(day), value: day, ...attr("weekdays") });
      return el("label", { class: "check" }, [box, name]);
    })));
    wrap.append(group);
  } else if (r.type === "monthDates") {
    wrap.append(field("Days of month", input("text", r.dates.join(", "), { placeholder: "1, 15, 30", ...attr("dates") }), "Comma-separated day numbers. Dates beyond a short month are skipped."));
  } else {
    wrap.append(field("One-time dates", input("text", r.dates.join(", "), { placeholder: "2026-10-01, 2026-10-20", ...attr("dates") }), "Comma-separated YYYY-MM-DD dates."));
  }
  return wrap;
}

function renderTasks(config) {
  els.taskList.replaceChildren(...config.tasks.map((task, index) => {
    const card = el("fieldset", { class: "task-card" });
    const legend = el("legend", {}, [task.name || `Task ${index + 1}`]);
    const name = input("text", task.name, { maxlength: LIMITS.maxNameLength, required: "", "data-task": index, "data-field": "name" });
    const recurrence = select(task.recurrence.type, [["interval", "Every N days"], ["weekdays", "Selected weekdays"], ["monthDates", "Dates each month"], ["once", "One-time dates"]], { "data-task": index, "data-field": "recurrenceType" });
    const icon = select(task.icon, ICON_IDS.map((id) => [id, id.replaceAll("-", " ")]), { "data-task": index, "data-field": "icon" });
    const assignee = input("text", task.assignee ?? "", { maxlength: LIMITS.maxAssigneeLength, placeholder: "Optional", "data-task": index, "data-field": "assignee" });
    const enabled = input("checkbox", "", { checked: task.enabled, "data-task": index, "data-field": "enabled" });
    const actions = el("div", { class: "task-actions" }, [
      el("button", { type: "button", "data-action": "up", "data-task": index, disabled: index === 0, text: "Move up" }),
      el("button", { type: "button", "data-action": "down", "data-task": index, disabled: index === config.tasks.length - 1, text: "Move down" }),
      el("button", { type: "button", "data-action": "remove", "data-task": index, text: "Remove" }),
    ]);
    card.append(legend,
      el("div", { class: "task-fields" }, [field("Task name", name), field("Repeat", recurrence), field("Symbol", icon), field("Assigned to", assignee), el("label", { class: "check" }, [enabled, "Enabled"])]),
      recurrenceControl(task, index), actions);
    return card;
  }));
}

function renderEditor(config) {
  renderCalendarControls(config);
  renderTasks(config);
}

function renderPreview(config) {
  const c = config.calendar;
  const model = buildCalendar(config);
  const pages = model.months.map((m) => {
    const tasks = config.tasks.filter((t) => t.enabled);
    const { year, month } = m;
    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
    const page = el("article", {
      class: "page",
      "aria-label": `Page: ${monthLabel}`,
      dataset: { paper: c.paper, orientation: c.orientation, colorMode: c.colorMode, decoration: c.decoration },
    });
    if (c.showTitle) {
      page.append(el("h3", { class: "page-title", text: c.title, dataset: { align: c.titleAlign, size: c.titleSize } }));
    }
    page.append(
      el("h4", { class: "page-month", text: monthLabel }),
      el("div", { class: "grid-placeholder", text: `${monthLabel} calendar grid (week starts on ${WEEKDAY_NAMES[c.weekStartsOn]})` }),
    );
    if (c.showKey && tasks.length > 0) {
      page.append(
        el(
          "ul",
          { class: "task-key", "aria-label": "Task key" },
          tasks.map((t) => {
            const swatch = el("span", { class: "swatch", "aria-hidden": "true" });
            swatch.style.background = c.colorMode === "color" && t.color ? t.color : "transparent";
            const label = t.assignee ? `${t.name} (${t.assignee})` : t.name;
            return el("li", {}, [swatch, label, " ", el("span", { class: "icon-id", text: `[${t.icon}]` })]);
          }),
        ),
      );
    }
    return page;
  });
  els.pages.replaceChildren(...pages);
}

function applyConfig(config) {
  currentConfig = config;
  els.json.value = serializeConfig(config);
  renderEditor(config);
  renderSummary(config);
  renderPreview(config);
}

function updateCalendarValues() {
  const value = (name) => els.form.querySelector(`[data-calendar="${name}"]`).value;
  const startYear = Number(value("startYear"));
  const startMonth = Number(value("startMonth"));
  const endYear = Number(value("endYear"));
  const endMonth = Number(value("endMonth"));
  const startIndex = startYear * 12 + startMonth - 1;
  const endIndex = endYear * 12 + endMonth - 1;
  const count = endIndex - startIndex + 1;
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || count < 1 || count > LIMITS.maxMonths) {
    throw new Error(`Choose a valid consecutive range of 1 to ${LIMITS.maxMonths} months.`);
  }
  currentConfig.calendar.months = Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(startYear, startMonth - 1 + i, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });
}

function applyFormChange(target) {
  const taskIndex = Number(target.dataset.task);
  if (target.dataset.calendar) {
    updateCalendarValues();
    for (const fieldName of ["weekStartsOn", "paper", "orientation", "colorMode"]) {
      const controlValue = els.form.querySelector(`[data-calendar="${fieldName}"]`).value;
      currentConfig.calendar[fieldName] = fieldName === "weekStartsOn" ? Number(controlValue) : controlValue;
    }
  } else if (target.dataset.field && currentConfig.tasks[taskIndex]) {
    const task = currentConfig.tasks[taskIndex];
    switch (target.dataset.field) {
      case "name": task.name = target.value; break;
      case "icon": task.icon = target.value; break;
      case "assignee": task.assignee = target.value.trim() || null; break;
      case "enabled": task.enabled = target.checked; break;
      case "recurrenceType":
        {
          const first = currentConfig.calendar.months[0];
          const firstDate = `${String(first.year).padStart(4, "0")}-${String(first.month).padStart(2, "0")}-01`;
          task.recurrence = target.value === "interval" ? { type: "interval", days: 1, firstDue: firstDate }
          : target.value === "weekdays" ? { type: "weekdays", weekdays: [1, 2, 3, 4, 5] }
            : target.value === "monthDates" ? { type: "monthDates", dates: [1] } : { type: "once", dates: [firstDate] };
        }
        break;
    }
  } else if (target.dataset.recurrence && currentConfig.tasks[taskIndex]) {
    const recurrence = currentConfig.tasks[taskIndex].recurrence;
    if (target.dataset.recurrence === "days") recurrence.days = Number(target.value);
    if (target.dataset.recurrence === "firstDue") recurrence.firstDue = target.value;
    if (target.dataset.recurrence === "weekdays") {
      const selected = [...els.taskList.querySelectorAll(`[data-task="${taskIndex}"][data-recurrence="weekdays"]:checked`)].map((box) => Number(box.value));
      recurrence.weekdays = selected.length ? selected : [0];
    }
    if (target.dataset.recurrence === "dates") recurrence.dates = target.value.split(",").map((v) => v.trim()).filter(Boolean).map((v) => recurrence.type === "monthDates" ? Number(v) : v);
  }
  applyConfig(normalizeConfig(currentConfig));
  showErrors([]);
  setStatus("Calendar settings updated.");
}

function handleFormChange(event) {
  const previous = structuredClone(currentConfig);
  try { applyFormChange(event.target); }
  catch (err) {
    currentConfig = previous;
    renderEditor(previous);
    setStatus(err.message, true);
  }
}

function handleTaskAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const index = Number(button.dataset.task);
  const tasks = currentConfig.tasks;
  if (button.dataset.action === "remove") tasks.splice(index, 1);
  if (button.dataset.action === "up" && index > 0) [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
  if (button.dataset.action === "down" && index < tasks.length - 1) [tasks[index + 1], tasks[index]] = [tasks[index], tasks[index + 1]];
  applyConfig(normalizeConfig(currentConfig));
  setStatus("Task list updated.");
}

function addTask() {
  if (currentConfig.tasks.length >= LIMITS.maxTasks) return setStatus(`A calendar can have at most ${LIMITS.maxTasks} tasks.`, true);
  let id = "new-task";
  let suffix = 2;
  while (currentConfig.tasks.some((task) => task.id === id)) id = `new-task-${suffix++}`;
  const first = currentConfig.calendar.months[0];
  const firstDate = `${String(first.year).padStart(4, "0")}-${String(first.month).padStart(2, "0")}-01`;
  currentConfig.tasks.push({ id, name: "New task", recurrence: { type: "interval", days: 1, firstDue: firstDate }, icon: ICON_IDS[0], color: null, assignee: null, enabled: true });
  applyConfig(normalizeConfig(currentConfig));
  setStatus("Task added. Edit its name and schedule.");
}

function applyFromEditor() {
  try {
    applyConfig(parseConfig(els.json.value));
    showErrors([]);
    setStatus("Configuration is valid. Preview updated.");
  } catch (err) {
    if (!(err instanceof ConfigValidationError)) throw err;
    showErrors(err.errors);
    setStatus(`Configuration has ${err.errors.length} problem(s). The preview shows the last valid configuration.`, true);
    console.warn(err.errors.map(formatError).join("\n"));
  }
}

async function loadExample() {
  try {
    const response = await fetch(EXAMPLE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applyConfig(parseConfig(await response.text()));
    showErrors([]);
    setStatus("Loaded the October 2026 dog-care example.");
  } catch (err) {
    if (err instanceof ConfigValidationError) showErrors(err.errors);
    setStatus(`Could not load the example (${err.message}). Serve this folder with a local static server.`, true);
  }
}

function downloadConfig() {
  const blob = new Blob([serializeConfig(currentConfig)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = el("a", { href: url, download: "household-calendar.json" });
  link.click();
  URL.revokeObjectURL(url);
}

els.apply.addEventListener("click", applyFromEditor);
els.loadExample.addEventListener("click", loadExample);
els.download.addEventListener("click", downloadConfig);
els.form.addEventListener("change", handleFormChange);
els.taskList.addEventListener("click", handleTaskAction);
document.getElementById("add-task").addEventListener("click", addTask);

applyConfig(currentConfig);
loadExample();
