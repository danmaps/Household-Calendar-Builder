import test from "node:test";
import assert from "node:assert/strict";
import { paperDimensionsInches, splitTaskMarks } from "../src/presentation.js";

test("paper dimensions match Letter and A4 page sizes in either orientation", () => {
  assert.deepEqual(paperDimensionsInches({ paper: "letter", orientation: "landscape" }), [11, 8.5]);
  assert.deepEqual(paperDimensionsInches({ paper: "letter", orientation: "portrait" }), [8.5, 11]);
  assert.deepEqual(paperDimensionsInches({ paper: "a4", orientation: "landscape" }), [297 / 25.4, 210 / 25.4]);
  assert.deepEqual(paperDimensionsInches({ paper: "a4", orientation: "portrait" }), [210 / 25.4, 297 / 25.4]);
});

test("day task marks fit the visible limit without dropping their overflow count", () => {
  const tasks = Array.from({ length: 50 }, (_, index) => ({ id: `task-${index}` }));
  const { visible, overflow } = splitTaskMarks(tasks);

  assert.equal(visible.length, 7);
  assert.equal(overflow.length, 43);
  assert.deepEqual([...visible, ...overflow], tasks);
});

test("days at or below the mark limit keep every task visible", () => {
  const tasks = Array.from({ length: 8 }, (_, index) => ({ id: `task-${index}` }));
  assert.deepEqual(splitTaskMarks(tasks), { visible: tasks, overflow: [] });
});

test("task mark splitter rejects invalid input and limits", () => {
  assert.throws(() => splitTaskMarks("not tasks"), TypeError);
  assert.throws(() => splitTaskMarks([], 1), RangeError);
  assert.throws(() => splitTaskMarks([], 2.5), RangeError);
});
