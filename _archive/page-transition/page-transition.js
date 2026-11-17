/* ---------------- Page transitions (home · products · about) ----------------
   Leaving: clicking a link to another page opens a violet circle from the click point, chased by a black one that
   carries the InsightX mark and the destination's name, decoding. Then the browser navigates.
   Arriving: the new page starts under that black cover (html.pt-in, set by an inline script in <head> so there's
   no flash) and is revealed in its own way:
     home      the cover closes into the centre, like the globe pulling the eye in
     products  three columns lift away in turn — one per product
     about     the page appears through the InsightX mark's cloud silhouette, growing from the centre
   Two layers (black, then violet trailing ~120 ms) so the moving edge always reads on a black page.
   Skipped with reduced motion, modifier-clicks, new tabs, downloads and links within the same page. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'ix-pt', SYM = '01#%&@<>/=+*';
  const pageOf = u => { const p = u.pathname.split('/').pop(); return !p || p === 'index' ? 'index.html' : (/\.html?$/.test(p) ? p : p + '.html'); };
  const NAME = { 'index.html': ['InsightX', '/'], 'products.html': ['Products', '/products'], 'about.html': ['About', '/about'] };
  const here = pageOf(location);
  const markD = (document.querySelector('#ix-mark path') || {}).getAttribute?.('d') || '';
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const clamp = v => Math.max(0, Math.min(1, v));

  function build(to){
    const [name, path] = NAME[to] || ['InsightX', ''];
    const o = document.createElement('div'); o.className = 'pt'; o.setAttribute('aria-hidden', 'true');
    o.innerHTML = `<div class="pt-v"></div><div class="pt-k"><div class="pt-c">
      ${markD ? `<svg class="pt-mark" viewBox="0 0 33 26"><path d="${markD}"/></svg>` : ''}
      <p class="pt-name">${name}</p><p class="pt-sub">insightx.ai${path}</p></div></div>`;
    document.body.appendChild(o);
    return { o, v: o.querySelector('.pt-v'), k: o.querySelector('.pt-k'), c: o.querySelector('.pt-c'), nameEl: o.querySelector('.pt-name'), name };
  }
  function decode(el, text, dur = 520){
    const t0 = performance.now();
    (function step(now){
      const p = clamp((now - t0) / dur);
      el.textContent = [...text].map((ch, i) => ch === ' ' || i / text.length < p * 1.15 - .1 ? ch : SYM[Math.random() * SYM.length | 0]).join('');
      if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    })(t0);
  }
  // drive clip-paths per frame: shape(el, p) for each [el, delay, dur]
  function play(tracks, total, done){
    const t0 = performance.now();
    (function step(now){
      const t = now - t0;
      tracks.forEach(([el, delay, dur, shape]) => { const p = ease(clamp((t - delay) / dur)); const c = shape(p); el.style.clipPath = c; el.style.webkitClipPath = c; });
      if (t < total) requestAnimationFrame(step); else done && done();
    })(t0);
  }
  const W = () => innerWidth, H = () => innerHeight;
  const circleOut = (x, y) => p => `circle(${(Math.hypot(Math.max(x, W() - x), Math.max(y, H() - y)) * p + .5).toFixed(1)}px at ${x}px ${y}px)`;

  // ---- arrival shapes (p: 0 = fully covered → 1 = page revealed) ----
  const SHAPES = {
    'index.html': () => p => `circle(${(Math.hypot(W(), H()) / 2 * (1 - p)).toFixed(1)}px at 50% 50%)`,
    'products.html': i => p => {                               // three columns lift away, left → right
      const w = W() / 3; let d = '';
      for (let c = 0; c < 3; c++){ const q = ease(clamp(p * 1.6 - c * .3)), h = H() * (1 - q); if (h > .5) d += `M${(c * w).toFixed(1)} 0h${(w + .5).toFixed(1)}v${h.toFixed(1)}h${(-w - .5).toFixed(1)}z`; }
      return d ? `path('${d}')` : 'inset(0 0 100% 0)';
    },
    'about.html': () => {                                      // a hole shaped like the mark's cloud, growing from the centre
      const sub = cloudSub();
      return p => {
        const s = Math.max(W() / 25, H() / 16) * 1.25 * Math.pow(p, 1.6), tx = W() / 2 - 16.5 * s, ty = H() / 2 - 13 * s;
        const hole = s > .05 ? transform(sub, s, tx, ty) : '';
        return `path(evenodd, 'M0 0H${W()}V${H()}H0Z${hole}')`;
      };
    },
  };
  // the outer contour of the mark (largest subpath), re-scaled into px
  function cloudSub(){
    const parse = d => { const out = []; d.replace(/([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g, (m, c, n) => out.push(c ? c : +n)); return out; };
    let best = [], area = -1;
    markD.split(/(?=[Mm])/).map(parse).forEach(t => { const n = t.filter(x => typeof x === 'number'), xs = n.filter((_, i) => !(i % 2)), ys = n.filter((_, i) => i % 2);
      const a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); if (a > area){ area = a; best = t; } });
    return best;
  }
  function transform(tokens, s, tx, ty){
    let d = '', cmd = 'M', k = 0;
    for (const t of tokens){
      if (typeof t === 'string'){ cmd = t; k = 0; d += t; continue; }
      const U = cmd.toUpperCase(), abs = cmd === U;
      const v = U === 'H' ? t * s + (abs ? tx : 0) : U === 'V' ? t * s + (abs ? ty : 0) : t * s + (abs ? (k % 2 ? ty : tx) : 0);
      d += ' ' + v.toFixed(1); k++;
    }
    return d;
  }

  // ---- arriving ----
  let state = null;
  try { state = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (state && Date.now() - state.t < 6000 && state.to === here && !reduce){
    sessionStorage.removeItem(KEY);
    const L = build(here); L.nameEl.textContent = L.name;
    document.documentElement.classList.remove('pt-in');
    const shape = (SHAPES[here] || SHAPES['index.html'])();
    L.c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 260, delay: 260, fill: 'forwards', easing: 'ease-in' });
    play([[L.k, 380, 760, shape], [L.v, 500, 760, shape]], 1300, () => L.o.remove());
  } else document.documentElement.classList.remove('pt-in');

  // ---- leaving ----
  let leaving = false;
  document.addEventListener('click', e => {
    if (leaving || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (a.target && a.target !== '_self' || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin || !/\.html?$|\/$/.test(url.pathname)) return;
    const to = pageOf(url); if (to === here) return;          // in-page anchors are handled by the page's own scroller
    e.preventDefault(); leaving = true;
    try { sessionStorage.setItem(KEY, JSON.stringify({ to, t: Date.now() })); } catch (err) {}
    const x = e.clientX || W() / 2, y = e.clientY || H() / 2;
    const L = build(to); L.nameEl.textContent = '';
    L.c.style.opacity = 0;
    const out = circleOut(x, y);
    play([[L.v, 0, 560, out], [L.k, 130, 560, out]], 760, () => { location.href = url.href; });
    setTimeout(() => { L.c.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, fill: 'forwards', easing: 'cubic-bezier(.2,.7,.2,1)' }); decode(L.nameEl, L.name, 460); }, 330);
  }, false);

  // coming back through the back/forward cache: never leave a cover on screen
  addEventListener('pageshow', e => { if (e.persisted){ leaving = false; document.querySelectorAll('.pt').forEach(n => n.remove()); document.documentElement.classList.remove('pt-in'); } });
})();
