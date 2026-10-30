import { paintWood, grainTile, kraftTile, inkMask } from './textures.js';
import { sound } from './sound.js';
import { listHTML, postHTML, esc } from './sheets.js';

const B = window.Blog;
const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const pad2 = (n) => String(n).padStart(2, '0');
const wrapPi = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);

/* ------------------------------------------------------------------ strings */

const UI = {
  bg: {
    docTitle: 'маса със снимки',
    tableLabel: 'Маса със снимки. Влачи, хвърляй и обръщай снимките.',
    controls: 'Управление на масата',
    tidy: 'Подреди',
    mess: 'Разбъркай',
    sound: 'Звук',
    soundOn: 'Звукът е включен',
    soundOff: 'Звукът е изключен',
    langAria: 'Смени езика на английски',
    hint: 'Влачи и хвърляй снимките. Докосни — обръща. Два пъти — отблизо.',
    flip: 'обърни',
    magnify: 'Разгледай отблизо',
    albums: 'Албуми',
    tipOut: 'изсипи на масата',
    putBack: 'прибери снимките',
    onTable: 'на масата',
    tipOnTable: 'на масата',
    empty: 'Празна маса. Избери плик отдолу.',
    tidyEmpty: 'Празната маса е най-подредената маса.',
    rebel1: 'Тази не иска да се подрежда.',
    rebel2: 'Добре де, добре.',
    slam: 'Ей, внимателно с лампата!',
    allBacks: 'Само гърбове. Колко загадъчно.',
    stampRing: 'ПРОЯВЕНО С ЛЮБОВ · 2026 · ',
    paperBack: 'ФОТОХАРТИЯ',
    sticky: 'Ако четеш това, значи си разместил снимките. Браво! Сега ги подреди. (Шегувам се.)',
    meaningBtn: 'Какво значи „Бъркотия“?',
    photoOf: (i, n) => `${i} от ${n}`,
    prevPhoto: 'Предишна снимка',
    nextPhoto: 'Следваща снимка',
    closePhoto: 'Върни снимката на масата',
    onlyBgShort: 'само на български',
    signoff: '— Б.',
  },
  en: {
    docTitle: 'a table of prints',
    tableLabel: 'A table of prints. Drag, toss and flip the photos.',
    controls: 'Table controls',
    tidy: 'Tidy up',
    mess: 'Mess it up',
    sound: 'Sound',
    soundOn: 'Sound is on',
    soundOff: 'Sound is off',
    langAria: 'Switch language to Bulgarian',
    hint: 'Drag and toss the prints. Tap to flip. Double-tap to look closer.',
    flip: 'flip',
    magnify: 'Look closer',
    albums: 'Albums',
    tipOut: 'tip onto the table',
    putBack: 'put the photos back',
    onTable: 'on the table',
    tipOnTable: 'onto the table',
    empty: 'Empty table. Pick an envelope below.',
    tidyEmpty: 'An empty table is the tidiest table.',
    rebel1: 'That one refuses to be tidied.',
    rebel2: 'Fine. Fine.',
    slam: 'Hey, careful with the lamp!',
    allBacks: 'All backs. How mysterious.',
    stampRing: 'DEVELOPED WITH LOVE · 2026 · ',
    paperBack: 'PHOTO PAPER',
    sticky: 'If you’re reading this, you’ve moved the photos. Well done! Now tidy them up. (Kidding.)',
    meaningBtn: 'What does “Bărkotiya” mean?',
    photoOf: (i, n) => `${i} of ${n}`,
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    closePhoto: 'Put the photo back on the table',
    onlyBgShort: 'in Bulgarian',
    signoff: '— B.',
  },
};
const u = (k) => UI[B.lang]?.[k] ?? UI.bg[k] ?? k;

const ICON = {
  loupe:
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
};

const DOODLES = {
  sofia:
    '<path d="M7 17h34a3 3 0 0 1 3 3v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V20a3 3 0 0 1 3-3z"/><path d="M9 21h7v6H9zM20 21h8v6h-8zM32 21h7v6h-7z"/><path d="M24 17l-4-7 9-2M6 6c11 1 23 1 36-1"/><circle cx="13" cy="39" r="2.4"/><circle cx="35" cy="39" r="2.4"/>',
  more: '<circle cx="33" cy="14" r="6"/><path d="M33 3v2.5M42.5 14H45M40 7l1.6-1.6M26 7l-1.6-1.6"/><path d="M3 30c4-4 7-4 10 0s7 4 10 0 7-4 10 0 7 4 10 0"/><path d="M8 39c4-4 7-4 10 0s7 4 10 0 7-4 10 0"/>',
  planini: '<path d="M3 40l12-19 7 9 9-15 14 25z"/><path d="M27 21l4-6 4 6-2 2-2-2-2 2z"/><path d="M7 11c2-2 4-2 6 0M14 8c2-2 4-2 6 0"/>',
  'stari-gradove':
    '<path d="M6 41V24l10-9 10 9v17z"/><path d="M26 41V29l7-6 8 6v12"/><path d="M13 41v-7h6v7M10 26h4v4h-4zM31 31h4v4h-4z"/><path d="M3 41h42"/>',
  traditsii:
    '<path d="M24 6v5"/><path d="M14 33c0-14 4-21 10-21s10 7 10 21z"/><path d="M11 33h26"/><path d="M21 37a3 3 0 0 0 6 0"/><path d="M6 15c3 1 5 3 5 7M42 15c-3 1-5 3-5 7"/>',
  cat: '<path d="M12 19l2-10 7 6c2-1 4-1 6 0l7-6 2 10c3 6 1 13-5 16-5 3-11 3-16 0-5-3-6-10-3-16z"/><path d="M19 25v2M29 25v2M22 31l2 2 2-2M7 29h9M32 29h9M9 35l7-2M39 35l-7-2"/>',
};
const ENV_ROT = [-3.2, 2.1, -1.4, 2.8, -2.2];

/* ------------------------------------------------------------------ dom */

const els = {
  stage: $('#stage'),
  wood: $('#wood'),
  prints: $('#prints'),
  light: $('#light'),
  sticky: $('#sticky'),
  ring: $('#ring'),
  emptyNote: $('#emptyNote'),
  top: $('#top'),
  brand: $('#brand'),
  controls: $('#controls'),
  tools: $('#tools'),
  tray: $('#tray'),
  corner: $('#corner'),
  toast: $('#toast'),
  live: $('#live'),
  loader: $('#loader'),
  lightbox: $('#lightbox'),
  lbStage: $('#lbStage'),
  lbSlip: $('#lbSlip'),
  sheets: $('#sheets'),
  sheetScroll: $('#sheetScroll'),
  sheetDim: $('#sheetDim'),
};

// Remember how the visitor is driving the page, so focus moves into dialogs
// visibly for keyboard users and quietly for touch and mouse.
let keyboardUser = false;
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') keyboardUser = true;
}, true);
window.addEventListener('pointerdown', () => (keyboardUser = false), true);

const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reduceMQ.matches;
root.classList.toggle('rm', reduced);
reduceMQ.addEventListener('change', (e) => {
  reduced = e.matches;
  root.classList.toggle('rm', reduced);
});

/* ------------------------------------------------------------------ state */

const S = {
  W: 0,
  H: 0,
  play: { x: 0, y: 0, w: 1, h: 1 },
  L: 200,
  prints: [],
  zTop: 10,
  lamp: { x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0, swing: false },
  active: null,
  layout: 'scatter',
  tidyCount: 0,
  rebel: null,
  slammed: false,
  sel: null,
  wood: { w: 0, h: 0 },
  ready: false,
  hintShown: false,
};

const PH = {
  K: 1150, // grab spring (per unit mass)
  C: 30, // damping at the grab point
  DAIR: 14, // drag on the centre while held: makes off-centre grabs swing round
  DANG: 2.2,
  MU: 2200, // sliding friction on the table (px/s²)
  VISC: 1.7,
  MUA: 8.5,
  VISCA: 1.9,
  AIR: 0.45,
  AIRA: 0.35,
  REST: 0.36,
  VMAX: 5200,
};

const albumOf = (ph) => B.albums.find((a) => a.slug === ph.album);
const albumIndex = (slug) => B.albums.findIndex((a) => a.slug === slug);
const photoOrder = (a, b) => albumIndex(a.album) - albumIndex(b.album) || a.index - b.index;
const live = () => S.prints.filter((p) => !p.leaving);
const printFor = (file) => S.prints.find((p) => !p.leaving && p.photo.file === file);

/* ------------------------------------------------------------------ images */

// A small queue with retries: keeps concurrent requests low and survives a
// flaky dev server. Resolves with the URL that loaded, or null.
const imgQueue = [];
const imgCache = new Map();
let imgActive = 0;

function loadUrl(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const promise = new Promise((resolve) => {
    imgQueue.push({ url, tries: 0, resolve });
    pumpImages();
  });
  imgCache.set(url, promise);
  return promise;
}

function pumpImages() {
  while (imgActive < 4 && imgQueue.length) {
    const job = imgQueue.shift();
    imgActive++;
    const src = job.tries ? `${job.url}?retry=${job.tries}` : job.url;
    const probe = new Image();
    probe.decoding = 'async';
    probe.onload = () => {
      const finish = () => {
        imgActive--;
        job.resolve(src);
        pumpImages();
      };
      probe.decode ? probe.decode().then(finish, finish) : finish();
    };
    probe.onerror = () => {
      imgActive--;
      if (job.tries < 4) {
        job.tries++;
        setTimeout(() => {
          imgQueue.unshift(job);
          pumpImages();
        }, 350 * job.tries);
      } else job.resolve(null);
      pumpImages();
    };
    probe.src = src;
  }
}

