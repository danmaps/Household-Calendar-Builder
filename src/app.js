import { formatError, normalizeConfig, parseConfig, serializeConfig, ConfigValidationError, LIMITS } from "./config.js";
import { ICON_IDS, ICON_CATEGORIES, iconLabel } from "./icon-ids.js";
import { buildCalendar } from "./calendar.js";

const EXAMPLE_URL = "fixtures/october-2026-dog-care.json";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_NAMES = ["Sunday", "Monday"];
const SUNDAY_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  pages: document.getElementById("pages"),
  pageNav: document.getElementById("preview-navigation"),
  warning: document.getElementById("preview-warning"),
  form: document.getElementById("calendar-form"),
  taskList: document.getElementById("task-list"),
  months: document.getElementById("month-range"),
};

let currentConfig = normalizeConfig(FALLBACK_CONFIG);
let currentPageIndex = 0;

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

function showFieldErrors(errors) {
  showErrors(errors);
  const controls = [...els.form.querySelectorAll("[data-error-path]")];
  for (const [index, error] of errors.entries()) {
    const related = controls.filter((node) => node.dataset.errorPath === error.path
      || error.path.startsWith(`${node.dataset.errorPath}[`));
    const control = related[0];
    if (!control) continue;
    const target = control.closest(".field, .weekday-group") ?? control.parentElement;
    const id = `config-error-${index}`;
    for (const relatedControl of related) {
      relatedControl.setAttribute("aria-invalid", "true");
      relatedControl.setAttribute("aria-describedby", id);
    }
    target.append(el("small", { id, class: "field-error", text: error.message }));
  }
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

function populateIconSelect(node, selected, query = "") {
  const needle = query.trim().toLowerCase();
  node.replaceChildren();
  const selectedCategory = Object.entries(ICON_CATEGORIES).find(([, ids]) => ids.includes(selected))?.[0] ?? "Current";
  if (needle && !`${selected} ${iconLabel(selected)} ${selectedCategory}`.toLowerCase().includes(needle)) {
    node.append(el("optgroup", { label: "Current selection" }, [el("option", {
      value: selected, selected: true, text: `${iconLabel(selected)} (current)`,
    })]));
  }
  for (const [category, ids] of Object.entries(ICON_CATEGORIES)) {
    const matches = ids.filter((id) => `${id} ${iconLabel(id)} ${category}`.toLowerCase().includes(needle));
    if (!matches.length) continue;
    node.append(el("optgroup", { label: category }, matches.map((id) => el("option", {
      value: id, selected: id === selected, text: iconLabel(id),
    }))));
  }
}

function renderCalendarControls(config) {
  const c = config.calendar;
  const first = c.months[0];
  const last = c.months.at(-1);
  els.months.replaceChildren(
    field("From", select(first.month, MONTH_NAMES.map((name, i) => [i + 1, name]), { "data-calendar": "startMonth", "data-error-path": "calendar.months" })),
    field("Year", input("number", first.year, { min: LIMITS.minYear, max: LIMITS.maxYear, required: "", "data-calendar": "startYear", "data-error-path": "calendar.months" })),
    field("Through", select(last.month, MONTH_NAMES.map((name, i) => [i + 1, name]), { "data-calendar": "endMonth", "data-error-path": "calendar.months" })),
    field("Year", input("number", last.year, { min: LIMITS.minYear, max: LIMITS.maxYear, required: "", "data-calendar": "endYear", "data-error-path": "calendar.months" })),
    field("Week starts", select(c.weekStartsOn, [[0, "Sunday"], [1, "Monday"]], { "data-calendar": "weekStartsOn" })),
    field("Paper", select(c.paper, [["letter", "US Letter"], ["a4", "A4"]], { "data-calendar": "paper" })),
    field("Orientation", select(c.orientation, [["landscape", "Landscape"], ["portrait", "Portrait"]], { "data-calendar": "orientation" })),
    field("Color", select(c.colorMode, [["monochrome", "Monochrome"], ["color", "Color"]], { "data-calendar": "colorMode" })),
    field("Show title", input("checkbox", "", { checked: c.showTitle, "data-calendar": "showTitle" })),
    field("Calendar title", input("text", c.title, { maxlength: LIMITS.maxTitleLength, "data-calendar": "title" })),
    field("Title alignment", select(c.titleAlign, [["left", "Left"], ["center", "Center"], ["right", "Right"]], { "data-calendar": "titleAlign" })),
    field("Title size", select(c.titleSize, [["small", "Small"], ["medium", "Medium"], ["large", "Large"]], { "data-calendar": "titleSize" })),
    field("Decoration", select(c.decoration, [["none", "None"], ["border", "Border"], ["paw-prints", "Paw prints"]], { "data-calendar": "decoration" })),
    field("Show task key", input("checkbox", "", { checked: c.showKey, "data-calendar": "showKey" })),
    field("Show checkboxes", input("checkbox", "", { checked: c.showCheckboxes, "data-calendar": "showCheckboxes" })),
  );
}

function recurrenceControl(task, index) {
  const r = task.recurrence;
  const wrap = el("div", { class: "recurrence-fields" });
  const attr = (name) => ({ "data-task": index, "data-recurrence": name });
  if (r.type === "interval") {
    wrap.append(field("Every N days", input("number", r.days, { min: 1, max: LIMITS.maxIntervalDays, required: "", "data-error-path": `tasks[${index}].recurrence.days`, ...attr("days") })),
      field("First due date", input("date", r.firstDue, { required: "", "data-error-path": `tasks[${index}].recurrence.firstDue`, ...attr("firstDue") }), "Repeats at this interval from the anchor date."));
  } else if (r.type === "weekdays") {
    const group = el("fieldset", { class: "weekday-group" }, [el("legend", { text: "Weekdays" })]);
    group.append(el("div", { class: "checks" }, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name, day) => {
      const box = input("checkbox", "", { checked: r.weekdays.includes(day), value: day, "data-error-path": `tasks[${index}].recurrence.weekdays`, ...attr("weekdays") });
      return el("label", { class: "check" }, [box, name]);
    })));
    wrap.append(group);
  } else if (r.type === "monthDates") {
    wrap.append(field("Days of month", input("text", r.dates.join(", "), { placeholder: "1, 15, 30", "data-error-path": `tasks[${index}].recurrence.dates`, ...attr("dates") }), "Comma-separated day numbers. Dates beyond a short month are skipped."));
  } else {
    wrap.append(field("One-time dates", input("text", r.dates.join(", "), { placeholder: "2026-10-01, 2026-10-20", "data-error-path": `tasks[${index}].recurrence.dates`, ...attr("dates") }), "Comma-separated YYYY-MM-DD dates."));
  }
  return wrap;
}

