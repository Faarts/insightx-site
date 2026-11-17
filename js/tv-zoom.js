/* ---------------- Section 4 → 5: pull back from the screen to reveal the analog TV ----------------
   The TV screen is laid out at (at least) full-viewport size, so at progress 0 it IS section 4.
   Scrolling through the section scales the whole set down (exponentially, so the zoom feels even) and centres it. */
(() => {
  const sec = document.querySelector('.s4'); if (!sec) return;
  const pin = sec.querySelector('.s4-pin'), tv = sec.querySelector('.tv'), screen = sec.querySelector('.tv-screen'), ui = sec.querySelector('.s4-ui');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // gentle in/out: the zoom tracks the scroll closely
  let k = 1, tx = 0, ty = 0, vw = 0, vh = 0, queued = false;
  function layout(){
    vw = pin.clientWidth; vh = pin.clientHeight;
    const S = Math.max(vw, vh * 4 / 3);
    tv.style.fontSize = (S / 100) + 'px'; tv.style.transform = 'none';
    const tr = tv.getBoundingClientRect(), sr = screen.getBoundingClientRect();
    const ox = sr.left - tr.left + sr.width / 2, oy = sr.top - tr.top + sr.height / 2;
    tv.style.left = (vw / 2 - ox) + 'px'; tv.style.top = (vh / 2 - oy) + 'px';
    tv.style.transformOrigin = `${ox}px ${oy}px`;
    const mobile = vw <= 900;
    k = mobile ? Math.min(vw * .92 / tr.width, vh * (vw > 600 ? .42 : .36) / tr.height) : Math.min(vw * .4125 / tr.width, vh * .67 / tr.height);
    const dy = 0;
    tx = -(tr.width / 2 - ox) * k; ty = dy - (tr.height / 2 - oy) * k;
    pin.style.setProperty('--tvw', (tr.width * k) + 'px');
    update();
  }
  function update(){
    queued = false;
    const range = sec.offsetHeight - vh;
    const p = range > 0 ? clamp(-sec.getBoundingClientRect().top / range) : 0, e = ease(clamp(p / .78));
    const s = Math.pow(k, e), f = k === 1 ? 0 : (1 - s) / (1 - k);       // f: 0 → 1 in step with the scale
    tv.style.transform = e < .0005 ? 'none' : `translate(${tx * f}px, ${ty * f}px) scale(${s})`;
    tv.style.setProperty('--s', s.toFixed(5));
    pin.style.setProperty('--e', f.toFixed(4));
    pin.style.setProperty('--t5', clamp((p - .68) / .3).toFixed(3));
    const uo = 1 - clamp(p / .16);
    ui.style.opacity = uo; ui.style.visibility = uo < .01 ? 'hidden' : '';
  }
  const req = () => { if (!queued){ queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', layout);
  if (document.fonts) document.fonts.ready.then(layout);
  layout();
})();
