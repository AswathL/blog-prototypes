// The endless wall — reader, photo viewer, chrome and the glue (routing, gestures → actions, language).
import {
  EASE,
  HOME,
  STORK_AT,
  buildLayout,
  clamp,
  createCamera,
  createMinimap,
  createWorld,
  done,
  esc,
  h,
  icon,
  makeTextures,
  place,
  reduced,
  retryOnce,
  sound,
  tt,
  wait,
} from './engine.js';

/* ======================= reader ======================= */

// The calm reader. A note on the wall un-tapes, lifts toward you and opens into a page.

export function createReader({ camera, world, onClose, onNavigate, langButton }) {
  const root = document.getElementById('reader');
  const sheet = root.querySelector('.sheet');
  const scroll = root.querySelector('.sheet__scroll');
  const content = root.querySelector('.sheet__content');
  const backdrop = root.querySelector('.reader__backdrop');
  const closeBtn = root.querySelector('.sheet__close');
  const tools = root.querySelector('.sheet__tools');
  closeBtn.innerHTML = icon('close');
  tools.prepend(langButton);

  let current = null;
  let origin = 'wall';
  let savedCam = null;
  let busy = false;
  let returnFocus = null;

  closeBtn.addEventListener('click', () => onClose());
  backdrop.addEventListener('click', () => onClose());
  scroll.addEventListener('scroll', () => sheet.classList.toggle('is-scrolled', scroll.scrollTop > 30), { passive: true });
  content.addEventListener('click', (e) => {
    const a = e.target.closest('[data-nav]');
    if (!a) return;
    e.preventDefault();
    onNavigate(a.dataset.slug, a.dataset.nav === 'next' ? 1 : -1);
  });

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter((n) => n.offsetParent);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
    else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
  });

  function photoMeta(file) {
    return window.Blog.photos.find((p) => p.file === file);
  }

  function render(post) {
    const Bl = window.Blog;
    const v = Bl.view(post);
    const idx = Bl.posts.indexOf(post);
    const prev = Bl.posts[idx - 1], next = Bl.posts[idx + 1];
    const variant = post.type === 'opinion' ? Bl.opinions.indexOf(post) % 3 : Bl.stories.indexOf(post) % 4;
    sheet.className = `sheet sheet--${post.type} sheet--v${variant}${scroll.scrollTop > 30 ? ' is-scrolled' : ''}`;
    sheet.lang = v.translated ? Bl.lang : 'bg';
    sheet.setAttribute('aria-label', `${Bl.t(post.type)}: ${v.title}`);
    const body = v.body
      .map((b) => {
        if (b.p) return `<p>${esc(b.p)}</p>`;
        if (b.h) return `<h2>${esc(b.h)}</h2>`;
        if (b.quote) return `<blockquote class="pull"><p>${esc(b.quote)}</p></blockquote>`;
        if (b.img) {
          const m = photoMeta(b.img);
          const cap = Bl.text(b.caption);
          const dims = m ? `width="${m.w}" height="${m.h}"` : '';
          return `<figure class="fig" lang="${Bl.lang}"><div class="fig__ph"><img src="${Bl.photoUrl(b.img)}" alt="${esc(cap)}" loading="lazy" decoding="async" ${dims}></div><figcaption>${esc(cap)}</figcaption></figure>`;
        }
        return '';
      })
      .join('');
    const navLink = (p, dir) => {
      if (!p) return `<span class="pnav pnav--empty"></span>`;
      const pv = Bl.view(p);
      return `<a class="pnav pnav--${dir}" href="#/post/${p.slug}" data-nav="${dir}" data-slug="${p.slug}" lang="${pv.translated ? Bl.lang : 'bg'}"><span class="pnav__l">${dir === 'prev' ? '← ' : ''}${esc(Bl.t(dir))}${dir === 'next' ? ' →' : ''}</span><span class="pnav__t">${esc(pv.title)}</span></a>`;
    };
    content.innerHTML = `
      <header class="sheet__head">
        <p class="sheet__kicker"><span class="sheet__type">${esc(Bl.t(post.type))}</span><time datetime="${post.date}">${esc(Bl.date(post.date))}</time></p>
        <h1 class="sheet__title" id="sheet-title">${esc(v.title)}</h1>
        <p class="sheet__meta"><span>${Bl.readMinutes(post)} ${esc(Bl.t('minRead'))}</span><span class="sheet__mood">${esc(Bl.t('mood'))}: <em>${esc(Bl.text(post.mood))}</em></span></p>
      </header>
      ${v.translated ? '' : `<p class="sheet__only" lang="${Bl.lang}">${esc(Bl.t('onlyBg'))}</p>`}
      <div class="sheet__body">${body}</div>
      <nav class="sheet__nav" aria-label="${esc(Bl.t('allPosts'))}">${navLink(prev, 'prev')}${navLink(next, 'next')}</nav>
      <button class="sheet__back" type="button">${icon('back')}<span>${esc(tt('backToWall'))}</span></button>`;
    content.querySelector('.sheet__back').addEventListener('click', () => onClose());
    content.querySelectorAll('img').forEach(retryOnce);
    closeBtn.setAttribute('aria-label', Bl.t('close'));
  }

  function ghostOf(item, r) {
    const g = item.el.cloneNode(true);
    g.classList.add('ghost');
    g.classList.remove('is-lifted');
    g.removeAttribute('data-id');
    g.removeAttribute('href');
    g.setAttribute('aria-hidden', 'true');
    g.querySelectorAll('.tape,.pin,.magnet,.souvenir,.sheen,.face--ghost,.poster__under').forEach((n) => n.remove());
    g.style.cssText = `position:fixed;left:0;top:0;margin:0;width:${item.w}px;${item.fixedH ? `height:${item.h}px;` : ''}transform-origin:50% 50%;transform:${ghostT(r, item)}`;
    root.append(g);
    return g;
  }
  const ghostT = (r, item, s = r.z, rot = r.r) =>
    `translate(${r.cx - item.w / 2}px,${r.cy - item.h / 2}px) rotate(${rot}deg) scale(${s})`;

  function peel(item, off = true) {
    const hs = item.holders || [];
    hs.forEach((n, i) => {
      const dir = i % 2 ? 1 : -1;
      const kf = [
        { opacity: 1, translate: '0 0', rotate: '0deg' },
        { opacity: 0, translate: `${dir * 26}px -34px`, rotate: `${dir * 28}deg` },
      ];
      n.animate(off ? kf : kf.reverse(), { duration: off ? 260 : 320, delay: i * 50, easing: off ? EASE.in : EASE.out, fill: 'forwards' }).finished.then(
        (a) => !off && n.getAnimations().forEach((x) => x.cancel()),
        () => {}
      );
    });
  }

  async function open(slug, { from = 'wall', focusReturn } = {}) {
    const Bl = window.Blog;
    const post = Bl.post(slug);
    if (!post) return false;
    busy = true;
    current = slug;
    origin = from;
    returnFocus = focusReturn || null;
    const item = world.get('post:' + slug);
    render(post);
    root.hidden = false;
    document.body.classList.add('is-overlay');
    scroll.scrollTop = 0;
    const fromWall = from === 'wall' && item;
    savedCam = fromWall ? camera.snapshot() : null;

    if (fromWall && !reduced()) {
      sheet.style.opacity = '0';
      backdrop.style.opacity = '0';
      const t = camera.fitTarget({ x: item.x, y: item.y, w: item.w, h: item.h }, 0.22, 1.5);
      sound.play('paper');
      await camera.flyTo(t, { rho: 1.1 });
      peel(item, true);
      sound.play('tear');
      await wait(200);
      await lift(item);
    } else {
      if (item) {
        item.el.classList.add('is-lifted');
        if (from !== 'wall') camera.set(camera.fitTarget({ x: item.x, y: item.y, w: item.w, h: item.h }, 0.22, 1.5));
      }
      sheet.style.opacity = '';
      backdrop.style.opacity = '';
      if (reduced()) {
        await done(root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }));
      } else {
        backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
        await done(
          sheet.animate([{ transform: 'translateY(60px) rotate(1.5deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
            duration: 560,
            easing: EASE.out,
          })
        );
      }
    }
    busy = false;
    sheet.focus({ preventScroll: true });
    return true;
  }

  async function lift(item) {
    const r = world.screenRect(item);
    const ghost = ghostOf(item, r);
    item.el.classList.add('is-lifted');
    sheet.style.opacity = '';
    backdrop.style.opacity = '';
    const sr = sheet.getBoundingClientRect();
    const scx = sr.left + sr.width / 2, scy = sr.top + sr.height / 2;
    const fit = Math.min(sr.width / item.w, sr.height / item.h);
    const D = 760;
    const mid = { cx: r.cx + (scx - r.cx) * 0.18, cy: r.cy + (scy - r.cy) * 0.18 - 12 };
    const ga = ghost.animate(
      [
        { transform: ghostT(r, item), opacity: 1 },
        { transform: ghostT({ ...r, ...mid }, item, r.z * 1.07, r.r * 0.3), opacity: 1, offset: 0.26 },
        { opacity: 1, offset: 0.42 },
        { opacity: 0, offset: 0.68 },
        { transform: ghostT({ ...r, cx: scx, cy: scy }, item, fit, 0), opacity: 0 },
      ],
      { duration: D, easing: EASE.inOut, fill: 'forwards' }
    );
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D * 0.8, easing: 'ease-out' });
    const sx = (item.w * r.z) / sr.width, sy = (item.h * r.z) / sr.height;
    sheet.animate(
      [
        { transform: `translate(${r.cx - scx}px,${r.cy - scy}px) rotate(${r.r}deg) scale(${sx},${sy})`, opacity: 0 },
        { transform: `translate(${(mid.cx - scx)}px,${(mid.cy - scy)}px) rotate(${r.r * 0.3}deg) scale(${sx * 1.07},${sy * 1.07})`, opacity: 0.6, offset: 0.26 },
        { opacity: 1, offset: 0.55 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: D, easing: EASE.inOut }
    );
    content.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], {
      duration: 420,
      delay: D * 0.66,
      easing: EASE.out,
      fill: 'backwards',
    });
    sound.play('paper');
    await done(ga);
    ghost.remove();
  }

  async function close() {
    if (!current || busy) return false;
    busy = true;
    const item = world.get('post:' + current);
    if (item && !reduced() && origin !== 'list') {
      if (!world.isOnScreen(item, -40) || camera.z < 0.15) camera.set(camera.fitTarget({ x: item.x, y: item.y, w: item.w, h: item.h }, 0.22, 1.5));
      const r = world.screenRect(item);
      const sr = sheet.getBoundingClientRect();
      const scx = sr.left + sr.width / 2, scy = sr.top + sr.height / 2;
      const fit = Math.min(sr.width / item.w, sr.height / item.h);
      const D = 620;
      content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      const ghost = ghostOf(item, r);
      const ga = ghost.animate(
        [
          { transform: ghostT({ ...r, cx: scx, cy: scy }, item, fit, 0), opacity: 0 },
          { opacity: 1, offset: 0.45 },
          { transform: ghostT(r, item), opacity: 1 },
        ],
        { duration: D, easing: EASE.inOut, fill: 'forwards' }
      );
      const sx = (item.w * r.z) / sr.width, sy = (item.h * r.z) / sr.height;
      sheet.animate(
        [
          { transform: 'none', opacity: 1 },
          { opacity: 1, offset: 0.4 },
          { transform: `translate(${r.cx - scx}px,${r.cy - scy}px) rotate(${r.r}deg) scale(${sx},${sy})`, opacity: 0 },
        ],
        { duration: D, easing: EASE.inOut, fill: 'forwards' }
      );
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D, easing: 'ease-in', fill: 'forwards' });
      sound.play('paper');
      await done(ga);
      item.el.classList.remove('is-lifted');
      ghost.remove();
      peel(item, false);
      sound.play('clack');
    } else {
      await done(root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 160 : 260 }));
      item?.el.classList.remove('is-lifted');
    }
    finish();
    if (savedCam) camera.flyTo(savedCam, { duration: 900 });
    savedCam = null;
    const rf = returnFocus;
    returnFocus = null;
    if (rf && rf.isConnected) rf.focus({ preventScroll: true });
    busy = false;
    return true;
  }

  function finish() {
    root.hidden = true;
    document.body.classList.remove('is-overlay');
    for (const el of [sheet, backdrop, content, root]) el.getAnimations().forEach((a) => a.cancel());
    sheet.style.opacity = '';
    backdrop.style.opacity = '';
    current = null;
  }

  async function swap(slug, dir = 1) {
    if (!current || slug === current) return;
    const Bl = window.Blog;
    const post = Bl.post(slug);
    if (!post) return;
    const old = world.get('post:' + current);
    const m = reduced() ? 0 : 1;
    await done(content.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 40 * m}px)` }], { duration: 180, easing: EASE.in, fill: 'forwards' }));
    if (old) {
      old.el.classList.remove('is-lifted');
      (old.holders || []).forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    }
    current = slug;
    render(post);
    scroll.scrollTop = 0;
    const item = world.get('post:' + slug);
    if (item) {
      item.el.classList.add('is-lifted');
      camera.flyTo(camera.fitTarget({ x: item.x, y: item.y, w: item.w, h: item.h }, 0.22, 1.5), { duration: 700 });
    }
    content.getAnimations().forEach((a) => a.cancel());
    content.animate([{ opacity: 0, transform: `translateX(${dir * 40 * m}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE.out });
    sound.play('paper');
    sheet.focus({ preventScroll: true });
  }

  function relang() {
    if (!current) return;
    const ratio = scroll.scrollTop / Math.max(1, scroll.scrollHeight - scroll.clientHeight);
    render(window.Blog.post(current));
    scroll.scrollTop = ratio * (scroll.scrollHeight - scroll.clientHeight);
    if (!reduced()) content.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 300 });
  }

  return {
    open,
    close,
    swap,
    relang,
    get current() {
      return current;
    },
    get busy() {
      return busy;
    },
  };
}

