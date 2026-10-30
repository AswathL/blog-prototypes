import { createGlobe } from './globe.js';
import * as Sound from './audio.js';

const Blog = window.Blog;
const gsap = window.gsap;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- concept strings ---------- */
const L = {
  bg: {
    docTitle: 'снежна топка',
    albumsLabel: 'Албум в глобуса',
    shake: 'Разклати',
    shakeAria: 'Разклати снежната топка',
    nextPhoto: 'Следваща снимка',
    hintDrag: 'Хвани глобуса и го разклати!',
    hintPhone: 'Разклати телефона или глобуса!',
    hintRM: 'Снимките се сменят една след друга.',
    settling: 'снегът се успокоява',
    lookCloser: 'Разгледай отблизо',
    soundOn: 'Изключи звука',
    soundOff: 'Включи звука',
    langAria: 'Език: български. Превключи на английски',
    backToList: 'Към списъка',
    prevPhoto: 'Предишна снимка',
    nextPhotoAria: 'Следваща снимка',
    closePhoto: 'Затвори снимката',
    closeList: 'Затвори списъка',
    putInGlobe: 'Сложи го в глобуса',
    toastMess: 'Ето това вече е истинска бъркотия.',
    toastCatOn: 'Ваня надзърна да види кой чука.',
    toastCatOff: 'Ваня се прибра. Не ѝ пука.',
    toastMartenitsa: 'Ще я махна, когато видя щъркел. Засега чакам.',
    toastPlate: 'Табелката се обръща.',
    webgl: 'Глобусът не тръгна на това устройство, затова ето всичко като списък.',
    photoOf: 'Снимка',
  },
  en: {
    docTitle: 'snow globe',
    albumsLabel: 'Album in the globe',
    shake: 'Shake it',
    shakeAria: 'Shake the snow globe',
    nextPhoto: 'Next photo',
    hintDrag: 'Grab the globe and give it a shake!',
    hintPhone: 'Shake your phone, or the globe!',
    hintRM: 'The photos change one after another.',
    settling: 'the snow is settling',
    lookCloser: 'Take a closer look',
    soundOn: 'Turn sound off',
    soundOff: 'Turn sound on',
    langAria: 'Language: English. Switch to Bulgarian',
    backToList: 'Back to the list',
    prevPhoto: 'Previous photo',
    nextPhotoAria: 'Next photo',
    closePhoto: 'Close the photo',
    closeList: 'Close the list',
    putInGlobe: 'Put it in the globe',
    toastMess: 'Now that’s a proper bărkotiya.',
    toastCatOn: 'Vanya came to see who’s knocking.',
    toastCatOff: 'Vanya went back inside. She doesn’t care.',
    toastMartenitsa: 'It comes off when I see a stork. Still waiting.',
    toastPlate: 'The plate turns around.',
    webgl: 'The globe couldn’t start on this device, so here’s everything as a list.',
    photoOf: 'Photo',
  },
};
const T = (k) => L[Blog.lang][k] ?? L.bg[k] ?? k;
const BLOG_KEYS = new Set(['listView', 'listViewShort', 'allPosts', 'gallery', 'prototypes', 'photoCredits', 'loading']);
function tx(key) {
  if (key === 'siteName') return Blog.text(Blog.site.name);
  if (key === 'tagline') return Blog.text(Blog.site.tagline);
  if (BLOG_KEYS.has(key)) return Blog.t(key);
  return T(key);
}

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = rmq.matches;
const photoDims = new Map(Blog.photos.map((p) => [p.file, p]));
const albumBySlug = (s) => Blog.albums.find((a) => a.slug === s);
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const els = {
  app: $('#app'),
  canvas: $('#scene'),
  stage: $('#stage'),
  albums: $('#albums'),
  track: $('#albumsTrack'),
  plaque: $('#plaque'),
  plaqueHint: $('#plaqueHint'),
  plaquePhoto: $('#plaquePhoto'),
  plaqueAlbum: $('#plaqueAlbum'),
  plaqueCount: $('#plaqueCount'),
  plaqueCaption: $('#plaqueCaption'),
  shake: $('#shakeBtn'),
  shakeLabel: $('#shakeLabel'),
  sound: $('#soundBtn'),
  toast: $('#toast'),
  frost: $('#frost'),
  list: $('#list'),
  listPosts: $('#listPosts'),
  listAlbums: $('#listAlbums'),
  reader: $('#reader'),
  readerScroll: $('#readerScroll'),
  readerArticle: $('#readerArticle'),
  readerProgress: $('#readerProgress'),
  viewer: $('#viewer'),
  viewerFig: $('#viewerFig'),
  viewerPrint: $('#viewerPrint'),
  viewerImg: $('#viewerImg'),
  viewerAlbum: $('#viewerAlbum'),
  viewerCount: $('#viewerCount'),
  viewerCaption: $('#viewerCaption'),
  viewerCap: $('.viewer__cap'),
  loader: $('#loader'),
};

