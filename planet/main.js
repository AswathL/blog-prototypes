// Her tiny planet — app shell: UI text, routing, pins, overlays and the bridge to the 3D world.
import { STR, TIES, EGG_POST } from './strings.js';
import { Reader } from './reader.js';
import { Gallery } from './gallery.js';
import { Sound } from './sound.js';

const Blog = window.Blog;
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
const isReduced = () => reducedMQ.matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const lite = coarse || Math.min(window.innerWidth, window.innerHeight) < 600;
const params = new URLSearchParams(location.search);

const T = (key, vars) => {
  const d = STR[Blog.lang] || STR.bg;
  let s = d[key] ?? STR.bg[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
};
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const sound = new Sound();
let world = null;
let worldReady = false;
let resolveReady;
const ready = new Promise((r) => (resolveReady = r));
const bootT = performance.now();

/* ------------------------------------------------------------------ */
/* Day / night                                                        */
/* ------------------------------------------------------------------ */
function clockDayness(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  return smooth(5.5, 7.5, h) * (1 - smooth(18.5, 20.5, h));
}
let dayTarget = params.get('sky') === 'night' ? 0 : params.get('sky') === 'day' ? 1 : clockDayness();
function setSkyAttr() {
  document.body.dataset.sky = dayTarget >= 0.5 ? 'day' : 'night';
  const b = $('#btn-sky');
  b.setAttribute('aria-label', dayTarget >= 0.5 ? T('toNight') : T('toDay'));
  b.title = b.getAttribute('aria-label');
  document.querySelector('meta[name="theme-color"]').content = dayTarget >= 0.5 ? '#bfe0f4' : '#16123a';
}

/* ------------------------------------------------------------------ */
/* Static text                                                        */
/* ------------------------------------------------------------------ */
const LETTERS = ['#ffb86b', '#ff8f70', '#ffd166', '#fff4e0', '#ff9ec4', '#9ee0c4', '#ffd166', '#ff8f70', '#b9a4ff', '#ffb86b'];
function renderBrand(flip = false) {
  const name = Blog.text(Blog.site.name);
  const el = $('#brand-name');
  el.innerHTML = '';
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = name;
  el.append(sr);
  [...name].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch;
    s.style.setProperty('--c', LETTERS[i % LETTERS.length]);
    s.style.setProperty('--r', `${(((i * 37) % 9) - 4) * 1.1}deg`);
    s.style.setProperty('--y', `${(((i * 53) % 5) - 2) * 0.022}em`);
    s.style.setProperty('--i', i);
    el.append(s);
  });
  const brand = $('#brand');
  brand.classList.remove('is-flip');
  if (flip && !isReduced()) {
    void brand.offsetWidth;
    brand.classList.add('is-flip');
  }
}

function applyStatic(flip = false) {
  document.body.dataset.lang = Blog.lang;
  document.title = `${Blog.text(Blog.site.name)} · ${T('planetTitle')}`;
  document.querySelectorAll('[data-blog]').forEach((el) => (el.textContent = Blog.t(el.dataset.blog)));
  document.querySelectorAll('[data-t]').forEach((el) => (el.textContent = T(el.dataset.t)));
  renderBrand(flip);
  $('#tagline').textContent = Blog.text(Blog.site.tagline);
  $('#brand-note').textContent = Blog.text(Blog.site.nameMeaning);
  const n = Blog.posts.length;
  $('#census').innerHTML = (n === 1 ? T('census1') : T('censusN')).replace('{n}', `<strong>${n}</strong>`);
  $('#grows').textContent = T('grows');
  const legend = { story: ['legendHouse', 'legendHouseAria'], opinion: ['legendBox', 'legendBoxAria'], moon: ['legendMoon', 'legendMoonAria'] };
  document.querySelectorAll('[data-legend]').forEach((b) => {
    const [label, aria] = legend[b.dataset.legend];
    b.querySelector('span').textContent = T(label);
    b.setAttribute('aria-label', `${T(label)} — ${T(aria)}`);
  });
  $('#hint').textContent = coarse ? T('hintTouch') : T('hintMouse');
  $('#keys-help').textContent = T('spinKeys');
  const lt = $('#loader-text');
  if (lt) lt.textContent = T('assembling');
  $('#credits').href = Blog.creditsUrl;
  document.querySelectorAll('.lang').forEach((g) => g.setAttribute('aria-label', Blog.t('language')));
  $('#pins').setAttribute('aria-label', Blog.t('allPosts'));
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === Blog.lang)));
  const sb = $('#btn-sound');
  sb.setAttribute('aria-label', T('sound'));
  sb.title = T('sound');
  $('#gallery-close').setAttribute('aria-label', Blog.t('close'));
  $('#list-close').setAttribute('aria-label', Blog.t('close'));
  setSkyAttr();
  updatePinText();
  buildList();
}

