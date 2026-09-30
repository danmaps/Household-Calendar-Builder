export const MAX_VISIBLE_TASK_MARKS = 8;

const PAPER_DIMENSIONS_INCHES = Object.freeze({
  letter: Object.freeze([8.5, 11]),
  a4: Object.freeze([210 / 25.4, 297 / 25.4]),
});

export function paperDimensionsInches({ paper, orientation }) {
  const dimensions = PAPER_DIMENSIONS_INCHES[paper];
  if (!dimensions || !["landscape", "portrait"].includes(orientation)) {
    throw new RangeError("Unsupported paper size or orientation");
  }
  return orientation === "landscape" ? [...dimensions].reverse() : [...dimensions];
}

/** Keep a day cell legible while representing every scheduled task. */
export function splitTaskMarks(tasks, maxVisible = MAX_VISIBLE_TASK_MARKS) {
  if (!Array.isArray(tasks)) throw new TypeError("tasks must be an array");
  if (!Number.isInteger(maxVisible) || maxVisible < 2) {
    throw new RangeError("maxVisible must be an integer of at least 2");
  }

  if (tasks.length <= maxVisible) return { visible: tasks, overflow: [] };
  return {
    visible: tasks.slice(0, maxVisible - 1),
    overflow: tasks.slice(maxVisible - 1),
  };
}
