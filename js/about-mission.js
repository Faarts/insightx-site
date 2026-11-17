/* ---------------- About — Mission ----------------
   "Make intelligence more accessible, useful, and actionable for everyone." lights up word by word as the
   pinned section is scrolled; the three key words turn accent and tick off the markers underneath.
   Behind it, a "reach" field: a grid of dots (people) lights up outward from the InsightX mark as the statement
   lights — each key word sends out a violet pulse, and by "everyone." the whole field is lit. As the reach
   passes them, the people it's for (researchers, analysts, students…) are tagged and linked back to the mark.
   The pointer brightens the dots around it. Reach % in the corner follows the same progress. */
(() => {
  const sec = document.getElementById('mission'); if (!sec) return;
  const { reduce, clamp } = window.IXP;
  const st = sec.querySelector('.am-statement'), keys = [...sec.querySelectorAll('.am-keys li')];
  st.setAttribute('aria-label', st.textContent.replace(/\s+/g, ' ').trim());

  // wrap every word in a span (inside the <em> key words too)
  const words = [];
  const wrap = (node, key) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; s.setAttribute('aria-hidden', 'true');
          if (key !== undefined) s.dataset.key = key;
          frag.appendChild(s); words.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrap(n, n.tagName === 'EM' ? [...st.querySelectorAll('em')].indexOf(n) : key);
    });
  };
  wrap(st);

  let raf = 0, lastF = -1;
  function update(){
    raf = 0;
    const f = reduce ? 1 : clamp((window.IXP.progress(sec) - .04) / .7);
    if (Math.abs(f - lastF) < .001) return; lastF = f;
    const n = words.length;
    words.forEach((w, i) => {
      const l = clamp(f * n - i);
      w.style.setProperty('--l', l.toFixed(3));
      w.classList.toggle('lit', l > .95);
    });
    keys.forEach((k, i) => {
      const w = words.find(x => x.dataset.key == i), on = !!w && w.classList.contains('lit');
      if (on && !k.classList.contains('on') && !reduce) pulses.push({ r: 0 });
      k.classList.toggle('on', on);
    });
    if (pctEl) pctEl.textContent = Math.round(f * 100) + '%';
    reach = f;
  }

  // ---- reach field ----
  const cv = sec.querySelector('.am-field'), ctx = cv && cv.getContext('2d'), pctEl = sec.querySelector('.am-pct');
  const pathEl = document.querySelector('#ix-mark path'), mark = pathEl ? new Path2D(pathEl.getAttribute('d')) : null;
  const WHO = [['RESEARCHERS', .55, .16], ['ANALYSTS', .74, .11], ['BUILDERS', .9, .22], ['STUDENTS', .1, .87], ['JOURNALISTS', .33, .91], ['TRADERS', .57, .85], ['TEAMS', .74, .93]]
    .map(([n, u, v]) => ({ n, u, v, a: 0 }));
  let reach = 0, shown = 0, pulses = [], W = 0, H = 0, ox = 0, oy = 0, maxR = 1, mx = null, my = null, last = performance.now();
  addEventListener('pointermove', e => { if (!cv) return; const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  function field(now){
    requestAnimationFrame(field);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!cv || !window.IXP.visible(sec)) return;
    const [w, h] = window.IXP.fit(cv, ctx);
    if (w !== W || h !== H){ W = w; H = h; }
    const mob = W <= 900;
    ox = mob ? W * .82 : W * .84; oy = mob ? H * .78 : H * .7;
    maxR = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
    shown += (reach - shown) * (reduce ? 1 : Math.min(1, dt * 6));
    const R = shown * maxR * 1.02, t = now / 1000, gs = mob ? 22 : 28;
    pulses.forEach(p => p.r += dt * maxR * .55); pulses = pulses.filter(p => p.r < maxR * 1.05);
    ctx.clearRect(0, 0, W, H);
    if (R > 4){                                                   // soft glow of the reached area
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, R);
      g.addColorStop(0, 'rgba(160,145,245,.10)'); g.addColorStop(.85, 'rgba(160,145,245,.035)'); g.addColorStop(1, 'rgba(160,145,245,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, R, 0, 6.283); ctx.fill();
    }
    for (let x = gs / 2; x < W; x += gs) for (let y = gs / 2; y < H; y += gs){
      const d = Math.hypot(x - ox, y - oy);
      let a = .07, sz = 1, acc = 0;
      if (d < R){ a = .3 + .12 * Math.sin(t * 1.4 - d * .02); sz = 1.8; }
      const edge = Math.abs(d - R); if (R > 4 && edge < 34){ acc = Math.max(acc, 1 - edge / 34); }
      pulses.forEach(p => { const e = Math.abs(d - p.r); if (e < 26) acc = Math.max(acc, (1 - e / 26) * (1 - p.r / (maxR * 1.05))); });
      if (mx !== null){ const pd = Math.hypot(x - mx, y - my); if (pd < 130) a += (1 - pd / 130) * .35; }
      if (acc > .02){ ctx.fillStyle = `rgba(160,145,245,${Math.min(1, .25 + acc * .85).toFixed(3)})`; const s2 = sz + acc * 1.2; ctx.fillRect(x - s2 / 2, y - s2 / 2, s2, s2); }
      else { ctx.fillStyle = `rgba(255,255,255,${Math.min(.7, a).toFixed(3)})`; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz); }
    }
    // who it reaches: tags light up (and link back to the mark) once the reach passes them
    if (!mob){
      ctx.font = `400 11px ${window.IXP.MONO}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      WHO.forEach(p => {
        const x = p.u * W, y = p.v * H, inR = Math.hypot(x - ox, y - oy) < R;
        p.a += ((inR ? 1 : 0) - p.a) * (reduce ? 1 : Math.min(1, dt * 5));
        if (p.a < .02) return;
        ctx.setLineDash([2, 5]); ctx.strokeStyle = `rgba(160,145,245,${(.35 * p.a).toFixed(3)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#000'; const tw = ctx.measureText(p.n).width; ctx.fillRect(x - 6, y - 11, tw + 26, 22);
        ctx.strokeStyle = `rgba(255,255,255,${(.25 * p.a).toFixed(3)})`; ctx.strokeRect(x - 5.5, y - 10.5, tw + 25, 21);
        ctx.fillStyle = `rgba(160,145,245,${p.a.toFixed(3)})`; ctx.fillRect(x + 1, y - 2.5, 5, 5);
        ctx.fillStyle = `rgba(255,255,255,${p.a.toFixed(3)})`; ctx.fillText(p.n, x + 13, y + .5);
      });
    }
    // the origin: InsightX mark with a ring
    if (mark){
      const mw = mob ? 26 : 34, s = mw / 33;
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ox, oy, mw * .85, 0, 6.283); ctx.fill();
      ctx.strokeStyle = `rgba(160,145,245,${(.35 + .5 * shown).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
      ctx.save(); ctx.translate(ox - mw / 2, oy - mw * 26 / 66); ctx.scale(s, s); ctx.fillStyle = '#F8F1E7'; ctx.fill(mark); ctx.restore();
    }
  }
  requestAnimationFrame(field);
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  update();
})();
