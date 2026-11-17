/* ---------------- Section 3 — Core Capabilities: sticky type + rising card deck ---------------- */
(() => {
  const sec = document.getElementById('capabilities');
  if (!sec) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = [...sec.querySelectorAll('.cap-card')], N = cards.length;
  const counter = sec.querySelector('.cap-counter b'), wordEl = sec.querySelector('.cap-word'), numEl = sec.querySelector('.cap-num');
  const s2par = document.querySelector('.s2-par'), sticky = sec.querySelector('.s3-sticky');
  const glEl = document.getElementById('gl'), bandEl = document.querySelector('.xp-band');
  const s3layers = [[sec.querySelector('.s3-left'), .42], [sec.querySelector('.cap-deck'), .62]];
  const words = cards.map(c => c.dataset.word);
  const viz = cards.map(c => makeViz(c.querySelector('canvas'), c.dataset.viz));
  let active = -1, typed = '', target = words[0], typeT = 0, last = performance.now();

  function tick(now){
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const vh = innerHeight, top = sec.offsetTop, span = sec.offsetHeight - vh;
    const P = Math.min(1, Math.max(0, (scrollY - top) / span));
    const u = Math.min(1, P / .82) * (N - 1);             // 0 → N-1 across the pinned scroll
    const step = vh * .5;
    cards.forEach((c, i) => {
      const d = i - u;                                     // >0: still rising from below, <0: already passed
      let y = 0, s, br = 1, bl = 0;
      if (d >= 0){ y = d * step; s = 1 - .4 * Math.min(d, 1); }
      else { const k = Math.min(-d, 1); s = 1 - .4 * k; br = 1 - .6 * k; bl = k * 2; }
      c.style.transform = `translate3d(0,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
      c.style.filter = bl > .01 || br < .99 ? `brightness(${br.toFixed(3)}) blur(${bl.toFixed(2)}px)` : 'none';
      c._live = d > -1.1 && d < 1.6;
    });
    const a = Math.min(N - 1, Math.max(0, Math.round(u)));
    if (a !== active){ active = a; if (counter) counter.textContent = a + 1; numEl.textContent = String(a + 1).padStart(2, '0'); target = words[a]; }
    // type the active capability: backspace to the common prefix, then type the new word
    // time-based so it stays in sync even when frames are slow: ~28 ms per deleted char, ~55 ms per typed char
    typeT += (now - (tick.prev || now)) / 1000; tick.prev = now;
    if (reduce) typed = target;
    else for (let guard = 0; guard < 40; guard++){
      const deleting = !target.startsWith(typed), cost = deleting ? .028 : .055;
      if (typed === target || typeT < cost) break;
      typeT -= cost;
      typed = deleting ? typed.slice(0, -1) : target.slice(0, typed.length + 1);
    }
    if (typed === target) typeT = 0;
    if (wordEl.textContent !== typed) wordEl.textContent = typed;
    // layered parallax while the black panel of section 3 rises over section 2:
    //   section 2 copy lags far behind and recedes, the map drifts up slowly, section 3 content trails its panel edge
    // measured against the real screen height of the sections (can be < innerHeight on iOS, see --ui-bottom)
    const sh = sticky.clientHeight || vh;
    const over = Math.min(1, Math.max(0, (scrollY + sh - top) / sh));
    const eo = 1 - Math.pow(1 - over, 3);
    if (s2par){
      s2par.style.transform = `translate3d(0,${(over * sh * .72).toFixed(1)}px,0) scale(${(1 - over * .1).toFixed(4)})`;
      s2par.style.opacity = Math.max(0, 1 - over * 1.25).toFixed(3);
    }
    if (over > 0 && over < 1){
      const map = `translate3d(0,${(-over * sh * .22).toFixed(1)}px,0)`;
      glEl.style.transform = map; bandEl.style.transform = map;
    } else if (glEl.style.transform){ glEl.style.transform = over >= 1 ? `translate3d(0,${(-sh * .22).toFixed(1)}px,0)` : ''; bandEl.style.transform = glEl.style.transform; }
    for (const [el, k] of s3layers) el.style.transform = `translate3d(0,${((1 - eo) * sh * k).toFixed(1)}px,0)`;
    if (scrollY + vh > top && scrollY < top + sec.offsetHeight){
      const t = now / 1000;
      viz.forEach((draw, i) => cards[i]._live && draw(t, dt));
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* --- small monochrome canvas animations, one per capability --- */
  function makeViz(cv, mode){
    const ctx = cv.getContext('2d'), MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
    const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.random() * a.length | 0];
    let W = 0, H = 0, st = null;
    function fit(){
      const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (Math.round(w * dpr) !== cv.width || Math.round(h * dpr) !== cv.height){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); W = w; H = h; st = null; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const header = (l, r) => {
      ctx.font = `11px ${MONO}`; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillText(l, 16, 24);
      if (r){ ctx.textAlign = 'right'; ctx.fillText(r, W - 16, 24); ctx.textAlign = 'left'; }
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(16, 32, W - 32, 1);
    };

    const modes = {
      research(t){
        if (!st){
          const VOC = ['signal','market','policy','supply','climate','token','model','dataset','report','trend','source','risk','agent','query','index','insight','energy','price','sentiment','filing','paper','patent','news','chain','region','demand','forecast','outlier','memo','brief'];
          ctx.font = `11px ${MONO}`; const words = [];
          for (let y = 54; y < H - 10; y += 19){ let x = 16; for (;;){ const w = pick(VOC), ww = ctx.measureText(w).width; if (x + ww > W - 16) break; words.push({ x, y, w, ww, key: Math.random() < .13, hit: -9 }); x += ww + 12; } }
          st = { words, sources: 1284 };
        }
        const scanY = 44 + ((t * 48) % (H - 44));
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, scanY - 9, W, 16);
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(0, scanY + 7, W, 1);
        ctx.font = `11px ${MONO}`;
        for (const w of st.words){
          const near = Math.abs(w.y - 3 - scanY);
          if (w.key && near < 7 && t - w.hit > 3){ w.hit = t; st.sources++; }
          const age = t - w.hit;
          if (age < 2.8){ const a = 1 - age / 2.8; ctx.fillStyle = `rgba(255,255,255,${(.15 + .85 * a).toFixed(3)})`; ctx.fillRect(w.x - 3, w.y - 10, w.ww + 6, 14); ctx.fillStyle = '#000'; }
          else ctx.fillStyle = `rgba(255,255,255,${near < 12 ? .8 : .2})`;
          ctx.fillText(w.w, w.x, w.y);
        }
        header('QUERY › global supply risk' + (Math.floor(t * 2) % 2 ? '▍' : ' '), `SOURCES ${st.sources.toLocaleString('en-US')}`);
      },
      intelligence(t){
        if (!st){
          const centers = [[.2, .4], [.5, .27], [.8, .42]];
          st = { centers, nodes: Array.from({ length: 66 }, (_, i) => ({ c: i % 3, bx: rnd(16, W - 16), by: rnd(44, H * .78), f: rnd(.3, .9), s: rnd(0, 6.28), ox: rnd(-1, 1), oy: rnd(-1, 1), g: pick('01ABCDEF#%&') })) };
        }
        const ph = .5 - .5 * Math.cos(t * .55), e = ph * ph * (3 - 2 * ph);
        const R = Math.min(W, H) * .13;
        const P = st.nodes.map(n => {
          const sx = n.bx + Math.sin(t * n.f + n.s) * 22, sy = n.by + Math.cos(t * n.f * .8 + n.s) * 16;
          const [cx, cy] = st.centers[n.c], tx = cx * W + n.ox * R, ty = cy * H + n.oy * R * .8;
          return [sx + (tx - sx) * e, sy + (ty - sy) * e];
        });
        for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++){
          const same = st.nodes[i].c === st.nodes[j].c, dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d = Math.hypot(dx, dy);
          const lim = same ? 46 + 30 * e : 42; if (d > lim) continue;
          const a = same ? .05 + .3 * e : .07 * (1 - e); if (a < .01) continue;
          ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
        }
        ctx.font = `11px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        P.forEach((p, i) => { ctx.fillStyle = `rgba(255,255,255,${(.45 + .45 * e).toFixed(3)})`; ctx.fillText(st.nodes[i].g, p[0], p[1]); });
        if (e > .55){
          const a = (e - .55) / .45;
          ['Markets', 'Policy', 'Supply'].forEach((l, i) => { const [cx, cy] = st.centers[i]; ctx.fillStyle = `rgba(255,255,255,${(a * .9).toFixed(3)})`; ctx.fillText(`[ ${l.toUpperCase()} ]`, cx * W, cy * H - R - 10); });
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        header(e > .5 ? 'STRUCTURED · 3 ENTITIES' : 'UNSTRUCTURED · 66 FRAGMENTS', `${Math.round(e * 100)}%`);
      },
      automation(t, dt){
        const TASKS = ['Scan 312 sources', 'Summarize filings', 'Extract entities', 'Translate briefs', 'Cross-check claims', 'Update dataset', 'Draft weekly report', 'Tag sentiment', 'Dedupe articles'];
        if (!st) st = { rows: Array.from({ length: 6 }, () => ({ name: pick(TASKS), p: rnd(0, .9), sp: rnd(.12, .32), done: -9 })) };
        ctx.font = `11px ${MONO}`;
        const cells = 12, cw = 9, bx = W - 16 - cells * cw - 44;
        st.rows.forEach((r, i) => {
          const y = 58 + i * 26;
          if (r.done < 0){ r.p += r.sp * dt; if (r.p >= 1){ r.p = 1; r.done = t; } }
          else if (t - r.done > 1.3){ r.name = pick(TASKS); r.p = 0; r.sp = rnd(.12, .32); r.done = -9; }
          const fin = r.done > 0;
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillText(`AGENT-0${i + 1}`, 16, y);
          ctx.fillStyle = `rgba(255,255,255,${fin ? 1 : .75})`; ctx.fillText(r.name, 96, y);
          for (let k = 0; k < cells; k++){ const on = k < Math.floor(r.p * cells); ctx.fillStyle = on ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.15)'; ctx.fillRect(bx + k * cw, y - 8, cw - 3, 9); }
          ctx.textAlign = 'right'; ctx.fillStyle = fin ? '#A091F5' : 'rgba(255,255,255,.6)';
          ctx.fillText(fin ? 'DONE ✓' : `${Math.floor(r.p * 100)}%`, W - 16, y); ctx.textAlign = 'left';
        });
        header('AGENTS · 6/6 ACTIVE', `${(Math.floor(t * 3.3) + 1200).toLocaleString('en-US')} TASKS`);
      },
      monitoring(t, dt){
        if (!st){ st = { buf: [], acc: 0, alerts: 0 }; }
        const n = Math.floor((W - 32) / 6);
        const val = tt => .45 + .16 * Math.sin(tt * 1.3) + .1 * Math.sin(tt * 3.7 + 1) + rnd(-.05, .05);
        while (st.buf.length < n) st.buf.push({ v: val(st.buf.length * .2), a: false });
        st.acc += dt * 12;
        while (st.acc >= 1){ st.acc--; let v = val(t); const spike = Math.random() < .04; if (spike) v += rnd(.28, .4); st.buf.push({ v: Math.min(.98, v), a: v > .8 }); if (v > .8) st.alerts++; st.buf.shift(); }
        const top = 46, bot = H * .74, Y = v => bot - (bot - top) * v, thr = Y(.8);
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(16, thr); ctx.lineTo(W - 16, thr); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = `10px ${MONO}`; ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillText('THRESHOLD', W - 82, thr - 6);
        st.buf.forEach((b, i) => { const x = 16 + i * 6; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, Y(b.v), 1, bot - Y(b.v)); });
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.25; ctx.beginPath();
        st.buf.forEach((b, i) => { const x = 16 + i * 6, y = Y(b.v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.lineWidth = 1;
        ctx.font = `11px ${MONO}`; ctx.textAlign = 'center';
        st.buf.forEach((b, i) => { if (!b.a) return; const x = 16 + i * 6, y = Y(b.v); ctx.fillStyle = '#A091F5'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillText('▲', x, y - 8); });
        ctx.textAlign = 'left';
        header('LIVE · 4 STREAMS', `${st.alerts} ALERTS`);
      },
    };
    const draw = modes[mode] || modes.research;
    return (t, dt) => { fit(); if (!W) return; ctx.clearRect(0, 0, W, H); draw(t, dt); };
  }
})();
