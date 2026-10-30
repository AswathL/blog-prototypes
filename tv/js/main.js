import { UI, CRT, Screen } from './screen.js';
import { buildScene, TV, tailPath } from './scene.js';

// ================================================================ sound
// WebAudio: rubber-button clicks, inter-channel static, degauss thunk, 50 Hz mains hum
// and the 15.625 kHz line whistle every PAL set had. Off until the visitor asks.
class Sound {
  constructor() {
    this.on = false;
    this.level = 12; // 0..20 bars
    this.ctx = null;
    this.hum = null;
  }

  ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.comp = this.ctx.createDynamicsCompressor();
    this.master.connect(this.comp).connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  gainFor() {
    return this.on ? Math.pow(this.level / 20, 1.6) * 0.9 : 0;
  }

  setOn(on) {
    this.on = on;
    if (on && !this.ensure()) return;
    if (!this.ctx) return;
    if (on && this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.gainFor(), t, 0.05);
  }

  setLevel(level) {
    this.level = level;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(this.gainFor(), this.ctx.currentTime, 0.05);
  }

  get live() {
    return this.on && this.ctx && this.ctx.state !== 'closed';
  }

  noiseSrc() {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.loopStart = Math.random();
    return s;
  }

  click() {
    if (!this.live) return;
    const c = this.ctx;
    const t = c.currentTime;
    const n = this.noiseSrc();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 1.4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    n.connect(bp).connect(g).connect(this.master);
    n.start(t, Math.random());
    n.stop(t + 0.06);
    const o = c.createOscillator();
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.05);
    const og = c.createGain();
    og.gain.setValueAtTime(0.18, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.07);
  }

  static(dur = 0.38, amount = 0.32) {
    if (!this.live) return;
    const c = this.ctx;
    const t = c.currentTime;
    const n = this.noiseSrc();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amount, t + 0.02);
    g.gain.setValueAtTime(amount, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(hp).connect(lp).connect(g).connect(this.master);
    n.start(t);
    n.stop(t + dur + 0.05);
  }

  snow(on) {
    if (!this.ctx) return;
    if (on && this.live && !this.snowNode) {
      const c = this.ctx;
      const n = this.noiseSrc();
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const g = c.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(0.09, c.currentTime, 0.1);
      n.connect(hp).connect(g).connect(this.master);
      n.start();
      this.snowNode = { n, g };
    } else if (!on && this.snowNode) {
      const { n, g } = this.snowNode;
      g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      n.stop(this.ctx.currentTime + 0.3);
      this.snowNode = null;
    }
  }

  powerOn() {
    if (!this.live) return;
    const c = this.ctx;
    const t = c.currentTime;
    // relay thunk
    const o = c.createOscillator();
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const og = c.createGain();
    og.gain.setValueAtTime(0.5, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.2);
    // degauss: a buzzing 50 Hz "bwoooom" that dies away
    const d = c.createOscillator();
    d.type = 'sawtooth';
    d.frequency.value = 50;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 1.2);
    const dg = c.createGain();
    dg.gain.setValueAtTime(0.0001, t + 0.05);
    dg.gain.exponentialRampToValueAtTime(0.22, t + 0.12);
    dg.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    d.connect(lp).connect(dg).connect(this.master);
    d.start(t + 0.05);
    d.stop(t + 1.4);
    this.startHum();
  }

  startHum() {
    if (!this.live || this.hum) return;
    const c = this.ctx;
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(1, c.currentTime + 0.3, 0.4);
    const parts = [
      [50, 0.018],
      [100, 0.012],
      [150, 0.005],
      [15625, 0.0025],
    ].map(([f, a]) => {
      const o = c.createOscillator();
      o.frequency.value = f;
      const og = c.createGain();
      og.gain.value = a;
      o.connect(og).connect(g);
      o.start();
      return o;
    });
    g.connect(this.master);
    this.hum = { g, parts };
  }

  stopHum() {
    if (!this.hum || !this.ctx) return;
    const { g, parts } = this.hum;
    const t = this.ctx.currentTime;
    g.gain.setTargetAtTime(0, t, 0.08);
    parts.forEach((o) => o.stop(t + 0.5));
    this.hum = null;
  }

  powerOff() {
    if (!this.live) {
      this.stopHum();
      return;
    }
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    const g = c.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.45);
    this.static(0.12, 0.12);
    this.stopHum();
    this.snow(false);
  }

  purr(dur = 1.8) {
    if (!this.live) return;
    const c = this.ctx;
    const t = c.currentTime;
    const n = this.noiseSrc();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    const am = c.createGain();
    am.gain.value = 0.5;
    const lfo = c.createOscillator();
    lfo.frequency.value = 24;
    const lfoG = c.createGain();
    lfoG.gain.value = 0.5;
    lfo.connect(lfoG).connect(am.gain);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.9, t + 0.25);
    env.gain.setValueAtTime(0.9, t + dur - 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(lp).connect(am).connect(env).connect(this.master);
    n.start(t);
    lfo.start(t);
    n.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }
}

// ================================================================ remote
const { buildRemote } = (() => {
// The remote control: real <button>s dressed as rubber keys on a moulded body.

const ico = {
  power: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v8" stroke-width="2.6" stroke-linecap="round"/><path d="M7.2 6.4a7.5 7.5 0 1 0 9.6 0" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" stroke="none"/><path class="mute-x" d="M16.5 9.5l5 5m0-5l-5 5" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  lang: '<svg viewBox="0 0 40 22" aria-hidden="true"><text x="9" y="16" text-anchor="middle" font-size="14" font-weight="700" stroke="none">I</text><path d="M16 18L23 4" stroke-width="1.6"/><text x="30" y="16" text-anchor="middle" font-size="14" font-weight="700" stroke="none">II</text></svg>',
  guide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9" stroke-width="2.2" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6.5" r="1.7" stroke="none"/><path d="M12 10.5v8" stroke-width="2.6" stroke-linecap="round"/></svg>',
};

const DIGIT_ORDER = {
  // 1..9, then guide · 0 · P<P on the bottom row
  tall: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, guide: 10, 0: 11, prev: 12 },
  wide: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, guide: 10, 0: 11, prev: 12 },
};

