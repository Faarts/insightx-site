/* Footer wordmark: a soft light follows the cursor and fills the outline letters (same idea as the section 5 waves) */
(() => {
  const w = document.querySelector('.ft-light'), ft = document.querySelector('.ft'); if (!w || !ft) return;
  let tx = -999, ty = -999, x = -999, y = -999, r = 0, tr = 0, raf = 0;
  const loop = () => { x += (tx - x) * .14; y += (ty - y) * .14; r += (tr - r) * .1;
    w.style.setProperty('--mx', x + 'px'); w.style.setProperty('--my', y + 'px'); w.style.setProperty('--lr', r.toFixed(1));
    raf = (Math.abs(tr - r) > .5 || Math.abs(tx - x) > .5 || Math.abs(ty - y) > .5) ? requestAnimationFrame(loop) : 0; };
  ft.addEventListener('pointermove', e => { const b = w.getBoundingClientRect(); tx = e.clientX - b.left; ty = e.clientY - b.top;
    if (x < -900){ x = tx; y = ty; } tr = Math.max(180, b.height * 1.1); if (!raf) raf = requestAnimationFrame(loop); });
  ft.addEventListener('pointerleave', () => { tr = 0; if (!raf) raf = requestAnimationFrame(loop); });
})();