/* ======================= viewer ======================= */

// Photo viewer: the polaroid/print is unpinned and held up close; flick through the pile.

export function createViewer({ camera, world, onClose, onShow, langButton }) {
  const root = document.getElementById('viewer');
  const backdrop = root.querySelector('.viewer__backdrop');
  const stage = root.querySelector('.viewer__stage');
  const albumEl = root.querySelector('.viewer__album');
  const noteEl = root.querySelector('.viewer__note');
  const countEl = root.querySelector('.viewer__count');
  const strip = root.querySelector('.viewer__strip');
  const prevBtn = root.querySelector('.viewer__nav--prev');
  const nextBtn = root.querySelector('.viewer__nav--next');
  const closeBtn = root.querySelector('.viewer__close');
  root.querySelector('.viewer__tools').prepend(langButton);
  prevBtn.innerHTML = icon('prev');
  nextBtn.innerHTML = icon('next');
  closeBtn.innerHTML = icon('close');

  let album = null, index = 0, card = null, busy = false, returnFocus = null, origin = 'wall';
  const Bl = () => window.Blog;
  const flat = () => Bl().albums.flatMap((a) => a.photos);

  closeBtn.addEventListener('click', () => onClose());
  backdrop.addEventListener('click', () => onClose());
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  strip.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) go(album.slug, +b.dataset.i, +b.dataset.i > index ? 1 : -1);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') (e.preventDefault(), step(1));
    else if (e.key === 'ArrowLeft') (e.preventDefault(), step(-1));
    else if (e.key === 'Tab') {
      const f = [...root.querySelectorAll('button:not([disabled]), a[href]')].filter((n) => n.offsetParent);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
    }
  });

  function step(d) {
    if (!album) return;
    const all = flat();
    const cur = all.indexOf(album.photos[index]);
    const nxt = all[(cur + d + all.length) % all.length];
    go(nxt.album, nxt.index, d);
  }

  function go(slug, i, dir) {
    onShow(slug, i, dir);
  }

  function geometry(photo) {
    const vw = innerWidth, vh = innerHeight;
    const phone = vw < 640;
    const head = root.querySelector('.viewer__head').getBoundingClientRect().bottom;
    const stripH = strip.getBoundingClientRect().height + (phone ? 70 : 40);
    const padX = phone ? 18 : 120;
    const availW = Math.min(vw - padX * 2, 1180), availH = vh - head - stripH - 26;
    stage.style.padding = `${Math.round(head + 10)}px 0 ${Math.round(stripH + 10)}px`;
    const a = photo.h / photo.w;
    const capH = phone ? 66 : 84;
    const b = phone ? 10 : 16;
    let iw = Math.min(availW - 2 * b, (availH - b - capH) / a);
    iw = Math.max(160, iw);
    return { w: Math.round(iw + 2 * b), ih: Math.round(iw * a), b, capH };
  }

  function buildCard(photo) {
    const g = geometry(photo);
    const c = h('figure', { class: 'vprint' });
    c.style.cssText = `width:${g.w}px;--b:${g.b}px;--cap:${g.capH}px`;
    const lo = h('img', { class: 'vprint__lo', src: Bl().thumbUrl(photo.file), alt: '', draggable: 'false' });
    const hi = h('img', { class: 'vprint__hi', alt: Bl().text(photo.caption), draggable: 'false', decoding: 'async' });
    hi.addEventListener('load', () => hi.classList.add('is-in'));
    retryOnce(hi);
    hi.src = Bl().photoUrl(photo.file);
    const ph = h('div', { class: 'vprint__ph', style: `height:${g.ih}px` }, lo, hi);
    const cap = h('figcaption', { class: 'vprint__cap', text: Bl().text(photo.caption) });
    c.append(ph, cap);
    c.style.setProperty('--r', `${((photo.index * 37) % 7) - 3}deg`);
    stage.append(c);
    swipe(c);
    return c;
  }

  function renderChrome() {
    const B = Bl();
    albumEl.textContent = B.text(album.title);
    noteEl.textContent = B.text(album.note);
    countEl.textContent = `${index + 1} / ${album.photos.length}`;
    prevBtn.setAttribute('aria-label', tt('prevPhoto'));
    nextBtn.setAttribute('aria-label', tt('nextPhoto'));
    closeBtn.setAttribute('aria-label', B.t('close'));
    root.setAttribute('aria-label', `${tt('viewerLabel')}: ${B.text(album.title)}`);
    if (strip.dataset.album !== album.slug || strip.dataset.lang !== B.lang) {
      strip.dataset.album = album.slug;
      strip.dataset.lang = B.lang;
      strip.innerHTML = album.photos
        .map(
          (p, i) =>
            `<button type="button" class="vthumb" data-i="${i}" aria-label="${esc(B.text(p.caption))}"><img src="${B.thumbUrl(p.file)}" alt="" loading="lazy" decoding="async" draggable="false"></button>`
        )
        .join('');
    }
    strip.querySelectorAll('.vthumb').forEach((b, i) => b.setAttribute('aria-current', i === index ? 'true' : 'false'));
  }

  function itemFor(slug, i) {
    return world.get(`photo:${slug}:${i}`);
  }

  async function open(slug, i, { from = 'wall', focusReturn } = {}) {
    const a = Bl().albums.find((x) => x.slug === slug);
    if (!a || !a.photos[i]) return false;
    busy = true;
    album = a;
    index = i;
    origin = from;
    returnFocus = focusReturn || null;
    root.hidden = false;
    document.body.classList.add('is-overlay');
    renderChrome();
    card = buildCard(a.photos[i]);
    const item = itemFor(slug, i);
    if (item && from === 'wall' && !reduced() && world.isOnScreen(item, -20)) {
      await flyIn(item);
    } else {
      item?.el.classList.add('is-lifted');
      const m = reduced() ? 0 : 1;
      backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      await done(
        card.animate([{ opacity: 0, transform: `translateY(${40 * m}px) rotate(${4 * m}deg)` }, { opacity: 1, transform: 'none' }], {
          duration: reduced() ? 200 : 520,
          easing: EASE.out,
        })
      );
    }
    busy = false;
    closeBtn.focus({ preventScroll: true });
    return true;
  }

  async function flyIn(item) {
    const r = world.screenRect(item);
    const cr = card.getBoundingClientRect();
    const ccx = cr.left + cr.width / 2, ccy = cr.top + cr.height / 2;
    const ghost = item.el.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.removeAttribute('data-id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelectorAll('.tape,.pin,.magnet,.souvenir,.sheen,.face--ghost').forEach((n) => n.remove());
    const T = (cx, cy, s, rot) => `translate(${cx - item.w / 2}px,${cy - item.h / 2}px) rotate(${rot}deg) scale(${s})`;
    ghost.style.cssText = `position:fixed;left:0;top:0;margin:0;width:${item.w}px;transform-origin:50% 50%;transform:${T(r.cx, r.cy, r.z, r.r)}`;
    root.append(ghost);
    item.el.classList.add('is-lifted');
    sound.play('tear');
    const D = 640;
    const s1 = cr.width / item.w;
    const ga = ghost.animate(
      [
        { transform: T(r.cx, r.cy, r.z, r.r), opacity: 1 },
        { transform: T(r.cx, r.cy - 14, r.z * 1.08, r.r * 0.5), opacity: 1, offset: 0.22 },
        { opacity: 1, offset: 0.55 },
        { transform: T(ccx, ccy, s1, 0), opacity: 0 },
      ],
      { duration: D, easing: EASE.inOut, fill: 'forwards' }
    );
    const s0 = (item.w * r.z) / cr.width;
    card.animate(
      [
        { transform: `translate(${r.cx - ccx}px,${r.cy - ccy}px) rotate(${r.r}deg) scale(${s0})`, opacity: 0 },
        { opacity: 0, offset: 0.3 },
        { opacity: 1, offset: 0.6 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: D, easing: EASE.inOut }
    );
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D, easing: 'ease-out' });
    await done(ga);
    ghost.remove();
  }

  async function show(slug, i, dir = 1) {
    if (!album) return;
    const a = Bl().albums.find((x) => x.slug === slug);
    if (!a || !a.photos[i]) return;
    if (a === album && i === index) return;
    itemFor(album.slug, index)?.el.classList.remove('is-lifted');
    album = a;
    index = i;
    renderChrome();
    itemFor(slug, i)?.el.classList.add('is-lifted');
    const old = card;
    card = buildCard(a.photos[i]);
    sound.play('paper');
    if (reduced()) {
      old.remove();
      return;
    }
    old.style.pointerEvents = 'none';
    done(
      old.animate(
        [
          { transform: old.style.transform || 'none', opacity: 1 },
          { transform: `translateX(${-dir * 70}vw) translateY(-4vh) rotate(${-dir * 16}deg)`, opacity: 0 },
        ],
        { duration: 480, easing: EASE.in, fill: 'forwards' }
      )
    ).then(() => old.remove());
    card.animate(
      [
        { transform: `translateX(${dir * 30}px) scale(.94) rotate(${dir * 4}deg)`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 460, delay: 80, easing: EASE.out, fill: 'backwards' }
    );
  }

  function swipe(c) {
    let sx = 0, sy = 0, id = null, dx = 0, t0 = 0;
    c.addEventListener('pointerdown', (e) => {
      if (busy) return;
      id = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      dx = 0;
      t0 = performance.now();
      c.setPointerCapture(id);
    });
    c.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dy) > Math.abs(dx) * 1.4 && Math.abs(dx) < 12) return;
      c.style.transform = `translateX(${dx}px) rotate(${dx / 30}deg)`;
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (Math.abs(dx) > 90 || (Math.abs(dx) > 30 && v > 0.5)) step(dx < 0 ? 1 : -1);
      else if (dx) {
        c.animate([{ transform: c.style.transform }, { transform: 'none' }], { duration: 300, easing: EASE.spring });
        c.style.transform = '';
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  async function close() {
    if (!album || busy) return false;
    busy = true;
    const item = itemFor(album.slug, index);
    if (item && !reduced() && origin !== 'list') {
      if (!world.isOnScreen(item, -60)) camera.set(camera.fitTarget({ x: item.x, y: item.y, w: item.w, h: item.h }, 0.5, 1));
      const r = world.screenRect(item);
      const cr = card.getBoundingClientRect();
      const ccx = cr.left + cr.width / 2, ccy = cr.top + cr.height / 2;
      const s0 = (item.w * r.z) / cr.width;
      const D = 520;
      const ca = card.animate(
        [
          { transform: card.style.transform || 'none', opacity: 1 },
          { opacity: 1, offset: 0.6 },
          { transform: `translate(${r.cx - ccx}px,${r.cy - ccy}px) rotate(${r.r}deg) scale(${s0})`, opacity: 0 },
        ],
        { duration: D, easing: EASE.inOut, fill: 'forwards' }
      );
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D, fill: 'forwards' });
      root.querySelectorAll('.viewer__head, .viewer__nav, .viewer__count, .viewer__strip').forEach((n) =>
        n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' })
      );
      await done(ca);
      item.el.classList.remove('is-lifted');
      item.face.animate([{ transform: 'scale(1.05)' }, { transform: 'none' }], { duration: 300, easing: EASE.spring });
      sound.play('clack');
    } else {
      await done(root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }));
      item?.el.classList.remove('is-lifted');
    }
    root.hidden = true;
    document.body.classList.remove('is-overlay');
    root.querySelectorAll('*').forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    root.getAnimations().forEach((a) => a.cancel());
    stage.innerHTML = '';
    card = null;
    album = null;
    busy = false;
    const rf = returnFocus;
    returnFocus = null;
    if (rf && rf.isConnected) rf.focus({ preventScroll: true });
    return true;
  }

  function relang() {
    if (!album) return;
    renderChrome();
    const p = album.photos[index];
    const cap = card?.querySelector('.vprint__cap');
    if (cap) cap.textContent = Bl().text(p.caption);
    const hi = card?.querySelector('.vprint__hi');
    if (hi) hi.alt = Bl().text(p.caption);
  }

  addEventListener('resize', () => {
    if (!card || !album) return;
    const g = geometry(album.photos[index]);
    card.style.width = g.w + 'px';
    card.style.setProperty('--b', g.b + 'px');
    card.style.setProperty('--cap', g.capH + 'px');
    card.querySelector('.vprint__ph').style.height = g.ih + 'px';
  });

  return {
    open,
    show,
    close,
    relang,
    get current() {
      return album ? { album: album.slug, index } : null;
    },
    get busy() {
      return busy;
    },
  };
}

