import { u } from './i18n.js';
import { PrintState } from './sim.js';
import { createEngine, loadImage } from './engine.js';
import { createReader } from './reader.js';

const Blog = window.Blog;
const gsap = window.gsap || gsapShim();
// Positions must always be honest: after a hiccup, jump to where things should be instead of crawling.
gsap.ticker?.lagSmoothing(0);
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- environment
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reduceMQ.matches;
reduceMQ.addEventListener?.('change', (e) => {
  reduced = e.matches;
  document.documentElement.classList.toggle('reduced', reduced);
});
document.documentElement.classList.toggle('reduced', reduced);
const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
const DPR = () => Math.min(2, window.devicePixelRatio || 1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = h >>> 0 || 7;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- storage (per viewer)
const STORE_KEY = 'gallery-develop:v1';
let store = {};
try {
  store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
} catch {
  store = {};
}
if (typeof store !== 'object' || Array.isArray(store)) store = {};
if (!store.prints || typeof store.prints !== 'object') store.prints = {};
let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      /* private mode or full storage: progress just won't be remembered */
    }
  }, 250);
}
function persist(st) {
  const v = st.serialize();
  if (v == null) delete store.prints[st.file];
  else store.prints[st.file] = v;
  save();
}

// ---------------------------------------------------------------- prints: state
const M = 0.058; // side/top margin of the instant frame, as a fraction of its width
const BOTTOM = 0.235; // the wide bottom margin where captions go
const formatAspect = (p) => {
  const a = p.w / p.h;
  return a >= 1.15 ? 1.3 : a <= 0.87 ? 0.78 : 1;
};
const frameHF = (ar) => M + (1 - 2 * M) / ar + BOTTOM;

const states = new Map();
for (const p of Blog.photos) {
  const st = new PrintState(p.file, formatAspect(p));
  st.photo = p;
  const saved = store.prints[p.file];
  if (saved != null) st.restore(saved);
  states.set(p.file, st);
}
const albumBySlug = new Map(Blog.albums.map((a) => [a.slug, a]));

const engine = createEngine();

// ---------------------------------------------------------------- DOM
const scene = $('scene');
const table = $('table');
const boxesEl = $('boxes');
const notesEl = $('notes');
const rubcue = $('rubcue');
const lightbox = $('lightbox');
const lbStage = $('lbStage');

// ---------------------------------------------------------------- views
const views = new Set();
let zTop = 10;

function createView(photo, large = false) {
  const st = states.get(photo.file);
  const el = document.createElement('div');
  el.className = 'print' + (large ? ' print--large' : '');
  el.style.setProperty('--ar', st.aspect);
  el.innerHTML =
    '<div class="print__paper"><div class="print__window"><canvas class="print__canvas" aria-hidden="true"></canvas>' +
    '<span class="print__gloss" aria-hidden="true"></span></div><p class="print__caption" aria-hidden="true"></p></div>';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  const canvas = el.querySelector('canvas');
  const view = {
    el,
    photo,
    state: st,
    large,
    canvas,
    ctx: canvas.getContext('2d', { alpha: false }),
    win: el.querySelector('.print__window'),
    cap: el.querySelector('.print__caption'),
    urls: large ? [Blog.photoUrl(photo.file), Blog.thumbUrl(photo.file)] : [Blog.thumbUrl(photo.file)],
    renderedVersion: -1,
    renderedUrl: undefined,
    dirty: true,
    visible: true,
    capShown: false,
    pw: 0,
    h: 0,
    x: 0,
    y: 0,
    rot: 0,
    baseRot: 0,
    lean: 0,
  };
  for (const url of view.urls) {
    const rec = loadImage(url);
    if (!rec.ready) {
      rec.listeners.add(() => {
        view.dirty = true;
        kick();
      });
    }
  }
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(view, 'key');
    }
  });
  el.addEventListener('focus', () => {
    if (!view.large && mode === 'phone') {
      const i = tableViews.indexOf(view);
      if (i >= 0 && i !== cur) goTo(i);
    }
    if (!view.large && mode === 'table') el.style.zIndex = ++zTop;
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  views.add(view);
  if (st.ready) writeCaption(view, false);
  labelView(view);
  return view;
}

function destroyView(view) {
  views.delete(view);
  gsap.killTweensOf(view.el);
  view.el.remove();
}

function sizeView(view, pw) {
  const st = view.state;
  view.pw = pw;
  view.h = pw * frameHF(st.aspect);
  view.el.style.setProperty('--pw', `${pw}px`);
  const imgW = pw * (1 - 2 * M);
  const imgH = imgW / st.aspect;
  let cw = imgW * DPR();
  let ch = imgH * DPR();
  const cap = view.large ? 1600 : 900;
  const k = Math.min(1, cap / Math.max(cw, ch));
  cw = Math.max(2, Math.round(cw * k));
  ch = Math.max(2, Math.round(ch * k));
  if (view.canvas.width !== cw || view.canvas.height !== ch) {
    view.canvas.width = cw;
    view.canvas.height = ch;
    view.dirty = true;
  }
}

function captionText(photo) {
  return Blog.text(photo.caption);
}

function writeCaption(view, animate) {
  const text = captionText(view.photo);
  const cap = view.cap;
  cap.lang = Blog.lang;
  cap.dataset.size = text.length < 26 ? 'l' : text.length < 44 ? 'm' : 's';
  cap.textContent = '';
  const ink = document.createElement('span');
  ink.className = 'ink';
  let i = 0;
  const words = text.split(' ');
  words.forEach((word, wi) => {
    const w = document.createElement('span');
    w.className = 'w';
    for (const ch of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      s.style.setProperty('--i', i++);
      w.append(s);
    }
    ink.append(w);
    if (wi < words.length - 1) {
      ink.append(' ');
      i++;
    }
  });
  cap.append(ink);
  view.capShown = true;
  cap.classList.remove('is-written', 'is-instant');
  if (animate && !reduced) {
    void cap.offsetWidth;
    cap.classList.add('is-written');
  } else {
    cap.classList.add('is-written', 'is-instant');
  }
}

function eraseCaption(view) {
  view.capShown = false;
  view.cap.classList.remove('is-written', 'is-instant');
}

function labelView(view) {
  const st = view.state;
  const alb = albumBySlug.get(view.photo.album);
  const vars = { i: view.photo.index + 1, n: alb.photos.length, caption: captionText(view.photo) };
  view.el.setAttribute('aria-label', st.ready ? u('printDev', vars) : u('printUndev', vars));
  view.el.classList.toggle('is-ready', st.ready);
  view.el.classList.toggle('is-developed', st.developed);
}

// ---------------------------------------------------------------- render loop
let raf = 0;
function kick() {
  if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
}
function frame(now) {
  raf = 0;
  let busy = false;
  for (const st of states.values()) {
    if (!st.busy) continue;
    const ev = st.update(now, reduced);
    if (ev.ready) onReady(st);
    if (ev.developed) onDeveloped(st);
    if (st.busy) busy = true;
  }
  for (const v of views) {
    if (!v.visible) continue;
    if (v.dirty || v.renderedVersion !== v.state.version) {
      v.dirty = false;
      engine.render(v);
    }
  }
  if (busy) kick();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    raf = 0;
  } else {
    kick();
  }
});