function setImg(img, url) {
  img.classList.remove('ready');
  img.dataset.want = url;
  loadUrl(url).then((src) => {
    if (!src || img.dataset.want !== url) return;
    img.src = src;
    img.classList.add('ready');
  });
}

/* ------------------------------------------------------------------ textures */

function applyTextures() {
  root.style.setProperty('--tex-grain', `url(${grainTile(140, 30)})`);
  root.style.setProperty('--tex-grain-soft', `url(${grainTile(180, 16)})`);
  root.style.setProperty('--tex-kraft', `url(${kraftTile(220)})`);
  root.style.setProperty('--tex-ink', `url(${inkMask(160)})`);
  backPattern();
}

function backPattern() {
  const word = `${B.text(B.site.name).toUpperCase()} · ${u('paperBack')} · `;
  const t = esc(word + word);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="44"><g fill="rgba(96,80,62,0.12)" font-family="Arial, Helvetica, sans-serif" font-size="8.5" letter-spacing="2.2"><text x="0" y="14">${t}</text><text x="-120" y="36">${t}</text></g></svg>`;
  root.style.setProperty('--tex-back', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
}

/* ------------------------------------------------------------------ layout */

function gridFits(L, n) {
  const g = L * (S.W < 600 ? 0.1 : 0.14);
  const cell = L + g;
  for (let c = 1; c <= n; c++) {
    const r = Math.ceil(n / c);
    if (c * cell - g <= S.play.w && r * cell - g <= S.play.h) return true;
  }
  return false;
}

function measure() {
  S.W = els.stage.clientWidth;
  S.H = els.stage.clientHeight;
  const vis = (r) => r.width > 0 && r.height > 0;
  const topEdges = [els.brand.getBoundingClientRect().bottom, els.controls.getBoundingClientRect().bottom];
  const bottomEdges = [els.tray.getBoundingClientRect().top + 6];
  const tr = els.tools.getBoundingClientRect();
  if (vis(tr)) {
    if (tr.top > S.H / 2) bottomEdges.push(tr.top);
    else topEdges.push(tr.bottom);
  }
  const side = S.W < 600 ? 10 : 22;
  const y0 = Math.max(...topEdges) + (S.W < 600 ? 6 : 12);
  const y1 = Math.min(...bottomEdges) - 6;
  S.play = { x: side, y: y0, w: S.W - side * 2, h: Math.max(120, y1 - y0) };

  let L = clamp(Math.sqrt(S.play.w * S.play.h) * 0.25, 96, 280);
  while (L > 80 && !gridFits(L, 10)) L -= 2;
  S.L = Math.round(L);

  S.lamp.x = S.play.x + S.play.w / 2;
  S.lamp.y = S.play.y + S.play.h * 0.42;
  els.light.style.setProperty('--lr', `${Math.round(Math.hypot(S.W, S.H) * 0.58)}px`);
  renderLight();
  placeProps();
}

function placeProps() {
  const P = S.play;
  const sw = Math.round(S.L * 0.8);
  Object.assign(els.sticky.style, {
    width: `${sw}px`,
    height: `${sw}px`,
    left: `${P.x + P.w * 0.47 - sw / 2}px`,
    top: `${P.y + P.h * 0.5 - sw / 2}px`,
  });
  els.sticky.style.setProperty('--fs', `${Math.max(12, sw * 0.1)}px`);
  els.sticky.style.setProperty('--sw', `${sw}px`);
  els.emptyNote.style.left = `${P.x + P.w / 2}px`;
  els.emptyNote.style.top = `${P.y + P.h - Math.min(110, P.h * 0.16)}px`;
  const rs = Math.round(S.L * 0.95);
  Object.assign(els.ring.style, {
    width: `${rs}px`,
    height: `${rs}px`,
    left: `${P.x + P.w * 0.8 - rs / 2}px`,
    top: `${P.y + P.h * 0.2 - rs / 2}px`,
  });
}

function maybeRepaintWood(force = false) {
  const grow = S.W > S.wood.w * 1.04 || S.H > S.wood.h * 1.04;
  const shrink = S.W < S.wood.w * 0.7 || S.H < S.wood.h * 0.7;
  if (force || grow || shrink) {
    paintWood(els.wood, S.W, S.H);
    S.wood = { w: S.W, h: S.H };
  }
}

/* ------------------------------------------------------------------ prints */

let uid = 0;

function stampSVG(id) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="sp${id}" d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0"/></defs><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="3.4"/><circle cx="50" cy="50" r="25.5" fill="none" stroke="currentColor" stroke-width="1.8"/><text font-size="10.4" fill="currentColor"><textPath class="st-ring" href="#sp${id}" textLength="214" lengthAdjust="spacingAndGlyphs"></textPath></text><text class="st-num" x="50" y="57.5" text-anchor="middle" font-size="18" fill="currentColor"></text></svg>`;
}