/* ======================= ui ======================= */

// Chrome around the wall: magnet dock, language magnets, paste-brush wipe, finder, list view, toasts.

const Bl = () => window.Blog;
const langButtons = new Set();

/* ---------- language magnet ---------- */

export function langToggle(onToggle, extraClass = '') {
  const b = h('button', { class: `langsw ${extraClass}`, type: 'button' });
  b.innerHTML = `<span class="langsw__in" aria-hidden="true"><span class="langsw__f">БГ</span><span class="langsw__b">EN</span></span>`;
  b.addEventListener('click', onToggle);
  langButtons.add(b);
  syncLang(b);
  return b;
}

function syncLang(b) {
  b.dataset.lang = Bl().lang;
  b.setAttribute('aria-label', `${Bl().t('language')}: ${Bl().lang === 'bg' ? 'Български' : 'English'}. ${tt('langTo')}`);
  b.title = tt('langTo');
}

export function syncLangButtons() {
  langButtons.forEach(syncLang);
}

/* ---------- the paste brush ---------- */

export function pasteWipe() {
  const el = document.querySelector('.wipe');
  el.hidden = false;
  const D = 900;
  const a = el.firstElementChild.animate(
    [
      { transform: 'translateX(-40vw) rotate(4deg)' },
      { transform: 'translateX(calc(100vw + 40px)) rotate(-3deg)' },
    ],
    { duration: D, easing: 'cubic-bezier(.45,.05,.4,1)' }
  );
  done(a).then(() => (el.hidden = true));
  return D;
}