/* ------------------------------------------------------------------ */
/* Pins                                                               */
/* ------------------------------------------------------------------ */
const pins = new Map();
let hotPin = null;
function buildPins() {
  const host = $('#pins');
  const make = (id, kind, iconId, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pin is-off';
    b.dataset.kind = kind;
    b.innerHTML = `<span class="pin-dot" aria-hidden="true"><svg class="ic"><use href="#i-${iconId}"/></svg></span><span class="pin-card" aria-hidden="true"><span class="pin-kind"></span><span class="pin-title"></span></span>`;
    b.style.setProperty('--d', `${(pins.size * 0.37) % 2.6}s`);
    b.addEventListener('click', onClick);
    b.addEventListener('pointerenter', () => setHot(id, 'pointer'));
    b.addEventListener('pointerleave', () => setHot(null, 'pointer'));
    b.addEventListener('focus', () => {
      if (b.matches(':focus-visible') && id !== '@moon') world?.present(id);
      setHot(id, 'focus');
    });
    b.addEventListener('blur', () => setHot(null, 'focus'));
    host.append(b);
    pins.set(id, { el: b, card: b.querySelector('.pin-card'), x: -999, y: -999, o: -1, w: 0 });
  };
  for (const post of Blog.posts) make(post.slug, post.type, post.type === 'story' ? 'house' : 'mega', () => openPost(post.slug));
  make('@moon', 'moon', 'moon', () => navigate('#/photos'));
}

function updatePinText() {
  for (const post of Blog.posts) {
    const p = pins.get(post.slug);
    if (!p) continue;
    const v = Blog.view(post);
    p.el.querySelector('.pin-kind').textContent = Blog.t(post.type);
    const t = p.el.querySelector('.pin-title');
    t.textContent = v.title;
    t.lang = v.translated ? Blog.lang : 'bg';
    p.el.setAttribute('aria-label', `${Blog.t(post.type)}: ${v.title}`);
    p.w = 0;
  }
  const m = pins.get('@moon');
  if (m) {
    m.el.querySelector('.pin-kind').textContent = `${T('moonKind')} · ${T('albumsN', { n: Blog.albums.length })}`;
    m.el.querySelector('.pin-title').textContent = T('moonTitle');
    m.el.setAttribute('aria-label', `${T('moonTitle')} (${Blog.albums.length})`);
    m.w = 0;
  }
}

const hotBy = {};
function setHot(id, by) {
  hotBy[by] = id;
  const next = hotBy.focus || hotBy.pointer || hotBy.world || hotBy.legend || null;
  if (next === hotPin) return;
  if (hotPin) pins.get(hotPin)?.el.classList.remove('is-hot');
  hotPin = next;
  if (hotPin) {
    pins.get(hotPin)?.el.classList.add('is-hot');
    if (by !== 'world') sound.pop();
  }
  if (world) world.setHot(hotPin && hotPin !== '@moon' ? hotPin : null);
}

