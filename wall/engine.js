// Engine of the endless wall: helpers, strings, textures, wall objects, layout, world, camera, minimap, sound.
// (One file on purpose: fewer requests on a phone.)

/* ======================= util ======================= */

// Small helpers shared by the wall modules.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const rm = matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => rm.matches;
export const onReducedChange = (fn) => rm.addEventListener('change', fn);

/** Deterministic PRNG (mulberry32). */
export function rng32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash two ints (and a salt) into a 32-bit seed. */
export function hash2(i, j, salt = 0x9e37) {
  let h = (salt ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return h >>> 0;
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length) % arr.length];
export const between = (rnd, a, b) => a + rnd() * (b - a);

/** Weighted pick: entries [[value, weight], ...] */
export function weighted(rnd, entries) {
  let total = 0;
  for (const [, w] of entries) total += w;
  let r = rnd() * total;
  for (const [v, w] of entries) {
    r -= w;
    if (r <= 0) return v;
  }
  return entries[entries.length - 1][0];
}

/** Tiny element factory. */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k);
  return el;
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * A torn-paper clip-path polygon for a w×h box (px).
 * edges: which sides are torn (t, r, b, l). amp = how deep the bites go.
 */
export function tornClip(w, h, rnd, { amp = 6, step = 11, edges = 'trbl' } = {}) {
  const pts = [];
  const j = (e) => (edges.includes(e) ? 1 : 0);
  const jitter = (on) => (on ? rnd() * amp + (rnd() < 0.08 ? rnd() * amp * 1.6 : 0) : 0);
  const n = (len) => Math.max(2, Math.round(len / step));
  // top: left → right
  let k = n(w);
  for (let i = 0; i <= k; i++) pts.push([(i / k) * w, jitter(j('t'))]);
  k = n(h);
  for (let i = 1; i <= k; i++) pts.push([w - jitter(j('r')), (i / k) * h]);
  k = n(w);
  for (let i = k - 1; i >= 0; i--) pts.push([(i / k) * w, h - jitter(j('b'))]);
  k = n(h);
  for (let i = k - 1; i >= 1; i--) pts.push([jitter(j('l')), (i / k) * h]);
  return 'polygon(' + pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',') + ')';
}

/** Zig-zag ends for a strip of tape (w×h). */
export function tapeClip(w, h, rnd) {
  const pts = [];
  const teeth = 5;
  for (let i = 0; i <= teeth; i++) pts.push([rnd() * 4, (i / teeth) * h]);
  const right = [];
  for (let i = 0; i <= teeth; i++) right.push([w - rnd() * 4, (i / teeth) * h]);
  const poly = [...pts.reverse(), ...right];
  return 'polygon(' + poly.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',') + ')';
}

/** Interpolate between two views on a 2D map (van Wijk & Nuij smooth zoom). p = [x, y, w]. */
export function interpolateZoom(p0, p1, rho = 1.3) {
  const rho2 = rho * rho, rho4 = rho2 * rho2;
  const [ux0, uy0, w0] = p0;
  const [ux1, uy1, w1] = p1;
  const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
  let S, fn;
  if (d2 < 1e-9) {
    S = Math.log(w1 / w0) / rho;
    fn = (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    fn = (t) => {
      const s = t * S;
      const c0 = Math.cosh(r0);
      const u = (w0 / (rho2 * d1)) * (c0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * c0) / Math.cosh(rho * s + r0)];
    };
  }
  fn.duration = Math.abs(S) * 1000 * (rho / Math.SQRT2);
  return fn;
}

export const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
};

// CSS easings used with the Web Animations API
export const EASE = {
  out: 'cubic-bezier(.2,.8,.2,1)',
  inOut: 'cubic-bezier(.65,0,.35,1)',
  in: 'cubic-bezier(.5,0,.9,.3)',
  spring: 'linear(0, 0.18 6%, 0.62 15%, 0.95 24%, 1.08 32%, 1.06 40%, 1.0 52%, 0.985 62%, 1 78%, 1)',
  slap: 'linear(0, 0.35 12%, 0.82 28%, 1.03 40%, 0.99 52%, 1.005 66%, 1)',
};

/** Promise for a WAAPI animation that never rejects. */
export const done = (anim) => anim.finished.catch(() => {});

/* ======================= i18n ======================= */

// Concept-specific strings for the wall. Content (posts, albums, captions) always comes from window.Blog.
const DICT = {
  bg: {
    docTitle: 'Бъркотия — безкрайната стена',
    stageLabel: 'Безкрайната стена. Влачи, за да се разхождаш; щипни или скролни, за да приближиш.',
    home: 'Към началото',
    find: 'Намери',
    zoomIn: 'Приближи',
    zoomOut: 'Отдалечи',
    sound: 'Звук',
    soundOn: 'Включи звука',
    soundOff: 'Изключи звука',
    langTo: 'Switch to English',
    map: 'Карта на стената',
    fromHome: 'м от вкъщи',
    atHome: 'у дома',
    findTitle: 'Къде е…?',
    findNote: 'Избери нещо и стената ще те заведе дотам.',
    about: 'За мен',
    start: 'Началото на стената',
    hintDrag: 'Влачи, за да се разхождаш',
    hintZoom: 'Щипни или скролни за зуум',
    hintTap: 'Докосни бележка, за да я прочетеш',
    hintOk: 'Разбрах',
    album: 'Албум',
    prevPhoto: 'Предишна снимка',
    nextPhoto: 'Следваща снимка',
    backToWall: 'Обратно към стената',
    echo: 'ехо',
    echoOf: 'Ехо. Оригиналът е у дома — заведи ме там',
    storkTitle: 'Видя щъркел!',
    storkText: 'Вече официално можеш да свалиш мартеницата.',
    storkAgain: 'Пак той. Щъркелът си има любимо място.',
    storkHint: 'Видях щъркел натам!',
    lostTitle: 'НАМЕРЕНА КОТКА',
    lostText: 'Трицветна. Гледа като счетоводителка. Реагира само на отварящ се хладилник.',
    lostTab: 'Ваня ☎ МЯУ',
    magnetHint: 'Магнитите се местят',
    readerLabel: 'Публикация',
    viewerLabel: 'Снимки',
    listClose: 'Обратно към стената',
    toTop: 'Нагоре',
    sticker: 'стикер',
    loadingWall: 'Лепим стената…',
  },
  en: {
    docTitle: 'Bărkotiya — the endless wall',
    stageLabel: 'The endless wall. Drag to wander; pinch or scroll to zoom.',
    home: 'Back home',
    find: 'Find',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    sound: 'Sound',
    soundOn: 'Turn sound on',
    soundOff: 'Turn sound off',
    langTo: 'Превключи на български',
    map: 'Map of the wall',
    fromHome: 'm from home',
    atHome: 'at home',
    findTitle: 'Where’s…?',
    findNote: 'Pick something and the wall will take you there.',
    about: 'About',
    start: 'The start of the wall',
    hintDrag: 'Drag to wander',
    hintZoom: 'Pinch or scroll to zoom',
    hintTap: 'Tap a note to read it',
    hintOk: 'Got it',
    album: 'Album',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    backToWall: 'Back to the wall',
    echo: 'echo',
    echoOf: 'An echo. The original lives back home — take me there',
    storkTitle: 'You saw a stork!',
    storkText: 'You may now officially take off your martenitsa.',
    storkAgain: 'Him again. The stork has a favourite spot.',
    storkHint: 'Saw a stork that way!',
    lostTitle: 'FOUND: ONE CAT',
    lostText: 'Tricolour. Looks at you like an accountant. Only responds to the fridge door.',
    lostTab: 'Vanya ☎ MEOW',
    magnetHint: 'The magnets move',
    readerLabel: 'Post',
    viewerLabel: 'Photos',
    listClose: 'Back to the wall',
    toTop: 'Top',
    sticker: 'sticker',
    loadingWall: 'Pasting the wall…',
  },
};

// Sticky-note one-liners and other wall scribbles (bg/en pairs).
export const ONE_LINERS = [
  ['Купи мляко. И баница.', 'Buy milk. And banitsa.'],
  ['Обади се на баба!!', 'Call grandma!!'],
  ['Ваня е шефът тук.', 'Vanya is the boss here.'],
  ['Пет минути не са закъснение.', 'Five minutes isn’t late.'],
  ['Морето чака. През октомври.', 'The sea is waiting. In October.'],
  ['Не забравяй чадъра (пак)', 'Don’t forget the umbrella (again)'],
  ['Айрян > всичко', 'Ayran > everything'],
  ['Трамвай 23 = приключение', 'Tram 23 = adventure'],
  ['Да се изгубя нарочно ✓', 'Get lost on purpose ✓'],
  ['Космос? Защо не.', 'Outer space? Why not.'],
  ['Тук няма ред. И така е добре.', 'No order here. And that’s fine.'],
  ['Да мисля по-малко. Утре.', 'Overthink less. Tomorrow.'],
  ['Чай, не кафе. (лъжа)', 'Tea, not coffee. (lie)'],
  ['Мартеници: 17', 'Martenitsas: 17'],
  ['Видени щъркели: 0', 'Storks seen: 0'],
  ['Обичам те, Пловдив', 'Love you, Plovdiv'],
  ['Кукерите знаят.', 'The kukeri know.'],
  ['Върни ми пуловера!', 'Give my sweater back!'],
  ['Не пипай баницата', 'Hands off the banitsa'],
  ['Ако четеш това — здрасти!', 'If you’re reading this — hi!'],
  ['Стената продължава. Наистина.', 'The wall goes on. Really.'],
  ['Сандали ≠ калдъръм', 'Sandals ≠ cobblestones'],
  ['Хладилникът не е телевизор. — мама', 'The fridge is not a TV. — Mum'],
  ['Ще пиша. Обещавам.', 'I’ll write. Promise.'],
  ['Лекция за черни дупки, чет. 19:00', 'Black holes talk, Thu 7pm'],
  ['Бъркотия, но мила', 'A mess, but a nice one'],
];

export const STICKERS = [
  ['ДА!', 'YES!'],
  ['МЯУ', 'MEOW'],
  ['♥ СОФИЯ', '♥ SOFIA'],
  ['БАНИЦА', 'BANITSA'],
  ['ОК', 'OK'],
  ['УРА!', 'HOORAY!'],
  ['5 МИН', '5 MIN'],
  ['НАЗДРАВЕ', 'CHEERS'],
  ['ЧАО!', 'CIAO!'],
  ['★', '★'],
  ['☺', '☺'],
];

export const TAGS = [
  ['ВАНЯ', 'VANYA'],
  ['БЪРКОТИЯ', 'MESS'],
  ['ОБИЧАМ ТЕ', 'LOVE U'],
  ['ДА!', 'YES!'],
  ['МОРЕ', 'SEA'],
  ['23', '23'],
  ['ЩЪРКЕЛ?', 'STORK?'],
  ['ЕХО', 'ECHO'],
  ['КОСМОС', 'SPACE'],
];

export const REMNANT_WORDS = [
  ['КОНЦЕРТ', 'CONCERT'],
  ['ДИСКО', 'DISCO'],
  ['ПЕТЪК', 'FRIDAY'],
  ['21:00', '21:00'],
  ['ВХОД СВОБОДЕН', 'FREE ENTRY'],
  ['ПАРТИ', 'PARTY'],
  ['ТЕАТЪР', 'THEATRE'],
  ['ЦИРК', 'CIRCUS'],
  ['ПОД НАЕМ', 'FOR RENT'],
  ['ДЖАЗ', 'JAZZ'],
  ['ПАЗАР', 'MARKET'],
  ['САМО ДНЕС', 'TODAY ONLY'],
];

export const TICKETS = [
  { kind: 'tram', a: ['ГРАДСКИ ТРАНСПОРТ', 'CITY TRANSPORT'], b: ['Еднократен · 1,60 лв', 'Single ride · 1.60 lv'] },
  { kind: 'train', a: ['ВЛАК · СОФИЯ → ПЛОВДИВ', 'TRAIN · SOFIA → PLOVDIV'], b: ['Вагон 3 · Място 42', 'Car 3 · Seat 42'] },
  { kind: 'cinema', a: ['КИНО · ПРЕМИЕРА', 'CINEMA · PREMIERE'], b: ['Ред 7 · Място 12', 'Row 7 · Seat 12'] },
  { kind: 'gig', a: ['КОНЦЕРТ НА ПОКРИВА', 'ROOFTOP GIG'], b: ['Вход: 1 човек + 1 котка', 'Admits 1 human + 1 cat'] },
  { kind: 'museum', a: ['ПЛАНЕТАРИУМ', 'PLANETARIUM'], b: ['Черни дупки · 19:00', 'Black holes · 7pm'] },
];

export const SOUVENIRS = [
  ['НЕСЕБЪР', 'NESEBAR'],
  ['РИЛА', 'RILA'],
  ['ВАРНА', 'VARNA'],
  ['ПЛОВДИВ', 'PLOVDIV'],
  ['ТЪРНОВО', 'TARNOVO'],
  ['СОЗОПОЛ', 'SOZOPOL'],
  ['МЕЛНИК', 'MELNIK'],
];

export const CYR_MAGNETS = 'ЖЩЮЯФЪБДЛЦЧШЙЗИП';
export const MAG_WORDS = ['МЯУ', 'ДА', 'ЧАЙ', 'УРА', 'ХАОС', 'МОРЕ', 'ЖУЖ', 'ЩЕ', 'ЮХУ', 'ОК'];

export function tt(key) {
  const lang = window.Blog.lang;
  return (DICT[lang] && DICT[lang][key]) ?? DICT.bg[key] ?? key;
}

/** Pick bg/en from a [bg, en] pair. */
export const pair = (p) => (window.Blog.lang === 'en' ? p[1] : p[0]);

/* ======================= doodles ======================= */

// Hand-drawn SVG bits: marker doodles, the martenitsa, the stork, UI icons.