function buildRemote(dock, onCmd) {
  const dig = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map(
      (n) => `<div class="r-cell r-dig" data-o="${n}"><button class="key key-digit" type="button" data-cmd="digit" data-n="${n}" data-ui-label="digit">${n}</button></div>`
    )
    .join('');
  dock.innerHTML = `
  <div class="remote" id="remote" role="group" aria-labelledby="remoteName">
    <span class="sr-only" id="remoteName" data-ui="remote"></span>
    <div class="r-shell" aria-hidden="true"></div>
    <div class="r-ir" aria-hidden="true"><i></i></div>
    <div class="r-face">
      <div class="r-cell r-power"><button class="key key-round key-power" type="button" data-cmd="power" data-ui-label="power">${ico.power}</button><span class="print" data-ui="printPower"></span></div>
      <div class="r-cell r-lang"><button class="key key-lang" type="button" data-cmd="lang" data-ui-label="lang">${ico.lang}</button><span class="print print-lang" data-ui="printLang"></span></div>
      <div class="r-cell r-mute"><button class="key key-round key-mute" type="button" data-cmd="mute" data-ui-label="mute" aria-pressed="false">${ico.mute}</button><span class="print" data-ui="printMute"></span></div>
      <div class="r-cell r-info"><button class="key key-round key-info" type="button" data-cmd="info" data-ui-label="info">${ico.info}</button><span class="print" data-ui="printInfo"></span></div>
      <div class="r-digits">
        ${dig}
        <div class="r-cell r-dig" data-o="guide"><button class="key key-digit key-alt" type="button" data-cmd="guide" data-ui-label="guide">${ico.guide}</button><span class="print print-mini" data-ui="printGuide"></span></div>
        <div class="r-cell r-dig" data-o="prev"><button class="key key-digit key-alt key-pp" type="button" data-cmd="prev" data-ui-label="prevCh">P&lt;P</button></div>
      </div>
      <div class="r-color">
        ${['red', 'green', 'yellow', 'blue'].map((c, i) => `<button class="key key-color key-${c}" type="button" data-cmd="fast" data-n="${i}" data-ui-label="fast${i}"></button>`).join('')}
      </div>
      <div class="r-nav">
        <div class="rocker" data-rocker="vol">
          <span class="rocker-body" aria-hidden="true"></span>
          <button class="rk rk-up" type="button" data-cmd="volUp" data-ui-label="volUp"><span aria-hidden="true">+</span></button>
          <button class="rk rk-dn" type="button" data-cmd="volDown" data-ui-label="volDown"><span aria-hidden="true">−</span></button>
          <span class="print" data-ui="printVol"></span>
        </div>
        <div class="dpad">
          <span class="dpad-ring" aria-hidden="true"></span>
          <button class="dp dp-up" type="button" data-cmd="up" data-ui-label="up"><span aria-hidden="true"></span></button>
          <button class="dp dp-left" type="button" data-cmd="left" data-ui-label="left"><span aria-hidden="true"></span></button>
          <button class="dp dp-right" type="button" data-cmd="right" data-ui-label="right"><span aria-hidden="true"></span></button>
          <button class="dp dp-down" type="button" data-cmd="down" data-ui-label="down"><span aria-hidden="true"></span></button>
          <button class="key key-ok" type="button" data-cmd="ok" data-ui-label="ok">OK</button>
        </div>
        <div class="rocker" data-rocker="ch">
          <span class="rocker-body" aria-hidden="true"></span>
          <button class="rk rk-up" type="button" data-cmd="chUp" data-ui-label="chUp"><span aria-hidden="true">+</span></button>
          <button class="rk rk-dn" type="button" data-cmd="chDown" data-ui-label="chDown"><span aria-hidden="true">−</span></button>
          <span class="print" data-ui="printCh"></span>
        </div>
      </div>
      <div class="r-brand" aria-hidden="true"><b>СВЕТУЛКА</b><small>ДУ-89</small></div>
    </div>
    <div class="r-glow" aria-hidden="true"></div>
  </div>
  <div class="note" id="note" aria-hidden="true">
    <span class="note-tape"></span>
    <span class="note-text" data-ui="noteHint"></span>
    <span class="note-sig" data-ui="noteHintSub"></span>
    <svg class="note-arrow" viewBox="0 0 80 50"><path d="M6 8 C 30 4, 52 14, 66 38" fill="none" stroke-width="3.2" stroke-linecap="round"/><path d="M54 34 L67 40 L70 26" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>`;

  const remote = dock.querySelector('#remote');
  const ir = remote.querySelector('.r-ir');

  const flashIR = () => {
    ir.classList.remove('tx');
    void ir.offsetWidth;
    ir.classList.add('tx');
  };

  const press = (btn) => {
    const rocker = btn.closest('.rocker');
    const dpad = btn.closest('.dpad');
    if (rocker) rocker.dataset.tilt = btn.classList.contains('rk-up') ? 'up' : 'down';
    if (dpad && btn.classList.contains('dp')) dpad.dataset.tilt = btn.dataset.cmd;
    btn.classList.add('is-down');
  };
  const release = (btn) => {
    btn.classList.remove('is-down');
    const rocker = btn.closest('.rocker');
    const dpad = btn.closest('.dpad');
    if (rocker) delete rocker.dataset.tilt;
    if (dpad) delete dpad.dataset.tilt;
  };

  // Auto-repeat for held volume/channel keys, like the real thing.
  let repeat = null;
  const stopRepeat = () => {
    clearTimeout(repeat);
    repeat = null;
  };
  remote.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    press(btn);
    const cmd = btn.dataset.cmd;
    if (cmd === 'volUp' || cmd === 'volDown') {
      stopRepeat();
      const loop = (delay) => {
        repeat = setTimeout(() => {
          onCmd(cmd, btn.dataset);
          flashIR();
          loop(110);
        }, delay);
      };
      loop(420);
    }
  });
  const up = (e) => {
    stopRepeat();
    remote.querySelectorAll('.is-down').forEach(release);
  };
  remote.addEventListener('pointerup', up);
  remote.addEventListener('pointercancel', up);
  remote.addEventListener('pointerleave', up);
  remote.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    flashIR();
    onCmd(btn.dataset.cmd, btn.dataset);
    if (e.detail === 0) {
      // keyboard activation: show the press
      press(btn);
      setTimeout(() => release(btn), 120);
    }
  });

  return {
    el: remote,
    note: dock.querySelector('#note'),
    flashIR,
    // visually press a key when the physical keyboard is used
    ghost(cmd, n) {
      const sel = n != null ? `button[data-cmd="${cmd}"][data-n="${n}"]` : `button[data-cmd="${cmd}"]`;
      const btn = remote.querySelector(sel);
      if (!btn) return;
      press(btn);
      flashIR();
      setTimeout(() => release(btn), 130);
    },
    setLayout(wide) {
      remote.classList.toggle('is-wide', wide);
      const order = wide ? DIGIT_ORDER.wide : DIGIT_ORDER.tall;
      remote.querySelectorAll('.r-dig').forEach((c) => (c.style.order = order[c.dataset.o]));
    },
    setLang(lang) {
      const L = UI[lang];
      remote.querySelectorAll('[data-ui]').forEach((n) => (n.textContent = L[n.dataset.ui]));
      dock.querySelectorAll('.note [data-ui]').forEach((n) => (n.textContent = L[n.dataset.ui]));
      remote.querySelectorAll('[data-ui-label]').forEach((b) => {
        const k = b.dataset.uiLabel;
        let label;
        if (k === 'digit') label = L.channel(b.dataset.n);
        else if (k.startsWith('fast')) label = L.fastext[Number(k.slice(4))];
        else label = L[k];
        b.setAttribute('aria-label', label);
      });
    },
    setMuted(muted) {
      const b = remote.querySelector('.key-mute');
      b.setAttribute('aria-pressed', String(!muted));
      remote.classList.toggle('is-muted', muted);
    },
  };
}

  return { buildRemote };
})();