function viewsOf(st) {
  return [...views].filter((v) => v.state === st);
}

let developingAll = false;
function onReady(st) {
  for (const v of viewsOf(st)) {
    writeCaption(v, true);
    labelView(v);
  }
  if (lb.view && lb.view.state === st) updateLightboxMeta();
  persist(st);
}
function onDeveloped(st) {
  for (const v of viewsOf(st)) {
    if (!v.capShown) writeCaption(v, true);
    labelView(v);
  }
  persist(st);
  updateBoxes();
  const alb = albumBySlug.get(st.photo.album);
  const all = alb.photos.every((p) => states.get(p.file).developed);
  if (all) {
    if (developingAll) developingAll = false;
    else if (alb.slug === albumSlug) setTimeout(() => note(u('albumDone')), 900);
  }
}

// ---------------------------------------------------------------- layout
let mode = null; // 'table' | 'phone'
let albumSlug = null;
let album = null;
let tableViews = [];
let cur = 0;
const posMemory = new Map();

const currentMode = () => (innerWidth < 700 ? 'phone' : 'table');

function applyMode() {
  const m = currentMode();
  if (m === mode) return false;
  mode = m;
  scene.dataset.mode = m;
  const actions = $('actions');
  if (m === 'phone') $('phoneActions').append(actions);
  else document.querySelector('.top__right').prepend(actions);
  updateHint();
  return true;
}

function layout(animate = false) {
  if (!tableViews.length) return;
  const W = table.clientWidth;
  const H = table.clientHeight;
  if (mode === 'phone') {
    // Every print as large as the table allows, whatever its shape.
    tableViews.forEach((v) => {
      const hf = frameHF(v.state.aspect);
      sizeView(v, Math.max(120, Math.min(W * 0.84, (H * 0.97) / hf, 460)));
    });
    placePhone(0, animate);
  } else {
    layoutTable(W, H, animate);
  }
  placeRubcue();
  kick();
}

function layoutTable(W, H, animate) {
  const n = tableViews.length;
  const hfs = tableViews.map((v) => frameHF(v.state.aspect));
  const gap = Math.min(28, H * 0.04);
  // Try every column count; rows take the height of their tallest print.
  let best = { pw: 0, cols: 1 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    let sumHF = 0;
    for (let r = 0; r < rows; r++) sumHF += Math.max(...hfs.slice(r * cols, r * cols + cols));
    const pw = Math.min((W / cols) * 0.88, (H - gap * (rows + 1)) / sumHF);
    if (pw > best.pw + 0.5) best = { pw, cols, rows, sumHF };
  }
  const pw = Math.max(110, Math.min(best.pw, 390, W * 0.42));
  const { cols, rows } = best;
  const rowH = [];
  for (let r = 0; r < rows; r++) rowH.push(pw * Math.max(...hfs.slice(r * cols, r * cols + cols)));
  const spare = Math.max(0, H - rowH.reduce((a, b) => a + b, 0));
  const vgap = spare / (rows + 1);
  const cellW = W / cols;
  const rnd = seeded(albumSlug + ':' + cols);
  let top = vgap;
  const rowTop = rowH.map((h) => {
    const t = top;
    top += h + vgap;
    return t;
  });
  tableViews.forEach((v, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const ox = ((cols - inRow) * cellW) / 2;
    const h = pw * hfs[i];
    const slackX = Math.max(0, cellW - pw) * 0.34;
    const slackY = Math.min(vgap * 0.8, 40) + (rowH[r] - h) * 0.5;
    let cx = ox + cellW * (c + 0.5) + (rnd() * 2 - 1) * slackX;
    let cy = rowTop[r] + rowH[r] / 2 + (rnd() * 2 - 1) * slackY;
    let rot = (rnd() * 2 - 1) * 4.2;
    const mem = posMemory.get(v.photo.file);
    if (mem) {
      cx = mem.nx * W;
      cy = mem.ny * H;
      rot = mem.rot;
    }
    cx = clamp(cx, pw * 0.5, W - pw * 0.5);
    cy = clamp(cy, h * 0.5, Math.max(h * 0.5, H - h * 0.5));
    sizeView(v, pw);
    v.x = cx - pw / 2;
    v.y = cy - h / 2;
    v.rot = v.baseRot = rot;
    v.visible = true;
    v.el.style.visibility = '';
    v.el.classList.remove('is-current');
    v.el.removeAttribute('aria-hidden');
    v.el.tabIndex = 0;
    v.el.style.zIndex = '';
    const props = { x: v.x, y: v.y, rotation: rot, scale: 1 };
    if (animate && !reduced) gsap.to(v.el, { ...props, duration: 0.7, ease: 'power3.out' });
    else gsap.set(v.el, props);
  });
}

const phoneRot = (i) => {
  const r = seeded(albumSlug + i)();
  return (r * 2 - 1) * 2.6;
};