const DOODLE_SRC = {
  heart: '<path d="M50 82 C22 62 8 44 18 27 C28 12 46 18 50 33 C54 18 72 12 82 27 C92 44 78 62 50 82 Z"/>',
  star: '<path d="M50 9 L60 37 L90 39 L66 58 L75 89 L50 71 L25 89 L34 58 L10 39 L40 37 Z"/>',
  sun: '<circle cx="50" cy="50" r="16"/><path d="M50 12 V24 M50 76 V88 M12 50 H24 M76 50 H88 M23 23 L31 31 M69 69 L77 77 M77 23 L69 31 M31 69 L23 77"/>',
  spiral: '<path d="M50 50 c4 -3 9 0 8 5 c-1 7 -11 10 -16 4 c-7 -7 -2 -19 8 -20 c13 -2 22 10 18 22 c-5 14 -24 18 -35 9 c-13 -10 -12 -31 2 -40 c15 -10 37 -5 44 12"/>',
  cat: '<path d="M25 42 L21 14 L42 30 Q50 27 58 30 L79 14 L75 42 Q83 56 75 69 Q63 83 50 83 Q37 83 25 69 Q17 56 25 42 Z"/><circle cx="40" cy="51" r="3.4" fill="currentColor"/><circle cx="60" cy="51" r="3.4" fill="currentColor"/><path d="M46 60 L54 60 L50 65 Z"/><path d="M50 65 Q46 71 41 68 M50 65 Q54 71 59 68"/><path d="M30 61 L10 57 M30 65 L11 68 M70 61 L90 57 M70 65 L89 68"/>',
  tram: '<path d="M20 30 H80 Q86 30 86 36 V72 Q86 77 81 77 H19 Q14 77 14 72 V36 Q14 30 20 30 Z"/><path d="M22 38 H37 V52 H22 Z M43 38 H57 V52 H43 Z M63 38 H78 V52 H63 Z"/><circle cx="29" cy="81" r="5"/><circle cx="71" cy="81" r="5"/><path d="M50 30 L41 17 L59 10 M6 88 H94 M14 62 H86"/>',
  rocket: '<path d="M50 8 Q69 25 66 58 L34 58 Q31 25 50 8 Z"/><circle cx="50" cy="33" r="7"/><path d="M34 48 L21 66 L35 62 M66 48 L79 66 L65 62"/><path d="M41 62 Q50 90 59 62"/><path d="M46 66 Q50 78 54 66"/>',
  banitsa: '<circle cx="50" cy="50" r="41"/><path d="M50 50 c3 -3 8 -1 8 4 c0 7 -9 11 -15 6 c-8 -6 -5 -19 5 -22 c13 -4 25 8 21 21 c-4 15 -22 21 -35 13 c-14 -9 -15 -29 -3 -40 c12 -10 31 -10 42 1"/>',
  cloud: '<path d="M24 69 Q9 67 12 54 Q15 41 29 44 Q31 28 47 28 Q61 28 65 40 Q79 36 85 49 Q92 63 77 69 Z"/>',
  flower: '<circle cx="50" cy="38" r="7"/><path d="M50 31 C40 14 60 14 50 31 M57 38 C74 28 74 48 57 38 M50 45 C60 62 40 62 50 45 M43 38 C26 48 26 28 43 38"/><path d="M50 52 Q47 72 50 93 M50 74 Q61 64 70 67"/>',
  smiley: '<circle cx="50" cy="50" r="37"/><circle cx="38" cy="42" r="3.4" fill="currentColor"/><circle cx="62" cy="42" r="3.4" fill="currentColor"/><path d="M33 58 Q50 76 67 58"/>',
  mountain: '<path d="M6 82 L34 34 L48 56 L62 28 L94 82 Z"/><path d="M54 42 L62 28 L70 42 M28 46 L34 34 L40 45"/>',
  wave: '<path d="M6 40 Q18 28 30 40 T54 40 T78 40 T102 40 M6 60 Q18 48 30 60 T54 60 T78 60 T102 60"/>',
  note: '<path d="M38 80 V24 L78 15 V70"/><ellipse cx="29" cy="80" rx="9.5" ry="7.5"/><ellipse cx="69" cy="71" rx="9.5" ry="7.5"/><path d="M38 35 L78 26"/>',
  eye: '<path d="M8 50 Q50 16 92 50 Q50 84 8 50 Z"/><circle cx="50" cy="50" r="13"/><circle cx="50" cy="50" r="4.5" fill="currentColor"/>',
  bolt: '<path d="M57 7 L27 54 H48 L39 93 L75 40 H54 Z"/>',
  arrow: '<path d="M10 72 Q30 20 60 40 Q80 54 88 26"/><path d="M75 29 L88 24 L91 38"/>',
  moon: '<path d="M60 12 A38 38 0 1 0 88 70 A29 29 0 1 1 60 12 Z"/><path d="M80 20 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z"/>',
  house: '<path d="M14 50 L50 18 L86 50"/><path d="M24 42 V84 H76 V42"/><path d="M42 84 V62 H58 V84"/><path d="M64 30 V20 H72 V37"/>',
  cup: '<path d="M20 34 H72 V62 Q72 82 46 82 Q20 82 20 62 Z"/><path d="M72 42 Q90 42 88 56 Q86 66 72 64"/><path d="M36 26 Q32 18 38 12 M50 26 Q46 18 52 12"/>',
  kuker: '<path d="M30 44 Q20 18 8 14 Q20 30 22 52 M70 44 Q80 18 92 14 Q80 30 78 52"/><path d="M24 46 Q50 30 76 46 Q82 76 50 88 Q18 76 24 46 Z"/><circle cx="40" cy="58" r="4" fill="currentColor"/><circle cx="60" cy="58" r="4" fill="currentColor"/><path d="M38 72 L42 78 L46 72 L50 78 L54 72 L58 78 L62 72"/>',
};

export const DOODLES = Object.keys(DOODLE_SRC);

export function doodle(name) {
  return `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DOODLE_SRC[name] || D.star}</svg>`;
}

export const MARTENITSA = `<svg viewBox="0 0 120 300" aria-hidden="true">
<g fill="none" stroke-width="4.2" stroke-linecap="round">
<path d="M60 16 C67 31 53 41 60 57 C67 73 53 83 60 99 C63 107 62 111 60 117" stroke="#d3222c"/>
<path d="M60 16 C53 31 67 41 60 57 C53 73 67 83 60 99 C57 107 58 111 60 117" stroke="#f6f1e7"/>
<path d="M60 117 C49 125 39 131 36 148" stroke="#f6f1e7"/>
<path d="M60 117 C71 125 81 131 84 148" stroke="#d3222c"/>
</g>
<g transform="translate(36 146)" stroke="rgba(60,30,20,.25)" stroke-width="1">
<circle cx="0" cy="10" r="10" fill="#f8f3ea"/>
<rect x="-17" y="22" width="34" height="7" rx="3.5" fill="#f8f3ea"/>
<path d="M-9 22 L9 22 L12 76 L-12 76 Z" fill="#f8f3ea"/>
<path d="M-11 42 H11" stroke="#d3222c" stroke-width="5"/>
<path d="M0 54 V76 M-6 70 V82 M6 70 V82 M-10 74 V84 M10 74 V84" stroke="#e7dfd2" stroke-width="2"/>
<circle cx="-3.5" cy="9" r="1.3" fill="#3a2a22" stroke="none"/><circle cx="3.5" cy="9" r="1.3" fill="#3a2a22" stroke="none"/>
</g>
<g transform="translate(84 146)" stroke="rgba(60,10,10,.25)" stroke-width="1">
<circle cx="0" cy="10" r="10" fill="#d3222c"/>
<rect x="-17" y="22" width="34" height="7" rx="3.5" fill="#d3222c"/>
<path d="M-8 22 L8 22 L19 78 L-19 78 Z" fill="#d3222c"/>
<path d="M-11 40 H11" stroke="#f8f3ea" stroke-width="5"/>
<path d="M-15 76 V88 M-9 76 V90 M-3 76 V89 M3 76 V90 M9 76 V89 M15 76 V88" stroke="#b81b25" stroke-width="2.2"/>
<circle cx="-3.5" cy="9" r="1.3" fill="#fff" stroke="none"/><circle cx="3.5" cy="9" r="1.3" fill="#fff" stroke="none"/>
</g>
</svg>`;

export const STORK = `<svg viewBox="0 0 220 250" aria-hidden="true">
<ellipse cx="112" cy="232" rx="58" ry="9" fill="rgba(40,30,20,.18)"/>
<path d="M104 140 L104 226 M118 136 L132 168 L108 176" stroke="#d64a2b" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M96 226 L112 226" stroke="#d64a2b" stroke-width="5" stroke-linecap="round"/>
<path d="M62 106 C70 84 112 80 150 98 C172 108 188 122 196 134 C170 140 132 146 104 140 C80 136 58 126 62 106 Z" fill="#fbf8f2" stroke="#2b2622" stroke-width="3"/>
<path d="M98 102 C124 96 156 104 182 124 C190 130 194 134 196 134 C176 138 150 142 126 140 C140 132 132 116 98 102 Z" fill="#1f1b18"/>
<path d="M150 112 L170 118 M142 120 L166 128" stroke="#fbf8f2" stroke-width="2" opacity=".5"/>
<path d="M78 98 C66 80 60 66 64 44 L78 44 C76 64 84 80 94 94 Z" fill="#fbf8f2" stroke="#2b2622" stroke-width="3" stroke-linejoin="round"/>
<circle cx="70" cy="38" r="13" fill="#fbf8f2" stroke="#2b2622" stroke-width="3"/>
<path d="M58 36 L8 52 L58 42 Z" fill="#d64a2b" stroke="#a8341d" stroke-width="2" stroke-linejoin="round"/>
<circle cx="68" cy="35" r="2.6" fill="#1f1b18"/>
</svg>`;

export const LOST_CAT = `<svg viewBox="0 0 120 100" aria-hidden="true" fill="none" stroke="#1f1b18" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
<path d="M30 70 Q24 40 44 34 L42 16 L56 30 Q64 28 72 30 L86 16 L84 36 Q100 46 94 70 Q88 90 62 90 Q36 90 30 70 Z" fill="#fff"/>
<path d="M44 34 Q50 46 46 60 Q58 50 72 58 Q70 44 76 34" fill="#e8a24a" stroke="none" opacity=".85"/>
<path d="M30 70 Q24 54 34 46 Q42 60 36 76" fill="#2b2622" stroke="none"/>
<circle cx="54" cy="56" r="3" fill="#1f1b18"/><circle cx="74" cy="56" r="3" fill="#1f1b18"/>
<path d="M58 66 H70 M64 66 V70"/>
<path d="M50 52 L58 50 M78 50 L70 52" stroke-width="2.4"/>
</svg>`;