// ================================================================ views
const { renderPost, renderAbout, renderPhoto, renderGuide, channelOf } = (() => {
// Calm DOM views: the reader, the photo viewer and the printed TV guide (list view).

const B = () => window.Blog;
const L = () => UI[window.Blog.lang];
const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const photoMeta = (file) => B().photos.find((p) => p.file === file);

const channelOf = (post) => (post.type === 'story' ? 1 : 2);

function block(b) {
  if (b.p) return `<p>${esc(b.p)}</p>`;
  if (b.h) return `<h2>${esc(b.h)}</h2>`;
  if (b.quote) return `<blockquote class="r-quote"><p>${esc(b.quote)}</p></blockquote>`;
  if (b.img) {
    const m = photoMeta(b.img);
    const cap = B().text(b.caption);
    const wh = m ? ` width="${m.w}" height="${m.h}"` : '';
    return `<figure class="r-fig"><img src="${B().photoUrl(b.img)}" alt="${esc(cap)}" loading="lazy" decoding="async"${wh}><figcaption>${esc(cap)}</figcaption></figure>`;
  }
  return '';
}

function renderPost(article, post) {
  const Bl = B();
  const Lx = L();
  const v = Bl.view(post);
  const list = Bl.posts;
  const i = list.indexOf(post);
  const newer = list[i - 1];
  const older = list[i + 1];
  article.lang = v.translated ? Bl.lang : 'bg';
  article.dataset.type = post.type;
  const pager = (p, dir) => {
    if (!p) return `<span class="r-pg r-pg-empty"></span>`;
    const pv = Bl.view(p);
    return `<a class="r-pg r-pg-${dir}" href="#/post/${p.slug}" data-nav="post" data-slug="${p.slug}" lang="${pv.translated ? Bl.lang : 'bg'}">
      <span class="r-pg-dir" lang="${Bl.lang}">${dir === 'prev' ? '◀ ' + esc(Bl.t('prev')) : esc(Bl.t('next')) + ' ▶'}</span>
      <span class="r-pg-title">${esc(pv.title)}</span>
      <span class="r-pg-meta" lang="${Bl.lang}">${esc(Bl.t(p.type))} · ${esc(Bl.date(p.date))}</span>
    </a>`;
  };
  article.innerHTML = `
    <header class="r-head">
      <p class="r-kicker" lang="${Bl.lang}"><span class="r-type">${esc(Bl.t(post.type))}</span><span class="r-dot" aria-hidden="true">·</span><time datetime="${post.date}">${esc(Bl.date(post.date))}</time><span class="r-dot" aria-hidden="true">·</span><span>${Bl.readMinutes(post)} ${esc(Bl.t('minRead'))}</span></p>
      <h1 class="r-title" id="readerTitle" tabindex="-1">${esc(v.title)}</h1>
      <p class="r-mood" lang="${Bl.lang}"><span>${esc(Bl.t('mood'))}:</span> <em>${esc(Bl.text(post.mood))}</em></p>
      ${v.translated ? '' : `<p class="r-note" lang="${Bl.lang}"><span aria-hidden="true">ⓘ</span> ${esc(Bl.t('onlyBg'))}</p>`}
    </header>
    <div class="r-body">${v.body.map(block).join('')}</div>
    <footer class="r-foot">
      <p class="r-end" aria-hidden="true">— ✦ —</p>
      <nav class="r-pager" aria-label="${esc(Bl.t('allPosts'))}" lang="${Bl.lang}">${pager(newer, 'prev')}${pager(older, 'next')}</nav>
      <p class="r-credits" lang="${Bl.lang}"><a href="${Bl.creditsUrl}">${esc(Bl.t('photoCredits'))}</a></p>
    </footer>`;
  return { osd: Lx.channelLabel(channelOf(post), (post.type === 'story' ? Bl.t('stories') : Bl.t('opinions')).toUpperCase()) };
}

function renderAbout(article) {
  const Bl = B();
  const Lx = L();
  article.lang = Bl.lang;
  article.dataset.type = 'about';
  article.innerHTML = `
    <header class="r-head">
      <p class="r-kicker"><span class="r-type">${esc(Bl.t('about'))}</span><span class="r-dot" aria-hidden="true">·</span><span>${esc(Bl.text(Bl.site.tagline))}</span></p>
      <h1 class="r-title" id="readerTitle" tabindex="-1">${esc(Bl.text(Bl.site.name))}</h1>
    </header>
    <div class="r-body">
      <p class="r-lede">${esc(Bl.text(Bl.site.about))}</p>
      <h2>${esc(Lx.nameMeaning)}</h2>
      <p>${esc(Bl.text(Bl.site.nameMeaning))}</p>
      <figure class="r-fig"><img src="${Bl.photoUrl('cat-sofia.jpg')}" alt="${esc(Bl.text(photoMeta('cat-sofia.jpg').caption))}" width="1200" height="1600" loading="lazy" decoding="async"><figcaption>${esc(Bl.text(photoMeta('cat-sofia.jpg').caption))}</figcaption></figure>
    </div>
    <footer class="r-foot"><p class="r-end" aria-hidden="true">— ✦ —</p>
      <nav class="r-pager" aria-label="${esc(Bl.t('allPosts'))}">
        <a class="r-pg r-pg-prev" href="#/list" data-nav="list"><span class="r-pg-dir">☰ ${esc(Bl.t('listViewShort'))}</span><span class="r-pg-title">${esc(Bl.t('listView'))}</span></a>
      </nav>
      <p class="r-credits"><a href="${Bl.creditsUrl}">${esc(Bl.t('photoCredits'))}</a></p>
    </footer>`;
  return { osd: Lx.channelLabel(4, Bl.t('about').toUpperCase()) };
}

function renderPhoto(els, photo) {
  const Bl = B();
  const Lx = L();
  const album = Bl.albums.find((a) => a.slug === photo.album);
  const cap = Bl.text(photo.caption);
  els.title.textContent = `${Bl.text(album.title)} · ${Lx.photoOf(photo.index + 1, album.photos.length)}`;
  els.cap.textContent = cap;
  if (els.img.dataset.file !== photo.file) {
    els.img.classList.add('is-loading');
    els.img.dataset.file = photo.file;
    els.img.width = photo.w;
    els.img.height = photo.h;
    const thumb = Bl.thumbUrl(photo.file);
    const full = Bl.photoUrl(photo.file);
    els.img.src = thumb;
    const hi = new Image();
    hi.decoding = 'async';
    hi.onload = () => {
      if (els.img.dataset.file === photo.file) {
        els.img.src = full;
        els.img.classList.remove('is-loading');
      }
    };
    hi.src = full;
  }
  els.img.alt = cap;
  els.frame.style.setProperty('--ar', `${photo.w} / ${photo.h}`);
}

function renderGuide(paper) {
  const Bl = B();
  const Lx = L();
  const row = (p) => {
    const v = Bl.view(p);
    return `<li class="g-item">
      <time class="g-time" datetime="${p.date}">${esc(Bl.date(p.date))}</time>
      <div class="g-what">
        <a class="g-link" href="#/post/${p.slug}" data-nav="post" data-slug="${p.slug}" lang="${v.translated ? Bl.lang : 'bg'}">${esc(v.title)}</a>
        <p class="g-ex" lang="${v.translated ? Bl.lang : 'bg'}">${esc(v.excerpt)}</p>
        <p class="g-meta">${esc(Bl.t(p.type))} · ${Bl.readMinutes(p)} ${esc(Bl.t('minRead'))} · ${esc(Bl.t('mood'))}: ${esc(Bl.text(p.mood))}${v.translated ? '' : ` · <span class="g-only">${esc(Bl.t('onlyBg'))}</span>`}</p>
      </div>
    </li>`;
  };
  const albums = Bl.albums
    .map(
      (a) => `<section class="g-album" aria-labelledby="ga-${a.slug}">
      <h3 id="ga-${a.slug}">${esc(Bl.text(a.title))} <span>· ${a.photos.length} ${esc(Bl.t('photos'))}</span></h3>
      <p class="g-note">${esc(Bl.text(a.note))}</p>
      <ul class="g-thumbs" role="list">
        ${a.photos
          .map(
            (p) => `<li><a class="g-thumb" href="#/photo/${a.slug}/${p.index}" data-nav="photo" aria-label="${esc(Lx.guideOpenPhoto(Bl.text(p.caption)))}">
              <img src="${Bl.thumbUrl(p.file)}" alt="${esc(Bl.text(p.caption))}" loading="lazy" decoding="async" width="${p.w}" height="${p.h}">
            </a></li>`
          )
          .join('')}
      </ul>
    </section>`
    )
    .join('');
  const now = new Date();
  paper.innerHTML = `
    <div class="g-top">
      <p class="g-issue">${esc(Bl.date(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`))} · № ${now.getDate()}${now.getMonth() + 1}</p>
      <button class="g-close" type="button" id="guideClose"><span aria-hidden="true">✕</span> <span>${esc(Lx.guideClose)}</span></button>
    </div>
    <header class="g-mast">
      <p class="g-kicker">${esc(Lx.guideKicker)}</p>
      <h1 class="g-title" id="guideTitle" tabindex="-1">${esc(Lx.guideTitle)} <span>${esc(Bl.text(Bl.site.name))}</span></h1>
      <p class="g-tag">${esc(Bl.text(Bl.site.tagline))}</p>
    </header>
    <div class="g-cols">
      <section class="g-ch" aria-labelledby="g-ch1">
        <h2 id="g-ch1"><span class="g-num" aria-hidden="true">1</span>${esc(Bl.t('stories'))}</h2>
        <ul class="g-list" role="list">${Bl.stories.map(row).join('')}</ul>
      </section>
      <section class="g-ch" aria-labelledby="g-ch2">
        <h2 id="g-ch2"><span class="g-num g-num-red" aria-hidden="true">2</span>${esc(Bl.t('opinions'))}</h2>
        <ul class="g-list" role="list">${Bl.opinions.map(row).join('')}</ul>
      </section>
      <section class="g-ch g-ch-wide" aria-labelledby="g-ch3">
        <h2 id="g-ch3"><span class="g-num g-num-yel" aria-hidden="true">3</span>${esc(Bl.t('gallery'))}</h2>
        ${albums}
      </section>
      <section class="g-ch" aria-labelledby="g-ch4">
        <h2 id="g-ch4"><span class="g-num g-num-blue" aria-hidden="true">4</span>${esc(Bl.t('about'))}</h2>
        <p class="g-about">${esc(Bl.text(Bl.site.about))}</p>
        <p class="g-about g-small">${esc(Bl.text(Bl.site.nameMeaning))}</p>
        <p><a class="g-link g-link-small" href="#/about" data-nav="about">${esc(Bl.t('read'))} →</a></p>
      </section>
    </div>
    <footer class="g-foot">
      <a href="${Bl.creditsUrl}">${esc(Bl.t('photoCredits'))}</a>
      <span>${esc(Lx.keysHint)}</span>
    </footer>`;
}

  return { renderPost, renderAbout, renderPhoto, renderGuide, channelOf };
})();

// ================================================================ the app

const Blog = window.Blog;
const gsap = window.gsap;
// keep animations on wall-clock time even when a slow device drops frames
gsap.ticker.lagSmoothing(0);
const $ = (s, r = document) => r.querySelector(s);
const L = () => UI[Blog.lang];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const app = $('#app');
const room = $('#room');
const camera = $('#camera');
const stage = $('#stage');
const dock = $('#dock');
const live = $('#live');
const readerEl = $('#reader');
const viewerEl = $('#viewer');
const guideEl = $('#guide');

const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const S = {
  power: false,
  ch: 0,
  lastCh: 0,
  vol: 12,
  soundOn: false,
  mode: 'tv', // tv | reader | viewer | guide
  zoomed: false,
  reduced: mqReduce.matches,
  noteGone: false,
  catTaps: [],
  lastBrowse: 0,
  flick: { start: -1e9, dur: 1600, amp: 1 },
  nextFlick: 0,
  glow: [0, 0, 0],
  glowA: 0,
  glowTarget: [0, 0, 0],
  lay: null,
};
const crtState = { sx: 1, sy: 1, white: 0, bright: 0, static: 0, tear: 0, roll: 0, dot: 0, ghost: 0, time: 0, motion: 1 };
const photoTint = new Map();

const NAMES = () => ({
  0: L().ch0,
  1: Blog.t('stories').toUpperCase(),
  2: Blog.t('opinions').toUpperCase(),
  3: Blog.t('gallery').toUpperCase(),
  4: Blog.t('about').toUpperCase(),
  9: L().ch9,
  av: L().av,
});
const isEmpty = (ch) => typeof ch === 'number' && ch >= 5 && ch <= 8;

let scene;
let screen;
let crt;
let remote;
const sound = new Sound();

// ------------------------------------------------------------------ boot
async function boot() {
  $('#bootText').textContent = Blog.t('loading');
  screen = new Screen();
  screen.touch = window.matchMedia('(pointer: coarse)').matches;
  screen.preload();
  scene = await buildScene(stage, $('#wallCanvas'));
  $('#lens').style.setProperty('--grain', `url(${scene.grainU})`);
  document.documentElement.style.setProperty('--paper', `url(${scene.grainU})`);
  crt = new CRT(scene.canvas, screen.canvas);
  scene.canvas = crt.canvas;
  crt.onswap = (cv) => {
    scene.canvas = cv;
    wireScreenGestures();
    announce();
  };
  remote = buildRemote(dock, onCmd);
  glowEls = [stage.querySelector('.screenlight'), stage.querySelector('.screenspill'), scene.halo, remote.el.querySelector('.r-glow')];
  wireScene();
  wireChrome();
  wireKeys();
  wireScreenGestures();
  wireParallax();
  Blog.onLangChange(onLang);
  applyLang(false);
  layout();
  window.addEventListener('resize', () => requestAnimationFrame(layout));
  mqReduce.addEventListener?.('change', (e) => {
    S.reduced = e.matches;
    crtState.motion = S.reduced ? 0 : 1;
    applySnow();
  });
  crtState.motion = S.reduced ? 0 : 1;
  screen.reduced = S.reduced;
  // fonts used inside the canvas
  const fams = ['16px "Press Start 2P"', '600 30px Cormorant', 'italic 600 30px Cormorant', '20px "Russo One"', '500 20px Rubik', '600 20px Rubik', '600 30px Literata'];
  await Promise.race([
    Promise.all(fams.map((f) => document.fonts.load(f, 'БъркотияAbc0123'))).catch(() => {}),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  screen.cache = {};
  tailUpdate(0, 0);
  S.nextFlick = performance.now() + 3000;
  // the hidden channel's cat-cam image is rasterised from the scene's own cat
  let catBusy = false;
  screen.needCat = () => {
    if (catBusy || screen.catImg) return;
    catBusy = true;
    const svgOf = (sel, cls) =>
      stage.querySelector(sel).outerHTML.replace(`class="cat ${cls}"`, 'xmlns="http://www.w3.org/2000/svg" width="840" height="440"');
    const loadSvg = (str) =>
      new Promise((res) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str);
      });
    Promise.all([loadSvg(svgOf('.cat-body', 'cat-body')), loadSvg(svgOf('.cat-head', 'cat-head'))]).then(([a, b]) => {
      catBusy = false;
      if (!a || !b) return;
      const c = document.createElement('canvas');
      c.width = 840;
      c.height = 440;
      const x = c.getContext('2d');
      x.drawImage(a, 0, 0);
      x.drawImage(b, 0, 0);
      screen.catImg = c;
    });
  };
  setTimeout(() => screen.needCat(), 1500);
  app.classList.remove('is-booting');
  requestAnimationFrame(() => app.classList.add('is-ready'));
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      renderOnce = true;
      kick();
    }
  });
  await route();
  kick();
}

// ------------------------------------------------------------------ layout
function layout() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const cs = getComputedStyle(document.documentElement);
  const safeT = parseFloat(cs.getPropertyValue('--sat')) || 0;
  const wide = vw / vh < 1.05 || vw < 720;
  if (wide && S.lay && !S.lay.wide) {
    gsap.set(remote.el, { clearProps: 'transform' });
    gsap.set('#wallCanvas', { x: 0, y: 0 });
  }
  remote.setLayout(wide);
  app.classList.toggle('is-portrait', wide);
  let s;
  let ox;
  let oy;
  if (!wide) {
    s = Math.min(vw / 1760, vh / 1100);
    ox = (vw - 1760 * s) / 2;
    oy = (vh - 1100 * s) / 2;
    let rs = clamp(s * 1.02, 0.66, 1.12);
    dock.style.setProperty('--rs', rs.toFixed(3));
    dock.style.width = '';
    let rh = remote.el.offsetHeight;
    if (rh > vh - 90) {
      rs *= (vh - 90) / rh;
      dock.style.setProperty('--rs', rs.toFixed(3));
      rh = remote.el.offsetHeight;
    }
    const rw = remote.el.offsetWidth;
    let left = ox + 1300 * s;
    left = Math.min(left, vw - rw - 28);
    let top = oy + 640 * s - rh / 2;
    top = clamp(top, 70, vh - rh - 18);
    dock.style.left = `${left}px`;
    dock.style.top = `${top}px`;
  } else {
    const chromeH = 50 + safeT;
    const rw = Math.min(vw - 16, 450);
    const rs = rw / 360;
    dock.style.setProperty('--rs', rs.toFixed(3));
    dock.style.left = `${(vw - rw) / 2}px`;
    dock.style.top = '';
    dock.style.width = `${rw}px`;
    const rh = remote.el.offsetHeight;
    const avail = vh - chromeH - rh + 6;
    // visible part of the stage: x 385..1215 (tail to vines), y 0..935 (antenna tips to cabinet edge)
    s = Math.min((vw - 6) / 830, avail / 935);
    ox = vw / 2 - 800 * s;
    oy = chromeH + Math.max(0, (avail - 935 * s) * 0.4);
  }
  stage.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${s.toFixed(4)})`;
  document.documentElement.style.setProperty('--s', s.toFixed(4));
  S.lay = { vw, vh, s, ox, oy, wide };
  scene.wall.paint(vw, vh, s, ox, oy);
  crt.resize(560 * s, 420 * s, quality);
  screen.compact = 560 * s < 400;
  if (S.zoomed) gsap.set(camera, zoomTarget());
  renderOnce = true;
  kick();
}

