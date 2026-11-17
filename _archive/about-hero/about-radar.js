/* ---------------- About hero, option "radar" — scanning the world for signal ----------------
   A scope on the right sweeps continuously. Each pass lights the fragments it crosses: most are noise and fade
   straight back out; the insights stay lit in violet with their label. Blips drift in from the edge, so the
   picture keeps changing. Hovering a blip reveals it; the pointer inside the scope shows a bearing line.
   The InsightX mark sits at the centre. Runs only when the hero is in radar mode (?hero=radar). */
(() => {
  const sec = document.querySelector('.ab-hero'); if (!sec || sec.dataset.hero !== 'radar') return;
  const { reduce, MONO, clamp } = window.IXP;
  const cv = sec.querySelector('.ab-viz'), ctx = cv.getContext('2d');
  const sigEl = sec.querySelector('.ab-sig'), insEl = sec.querySelector('.ab-ins');
  const pathEl = document.querySelector('#ix-mark path'), mark = pathEl ? new Path2D(pathEl.getAttribute('d')) : null;
  const NOISE = ['rumour', 'duplicate story', 'forum post', 'reply', 'rss item', 'updated 2m ago', 'screenshot', 'thread 4/12', 'press release', 'headline', 'comment', 'paywalled article'];
  const INSIGHT = ['TREND DETECTED', 'KEY FINDING', 'SUPPLY SIGNAL', 'GUIDANCE RAISED', 'WHALE MOVE', 'POLICY SHIFT', 'NEW RESEARCH', 'MARKET MOVE'];
  const SPEED = 1.05;                                         // radians per second
  let W = 0, H = 0, cx = 0, cy = 0, R = 0, blips = [], mx = null, my = null, last = performance.now(), ang = -Math.PI / 2, nSig = 0, nIns = 0, hudT = 0;

  function spawn(fresh){
    const ins = Math.random() < .28;
    return { a: Math.random() * Math.PI * 2, r: .18 + Math.random() * .78, ins, txt: ins ? INSIGHT[Math.random() * INSIGHT.length | 0] : NOISE[Math.random() * NOISE.length | 0],
      lit: 0, life: fresh ? 1 : 0, age: 0, drift: (Math.random() - .5) * .02, seen: false };
  }
  function layout(){
    const mob = W <= 900;
    R = mob ? Math.min(W * .42, H * .26) : Math.min(H * .33, W * .2);
    cx = mob ? W / 2 : W - (W * .06) - R - 40; cy = mob ? 96 + R + 10 : H * .44;
    blips = Array.from({ length: mob ? 18 : 26 }, () => spawn(true));
  }

  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!window.IXP.visible(sec)) return;
    const [w, h, ch] = window.IXP.fit(cv, ctx);
    if (ch || w !== W || h !== H){ W = w; H = h; layout(); }
    const prev = ang; if (!reduce) ang += SPEED * dt;
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);

    // scope: rings, cross, ticks
    ctx.lineWidth = 1;
    for (let k = 1; k <= 4; k++){ ctx.strokeStyle = k === 4 ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.09)'; ctx.beginPath(); ctx.arc(cx, cy, R * k / 4, 0, 6.283); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    for (let d = 0; d < 360; d += 5){
      const a = d * Math.PI / 180, l = d % 30 === 0 ? 10 : 4;
      ctx.strokeStyle = d % 30 === 0 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.14)';
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4)); ctx.lineTo(cx + Math.cos(a) * (R + 4 + l), cy + Math.sin(a) * (R + 4 + l)); ctx.stroke();
    }
    // sweep wedge (trailing fade)
    if (ctx.createConicGradient){
      const g = ctx.createConicGradient(ang - 1.1, cx, cy);
      g.addColorStop(0, 'rgba(160,145,245,0)'); g.addColorStop(.175, 'rgba(160,145,245,.16)'); g.addColorStop(.1751, 'rgba(160,145,245,0)'); g.addColorStop(1, 'rgba(160,145,245,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, ang - 1.1, ang); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(160,145,245,.9)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.stroke();

    // blips
    const norm = a => ((a % 6.2832) + 6.2832) % 6.2832;
    let hover = null;
    ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'middle';
    blips.forEach((b, i) => {
      b.age += dt; b.r = clamp(b.r - b.drift * dt, .12, .98); b.life = Math.min(1, b.life + dt);
      // did the sweep just pass over it?
      const swept = norm(b.a - prev) <= norm(ang - prev) && ang !== prev;
      if (swept || reduce){ b.lit = 1; if (!b.seen){ b.seen = true; nSig++; if (b.ins) nIns++; } }
      b.lit = Math.max(0, b.lit - dt / (b.ins ? 5.5 : 1.4));
      const x = cx + Math.cos(b.a) * b.r * R, y = cy + Math.sin(b.a) * b.r * R;
      if (mx !== null && Math.hypot(mx - x, my - y) < 16) hover = { b, x, y };
      const a = b.life * (.12 + .88 * b.lit);
      if (b.ins){
        ctx.fillStyle = `rgba(160,145,245,${a})`; ctx.fillRect(x - 3, y - 3, 6, 6);
        if (b.lit > .05){ ctx.strokeStyle = `rgba(160,145,245,${b.lit * .6})`; ctx.beginPath(); ctx.arc(x, y, 6 + (1 - b.lit) * 14, 0, 6.283); ctx.stroke();
          ctx.textAlign = 'left';                      // labels always to the right, away from the headline
          ctx.fillStyle = `rgba(255,255,255,${Math.min(1, b.lit * 1.6)})`; ctx.fillText(b.txt, x + 12, y); }
      } else {
        ctx.fillStyle = `rgba(200,203,208,${a * .8})`; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        if (b.lit > .55){ ctx.textAlign = 'left'; ctx.fillStyle = `rgba(120,120,120,${(b.lit - .55) * 2})`; ctx.fillText(b.txt, x + 8, y); }
      }
      // old blips are replaced by new ones over time
      if (b.age > 9 + (i % 7) && b.lit < .02) blips[i] = spawn(false);
    });

    // pointer: bearing line + hovered blip label
    if (mx !== null && Math.hypot(mx - cx, my - cy) < R){
      ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);
      const brg = Math.round(norm(Math.atan2(my - cy, mx - cx) + Math.PI / 2) * 180 / Math.PI) % 360, rng = Math.hypot(mx - cx, my - cy) / R;
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(146,146,146,1)'; ctx.fillText(`BRG ${String(brg).padStart(3, '0')}° · RNG ${rng.toFixed(2)}`, mx + 12, my + 14);
    }
    if (hover){
      const { b, x, y } = hover; ctx.strokeStyle = b.ins ? '#A091F5' : 'rgba(255,255,255,.7)'; ctx.strokeRect(x - 7, y - 7, 14, 14);
      ctx.textAlign = 'left'; ctx.fillStyle = b.ins ? '#A091F5' : '#fff'; ctx.fillText(b.ins ? b.txt : b.txt.toUpperCase() + ' · NOISE', x + 12, y - 14);
    }

    // the InsightX mark at the centre
    if (mark){
      const mw = Math.max(28, R * .16), s = mw / 33;
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, mw * .72, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
      ctx.save(); ctx.translate(cx - mw / 2, cy - mw * 26 / 33 / 2); ctx.scale(s, s); ctx.fillStyle = '#F8F1E7'; ctx.fill(mark); ctx.restore();
    }
    if ((hudT += dt) > .25){ hudT = 0; if (sigEl) sigEl.textContent = nSig.toLocaleString('en-US'); if (insEl) insEl.textContent = nIns.toLocaleString('en-US'); }
  }
  addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  sec.addEventListener('pointerleave', () => { mx = null; });
  requestAnimationFrame(frame);
})();