// Rough hand-drawn loop, used to circle things the camera flies to
export const SCRIBBLE_CIRCLE = `<svg viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden="true"><path d="M30 92 C10 58 40 18 100 14 C160 10 196 40 190 76 C184 116 120 132 72 124 C30 117 6 92 18 60 C26 40 50 28 70 24" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;

const I = {
  home: '<path d="M5 13 L16 4 L27 13"/><path d="M8 11 V27 H24 V11"/><path d="M13.5 27 V19.5 H18.5 V27"/>',
  find: '<circle cx="14" cy="14" r="8"/><path d="M20 20 L27 27"/><path d="M10.5 12 Q12 9.5 15 9.6"/>',
  minus: '<path d="M8 16 H24"/>',
  plus: '<path d="M8 16 H24 M16 8 V24"/>',
  soundOff: '<path d="M6 13 H11 L17 8 V24 L11 19 H6 Z"/><path d="M21 12.5 L27 19.5 M27 12.5 L21 19.5"/>',
  soundOn: '<path d="M6 13 H11 L17 8 V24 L11 19 H6 Z"/><path d="M21 12 Q24 16 21 20 M24 9 Q30 16 24 23"/>',
  close: '<path d="M9 9 L23 23 M23 9 L9 23"/>',
  prev: '<path d="M20 7 L11 16 L20 25"/>',
  next: '<path d="M12 7 L21 16 L12 25"/>',
  list: '<path d="M11 9 H26 M11 16 H26 M11 23 H26"/><circle cx="6" cy="9" r="1.2"/><circle cx="6" cy="16" r="1.2"/><circle cx="6" cy="23" r="1.2"/>',
  back: '<path d="M14 8 L6 16 L14 24 M6 16 H26"/>',
  up: '<path d="M8 18 L16 10 L24 18"/>',
  drag: '<path d="M16 4 V28 M4 16 H28"/><path d="M12 8 L16 4 L20 8 M12 24 L16 28 L20 24 M8 12 L4 16 L8 20 M24 12 L28 16 L24 20"/>',
  tap: '<circle cx="16" cy="13" r="4"/><path d="M8.5 13 A7.5 7.5 0 0 1 23.5 13"/><path d="M16 17 V28"/>',
  zoom: '<circle cx="14" cy="14" r="8"/><path d="M20 20 L27 27 M10.5 14 H17.5 M14 10.5 V17.5"/>',
};

export function icon(name) {
  return `<svg class="ico" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${I[name]}</svg>`;
}

/* ======================= textures ======================= */

// Procedural textures, painted once into canvases and handed to CSS as blob URLs.
// Raster images (not SVG filters) so zooming never re-runs expensive filters.

function fbm(size, cells0, octaves, seed, persistence = 0.5) {
  const out = new Float32Array(size * size);
  let amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const cells = cells0 << o;
    const r = rng32(seed * 31 + o * 977);
    const g = new Float32Array(cells * cells);
    for (let k = 0; k < g.length; k++) g[k] = r();
    const sc = cells / size;
    for (let y = 0; y < size; y++) {
      const gy = y * sc, y0 = gy | 0, fy = gy - y0, sy = fy * fy * (3 - 2 * fy), y1 = (y0 + 1) % cells;
      const r0 = y0 * cells, r1 = y1 * cells;
      for (let x = 0; x < size; x++) {
        const gx = x * sc, x0 = gx | 0, fx = gx - x0, sx = fx * fx * (3 - 2 * fx), x1 = (x0 + 1) % cells;
        const a = g[r0 + x0], b = g[r0 + x1], c = g[r1 + x0], d = g[r1 + x1];
        out[y * size + x] += (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy) * amp;
      }
    }
    norm += amp;
    amp *= persistence;
  }
  for (let k = 0; k < out.length; k++) out[k] /= norm;
  return out;
}

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

const toURL = (c, type = 'image/png', q) =>
  new Promise((res) => c.toBlob((b) => res(b ? URL.createObjectURL(b) : ''), type, q));

function plaster(size = 512) {
  const c = canvas(size), ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size), d = img.data;
  const low = fbm(size, 2, 6, 11, 0.55);
  const mid = fbm(size, 16, 3, 23, 0.5);
  const r = rng32(5);
  for (let i = 0; i < size * size; i++) {
    const m = (low[i] - 0.5) * 30 + (mid[i] - 0.5) * 12 + (r() - 0.5) * 9;
    const pit = r() < 0.012 ? -18 - r() * 18 : r() < 0.01 ? 10 : 0;
    const v = m + pit;
    d[i * 4] = 206 + v;
    d[i * 4 + 1] = 198 + v * 0.98;
    d[i * 4 + 2] = 184 + v * 0.92;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return toURL(c, 'image/jpeg', 0.88);
}

function cork(size = 256) {
  const c = canvas(size), ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size), d = img.data;
  const n = fbm(size, 8, 3, 41, 0.6);
  const r = rng32(9);
  for (let i = 0; i < size * size; i++) {
    const v = (n[i] - 0.5) * 34 + (r() - 0.5) * 22;
    d[i * 4] = 182 + v;
    d[i * 4 + 1] = 134 + v * 0.85;
    d[i * 4 + 2] = 86 + v * 0.6;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // granules, drawn with wrap-around so the tile repeats seamlessly
  for (let k = 0; k < 2200; k++) {
    const x = r() * size, y = r() * size, rad = 0.6 + r() * 2.1;
    const dark = r() < 0.6;
    ctx.fillStyle = dark ? `rgba(105,66,34,${0.35 + r() * 0.4})` : `rgba(226,184,128,${0.3 + r() * 0.4})`;
    for (const ox of [0, -size, size])
      for (const oy of [0, -size, size]) {
        if (x + ox < -4 || x + ox > size + 4 || y + oy < -4 || y + oy > size + 4) continue;
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, rad, rad * (0.6 + r() * 0.5), r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  return toURL(c, 'image/jpeg', 0.9);
}

function grain(size = 160) {
  const c = canvas(size), ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size), d = img.data;
  const r = rng32(77);
  for (let i = 0; i < size * size; i++) {
    const dark = r() < 0.55;
    const v = dark ? 0 : 255;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = (dark ? r() * 22 : r() * 18) | 0;
  }
  ctx.putImageData(img, 0, 0);
  return toURL(c);
}

/** Crumpled / wrinkled paper: transparent light & shadow, meant to sit on top of a coloured sheet. */
function wrinkle(seed, size = 512) {
  const c = canvas(size), ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size), d = img.data;
  const hgt = fbm(size, 2, 5, seed, 0.42);
  const r = rng32(seed * 7 + 1);
  // fold creases: tent-shaped ridges along random lines
  const folds = 5 + Math.floor(r() * 4);
  for (let f = 0; f < folds; f++) {
    const a = r() * Math.PI, nx = Math.cos(a), ny = Math.sin(a);
    const px = r() * size, py = r() * size;
    const W = 18 + r() * 60, s = (r() < 0.5 ? -1 : 1) * (0.02 + r() * 0.04);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dd = Math.abs((x - px) * nx + (y - py) * ny);
        if (dd < W) hgt[y * size + x] += s * (1 - dd / W);
      }
  }
  const L = [-0.55, -0.62, 0.56];
  const base = L[2];
  const k = 46;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const xl = x > 0 ? x - 1 : x, xr = x < size - 1 ? x + 1 : x;
      const yu = y > 0 ? y - 1 : y, yd = y < size - 1 ? y + 1 : y;
      const gx = (hgt[y * size + xl] - hgt[y * size + xr]) * k;
      const gy = (hgt[yu * size + x] - hgt[yd * size + x]) * k;
      const inv = 1 / Math.sqrt(gx * gx + gy * gy + 1);
      const shade = (gx * L[0] + gy * L[1] + L[2]) * inv;
      const delta = shade - base;
      const i = (y * size + x) * 4;
      if (delta < 0) {
        d[i] = 30; d[i + 1] = 22; d[i + 2] = 14;
        d[i + 3] = Math.min(150, -delta * 300);
      } else {
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = Math.min(120, delta * 320);
      }
    }
  ctx.putImageData(img, 0, 0);
  return toURL(c);
}

export async function makeTextures() {
  const root = document.documentElement.style;
  const [p, k, g, w0, w1] = await Promise.all([plaster(), cork(), grain(), wrinkle(3), wrinkle(8)]);
  if (p) root.setProperty('--tex-plaster', `url(${p})`);
  if (k) root.setProperty('--tex-cork', `url(${k})`);
  if (g) root.setProperty('--tex-grain', `url(${g})`);
  if (w0) root.setProperty('--tex-wrinkle-0', `url(${w0})`);
  if (w1) root.setProperty('--tex-wrinkle-1', `url(${w1})`);
}

/* ======================= items ======================= */

// DOM builders for everything that lives on the wall.
// Every builder returns an item record: { id, kind, x, y, w, h, r, el, face, render, hit, layer }.
// `render()` (re)fills language-dependent text so the language switch can re-paste items live.

const B = () => window.Blog;

export const INKS = { blue: '#22388f', black: '#211d1a', red: '#c42a2a', green: '#1f6b4a', purple: '#5b2c83' };
const PIN_COLORS = ['#e23b2e', '#f2b705', '#2a62d4', '#2f9e63', '#f3efe6', '#e5539a'];
const MAG_COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#3d5af1', '#ffbe0b', '#8338ec', '#fb5607', '#06a77d'];
const STICKY_COLORS = ['#ffe66d', '#ff9ec7', '#9ef0c6', '#ffb86b', '#9fd8ff', '#d7b8ff'];

export function place(item) {
  const { el, x, y, r = 0 } = item;
  el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${r}deg)`;
  if (item.w) el.style.width = item.w + 'px';
  if (item.fixedH) el.style.height = item.h + 'px';
}

function base(d, tag, cls, attrs = {}) {
  const el = h(tag, { class: 'it ' + cls, ...attrs });
  if (d.id) el.dataset.id = d.id;
  const face = h('div', { class: 'face' });
  el.append(face);
  const item = { ...d, el, face, render: () => {} };
  return item;
}

/* ---------- holders: tape, pins, magnets ---------- */

function tape(rnd, { x, y, r, w = 120, kind = 'mask' }) {
  const hgt = kind === 'washi' ? 30 : 34;
  const t = h('i', { class: `tape tape--${kind}`, 'aria-hidden': 'true' });
  t.style.cssText = `width:${w}px;height:${hgt}px;left:${x}%;top:${y}%;--tr:rotate(${r}deg);clip-path:${tapeClip(w, hgt, rnd)};--wv:${Math.floor(rnd() * 4)}`;
  return t;
}

function pin(rnd, x = 50, y = 0, color) {
  const c = color || pick(rnd, PIN_COLORS);
  const p = h('i', { class: 'pin', 'aria-hidden': 'true' });
  p.style.cssText = `left:${x}%;top:${y}%;--c:${c}`;
  return p;
}

function magnet(rnd, x = 50, y = 0, color) {
  const c = color || pick(rnd, MAG_COLORS);
  const m = h('i', { class: 'magnet', 'aria-hidden': 'true' });
  m.style.cssText = `left:${x}%;top:${y}%;--c:${c}`;
  return m;
}

function addHolders(item, rnd, hold) {
  const kinds = ['mask', 'mask', 'washi', 'clear'];
  const k = item.tapeKind || pick(rnd, kinds);
  const els = [];
  switch (hold) {
    case 'tape2':
      els.push(tape(rnd, { x: 6, y: 2, r: -38 - rnd() * 10, w: 110, kind: k }));
      els.push(tape(rnd, { x: 94, y: 2, r: 36 + rnd() * 10, w: 110, kind: k }));
      break;
    case 'tape4':
      els.push(tape(rnd, { x: 4, y: 2, r: -42, w: 96, kind: k }));
      els.push(tape(rnd, { x: 96, y: 2, r: 40, w: 96, kind: k }));
      els.push(tape(rnd, { x: 4, y: 98, r: 40, w: 96, kind: k }));
      els.push(tape(rnd, { x: 96, y: 98, r: -40, w: 96, kind: k }));
      break;
    case 'tape1':
      els.push(tape(rnd, { x: 50, y: 0, r: between(rnd, -7, 7), w: 128, kind: k }));
      break;
    case 'pin':
      els.push(pin(rnd, 50, 3, item.pinColor));
      break;
    case 'pin2':
      els.push(pin(rnd, 12, 4, item.pinColor), pin(rnd, 88, 4, item.pinColor));
      break;
    case 'magnet':
      els.push(magnet(rnd, 50, 2, item.magColor));
      break;
    case 'souvenir':
      els.push(souvenirMagnet(rnd, 50, 0, item.souvenir));
      break;
  }
  item.holders = els;
  item.el.append(...els);
}

function souvenirMagnet(rnd, x, y, which) {
  const p = which || pick(rnd, SOUVENIRS);
  const m = h('i', { class: 'souvenir', 'aria-hidden': 'true' });
  m.style.cssText = `left:${x}%;top:${y}%;--c:${pick(rnd, ['#1f6fb2', '#d1495b', '#2a9d8f', '#e9a03b'])};--r:${between(rnd, -10, 10)}deg`;
  m.dataset.pair = JSON.stringify(p);
  m.textContent = pair(p);
  return m;
}

/* ---------- content: posts ---------- */

export function letterItem(d) {
  const post = B().post(d.slug);
  const it = base(d, 'a', `letter letter--${d.paper}`, { href: `#/post/${d.slug}`, draggable: 'false' });
  it.hit = { type: 'post', slug: d.slug };
  it.content = true;
  const rnd = rng32(hashStr(d.id));
  addHolders(it, rnd, d.hold || 'tape2');
  it.render = () => {
    const Bl = B();
    const v = Bl.view(post);
    it.el.lang = v.translated ? Bl.lang : 'bg';
    it.el.setAttribute('aria-label', `${Bl.t('story')}: ${v.title}`);
    it.face.innerHTML = `
      <div class="letter__head"><span class="letter__type">${esc(Bl.t('story'))}</span><time>${esc(Bl.date(post.date))}</time></div>
      <h3 class="letter__title">${esc(v.title)}</h3>
      <p class="letter__ex">${esc(v.excerpt)}</p>
      <div class="letter__foot"><span class="letter__mood">${esc(Bl.t('mood'))}: ${esc(Bl.text(post.mood))}</span><span class="letter__read">${esc(Bl.t('read'))} <b>→</b></span></div>
      ${v.translated ? '' : `<span class="letter__only" lang="${Bl.lang}">${esc(Bl.t('onlyBg'))}</span>`}`;
  };
  return it;
}

let measureCtx;
function fitWords(text, font, availW, availH, maxFs, minFs, lh) {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  measureCtx.font = `100px ${font}`;
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const ws = words.map((w) => measureCtx.measureText(w).width);
  const space = measureCtx.measureText(' ').width;
  for (let fs = maxFs; fs >= minFs; fs -= 2) {
    const s = fs / 100;
    if (Math.max(...ws) * s > availW) continue;
    let lines = 1, cur = 0;
    for (const w of ws) {
      const add = (cur ? space : 0) + w;
      if ((cur + add) * s > availW) {
        lines++;
        cur = w;
      } else cur += add;
    }
    if (lines * fs * lh <= availH) return fs;
  }
  return minFs;
}

const POSTER_MOTIF = [
  // waves + sun
  `<svg viewBox="0 0 200 120" aria-hidden="true"><circle cx="150" cy="44" r="30" fill="currentColor" opacity=".9"/><path d="M0 80 Q25 64 50 80 T100 80 T150 80 T200 80 V120 H0 Z" fill="currentColor"/><path d="M0 98 Q25 84 50 98 T100 98 T150 98 T200 98" fill="none" stroke="var(--bg)" stroke-width="5"/></svg>`,
  // clock, five past
  `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="9"/><path d="M60 60 V22 M60 60 L76 34" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><circle cx="60" cy="60" r="7" fill="currentColor"/><path d="M60 14 V20 M106 60 H100 M60 106 V100 M14 60 H20" stroke="currentColor" stroke-width="6"/></svg>`,
  // twisted red-white cord
  `<svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20 C25 0 25 40 50 20 S75 0 100 20 S125 40 150 20 S175 0 200 20 S225 40 250 20 S275 0 300 20 S325 40 350 20 S375 0 400 20" fill="none" stroke="#d3222c" stroke-width="10"/><path d="M0 20 C25 40 25 0 50 20 S75 40 100 20 S125 0 150 20 S175 40 200 20 S225 0 250 20 S275 40 300 20 S325 0 350 20 S375 40 400 20" fill="none" stroke="#fff" stroke-width="10"/></svg>`,
];

