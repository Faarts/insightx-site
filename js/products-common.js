/* ---------------- Products page — shared helpers ----------------
   Headline "decode" (same effect as the home page hero), reveal-on-view, and the nav backdrop once the page scrolls.
   Exposes window.IXP for the other products-*.js modules. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SYM = '01#%&@<>/=+*';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // wrap every character in a span (words kept together so lines still break between words)
  function prepare(el){
    if (el._chars) return el._chars;
    const text = el.textContent.trim(); el.textContent = '';
    const chars = [];
    text.split(' ').forEach((w, wi, all) => {
      const word = document.createElement('span'); word.style.whiteSpace = 'nowrap'; word.style.display = 'inline-block';
      for (const ch of w){ const s = document.createElement('span'); s.className = 'ch pre'; s.textContent = ch; word.appendChild(s); chars.push(s); }
      el.appendChild(word);
      if (wi < all.length - 1) el.appendChild(document.createTextNode(' '));
    });
    const last = chars[chars.length - 1]; if (last && last.textContent === '.') last.classList.add('dot');
    if ('caret' in el.dataset){ const c = document.createElement('span'); c.className = 'caret'; el.appendChild(c); }
    el.setAttribute('aria-label', text);
    if (reduce) chars.forEach(c => c.classList.remove('pre'));
    return (el._chars = chars);
  }

  function play(el, delay = 0, dur = 1100){
    const chars = prepare(el);
    if (el._played) return; el._played = true;
    if (reduce){ chars.forEach(c => c.classList.remove('pre')); return; }
    const set = el.dataset.set || SYM;
    const start = performance.now() + delay;
    const order = chars.map((c, i) => i / chars.length * .75 + Math.random() * .25);
    (function step(now){
      const p = (now - start) / dur; let done = true;
      chars.forEach((c, i) => {
        const local = (p - order[i] * .7) / .3;
        if (local < 0){ done = false; return; }
        c.classList.remove('pre');
        if (local < 1){ done = false; c.classList.add('scr'); c.dataset.g = set[Math.random() * set.length | 0]; }
        else c.classList.remove('scr');
      });
      if (!done) requestAnimationFrame(step);
    })(performance.now());
  }

  const all = [...document.querySelectorAll('[data-pscramble]')];
  all.forEach(prepare);

  // hero headline plays on load; every other heading plays the first time it is properly on screen
  const hero = document.querySelector('.pp-hero');
  const heroLines = all.filter(el => hero && hero.contains(el));
  heroLines.forEach((el, i) => play(el, 500 + i * 1300, i ? 1100 : 1400));
  setTimeout(() => hero && hero.querySelectorAll('.reveal').forEach(r => r.classList.add('in')), reduce ? 0 : 2400);

  const groups = new Map();
  all.filter(el => !heroLines.includes(el) && !el.closest('[data-manual]') && !el.closest('.pa-soon')).forEach(el => {
    const h = el.closest('h1,h2,p') || el; if (!groups.has(h)) groups.set(h, []); groups.get(h).push(el);
  });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    groups.get(e.target).forEach((el, i) => play(el, 150 + i * 750, i ? 1100 : 1200));
    const sec = e.target.closest('section'); if (sec) sec.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: .5 });
  groups.forEach((_, h) => io.observe(h));

  // nav gets a soft black backdrop once the hero has scrolled away
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY > innerHeight * .6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  window.IXP = { reduce, SYM, clamp, play, prepare,
    MONO: '"Geist Mono", ui-monospace, Menlo, monospace', SANS: '"Geist", system-ui, sans-serif',
    ease: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    // fit a canvas to its CSS box at up to 2× pixel density; returns [w, h, changed]
    fit(cv, ctx){
      const w = cv.clientWidth, h = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1);
      const ch = Math.round(w * d) !== cv.width || Math.round(h * d) !== cv.height;
      if (ch){ cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
      ctx.setTransform(d, 0, 0, d, 0, 0);
      return [w, h, ch];
    },
    // is the element's box on screen?
    visible(el){ const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; },
    // pinned-section progress 0 → 1 across its scroll length
    progress(sec){ const span = sec.offsetHeight - innerHeight; return span > 0 ? clamp((scrollY - sec.offsetTop) / span) : 0; },
  };
})();
