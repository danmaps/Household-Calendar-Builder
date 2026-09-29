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

const ICON_ID_SET = new Set(ICON_IDS);

export function isKnownIconId(id) {
  return typeof id === "string" && ICON_ID_SET.has(id);
}