function placePhone(dx, animate) {
  const W = table.clientWidth;
  const H = table.clientHeight;
  const n = tableViews.length;
  if (!n) return;
  const pw = Math.max(...tableViews.map((v) => v.pw));
  // Neighbours peek in from the edges, so it's obvious there is more on the table.
  const spacing = Math.max(pw + 10, W / 2 + pw / 2 - 18);
  // rubber band at the ends
  if ((cur === 0 && dx > 0) || (cur === n - 1 && dx < 0)) dx *= 0.35;
  tableViews.forEach((v, i) => {
    const k = i - cur;
    const off = k * spacing + dx;
    const x = W / 2 + off - v.pw / 2;
    const y = H / 2 - v.h / 2;
    const near = Math.abs(off) / spacing;
    const visible = Math.abs(off) < W / 2 + v.pw;
    v.visible = visible;
    v.el.style.visibility = visible ? '' : 'hidden';
    v.el.style.zIndex = String(100 - Math.round(near * 10));
    v.x = x;
    v.y = y;
    v.baseRot = phoneRot(i) + clamp(off / spacing, -1, 1) * 3;
    const props = { x, y, rotation: v.baseRot, scale: 1 - Math.min(1, near) * 0.07 };
    if (animate && !reduced) gsap.to(v.el, { ...props, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
    else {
      gsap.killTweensOf(v.el, 'x,y,rotation,scale');
      gsap.set(v.el, props);
    }
    v.el.classList.toggle('is-current', k === 0);
    v.el.tabIndex = k === 0 ? 0 : -1;
    if (k !== 0) v.el.setAttribute('aria-hidden', 'true');
    else v.el.removeAttribute('aria-hidden');
  });
  kick();
}

function goTo(i, animate = true) {
  const n = tableViews.length;
  cur = clamp(i, 0, n - 1);
  placePhone(0, animate);
  updatePager();
  placeRubcue();
}

function updatePager() {
  const n = tableViews.length;
  $('pagerCount').textContent = u('photoOf', { i: cur + 1, n });
  $('prevPrint').disabled = cur <= 0;
  $('nextPrint').disabled = cur >= n - 1;
  $('prevPrint').setAttribute('aria-label', u('prevPhoto'));
  $('nextPrint').setAttribute('aria-label', u('nextPhoto'));
}
$('prevPrint').addEventListener('click', () => goTo(cur - 1));
$('nextPrint').addEventListener('click', () => goTo(cur + 1));

// ---------------------------------------------------------------- albums & film boxes
const BOX_COLORS = {
  sofia: ['#2f6a4f', '#f1b941'],
  more: ['#1f5c88', '#f2875c'],
  planini: ['#4a4f7c', '#f3b54a'],
  'stari-gradove': ['#b0543b', '#f4d27c'],
  traditsii: ['#b3202c', '#f6efe4'],
};
const FALLBACK_COLORS = [
  ['#3d5a80', '#ee6c4d'],
  ['#6a4c93', '#f9c74f'],
  ['#2a9d8f', '#e9c46a'],
];

function renderBoxes() {
  boxesEl.innerHTML = Blog.albums
    .map((a, i) => {
      const [band, sun] = BOX_COLORS[a.slug] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      const tilt = ((seeded(a.slug)() * 2 - 1) * 3).toFixed(2);
      return `<button class="box" type="button" data-album="${a.slug}" style="--band:${band};--sun:${sun};--tilt:${tilt}deg">
        <span class="box__peek" aria-hidden="true"></span>
        <span class="box__top" aria-hidden="true">
          <span class="box__band"><span class="box__sun"></span></span>
          <span class="box__label">
            <span class="box__brand">${u('brand')}</span>
            <span class="box__sub"></span>
            <span class="box__title"></span>
            <span class="box__meta"></span>
          </span>
        </span>
        <span class="box__side" aria-hidden="true"><span class="box__warn"></span></span>
      </button>`;
    })
    .join('');
  updateBoxes();
}

function albumProgress(slug) {
  const a = albumBySlug.get(slug);
  const d = a.photos.filter((p) => states.get(p.file).developed).length;
  return { d, n: a.photos.length };
}

function updateBoxes() {
  boxesEl.setAttribute('aria-label', u('albums'));
  for (const btn of boxesEl.querySelectorAll('.box')) {
    const a = albumBySlug.get(btn.dataset.album);
    const { d, n } = albumProgress(a.slug);
    const title = Blog.text(a.title);
    btn.querySelector('.box__title').textContent = title;
    btn.querySelector('.box__sub').textContent = u('brandSub');
    btn.querySelector('.box__meta').textContent = `${u('boxShots', { n })} · ${d}/${n}`;
    btn.querySelector('.box__warn').textContent = u('boxWarning');
    btn.setAttribute('aria-label', `${title}. ${u('boxDeveloped', { d, n })}`);
    btn.setAttribute('aria-pressed', String(a.slug === albumSlug));
    btn.classList.toggle('is-done', d === n);
  }
}

boxesEl.addEventListener('click', (e) => {
  const b = e.target.closest('.box');
  if (b) navigate(`#/album/${b.dataset.album}`, true);
});

function updateAlbumHead() {
  if (!album) return;
  $('albumTitle').textContent = Blog.text(album.title);
  $('albumCount').textContent = `${album.photos.length} ${Blog.t('photos')}`;
  $('albumNote').textContent = Blog.text(album.note);
}

function updateHint() {
  const key = mode === 'phone' ? 'hintPhone' : fineMQ.matches ? 'hintMouse' : 'hintTouch';
  $('hint').textContent = u(key);
}

function boxPoint(slug) {
  const b = boxesEl.querySelector(`[data-album="${slug}"]`);
  const tr = table.getBoundingClientRect();
  if (!b) return { x: tr.width / 2, y: tr.height + 80 };
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2 - tr.left, y: r.top + r.height * 0.3 - tr.top };
}

function setAlbum(slug, animate = true) {
  if (slug === albumSlug && tableViews.length) return;
  const prevSlug = albumSlug;
  const old = tableViews;
  albumSlug = slug;
  album = albumBySlug.get(slug);
  store.album = slug;
  save();
  posMemory.clear();
  updateAlbumHead();
  updateBoxes();

  const doAnim = animate && !reduced;
  if (old.length) {
    const bp = boxPoint(prevSlug);
    old.forEach((v, i) => {
      v.el.style.pointerEvents = 'none';
      v.el.setAttribute('aria-hidden', 'true');
      v.el.tabIndex = -1;
      gsap.killTweensOf(v.el);
      if (doAnim) {
        gsap.to(v.el, {
          x: bp.x - v.pw / 2,
          y: bp.y - v.h / 2,
          rotation: v.rot + (i % 2 ? 24 : -24),
          scale: 0.3,
          opacity: 0,
          duration: 0.5,
          delay: i * 0.035,
          ease: 'power2.in',
          onComplete: () => destroyView(v),
        });
      } else {
        gsap.to(v.el, { opacity: 0, duration: animate ? 0.25 : 0, onComplete: () => destroyView(v) });
      }
    });
    const oldAlbum = albumBySlug.get(prevSlug);
    setTimeout(() => {
      if (albumSlug !== prevSlug && !(lb.view && lb.view.photo.album === prevSlug)) {
        oldAlbum.photos.forEach((p) => engine.dropPhoto(Blog.thumbUrl(p.file)));
      }
    }, 1500);
  }

  tableViews = album.photos.map((p) => createView(p));
  // Phones start on the first print that still needs developing.
  const firstUndev = tableViews.findIndex((v) => !v.state.developed);
  cur = firstUndev > 0 ? firstUndev : 0;
  tableViews.forEach((v) => table.append(v.el));
  layout(false);

  if (doAnim) {
    const bp = boxPoint(slug);
    tableViews.forEach((v, i) => {
      gsap.from(v.el, {
        x: bp.x - v.pw / 2,
        y: bp.y - v.h / 2,
        rotation: v.baseRot + (i % 2 ? -32 : 28),
        scale: 0.32,
        opacity: 0,
        duration: 0.95,
        delay: (old.length ? 0.32 : 0.1) + i * 0.075,
        ease: 'power3.out',
        immediateRender: true,
      });
    });
  } else if (animate) {
    tableViews.forEach((v) => gsap.from(v.el, { opacity: 0, duration: 0.35, immediateRender: true }));
  }
  updatePager();
  placeRubcue();
  kick();
}

// ---------------------------------------------------------------- gestures
let gesture = null;
let lastShakeAt = 0;

function windowGeo(view) {
  const r = view.el.getBoundingClientRect();
  const scale = Number(gsap.getProperty(view.el, 'scale')) || 1;
  const rot = ((Number(gsap.getProperty(view.el, 'rotation')) || 0) * Math.PI) / 180;
  const imgW = view.pw * (1 - 2 * M);
  const imgH = imgW / view.state.aspect;
  const offY = (view.pw * M + imgH / 2 - view.h / 2) * scale;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return {
    cx: r.left + r.width / 2 - offY * sin,
    cy: r.top + r.height / 2 + offY * cos,
    cos,
    sin,
    w: imgW * scale,
    h: imgH * scale,
  };
}

function localPoint(geo, x, y) {
  const dx = x - geo.cx;
  const dy = y - geo.cy;
  return {
    u: (dx * geo.cos + dy * geo.sin) / geo.w + 0.5,
    v: (-dx * geo.sin + dy * geo.cos) / geo.h + 0.5,
  };
}

function setGloss(view, p) {
  view.el.style.setProperty('--gx', `${(p.u * 100).toFixed(1)}%`);
  view.el.style.setProperty('--gy', `${(p.v * 100).toFixed(1)}%`);
}

function beginGesture(e, view, context) {
  if (gesture) return false;
  if (e.pointerType === 'mouse' && e.button !== 0) return false;
  const t = performance.now();
  let kind;
  let geo = null;
  if (view) {
    geo = windowGeo(view);
    const p = localPoint(geo, e.clientX, e.clientY);
    const inWin = p.u >= 0 && p.u <= 1 && p.v >= 0 && p.v <= 1;
    const isCurrent = context !== 'phone' || tableViews.indexOf(view) === cur;
    if (inWin && !view.state.developed && isCurrent) kind = 'rub';
    else kind = context === 'table' ? 'move' : 'swipe';
    setGloss(view, p);
  } else {
    kind = context === 'table' ? 'polish' : 'swipe';
  }
  gesture = {
    id: e.pointerId,
    view,
    kind,
    context,
    geo,
    x0: e.clientX,
    y0: e.clientY,
    lx: e.clientX,
    ly: e.clientY,
    lt: t,
    t0: t,
    moved: false,
    path: 0,
    vx: 0,
    shook: false,
    rev: { x: { dir: 0, run: 0, times: [] }, y: { dir: 0, run: 0, times: [] } },
    pointerType: e.pointerType,
  };
  if (kind === 'rub') view.el.classList.add('is-rubbing');
  return true;
}

function trackShake(g, dx, dy, t) {
  for (const [axis, d] of [
    ['x', dx],
    ['y', dy],
  ]) {
    const r = g.rev[axis];
    const s = Math.sign(d);
    if (!s) continue;
    if (s !== r.dir) {
      if (r.run > 16) r.times.push(t);
      r.dir = s;
      r.run = 0;
    }
    r.run += Math.abs(d);
    r.times = r.times.filter((tt) => t - tt < 900);
    if (r.times.length >= 4) {
      r.times = [];
      return true;
    }
  }
  return false;
}

function moveGesture(e) {
  const g = gesture;
  if (!g || e.pointerId !== g.id) return;
  const list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
  const pts = list.length ? list : [e];
  for (const p of pts) movePoint(g, p.clientX, p.clientY, performance.now());
}

function movePoint(g, x, y, t) {
  const dx = x - g.lx;
  const dy = y - g.ly;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.4) return;
  const dt = Math.max(1, t - g.lt);
  g.path += dist;
  g.vx = g.vx * 0.6 + (dx / dt) * 0.4;
  if (!g.moved && Math.hypot(x - g.x0, y - g.y0) > 6) {
    g.moved = true;
    if (g.kind === 'move') liftView(g.view);
  }

  if (g.kind === 'rub') {
    const st = g.view.state;
    const radiusPx = 0.17 * Math.min(g.geo.w, g.geo.h);
    const stepLen = Math.max(3, radiusPx * 0.3);
    const steps = Math.max(1, Math.ceil(dist / stepLen));
    const speed = dist / dt;
    const speedF = 0.5 + 0.6 * Math.min(1.4, speed / 1.1);
    const per = (dist / steps / stepLen) * speedF;
    for (let s = 1; s <= steps; s++) {
      const p = localPoint(g.geo, g.lx + (dx * s) / steps, g.ly + (dy * s) / steps);
      if (p.u < -0.1 || p.u > 1.1 || p.v < -0.1 || p.v > 1.1) continue;
      st.stamp(clamp(p.u, 0, 1), clamp(p.v, 0, 1), per, reduced);
    }
    setGloss(g.view, localPoint(g.geo, x, y));
    if (!store.rubbed && g.path > 120) {
      store.rubbed = true;
      save();
      placeRubcue();
    }
    kick();
  } else if (g.kind === 'move' && g.moved) {
    const v = g.view;
    const W = table.clientWidth;
    const H = table.clientHeight;
    v.x = clamp(v.x + dx, -v.pw * 0.45, W - v.pw * 0.55);
    v.y = clamp(v.y + dy, -v.h * 0.45, H - v.h * 0.4);
    v.lean += (clamp(g.vx * 7, -11, 11) - v.lean) * 0.3;
    gsap.set(v.el, { x: v.x, y: v.y, rotation: v.baseRot + v.lean });
    if (trackShake(g, dx, dy, t)) {
      g.shook = true;
      shakePrint(v, 'drag');
    }
  } else if (g.kind === 'swipe' && g.moved) {
    const ddx = x - g.x0;
    if (g.context === 'phone') placePhone(ddx, false);
    else if (g.context === 'lightbox') dragLightbox(ddx);
    if (trackShake(g, dx, dy, t)) {
      g.shook = true;
      const v = g.context === 'lightbox' ? lb.view : tableViews[cur];
      if (v) shakePrint(v, 'drag');
    }
  } else if (g.kind === 'polish') {
    if (trackShake(g, dx, dy, t)) g.polishRevs = (g.polishRevs || 0) + 1;
    if (g.polishRevs >= 2 && g.path > 1400) {
      g.polishRevs = -99;
      tablePolished(x, y);
    }
  }
  g.lx = x;
  g.ly = y;
  g.lt = t;
}

