// Stable icon identifiers accepted by the calendar configuration.
// These IDs are the contract shared by the editor, preview, exporter, and a
// future API. The bundled SVG artwork, categories, and license manifest are
// added by the icon catalog; it must provide artwork for every ID listed here.
export const ICON_IDS = Object.freeze([
  // Pet care
  "toothbrush",
  "tooth",
  "bone",
  "paw",
  "dog",
  "cat",
  "scissors",
  "shower",
  "pills",
  "syringe",
  // Household
  "bed",
  "shirt",
  "basket-shopping",
  "trash-can",
  "recycle",
  // Cleaning
  "broom",
  "soap",
  "spray-can",
  "hand-sparkles",
  // Garden
  "seedling",
  "leaf",
  "droplet",
  "sun",
  // Food
  "utensils",
  "mug-hot",
  "cookie-bite",
  // Maintenance
  "wrench",
  "fan",
  "bell",
  "fire-extinguisher",
  "screwdriver-wrench",
  // General
  "star",
  "heart",
  "circle-check",
]);

export const ICON_CATEGORIES = Object.freeze({
  "Pet care": Object.freeze(["toothbrush", "tooth", "bone", "paw", "dog", "cat", "scissors", "shower", "pills", "syringe"]),
  Household: Object.freeze(["bed", "shirt", "basket-shopping", "trash-can", "recycle"]),
  Cleaning: Object.freeze(["broom", "soap", "spray-can", "hand-sparkles"]),
  Garden: Object.freeze(["seedling", "leaf", "droplet", "sun"]),
  Food: Object.freeze(["utensils", "mug-hot", "cookie-bite"]),
  Maintenance: Object.freeze(["wrench", "fan", "bell", "fire-extinguisher", "screwdriver-wrench"]),
  General: Object.freeze(["star", "heart", "circle-check"]),
});

export function iconLabel(id) {
  return id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const ICON_ID_SET = new Set(ICON_IDS);

export function isKnownIconId(id) {
  return typeof id === "string" && ICON_ID_SET.has(id);
}
