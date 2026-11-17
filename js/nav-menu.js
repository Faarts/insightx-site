/* ---------------- Mobile / tablet navigation (≤ 900px, where the desktop links are hidden) ----------------
   Adds a kebab button to the fixed nav and a full-screen menu built from the page's own nav links,
   nav CTA and footer community links — so index.html and products.html stay in sync with no extra markup.
   Closes on a link, the close button, Escape or a tap outside the list. While open, the page behind
   doesn't scroll and the paced-scroll handlers don't receive wheel / touch / key events. */
(() => {
  const nav = document.querySelector('.nav'); if (!nav) return;
  const links = [...nav.querySelectorAll('ul a')], cta = nav.querySelector('.btn'), logo = nav.querySelector('.logo');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const kebab = (label) => `<span class="mm-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="sr">${label}</span>`;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'mm-btn'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mm');
  btn.innerHTML = kebab('Open menu');
  nav.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'mm'; menu.id = 'mm'; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true'); menu.setAttribute('aria-label', 'Menu'); menu.hidden = true;
  const social = [...document.querySelectorAll('.ft-col')].find(c => /community/i.test(c.querySelector('.ft-h')?.textContent || ''));
  menu.innerHTML = `
    <div class="mm-top">${logo ? logo.outerHTML : ''}<button type="button" class="mm-close"><span class="mm-x" aria-hidden="true"></span><span class="sr">Close menu</span></button></div>
    <p class="mm-eyebrow">Menu</p>
    <nav class="mm-list" aria-label="Main">
      ${links.map((a, i) => `<a href="${a.getAttribute('href')}"${a.getAttribute('aria-current') ? ' aria-current="page"' : ''} style="--i:${i}">
        <span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${a.textContent.trim()}</span><span class="arr" aria-hidden="true">→</span></a>`).join('')}
    </nav>
    <div class="mm-foot" style="--i:${links.length}">
      ${cta ? `<a href="${cta.getAttribute('href')}" class="btn btn-primary mm-cta">${cta.innerHTML}</a>` : ''}
      ${social ? `<p class="mm-social">${[...social.querySelectorAll('a')].map(a => `<a href="${a.getAttribute('href')}" target="_blank" rel="noopener">${a.innerHTML}</a>`).join('')}</p>` : ''}
    </div>`;
  document.body.appendChild(menu);
  const closeBtn = menu.querySelector('.mm-close');

  let open = false, lastFocus = null, hideT = 0;
  function set(on){
    if (on === open) return; open = on;
    btn.setAttribute('aria-expanded', String(on));
    document.documentElement.classList.toggle('mm-lock', on);
    clearTimeout(hideT);
    if (on){
      lastFocus = document.activeElement;
      // the menu grows out of the kebab button
      const r = btn.getBoundingClientRect();
      menu.style.setProperty('--ox', `${r.left + r.width / 2}px`); menu.style.setProperty('--oy', `${r.top + r.height / 2}px`);
      menu.hidden = false; void menu.offsetWidth; menu.classList.add('on');
      setTimeout(() => (menu.querySelector('.mm-list a') || closeBtn).focus({ preventScroll: true }), reduce ? 0 : 240);
    } else {
      menu.classList.remove('on');
      hideT = setTimeout(() => { menu.hidden = true; }, reduce ? 0 : 450);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
  }
  btn.addEventListener('click', () => set(true));
  closeBtn.addEventListener('click', () => set(false));
  menu.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a){ set(false); return; }                                    // in-page anchors keep working (products-scroll.js handles them)
    if (!e.target.closest('.mm-list,.mm-foot,.mm-top')) set(false);  // tap on empty space
  });

  // while open: Escape closes, Tab stays inside, and nothing reaches the page's scroll handlers
  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape'){ e.preventDefault(); set(false); }
    else if (e.key === 'Tab'){
      const f = [...menu.querySelectorAll('a,button')]; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key) && !e.target.closest('a,button')) e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  for (const type of ['wheel', 'touchstart', 'touchmove', 'touchend']){
    addEventListener(type, e => {
      if (!open) return;
      e.stopImmediatePropagation();
      // the menu itself may scroll (short landscape screens); everything else stays put
      const inside = menu.contains(e.target) && menu.scrollHeight > menu.clientHeight + 1;
      if ((type === 'wheel' || type === 'touchmove') && !inside && e.cancelable) e.preventDefault();
    }, { capture: true, passive: false });
  }

  // leaving the mobile layout (rotate / resize) closes the menu
  const mq = matchMedia('(max-width: 900px)');
  (mq.addEventListener ? mq.addEventListener('change', e => { if (!e.matches) set(false); }) : mq.addListener(e => { if (!e.matches) set(false); }));
})();
