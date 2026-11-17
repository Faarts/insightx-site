/* ---------------- About — Mission ----------------
   "Make intelligence more accessible, useful, and actionable for everyone." lights up word by word as the
   pinned section is scrolled; the three key words turn accent and tick off the markers underneath. */
(() => {
  const sec = document.getElementById('mission'); if (!sec) return;
  const { reduce, clamp } = window.IXP;
  const st = sec.querySelector('.am-statement'), keys = [...sec.querySelectorAll('.am-keys li')];
  st.setAttribute('aria-label', st.textContent.replace(/\s+/g, ' ').trim());

  // wrap every word in a span (inside the <em> key words too)
  const words = [];
  const wrap = (node, key) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; s.setAttribute('aria-hidden', 'true');
          if (key !== undefined) s.dataset.key = key;
          frag.appendChild(s); words.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrap(n, n.tagName === 'EM' ? [...st.querySelectorAll('em')].indexOf(n) : key);
    });
  };
  wrap(st);

  let raf = 0, lastF = -1;
  function update(){
    raf = 0;
    const f = reduce ? 1 : clamp((window.IXP.progress(sec) - .04) / .7);
    if (Math.abs(f - lastF) < .001) return; lastF = f;
    const n = words.length;
    words.forEach((w, i) => {
      const l = clamp(f * n - i);
      w.style.setProperty('--l', l.toFixed(3));
      w.classList.toggle('lit', l > .95);
    });
    keys.forEach((k, i) => { const w = words.find(x => x.dataset.key == i); k.classList.toggle('on', !!w && w.classList.contains('lit')); });
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  update();
})();
