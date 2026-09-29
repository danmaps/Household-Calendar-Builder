# Household Calendar Builder: Product Specification

## 1. Purpose

Build a browser utility that lets a household configure one or more months of recurring tasks, pick an SVG symbol for each task, preview the finished pages, and produce a printable PDF.

The product is primarily a parameter-driven calendar designer. The user controls the month or months, task names, recurrence, symbols, colors, title, and optional decoration. The live print preview is the central feedback loop: change a parameter and immediately see the calendar update.

The initial public example is the October 2026 dog-care calendar. Dog care is a useful example, not a limit on the kinds of household schedules the tool supports.

## 2. Product direction and sequence

### First: calendar designer

Deliver a client-side web page with a clear set of controls and live page preview. PDF output should remain the main product. A user should not need an account, external calendar, or AI service to make a calendar.

### Later: API and agent skill

After the calendar schema, date engine, and PDF output are stable, design an API around the same validated configuration. Then build an agent skill that converts natural-language calendar requests into that configuration and produces consistent calendars.

The skill is a later interface to the calendar builder, not a dependency of the first web utility. It should use the same date rules and icon identifiers as the UI so natural-language requests and manual configuration produce matching results.

## 3. Primary user flow

1. Choose one month or a range/list of months.
2. Set page size, orientation, and which weekday begins the calendar week.
3. Add tasks and define when each task is due.
4. Select an SVG symbol for each task from a searchable symbol picker.
5. Optionally assign task colors, a calendar title, and decorative options.
6. Inspect the live print preview, make adjustments, and download or print the calendar.

The editor should make configuration quick without hiding the output. On wide screens, show the controls and print preview together. On narrow screens, stack them and keep a clear way to switch between editing and preview.

## 4. Configuration model

### Calendar parameters

- One month or multiple months. Multiple months export as a multi-page PDF with exactly one month per page.
- Month and year for each selected month; consecutive month range is a convenient selection mode.
- First weekday: Sunday or Monday. Sunday is the initial default.
- Paper size: US Letter or A4.
- Page orientation: landscape or portrait. Landscape is the initial default for a wall calendar.
- Optional title, with controls for whether it appears and its alignment/size.
- Optional decorative layer, such as a border motif or small themed illustration. Decoration is off by default and must not reduce the usable calendar grid.
- Print treatment: printer-friendly monochrome by default, with optional color mode.

### Task parameters

Each task has:

- Name or short label.
- Recurrence rule.
- First due date or other rule anchor where required.
- SVG symbol selected from the icon picker.
- Optional color. In monochrome print mode, the icon remains identifiable by shape and contrast; color is never the only way to distinguish tasks.
- Optional assignment label, such as a family member, hidden if unused.
- Enabled state.

In the first implementation, support:

- Every N days, anchored to an explicit first due date.
- Selected weekdays, such as every Monday and Thursday.
- Selected dates each month, such as the 1st and 15th.
- One-time dates.

Allow different first due dates to stagger related tasks. Explain interval anchors in the editor and show due dates in the preview. Do not guess an anchor or silently shift a recurrence.

When multiple tasks fall on one date, show each symbol in a consistent row or wrapped group. Keep the date number visually distinct, and ensure symbols remain large enough to recognize in print.

## 5. Symbol picker and visual settings

- Include a searchable, keyboard-accessible picker of SVG symbols based on Font Awesome Free.
- Bundle the selected icons locally. Do not fetch assets at runtime, so the editor and PDF work offline after the page loads.
- Use a curated, coherent subset rather than exposing an unfiltered icon catalog. Organize it with simple categories such as household, pet care, cleaning, garden, food, and maintenance.
- Display each option with its icon and accessible name; the chosen icon remains associated with the task label in the preview and PDF key.
- Record icon source, package/version, and license in the repository. Confirm that selected icon files and Font Awesome marks meet their respective license and attribution requirements before release.
- Allow optional per-task color selection and a small set of restrained decorative settings. Keep a distinct monochrome mode for laser-printer output.
- Preserve contrast in color mode and grayscale legibility in printer-friendly mode. Do not rely on hue alone to communicate task identity.

If custom SVG upload is added, sanitize SVG content before rendering or exporting it. This can follow the bundled icon picker rather than blocking the first release.

## 6. Live print preview

The preview should approximate the exported page, including page dimensions, margins, calendar cells, selected symbols, title, colors, and decoration.

- Update immediately when a calendar or task parameter changes.
- Provide a clear one-page view for each selected month. A month selector or page thumbnails can be used when several months are selected.
- Use real month length and correct weekday alignment, including five- and six-row months.
- Show the task symbol key by default. Allow it to be hidden when the user wants a cleaner page.
- Keep task labels accessible even when the visual page uses symbols.
- Warn in the editor when task density, long labels, or a large symbol key may not fit. Suggest relevant settings such as a larger page, alternate orientation, or shorter labels before export.
- Provide browser printing as a fallback as well as a direct PDF download.

## 7. Printable output