const state = {
  album: Blog.albums[0].slug,
  featured: -1,
  motionOn: false,
  list: false,
  reader: null,
  viewer: null,
};

let globe = null;

/* ---------- static text ---------- */
function renderStatic() {
  $$('[data-t]').forEach((el) => (el.textContent = tx(el.dataset.t)));
  document.title = `${Blog.text(Blog.site.name)} · ${T('docTitle')}`;
  $('#loaderText').textContent = Blog.t('loading');
  $('#creditsLink').href = Blog.creditsUrl;
  $('#brand').setAttribute('aria-label', Blog.text(Blog.site.name));
  els.shakeLabel.textContent = reduced ? T('nextPhoto') : T('shake');
  els.shake.setAttribute('aria-label', reduced ? T('nextPhoto') : T('shakeAria'));
  const on = Sound.isEnabled();
  els.sound.setAttribute('aria-label', on ? T('soundOn') : T('soundOff'));
  els.sound.setAttribute('aria-pressed', String(on));
  $('#listLink').setAttribute('aria-label', Blog.t('listView'));
  $$('[data-close="list"]').forEach((b) => b.setAttribute('aria-label', T('closeList')));
  $$('[data-close="viewer"].closebtn').forEach((b) => b.setAttribute('aria-label', T('closePhoto')));
  $('#viewerPrev').setAttribute('aria-label', T('prevPhoto'));
  $('#viewerNext').setAttribute('aria-label', T('nextPhotoAria'));
  syncLangSwitches(Blog.lang);
  renderHint();
}

function renderHint() {
  els.plaqueHint.textContent = reduced ? T('hintRM') : state.motionOn ? T('hintPhone') : T('hintDrag');
}

/* ---------- language switch ---------- */
function mountLangSwitches() {
  $$('[data-lang-switch]').forEach((host) => {
    host.innerHTML = '<button type="button" class="lang__btn"><span class="lang__opt" data-v="bg">БГ</span><span class="lang__opt" data-v="en">EN</span><span class="lang__bead" aria-hidden="true"></span></button>';
    host.firstChild.addEventListener('click', toggleLang);
  });
}
function syncLangSwitches(lang) {
  $$('.lang__btn').forEach((b) => {
    b.dataset.lang = lang;
    b.setAttribute('aria-label', L[lang].langAria);
    $$('.lang__opt', b).forEach((o) => o.classList.toggle('is-on', o.dataset.v === lang));
  });
}
let langBusy = false;
function toggleLang() {
  if (langBusy) return;
  langBusy = true;
  const next = Blog.lang === 'bg' ? 'en' : 'bg';
  syncLangSwitches(next);
  document.body.classList.add('lang-swap');
  setTimeout(() => Blog.setLang(next), reduced ? 0 : 230);
}
Blog.onLangChange(() => {
  renderStatic();
  syncAlbums();
  if (state.featured >= 0) fillPlaque(state.featured);
  if (state.list) renderList();
  if (state.reader) renderReader(state.reader);
  if (state.viewer) fillViewer(state.viewer.index, false);
  globe?.setLang(Blog.lang);
  requestAnimationFrame(() => {
    document.body.classList.remove('lang-swap');
    langBusy = false;
  });
});

