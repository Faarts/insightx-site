/* ---------------- Products hero — the InsightX ecosystem in orbit ----------------
   A sphere of text glyphs (the same "information made of characters" language as the home globe) is the core.
   Three tilted orbits carry the products: Intelligence, Prediction Market and Agent Scene (dashed: still being built).
   Loose characters drift in from the edges and are pulled into the core; data packets ride the orbits.
   The pointer tilts the system; clicking a product node scrolls to its section. */
(() => {
  const cv = document.querySelector('.pp-orbit'); if (!cv) return;
  const { reduce, MONO, clamp } = window.IXP;
  const hero = cv.closest('.pp-hero'), ctx = cv.getContext('2d'), sigEl = document.getElementById('pp-sig');
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.random() * a.length | 0];
  const GL = '0123456789ABCDEF#%&@<>/=+*';

  const ORBITS = [
    { r: .44, roll: -.2,  sp: .15, a0: .5,  n: '01', name: 'InsightX Intelligence', sub: 'Flagship · Live',        short: 'Intelligence', href: '#intelligence' },
    { r: .7,  roll: -.08, sp: .095, a0: 2.6, n: '02', name: 'Prediction Market',     sub: 'On-chain · Live',        short: 'Markets',      href: '#prediction-market' },
    { r: .96, roll: .07,  sp: .06, a0: 4.4, n: '03', name: 'Agent Scene',           sub: 'In development',         short: 'Agents',       href: '#agent-scene', dev: true },
  ];
  // core: fibonacci sphere of glyphs
  const NC = 360, CORE = Array.from({ length: NC }, (_, i) => {
    const y = 1 - (i + .5) / NC * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
    return { x: Math.cos(th) * r, y, z: Math.sin(th) * r, g: pick(GL), next: rnd(0, 3) };
  });
  let W = 0, H = 0, R = 0, cx = 0, cy = 0, mobile = false;
  let px = 0, py = 0, tpx = 0, tpy = 0, hover = -1, sig = 12840;
  const drift = [], packets = [], beams = [], nodes = [];

  function layout(){
    mobile = W <= 900;
    if (mobile){ cx = W * .5; cy = H * .27; R = Math.min(W * .5, H * .25); }
    else { cx = W * .66; cy = H * .42; R = Math.min(W * .3, H * .48); }
    drift.length = 0;
    for (let i = 0; i < (mobile ? 70 : 150); i++) drift.push(newDrift(true));
  }
  function newDrift(anywhere){
    const a = rnd(0, 6.283), d = anywhere ? rnd(.4, 1.6) : rnd(1.3, 1.7);
    return { a, d, sp: rnd(.05, .14), g: pick('01'), s: rnd(.6, 1) };
  }

  // 3D: orbit plane is XZ, rolled around Z, pitched toward the viewer, yawed by the pointer
  function proj(x, y, z, roll){
    let c = Math.cos(roll), s = Math.sin(roll);
    [x, y] = [x * c - y * s, x * s + y * c];
    const pitch = .4 + py * .12; c = Math.cos(pitch); s = Math.sin(pitch);
    [y, z] = [y * c - z * s, y * s + z * c];
    const yaw = px * .35; c = Math.cos(yaw); s = Math.sin(yaw);
    [x, z] = [x * c + z * s, -x * s + z * c];
    const f = 3.4 / (3.4 + z);
    return [cx + x * R * f, cy + y * R * f, z, f];
  }

  let last = performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const hp = clamp(scrollY / (hero.offsetHeight || 1));
    if (hp >= 1) return;
    const [w, h, changed] = window.IXP.fit(cv, ctx);
    if (changed || w !== W || h !== H){ W = w; H = h; layout(); }
    if (!W) return;
    const t = reduce ? 8 : now / 1000;
    px += (tpx - px) * .05; py += (tpy - py) * .05;
    // leaving the hero: the system grows and dims
    const zoom = 1 + hp * .5, fade = 1 - hp * .9;
    const R0 = R; R *= zoom;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = fade;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // drifting characters pulled into the core
    ctx.font = `10px ${MONO}`;
    for (const p of drift){
      if (!reduce){ p.d -= p.sp * dt * (1.2 - p.d * .3); p.a += dt * .12 / Math.max(.3, p.d); }
      if (p.d < .2) Object.assign(p, newDrift(false));
      const x = cx + Math.cos(p.a) * p.d * R * 1.5, y = cy + Math.sin(p.a) * p.d * R * .9;
      const al = clamp((p.d - .2) * 2) * clamp((1.7 - p.d) * 2) * .32 * p.s;
      ctx.fillStyle = `rgba(255,255,255,${al.toFixed(3)})`; ctx.fillText(p.g, x, y);
    }

    // orbit rings — back halves first so the core sits in front of them
    const ringPts = ORBITS.map((o, k) => {
      const pts = [], M = mobile ? 90 : 150;
      for (let i = 0; i <= M; i++){ const a = i / M * 6.2832; pts.push(proj(Math.cos(a) * o.r, 0, Math.sin(a) * o.r, o.roll)); }
      return pts;
    });
    const drawRing = (k, front) => {
      const o = ORBITS[k], pts = ringPts[k];
      ctx.strokeStyle = `rgba(255,255,255,${front ? .26 : .1})`; ctx.lineWidth = 1;
      if (o.dev) ctx.setLineDash([3, 6]);
      ctx.beginPath(); let pen = false;
      for (const p of pts){ const f = p[2] < 0; if (f === front){ pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } else pen = false; }
      ctx.stroke(); ctx.setLineDash([]);
      // glyph beads flowing along the ring
      if (o.dev) return;
      ctx.font = `9px ${MONO}`;
      const B = mobile ? 40 : 64;
      for (let i = 0; i < B; i++){
        const a = (i / B) * 6.2832 + t * o.sp * .6;
        const p = proj(Math.cos(a) * o.r, 0, Math.sin(a) * o.r, o.roll);
        if ((p[2] < 0) !== front) continue;
        ctx.fillStyle = `rgba(255,255,255,${front ? .5 : .16})`; ctx.fillText(i % 3 ? '·' : (i % 2 ? '1' : '0'), p[0], p[1]);
      }
    };
    for (let k = 0; k < 3; k++) drawRing(k, false);

    // core sphere
    const coreR = .26, spin = t * .25;
    const cs = CORE.map(p => {
      const c = Math.cos(spin), s = Math.sin(spin);
      return [p, ...proj((p.x * c + p.z * s) * coreR, p.y * coreR, (-p.x * s + p.z * c) * coreR, 0)];
    }).sort((a, b) => b[3] - a[3]);
    ctx.font = `${mobile ? 9 : 10}px ${MONO}`;
    for (const [p, x, y, z] of cs){
      if (!reduce && t > p.next){ p.g = pick(GL); p.next = t + rnd(.4, 4); }
      const front = clamp(.5 - z / coreR * .5);
      ctx.fillStyle = `rgba(255,255,255,${(.12 + .78 * front * front).toFixed(3)})`; ctx.fillText(p.g, x, y);
    }
    // core ring + label
    const [ccx, ccy] = proj(0, 0, 0, 0);
    ctx.strokeStyle = 'rgba(160,145,245,.35)'; ctx.beginPath(); ctx.arc(ccx, ccy, coreR * R * 1.16, 0, 6.283); ctx.stroke();

    for (let k = 0; k < 3; k++) drawRing(k, true);

    // nodes
    nodes.length = 0;
    ORBITS.forEach((o, k) => {
      const a = o.a0 + (reduce ? 0 : t * o.sp);
      const [x, y, z, f] = proj(Math.cos(a) * o.r, 0, Math.sin(a) * o.r, o.roll);
      nodes.push({ k, x, y, z, a });
    });
    // packets: ride an orbit, then drop into the core
    if (!reduce && Math.random() < dt * 3.2){ const k = Math.random() * 3 | 0; if (!ORBITS[k].dev || Math.random() < .3) packets.push({ k, a: nodes[k].a, life: 0, dur: rnd(1.2, 2.4) }); }
    for (let i = packets.length - 1; i >= 0; i--){
      const p = packets[i], o = ORBITS[p.k]; p.life += dt;
      const u = p.life / p.dur;
      if (u >= 1){ packets.splice(i, 1); beams.push({ k: p.k, a: p.a + p.dur * o.sp * 2.2, life: 0 }); continue; }
      const a = p.a + p.life * o.sp * 2.2;
      for (let j = 0; j < 6; j++){
        const aj = a - j * .02, q = proj(Math.cos(aj) * o.r, 0, Math.sin(aj) * o.r, o.roll);
        ctx.fillStyle = `rgba(160,145,245,${(.9 - j * .14) * (q[2] < 0 ? 1 : .45)})`; ctx.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3);
      }
    }
    for (let i = beams.length - 1; i >= 0; i--){
      const b = beams[i], o = ORBITS[b.k]; b.life += dt;
      const u = b.life / .7; if (u >= 1){ beams.splice(i, 1); sig += 1 + (Math.random() * 7 | 0); continue; }
      const s = proj(Math.cos(b.a) * o.r, 0, Math.sin(b.a) * o.r, o.roll);
      const e = 1 - Math.pow(1 - u, 2), x = s[0] + (ccx - s[0]) * e, y = s[1] + (ccy - s[1]) * e;
      ctx.strokeStyle = `rgba(255,255,255,${(.22 * (1 - u)).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }

    // node markers + callouts (home page "city callout" language: dot, angled leader, boxed tag)
    for (const n of nodes){
      const o = ORBITS[n.k], hot = hover === n.k, back = n.z > 0;
      const al = back ? .55 : 1;
      ctx.globalAlpha = fade * al;
      const s = hot ? 10 : 8;
      ctx.fillStyle = '#000'; ctx.fillRect(n.x - s / 2, n.y - s / 2, s, s);
      ctx.strokeStyle = o.dev ? 'rgba(255,255,255,.8)' : '#fff';
      if (o.dev) ctx.setLineDash([2, 2]);
      ctx.strokeRect(n.x - s / 2 + .5, n.y - s / 2 + .5, s - 1, s - 1); ctx.setLineDash([]);
      if (!o.dev){ ctx.fillStyle = '#A091F5'; ctx.fillRect(n.x - 1.5, n.y - 1.5, 3, 3); }
      else { const pu = (t * .8) % 1; ctx.strokeStyle = `rgba(160,145,245,${(1 - pu) * .8})`; ctx.beginPath(); ctx.arc(n.x, n.y, 6 + pu * 16, 0, 6.283); ctx.stroke(); }
      // leader + tag
      const lx = n.x + 22, ly = n.y - 18;
      ctx.strokeStyle = hot ? '#A091F5' : 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.moveTo(n.x + s / 2, n.y - s / 2); ctx.lineTo(lx, ly); ctx.stroke();
      ctx.font = `10px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const l1 = mobile ? `${o.n} ${o.short.toUpperCase()}` : `${o.n}  ${o.name.toUpperCase()}`, l2 = mobile ? '' : o.sub.toUpperCase();
      const tw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + 16, th = l2 ? 36 : 22;
      let bx = lx, by = ly - th;
      if (bx + tw > W - 8) bx = n.x - 22 - tw;
      ctx.fillStyle = 'rgba(0,0,0,.86)'; ctx.fillRect(bx, by, tw, th);
      ctx.strokeStyle = hot ? '#A091F5' : 'rgba(255,255,255,.35)'; ctx.strokeRect(bx + .5, by + .5, tw - 1, th - 1);
      ctx.fillStyle = '#A091F5'; ctx.fillText(o.n, bx + 8, by + 15);
      ctx.fillStyle = '#fff'; ctx.fillText(l1.slice(o.n.length), bx + 8 + ctx.measureText(o.n).width, by + 15);
      if (l2){ ctx.fillStyle = o.dev ? '#A091F5' : 'rgba(255,255,255,.5)'; ctx.fillText(l2, bx + 8, by + 29); }
      n.box = [bx, by, tw, th];
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    }
    ctx.globalAlpha = 1;
    R = R0;
    if (sigEl) sigEl.textContent = sig.toLocaleString('en-US');
  }
  requestAnimationFrame(frame);

  // pointer: tilt + node hover / click
  const hit = (x, y) => nodes.findIndex(n => Math.hypot(n.x - x, n.y - y) < 18 || (n.box && x >= n.box[0] && x <= n.box[0] + n.box[2] && y >= n.box[1] && y <= n.box[1] + n.box[3]));
  hero.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    tpx = clamp((x / r.width - .5) * 2, -1, 1); tpy = clamp((y / r.height - .5) * 2, -1, 1);
    hover = e.target === cv ? hit(x, y) : -1; cv.style.cursor = hover >= 0 ? 'pointer' : '';
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { tpx = tpy = 0; hover = -1; });
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), k = hit(e.clientX - r.left, e.clientY - r.top);
    if (k >= 0 && window.ppScrollTo) window.ppScrollTo(document.querySelector(ORBITS[k].href));
  });
})();