/* ---------- toast (handwritten note that drops in) ---------- */

let toastT = 0;
export function toast(title, text, { kind = '' } = {}) {
  const el = document.querySelector('.toast');
  el.className = `toast ${kind}`;
  el.innerHTML = `<strong>${esc(title)}</strong>${text ? `<span>${esc(text)}</span>` : ''}`;
  el.hidden = false;
  if (!reduced())
    el.animate([{ transform: 'translate(-50%, -30px) rotate(-6deg)', opacity: 0 }, { transform: 'translate(-50%,0) rotate(-1.5deg)', opacity: 1 }], {
      duration: 520,
      easing: EASE.slap,
    });
  clearTimeout(toastT);
  toastT = setTimeout(async () => {
    if (!reduced()) await done(el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%, 20px) rotate(2deg)' }], { duration: 300, fill: 'forwards' }));
    el.hidden = true;
    el.getAnimations().forEach((x) => x.cancel());
  }, 4200);
}

/* ---------- confetti of red & white threads ---------- */

export function threads(x, y) {
  if (reduced()) return;
  const layer = document.querySelector('.fx');
  for (let i = 0; i < 26; i++) {
    const t = h('i', { class: 'thread-bit' });
    t.style.cssText = `left:${x}px;top:${y}px;--c:${i % 2 ? '#d3222c' : '#fbf7ee'}`;
    layer.append(t);
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 220;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 80;
    done(
      t.animate(
        [
          { transform: 'translate(-50%,-50%) rotate(0) scale(.4)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 400}deg) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + 260}px)) rotate(${Math.random() * 700}deg) scale(1)`, opacity: 0 },
        ],
        { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' }
      )
    ).then(() => t.remove());
  }
}

/* ---------- finder: an index of everything that flies you there ---------- */

export function createFinder({ onPick }) {
  const root = document.getElementById('finder');
  const paper = root.querySelector('.finder__paper');
  const body = root.querySelector('.finder__body');
  const closeBtn = root.querySelector('.finder__close');
  closeBtn.innerHTML = icon('close');
  let opener = null;

  function render() {
    const B = Bl();
    root.querySelector('#finder-title').textContent = tt('findTitle');
    root.querySelector('.finder__note').textContent = tt('findNote');
    closeBtn.setAttribute('aria-label', B.t('close'));
    const post = (p) => {
      const v = B.view(p);
      return `<li><button type="button" data-go="post:${p.slug}" lang="${v.translated ? B.lang : 'bg'}"><span class="fi-t">${esc(v.title)}</span><span class="fi-m">${esc(B.date(p.date))}</span></button></li>`;
    };
    body.innerHTML = `
      <section><h3>${esc(B.t('stories'))}</h3><ul>${B.stories.map(post).join('')}</ul></section>
      <section><h3>${esc(B.t('opinions'))}</h3><ul>${B.opinions.map(post).join('')}</ul></section>
      <section><h3>${esc(B.t('gallery'))}</h3><ul>${B.albums
        .map(
          (a) =>
            `<li><button type="button" data-go="album:${a.slug}"><span class="fi-thumbs">${a.photos
              .slice(0, 3)
              .map((p) => `<img src="${B.thumbUrl(p.file)}" alt="" loading="lazy">`)
              .join('')}</span><span class="fi-t">${esc(B.text(a.title))}</span><span class="fi-m">${a.photos.length} ${esc(B.t('photos'))}</span></button></li>`
        )
        .join('')}</ul></section>
      <section class="finder__misc"><ul>
        <li><button type="button" data-go="about"><span class="fi-t">${esc(B.t('about'))}</span></button></li>
        <li><button type="button" data-go="home"><span class="fi-t">${esc(tt('start'))}</span></button></li>
      </ul></section>`;
  }

  body.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    close(false);
    onPick(b.dataset.go);
  });
  closeBtn.addEventListener('click', () => close());
  root.querySelector('.finder__scrim').addEventListener('click', () => close());
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') (e.stopPropagation(), close());
    if (e.key === 'Tab') {
      const f = [...root.querySelectorAll('button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
    }
  });

  function open(from) {
    opener = from || document.activeElement;
    render();
    root.hidden = false;
    if (!reduced()) {
      root.querySelector('.finder__scrim').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
      paper.animate(
        [
          { transform: 'translateY(40px) rotate(-3deg)', opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 460, easing: EASE.slap }
      );
    }
    body.querySelector('button')?.focus({ preventScroll: true });
  }

  async function close(restore = true) {
    if (root.hidden) return;
    if (!reduced()) {
      root.querySelector('.finder__scrim').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      await done(paper.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(30px) rotate(2deg)', opacity: 0 }], { duration: 220, easing: EASE.in, fill: 'forwards' }));
    }
    root.hidden = true;
    root.querySelectorAll('*').forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    if (restore && opener?.isConnected) opener.focus({ preventScroll: true });
  }

  return {
    open,
    close,
    render,
    get isOpen() {
      return !root.hidden;
    },
  };
}

/* ---------- "just show me a list" ---------- */

export function createList({ onClose, langButton }) {
  const root = document.getElementById('listview');
  const inner = root.querySelector('.listview__in');

  function render() {
    const B = Bl();
    const post = (p) => {
      const v = B.view(p);
      return `<li><a class="lv-post" href="#/post/${p.slug}" lang="${v.translated ? B.lang : 'bg'}">
        <span class="lv-meta"><span class="lv-type lv-type--${p.type}">${esc(B.t(p.type))}</span> · ${esc(B.date(p.date))} · ${B.readMinutes(p)} ${esc(B.t('minRead'))}</span>
        <span class="lv-title">${esc(v.title)}</span>
        <span class="lv-ex">${esc(v.excerpt)}</span>
        ${v.translated ? '' : `<span class="lv-only" lang="${B.lang}">${esc(B.t('onlyBg'))}</span>`}
      </a></li>`;
    };
    inner.innerHTML = `
      <header class="lv-head">
        <div class="lv-bar"><button type="button" class="lv-back">${icon('back')}<span>${esc(tt('listClose'))}</span></button></div>
        <p class="lv-site">${esc(B.text(B.site.name))}</p>
        <h1 id="lv-title">${esc(B.t('allPosts'))}</h1>
        <p class="lv-tag">${esc(B.text(B.site.tagline))}</p>
      </header>
      <section aria-labelledby="lv-s"><h2 id="lv-s">${esc(B.t('stories'))}</h2><ul class="lv-list">${B.stories.map(post).join('')}</ul></section>
      <section aria-labelledby="lv-o"><h2 id="lv-o">${esc(B.t('opinions'))}</h2><ul class="lv-list">${B.opinions.map(post).join('')}</ul></section>
      <section aria-labelledby="lv-g"><h2 id="lv-g">${esc(B.t('gallery'))}</h2><ul class="lv-albums">${B.albums
        .map(
          (a) => `<li><a class="lv-album" href="#/photo/${a.slug}/1">
            <span class="lv-thumbs">${a.photos
              .slice(0, 4)
              .map((p) => `<img src="${B.thumbUrl(p.file)}" alt="" loading="lazy" decoding="async">`)
              .join('')}</span>
            <span class="lv-title">${esc(B.text(a.title))}</span>
            <span class="lv-ex">${esc(B.text(a.note))}</span>
            <span class="lv-meta">${a.photos.length} ${esc(B.t('photos'))}</span></a></li>`
        )
        .join('')}</ul></section>
      <section aria-labelledby="lv-a" class="lv-about"><h2 id="lv-a">${esc(B.t('about'))}</h2><p>${esc(B.text(B.site.about))}</p></section>`;
    inner.querySelector('.lv-back').addEventListener('click', () => onClose());
    inner.querySelector('.lv-bar').append(langButton);
    syncLang(langButton);
  }

  function open() {
    render();
    root.hidden = false;
    document.body.classList.add('is-list');
    root.scrollTop = 0;
    if (!reduced()) root.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE.out });
    root.querySelector('h1').setAttribute('tabindex', '-1');
    root.querySelector('h1').focus({ preventScroll: true });
  }

  async function close() {
    if (root.hidden) return;
    if (!reduced()) await done(root.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(24px)' }], { duration: 240, easing: EASE.in }));
    root.hidden = true;
    document.body.classList.remove('is-list');
  }

  return {
    open,
    close,
    render,
    get isOpen() {
      return !root.hidden;
    },
  };
}

/* ---------- first-visit hint ---------- */

export function createHint() {
  const el = document.querySelector('.hint');
  let gone = false;
  function render() {
    el.innerHTML = `<ul><li>${icon('drag')}${esc(tt('hintDrag'))}</li><li>${icon('zoom')}${esc(tt('hintZoom'))}</li><li>${icon('tap')}${esc(tt('hintTap'))}</li></ul><button type="button" class="hint__ok">${esc(tt('hintOk'))}</button>`;
    el.querySelector('.hint__ok').addEventListener('click', dismiss);
  }
  async function show() {
    let seen = false;
    try {
      seen = sessionStorage.getItem('wall-hint') === '1';
    } catch {
      /* storage blocked */
    }
    if (seen) return;
    render();
    await wait(1400);
    if (gone) return;
    el.hidden = false;
    if (!reduced())
      el.animate([{ transform: 'translate(-50%, 30px) rotate(4deg)', opacity: 0 }, { transform: 'translate(-50%,0) rotate(-1.5deg)', opacity: 1 }], {
        duration: 560,
        easing: EASE.slap,
      });
  }
  async function dismiss() {
    if (gone) return;
    gone = true;
    try {
      sessionStorage.setItem('wall-hint', '1');
    } catch {
      /* storage blocked */
    }
    if (el.hidden) return;
    if (!reduced()) await done(el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%, 40px) rotate(8deg)' }], { duration: 320, easing: EASE.in, fill: 'forwards' }));
    el.hidden = true;
  }
  return { show, dismiss, render: () => !gone && !el.hidden && render() };
}

/* ======================= main ======================= */

// The endless wall — bootstrap, routing and the glue between camera, world and overlays.

const Blog = window.Blog;
const $ = (s) => document.querySelector(s);
const stage = $('#stage');
const worldEl = $('#world');

let locked = true;
let minimap = null;
let lastPointer = 0;
const camera = createCamera(stage, worldEl, {
  isLocked: () => locked || document.body.classList.contains('is-overlay') || finder?.isOpen,
  grabItem,
  tapDelay: (t) => {
    const it = world.itemFromEl(t);
    return !!(it && (it.hit?.type === 'post' || it.hit?.type === 'photo'));
  },
  onTap,
  onDoubleTap,
  onPanStart: () => hint.dismiss(),
});
const world = createWorld(worldEl, camera);
camera.subscribe(() => world.update());
camera.onSettle((c) => worldEl.style.setProperty('--iz', (1 / c.z).toFixed(3)));

const toggleLang = () => Blog.toggleLang();
const reader = createReader({
  camera,
  world,
  onClose: () => closeRoute(),
  onNavigate: (slug) => navigate(`#/post/${slug}`, { replace: true }),
  langButton: langToggle(toggleLang, 'langsw--sheet'),
});
const viewer = createViewer({
  camera,
  world,
  onClose: () => closeRoute(),
  onShow: (album, i) => navigate(`#/photo/${album}/${i + 1}`, { replace: true }),
  langButton: langToggle(toggleLang, 'langsw--sheet'),
});
const finder = createFinder({ onPick: pickFromFinder });
const list = createList({ onClose: () => closeRoute(), langButton: langToggle(() => Blog.toggleLang(), 'langsw--list') });
const hint = createHint();

/* ---------- dock & chrome ---------- */

const dock = $('.dock');
const btn = (cls, ico, fn) => {
  const b = dock.querySelector(cls);
  b.innerHTML = icon(ico) + '<span class="mag__tip"></span>';
  b.addEventListener('click', fn);
  return b;
};
const bHome = btn('.mag--home', 'home', () => goHome());
const bFind = btn('.mag--find', 'find', () => finder.open(bFind));
const bOut = btn('.mag--out', 'minus', () => camera.zoomBy(1 / 1.7));
const bIn = btn('.mag--in', 'plus', () => camera.zoomBy(1.7));
const bSound = btn('.mag--sound', 'soundOff', async () => {
  const on = await sound.toggle();
  bSound.innerHTML = icon(on ? 'soundOn' : 'soundOff') + '<span class="mag__tip"></span>';
  bSound.setAttribute('aria-pressed', String(on));
  chrome();
});
dock.querySelector('.dock__lang').append(langToggle(toggleLang, 'langsw--dock'));

function chrome() {
  document.title = tt('docTitle');
  stage.setAttribute('aria-label', tt('stageLabel'));
  const label = (b, text) => {
    b.setAttribute('aria-label', text);
    b.querySelector('.mag__tip').textContent = text;
  };
  label(bHome, tt('home'));
  label(bFind, tt('find'));
  label(bOut, tt('zoomOut'));
  label(bIn, tt('zoomIn'));
  label(bSound, sound.on ? tt('soundOff') : tt('soundOn'));
  dock.setAttribute('aria-label', tt('map'));
  $('.listlink__t').textContent = Blog.t('listView');
  $('.listlink__s').textContent = Blog.t('listViewShort');
  $('.protolink span').textContent = Blog.t('prototypes');
  $('.credits').textContent = Blog.t('photoCredits');
  $('.minimap').setAttribute('aria-label', tt('map'));
  const lt = $('.loader__t');
  if (lt) lt.textContent = tt('loadingWall');
  syncLangButtons();
}

/* ---------- routing ---------- */

let state = { type: 'wall' };
let firstRoute = true;

function parse() {
  const hsh = location.hash.replace(/^#/, '');
  let m;
  if ((m = hsh.match(/^\/post\/([\w-]+)\/?$/)) && Blog.post(m[1])) return { type: 'post', slug: m[1] };
  if ((m = hsh.match(/^\/photo\/([\w-]+)\/(\d+)\/?$/))) {
    const a = Blog.albums.find((x) => x.slug === m[1]);
    const i = clamp(+m[2] - 1, 0, 999);
    if (a && a.photos[i]) return { type: 'photo', album: a.slug, index: i };
  }
  if (hsh === '/list') return { type: 'list' };
  return { type: 'wall' };
}

const depth = () => history.state?.depth || 0;
function navigate(hash, { replace = false } = {}) {
  if (replace) history.replaceState({ depth: depth() }, '', hash);
  else history.pushState({ depth: depth() + 1 }, '', hash);
  route();
}
function closeRoute() {
  if (state.type === 'post' && list.isOpen && depth() > 0) return history.back();
  if (depth() > 0) history.back();
  else {
    const to = state.type !== 'list' && list.isOpen ? '#/list' : location.pathname + location.search;
    history.replaceState({ depth: 0 }, '', to);
    route();
  }
}
addEventListener('popstate', route);
addEventListener('hashchange', route);

let chain = Promise.resolve();
let openOrigin = 'direct';
function route() {
  chain = chain.then(doRoute).catch(() => {});
}

async function doRoute() {
  const next = parse();
  const cur = state;
  const same =
    next.type === cur.type && next.slug === cur.slug && next.album === cur.album && next.index === cur.index;
  const wasFirst = firstRoute;
  firstRoute = false;
  if (same) return;
  const origin = wasFirst ? 'direct' : list.isOpen ? 'list' : openOrigin;
  openOrigin = 'wall';

  if (cur.type === 'post' && next.type === 'post') {
    const P = Blog.posts;
    await reader.swap(next.slug, P.indexOf(Blog.post(next.slug)) > P.indexOf(Blog.post(cur.slug)) ? 1 : -1);
    state = next;
    return;
  }
  if (cur.type === 'photo' && next.type === 'photo') {
    const all = Blog.photos;
    const a = all.findIndex((p) => p.album === cur.album && p.index === cur.index);
    const b = all.findIndex((p) => p.album === next.album && p.index === next.index);
    await viewer.show(next.album, next.index, b > a ? 1 : -1);
    state = next;
    return;
  }
  if (cur.type === 'post') await reader.close();
  if (cur.type === 'photo') await viewer.close();
  if (next.type === 'wall' && list.isOpen) await list.close();
  state = next;
  if (next.type === 'post') await reader.open(next.slug, { from: origin, focusReturn: pendingFocus() });
  else if (next.type === 'photo') await viewer.open(next.album, next.index, { from: origin, focusReturn: pendingFocus() });
  else if (next.type === 'list') {
    if (!list.isOpen) list.open();
  } else if (next.type === 'wall' && (!document.activeElement || document.activeElement === document.body)) stage.focus({ preventScroll: true });
}

let focusAfter = null;
const pendingFocus = () => {
  const f = focusAfter;
  focusAfter = null;
  return f;
};

/* ---------- wall interactions ---------- */

function activate(it, { keyboard = false } = {}) {
  if (!it?.hit) return;
  hint.dismiss();
  if (keyboard) focusAfter = it.el;
  switch (it.hit.type) {
    case 'post':
      openOrigin = 'wall';
      navigate(`#/post/${it.hit.slug}`);
      break;
    case 'photo':
      openOrigin = 'wall';
      navigate(`#/photo/${it.hit.album}/${it.hit.index + 1}`);
      break;
    case 'echo': {
      const t = world.get(it.hit.target);
      if (t) flyToItem(t);
      break;
    }
    case 'stork':
      storkFound(it);
      break;
    case 'lostcat':
      if (!reduced()) it.face.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'rotate(0)' }], { duration: 500 });
      sound.play('paper');
      break;
  }
}