/* ---------- albums (radio dial) ---------- */
let needle;
function buildAlbums() {
  els.track.innerHTML = '';
  Blog.albums.forEach((a, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'album';
    b.setAttribute('role', 'radio');
    b.dataset.slug = a.slug;
    b.innerHTML = `<span class="album__num" aria-hidden="true">${ROMAN[i] || i + 1}</span><span class="albums__name"></span><span class="album__count" aria-hidden="true">${a.photos.length}</span>`;
    b.addEventListener('click', () => chooseAlbum(a.slug));
    els.track.append(b);
  });
  needle = document.createElement('span');
  needle.className = 'albums__needle';
  needle.setAttribute('aria-hidden', 'true');
  els.track.append(needle);
  els.track.addEventListener('keydown', (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    if (!globe || globe.busy) return;
    const i = Blog.albums.findIndex((a) => a.slug === state.album);
    const n = Blog.albums.length;
    const next = Blog.albums[(i + keys[e.key] + n) % n];
    chooseAlbum(next.slug);
    $(`.album[data-slug="${next.slug}"]`, els.track).focus();
  });
}
function syncAlbums() {
  $$('.album', els.track).forEach((b) => {
    const a = albumBySlug(b.dataset.slug);
    const on = a.slug === state.album;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
    $('.albums__name', b).textContent = Blog.text(a.title);
    b.setAttribute('aria-label', `${Blog.text(a.title)}, ${a.photos.length} ${Blog.t('photos')}`);
  });
  placeNeedle();
}
function placeNeedle() {
  const b = $(`.album[data-slug="${state.album}"]`, els.track);
  if (!b || !needle) return;
  if (document.body.dataset.layout === 'side') {
    needle.style.width = '14px';
    needle.style.transform = `translate(0, ${b.offsetTop + b.offsetHeight / 2 - 1}px)`;
  } else {
    const name = $('.albums__name', b);
    needle.style.width = `${name.offsetWidth}px`;
    needle.style.transform = `translate(${b.offsetLeft + name.offsetLeft}px, 0)`;
    const left = b.offsetLeft - (els.track.clientWidth - b.offsetWidth) / 2;
    els.track.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  }
}

async function chooseAlbum(slug) {
  if (!globe || globe.busy || state.album === slug) return;
  state.album = slug;
  syncAlbums();
  setPlaque('settling');
  els.albums.classList.add('is-busy');
  els.shake.disabled = true;
  try {
    await globe.setAlbum(albumBySlug(slug));
  } finally {
    els.albums.classList.remove('is-busy');
    els.shake.disabled = false;
  }
}

/* ---------- plaque ---------- */
function setPlaque(s) {
  els.plaque.dataset.state = s;
  if (s === 'settling') state.featured = -1;
}
function fillPlaque(index) {
  const a = albumBySlug(state.album);
  const p = a.photos[index];
  if (!p) return;
  els.plaqueAlbum.textContent = Blog.text(a.title);
  els.plaqueCount.textContent = `${index + 1} / ${a.photos.length}`;
  els.plaqueCaption.textContent = Blog.text(p.caption);
  els.plaquePhoto.setAttribute('aria-label', `${T('lookCloser')}: ${Blog.text(p.caption)}`);
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('is-on'), 3400);
}

/* ---------- layout ---------- */
function computeLayout() {
  if (!globe) return;
  const W = els.app.clientWidth, H = els.app.clientHeight;
  const topSide = 92, bottomSide = 150;
  const sSide = Math.min(((H - topSide - bottomSide) * 0.95) / 2.3, (W * 0.94) / 2.1);
  const side = W >= 960 && H >= 560 && (W - 2 * sSide * 1.2) / 2 >= 300;
  document.body.dataset.layout = side ? 'side' : 'stack';
  let insets;
  if (side) insets = { top: topSide, bottom: bottomSide };
  else {
    const top = W < 720 ? 66 : 92;
    const topmost = Math.min(els.albums.getBoundingClientRect().top, els.plaque.getBoundingClientRect().top);
    insets = { top, bottom: H - topmost + (W < 720 ? 4 : 16) };
  }
  const m = globe.layout(insets);
  const root = document.documentElement.style;
  root.setProperty('--gx', `${m.cx}px`);
  root.setProperty('--gy', `${m.cy}px`);
  root.setProperty('--gr', `${m.r}px`);
  root.setProperty('--gb', `${m.baseBottom}px`);
  placeNeedle();
}
let layoutQueued = false;
function queueLayout() {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => {
    layoutQueued = false;
    computeLayout();
  });
}