export function posterItem(d) {
  const post = B().post(d.slug);
  const it = base(d, 'a', `poster poster--v${d.variant}`, { href: `#/post/${d.slug}`, draggable: 'false' });
  it.hit = { type: 'post', slug: d.slug };
  it.content = true;
  it.fixedH = true;
  const rnd = rng32(hashStr(d.id));
  const clip = tornClip(d.w, d.h, rnd, { amp: 9, step: 13 });
  const under = h('div', { class: 'poster__under', 'aria-hidden': 'true' });
  under.style.clipPath = tornClip(d.w, d.h, rnd, { amp: 14, step: 16 });
  it.el.prepend(under);
  it.render = () => {
    const Bl = B();
    const v = Bl.view(post);
    it.el.lang = v.translated ? Bl.lang : 'bg';
    it.el.setAttribute('aria-label', `${Bl.t('opinion')}: ${v.title}`);
    const fs = fitWords(v.title, '"Dela Gothic One"', d.w - 84, d.h * 0.5, 84, 34, 1.02);
    const n = Bl.opinions.indexOf(post) + 1;
    it.face.innerHTML = `
      <div class="poster__sheet" style="clip-path:${clip}">
        <div class="poster__kick"><span>★</span> ${esc(Bl.t('opinion'))} № ${n} <span>★</span></div>
        <h3 class="poster__title" style="font-size:${fs}px">${v.title.split(/\s+/).map((w) => `<span class="nw">${esc(w)}</span>`).join(' ')}</h3>
        <p class="poster__ex">${esc(v.excerpt)}</p>
        <div class="poster__foot"><time>${esc(Bl.date(post.date))}</time><span>${esc(Bl.t('mood'))}: ${esc(Bl.text(post.mood))}</span></div>
        <span class="poster__motif">${POSTER_MOTIF[d.variant % POSTER_MOTIF.length]}</span>
        <span class="poster__cta">${esc(Bl.t('read'))}!</span>
        <i class="poster__wrinkle"></i>
      </div>`;
  };
  return it;
}

/* ---------- content: photos ---------- */

export function retryOnce(img) {
  img.addEventListener('error', function retry() {
    img.removeEventListener('error', retry);
    const src = img.getAttribute('src');
    setTimeout(() => img.setAttribute('src', src + (src.includes('?') ? '&' : '?') + 'r=1'), 900);
  });
}

export function photoItem(d) {
  const Bl = B();
  const album = Bl.albums.find((a) => a.slug === d.album);
  const photo = album.photos[d.index];
  const it = base(d, 'button', `${d.style} ${d.style}--${d.frame || 'white'}`, { type: 'button' });
  it.hit = { type: 'photo', album: d.album, index: d.index };
  it.content = true;
  it.photo = photo;
  const rnd = rng32(hashStr(d.id));
  const isPolaroid = d.style === 'polaroid';
  const aspect = isPolaroid ? 1 : photo.h / photo.w;
  it.aspect = aspect;
  const img = h('img', {
    src: Bl.thumbUrl(photo.file),
    alt: '',
    loading: 'lazy',
    decoding: 'async',
    draggable: 'false',
    width: 640,
    height: Math.round(640 * (photo.h / photo.w)),
  });
  retryOnce(img);
  const ph = h('div', { class: 'ph', style: `aspect-ratio:${isPolaroid ? '1' : `${photo.w}/${photo.h}`}` }, img);
  const cap = h('p', { class: isPolaroid ? 'polaroid__cap' : 'print__label' });
  it.face.append(ph, cap);
  addHolders(it, rnd, d.hold);
  it.img = img;
  it.render = () => {
    const c = B().text(photo.caption);
    img.alt = c;
    cap.textContent = c;
    cap.classList.toggle('is-long', c.length > 44);
    it.el.querySelectorAll('.souvenir').forEach((m) => (m.textContent = pair(JSON.parse(m.dataset.pair))));
    it.el.setAttribute('aria-label', `${B().text(album.title)} — ${c}`);
  };
  return it;
}

/* ---------- content: album labels ---------- */

export function albumLabelItem(d) {
  const Bl = B();
  const album = Bl.albums.find((a) => a.slug === d.album);
  const it = base(d, 'button', `alabel alabel--${d.variant}`, { type: 'button' });
  it.hit = { type: 'photo', album: d.album, index: 0 };
  it.content = true;
  const rnd = rng32(hashStr(d.id));
  if (d.hold) addHolders(it, rnd, d.hold);
  it.render = () => {
    const B2 = B();
    const title = B2.text(album.title);
    const note = B2.text(album.note);
    const count = `${album.photos.length} ${B2.t('photos')}`;
    it.el.setAttribute('aria-label', `${tt('album')}: ${title} — ${count}`);
    let inner = '';
    switch (d.variant) {
      case 'sign':
        inner = `<div class="sign"><span class="sign__no">${album.photos.length}</span><span class="sign__t">${esc(title)}</span><span class="sign__c">${esc(count)}</span></div>`;
        break;
      case 'postcard':
        inner = `<div class="pcard"><div class="pcard__l"><span class="pcard__hi">${esc(B2.lang === 'bg' ? 'Поздрави от' : 'Greetings from')}</span><span class="pcard__t">${esc(title)}</span></div><div class="pcard__r"><i class="pcard__stamp"></i><span class="pcard__c">${esc(count)}</span></div></div>`;
        break;
      case 'trail':
        inner = `<div class="trail"><span class="trail__mark"></span><span class="trail__t">${esc(title)}</span><span class="trail__c">${esc(count)} ↗</span></div>`;
        break;
      case 'tile':
        inner = `<div class="tile"><span class="tile__t">${esc(title)}</span><span class="tile__c">${esc(count)}</span></div>`;
        break;
      default:
        inner = `<div class="dymo dymo--red"><span class="dymo__strip">${esc(title)} · ${esc(count)}</span></div>`;
    }
    it.face.innerHTML = inner + `<p class="alabel__note">${esc(note)}</p>`;
  };
  return it;
}

/* ---------- content: masthead & friends ---------- */

export function mastheadItem(d) {
  const it = base(d, 'h1', 'masthead');
  it.content = true;
  it.render = () => {
    const name = B().text(B().site.name);
    it.el.setAttribute('aria-label', name);
    const letters = [...name.toUpperCase()];
    const fs = Math.min(176, (d.w * 0.98) / (letters.length * 0.74));
    const rnd = rng32(hashStr(name));
    it.face.style.fontSize = fs + 'px';
    it.face.innerHTML = letters
      .map((ch, i) => {
        const c = MAG_COLORS[(i * 3 + 1) % MAG_COLORS.length];
        const r = between(rnd, -9, 9).toFixed(1);
        const y = between(rnd, -0.08, 0.08).toFixed(2);
        return `<span class="mag-l" aria-hidden="true" style="--c:${c};--r:${r}deg;--y:${y}em">${esc(ch)}</span>`;
      })
      .join('');
  };
  return it;
}

export function taglineItem(d) {
  const it = base(d, 'p', 'tagline');
  it.content = true;
  it.render = () => {
    const t = B().text(B().site.tagline);
    const words = t.split(' ');
    // split in two strips of similar length
    let best = 1, bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
      if (diff < bestDiff) (bestDiff = diff), (best = i);
    }
    const a = words.slice(0, best).join(' '), b = words.slice(best).join(' ');
    it.face.innerHTML = `<span class="dymo__strip" style="--r:-1.2deg">${esc(a)}</span><span class="dymo__strip" style="--r:.9deg">${esc(b)}</span>`;
  };
  return it;
}

export function meaningItem(d) {
  const it = base(d, 'p', 'meaning');
  it.content = true;
  it.render = () => {
    it.face.innerHTML = `<span>${esc(B().text(B().site.nameMeaning))}</span>${doodle('arrow')}`;
  };
  return it;
}

export function aboutItem(d) {
  const it = base(d, 'section', 'about');
  it.content = true;
  const rnd = rng32(hashStr(d.id));
  addHolders(it, rnd, 'magnet');
  it.render = () => {
    it.face.innerHTML = `<h2 class="about__h">${esc(B().t('about'))}</h2><p>${esc(B().text(B().site.about))}</p>`;
  };
  return it;
}

/* ---------- surfaces ---------- */

export function fridgeItem(d) {
  const it = base(d, 'div', 'fridge', { 'aria-hidden': 'true' });
  it.fixedH = true;
  it.face.innerHTML = `<i class="fridge__gasket"></i><i class="fridge__handle"></i><i class="fridge__shine"></i><i class="fridge__badge">❄</i>`;
  return it;
}

export function corkItem(d) {
  const it = base(d, 'div', 'cork', { 'aria-hidden': 'true' });
  it.fixedH = true;
  it.face.innerHTML = `<i class="cork__in"></i>`;
  return it;
}

/* ---------- filler: the wall's everyday clutter ---------- */

function decor(d, cls, tag = 'div') {
  const it = base(d, tag, cls, { 'aria-hidden': 'true' });
  return it;
}

export function stickyItem(d, rnd) {
  const it = decor(d, 'sticky');
  it.el.style.setProperty('--c', d.color || pick(rnd, STICKY_COLORS));
  const p = d.line || pick(rnd, ONE_LINERS);
  it.render = () => (it.face.innerHTML = `<p>${esc(pair(p))}</p>`);
  if (rnd() < 0.2) addHolders(it, rnd, 'pin');
  return it;
}

export function scrapItem(d, rnd) {
  const it = decor(d, 'scrap');
  it.face.style.clipPath = tornClip(d.w, d.h, rnd, { amp: 7, step: 9, edges: 't' });
  it.el.style.color = pick(rnd, [INKS.blue, INKS.black, INKS.red, INKS.purple]);
  const p = d.line || pick(rnd, ONE_LINERS);
  it.render = () => (it.face.innerHTML = `<p>${esc(pair(p))}</p>`);
  addHolders(it, rnd, rnd() < 0.5 ? 'tape1' : 'pin');
  return it;
}

export function doodleItem(d, rnd) {
  const it = decor(d, 'doodle');
  it.el.style.color = d.ink || pick(rnd, Object.values(INKS));
  it.face.innerHTML = doodle(d.name);
  return it;
}

export function ticketItem(d, rnd) {
  const it = decor(d, `ticket ticket--${d.t.kind}`);
  const no = String(100000 + Math.floor(rnd() * 899999));
  it.render = () =>
    (it.face.innerHTML = `<span class="ticket__a">${esc(pair(d.t.a))}</span><span class="ticket__no">№ ${no}</span><span class="ticket__b">${esc(pair(d.t.b))}</span><i class="ticket__hole"></i>`);
  if (rnd() < 0.5) addHolders(it, rnd, 'tape1');
  return it;
}

export function stickerItem(d, rnd) {
  const shape = pick(rnd, ['round', 'round', 'pill', 'star']);
  const it = decor(d, `sticker sticker--${shape}`);
  it.el.style.setProperty('--c', pick(rnd, ['#ff4f7b', '#ffd23f', '#3bceac', '#4d7cfe', '#ff8c42', '#1f1b18']));
  it.el.style.setProperty('--t', pick(rnd, ['#fff', '#1f1b18']));
  const p = pick(rnd, STICKERS);
  it.render = () => {
    const t = pair(p);
    const inner = d.w * (shape === 'pill' ? 1.6 : 0.78);
    it.face.style.fontSize = Math.min(d.w * 0.3, inner / Math.max(1, t.length * 0.66)).toFixed(1) + 'px';
    it.face.innerHTML = `<span>${esc(t)}</span>`;
  };
  return it;
}

export function magLetterItem(d, rnd) {
  const it = decor(d, 'maglet');
  it.el.style.setProperty('--c', d.color || pick(rnd, MAG_COLORS));
  it.face.textContent = d.ch;
  return it;
}

export function martenitsaItem(d) {
  const it = decor(d, 'marti');
  it.face.innerHTML = MARTENITSA;
  it.el.append(h('i', { class: 'pin pin--marti', style: 'left:50%;top:3%;--c:#2a62d4', 'aria-hidden': 'true' }));
  return it;
}

export function remnantItem(d, rnd) {
  const it = decor(d, 'remnant');
  it.fixedH = true;
  const sheets = [];
  const n = 2 + Math.floor(rnd() * 2);
  const palette = ['#e9b9a5', '#c8d6c0', '#e8d48f', '#b9c6dc', '#e2a7b8', '#d9cfc0', '#f0e2c8'];
  for (let i = 0; i < n; i++) {
    const w = d.w * between(rnd, 0.55, 0.95), hh = d.h * between(rnd, 0.5, 0.95);
    const x = between(rnd, 0, d.w - w), y = between(rnd, 0, d.h - hh);
    sheets.push({
      w, h: hh, x, y,
      bg: pick(rnd, palette),
      word: pick(rnd, REMNANT_WORDS),
      clip: tornClip(w, hh, rnd, { amp: 18, step: 18 }),
      fs: between(rnd, 50, 110),
      rot: between(rnd, -3, 3),
      wr: Math.floor(rnd() * 2),
    });
  }
  it.render = () => {
    it.face.innerHTML = sheets
      .map(
        (s) =>
          `<div class="remnant__s" style="width:${s.w}px;height:${s.h}px;left:${s.x}px;top:${s.y}px;--bg:${s.bg};clip-path:${s.clip};transform:rotate(${s.rot}deg);--wr:var(--tex-wrinkle-${s.wr})"><span style="font-size:${s.fs}px">${esc(pair(s.word))}</span></div>`
      )
      .join('');
  };
  return it;
}