function doodleFor(ph) {
  const d = /cat/.test(ph.file) ? DOODLES.cat : DOODLES[ph.album] || DOODLES.sofia;
  return `<svg class="doodle" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}

function makePrint(photo) {
  const id = ++uid;
  const el = document.createElement('div');
  el.className = 'print';
  el.innerHTML = `
    <div class="p-sh p-sh-rest"></div>
    <div class="p-sh p-sh-lift"></div>
    <div class="p-card" role="button" tabindex="0" aria-pressed="false">
      <div class="face front"><img alt="" draggable="false" decoding="async"><i class="sheen"></i></div>
      <div class="face back" aria-hidden="true">
        <div class="wm"></div>
        <p class="b-lab"></p>
        <p class="b-cap hand"></p>
        <p class="b-album hand"></p>
        ${doodleFor(photo)}
        <div class="stamp">${stampSVG(id)}</div>
      </div>
    </div>
    <button class="loupe" type="button">${ICON.loupe}</button>`;
  const p = {
    id,
    photo,
    el,
    card: el.querySelector('.p-card'),
    img: el.querySelector('img'),
    shR: el.querySelector('.p-sh-rest'),
    shL: el.querySelector('.p-sh-lift'),
    sheen: el.querySelector('.sheen'),
    back: el.querySelector('.back'),
    loupe: el.querySelector('.loupe'),
    ar: clamp(photo.w / photo.h, 2 / 3, 3 / 2),
    x: 0,
    y: 0,
    a: 0,
    vx: 0,
    vy: 0,
    va: 0,
    s: 1,
    op: 1,
    lift: 0,
    pulse: 0,
    hover: false,
    mode: 'free',
    held: null,
    sp: null,
    tw: null,
    airT: 0,
    entering: false,
    enterT: 0,
    flipped: false,
    flipDeg: 0,
    sleeping: false,
    leaving: false,
  };
  el._p = p;
  setImg(p.img, B.thumbUrl(photo.file));
  el.style.setProperty('--curl', `${Math.round(rand(0, 360))}deg`);
  el.style.setProperty('--sr', `${Math.round(rand(-24, 8))}deg`);
  sizePrint(p);
  setPrintText(p, false);
  return p;
}

function sizePrint(p) {
  const L = S.L;
  if (p.ar >= 1) {
    p.w = L;
    p.h = L / p.ar;
  } else {
    p.h = L;
    p.w = L * p.ar;
  }
  p.I = (p.w * p.w + p.h * p.h) / 12;
  const short = Math.min(p.w, p.h);
  p.el.style.width = `${p.w}px`;
  p.el.style.height = `${p.h}px`;
  p.el.style.setProperty('--u', `${(short / 100).toFixed(3)}px`);
  p.el.style.setProperty('--b', `${Math.max(4, Math.round(short * 0.055))}px`);
  p.el.style.setProperty('--L', `${L}px`);
}

function setPrintText(p, animate) {
  const ph = p.photo;
  const album = albumOf(ph);
  const cap = B.text(ph.caption);
  const title = B.text(album.title);
  p.img.alt = cap;
  p.card.setAttribute('aria-label', `${cap} — ${u('flip')}`);
  p.loupe.setAttribute('aria-label', `${u('magnify')}: ${cap}`);
  p.el.querySelector('.b-cap').textContent = cap;
  p.el.querySelector('.b-album').textContent = `— ${title}`;
  p.el.querySelector('.b-lab').textContent = `№ ${pad2(ph.index + 1)}/${pad2(album.photos.length)} · ${title.toUpperCase()}`;
  p.el.querySelector('.st-ring').textContent = u('stampRing');
  p.el.querySelector('.st-num').textContent = `№${ph.index + 1}`;
  if (animate && p.flipped) rewrite(p.el.querySelector('.b-cap'), p.el.querySelector('.b-album'));
}

function rewrite(...nodes) {
  if (reduced) return;
  for (const n of nodes) {
    if (!n) continue;
    n.classList.remove('rewrite');
    void n.offsetWidth;
    n.classList.add('rewrite');
    n.addEventListener('animationend', () => n.classList.remove('rewrite'), { once: true });
  }
}

function render(p) {
  const sc = p.s * (1 + 0.055 * p.lift);
  p.el.style.transform = `translate3d(${(p.x - p.w / 2).toFixed(2)}px,${(p.y - p.h / 2).toFixed(2)}px,0) rotate(${p.a.toFixed(4)}rad) scale(${sc.toFixed(4)})`;
  const lx = S.lamp.x + S.lamp.ox;
  const ly = S.lamp.y + S.lamp.oy;
  const dx = p.x - lx;
  const dy = p.y - ly;
  const ca = Math.cos(p.a);
  const sa = Math.sin(p.a);
  const kR = 0.0055;
  const kL = kR + 0.05 * p.lift;
  const rx = dx * kR;
  const ry = dy * kR + 1.2;
  const qx = dx * kL;
  const qy = dy * kL + 18 * p.lift + 1;
  p.shR.style.transform = `translate(${(rx * ca + ry * sa).toFixed(2)}px,${(-rx * sa + ry * ca).toFixed(2)}px)`;
  p.shL.style.transform = `translate(${(qx * ca + qy * sa).toFixed(2)}px,${(-qx * sa + qy * ca).toFixed(2)}px) scale(${(1 + 0.05 * p.lift).toFixed(3)})`;
  const lo = p.lift.toFixed(3);
  if (lo !== p._lo) {
    p._lo = lo;
    p.shL.style.opacity = lo;
    p.shR.style.opacity = (1 - 0.8 * p.lift).toFixed(3);
  }
  if (!p.flipped) {
    const hx = -dx * ca - dy * sa + p.w / 2;
    const hy = dx * sa - dy * ca + p.h / 2;
    p.sheen.style.setProperty('--hx', `${hx.toFixed(1)}px`);
    p.sheen.style.setProperty('--hy', `${hy.toFixed(1)}px`);
  }
  if (p.op !== p._op) {
    p._op = p.op;
    p.el.style.opacity = p.op >= 0.999 ? '' : p.op.toFixed(3);
  }
}

function renderLight() {
  els.light.style.setProperty('--lx', `${(S.lamp.x + S.lamp.ox).toFixed(1)}px`);
  els.light.style.setProperty('--ly', `${(S.lamp.y + S.lamp.oy).toFixed(1)}px`);
}

function toTop(p) {
  p.el.style.zIndex = ++S.zTop;
}

function select(p) {
  if (S.sel && S.sel !== p) S.sel.el.classList.remove('is-sel');
  S.sel = p;
  if (p) p.el.classList.add('is-sel');
}

function removePrint(p) {
  p.el.remove();
  p.gone = true;
  S.prints = S.prints.filter((q) => q !== p);
  if (S.sel === p) S.sel = null;
}

/* ------------------------------------------------------------------ physics */

function slideDist(v, mu, visc) {
  return v / visc - (mu / (visc * visc)) * Math.log(1 + (visc * v) / mu);
}
function travel(v, air, mu, visc, drag) {
  const e = Math.exp(-drag * air);
  return (v * (1 - e)) / drag + slideDist(v * e, mu, visc);
}
function launchSpeed(d, air, mu, visc, drag) {
  let lo = 0;
  let hi = 9000;
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    if (travel(mid, air, mu, visc, drag) < d) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Throw p so that friction brings it to rest at target t = {x, y, a}. */
function throwTo(p, t, air = 0.2, flair = 0.3) {
  p.mode = 'free';
  p.sp = null;
  p.tw = null;
  const dx = t.x - p.x;
  const dy = t.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  p.airT = air;
  const v = launchSpeed(d, air, PH.MU, PH.VISC, PH.AIR);
  p.vx = (dx / d) * v;
  p.vy = (dy / d) * v;
  let delta = wrapPi(t.a - p.a);
  if (Math.random() < flair) delta += (Math.sign(delta) || 1) * TAU;
  p.va = (Math.sign(delta) || 1) * launchSpeed(Math.abs(delta), air, PH.MUA, PH.VISCA, PH.AIRA);
  wake(p);
}

function springTo(p, x, y, a, delay = 0, w = 12, z = 0.74) {
  p.mode = 'spring';
  p.tw = null;
  p.airT = 0;
  p.sp = { x, y, a, delay, w, z };
  wake(p);
}

function tweenTo(p, to, opts) {
  p.mode = 'tween';
  p.sp = null;
  p.airT = 0;
  p.tw = {
    t: -(opts.delay || 0),
    dur: opts.dur,
    from: { x: p.x, y: p.y, a: p.a, s: p.s, op: p.op },
    to: { x: p.x, y: p.y, a: p.a, s: p.s, op: p.op, ...to },
    ease: opts.ease || easeInOut,
    opCurve: opts.opCurve || ((k) => k),
    arc: opts.arc || 0,
    done: opts.done,
  };
  wake(p);
}

function bounds(p, h) {
  const m = Math.min(p.w, p.h) * 0.4;
  const P = S.play;
  const x0 = P.x + m;
  const x1 = P.x + P.w - m;
  const y0 = P.y + m * 0.8;
  const y1 = P.y + P.h - m * 0.8;
  if (p.entering) {
    p.enterT -= h;
    if ((p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1) || p.enterT <= 0) p.entering = false;
    else return;
  }
  let hit = 0;
  let nx = 0;
  let ny = 0;
  const pull = Math.min(1, h * 7);
  if (p.x < x0) {
    if (p.vx < 0) {
      hit = -p.vx;
      nx = -1;
      p.va += p.vy * 0.0028;
      p.vx = -p.vx * PH.REST;
    }
    p.x += (x0 - p.x) * pull;
  } else if (p.x > x1) {
    if (p.vx > 0) {
      hit = p.vx;
      nx = 1;
      p.va -= p.vy * 0.0028;
      p.vx = -p.vx * PH.REST;
    }
    p.x += (x1 - p.x) * pull;
  }
  if (p.y < y0) {
    if (p.vy < 0) {
      hit = Math.max(hit, -p.vy);
      ny = -1;
      p.va -= p.vx * 0.0028;
      p.vy = -p.vy * PH.REST;
    }
    p.y += (y0 - p.y) * pull;
  } else if (p.y > y1) {
    if (p.vy > 0) {
      hit = Math.max(hit, p.vy);
      ny = 1;
      p.va += p.vx * 0.0028;
      p.vy = -p.vy * PH.REST;
    }
    p.y += (y1 - p.y) * pull;
  }
  if (hit > 0) onBump(hit, nx, ny);
}

function onBump(hit, nx, ny) {
  if (hit > 1250) {
    kickLamp(nx, ny, hit);
    sound.tap(1);
    if (!S.slammed) {
      S.slammed = true;
      toast(u('slam'));
    }
  } else if (hit > 260) sound.tap(hit / 1500);
}

function step(p, h) {
  let want = 0;
  if (p.held) want = 1;
  else if (p.airT > 0) want = 0.9;
  if (p.hover) want = Math.max(want, 0.14);
  if (p.pulse > 0) {
    want = Math.max(want, 0.75);
    p.pulse -= h;
  }
  if (p.mode === 'spring' && p.sp && p.sp.delay <= 0 && Math.hypot(p.sp.x - p.x, p.sp.y - p.y) > 26) want = Math.max(want, 0.32);
  p.want = want;
  p.lift += (want - p.lift) * Math.min(1, h * (want > p.lift ? 24 : 12));
  if (Math.abs(want - p.lift) < 0.003) p.lift = want;
  if (p.s !== 1) {
    p.s += (1 - p.s) * Math.min(1, h * 6.5);
    if (Math.abs(1 - p.s) < 0.002) p.s = 1;
  }

  if (p.held) {
    const H = p.held;
    const c = Math.cos(p.a);
    const s = Math.sin(p.a);
    const rwx = c * H.rx - s * H.ry;
    const rwy = s * H.rx + c * H.ry;
    if (reduced) {
      p.x = H.tx - rwx;
      p.y = H.ty - rwy;
      p.vx = p.vy = p.va = 0;
      return;
    }
    const gx = p.x + rwx;
    const gy = p.y + rwy;
    const vgx = p.vx - p.va * rwy;
    const vgy = p.vy + p.va * rwx;
    const fx = PH.K * (H.tx - gx) - PH.C * vgx;
    const fy = PH.K * (H.ty - gy) - PH.C * vgy;
    const tq = rwx * fy - rwy * fx;
    p.vx += (fx - PH.DAIR * p.vx) * h;
    p.vy += (fy - PH.DAIR * p.vy) * h;
    p.va += (tq / p.I - PH.DANG * p.va) * h;
    p.x += p.vx * h;
    p.y += p.vy * h;
    p.a += p.va * h;
    return;
  }

  if (p.mode === 'spring') {
    const sp = p.sp;
    if (sp.delay > 0) {
      sp.delay -= h;
      friction(p, h);
    } else {
      const w2 = sp.w * sp.w;
      const zw = 2 * sp.z * sp.w;
      p.vx += (w2 * (sp.x - p.x) - zw * p.vx) * h;
      p.vy += (w2 * (sp.y - p.y) - zw * p.vy) * h;
      p.va += (w2 * (sp.a - p.a) - zw * p.va) * h;
    }
    p.x += p.vx * h;
    p.y += p.vy * h;
    p.a += p.va * h;
    return;
  }

  friction(p, h);
  p.x += p.vx * h;
  p.y += p.vy * h;
  p.a += p.va * h;
  bounds(p, h);
}

function friction(p, h) {
  if (p.airT > 0) {
    const k = Math.exp(-PH.AIR * h);
    p.vx *= k;
    p.vy *= k;
    p.va *= Math.exp(-PH.AIRA * h);
    p.airT -= h;
    return;
  }
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > 0) {
    const ns = Math.max(0, sp - (PH.MU + PH.VISC * sp) * h);
    p.vx *= ns / sp;
    p.vy *= ns / sp;
  }
  const wa = Math.abs(p.va);
  if (wa > 0) {
    const nw = Math.max(0, wa - (PH.MUA + PH.VISCA * wa) * h);
    p.va *= nw / wa;
  }
}

function tweenStep(p, dt) {
  const T = p.tw;
  T.t += dt;
  if (T.t < 0) return;
  const k = Math.min(1, T.t / T.dur);
  const e = T.ease(k);
  const F = T.from;
  const G = T.to;
  p.x = F.x + (G.x - F.x) * e;
  p.y = F.y + (G.y - F.y) * e;
  p.a = F.a + (G.a - F.a) * e;
  p.s = F.s + (G.s - F.s) * e;
  p.op = F.op + (G.op - F.op) * T.opCurve(k);
  if (T.arc) p.lift = Math.sin(k * Math.PI) * T.arc;
  if (k >= 1) {
    p.mode = 'free';
    p.tw = null;
    p.vx = p.vy = p.va = 0;
    if (T.arc) p.lift = 0;
    T.done?.(p);
  }
}

function settle(p) {
  if (p.held || p.mode === 'tween' || p.airT > 0 || p.pulse > 0) return false;
  if (p.mode === 'spring') {
    const sp = p.sp;
    if (sp.delay > 0) return false;
    const close =
      Math.abs(p.x - sp.x) < 0.25 &&
      Math.abs(p.y - sp.y) < 0.25 &&
      Math.abs(p.a - sp.a) < 0.0015 &&
      Math.hypot(p.vx, p.vy) < 3 &&
      Math.abs(p.va) < 0.02;
    if (!close) return false;
    p.x = sp.x;
    p.y = sp.y;
    p.a = sp.a;
    p.vx = p.vy = p.va = 0;
    p.mode = 'free';
    p.sp = null;
  }
  if (Math.abs(p.lift - (p.want || 0)) > 0.004 || Math.abs(p.s - 1) > 0.002) return false;
  if (p.vx === 0 && p.vy === 0 && p.va === 0) {
    p.s = 1;
    p.sleeping = true;
    return true;
  }
  return false;
}

function kickLamp(nx, ny, hit) {
  const L = S.lamp;
  const power = Math.min(hit, 4200) * 0.055;
  L.vx += nx * power + rand(-20, 20);
  L.vy += ny * power + rand(-20, 20);
  L.swing = true;
  startLoop();
}

function lampStep(dt) {
  const L = S.lamp;
  if (!L.swing) return false;
  const w = 2.7;
  const z = 0.075;
  const n = 4;
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    L.vx += (-w * w * L.ox - 2 * z * w * L.vx) * h;
    L.vy += (-w * w * L.oy - 2 * z * w * L.vy) * h;
    L.ox += L.vx * h;
    L.oy += L.vy * h;
  }
  if (Math.hypot(L.ox, L.oy) < 0.25 && Math.hypot(L.vx, L.vy) < 0.6) {
    L.ox = L.oy = L.vx = L.vy = 0;
    L.swing = false;
  }
  renderLight();
  return true;
}

let raf = 0;
let last = 0;

function wake(p) {
  p.sleeping = false;
  startLoop();
}

function startLoop() {
  if (raf || document.hidden) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
  root.dataset.moving = '1';
}

function frame(now) {
  raf = 0;
  const dt = clamp((now - last) / 1000, 0.001, 0.034);
  last = now;
  const n = Math.ceil(dt * 240);
  const h = dt / n;
  let busy = false;
  const swinging = lampStep(dt);
  for (const p of S.prints) {
    if (p.gone || p.launching) continue;
    if (!p.sleeping) {
      if (p.mode === 'tween') tweenStep(p, dt);
      else for (let i = 0; i < n; i++) step(p, h);
      if (p.gone) continue;
      if (!settle(p)) busy = true;
      render(p);
    } else if (swinging) render(p);
  }
  if (busy || swinging) raf = requestAnimationFrame(frame);
  else delete root.dataset.moving;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    raf = 0;
  } else startLoop();
});

/* ------------------------------------------------------------------ placement */

function scatterTargets(n, avoid = [], first = null) {
  const P = S.play;
  const m = S.L * 0.44;
  const x0 = P.x + m;
  const x1 = P.x + P.w - m;
  const y0 = P.y + m * 0.85;
  const y1 = P.y + P.h - m * 0.85;
  const pts = avoid.map((q) => ({ x: q.x, y: q.y }));
  const out = [];
  for (let i = 0; i < n; i++) {
    let best = null;
    if (i === 0 && first) best = { x: first.x, y: first.y };
    else {
      let bestD = -1;
      for (let k = 0; k < 3; k++) {
        const c = { x: rand(x0, x1), y: rand(y0, y1) };
        let d = Infinity;
        for (const q of pts) d = Math.min(d, Math.hypot(q.x - c.x, (q.y - c.y) * 1.2));
        if (d > bestD) {
          bestD = d;
          best = c;
        }
      }
    }
    best.a = clamp(gauss() * 0.3, -0.55, 0.55);
    pts.push(best);
    out.push(best);
  }
  return out;
}

function gridLayout(list) {
  const P = S.play;
  const L = S.L;
  const g = L * (S.W < 600 ? 0.1 : 0.14);
  const n = list.length;
  let best = null;
  for (let c = 1; c <= n; c++) {
    const rows = [];
    for (let i = 0; i < n; i += c) rows.push(list.slice(i, i + c));
    const h = rows.reduce((s, r) => s + Math.max(...r.map((p) => p.h)), 0) + g * (rows.length - 1);
    const w = Math.min(c, n) * (L + g) - g;
    const over = Math.max(0, w - P.w) + Math.max(0, h - P.h);
    const score = over * 1000 + Math.abs(Math.log(w / h / (P.w / P.h)));
    if (!best || score < best.score) best = { rows, h, score };
  }
  const out = new Map();
  let y = P.y + (P.h - best.h) / 2;
  for (const row of best.rows) {
    const rh = Math.max(...row.map((p) => p.h));
    const rw = row.length * (L + g) - g;
    let x = P.x + (P.w - rw) / 2 + L / 2;
    for (const p of row) {
      out.set(p, { x, y: y + rh / 2 });
      x += L + g;
    }
    y += rh + g;
  }
  return out;
}

const sortPrints = (list) => list.slice().sort((a, b) => photoOrder(a.photo, b.photo));

function mouthOf(slug) {
  const env = envEls[slug];
  const r = env.querySelector('.env-front').getBoundingClientRect();
  const deg = ENV_ROT[albumIndex(slug) % ENV_ROT.length];
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.3, a: (deg * Math.PI) / 180 };
}

/* ------------------------------------------------------------------ actions */

function fadeIn(p, delay = 0) {
  p.op = 0;
  tweenTo(p, { op: 1 }, { dur: 0.45, delay, ease: easeOut });
}

function calmArrange(list, delay = 0) {
  const pos = gridLayout(sortPrints(list));
  S.layout = 'grid';
  pickRebel(list);
  sortPrints(list).forEach((p, i) => {
    const c = pos.get(p);
    const a = p.photo.file === S.rebel && S.tidyCount < 3 ? 0.07 : 0;
    const moved = Math.hypot(c.x - p.x, c.y - p.y) > 1 || Math.abs(a - p.a) > 0.001;
    if (p.op < 0.01 || p.mode === 'tween') {
      p.x = c.x;
      p.y = c.y;
      p.a = a;
      if (p.op < 0.01) fadeIn(p, delay + i * 0.04);
      else if (p.tw) {
        Object.assign(p.tw.from, { x: c.x, y: c.y, a });
        Object.assign(p.tw.to, { x: c.x, y: c.y, a });
      }
      render(p);
    } else if (moved) {
      tweenTo(p, { op: 0 }, {
        dur: 0.2,
        delay: delay + i * 0.03,
        done: () => {
          p.x = c.x;
          p.y = c.y;
          p.a = a;
          render(p);
          tweenTo(p, { op: 1 }, { dur: 0.35, ease: easeOut });
        },
      });
    }
  });
}

function pickRebel(list) {
  if (!S.rebel || !list.some((p) => p.photo.file === S.rebel)) {
    S.rebel = list[Math.floor(Math.random() * list.length)]?.photo.file || null;
  }
}

function tidy() {
  const list = live();
  if (!list.length) {
    toast(u('tidyEmpty'));
    return;
  }
  const again = S.layout === 'grid';
  S.tidyCount = again ? S.tidyCount + 1 : 1;
  if (!again) S.rebel = null;
  pickRebel(list);
  if (reduced) {
    calmArrange(list);
  } else {
    const pos = gridLayout(sortPrints(list));
    sortPrints(list).forEach((p, i) => {
      const c = pos.get(p);
      let a = Math.round(p.a / TAU) * TAU;
      if (p.photo.file === S.rebel && S.tidyCount < 3) a += 0.07;
      springTo(p, c.x, c.y, a, again ? 0 : i * 0.035);
    });
    if (again && S.tidyCount === 2) {
      const r = printFor(S.rebel);
      if (r) {
        r.va += 9;
        r.pulse = 0.25;
      }
    }
    sound.rustle();
  }
  S.layout = 'grid';
  if (S.tidyCount === 2) toast(u('rebel1'));
  if (S.tidyCount === 3) toast(u('rebel2'));
}

function mess() {
  const list = live();
  if (!list.length) {
    tossMix();
    return;
  }
  S.layout = 'scatter';
  S.tidyCount = 0;
  const targets = scatterTargets(list.length);
  const shuffled = list.slice().sort(() => Math.random() - 0.5);
  if (reduced) {
    shuffled.forEach((p, i) => {
      const t = targets[i];
      tweenTo(p, { op: 0 }, {
        dur: 0.2,
        delay: i * 0.03,
        done: () => {
          p.x = t.x;
          p.y = t.y;
          p.a = t.a;
          render(p);
          tweenTo(p, { op: 1 }, { dur: 0.35, ease: easeOut });
        },
      });
    });
    return;
  }
  shuffled.forEach((p, i) => {
    setTimeout(() => {
      if (p.leaving || p.held) return;
      toTop(p);
      throwTo(p, targets[i], rand(0.1, 0.2), 0.35);
    }, i * 30);
  });
  sound.rustle();
}

function sweepHome(p, i) {
  p.leaving = true;
  if (p.held) {
    pointers.delete(p.held.id);
    p.held = null;
  }
  p.hover = false;
  if (p.launching) {
    // Never left the envelope: just keep it there.
    removePrint(p);
    updateEnvelopes();
    checkEmpty();
    return;
  }
  const m = mouthOf(p.photo.album);
  const done = () => {
    removePrint(p);
    gulp(p.photo.album);
    updateEnvelopes();
    checkEmpty();
  };
  if (reduced) {
    tweenTo(p, { op: 0 }, { dur: 0.3, delay: i * 0.02, done });
    return;
  }
  tweenTo(
    p,
    { x: m.x + rand(-6, 6), y: m.y + S.L * 0.12, a: p.a + wrapPi(m.a - p.a) + rand(-0.08, 0.08), s: 0.5, op: 0 },
    { dur: 0.6, delay: i * 0.04, ease: easeInOut, arc: 0.6, opCurve: (k) => (k < 0.78 ? 0 : (k - 0.78) / 0.22), done }
  );
}

function tossOut(slug, photos, targets, delay = 0) {
  const m = mouthOf(slug);
  photos.forEach((ph, i) => {
    const p = makePrint(ph);
    const t = targets[i];
    if (reduced) {
      p.x = t.x;
      p.y = t.y;
      p.a = t.a;
      p.op = 0;
      els.prints.append(p.el);
      S.prints.push(p);
      toTop(p);
      render(p);
      fadeIn(p, delay + i * 0.05);
      return;
    }
    p.x = m.x + rand(-8, 8);
    p.y = m.y + S.L * 0.08;
    p.a = m.a + rand(-0.15, 0.15);
    p.s = 0.7;
    p.entering = true;
    p.enterT = 1.8;
    p.launching = true;
    S.prints.push(p);
    setTimeout(() => {
      p.launching = false;
      if (p.leaving) return;
      els.prints.append(p.el);
      toTop(p);
      render(p);
      throwTo(p, t, rand(0.24, 0.36), 0.3);
      if (i === 0) spit(slug);
      sound.slide(0.55);
    }, (delay + i * 0.085) * 1000);
  });
}

function pickMix() {
  return B.albums.map((a) => {
    const rest = a.photos.slice(1);
    return [a.photos[0], rest[Math.floor(Math.random() * rest.length)]];
  });
}

function tossMix(groups = pickMix()) {
  hideEmpty();
  const all = groups.flat();
  const P = S.play;
  const stickyAt = { x: P.x + P.w * 0.47, y: P.y + P.h * 0.5 };
  S.active = 'mix';
  S.tidyCount = 0;
  if (reduced) {
    S.layout = 'grid';
    S.rebel = null;
    const ghosts = all.map((ph) => {
      const p = makePrint(ph);
      p.op = 0;
      return p;
    });
    ghosts.forEach((p) => {
      els.prints.append(p.el);
      S.prints.push(p);
      toTop(p);
    });
    calmArrange(ghosts, 0.1);
    updateEnvelopes();
    return;
  }
  S.layout = 'scatter';
  const targets = scatterTargets(all.length, [], stickyAt).sort((a, b) => a.x - b.x);
  // Each envelope gets the targets nearest its own position, left to right.
  groups.forEach((photos, gi) => {
    tossOut(B.albums[gi].slug, photos, targets.slice(gi * 2, gi * 2 + photos.length), gi * 0.11);
  });
  sound.rustle();
  setTimeout(updateEnvelopes, 60);
}

function openAlbum(slug) {
  const album = B.albums.find((a) => a.slug === slug);
  if (!album) return;
  const list = live();
  const mine = list.filter((p) => p.photo.album === slug);
  const others = list.filter((p) => p.photo.album !== slug);
  hideEmpty();

  if (S.active === slug && !others.length && mine.length) {
    // Same envelope again: put the prints back.
    mine.forEach((p, i) => sweepHome(p, i));
    S.active = null;
    updateEnvelopes();
    return;
  }

  others.forEach((p, i) => sweepHome(p, i));
  S.active = slug;
  S.tidyCount = 0;
  const missing = album.photos.filter((ph) => !mine.some((p) => p.photo.file === ph.file));

  if (reduced) {
    const ghosts = missing.map((ph) => {
      const p = makePrint(ph);
      p.op = 0;
      els.prints.append(p.el);
      S.prints.push(p);
      toTop(p);
      render(p);
      return p;
    });
    setTimeout(() => calmArrange([...mine, ...ghosts]), others.length ? 320 : 0);
    updateEnvelopes();
    return;
  }

  S.layout = 'scatter';
  const targets = scatterTargets(missing.length, mine);
  tossOut(slug, missing, targets, others.length ? 0.3 : 0);
  sound.rustle();
  setTimeout(updateEnvelopes, 60);
}

function checkEmpty() {
  if (!live().length) showEmpty();
}
function showEmpty() {
  if (live().length) return;
  els.emptyNote.classList.add('show');
  els.live.textContent = u('empty');
}
function hideEmpty() {
  els.emptyNote.classList.remove('show');
}

function checkAllBacks() {
  const list = live();
  const all = list.length >= 3 && list.every((p) => p.flipped);
  if (all && !S.allBacks) toast(u('allBacks'));
  S.allBacks = all;
}

/* ------------------------------------------------------------------ flip */

function flip(p) {
  if (p.leaving) return;
  p.flipped = !p.flipped;
  p.card.classList.toggle('is-flipped', p.flipped);
  p.card.setAttribute('aria-pressed', String(p.flipped));
  const from = p.flipDeg;
  const to = from + 180;
  p.flipDeg = to;
  sound.flip();
  checkAllBacks();
  if (reduced) return;
  const tilt = p.flipped ? 1 : -1;
  p.card.animate(
    [
      { transform: `rotateY(${from}deg)` },
      { transform: `rotateY(${from + 90}deg) rotateX(${tilt * 6}deg) translateZ(${S.L * 0.16}px)`, offset: 0.5 },
      { transform: `rotateY(${to}deg)` },
    ],
    { duration: 640, easing: 'cubic-bezier(.45,.05,.25,1)' }
  );
  p.card.style.transform = `rotateY(${to}deg)`;
  p.shR.animate([{ scale: '1 1' }, { scale: '0.08 1', offset: 0.5 }, { scale: '1 1' }], {
    duration: 640,
    easing: 'cubic-bezier(.45,.05,.25,1)',
  });
  p.pulse = 0.36;
  wake(p);
}

/* ------------------------------------------------------------------ pointers */

const pointers = new Map();
let tapTimer = null;
let tapPrint = null;
let tapAt = 0;

els.prints.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.p-card');
  if (!card || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const p = card.parentElement._p;
  if (!p || p.leaving || p.mode === 'tween' || p.held) return;
  e.preventDefault();
  try {
    card.setPointerCapture(e.pointerId);
  } catch {
    /* pointer already gone */
  }
  const c = Math.cos(p.a);
  const s = Math.sin(p.a);
  const wx = e.clientX - p.x;
  const wy = e.clientY - p.y;
  const k = 1 / (p.s * (1 + 0.055 * p.lift));
  p.held = {
    id: e.pointerId,
    rx: (wx * c + wy * s) * k,
    ry: (-wx * s + wy * c) * k,
    tx: e.clientX,
    ty: e.clientY,
    sx: e.clientX,
    sy: e.clientY,
    t0: performance.now(),
    moved: false,
  };
  p.mode = 'free';
  p.sp = null;
  p.airT = 0;
  p.entering = false;
  pointers.set(e.pointerId, p);
  toTop(p);
  select(p);
  wake(p);
});

window.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p || !p.held) return;
  const H = p.held;
  H.tx = clamp(e.clientX, 0, S.W);
  H.ty = clamp(e.clientY, 0, S.H);
  if (!H.moved && Math.hypot(e.clientX - H.sx, e.clientY - H.sy) > 7) {
    H.moved = true;
    S.layout = 'scatter';
    S.tidyCount = 0;
    dismissHint();
  }
  wake(p);
});

function endPointer(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  pointers.delete(e.pointerId);
  const H = p.held;
  p.held = null;
  if (!H) return;
  if (reduced) p.vx = p.vy = p.va = 0;
  else {
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > PH.VMAX) {
      p.vx *= PH.VMAX / sp;
      p.vy *= PH.VMAX / sp;
    }
    p.va = clamp(p.va, -26, 26);
    if (H.moved && sp > 280) sound.slide(sp / 3200);
  }
  wake(p);
  if (e.type === 'pointerup' && !H.moved && performance.now() - H.t0 < 450) onTap(p);
}
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);

function onTap(p) {
  const now = performance.now();
  if (tapPrint === p && now - tapAt < 340) {
    clearTimeout(tapTimer);
    tapTimer = null;
    tapPrint = null;
    openPhoto(p.photo.file);
    return;
  }
  tapPrint = p;
  tapAt = now;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => {
    tapTimer = null;
    flip(p);
  }, 270);
}

els.prints.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const card = e.target.closest('.p-card');
  if (!card) return;
  const p = card.parentElement._p;
  if (p && !p.leaving && !p.hover) {
    p.hover = true;
    wake(p);
  }
});
els.prints.addEventListener('pointerout', (e) => {
  const card = e.target.closest('.p-card');
  if (!card || card.contains(e.relatedTarget)) return;
  const p = card.parentElement._p;
  if (p && p.hover) {
    p.hover = false;
    wake(p);
  }
});

els.stage.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.print')) select(null);
});

els.prints.addEventListener('click', (e) => {
  const b = e.target.closest('.loupe');
  if (b) openPhoto(b.parentElement._p.photo.file);
});

els.prints.addEventListener('keydown', (e) => {
  const card = e.target.closest('.p-card');
  if (!card) return;
  const p = card.parentElement._p;
  if (!p || p.leaving) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    flip(p);
    return;
  }
  const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const d = dirs[e.key];
  if (!d) return;
  e.preventDefault();
  toTop(p);
  S.layout = 'scatter';
  const P = S.play;
  const t = {
    x: clamp(p.x + d[0] * S.L * 0.35, P.x + p.w * 0.4, P.x + P.w - p.w * 0.4),
    y: clamp(p.y + d[1] * S.L * 0.35, P.y + p.h * 0.4, P.y + P.h - p.h * 0.4),
    a: p.a + (e.shiftKey ? d[0] * 0.3 + d[1] * 0.3 : 0),
  };
  if (reduced) {
    p.x = t.x;
    p.y = t.y;
    p.a = t.a;
    render(p);
  } else throwTo(p, t, 0.04, 0);
});

/* ------------------------------------------------------------------ envelopes */

const envEls = {};

function buildEnvelopes() {
  els.tray.innerHTML = '';
  B.albums.forEach((a, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'env';
    b.dataset.album = a.slug;
    b.style.setProperty('--r', `${ENV_ROT[i % ENV_ROT.length]}deg`);
    b.innerHTML = `
      <span class="env-back" aria-hidden="true"></span>
      <span class="env-peek" aria-hidden="true"><img alt="" decoding="async"><img alt="" decoding="async"></span>
      <span class="env-front" aria-hidden="true"></span>
      <span class="env-label" aria-hidden="true"><span class="env-title"></span><span class="env-count"></span></span>`;
    b.addEventListener('click', () => {
      dismissHint();
      openAlbum(a.slug);
    });
    els.tray.append(b);
    envEls[a.slug] = b;
  });
}

function updateEnvelopes(animateText = false) {
  for (const a of B.albums) {
    const b = envEls[a.slug];
    const on = S.prints.filter((p) => !p.leaving && p.photo.album === a.slug);
    const inside = a.photos.filter((ph) => !on.some((p) => p.photo.file === ph.file));
    b.querySelectorAll('.env-peek img').forEach((img, k) => {
      const ph = inside[k];
      img.classList.toggle('gone', !ph);
      if (ph) {
        const url = B.thumbUrl(ph.file);
        if (img.dataset.want !== url) setImg(img, url);
      }
    });
    const active = S.active === a.slug;
    b.classList.toggle('is-active', active);
    b.classList.toggle('is-empty', inside.length === 0);
    const title = b.querySelector('.env-title');
    title.textContent = B.text(a.title);
    b.querySelector('.env-count').textContent = inside.length === 0 ? u('onTable') : `${pad2(a.photos.length)} ${B.t('photos')}`;
    b.setAttribute('aria-label', `${B.text(a.title)}, ${a.photos.length} ${B.t('photos')} — ${active ? u('putBack') : u('tipOut')}`);
    if (animateText) rewrite(title);
  }
}

function gulp(slug) {
  const b = envEls[slug];
  if (!b || reduced) return;
  b.animate(
    [{ scale: '1 1' }, { scale: '1.06 0.93', offset: 0.35 }, { scale: '0.98 1.03', offset: 0.7 }, { scale: '1 1' }],
    { duration: 340, easing: 'ease-out' }
  );
}
function spit(slug) {
  const b = envEls[slug];
  if (!b || reduced) return;
  b.animate([{ translate: '0 0' }, { translate: '0 5px', offset: 0.3 }, { translate: '0 -3px', offset: 0.65 }, { translate: '0 0' }], {
    duration: 380,
    easing: 'ease-out',
  });
}

/* ------------------------------------------------------------------ chrome */

function applyStatic(animate = false) {
  document.title = `${B.text(B.site.name)} — ${u('docTitle')}`;
  els.stage.setAttribute('aria-label', u('tableLabel'));
  els.controls.setAttribute('aria-label', u('controls'));
  els.tray.setAttribute('aria-label', u('albums'));
  $('#nameText').textContent = B.text(B.site.name);
  $('#nameTape').setAttribute('aria-label', `${B.text(B.site.name)} — ${u('meaningBtn')}`);
  $('#meaning').textContent = B.text(B.site.nameMeaning);
  $('#tagline').textContent = B.text(B.site.tagline);
  $('#tidyBtn .tape-t').textContent = u('tidy');
  $('#messBtn .tape-t').textContent = u('mess');
  $('#soundBtn .tape-t').textContent = u('sound');
  $('#soundBtn').setAttribute('aria-label', sound.on ? u('soundOn') : u('soundOff'));
  $('#langBtn').setAttribute('aria-label', `БГ / EN — ${u('langAria')}`);
  $('#sheetLang').setAttribute('aria-label', `БГ / EN — ${u('langAria')}`);
  $('#listBtn .full').textContent = B.t('listView');
  $('#listBtn .short').textContent = B.t('listViewShort');
  $('#listBtn').setAttribute('aria-label', B.t('listView'));
  $('#protoLink span:last-child').textContent = B.t('prototypes');
  $('#creditsLink').textContent = B.t('photoCredits');
  $('#creditsLink').href = B.creditsUrl;
  els.sticky.querySelector('p').textContent = u('sticky');
  els.emptyNote.querySelector('p').textContent = u('empty');
  const lt = $('#loaderText');
  if (lt) lt.textContent = B.t('loading');
  $('#lbClose .tape-t').textContent = B.t('close');
  $('#lbClose').setAttribute('aria-label', u('closePhoto'));
  $('#lbPrev').setAttribute('aria-label', u('prevPhoto'));
  $('#lbNext').setAttribute('aria-label', u('nextPhoto'));
  $('#sheetClose .tape-t').textContent = B.t('close');
  root.classList.toggle('lang-en', B.lang === 'en');
  if (animate) rewrite(els.sticky.querySelector('p'), $('#meaning'));
}

let toastTimer = 0;
function toast(text, ms = 2800) {
  els.toast.dataset.hint = '';
  els.toast.textContent = text;
  els.live.textContent = text;
  els.toast.classList.remove('show');
  void els.toast.offsetWidth;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), ms);
}

function dismissHint() {
  if (els.toast.dataset.hint === '1') {
    els.toast.dataset.hint = '';
    clearTimeout(toastTimer);
    els.toast.classList.remove('show');
  }
}

$('#tidyBtn').addEventListener('click', () => {
  dismissHint();
  tidy();
});
$('#messBtn').addEventListener('click', () => {
  dismissHint();
  mess();
});
$('#soundBtn').addEventListener('click', (e) => {
  sound.set(!sound.on);
  e.currentTarget.setAttribute('aria-pressed', String(sound.on));
  e.currentTarget.setAttribute('aria-label', sound.on ? u('soundOn') : u('soundOff'));
  e.currentTarget.classList.toggle('is-on', sound.on);
});
function switchLang(btn) {
  if (reduced) {
    B.toggleLang();
    return;
  }
  btn.querySelector('.tape-in').animate(
    [
      { transform: 'perspective(240px) rotateX(0deg)' },
      { transform: 'perspective(240px) rotateX(88deg)', offset: 0.42 },
      { transform: 'perspective(240px) rotateX(-88deg)', offset: 0.43 },
      { transform: 'perspective(240px) rotateX(0deg)' },
    ],
    { duration: 560, easing: 'ease-in-out' }
  );
  setTimeout(() => B.toggleLang(), 236);
}
$('#langBtn').addEventListener('click', (e) => switchLang(e.currentTarget));
$('#sheetLang').addEventListener('click', (e) => switchLang(e.currentTarget));

const nameTape = $('#nameTape');
nameTape.addEventListener('click', () => {
  const open = nameTape.getAttribute('aria-expanded') !== 'true';
  nameTape.setAttribute('aria-expanded', String(open));
  els.brand.classList.toggle('peeled', open);
});

B.onLangChange(() => {
  applyStatic(true);
  backPattern();
  for (const p of S.prints) setPrintText(p, true);
  updateEnvelopes(true);
  if (LB.open) lbText(true);
  if (sheet) rerenderSheet();
  if (els.toast.classList.contains('show') && els.toast.dataset.hint === '1') els.toast.textContent = u('hint');
});

/* ------------------------------------------------------------------ routing */

let current = { kind: 'table' };

function parseRoute() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [kind, arg] = h.split('/');
  if (kind === 'list') return { kind: 'list' };
  if (kind === 'post' && B.post(arg)) return { kind: 'post', slug: arg };
  if (kind === 'photo' && B.photos.some((ph) => ph.file === arg)) return { kind: 'photo', file: arg };
  return { kind: 'table' };
}

function route() {
  const next = parseRoute();
  const prev = current;
  current = next;
  if (next.kind === 'photo') showLightbox(next.file);
  else if (LB.open) hideLightbox();
  if (next.kind === 'list' || next.kind === 'post') showSheet(next, prev);
  else if (sheet) hideSheet();
  setInert();
}

function navigate(hash, { replace = false } = {}) {
  const st = history.state || {};
  const state = replace ? { ...st, app: true } : { app: true, depth: (st.depth || 0) + 1, from: current.kind };
  history[replace ? 'replaceState' : 'pushState'](state, '', hash);
  route();
}

function goBack() {
  if (history.state?.app && history.state.depth > 0) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    route();
  }
}

window.addEventListener('popstate', route);

function openPhoto(file) {
  dismissHint();
  navigate(`#/photo/${encodeURIComponent(file)}`);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a) return;
  e.preventDefault();
  const href = a.getAttribute('href');
  if (href === '#/list' && current.kind === 'post' && history.state?.from === 'list') {
    goBack();
    return;
  }
  navigate(href, { replace: !!a.dataset.replace && current.kind !== 'table' });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (LB.open || sheet) {
      e.preventDefault();
      goBack();
    } else if (nameTape.getAttribute('aria-expanded') === 'true') nameTape.click();
    return;
  }
  if (LB.open && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    lbStep(e.key === 'ArrowLeft' ? -1 : 1);
  }
});