let carried = null;
function carry(slug) {
  if (carried) pins.get(carried)?.el.classList.remove('is-carried');
  carried = slug;
  if (slug) {
    const p = pins.get(slug);
    p?.el.classList.add('is-carried');
    setHot(slug, 'world');
  }
}
function onFrame(anchors) {
  const away = current.view !== 'home' || document.body.classList.contains('is-away');
  const W = window.innerWidth;
  for (const a of anchors) {
    const p = pins.get(a.id);
    if (!p) continue;
    const o = away && a.id !== carried ? 0 : smooth(0.1, 0.32, a.facing);
    if (Math.abs(p.x - a.x) > 0.25 || Math.abs(p.y - a.y) > 0.25) {
      p.el.style.transform = `translate3d(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px,0)`;
      p.x = a.x;
      p.y = a.y;
    }
    if (Math.abs(p.o - o) > 0.02 || (o === 0 && p.o !== 0)) {
      p.el.style.opacity = o.toFixed(2);
      p.o = o;
      p.el.classList.toggle('is-off', o < 0.35);
    }
    if (a.id === hotPin) {
      if (!p.w) p.w = p.card.offsetWidth;
      const half = p.w / 2 + 12;
      const shift = Math.max(half - a.x, 0) - Math.max(a.x + half - W, 0);
      p.card.style.setProperty('--shift', `${shift.toFixed(0)}px`);
      p.el.classList.toggle('is-below', a.y < 170);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Toast + confetti                                                   */
/* ------------------------------------------------------------------ */
let toastTimer = 0;
function toast(text, link) {
  const el = $('#toast');
  el.innerHTML = '';
  const s = document.createElement('span');
  s.textContent = text;
  el.append(s);
  const post = link?.post && Blog.post(link.post);
  const album = link?.album && Blog.albums.find((a) => a.slug === link.album);
  if (post || album) {
    const a = document.createElement('a');
    a.href = post ? `#/post/${post.slug}` : `#/photos/${album.slug}`;
    a.textContent = post ? `${T('readIt')} →` : `${Blog.t('gallery')} →`;
    a.setAttribute('aria-label', post ? `${T('readIt')}: ${Blog.view(post).title}` : `${Blog.t('gallery')}: ${Blog.text(album.title)}`);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideToast();
      if (post) openPost(post.slug);
      else navigate(`#/photos/${album.slug}`);
    });
    el.append(a);
  }
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6500);
}
function hideToast() {
  $('#toast').classList.remove('is-on');
}

function martenitsaConfetti(x, y) {
  const host = $('#confetti');
  const n = isReduced() ? 0 : coarse ? 26 : 40;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    const tassel = i % 7 === 0;
    el.className = tassel ? 'tassel' : 'thread';
    el.style.background = i % 2 ? '#e2453a' : '#fffaf2';
    el.style.boxShadow = i % 2 ? 'none' : '0 0 0 1px rgba(226,69,58,.35)';
    host.append(el);
    const ang = Math.random() * Math.PI * 2;
    const sp = 90 + Math.random() * 180;
    const dx = Math.cos(ang) * sp;
    const dy = Math.sin(ang) * sp * 0.6 - 120;
    const rot = (Math.random() - 0.5) * 900;
    el.animate(
      [
        { transform: `translate(${x}px, ${y}px) rotate(0deg) scale(.4)`, opacity: 1 },
        { transform: `translate(${x + dx}px, ${y + dy}px) rotate(${rot * 0.4}deg) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x + dx * 1.4}px, ${y + dy + 420 + Math.random() * 200}px) rotate(${rot}deg) scale(1)`, opacity: 0 },
      ],
      { duration: 1900 + Math.random() * 900, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' },
    ).finished.then(() => el.remove());
  }
}

/* ------------------------------------------------------------------ */
/* World events                                                       */
/* ------------------------------------------------------------------ */
const EGG_TEXT = { tram: 'tramToast', cat: 'catToast', rocket: 'rocketToast', kuker: 'kukerToast', boat: 'boatToast', stork: 'storkToast', sheep: 'sheepToast' };
const EGG_SOUND = { tram: 'ding', cat: 'meow', rocket: 'liftoff', kuker: 'jingle', boat: 'waves', stork: 'clatter', sheep: 'baa', church: 'chime', sunflowers: 'pop' };
// details that quote a photo caption and lead into its album
const EGG_PHOTO = { church: 'nevsky.jpg', sunflowers: 'sunflowers.jpg' };
function onPick(u, xy) {
  hint(false);
  if (u.kind === 'post') return openPost(u.slug);
  if (u.kind === 'moon') return navigate('#/photos');
  const name = u.kind === 'stork' ? 'stork' : u.egg;
  sound[EGG_SOUND[name]]?.();
  const file = EGG_PHOTO[name];
  if (file) {
    const ph = Blog.photos.find((p) => p.file === file);
    if (ph) toast(Blog.text(ph.caption), { album: ph.album });
    return;
  }
  toast(T(EGG_TEXT[name]), { post: EGG_POST[name] });
  if (name === 'stork') martenitsaConfetti(xy.x, xy.y);
}
function onHover(u) {
  setHot(u && u.kind === 'post' ? u.slug : u && u.kind === 'moon' ? '@moon' : null, 'world');
}

