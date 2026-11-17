/* ---------------- About — Vision: "The Future Is Not More Information. It's Better Intelligence." ----------------
   Hundreds of scattered glyph fragments (more information) drift across the screen; when the section arrives they
   resolve into the InsightX mark (better intelligence). The pointer scatters nearby fragments, which settle back.
   The mark is sampled from the page's own #ix-mark symbol. */
(() => {
  const sec = document.getElementById('vision'); if (!sec) return;
  const { reduce, MONO, clamp, SYM } = window.IXP;
  const cv = sec.querySelector('.av-mark'), ctx = cv.getContext('2d'), nEl = sec.querySelector('.av-n');
  const pathEl = document.querySelector('#ix-mark path'); if (!pathEl) return;
  const mark = new Path2D(pathEl.getAttribute('d'));
  let W = 0, H = 0, pts = [], t0 = null, mx = null, my = null, last = performance.now(), shown = -1;

  function build(){
    const mob = W <= 900;
    const mw = mob ? Math.min(W * .7, H * .36 * 33 / 26) : Math.min(W * .38, H * .6 * 33 / 26), mh = mw * 26 / 33;
    const ox = mob ? (W - mw) / 2 : W * .71 - mw / 2, oy = mob ? Math.max(110, H * .3 - mh / 2) : H * .45 - mh / 2;
    const off = document.createElement('canvas'); off.width = Math.ceil(mw); off.height = Math.ceil(mh);
    const o = off.getContext('2d'); o.scale(mw / 33, mh / 26); o.fill(mark);
    const img = o.getImageData(0, 0, off.width, off.height).data;
    const stp = Math.max(4, mw / 78);
    const targets = [];
    for (let y = 0; y < off.height; y += stp) for (let x = 0; x < off.width; x += stp){
      const jx = x + (Math.random() - .5) * stp * .5, jy = y + (Math.random() - .5) * stp * .5;
      const i = ((Math.round(jy) * off.width + Math.round(jx)) * 4) + 3;
      if (img[i] > 110) targets.push([ox + jx, oy + jy]);
    }
    pts = targets.map(([tx, ty]) => ({ tx, ty, sx: Math.random() * W, sy: Math.random() * H, vx: (Math.random() - .5) * 14, vy: (Math.random() - .5) * 10,
      ox: 0, oy: 0, dl: Math.random() * .55, ch: SYM[Math.random() * SYM.length | 0], ph: Math.random() * 6.28, k: 0 }));
  }

  addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  sec.addEventListener('pointerleave', () => { mx = null; });

  const easeOut = x => 1 - Math.pow(1 - x, 3);
  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const r = sec.getBoundingClientRect();
    if (r.top > innerHeight){ t0 = null; return; }                 // below the fold again → re-form next visit
    if (r.bottom < 0) return;
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; build(); }
    if (t0 === null && r.top < innerHeight * .45) t0 = now;
    const T = reduce ? 99 : t0 === null ? 0 : (now - t0) / 1000;
    const t = now / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    let settled = 0;
    for (const p of pts){
      // free drift of the scattered fragment
      p.sx += p.vx * dt; p.sy += p.vy * dt;
      if (p.sx < -10) p.sx = W + 10; else if (p.sx > W + 10) p.sx = -10;
      if (p.sy < -10) p.sy = H + 10; else if (p.sy > H + 10) p.sy = -10;
      p.k = easeOut(clamp((T - p.dl) / 1.9));
      let x = p.sx + (p.tx - p.sx) * p.k, y = p.sy + (p.ty - p.sy) * p.k;
      if (p.k >= 1){ x += Math.sin(t * 1.3 + p.ph) * .5; y += Math.cos(t * 1.1 + p.ph) * .5; }
      // pointer pushes fragments away; they spring back
      if (mx !== null && !reduce){
        const dx = x + p.ox - mx, dy = y + p.oy - my, d2 = dx * dx + dy * dy;
        if (d2 < 8100){ const d = Math.sqrt(d2) || 1, f = (90 - d) / 90 * 60 * dt * 10; p.ox += dx / d * f; p.oy += dy / d * f; }
      }
      p.ox *= 1 - Math.min(1, dt * 3.2); p.oy *= 1 - Math.min(1, dt * 3.2);
      x += p.ox; y += p.oy;
      const disturbed = Math.hypot(p.ox, p.oy) > 3;
      if (p.k > .92 && !disturbed){
        settled++;
        ctx.fillStyle = p.ph < .5 ? '#A091F5' : '#F8F1E7'; ctx.fillRect(x - 1.1, y - 1.1, 2.2, 2.2);
      } else {
        if (Math.random() < dt * 2) p.ch = SYM[Math.random() * SYM.length | 0];
        ctx.fillStyle = disturbed ? 'rgba(160,145,245,.85)' : `rgba(150,150,150,${(.28 + .5 * p.k).toFixed(3)})`;
        ctx.fillText(p.ch, x, y);
      }
    }
    if (nEl && settled !== shown){ shown = settled; nEl.textContent = `${settled} / ${pts.length}`; }
  }
  requestAnimationFrame(frame);
})();