function endGesture(e, cancelled = false) {
  const g = gesture;
  if (!g || e.pointerId !== g.id) return;
  gesture = null;
  const t = performance.now();
  const tap = !cancelled && !g.moved && t - g.t0 < 450;
  if (g.view) g.view.el.classList.remove('is-rubbing');
  if (g.kind === 'rub') persist(g.view.state);
  if (g.kind === 'move' && g.moved) settleView(g.view);
  if (g.kind === 'swipe' && g.moved) {
    const ddx = g.lx - g.x0;
    const fast = Math.abs(g.vx) > 0.45;
    let dir = 0;
    if (!g.shook && (Math.abs(ddx) > Math.min(110, innerWidth * 0.22) || (fast && Math.abs(ddx) > 30))) dir = ddx < 0 ? 1 : -1;
    if (g.context === 'phone') goTo(cur + dir);
    else if (g.context === 'lightbox') releaseLightbox(dir);
  }
  if (tap && g.view) activate(g.view, 'tap');
  else if (tap && !g.view && g.context === 'lightbox') requestClose('photo');
  if (g.shook) maybeAskMotion();
}

table.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.print');
  const view = el ? tableViews.find((v) => v.el === el) : null;
  if (el && !view) return;
  if (!beginGesture(e, view, mode === 'phone' ? 'phone' : 'table')) return;
  table.setPointerCapture(e.pointerId);
  if (e.pointerType === 'mouse') e.preventDefault();
});
table.addEventListener('pointermove', (e) => {
  if (gesture) {
    moveGesture(e);
    return;
  }
  if (e.pointerType !== 'mouse') return;
  const el = e.target.closest('.print');
  const view = el && tableViews.find((v) => v.el === el);
  if (view) setGloss(view, localPoint(windowGeo(view), e.clientX, e.clientY));
});
table.addEventListener('pointerup', (e) => endGesture(e));
table.addEventListener('pointercancel', (e) => endGesture(e, true));
table.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const i = tableViews.findIndex((v) => v.el === document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  const next = clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, tableViews.length - 1);
  if (mode === 'phone') goTo(next);
  tableViews[next].el.focus({ preventScroll: true });
});

