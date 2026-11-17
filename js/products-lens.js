/* ---------------- Flagship intro — "Think beyond search." ----------------
   An endless wall of search results scrolls by, almost invisible. Under the InsightX lens (follows the pointer,
   wanders on its own on touch screens) the same results light up: key facts are marked and linked to each other —
   search results turning into understanding. */
(() => {
  const cv = document.querySelector('.pf-lens'); if (!cv) return;
  const { reduce, MONO, SANS, clamp } = window.IXP;
  const sec = cv.closest('section'), ctx = cv.getContext('2d');
  const lit = document.createElement('canvas'), lg = lit.getContext('2d');
  const touch = matchMedia('(hover: none)').matches;
  const pick = a => a[Math.random() * a.length | 0], rnd = (a, b) => a + Math.random() * (b - a);
  const TITLES = ['10 things to know about supply chains', 'Sponsored · Best research tools 2026', 'What analysts say about energy demand',
    'Forum: is this dataset accurate?', 'Report summary (PDF, 84 pages)', 'Markets react to new data', 'Semiconductor industry — overview',
    'How to track emerging trends', 'Q3 earnings call transcript', 'Policy update: new trade rules', 'Opinion: the data says otherwise',
    'Climate risk in global logistics', 'Live: developing story', 'Study finds link between costs and demand', 'Page 2 of 4,180,000 results'];
  const URLS = ['news-wire', 'research-hub', 'data-portal', 'gov-filings', 'market-desk', 'forum', 'journal', 'blog', 'briefing-room', 'stats-office'];
  const KEYS = ['demand ↑', 'cost', 'risk', 'policy', 'supply', 'trend', 'signal', 'source ✓', 'pattern', 'region'];
  let W = 0, H = 0, cards = [], colW = 300, rowH = 92, cols = 0, rows = 0;
  let mx = null, my = null, lastMove = -1e9, lx = 0, ly = 0, li = 0, last = performance.now(), off = 0;

  function build(){
    colW = W < 700 ? 230 : 300; rowH = W < 700 ? 82 : 92;
    cols = Math.ceil(W / colW) + 1; rows = Math.ceil(H / rowH) + 2;
    cards = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cards.push(newCard(c, r));
    lx = W * .5; ly = H * .55;
  }
  function newCard(c, r){
    return { c, r, jx: rnd(0, 26), title: pick(TITLES), url: `${pick(URLS)}.com › ${pick(['reports', 'live', 'p', 'data', 'article'])}`,
      lines: [rnd(.6, 1), rnd(.4, .9)], key: Math.random() < .55 ? pick(KEYS) : null, kx: rnd(.05, .55) };
  }

  function drawCards(g, bright){
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const pts = [];
    for (const k of cards){
      const x = k.c * colW + k.jx - colW * .35 + (k.r % 2) * colW * .5, y = k.r * rowH - off;
      if (y < -rowH || y > H + rowH) continue;
      const cw = colW - 56;
      g.font = `10px ${MONO}`; g.fillStyle = bright ? 'rgba(160,145,245,.75)' : 'rgba(255,255,255,.1)'; g.fillText(k.url, x, y + 14);
      g.font = `13px ${SANS}`; g.fillStyle = bright ? '#fff' : 'rgba(255,255,255,.1)';
      g.fillText(k.title.length > 34 ? k.title.slice(0, 33) + '…' : k.title, x, y + 32);
      k.lines.forEach((l, i) => { g.fillStyle = bright ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.06)'; g.fillRect(x, y + 42 + i * 9, cw * l, 3); });
      if (bright && k.key){
        const kx = x + cw * k.kx, ky = y + 46;
        g.font = `10px ${MONO}`; const tw = g.measureText(k.key.toUpperCase()).width + 10;
        g.fillStyle = '#A091F5'; g.fillRect(kx, ky - 10, tw, 15); g.fillStyle = '#000'; g.fillText(k.key.toUpperCase(), kx + 5, ky + 1);
        pts.push([kx + tw / 2, ky - 3]);
      }
    }
    if (bright && pts.length > 1){
      // link marked facts to their nearest neighbours: the "connections" InsightX makes between sources
      g.strokeStyle = 'rgba(160,145,245,.7)'; g.lineWidth = 1; g.setLineDash([2, 3]);
      g.beginPath();
      pts.forEach((p, i) => {
        const near = pts.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])]).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]).slice(0, 2);
        near.forEach(([j, d]) => { if (d < 260){ g.moveTo(p[0], p[1]); g.lineTo(pts[j][0], pts[j][1]); } });
      });
      g.stroke(); g.setLineDash([]);
    }
  }

  addEventListener('pointermove', e => {
    const r = sec.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom){ mx = null; return; }
    mx = e.clientX - r.left; my = e.clientY - r.top; lastMove = performance.now();
  }, { passive: true });

  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!window.IXP.visible(sec)) return;
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; build(); const d = Math.min(2, devicePixelRatio || 1); lit.width = cv.width; lit.height = cv.height; }
    if (!W) return;
    const t = now / 1000;
    if (!reduce){
      off += dt * 14;
      if (off >= rowH){ off -= rowH; cards.forEach(k => { k.r--; if (k.r < 0){ Object.assign(k, newCard(k.c, rows - 1)); } }); }
    }
    // lens target: the pointer, otherwise a slow wander through the middle band
    let tx, ty, ti;
    if (mx !== null && now - lastMove < 5000 && !touch){ tx = mx; ty = my; ti = 1; }
    else { tx = W * (.5 + .3 * Math.sin(t * .21)); ty = H * (.52 + .12 * Math.sin(t * .33 + 1.1)); ti = .9; }
    lx += (tx - lx) * .1; ly += (ty - ly) * .1; li += (ti - li) * .05;
    const LR = Math.max(150, Math.min(W, H) * (W < 700 ? .3 : .24));

    ctx.clearRect(0, 0, W, H);
    drawCards(ctx, false);
    // lit copy, masked to the lens
    const d = Math.min(2, devicePixelRatio || 1);
    lg.setTransform(d, 0, 0, d, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H);
    lg.fillStyle = 'rgba(0,0,0,.82)'; lg.beginPath(); lg.arc(lx, ly, LR, 0, 6.283); lg.fill();
    drawCards(lg, true);
    lg.globalCompositeOperation = 'destination-in';
    const m = lg.createRadialGradient(lx, ly, LR * .55, lx, ly, LR);
    m.addColorStop(0, `rgba(0,0,0,${li})`); m.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = m; lg.fillRect(0, 0, W, H);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lit, 0, 0); ctx.restore();

    // lens ring + ticks + readout
    ctx.globalAlpha = li;
    ctx.strokeStyle = 'rgba(160,145,245,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(lx, ly, LR * .82, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + t * .2; ctx.beginPath(); ctx.moveTo(lx + Math.cos(a) * LR * .78, ly + Math.sin(a) * LR * .78); ctx.lineTo(lx + Math.cos(a) * LR * .88, ly + Math.sin(a) * LR * .88); ctx.stroke(); }
    const ax = lx + LR * .58, ay = ly - LR * .58;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 26, ay - 20); ctx.stroke();
    ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
    const label = 'INSIGHTX LENS', sub = `${3 + (Math.floor(t / 2.5) % 4)} PATTERNS · ${12 + (Math.floor(t * 1.3) % 30)} SOURCES`;
    const tw = Math.max(ctx.measureText(label).width, ctx.measureText(sub).width) + 16;
    ctx.fillStyle = 'rgba(0,0,0,.86)'; ctx.fillRect(ax + 26, ay - 56, tw, 36);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.strokeRect(ax + 26.5, ay - 55.5, tw - 1, 35);
    ctx.fillStyle = '#fff'; ctx.fillText(label, ax + 34, ay - 41); ctx.fillStyle = '#A091F5'; ctx.fillText(sub, ax + 34, ay - 27);
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})();