let hintTimer = 0;
function hint(show) {
  const h = $('#hint');
  if (!show) {
    h.classList.add('is-gone');
    clearTimeout(hintTimer);
  }
}

/* ------------------------------------------------------------------ */
/* Routing                                                            */
/* ------------------------------------------------------------------ */
function parse(hash) {
  const m = (hash || '').match(/^#\/(post|photos|list)(?:\/([^/?#]+))?/);
  if (!m) return { view: 'home' };
  const id = m[2] ? decodeURIComponent(m[2]) : null;
  if (m[1] === 'post') return Blog.post(id) ? { view: 'post', slug: id } : { view: 'home' };
  if (m[1] === 'photos') return { view: 'photos', album: id && Blog.albums.some((a) => a.slug === id) ? id : null };
  return { view: 'list' };
}
let current = { view: 'home' };
let chain = Promise.resolve();

function navigate(hash) {
  if (location.hash === hash) return;
  history.pushState({ planet: true }, '', hash);
  route();
}
function replaceRoute(hash) {
  history.replaceState(history.state, '', hash || location.pathname + location.search);
  route();
}
function route() {
  chain = chain.then(() => applyRoute(parse(location.hash))).catch((err) => console.error(err));
}
function closeTop() {
  if (current.view === 'home') return;
  if (history.state && history.state.planet) history.back();
  else replaceRoute('');
}

function openPost(slug) {
  lastFocus = document.activeElement;
  sound.pop();
  navigate(`#/post/${slug}`);
}

let lastFocus = null;
function setAway(on) {
  document.body.classList.toggle('is-away', on);
  app.inert = on;
}

async function applyRoute(r) {
  const c = current;
  if (r.view === c.view && r.slug === c.slug && (r.album || null) === (c.album || null)) return;

  if (r.view === 'post' && c.view === 'post') {
    const post = Blog.post(r.slug);
    const dir = Blog.posts.indexOf(post) > Blog.posts.indexOf(Blog.post(c.slug)) ? 1 : -1;
    current = r;
    if (world && worldReady) {
      world.closeEntrance(c.slug, { instant: true });
      world.focusPost(r.slug, { instant: true });
      world.openEntrance(r.slug, { instant: true });
      world.renderOnce();
    }
    await reader.swap(post, dir);
    return;
  }
  if (r.view === 'photos' && c.view === 'photos') {
    current = r;
    gallery.setAlbum(r.album || Blog.albums[0].slug);
    return;
  }

  await leave(c, r);
  current = r;
  if (r.view === 'post') await enterPost(r.slug);
  else if (r.view === 'photos') await enterPhotos(r.album);
  else if (r.view === 'list') await enterList();
  else afterHome();
}

function afterHome() {
  setAway(false);
  const p = lastFocus;
  lastFocus = null;
  if (p && document.contains(p) && p !== document.body) p.focus({ preventScroll: true });
}

const live = () => world && worldReady;

async function flyHomeAndReveal(next) {
  sound.whoosh();
  // bring the overlay UI back about halfway through the flight home
  const t = setTimeout(() => setAway(next.view === 'list'), isReduced() ? 0 : 650);
  await world.flyHome();
  clearTimeout(t);
  setAway(next.view === 'list');
}

async function leave(c, next) {
  const goingHome = next.view === 'home' || next.view === 'list';
  if (c.view === 'post') {
    if (live()) world.setPaused(false);
    const origin = live() && !isReduced() ? world.getOrigin(c.slug) : null;
    await reader.close(origin);
    if (live()) {
      await world.closeEntrance(c.slug);
      if (goingHome) await flyHomeAndReveal(next);
    } else if (goingHome) setAway(next.view === 'list');
  } else if (c.view === 'photos') {
    if (live()) world.setPaused(false);
    await gallery.close(live() && !isReduced() ? world.getMoonPoint() : null);
    if (live() && goingHome) await flyHomeAndReveal(next);
    else if (goingHome) setAway(next.view === 'list');
  } else if (c.view === 'list') {
    await closeList();
    if (next.view === 'home') setAway(false);
  }
}

async function enterPost(slug) {
  const post = Blog.post(slug);
  setAway(true);
  hideToast();
  let origin = null;
  if (live()) {
    if (isReduced()) {
      world.focusPost(slug, { instant: true });
      world.openEntrance(slug, { instant: true });
    } else {
      carry(slug);
      sound.whoosh();
      await world.focusPost(slug);
      carry(null);
      setHot(null, 'world');
      post.type === 'story' ? sound.door() : sound.shout();
      await world.openEntrance(slug);
      origin = world.getOrigin(slug);
    }
  }
  if (current.view !== 'post' || current.slug !== slug) return;
  await reader.open(post, origin);
  if (live()) world.setPaused(true);
  else
    ready.then(() => {
      if (current.view === 'post' && world) {
        world.focusPost(current.slug, { instant: true });
        world.openEntrance(current.slug, { instant: true });
        world.renderOnce();
        world.setPaused(true);
      }
    });
}

async function enterPhotos(album) {
  setAway(true);
  hideToast();
  let point = null;
  if (live()) {
    if (isReduced()) world.flyToMoon({ instant: true });
    else {
      sound.whoosh();
      await world.flyToMoon();
      point = world.getMoonPoint();
    }
  }
  sound.chime();
  await gallery.open(album || Blog.albums[0].slug, point);
  if (live()) world.setPaused(true);
  else
    ready.then(() => {
      if (current.view === 'photos' && world) {
        world.flyToMoon({ instant: true });
        world.renderOnce();
        world.setPaused(true);
      }
    });
}

/* ------------------------------------------------------------------ */
/* List                                                               */
/* ------------------------------------------------------------------ */
const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function buildList() {
  $('#list-posts').innerHTML = Blog.posts
    .map((p) => {
      const v = Blog.view(p);
      const l = v.translated ? Blog.lang : 'bg';
      return `<li><a class="list-item" data-kind="${p.type}" href="#/post/${p.slug}">
        <span class="li-ic">${icon(p.type === 'story' ? 'house' : 'mega')}</span>
        <span class="li-meta">${esc(Blog.t(p.type))} · ${esc(Blog.date(p.date))} · ${Blog.readMinutes(p)} ${esc(Blog.t('minRead'))}</span>
        <span class="li-title" lang="${l}">${esc(v.title)}</span>
        <span class="li-ex" lang="${l}">${esc(v.excerpt)}</span></a></li>`;
    })
    .join('');
  $('#list-albums').innerHTML = Blog.albums
    .map(
      (a) => `<li><a class="list-item" data-kind="album" href="#/photos/${a.slug}">
        <span class="li-ic">${icon('moon')}</span>
        <span class="li-meta">${a.photos.length} ${esc(Blog.t('photos'))}</span>
        <span class="li-title">${esc(Blog.text(a.title))}</span>
        <span class="li-ex">${esc(Blog.text(a.note))}</span></a></li>`,
    )
    .join('');
}

async function enterList() {
  const lv = $('#listview');
  setAway(true);
  lv.hidden = false;
  const sheet = $('.list-sheet', lv);
  const back = $('.list-backdrop', lv);
  if (!isReduced()) {
    const wide = window.innerWidth > 760;
    back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' });
    await sheet.animate([{ transform: wide ? 'translateX(105%)' : 'translateY(100%)' }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' }).finished;
  }
  $('#list-close').focus({ preventScroll: true });
}

async function closeList() {
  const lv = $('#listview');
  if (lv.hidden) return;
  const sheet = $('.list-sheet', lv);
  const back = $('.list-backdrop', lv);
  if (!isReduced()) {
    const wide = window.innerWidth > 760;
    back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' });
    await sheet.animate([{ transform: 'none' }, { transform: wide ? 'translateX(105%)' : 'translateY(100%)' }], { duration: 380, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' }).finished;
  }
  lv.hidden = true;
  lv.getAnimations({ subtree: true }).forEach((a) => a.cancel());
}

/* ------------------------------------------------------------------ */
/* Controls                                                           */
/* ------------------------------------------------------------------ */
const legendCursor = { story: -1, opinion: -1 };
function setupControls() {
  $('#btn-sky').addEventListener('click', () => {
    dayTarget = dayTarget >= 0.5 ? 0 : 1;
    setSkyAttr();
    world?.setDayness(dayTarget);
    sound.chime();
  });
  $('#btn-sound').addEventListener('click', (e) => {
    const on = sound.toggle();
    e.currentTarget.setAttribute('aria-pressed', String(on));
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang button[data-lang]');
    if (b && b.dataset.lang !== Blog.lang) Blog.setLang(b.dataset.lang);
  });
  Blog.onLangChange(() => {
    applyStatic(true);
    reader.relang();
    gallery.relang();
    world?.spinHop();
    sound.pop();
  });
  document.querySelectorAll('[data-legend]').forEach((b) =>
    b.addEventListener('click', () => {
      const kind = b.dataset.legend;
      hint(false);
      if (kind === 'moon') return navigate('#/photos');
      const list = Blog.posts.filter((p) => p.type === kind);
      if (!list.length) return;
      if (!live()) return navigate('#/list');
      legendCursor[kind] = (legendCursor[kind] + 1) % list.length;
      const slug = list[legendCursor[kind]].slug;
      world.present(slug);
      setHot(slug, 'legend');
      clearTimeout(b._t);
      b._t = setTimeout(() => setHot(null, 'legend'), 5200);
    }),
  );
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    if (a.closest('#listview')) lastFocus = $('.list-link');
    else lastFocus = a;
    navigate(a.getAttribute('href'));
  });
  $('#list-close').addEventListener('click', closeTop);
  $('.list-backdrop').addEventListener('click', closeTop);
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (current.view !== 'home') {
        e.preventDefault();
        closeTop();
      }
      return;
    }
    if (current.view !== 'home' || !world) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (k && !document.activeElement?.closest('.lang, .legend')) {
      e.preventDefault();
      world.keySpin(k[0], k[1]);
      hint(false);
    }
  });
}