function setInert() {
  const on = LB.open || !!sheet;
  for (const el of [els.stage, els.top, els.tray, els.corner]) el.inert = on;
  root.classList.toggle('overlay-open', on);
}

/* ------------------------------------------------------------------ lightbox */

const LB = { open: false, list: [], idx: 0, el: null, T: null, src: null, dir: 0, back: null };

function lbList(file) {
  const onTable = live()
    .map((p) => p.photo)
    .sort(photoOrder);
  if (onTable.some((ph) => ph.file === file)) return onTable;
  const ph = B.photos.find((x) => x.file === file);
  return albumOf(ph).photos;
}

function lbTarget(ph) {
  const phone = S.W < 600;
  const mx = phone ? 14 : 96;
  const top = phone ? 70 : 76;
  const bottom = phone ? 170 : 150;
  const ar = clamp(ph.w / ph.h, 2 / 3, 3 / 2);
  const maxH = S.H - top - bottom;
  let w = Math.min(S.W - mx * 2, 1100);
  let h = w / ar;
  if (h > maxH) {
    h = maxH;
    w = h * ar;
  }
  return { x: (S.W - w) / 2, y: top + (maxH - h) / 2, w, h };
}

function makeLbPrint(ph, T) {
  const d = document.createElement('div');
  d.className = 'lb-print';
  Object.assign(d.style, { width: `${T.w}px`, height: `${T.h}px`, left: `${T.x}px`, top: `${T.y}px` });
  d.style.setProperty('--b', `${Math.round(Math.min(T.w, T.h) * 0.045)}px`);
  const img = new Image();
  img.alt = B.text(ph.caption);
  img.decoding = 'async';
  img.draggable = false;
  d.append(img);
  loadUrl(B.thumbUrl(ph.file)).then((src) => {
    if (src && !img.classList.contains('full')) {
      img.src = src;
      img.classList.add('ready');
    }
  });
  loadUrl(B.photoUrl(ph.file)).then((src) => {
    if (src && d.isConnected) {
      img.src = src;
      img.classList.add('ready', 'full');
    }
  });
  return d;
}