function onTap(target, x, y) {
  if (locked) return;
  const mag = target.closest?.('.mag-l');
  if (mag) {
    sound.play('clack');
    if (!reduced())
      mag.animate([{ translate: '0 0', rotate: '0deg' }, { translate: '0 -0.25em', rotate: '-14deg', offset: 0.3 }, { translate: '0 0', rotate: '0deg' }], {
        duration: 520,
        easing: EASE.spring,
      });
    return;
  }
  const tab = target.closest?.('.lostcat__tab');
  if (tab && !tab.classList.contains('is-torn')) {
    const it = world.itemFromEl(tab);
    it.torn ??= new Set();
    it.torn.add(+tab.dataset.tab);
    sound.play('tear');
    if (reduced()) tab.classList.add('is-torn');
    else
      done(tab.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(10px, 120px) rotate(38deg)', opacity: 0 }], { duration: 700, easing: EASE.in, fill: 'forwards' })).then(() =>
        tab.classList.add('is-torn')
      );
    return;
  }
  activate(world.itemFromEl(target));
}

const ZOOMABLE_NOT = new Set(['fridge', 'cork', 'remnant', 'patch', 'tag', 'staples']);
function onDoubleTap(target, x, y) {
  if (locked) return;
  hint.dismiss();
  const it = world.itemFromEl(target);
  if (it && !ZOOMABLE_NOT.has(it.kind)) {
    const t = camera.fitTarget({ x: it.x, y: it.y, w: it.w, h: it.h }, 0.2, 1.6);
    const close = Math.abs(camera.z - t.z) / t.z < 0.15 && Math.hypot(camera.x - t.x, camera.y - t.y) * camera.z < 60;
    if (close) camera.flyTo({ x: camera.x, y: camera.y, z: camera.z / 2.6 }, { duration: 600 });
    else camera.flyTo(t, { duration: 700 });
  } else camera.zoomBy(2, x, y);
}