export function patchItem(d, rnd) {
  const it = decor(d, `patch patch--${d.variant}`);
  it.fixedH = true;
  if (d.variant === 'brick' || d.variant === 'paint') it.face.style.clipPath = tornClip(d.w, d.h, rnd, { amp: 26, step: 24 });
  if (d.variant === 'paint') it.el.style.setProperty('--c', pick(rnd, ['#bdb6a8', '#c9c2b0', '#a9a69c', '#c7b9a3']));
  if (d.variant === 'crack')
    it.face.innerHTML = `<svg viewBox="0 0 300 300" preserveAspectRatio="none"><path d="M10 ${between(rnd, 20, 280)} L${between(rnd, 60, 90)} ${between(rnd, 80, 160)} L${between(rnd, 120, 160)} ${between(rnd, 100, 200)} L${between(rnd, 180, 220)} ${between(rnd, 60, 240)} L290 ${between(rnd, 40, 260)} M${between(rnd, 120, 160)} 150 L${between(rnd, 140, 200)} ${between(rnd, 240, 290)}" fill="none" stroke="rgba(70,58,44,.45)" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  return it;
}

export function tagItem(d, rnd) {
  const it = decor(d, 'tag');
  it.el.style.color = pick(rnd, ['#ff3f8e', '#1f1b18', '#2fbf71', '#2f6df6', '#ff7a1a', '#7a3cff']);
  it.el.style.fontSize = (d.fs || 90) + 'px';
  const p = d.word || pick(rnd, TAGS);
  it.render = () => (it.face.textContent = pair(p));
  return it;
}

export function stapleItem(d) {
  const it = decor(d, 'staples');
  it.face.innerHTML = '<i></i><i></i><i></i>';
  return it;
}

export function lostCatItem(d, rnd) {
  const it = decor(d, 'lostcat');
  addHolders(it, rnd, 'tape1');
  it.hit = { type: 'lostcat' };
  it.render = () => {
    const torn = it.torn || new Set();
    it.face.innerHTML = `<h4>${esc(tt('lostTitle'))}</h4>${LOST_CAT}<p>${esc(tt('lostText'))}</p><div class="lostcat__tabs">${Array.from(
      { length: 7 },
      (_, i) => `<span class="lostcat__tab${torn.has(i) ? ' is-torn' : ''}" data-tab="${i}">${esc(tt('lostTab'))}</span>`
    ).join('')}</div>`;
  };
  return it;
}

export function storkItem(d) {
  const it = decor(d, 'stork');
  it.hit = { type: 'stork' };
  it.face.innerHTML = STORK;
  return it;
}

export function hintItem(d, rnd) {
  const it = decor(d, 'sticky sticky--hint');
  it.el.style.setProperty('--c', '#fff27a');
  it.render = () =>
    (it.face.innerHTML = `<p>${esc(tt('storkHint'))}</p><span class="hint__arrow" style="transform:rotate(${d.angle}deg)">${doodle('arrow')}</span>`);
  return it;
}

export function echoItem(d, rnd) {
  const it = decor(d, `echo echo--${d.src.kind}`, 'button');
  it.el.removeAttribute('aria-hidden');
  it.el.type = 'button';
  it.el.tabIndex = -1;
  it.hit = { type: 'echo', target: d.src.id };
  it.render = () => {
    const Bl = B();
    let inner = '';
    if (d.src.kind === 'poster' || d.src.kind === 'letter') {
      const v = Bl.view(Bl.post(d.src.slug));
      inner = `<span class="echo__t">${esc(v.title)}</span>`;
    } else if (d.src.kind === 'photo') {
      const a = Bl.albums.find((x) => x.slug === d.src.album);
      const p = a.photos[d.src.index];
      inner = `<img src="${Bl.thumbUrl(p.file)}" alt="" loading="lazy" decoding="async" draggable="false"><span class="echo__c">${esc(Bl.text(p.caption))}</span>`;
    }
    it.el.setAttribute('aria-label', tt('echoOf'));
    it.face.innerHTML = `${inner}<span class="echo__badge">↩ ${esc(tt('echo'))}</span>`;
  };
  return it;
}

export function chunkBg(i, j, C) {
  const el = h('div', { class: 'chunkbg', 'aria-hidden': 'true' });
  el.style.transform = `translate(${i * C - 1}px,${j * C - 1}px)`;
  el.style.width = el.style.height = C + 2 + 'px';
  return el;
}

export function stringLine(points, color = '#c8262c') {
  // red thread between pins
  const minX = Math.min(...points.map((p) => p[0])) - 10;
  const minY = Math.min(...points.map((p) => p[1])) - 10;
  const maxX = Math.max(...points.map((p) => p[0])) + 10;
  const maxY = Math.max(...points.map((p) => p[1])) + 30;
  const w = maxX - minX, hh = maxY - minY;
  let d = '';
  points.forEach(([x, y], i) => {
    const px = x - minX, py = y - minY;
    if (!i) d += `M${px} ${py}`;
    else {
      const [x0, y0] = points[i - 1];
      const mx = (x0 + x) / 2 - minX, my = (y0 + y) / 2 - minY + 22;
      d += ` Q${mx} ${my} ${px} ${py}`;
    }
  });
  const el = h('div', { class: 'thread', 'aria-hidden': 'true' });
  el.style.cssText = `transform:translate(${minX}px,${minY}px);width:${w}px;height:${hh}px`;
  el.innerHTML = `<svg width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}"><path d="${d}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3" transform="translate(3 5)"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  return el;
}

export const BUILDERS = {
  sticky: stickyItem,
  scrap: scrapItem,
  doodle: doodleItem,
  ticket: ticketItem,
  sticker: stickerItem,
  maglet: magLetterItem,
  marti: martenitsaItem,
  remnant: remnantItem,
  patch: patchItem,
  tag: tagItem,
  staples: stapleItem,
  lostcat: lostCatItem,
  stork: storkItem,
  hint: hintItem,
  echo: echoItem,
};

/* ======================= layout ======================= */

// The curated heart of the wall: where every real post, album and photo lives.
// World units are CSS px at zoom 1. The fridge door sits at the origin.

export const HOME = { x: 120, y: -40, w: 2700, h: 1900 };

export function buildLayout() {
  const Bl = window.Blog;
  const rnd = rng32(20261031);
  const surfaces = [];
  const content = [];
  const decor = [];
  const threads = [];

  // ---------- surfaces ----------
  surfaces.push({ id: 's:fridge', kind: 'fridge', x: 0, y: 0, w: 1640, h: 1500, r: 0 });
  surfaces.push({ id: 's:cork', kind: 'cork', x: -1580, y: 10, w: 1180, h: 1420, r: -0.6 });
  surfaces.push({ id: 's:cork2', kind: 'cork', x: -1150, y: 1440, w: 2000, h: 900, r: 0.4 });
  decor.push({ kind: 'remnant', x: 1830, y: 0, w: 1900, h: 1060, r: 0, layer: 'surface', seed: 4 });
  decor.push({ kind: 'remnant', x: 60, y: -1360, w: 760, h: 520, r: 1.5, layer: 'surface', seed: 9 });
  decor.push({ kind: 'tag', word: ['ЗДРАВЕЙ!', 'HELLO YOU!'], x: -140, y: -905, w: 820, h: 150, r: -5, fs: 128, layer: 'surface' });

  // ---------- fridge: masthead, tagline, about, traditions ----------
  content.push({ id: 'masthead', kind: 'masthead', x: 0, y: -548, w: 1320, h: 220, r: 0 });
  content.push({ id: 'tagline', kind: 'tagline', x: -10, y: -356, w: 1180, h: 130, r: 0 });
  content.push({ id: 'meaning', kind: 'meaning', x: 590, y: -236, w: 300, h: 130, r: -4 });
  content.push({ id: 'about', kind: 'about', x: -385, y: -150, w: 530, h: 340, r: -1.8 });

  const albumOf = (slug) => Bl.albums.find((a) => a.slug === slug);

  // Traditions — prints held by souvenir magnets on the fridge
  const trad = albumOf('traditsii');
  content.push({ id: 'album:traditsii', kind: 'alabel', album: 'traditsii', variant: 'dymo', x: 140, y: -118, w: 300, h: 150, r: 2.5 });
  const tradSpots = [
    [-590, 145], [-235, 125], [130, 160], [520, 170],
    [-470, 500], [-60, 520], [400, 520],
  ];
  // Each magnet sits right above its photo and reads like a place tag, so it must be true to the photo.
  const tradMagnets = {
    'kukeri.jpg': ['ПЕРНИК', 'PERNIK'],
    'kuker-mask.jpg': ['СУРВА', 'SURVA'],
    'kukeri-2.jpg': ['ПЕРНИК', 'PERNIK'],
    'martenitsa-tree.jpg': ['БОТЕВГРАД', 'BOTEVGRAD'],
    'martenitsa-bells.jpg': ['БАБА МАРТА', 'BABA MARTA'],
    'banitsa.jpg': ['ЗАКУСКА', 'BREAKFAST'],
    'banitsa-fortunes.jpg': ['НОВА ГОДИНА', 'NEW YEAR'],
  };
  trad.photos.forEach((p, i) => {
    const [x, y] = tradSpots[i];
    const d = photoDesc('traditsii', i, p, x, y, between(rnd, -5, 5), 'print', 'souvenir', rnd);
    d.souvenir = tradMagnets[p.file];
    content.push(d);
  });

  // ---------- cork board: stories ----------
  const stories = Bl.stories;
  const storySpots = [
    [-1830, -330, -3, 'lined', 'tape2'],
    [-1325, -290, 2.4, 'grid', 'pin2'],
    [-1815, 355, 2, 'spiral', 'tape1'],
    [-1320, 380, -2.2, 'folded', 'tape2'],
  ];
  stories.forEach((post, i) => {
    const [x, y, r, paper, hold] = storySpots[i % storySpots.length];
    const dy = Math.floor(i / storySpots.length) * 1500;
    content.push({ id: 'post:' + post.slug, kind: 'letter', slug: post.slug, x, y: y + dy, w: 410, h: 560, r, paper, hold });
  });

  // ---------- poster wall: opinions ----------
  const ops = Bl.opinions;
  const posterSpots = [
    [1270, -10, -1.4],
    [1835, 30, 1.1],
    [2400, -30, -0.7],
  ];
  ops.forEach((post, i) => {
    const [x, y, r] = posterSpots[i % posterSpots.length];
    const dx = Math.floor(i / posterSpots.length) * 1700;
    content.push({ id: 'post:' + post.slug, kind: 'poster', slug: post.slug, x: x + dx, y, w: 540, h: 760, r, variant: i % 3 });
  });

  // ---------- top row: Sofia & Sea ----------
  const sofia = albumOf('sofia');
  content.push({ id: 'album:sofia', kind: 'alabel', album: 'sofia', variant: 'sign', x: -2130, y: -1370, w: 330, h: 230, r: -2 });
  // nevsky, green tram, tram 23, Vanya, cat council
  const sofiaSpots = [[-1640, -1500, -4], [-1220, -1240, 3], [-1250, -1560, -2], [-820, -1380, 2.5], [-1660, -1180, 1.5]];
  sofia.photos.forEach((p, i) => {
    const [x, y, r] = sofiaSpots[i];
    content.push(photoDesc('sofia', i, p, x, y, r, 'print', i % 2 ? 'tape1' : 'tape2', rnd));
  });

  const sea = albumOf('more');
  content.push({ id: 'album:more', kind: 'alabel', album: 'more', variant: 'postcard', x: 1960, y: -1360, w: 420, h: 300, r: 3 });
  const seaSpots = [[560, -1380, -5], [880, -1290, 4], [1200, -1400, -3], [1520, -1300, 5]];
  sea.photos.forEach((p, i) => {
    const [x, y, r] = seaSpots[i];
    content.push(photoDesc('more', i, p, x, y, r, 'polaroid', 'tape1', rnd, 'washi'));
  });

  // ---------- bottom row: mountains on a cork strip, old towns as stairs ----------
  const mnt = albumOf('planini');
  content.push({ id: 'album:planini', kind: 'alabel', album: 'planini', variant: 'trail', x: -1960, y: 1370, w: 280, h: 240, r: -3, hold: 'pin' });
  const mntSpots = [
    [-1600, 1210], [-1290, 1235], [-980, 1200], [-670, 1230], [-360, 1205],
    [-1450, 1640], [-1140, 1665], [-830, 1640], [-520, 1670],
  ];
  const pins = [];
  mnt.photos.forEach((p, i) => {
    const [x, y] = mntSpots[i];
    const d = photoDesc('planini', i, p, x, y, between(rnd, -5, 5), 'polaroid', 'pin', rnd);
    d.pinColor = '#e23b2e';
    content.push(d);
    pins.push([x, y - 152]);
  });
  // a hiking route in red thread, pin to pin
  threads.push([pins[0], pins[5], pins[1], pins[6], pins[2], pins[7], pins[3], pins[8], pins[4]]);

  const old = albumOf('stari-gradove');
  content.push({ id: 'album:stari-gradove', kind: 'alabel', album: 'stari-gradove', variant: 'tile', x: 560, y: 1690, w: 340, h: 250, r: 2 });
  const oldSpots = [[330, 1150], [760, 1230], [1170, 1330], [1580, 1440], [1990, 1550], [2400, 1660]];
  old.photos.forEach((p, i) => {
    const [x, y] = oldSpots[i];
    content.push(photoDesc('stari-gradove', i, p, x, y, between(rnd, -4, 4), 'print', i % 2 ? 'tape2' : 'tape1', rnd));
  });

  // ---------- curated clutter ----------
  decor.push({ kind: 'marti', x: -1572, y: -555, w: 92, h: 230, r: 2 });
  decor.push({ kind: 'ticket', t: TICKETS[0], x: -1585, y: 655, w: 250, h: 112, r: -6 });
  decor.push({ kind: 'sticky', line: ONE_LINERS[1], x: 655, y: -60, w: 170, h: 170, r: 4, color: '#ffe66d' });
  decor.push({ kind: 'sticky', line: ONE_LINERS[0], x: -690, y: -385, w: 160, h: 160, r: -6, color: '#9ef0c6' });
  decor.push({ kind: 'maglet', ch: 'М', x: 650, y: 380, w: 90, h: 100, r: -8, color: '#e63946' });
  decor.push({ kind: 'maglet', ch: 'Я', x: 735, y: 395, w: 90, h: 100, r: 6, color: '#3d5af1' });
  decor.push({ kind: 'maglet', ch: 'У', x: 700, y: 485, w: 90, h: 100, r: -3, color: '#ffbe0b' });
  decor.push({ kind: 'doodle', name: 'star', x: -690, y: -620, w: 80, h: 80, r: -12, ink: '#c42a2a' });
  decor.push({ kind: 'doodle', name: 'heart', x: 700, y: -640, w: 70, h: 70, r: 10, ink: '#c42a2a' });
  decor.push({ kind: 'sticker', x: 2655, y: -410, w: 120, h: 120, r: 12 });
  decor.push({ kind: 'tag', word: ['ЕХО… ЕХО…', 'ECHO… ECHO…'], x: 1830, y: 560, w: 700, h: 120, r: -4, fs: 92, layer: 'surface' });
  decor.push({ kind: 'lostcat', x: 2860, y: 380, w: 300, h: 470, r: 2.5 });
  decor.push({ kind: 'doodle', name: 'rocket', x: -1050, y: 690, w: 110, h: 110, r: 14, ink: '#22388f' });
  decor.push({ kind: 'doodle', name: 'tram', x: -260, y: -1080, w: 130, h: 130, r: -6, ink: '#1f6b4a' });
  decor.push({ kind: 'ticket', t: TICKETS[1], x: 1140, y: 1010, w: 260, h: 112, r: 5 });
  decor.push({ kind: 'doodle', name: 'mountain', x: -2050, y: 1690, w: 140, h: 140, r: -4, ink: '#211d1a' });
  decor.push({ kind: 'sticky', line: ONE_LINERS[21], x: 990, y: 1680, w: 170, h: 170, r: -5, color: '#ff9ec7' });

  for (const d of decor) d.layer ??= 'filler';
  // DOM (and so keyboard) order: name, tagline, posts newest-first, about, then albums
  const rank = { masthead: 0, tagline: 1, letter: 2, poster: 2, about: 3, meaning: 4, alabel: 5, photo: 5 };
  const postIdx = (d) => (d.slug ? Bl.posts.findIndex((p) => p.slug === d.slug) : 0);
  const albumIdx = (d) => (d.album ? Bl.albums.findIndex((a) => a.slug === d.album) : 0);
  content.sort(
    (a, b) =>
      rank[a.kind] - rank[b.kind] ||
      postIdx(a) - postIdx(b) ||
      albumIdx(a) - albumIdx(b) ||
      (a.kind === 'alabel' ? -1 : b.kind === 'alabel' ? 1 : (a.index ?? 0) - (b.index ?? 0))
  );
  return { surfaces, content, decor, threads };
}