function zoomTarget() {
  const { vw, vh, s, ox, oy } = S.lay;
  // opening of the tube in viewport coordinates
  const x = ox + (TV.x + 56) * s;
  const y = oy + (TV.y + 56) * s;
  const w = 548 * s;
  const h = 411 * s;
  const z = Math.max(vw / w, vh / h) * 1.04;
  return { x: vw / 2 - z * (x + w / 2), y: vh / 2 - z * (y + h / 2), scale: z };
}

// ------------------------------------------------------------------ loop
let raf = 0;
let wake = 0;
let renderOnce = true;
let lastGlow = 0;
let lastContent = 0;
let quality = 1;
let ema = 16;
let lastFrame = 0;
let frames = 0;
const coarse = window.matchMedia('(pointer: coarse)').matches;
function kick() {
  clearTimeout(wake);
  if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
}
function frame(now) {
  raf = 0;
  if (document.hidden) return;
  crtState.time = now / 1000;
  let busy = false;
  const covered = (S.mode === 'reader' || S.mode === 'viewer') && S.zoomed && !gsap.isTweening(camera);
  const lit = S.power || crtState.dot > 0.001 || crtState.bright > 0.001;
  if (!covered && (lit || renderOnce)) {
    // the broadcast itself runs at 30 fps; the tube (noise, flicker) at display rate on desktop
    const fresh = !lit || renderOnce || now - lastContent > 32;
    if (fresh || (!coarse && quality > 0.7)) {
      if (lit && fresh) {
        lastContent = now;
        autoAdvance(now);
        screen.draw(now, { slideshow: S.ch === 3 && !S.reduced ? 7 : 0 });
      }
      crt.render(crtState, fresh);
      renderOnce = false;
    }
    busy = lit;
    // adapt tube resolution on slow devices
    if (lit && lastFrame) {
      ema = ema * 0.94 + (now - lastFrame) * 0.06;
      if (++frames > 45 && ema > 45 && quality > 0.5) {
        quality = Math.max(0.5, quality * 0.8);
        frames = 0;
        crt.resize(560 * S.lay.s, 420 * S.lay.s, quality);
      }
    }
    lastFrame = lit ? now : 0;
  } else lastFrame = 0;
  if (now - lastGlow > 70) {
    lastGlow = now;
    if (updateGlow()) busy = true;
  } else busy = busy || glowMoving;
  if (gsap.isTweening(camera) || gsap.isTweening(crtState)) busy = true;
  // tail flicks
  if (!S.reduced) {
    if (now > S.nextFlick && now - S.flick.start > S.flick.dur) {
      S.flick = { start: now, dur: 1300 + Math.random() * 900, amp: 0.7 + Math.random() * 0.6 };
      S.nextFlick = now + 6000 + Math.random() * 9000;
      if (Math.random() < 0.4) twitchEar();
    }
    const ft = now - S.flick.start;
    if (ft < S.flick.dur + 50) {
      const env = Math.sin(Math.PI * clamp(ft / S.flick.dur, 0, 1));
      tailUpdate(env * S.flick.amp, ft / 1000);
      busy = true;
    }
  }
  if (busy) raf = requestAnimationFrame(frame);
  else if (!S.reduced) wake = setTimeout(kick, Math.max(200, S.nextFlick - now));
}

