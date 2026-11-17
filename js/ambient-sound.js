/* ---------------- Ambient sound for sections 4 → 5: "information is noisy" ----------------
   Two "channels" flip back and forth like someone zapping an old TV:
     · a stadium crowd (assets/audio/stadium-crowd.m4a — Mixkit "Stadium chaotic loud applause, drums and chants",
       Mixkit Sound Effects Free License), played through a small-TV-speaker filter, each time from a random point;
     · the set's own electrical buzz: mains hum + intermittent "bzz" bursts + static hiss (synthesised).
   Every flip is marked by a channel-change "ciuuu" (falling whistle + static burst + click).
   Quiet when section 4 arrives, swells through the pull-back to the TV, loudest on "Our vision".
   Browsers only allow audio after a click / tap / key press, so it starts on the visitor's first interaction. */
(() => {
  const sec = document.querySelector('.s4'), btn = document.querySelector('.snd');
  if (!sec || !btn) return;
  const label = btn.querySelector('.snd-l');
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC){ btn.remove(); return; }
  let ctx = null, master, nb, buzzSeg, crowdSeg, crowdTv, burstG, crowdBuf = null, crowdSrc = null, muted = false, timer = 0;
  try { muted = localStorage.getItem('ix-sound') === 'off'; } catch (e) {}
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  function build(){
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    const sr = ctx.sampleRate; nb = ctx.createBuffer(1, sr * 3, sr); const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = (off = 0) => { const n = ctx.createBufferSource(); n.buffer = nb; n.loop = true; n.start(0, off % 3); return n; };

    // --- channel B: the TV's own buzz
    buzzSeg = ctx.createGain(); buzzSeg.gain.value = 1; buzzSeg.connect(master);
    const hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 59.7;
    const humLp = ctx.createBiquadFilter(); humLp.type = 'lowpass'; humLp.frequency.value = 340;
    const humG = ctx.createGain(); humG.gain.value = .18; hum.connect(humLp); humLp.connect(humG); humG.connect(buzzSeg); hum.start();
    const buzz = ctx.createOscillator(); buzz.type = 'square'; buzz.frequency.value = 119.4;
    const buzzBp = ctx.createBiquadFilter(); buzzBp.type = 'bandpass'; buzzBp.frequency.value = 900; buzzBp.Q.value = .8;
    burstG = ctx.createGain(); burstG.gain.value = 0; buzz.connect(buzzBp); buzzBp.connect(burstG); burstG.connect(buzzSeg); buzz.start();
    const hiss = noise(); const hissHp = ctx.createBiquadFilter(); hissHp.type = 'highpass'; hissHp.frequency.value = 3000;
    const hissG = ctx.createGain(); hissG.gain.value = .07; hiss.connect(hissHp); hissHp.connect(hissG); hissG.connect(buzzSeg);

    // --- channel A: stadium crowd through a small TV speaker
    crowdSeg = ctx.createGain(); crowdSeg.gain.value = 0;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1800; mid.gain.value = 4; mid.Q.value = .9;
    crowdTv = hp; hp.connect(lp); lp.connect(mid); mid.connect(crowdSeg); crowdSeg.connect(master);
    loadCrowd();

    timer = setInterval(tick, 50);
  }

  // channel-change "ciuuu": falling whistle + a burst of static sweeping down + a relay click
  function zap(){
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(3200, t); o.frequency.exponentialRampToValueAtTime(260, t + .32);
    og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(.16, t + .015); og.gain.exponentialRampToValueAtTime(.001, t + .36);
    o.connect(og); og.connect(master); o.start(t); o.stop(t + .4);
    const n = ctx.createBufferSource(); n.buffer = nb; const bp = ctx.createBiquadFilter(), ng = ctx.createGain();
    bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(5200, t); bp.frequency.exponentialRampToValueAtTime(700, t + .3);
    ng.gain.setValueAtTime(.55, t); ng.gain.exponentialRampToValueAtTime(.001, t + .34);
    n.connect(bp); bp.connect(ng); ng.connect(master); n.start(t, Math.random() * 2); n.stop(t + .36);
    const c = ctx.createBufferSource(); c.buffer = nb; const cg = ctx.createGain();
    cg.gain.setValueAtTime(.5, t); cg.gain.exponentialRampToValueAtTime(.001, t + .025);
    c.connect(cg); cg.connect(master); c.start(t, Math.random() * 2); c.stop(t + .03);
  }

  // the crowd clip: fetch the .m4a; when the page is opened from disk (file://, where fetch is blocked) fall back to
  // assets/audio/stadium-crowd.js, the same clip as base64 loaded through a <script> tag
  function loadCrowd(){
    const viaFetch = location.protocol === 'file:' ? Promise.reject(new Error('file')) :
      fetch('assets/audio/stadium-crowd.m4a').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
    viaFetch.catch(() => new Promise((ok, no) => {
        if (window.IX_CROWD_B64) return ok();
        const sc = document.createElement('script'); sc.src = 'assets/audio/stadium-crowd.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc);
      }).then(() => { const bin = atob(window.IX_CROWD_B64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }))
      .then(ab => new Promise((ok, no) => ctx.decodeAudioData(ab, ok, no)))
      .then(buf => { crowdBuf = buf; if (chan === 'tv') switchAt = Math.min(switchAt, ctx.currentTime + .5); })   // tune in to it right away
      .catch(() => {});
  }

  let chan = 'tv', switchAt = 0, nextBurst = 0;
  function flip(){
    const t = ctx.currentTime;
    zap();
    if (chan === 'tv' && crowdBuf){
      chan = 'crowd';
      if (crowdSrc){ try { crowdSrc.stop(); } catch (e) {} }
      crowdSrc = ctx.createBufferSource(); crowdSrc.buffer = crowdBuf; crowdSrc.loop = true;
      crowdSrc.connect(crowdTv); crowdSrc.start(t + .12, Math.random() * (crowdBuf.duration - 1));   // a different moment each time
      crowdSeg.gain.setTargetAtTime(1.6, t + .12, .03); buzzSeg.gain.setTargetAtTime(.12, t + .12, .03);
      switchAt = t + 2.8 + Math.random() * 3.2;
    } else {
      chan = 'tv';
      crowdSeg.gain.setTargetAtTime(0, t + .1, .02); buzzSeg.gain.setTargetAtTime(1, t + .1, .03);
      if (crowdSrc){ const s = crowdSrc; setTimeout(() => { try { s.stop(); } catch (e) {} }, 400); crowdSrc = null; }
      switchAt = t + 1.3 + Math.random() * 1.4;
    }
  }

  function tick(){
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    if (t > switchAt && master.gain.value > .005) flip();
    if (chan === 'tv' && t > nextBurst){                                     // intermittent "bzz … bzz"
      const len = .12 + Math.random() * .35;
      burstG.gain.setTargetAtTime(.1 + Math.random() * .08, t, .01); burstG.gain.setTargetAtTime(0, t + len, .03);
      nextBurst = t + len + .2 + Math.random() * .9;
    }
    level();
  }

  // loudness from scroll: 0 before section 4 → quiet as it arrives → louder through the pull-back → loudest on "Our vision"
  function level(){
    const r = sec.getBoundingClientRect(), vh = innerHeight, range = Math.max(1, sec.offsetHeight - vh);
    const enter = clamp(1 - r.top / vh), p = clamp(-r.top / range), out = clamp(r.bottom / vh);
    const ft = document.querySelector('.ft'), ftIn = ft && ft.getBoundingClientRect().top < vh - 90;   // keep clear of the footer's legal row
    btn.classList.toggle('show', r.top < vh * .55 && r.bottom > vh * .3 && !ftIn);
    if (!ctx) return;
    const vol = muted ? 0 : enter * out * (.13 + .37 * Math.pow(p, 1.15));
    master.gain.setTargetAtTime(vol, ctx.currentTime, .25);
  }

  function render(){
    const on = !!ctx && ctx.state === 'running' && !muted;
    btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(!muted && !!ctx));
    label.textContent = muted ? 'Sound off' : (on ? 'Sound on' : 'Tap for sound');
  }
  function start(){
    if (!ctx) build();
    if (ctx.state !== 'running') ctx.resume().then(render);
    render(); level();
  }
  const first = e => { if (e.target.closest && e.target.closest('.snd')) return; if (!muted) start(); removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true); };
  addEventListener('pointerdown', first, true); addEventListener('keydown', first, true);
  btn.addEventListener('click', () => {
    if (!ctx){ muted = false; start(); }
    else { muted = !muted; if (!muted) start(); }
    try { localStorage.setItem('ix-sound', muted ? 'off' : 'on'); } catch (e) {}
    render(); level();
  });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend() : (!muted && ctx.resume().then(render)); });
  addEventListener('scroll', level, { passive: true });
  render(); level();
})();