function liftView(view) {
  view.el.classList.add('is-lifted');
  view.el.style.zIndex = String(++zTop);
  view.lean = 0;
  gsap.to(view.el, { scale: 1.045, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
}

function settleView(view) {
  view.el.classList.remove('is-lifted');
  const W = table.clientWidth;
  const H = table.clientHeight;
  view.baseRot = clamp(view.baseRot + view.lean * 0.35, -12, 12);
  view.rot = view.baseRot;
  view.lean = 0;
  posMemory.set(view.photo.file, {
    nx: (view.x + view.pw / 2) / W,
    ny: (view.y + view.h / 2) / H,
    rot: view.baseRot,
  });
  if (reduced) gsap.set(view.el, { scale: 1, rotation: view.baseRot });
  else gsap.to(view.el, { scale: 1, rotation: view.baseRot, duration: 0.55, ease: 'back.out(2.2)' });
}

function wiggle(view) {
  if (reduced) return;
  const base = view.baseRot;
  gsap.killTweensOf(view.el, 'rotation');
  gsap.fromTo(
    view.el,
    { rotation: base },
    {
      keyframes: [
        { rotation: base - 3.5, duration: 0.08 },
        { rotation: base + 3, duration: 0.1 },
        { rotation: base - 1.8, duration: 0.1 },
        { rotation: base, duration: 0.16, ease: 'power2.out' },
      ],
    },
  );
}

function activate(view, how) {
  const st = view.state;
  if (!view.large && mode === 'phone') {
    const i = tableViews.indexOf(view);
    if (i !== cur) {
      goTo(i);
      return;
    }
  }
  if (st.ready) {
    if (!view.large) navigate(`#/photo/${view.photo.album}/${view.photo.index + 1}`);
    return;
  }
  if (reduced) {
    st.fadeIn(performance.now(), 650);
    hideCueForever();
    kick();
    return;
  }
  if (how === 'key') {
    st.flood(performance.now(), 0, 0.5, 0.5);
    hideCueForever();
    kick();
    return;
  }
  wiggle(view);
  note(u('shy'), view.el);
}

// ---------------------------------------------------------------- the shake joke
const supportsMotion = typeof window.DeviceMotionEvent !== 'undefined' && matchMedia('(pointer: coarse)').matches;

function shakePrint(view, source) {
  const t = performance.now();
  if (t - lastShakeAt < 2400) return;
  lastShakeAt = t;
  const st = view.state;
  if (st.developed) return;
  st.nudge(0.085);
  kick();
  setTimeout(() => persist(st), 1600);
  let text = u('shake');
  if (source === 'drag' && supportsMotion) text += ' ' + u('shakePhone');
  note(text, view.el, { long: true });
}

function shakeDevice() {
  let target = null;
  if (lb.view) target = lb.view;
  else if (mode === 'phone') target = tableViews[cur];
  if (target) {
    if (!reduced) {
      gsap.fromTo(
        target.el,
        { x: target.x },
        { keyframes: [{ x: target.x - 9 }, { x: target.x + 8 }, { x: target.x - 5 }, { x: target.x }], duration: 0.36 },
      );
    }
    shakePrint(target, 'device');
    return;
  }
  // Tablet on the table: every print on it gets a tiny bit.
  const t = performance.now();
  if (t - lastShakeAt < 2400) return;
  lastShakeAt = t;
  const undeveloped = tableViews.filter((v) => !v.state.developed);
  if (!undeveloped.length) return;
  undeveloped.forEach((v) => v.state.nudge(0.085));
  kick();
  note(u('shake'), null, { long: true });
}

let motionAsked = false;
let motionOn = false;
const peaks = [];
function onMotion(e) {
  let m = 0;
  const a = e.acceleration;
  if (a && a.x != null) m = Math.hypot(a.x, a.y, a.z);
  else {
    const g = e.accelerationIncludingGravity;
    if (!g || g.x == null) return;
    m = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
  }
  if (m < 14) return;
  const t = performance.now();
  if (peaks.length && t - peaks[peaks.length - 1] < 110) return;
  peaks.push(t);
  while (peaks.length && t - peaks[0] > 1100) peaks.shift();
  if (peaks.length >= 3) {
    peaks.length = 0;
    shakeDevice();
  }
}
function listenMotion() {
  if (motionOn) return;
  motionOn = true;
  window.addEventListener('devicemotion', onMotion);
}
if (supportsMotion && typeof DeviceMotionEvent.requestPermission !== 'function') listenMotion();
function maybeAskMotion() {
  if (motionAsked || motionOn || !supportsMotion) return;
  motionAsked = true;
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then((s) => {
        if (s === 'granted') listenMotion();
      })
      .catch(() => {});
  }
}

let lastPolish = 0;
function tablePolished(x, y) {
  const t = performance.now();
  if (t - lastPolish < 25000) return;
  lastPolish = t;
  note(u('tableRub'), null, { at: { x, y } });
}

// ---------------------------------------------------------------- develop all / reset
$('developAll').addEventListener('click', () => {
  const list = album.photos.map((p) => states.get(p.file)).filter((st) => !st.developed);
  if (!list.length) {
    note(u('developAllNone'));
    return;
  }
  const now = performance.now();
  developingAll = true;
  const rnd = Math.random;
  list.forEach((st, i) => {
    if (reduced) st.fadeIn(now + i * 90, 700);
    else {
      const side = Math.floor(rnd() * 4);
      const r = rnd();
      const [ox, oy] = [
        [0, r],
        [1, r],
        [r, 0],
        [r, 1],
      ][side];
      st.flood(now, i * 150, ox, oy);
    }
  });
  hideCueForever();
  note(u('developAllDone'));
  kick();
});

$('reset').addEventListener('click', () => {
  const list = album.photos.map((p) => states.get(p.file)).filter((st) => st.mean > 0 || st.developed || st.busy);
  if (!list.length) {
    note(u('resetNone'));
    return;
  }
  const now = performance.now();
  developingAll = false;
  list.forEach((st, i) => {
    if (reduced) st.reset();
    else st.undevelop(now + i * 60, 1100);
    delete store.prints[st.file];
    for (const v of viewsOf(st)) {
      eraseCaption(v);
      labelView(v);
    }
  });
  save();
  updateBoxes();
  note(u('resetDone'));
  if (mode === 'phone') goTo(0);
  kick();
});

// ---------------------------------------------------------------- rub cue (first visit)
function hideCueForever() {
  if (!store.rubbed) {
    store.rubbed = true;
    save();
  }
  placeRubcue();
}

function placeRubcue() {
  const target =
    mode === 'phone' ? tableViews[cur] : tableViews.find((v) => !v.state.developed && !v.state.touched);
  const show = !store.rubbed && target && !target.state.developed && !lb.open;
  rubcue.classList.toggle('is-on', !!show);
  if (!show) return;
  // Use the print's resting place, not wherever it is mid-flight.
  const tr = table.getBoundingClientRect();
  const sr = scene.getBoundingClientRect();
  const imgW = target.pw * (1 - 2 * M);
  const imgH = imgW / target.state.aspect;
  const rot = (target.baseRot * Math.PI) / 180;
  const off = target.pw * M + imgH / 2 - target.h / 2;
  const cx = tr.left + target.x + target.pw / 2 - off * Math.sin(rot);
  const cy = tr.top + target.y + target.h / 2 + off * Math.cos(rot);
  rubcue.style.setProperty('--x', `${cx - sr.left}px`);
  rubcue.style.setProperty('--y', `${cy - sr.top}px`);
  rubcue.style.setProperty('--s', `${clamp(Math.min(imgW, imgH) / 200, 0.7, 1.6)}`);
}

// ---------------------------------------------------------------- notes
function note(text, anchor = null, opts = {}) {
  const el = document.createElement('div');
  el.className = 'note';
  el.textContent = text;
  el.style.setProperty('--r', `${(Math.random() * 2 - 1) * 2.5}deg`);
  notesEl.append(el);
  const live = $('live');
  live.textContent = '';
  setTimeout(() => (live.textContent = text), 30);
  while (notesEl.children.length > 2) notesEl.firstElementChild.remove();

  const nr = el.getBoundingClientRect();
  let x;
  let y;
  if (opts.at) {
    x = opts.at.x - nr.width / 2;
    y = opts.at.y - nr.height - 24;
  } else if (anchor) {
    const r = anchor.getBoundingClientRect();
    x = r.left + r.width / 2 - nr.width / 2;
    y = r.top - nr.height - 10;
    if (y < 70) y = r.top + Math.min(r.height * 0.25, 60);
  } else {
    const br = (mode === 'phone' ? $('phoneActions') : table).getBoundingClientRect();
    x = innerWidth / 2 - nr.width / 2;
    y = mode === 'phone' ? br.top - nr.height - 12 : br.bottom - nr.height - 16;
  }
  x = clamp(x, 12, innerWidth - nr.width - 12);
  y = clamp(y, 12, innerHeight - nr.height - 12);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  requestAnimationFrame(() => el.classList.add('is-in'));
  const life = (opts.long ? 4200 : 3200) + text.length * 25;
  setTimeout(() => {
    el.classList.remove('is-in');
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 500);
  }, life);
}