function tailUpdate(f, t) {
  const d = tailPath(f, t);
  scene.tailA.setAttribute('d', d);
  scene.tailB.setAttribute('d', d);
}

function autoAdvance(now) {
  if (S.ch !== 3 || S.reduced || S.mode !== 'tv') return;
  if (now - screen.itemAt > 7000 && now - S.lastBrowse > 12000) screen.step(1, now);
}

// glow follows what's on screen (precomputed tints, no GPU readback)
function tintOf(file) {
  if (photoTint.has(file)) return photoTint.get(file);
  const im = screen.img(file);
  if (!im) return null;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 3;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0, 4, 3);
  const d = x.getImageData(0, 0, 4, 3).data;
  const out = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) {
    out[0] += d[i];
    out[1] += d[i + 1];
    out[2] += d[i + 2];
  }
  const tint = out.map((v) => v / 12);
  photoTint.set(file, tint);
  return tint;
}
function glowTarget() {
  if (screen.card) return [70, 82, 76];
  const ch = S.ch;
  const mix = (a, b, k) => a.map((v, i) => v * (1 - k) + b[i] * k);
  if (isEmpty(ch)) return [150, 155, 160];
  if (ch === 0) return [150, 140, 150];
  if (ch === 1) {
    const t = tintOf(screen.current(1).cover);
    return t ? mix([40, 60, 160], t, 0.35) : [40, 60, 160];
  }
  if (ch === 2) {
    const t = tintOf(screen.current(2).cover);
    return t ? mix([200, 40, 36], t, 0.3) : [200, 40, 36];
  }
  if (ch === 3) {
    const t = tintOf(screen.current(3).file);
    return t ? mix(t, [255, 255, 255], 0.15) : [140, 140, 140];
  }
  if (ch === 4) return [40, 60, 200];
  if (ch === 9) return [60, 200, 90];
  if (ch === 'av') return [30, 60, 230];
  return [120, 120, 120];
}
let glowMoving = true;
let glowEls = [];
let glowStr = '';
function updateGlow() {
  const tgt = S.power ? glowTarget() : [0, 0, 0];
  // normalise toward a light colour, keep hue
  const mx = Math.max(1, ...tgt);
  const norm = tgt.map((v) => (v / mx) * 255);
  let moving = false;
  for (let i = 0; i < 3; i++) {
    const d = norm[i] - S.glow[i];
    if (Math.abs(d) > 0.6) moving = true;
    S.glow[i] += d * 0.2;
  }
  const lum = (0.3 * tgt[0] + 0.59 * tgt[1] + 0.11 * tgt[2]) / 255;
  const a = (S.power ? 0.55 + lum * 0.6 : 0) * crtState.bright + crtState.static * 0.4 + crtState.dot * 0.4;
  const da = clamp(a, 0, 1) - S.glowA;
  if (Math.abs(da) > 0.003) moving = true;
  S.glowA += da * 0.22;
  const str = `${S.glow.map((v) => Math.round(v)).join(',')}|${S.glowA.toFixed(2)}`;
  if (str !== glowStr) {
    glowStr = str;
    const [rgb, al] = str.split('|');
    // set on the few consumers only: a :root change would restyle every SVG node
    for (const el of glowEls) {
      el.style.setProperty('--glow', rgb);
      el.style.setProperty('--glow-a', al);
    }
  }
  glowMoving = moving;
  return moving;
}

// ------------------------------------------------------------------ power
let powerTl = null;
function powerOn(instant = false) {
  if (S.power) return Promise.resolve();
  S.power = true;
  app.classList.add('is-on');
  powerTl?.kill();
  sound.powerOn();
  if (!S.noteGone) peelNote();
  updateLeds();
  announce();
  if (instant) {
    Object.assign(crtState, { sx: 1, sy: 1, white: 0, bright: 1, dot: 0, static: 0 });
    kick();
    return Promise.resolve();
  }
  kick();
  return new Promise((res) => {
    if (S.reduced) {
      Object.assign(crtState, { sx: 1, sy: 1, white: 0, dot: 0 });
      powerTl = gsap.to(crtState, { bright: 1, duration: 0.6, ease: 'power1.out', onComplete: res });
      return;
    }
    Object.assign(crtState, { sx: 0.004, sy: 0.003, white: 1, bright: 0, dot: 0, static: 0 });
    powerTl = gsap
      .timeline({ onComplete: res })
      .to(crtState, { bright: 1.25, sx: 1, duration: 0.2, ease: 'power3.out' })
      .to(crtState, { sy: 1, duration: 0.55, ease: 'expo.out' }, '+=0.06')
      .to(crtState, { white: 0, duration: 0.7, ease: 'power2.out' }, '<0.08')
      .to(crtState, { bright: 1, duration: 0.6, ease: 'sine.out' }, '<')
      .fromTo(crtState, { tear: 0.6 }, { tear: 0, duration: 0.6, ease: 'power2.out' }, '<0.1');
    setTimeout(() => showChannelOsd(), 650);
  });
}

function powerOff() {
  if (!S.power) return;
  S.power = false;
  app.classList.remove('is-on');
  powerTl?.kill();
  sound.powerOff();
  updateLeds();
  scene.catHead.classList.remove('peek');
  live.textContent = '';
  if (S.reduced) {
    powerTl = gsap.to(crtState, { bright: 0, static: 0, duration: 0.5, ease: 'power1.in', onComplete: () => (renderOnce = true) });
    return;
  }
  powerTl = gsap
    .timeline({ onComplete: () => (renderOnce = true) })
    .to(crtState, { static: 0, duration: 0.05 })
    .to(crtState, { sy: 0.004, white: 0.95, bright: 1.3, duration: 0.2, ease: 'power3.in' }, 0)
    .to(crtState, { sx: 0.002, duration: 0.16, ease: 'power2.in' })
    .set(crtState, { bright: 0, dot: 1 })
    .to(crtState, { dot: 0, duration: 1.1, ease: 'power2.out' });
  kick();
}

function peelNote() {
  S.noteGone = true;
  const n = remote.note;
  if (S.reduced) {
    gsap.to(n, { opacity: 0, duration: 0.3, onComplete: () => (n.hidden = true) });
    return;
  }
  gsap.to(n, {
    rotation: '+=24',
    y: -40,
    x: S.lay?.wide ? 60 : -50,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.in',
    onComplete: () => (n.hidden = true),
  });
}

// ------------------------------------------------------------------ channels
let switchTl = null;
function setChannel(ch, { quiet = false, instant = false } = {}) {
  if (!S.power) {
    S.lastCh = S.ch;
    S.ch = ch;
    screen.setChannel(ch, performance.now());
    powerOn(instant);
    applySnow();
    return;
  }
  if (ch === S.ch && !instant) {
    showChannelOsd();
    return;
  }
  S.lastCh = S.ch;
  S.ch = ch;
  switchTl?.kill();
  const swap = () => {
    screen.setChannel(ch, performance.now());
    screen.card = null;
    applySnow();
    updateLeds();
    if (!quiet) showChannelOsd();
    announce();
  };
  if (instant) {
    swap();
    return;
  }
  if (S.reduced) {
    switchTl = gsap
      .timeline()
      .to(crtState, { bright: 0.08, duration: 0.14, ease: 'power1.in' })
      .add(swap)
      .to(crtState, { bright: 1, duration: 0.3, ease: 'power1.out' });
    return;
  }
  sound.static(0.34);
  switchTl = gsap
    .timeline()
    .to(crtState, { static: 1, tear: 0.8, duration: 0.07, ease: 'none' })
    .add(swap, '+=0.12')
    .to(crtState, { static: isEmpty(ch) ? 0.94 : 0, tear: 0, duration: 0.24, ease: 'power2.out' }, '+=0.06');
  if (ch === 9) {
    switchTl.fromTo(crtState, { roll: 0.0001 }, { roll: 1, duration: 1.1, ease: 'power2.out', onComplete: () => (crtState.roll = 0) }, '<');
  }
}