/* ---------- device motion ---------- */
const motionCapable = 'DeviceMotionEvent' in window && window.isSecureContext && matchMedia('(pointer: coarse)').matches;
const grav = { x: 0, y: 0, z: 0, ready: false };
function onMotion(e) {
  if (!globe) return;
  let a = e.acceleration;
  if (!a || a.x == null) {
    // some devices only report acceleration including gravity: high-pass it ourselves
    const g = e.accelerationIncludingGravity;
    if (!g || g.x == null) return;
    if (!grav.ready) Object.assign(grav, { x: g.x, y: g.y, z: g.z, ready: true });
    grav.x += (g.x - grav.x) * 0.08;
    grav.y += (g.y - grav.y) * 0.08;
    grav.z += (g.z - grav.z) * 0.08;
    a = { x: g.x - grav.x, y: g.y - grav.y, z: g.z - grav.z };
  }
  const mag = Math.hypot(a.x, a.y, a.z);
  if (mag < 3.5) return;
  const ang = ((screen.orientation && screen.orientation.angle) || 0) * (Math.PI / 180);
  const x = a.x * Math.cos(ang) + a.y * Math.sin(ang);
  const y = -a.x * Math.sin(ang) + a.y * Math.cos(ang);
  globe.impulse(x, y, a.z);
  if (!state.motionOn) {
    state.motionOn = true;
    renderHint();
  }
}
async function enableMotion() {
  if (!motionCapable || state.motionAsked) return;
  state.motionAsked = true;
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const r = await DeviceMotionEvent.requestPermission();
      if (r !== 'granted') return;
    }
    window.addEventListener('devicemotion', onMotion);
  } catch {
    /* motion stays off; dragging still works */
  }
}

/* ---------- navigation ---------- */
function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (parts[0] === 'list') return { name: 'list' };
  if (parts[0] === 'post' && Blog.post(parts[1])) return { name: 'post', slug: parts[1] };
  if (parts[0] === 'photo') {
    const a = albumBySlug(parts[1]);
    const n = parseInt(parts[2], 10);
    if (a && n >= 1 && n <= a.photos.length) return { name: 'photo', album: a.slug, index: n - 1 };
  }
  return { name: 'home' };
}
let navOrigin = null;
function go(hash, origin = null) {
  navOrigin = origin;
  history.pushState({ app: true }, '', hash);
  route();
}
function closeTo(fallback) {
  if (history.state && history.state.app) history.back();
  else {
    history.replaceState(null, '', fallback);
    route();
  }
}
function route() {
  const r = parse();
  const origin = navOrigin;
  navOrigin = null;
  const wantList = r.name === 'list' || r.name === 'post';
  const wantReader = r.name === 'post' ? r.slug : null;
  const wantViewer = r.name === 'photo' ? { album: r.album, index: r.index } : null;

  if (wantViewer) {
    if (!state.viewer) showViewer(wantViewer, origin);
    else if (state.viewer.index !== wantViewer.index) fillViewer(wantViewer.index, true);
  } else if (state.viewer) hideViewer();

  if (wantList && !state.list) showList(origin);
  else if (!wantList && state.list) hideList();

  if (wantReader && wantReader !== state.reader) showReader(wantReader, state.reader ? 'swap' : 'open');
  else if (!wantReader && state.reader) hideReader();
  syncInert();
}
function syncInert() {
  const overlay = state.list || state.reader || state.viewer;
  els.app.inert = !!overlay;
  els.list.inert = !!state.reader;
}

/* ---------- frost ---------- */
function frost(on, origin) {
  if (origin) {
    els.frost.style.setProperty('--fx', `${origin.x}px`);
    els.frost.style.setProperty('--fy', `${origin.y}px`);
  }
  els.frost.classList.toggle('is-on', on);
}

function openSheet(el, cls = 'is-open') {
  el.hidden = false;
  el.getBoundingClientRect();
  requestAnimationFrame(() => el.classList.add(cls));
}
function closeSheet(el, after) {
  el.classList.remove('is-open');
  const done = () => {
    if (!el.classList.contains('is-open')) el.hidden = true;
    after?.();
  };
  setTimeout(done, reduced ? 380 : 820);
}