// ---------------------------------------------------------------- lightbox
const lb = { open: false, album: null, index: 0, view: null, source: null, returnFocus: null, closing: null };

function lightboxSize(view) {
  const sr = lbStage.getBoundingClientRect();
  const hf = frameHF(view.state.aspect);
  const phone = innerWidth < 700;
  const availW = sr.width - (phone ? 24 : 40);
  const availH = sr.height - (phone ? 16 : 30);
  return Math.max(160, Math.min(availW, availH / hf, 820));
}

function placeLightboxView(view) {
  const sr = lbStage.getBoundingClientRect();
  sizeView(view, lightboxSize(view));
  view.x = sr.width / 2 - view.pw / 2;
  view.y = sr.height / 2 - view.h / 2;
  view.baseRot = view.rot = 0;
}

function mountLightboxView(photo) {
  const v = createView(photo, true);
  lbStage.append(v.el);
  placeLightboxView(v);
  return v;
}

function updateLightboxMeta() {
  if (!lb.open || !lb.view) return;
  const a = albumBySlug.get(lb.album);
  $('lbAlbum').textContent = Blog.text(a.title);
  $('lbCount').textContent = u('photoOf', { i: lb.index + 1, n: a.photos.length });
  $('lbPrev').setAttribute('aria-label', u('prevPhoto'));
  $('lbNext').setAttribute('aria-label', u('nextPhoto'));
  $('lbClose').setAttribute('aria-label', u('closePhoto'));
  lightbox.setAttribute('aria-label', `${Blog.text(a.title)}: ${u('photoOf', { i: lb.index + 1, n: a.photos.length })}`);
}

function sourceViewFor(photo) {
  return tableViews.find((v) => v.photo.file === photo.file) || null;
}

function showLightbox(slug, index) {
  const a = albumBySlug.get(slug);
  const photo = a.photos[index];
  if (slug !== albumSlug) setAlbum(slug, false);
  if (lb.open && lb.view && lb.index === index && lb.album === slug) return;

  if (!lb.open) {
    lb.open = true;
    lb.album = slug;
    lb.index = index;
    lb.returnFocus = document.activeElement;
    if (lb.closing) {
      // Reopened while the last print was still flying home: put the table back in order first.
      lb.closing.kill?.();
      lb.closing = null;
      if (mode === 'phone') placePhone(0, false);
      else tableViews.forEach((t) => (t.el.style.visibility = ''));
    }
    lbStage.querySelectorAll('.print').forEach((el) => {
      const v = [...views].find((x) => x.el === el);
      if (v) destroyView(v);
    });
    lightbox.hidden = false;
    scene.inert = true;
    lightbox.classList.remove('is-leaving');
    void lightbox.offsetWidth;
    lightbox.classList.add('is-open');
    const v = mountLightboxView(photo);
    lb.view = v;
    flyFromSource(v, sourceViewFor(photo));
    rubcue.classList.remove('is-on');
    updateLightboxMeta();
    requestAnimationFrame(() => $('lbClose').focus({ preventScroll: true }));
    kick();
    return;
  }
  // navigate inside the lightbox
  const dir = index > lb.index ? 1 : -1;
  const wrapDir = lb.pendingDir || dir;
  lb.pendingDir = 0;
  swapLightbox(photo, index, wrapDir);
}

function flyFromSource(v, src) {
  if (lb.source) lb.source.el.style.visibility = '';
  lb.source = src;
  if (!src || reduced) {
    gsap.set(v.el, { x: v.x, y: v.y, rotation: 0, scale: 1, opacity: 1 });
    if (src && reduced) src.el.style.visibility = 'hidden';
    if (!reduced) gsap.from(v.el, { opacity: 0, y: v.y + 30, duration: 0.45, ease: 'power3.out', immediateRender: true });
    else gsap.from(v.el, { opacity: 0, duration: 0.25, immediateRender: true });
    return;
  }
  const sr = src.el.getBoundingClientRect();
  const lr = lbStage.getBoundingClientRect();
  const scale = src.pw / v.pw;
  const sx = sr.left + sr.width / 2 - lr.left - v.pw / 2;
  const sy = sr.top + sr.height / 2 - lr.top - v.h / 2;
  src.el.style.visibility = 'hidden';
  gsap.fromTo(
    v.el,
    { x: sx, y: sy, rotation: Number(gsap.getProperty(src.el, 'rotation')) || 0, scale, opacity: 1 },
    { x: v.x, y: v.y, rotation: 0, scale: 1, duration: 0.75, ease: 'power3.inOut' },
  );
}

