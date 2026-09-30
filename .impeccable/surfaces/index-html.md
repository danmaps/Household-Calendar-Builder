---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/styles.css","src/app.js"]
---

# Household Calendar Builder — primary web app

Scope: whole app surface redesign. Mode: Operate.

Audience: household members arranging repeating chores and care. Job: configure calendar months and tasks, inspect the result, then print or download a PDF. Main action: edit the recurring task board and review its calendar. Proof: live month preview using actual deterministic recurrence rules. Constraints: retain all supported settings, task editing, local configuration, example, JSON import/export, print, PDF export, warnings, and keyboard accessible labels. No accounts, reminders, integrations, or completion tracking.

## Direction contract

THESIS: Make the household calendar feel like one shared kitchen planning board, replacing the generic editor-and-preview split with a single working surface whose task strips and month grid are visible together.

OWN-WORLD: Continuous enamel-white board; dark evergreen and navy ink; ochre magnetic tabs; terracotta reserved for PDF export. Use sturdy, plain sans-serif typography, restrained ruled lines, magnet-like task rows, crisp calendar marks, and square-cornered native-feeling controls with visible focus.

STORY: The visitor sees household routines beside the month they shape, edits the rule at its source, checks the dates, and prints or downloads the page. The preview stays real and the product never implies completion tracking.

FIRST VIEWPORT: At desktop width, the product name and primary export actions sit across the top. Beneath them a narrow left rail holds month range and print settings; the broad right side shows the live month calendar. A compact task list spans below the settings and alongside the calendar where space permits, with Add task easy to find. At mobile widths the month grid comes first, then tasks and secondary settings in expandable sections.

FORM: Family Kitchen Board, the selected assigned direction, seed key 91aff8e4. Its signature interaction is a routine strip edit that immediately updates the visible month marks; month navigation remains tied to the selected page range.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