function grabItem(target) {
  const el = target.closest?.('.maglet');
  if (!el) return null;
  const it = world.itemFromEl(el);
  if (!it) return null;
  let lifted = false;
  return {
    move(dx, dy) {
      if (!lifted) {
        lifted = true;
        el.classList.add('is-held');
        sound.play('clack');
        hint.dismiss();
      }
      it.x += dx;
      it.y += dy;
      place(it);
    },
    end(moved) {
      el.classList.remove('is-held');
      if (moved) sound.play('clack');
    },
  };
}

function flyToItem(it, { highlight = true, maxZ = 1.1, pad = 0.26 } = {}) {
  return camera.flyTo(camera.fitTarget({ x: it.x, y: it.y, w: it.w, h: it.h }, pad, maxZ)).then((ok) => {
    if (ok !== false && highlight) world.highlight(it);
  });
}

function homeTarget() {
  const phone = camera.vw < 700;
  const r = phone ? { x: 0, y: -170, w: 1560, h: 1500 } : HOME;
  return camera.fitTarget(r, 0.02, 0.9);
}

function goHome() {
  hint.dismiss();
  return camera.flyTo(homeTarget());
}

function pickFromFinder(go) {
  if (go === 'home') return goHome();
  if (go === 'about') return flyToItem(world.get('about'));
  if (go.startsWith('album:')) {
    const slug = go.slice(6);
    const items = world.contentList.filter((it) => it.album === slug);
    const x0 = Math.min(...items.map((i) => i.x - i.w / 2)), x1 = Math.max(...items.map((i) => i.x + i.w / 2));
    const y0 = Math.min(...items.map((i) => i.y - i.h / 2)), y1 = Math.max(...items.map((i) => i.y + i.h / 2));
    const label = world.get('album:' + slug);
    return camera
      .flyTo(camera.fitTarget({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }, 0.1, 1))
      .then((ok) => ok !== false && label && world.highlight(label));
  }
  const it = world.get(go);
  if (it) flyToItem(it);
}

