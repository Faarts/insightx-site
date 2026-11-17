/* ---------------- Paced scrolling between sections ----------------
   Hero → section 2 → top of section 3 move one step per gesture, with a short hold so a fast flick can't skip a section.
   Inside section 3 (the pinned card deck) scrolling is native and free; scrolling back up out of it stops at its top first,
   then the next gesture steps back to section 2. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 520;
  let snaps = [], anim = null, lockUntil = 0, lastWheel = 0, lastAbs = 0, acc = 0, lastY = scrollY;

  // free (native) zones = the pinned interiors of section 3 (card deck) and section 4 → 5 (TV pull-back);
  // every other boundary is a paced step
  const range = () => { const s3 = document.getElementById('capabilities'); return [s3.offsetTop, s3.offsetTop + s3.offsetHeight - innerHeight]; };
  const zones = () => { const z = [range()], s4 = document.getElementById('platform'), max = document.documentElement.scrollHeight - innerHeight;
    if (s4) z.push([s4.offsetTop, Math.min(max, s4.offsetTop + s4.offsetHeight - innerHeight)]); return z; };
  const zoneAt = y => zones().find(([a, b]) => y >= a - 1 && y <= b + 1);
  function computeSnaps(){
    const max = document.documentElement.scrollHeight - innerHeight, [a, b] = range(), s4 = document.getElementById('platform');
    snaps = [0, document.getElementById('intro').offsetTop, a, b]; if (s4) snaps.push(Math.min(max, s4.offsetTop), Math.min(max, s4.offsetTop + s4.offsetHeight - innerHeight));
    if (document.querySelector('.ft')) snaps.push(max);
    snaps = [...new Set(snaps.map(Math.round))].sort((x, y) => x - y);
  }
  const isPaced = dir => { if (anim) return true; const y = scrollY;
    for (const [a, b] of zones()){
      if (y > a + 1 && y < b - 1) return false;         // inside a free zone
      if (Math.abs(y - a) <= 1 && dir > 0) return false; // at its top: down is free (up is paced)
      if (Math.abs(y - b) <= 1 && dir < 0) return false; // at its end: up is free (down is paced)
    }
    return true; };
  const nearest = () => { let k = 0; snaps.forEach((v, i) => { if (Math.abs(v - scrollY) < Math.abs(snaps[k] - scrollY)) k = i; }); return k; };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const hold = () => { lockUntil = performance.now() + HOLD; acc = 0; };

  function goTo(i){
    computeSnaps();
    i = Math.max(0, Math.min(snaps.length - 1, i));
    const from = scrollY, to = snaps[i];
    if (Math.abs(to - from) < 2){ lockUntil = performance.now() + 120; return; }
    const dur = reduce ? 1 : Math.min(1500, 650 + Math.abs(to - from) / innerHeight * 520);
    const t0 = performance.now();
    if (anim) cancelAnimationFrame(anim);
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, from + (to - from) * ease(t)); lastY = scrollY;
      if (t < 1) anim = requestAnimationFrame(step); else { anim = null; hold(); }
    };
    anim = requestAnimationFrame(step);
  }
  window.snapTo = goTo;
  const go = dir => {
    if (anim || performance.now() < lockUntil) return;
    computeSnaps(); const k = nearest();
    goTo(dir > 0 ? (snaps[k] > scrollY + 2 ? k : k + 1) : (snaps[k] < scrollY - 2 ? k : k - 1));
  };

  addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    const now = performance.now(), abs = Math.abs(e.deltaY), dir = Math.sign(e.deltaY);
    const freshGesture = now - lastWheel > 160 || abs > lastAbs * 1.6 + 4;
    lastWheel = now; lastAbs = abs;
    if (!isPaced(dir)){
      // free zone: native scroll, but a fling can't run out of the zone at either end
      const z = zoneAt(scrollY); if (!z) return; const [a, b] = z;
      if (dir < 0 && scrollY + e.deltaY < a){ e.preventDefault(); scrollTo(0, a); lastY = scrollY; hold(); }
      else if (dir > 0 && scrollY + e.deltaY > b){ e.preventDefault(); scrollTo(0, b); lastY = scrollY; hold(); }
      return;
    }
    e.preventDefault();
    if (anim || now < lockUntil){ acc = 0; return; }
    if (!freshGesture && acc === 0) return;
    acc += e.deltaY;
    if (Math.abs(acc) > 24){ go(Math.sign(acc)); acc = 0; }
  }, { passive: false });

  // touch: decide paced vs native on the first move of each swipe
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

  // native momentum (touch / keys / scrollbar) leaving a free zone stops at its edge first
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
  });

  // mobile browsers fire resize when their toolbars slide in/out — only re-snap on a real width change (rotation, window resize)
  let lastW = innerWidth;
  addEventListener('resize', () => { computeSnaps(); if (innerWidth === lastW) return; lastW = innerWidth; if (!anim && !zoneAt(scrollY)) scrollTo(0, snaps[nearest()]); });
  computeSnaps();
})();
