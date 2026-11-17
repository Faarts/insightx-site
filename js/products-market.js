/* ---------------- Prediction Market — "Where information meets the market." ----------------
   The section pins; scrolling through it plays a year of an illustrative sample market. Each time a piece of news
   lands (information), the price of YES moves (the market). The head of the line keeps trading live even when
   the scroll stops. A ticker of sample markets and on-chain trades runs along the bottom. All data is illustrative. */
(() => {
  const sec = document.getElementById('prediction-market'); if (!sec) return;
  const { reduce, MONO, SANS, clamp } = window.IXP;
  const cv = sec.querySelector('.pm-chart'), ctx = cv.getContext('2d');
  const yesEl = sec.querySelector('.pm-yes'), noEl = sec.querySelector('.pm-no'), volEl = sec.querySelector('.pm-vol');
  const copyKids = [...sec.querySelectorAll('.pm-copy > *')], panel = sec.querySelector('.pm-panel');
  const SPAN = .9, N = 240;
  const EVENTS = [
    { at: .14, d: .08,  txt: 'Grid report: solar build-out ahead of plan' },
    { at: .31, d: -.07, txt: 'Storage costs revised upward' },
    { at: .5,  d: .11,  txt: 'Utilities commit to new capacity' },
    { at: .68, d: -.05, txt: 'Analysts: demand growth slower than expected' },
    { at: .84, d: .07,  txt: 'Quarterly data: renewables share hits new high' },
  ];
  // deterministic price path: gentle random walk + a step at each event
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const path = []; let v = .36;
  for (let i = 0; i < N; i++){
    const x = i / (N - 1);
    for (const e of EVENTS) if (Math.abs(x - e.at) < .5 / N) v += e.d;
    v += (rand() - .5) * .016 + .0006; v = clamp(v, .06, .94); path.push(v);
  }
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // ticker: sample markets + trades (duplicated once for a seamless loop)
  const track = sec.querySelector('.pm-track');
  if (track){
    const M = [['Next-gen chip ships before Q3?', 41], ['Mainnet upgrade live this quarter?', 72], ['AI model tops reasoning benchmark?', 58],
      ['Global EV sales above 25M in 2027?', 36], ['New climate accord signed this year?', 22], ['Open-source model in top 3?', 64]];
    const hex = () => Math.random().toString(16).slice(2, 6);
    const parts = [];
    M.forEach(([q, p], i) => {
      parts.push(`<span>${q} <b>Yes ${p}¢</b></span>`);
      parts.push(`<span><em>0x${hex()}…${hex().slice(0, 2)}</em> bought ${i % 2 ? 'No' : 'Yes'} · ${(20 + Math.random() * 480) | 0} @ 0.${(30 + Math.random() * 60) | 0}</span>`);
    });
    track.innerHTML = parts.join('') + parts.join('');
  }

  let W = 0, H = 0, shown = 0, live = 0, last = performance.now(), cards = [];
  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const r = sec.getBoundingClientRect();
    // copy column fades/rises in as the section arrives
    const enter = clamp(1 - r.top / innerHeight);
    copyKids.forEach((el, i) => el.style.setProperty('--o', clamp(enter * 1.8 - .5 - i * .1).toFixed(3)));
    panel.style.opacity = clamp(enter * 1.6 - .45).toFixed(3);
    if (r.bottom < 0 || r.top > innerHeight) return;
    const [w, h] = window.IXP.fit(cv, ctx); W = w; H = h; if (!W) return;
    const t = now / 1000;
    const target = clamp(window.IXP.progress(sec) / SPAN) * .985 + .015;
    shown += (target - shown) * (reduce ? 1 : Math.min(1, dt * 6));
    const sm = W < 520, L = sm ? 4 : 8, R = sm ? 40 : 54, T = sm ? 36 : 54, B = 24, gw = W - L - R, gh = H - T - B;
    const X = x => L + x * gw, Y = p => T + (1 - (p - .15) / .7) * gh;   // y axis shows 15% → 85%
    ctx.clearRect(0, 0, W, H); ctx.textBaseline = 'alphabetic';
    // grid
    ctx.font = `10px ${MONO}`;
    [.25, .5, .75].forEach(p => { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(L, Y(p), gw, 1); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.textAlign = 'right'; ctx.fillText(`${p * 100}%`, W - 2, Y(p) + 3); });
    ctx.textAlign = 'center';
    MONTHS.forEach((m, i) => { if (sm && i % 2) return; ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillText(m, X(i / 11), H - 6); });
    // the line up to "now"
    const n = Math.max(2, Math.floor(shown * (N - 1)) + 1);
    live += dt; const wig = reduce ? 0 : Math.sin(live * 2.1) * .006 + Math.sin(live * 5.3) * .004;
    const pts = path.slice(0, n).map((p, i) => [X(i / (N - 1)), Y(i === n - 1 ? p + wig : p)]);
    const g = ctx.createLinearGradient(0, T, 0, T + gh); g.addColorStop(0, 'rgba(160,145,245,.22)'); g.addColorStop(1, 'rgba(160,145,245,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(pts[0][0], T + gh); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], T + gh); ctx.fill();
    ctx.strokeStyle = '#A091F5'; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.lineWidth = 1;
    // news events that have landed
    const landed = EVENTS.filter(e => e.at <= shown);
    landed.forEach((e, k) => {
      const x = X(e.at), i = Math.round(e.at * (N - 1)), y = Y(path[Math.min(N - 1, i + 2)]);
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x, T - 6); ctx.lineTo(x, T + gh); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#000'; ctx.fillRect(x - 4, y - 4, 8, 8); ctx.strokeStyle = '#fff'; ctx.strokeRect(x - 3.5, y - 3.5, 7, 7);
      ctx.font = `10px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`N${k + 1}`, x, T - 10);
    });
    // the latest news as a callout card next to its marker
    const e = landed[landed.length - 1];
    if (e){
      const age = clamp((shown - e.at) * 30), x = X(e.at);
      const head = `N${landed.length} · NEWS`, delta = `${e.d > 0 ? '▲ +' : '▼ '}${Math.round(e.d * 100)}¢`;
      ctx.font = `${sm ? 11 : 12}px ${SANS}`; const tw = Math.min(sm ? gw * .78 : 300, ctx.measureText(e.txt).width + 20);
      let bx = x + 12; if (bx + tw > L + gw) bx = x - 12 - tw;
      const by = T + (e.d > 0 ? gh * .62 : 6), bh = sm ? 42 : 48;
      ctx.globalAlpha = age;
      ctx.fillStyle = 'rgba(0,0,0,.88)'; ctx.fillRect(bx, by, tw, bh); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.strokeRect(bx + .5, by + .5, tw - 1, bh - 1);
      ctx.textAlign = 'left'; ctx.font = `10px ${MONO}`; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillText(head, bx + 10, by + 16);
      ctx.fillStyle = e.d > 0 ? '#A091F5' : '#fff'; ctx.textAlign = 'right'; ctx.fillText(delta, bx + tw - 10, by + 16);
      ctx.textAlign = 'left'; ctx.font = `${sm ? 11 : 12}px ${SANS}`; ctx.fillStyle = '#fff';
      let s = e.txt; while (s.length > 4 && ctx.measureText(s).width > tw - 20) s = s.slice(0, -2); if (s !== e.txt) s += '…';
      ctx.fillText(s, bx + 10, by + (sm ? 33 : 36));
      ctx.globalAlpha = 1;
    }
    // head: pulsing dot + price guide
    const [hx, hy] = pts[pts.length - 1], pu = (t * .9) % 1;
    ctx.strokeStyle = `rgba(160,145,245,${(1 - pu) * .8})`; ctx.beginPath(); ctx.arc(hx, hy, 4 + pu * 14, 0, 6.283); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(160,145,245,.45)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(hx + 8, hy); ctx.lineTo(L + gw, hy); ctx.stroke(); ctx.setLineDash([]);
    const yes = Math.round(clamp(path[n - 1] + wig) * 100);
    ctx.fillStyle = '#A091F5'; ctx.fillRect(L + gw + 2, hy - 8, R - 4, 16); ctx.fillStyle = '#000'; ctx.font = `10px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(`${yes}¢`, L + gw + R / 2, hy + 4);
    // header numbers
    if (yesEl.textContent !== String(yes)){ yesEl.textContent = yes; noEl.textContent = 100 - yes; }
    const vol = Math.round(shown * shown * 1284530 + shown * 42000);
    volEl.textContent = '$' + vol.toLocaleString('en-US');
  }
  requestAnimationFrame(frame);
})();
