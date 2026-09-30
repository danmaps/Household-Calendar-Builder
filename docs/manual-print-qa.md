# Print and PDF manual QA

The October 2026 dog-care configuration in [`../fixtures/october-2026-dog-care.json`](../fixtures/october-2026-dog-care.json) is the regression sample. Its expected calendar alignment and due dates are in `october-2026-dog-care.expected.json` and covered by `npm test`.

## Checklist

1. Serve the repository with `npm start`, load the dog-care example, and confirm October 1 is under Thursday. Brush-teeth symbols should appear on October 1, 3, 5, and every other odd date.
2. Review the preview in both Sunday-first and Monday-first modes. Check a five-row month and August 2026 in a Sunday-first layout, which uses six rows.
3. For Letter and A4, check both portrait and landscape. In each combination, switch between monochrome and color, then check both week starts. Confirm the month grid, task dates, title, symbols, colors, decoration, and key match the settings.
4. Try each page margin (¼, ½, ¾, and 1 inch). Use **Print calendar** and confirm each selected month occupies one sheet with no clipped dates, symbols, title, or key.
5. Use **Download PDF** for a single month and for a range of at least two months. Confirm the PDF has exactly one page per month and the correct paper size and orientation.
6. Turn on checkboxes, hide/show the task key and title, and try a dense task configuration. Confirm the editor warning appears for crowded dates, long labels, or a large visible key; shorten labels, hide the key, or change orientation and inspect again.
7. Repeat the preview and export checks at a narrow mobile viewport. The editor and page navigation should remain usable, and the page should not scroll horizontally.
