/* ---------------- About — "The Technology Behind Intelligence." (pinned) ----------------
   An isometric stack of the four technology layers, bottom → top:
   Blockchain Infrastructure · Multi-Source Data Integration · AI Research & Processing · Intelligent Agent Framework.
   The stack assembles when the section arrives; scrolling walks the list (in the brief's order) and the active
   layer opens up — the layers above it lift away so its live surface is visible:
   research = documents being scanned and key lines extracted · data = sources streaming into one hub ·
   agents = a working agent graph · chain = blocks being appended. Clicking a list row jumps to that layer. */
(() => {
  const sec = document.getElementById('technology'); if (!sec) return;
  const { reduce, MONO, clamp, ease } = window.IXP;
  const box = sec.querySelector('.at-stack'), cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
  const items = [...sec.querySelectorAll('.at-list li')], dots = [...sec.querySelectorAll('.at-steps i')];
  const LAYERS = [
    { key: 'chain', name: 'Blockchain infrastructure' },
    { key: 'data', name: 'Multi-source data' },
    { key: 'research', name: 'AI research & processing' },
    { key: 'agents', name: 'Agent framework' },
  ];
  const S = LAYERS.map(() => ({ open: 0, on: 0 }));
  const START = .06;                                          // progress before the first step
  let W = 0, H = 0, a = 0, gap = 0, th = 0, E = 0, cx = 0, top = 0, mob = false;
  let arrived = null, cur = -1;

  // ---- static content of each surface (uv space: −100 … 100) ----
  let sd = 5; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const ROWS = Array.from({ length: 11 }, (_, j) => ({ v: -72 + j * 14.4, len: 70 + rnd() * 90, key: [2, 5, 8].includes(j) }));
  const SRC = [[-86, -62, 'API'], [-86, 34, 'NEWS'], [-30, -86, 'DOCS'], [52, -86, 'CHAIN'], [-60, 86, 'SOCIAL']];
  const HUB = [34, 30];
  const AG = [[-58, -50, 'RESEARCH'], [8, -64, 'MONITOR'], [62, -24, 'ANALYSIS'], [-46, 34, 'CORE'], [40, 52, 'EXECUTE'], [-80, 80], [84, 84], [-10, 84], [86, -76]];
  const AGE = [[3, 0], [3, 1], [3, 2], [3, 4], [0, 1], [1, 2], [2, 4], [4, 6], [3, 5], [4, 7], [2, 8], [5, 7]];
  const HEX = '0123456789abcdef';
  const hash = n => { let s = (n * 2654435761) >>> 0, o = ''; for (let i = 0; i < 4; i++){ o += HEX[s & 15]; s >>>= 4; } return o; };

  function layout(){
    mob = innerWidth <= 900;
    a = mob ? Math.min(W * .19, H * .2) : Math.min(W * .165, H * .17);
    gap = a * .5; th = Math.max(7, a * .07); E = a * 1.15;
    const half = 1.732 * a;
    cx = mob ? W / 2 : Math.max(half + 8, Math.min(W - half - 230, W * .42));
    const total = 2 * a + 3 * gap + E + th;
    top = Math.max(8, (H - total) / 2) + a;                 // centre y of the top plate when nothing is open
  }

  // iso: (u, v) on a plate whose centre is (px, py) → screen
  const P = (px, py, u, v) => [px + (u - v) * .00866 * a, py + (u + v) * .005 * a];
  function onFace(px, py, fn){ ctx.save(); ctx.transform(.00866 * a, .005 * a, -.00866 * a, .005 * a, px, py); fn(100 / a); ctx.restore(); }

  function surface(key, px, py, t, al){
    onFace(px, py, px1 => {
      ctx.lineWidth = px1;
      if (key === 'research'){
        const s = ((t * .32) % 1.25) * 200 - 100;
        ROWS.forEach(r => {
          const u0 = -80, u1 = u0 + r.len;
          ctx.strokeStyle = `rgba(255,255,255,${(.22 * al).toFixed(3)})`; ctx.lineWidth = 3.2 * px1;
          ctx.beginPath(); ctx.moveTo(u0, r.v); ctx.lineTo(u1, r.v); ctx.stroke();
          if (r.key && s > u0){ ctx.strokeStyle = `rgba(160,145,245,${(.95 * al).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(u0, r.v); ctx.lineTo(Math.min(s, u1), r.v); ctx.stroke();
            if (s > u1){ ctx.fillStyle = `rgba(160,145,245,${al.toFixed(3)})`; ctx.fillRect(u1 + 6, r.v - 3, 6, 6); } }
        });
        if (s < 100){ ctx.fillStyle = `rgba(160,145,245,${(.12 * al).toFixed(3)})`; ctx.fillRect(s - 14, -86, 14, 172);
          ctx.fillStyle = `rgba(160,145,245,${(.8 * al).toFixed(3)})`; ctx.fillRect(s, -86, 1.4 * px1, 172); }
      } else if (key === 'data'){
        SRC.forEach(([u, v, lb], i) => {
          ctx.strokeStyle = `rgba(255,255,255,${(.16 * al).toFixed(3)})`; ctx.setLineDash([3, 4]);
          ctx.beginPath(); ctx.moveTo(u, v); ctx.lineTo(HUB[0], HUB[1]); ctx.stroke(); ctx.setLineDash([]);
          for (let k = 0; k < 3; k++){
            const q = (t * .45 + k / 3 + i * .19) % 1;
            ctx.fillStyle = `rgba(160,145,245,${(al * (.4 + .6 * q)).toFixed(3)})`;
            ctx.fillRect(u + (HUB[0] - u) * q - 2.5, v + (HUB[1] - v) * q - 2.5, 5, 5);
          }
          ctx.strokeStyle = `rgba(255,255,255,${(.6 * al).toFixed(3)})`; ctx.strokeRect(u - 5, v - 5, 10, 10);
          ctx.fillStyle = `rgba(200,203,208,${(.8 * al).toFixed(3)})`; ctx.font = `400 9px ${MONO}`; ctx.fillText(lb, u + 9, v - 7);
        });
        const pulse = (t % 1.4) / 1.4;
        ctx.strokeStyle = `rgba(160,145,245,${(al * (1 - pulse) * .8).toFixed(3)})`; ctx.beginPath(); ctx.arc(HUB[0], HUB[1], 10 + pulse * 30, 0, 6.283); ctx.stroke();
        ctx.fillStyle = `rgba(160,145,245,${al.toFixed(3)})`; ctx.beginPath(); ctx.arc(HUB[0], HUB[1], 7, 0, 6.283); ctx.fill();
      } else if (key === 'agents'){
        AGE.forEach(([i, j], k) => {
          const A = AG[i], B = AG[j];
          ctx.strokeStyle = `rgba(255,255,255,${(.22 * al).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
          const q = (t * (.3 + (k % 3) * .08) + k * .27) % 1, fw = k % 2 ? q : 1 - q;
          ctx.fillStyle = `rgba(160,145,245,${al.toFixed(3)})`; ctx.fillRect(A[0] + (B[0] - A[0]) * fw - 2.5, A[1] + (B[1] - A[1]) * fw - 2.5, 5, 5);
        });
        AG.forEach(([u, v, lb], i) => {
          const major = !!lb, r = i === 3 ? 11 : major ? 8 : 4;
          ctx.fillStyle = '#060608'; ctx.strokeStyle = major ? `rgba(160,145,245,${al.toFixed(3)})` : `rgba(255,255,255,${(.5 * al).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(u, v, r, 0, 6.283); ctx.fill(); ctx.stroke();
          if (i === 3){ ctx.fillStyle = `rgba(160,145,245,${al.toFixed(3)})`; ctx.beginPath(); ctx.arc(u, v, 4, 0, 6.283); ctx.fill(); }
          if (lb){ ctx.fillStyle = `rgba(200,203,208,${(.85 * al).toFixed(3)})`; ctx.font = `400 9px ${MONO}`; ctx.fillText(lb, u + r + 5, v + 3); }
        });
      } else if (key === 'chain'){
        const per = 1.6, n = Math.floor(t / per), q = reduce ? 1 : ease(clamp((t % per) / .7));
        // blocks march along the diagonal; the newest slides in at the front
        const bp = k => [62 - k * 36 + (1 - q) * 36, 36 - k * 15 + (1 - q) * 15];
        ctx.strokeStyle = `rgba(160,145,245,${(.5 * al).toFixed(3)})`; ctx.beginPath();
        for (let k = 0; k < 4; k++){ const [u, v] = bp(k), [u2, v2] = bp(k + 1); ctx.moveTo(u, v); ctx.lineTo(u2, v2); } ctx.stroke();
        for (let k = 4; k >= 0; k--){
          const id = n - k, [u, v] = bp(k);
          const al2 = al * (k === 0 ? q : k === 4 ? 1 - q : 1);
          if (al2 <= .01) continue;
          ctx.fillStyle = '#060608'; ctx.fillRect(u - 15, v - 15, 30, 30);
          ctx.strokeStyle = k === 0 ? `rgba(160,145,245,${al2.toFixed(3)})` : `rgba(255,255,255,${(.55 * al2).toFixed(3)})`; ctx.strokeRect(u - 15, v - 15, 30, 30);
          ctx.fillStyle = k === 0 ? `rgba(160,145,245,${al2.toFixed(3)})` : `rgba(200,203,208,${(.7 * al2).toFixed(3)})`;
          ctx.font = `400 7px ${MONO}`; ctx.fillText('#' + hash(id), u - 12, v + 3);
        }
        // pending transactions flowing into the newest block
        for (let k = 0; k < 6; k++){
          const z = (t * .5 + k / 6) % 1;
          ctx.fillStyle = `rgba(255,255,255,${(.5 * al * (1 - z)).toFixed(3)})`; ctx.fillRect(62 + 30 - z * 30, 36 + 52 - z * 44, 3, 3);
        }
      }
    });
  }

  function plate(i, px, py, t, al, on){
    const L = P(px, py, -100, 100), B = P(px, py, 100, 100), R = P(px, py, 100, -100), T = P(px, py, -100, -100);
    const edge = on > .02 ? `rgba(${Math.round(255 - 95 * on)},${Math.round(255 - 110 * on)},${Math.round(255 - 10 * on)},${(.3 + .6 * on) * al})` : `rgba(255,255,255,${(.3 * al).toFixed(3)})`;
    // sides
    ctx.fillStyle = `rgba(6,6,8,${al})`; ctx.strokeStyle = `rgba(255,255,255,${(.16 * al).toFixed(3)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B[0], B[1] + th); ctx.lineTo(L[0], L[1] + th); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(R[0], R[1] + th); ctx.lineTo(B[0], B[1] + th); ctx.closePath(); ctx.fill(); ctx.stroke();
    // top
    ctx.fillStyle = `rgba(10,10,13,${(.96 * al).toFixed(3)})`; ctx.strokeStyle = edge;
    ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(L[0], L[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    // faint grid
    onFace(px, py, px1 => {
      ctx.lineWidth = px1; ctx.strokeStyle = `rgba(255,255,255,${(.05 * al).toFixed(3)})`;
      ctx.beginPath(); for (let g = -50; g <= 50; g += 50){ ctx.moveTo(g, -96); ctx.lineTo(g, 96); ctx.moveTo(-96, g); ctx.lineTo(96, g); } ctx.stroke();
    });
    surface(LAYERS[i].key, px, py, t, al * (.18 + .82 * on));
    return { L, B, R };
  }

  function frame(now){
    requestAnimationFrame(frame);
    if (!window.IXP.visible(sec)) { if (sec.getBoundingClientRect().top > innerHeight) arrived = null; return; }
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; layout(); }
    if (!W) return;
    const t = now / 1000, P0 = window.IXP.progress(sec);
    if (arrived === null && sec.getBoundingClientRect().top < innerHeight * .5) arrived = now;
    const asm = reduce ? 1 : arrived === null ? 0 : clamp((now - arrived) / 1500);

    // which list item is active (brief order) and how far along it we are
    const steps = clamp((P0 - START) / (1 - START)) * items.length;
    const k = Math.min(items.length - 1, Math.floor(steps)), frac = clamp(steps - k);
    if (k !== cur){ cur = k; items.forEach((li, i) => li.classList.toggle('on', i === k)); dots.forEach((s, i) => s.classList.toggle('on', i === k)); }
    items.forEach((li, i) => li.style.setProperty('--p', i < k ? 1 : i === k ? frac.toFixed(3) : 0));
    const activeLayer = +items[k].dataset.layer;

    S.forEach((s, i) => {
      const target = i === activeLayer ? 1 : 0;
      s.on += (target - s.on) * (reduce ? 1 : .09);
      s.open += ((i === activeLayer && i < LAYERS.length - 1 ? 1 : 0) - s.open) * (reduce ? 1 : .08);
    });

    ctx.clearRect(0, 0, W, H);
    // stack, bottom → top; every layer above an open one lifts by E
    let lift = 0; const pos = [];
    for (let i = 0; i < LAYERS.length; i++){
      if (i > 0) lift += S[i - 1].open * E;
      const d = ease(clamp(asm * 1.6 - i * .2));
      pos.push([cx, top + (LAYERS.length - 1 - i) * gap + E - lift - (1 - d) * 60, d]);
    }
    for (let i = 0; i < LAYERS.length; i++){
      const [px, py, d] = pos[i]; if (d <= 0) continue;
      // pillars from the plate below
      if (i > 0 && pos[i - 1][2] > 0){
        const [qx, qy] = pos[i - 1];
        ctx.strokeStyle = `rgba(160,145,245,${(.35 * d).toFixed(3)})`; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
        [[-100, 100], [100, 100], [100, -100]].forEach(([u, v]) => { const A = P(px, py, u, v), B = P(qx, qy, u, v);
          ctx.beginPath(); ctx.moveTo(A[0], A[1] + th); ctx.lineTo(B[0], B[1]); ctx.stroke(); });
        ctx.setLineDash([]);
      }
      const c = plate(i, px, py, t, d, S[i].on);
      // label with a leader line from the right corner
      if (!mob){
        const lx = cx + 1.732 * a + 34, ly = c.R[1] + th / 2, on = S[i].on;
        ctx.strokeStyle = `rgba(255,255,255,${((.18 + .5 * on) * d).toFixed(3)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.R[0] + 6, ly); ctx.lineTo(lx - 8, ly); ctx.stroke();
        ctx.font = `400 11px ${MONO}`; ctx.textBaseline = 'middle';
        ctx.fillStyle = on > .5 ? `rgba(160,145,245,${d})` : `rgba(95,95,95,${d})`; ctx.fillRect(lx, ly - 3, 6, 6);
        ctx.fillStyle = on > .5 ? `rgba(255,255,255,${d})` : `rgba(130,130,130,${d})`; ctx.fillText(LAYERS[i].name.toUpperCase(), lx + 16, ly);
        ctx.textBaseline = 'alphabetic';
      }
    }
  }
  requestAnimationFrame(frame);

  // click a row → scroll to that step
  items.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    const span = sec.offsetHeight - innerHeight;
    const y = sec.offsetTop + (START + (i + .05) / items.length * (1 - START)) * span;
    window.ppScrollTo ? window.ppScrollTo(y) : scrollTo({ top: y, behavior: 'smooth' });
  }));
})();