/* ---------- list ---------- */
function renderList() {
  els.listPosts.innerHTML = '';
  Blog.posts.forEach((post) => {
    const v = Blog.view(post);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'post-row';
    a.href = `#/post/${post.slug}`;
    if (!v.translated) a.lang = 'bg';
    a.innerHTML = `
      <span class="post-row__meta" lang="${Blog.lang}"><span class="post-row__type"></span><span class="post-row__date"></span>${v.translated ? '' : '<span class="badge">БГ</span>'}</span>
      <span class="post-row__title"></span>
      <span class="post-row__excerpt"></span>
      <span class="post-row__mood"></span>`;
    $('.post-row__type', a).textContent = Blog.t(post.type);
    $('.post-row__date', a).textContent = Blog.date(post.date);
    $('.post-row__title', a).textContent = v.title;
    $('.post-row__excerpt', a).textContent = v.excerpt;
    $('.post-row__mood', a).textContent = `${Blog.t('mood')}: ${Blog.text(post.mood)}`;
    $('.post-row__mood', a).lang = Blog.lang;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      go(`#/post/${post.slug}`);
    });
    li.append(a);
    els.listPosts.append(li);
  });
  els.listAlbums.innerHTML = '';
  Blog.albums.forEach((al) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'album-row';
    const fan = al.photos.slice(0, 3).map((p) => `<img src="${Blog.thumbUrl(p.file)}" alt="" loading="lazy" decoding="async">`).join('');
    b.innerHTML = `<span class="album-row__fan" aria-hidden="true">${fan}</span><span><span class="album-row__name"></span><span class="album-row__note"></span><span class="album-row__cta"></span></span>`;
    $('.album-row__name', b).textContent = Blog.text(al.title);
    $('.album-row__note', b).textContent = Blog.text(al.note);
    $('.album-row__cta', b).textContent = `${al.photos.length} ${Blog.t('photos')} · ${T('putInGlobe')} →`;
    b.addEventListener('click', () => {
      if (!globe) {
        // no globe on this device: the list is the whole experience, photos open on top of it
        state.album = al.slug;
        go(`#/photo/${al.slug}/1`);
        return;
      }
      closeTo('#/');
      setTimeout(() => chooseAlbum(al.slug), reduced ? 100 : 700);
    });
    li.append(b);
    els.listAlbums.append(li);
  });
}
function showList(origin) {
  state.list = true;
  renderList();
  const r = origin || $('#listLink').getBoundingClientRect();
  frost(true, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  openSheet(els.list);
  setTimeout(() => {
    if (state.list && !state.reader) $('#listTitle').focus({ preventScroll: true });
  }, 60);
  setTimeout(() => state.list && globe?.stop(), 1100);
}
function hideList() {
  state.list = false;
  globe?.start();
  frost(false);
  closeSheet(els.list);
  setTimeout(() => !state.list && $('#listLink').focus({ preventScroll: true }), 50);
}

/* ---------- reader ---------- */
function blockHTML(b) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  if (b.p) return `<p>${esc(b.p)}</p>`;
  if (b.h) return `<h2>${esc(b.h)}</h2>`;
  if (b.quote) return `<blockquote class="pull"><p>${esc(b.quote)}</p></blockquote>`;
  if (b.img) {
    const d = photoDims.get(b.img);
    const cap = esc(Blog.text(b.caption));
    const wh = d ? `width="${d.w}" height="${d.h}"` : '';
    return `<figure class="print"><div class="print__frame"><img src="${Blog.photoUrl(b.img)}" alt="${cap}" ${wh} loading="lazy" decoding="async"></div><figcaption>${cap}</figcaption></figure>`;
  }
  return '';
}
function renderReader(slug) {
  const post = Blog.post(slug);
  const v = Blog.view(post);
  const art = els.readerArticle;
  art.lang = v.translated ? Blog.lang : 'bg';
  const i = Blog.posts.indexOf(post);
  const prev = Blog.posts[i - 1];
  const next = Blog.posts[i + 1];
  const navLink = (p, cls, label) => (p ? `<a class="${cls}" href="#/post/${p.slug}" data-slug="${p.slug}" lang="${Blog.view(p).translated ? Blog.lang : 'bg'}"><small lang="${Blog.lang}">${label}</small><span></span></a>` : '');
  art.innerHTML = `
    <p class="reader__kicker" lang="${Blog.lang}"></p>
    <h1 class="reader__title" id="readerTitle" tabindex="-1"></h1>
    <p class="reader__meta" lang="${Blog.lang}"><span class="m-date"></span><span class="m-time"></span><span><span class="m-moodlabel"></span> <span class="reader__mood"></span></span></p>
    ${v.translated ? '' : `<p class="reader__note" lang="${Blog.lang}"></p>`}
    <div class="reader__body">${v.body.map(blockHTML).join('')}</div>
    <nav class="post-nav" aria-label="${Blog.t('allPosts')}">${navLink(prev, 'is-prev', '← ' + Blog.t('prev'))}${navLink(next, 'is-next', Blog.t('next') + ' →')}</nav>`;
  $('.reader__kicker', art).textContent = Blog.t(post.type);
  $('.reader__title', art).textContent = v.title;
  $('.m-date', art).textContent = Blog.date(post.date);
  $('.m-time', art).textContent = `${Blog.readMinutes(post)} ${Blog.t('minRead')}`;
  $('.m-moodlabel', art).textContent = `${Blog.t('mood')}:`;
  $('.reader__mood', art).textContent = Blog.text(post.mood);
  if (!v.translated) $('.reader__note', art).textContent = Blog.t('onlyBg');
  $$('.post-nav a', art).forEach((a) => {
    $('span', a).textContent = Blog.view(Blog.post(a.dataset.slug)).title;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      history.replaceState(history.state, '', `#/post/${a.dataset.slug}`);
      route();
    });
  });
}
function showReader(slug, mode) {
  if (mode === 'swap') {
    state.reader = slug;
    els.readerArticle.classList.add('is-swapping');
    setTimeout(() => {
      renderReader(slug);
      els.readerScroll.scrollTop = 0;
      els.readerArticle.classList.remove('is-swapping');
      $('#readerTitle').focus({ preventScroll: true });
    }, reduced ? 0 : 280);
    return;
  }
  state.reader = slug;
  renderReader(slug);
  els.readerScroll.scrollTop = 0;
  updateProgress();
  if (!els.frost.classList.contains('is-on')) frost(true, { x: innerWidth / 2, y: innerHeight });
  els.list.classList.add('is-behind');
  openSheet(els.reader);
  setTimeout(() => state.reader && $('#readerTitle').focus({ preventScroll: true }), 80);
  setTimeout(() => state.reader && globe?.stop(), 1000);
}
function hideReader() {
  const was = state.reader;
  state.reader = null;
  els.list.classList.remove('is-behind');
  closeSheet(els.reader);
  setTimeout(() => {
    const row = $(`.post-row[href="#/post/${was}"]`, els.list);
    if (state.list && row) row.focus({ preventScroll: false });
  }, 60);
}
function updateProgress() {
  const s = els.readerScroll;
  const max = s.scrollHeight - s.clientHeight;
  els.readerProgress.style.transform = `scaleX(${max > 0 ? s.scrollTop / max : 0})`;
}
els.readerScroll.addEventListener('scroll', updateProgress, { passive: true });