function fromPrint(p, T) {
  const dx = p.x - (T.x + T.w / 2);
  const dy = p.y - (T.y + T.h / 2);
  const k = (p.w * p.s) / T.w;
  return `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${wrapPi(p.a).toFixed(4)}rad) scale(${k.toFixed(4)})`;
}

const LB_REST = 'translate(0px,0px) rotate(-0.6deg) scale(1)';

function lbText(animate = false) {
  const ph = LB.list[LB.idx];
  const album = albumOf(ph);
  const cap = $('#lbCap');
  cap.textContent = B.text(ph.caption);
  $('#lbMeta').textContent = `${B.text(album.title)} · ${u('photoOf')(LB.idx + 1, LB.list.length)}`;
  els.lightbox.setAttribute('aria-label', B.text(ph.caption));
  if (LB.el) LB.el.querySelector('img').alt = B.text(ph.caption);
  if (animate) rewrite(cap);
}

function placeSlip(T) {
  els.lbSlip.style.top = `${Math.round(T.y + T.h + 16)}px`;
  els.lightbox.style.setProperty('--lb-mid', `${Math.round(T.y + T.h / 2)}px`);
  els.lightbox.style.setProperty('--lb-bottom', `${Math.round(T.y + T.h + 16)}px`);
}

function showLightbox(file) {
  const list = lbList(file);
  const idx = Math.max(0, list.findIndex((x) => x.file === file));
  if (LB.open) {
    lbSwap(list, idx);
    return;
  }
  LB.open = true;
  LB.list = list;
  LB.idx = idx;
  LB.back = document.activeElement;
  els.lightbox.hidden = false;
  const ph = list[idx];
  const T = lbTarget(ph);
  const d = makeLbPrint(ph, T);
  els.lbStage.append(d);
  LB.el = d;
  LB.T = T;
  lbText();
  placeSlip(T);
  const p = printFor(ph.file);
  d.style.transform = LB_REST;
  if (p && !reduced) {
    toTop(p);
    LB.src = p;
    d.animate([{ transform: fromPrint(p, T), boxShadow: '0 2px 6px rgba(0,0,0,.4)' }, { transform: LB_REST }], {
      duration: 620,
      easing: 'cubic-bezier(.2,.8,.2,1)',
    });
    p.el.style.visibility = 'hidden';
  } else {
    LB.src = p || null;
    if (p) p.el.style.visibility = 'hidden';
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
  }
  els.lightbox.classList.remove('closing');
  els.lightbox.classList.add('open');
  setInert();
  setTimeout(() => (keyboardUser ? $('#lbClose') : els.lightbox).focus({ preventScroll: true }), 30);
}

