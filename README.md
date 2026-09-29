# Household Calendar Builder

A family utility for configuring recurring household tasks, choosing symbols and colors, and previewing a clean printable calendar before exporting it.

The first version is a browser-based calendar designer. Users set the month or months, define task schedules, choose SVG symbols from a searchable picker, customize the title and optional decoration, and review a live print preview. The default visual treatment stays clear and printer-friendly; color is available as an option.

## Product direction

- **Configure, preview, print.** The main experience is a set of calendar and task parameters beside a live preview of the finished page.
- **One month per page.** A single selected month produces a one-page calendar. Selecting multiple months produces one page for each month.
- **Flexible symbols and color.** A bundled symbol picker based on Font Awesome Free SVG icons helps users distinguish tasks. Users can choose colors while keeping a high-contrast print-friendly mode.
- **Household-wide.** Presets can demonstrate dog care, chores, gardening, and home maintenance, but every task name, cadence, and symbol is configurable.
- **Agent-ready later.** Once the interactive calendar builder is stable, its configuration model can support an API and an agent skill that turn natural-language requests into consistent, reviewable calendars.

## Status

This repository starts with the product specification and project README. The browser designer, calendar engine, API, and agent skill are planned follow-on work.

## Documentation

- [Product specification](SPEC.md)

## Design principles

- Make the controls obvious and keep the preview in view.
- Treat PDF and print output as the primary result.
- Use deterministic date calculations so the preview and exported pages always agree.
- Bundle icons locally and record their source and license.
- Keep configuration in the browser in the first version. No account or server is required to create a calendar.
- Preserve accessible names for task icons and keyboard support for the symbol picker and form.

## Initial example

The dog-care sample calendar for October 2026 demonstrates interval-based tasks, staggered start dates, recognizable SVG symbols, optional color, and a printable one-month layout. October 1, 2026 is a Thursday; tooth brushing is scheduled every other day.

## Roadmap

1. Define the calendar configuration and recurrence rules.
2. Build the date engine and parameter editor.
3. Add the symbol picker, color settings, live print preview, and PDF export.
4. Validate the dog-care example and add reusable household presets.
5. Design a stable API around the validated calendar configuration.
6. Create an agent skill that converts natural-language requests into configurations for review and consistent calendar generation.

See [SPEC.md](SPEC.md) for scope, interactions, acceptance criteria, and implementation details.
