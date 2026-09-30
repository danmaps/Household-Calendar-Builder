# Calendar configuration (schema version 1)

The calendar configuration is the single source of truth shared by the editor, live preview, print/PDF exporter, and a future API. It is plain JSON. `src/config.js` implements validation, default filling, parsing, and serialization; `src/icon-ids.js` lists the accepted icon IDs.

- `validateConfig(config)` returns a list of `{ path, message }` errors (empty when valid).
- `parseConfig(jsonTextOrObject)` validates and returns a normalized copy with defaults filled in, or throws `ConfigValidationError` (its `errors` property holds the same list).
- `serializeConfig(config)` returns stable, pretty-printed JSON. Parsing serialized output yields the same configuration.

Unknown fields are rejected rather than silently dropped, so a configuration never loses data without an error.

## Top level

| Field | Required | Value |
| --- | --- | --- |
| `schemaVersion` | yes | `1` |
| `calendar` | yes | Calendar settings object (below) |
| `tasks` | yes | List of tasks (may be empty, at most 50) |

## `calendar`

| Field | Required | Default | Value |
| --- | --- | --- | --- |
| `months` | yes | — | 1–24 unique `{ "year": 1000–9999, "month": 1–12 }` entries. Each month is one page. |
| `weekStartsOn` | no | `0` | `0` (Sunday) or `1` (Monday) |
| `paper` | no | `"letter"` | `"letter"` or `"a4"` |
| `orientation` | no | `"landscape"` | `"landscape"` or `"portrait"` |
| `marginInches` | no | `0.5` | `0.25`, `0.5`, `0.75`, or `1` inch |
| `colorMode` | no | `"monochrome"` | `"monochrome"` or `"color"` |
| `title` | no | `""` | Text, at most 120 characters. Must be non-empty when `showTitle` is `true`. |
| `showTitle` | no | `false` | Boolean |
| `titleAlign` | no | `"center"` | `"left"`, `"center"`, or `"right"` |
| `titleSize` | no | `"medium"` | `"small"`, `"medium"`, or `"large"` |
| `decoration` | no | `"none"` | `"none"`, `"border"`, or `"paw-prints"` |
| `showKey` | no | `true` | Boolean; show the task symbol key |
| `showCheckboxes` | no | `false` | Boolean; show open check marks for marking tasks by hand |

## Tasks

| Field | Required | Default | Value |
| --- | --- | --- | --- |
| `id` | yes | — | Unique slug: lowercase letters, numbers, single hyphens (`brush-teeth`) |
| `name` | yes | — | Non-empty text, at most 60 characters |
| `recurrence` | yes | — | Recurrence rule (below) |
| `icon` | yes | — | An ID from `src/icon-ids.js` |
| `color` | no | `null` | `null` or a hex color `#rrggbb`. Used only in color mode; icons stay distinguishable without it. |
| `assignee` | no | `null` | `null` or text, at most 40 characters |
| `enabled` | no | `true` | Boolean |

### Recurrence rules

All dates are date-only strings (`YYYY-MM-DD`) and must be real calendar dates.

| `type` | Fields | Meaning |
| --- | --- | --- |
| `interval` | `days` (1–366), `firstDue` (date, required) | Every N days, anchored to `firstDue`. The anchor is never guessed. |
| `weekdays` | `weekdays`: unique list of 0–6 (0 = Sunday) | Every selected weekday |
| `monthDates` | `dates`: unique list of 1–31 | Selected days of every month |
| `once` | `dates`: unique list of dates (at most 100) | One-time dates |

## Example

[`fixtures/october-2026-dog-care.json`](../fixtures/october-2026-dog-care.json) is the October 2026 dog-care calendar. In its Sunday-first layout, October 1, 2026 falls under Thursday, and tooth brushing repeats every 2 days from October 1 (1, 3, 5, … 31). The expected values are recorded in [`fixtures/october-2026-dog-care.expected.json`](../fixtures/october-2026-dog-care.expected.json) and checked by `npm test`.

## Compatibility

`schemaVersion` changes whenever a change could break existing configurations. A later API should accept this same document shape and reuse this validation code.

## Date engine

`src/calendar.js` is a pure module with no browser, UI, or PDF dependency:

- `getMonthGrid(year, month, weekStartsOn = 0)` returns month metadata and a rectangular `weeks` array. Each cell is an ISO date string or `null` for padding. `firstWeekday` uses JavaScript's weekday numbering (0 = Sunday); `firstColumn` is the date 1 position in the selected week layout.
- `getTaskOccurrences(task, year, month)` returns the task's due dates as sorted `YYYY-MM-DD` strings. Interval rules use the absolute distance from `firstDue`, including when that anchor predates the requested month.
- `buildCalendar(config)` validates and normalizes the configuration, then returns each selected month with date cells containing `{ date, day, tasks }` and a flat `occurrences` list of `{ date, task }`. Disabled tasks are omitted.

All calculations use UTC date-only values and do not depend on the machine's local timezone or daylight-saving rules. The October 2026 fixture is also exercised through this engine by `npm test`.

## Editor and symbols

The form exposes calendar month ranges, paper and orientation, week start, color mode, title options, decoration, key and checkbox visibility, and the task fields described above. Tasks can be added, removed, enabled, and reordered. The advanced JSON panel remains available for importing or editing the same normalized configuration.

The symbol picker is built from the IDs in `src/icon-ids.js`, with searchable category groups and local SVG artwork under `assets/icons/`. The picker is a native labeled `<select>` so it supports standard keyboard interaction; the neighboring search field filters its options, and each symbol has a readable name. The bundled artwork source and licensing terms are listed in [`icon-attribution.md`](icon-attribution.md) and `assets/icons/manifest.json`.

## Print and PDF

The **Print calendar** action opens the browser print dialog with one configured month per physical page. The **Download PDF** action renders the same calendar page DOM locally in the browser and downloads a multi-page PDF. `html2canvas` and jsPDF are bundled in `vendor/`, so neither action contacts an external asset host. Their pinned versions and MIT license notices are recorded in [`export-libraries.md`](export-libraries.md).