function lbSwap(list, idx) {
  const dir = LB.dir || (idx > LB.idx ? 1 : -1);
  LB.dir = 0;
  if (idx === LB.idx && list === LB.list) return;
  const old = LB.el;
  LB.list = list;
  LB.idx = idx;
  const ph = list[idx];
  const T = lbTarget(ph);
  const d = makeLbPrint(ph, T);
  els.lbStage.append(d);
  LB.el = d;
  LB.T = T;
  d.style.transform = LB_REST;
  if (reduced) {
    old.remove();
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
  } else {
    old
      .animate([{ transform: old.style.transform, opacity: 1 }, { transform: `translateX(${-dir * 75}vw) rotate(${-dir * 9}deg)`, opacity: 0.4 }], {
        duration: 420,
        easing: 'cubic-bezier(.5,0,.75,0)',
        fill: 'forwards',
      })
      .finished.then(() => old.remove());
    d.animate([{ transform: `translateX(${dir * 75}vw) rotate(${dir * 11}deg)` }, { transform: LB_REST }], {
      duration: 560,
      delay: 90,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'backwards',
    });
  }
  if (LB.src) LB.src.el.style.visibility = '';
  const p = printFor(ph.file);
  LB.src = p || null;
  if (p) p.el.style.visibility = 'hidden';
  lbText();
  placeSlip(T);
}

