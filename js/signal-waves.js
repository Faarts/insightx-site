/* ---------------- Section 5 background: static signal waves lit by a cursor "torch" ----------------
   Dozens of jittering wave lines sit almost invisible in the dark; around the pointer a soft light picks them out
   (white core, faint violet falloff) and nudges them apart. On touch screens the light drifts on its own. */
(() => {
  const pin = document.querySelector('.s4-pin'), cv = pin && pin.querySelector('.s5-bg');
  if (!cv) return;
  const g = cv.getContext('2d'), lit = document.createElement('canvas'), lg = lit.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, touch = matchMedia('(hover: none)').matches;
  let W = 0, H = 0, dpr = 1, mx = null, my = null, lx = 0, ly = 0, li = 0, lastMove = -1e9, raf = 0;
  function fit(){
    const w = pin.clientWidth, h = pin.clientHeight, d = Math.min(2, devicePixelRatio || 1);
    if (w === W && h === H && d === dpr) return;
    W = w; H = h; dpr = d;
    for (const c of [cv, lit]){ c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    lx = W * .5; ly = H * .5;
  }
  addEventListener('pointermove', e => {
    const r = pin.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom){ mx = null; return; }
    mx = e.clientX - r.left; my = e.clientY - r.top; lastMove = performance.now();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { mx = null; });
  function frame(now){
    raf = requestAnimationFrame(frame);
    const t5 = parseFloat(pin.style.getPropertyValue('--t5')) || 0;
    const r = pin.getBoundingClientRect();
    if (t5 < .01 || r.bottom < 0 || r.top > innerHeight) return;
    fit();
    const t = now / 1000;
    // light target: the pointer, or (touch / idle) a slow wander
    let tx, ty, ti;
    if (mx !== null && now - lastMove < 6000){ tx = mx; ty = my; ti = 1; }
    else if (touch){ tx = W * (.5 + .34 * Math.sin(t * .23)); ty = H * (.5 + .3 * Math.sin(t * .31 + 1.3)); ti = .7; }
    else { tx = lx; ty = ly; ti = 0; }
    lx += (tx - lx) * .12; ly += (ty - ly) * .12; li += (ti - li) * .06;
    const gap = H > 700 ? 15 : 13, n = Math.ceil(H / gap) + 1, step = 6, R = Math.max(240, Math.min(W, H) * .42);
    const path = new Path2D();
    for (let i = 0; i < n; i++){
      const y0 = (i + .5) * gap;
      const band = Math.pow(Math.max(0, Math.sin(i * .37 + t * .17)), 2);           // some lines carry a strong "signal"
      const amp = 2 + 13 * band;
      for (let x = -step; x <= W + step; x += step){
        let y = y0 + Math.sin(x * .0042 + i * .7 + t * .9) * Math.sin(x * .0013 - t * .35 + i * .31) * amp
                   + (reduce ? 0 : (Math.random() - .5) * (1.4 + band * 3.2));          // static jitter
        const dx = x - lx, dy = y0 - ly, dl = Math.hypot(dx, dy);
        y += dy / Math.sqrt(dl * dl + 3600) * li * 18 * Math.exp(-(dl * dl) / (R * R * .35));             // light pushes the lines apart
        x === -step ? path.moveTo(x, y) : path.lineTo(x, y);
      }
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.11)'; g.stroke(path);
    if (li > .01){
      // lit copy of the same lines, masked by the light's falloff
      lg.setTransform(dpr, 0, 0, dpr, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H);
      lg.lineWidth = 1.1; lg.strokeStyle = 'rgba(255,255,255,.62)'; lg.stroke(path);
      lg.globalCompositeOperation = 'destination-in';
      const m = lg.createRadialGradient(lx, ly, 0, lx, ly, R);
      m.addColorStop(0, `rgba(255,255,255,${li})`); m.addColorStop(.35, `rgba(255,255,255,${li * .55})`); m.addColorStop(1, 'rgba(255,255,255,0)');
      lg.fillStyle = m; lg.fillRect(0, 0, W, H);
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(lit, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const glow = g.createRadialGradient(lx, ly, 0, lx, ly, R * 1.1);
      glow.addColorStop(0, `rgba(160,145,245,${.08 * li})`); glow.addColorStop(1, 'rgba(160,145,245,0)');
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
    }
  }
  raf = requestAnimationFrame(frame);
})();
