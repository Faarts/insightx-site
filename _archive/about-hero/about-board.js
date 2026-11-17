/* ---------------- About hero — split-flap information board ----------------
   The hero is a departure-board of split-flap cells. On load every flap churns through random characters and
   raw fragments (filings, rumours, prices, transactions…); then the headline locks in letter by letter —
   "Building a More Intelligent" in grey, "Way to Understand the World." in white. The rows around it stay a
   live feed: every few seconds one re-flips to a new fragment. Running the pointer over the board flips the
   cells under it, which then fall back into place. The real <h1> is in the DOM (visually hidden). */
(() => {
  const sec = document.querySelector('.ab-hero'); if (!sec || sec.dataset.hero !== 'board') return;
  const { reduce, MONO } = window.IXP;
  const cv = sec.querySelector('.ab-board'), ctx = cv.getContext('2d'), foot = sec.querySelector('.ab-foot');
  const L1 = 'BUILDING A MORE INTELLIGENT', L2 = 'WAY TO UNDERSTAND THE WORLD.';
  const FRAG = ['Q3 FILING P.14', 'TX 0X9F3A..C21', 'UNVERIFIED RUMOUR', 'SENTIMENT +0.4', 'PRICE FEED 0.0421', 'THREAD 4/12',
    'PRESS RELEASE', 'POLL N=1,204', 'SATELLITE TILE 88', 'TRANSCRIPT 01:22', 'DATASET.CSV', 'FOOTNOTE [32]', 'RATE CUT?',
    'WALLET 0X71..', 'EARNINGS CALL', 'PATENT FILING', 'POLICY DRAFT', 'SHIP MANIFEST', 'UPDATED 2M AGO', 'RESEARCH PAPER',
    'DUPLICATE STORY', 'FORUM POST', 'WEATHER ALERT', 'OCR SCAN', 'RSS ITEM', 'TRANSLATION JP'];
  const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@<>/=+*';
  const FLIP = .085;                                    // seconds per flap
  const COL = { h1: '#8f8f8f', h2: '#ffffff', dot: '#A091F5', noise: '#4d4d52', blank: '#4d4d52' };
  const rg = () => GL[Math.random() * GL.length | 0];
  let W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, gap = 4, x0 = 0, y0 = 0, cells = [], noiseRows = [];
  let intro = 0, last = performance.now(), nextFeed = 0, mx = null, my = null, hoverIdx = -1;

  function wrap(text, n){
    const out = []; let line = '';
    text.split(' ').forEach(w => { if (!line) line = w; else if ((line + ' ' + w).length <= n) line += ' ' + w; else { out.push(line); line = w; } });
    if (line) out.push(line); return out;
  }

  function build(t){
    const mob = W <= 900, r = sec.getBoundingClientRect();
    const g = foot.getBoundingClientRect().left - r.left;
    const top = mob ? 84 : 96, bottom = foot.getBoundingClientRect().top - r.top - (mob ? 22 : 34);
    const avail = W - 2 * g, availH = Math.max(120, bottom - top);
    gap = mob ? 3 : 5;
    const minCols = 12;                                  // the longest word, INTELLIGENT, plus one
    const asp = mob ? 1.5 : 1.38;                       // flap height / width
    let target = mob ? Math.max(26, Math.min(64, W / 13)) : Math.max(46, Math.min(78, W / 21));
    let lines;
    for (let pass = 0; pass < 3; pass++){
      cols = Math.max(minCols, Math.floor((avail + gap) / (target + gap)));
      lines = [...wrap(L1, cols).map(s => [s, 'h1']), ...wrap(L2, cols).map(s => [s, 'h2'])];
      cw = (avail - (cols - 1) * gap) / cols; ch = cw * asp;
      const need = lines.length + (mob ? 2 : 1);
      if ((ch + gap) * need - gap <= availH) break;
      target = ((availH + gap) / need - gap) / asp;     // too tall: smaller cells, more columns
    }
    // the headline plus one live-feed row above and below — keeps the headline the thing you read
    rows = Math.max(lines.length, Math.min(lines.length + 2, Math.floor((availH + gap) / (ch + gap))));
    x0 = g + (avail - (cols * cw + (cols - 1) * gap)) / 2;
    y0 = top + (availH - (rows * (ch + gap) - gap)) / 2;
    const r0 = Math.max(0, Math.floor((rows - lines.length) / 2) - (rows - lines.length > 2 ? 1 : 0));

    cells = []; noiseRows = [];
    for (let rI = 0; rI < rows; rI++){
      const hl = lines[rI - r0];
      let text = '', kind = 'noise';
      if (hl){ text = hl[0]; kind = hl[1]; }
      else { noiseRows.push(rI); text = fragFor(); }
      const off = hl ? 0 : Math.random() * Math.max(0, cols - text.length) | 0;
      for (let c = 0; c < cols; c++){
        const chr = (hl ? text[c] : text[c - off]) || ' ';
        const k = chr === ' ' ? 'blank' : hl && chr === '.' && c === text.length - 1 ? 'dot' : kind;
        const land = hl ? .9 + c * .045 + (rI - r0) * .22 + Math.random() * .25 : .3 + Math.random() * 1.4;
        cells.push({ r: rI, c, tgt: chr, kind: k, cur: reduce ? chr : rg(), nxt: ' ', f: -1, land: t + (reduce ? 0 : land) });
      }
    }
  }
  function fragFor(){ return FRAG[Math.random() * FRAG.length | 0].slice(0, cols); }

  function feed(t){
    if (!noiseRows.length) return;
    const rI = noiseRows[Math.random() * noiseRows.length | 0], text = fragFor();
    const off = Math.random() * Math.max(0, cols - text.length) | 0;
    cells.filter(c => c.r === rI).forEach(c => {
      const chr = text[c.c - off] || ' ';
      if (chr === c.tgt && chr === ' ' && Math.random() < .7) return;
      c.tgt = chr; c.kind = chr === ' ' ? 'blank' : 'noise'; c.land = t + .15 + c.c * .035 + Math.random() * .2;
    });
  }

  function step(t, dt){
    cells.forEach(c => {
      if (c.f >= 0){ c.f += dt / FLIP; if (c.f >= 1){ c.cur = c.nxt; c.f = -1; } return; }
      if (t < c.land){ c.nxt = Math.random() < .12 ? ' ' : rg(); c.f = 0; }
      else if (c.cur !== c.tgt){ c.nxt = c.tgt; c.f = 0; }
    });
  }

  function glyph(chr, x, y, color){
    if (chr === ' ') return;
    ctx.fillStyle = color; ctx.fillText(chr, x + cw / 2, y + ch / 2 + ch * .03);
  }
  function half(chr, x, y, color, topHalf){
    ctx.save(); ctx.beginPath(); ctx.rect(x, topHalf ? y : y + ch / 2, cw, ch / 2); ctx.clip(); glyph(chr, x, y, color); ctx.restore();
  }
  function plate(x, y, h, topHalf, shade){
    ctx.fillStyle = topHalf ? '#141417' : '#101013'; ctx.fillRect(x, y, cw, h);
    if (shade > 0){ ctx.fillStyle = `rgba(0,0,0,${shade.toFixed(3)})`; ctx.fillRect(x, y, cw, h); }
  }

  function draw(t){
    ctx.clearRect(0, 0, W, H);
    ctx.font = `500 ${(ch * .62).toFixed(1)}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const hov = hoverIdx >= 0 ? cells[hoverIdx] : null;
    cells.forEach(cell => {
      const x = x0 + cell.c * (cw + gap), y = y0 + cell.r * (ch + gap), mid = y + ch / 2;
      const settled = t >= cell.land;
      const color = settled || cell.kind === 'blank' ? COL[cell.kind] : cell.kind === 'h2' || cell.kind === 'dot' ? '#d0d0d4' : cell.kind === 'h1' ? '#7a7a7a' : '#5a5a60';
      plate(x, y, ch / 2, true, 0); plate(x, mid, ch / 2, false, 0);
      if (cell.f < 0) glyph(cell.cur, x, y, color);
      else {
        half(cell.nxt, x, y, color, true); half(cell.cur, x, y, color, false);
        ctx.save();
        if (cell.f < .5){                                     // old top flap falls towards the hinge
          const s = 1 - cell.f * 2;
          ctx.translate(0, mid); ctx.scale(1, Math.max(.001, s)); ctx.translate(0, -mid);
          plate(x, y, ch / 2, true, (1 - s) * .5); half(cell.cur, x, y, color, true);
        } else {                                              // new bottom flap swings down from the hinge
          const s = (cell.f - .5) * 2;
          ctx.translate(0, mid); ctx.scale(1, Math.max(.001, s)); ctx.translate(0, -mid);
          plate(x, mid, ch / 2, false, (1 - s) * .5); half(cell.nxt, x, y, color, false);
        }
        ctx.restore();
      }
      ctx.fillStyle = '#000'; ctx.fillRect(x, mid - .75, cw, 1.5);          // hinge
      if (cell === hov){ ctx.strokeStyle = 'rgba(160,145,245,.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, cw - 1, ch - 1); }
    });
  }

  addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    const c = Math.floor((mx - x0) / (cw + gap)), rI = Math.floor((my - y0) / (ch + gap));
    const idx = c >= 0 && c < cols && rI >= 0 && rI < rows ? rI * cols + c : -1;
    if (idx !== hoverIdx){
      hoverIdx = idx;
      if (idx >= 0 && !reduce){
        const t = performance.now() / 1000;
        [idx, idx - 1, idx + 1].forEach((i, k) => { const cell = cells[i]; if (cell && cell.r === rI) cell.land = Math.max(cell.land, t + .16 + k * .06); });
      }
    }
  }, { passive: true });
  sec.addEventListener('pointerleave', () => { hoverIdx = -1; });

  if (document.fonts) document.fonts.ready.then(() => { W = 0; });
  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!window.IXP.visible(sec)) return;
    const t = now / 1000;
    const [w, h, chg] = window.IXP.fit(cv, ctx);
    // rebuilds (resize, web font arriving) keep the intro's clock, so the headline still resolves on schedule
    if (chg || w !== W || h !== H){ if (!intro) intro = t; W = w; H = h; build(intro); if (!nextFeed) nextFeed = t + 4; }
    if (!reduce){
      step(t, dt);
      if (t > nextFeed){ feed(t); nextFeed = t + 2.2 + Math.random() * 1.6; }
    }
    draw(t);
  }
  requestAnimationFrame(frame);
})();
