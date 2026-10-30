// Calm reading view. Stories open out of the house door, opinions burst out of the megaphone.
const Blog = window.Blog;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;

export class Reader {
  constructor({ T, onClose, onNav, reduced }) {
    this.T = T;
    this.onClose = onClose;
    this.onNav = onNav;
    this.reduced = reduced;
    this.root = document.getElementById('reader');
    this.scroller = document.getElementById('reader-scroll');
    this.article = document.getElementById('post');
    this.nav = document.getElementById('post-nav');
    this.glow = this.root.querySelector('.reader-glow');
    this.tram = document.getElementById('progress-tram');
    this.rail = this.root.querySelector('.progress');
    this.sizes = new Map(Blog.photos.map((p) => [p.file, p]));
    this.post = null;
    this.open_ = false;
    for (const id of ['reader-close', 'reader-close-2']) document.getElementById(id).addEventListener('click', () => this.onClose());
    this.scroller.addEventListener('scroll', () => this.queueProgress(), { passive: true });
    window.addEventListener('resize', () => this.open_ && this.updateProgress());
    this.nav.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-slug]');
      if (!a) return;
      e.preventDefault();
      this.onNav(a.dataset.slug);
    });
  }

  get isOpen() {
    return this.open_;
  }

  render(post) {
    const v = Blog.view(post);
    const isStory = post.type === 'story';
    const uiLang = Blog.lang;
    this.post = post;
    this.root.dataset.kind = post.type;
    const a = this.article;
    a.lang = v.translated ? uiLang : 'bg';
    const body = v.body
      .map((b) => {
        if (b.p) return `<p>${esc(b.p)}</p>`;
        if (b.h) return `<h2>${esc(b.h)}</h2>`;
        if (b.quote) return `<blockquote><p>${esc(b.quote)}</p></blockquote>`;
        if (b.img) {
          const cap = Blog.text(b.caption);
          const s = this.sizes.get(b.img);
          const dims = s ? ` width="${s.w}" height="${s.h}"` : '';
          return `<figure><img src="${Blog.photoUrl(b.img)}" alt="${esc(cap)}" loading="lazy" decoding="async"${dims}><figcaption lang="${uiLang}">${esc(cap)}</figcaption></figure>`;
        }
        return '';
      })
      .join('');
    a.innerHTML = `
      <div class="post-deco" aria-hidden="true"></div>
      <p class="kicker" lang="${uiLang}">
        <span class="chip chip--${post.type}">${icon(isStory ? 'house' : 'mega')}${esc(Blog.t(post.type))}</span>
        <span class="kick-meta"><time datetime="${post.date}">${esc(Blog.date(post.date))}</time><span aria-hidden="true"> · </span><span>${Blog.readMinutes(post)} ${esc(Blog.t('minRead'))}</span></span>
      </p>
      <h1 id="reader-title" tabindex="-1">${esc(v.title)}</h1>
      <p class="mood" lang="${uiLang}"><span>${esc(Blog.t('mood'))}:</span> ${esc(Blog.text(post.mood))}</p>
      ${v.translated ? '' : `<p class="only-bg" lang="${uiLang}">${esc(Blog.t('onlyBg'))}</p>`}
      <div class="post-body">${body}</div>`;

    const i = Blog.posts.indexOf(post);
    const prev = Blog.posts[i - 1];
    const next = Blog.posts[i + 1];
    const card = (p, dir) => {
      const pv = Blog.view(p);
      const label = dir === 'prev' ? `← ${Blog.t('prev')}` : `${Blog.t('next')} →`;
      return `<a class="nav-card nav-card--${dir}" href="#/post/${p.slug}" data-slug="${p.slug}">
        <span class="nav-dir">${esc(label)} · ${esc(Blog.t(p.type))}</span>
        <span class="nav-title" lang="${pv.translated ? uiLang : 'bg'}">${esc(pv.title)}</span></a>`;
    };
    this.nav.innerHTML = (prev ? card(prev, 'prev') : '') + (next ? card(next, 'next') : '');
    this.nav.setAttribute('aria-label', `${Blog.t('prev')} / ${Blog.t('next')}`);
  }

  relang() {
    if (!this.open_ || !this.post) return;
    const y = this.scroller.scrollTop;
    this.render(this.post);
    this.scroller.scrollTop = y;
  }

  queueProgress() {
    if (this._q) return;
    this._q = true;
    requestAnimationFrame(() => {
      this._q = false;
      this.updateProgress();
    });
  }

  updateProgress() {
    const s = this.scroller;
    const max = s.scrollHeight - s.clientHeight;
    const p = max > 0 ? Math.min(1, s.scrollTop / max) : 0;
    const w = this.rail.clientWidth - 34;
    this.tram.style.transform = `translateX(${(p * Math.max(0, w)).toFixed(1)}px)`;
  }

  setGlowOrigin(origin) {
    if (!origin) return;
    const x = origin.kind === 'door' ? (origin.rect.left + origin.rect.right) / 2 : origin.x;
    const y = origin.kind === 'door' ? (origin.rect.top + origin.rect.bottom) / 2 : origin.y;
    this.glow.style.setProperty('--gx', `${x}px`);
    this.glow.style.setProperty('--gy', `${y}px`);
  }

  shapes(origin) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (origin.kind === 'door') {
      const r = origin.rect;
      const cx = (r.left + r.right) / 2;
      // never start smaller than a fingertip so the reveal reads on phones too
      const hw = Math.max(10, (r.right - r.left) / 2);
      const hh = Math.max(16, (r.bottom - r.top) / 2);
      const cy = (r.top + r.bottom) / 2;
      return {
        small: `inset(${(cy - hh).toFixed(1)}px ${(W - cx - hw).toFixed(1)}px ${(H - cy - hh).toFixed(1)}px ${(cx - hw).toFixed(1)}px round 6px)`,
        big: 'inset(0px 0px 0px 0px round 0px)',
      };
    }
    const R = Math.hypot(Math.max(origin.x, W - origin.x), Math.max(origin.y, H - origin.y)) + 20;
    return { small: `circle(0px at ${origin.x}px ${origin.y}px)`, big: `circle(${R.toFixed(0)}px at ${origin.x}px ${origin.y}px)` };
  }

  shoutRings(origin) {
    for (let i = 0; i < 3; i++) {
      const r = document.createElement('div');
      r.className = 'shout-ring';
      r.style.left = `${origin.x}px`;
      r.style.top = `${origin.y}px`;
      document.body.append(r);
      r.animate(
        [
          { transform: 'scale(.1)', opacity: 1 },
          { transform: 'scale(4.2)', opacity: 0 },
        ],
        { duration: 900, delay: i * 140, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' },
      ).finished.then(() => r.remove());
    }
  }

  async open(post, origin) {
    this.render(post);
    const root = this.root;
    root.hidden = false;
    this.open_ = true;
    this.scroller.scrollTop = 0;
    this.updateProgress();
    if (this.reduced() || !origin) {
      await root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' }).finished;
    } else {
      this.setGlowOrigin(origin);
      const { small, big } = this.shapes(origin);
      if (origin.kind === 'point') this.shoutRings(origin);
      this.glow.style.opacity = '1';
      this.scroller.style.opacity = '0';
      await root.animate([{ clipPath: small }, { clipPath: big }], {
        duration: origin.kind === 'door' ? 860 : 760,
        delay: origin.kind === 'door' ? 0 : 160,
        easing: 'cubic-bezier(.75,0,.2,1)',
        fill: 'both',
      }).finished;
      root.getAnimations().forEach((a) => a.cancel());
      this.glow.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560, easing: 'ease-out', fill: 'forwards' }).finished.then((a) => {
        this.glow.style.opacity = '0';
        a.cancel();
      });
      this.scroller.style.opacity = '';
      await this.scroller.animate(
        [
          { opacity: 0, transform: 'translateY(28px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 640, delay: 140, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
      ).finished;
    }
    document.getElementById('reader-title')?.focus({ preventScroll: true });
  }

  async close(origin) {
    const root = this.root;
    if (this.reduced() || !origin) {
      await root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-in', fill: 'forwards' }).finished;
    } else {
      this.setGlowOrigin(origin);
      const { small, big } = this.shapes(origin);
      const fadeOut = this.scroller.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
      this.glow.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
      await fadeOut.finished;
      await root.animate([{ clipPath: big }, { clipPath: small }], { duration: 720, easing: 'cubic-bezier(.65,0,.3,1)', fill: 'forwards' }).finished;
    }
    root.hidden = true;
    this.open_ = false;
    root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    this.glow.style.opacity = '0';
    this.scroller.style.opacity = '';
  }

  async swap(post, dir) {
    const els = [this.article, this.nav];
    const d = this.reduced() ? 0 : 36 * dir;
    await Promise.all(
      els.map((el) => el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-d}px)` }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).finished),
    );
    this.render(post);
    this.scroller.scrollTop = 0;
    this.updateProgress();
    els.forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      el.animate([{ opacity: 0, transform: `translateX(${d}px)` }, { opacity: 1, transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
    document.getElementById('reader-title')?.focus({ preventScroll: true });
  }
}