function applySnow() {
  const empty = isEmpty(S.ch);
  screen.reduced = S.reduced;
  if (S.reduced) crtState.static = 0;
  else if (!switchTl?.isActive()) crtState.static = empty && S.power ? 0.94 : 0;
  sound.snow(empty && S.power);
  crtState.ghost = empty ? 0.6 : 0;
  scene.catHead.classList.toggle('peek', S.ch === 9 && S.power);
}

function showChannelOsd(info = false) {
  const ch = S.ch;
  const names = NAMES();
  const num = ch === 'av' ? 'AV' : ch;
  const name = isEmpty(ch) ? L().snowName : names[ch];
  let title = '';
  if (info) {
    const cur = screen.current(ch);
    if (ch === 1 || ch === 2) title = Blog.view(cur).title;
    else if (ch === 3) title = Blog.text(cur.caption);
    else if (ch === 4) title = L().tt.pages[screen.idx[4] % 3];
    else title = Blog.text(Blog.site.tagline);
  }
  screen.showOsd(info ? 'info' : 'channel', { num, name, title }, performance.now(), info ? 4200 : 2800);
}

function updateLeds() {
  scene.ledStandby.classList.toggle('on', S.power);
  scene.presetLeds.forEach((l) => l.classList.toggle('on', S.power && String(S.ch) === l.dataset.ch));
}

function describe() {
  const ch = S.ch;
  const Lx = L();
  if (!S.power) return '';
  if (isEmpty(ch)) return `${Lx.channel(ch)} · ${Lx.noSignal}`;
  const base = `${Lx.channel(ch === 'av' ? 'AV' : ch)} · ${NAMES()[ch]}`;
  const cur = screen.current(ch);
  if (ch === 1 || ch === 2) return `${base}: ${Blog.view(cur).title}`;
  if (ch === 3) return `${base}: ${Blog.text(cur.caption)}`;
  if (ch === 4) return `${base}: ${Blog.text(Blog.site.about)}`;
  return base;
}
function announce() {
  const d = describe();
  scene.canvas.setAttribute('aria-label', `${L().screenLabel}. ${d}`);
  if (S.mode === 'tv') live.textContent = d;
}

function browse(dir) {
  if (!S.power) return;
  const now = performance.now();
  S.lastBrowse = now;
  if (screen.step(dir, now)) {
    sound.static(0.08, 0.12);
    if (!S.reduced && S.ch !== 3) gsap.fromTo(crtState, { tear: S.ch === 4 ? 0.35 : 0.5 }, { tear: 0, duration: 0.3, ease: 'power2.out' });
    announce();
  }
}

// ------------------------------------------------------------------ commands
const CHANNEL_CYCLE = [0, 1, 2, 3, 4];
function cycle(dir) {
  let i = CHANNEL_CYCLE.indexOf(S.ch);
  if (i < 0) i = dir > 0 ? -1 : 0;
  setChannel(CHANNEL_CYCLE[(i + dir + CHANNEL_CYCLE.length) % CHANNEL_CYCLE.length]);
}

function onCmd(cmd, data = {}) {
  sound.click();
  irBlink();
  switch (cmd) {
    case 'power':
      S.power ? powerOff() : powerOn();
      break;
    case 'digit':
      setChannel(Number(data.n));
      break;
    case 'fast':
      setChannel(Number(data.n) + 1);
      break;
    case 'chUp':
    case 'up':
      S.power ? cycle(1) : powerOn();
      break;
    case 'chDown':
    case 'down':
      S.power ? cycle(-1) : powerOn();
      break;
    case 'left':
      browse(-1);
      break;
    case 'right':
      browse(1);
      break;
    case 'ok':
      ok();
      break;
    case 'volUp':
    case 'volDown':
      volume(cmd === 'volUp' ? 1 : -1);
      break;
    case 'mute':
      setSound(!S.soundOn);
      break;
    case 'lang':
      Blog.toggleLang();
      break;
    case 'info':
      if (S.power) showChannelOsd(true);
      else powerOn();
      break;
    case 'guide':
      navigate('#/list');
      break;
    case 'prev':
      if (S.power) setChannel(S.lastCh);
      else powerOn();
      break;
  }
}

function ok() {
  if (!S.power) {
    powerOn();
    return;
  }
  const ch = S.ch;
  if (ch === 1 || ch === 2) navigate(`#/post/${screen.current(ch).slug}`);
  else if (ch === 3) {
    const p = screen.current(3);
    navigate(`#/photo/${p.album}/${p.index}`);
  } else if (ch === 4) navigate('#/about');
  else if (ch === 9) {
    sound.purr();
    catSays(2);
  } else showChannelOsd(true);
}

function volume(d) {
  S.vol = clamp(S.vol + d, 0, 20);
  sound.setLevel(S.vol);
  scene.knobV.style.transform = `rotate(${(S.vol - 10) * 13}deg)`;
  if (S.power) screen.showOsd('volume', { level: S.vol, muted: !S.soundOn }, performance.now(), 2400);
}

function setSound(on) {
  S.soundOn = on;
  sound.setOn(on);
  sound.setLevel(S.vol);
  if (on && S.power) sound.startHum();
  if (!on) sound.stopHum();
  applySnow();
  remote.setMuted(!on);
  const chip = $('#soundChip');
  chip.setAttribute('aria-pressed', String(on));
  chip.querySelector('.chip-sound-label').textContent = on ? L().soundOn : L().soundOff;
  chip.classList.toggle('is-on', on);
  if (S.power) screen.showOsd('mute', { muted: !on }, performance.now(), 2000);
}

function irBlink() {
  const led = scene.ledStandby;
  led.classList.remove('rx');
  void led.offsetWidth;
  led.classList.add('rx');
}

// ------------------------------------------------------------------ language
function applyLang(withOsd) {
  const Lx = L();
  document.title = Lx.title;
  remote.setLang(Blog.lang);
  document.querySelectorAll('[data-blog]').forEach((n) => (n.textContent = Blog.t(n.dataset.blog)));
  $('#siteTitle').textContent = Blog.text(Blog.site.name);
  $('#chromeNav').setAttribute('aria-label', Blog.lang === 'bg' ? 'Бързи връзки' : 'Quick links');
  const chip = $('#langChip');
  chip.setAttribute('aria-label', `${Blog.t('language')}: ${Blog.t('switchTo')}`);
  chip.querySelectorAll('.lang-opt').forEach((o) => o.classList.toggle('is-active', o.dataset.l === Blog.lang));
  $('#soundChip .chip-sound-label').textContent = S.soundOn ? Lx.soundOn : Lx.soundOff;
  $('#soundChip').setAttribute('aria-label', Lx.mute);
  for (const id of ['#readerClose', '#viewerClose']) {
    $(`${id} .rbtn-label`).textContent = Lx.backToTv;
    $(id).setAttribute('aria-label', Lx.backToTv);
  }
  $('#viewerPrev').setAttribute('aria-label', Blog.t('prev'));
  $('#viewerNext').setAttribute('aria-label', Blog.t('next'));
  // printed parts of the telly
  const T = scene.tvTexts;
  T.sub.textContent = `${Lx.tvBrandSub} · 51ТЦ-89`;
  T.presets.textContent = Lx.presets;
  T.knobB.textContent = Lx.knobBright;
  T.knobV.textContent = Lx.knobVol;
  T.power.textContent = Lx.printPower;
  screen.cache = {};
  announce();
  if (withOsd && S.power) {
    screen.showOsd('lang', {}, performance.now(), 2400);
    if (!S.reduced) gsap.fromTo(crtState, { tear: 1, roll: 0.0001 }, { tear: 0, roll: 0.04, duration: 0.45, ease: 'power2.out', onComplete: () => (crtState.roll = 0) });
    sound.static(0.18, 0.15);
  }
  if (S.mode === 'reader') refreshReader();
  if (S.mode === 'viewer') refreshViewer();
  if (S.mode === 'guide') renderGuide($('#guidePaper'));
}
function onLang() {
  applyLang(true);
}

