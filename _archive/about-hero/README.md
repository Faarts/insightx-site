# About page — archived hero options (17 Nov 2026)

The About hero went through four versions. **Terrain** (`js/about-terrain.js`) was chosen; the rest live here, not loaded by any page.

| File | Option |
|---|---|
| `about-field.js` | v1 — fragments drift in from the left and are decoded into structured labels when they cross a violet line (+ HUD counters) |
| `about-board.js` | v2 — split-flap departure board that resolves into the headline (Geist Mono caps) |
| `about-radar.js` | v3b — radar scope; the sweep lights signals, insights stay violet |
| `about-hero-options.html` | hero markup from the review period (all canvases, radar HUD, `?hero=` switcher) |
| `about-hero-options.css` | the board / radar / switcher styles removed from `css/about.css` |

To bring one back: restore its script tag in `about.html`, its canvas in the hero, and its styles. Scripts expect `window.IXP` from `js/products-common.js`. The board and radar scripts still contain a `sec.dataset.hero !== '…'` guard from the review period — remove it when restoring.
