/* ---------------- About — Vision (pinned): "The Future Is Not More Information. It's Better Intelligence." ----------------
   A two-beat close, centred. Beat 1: hundreds of glyph fragments drift across the screen (more information) under
   "The Future Is Not More Information." Scrolling pulls them — scrubbed, like the home page globe unwrapping — into
   the InsightX mark above the copy. Beat 2: the first line steps back to grey and "It's Better Intelligence."
   resolves; then the closing line and CTAs appear. The pointer scatters nearby fragments, which settle back.
   The mark is sampled from the page's own #ix-mark symbol. */
(() => {
  const sec = document.getElementById('vision'); if (!sec) return;
  const { reduce, MONO, clamp, SYM } = window.IXP;
  const sticky = sec.querySelector('.av-sticky'), cv = sec.querySelector('.av-mark'), ctx = cv.getContext('2d');
  const stage = sec.querySelector('.av-stage'), nEl = sec.querySelector('.av-n');
  const l1 = sec.querySelector('h2 .l1'), l2 = sec.querySelector('h2 .l2');
  const pathEl = document.querySelector('#ix-mark path'); if (!pathEl) return;
  const mark = new Path2D(pathEl.getAttribute('d'));
  let W = 0, H = 0, pts = [], mx = null, my = null, last = performance.now(), shown = -1, played1 = false, played2 = false, conv = 0;

  function build(){
    const mob = W <= 900;
    // offsetTop, not the bounding box: the hand-over may be sliding the stage while this runs
    const top = mob ? 104 : 108, bottom = stage.offsetTop - (mob ? 24 : 36);
    const room = Math.max(90, bottom - top);
    const mh = Math.min(room, mob ? W * .5 * 26 / 33 : W * .28 * 26 / 33), mw = mh * 33 / 26;
    const ox = (W - mw) / 2, oy = top + (room - mh) / 2;
    const off = document.createElement('canvas'); off.width = Math.ceil(mw); off.height = Math.ceil(mh);
    const o = off.getContext('2d'); o.scale(mw / 33, mh / 26); o.fill(mark);
    const img = o.getImageData(0, 0, off.width, off.height).data;
    const stp = Math.max(3.4, mw / 84), targets = [];
    for (let y = 0; y < off.height; y += stp) for (let x = 0; x < off.width; x += stp){
      const jx = x + (Math.random() - .5) * stp * .5, jy = y + (Math.random() - .5) * stp * .5;
      if (img[((Math.round(jy) * off.width + Math.round(jx)) * 4) + 3] > 110) targets.push([ox + jx, oy + jy]);
    }
    pts = targets.map(([tx, ty]) => ({ tx, ty, sx: Math.random() * W, sy: Math.random() * H, vx: (Math.random() - .5) * 16, vy: (Math.random() - .5) * 12,
      ox: 0, oy: 0, dl: Math.random(), ch: SYM[Math.random() * SYM.length | 0], ph: Math.random() * 6.28 }));
  }

  addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  sec.addEventListener('pointerleave', () => { mx = null; });
  if (document.fonts) document.fonts.ready.then(() => { W = 0; });   // the copy block's height decides the mark size

  const easeOut = x => 1 - Math.pow(1 - x, 3);
  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!window.IXP.visible(sec)) return;
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; build(); }
    const P = reduce ? 1 : window.IXP.progress(sec), r = sec.getBoundingClientRect();
    // beats
    if (!played1 && r.top < innerHeight * .5){ played1 = true; window.IXP.play(l1, 100, 1100); }
    const b2 = P > .5, end = P > .66;
    if (b2 && !played2){ played2 = true; window.IXP.play(l2, 150, 1100); }
    sec.classList.toggle('b2', b2); sec.classList.toggle('end', end);
    // convergence follows the scroll (smoothed a touch so a paced step glides)
    const target = clamp((P - .06) / .5);
    conv += (target - conv) * (reduce ? 1 : Math.min(1, dt * 7));

    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    let settled = 0;
    for (const p of pts){
      p.sx += p.vx * dt; p.sy += p.vy * dt;
      if (p.sx < -10) p.sx = W + 10; else if (p.sx > W + 10) p.sx = -10;
      if (p.sy < -10) p.sy = H + 10; else if (p.sy > H + 10) p.sy = -10;
      const k = easeOut(clamp(conv * 1.4 - p.dl * .4));
      let x = p.sx + (p.tx - p.sx) * k, y = p.sy + (p.ty - p.sy) * k;
      if (k >= 1){ x += Math.sin(t * 1.3 + p.ph) * .5; y += Math.cos(t * 1.1 + p.ph) * .5; }
      if (mx !== null && !reduce){
        const dx = x + p.ox - mx, dy = y + p.oy - my, d2 = dx * dx + dy * dy;
        if (d2 < 8100){ const d = Math.sqrt(d2) || 1, f = (90 - d) / 90 * 600 * dt; p.ox += dx / d * f; p.oy += dy / d * f; }
      }
      p.ox *= 1 - Math.min(1, dt * 3.2); p.oy *= 1 - Math.min(1, dt * 3.2);
      x += p.ox; y += p.oy;
      const disturbed = Math.hypot(p.ox, p.oy) > 3;
      if (k > .92 && !disturbed){
        settled++;
        ctx.fillStyle = p.ph < .5 ? '#A091F5' : '#F8F1E7'; ctx.fillRect(x - 1.1, y - 1.1, 2.2, 2.2);
      } else {
        if (Math.random() < dt * 2) p.ch = SYM[Math.random() * SYM.length | 0];
        ctx.fillStyle = disturbed ? 'rgba(160,145,245,.85)' : `rgba(150,150,150,${(.3 + .5 * k).toFixed(3)})`;
        ctx.fillText(p.ch, x, y);
      }
    }
    if (nEl && settled !== shown){ shown = settled; nEl.textContent = `${settled} / ${pts.length}`; }
  }
  requestAnimationFrame(frame);
})();
