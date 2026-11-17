/* ---------------- About hero — "fragmented information → actionable insights" ----------------
   Raw fragments (headlines, filings, rumours, prices, transactions…) drift in from the left, tilted and noisy.
   When one crosses the InsightX line it is decoded into a structured label and joins a tidy lane on the right;
   some of them come out as insights (accent). The pointer works as a reading lens on the raw side.
   Feeds the hero HUD counters. */
(() => {
  const sec = document.querySelector('.ab-hero'); if (!sec) return;
  const { reduce, MONO, SANS, clamp, SYM } = window.IXP;
  const cv = sec.querySelector('.ab-field'), ctx = cv.getContext('2d');
  const hud = { in: document.getElementById('ab-in'), out: document.getElementById('ab-out'), ins: document.getElementById('ab-ins') };

  // [raw fragment, structured label, is it an insight?]
  const PAIRS = [
    ['breaking: rate cut?', 'MACRO · EVENT'], ['Q3 filing p.14', 'FINANCIAL · SOURCE'], ['unverified rumour', 'LOW CONFIDENCE'],
    ['tx 0x9f3a…c21', 'ON-CHAIN · FLOW'], ['thread 4/12', 'SENTIMENT +0.4'], ['press release', 'ANNOUNCEMENT'],
    ['satellite tile 88', 'SUPPLY · SIGNAL', 1], ['price feed 0.0421', 'MARKET · DATA'], ['transcript 01:22:10', 'QUOTE · EXTRACTED'],
    ['poll n=1,204', 'PUBLIC · OPINION'], ['dataset.csv', 'STRUCTURED · TABLE'], ['forum post', 'COMMUNITY · VIEW'],
    ['footnote [32]', 'CITATION'], ['headline', 'NEWS · EVENT'], ['chart.png', 'TREND · DETECTED', 1], ['translation (jp)', 'SOURCE · JP'],
    ['updated 2m ago', 'LIVE'], ['duplicate story', 'MERGED'], ['paywalled article', 'SUMMARY'], ['reply', 'SENTIMENT −0.2'],
    ['earnings call', 'GUIDANCE · RAISED', 1], ['shipping manifest', 'LOGISTICS · DATA'], ['wallet 0x71…', 'WHALE · MOVE', 1],
    ['research paper', 'KEY FINDING', 1], ['weather alert', 'RISK · REGION'], ['rss item', 'NEWS · EVENT'], ['screenshot', 'OCR · TEXT'],
    ['policy draft', 'REGULATION · WATCH', 1], ['job post', 'HIRING · SIGNAL'], ['patent filing', 'R&D · SIGNAL', 1],
  ];
  const copy = sec.querySelector('.pp-copy');
  let W = 0, H = 0, LX = 0, Y0 = 0, Y1 = 0, mob = false, lanes = [], frags = [], acc = 0, mx = null, my = null, last = performance.now();
  let nIn = 0, nOut = 0, nIns = 0, hudT = 0, flashes = [];

  function layout(){
    mob = W <= 900;
    LX = Math.round(W * (mob ? .5 : .6));
    // the field lives in the band between the nav and the hero copy
    Y0 = mob ? 104 : 118;
    Y1 = Math.max(Y0 + 120, copy.getBoundingClientRect().top - sec.getBoundingClientRect().top - (mob ? 16 : 28));
    lanes = [];
    const step = mob ? 21 : 25;
    for (let y = Y0 + 8; y < Y1 - 4; y += step) lanes.push({ y, tail: null });
  }

  function spawn(x){
    const p = PAIRS[Math.random() * PAIRS.length | 0];
    const mono = Math.random() < .45, size = (mob ? 10 : 11) + Math.random() * (mob ? 3 : 5);
    const font = `${mono ? 400 : (Math.random() < .5 ? 300 : 400)} ${size.toFixed(1)}px ${mono ? MONO : SANS}`;
    ctx.font = font; const w = ctx.measureText(p[0]).width;
    frags.push({ raw: p[0], out: p[1], ins: !!p[2], font, w, x: x ?? -w - 10, y: Y0 + 6 + Math.random() * (Y1 - Y0 - 12),
      vx: 26 + Math.random() * 40, vy: 0, rot: (Math.random() - .5) * .5, wob: Math.random() * 6.28, a: .16 + Math.random() * .34, st: 0 });
  }

  function claimLane(f){
    // nearest lane whose last entrant has moved clear of the line
    const order = lanes.map((l, i) => [i, Math.abs(l.y - f.y)]).sort((a, b) => a[1] - b[1]).slice(0, 3);
    for (const [i] of order){ const l = lanes[i]; if (!l.tail || l.tail.x - (LX + 4) > f.ow + 26){ l.tail = f; return l; } }
    return null;
  }

  function step(dt, t){
    const rate = (Y1 - Y0) / (mob ? 150 : 125);
    acc += dt * rate; while (acc > 1){ acc--; spawn(); }
    for (let i = frags.length - 1; i >= 0; i--){
      const f = frags[i];
      if (f.st === 0){
        f.wob += dt * (.6 + f.vx / 80);
        f.vy += (Math.sin(f.wob * 1.3 + f.x * .01) * 14 - f.vy) * dt;
        f.y = clamp(f.y + f.vy * dt, Y0, Y1);
        const near = clamp((f.x + f.w - (LX - 140)) / 140);        // straighten as it nears the line
        f.x += f.vx * dt * (1 - near * .35);
        f.r = f.rot * Math.cos(f.wob * .5) * (1 - near);
        if (f.x + f.w >= LX - 2){
          if (!f.ow){ ctx.font = `400 ${mob ? 10 : 11}px ${MONO}`; f.ow = ctx.measureText(f.out).width + (f.ins ? 14 : 0); }
          const lane = claimLane(f);
          if (!lane){ f.x = LX - 2 - f.w; continue; }                // queue at the line
          f.st = 1; f.lane = lane; f.dec = 0; nIn++; nOut++; if (f.ins) nIns++;
          f.x = LX + 4; f.vx = mob ? 70 : 92;
          flashes.push({ y: f.y, t: 0 });
        }
      } else {
        f.dec += dt / .45;
        f.y += (f.lane.y - f.y) * Math.min(1, dt * 9);
        f.x += f.vx * dt;
        if (f.x > W + 20){ if (f.lane.tail === f) f.lane.tail = null; frags.splice(i, 1); }
      }
    }
    flashes = flashes.filter(fl => (fl.t += dt) < .6);
  }

  function draw(t){
    ctx.clearRect(0, 0, W, H);
    // lanes on the structured side
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    lanes.forEach(l => { for (let x = LX + 10; x < W; x += 6) ctx.fillRect(x, l.y + 4, 1, 1); });
    // the InsightX line
    const g = ctx.createLinearGradient(0, Y0 - 40, 0, Y1 + 30);
    g.addColorStop(0, 'rgba(160,145,245,0)'); g.addColorStop(.15, 'rgba(160,145,245,.6)'); g.addColorStop(.85, 'rgba(160,145,245,.6)'); g.addColorStop(1, 'rgba(160,145,245,0)');
    ctx.fillStyle = g; ctx.fillRect(LX, Y0 - 40, 1, Y1 - Y0 + 70);
    flashes.forEach(fl => { const k = 1 - fl.t / .6; ctx.fillStyle = `rgba(160,145,245,${(.9 * k).toFixed(3)})`; ctx.fillRect(LX - 10 * k, fl.y - .5, 20 * k + 1, 1);
      ctx.fillStyle = `rgba(160,145,245,${(.18 * k).toFixed(3)})`; ctx.fillRect(LX - 1, fl.y - 14, 3, 28); });
    // zone labels
    ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'middle';
    const ly = Y0 - 22;
    ctx.fillStyle = '#5f5f5f'; ctx.textAlign = 'right'; ctx.fillText('FRAGMENTED INFORMATION', LX - 14, ly);
    ctx.fillStyle = '#A091F5'; ctx.textAlign = 'left'; ctx.fillText(mob ? 'INSIGHT' : 'ACTIONABLE INSIGHT', LX + 14, ly);
    ctx.fillRect(LX - 2, ly - 2, 5, 5);

    for (const f of frags){
      if (f.st === 0){
        let a = f.a * clamp((f.x + f.w) / 220);
        if (mx !== null){ const d = Math.hypot(f.x + f.w / 2 - mx, f.y - my); a += (1 - a) * Math.exp(-(d * d) / (2 * 110 * 110)); }
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.r || 0);
        ctx.font = f.font; ctx.textAlign = 'left'; ctx.fillStyle = `rgba(200,203,208,${a.toFixed(3)})`; ctx.fillText(f.raw, 0, 0);
        ctx.restore();
      } else {
        ctx.font = `400 ${mob ? 10 : 11}px ${MONO}`; ctx.textAlign = 'left';
        let txt = f.out;
        if (f.dec < 1) txt = [...f.out].map((c, i) => c === ' ' || i / f.out.length < f.dec ? c : SYM[Math.random() * SYM.length | 0]).join('');
        const fade = clamp((W - f.x) / 120);
        let x = f.x;
        if (f.ins){ ctx.fillStyle = `rgba(160,145,245,${fade})`; ctx.fillRect(x, f.y - 2.5, 5, 5); x += 14; ctx.fillStyle = `rgba(160,145,245,${fade})`; }
        else ctx.fillStyle = `rgba(160,163,170,${(.75 * fade).toFixed(3)})`;
        ctx.fillText(txt, x, f.y);
      }
    }
  }

  function hudUpdate(){
    if (hud.in) hud.in.textContent = nIn.toLocaleString('en-US');
    if (hud.out) hud.out.textContent = nOut.toLocaleString('en-US');
    if (hud.ins) hud.ins.textContent = nIns.toLocaleString('en-US');
  }

  function prime(){
    // start mid-flow, not with an empty screen
    frags = []; lanes.forEach(l => l.tail = null);
    for (let i = 0; i < 900; i++) step(1 / 30, i / 30);
    nIn = 0; nOut = 0; nIns = 0;
  }

  if (document.fonts) document.fonts.ready.then(() => { W = 0; });   // hero copy height changes once Geist loads
  addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  sec.addEventListener('pointerleave', () => { mx = null; });

  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!window.IXP.visible(sec)) return;
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; layout(); prime(); if (reduce) draw(now / 1000); }
    if (reduce) return;
    step(dt, now / 1000); draw(now / 1000);
    if ((hudT += dt) > .2){ hudT = 0; hudUpdate(); }
  }
  requestAnimationFrame(frame);
})();
