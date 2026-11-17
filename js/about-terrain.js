/* ---------------- About hero — the information landscape ----------------
   An animated contour map of a slowly shifting noise field: the world's information as terrain. The densest
   ridges turn violet and the highest peaks get a live marker. The pointer raises a peak of its own, so the
   contours gather into violet rings around it — focus turns noise into something you can read. */
(() => {
  const sec = document.querySelector('.ab-hero'); if (!sec) return;
  const { reduce, MONO, clamp } = window.IXP;
  const cv = sec.querySelector('.ab-terrain'), ctx = cv.getContext('2d');

  // ---- 3D gradient noise (classic Perlin) ----
  const P = new Uint8Array(512);
  { const p = [...Array(256).keys()]; let s = 42; for (let i = 255; i > 0; i--){ s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10), lerp = (a, b, t) => a + t * (b - a);
  const grad = (h, x, y, z) => { const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
  function noise(x, y, z){
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
    return lerp(lerp(lerp(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u), lerp(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u), lerp(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  }

  // marching squares: corner bits tl=8 tr=4 br=2 bl=1 → edge pairs (0 top, 1 right, 2 bottom, 3 left)
  const SEG = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[3, 2], [0, 1]], [[0, 2]], [[0, 3]], [[0, 3]], [[0, 2]], [[0, 3], [2, 1]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];
  const LEVELS = []; for (let l = -.66; l <= .95; l += .085) LEVELS.push(+l.toFixed(3));
  const HOT = .38;                                         // contours above this are violet
  const TAGS = ['SIGNAL CLUSTER', 'EMERGING TOPIC', 'MARKET MOVE', 'POLICY SHIFT', 'NEW RESEARCH', 'SUPPLY RISK'];

  let W = 0, H = 0, S = 14, nx = 0, ny = 0, F = null, mx = null, my = null, px = 0, py = 0, pa = 0, last = performance.now(), frameN = 0;
  let marks = [];                                           // tracked peaks, so labels don't jump around

  function field(t){
    const s = 1 / 330, z = t * .045;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++){
      const x = i * S, y = j * S;
      let v = (noise(x * s, y * s, z) * 1.05 + noise(x * s * 2.4 + 7, y * s * 2.4, z * 1.6) * .32) * 1.5;
      if (pa > .01){ const dx = x - px, dy = y - py; v += pa * .95 * Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120)); }
      F[j * (nx + 1) + i] = v;
    }
  }

  function contours(levels, style, width){
    ctx.beginPath();
    for (const L of levels){
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++){
        const k = j * (nx + 1) + i, a = F[k], b = F[k + 1], c = F[k + nx + 2], d = F[k + nx + 1];
        const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = i * S, y0 = j * S;
        const pt = e => e === 0 ? [x0 + (L - a) / (b - a) * S, y0] : e === 1 ? [x0 + S, y0 + (L - b) / (c - b) * S]
          : e === 2 ? [x0 + (L - d) / (c - d) * S, y0 + S] : [x0, y0 + (L - a) / (d - a) * S];
        for (const [e1, e2] of SEG[idx]){ const p1 = pt(e1), p2 = pt(e2); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); }
      }
    }
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.stroke();
  }

  function peaks(t){
    const found = [];
    const jMax = Math.min(ny - 2, Math.floor(H * (W <= 900 ? .5 : .56) / S));   // keep markers clear of the headline
    for (let j = 6; j < jMax; j += 2) for (let i = 2; i < nx - 12; i += 2){
      const v = F[j * (nx + 1) + i]; if (v < .36) continue;
      let top = true;
      for (let dj = -2; dj <= 2 && top; dj++) for (let di = -2; di <= 2; di++){ if ((di || dj) && F[(j + dj) * (nx + 1) + i + di] > v){ top = false; break; } }
      if (top) found.push({ x: i * S, y: j * S, v });
    }
    found.sort((a, b) => b.v - a.v);
    const pick = [];
    for (const f of found){ if (pick.length >= 4) break; if (pick.every(p => Math.hypot(p.x - f.x, p.y - f.y) > 220) && Math.hypot(f.x - px, f.y - py) > (pa > .3 ? 160 : 0)) pick.push(f); }
    // follow existing markers; new peaks get a new tag and fade in
    marks.forEach(m => m.live = false);
    pick.forEach(p => {
      const m = marks.find(m => !m.live && Math.hypot(m.x - p.x, m.y - p.y) < 90);
      if (m){ m.x += (p.x - m.x) * .3; m.y += (p.y - m.y) * .3; m.v = p.v; m.live = true; }
      else marks.push({ x: p.x, y: p.y, v: p.v, live: true, a: 0, tag: TAGS[Math.random() * TAGS.length | 0] });
    });
    marks.forEach(m => m.a += ((m.live ? 1 : 0) - m.a) * .12);
    marks = marks.filter(m => m.live || m.a > .02);
  }

  function draw(t){
    ctx.clearRect(0, 0, W, H);
    const base = LEVELS.filter(l => l < HOT), hot = LEVELS.filter(l => l >= HOT);
    contours(base.filter((_, i) => i % 3 !== 0), 'rgba(255,255,255,.075)', 1);
    contours(base.filter((_, i) => i % 3 === 0), 'rgba(255,255,255,.2)', 1);
    contours(hot, 'rgba(160,145,245,.75)', 1.1);
    // peak markers
    ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'middle';
    marks.forEach(m => {
      const a = m.a; if (a < .02) return;
      ctx.strokeStyle = `rgba(160,145,245,${a})`; ctx.lineWidth = 1; ctx.strokeRect(m.x - 4.5, m.y - 4.5, 9, 9);
      ctx.fillStyle = `rgba(160,145,245,${a})`; ctx.fillRect(m.x - 1.5, m.y - 1.5, 3, 3);
      ctx.strokeStyle = `rgba(255,255,255,${.4 * a})`; ctx.beginPath(); ctx.moveTo(m.x + 6, m.y - 6); ctx.lineTo(m.x + 26, m.y - 26); ctx.lineTo(m.x + 40, m.y - 26); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${.9 * a})`; ctx.fillText(m.tag, m.x + 46, m.y - 26);
      ctx.fillStyle = `rgba(146,146,146,${.9 * a})`; ctx.fillText('DENSITY ' + clamp(m.v / 1.2).toFixed(2), m.x + 46, m.y - 12);
    });
    // pointer focus readout
    if (pa > .05){
      ctx.strokeStyle = `rgba(255,255,255,${.5 * pa})`; ctx.beginPath(); ctx.arc(px, py, 3, 0, 6.283); ctx.stroke();
      ctx.fillStyle = `rgba(160,145,245,${pa})`; ctx.fillText('FOCUS', px + 12, py + 1);
    }
  }

  addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  sec.addEventListener('pointerleave', () => { mx = null; });

  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!window.IXP.visible(sec) && !cv.dataset.live) return;     // .dataset.live: held on screen by the pull-back into the mission
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; S = Math.max(12, Math.round(W / 115)); nx = Math.ceil(W / S); ny = Math.ceil(H / S); F = new Float32Array((nx + 1) * (ny + 1)); marks = []; frameN = 0; }
    const t = now / 1000;
    // pointer peak eases in/out and trails the cursor; without a pointer it wanders on its own
    const inside = mx !== null && my > 0 && my < H;
    const tx = inside ? mx : W * (.62 + .2 * Math.sin(t * .13)), ty = inside ? my : H * (.36 + .12 * Math.sin(t * .19 + 1));
    if (!px && !py){ px = tx; py = ty; }
    px += (tx - px) * Math.min(1, dt * 4); py += (ty - py) * Math.min(1, dt * 4);
    pa += ((inside ? 1 : .55) - pa) * Math.min(1, dt * 2.5);
    if (reduce && frameN > 1) return;
    if (frameN++ % 2 === 0 || reduce){ field(reduce ? 12 : t); peaks(t); }   // contours update at ~30fps
    draw(t);
  }
  requestAnimationFrame(frame);
})();