function swapLightbox(photo, index, dir) {
  const old = lb.view;
  lb.index = index;
  const v = mountLightboxView(photo);
  lb.view = v;
  if (lb.source) lb.source.el.style.visibility = '';
  lb.source = sourceViewFor(photo);
  if (lb.source) lb.source.el.style.visibility = 'hidden';
  if (mode === 'phone') {
    const i = tableViews.findIndex((t) => t.photo.file === photo.file);
    if (i >= 0) goTo(i, false);
  }
  const W = lbStage.clientWidth;
  if (old) {
    old.el.style.pointerEvents = 'none';
    if (reduced) destroyView(old);
    else {
      gsap.to(old.el, {
        x: old.x - dir * (W * 0.7),
        rotation: -dir * 9,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => destroyView(old),
      });
    }
  }
  if (reduced) {
    gsap.set(v.el, { x: v.x, y: v.y, rotation: 0, scale: 1 });
    gsap.from(v.el, { opacity: 0, duration: 0.25, immediateRender: true });
  } else {
    gsap.fromTo(
      v.el,
      { x: v.x + dir * (W * 0.7), y: v.y, rotation: dir * 10, opacity: 0, scale: 0.96 },
      { x: v.x, rotation: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', delay: 0.05 },
    );
  }
  updateLightboxMeta();
  kick();
}

function hideLightbox() {
  if (!lb.open) return;
  lb.open = false;
  const v = lb.view;
  const src = lb.source;
  lb.view = null;
  lb.source = null;
  scene.inert = false;
  lightbox.classList.remove('is-open');
  lightbox.classList.add('is-leaving');
  const finish = () => {
    if (v) destroyView(v);
    if (src) src.el.style.visibility = '';
    lightbox.hidden = true;
    lightbox.classList.remove('is-leaving');
    lb.closing = null;
    placeRubcue();
  };
  if (v && src && !reduced && document.contains(src.el)) {
    if (mode === 'phone') placePhone(0, false);
    const sr = src.el.getBoundingClientRect();
    const lr = lbStage.getBoundingClientRect();
    const scale = src.pw / v.pw;
    gsap.killTweensOf(v.el);
    lb.closing = gsap.to(v.el, {
      x: sr.left + sr.width / 2 - lr.left - v.pw / 2,
      y: sr.top + sr.height / 2 - lr.top - v.h / 2,
      rotation: Number(gsap.getProperty(src.el, 'rotation')) || 0,
      scale,
      duration: 0.6,
      ease: 'power3.inOut',
      onComplete: finish,
    });
  } else if (v && !reduced) {
    lb.closing = gsap.to(v.el, { opacity: 0, y: v.y + 30, duration: 0.3, onComplete: finish });
  } else {
    setTimeout(finish, reduced ? 120 : 0);
  }
  const rf = (src && src.el) || lb.returnFocus;
  if (rf && document.contains(rf)) rf.focus({ preventScroll: true });
}

function dragLightbox(dx) {
  const v = lb.view;
  if (!v) return;
  gsap.set(v.el, { x: v.x + dx, rotation: dx * 0.02 });
}

function releaseLightbox(dir) {
  const v = lb.view;
  if (!v) return;
  if (dir) {
    lightboxStep(dir);
    return;
  }
  gsap.to(v.el, { x: v.x, rotation: 0, duration: 0.45, ease: 'back.out(1.8)' });
}

function lightboxStep(dir) {
  const a = albumBySlug.get(lb.album);
  const n = a.photos.length;
  const next = (lb.index + dir + n) % n;
  lb.pendingDir = dir;
  navigate(`#/photo/${lb.album}/${next + 1}`, true);
}

$('lbPrev').addEventListener('click', () => lightboxStep(-1));
$('lbNext').addEventListener('click', () => lightboxStep(1));
$('lbClose').addEventListener('click', () => requestClose('photo'));
lightbox.querySelector('.lightbox__backdrop').addEventListener('click', () => requestClose('photo'));

lbStage.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.print');
  const view = el && lb.view && lb.view.el === el ? lb.view : null;
  if (el && !view) return;
  if (!beginGesture(e, view, 'lightbox')) return;
  lbStage.setPointerCapture(e.pointerId);
  if (e.pointerType === 'mouse') e.preventDefault();
});
lbStage.addEventListener('pointermove', (e) => {
  if (gesture) moveGesture(e);
  else if (e.pointerType === 'mouse' && lb.view && e.target.closest('.print')) {
    setGloss(lb.view, localPoint(windowGeo(lb.view), e.clientX, e.clientY));
  }
});
lbStage.addEventListener('pointerup', (e) => endGesture(e));
lbStage.addEventListener('pointercancel', (e) => endGesture(e, true));

// ---------------------------------------------------------------- language
function langToggleHTML() {
  const cur = Blog.lang;
  return `<div class="lang lang--reader" role="group" aria-label="${Blog.t('language')}">
    ${['bg', 'en']
      .map(
        (l) => `<button class="lang__print${l === cur ? ' is-active' : ''}" type="button" data-lang="${l}" aria-pressed="${l === cur}"
          aria-label="${l === 'bg' ? u('langBg') : u('langEn')}"><span class="lang__win"><b>${l === 'bg' ? 'БГ' : 'EN'}</b></span></button>`,
      )
      .join('')}
  </div>`;
}

function updateLangToggles() {
  document.querySelectorAll('.lang').forEach((g) => g.setAttribute('aria-label', Blog.t('language')));
  document.querySelectorAll('.lang__print').forEach((b) => {
    const on = b.dataset.lang === Blog.lang;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', b.dataset.lang === 'bg' ? u('langBg') : u('langEn'));
  });
}

$('lang').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lang]');
  if (b) Blog.setLang(b.dataset.lang);
});

function applyLang() {
  document.querySelectorAll('[data-u]').forEach((el) => (el.textContent = u(el.dataset.u)));
  document.querySelectorAll('[data-t]').forEach((el) => (el.textContent = Blog.t(el.dataset.t)));
  document.querySelectorAll('[data-site="name"]').forEach((el) => (el.textContent = Blog.text(Blog.site.name)));
  $('home').setAttribute('aria-label', `${Blog.text(Blog.site.name)}: ${Blog.text(Blog.site.tagline)}`);
  $('home').title = Blog.text(Blog.site.nameMeaning);
  const credits = $('credits');
  credits.href = Blog.creditsUrl;
  $('listLink').setAttribute('aria-label', Blog.t('listView'));
  updateLangToggles();
  updateAlbumHead();
  updateBoxes();
  updateHint();
  updatePager();
  for (const v of views) {
    labelView(v);
    if (v.capShown) {
      if (reduced) writeCaption(v, false);
      else {
        v.cap.classList.add('is-erasing');
        setTimeout(() => {
          v.cap.classList.remove('is-erasing');
          if (v.capShown) writeCaption(v, true);
        }, 260);
      }
    }
  }
  updateLightboxMeta();
  reader.refresh();
  if (!reader.postOpen) document.title = `${Blog.text(Blog.site.name)} · ${u('docTitle')}`;
}
Blog.onLangChange(applyLang);

