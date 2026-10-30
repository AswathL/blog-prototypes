// The calm side of the site: the plain list and the reading view.
import { u } from './i18n.js';

const Blog = window.Blog;
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const photoByFile = new Map(Blog.photos.map((p) => [p.file, p]));

export function createReader({ reduced, langToggleHTML, onLangClick, albumProgress, onAlbum, requestClose }) {
  const list = document.getElementById('list');
  const listPanel = document.getElementById('listPanel');
  const reader = document.getElementById('reader');
  const scroll = document.getElementById('readerScroll');

  let listOpen = false;
  let currentSlug = null;
  let listReturnFocus = null;
  let readerReturnFocus = null;
  let readerAnim = null;

  // ---------- list ----------
  function renderList() {
    const posts = Blog.posts
      .map((p) => {
        const v = Blog.view(p);
        const only = !v.translated ? `<span class="plist__flag">${esc(u('onlyBgShort'))}</span>` : '';
        return `<li><a class="plist__item" href="#/post/${p.slug}"${!v.translated ? ' lang="bg"' : ''}>
          <span class="plist__type">${esc(Blog.t(p.type))}</span>
          <span class="plist__title">${esc(v.title)}</span>
          <span class="plist__meta">${esc(Blog.date(p.date))} · ${Blog.readMinutes(p)} ${esc(Blog.t('minRead'))}${only}</span>
        </a></li>`;
      })
      .join('');
    const albums = Blog.albums
      .map((a) => {
        const pr = albumProgress(a.slug);
        return `<li><a class="alist__item" href="#/album/${a.slug}" data-album="${a.slug}">
          <span class="alist__title">${esc(Blog.text(a.title))}</span>
          <span class="alist__note">${esc(Blog.text(a.note))}</span>
          <span class="alist__meta">${a.photos.length} ${esc(Blog.t('photos'))} · ${esc(u('devCount', { d: pr.d, n: pr.n }))}</span>
        </a></li>`;
      })
      .join('');
    listPanel.innerHTML = `
      <header class="sheet__head">
        <h2 class="sheet__title" id="listTitle" tabindex="-1">${esc(Blog.t('allPosts'))}</h2>
        <button class="round round--ink" type="button" data-close aria-label="${esc(Blog.t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </header>
      <ol class="plist">${posts}</ol>
      <h2 class="sheet__sub">${esc(u('listAlbums'))}</h2>
      <ul class="alist">${albums}</ul>`;
  }

  listPanel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-album]');
    if (a) {
      e.preventDefault();
      e.stopPropagation();
      onAlbum(a.dataset.album);
    }
  });

  function openList() {
    if (listOpen) return;
    listOpen = true;
    listReturnFocus = document.activeElement;
    renderList();
    list.hidden = false;
    list.classList.remove('is-leaving');
    void list.offsetWidth;
    list.classList.add('is-open');
    requestAnimationFrame(() => document.getElementById('listTitle')?.focus({ preventScroll: true }));
  }

  function closeList() {
    if (!listOpen) return;
    listOpen = false;
    list.classList.remove('is-open');
    list.classList.add('is-leaving');
    const done = () => {
      if (!listOpen) {
        list.hidden = true;
        list.classList.remove('is-leaving');
      }
    };
    if (reduced()) done();
    else setTimeout(done, 420);
    if (listReturnFocus && document.contains(listReturnFocus)) listReturnFocus.focus({ preventScroll: true });
  }

  list.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) requestClose('list');
  });

  // ---------- reader ----------
  function block(b) {
    if (b.p) return `<p>${esc(b.p)}</p>`;
    if (b.h) return `<h2>${esc(b.h)}</h2>`;
    if (b.quote) return `<blockquote class="pull"><p>${esc(b.quote)}</p></blockquote>`;
    if (b.img) {
      const ph = photoByFile.get(b.img);
      const cap = Blog.text(b.caption);
      const dims = ph ? ` width="${ph.w}" height="${ph.h}"` : '';
      return `<figure class="pprint">
        <div class="pprint__win"><img src="${Blog.photoUrl(b.img)}" alt="${esc(cap)}" loading="lazy" decoding="async"${dims}></div>
        <figcaption class="pprint__cap">${esc(cap)}</figcaption>
      </figure>`;
    }
    return '';
  }

  function renderPost(slug) {
    const post = Blog.post(slug);
    if (!post) return;
    const v = Blog.view(post);
    const idx = Blog.posts.indexOf(post);
    const newer = Blog.posts[idx - 1];
    const older = Blog.posts[idx + 1];
    const artLang = v.translated ? Blog.lang : 'bg';
    const cover = post.cover;
    const ph = photoByFile.get(cover);
    const dims = ph ? ` width="${ph.w}" height="${ph.h}"` : '';
    const navItem = (p, dir) => {
      if (!p) return '<span></span>';
      const pv = Blog.view(p);
      return `<a class="pnav pnav--${dir}" href="#/post/${p.slug}" data-replace${!pv.translated ? ' lang="bg"' : ''}>
        <span class="pnav__dir">${dir === 'prev' ? '←' : ''} ${esc(Blog.t(dir === 'prev' ? 'prev' : 'next'))} ${dir === 'next' ? '→' : ''}</span>
        <span class="pnav__title">${esc(pv.title)}</span>
      </a>`;
    };
    scroll.innerHTML = `
      <div class="reader__bar">
        <button class="reader__back" type="button" data-close>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
          <span>${esc(u('backToTable'))}</span>
        </button>
        ${langToggleHTML()}
      </div>
      <article class="post" lang="${artLang}">
        <header class="post__head">
          <p class="post__kicker"><span class="post__type post__type--${post.type}">${esc(Blog.t(post.type))}</span>
            <span aria-hidden="true">·</span> <time datetime="${post.date}">${esc(Blog.date(post.date))}</time>
            <span aria-hidden="true">·</span> <span>${Blog.readMinutes(post)} ${esc(Blog.t('minRead'))}</span></p>
          <h1 class="post__title" id="postTitle" tabindex="-1">${esc(v.title)}</h1>
          <p class="post__excerpt">${esc(v.excerpt)}</p>
          ${!v.translated ? `<p class="post__onlybg" lang="${Blog.lang}">${esc(Blog.t('onlyBg'))}</p>` : ''}
        </header>
        <figure class="pprint pprint--cover">
          <div class="pprint__win"><img src="${Blog.photoUrl(cover)}" alt="${esc(v.title)}" fetchpriority="high" decoding="async"${dims}></div>
          <figcaption class="pprint__cap" lang="${Blog.lang}"><span class="pprint__label">${esc(Blog.t('mood'))}:</span> ${esc(Blog.text(post.mood))}</figcaption>
        </figure>
        <div class="post__body">${v.body.map(block).join('')}</div>
        <nav class="post__nav" aria-label="${esc(u('postNav'))}">
          ${navItem(newer, 'prev')}
          ${navItem(older, 'next')}
        </nav>
      </article>`;
    document.title = `${v.title} · ${Blog.text(Blog.site.name)}`;
  }

  scroll.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) {
      requestClose('post');
      return;
    }
    const lb = e.target.closest('[data-lang]');
    if (lb) onLangClick(lb.dataset.lang);
  });

  function openPost(slug, origin) {
    const wasOpen = currentSlug !== null;
    const changed = slug !== currentSlug;
    currentSlug = slug;
    if (!wasOpen) readerReturnFocus = document.activeElement;
    renderPost(slug);
    if (changed) scroll.scrollTop = 0;
    if (wasOpen) {
      requestAnimationFrame(() => document.getElementById('postTitle')?.focus({ preventScroll: true }));
      return;
    }
    clearTimeout(readerAnim);
    reader.hidden = false;
    reader.classList.remove('is-leaving', 'is-entering');
    const ox = origin ? `${Math.round((origin.x / innerWidth) * 100)}%` : '50%';
    const oy = origin ? `${Math.round((origin.y / innerHeight) * 100)}%` : '30%';
    reader.style.setProperty('--ox', ox);
    reader.style.setProperty('--oy', oy);
    void reader.offsetWidth;
    reader.classList.add('is-entering');
    readerAnim = setTimeout(() => reader.classList.remove('is-entering'), reduced() ? 300 : 1500);
    requestAnimationFrame(() => document.getElementById('postTitle')?.focus({ preventScroll: true }));
  }

  function closePost() {
    if (currentSlug === null) return;
    currentSlug = null;
    clearTimeout(readerAnim);
    reader.classList.remove('is-entering');
    reader.classList.add('is-leaving');
    readerAnim = setTimeout(
      () => {
        reader.hidden = true;
        reader.classList.remove('is-leaving');
        scroll.innerHTML = '';
      },
      reduced() ? 200 : 620,
    );
    if (readerReturnFocus && document.contains(readerReturnFocus)) readerReturnFocus.focus({ preventScroll: true });
  }

  function refresh() {
    if (listOpen) {
      const had = list.contains(document.activeElement);
      renderList();
      if (had) document.getElementById('listTitle')?.focus({ preventScroll: true });
    }
    if (currentSlug) {
      const top = scroll.scrollTop;
      const ratio = top / Math.max(1, scroll.scrollHeight - scroll.clientHeight);
      renderPost(currentSlug);
      scroll.scrollTop = ratio * Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    }
  }

  return {
    openList,
    closeList,
    openPost,
    closePost,
    refresh,
    get listOpen() {
      return listOpen;
    },
    get postOpen() {
      return currentSlug !== null;
    },
  };
}