/* ---------- photo viewer ---------- */
let viewerTl = null;
function viewerSize(p) {
  const narrow = innerWidth < 720;
  const maxW = Math.min(innerWidth - (narrow ? 56 : 240), 1100);
  const maxH = innerHeight - (narrow ? 250 : 260);
  const k = Math.min(maxW / p.w, maxH / p.h);
  return { w: Math.round(p.w * k), h: Math.round(p.h * k) };
}
function fillViewer(index, animate) {
  const a = albumBySlug(state.viewer.album);
  const n = a.photos.length;
  const p = a.photos[index];
  const dir = animate ? (index > state.viewer.index || (state.viewer.index === n - 1 && index === 0) ? 1 : -1) : 0;
  const apply = () => {
    state.viewer.index = index;
    const { w, h } = viewerSize(p);
    els.viewerImg.style.setProperty('--vw', `${w}px`);
    els.viewerImg.style.setProperty('--vh', `${h}px`);
    const cap = Blog.text(p.caption);
    if (!els.viewerImg.src.endsWith(Blog.photoUrl(p.file))) {
      els.viewerImg.src = Blog.thumbUrl(p.file);
      els.viewerImg.classList.add('is-soft');
      const full = new Image();
      full.src = Blog.photoUrl(p.file);
      full.decode().then(() => {
        if (state.viewer && state.viewer.index === index && state.viewer.album === a.slug) {
          els.viewerImg.src = full.src;
          els.viewerImg.classList.remove('is-soft');
        }
      }).catch(() => els.viewerImg.classList.remove('is-soft'));
    }
    els.viewerImg.alt = cap;
    els.viewerAlbum.textContent = Blog.text(a.title);
    els.viewerCount.textContent = `${index + 1} / ${n}`;
    els.viewerCaption.textContent = cap;
  };
  if (!dir || reduced) {
    if (dir && reduced) {
      gsap.to(els.viewerPrint, { opacity: 0, duration: 0.18, onComplete: () => { apply(); gsap.to(els.viewerPrint, { opacity: 1, duration: 0.3 }); } });
    } else apply();
    return;
  }
  viewerTl?.kill();
  els.viewerCap.classList.add('is-swapping');
  viewerTl = gsap.timeline();
  viewerTl.to(els.viewerPrint, { x: -dir * 70, rotation: -dir * 5, opacity: 0, duration: 0.22, ease: 'power2.in' });
  viewerTl.add(() => {
    apply();
    els.viewerCap.classList.remove('is-swapping');
  });
  viewerTl.fromTo(els.viewerPrint, { x: dir * 80, rotation: dir * 6, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
}
function stepViewer(d) {
  if (!state.viewer) return;
  const a = albumBySlug(state.viewer.album);
  const n = a.photos.length;
  const next = (state.viewer.index + d + n) % n;
  history.replaceState(history.state, '', `#/photo/${a.slug}/${next + 1}`);
  fillViewer(next, true);
}
function showViewer(want, origin) {
  globe?.start();
  state.viewer = { album: want.album, index: want.index };
  els.viewer.hidden = false;
  gsap.set(els.viewerPrint, { clearProps: 'all' });
  fillViewer(want.index, false);
  const fromGlobe = origin === 'globe' && globe && !reduced ? globe.featuredRect() : null;
  requestAnimationFrame(() => {
    els.viewer.classList.add('is-open');
    const r1 = els.viewerPrint.getBoundingClientRect();
    if (fromGlobe && fromGlobe.width > 4) {
      gsap.fromTo(
        els.viewerPrint,
        { x: fromGlobe.left - r1.left, y: fromGlobe.top - r1.top, scaleX: fromGlobe.width / r1.width, scaleY: fromGlobe.height / r1.height, rotation: -2 },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.9, ease: 'expo.out' }
      );
    } else {
      gsap.fromTo(els.viewerPrint, { opacity: 0, y: reduced ? 0 : 24, scale: reduced ? 1 : 0.94 }, { opacity: 1, y: 0, scale: 1, duration: reduced ? 0.3 : 0.7, ease: 'expo.out' });
    }
  });
  setTimeout(() => state.viewer && $('.viewer__close').focus({ preventScroll: true }), 120);
}
function hideViewer() {
  const v = state.viewer;
  state.viewer = null;
  globe?.start();
  els.viewer.classList.remove('is-open');
  const sameAlbum = globe && v.album === globe.album?.slug;
  if (sameAlbum && globe.featured !== v.index) {
    globe.feature(v.index);
    state.featured = v.index;
    fillPlaque(v.index);
    setPlaque('photo');
  }
  const target = sameAlbum && !reduced && globe.featured === v.index ? globe.featuredRect() : null;
  const r1 = els.viewerPrint.getBoundingClientRect();
  const done = () => {
    els.viewer.hidden = true;
    gsap.set(els.viewerPrint, { clearProps: 'all' });
  };
  viewerTl?.kill();
  if (target && target.width > 4 && !reduced) {
    gsap.to(els.viewerPrint, {
      x: `+=${target.left - r1.left}`, y: `+=${target.top - r1.top}`,
      scaleX: target.width / r1.width, scaleY: target.height / r1.height, rotation: 1.5,
      duration: 0.7, ease: 'expo.inOut', onComplete: done,
    });
    gsap.to(els.viewerPrint, { opacity: 0, duration: 0.25, delay: 0.5 });
  } else {
    gsap.to(els.viewerPrint, { opacity: 0, scale: reduced ? 1 : 0.9, y: reduced ? 0 : 20, duration: reduced ? 0.25 : 0.45, ease: 'power2.in', onComplete: done });
  }
  setTimeout(() => els.plaquePhoto.focus({ preventScroll: true }), 80);
}
function openPhoto(index, origin) {
  go(`#/photo/${state.album}/${index + 1}`, origin);
}

// swipe between photos
(() => {
  let sx = 0, sy = 0, id = null;
  els.viewerFig.addEventListener('pointerdown', (e) => {
    id = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
  });
  els.viewerFig.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    id = null;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) stepViewer(dx < 0 ? 1 : -1);
  });
  els.viewerFig.style.touchAction = 'pan-y';
})();

