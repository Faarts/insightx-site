/* ---------------- Section 4 — "film": a live-rendered news / research montage behind the copy ----------------
   Six scenes cut every 3.2 s (headlines, research paper, global map, markets, feeds, signals),
   with a slow push-in, a flash on each cut, scanlines and film grain. Rendered only while on screen. */
(() => {
  const sec = document.getElementById('platform');
  if (!sec) return;
  const out = sec.querySelector('.s4-film');
  let cv = document.createElement('canvas'), ctx = cv.getContext('2d');       // composed frame (footage + graphics)
  const tcEl = sec.querySelector('.s4-tc');
  const SANS = '"Geist", system-ui, sans-serif', MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
  const DUR = 2.8, NAMES = ['Headlines', 'Research', 'Global', 'Markets', 'Feeds', 'Signals'];
  // Stock footage: Mixkit Free License (mixkit.co) — free for commercial use, no attribution required
  const CLIPS = {
    'reporter-street': ['Field report', 'Live from the street'], 'press-conference': ['Briefing', 'Officials address the press'],
    'newscaster': ['Newsroom', 'Developing stories this hour'], 'newspaper': ['Print', 'Morning editions roll out'],
    'microscope': ['Laboratory', 'New findings under review'], 'stock-market': ['Markets', 'Traders watch the open'],
    'city-night': ['City', 'Cities never stop generating data'], 'typing': ['Desk', 'Analysts file new reports'],
    'earth-satellite': ['Orbit', 'Satellite data streams in'],
  };
  // The clips live in the DOM (Safari won't buffer detached <video>s). Normally they're invisible and get composited
  // through the CRT shader; when the page is opened straight from disk (file://) the browser taints any canvas a video
  // is drawn into, so WebGL can't read it — then the videos show directly under a transparent CRT pass instead.
  let direct = location.protocol === 'file:';
  const vlayer = document.createElement('div'); vlayer.className = 's4-vlayer'; out.before(vlayer);
  const vids = {};
  for (const k of Object.keys(CLIPS)){ const v = document.createElement('video'); v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.dataset.src = `assets/footage/${k}.mp4`; vlayer.appendChild(v); vids[k] = v; }
  // don't pull ~3.5 MB of footage on page load: attach the sources once the visitor is within ~1.5 screens of section 4
  const loadClips = () => { for (const v of Object.values(vids)) if (!v.src){ v.src = v.dataset.src; v.preload = 'auto'; } };
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)){ loadClips(); io.disconnect(); } }, { rootMargin: '150% 0px' });
    io.observe(sec);
  } else loadClips();
  const goDirect = () => { direct = true; sec.classList.add('direct'); cv = document.createElement('canvas'); ctx = cv.getContext('2d'); W = H = 0; };
  if (direct) sec.classList.add('direct');
  // running order: real footage intercut with the graphic scenes
  const SHOTS = [['v','reporter-street'],['g',0],['v','newspaper'],['v','microscope'],['g',1],['v','stock-market'],['g',3],['v','city-night'],['g',2],['v','earth-satellite'],['v','typing'],['g',4],['v','newscaster'],['g',5],['v','press-conference']];
  let W = 0, H = 0, dpr = 1;
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const VOC = 'signal data market policy model network energy climate supply research index trend source analysis demand region forecast risk report evidence sample dataset method results global'.split(' ');
  const HL = ['Global supply chains rewire', 'New climate dataset released', 'Markets react to policy shift', 'AI research accelerates', 'Record turnout reported', 'Chip demand surges again', 'Ocean heat hits new high', 'Energy prices stabilise'];
  const TAGS = ['WIRE', 'JOURNAL', 'PREPRINT', 'FILING', 'BRIEF', 'DATA'];

  function fit(){
    const w = out.clientWidth, h = out.clientHeight, d = Math.min(1.5, devicePixelRatio || 1);
    if (w !== W || h !== H || d !== dpr){ W = w; H = h; dpr = d; cv.width = w; cv.height = h; out.width = Math.round(w * d); out.height = Math.round(h * d); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  // film grain tile
  const grain = document.createElement('canvas'); grain.width = grain.height = 128;
  { const g = grain.getContext('2d'), im = g.createImageData(128, 128); for (let i = 0; i < im.data.length; i += 4){ const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 26; } g.putImageData(im, 0, 0); }
  const scan = document.createElement('canvas'); scan.width = 4; scan.height = 4;
  { const g = scan.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 4, 1); }
  // land mask for the map scene (same dataset as the globe; the browser has it cached)
  let land = null;
  (async () => { try {
    const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json').then(r => r.json());
    const f = topojson.feature(topo, topo.objects.land), feats = f.features || [f];
    const c = document.createElement('canvas'); c.width = 360; c.height = 180; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.beginPath();
    for (const ft of feats){ const g = ft.geometry; if (!g) continue; for (const poly of (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)) for (const ring of poly){ ring.forEach(([lo, la], i) => i ? x.lineTo(lo + 180, 90 - la) : x.moveTo(lo + 180, 90 - la)); x.closePath(); } }
    x.fill(); land = x.getImageData(0, 0, 360, 180).data;
  } catch (e) {} })();

  const text = (s, x, y, size, font, a = 1, align = 'left') => { ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText(s, x, y); };

  const scenes = [
    // 1 — headlines typing in, drifting, with an inverted ticker band
    (tl, t, loop) => {
      const fs = H * .105; ctx.textBaseline = 'alphabetic';
      for (let i = 0; i < 5; i++){
        const s = HL[(i + loop * 3) % HL.length], n = Math.floor(clamp((tl - i * .22) * 22, 0, s.length));
        const y = H * (.2 + i * .165), x = W * .04 + (i % 2 ? -1 : 1) * tl * 18 - (i % 2) * W * .06;
        text(`${String(8 + i).padStart(2, '0')}:4${i} UTC · ${TAGS[(i + loop) % TAGS.length]}`, x, y - fs * .92, Math.max(10, H * .014), MONO, .5);
        ctx.font = `600 ${fs}px ${SANS}`; ctx.textAlign = 'left'; ctx.fillStyle = `rgba(255,255,255,${i === 2 ? 1 : .32})`; ctx.fillText(s.slice(0, n), x, y);
        if (n < s.length && n > 0){ const w = ctx.measureText(s.slice(0, n)).width; ctx.fillRect(x + w + 6, y - fs * .72, fs * .06, fs * .78); }
      }
      const by = H * .9, bh = H * .05; ctx.fillStyle = '#fff'; ctx.fillRect(0, by, W, bh);
      const tick = 'MARKETS ▲ 2.1%    ENERGY ▼ 0.8%    CLIMATE DATA +312 SOURCES    RESEARCH 1,284 NEW PAPERS    POLICY 46 UPDATES    SUPPLY ▲ 0.6%    ';
      ctx.font = `500 ${bh * .42}px ${MONO}`; ctx.fillStyle = '#000'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(tick).width, off = -(t * 140 % tw);
      for (let x = off; x < W; x += tw) ctx.fillText(tick, x, by + bh / 2);
      ctx.textBaseline = 'alphabetic';
    },
    // 2 — research paper: title, two columns, highlight sweeping, citation marks
    (tl) => {
      const r = rng(7), pan = -tl * H * .05, fs = Math.max(11, H * .016), lh = fs * 1.7, colW = W * .3;
      text('PREPRINT · 2026 · 48 PP · DOI 10.0000/IX.2026.0412', W * .08, H * .14 + pan, Math.max(10, H * .014), MONO, .55);
      ctx.font = `500 ${H * .068}px ${SANS}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      ctx.fillText('On the Structure of', W * .08, H * .24 + pan); ctx.fillText('Information Networks', W * .08, H * .24 + H * .072 + pan);
      ctx.font = `${fs}px ${MONO}`;
      for (let c = 0; c < 2; c++) for (let i = 0; i < 26; i++){
        const x = W * .08 + c * (colW + W * .05), y = H * .42 + i * lh + pan; let line = '', k = 0;
        while (ctx.measureText(line).width < colW - 60 && k++ < 12) line += VOC[Math.floor(r() * VOC.length)] + ' ';
        const hot = (c === 0 && i === 5) || (c === 1 && i === 9) || (c === 0 && i === 14);
        if (hot){ const w = ctx.measureText(line).width * clamp(tl * .9 - (i % 3) * .15); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(x - 3, y - fs * .95, w, fs * 1.3); }
        ctx.fillStyle = hot ? '#000' : 'rgba(255,255,255,.28)'; ctx.fillText(line, x, y);
        if (hot) text(`[${12 + i}]`, x + colW + 4, y, fs, MONO, .9);
      }
    },
    // 3 — global: dotted world map, pulses and connecting arcs
    (tl) => {
      const mw = W * 1.04, mh = mw / 2, ox = (W - mw) / 2, oy = (H - mh) / 2 + H * .04, s = Math.max(6, Math.round(W / 150));
      if (land){ ctx.fillStyle = 'rgba(255,255,255,.42)';
        for (let y = 0; y < mh; y += s) for (let x = 0; x < mw; x += s){ const lx = Math.floor(x / mw * 360), ly = Math.floor(y / mh * 180); if (land[(ly * 360 + lx) * 4] > 127) ctx.fillRect(ox + x, oy + y, 1.6, 1.6); } }
      const P = [[40.7, -74], [51.5, -.1], [35.7, 139.7], [-6.2, 106.8], [1.35, 103.8], [-23.5, -46.6], [25.2, 55.3], [6.5, 3.4]];
      const pt = ([la, lo]) => [ox + (lo + 180) / 360 * mw, oy + (90 - la) / 180 * mh];
      ctx.lineWidth = 1;
      [[0, 1], [1, 6], [6, 3], [3, 2], [2, 4], [0, 5], [5, 7], [7, 1]].forEach(([a, b], i) => {
        const p = clamp(tl * 1.1 - i * .09); if (!p) return; const A = pt(P[a]), B = pt(P[b]), mx = (A[0] + B[0]) / 2, my = Math.min(A[1], B[1]) - Math.hypot(B[0] - A[0], B[1] - A[1]) * .25;
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(A[0], A[1]);
        for (let k = 1; k <= 30 * p; k++){ const u = k / 30; ctx.lineTo((1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * mx + u * u * B[0], (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * my + u * u * B[1]); }
        ctx.stroke();
      });
      P.forEach((c, i) => { const [x, y] = pt(c), ph = (tl * .9 + i * .13) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${(1 - ph) * .8})`; ctx.beginPath(); ctx.arc(x, y, 4 + ph * 26, 0, 6.283); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
        text(`${Math.abs(c[0]).toFixed(1)}°${c[0] < 0 ? 'S' : 'N'} ${Math.abs(c[1]).toFixed(1)}°${c[1] < 0 ? 'W' : 'E'}`, x + 10, y - 8, Math.max(10, H * .013), MONO, .75); });
    },
    // 4 — markets: big change figure, streaming line chart, candlesticks
    (tl, t) => {
      const r = rng(21), n = 90, top = H * .3, bot = H * .78, x0 = W * .06, x1 = W * .94;
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i <= 6; i++){ const y = top + (bot - top) * i / 6; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
      let v = .5; const pts = []; for (let i = 0; i < n; i++){ v = clamp(v + (r() - .47) * .09, .08, .95); pts.push(v); }
      const shown = Math.floor(n * clamp(.25 + tl / DUR * .9));
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < shown; i++){ const x = x0 + (x1 - x0) * i / (n - 1), y = bot - (bot - top) * pts[i]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.lineWidth = 1;
      const lx = x0 + (x1 - x0) * (shown - 1) / (n - 1), ly = bot - (bot - top) * pts[shown - 1]; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, 6.283); ctx.fill();
      for (let i = 0; i < 46; i++){ const x = x0 + i * ((x1 - x0) / 46), o = r(), c = r(), up = c > o, hgt = H * .07 * (.3 + r());
        const y = H * .88 - hgt; ctx.fillStyle = up ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.25)'; ctx.fillRect(x, y + (up ? 0 : hgt * .2), (x1 - x0) / 46 * .55, hgt * .8); }
      const pct = (2.41 + Math.sin(t * 3) * .03).toFixed(2);
      ctx.font = `600 ${H * .13}px ${SANS}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(`+${pct}%`, W * .94, H * .24); ctx.textAlign = 'left';
      text('GLOBAL INDEX · INTRADAY · LIVE', W * .06, H * .18, Math.max(10, H * .015), MONO, .6);
    },
    // 5 — feeds: three columns of cards streaming upward
    (tl) => {
      const r = rng(5), cols = W > 700 ? 3 : 2, gap = W * .025, cw = (W - gap * (cols + 1)) / cols, ch = H * .2, fs = Math.max(11, H * .016);
      for (let c = 0; c < cols; c++){
        const speed = H * (.12 + c * .05), off = -(tl * speed) % (ch + gap);
        for (let k = -1; k < 7; k++){
          const x = gap + c * (cw + gap), y = gap + k * (ch + gap) + off + (c % 2) * ch * .4, idx = Math.floor(r() * 1000);
          ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.strokeRect(x, y, cw, ch);
          text(`${TAGS[idx % TAGS.length]} · ${1 + idx % 59}m`, x + 16, y + 26, Math.max(10, fs * .85), MONO, .55);
          ctx.font = `500 ${fs * 1.45}px ${SANS}`; ctx.fillStyle = (k + c) % 3 === 0 ? '#fff' : 'rgba(255,255,255,.55)'; ctx.textAlign = 'left';
          ctx.fillText(HL[idx % HL.length], x + 16, y + 26 + fs * 2.1);
          ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let l = 0; l < 3; l++) ctx.fillRect(x + 16, y + 26 + fs * 3.4 + l * fs * 1.2, (cw - 40) * (.5 + r() * .5), fs * .45);
        }
      }
    },
    // 6 — signals: radar sweep with blips and readouts
    (tl, t) => {
      const cx = W * .66, cy = H * .5, R = Math.min(H * .4, W * .3), ang = t * 1.6;
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; for (let i = 1; i <= 4; i++){ ctx.beginPath(); ctx.arc(cx, cy, R * i / 4, 0, 6.283); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); grd.addColorStop(0, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, ang - .5, ang); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.stroke();
      const r = rng(11);
      for (let i = 0; i < 14; i++){ const a = r() * 6.283, d = R * (.15 + r() * .8), since = ((ang - a) % 6.283 + 6.283) % 6.283, al = clamp(1 - since / 4);
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; ctx.fillStyle = `rgba(255,255,255,${al})`; ctx.fillRect(x - 3, y - 3, 6, 6);
        if (al > .5) text(`SIG-${String(i + 1).padStart(2, '0')} ${(d / R * 100).toFixed(0)}`, x + 8, y + 4, Math.max(10, H * .012), MONO, al); }
      const blink = Math.floor(t * 2.5) % 2 ? 1 : .35;
      text('SIGNAL ACQUIRED', W * .06, H * .3, H * .045, MONO, blink);
      ['SOURCES  12,846', 'LATENCY  140 MS', 'CONFIDENCE  0.93', 'FLAGGED  7'].forEach((l, i) => text(l, W * .06, H * .4 + i * H * .045, Math.max(11, H * .018), MONO, .7));
    },
  ];

  const pad = n => String(n).padStart(2, '0');

  // draw a video "cover"-cropped, with a slow push-in, plus a TV lower-third
  function drawFootage(key, tl){
    const v = vids[key];
    for (const k in vids) vids[k].classList.toggle('cur', k === key);
    if (direct){ ctx.clearRect(0, 0, W, H); }
    else if (v.readyState >= 2){
      const vw = v.videoWidth, vh = v.videoHeight, s = Math.max(W / vw, H / vh) * (1.04 + tl / DUR * .06);
      ctx.drawImage(v, (W - vw * s) / 2, (H - vh * s) / 2, vw * s, vh * s);
    } else { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); }
    const [tag, line] = CLIPS[key], y = H * .855, x = W * .03, w = W * .42, a = clamp(tl * 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w * clamp(tl * 3), H * .055);
    ctx.fillStyle = '#000'; ctx.font = `600 ${H * .026}px ${SANS}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (tl > .25) ctx.fillText(line, x + 16, y + H * .0275);
    ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.fillRect(x, y + H * .055, w * clamp(tl * 3 - .2), H * .034);
    ctx.fillStyle = '#fff'; ctx.font = `${Math.max(10, H * .014)}px ${MONO}`;
    if (tl > .4) ctx.fillText(`● LIVE  ·  ${tag.toUpperCase()}  ·  ${pad(8 + Math.floor(tl))}:4${Math.floor(tl * 3) % 10} UTC`, x + 16, y + H * .072);
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
  }

  /* ---- CRT / old-TV pass: convex-lens barrel warp, rounded black corners, chromatic fringe,
          scanlines, rolling bar, noise, flicker, and glitch tears that spike on every cut ---- */
  const gl = out.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  const VS = 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; uv.y = 1. - uv.y; gl_Position = vec4(p, 0., 1.); }';
  const FS = `precision mediump float; varying vec2 uv; uniform sampler2D tex; uniform float t, g, ua; uniform vec2 res;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = uv * 2. - 1.; float r2 = dot(c, c);
      vec2 d = c * (1. + .14 * r2 + .045 * r2 * r2) / 1.12;                 // convex lens: content bulges, edges bend away
      vec2 q = d * .5 + .5;
      float row = floor(q.y * 90.);
      float tear = step(.985 - g * .2, h(vec2(row, floor(t * 14.)))) * (g * .9 + .08);
      q.x += (h(vec2(row, floor(t * 30.))) - .5) * .09 * tear;              // horizontal tearing lines
      q.x += sin(q.y * 120. + t * 9.) * .0007 + (h(vec2(floor(t * 24.), 1.)) - .5) * .004 * g;   // wobble + jitter
      q.y += step(.995, h(vec2(floor(t * 3.), 7.))) * .02 * sin(t * 40.);   // rare vertical hop
      q.x += (h(vec2(row, floor(t * 60.))) - .5) * .0022;                    // constant line jitter (weak sync)
      float yb = fract(t * .065), trk = smoothstep(.05, 0., abs(q.y - yb));  // VHS tracking band drifting down
      q.x += (h(vec2(floor(q.y * 300.), floor(t * 40.))) - .5) * .035 * trk;
      float edge = smoothstep(0., .012, q.x) * smoothstep(1., .988, q.x) * smoothstep(0., .012, q.y) * smoothstep(1., .988, q.y);
      float ca = .0018 + .004 * r2 + g * .012;
      vec3 col = vec3(texture2D(tex, q + vec2(ca, 0.)).r, texture2D(tex, q).g, texture2D(tex, q - vec2(ca, 0.)).b);
      col = col * .6 + (texture2D(tex, q + vec2(.0015, 0.)).rgb + texture2D(tex, q - vec2(.0015, 0.)).rgb) * .2;   // soft, low-bandwidth picture
      col += texture2D(tex, q - vec2(.011, 0.)).rgb * .22;                   // ghosting (multipath echo)
      float l = dot(col, vec3(.299, .587, .114));
      col = mix(vec3(l), col, .14) * vec3(1.02, 1., .96);                    // near-monochrome, slightly warm
      col = (col - .5) * 1.12 + .5;
      col *= .78 + .22 * sin(uv.y * res.y * 1.6);                            // scanlines
      col += .09 * smoothstep(.0, .5, sin((q.y + t * .12) * 6.2832 * 1.) - .5); // rolling bar
      col += (h(uv * res + fract(t * 61.)) - .5) * (.32 + g * .3 + trk * .5); // static (fine)
      col += (h(floor(uv * res / 3.) + floor(t * 24.) * 1.7) - .5) * .2;    // static (coarse snow)
      col += trk * .12;                                                     // tracking band glow
      col += step(.985, h(vec2(floor(uv.y * res.y / 2.), floor(t * 18.)))) * .18 * h(vec2(uv.x * 40., t)); // dropout streaks
      col *= .92 + .08 * sin(t * 57.) * h(vec2(floor(t * 8.), 3.));          // flicker
      col *= smoothstep(1.45, .55, length(c * vec2(.92, 1.)));               // vignette
      gl_FragColor = vec4(col * edge, mix(1., texture2D(tex, q).a, ua));
    }`;
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const U = { t: gl.getUniformLocation(prog, 't'), g: gl.getUniformLocation(prog, 'g'), res: gl.getUniformLocation(prog, 'res'), ua: gl.getUniformLocation(prog, 'ua') };

  let playing = null, burst = 0, nextBurst = 4;
  function setClip(key){
    if (playing === key) return;
    if (playing && vids[playing]) vids[playing].pause();
    playing = key;
    if (key){ const v = vids[key]; if (v.paused) v.play().catch(() => {}); }
  }
  function frame(now){
    requestAnimationFrame(frame);
    const rect = sec.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight){ setClip(null); return; }
    fit();
    const t = now / 1000, n = Math.floor(t / DUR), shot = SHOTS[n % SHOTS.length], loop = Math.floor(n / SHOTS.length), tl = t % DUR;
    // keep the upcoming clip buffered so the cut is clean
    const nxt = SHOTS[(n + 1) % SHOTS.length]; if (nxt[0] === 'v' && !vids[nxt[1]].src) loadClips();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (shot[0] === 'v'){ setClip(shot[1]); drawFootage(shot[1], tl); }
    else {
      setClip(null);
      ctx.save(); const z = 1 + tl / DUR * .07; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      scenes[shot[1]](tl, t, loop); ctx.restore();
    }
    if (tl < .1){ ctx.fillStyle = `rgba(255,255,255,${((.1 - tl) / .1 * .3).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }   // cut flash
    // glitch intensity: spikes on each cut plus random bursts
    if (t > nextBurst){ burst = .35 + Math.random() * .5; nextBurst = t + 2 + Math.random() * 5; }
    burst *= .9;
    const g = Math.max(clamp(1 - tl / .35) * .9, burst);
    gl.viewport(0, 0, out.width, out.height);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); }
    catch (e){ goDirect(); return; }                                       // canvas got tainted → switch to direct video
    gl.uniform1f(U.ua, direct && shot[0] === 'v' ? 1 : 0);
    gl.uniform1f(U.t, t); gl.uniform1f(U.g, g); gl.uniform2f(U.res, out.width, out.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const fr = Math.floor(t * 24) % 24, sec_ = Math.floor(t);
    tcEl.textContent = `${pad(Math.floor(sec_ / 3600) % 24)}:${pad(Math.floor(sec_ / 60) % 60)}:${pad(sec_ % 60)}:${pad(fr)}`;
  }
  requestAnimationFrame(frame);

  // TV power-on: also kick the CRT glitch so the picture "settles" as it switches on
  let powered = false;
  const powerTick = () => {
    const r = sec.getBoundingClientRect();
    if (!powered && r.top < innerHeight * .04 && r.bottom > innerHeight * .6){ powered = true; sec.classList.add('on'); burst = 1; nextBurst = performance.now() / 1000 + 2.5; }
    else if (powered && (r.top > innerHeight * .6 || r.bottom < innerHeight * .4)){ powered = false; sec.classList.remove('on'); }
  };
  addEventListener('scroll', powerTick, { passive: true }); setInterval(powerTick, 250); powerTick();
})();