function storkFound(it) {
  let seen = false;
  try {
    seen = localStorage.getItem('wall-stork') === '1';
    localStorage.setItem('wall-stork', '1');
  } catch {
    /* storage blocked: the stork forgets you */
  }
  sound.play('flap');
  toast(tt('storkTitle'), seen ? tt('storkAgain') : tt('storkText'), { kind: 'toast--stork' });
  const p = camera.worldToScreen(it.x, it.y);
  threads(p.x, p.y);
  if (!reduced())
    it.face.animate(
      [{ transform: 'none' }, { transform: 'translateY(-30px) rotate(-6deg)' }, { transform: 'translateY(-8px) rotate(4deg)' }, { transform: 'none' }],
      { duration: 900, easing: EASE.spring }
    );
}

// keyboard users: following focus across the wall, and native "click" from Enter/Space
worldEl.addEventListener('click', (e) => {
  e.preventDefault();
  if (e.detail !== 0) return;
  const it = world.itemFromEl(e.target);
  if (it) activate(it, { keyboard: true });
});
addEventListener('pointerdown', () => (lastPointer = performance.now()), true);
worldEl.addEventListener('focusin', (e) => {
  if (performance.now() - lastPointer < 400) return;
  const it = world.itemFromEl(e.target);
  if (!it || !it.hit) return;
  if (!world.isOnScreen(it, -Math.max(it.w, it.h) / 2)) flyToItem(it, { highlight: false, maxZ: 0.9, pad: 0.3 });
});
worldEl.addEventListener('dragstart', (e) => e.preventDefault());
$('#listview').addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a) return;
  e.preventDefault();
  navigate(a.getAttribute('href'));
});
$('.listlink').addEventListener('click', (e) => {
  e.preventDefault();
  hint.dismiss();
  if (state.type !== 'list') navigate('#/list');
});

