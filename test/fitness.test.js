import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildCalendar } from '../src/calendar.js';
import { parseConfig } from '../src/config.js';
import { ICON_IDS, ICON_CATEGORIES } from '../src/icon-ids.js';

test('catalog artwork and license manifest cover every accepted ID', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/icons/manifest.json', import.meta.url)));
  for (const id of ICON_IDS) {
    assert.ok(existsSync(new URL(`../assets/icons/${id}.svg`, import.meta.url)), id);
    assert.ok(manifest.files[`${id}.svg`], id);
  }
  assert.deepEqual(ICON_CATEGORIES.Fitness, ['kettlebell', 'shoe-prints']);
  assert.equal(manifest.files['kettlebell.svg'].license, 'Apache-2.0');
});

test('fitness plan covers October 25 through November 30 with the confirmed weekdays', () => {
  const config = parseConfig(readFileSync(new URL('../fixtures/october-november-2026-fitness.json', import.meta.url), 'utf8'));
  const model = buildCalendar(config);
  const cells = model.months.flatMap(m => m.weeks.flat()).filter(c => c.date);
  assert.equal(model.months.length, 2);
  for (const cell of cells) {
    const weekday = new Date(`${cell.date}T00:00:00Z`).getUTCDay();
    const expected = cell.date < '2026-10-25' ? [] : weekday === 6 ? ['leaf'] : [0,2,4].includes(weekday) ? ['kettlebell','shoe-prints'] : ['shoe-prints'];
    assert.deepEqual(cell.tasks.map(t => t.icon), expected, cell.date);
  }
  assert.equal(cells.filter(c => c.tasks.length).length, 37);
  assert.equal(cells.flatMap(c=>c.tasks).filter(t=>t.icon==='kettlebell').length,16);
  assert.equal(cells.flatMap(c=>c.tasks).filter(t=>t.icon==='shoe-prints').length,32);
  assert.equal(cells.flatMap(c=>c.tasks).filter(t=>t.icon==='leaf').length,5);
});
