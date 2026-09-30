# Print and PDF manual QA

The October 2026 dog-care configuration in [`../fixtures/october-2026-dog-care.json`](../fixtures/october-2026-dog-care.json) is the regression sample. Its expected calendar alignment and due dates are in `october-2026-dog-care.expected.json` and covered by `npm test`.

## Checklist

1. Serve the repository with `npm start`, load the dog-care example, and confirm October 1 is under Thursday. Brush-teeth symbols should appear on October 1, 3, 5, and every other odd date.
2. Review the preview in both Sunday-first and Monday-first modes. Check a five-row month and August 2026 in a Sunday-first layout, which uses six rows.
3. For Letter and A4, check both portrait and landscape. In each combination, switch between monochrome and color, then check both week starts. Confirm the month grid, task dates, title, symbols, colors, decoration, and key match the settings.
4. Try each page margin (¼, ½, ¾, and 1 inch). Use **Print calendar** and confirm each selected month occupies one sheet with no clipped dates, symbols, title, or key.
5. Use **Download PDF** for a single month and for a range of at least two months. Confirm the PDF has exactly one page per month and the correct paper size and orientation.
6. Turn on checkboxes, hide/show the task key and title, and try a dense task configuration. Confirm the editor warning appears for crowded dates, long labels, or a large visible key; shorten labels, hide the key, or change orientation and inspect again.
7. Check the screen preview at 1440px, 768px, and 390px viewport widths. Confirm the preview keeps the selected paper's aspect ratio and configured margins; weekday headings, date numerals, and symbols stay the same size relative to the page. At narrow widths the preview itself may scroll horizontally, while the document and editor must not gain horizontal overflow.
8. Test a crowded date with 8, 9, and 50 scheduled tasks, with checkboxes both off and on. Up to 8 task marks display in a bounded two-row area; beyond that, seven marks plus a `+N` count appear. Hover or inspect the accessible label for the count to identify the remaining tasks. Confirm no task content crosses a cell border or covers another date, then compare the screen preview, browser print preview, and downloaded PDF.
9. Repeat the preview, print, and PDF checks at desktop, tablet, and mobile widths. The browser scales the complete paper proportionally, with a minimum 65% scale and local horizontal scrolling below that size; the calendar grid itself never changes columns, typography, icon size, or configured page margins based on viewport width.
