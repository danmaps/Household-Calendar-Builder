# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the specification: a household member, often a parent or caregiver, who coordinates repeating chores, pet care, gardening, or home maintenance and wants a calendar they can print or share in the home.

## Product Purpose

Repo-confirmed: let people configure one or more months of recurring household tasks, preview the finished calendar, and print or download it as a PDF. Success means the preview and exported pages agree, recurrence dates are correct, and users can create a calendar without an account or external service.

## Positioning

Repo-confirmed: a browser based, parameter driven calendar designer with deterministic date rules and a live print preview. The calendar configuration is kept in the browser unless the user exports it.

## Operating Context

Inferred from the product specification: users set a month range and page settings, add tasks with recurrence rules and symbols, inspect the preview, adjust crowded or unclear details, then print or save the pages. Output is intended for paper use around the household as well as browser review.

## Capabilities and Constraints

- Repo-confirmed: static client side HTML, CSS, and JavaScript; no build step or server side service is required.
- Repo-confirmed: supports interval, selected weekday, monthly date, and one time recurrence rules.
- Repo-confirmed: supports multiple consecutive months, US Letter or A4 paper, portrait or landscape orientation, week start, monochrome or color output, margins, optional title and decoration, task key, and checkboxes.
- Repo-confirmed: users can add, edit, disable, reorder, and remove tasks; select from a searchable local SVG symbol catalog; and use advanced JSON configuration.
- Repo-confirmed: direct PDF export and browser printing use the calendar page layout, with one month per page.
- Repo-confirmed: do not guess recurrence anchors or silently shift dates; warn about crowded dates and long labels.
- Repo-confirmed: no accounts, cloud sync, reminders, external calendar integration, completion tracking, or embedded AI are part of the current product.

## Brand Commitments

- Confirmed: the product name is Household Calendar Builder.
- Confirmed: retain the custom calendar, home, and checked task logo added to the README.
- Inferred from the specification: keep language plain and practical, and keep the calendar output printer friendly.

## Evidence on Hand

- The October 2026 dog care fixture, expected date schedule, sample PDF, and preview image are in `fixtures/` and `examples/`.
- The product specification and implementation details are recorded in `SPEC.md` and `docs/configuration.md`.
- No customer quotes, user research, adoption metrics, or third party endorsements are recorded in the repository; do not invent them.

## Product Principles

- Inferred: make the first usable calendar quick to create while allowing detailed adjustments when needed.
- Repo-confirmed: keep calendar date generation deterministic and explain recurrence anchors.
- Repo-confirmed: keep print preview and exported pages consistent.
- Repo-confirmed: preserve symbol recognition and legibility in monochrome output.
- Repo-confirmed: keep configuration local unless the user explicitly exports it.

## Accessibility & Inclusion

Repo-confirmed: controls and symbol choices need accessible names and keyboard operation. Do not use color as the only way to distinguish tasks.