- One calendar month per page. Multiple selected months create multiple pages, one page per month.
- Default to clean black, white, and gray output with optional color.
- Keep dates, symbols, title, and key legible on a home printer, with safe margins and no clipped content.
- Optional open check circles/boxes can be enabled for marking tasks by hand.
- Include only the configured title, weekday labels, dates, symbols, and optional key/decorations. Avoid unsolicited explanatory or promotional copy.
- Make the browser preview and PDF use the same calendar configuration and date engine.
- Embed or use reliable fonts and ensure bundled SVGs render consistently in PDF output.
- Use date-only arithmetic so daylight-saving changes cannot move a task to an adjacent date.

## 8. Presets and examples

Provide editable presets as starting points, not fixed templates:

- Dog care: brushing, dental treat, chew, grooming or nail care.
- Household chores: laundry, bins, linens, floors.
- Plant care: watering, feeding, pruning.
- Home maintenance: filters, alarms, appliance care.

The first complete example is the approved October 2026 dog-care calendar. It should demonstrate an every-other-day tooth-brushing task, staggered recurrence anchors for other tasks, recognizable bundled SVG symbols, the optional color setting, and the monochrome printer-friendly layout. October 1, 2026 must appear under Thursday in a Sunday-first calendar.

## 9. Technical outline

- Implement the first version as static HTML, CSS, and JavaScript within the existing personal-site repository, preserving current URLs and shared site navigation.
- Keep the configuration model, date engine, editor, icon catalog, and print/PDF renderer as separable modules.
- Store dates as date-only values such as `YYYY-MM-DD`; do not use local timestamps for recurrence calculations.
- Generate preview, print output, and PDF from one calendar model to avoid mismatches.
- Prefer a client-side PDF workflow. If direct PDF generation proves unreliable, ship a correct print stylesheet and browser print flow first, then add direct PDF download without changing the date engine.
- Save drafts locally in the browser. Provide JSON export/import so users can save and restore configurations.
- Do not send task labels or calendar configuration to analytics or a server during normal use.
- Keep motion limited and respect reduced-motion preferences.

### Example configuration shape

```json
{
  "schemaVersion": 1,
  "calendar": {
    "months": [{ "year": 2026, "month": 10 }],
    "weekStartsOn": 0,
    "paper": "letter",
    "orientation": "landscape",
    "colorMode": "monochrome",
    "title": "",
    "showTitle": false,
    "decoration": "none"
  },
  "tasks": [
    {
      "id": "brush-teeth",
      "name": "Brush teeth",
      "recurrence": {
        "type": "interval",
        "days": 2,
        "firstDue": "2026-10-01"
      },
      "icon": "toothbrush",
      "color": null
    }
  ]
}
```

This is an illustrative shape, not a final API contract. The versioned configuration should be finalized before the API and agent skill are designed.

## 10. Future API and agent skill

### API direction

The future API should accept and validate the same versioned calendar configuration used by the web editor and return a deterministic date schedule and generated output. The API contract should be designed after the web configuration and date engine are tested in real use.

### Agent skill direction

The future skill should accept a natural-language request and:

1. Extract months, tasks, recurrence, anchors, symbols, color preferences, title, and output settings.
2. Detect missing schedule information, especially interval anchors; ask for clarification or present an explicit proposal for review.
3. Produce a versioned calendar configuration using the same schema as the web utility.
4. Present the calculated due dates for review before final generation when the request leaves material ambiguity.
5. Validate calendar alignment, recurrence dates, icon availability, output settings, and page density through deterministic code.
6. Generate a calendar matching the approved configuration and summarize any assumptions.

Natural-language interpretation may propose values, but the API and date engine should enforce schema rules and determine final dates. This keeps repeated requests consistent and makes the behavior testable.

## 11. Acceptance criteria for the web utility

- A visitor can configure and print/download one or multiple months without creating an account.
- The live preview updates from parameter changes and matches the exported PDF.
- Each selected month occupies exactly one page.
- Month alignment, day count, leap years, weekday starts, and month boundaries are correct.
- Every N days, selected weekdays, monthly dates, and one-time dates produce expected occurrences.
- An every-other-day task anchored to October 1, 2026 appears on October 1, 3, 5, and subsequent odd-numbered dates in that month.
- Users can choose an SVG symbol from the searchable picker and optionally set a color per task.
- Monochrome output remains legible and task identities remain distinguishable without color.
- Titles, decoration, symbol key, paper size, and orientation settings appear in preview and output as configured.
- The exported page has no clipped dates, symbols, title, or key.
- The editor and symbol picker support keyboard interaction and accessible names.
- User calendar settings remain in the browser unless the user explicitly exports them.

## 12. Suggested implementation sequence

1. Finalize a versioned calendar configuration and recurrence fixtures.
2. Implement and verify deterministic date generation.
3. Build the calendar/task parameter editor and live page preview.
4. Add the bundled Font Awesome Free SVG subset, attribution/license manifest, and icon picker.
5. Add color controls, monochrome treatment, title, and optional decoration.
6. Implement print styles and direct PDF export, then visually inspect the dog-care example and edge-case months.
7. Add presets, local draft persistence, and JSON import/export.
8. Refine the schema based on real use, then design the API and agent skill around it.

## 13. Out of scope for the first release

- Accounts, cloud sync, shared editing, and household permissions.
- Reminders, completion tracking, or external calendar integrations.
- AI or natural-language parsing embedded in the public page.
- API implementation before the browser configuration and date rules are stable.
- Remote icon dependencies or a user-generated icon marketplace.