function renderTasks(config) {
  els.taskList.replaceChildren(...config.tasks.map((task, index) => {
    const card = el("fieldset", { class: "task-card" });
    const legend = el("legend", {}, [task.name || `Task ${index + 1}`]);
    const name = input("text", task.name, { maxlength: LIMITS.maxNameLength, required: "", "data-error-path": `tasks[${index}].name`, "data-task": index, "data-field": "name" });
    const recurrence = select(task.recurrence.type, [["interval", "Every N days"], ["weekdays", "Selected weekdays"], ["monthDates", "Dates each month"], ["once", "One-time dates"]], { "data-task": index, "data-field": "recurrenceType" });
    const icon = el("select", { "data-task": index, "data-field": "icon", "data-error-path": `tasks[${index}].icon`, "aria-label": `Symbol for ${task.name}` });
    populateIconSelect(icon, task.icon);
    const iconSearch = input("search", "", { placeholder: "Search symbols", "data-task": index, "data-icon-search": "", "aria-label": `Search symbols for ${task.name}` });
    const iconChoice = el("div", { class: "icon-choice" }, [
      el("img", { class: "icon-sample", src: `assets/icons/${task.icon}.svg`, alt: `${iconLabel(task.icon)} symbol` }),
      el("div", { class: "icon-fields" }, [field("Find a symbol", iconSearch), field("Symbol", icon)]),
    ]);
    const assignee = input("text", task.assignee ?? "", { maxlength: LIMITS.maxAssigneeLength, placeholder: "Optional", "data-error-path": `tasks[${index}].assignee`, "data-task": index, "data-field": "assignee" });
    const enabled = input("checkbox", "", { checked: task.enabled, "data-task": index, "data-field": "enabled" });
    const customColor = input("checkbox", "", { checked: task.color !== null, "data-task": index, "data-field": "colorEnabled" });
    const color = input("color", task.color ?? "#1f6feb", { disabled: task.color === null, "data-task": index, "data-field": "color" });
    const actions = el("div", { class: "task-actions" }, [
      el("button", { type: "button", "data-action": "up", "data-task": index, disabled: index === 0, text: "Move up" }),
      el("button", { type: "button", "data-action": "down", "data-task": index, disabled: index === config.tasks.length - 1, text: "Move down" }),
      el("button", { type: "button", "data-action": "remove", "data-task": index, text: "Remove" }),
    ]);
    card.append(legend,
      el("div", { class: "task-fields" }, [field("Task name", name), field("Repeat", recurrence), iconChoice, field("Assigned to", assignee), field("Custom color", customColor), field("Task color", color), el("label", { class: "check" }, [enabled, "Enabled"])]),
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
  if (currentPageIndex >= model.months.length) currentPageIndex = model.months.length - 1;
  currentPageIndex = Math.max(0, currentPageIndex);
  const active = model.months[currentPageIndex];
  const monthLabel = `${MONTH_NAMES[active.month - 1]} ${active.year}`;
  const weekdays = Array.from({ length: 7 }, (_, i) => SUNDAY_WEEKDAYS[(i + c.weekStartsOn) % 7]);
  const page = el("article", {
    class: "page",
    "aria-label": `Calendar page: ${monthLabel}`,
    dataset: { paper: c.paper, orientation: c.orientation, colorMode: c.colorMode, decoration: c.decoration },
  });
  if (c.showTitle) {
    page.append(el("h3", { class: "page-title", text: c.title, dataset: { align: c.titleAlign, size: c.titleSize } }));
  }
  page.append(el("h4", { class: "page-month", text: monthLabel }));

  const table = el("table", { class: "calendar-grid", "aria-label": `${monthLabel} household task calendar`, style: `--week-count: ${active.weekRows}` });
  const thead = el("thead", {}, [el("tr", {}, weekdays.map((name) => el("th", { scope: "col", text: name })))]);
  const tbody = el("tbody");
  for (const week of active.weeks) {
    const row = el("tr");
    for (const cell of week) {
      const td = el("td", { class: cell.date ? "day-cell" : "day-cell is-empty" });
      if (cell.date) {
        const date = new Date(`${cell.date}T00:00:00Z`);
        const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
        td.append(el("span", { class: "day-number", text: String(cell.day) }));
        if (cell.tasks.length) {
          const marks = el("div", { class: "day-tasks", "aria-label": `Tasks for ${dateLabel}` });
          for (const task of cell.tasks) {
            const taskLabel = task.assignee ? `${task.name}, assigned to ${task.assignee}` : task.name;
            const mark = el("div", { class: "task-mark", ...(c.showCheckboxes ? {} : { role: "img", "aria-label": taskLabel }), title: taskLabel });
            if (c.colorMode === "color" && task.color) mark.style.borderColor = task.color;
            if (c.showCheckboxes) {
              const check = el("input", { type: "checkbox", "aria-label": `Mark ${task.name} complete on ${dateLabel}` });
              mark.append(check);
            }
            mark.append(el("img", { src: `assets/icons/${task.icon}.svg`, alt: "", "aria-hidden": "true" }));
            marks.append(mark);
          }
          td.append(marks);
        }
      }
      row.append(td);
    }
    tbody.append(row);
  }
  table.append(thead, tbody);
  page.append(table);

  const tasks = config.tasks.filter((task) => task.enabled);
  if (c.showKey && tasks.length) {
    page.append(el("ul", { class: "task-key", "aria-label": "Task symbol key" }, tasks.map((task) => {
      const li = el("li");
      const image = el("img", { src: `assets/icons/${task.icon}.svg`, alt: "", "aria-hidden": "true" });
      const label = task.assignee ? `${task.name} (${task.assignee})` : task.name;
      const swatch = el("span", { class: "swatch", "aria-hidden": "true" });
      if (c.colorMode === "color" && task.color) swatch.style.backgroundColor = task.color;
      li.append(image, el("span", { text: label }), swatch);
      return li;
    })));
  }

  const navItems = model.months.map((m, index) => {
    const label = `${MONTH_NAMES[m.month - 1]} ${m.year}`;
    return el("button", { type: "button", class: "month-tab", "data-page": index, "aria-current": index === currentPageIndex ? "page" : "false", text: label });
  });
  els.pageNav.replaceChildren(...navItems);
  els.pages.replaceChildren(page);

  const maxTasksPerDay = Math.max(0, ...active.weeks.flat().map((cell) => cell.tasks.length));
  const warnings = [];
  if (maxTasksPerDay > 3) warnings.push(`Some dates show ${maxTasksPerDay} tasks and may feel crowded.`);
  if (c.showKey && tasks.length > 12) warnings.push(`The task key has ${tasks.length} items and may be crowded.`);
  els.warning.textContent = warnings.join(" ");
  els.warning.hidden = warnings.length === 0;
}

function applyConfig(config) {
  currentConfig = config;
  els.json.value = serializeConfig(config);
  renderEditor(config);
  renderPreview(config);
}

function handlePageNavigation(event) {
  const button = event.target.closest("button[data-page]");
  if (!button) return;
  currentPageIndex = Number(button.dataset.page);
  renderPreview(currentConfig);
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
    for (const key of ["showTitle", "title", "titleAlign", "titleSize", "decoration", "showKey", "showCheckboxes"]) {
      const control = els.form.querySelector(`[data-calendar="${key}"]`);
      currentConfig.calendar[key] = control.type === "checkbox" ? control.checked : control.value;
    }
  } else if (target.dataset.field && currentConfig.tasks[taskIndex]) {
    const task = currentConfig.tasks[taskIndex];
    switch (target.dataset.field) {
      case "name": task.name = target.value; break;
      case "icon": task.icon = target.value; break;
      case "assignee": task.assignee = target.value.trim() || null; break;
      case "enabled": task.enabled = target.checked; break;
      case "colorEnabled": task.color = target.checked ? "#1f6feb" : null; break;
      case "color": task.color = target.value; break;
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
      recurrence.weekdays = selected;
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
    const errors = err instanceof ConfigValidationError ? err.errors : [{ path: "calendar.months", message: err.message }];
    showFieldErrors(errors);
    setStatus(err.message, true);
  }
}

function handleIconSearch(event) {
  const search = event.target.closest("[data-icon-search]");
  if (!search) return;
  const card = search.closest(".task-card");
  const selectNode = card.querySelector('select[data-field="icon"]');
  const selected = currentConfig.tasks[Number(search.dataset.task)]?.icon ?? "";
  populateIconSelect(selectNode, selected, search.value);
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
els.taskList.addEventListener("input", handleIconSearch);
document.getElementById("add-task").addEventListener("click", addTask);
els.pageNav.addEventListener("click", handlePageNavigation);

applyConfig(currentConfig);
loadExample();