// ------------------------------------------------------------------ chrome + scene wiring
function wireChrome() {
  $('#langChip').addEventListener('click', () => {
    sound.click();
    Blog.toggleLang();
  });
  $('#soundChip').addEventListener('click', () => setSound(!S.soundOn));
  $('#listLink').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('#/list');
  });
  $('#readerClose').addEventListener('click', closeView);
  $('#viewerClose').addEventListener('click', closeView);
  $('#viewerPrev').addEventListener('click', () => stepPhoto(-1));
  $('#viewerNext').addEventListener('click', () => stepPhoto(1));
  // in-app links (reader pager, guide)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-nav]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const h = a.getAttribute('href');
    if (S.mode === 'reader' && a.dataset.nav === 'post') {
      history.replaceState(history.state, '', h);
      route();
    } else navigate(h);
  });
  guideEl.addEventListener('click', (e) => {
    if (e.target.closest('#guideClose') || e.target === guideEl) closeView();
  });
  // swipe photos in the viewer
  let sx = null;
  viewerEl.addEventListener('pointerdown', (e) => (sx = { x: e.clientX, y: e.clientY }));
  viewerEl.addEventListener('pointerup', (e) => {
    if (!sx) return;
    const dx = e.clientX - sx.x;
    const dy = e.clientY - sx.y;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) stepPhoto(dx < 0 ? 1 : -1);
  });
}

function wireScene() {
  scene.presets.forEach((p) =>
    p.addEventListener('click', (e) => {
      e.stopPropagation();
      const ch = p.dataset.ch === 'av' ? 'av' : Number(p.dataset.ch);
      p.classList.add('is-down');
      setTimeout(() => p.classList.remove('is-down'), 160);
      sound.click();
      setChannel(ch);
    })
  );
  scene.tvPower.addEventListener('click', (e) => {
    e.stopPropagation();
    scene.tvPower.classList.add('is-down');
    setTimeout(() => scene.tvPower.classList.remove('is-down'), 180);
    sound.click();
    S.power ? powerOff() : powerOn();
  });
  // give the telly a whack
  scene.tv.querySelector('.tv-body').addEventListener('click', (e) => {
    if (e.target.closest('.preset, .tv-power')) return;
    if (S.reduced) return;
    scene.tv.classList.remove('whack');
    void scene.tv.offsetWidth;
    scene.tv.classList.add('whack');
    sound.click();
    if (S.power) gsap.fromTo(crtState, { roll: 0.0001, tear: 0.7 }, { roll: 1, tear: 0, duration: 0.7, ease: 'power3.out', onComplete: () => (crtState.roll = 0) });
    flickNow(1.3);
  });
  scene.catHit.addEventListener('click', () => {
    const now = performance.now();
    S.catTaps = S.catTaps.filter((t) => now - t < 5000);
    S.catTaps.push(now);
    sound.purr(1.4);
    flickNow(1);
    twitchEar();
    if (S.catTaps.length >= 3) {
      S.catTaps = [];
      catSays(2);
      setChannel(9);
    } else catSays(S.catTaps.length - 1);
  });
}

function flickNow(amp) {
  if (S.reduced) return;
  S.flick = { start: performance.now(), dur: 1200, amp };
  kick();
}
function twitchEar() {
  if (S.reduced) return;
  const h = scene.catHead;
  h.classList.remove('twitch');
  void h.getBoundingClientRect();
  h.classList.add('twitch');
}
let bubbleT = 0;
function catSays(i) {
  const b = scene.bubble;
  b.textContent = L().cat[i % L().cat.length];
  b.classList.add('show');
  clearTimeout(bubbleT);
  bubbleT = setTimeout(() => b.classList.remove('show'), 1800);
}

function wireScreenGestures() {
  const el = scene.canvas;
  let st = null;
  el.addEventListener('pointerdown', (e) => {
    st = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  el.addEventListener('pointerup', (e) => {
    if (!st) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    const dt = performance.now() - st.t;
    st = null;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < 12 && ay < 12 && dt < 600) {
      sound.click();
      ok();
    } else if (ax > 36 && ax > ay) {
      sound.click();
      browse(dx < 0 ? 1 : -1);
    } else if (ay > 36) {
      sound.click();
      S.power ? cycle(dy < 0 ? 1 : -1) : powerOn();
    }
  });
  el.addEventListener('pointercancel', () => (st = null));
}

// a whisper of depth on desktop: the wall drifts behind, the remote floats in front
function wireParallax() {
  if (coarse) return;
  const wall = $('#wallCanvas');
  const opts = { duration: 1.4, ease: 'power3.out' };
  const wx = gsap.quickTo(wall, 'x', opts);
  const wy = gsap.quickTo(wall, 'y', opts);
  const rx = gsap.quickTo(remote.el, 'x', opts);
  const ry = gsap.quickTo(remote.el, 'y', opts);
  window.addEventListener('pointermove', (e) => {
    if (S.reduced || S.mode !== 'tv' || !S.lay || S.lay.wide) return;
    const nx = e.clientX / S.lay.vw - 0.5;
    const ny = e.clientY / S.lay.vh - 0.5;
    wx(-nx * 22);
    wy(-ny * 14);
    rx(nx * 10);
    ry(ny * 6);
    kick();
  });
}

// ------------------------------------------------------------------ keyboard
function wireKeys() {
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onControl = e.target.closest?.('button, a, input, textarea, select');
    if (S.mode !== 'tv') {
      if (k === 'Escape') {
        e.preventDefault();
        closeView();
      } else if (k === 'l' || k === 'L' || k === 'л' || k === 'Л') {
        Blog.toggleLang();
      } else if (S.mode === 'viewer' && (k === 'ArrowLeft' || k === 'ArrowRight')) {
        e.preventDefault();
        stepPhoto(k === 'ArrowLeft' ? -1 : 1);
      }
      return;
    }
    let cmd = null;
    let n;
    if (/^[0-9]$/.test(k)) {
      cmd = 'digit';
      n = k;
    } else if (k === 'ArrowLeft') cmd = 'left';
    else if (k === 'ArrowRight') cmd = 'right';
    else if (k === 'ArrowUp' || k === 'PageUp') cmd = 'chUp';
    else if (k === 'ArrowDown' || k === 'PageDown') cmd = 'chDown';
    else if (k === 'Enter' && !onControl) cmd = 'ok';
    else if (k === '+' || k === '=') cmd = 'volUp';
    else if (k === '-' || k === '_') cmd = 'volDown';
    else if (k === 'm' || k === 'M' || k === 'м' || k === 'М') cmd = 'mute';
    else if (k === 'l' || k === 'L' || k === 'л' || k === 'Л') cmd = 'lang';
    else if (k === 'p' || k === 'P' || k === 'п' || k === 'П') cmd = 'power';
    else if (k === 'i' || k === 'I' || k === 'и' || k === 'И') cmd = 'info';
    else if (k === 'g' || k === 'G') cmd = 'guide';
    if (!cmd) return;
    e.preventDefault();
    remote.ghost(cmd === 'chUp' ? 'chUp' : cmd === 'chDown' ? 'chDown' : cmd, n);
    onCmd(cmd, { n });
  });
}

// ------------------------------------------------------------------ routing + views
function navigate(hash) {
  if (location.hash === hash) return;
  history.pushState({ tv: 1 }, '', hash);
  route();
}

function closeView() {
  if (history.state && history.state.tv) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    route();
  }
}

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'post' && Blog.post(parts[1])) return { view: 'reader', kind: 'post', post: Blog.post(parts[1]) };
  if (parts[0] === 'about') return { view: 'reader', kind: 'about' };
  if (parts[0] === 'photo') {
    const a = Blog.albums.find((x) => x.slug === parts[1]);
    const p = a && a.photos[Number(parts[2])];
    if (p) return { view: 'viewer', photo: p };
  }
  if (parts[0] === 'list') return { view: 'guide' };
  return { view: 'tv' };
}

let routing = false;
let pending = false;
let firstRoute = true;
async function route() {
  if (routing) {
    pending = true;
    return;
  }
  routing = true;
  try {
    do {
      pending = false;
      await applyRoute(parseHash());
    } while (pending);
  } finally {
    routing = false;
  }
}

let current = null;
async function applyRoute(r) {
  const instant = firstRoute;
  firstRoute = false;
  if (r.view === 'tv') {
    if (S.mode === 'guide') await hideGuide();
    if (S.mode === 'reader' || S.mode === 'viewer') await zoomOut();
    S.mode = 'tv';
    setInert(false);
    return;
  }
  if (r.view === 'guide') {
    if (S.mode === 'reader' || S.mode === 'viewer') await zoomOut(true);
    S.mode = 'guide';
    await showGuide(instant);
    return;
  }
  if (S.mode === 'guide') await hideGuide();
  // reader / viewer
  syncTvTo(r, instant);
  current = r;
  if (r.view === 'reader') {
    viewerEl.hidden = true;
    refreshReader();
    if (S.mode !== 'reader' && S.mode !== 'viewer') await zoomIn(readerEl, instant);
    else if (S.mode === 'viewer') swapPanels(viewerEl, readerEl);
    else flashSwap(readerEl);
    S.mode = 'reader';
    $('#readerScroll').scrollTop = 0;
    focusSoon($('#readerTitle'));
  } else {
    readerEl.hidden = true;
    refreshViewer();
    if (S.mode !== 'reader' && S.mode !== 'viewer') await zoomIn(viewerEl, instant);
    else if (S.mode === 'reader') swapPanels(readerEl, viewerEl);
    S.mode = 'viewer';
    focusSoon($('#viewerClose'));
  }
}