function lbStep(dir) {
  if (!LB.open) return;
  const n = LB.list.length;
  const idx = (LB.idx + dir + n) % n;
  LB.dir = dir;
  navigate(`#/photo/${encodeURIComponent(LB.list[idx].file)}`, { replace: true });
}

function hideLightbox() {
  if (!LB.open) return;
  LB.open = false;
  const d = LB.el;
  const ph = LB.list[LB.idx];
  const p = printFor(ph.file);
  els.lightbox.classList.remove('open');
  els.lightbox.classList.add('closing');
  let anim;
  if (p && !reduced) {
    toTop(p);
    anim = d.animate([{ transform: d.style.transform }, { transform: fromPrint(p, LB.T), boxShadow: '0 2px 6px rgba(0,0,0,.4)' }], {
      duration: 480,
      easing: 'cubic-bezier(.45,0,.2,1)',
      fill: 'forwards',
    });
  } else anim = d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
  anim.finished.then(() => {
    d.remove();
    if (LB.open) return;
    els.lightbox.hidden = true;
    els.lightbox.classList.remove('closing');
    if (p) p.el.style.visibility = '';
    if (LB.src && LB.src !== p) LB.src.el.style.visibility = '';
    LB.src = null;
    setInert();
    const back = p ? p.card : LB.back;
    if (back && back.isConnected && document.activeElement === document.body) back.focus({ preventScroll: true });
  });
  setInert();
}