/* ---------- wiring ---------- */
function wire() {
  $('#listLink').addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.list) go('#/list', e.currentTarget.getBoundingClientRect());
  });
  $('#brand').addEventListener('click', (e) => {
    e.preventDefault();
    if (parse().name !== 'home') closeTo('#/');
  });
  $$('[data-close]').forEach((b) =>
    b.addEventListener('click', () => {
      const what = b.dataset.close;
      if (what === 'reader') closeTo('#/list');
      else closeTo('#/');
    })
  );
  $('#viewerPrev').addEventListener('click', () => stepViewer(-1));
  $('#viewerNext').addEventListener('click', () => stepViewer(1));
  els.plaquePhoto.addEventListener('click', () => state.featured >= 0 && openPhoto(state.featured, 'globe'));
  els.shake.addEventListener('click', () => {
    enableMotion();
    if (!globe) return;
    globe.shake();
    els.shake.classList.remove('is-shaking');
    void els.shake.offsetWidth;
    els.shake.classList.add('is-shaking');
  });
  els.sound.addEventListener('click', () => {
    const on = Sound.setEnabled(!Sound.isEnabled());
    renderStatic();
    if (on) Sound.tink();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.viewer) closeTo('#/');
      else if (state.reader) closeTo('#/list');
      else if (state.list && globe) closeTo('#/');
      return;
    }
    if (state.viewer && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      stepViewer(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  addEventListener('resize', queueLayout);
  visualViewport?.addEventListener('resize', queueLayout);
  document.addEventListener('visibilitychange', () => {
    if (!globe) return;
    if (document.hidden) globe.stop();
    else if (!state.list && !state.reader) globe.start();
  });
  rmq.addEventListener('change', (e) => {
    reduced = e.matches;
    globe?.setReducedMotion(reduced);
    renderStatic();
  });
  // Android: motion events need no permission
  if (motionCapable && typeof DeviceMotionEvent.requestPermission !== 'function') {
    state.motionAsked = true;
    addEventListener('devicemotion', onMotion);
  }
}

function hookGlobe() {
  globe.on('featured', ({ index }) => {
    state.featured = index;
    fillPlaque(index);
    setPlaque('photo');
    Sound.chime();
  });
  globe.on('unfeatured', () => setPlaque('settling'));
  globe.on('openPhoto', ({ index }) => openPhoto(index, 'globe'));
  globe.on('cat', (on) => {
    toast(on ? T('toastCatOn') : T('toastCatOff'));
    if (on) Sound.musicBox();
  });
  globe.on('martenitsa', () => toast(T('toastMartenitsa')));
  globe.on('plate', toggleLang);
  globe.on('knob', () => {
    const i = Blog.albums.findIndex((a) => a.slug === state.album);
    chooseAlbum(Blog.albums[(i + 1) % Blog.albums.length].slug);
  });
  globe.on('mess', () => toast(T('toastMess')));
  globe.on('swish', (p) => Sound.swish(p));
  globe.on('thud', (v) => Sound.thud(v));
  globe.on('tink', () => Sound.tink());
  globe.on('ratchet', () => Sound.ratchet());
  globe.on('clunk', () => Sound.thud(0.5));
  globe.on('firstFrame', () => {
    els.loader.classList.add('is-done');
    document.body.classList.add('is-ready');
  });
}

async function boot() {
  mountLangSwitches();
  renderStatic();
  buildAlbums();
  const first = parse();
  if (first.name === 'photo') state.album = first.album;
  syncAlbums();
  wire();
  document.body.dataset.layout = innerWidth >= 960 ? 'side' : 'stack';
  try {
    await document.fonts.load('700 40px "Cormorant SC"', 'Бъркотия Bărkotiya');
    await Promise.race([document.fonts.load('600 40px Caveat', 'Снимка photo'), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    /* canvases fall back to serif */
  }
  try {
    globe = await createGlobe(els.canvas, { blog: Blog, reducedMotion: reduced, initialAlbum: state.album });
  } catch (err) {
    globe = null;
    document.body.classList.add('no-webgl');
    els.loader.classList.add('is-done');
    els.canvas.hidden = true;
    els.shake.disabled = true;
    go('#/list');
    setTimeout(() => toast(T('webgl')), 900);
    return;
  }
  hookGlobe();
  if (new URLSearchParams(location.search).has('debug')) {
    window.__globe = globe;
    gsap.ticker.lagSmoothing(0); // software-rendered test runs: keep tweens on wall-clock time
  }
  computeLayout();
  if (globe.featured >= 0) {
    state.featured = globe.featured;
    fillPlaque(globe.featured);
    setPlaque('photo');
  }
  globe.start();
  route();
  if (document.fonts?.ready) document.fonts.ready.then(queueLayout);
}

boot();