const reader = new Reader({
  T,
  reduced: isReduced,
  onClose: closeTop,
  onNav: (slug) => {
    sound.pop();
    replaceRoute(`#/post/${slug}`);
  },
});
const gallery = new Gallery({
  T,
  reduced: isReduced,
  sound,
  onClose: closeTop,
  onAlbum: (slug) => replaceRoute(`#/photos/${slug}`),
});

/* ------------------------------------------------------------------ */
/* Boot                                                               */
/* ------------------------------------------------------------------ */
function revealHome() {
  const loader = $('#loader');
  const wait = Math.max(0, 900 - (performance.now() - bootT));
  setTimeout(() => {
    loader.classList.add('is-done');
    document.body.classList.add('is-ready');
    setTimeout(() => loader.remove(), 1000);
    hintTimer = setTimeout(() => hint(false), 14000);
  }, wait);
}

function noWebgl() {
  const note = $('#list-note');
  note.textContent = T('noWebgl');
  note.hidden = false;
  document.body.classList.add('is-ready', 'no-webgl');
  $('#loader').classList.add('is-done');
  if (current.view === 'home') replaceRoute('#/list');
}

async function boot() {
  buildPins();
  applyStatic();
  setupControls();
  const initial = parse(location.hash);
  const deep = initial.view !== 'home';
  if (deep) {
    document.body.classList.add('is-ready');
    $('#loader').classList.add('is-done');
  }
  route();
  try {
    const { World } = await import('./world.js');
    const ringPhotos = [];
    for (let k = 0; k < 2 && ringPhotos.length < 9; k++)
      for (const a of Blog.albums) if (a.photos[k] && ringPhotos.length < 9) ringPhotos.push({ url: Blog.thumbUrl(a.photos[k].file), w: a.photos[k].w, h: a.photos[k].h });
    world = new World({
      canvas: $('#scene'),
      posts: Blog.posts,
      ties: TIES,
      reduced: isReduced(),
      lite,
      skipIntro: deep,
      dayness: dayTarget,
      ringPhotos,
      onFrame,
      onPick,
      onHover,
      onInteract: () => hint(false),
      onEvent: () => {},
      onFirstFrame: () => {
        worldReady = true;
        resolveReady();
        if (!deep) revealHome();
      },
    });
    world.start();
  } catch {
    noWebgl();
  }
  reducedMQ.addEventListener?.('change', () => {
    if (world) world.reduced = isReduced();
  });
}

boot();
