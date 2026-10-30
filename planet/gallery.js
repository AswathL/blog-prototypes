// The moon's photo viewer: polaroids that fly out of the moon, albums as tabs, swipe/arrow navigation.
const Blog = window.Blog;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export class Gallery {
  constructor({ T, onClose, onAlbum, reduced, sound }) {
    this.T = T;
    this.onClose = onClose;
    this.onAlbum = onAlbum;
    this.reduced = reduced;
    this.sound = sound;
    this.root = document.getElementById('gallery');
    this.track = document.getElementById('g-track');
    this.tabs = document.getElementById('g-albums');
    this.note = document.getElementById('g-note');
    this.count = document.getElementById('g-count');
    this.prevBtn = document.getElementById('g-prev');
    this.nextBtn = document.getElementById('g-next');
    this.album = Blog.albums[0]?.slug;
    this.index = 0;
    this.open_ = false;
    document.getElementById('gallery-close').addEventListener('click', () => this.onClose());
    this.prevBtn.addEventListener('click', () => this.go(this.index - 1));
    this.nextBtn.addEventListener('click', () => this.go(this.index + 1));
    this.tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-album]');
      if (b && b.dataset.album !== this.album) this.onAlbum(b.dataset.album);
    });
    this.tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      e.stopPropagation();
      const list = Blog.albums;
      const i = list.findIndex((a) => a.slug === this.album);
      const n = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
      this.onAlbum(n.slug, true);
    });
    this.root.addEventListener('keydown', (e) => {
      if (e.target.closest('.g-albums')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.go(this.index + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.go(this.index - 1);
      }
    });
    this.track.addEventListener('scroll', () => this.queueActive(), { passive: true });
    this.bindMouseDrag();
  }

  get isOpen() {
    return this.open_;
  }

  get photos() {
    return Blog.albums.find((a) => a.slug === this.album)?.photos || [];
  }

  renderTabs() {
    this.tabs.setAttribute('aria-label', this.T('albums'));
    this.tabs.innerHTML = Blog.albums
      .map((a) => {
        const sel = a.slug === this.album;
        return `<button type="button" role="tab" data-album="${a.slug}" aria-selected="${sel}" tabindex="${sel ? 0 : -1}" aria-controls="g-track">${esc(Blog.text(a.title))}<span class="n" aria-label="${a.photos.length} ${esc(Blog.t('photos'))}">${a.photos.length}</span></button>`;
      })
      .join('');
    const album = Blog.albums.find((a) => a.slug === this.album);
    this.note.textContent = album ? Blog.text(album.note) : '';
  }

  renderSlides() {
    const n = this.photos.length;
    this.track.setAttribute('aria-label', Blog.text(Blog.albums.find((a) => a.slug === this.album)?.title || {}));
    this.track.innerHTML = this.photos
      .map((p, i) => {
        const cap = Blog.text(p.caption);
        const rot = ((i * 47) % 7) - 3;
        return `<div class="g-slide" role="group" aria-roledescription="slide" aria-label="${esc(this.T('photoN', { i: i + 1, n }))}" data-i="${i}">
          <figure class="polaroid" style="--ar:${(p.w / p.h).toFixed(4)};--rot:${rot * 0.9}deg">
            <img src="${Blog.photoUrl(p.file)}" alt="${esc(cap)}" width="${p.w}" height="${p.h}" ${i < 2 ? '' : 'loading="lazy"'} decoding="async" draggable="false">
            <figcaption>${esc(cap)}</figcaption>
          </figure></div>`;
      })
      .join('');
    this.slides = [...this.track.querySelectorAll('.g-slide')];
  }

  relang() {
    if (!this.open_) return;
    const i = this.index;
    this.renderTabs();
    this.slides.forEach((s, k) => {
      const p = this.photos[k];
      const cap = Blog.text(p.caption);
      s.setAttribute('aria-label', this.T('photoN', { i: k + 1, n: this.photos.length }));
      s.querySelector('img').alt = cap;
      s.querySelector('figcaption').textContent = cap;
    });
    this.track.setAttribute('aria-label', Blog.text(Blog.albums.find((a) => a.slug === this.album)?.title || {}));
    this.prevBtn.setAttribute('aria-label', this.T('prevPhoto'));
    this.nextBtn.setAttribute('aria-label', this.T('nextPhoto'));
    this.setActive(i, true);
  }

  slideLeft(i) {
    const s = this.slides[i];
    return s.offsetLeft + s.offsetWidth / 2 - this.track.clientWidth / 2;
  }

  go(i, instant = false) {
    if (!this.slides?.length) return;
    i = Math.max(0, Math.min(this.slides.length - 1, i));
    this.track.scrollTo({ left: this.slideLeft(i), behavior: instant || this.reduced() ? 'auto' : 'smooth' });
    this.setActive(i);
  }

  queueActive() {
    if (this._q) return;
    this._q = true;
    requestAnimationFrame(() => {
      this._q = false;
      if (!this.slides?.length) return;
      const mid = this.track.scrollLeft + this.track.clientWidth / 2;
      let best = 0;
      let bd = Infinity;
      this.slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      this.setActive(best);
    });
  }

  setActive(i, force = false) {
    if (i === this.index && !force && this.slides[i]?.classList.contains('is-active')) return;
    this.index = i;
    this.slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    this.count.textContent = this.T('photoN', { i: i + 1, n: this.slides.length });
    this.prevBtn.disabled = i === 0;
    this.nextBtn.disabled = i === this.slides.length - 1;
  }

  bindMouseDrag() {
    let drag = null;
    this.track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: this.track.scrollLeft, moved: 0, start: this.index };
      this.track.setPointerCapture(e.pointerId);
    });
    this.track.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.moved > 4) this.track.classList.add('is-dragging');
      this.track.scrollLeft = drag.left - dx;
    });
    const end = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const wasDrag = drag.moved > 4;
      const start = drag.start;
      drag = null;
      this.track.classList.remove('is-dragging');
      if (!wasDrag) return;
      let i = this.slideAt();
      if (i === start && Math.abs(dx) > 60) i += dx < 0 ? 1 : -1;
      this.go(i);
    };
    this.track.addEventListener('pointerup', end);
    this.track.addEventListener('pointercancel', end);
  }

  slideAt() {
    const mid = this.track.scrollLeft + this.track.clientWidth / 2;
    let best = 0;
    let bd = Infinity;
    this.slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }

  setAlbum(slug, focusTab = false) {
    if (!Blog.albums.some((a) => a.slug === slug)) slug = Blog.albums[0].slug;
    if (slug === this.album && this.slides?.length) return;
    this.album = slug;
    this.renderTabs();
    if (focusTab) this.tabs.querySelector('[aria-selected="true"]')?.focus();
    this.tabs.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    this.renderSlides();
    this.index = -1;
    this.go(0, true);
    this.setActive(0, true);
    if (!this.reduced()) {
      this.slides.slice(0, 3).forEach((s, k) =>
        s.firstElementChild.animate(
          [
            { opacity: 0, transform: `translateY(40px) rotate(${(k - 1) * 6}deg) scale(.9)` },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 650, delay: k * 70, easing: 'cubic-bezier(.34,1.56,.64,1)' },
        ),
      );
    }
    this.sound?.pop();
  }

  async open(albumSlug, point) {
    this.album = Blog.albums.some((a) => a.slug === albumSlug) ? albumSlug : Blog.albums[0].slug;
    this.renderTabs();
    this.renderSlides();
    this.prevBtn.setAttribute('aria-label', this.T('prevPhoto'));
    this.nextBtn.setAttribute('aria-label', this.T('nextPhoto'));
    this.root.hidden = false;
    this.open_ = true;
    this.index = -1;
    this.go(0, true);
    this.setActive(0, true);
    const reduced = this.reduced();
    const fade = this.root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 300 : 520, easing: 'ease-out' });
    if (!reduced) {
      const moon = this.root.querySelector('.g-moon');
      moon.animate([{ transform: 'translateX(-50%) translateY(30vh)' }, { transform: 'translateX(-50%)' }], { duration: 1100, easing: 'cubic-bezier(.22,1,.36,1)' });
      const ui = [this.root.querySelector('.g-head'), this.tabs, this.note, this.root.querySelector('.g-controls')];
      ui.forEach((el, k) =>
        el.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 260 + k * 70, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }),
      );
      const active = this.slides[0]?.firstElementChild;
      if (active && point) {
        const r = active.getBoundingClientRect();
        const dx = point.x - (r.left + r.width / 2);
        const dy = point.y - (r.top + r.height / 2);
        active.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(.06) rotate(-28deg)`, opacity: 0.4 },
            { opacity: 1, offset: 0.25 },
            { transform: 'translateY(-4px) scale(1) rotate(0deg)', opacity: 1 },
          ],
          { duration: 950, easing: 'cubic-bezier(.34,1.3,.5,1)', fill: 'backwards' },
        );
        this.slides.slice(1, 3).forEach((s, k) => {
          const el = s.firstElementChild;
          const rr = el.getBoundingClientRect();
          el.animate(
            [
              { transform: `translate(${point.x - (rr.left + rr.width / 2)}px, ${point.y - (rr.top + rr.height / 2)}px) scale(.05) rotate(30deg)`, opacity: 0 },
              { transform: `rotate(${el.style.getPropertyValue('--rot') || '0deg'}) scale(.94)`, opacity: 1 },
            ],
            { duration: 900, delay: 120 + k * 90, easing: 'cubic-bezier(.34,1.3,.5,1)', fill: 'backwards' },
          );
        });
      }
    }
    await fade.finished;
    this.track.focus({ preventScroll: true });
  }

  async close(point) {
    const reduced = this.reduced();
    if (!reduced && point) {
      const active = this.slides[this.index]?.firstElementChild;
      if (active) {
        const r = active.getBoundingClientRect();
        active.animate(
          [
            { transform: 'none', opacity: 1 },
            { transform: `translate(${point.x - (r.left + r.width / 2)}px, ${point.y - (r.top + r.height / 2)}px) scale(.05) rotate(24deg)`, opacity: 0.2 },
          ],
          { duration: 700, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' },
        );
      }
      await this.root.animate([{ opacity: 1 }, { opacity: 1, offset: 0.45 }, { opacity: 0 }], { duration: 760, easing: 'ease-in', fill: 'forwards' }).finished;
    } else {
      await this.root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
    }
    this.root.hidden = true;
    this.open_ = false;
    this.root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  }
}