// ---------------------------------------------------------------- reader + list
const reader = createReader({
  reduced: () => reduced,
  langToggleHTML,
  onLangClick: (l) => Blog.setLang(l),
  albumProgress,
  onAlbum: (slug) => navigate(`#/album/${slug}`, true),
  requestClose: (k) => requestClose(k),
});

// ---------------------------------------------------------------- router
let clickPoint = null;
function parseRoute() {
  const parts = location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  if (parts[0] === 'post' && Blog.post(parts[1])) return { name: 'post', slug: parts[1] };
  if (parts[0] === 'list') return { name: 'list' };
  if (parts[0] === 'photo' && albumBySlug.has(parts[1])) {
    const a = albumBySlug.get(parts[1]);
    const i = parseInt(parts[2], 10) - 1;
    if (i >= 0 && i < a.photos.length) return { name: 'photo', album: a.slug, index: i };
  }
  if (parts[0] === 'album' && albumBySlug.has(parts[1])) return { name: 'album', album: parts[1] };
  return { name: 'home' };
}

let prevRouteName = null;
function applyRoute(initial = false) {
  const r = parseRoute();
  if (r.album && r.album !== albumSlug && r.name !== 'photo') setAlbum(r.album, !initial);
  if (r.name === 'list') reader.openList();
  else reader.closeList();
  if (r.name === 'photo') showLightbox(r.album, r.index);
  else hideLightbox();
  if (r.name === 'post') reader.openPost(r.slug, clickPoint);
  else reader.closePost();
  clickPoint = null;
  const overlay = r.name === 'list' || r.name === 'post' || r.name === 'photo';
  scene.inert = overlay;
  lightbox.inert = r.name === 'post';
  $('list').inert = r.name === 'post';
  if (r.name !== 'post') document.title = `${Blog.text(Blog.site.name)} · ${u('docTitle')}`;
  prevRouteName = r.name;
  if (!overlay) placeRubcue();
}

function depth() {
  return (history.state && history.state.depth) || 0;
}
function navigate(hash, replace = false) {
  if (location.hash === hash) {
    applyRoute();
    return;
  }
  if (replace) history.replaceState({ depth: depth() }, '', hash);
  else history.pushState({ depth: depth() + 1 }, '', hash);
  applyRoute();
}
// Back/forward and hand-edited hashes both land here; applyRoute is idempotent.
window.addEventListener('popstate', () => applyRoute());
window.addEventListener('hashchange', () => applyRoute());

function requestClose(kind) {
  if (depth() > 0) {
    history.back();
    return;
  }
  const base = `#/album/${albumSlug}`;
  if (kind === 'post' && prevRouteName === 'post') navigate(base, true);
  else navigate(base, true);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  clickPoint = { x: e.clientX, y: e.clientY };
  const href = a.getAttribute('href');
  if (href === '#/') {
    if (reader.postOpen || reader.listOpen || lb.open) requestClose('any');
    return;
  }
  navigate(href, a.hasAttribute('data-replace'));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (reader.postOpen) requestClose('post');
    else if (lb.open) requestClose('photo');
    else if (reader.listOpen) requestClose('list');
    return;
  }
  if (lb.open && !reader.postOpen) {
    if (e.key === 'ArrowRight') lightboxStep(1);
    else if (e.key === 'ArrowLeft') lightboxStep(-1);
  }
  if (e.key === 'Tab') trapFocus(e);
});

function trapFocus(e) {
  const root = reader.postOpen ? $('reader') : lb.open ? lightbox : reader.listOpen ? $('list') : null;
  if (!root) return;
  const items = [...root.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter(
    (el) => el.offsetParent !== null || el.getClientRects().length,
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
    e.preventDefault();
    first.focus();
  }
}

// ---------------------------------------------------------------- the table surface
const wood = $('wood');
let woodSize = { w: 0, h: 0 };
function paintWood() {
  const d = Math.min(1.5, window.devicePixelRatio || 1);
  const w = Math.round(innerWidth * d);
  const h = Math.round(innerHeight * d);
  if (w === woodSize.w && h <= woodSize.h && h > woodSize.h * 0.85) return;
  woodSize = { w, h };
  wood.width = w;
  wood.height = h;
  const unit = (innerWidth < 700 ? 190 : 240) * d;
  if (!engine.renderWood(wood, unit)) scene.classList.add('no-webgl');
}
engine.onRestore(() => {
  woodSize = { w: 0, h: 0 };
  paintWood();
  for (const v of views) v.dirty = true;
  kick();
});

// ---------------------------------------------------------------- resize
let resizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    paintWood();
    applyMode();
    layout(false);
    if (lb.open && lb.view) {
      placeLightboxView(lb.view);
      gsap.set(lb.view.el, { x: lb.view.x, y: lb.view.y, rotation: 0, scale: 1 });
    }
    updatePager();
  }, 120);
});

// ---------------------------------------------------------------- boot
renderBoxes();
applyMode();
paintWood();
applyLang();

const initialRoute = parseRoute();
const startAlbum =
  initialRoute.album || (albumBySlug.has(store.album) ? store.album : Blog.albums[0].slug);
history.replaceState({ depth: 0 }, '', location.hash || `#/album/${startAlbum}`);

const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
fontsReady.then(() => {
  scene.classList.add('is-ready');
  setAlbum(startAlbum, initialRoute.name !== 'photo' && initialRoute.name !== 'post');
  applyRoute(true);
  kick();
});

// ---------------------------------------------------------------- tiny GSAP stand-in (only if the CDN fails)
function gsapShim() {
  const st = new WeakMap();
  const get = (el) => {
    if (!st.has(el)) st.set(el, { x: 0, y: 0, rotation: 0, scale: 1 });
    return st.get(el);
  };
  const apply = (el, v) => {
    const s = get(el);
    for (const k of ['x', 'y', 'rotation', 'scale']) if (v[k] != null) s[k] = v[k];
    el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg) scale(${s.scale})`;
    if (v.opacity != null) el.style.opacity = v.opacity;
  };
  const end = (v) => {
    if (v.keyframes) return v.keyframes[v.keyframes.length - 1];
    return v;
  };
  return {
    set: (el, v) => apply(el, v),
    to: (el, v) => {
      apply(el, end(v));
      v.onComplete && setTimeout(v.onComplete, 0);
      return { kill() {} };
    },
    from: (el, v) => {
      if (v.opacity != null) el.style.opacity = '';
      return { kill() {} };
    },
    fromTo: (el, a, b) => {
      apply(el, end(b));
      b.onComplete && setTimeout(b.onComplete, 0);
      return { kill() {} };
    },
    killTweensOf() {},
    getProperty: (el, k) => get(el)[k],
  };
}