$('#lbClose').addEventListener('click', goBack);
$('#lbPrev').addEventListener('click', () => lbStep(-1));
$('#lbNext').addEventListener('click', () => lbStep(1));

{
  let sx = 0;
  let sy = 0;
  let down = false;
  els.lightbox.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    down = true;
    sx = e.clientX;
    sy = e.clientY;
  });
  els.lightbox.addEventListener('pointerup', (e) => {
    if (!down) return;
    down = false;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbStep(dx < 0 ? 1 : -1);
    else if (Math.hypot(dx, dy) < 8 && !e.target.closest('.lb-print, .lb-slip')) goBack();
  });
}

/* ------------------------------------------------------------------ sheets */

let sheet = null;
const SHEET_IN = {
  up: 'translate(-3%, 108vh) rotate(8deg)',
  right: 'translate(112vw, 6vh) rotate(11deg)',
  left: 'translate(-112vw, 6vh) rotate(-11deg)',
};
const SHEET_OUT = {
  down: 'translate(4%, 112vh) rotate(-7deg)',
  left: 'translate(-118vw, 4vh) rotate(-12deg)',
  right: 'translate(118vw, 4vh) rotate(12deg)',
};

function sheetHTML(next) {
  return next.kind === 'list' ? listHTML(B, u) : postHTML(B, u, next.slug);
}

function sheetIn(el, dir) {
  if (reduced) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
    return;
  }
  el.animate(
    [{ transform: SHEET_IN[dir] }, { transform: 'translate(0, -4px) rotate(-0.5deg)', offset: 0.8 }, { transform: 'none' }],
    { duration: 820, easing: 'cubic-bezier(.17,.84,.3,1)' }
  );
}

function sheetOut(el, dir) {
  const r = el.getBoundingClientRect();
  Object.assign(el.style, { position: 'fixed', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, margin: '0' });
  el.setAttribute('aria-hidden', 'true');
  el.inert = true;
  els.sheets.insertBefore(el, els.sheetScroll);
  const anim = reduced
    ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' })
    : el.animate([{ transform: 'none' }, { transform: SHEET_OUT[dir] }], {
        duration: 560,
        easing: 'cubic-bezier(.55,0,.8,.3)',
        fill: 'forwards',
      });
  anim.finished.then(() => el.remove());
}

function showSheet(next, prev) {
  if (sheet && sheet.kind === next.kind && sheet.slug === next.slug) return;
  const opening = !sheet;
  let enter = 'up';
  if (opening) {
    els.sheets.hidden = false;
    els.sheets.classList.add('open');
    sheetFocusBack = document.activeElement;
    els.sheetDim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 200 : 500, fill: 'both' });
  } else {
    let exit = 'down';
    if (sheet.kind === 'list' && next.kind === 'post') {
      exit = 'left';
      enter = 'right';
    } else if (sheet.kind === 'post' && next.kind === 'list') {
      exit = 'right';
      enter = 'left';
    } else if (sheet.kind === 'post' && next.kind === 'post') {
      const a = B.posts.findIndex((p) => p.slug === sheet.slug);
      const b = B.posts.findIndex((p) => p.slug === next.slug);
      exit = b > a ? 'left' : 'right';
      enter = b > a ? 'right' : 'left';
    }
    sheetOut(sheet.el, exit);
  }
  const el = document.createElement('div');
  el.className = `sheet sheet--${next.kind}`;
  el.innerHTML = sheetHTML(next);
  els.sheetScroll.append(el);
  els.sheetScroll.scrollTop = 0;
  sheetIn(el, enter);
  sheet = { el, kind: next.kind, slug: next.slug };
  document.title = next.kind === 'post' ? `${B.view(B.post(next.slug)).title} — ${B.text(B.site.name)}` : `${B.t('allPosts')} — ${B.text(B.site.name)}`;
  setInert();
  requestAnimationFrame(() => el.querySelector('h1')?.focus({ preventScroll: true }));
}

let sheetFocusBack = null;

function hideSheet() {
  if (!sheet) return;
  const el = sheet.el;
  sheet = null;
  sheetOut(el, 'down');
  els.sheetDim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 200 : 520, fill: 'both' });
  setTimeout(() => {
    if (sheet) return;
    els.sheets.hidden = true;
    els.sheets.classList.remove('open');
  }, reduced ? 240 : 580);
  document.title = `${B.text(B.site.name)} — ${u('docTitle')}`;
  setInert();
  if (sheetFocusBack && sheetFocusBack.isConnected) sheetFocusBack.focus({ preventScroll: true });
  sheetFocusBack = null;
}

function rerenderSheet() {
  const top = els.sheetScroll.scrollTop;
  sheet.el.innerHTML = sheetHTML(sheet);
  els.sheetScroll.scrollTop = top;
  rewrite(sheet.el.querySelector('h1'));
  document.title = sheet.kind === 'post' ? `${B.view(B.post(sheet.slug)).title} — ${B.text(B.site.name)}` : `${B.t('allPosts')} — ${B.text(B.site.name)}`;
}

$('#sheetClose').addEventListener('click', goBack);
els.sheetScroll.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const n = Number(img.dataset.retry || 0);
    if (n >= 4) return;
    img.dataset.retry = String(n + 1);
    const base = img.src.split('?')[0];
    setTimeout(() => {
      img.src = `${base}?retry=${n + 1}`;
    }, 400 * (n + 1));
  },
  true
);
els.sheetScroll.addEventListener('click', (e) => {
  if (e.target === els.sheetScroll) goBack();
  const al = e.target.closest('.al-btn');
  if (al) {
    const slug = al.dataset.album;
    goBack();
    setTimeout(() => openAlbum(slug), 140);
  }
});

/* ------------------------------------------------------------------ resize */

let resizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(relayout, 160);
});

function relayout() {
  if (!S.ready) return;
  const old = { ...S.play };
  const oldL = S.L;
  measure();
  maybeRepaintWood();
  for (const p of S.prints) {
    if (S.L !== oldL) sizePrint(p);
    if (p.leaving) continue;
    p.x = S.play.x + ((p.x - old.x) / old.w) * S.play.w;
    p.y = S.play.y + ((p.y - old.y) / old.h) * S.play.h;
    if (p.sp) {
      p.sp.x = S.play.x + ((p.sp.x - old.x) / old.w) * S.play.w;
      p.sp.y = S.play.y + ((p.sp.y - old.y) / old.h) * S.play.h;
    }
    wake(p);
    render(p);
  }
  if (S.layout === 'grid') {
    const list = live();
    const pos = gridLayout(sortPrints(list));
    for (const p of list) {
      const c = pos.get(p);
      if (reduced || p.mode === 'tween') {
        if (p.mode !== 'tween') {
          p.x = c.x;
          p.y = c.y;
          render(p);
        }
      } else springTo(p, c.x, c.y, p.sp ? p.sp.a : p.a, 0, 16, 0.9);
    }
  }
  if (LB.open) {
    const ph = LB.list[LB.idx];
    const T = lbTarget(ph);
    Object.assign(LB.el.style, { width: `${T.w}px`, height: `${T.h}px`, left: `${T.x}px`, top: `${T.y}px` });
    LB.T = T;
    placeSlip(T);
  }
}

/* ------------------------------------------------------------------ boot */

function lampOn() {
  const L = els.loader;
  const anim = reduced
    ? L.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' })
    : L.animate(
        [
          { opacity: 1 },
          { opacity: 0.25, offset: 0.14 },
          { opacity: 0.9, offset: 0.22 },
          { opacity: 0.1, offset: 0.36 },
          { opacity: 0.55, offset: 0.44 },
          { opacity: 0 },
        ],
        { duration: 1000, easing: 'linear', fill: 'forwards' }
      );
  return anim.finished.then(() => L.remove());
}

function preload(files, timeout = 3500) {
  return Promise.race([Promise.all(files.map((f) => loadUrl(B.thumbUrl(f)))), new Promise((r) => setTimeout(r, timeout))]);
}

async function boot() {
  applyTextures();
  applyStatic();
  buildEnvelopes();
  updateEnvelopes();
  await new Promise((r) => requestAnimationFrame(() => r()));
  measure();
  maybeRepaintWood(true);
  const firstMix = pickMix();
  await Promise.all([preload(firstMix.flat().map((p) => p.file)), document.fonts?.ready]);
  S.ready = true;
  relayout();
  await lampOn();
  if (parseRoute().kind !== 'table') route();
  tossMix(firstMix);
  setTimeout(() => (root.dataset.settled = '1'), reduced ? 900 : 2600);
  setTimeout(
    () => {
      if (!S.hintShown && !LB.open && !sheet) {
        S.hintShown = true;
        toast(u('hint'), 6500);
        els.toast.dataset.hint = '1';
      }
    },
    reduced ? 600 : 1500
  );
}

boot();
