import { buildCalendar } from "./calendar.js";

const LIBRARIES = [
  ["../vendor/html2canvas.min.js", () => typeof window.html2canvas === "function"],
  ["../vendor/jspdf.umd.min.js", () => typeof window.jspdf?.jsPDF === "function"],
];

function loadScript(path, available) {
  if (available()) return Promise.resolve();
  const source = new URL(path, import.meta.url).href;
  const existing = [...document.scripts].find((script) => script.src === source);
  if (existing) return new Promise((resolve, reject) => {
    existing.addEventListener("load", resolve, { once: true });
    existing.addEventListener("error", () => reject(new Error(`Unable to load ${path}`)), { once: true });
  });
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${path}`));
    document.head.append(script);
  });
}

async function waitForImages(node) {
  await Promise.all([...node.querySelectorAll("img")].map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;
    if (typeof image.decode === "function") {
      try { await image.decode(); } catch { /* The canvas renderer reports failed assets below. */ }
      return;
    }
    await new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }));
}

async function replaceSvgImagesWithCanvas(node) {
  for (const image of [...node.querySelectorAll("img")]) {
    if (typeof image.decode === "function") {
      try { await image.decode(); } catch { throw new Error(`Could not load icon ${image.src}`); }
    }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Could not load icon ${image.src}`);
    const style = getComputedStyle(image);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    canvas.className = "pdf-icon";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = style.width;
    canvas.style.height = style.height;
    canvas.style.display = style.display;
    canvas.style.objectFit = "contain";
    const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    canvas.getContext("2d").drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    image.replaceWith(canvas);
  }
}

/** Build a client-side PDF by rasterizing the same page DOM shown in preview. */
export async function downloadCalendarPdf(config, createPage, stage) {
  for (const [path, available] of LIBRARIES) await loadScript(path, available);
  const { jsPDF } = window.jspdf;
  const calendar = config.calendar;
  const pdf = new jsPDF({ orientation: calendar.orientation, unit: "pt", format: calendar.paper, compress: true });
  pdf.setProperties({ title: calendar.showTitle ? calendar.title : "Household calendar", subject: "Household task calendar" });
  const widthPoints = pdf.internal.pageSize.getWidth();
  const heightPoints = pdf.internal.pageSize.getHeight();
  const cssWidth = Math.ceil(widthPoints / 72 * 96);
  const cssHeight = Math.ceil(heightPoints / 72 * 96);

  const model = buildCalendar(config);
  for (let index = 0; index < model.months.length; index += 1) {
    const page = createPage(config, model.months[index]);
    page.style.width = `${cssWidth}px`;
    page.style.height = `${cssHeight}px`;
    page.style.maxWidth = "none";
    page.style.aspectRatio = "auto";
    page.style.border = "0";
    page.style.boxShadow = "none";
    stage.replaceChildren(page);
    await waitForImages(page);
    await replaceSvgImagesWithCanvas(page);
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = await window.html2canvas(page, {
      backgroundColor: "#ffffff",
      scale: 2,
      width: cssWidth,
      height: cssHeight,
      windowWidth: cssWidth,
      windowHeight: cssHeight,
      logging: false,
      useCORS: false,
    });
    if (index > 0) pdf.addPage(calendar.paper, calendar.orientation);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, widthPoints, heightPoints, undefined, "FAST");
    canvas.width = 0;
    canvas.height = 0;
  }

  stage.replaceChildren();
  pdf.save("household-calendar.pdf");
}
