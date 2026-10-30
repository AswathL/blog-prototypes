// HTML for the paper sheets laid over the table: the plain list and the reader.
// Everything textual comes from window.Blog or the concept dictionary passed in.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const photoInfo = (B, file) => B.photos.find((p) => p.file === file);

function typeLabel(B, post) {
  return B.t(post.type === 'story' ? 'story' : 'opinion');
}

export function listHTML(B, u) {
  const posts = B.posts
    .map((post) => {
      const v = B.view(post);
      const lang = v.translated ? B.lang : 'bg';
      return `<li class="pl-item">
        <a class="pl-link" href="#/post/${esc(post.slug)}">
          <span class="pl-meta"><span class="pl-type pl-type--${post.type}">${esc(typeLabel(B, post))}</span><time datetime="${post.date}">${esc(B.date(post.date))}</time></span>
          <span class="pl-title" lang="${lang}">${esc(v.title)}</span>
          <span class="pl-excerpt" lang="${lang}">${esc(v.excerpt)}</span>
          ${v.translated ? '' : `<span class="pl-only">${esc(u('onlyBgShort'))}</span>`}
        </a>
      </li>`;
    })
    .join('');

  const albums = B.albums
    .map(
      (a) => `<li class="al-item">
        <button class="al-btn" type="button" data-album="${esc(a.slug)}">
          <img class="al-thumb" src="${esc(B.thumbUrl(a.photos[0].file))}" alt="" loading="lazy" decoding="async" width="${a.photos[0].w}" height="${a.photos[0].h}">
          <span class="al-text">
            <span class="al-title">${esc(B.text(a.title))}</span>
            <span class="al-note">${esc(B.text(a.note))}</span>
            <span class="al-count">${a.photos.length} ${esc(B.t('photos'))} · ${esc(u('tipOnTable'))} →</span>
          </span>
        </button>
      </li>`
    )
    .join('');

  return `
    <header class="sh-head">
      <p class="sh-kicker">${esc(B.text(B.site.name))} · ${esc(B.t('listView'))}</p>
      <h1 class="sh-title" tabindex="-1">${esc(B.t('allPosts'))}</h1>
      <p class="sh-lede">${esc(B.text(B.site.tagline))}</p>
    </header>
    <ol class="pl">${posts}</ol>
    <h2 class="sh-sub">${esc(B.t('gallery'))}</h2>
    <ul class="al">${albums}</ul>
    <aside class="sh-about">
      <h2 class="sh-sub sh-sub--small">${esc(B.t('about'))}</h2>
      <p>${esc(B.text(B.site.about))}</p>
    </aside>`;
}

function block(B, b) {
  if (b.p) return `<p>${esc(b.p)}</p>`;
  if (b.h) return `<h2>${esc(b.h)}</h2>`;
  if (b.quote) return `<blockquote class="pull"><p>${esc(b.quote)}</p></blockquote>`;
  if (b.img) {
    const info = photoInfo(B, b.img);
    const cap = B.text(b.caption);
    const dims = info ? ` width="${info.w}" height="${info.h}"` : '';
    return `<figure class="fig">
      <div class="fig-print"><img src="${esc(B.photoUrl(b.img))}" alt="${esc(cap)}" loading="lazy" decoding="async"${dims}></div>
      <figcaption>${esc(cap)}</figcaption>
    </figure>`;
  }
  return '';
}

export function postHTML(B, u, slug) {
  const post = B.post(slug);
  const v = B.view(post);
  const i = B.posts.indexOf(post);
  const prev = B.posts[i - 1];
  const next = B.posts[i + 1];
  const lang = v.translated ? B.lang : 'bg';
  const navCard = (p, dir) => {
    if (!p) return '<span></span>';
    const pv = B.view(p);
    return `<a class="pn pn--${dir}" href="#/post/${esc(p.slug)}" data-replace="1" rel="${dir}">
      <span class="pn-dir">${dir === 'prev' ? '← ' + esc(B.t('prev')) : esc(B.t('next')) + ' →'}</span>
      <span class="pn-title" lang="${pv.translated ? B.lang : 'bg'}">${esc(pv.title)}</span>
    </a>`;
  };

  return `
    <article class="post" lang="${lang}">
      <header class="post-head">
        <p class="post-type post-type--${post.type}" lang="${B.lang}">${esc(typeLabel(B, post))}</p>
        <h1 class="post-title" tabindex="-1">${esc(v.title)}</h1>
        <p class="post-meta" lang="${B.lang}">
          <time datetime="${post.date}">${esc(B.date(post.date))}</time>
          <span aria-hidden="true">·</span>
          <span>${B.readMinutes(post)} ${esc(B.t('minRead'))}</span>
        </p>
        <p class="post-mood" lang="${B.lang}">${esc(B.t('mood'))}: <span class="post-mood-word">${esc(B.text(post.mood))}</span></p>
        ${v.translated ? '' : `<p class="post-only" lang="en">${esc(B.t('onlyBg'))}</p>`}
      </header>
      <div class="prose">${v.body.map((b) => block(B, b)).join('')}</div>
      <footer class="post-foot" lang="${B.lang}">
        <span class="post-sign" aria-hidden="true">${esc(u('signoff'))}</span>
        <nav class="pn-wrap" aria-label="${esc(B.t('allPosts'))}">${navCard(prev, 'prev')}${navCard(next, 'next')}</nav>
        <a class="post-all" href="#/list" data-replace="1">${esc(B.t('allPosts'))}</a>
      </footer>
    </article>`;
}
