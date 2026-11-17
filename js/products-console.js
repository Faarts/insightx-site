/* ---------------- Flagship — Key Features: pinned section with a live product console ----------------
   The section pins while the visitor scrolls through four features. The left column types the active feature
   (same typing as the home capabilities) and fills its progress bar; the console on the right switches to a
   live, illustrative screen for that feature, with a glyph wipe between screens.
   (The hand-over from the intro — the intro shrinking into this console's screen — lives in products-transitions.js.) */
(() => {
  const sec = document.getElementById('features'); if (!sec) return;
  const { reduce, MONO, SANS, clamp } = window.IXP;
  const sticky = sec.querySelector('.pf-sticky');
  const left = sec.querySelector('.pf-left'), con = sec.querySelector('.pf-console');
  const items = [...sec.querySelectorAll('.pf-list li')], N = items.length;
  const wordEl = sec.querySelector('.pf-word'), numEl = sec.querySelector('.pf-num'), descEl = sec.querySelector('.pf-desc');
  const pathEl = sec.querySelector('.pf-path'), countEl = sec.querySelector('.pf-count');
  const screenEl = sec.querySelector('.pf-screen'), cv = screenEl.querySelector('canvas'), ctx = cv.getContext('2d');
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.random() * a.length | 0];
  const SPAN = .86;               // share of the pinned scroll used by the four features (the rest is a short hold)
  let active = -1, typed = '', target = '', typeT = 0, prevT = performance.now(), modeT0 = 0, wipe = 1, W = 0, H = 0, st = {};

  function setActive(a){
    active = a; const li = items[a];
    items.forEach((x, i) => x.classList.toggle('on', i === a));
    numEl.textContent = String(a + 1).padStart(2, '0'); target = li.dataset.word;
    pathEl.textContent = li.dataset.path; countEl.textContent = `${String(a + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    descEl.classList.add('swap');
    clearTimeout(setActive.tm); setActive.tm = setTimeout(() => { descEl.textContent = li.querySelector('.d').textContent; descEl.classList.remove('swap'); }, reduce ? 0 : 260);
    modeT0 = performance.now() / 1000; wipe = reduce ? 1 : 0; st = {};
  }

  items.forEach((li, i) => li.addEventListener('click', () => {
    const span = sec.offsetHeight - innerHeight, y = sec.offsetTop + span * SPAN * (i + .35) / N;
    window.ppScrollTo ? window.ppScrollTo(y) : scrollTo({ top: y, behavior: 'smooth' });
  }));

  function tick(now){
    requestAnimationFrame(tick);
    const dt = Math.min(.05, (now - prevT) / 1000); prevT = now;
    const vh = innerHeight, top = sec.offsetTop;
    const P = window.IXP.progress(sec), u = clamp(P / SPAN) * N;
    const a = Math.min(N - 1, Math.floor(u));
    if (a !== active) setActive(a);
    items.forEach((li, i) => li.style.setProperty('--p', clamp(u - i).toFixed(3)));

    // type the active feature: backspace to the common prefix, then type (time based)
    typeT += dt;
    if (reduce) typed = target;
    else for (let g = 0; g < 40; g++){
      const del = !target.startsWith(typed), cost = del ? .028 : .055;
      if (typed === target || typeT < cost) break;
      typeT -= cost; typed = del ? typed.slice(0, -1) : target.slice(0, typed.length + 1);
    }
    if (typed === target) typeT = 0;
    if (wordEl.textContent !== typed) wordEl.textContent = typed;

    const sh = sticky.clientHeight || vh, mob = innerWidth <= 900;
    // stacked layout: the console fills whatever height is left under the copy
    if (mob){
      const bar = con.querySelector('.pf-bar').offsetHeight + 16, free = sh - (left.offsetTop + left.offsetHeight + 24) - sh * .04 - bar;
      const hpx = Math.round(Math.max(200, Math.min(free, (sh - 84) * .62)));
      if (con._h !== hpx){ con._h = hpx; screenEl.style.height = hpx + 'px'; }
    } else if (con._h){ con._h = 0; screenEl.style.height = ''; }

    if (scrollY + vh > top && scrollY < top + sec.offsetHeight) draw(now / 1000, dt);
  }
  requestAnimationFrame(tick);

  /* ---------- console screens ---------- */
  const font = (s, f = MONO) => { ctx.font = `${s}px ${f}`; };
  const txt = (s, x, y, c, al = 'left') => { ctx.fillStyle = c; ctx.textAlign = al; ctx.fillText(s, x, y); };
  const hline = (x, y, w, a = .12) => { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x, y, w, 1); };
  const box = (x, y, w, h, c) => { ctx.strokeStyle = c; ctx.strokeRect(Math.round(x) + .5, Math.round(y) + .5, Math.round(w) - 1, Math.round(h) - 1); };
  const clip = (s, w) => { if (ctx.measureText(s).width <= w) return s; while (s.length > 1 && ctx.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; };

  const screens = {
    // AI Research: a question becomes a structured, cited brief
    research(t){
      const Q = 'How are new export rules reshaping chip supply chains?';
      const P = 18, sm = W < 520, T = t % 14;
      font(sm ? 11 : 12);
      box(P, P, W - P * 2, 38, 'rgba(255,255,255,.3)');
      const n = Math.min(Q.length, Math.floor(T * 30)), q = Q.slice(0, n);
      txt('›', P + 12, P + 24, '#A091F5'); txt(clip(q, W - P * 2 - (sm ? 90 : 150)) + (n < Q.length || Math.floor(t * 2) % 2 ? '▍' : ''), P + 28, P + 24, '#fff');
      const srch = clamp((T - 2) / 1.2);
      txt(srch < 1 ? `${sm ? '' : 'SEARCHING '}${Math.floor(srch * 1284).toLocaleString('en-US')}` : (sm ? '1,284' : '1,284 SOURCES'), W - P - 12, P + 24, srch < 1 ? 'rgba(255,255,255,.5)' : '#A091F5', 'right');
      if (T < 3.2) return;
      const y0 = P + 62, colX = sm ? W : W * .64, rw = colX - P * 2 - (sm ? 0 : 10);
      font(sm ? 13 : 15, SANS); txt('Research brief — Semiconductor supply chains', P, y0 + 4, `rgba(255,255,255,${clamp((T - 3.2) * 3)})`);
      font(10); txt('SUMMARY', P, y0 + 30, 'rgba(255,255,255,.45)');
      [.98, .9, .62].forEach((l, i) => { const p = clamp((T - 3.6 - i * .35) * 1.6); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(P, y0 + 42 + i * 11, rw * l * p, 4); });
      const F = [['Lead times rising across major fabs', 1], ['Buffers shifting to second-tier suppliers', 2], ['Policy exposure concentrated in 3 regions', 3]];
      font(10); txt('KEY FINDINGS', P, y0 + 92, `rgba(255,255,255,${.45 * clamp(T - 4.6)})`);
      const cited = [];
      F.forEach(([f, c], i) => {
        const p = clamp((T - 5 - i * .9) * 2.2); if (p <= 0) return;
        const y = y0 + 114 + i * 26;
        font(sm ? 11 : 12); txt(`0${i + 1}`, P, y, '#A091F5');
        const s = clip(f, rw - 66), sw0 = ctx.measureText(s).width; txt(s.slice(0, Math.ceil(s.length * p)), P + 28, y, '#fff');
        if (p >= 1){ font(10); const cx = P + 28 + sw0 + 10; if (cx + 24 < colX - 8){ ctx.fillStyle = 'rgba(160,145,245,.18)'; ctx.fillRect(cx - 3, y - 10, 26, 14); txt(`[${c}]`, cx, y, '#A091F5'); } cited.push(c); }
      });
      const conf = clamp((T - 8.2) * 1.5);
      if (conf > 0){
        const y = y0 + 114 + 3 * 26 + 6; font(10); txt('CONFIDENCE', P, y, 'rgba(255,255,255,.45)');
        for (let k = 0; k < 10; k++){ ctx.fillStyle = k < Math.round(conf * 8) ? '#fff' : 'rgba(255,255,255,.15)'; ctx.fillRect(P + 84 + k * 9, y - 8, 6, 9); }
        txt(conf >= 1 ? 'HIGH' : '', P + 84 + 96, y, '#A091F5');
      }
      if (sm) return;
      // sources column
      const sx = colX, sw = W - sx - P; hline(sx - 10, y0 - 8, 1, 0); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(sx - 10, y0 - 8, 1, H - y0 - P + 8);
      font(10); txt('SOURCES', sx + 4, y0 + 4, 'rgba(255,255,255,.45)');
      const S = ['Trade filing · 2026', 'Industry dataset', 'Policy brief', 'Earnings call', 'News wire', 'Research paper'];
      S.forEach((s, i) => {
        const p = clamp((T - 3.4 - i * .25) * 3); if (p <= 0) return;
        const y = y0 + 30 + i * 30, hot = cited.includes(i + 1) && T - (5 + (i) * .9) < 1.6;
        ctx.globalAlpha = p;
        if (hot){ ctx.fillStyle = 'rgba(160,145,245,.16)'; ctx.fillRect(sx, y - 13, sw, 24); }
        font(11); txt(`[${i + 1}]`, sx + 4, y, '#A091F5'); txt(clip(s, sw - 40), sx + 32, y, '#fff');
        ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(sx + 32, y + 5, sw - 40, 2);
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(sx + 32, y + 5, (sw - 40) * (.95 - i * .11), 2);
        ctx.globalAlpha = 1;
      });
    },

    // Smart Monitoring: a watchlist with live lines and an alert feed
    monitoring(t, dt){
      const P = 18, sm = W < 520;
      const TOP = ['Semiconductors', 'Energy markets', 'AI regulation', 'Shipping lanes'];
      if (!st.rows){ st.rows = TOP.map((n, i) => ({ n, buf: Array.from({ length: 60 }, (_, k) => .5 + .2 * Math.sin(k * .3 + i)), ph: i * 1.7, hit: -9 })); st.acc = 0; st.clock = 14 * 60 + 2; st.next = t + 1;
        st.feed = [['●', 'New filing detected · Semiconductors', '13:58'], ['▲', 'Mentions spike · Energy markets +24%', '13:51'], ['●', 'Sentiment shift · Shipping lanes', '13:44']].map(([s, txt, time], i) => ({ at: t - 5 - i, s, txt, time })); }
      font(10); txt('WATCHLIST · 4 TOPICS', P, P + 10, 'rgba(255,255,255,.45)'); txt(`ALERTS ${st.feed.length}`, W - P, P + 10, '#A091F5', 'right');
      hline(P, P + 20, W - P * 2);
      const lw = sm ? W - P * 2 : W * .58, rh = sm ? (H * .62 - P - 26) / 4 : (H - P - 40) / 4;
      st.acc += dt * 10;
      while (st.acc >= 1){ st.acc--; st.rows.forEach(r => { r.buf.shift(); r.buf.push(clamp(.5 + .18 * Math.sin(t * .9 + r.ph) + .1 * Math.sin(t * 2.3 + r.ph * 2) + rnd(-.06, .06), .05, .95)); }); }
      if (t > st.next){
        const k = Math.random() * 4 | 0, r = st.rows[k]; r.hit = t; r.buf[r.buf.length - 1] = .97;
        st.clock += 1 + (Math.random() * 4 | 0);
        const hh = String(Math.floor(st.clock / 60) % 24).padStart(2, '0'), mm = String(st.clock % 60).padStart(2, '0');
        const msg = pick([['▲', `Mentions spike · ${r.n} +${(20 + Math.random() * 40) | 0}%`], ['●', `New filing detected · ${r.n}`], ['▲', `Unusual activity · ${r.n}`], ['●', `Sentiment shift · ${r.n}`]]);
        st.feed.unshift({ at: t, s: msg[0], txt: msg[1], time: `${hh}:${mm}` }); if (st.feed.length > 9) st.feed.pop();
        st.next = t + rnd(1.1, 2.2);
      }
      st.rows.forEach((r, i) => {
        const y = P + 30 + i * rh, hot = t - r.hit < 1.4;
        if (hot){ ctx.fillStyle = `rgba(160,145,245,${(.14 * (1 - (t - r.hit) / 1.4)).toFixed(3)})`; ctx.fillRect(P, y, lw, rh - 6); }
        font(sm ? 11 : 12, SANS); txt(r.n, P + 10, y + 20, '#fff');
        const v = r.buf[r.buf.length - 1], ch = ((v - .5) * 40).toFixed(1);
        font(10); txt(`${ch >= 0 ? '+' : ''}${ch}%`, P + lw - 10, y + 20, hot ? '#A091F5' : 'rgba(255,255,255,.55)', 'right');
        const gx = P + 10, gw = lw - 20, gy = y + 30, gh = rh - 44;
        if (gh > 8){
          ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; ctx.beginPath();
          r.buf.forEach((b, k) => { const x = gx + k / (r.buf.length - 1) * gw, yy = gy + gh - b * gh; k ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke(); ctx.lineWidth = 1;
          const ly = gy + gh - .8 * gh; ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(gx, ly); ctx.lineTo(gx + gw, ly); ctx.stroke(); ctx.setLineDash([]);
          r.buf.forEach((b, k) => { if (b > .8){ const x = gx + k / (r.buf.length - 1) * gw; ctx.fillStyle = '#A091F5'; ctx.fillRect(x - 2, gy + gh - b * gh - 2, 4, 4); } });
        }
        hline(P, y + rh - 3, lw, .08);
      });
      // alert feed
      const fx = sm ? P : P + lw + 16, fy = sm ? P + 30 + rh * 4 + 6 : P + 30, fw = sm ? W - P * 2 : W - fx - P;
      font(10); txt('ALERT FEED', fx, fy + 4, 'rgba(255,255,255,.45)');
      const ch = sm ? 22 : 40, maxN = Math.floor((H - fy - 14) / (ch + 6));
      st.feed.slice(0, maxN).forEach((f, i) => {
        const age = t - f.at, slide = clamp(age * 4), y = fy + 14 + i * (ch + 6) - (1 - slide) * (ch + 6);
        ctx.globalAlpha = slide * (1 - i / (maxN + 1));
        box(fx, y, fw, ch, i === 0 && age < 1.5 ? 'rgba(160,145,245,.7)' : 'rgba(255,255,255,.18)');
        font(10); txt(f.s, fx + 10, y + (sm ? 15 : 17), f.s === '▲' ? '#A091F5' : '#fff'); txt(f.time, fx + fw - 10, y + (sm ? 15 : 17), 'rgba(255,255,255,.45)', 'right');
        if (!sm){ font(11); txt(clip(f.txt, fw - 30), fx + 10, y + 32, 'rgba(255,255,255,.85)'); }
        else { font(10); txt(clip(f.txt, fw - 80), fx + 26, y + 15, 'rgba(255,255,255,.85)'); }
        ctx.globalAlpha = 1;
      });
    },

    // Data Analysis: sources flow into one plot, points settle into clusters, a pattern appears
    analysis(t, dt){
      const P = 18, sm = W < 520, T = (t % 12);
      const SRC = [['NEWS', '2,184'], ['FILINGS', '312'], ['MARKETS', '48K'], ['SOCIAL', '91K'], ['RESEARCH', '640']];
      const sx = P, sw = sm ? 78 : 118, px = sx + sw + (sm ? 26 : 60), pw = W - px - P, py = P + 22, ph = H - py - P - 22;
      font(10); txt('SOURCES · 5 CONNECTED', P, P + 10, 'rgba(255,255,255,.45)'); txt('PATTERN SEARCH', W - P, P + 10, '#A091F5', 'right');
      const C = [[.24, .7], [.55, .45], [.82, .2]];
      if (!st.pts){ st.pts = []; st.fl = []; st.t0 = t; }
      if (T < .1 && st.pts.length > 50){ st.pts = []; }
      const sy = i => py + 10 + i * ((ph - 20) / (SRC.length - 1));
      SRC.forEach(([n, c], i) => {
        const y = sy(i); box(sx, y - 14, sw, 28, 'rgba(255,255,255,.3)');
        font(10); txt(n, sx + 8, y + 4, '#fff'); if (!sm) txt(c, sx + sw - 8, y + 4, 'rgba(255,255,255,.5)', 'right');
        ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(sx + sw, y); ctx.bezierCurveTo(sx + sw + 40, y, px - 30, py + ph / 2, px, py + ph / 2); ctx.stroke();
      });
      // plot frame
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + ph); ctx.lineTo(px + pw, py + ph); ctx.stroke();
      for (let k = 1; k < 4; k++) hline(px, py + ph * k / 4, pw, .05);
      // particles travelling from sources into the plot
      if (st.pts.length < 140 && Math.random() < dt * 30){
        const i = Math.random() * 5 | 0, c = Math.random() * 3 | 0;
        st.fl.push({ i, c, u: 0, sp: rnd(.8, 1.4) });
      }
      for (let k = st.fl.length - 1; k >= 0; k--){
        const f = st.fl[k]; f.u += dt * f.sp;
        const y0 = sy(f.i), u = f.u, x0 = sx + sw, yE = py + ph / 2;
        const bx = Math.pow(1 - u, 3) * x0 + 3 * Math.pow(1 - u, 2) * u * (x0 + 40) + 3 * (1 - u) * u * u * (px - 30) + u * u * u * px;
        const by = Math.pow(1 - u, 3) * y0 + 3 * Math.pow(1 - u, 2) * u * y0 + 3 * (1 - u) * u * u * yE + u * u * u * yE;
        ctx.fillStyle = '#A091F5'; ctx.fillRect(bx - 1.5, by - 1.5, 3, 3);
        if (u >= 1){ st.fl.splice(k, 1); const [cx, cy] = C[f.c], g = () => (Math.random() + Math.random() + Math.random() - 1.5) * .13; st.pts.push({ x: px, y: yE, tx: cx + g(), ty: cy + g() * .9, s: f.i, born: t }); }
      }
      const settle = clamp(st.pts.length / 110);
      st.pts.forEach(p => {
        const e = clamp((t - p.born) * 1.6), ee = 1 - Math.pow(1 - e, 3);
        const X = px + (p.tx * pw - 0) * ee + (1 - ee) * 0, Y = (py + ph / 2) + ((py + p.ty * ph) - (py + ph / 2)) * ee;
        ctx.fillStyle = `rgba(255,255,255,${(.35 + .5 * e).toFixed(2)})`; ctx.fillRect(X - 1.5, Y - 1.5, 3, 3);
      });
      if (settle > .55){
        const a = clamp((settle - .55) * 3);
        // trend line + cluster labels
        ctx.strokeStyle = `rgba(160,145,245,${a})`; ctx.lineWidth = 1.4; ctx.beginPath();
        const x1 = px + pw * .12, y1 = py + ph * .82, x2 = px + pw * (.12 + .82 * a), y2 = py + ph * (.82 - .7 * a); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineWidth = 1;
        font(10); ['DEMAND', 'PRICING', 'RISK'].forEach((l, i) => { const [cx, cy] = C[i]; ctx.globalAlpha = a; txt(`[ ${l} ]`, px + cx * pw, py + cy * ph - (sm ? 30 : 40), '#fff', 'center'); ctx.globalAlpha = 1; });
        if (a >= 1){ const s = 'PATTERN DETECTED · r = 0.82'; font(10); const w = ctx.measureText(s).width + 16; ctx.fillStyle = '#A091F5'; ctx.fillRect(px + pw - w, py + ph + 8, w, 16); txt(s, px + pw - 8, py + ph + 20, '#000', 'right'); }
      }
      font(10); txt(`${st.pts.length} SIGNALS`, px, py + ph + 20, 'rgba(255,255,255,.45)');
      if (st.pts.length >= 140 && !st.done) st.done = t;
      if (st.done && t - st.done > 3.5){ st.pts = []; st.fl = []; st.done = 0; }
    },

    // AI Agents: a workflow that runs itself, with a log
    agents(t){
      const P = 18, sm = W < 520, T = t % 11;
      const NODES = [['TRIGGER', 'Daily · 08:00'], ['RESEARCH AGENT', 'Scan sources'], ['ANALYSIS AGENT', 'Find patterns'], ['WRITER AGENT', 'Draft brief'], ['REVIEW', 'Fact-check'], ['DELIVER', 'Send to team']];
      font(10); txt('WORKFLOW · MORNING BRIEF', P, P + 10, 'rgba(255,255,255,.45)'); txt('AUTOMATED', W - P, P + 10, '#A091F5', 'right');
      hline(P, P + 20, W - P * 2);
      const cols = 3, gw = W - P * 2, nw = sm ? (gw - 24) / 3 : Math.min(190, (gw - 80) / 3), nh = sm ? 40 : Math.max(52, Math.min(72, H * .12));
      const gapX = (gw - nw * cols) / (cols - 1), r1 = P + 44, r2 = r1 + nh + (sm ? 26 : Math.max(40, H * .09));
      const pos = NODES.map((_, i) => { const row = i < 3 ? 0 : 1, c = row ? 2 - (i - 3) : i; return [P + c * (nw + gapX), row ? r2 : r1]; });
      const stepDur = 1.4, cur = Math.floor(T / stepDur), lp = (T % stepDur) / stepDur;
      // edges
      for (let i = 0; i < NODES.length - 1; i++){
        const [ax, ay] = pos[i], [bx, by] = pos[i + 1];
        let x1, y1, x2, y2;
        if (ay === by){ const dir = bx > ax ? 1 : -1; x1 = dir > 0 ? ax + nw : ax; x2 = dir > 0 ? bx : bx + nw; y1 = y2 = ay + nh / 2; }
        else { x1 = x2 = ax + nw / 2; y1 = ay + nh; y2 = by; }
        ctx.strokeStyle = i < cur ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.15)'; ctx.setLineDash(i < cur ? [] : [3, 4]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
        if (i === cur && lp > .55){ const u = (lp - .55) / .45; ctx.fillStyle = '#A091F5'; ctx.fillRect(x1 + (x2 - x1) * u - 2, y1 + (y2 - y1) * u - 2, 4, 4); }
      }
      NODES.forEach(([n, s], i) => {
        const [x, y] = pos[i], done = i < cur, run = i === cur;
        ctx.fillStyle = run ? 'rgba(160,145,245,.12)' : '#050505'; ctx.fillRect(x, y, nw, nh);
        box(x, y, nw, nh, run ? '#A091F5' : done ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.2)');
        font(sm ? 9 : 11); txt(clip(n, nw - 16), x + 10, y + (sm ? 16 : nh / 2 - 3), done || run ? '#fff' : 'rgba(255,255,255,.4)');
        font(sm ? 9 : 10); txt(run ? (sm ? `${Math.floor(lp * 100)}%` : `RUNNING ${Math.floor(lp * 100)}%`) : done ? 'DONE ✓' : (sm ? '—' : s.toUpperCase()), x + 10, y + (sm ? 31 : nh / 2 + 14), run || done ? '#A091F5' : 'rgba(255,255,255,.3)');
      });
      // log
      const LOG = ['trigger fired · schedule daily 08:00', 'research-agent · scanning 312 sources', 'research-agent · 14 relevant documents', 'analysis-agent · 3 patterns found',
        'writer-agent · drafting brief (2 pages)', 'review · 12 claims checked ✓', 'deliver · sent to 4 recipients ✓'];
      const ly = r2 + nh + (sm ? 18 : 28); hline(P, ly - 12, W - P * 2, .1);
      const lh = sm ? 16 : 20, maxL = Math.floor((H - ly - 6) / lh);
      const shown = Math.min(LOG.length, Math.floor(T / stepDur * 1.2) + 1);
      font(sm ? 10 : 11);
      LOG.slice(0, shown).slice(-maxL).forEach((l, i, arr) => {
        const s = `[08:00:${String((LOG.indexOf(l) * 7 + 1)).padStart(2, '0')}] ${l}`;
        const isLast = i === arr.length - 1, chars = isLast ? Math.floor(((T / stepDur * 1.2) % 1) * s.length * 1.6) : s.length;
        txt(clip(s.slice(0, chars), W - P * 2), P, ly + 4 + i * lh, isLast ? '#fff' : 'rgba(255,255,255,.45)');
      });
    },
  };

  const GLY = '01#%&@<>/=+*ABCDEF';
  function draw(t, dt){
    const [w, h, ch] = window.IXP.fit(cv, ctx); W = w; H = h; if (ch) st = {};
    if (!W) return;
    ctx.clearRect(0, 0, W, H); ctx.textBaseline = 'alphabetic';
    const mode = items[active] ? items[active].dataset.mode : 'research';
    screens[mode](t - modeT0, dt);
    // glyph wipe after a switch
    if (wipe < 1){
      wipe = Math.min(1, wipe + dt * 2.6);
      const x = wipe * (W + 160) - 80;
      ctx.fillStyle = '#050505'; ctx.fillRect(x, 0, W - x, H);
      font(11); ctx.textAlign = 'center';
      for (let cx = x - 70; cx < x + 70; cx += 12) for (let cy = 8; cy < H; cy += 14){
        const d = 1 - Math.abs(cx - x) / 70; if (Math.random() > d) continue;
        ctx.fillStyle = Math.random() < .12 ? '#A091F5' : `rgba(255,255,255,${(d * .8).toFixed(2)})`; ctx.fillText(GLY[Math.random() * GLY.length | 0], cx, cy);
      }
      ctx.textAlign = 'left';
    }
  }
})();
