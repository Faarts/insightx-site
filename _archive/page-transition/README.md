# Page-to-page transitions (removed 17 Nov 2026)

Leaving: violet + black circles open from the click point with the InsightX mark and the destination name decoding.
Arriving: home = cover closes into the centre; products = three columns lift away; about = page appears through the mark's cloud silhouette.

To restore:
1. Move `page-transition.js` back to `js/` and add `<script src="js/page-transition.js?v=1"></script>` after `js/nav-menu.js` on index, products and about.
2. Append `page-transition.css` to the end of `css/main.css` (bump its `?v=`).
3. Put this in each page's `<head>`, just before the main.css link (prevents a flash of the page before the reveal):

```html
<script>try{var s=JSON.parse(sessionStorage.getItem("ix-pt")||"null");if(s&&Date.now()-s.t<6000&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("pt-in")}catch(e){}</script>
```