addEventListener('keydown', (e) => {
  if (e.defaultPrevented || locked) return;
  if (e.key === 'Escape') {
    if (finder.isOpen) return finder.close();
    if (state.type !== 'wall') {
      if (reader.busy || viewer.busy) return;
      e.preventDefault();
      return closeRoute();
    }
    return;
  }
  if (state.type !== 'wall' || finder.isOpen) return;
  const t = e.target;
  if (t.closest?.('input, textarea')) return;
  const step = 160;
  const k = e.key;
  if (k === 'ArrowLeft') camera.panBy(-step * 1.5, 0);
  else if (k === 'ArrowRight') camera.panBy(step * 1.5, 0);
  else if (k === 'ArrowUp') camera.panBy(0, -step * 1.5);
  else if (k === 'ArrowDown') camera.panBy(0, step * 1.5);
  else if (k === '+' || k === '=') camera.zoomBy(1.5);
  else if (k === '-' || k === '_') camera.zoomBy(1 / 1.5);
  else if (k === '0' || k === 'h' || k === 'H' || k === 'Home') goHome();
  else if (k === 'f' || k === 'F' || k === '/') finder.open(bFind);
  else return;
  e.preventDefault();
  hint.dismiss();
});

/* ---------- language ---------- */

Blog.onLangChange(() => {
  chrome();
  minimap?.draw();
  hint.render();
  reader.relang();
  viewer.relang();
  if (list.isOpen) list.render();
  if (finder.isOpen) finder.render();
  const overlay = document.body.classList.contains('is-overlay') || list.isOpen;
  const vis = world.relang();
  if (overlay || reduced() || !vis.length) {
    vis.forEach((v) => v.it.render());
  } else {
    sound.play('swish');
    const D = pasteWipe();
    const vw = camera.vw;
    vis.forEach(({ it, sx }) => {
      const delay = clamp((sx + 0.4 * vw) / (1.4 * vw + 40), 0, 1) * D;
      setTimeout(() => world.repaste(it), delay * 0.95);
    });
  }
  setTimeout(() => world.measure({ keepouts: false }), 1100);
});

/* ---------- boot ---------- */

async function boot() {
  chrome();
  const fontsReady = Promise.all(
    [
      '700 40px Caveat',
      '400 30px Caveat',
      '100px "Dela Gothic One"',
      '30px Neucha',
      '700 30px Oswald',
      '900 60px Rubik',
      '400 20px Literata',
      '20px "PT Mono"',
      '60px "Rubik Spray Paint"',
    ].map((f) => document.fonts.load(f, 'АаБбЯя Aa').catch(() => {}))
  );
  await Promise.race([Promise.all([makeTextures(), fontsReady]), wait(4000)]);
  world.init(buildLayout());
  camera.setInsets(insets());
  camera.set(homeTarget());
  world.update();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  world.measure();
  world.update();
  minimap = createMinimap($('.minimap'), camera, world, {
    onJump: (p, fly) => (fly ? camera.flyTo({ ...p, z: camera.z }, { duration: 600 }) : camera.set({ ...p, z: camera.z })),
  });
  locked = false;
  const loader = $('.loader');
  if (!reduced()) await done(loader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }));
  loader.remove();
  document.body.classList.add('is-ready');
  if (parse().type === 'wall') {
    world.intro();
    hint.show();
  }
  route();
}

function insets() {
  const w = innerWidth;
  if (w < 700) return { t: 64, b: 96, l: 0, r: 0 };
  if (w < 1100) return { t: 150, b: 100, l: 0, r: 0 };
  return { t: 20, b: 92, l: 40, r: 210 };
}
addEventListener('resize', () => camera.setInsets(insets()));

document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('is-hidden', document.hidden);
  if (document.hidden) camera.stop();
});

boot();