function syncTvTo(r, instant) {
  // the telly behind the reader always shows what you're reading
  let ch;
  if (r.kind === 'post') {
    ch = channelOf(r.post);
    const list = ch === 1 ? Blog.stories : Blog.opinions;
    screen.idx[ch] = list.indexOf(r.post);
  } else if (r.kind === 'about') ch = 4;
  else if (r.photo) {
    ch = 3;
    screen.idx[3] = Blog.photos.indexOf(r.photo);
  }
  if (!S.power) {
    S.ch = ch;
    screen.setChannel(ch, performance.now());
    powerOn(true);
    updateLeds();
  } else if (S.ch !== ch) setChannel(ch, { instant: true, quiet: true });
  else screen.itemAt = performance.now();
}

function refreshReader() {
  const r = current;
  if (!r || r.view !== 'reader') return;
  const art = $('#readerArticle');
  const info = r.kind === 'post' ? renderPost(art, r.post) : renderAbout(art);
  $('#readerOsd').textContent = info.osd;
  readerEl.dataset.type = r.kind === 'post' ? r.post.type : 'about';
}

function refreshViewer() {
  const r = current;
  if (!r || r.view !== 'viewer') return;
  renderPhoto({ title: $('#viewerTitle'), cap: $('#viewerCap'), img: $('#viewerImg'), frame: $('.viewer-frame') }, r.photo);
}

function stepPhoto(d) {
  if (S.mode !== 'viewer' || !current?.photo) return;
  const all = Blog.photos;
  const i = (all.indexOf(current.photo) + d + all.length) % all.length;
  const p = all[i];
  history.replaceState(history.state, '', `#/photo/${p.album}/${p.index}`);
  current = { view: 'viewer', photo: p };
  screen.idx[3] = i;
  const fig = $('#viewerFigure');
  if (!S.reduced) gsap.fromTo(fig, { x: d * 40, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
  refreshViewer();
}

function setInert(on) {
  room.inert = on;
  dock.inert = on;
}

function focusSoon(el) {
  setTimeout(() => el?.focus({ preventScroll: true }), 60);
}

function cardFor(r) {
  const Bl = Blog;
  if (r.kind === 'post') {
    const v = Bl.view(r.post);
    return { kicker: `${Bl.t(r.post.type)} · ${Bl.date(r.post.date)}`, title: v.title, accent: r.post.type === 'story' ? '#e7b765' : '#ff6b5b' };
  }
  if (r.kind === 'about') return { kicker: Bl.t('about'), title: Bl.text(Bl.site.name), accent: '#7fd6ff' };
  return null;
}

let lastFocus = null;
async function zoomIn(panel, instant) {
  lastFocus = document.activeElement;
  setInert(true);
  const card = cardFor(current);
  screen.card = card;
  S.zoomed = true;
  const tgt = zoomTarget();
  panel.hidden = false;
  if (instant) {
    gsap.set(camera, { ...tgt, transformOrigin: '0 0' });
    gsap.set(dock, { autoAlpha: 0 });
    gsap.set(panel, { autoAlpha: 1 });
    app.classList.add('is-zoomed');
    return;
  }
  gsap.set(panel, { autoAlpha: 0 });
  if (S.reduced) {
    gsap.set(camera, { ...tgt, transformOrigin: '0 0' });
    gsap.to(dock, { autoAlpha: 0, duration: 0.25 });
    app.classList.add('is-zoomed');
    await gsap.to(panel, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' });
    return;
  }
  if (card) gsap.fromTo(crtState, { tear: 0.6, static: 0.35 }, { tear: 0, static: 0, duration: 0.35, ease: 'power2.out' });
  sound.static(0.12, 0.12);
  const wide = S.lay.wide;
  gsap.to(dock, wide ? { y: 140, autoAlpha: 0, duration: 0.55, ease: 'power2.in' } : { x: 160, rotation: 14, autoAlpha: 0, duration: 0.6, ease: 'power2.in' });
  app.classList.add('is-zoomed');
  await new Promise((res) => {
    gsap
      .timeline({ onComplete: res })
      .to(camera, { ...tgt, transformOrigin: '0 0', duration: 1.25, ease: 'power3.inOut' }, 0.1)
      .fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, 1.0)
      .fromTo(panel.querySelector('.reader-article, .viewer-figure'), { y: 18 }, { y: 0, duration: 0.7, ease: 'power3.out' }, 1.0);
  });
}

async function zoomOut(keepHidden = false) {
  const panel = S.mode === 'viewer' ? viewerEl : readerEl;
  const wasViewer = S.mode === 'viewer';
  S.mode = 'tv';
  const restoreFocus = () => {
    const target = lastFocus && document.contains(lastFocus) && !lastFocus.closest('#reader, #viewer, #guide') ? lastFocus : remote.el.querySelector('.key-ok');
    if (!keepHidden) target?.focus({ preventScroll: true });
  };
  const finish = () => {
    panel.hidden = true;
    screen.card = null;
    S.zoomed = false;
    app.classList.remove('is-zoomed');
  };
  if (keepHidden || S.reduced) {
    await gsap.to(panel, { autoAlpha: 0, duration: keepHidden ? 0.2 : 0.3 });
    gsap.set(camera, { x: 0, y: 0, scale: 1 });
    gsap.set(dock, { x: 0, y: 0, rotation: 0 });
    gsap.to(dock, { autoAlpha: 1, duration: 0.3 });
    finish();
    setInert(keepHidden);
    restoreFocus();
    return;
  }
  setInert(false);
  await new Promise((res) => {
    gsap
      .timeline({ onComplete: res })
      .to(panel, { autoAlpha: 0, duration: 0.32, ease: 'power1.in' })
      .add(() => {
        panel.hidden = true;
        if (!wasViewer) {
          crtState.tear = 0.5;
          gsap.to(crtState, { tear: 0, duration: 0.4 });
        }
        screen.card = null;
      })
      .to(camera, { x: 0, y: 0, scale: 1, duration: 1.1, ease: 'power3.inOut' }, 0.2)
      .add(() => app.classList.remove('is-zoomed'), 0.4)
      .to(dock, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out' }, 0.85);
  });
  finish();
  restoreFocus();
  announce();
}

function swapPanels(from, to) {
  from.hidden = true;
  gsap.set(from, { autoAlpha: 0 });
  to.hidden = false;
  gsap.fromTo(to, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
}

function flashSwap(panel) {
  if (S.reduced) return;
  const art = panel.querySelector('.reader-article');
  gsap.fromTo(art, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
  const scan = panel.querySelector('.reader-scan');
  gsap.fromTo(scan, { opacity: 0.9 }, { opacity: 0.35, duration: 0.5, ease: 'power2.out', clearProps: 'opacity' });
}

async function showGuide(instant) {
  const paper = $('#guidePaper');
  renderGuide(paper);
  lastFocus = lastFocus && !lastFocus.closest?.('#reader, #viewer') ? lastFocus : document.activeElement;
  guideEl.hidden = false;
  setInert(true);
  app.classList.add('is-guide');
  if (instant || S.reduced) {
    gsap.set(guideEl, { autoAlpha: 1 });
    gsap.set(paper, { y: 0, rotation: 0, autoAlpha: 1 });
  } else {
    gsap.set(guideEl, { autoAlpha: 1 });
    gsap.fromTo(guideEl, { '--dim': 0 }, { '--dim': 1, duration: 0.5 });
    await gsap.fromTo(paper, { y: () => window.innerHeight * 0.8, rotation: -5, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 0.75, ease: 'back.out(1.1)' });
  }
  focusSoon($('#guideTitle'));
}

async function hideGuide() {
  const paper = $('#guidePaper');
  if (!S.reduced) {
    gsap.to(guideEl, { '--dim': 0, duration: 0.4 });
    await gsap.to(paper, { y: () => window.innerHeight * 0.9, rotation: 4, autoAlpha: 0, duration: 0.5, ease: 'power2.in' });
  }
  guideEl.hidden = true;
  app.classList.remove('is-guide');
  S.mode = 'tv';
  setInert(false);
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}

boot();
