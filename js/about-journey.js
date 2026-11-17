/* ---------------- About — "Our Journey Towards Intelligence." ----------------
   Desktop: the section pins and the three phases sit side by side as panels. Scrolling walks through them —
   the active panel opens wide (year fills in, milestones appear) while the others fold down to year + title;
   each panel's top line fills as you progress. Clicking a folded panel jumps to it. 2026 is marked "now".
   ≤900px: a plain vertical timeline — the rail fills down and phases light up as they scroll into view. */
(() => {
  const sec = document.getElementById('journey'); if (!sec) return;
  const { reduce, clamp } = window.IXP;
  const rail = sec.querySelector('.aj-rail'), phases = [...sec.querySelectorAll('.aj-phase')];
  const mq = matchMedia('(max-width: 900px)');
  const n = phases.length;
  let raf = 0, cur = -1;

  function update(){
    raf = 0;
    if (mq.matches){
      cur = -1;
      const r = rail.getBoundingClientRect(), read = innerHeight * .7;
      rail.style.setProperty('--f', clamp(read - r.top, 0, r.height) + 'px');
      phases.forEach(p => { p.classList.remove('done'); p.classList.toggle('on', reduce || p.getBoundingClientRect().top < read); p.style.removeProperty('--p'); });
      return;
    }
    const steps = clamp(window.IXP.progress(sec)) * n;
    const k = Math.min(n - 1, Math.floor(steps)), frac = clamp(steps - k);
    if (k !== cur){
      cur = k;
      phases.forEach((p, i) => { p.classList.toggle('on', i === k); p.classList.toggle('done', i < k);
        p.setAttribute('aria-expanded', String(i === k)); });
    }
    phases.forEach((p, i) => p.style.setProperty('--p', i < k ? 1 : i === k ? frac.toFixed(3) : 0));
  }

  // click / keyboard on a folded panel → scroll to its step
  phases.forEach((p, i) => {
    p.tabIndex = 0;
    const go = () => {
      if (mq.matches || i === cur) return;
      const y = sec.offsetTop + (i + .08) / n * (sec.offsetHeight - innerHeight);
      window.ppScrollTo ? window.ppScrollTo(y) : scrollTo({ top: y, behavior: 'smooth' });
    };
    p.addEventListener('click', go);
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
  });

  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  if (mq.addEventListener) mq.addEventListener('change', () => { cur = -1; queue(); });
  update();
})();
