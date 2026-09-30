# PDF export libraries

These browser builds are committed locally so calendar creation works without a runtime request to a CDN:

| Package | Version | License | Use |
| --- | --- | --- | --- |
| [html2canvas](https://www.npmjs.com/package/html2canvas) | 1.4.1 | MIT | Renders the configured page DOM to a canvas |
| [jsPDF](https://www.npmjs.com/package/jspdf) | 4.2.1 | MIT | Writes one rasterized calendar page per PDF page |

The minified browser bundles and their upstream license notices are in [`../vendor/`](../vendor/). The exporter captures the same page component used for preview and browser printing, at the configured paper size, orientation, and margin. It rasterizes each page at 2× CSS resolution (about 192 dpi at the configured paper size), which keeps the SVG symbols and styles consistent; PDF text is therefore not selectable. Use browser printing when selectable text is preferred. The PDF is generated in memory in the browser and downloaded locally; no calendar configuration or page data is sent to a server.
