/* ---------------- About — section transitions ----------------
   hero → mission is a pull-back, in the spirit of the home page's section 4 → 5 (the film was playing on a TV
   all along): the full-screen information landscape turns out to be seen *through InsightX*. As you scroll, the
   landscape is held on screen inside the cloud silhouette of the InsightX mark, which shrinks (exponentially, so
   the zoom feels even) and glides to the mark at the heart of the mission's reach field — where the mission then
   starts to spread from. It runs over the paced step into the mission plus the first ~30% of the mission's pin,
   so the second half is scrubbed freely, like the home page TV.
   journey → vision is the only other designed hand-over: a left swipe. The roadmap already reads left → right
   (2026 → 2027 → Beyond), so the vision arrives as the next panel along: it slides in from the right edge, led by a
   violet line, while the journey is pushed out to the left (at a slower speed, for depth) and dims.
   Every other section change is a plain scroll on purpose (mission → technology, technology → journey).
   A fixed overlay canvas draws the moving edges (and the mark's outline during the pull-back). Off with reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const IXP = window.IXP || {}, MONO = IXP.MONO || 'monospace', SYM = IXP.SYM || '01#%&@<>/=+*';
  const $ = s => document.querySelector(s);
  const hero = $('.ab-hero'), fx = $('.ab-fx'); if (!hero || !fx) return;
  const ctx = fx.getContext('2d');
  const S = [['#mission', '.am-sticky'], ['#technology', '.at-sticky'], ['#journey', '.aj-sticky'], ['#vision', '.av-sticky']]
    .map(([s, k]) => { const sec = $(s); return sec && { sec, st: sec.querySelector(k) }; }).filter(Boolean);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let px = innerWidth / 2, py = innerHeight / 2, raf = 0, W = 0, H = 0;
  const touched = new Set();

  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  addEventListener('touchstart', e => { px = e.touches[0].clientX; py = e.touches[0].clientY; }, { passive: true });

  function set(el, tf, op, clip){
    touched.add(el);
    el.style.transform = tf || ''; el.style.opacity = op == null ? '' : op; el.style.clipPath = clip || ''; el.style.webkitClipPath = clip || '';
  }
  const reset = el => { if (touched.has(el)){ el.style.transform = ''; el.style.opacity = ''; el.style.clipPath = ''; el.style.webkitClipPath = ''; touched.delete(el); } };

  // --- the four reveals; each returns the clip path (viewport px, same as the held sticky) and draws its edge ---
  const SWIPE = 3;                                    // index in S of the section that swipes in (vision); the rest scroll normally

  // ---- the pull-back: the outer contour of the InsightX mark (its cloud silhouette) as a clip path ----
  const markEl = document.querySelector('#ix-mark path'), markD = markEl ? markEl.getAttribute('d') : '';
  const markPath = markD ? new Path2D(markD) : null;
  const PAIRS = { M: 2, L: 2, T: 2, C: 6, S: 4, Q: 4, H: 1, V: 1, A: 7, Z: 0 };
  function parse(d){ const out = []; d.replace(/([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g, (m, c, n) => { out.push(c ? c : +n); }); return out; }
  // keep the subpath with the largest bounding box = the cloud's outside edge
  const cloud = (() => {
    if (!markD) return [];
    const subs = markD.split(/(?=[Mm])/).map(parse);
    let best = subs[0], area = -1;
    subs.forEach(t => { const nums = t.filter(x => typeof x === 'number'); const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
      const a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); if (a > area){ area = a; best = t; } });
    return best;
  })();
  function cloudPath(s, tx, ty){
    let d = '', cmd = 'M', k = 0;
    for (const t of cloud){
      if (typeof t === 'string'){ cmd = t; k = 0; d += t; continue; }
      const U = cmd.toUpperCase(), abs = cmd === U, n = PAIRS[U] || 2;
      let v;
      if (U === 'H') v = t * s + (abs ? tx : 0);
      else if (U === 'V') v = t * s + (abs ? ty : 0);
      else if (U === 'A'){ const p = k % 7; v = p < 2 ? t * s : p < 5 ? t : t * s + (abs ? (p === 5 ? tx : ty) : 0); }
      else v = t * s + (abs ? (k % 2 === 0 ? tx : ty) : 0);
      d += (k % n === 0 && d.slice(-1) !== cmd ? ' ' : ' ') + v.toFixed(1); k++;
    }
    return d;
  }
  const terrain = hero.querySelector('.ab-terrain'), heroFade = ['.ab-shade', '.ab-par'].map(q => hero.querySelector(q)).filter(Boolean);
  const PULL = .3;                                          // share of the mission's pin that belongs to the pull-back
  function pullBack(q, y){
    const r = window.abReach || { x: W * (W <= 900 ? .82 : .84), y: H * (W <= 900 ? .78 : .7), w: W <= 900 ? 44 : 64 };
    const s0 = Math.max(W / 25, H / 16) * 1.12, s1 = r.w / 33;  // cover the screen → the mission's mark
    const e = q * q * (3 - 2 * q), s = s0 * Math.pow(s1 / s0, e), f = (s0 - s) / (s0 - s1);   // log-scale zoom: even speed, soft ends
    const cx = W / 2 + (r.x - W / 2) * f, cy = H / 2 + (r.y - H / 2) * f;
    const tx = cx - 16.5 * s, ty = cy - 13 * s;
    terrain.dataset.live = '1'; terrain.style.zIndex = '3'; terrain.style.background = '#000';   // opaque, so the mission behind only shows outside the window
    const fade = q > .85 ? (1 - (q - .85) / .15).toFixed(3) : null;     // hand over to the mission's own mark
    set(terrain, `translate3d(0,${y.toFixed(1)}px,0)`, fade, `path('${cloudPath(s, tx, ty)}')`);
    heroFade.forEach(el => set(el, `translate3d(0,${y.toFixed(1)}px,0)`, Math.max(0, 1 - q * 4).toFixed(3), null));
    if (markPath){                                          // the mark's outline rides on top of the window
      const a = .85 * clamp((q - .45) / .3) * (q > .9 ? (1 - q) / .1 : 1);
      if (a > .01){ ctx.save(); ctx.translate(tx, ty); ctx.scale(s, s); ctx.fillStyle = `rgba(248,241,231,${a.toFixed(3)})`; ctx.fill(markPath); ctx.restore(); }
    }
    // a hairline frame + caption while the window shrinks, like the TV's bezel coming into view
    const bw = 33 * s, bh = 26 * s;
    if (bw < W * .75 && q < .95){                           // a hairline bezel + caption once the window is smaller than the screen
      const a = clamp((W * .75 - bw) / (W * .3)) * (q > .8 ? (.95 - q) / .15 : 1);
      ctx.strokeStyle = `rgba(255,255,255,${(.2 * a).toFixed(3)})`; ctx.lineWidth = 1; ctx.strokeRect(tx - 12, ty - 12, bw + 24, bh + 24);
      ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'top'; ctx.fillStyle = `rgba(160,145,245,${a.toFixed(3)})`;
      const cap = 'THE WORLD, THROUGH INSIGHTX', cw = ctx.measureText(cap).width;
      const cxp = tx - 12 + cw > W - 12 ? tx + bw + 12 - cw : tx - 12;    // keep the caption on screen
      if (ty + bh + 22 < H - 12) ctx.fillText(cap, Math.max(12, cxp), ty + bh + 22);
    }
  }
  function endPull(){ if (terrain){ reset(terrain); terrain.style.zIndex = ''; terrain.style.background = ''; delete terrain.dataset.live; } heroFade.forEach(reset); }

  function update(){
    raf = 0;
    const vh = innerHeight, y = scrollY;
    if (fx.width !== Math.round(innerWidth * Math.min(2, devicePixelRatio || 1)) || fx.height !== Math.round(vh * Math.min(2, devicePixelRatio || 1))){
      const dpr = Math.min(2, devicePixelRatio || 1); fx.width = Math.round(innerWidth * dpr); fx.height = Math.round(vh * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    W = innerWidth; H = vh;
    ctx.clearRect(0, 0, W, H);
    // 1 · hero → mission pull-back (scroll from the top to PULL of the mission's pin)
    const mis = S[0], misTop = mis ? mis.sec.offsetTop : vh, endQ = misTop + (mis ? (mis.sec.offsetHeight - vh) * PULL : 0);
    const pulling = mis && terrain && y > 0 && y < endQ;
    if (pulling){
      pullBack(clamp(y / endQ), y);
      const o0 = clamp((y + vh - misTop) / vh);
      if (o0 < 1) set(mis.st, `translate3d(0,${(-(1 - o0) * vh).toFixed(1)}px,0)`, null, null); else reset(mis.st);
    } else endPull();

    // journey → vision: left swipe
    let active = -1, o = 0;
    const sw = S[SWIPE];
    if (sw){ const v = (y + vh - sw.sec.offsetTop) / vh; if (v > 0 && v < 1){ active = SWIPE; o = v; } }
    S.forEach((s, i) => { if (i !== active && i !== active - 1 && !(pulling && i === 0)) reset(s.st); });
    if (active < 1) return;

    // both sections are held vertically (incoming at the top, outgoing where it was); the movement is all sideways
    const e = ease(o), hold = (1 - o) * vh, keep = o * vh, edge = W * (1 - e);
    set(S[active].st, `translate3d(${edge.toFixed(1)}px,${(-hold).toFixed(1)}px,0)`, null, null);
    set(S[active - 1].st, `translate3d(${(-W * .35 * e).toFixed(1)}px,${keep.toFixed(1)}px,0)`, (1 - e * .6).toFixed(3), null);
    // the leading edge: a violet line with a soft glow trailing into the outgoing section
    if (edge > 1 && edge < W - 1){
      const g = ctx.createLinearGradient(edge - 90, 0, edge, 0);
      g.addColorStop(0, 'rgba(160,145,245,0)'); g.addColorStop(1, 'rgba(160,145,245,.14)');
      ctx.fillStyle = g; ctx.fillRect(edge - 90, 0, 90, H);
      ctx.fillStyle = 'rgba(160,145,245,.95)'; ctx.fillRect(edge - 1, 0, 2, H);
    }
  }
  function queue(){ if (!raf) raf = requestAnimationFrame(update); }
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  update();
})();
