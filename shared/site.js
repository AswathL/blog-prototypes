/*
 * Shared helpers for the prototypes. Load after content.js:
 *   <script src="../shared/content.js"></script>
 *   <script src="../shared/site.js"></script>
 *
 * Exposes window.Blog:
 *   Blog.lang                 current language, 'bg' (default) or 'en'
 *   Blog.setLang(lang)        switch language, persist it, fire 'blog:langchange' on window
 *   Blog.onLangChange(fn)     subscribe; fn(lang)
 *   Blog.t(key)               UI string in the current language (see STRINGS below)
 *   Blog.text(obj)            pick {bg, en} in the current language (falls back to bg)
 *   Blog.site                 site name / tagline / about ({bg, en} objects)
 *   Blog.posts                all posts, newest first
 *   Blog.stories, Blog.opinions
 *   Blog.post(slug)           one post
 *   Blog.view(post)           { title, excerpt, body, translated } for the current language;
 *                             translated === false when English was asked for but only Bulgarian exists
 *   Blog.albums               photo albums; every photo also has .album (slug) and .index
 *   Blog.photos               all photos flattened
 *   Blog.photoUrl(file)       full-size (max 1600px) — for viewers and readers
 *   Blog.thumbUrl(file)       640px — for textures, grids, cards
 *   Blog.date(iso)            "12 октомври 2026" / "12 October 2026"
 *   Blog.readMinutes(post)    rough reading time in minutes
 *   Blog.creditsUrl           page listing photo credits
 */
(function () {
  const C = window.BLOG_CONTENT;
  if (!C) throw new Error('shared/content.js must load before shared/site.js');

  // Absolute URL of the shared/ folder, taken from this script's own src, so the site works at any base path
  // (localhost root, or a GitHub Pages project site like https://user.github.io/repo/).
  const SHARED = new URL('./', document.currentScript.src).href;

  const STRINGS = {
    bg: {
      stories: 'Истории',
      opinions: 'Мнения',
      story: 'История',
      opinion: 'Мнение',
      gallery: 'Снимки',
      about: 'За мен',
      read: 'Прочети',
      back: 'Назад',
      close: 'Затвори',
      next: 'Следваща',
      prev: 'Предишна',
      minRead: 'мин. четене',
      mood: 'Настроение',
      onlyBg: 'Тази история засега е само на български.',
      listView: 'Просто ми покажи списък',
      listViewShort: 'Списък',
      allPosts: 'Всички публикации',
      photos: 'снимки',
      photoCredits: 'Снимки: Wikimedia Commons',
      language: 'Език',
      switchTo: 'English',
      loading: 'Зареждане…',
      prototypes: 'Всички прототипи',
    },
    en: {
      stories: 'Stories',
      opinions: 'Opinions',
      story: 'Story',
      opinion: 'Opinion',
      gallery: 'Photos',
      about: 'About',
      read: 'Read',
      back: 'Back',
      close: 'Close',
      next: 'Next',
      prev: 'Previous',
      minRead: 'min read',
      mood: 'Mood',
      onlyBg: 'This one is only in Bulgarian for now.',
      listView: 'Just show me a list',
      listViewShort: 'List',
      allPosts: 'All posts',
      photos: 'photos',
      photoCredits: 'Photos: Wikimedia Commons',
      language: 'Language',
      switchTo: 'Български',
      loading: 'Loading…',
      prototypes: 'All prototypes',
    },
  };

  const LANGS = ['bg', 'en'];
  const KEY = 'blog-lang';

  function readStoredLang() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }

  function initialLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) return fromUrl;
    const stored = readStoredLang();
    return LANGS.includes(stored) ? stored : 'bg';
  }

  let lang = initialLang();
  document.documentElement.lang = lang;

  function setLang(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* private mode: language just won't persist */
    }
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', lang);
      history.replaceState(history.state, '', url);
    }
    window.dispatchEvent(new CustomEvent('blog:langchange', { detail: { lang } }));
  }

  const text = (obj) => (obj ? obj[lang] ?? obj.bg : '');

  function view(post) {
    const v = post[lang] || post.bg;
    return { title: v.title, excerpt: v.excerpt, body: v.body, translated: Boolean(post[lang]) };
  }

  function readMinutes(post) {
    const words = post.bg.body.reduce((n, b) => n + (b.p || b.quote || b.h || '').split(/\s+/).length, 0);
    return Math.max(1, Math.round(words / 180));
  }

  const dateFmt = {};
  function date(iso) {
    const locale = lang === 'bg' ? 'bg-BG' : 'en-GB';
    dateFmt[locale] ??= new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    // "12 октомври 2026 г." -> drop the trailing "г." for a cleaner look
    return dateFmt[locale].format(new Date(iso + 'T12:00:00')).replace(/\s*г\.$/, '');
  }

  const albums = C.albums.map((a) => ({
    ...a,
    photos: a.photos.map((p, index) => ({ ...p, album: a.slug, index })),
  }));

  window.Blog = {
    get lang() {
      return lang;
    },
    langs: LANGS,
    setLang,
    toggleLang: () => setLang(lang === 'bg' ? 'en' : 'bg'),
    onLangChange: (fn) => window.addEventListener('blog:langchange', (e) => fn(e.detail.lang)),
    t: (key) => STRINGS[lang][key] ?? STRINGS.bg[key] ?? key,
    text,
    site: C.site,
    posts: C.posts,
    stories: C.posts.filter((p) => p.type === 'story'),
    opinions: C.posts.filter((p) => p.type === 'opinion'),
    post: (slug) => C.posts.find((p) => p.slug === slug),
    view,
    albums,
    photos: albums.flatMap((a) => a.photos),
    photoUrl: (file) => `${SHARED}photos/${file}`,
    thumbUrl: (file) => `${SHARED}photos/thumbs/${file}`,
    date,
    readMinutes,
    creditsUrl: `${SHARED}credits.html`,
  };
})();
