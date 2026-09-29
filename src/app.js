import { formatError, normalizeConfig, parseConfig, serializeConfig, ConfigValidationError } from "./config.js";

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
};

let currentConfig = normalizeConfig(FALLBACK_CONFIG);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "dataset") Object.assign(node.dataset, value);
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

function renderPreview(config) {
  const c = config.calendar;
  const tasks = config.tasks.filter((t) => t.enabled);
  const pages = c.months.map((m) => {
    const monthLabel = `${MONTH_NAMES[m.month - 1]} ${m.year}`;
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
  renderSummary(config);
  renderPreview(config);
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

applyConfig(currentConfig);
loadExample();