function photoDesc(album, index, p, x, y, r, style, hold, rnd, tapeKind) {
  const land = p.w >= p.h;
  let w, h;
  if (style === 'polaroid') {
    w = 260;
    h = 330;
  } else {
    w = land ? (p.w / p.h > 2 ? 380 : 330) : 240;
    h = (w - 22) * (p.h / p.w) + 22 + 30;
  }
  return {
    id: `photo:${album}:${index}`,
    kind: 'photo',
    style,
    album,
    index,
    x, y, w, h, r,
    hold,
    tapeKind,
    frame: style === 'print' && rnd() < 0.25 ? 'cream' : 'white',
  };
}

/* ======================= world ======================= */

// The world layer: curated content in the middle, a seeded, endless, virtualised wall around it.

export const CHUNK = 1024;
export const STORK_AT = { x: 9300, y: -6100 };

const CONTENT_BUILDERS = {
  letter: letterItem,
  poster: posterItem,
  photo: photoItem,
  alabel: albumLabelItem,
  masthead: mastheadItem,
  tagline: taglineItem,
  meaning: meaningItem,
  about: aboutItem,
  fridge: fridgeItem,
  cork: corkItem,
};

export function createWorld(worldEl, camera) {
  const layers = {};
  for (const name of ['wall', 'patch', 'surface', 'filler', 'content', 'top']) {
    layers[name] = h('div', { class: `layer layer--${name}` });
    worldEl.append(layers[name]);
  }

  const items = new Map(); // id -> content item
  const elToItem = new WeakMap();
  const contentList = []; // everything curated (incl. surfaces & decor)
  const keepouts = [];
  const chunks = new Map();
  let home = { x0: 0, y0: 0, x1: 0, y1: 0 };
  let homeZone = home;
  let pendingMount = false;
  let lastFar = null;

  function addItem(it, layer) {
    place(it);
    layers[layer].append(it.el);
    elToItem.set(it.el, it);
    contentList.push(it);
    if (it.id) items.set(it.id, it);
  }

  function init(layout) {
    for (const d of layout.surfaces) addItem(CONTENT_BUILDERS[d.kind](d), 'surface');
    for (const d of layout.decor) {
      const it = BUILDERS[d.kind](d, rng32(hashStr(d.kind + d.x + ',' + d.y)));
      it.decor = true;
      addItem(it, d.layer);
    }
    for (const d of layout.content) addItem(CONTENT_BUILDERS[d.kind](d), 'content');
    for (const t of layout.threads) layers.top.append(stringLine(t));
    renderAll();
    computeBounds();
  }

  function renderAll() {
    for (const it of contentList) it.render();
  }

  /** After fonts load, measure auto-height items so fit/zoom/minimap know real sizes. */
  function measure({ keepouts = true } = {}) {
    for (const it of contentList) {
      if (it.fixedH) continue;
      const hgt = it.el.offsetHeight;
      if (hgt) it.h = hgt;
      const w = it.el.offsetWidth;
      if (w) it.w = w;
    }
    if (keepouts) computeBounds();
  }

  function computeBounds() {
    keepouts.length = 0;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const it of contentList) {
      const m = it.kind === 'remnant' || it.kind === 'tag' ? 0 : 36;
      const r = { x0: it.x - it.w / 2 - m, y0: it.y - it.h / 2 - m, x1: it.x + it.w / 2 + m, y1: it.y + it.h / 2 + m };
      if (it.kind !== 'remnant' && it.kind !== 'tag') keepouts.push(r);
      x0 = Math.min(x0, r.x0); y0 = Math.min(y0, r.y0); x1 = Math.max(x1, r.x1); y1 = Math.max(y1, r.y1);
    }
    home = { x0, y0, x1, y1 };
    homeZone = { x0: x0 - 300, y0: y0 - 300, x1: x1 + 300, y1: y1 + 300 };
    // drop any generated chunks: keepouts changed
    for (const ch of chunks.values()) if (ch.mounted) unmountChunk(ch);
    chunks.clear();
  }

  const hits = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

  /* ---------- procedural filler ---------- */

  function genChunk(i, j) {
    const rnd = rng32(hash2(i, j, 0x5eed));
    const x0 = i * CHUNK, y0 = j * CHUNK;
    const rect = { x0, y0, x1: x0 + CHUNK, y1: y0 + CHUNK };
    const inHome = hits(rect, homeZone);
    const cx = x0 + CHUNK / 2, cy = y0 + CHUNK / 2;
    const dist = Math.hypot(cx, cy);
    const out = [];
    let seed = hash2(i, j, 0xabc);
    const add = (d) => {
      d.seed = seed = (seed * 1664525 + 1013904223) >>> 0;
      out.push(d);
    };
    const at = (fx, fy) => [x0 + fx * CHUNK, y0 + fy * CHUNK];

    const free = (x, y, w, h) => {
      const r = { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 };
      return !keepouts.some((k) => hits(r, k));
    };

    // the street wall itself: layers of old posters, paint-overs, exposed brick, tags
    if (rnd() < (inHome ? 0.3 : 0.62)) {
      const [x, y] = at(between(rnd, 0.2, 0.8), between(rnd, 0.2, 0.8));
      const w = between(rnd, 460, 860), hh = between(rnd, 520, 900);
      if (!inHome || free(x, y, w, hh)) add({ kind: 'remnant', x, y, w, h: hh, r: between(rnd, -2.5, 2.5), layer: 'patch' });
    }
    if (rnd() < 0.55) {
      const variant = weighted(rnd, [['stain', 3], ['paint', 3], ['brick', 2], ['crack', 2]]);
      const [x, y] = at(between(rnd, 0.1, 0.9), between(rnd, 0.1, 0.9));
      const w = variant === 'crack' ? between(rnd, 260, 420) : between(rnd, 280, 640);
      add({ kind: 'patch', variant, x, y, w, h: variant === 'crack' ? w * 0.6 : between(rnd, 220, 520), r: between(rnd, -6, 6), layer: 'patch' });
    }
    if (rnd() < (inHome ? 0.12 : 0.3)) {
      const [x, y] = at(between(rnd, 0.2, 0.8), between(rnd, 0.2, 0.8));
      if (!inHome || free(x, y, 600, 160)) add({ kind: 'tag', x, y, w: 600, h: 140, r: between(rnd, -12, 6), fs: between(rnd, 80, 150), layer: 'patch' });
    }

    // everyday clutter, gathered in little clumps the way real walls collect it
    const clumps = inHome ? (rnd() < 0.7 ? 1 : 0) : 1 + (rnd() < 0.6 ? 1 : 0);
    for (let c = 0; c < clumps; c++) {
      const [cx0, cy0] = at(between(rnd, 0.22, 0.78), between(rnd, 0.22, 0.78));
      const n = inHome ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 3);
      let ang = rnd() * Math.PI * 2;
      for (let k = 0; k < n; k++) {
        const rad = k ? between(rnd, 120, 200) : between(rnd, 0, 40);
        ang += between(rnd, 1.4, 2.4);
        const x = cx0 + Math.cos(ang) * rad, y = cy0 + Math.sin(ang) * rad;
        const kind = weighted(rnd, [
          ['sticky', 14], ['scrap', 11], ['doodle', 16], ['ticket', 11], ['sticker', 12], ['magword', 7], ['marti', 4], ['staples', 3],
        ]);
        const r = between(rnd, -12, 12);
        switch (kind) {
          case 'sticky': {
            const sz = between(rnd, 170, 205);
            add({ kind, x, y, w: sz, h: sz, r: r * 0.6, line: ONE_LINERS[(((i * 7 + j * 11 + c * 5 + k * 3) % 26) + 26) % ONE_LINERS.length] });
            break;
          }
          case 'scrap':
            add({ kind, x, y, w: 250, h: 170, r: r * 0.5, line: ONE_LINERS[(((i * 5 + j * 13 + c * 9 + k * 7 + 13) % 26) + 26) % ONE_LINERS.length] });
            break;
          case 'doodle': {
            const sz = between(rnd, 110, 220);
            add({ kind, x, y, w: sz, h: sz, r, name: pick(rnd, DOODLES), sm: sz < 140 });
            break;
          }
          case 'ticket':
            add({ kind, x, y, w: 250, h: 112, r, t: pick(rnd, TICKETS) });
            break;
          case 'sticker': {
            const sz = between(rnd, 110, 160);
            add({ kind, x, y, w: sz, h: sz, r: r * 1.5, sm: true });
            break;
          }
          case 'magword': {
            const word = pick(rnd, MAG_WORDS);
            const color = rnd();
            [...word].forEach((ch, q) =>
              add({
                kind: 'maglet', x: x + (q - (word.length - 1) / 2) * 84, y: y + between(rnd, -10, 10), w: 88, h: 100,
                r: between(rnd, -12, 12), ch, color: MAG_COLORS[Math.floor((color * 7 + q * 3) % MAG_COLORS.length)], sm: true,
              })
            );
            break;
          }
          case 'marti':
            add({ kind, x, y, w: 92, h: 230, r: between(rnd, -4, 4) });
            break;
          case 'staples':
            add({ kind, x, y, w: 46, h: 22, r: r * 3, sm: true });
            break;
        }
      }
    }

    // specials
    if (!inHome && rnd() < 0.09) {
      const [x, y] = at(between(rnd, 0.2, 0.8), between(rnd, 0.2, 0.8));
      const pool = contentList.filter((it) => it.hit && (it.kind === 'letter' || it.kind === 'poster' || it.kind === 'photo'));
      const src = pick(rnd, pool);
      const kind = src.kind === 'photo' ? 'photo' : src.kind;
      add({
        kind: 'echo', x, y, w: kind === 'photo' ? 200 : 260, h: kind === 'photo' ? 250 : 300, r: between(rnd, -8, 8),
        src: { kind, id: src.id, slug: src.slug, album: src.album, index: src.index },
      });
    }
    if (!inHome && dist > 2600 && rnd() < 0.07) {
      const [x, y] = at(between(rnd, 0.2, 0.8), between(rnd, 0.2, 0.8));
      const angle = (Math.atan2(STORK_AT.y - y, STORK_AT.x - x) * 180) / Math.PI;
      add({ kind: 'hint', x, y, w: 190, h: 190, r: between(rnd, -5, 5), angle: angle + 30 });
    }
    if (!inHome && rnd() < 0.025) {
      const [x, y] = at(between(rnd, 0.25, 0.75), between(rnd, 0.25, 0.75));
      add({ kind: 'lostcat', x, y, w: 300, h: 470, r: between(rnd, -4, 4) });
    }
    if (STORK_AT.x >= x0 && STORK_AT.x < x0 + CHUNK && STORK_AT.y >= y0 && STORK_AT.y < y0 + CHUNK) {
      for (let k = out.length - 1; k >= 0; k--) {
        const d = out[k];
        if (Math.abs(d.x - STORK_AT.x) < 320 && Math.abs(d.y - STORK_AT.y) < 320 && d.layer !== 'patch') out.splice(k, 1);
      }
      add({ kind: 'stork', x: STORK_AT.x, y: STORK_AT.y, w: 260, h: 296, r: 0 });
    }

    // respect the curated heart: nothing overlaps real content
    return out.filter((d) => {
      d.layer ??= 'filler';
      if (d.layer === 'patch') return true;
      const r = { x0: d.x - d.w / 2, y0: d.y - d.h / 2, x1: d.x + d.w / 2, y1: d.y + d.h / 2 };
      return !keepouts.some((k) => hits(r, k));
    });
  }

  function mountChunk(ch) {
    ch.bg = chunkBg(ch.i, ch.j, CHUNK);
    layers.wall.append(ch.bg);
    ch.items = ch.descs.map((d) => {
      const it = BUILDERS[d.kind](d, rng32(d.seed));
      it.render();
      place(it);
      if (d.sm) it.el.classList.add('sm');
      layers[d.layer].append(it.el);
      elToItem.set(it.el, it);
      return it;
    });
    ch.mounted = true;
  }

  function unmountChunk(ch) {
    ch.bg?.remove();
    for (const it of ch.items || []) it.el.remove();
    ch.items = null;
    ch.mounted = false;
  }

  function update() {
    const v = camera.viewRect();
    const vw = v.x1 - v.x0, vh = v.y1 - v.y0;
    const m = camera.z < 0.35 ? 0.12 : 0.35;
    const i0 = Math.floor((v.x0 - vw * m) / CHUNK), i1 = Math.floor((v.x1 + vw * m) / CHUNK);
    const j0 = Math.floor((v.y0 - vh * m) / CHUNK), j1 = Math.floor((v.y1 + vh * m) / CHUNK);
    const want = [];
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++) {
        const key = i + ',' + j;
        let ch = chunks.get(key);
        if (!ch) {
          ch = { i, j, key, descs: null, mounted: false };
          chunks.set(key, ch);
        }
        if (!ch.mounted) {
          const cx = (i + 0.5) * CHUNK, cy = (j + 0.5) * CHUNK;
          want.push([ch, (cx - camera.x) ** 2 + (cy - camera.y) ** 2]);
        }
      }
    want.sort((a, b) => a[1] - b[1]);
    const budget = 8;
    for (let k = 0; k < Math.min(budget, want.length); k++) {
      const ch = want[k][0];
      ch.descs ??= genChunk(ch.i, ch.j);
      mountChunk(ch);
    }
    for (const ch of chunks.values()) {
      if (ch.mounted && (ch.i < i0 - 1 || ch.i > i1 + 1 || ch.j < j0 - 1 || ch.j > j1 + 1)) unmountChunk(ch);
    }
    // keep the descriptor cache bounded
    if (chunks.size > 900) {
      for (const [key, ch] of chunks) {
        if (!ch.mounted) chunks.delete(key);
        if (chunks.size < 600) break;
      }
    }
    const far = camera.z < 0.3;
    if (far !== lastFar) {
      worldEl.classList.toggle('is-far', far);
      lastFar = far;
    }
    if (want.length > budget && !pendingMount) {
      pendingMount = true;
      requestAnimationFrame(() => {
        pendingMount = false;
        update();
      });
    }
  }

  /* ---------- queries ---------- */

  function itemFromEl(el) {
    const node = el?.closest?.('.it');
    return node ? elToItem.get(node) : null;
  }

  function screenRect(it) {
    const p = camera.worldToScreen(it.x, it.y);
    return { cx: p.x, cy: p.y, w: it.w, h: it.h, z: camera.z, r: it.r || 0 };
  }

  function isOnScreen(it, pad = 0) {
    const v = camera.viewRect();
    const rr = Math.max(it.w, it.h) / 2;
    return it.x + rr > v.x0 - pad && it.x - rr < v.x1 + pad && it.y + rr > v.y0 - pad && it.y - rr < v.y1 + pad;
  }

  function renderedItems() {
    const out = [...contentList];
    for (const ch of chunks.values()) if (ch.mounted) out.push(...ch.items);
    return out;
  }

  /* ---------- language: re-paste ---------- */

  function repaste(it) {
    if (reduced()) {
      it.render();
      return;
    }
    const ghost = it.face.cloneNode(true);
    ghost.classList.add('face--ghost');
    ghost.removeAttribute('id');
    it.face.before(ghost);
    it.render();
    const slap = it.face.animate(
      [
        { transform: 'translate(2%, -3%) rotate(2.5deg) scale(1.08)', opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 420, easing: EASE.slap }
    );
    const sheen = h('i', { class: 'sheen', 'aria-hidden': 'true' });
    it.el.append(sheen);
    sheen.animate([{ transform: 'translateX(-120%) skewX(-18deg)', opacity: 0.9 }, { transform: 'translateX(140%) skewX(-18deg)', opacity: 0 }], {
      duration: 620,
      delay: 120,
      easing: 'cubic-bezier(.4,0,.2,1)',
      fill: 'backwards',
    });
    done(slap).then(() => ghost.remove());
    setTimeout(() => sheen.remove(), 800);
  }

  /** Re-render text for the new language; returns visible items (with screen x) to re-paste in a sweep. */
  function relang() {
    const visible = [];
    for (const it of renderedItems()) {
      if (it.render === undefined) continue;
      if (isOnScreen(it, 80) && it.el.isConnected && hasText(it)) visible.push({ it, sx: camera.worldToScreen(it.x, it.y).x });
      else it.render();
    }
    return visible.sort((a, b) => a.sx - b.sx);
  }
  const hasText = (it) => !['fridge', 'cork', 'doodle', 'maglet', 'marti', 'patch', 'staples', 'stork'].includes(it.kind);

  /* ---------- flourishes ---------- */

  function highlight(it) {
    const pad = 70;
    const w = it.w + pad * 2, hh = it.h + pad * 2;
    const el = h('div', { class: 'scribble', 'aria-hidden': 'true', html: SCRIBBLE_CIRCLE });
    el.style.cssText = `width:${w}px;height:${hh}px;transform:translate(${it.x - w / 2}px,${it.y - hh / 2}px) rotate(${(it.r || 0) - 3}deg)`;
    layers.top.append(el);
    const svg = el.firstElementChild;
    const a = svg.animate(
      [
        { transform: 'scale(.86) rotate(-6deg)', opacity: 0 },
        { transform: 'scale(1) rotate(0)', opacity: 1, offset: 0.18 },
        { transform: 'scale(1) rotate(0)', opacity: 1, offset: 0.8 },
        { transform: 'scale(1.04) rotate(1deg)', opacity: 0 },
      ],
      { duration: reduced() ? 1800 : 2600, easing: 'ease-out' }
    );
    done(a).then(() => el.remove());
  }

  function intro() {
    if (reduced()) return;
    const list = contentList.filter((it) => isOnScreen(it, 0) && it.kind !== 'fridge' && it.kind !== 'cork' && it.kind !== 'remnant');
    const c = camera.viewRect();
    const mx = (c.x0 + c.x1) / 2, my = (c.y0 + c.y1) / 2;
    list.sort((a, b) => Math.hypot(a.x - mx, a.y - my) - Math.hypot(b.x - mx, b.y - my));
    const n = list.length || 1;
    list.forEach((it, i) => {
      const delay = 80 + (i / n) * 750;
      it.face.animate(
        [
          { transform: 'translateY(-4%) rotate(3deg) scale(1.1)', opacity: 0 },
          { opacity: 1, offset: 0.4 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 520, delay, easing: EASE.slap, fill: 'backwards' }
      );
      for (const hd of it.holders || [])
        hd.animate([{ opacity: 0, scale: '1.6' }, { opacity: 1, scale: '1' }], {
          duration: 260,
          delay: delay + 300,
          easing: EASE.out,
          fill: 'backwards',
        });
    });
  }

  return {
    layers,
    init,
    measure,
    update,
    get home() {
      return home;
    },
    get: (id) => items.get(id),
    itemFromEl,
    screenRect,
    isOnScreen,
    contentList,
    relang,
    repaste,
    renderAll,
    highlight,
    intro,
  };
}

/* ======================= camera ======================= */

// Camera over one transformed world layer: drag with inertia, wheel / pinch zoom toward the pointer,
// double-tap, smooth "fly" between places (van Wijk–Nuij zoom-out-then-in), reduced-motion jumps.

export function createCamera(stage, worldEl, opts = {}) {
  const cam = { x: 0, y: 0, z: 0.5 };
  let vw = 1, vh = 1;
  const insets = { t: 0, r: 0, b: 0, l: 0 };
  let minZ = 0.15;
  const maxZ = 2.2;
  const subs = new Set();
  const settleSubs = new Set();
  let raf = 0, last = 0;
  let vel = null;
  let zoomAnim = null;
  let flight = null;
  let rasterZ = null;
  let settleT = 0;

  /* ---------- core ---------- */

  function resize() {
    vw = stage.clientWidth || innerWidth;
    vh = stage.clientHeight || innerHeight;
    minZ = clamp(Math.max(vw, vh) / 8600, 0.09, 0.3);
    cam.z = clamp(cam.z, minZ, maxZ);
    render();
  }

  function apply() {
    const tx = vw / 2 - cam.x * cam.z, ty = vh / 2 - cam.y * cam.z;
    worldEl.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${cam.z.toFixed(5)})`;
  }

  function notify() {
    for (const fn of subs) fn(cam);
  }

  function render() {
    apply();
    notify();
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(40, now - (last || now - 16));
    last = now;
    let active = false;
    if (flight) {
      const t = clamp((now - flight.t0) / flight.dur, 0, 1);
      const [x, y, w] = flight.fn(ease.inOut(t));
      cam.x = x;
      cam.y = y;
      cam.z = clamp(vw / w, minZ, maxZ);
      if (t >= 1) {
        const f = flight;
        flight = null;
        f.resolve(true);
      } else active = true;
    }
    if (vel) {
      cam.x -= (vel.x * dt) / cam.z;
      cam.y -= (vel.y * dt) / cam.z;
      const k = Math.exp(-dt / 330);
      vel.x *= k;
      vel.y *= k;
      if (Math.hypot(vel.x, vel.y) < 0.02) vel = null;
      else active = true;
    }
    if (zoomAnim) {
      const k = 1 - Math.exp(-dt / 75);
      const nz = cam.z + (zoomAnim.z - cam.z) * k;
      zoomAround(zoomAnim.sx, zoomAnim.sy, nz);
      if (Math.abs(zoomAnim.z - cam.z) / cam.z < 0.0015) {
        zoomAround(zoomAnim.sx, zoomAnim.sy, zoomAnim.z);
        zoomAnim = null;
      } else active = true;
    }
    render();
    if (active) schedule();
    else settleSoon();
  }

  function zoomAround(sx, sy, nz) {
    nz = clamp(nz, minZ, maxZ);
    const wx = cam.x + (sx - vw / 2) / cam.z;
    const wy = cam.y + (sy - vh / 2) / cam.z;
    cam.z = nz;
    cam.x = wx - (sx - vw / 2) / nz;
    cam.y = wy - (sy - vh / 2) / nz;
  }

  // will-change only while things move; dropping it after a zoom forces a crisp re-raster
  function beginMotion() {
    clearTimeout(settleT);
    if (!worldEl.classList.contains('is-moving')) {
      worldEl.classList.add('is-moving');
      rasterZ = cam.z;
    }
  }

  function settleSoon() {
    clearTimeout(settleT);
    settleT = setTimeout(() => {
      if (pts.size || flight || vel || zoomAnim) return;
      if (rasterZ != null && Math.abs(cam.z / rasterZ - 1) > 0.012) {
        worldEl.classList.remove('is-moving');
        rasterZ = null;
      }
      for (const fn of settleSubs) fn(cam);
    }, 220);
  }

  function stopMotion() {
    vel = null;
    zoomAnim = null;
    if (flight) {
      const f = flight;
      flight = null;
      f.resolve(false);
    }
  }

  /* ---------- public moves ---------- */

  function set(t) {
    stopMotion();
    beginMotion();
    cam.x = t.x;
    cam.y = t.y;
    cam.z = clamp(t.z ?? cam.z, minZ, maxZ);
    render();
    settleSoon();
  }

  function flyTo(t, o = {}) {
    if (reduced() || o.instant) {
      set(t);
      return Promise.resolve(true);
    }
    stopMotion();
    const tz = clamp(t.z ?? cam.z, minZ, maxZ);
    const fn = interpolateZoom([cam.x, cam.y, vw / cam.z], [t.x, t.y, vw / tz], o.rho ?? 1.25);
    const dur = o.duration ?? clamp(fn.duration * 0.8, 520, 1700);
    beginMotion();
    return new Promise((resolve) => {
      flight = { fn, t0: performance.now(), dur, resolve };
      schedule();
    });
  }

  function fitTarget(r, pad = 0.14, zCap = maxZ) {
    const aw = vw - insets.l - insets.r, ah = vh - insets.t - insets.b;
    const z = clamp(Math.min((aw * (1 - pad)) / r.w, (ah * (1 - pad)) / r.h), minZ, zCap);
    const scx = insets.l + aw / 2, scy = insets.t + ah / 2;
    return { x: r.x - (scx - vw / 2) / z, y: r.y - (scy - vh / 2) / z, z };
  }

  function zoomBy(f, sx = vw / 2, sy = vh / 2) {
    stopMotion();
    beginMotion();
    const nz = clamp(cam.z * f, minZ, maxZ);
    if (reduced()) {
      zoomAround(sx, sy, nz);
      render();
      settleSoon();
    } else {
      zoomAnim = { z: nz, sx, sy };
      schedule();
    }
  }

  function panBy(dx, dy) {
    return flyTo({ x: cam.x + dx / cam.z, y: cam.y + dy / cam.z, z: cam.z }, { duration: 380 });
  }

  /* ---------- gestures ---------- */

  const pts = new Map();
  let g = null;
  let down = null;
  let samples = [];
  let lastTap = null;
  let tapTimer = 0;
  const now = () => performance.now();

  function pinchState() {
    const [a, b] = [...pts.values()];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx, my };
  }

  function startPinch() {
    const s = pinchState();
    g = { type: 'pinch', d0: s.d, z0: cam.z, wx: cam.x + (s.mx - vw / 2) / cam.z, wy: cam.y + (s.my - vh / 2) / cam.z };
    vel = null;
    beginMotion();
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (opts.isLocked?.()) return;
    stopMotion();
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      down = { x: e.clientX, y: e.clientY, t: now(), target: e.target, moved: false, type: e.pointerType };
      const grab = opts.grabItem?.(e.target, e.clientX, e.clientY);
      g = grab ? { type: 'item', grab, lx: e.clientX, ly: e.clientY } : { type: 'pan', lx: e.clientX, ly: e.clientY };
      samples = [{ x: e.clientX, y: e.clientY, t: now() }];
    } else if (pts.size === 2) {
      if (g?.type === 'item') g.grab.end?.();
      if (down) down.moved = true;
      startPinch();
    }
  });

  stage.addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId);
    if (!p || !g) return;
    p.x = e.clientX;
    p.y = e.clientY;
    if (g.type === 'pinch' && pts.size >= 2) {
      const s = pinchState();
      const nz = clamp((g.z0 * s.d) / g.d0, minZ, maxZ);
      cam.z = nz;
      cam.x = g.wx - (s.mx - vw / 2) / nz;
      cam.y = g.wy - (s.my - vh / 2) / nz;
      schedule();
      return;
    }
    const dx = e.clientX - g.lx, dy = e.clientY - g.ly;
    g.lx = e.clientX;
    g.ly = e.clientY;
    if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > (down.type === 'mouse' ? 5 : 10)) {
      down.moved = true;
      if (g.type === 'pan') {
        beginMotion();
        stage.classList.add('is-grabbing');
        opts.onPanStart?.();
      }
    }
    if (!down.moved) return;
    if (g.type === 'item') {
      g.grab.move(dx / cam.z, dy / cam.z);
      return;
    }
    cam.x -= dx / cam.z;
    cam.y -= dy / cam.z;
    const t = now();
    samples.push({ x: e.clientX, y: e.clientY, t });
    while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
    schedule();
  });

  function endPointer(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (!g) return;
    if (g.type === 'pinch') {
      if (pts.size === 1) {
        const [p] = pts.values();
        g = { type: 'pan', lx: p.x, ly: p.y };
        samples = [];
      } else if (!pts.size) {
        g = null;
        settleSoon();
      }
      return;
    }
    if (pts.size) return;
    stage.classList.remove('is-grabbing');
    if (g.type === 'item') {
      g.grab.end?.(down.moved);
      if (!down.moved) handleTap(e);
      g = null;
      return;
    }
    g = null;
    if (e.type === 'pointercancel') return settleSoon();
    if (!down.moved) {
      handleTap(e);
      return;
    }
    const t = now();
    const s0 = samples[0], s1 = samples[samples.length - 1];
    if (!reduced() && s0 && s1 && t - s1.t < 60 && s1.t - s0.t > 8) {
      let vx = (s1.x - s0.x) / (s1.t - s0.t), vy = (s1.y - s0.y) / (s1.t - s0.t);
      const sp = Math.hypot(vx, vy);
      if (sp > 4) (vx *= 4 / sp), (vy *= 4 / sp);
      if (sp > 0.08) {
        vel = { x: vx, y: vy };
        schedule();
        return;
      }
    }
    settleSoon();
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', (e) => {
    if (pts.has(e.pointerId)) endPointer({ pointerId: e.pointerId, type: 'pointercancel', clientX: 0, clientY: 0 });
  });

  function handleTap(e) {
    const t = now();
    const target = down.target;
    const x = e.clientX, y = e.clientY;
    if (lastTap && t - lastTap.t < 340 && Math.hypot(x - lastTap.x, y - lastTap.y) < 44) {
      clearTimeout(tapTimer);
      lastTap = null;
      opts.onDoubleTap?.(target, x, y);
      return;
    }
    lastTap = { t, x, y };
    if (opts.tapDelay?.(target)) tapTimer = setTimeout(() => opts.onTap?.(target, x, y), 270);
    else opts.onTap?.(target, x, y);
  }

  stage.addEventListener(
    'wheel',
    (e) => {
      if (opts.isLocked?.()) return;
      e.preventDefault();
      let dy = e.deltaY, dx = e.deltaX;
      if (e.deltaMode === 1) (dy *= 18), (dx *= 18);
      else if (e.deltaMode === 2) (dy *= vh), (dx *= vw);
      if (flight) stopMotion();
      vel = null;
      beginMotion();
      opts.onPanStart?.();
      if (e.ctrlKey) {
        zoomAnim = null;
        zoomAround(e.clientX, e.clientY, cam.z * Math.exp(-dy * 0.011));
        schedule();
      } else if (Math.abs(dx) > Math.abs(dy) * 1.3) {
        cam.x += dx / cam.z;
        schedule();
      } else {
        const baseZ = zoomAnim ? zoomAnim.z : cam.z;
        const nz = clamp(baseZ * Math.exp(-dy * 0.0017), minZ, maxZ);
        if (reduced() || Math.abs(dy) < 24) {
          zoomAnim = null;
          zoomAround(e.clientX, e.clientY, nz);
        } else zoomAnim = { z: nz, sx: e.clientX, sy: e.clientY };
        schedule();
      }
    },
    { passive: false }
  );

  // Safari trackpad pinch
  let gz = null;
  stage.addEventListener('gesturestart', (e) => {
    e.preventDefault();
    if (pts.size) return;
    gz = cam.z;
    beginMotion();
  });
  stage.addEventListener('gesturechange', (e) => {
    e.preventDefault();
    if (gz == null || pts.size) return;
    zoomAround(e.clientX, e.clientY, gz * e.scale);
    schedule();
  });
  stage.addEventListener('gestureend', (e) => {
    e.preventDefault();
    gz = null;
    settleSoon();
  });

  addEventListener('resize', resize);
  resize();

  return {
    get x() {
      return cam.x;
    },
    get y() {
      return cam.y;
    },
    get z() {
      return cam.z;
    },
    get minZ() {
      return minZ;
    },
    maxZ,
    get vw() {
      return vw;
    },
    get vh() {
      return vh;
    },
    get busy() {
      return !!(flight || vel || zoomAnim || pts.size);
    },
    snapshot: () => ({ x: cam.x, y: cam.y, z: cam.z }),
    set,
    flyTo,
    fitTarget,
    zoomBy,
    panBy,
    stop: stopMotion,
    resize,
    setInsets: (i) => Object.assign(insets, i),
    subscribe: (fn) => subs.add(fn),
    onSettle: (fn) => settleSubs.add(fn),
    viewRect: () => ({
      x0: cam.x - vw / 2 / cam.z,
      y0: cam.y - vh / 2 / cam.z,
      x1: cam.x + vw / 2 / cam.z,
      y1: cam.y + vh / 2 / cam.z,
    }),
    worldToScreen: (x, y) => ({ x: (x - cam.x) * cam.z + vw / 2, y: (y - cam.y) * cam.z + vh / 2 }),
    screenToWorld: (x, y) => ({ x: cam.x + (x - vw / 2) / cam.z, y: cam.y + (y - vh / 2) / cam.z }),
  };
}

/* ======================= minimap ======================= */

// A little paper map in the corner: where you are, where the good stuff is, how far from home.

const COLORS = {
  fridge: '#e6efe6',
  cork: '#c4945d',
  letter: '#fffdf6',
  poster: '#e2412a',
  photo: '#3b4a5c',
  alabel: '#2a62d4',
  masthead: '#e63946',
  about: '#ffffff',
};

export function createMinimap(root, camera, world, { onJump }) {
  const canvas = root.querySelector('canvas');
  const label = root.querySelector('.minimap__dist');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let ext = null;
  let queued = false;

  function size() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    draw();
  }

  function extent() {
    const hm = world.home;
    const pad = 420;
    const v = camera.viewRect();
    let x0 = Math.min(hm.x0 - pad, v.x0), y0 = Math.min(hm.y0 - pad, v.y0);
    let x1 = Math.max(hm.x1 + pad, v.x1), y1 = Math.max(hm.y1 + pad, v.y1);
    // keep the map's aspect
    const w = x1 - x0, h = y1 - y0, a = W / H;
    if (w / h > a) {
      const nh = w / a;
      y0 -= (nh - h) / 2;
      y1 = y0 + nh;
    } else {
      const nw = h * a;
      x0 -= (nw - w) / 2;
      x1 = x0 + nw;
    }
    return { x0, y0, x1, y1 };
  }

  function draw() {
    queued = false;
    if (!W) return;
    const target = extent();
    // ease the map's own zoom so it breathes instead of jumping
    if (!ext) ext = target;
    else for (const k of ['x0', 'y0', 'x1', 'y1']) ext[k] += (target[k] - ext[k]) * 0.35;
    const s = W / (ext.x1 - ext.x0);
    const X = (x) => (x - ext.x0) * s, Y = (y) => (y - ext.y0) * s;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = 'rgba(80,60,40,.10)';
    ctx.lineWidth = 1;
    const step = 1024 * s;
    if (step > 6) {
      const gx0 = Math.floor(ext.x0 / 1024) * 1024, gy0 = Math.floor(ext.y0 / 1024) * 1024;
      ctx.beginPath();
      for (let x = gx0; x < ext.x1; x += 1024) (ctx.moveTo(X(x) | 0, 0), ctx.lineTo(X(x) | 0, H));
      for (let y = gy0; y < ext.y1; y += 1024) (ctx.moveTo(0, Y(y) | 0), ctx.lineTo(W, Y(y) | 0));
      ctx.stroke();
    }
    // content
    for (const it of world.contentList) {
      const c = COLORS[it.kind];
      if (!c) continue;
      const w = Math.max(1.5, it.w * s), h = Math.max(1.5, it.h * s);
      ctx.fillStyle = c;
      ctx.fillRect(X(it.x) - w / 2, Y(it.y) - h / 2, w, h);
      if (it.kind === 'letter' || it.kind === 'about') {
        ctx.strokeStyle = 'rgba(40,30,20,.35)';
        ctx.strokeRect(X(it.x) - w / 2, Y(it.y) - h / 2, w, h);
      }
    }
    // home marker when the map has zoomed far out
    const hm = world.home;
    if ((hm.x1 - hm.x0) * s < 18) {
      ctx.fillStyle = '#e63946';
      const hx = X((hm.x0 + hm.x1) / 2), hy = Y((hm.y0 + hm.y1) / 2);
      ctx.beginPath();
      ctx.moveTo(hx, hy - 6);
      ctx.lineTo(hx + 6, hy);
      ctx.lineTo(hx + 4, hy);
      ctx.lineTo(hx + 4, hy + 5);
      ctx.lineTo(hx - 4, hy + 5);
      ctx.lineTo(hx - 4, hy);
      ctx.lineTo(hx - 6, hy);
      ctx.closePath();
      ctx.fill();
    }
    // you are here
    const v = camera.viewRect();
    const rx = X(v.x0), ry = Y(v.y0), rw = (v.x1 - v.x0) * s, rh = (v.y1 - v.y0) * s;
    ctx.fillStyle = 'rgba(230,57,70,.12)';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#d6336c';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(rx + 0.5, ry + 0.5, Math.max(2, rw - 1), Math.max(2, rh - 1));
    const cx = X(camera.x), cy = Y(camera.y);
    ctx.fillStyle = '#d6336c';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    // distance note (100 world px = 1 m)
    const hx = (hm.x0 + hm.x1) / 2, hy = (hm.y0 + hm.y1) / 2;
    const out = camera.x < hm.x0 || camera.x > hm.x1 || camera.y < hm.y0 || camera.y > hm.y1;
    const m = Math.round(Math.hypot(camera.x - hx, camera.y - hy) / 100);
    const txt = out ? `${m} ${tt('fromHome')}` : tt('atHome');
    if (label.textContent !== txt) label.textContent = txt;
    root.classList.toggle('is-away', out);
    if (Math.abs(target.x0 - ext.x0) > 1 || Math.abs(target.x1 - ext.x1) > 1) request();
  }

  function request() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  }

  // jump by tapping / dragging on the map
  let dragging = false;
  function jump(e, fly) {
    const r = canvas.getBoundingClientRect();
    const s = (ext.x1 - ext.x0) / W;
    const x = ext.x0 + (e.clientX - r.left) * s;
    const y = ext.y0 + (e.clientY - r.top) * s;
    onJump({ x, y }, fly);
  }
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    jump(e, true);
  });
  canvas.addEventListener('pointermove', (e) => dragging && e.buttons && jump(e, false));
  canvas.addEventListener('pointerup', () => (dragging = false));
  canvas.addEventListener('pointercancel', () => (dragging = false));

  camera.subscribe(request);
  addEventListener('resize', size);
  new ResizeObserver(size).observe(canvas);
  size();
  return { draw: request, clampExt: clamp };
}

/* ======================= sound ======================= */

// Tiny synthesised foley (no audio files): tape rip, magnet clack, paste-brush swish, paper lift.
// Off by default; the AudioContext is only created after the visitor turns sound on.
let ctx = null;
let on = false;

function noise(dur) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function env(node, t, a, peak, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  node.connect(g);
  g.connect(ctx.destination);
  return g;
}

const S = {
  tear() {
    const t = ctx.currentTime;
    for (let k = 0; k < 3; k++) {
      const n = noise(0.09);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2400 + Math.random() * 2600;
      f.Q.value = 0.9;
      n.connect(f);
      env(f, t + k * 0.045, 0.004, 0.22, 0.08 + Math.random() * 0.04);
      n.start(t + k * 0.045);
    }
  },
  clack() {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1150, t);
    o.frequency.exponentialRampToValueAtTime(380, t + 0.05);
    env(o, t, 0.002, 0.25, 0.07);
    o.start(t);
    o.stop(t + 0.09);
    const n = noise(0.03);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3000;
    n.connect(f);
    env(f, t, 0.001, 0.16, 0.03);
    n.start(t);
  },
  swish() {
    const t = ctx.currentTime;
    const n = noise(0.7);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.7;
    f.frequency.setValueAtTime(380, t);
    f.frequency.exponentialRampToValueAtTime(2200, t + 0.55);
    n.connect(f);
    env(f, t, 0.12, 0.2, 0.68);
    n.start(t);
  },
  paper() {
    const t = ctx.currentTime;
    const n = noise(0.3);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900;
    f.Q.value = 0.6;
    n.connect(f);
    env(f, t, 0.03, 0.14, 0.28);
    n.start(t);
  },
  flap() {
    const t = ctx.currentTime;
    for (let k = 0; k < 4; k++) {
      const n = noise(0.12);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 700;
      n.connect(f);
      env(f, t + k * 0.16, 0.02, 0.3, 0.12);
      n.start(t + k * 0.16);
    }
  },
};

export const sound = {
  get on() {
    return on;
  },
  async toggle() {
    on = !on;
    if (on) {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      S.clack();
    }
    return on;
  },
  play(name) {
    if (!on || !ctx || !S[name]) return;
    try {
      S[name]();
    } catch {
      /* audio is decoration; never let it break the page */
    }
  },
};
