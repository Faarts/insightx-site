/* ---------------- Products — section transitions ----------------
   Only one hand-over is designed; every other section change is a plain scroll on purpose:
     key features → market  held in place, the market is revealed under a price line that climbs the screen,
                            spiking at the pointer (or the last touch)
   A fixed overlay canvas draws the moving edge. Off with reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const IXP = window.IXP || {}, MONO = IXP.MONO || 'monospace';
  const $ = s => document.querySelector(s);
  const fx = $('.pp-fx'); if (!fx) return;
  const ctx = fx.getContext('2d');
  const feat = $('#features'), market = $('#prediction-market');
  const featSt = feat && feat.querySelector('.pf-sticky');
  const mSt = market && market.querySelector('.pm-sticky');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let px = innerWidth * .6, py = innerHeight * .45, raf = 0, W = 0, H = 0;
  const touched = new Set();
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  addEventListener('touchstart', e => { px = e.touches[0].clientX; py = e.touches[0].clientY; }, { passive: true });

  function set(el, tf, op, clip, origin){
    touched.add(el);
    el.style.transform = tf || ''; el.style.opacity = op == null ? '' : op; el.style.clipPath = clip || ''; el.style.webkitClipPath = clip || '';
    el.style.transformOrigin = origin || '';
  }
  const reset = el => { if (el && touched.has(el)){ ['transform', 'opacity', 'clipPath', 'webkitClipPath', 'transformOrigin', 'zIndex'].forEach(k => el.style[k] = ''); touched.delete(el); } };
  const label = (s, x, y, a = 1, align = 'left') => { ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'middle'; ctx.textAlign = align; ctx.fillStyle = `rgba(160,145,245,${a})`; ctx.fillText(s, x, y); ctx.textAlign = 'left'; };

  // price line (features → market)
  function price(o){
    const e = ease(o), amp = 46 * Math.sin(Math.PI * o), spike = 150 * Math.sin(Math.PI * o), sig = W * .07;
    const yb = x => H * (1.04 - e * 1.32) + amp * Math.sin(x * .013 + 1.3) * Math.cos(x * .0047) - spike * Math.exp(-((x - px) ** 2) / (2 * sig * sig));
    let d = `M0 ${H}`, pts = [];
    for (let x = 0; x <= W + 16; x += 16){ const xx = Math.min(W, x), y = yb(xx); pts.push([xx, y]); d += `L${xx.toFixed(1)} ${y.toFixed(1)}`; }
    d += `L${W} ${H}z`;
    ctx.strokeStyle = 'rgba(160,145,245,.95)'; ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    const y = yb(px); ctx.fillStyle = '#A091F5'; ctx.fillRect(px - 4, y - 4, 8, 8);
    label(`YES ${Math.round(38 + 50 * e)}¢`, px + 12, y - 12);
    return `path('${d}')`;
  }
  function update(){
    raf = 0;
    const vh = innerHeight, y = scrollY, dpr = Math.min(2, devicePixelRatio || 1);
    if (fx.width !== Math.round(innerWidth * dpr) || fx.height !== Math.round(vh * dpr)){ fx.width = Math.round(innerWidth * dpr); fx.height = Math.round(vh * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = innerWidth; H = vh; ctx.clearRect(0, 0, W, H);
    const win = el => el ? (y + vh - el.offsetTop) / vh : -1;
    const o3 = win(market);
    const live = new Set();

    if (mSt && o3 > 0 && o3 < 1){                             // features → market
      set(featSt, `translate3d(0,${(o3 * vh).toFixed(1)}px,0) scale(${(1 - o3 * .05).toFixed(4)})`, (1 - o3 * .55).toFixed(3)); live.add(featSt);
      set(mSt, `translate3d(0,${(-(1 - o3) * vh).toFixed(1)}px,0)`, null, price(o3)); live.add(mSt);
    }
    [...touched].forEach(el => { if (!live.has(el)) reset(el); });
  }
  function queue(){ if (!raf) raf = requestAnimationFrame(update); }
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  update();
})();
