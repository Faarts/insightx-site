/* ---------------- Agent Scene — "Beyond Applications. Towards Autonomous Intelligence." (in development) ----------------
   A blueprint of an agent network assembles as the section is scrolled: nodes start as dashed outlines, then get
   built and wired up; packets begin to move between them. The build never reaches 100% — it is coming soon.
   The pointer acts as a light that brings nearby parts of the blueprint forward. */
(() => {
  const sec = document.getElementById('agent-scene'); if (!sec) return;
  const { reduce, MONO, clamp } = window.IXP;
  const sticky = sec.querySelector('.pa-sticky'), cv = sec.querySelector('.pa-net'), ctx = cv.getContext('2d');
  const paras = [...sec.querySelectorAll('.pa-paras p')], soon = sec.querySelector('.pa-soon'), soonText = soon.querySelector('[data-pscramble]');
  const logEl = sec.querySelector('.pa-log');
  const MAJOR = [['RESEARCH', 'AGENT'], ['ANALYSIS', 'AGENT'], ['MONITOR', 'AGENT'], ['EXECUTION', 'AGENT']];
  let W = 0, H = 0, nodes = [], edges = [], packets = [], mx = null, my = null, lx = -999, ly = -999, last = performance.now(), b = 0;

  function build(){
    const mob = W <= 900;
    // the network lives in the band between the headline and the bottom copy
    const sr = sticky.getBoundingClientRect(), hb = sec.querySelector('.pa-head').getBoundingClientRect().bottom - sr.top;
    const pt = sec.querySelector('.pa-paras').getBoundingClientRect().top - sr.top;
    const x0 = mob ? W * .08 : W * .3, x1 = mob ? W * .92 : W * .97;
    const y0 = mob ? hb + 34 : Math.max(H * .56, hb + 60), y1 = mob ? Math.max(y0 + 60, pt - 34) : H * .77;
    let s = 11; const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    nodes = [];
    const majorPos = mob ? [[.15, .25], [.55, .1], [.85, .55], [.4, .85]] : [[.08, .35], [.38, .12], [.66, .6], [.92, .22]];
    majorPos.forEach(([u, v], i) => nodes.push({ x: x0 + u * (x1 - x0), y: y0 + v * (y1 - y0), major: i, at: .08 + i * .17 }));
    const minor = mob ? 16 : 30;
    for (let i = 0; i < minor; i++){
      let x, y, ok, tries = 0;
      do { x = x0 + rand() * (x1 - x0); y = y0 + rand() * (y1 - y0); ok = nodes.every(n => Math.hypot(n.x - x, n.y - y) > (n.major !== undefined ? 90 : 46)); } while (!ok && ++tries < 40);
      nodes.push({ x, y, at: .05 + rand() * .82, g: '01#%&@<>/=+*'[(rand() * 12) | 0] });
    }
    edges = [];
    nodes.forEach((n, i) => {
      nodes.map((m, j) => [j, Math.hypot(m.x - n.x, m.y - n.y)]).filter(([j]) => j !== i).sort((a, c) => a[1] - c[1]).slice(0, n.major !== undefined ? 4 : 2)
        .forEach(([j]) => { if (!edges.some(e => (e.a === i && e.b === j) || (e.a === j && e.b === i))) edges.push({ a: i, b: j }); });
    });
  }

  if (document.fonts) document.fonts.ready.then(() => { W = 0; });   // headline height changes once Geist loads
  addEventListener('pointermove', e => { const r = sticky.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });

  let soonPlayed = false, lastLog = '';
  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!window.IXP.visible(sec)) return;
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; build(); }
    if (!W) return;
    const t = now / 1000, P = window.IXP.progress(sec);
    const tb = clamp(P / .8);
    b += (tb - b) * (reduce ? 1 : Math.min(1, dt * 5));
    // copy reveals
    paras.forEach((p, i) => p.classList.toggle('in', b > .1 + i * .18 || P > .02 && reduce));
    if (b > .78 && !soonPlayed){ soonPlayed = true; soon.classList.add('in'); window.IXP.play(soonText, 0, 1000); }
    const pct = Math.round(b * 72);
    const log = `agent-graph · compile<br>core agents <b>${Math.min(4, Math.floor(b / .17 + .5))} / 4</b><br>protocol <b>open-agent/0.1</b><br>status <em>in development</em><br>build <b>${pct}%</b>`;
    if (log !== lastLog && logEl){ logEl.innerHTML = log; lastLog = log; }

    if (mx !== null){ lx += ((mx) - lx) * .12; ly += ((my) - ly) * .12; }
    const light = (x, y) => lx < -900 ? 0 : Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (2 * 170 * 170));

    ctx.clearRect(0, 0, W, H);
    // blueprint dot grid
    const gs = 28;
    for (let x = gs / 2; x < W; x += gs) for (let y = gs / 2; y < H; y += gs){
      const a = .05 + .25 * light(x, y); ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.fillRect(x, y, 1, 1);
    }
    // edges: dashed until both ends are built, then drawn out solid
    edges.forEach(e => {
      const A = nodes[e.a], B = nodes[e.b], built = Math.min(clamp((b - A.at) * 6), clamp((b - B.at) * 6));
      const L = .1 + .35 * light((A.x + B.x) / 2, (A.y + B.y) / 2);
      ctx.strokeStyle = `rgba(255,255,255,${(.07 + L * .5).toFixed(3)})`; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
      if (built > 0){
        const major = A.major !== undefined || B.major !== undefined;
        ctx.strokeStyle = major ? `rgba(160,145,245,${(.35 + L).toFixed(3)})` : `rgba(255,255,255,${(.22 + L).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x + (B.x - A.x) * built, A.y + (B.y - A.y) * built); ctx.stroke();
        if (built >= 1 && !reduce && Math.random() < dt * .35) packets.push({ e, u: 0, dir: Math.random() < .5 });
      }
    });
    for (let i = packets.length - 1; i >= 0; i--){
      const p = packets[i]; p.u += dt * .7; if (p.u >= 1){ packets.splice(i, 1); continue; }
      const A = nodes[p.dir ? p.e.a : p.e.b], B = nodes[p.dir ? p.e.b : p.e.a];
      ctx.fillStyle = '#A091F5'; ctx.fillRect(A.x + (B.x - A.x) * p.u - 1.5, A.y + (B.y - A.y) * p.u - 1.5, 3, 3);
    }
    // nodes
    ctx.textBaseline = 'alphabetic';
    nodes.forEach(n => {
      const k = clamp((b - n.at) * 5), L = light(n.x, n.y);
      if (n.major !== undefined){
        const [l1, l2] = MAJOR[n.major], bw = 112, bh = 40, x = n.x - bw / 2, y = n.y - bh / 2;
        ctx.fillStyle = '#000'; ctx.fillRect(x, y, bw, bh);
        if (k < 1){ ctx.strokeStyle = `rgba(255,255,255,${(.3 + L * .5).toFixed(3)})`; ctx.setLineDash([3, 3]); ctx.strokeRect(x + .5, y + .5, bw - 1, bh - 1); ctx.setLineDash([]); }
        if (k > 0){ ctx.strokeStyle = `rgba(160,145,245,${k})`; ctx.strokeRect(x + .5, y + .5, (bw - 1) * k, bh - 1); }
        ctx.font = `10px ${MONO}`; ctx.textAlign = 'left';
        ctx.fillStyle = k > 0 ? '#fff' : `rgba(255,255,255,${(.35 + L * .5).toFixed(3)})`; ctx.fillText(`${l1} ${l2}`, x + 9, y + 17);
        ctx.fillStyle = k >= 1 ? '#A091F5' : 'rgba(255,255,255,.4)';
        ctx.fillText(k >= 1 ? 'PROTOTYPE' : k > 0 ? `BUILDING ${Math.round(k * 100)}%` : 'QUEUED', x + 9, y + 31);
      } else {
        const s = 5;
        if (k < 1){ ctx.strokeStyle = `rgba(255,255,255,${(.18 + L * .6).toFixed(3)})`; ctx.setLineDash([2, 2]); ctx.strokeRect(n.x - s + .5, n.y - s + .5, s * 2 - 1, s * 2 - 1); ctx.setLineDash([]); }
        if (k > 0){
          ctx.fillStyle = `rgba(255,255,255,${(k * (.6 + L * .4)).toFixed(3)})`; ctx.font = `10px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(n.g, n.x, n.y + 4);
          if (k < 1){ ctx.strokeStyle = `rgba(160,145,245,${(1 - k).toFixed(3)})`; ctx.beginPath(); ctx.arc(n.x, n.y, 4 + k * 14, 0, 6.283); ctx.stroke(); }
        }
      }
    });
    ctx.textAlign = 'left';
  }
  requestAnimationFrame(frame);
})();
