/* ---------------- Products page — paced scrolling ----------------
   Same feel as the home page: hero → flagship intro → each pinned section → footer move one step per gesture,
   with a short hold so a fast flick can't skip a section. Inside the pinned sections (key features, prediction
   market, agent scene) scrolling is native and free, and a fling stops at their edges first.
   Also smooth-scrolls in-page links (#intelligence …) and exposes window.ppScrollTo(elementOrY). */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 520;
  const PINS = ['features', 'prediction-market', 'agent-scene'].map(id => document.getElementById(id)).filter(Boolean);
  let snaps = [], anim = null, lockUntil = 0, lastWheel = 0, lastAbs = 0, acc = 0, lastY = scrollY;

  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  const zones = () => PINS.map(s => [s.offsetTop, Math.min(maxY(), s.offsetTop + s.offsetHeight - innerHeight)]);
  const zoneAt = y => zones().find(([a, b]) => y >= a - 1 && y <= b + 1);
  function computeSnaps(){
    const intro = document.getElementById('intelligence');
    snaps = [0, intro ? intro.offsetTop : 0];
    zones().forEach(([a, b]) => snaps.push(a, b));
    snaps.push(maxY());
    snaps = [...new Set(snaps.map(Math.round))].sort((x, y) => x - y);
  }
  const isPaced = dir => { if (anim) return true; const y = scrollY;
    for (const [a, b] of zones()){
      if (y > a + 1 && y < b - 1) return false;
      if (Math.abs(y - a) <= 1 && dir > 0) return false;
      if (Math.abs(y - b) <= 1 && dir < 0) return false;
    }
    return true; };
  const nearest = () => { let k = 0; snaps.forEach((v, i) => { if (Math.abs(v - scrollY) < Math.abs(snaps[k] - scrollY)) k = i; }); return k; };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const hold = () => { lockUntil = performance.now() + HOLD; acc = 0; };

  function animateTo(to){
    const from = scrollY; to = Math.max(0, Math.min(maxY(), Math.round(to)));
    if (Math.abs(to - from) < 2){ lockUntil = performance.now() + 120; return; }
    const dur = reduce ? 1 : Math.min(1600, 650 + Math.abs(to - from) / innerHeight * 420);
    const t0 = performance.now();
    if (anim) cancelAnimationFrame(anim);
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, from + (to - from) * ease(t)); lastY = scrollY;
      if (t < 1) anim = requestAnimationFrame(step); else { anim = null; hold(); }
    };
    anim = requestAnimationFrame(step);
  }
  const goTo = i => { computeSnaps(); animateTo(snaps[Math.max(0, Math.min(snaps.length - 1, i))]); };
  const go = dir => {
    if (anim || performance.now() < lockUntil) return;
    computeSnaps(); const k = nearest();
    goTo(dir > 0 ? (snaps[k] > scrollY + 2 ? k : k + 1) : (snaps[k] < scrollY - 2 ? k : k - 1));
  };
  window.ppScrollTo = target => { if (target == null) return; animateTo(typeof target === 'number' ? target : target.offsetTop); };

  addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); if (!id) return;
    const el = document.getElementById(id); if (!el) return;
    e.preventDefault(); window.ppScrollTo(el); history.replaceState(null, '', '#' + id);
  });

  addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    const now = performance.now(), abs = Math.abs(e.deltaY), dir = Math.sign(e.deltaY);
    const fresh = now - lastWheel > 160 || abs > lastAbs * 1.6 + 4;
    lastWheel = now; lastAbs = abs;
    if (!isPaced(dir)){
      const z = zoneAt(scrollY); if (!z) return; const [a, b] = z;
      if (dir < 0 && scrollY + e.deltaY < a){ e.preventDefault(); scrollTo(0, a); lastY = scrollY; hold(); }
      else if (dir > 0 && scrollY + e.deltaY > b){ e.preventDefault(); scrollTo(0, b); lastY = scrollY; hold(); }
      return;
    }
    e.preventDefault();
    if (anim || now < lockUntil){ acc = 0; return; }
    if (!fresh && acc === 0) return;
    acc += e.deltaY;
    if (Math.abs(acc) > 24){ go(Math.sign(acc)); acc = 0; }
  }, { passive: false });

  let ty = null, paced = false;
  addEventListener('touchstart', e => { ty = e.touches[0].clientY; paced = null; }, { passive: true });
  addEventListener('touchmove', e => {
    if (ty === null) return;
    if (paced === null){ const dy = ty - e.touches[0].clientY; if (Math.abs(dy) < 4) return; paced = isPaced(Math.sign(dy)); }
    if (paced) e.preventDefault();
  }, { passive: false });
  addEventListener('touchend', e => {
    if (ty === null) return; const dy = ty - (e.changedTouches[0]?.clientY ?? ty); ty = null;
    if (paced && Math.abs(dy) > 40) go(Math.sign(dy));
  }, { passive: true });

  addEventListener('scroll', () => {
    const z = zoneAt(lastY), [a, b] = z || [0, 0];
    if (!anim && z){
      if (scrollY < a - 1){ scrollTo(0, a); hold(); }
      else if (scrollY > b + 1){ scrollTo(0, b); hold(); }
    }
    lastY = scrollY;
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return;
    const down = ['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey, up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    if ((down || up) && isPaced(down ? 1 : -1)){ e.preventDefault(); go(down ? 1 : -1); }
    else if (e.key === 'Home'){ e.preventDefault(); goTo(0); }
    else if (e.key === 'End'){ e.preventDefault(); goTo(snaps.length - 1); }
  });

  let lastW = innerWidth;
  addEventListener('resize', () => { computeSnaps(); if (innerWidth === lastW) return; lastW = innerWidth; if (!anim && !zoneAt(scrollY)) scrollTo(0, snaps[nearest()]); });
  computeSnaps();
  // arriving with a hash (e.g. from the home page footer): land on that section
  if (location.hash){ const el = document.getElementById(location.hash.slice(1)); if (el) addEventListener('load', () => scrollTo(0, el.offsetTop)); }
})();
