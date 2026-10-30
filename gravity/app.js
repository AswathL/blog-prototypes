// Бъркотия — gravity playground (single file: i18n, art, sound, items, world, reader, viewer, list, main).
'use strict';

// ===================================================================== i18n
const I18N = (() => {
// Concept-specific UI strings. Post / album / photo text always comes from window.Blog.
const UI = {
  bg: {
    everything: 'Всичко',
    filterLabel: 'Какво да вали',
    toolbarLabel: 'Пулт за управление на гравитацията',
    photos: 'Снимки',
    morePhotos: 'Още снимки',
    shake: 'Разклати',
    tilt: 'Наклон',
    cleanup: 'Разчисти',
    soundOn: 'Звук: включен',
    soundOff: 'Звук: изключен',
    postsLabel: 'Публикации',
    printsLabel: 'Снимки на пода',
    propsLabel: 'Дреболии',
    hintGrab: 'Хвани нещо и го хвърли.',
    hintTapTouch: 'Докосни заглавие, за да го прочетеш.',
    hintTapMouse: 'Кликни заглавие, за да го прочетеш.',
    tiltOn: 'Наклонът е включен. Наклони телефона. Разклати го, ако смееш.',
    tiltOff: 'Гравитацията пак е нормална. Скучно, но стабилно.',
    tiltDenied: 'Телефонът не ни пусна до сензора за наклон.',
    tiltMissing: 'Това устройство не усеща наклон. Опитай „Разклати“.',
    catRain: 'Котешки дъжд!',
    onlyBgTag: 'само БГ',
    openPrint: 'Отвори снимката',
    printOf: 'Снимка',
    swipeHint: 'Хвърли снимката встрани за следващата',
    swipeHintMouse: 'Хвърли снимката встрани или ползвай стрелките',
    albumsLabel: 'Албуми',
    albumEnd: 'Следва',
    backToMess: 'Обратно в бъркотията',
    readOn: 'Прочети',
    progress: 'Прочетено',
    ticketHead: 'БИЛЕТ',
    ticketSub: 'ТРАМВАЙ 23 · ЕДНО ПЪТУВАНЕ',
    ticketPrice: '1,60 лв.',
    noPosts: 'Тук няма нищо. Още.',
    vanya: {
      name: 'Ваня, котката. Стикер.',
      lines: ['Мяу. Не реагирам на името си.', 'Чух хладилник. Беше ли хладилник?', 'Не ме безпокой. Преценявам те.'],
    },
    banitsa: {
      name: 'Парче баница с късмет',
      lines: [
        'Късметът ти: космос.',
        'Късметът ти: пари.',
        'Късметът ти: здраве.',
        'Късметът ти: път.',
        'Късметът ти: динозавър.',
        'Късметът ти: много сладолед.',
      ],
    },
    ticket: {
      name: 'Билет за трамвай 23',
      lines: ['Щрак! Трамваят идва след пет минути. Приблизително.', 'Щрак-щрак. Вече е перфориран, честно.', 'Билетът вече е швейцарско сирене.'],
    },
    martenitsa: {
      name: 'Мартеница: Пижо и Пенда',
      lines: ['Още я нося. Чакам щъркел.', 'Не, гълъбът не се брои.'],
      stork: 'ЩЪРКЕЛ! Най-после мога да я сваля.',
    },
    bell: {
      name: 'Кукерски звънец',
      lines: ['Дрън! Злите духове — вън.', 'Дрън-дрън. Вече си пречистен.'],
    },
  },
  en: {
    everything: 'Everything',
    filterLabel: 'What should rain down',
    toolbarLabel: 'Gravity control panel',
    photos: 'Photos',
    morePhotos: 'More photos',
    shake: 'Shake',
    tilt: 'Tilt',
    cleanup: 'Clean up',
    soundOn: 'Sound: on',
    soundOff: 'Sound: off',
    postsLabel: 'Posts',
    printsLabel: 'Prints on the floor',
    propsLabel: 'Bits and bobs',
    hintGrab: 'Grab something and throw it.',
    hintTapTouch: 'Tap a title to read it.',
    hintTapMouse: 'Click a title to read it.',
    tiltOn: 'Tilt is on. Tip your phone. Shake it, if you dare.',
    tiltOff: 'Gravity is back to normal. Boring, but stable.',
    tiltDenied: 'Your phone wouldn’t let us near the tilt sensor.',
    tiltMissing: 'This device can’t feel tilt. Try “Shake”.',
    catRain: 'It’s raining cats!',
    onlyBgTag: 'BG only',
    openPrint: 'Open photo',
    printOf: 'Photo',
    swipeHint: 'Fling the print away for the next one',
    swipeHintMouse: 'Fling the print away, or use the arrow keys',
    albumsLabel: 'Albums',
    albumEnd: 'Up next',
    backToMess: 'Back to the mess',
    readOn: 'Read',
    progress: 'Read so far',
    ticketHead: 'TICKET',
    ticketSub: 'TRAM 23 · ONE RIDE',
    ticketPrice: '1.60 lv',
    noPosts: 'Nothing here. Yet.',
    vanya: {
      name: 'Vanya the cat. A sticker.',
      lines: ['Meow. I don’t answer to my name.', 'Was that the fridge? That was the fridge.', 'Don’t disturb me. I’m judging you.'],
    },
    banitsa: {
      name: 'A slice of banitsa with a fortune',
      lines: [
        'Your fortune: outer space.',
        'Your fortune: money.',
        'Your fortune: health.',
        'Your fortune: travel.',
        'Your fortune: a dinosaur.',
        'Your fortune: lots of ice cream.',
      ],
    },
    ticket: {
      name: 'A tram 23 ticket',
      lines: ['Punch! The tram is five minutes away. Roughly.', 'Click-click. It’s punched, honest.', 'This ticket is Swiss cheese now.'],
    },
    martenitsa: {
      name: 'Martenitsa: Pizho and Penda',
      lines: ['Still wearing it. Waiting for a stork.', 'No, a pigeon doesn’t count.'],
      stork: 'A STORK! At last I can take it off.',
    },
    bell: {
      name: 'A kuker bell',
      lines: ['Clang! Evil spirits, out.', 'Clang-clang. You’re purified now.'],
    },
  },
};

const ui = (key) => {
  const table = UI[window.Blog.lang] || UI.bg;
  return table[key] ?? UI.bg[key] ?? key;
};

return { ui };
})();

// ===================================================================== art
const ART = (() => {
// Hand-drawn SVG art for the props, icons and doodles. All decorative (aria-hidden);
// the elements that host them carry the accessible names.
const INK = '#1b1640';

const shared = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="g-vanya-head"><ellipse cx="60" cy="68" rx="35" ry="30"/></clipPath>
    <linearGradient id="g-brass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe08a"/><stop offset=".45" stop-color="#f4b93a"/><stop offset="1" stop-color="#b9771a"/>
    </linearGradient>
    <linearGradient id="g-crust" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd067"/><stop offset=".6" stop-color="#f0a535"/><stop offset="1" stop-color="#d9822a"/>
    </linearGradient>
    <linearGradient id="g-foil" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f4f6fb"/><stop offset=".5" stop-color="#b8bfcc"/><stop offset="1" stop-color="#eef1f6"/>
    </linearGradient>
  </defs>
</svg>`;

const vanya = `
<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
  <circle cx="60" cy="60" r="59" fill="#fffdf7"/>
  <circle cx="60" cy="60" r="52" fill="#ffc7dc"/>
  <g fill="#ffb1cd"><circle cx="24" cy="40" r="3"/><circle cx="94" cy="30" r="2.5"/><circle cx="98" cy="86" r="3"/><circle cx="22" cy="84" r="2.5"/><circle cx="60" cy="16" r="2"/></g>
  <path d="M31 56 L33 20 L57 41 Z" fill="${INK}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M89 56 L87 20 L63 41 Z" fill="#f28a3a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M82 44 L84 29 L72 40 Z" fill="#ffb07a"/>
  <ellipse cx="60" cy="68" rx="35" ry="30" fill="#fffaf0"/>
  <g clip-path="url(#g-vanya-head)">
    <path d="M18 36 Q44 34 54 52 Q48 70 22 74 Z" fill="${INK}"/>
    <path d="M102 42 Q80 38 70 56 Q78 76 100 80 Z" fill="#f28a3a"/>
  </g>
  <ellipse cx="60" cy="68" rx="35" ry="30" fill="none" stroke="${INK}" stroke-width="3.5"/>
  <path d="M40 65 h13 a6.5 5.5 0 0 1 -13 0 z" fill="#a6d860" stroke="${INK}" stroke-width="2"/>
  <path d="M67 65 h13 a6.5 5.5 0 0 1 -13 0 z" fill="#a6d860" stroke="${INK}" stroke-width="2"/>
  <path d="M46.5 65.5 v4.5 M73.5 65.5 v4.5" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="46.5" cy="66" r="10.5" fill="rgba(255,255,255,.28)" stroke="${INK}" stroke-width="2.6"/>
  <circle cx="73.5" cy="66" r="10.5" fill="rgba(255,255,255,.28)" stroke="${INK}" stroke-width="2.6"/>
  <path d="M57 64 q3 -3.5 6 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M36 63 l-5 -3 M84 63 l5 -3" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M56 77 h8 l-4 4.5 z" fill="#ff6f9f" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M60 81.5 v2.5 M60 84 q-4 4 -7.5 0.5 M60 84 q4 4 7.5 0.5" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M28 78 l15 1.5 M29 85 l14 -2.5 M92 78 l-15 1.5 M91 85 l-14 -2.5" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const martenitsa = `
<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">
  <path d="M34 50 C26 18 54 4 60 22 C66 4 94 18 86 50" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
  <path d="M34 50 C26 18 54 4 60 22 C66 4 94 18 86 50" fill="none" stroke="#fffaf2" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M34 50 C26 18 54 4 60 22 C66 4 94 18 86 50" fill="none" stroke="#e3262f" stroke-width="5.5" stroke-dasharray="5 5"/>
  <circle cx="60" cy="23" r="5" fill="#e3262f" stroke="${INK}" stroke-width="2.5"/>
  <!-- Pizho -->
  <path d="M23 74 h22 l9 56 q-20 6 -40 0 z" fill="#fffaf2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M26 82 l-4 46 M31 82 l-2 48 M36 82 v48 M41 82 l2 48 M45 82 l4 46" stroke="#e8dccb" stroke-width="1.6"/>
  <rect x="21" y="90" width="26" height="6" rx="2" fill="#e3262f" stroke="${INK}" stroke-width="2"/>
  <path d="M16 80 h36" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
  <path d="M16 80 h36" stroke="#fffaf2" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="34" cy="61" r="12" fill="#fffaf2" stroke="${INK}" stroke-width="3"/>
  <path d="M23 56 q11 -12 22 0" fill="none" stroke="#e3262f" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="30" cy="62" r="1.8" fill="${INK}"/><circle cx="38" cy="62" r="1.8" fill="${INK}"/>
  <path d="M31 67 q3 2.5 6 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
  <!-- Penda -->
  <path d="M75 74 h22 l11 56 q-22 6 -44 0 z" fill="#e3262f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M78 84 l-6 44 M83 84 l-3 46 M88 84 l1 46 M93 84 l4 46 M97 84 l7 44" stroke="#f45a5f" stroke-width="1.6"/>
  <rect x="73" y="90" width="26" height="6" rx="2" fill="#fffaf2" stroke="${INK}" stroke-width="2"/>
  <path d="M68 80 h36" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
  <path d="M68 80 h36" stroke="#e3262f" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="86" cy="61" r="12" fill="#e3262f" stroke="${INK}" stroke-width="3"/>
  <path d="M75 57 q11 -12 22 0" fill="none" stroke="#fffaf2" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M75 60 q-5 10 -2 18 M97 60 q5 10 2 18" fill="none" stroke="#fffaf2" stroke-width="3" stroke-linecap="round"/>
  <circle cx="82" cy="62" r="1.8" fill="${INK}"/><circle cx="90" cy="62" r="1.8" fill="${INK}"/>
  <path d="M83 67 q3 2.5 6 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="80.5" cy="65.5" r="2" fill="#ff9aa6"/><circle cx="91.5" cy="65.5" r="2" fill="#ff9aa6"/>
</svg>`;

const banitsa = `
<svg viewBox="0 0 140 112" aria-hidden="true" focusable="false">
  <path d="M74 38 l9 -30 l12 4 l-8 30 z" fill="url(#g-foil)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M80 26 l9 3 M82 19 l8 3" stroke="#8d95a5" stroke-width="1.4"/>
  <path d="M10 46 L44 66 L44 100 L10 80 Z" fill="#f9dd9a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M44 66 L132 48 L132 82 L44 100 Z" fill="#fbe3a8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <g fill="none" stroke="#e2a240" stroke-width="2" stroke-linecap="round">
    <path d="M47 74 q11 -4 22 -5 t22 -5 t22 -5 t17 -3"/>
    <path d="M47 82 q11 -2 22 -5 t22 -4 t22 -5 t17 -4"/>
    <path d="M47 90 q11 -3 22 -5 t22 -5 t22 -4 t17 -4"/>
    <path d="M13 55 q8 6 14 6 t14 8"/>
    <path d="M13 63 q8 5 14 6 t14 8"/>
    <path d="M13 71 q8 5 14 6 t14 8"/>
  </g>
  <g fill="#fffdf6" stroke="#e9cf8e" stroke-width="1">
    <ellipse cx="62" cy="79" rx="3.2" ry="2.2"/><ellipse cx="96" cy="70" rx="3.6" ry="2.4"/><ellipse cx="118" cy="74" rx="2.8" ry="2"/>
    <ellipse cx="80" cy="88" rx="3" ry="2"/><ellipse cx="26" cy="67" rx="2.6" ry="2"/>
  </g>
  <path d="M10 46 L92 30 L132 48 L44 66 Z" fill="url(#g-crust)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <g fill="none" stroke="#ffe7a8" stroke-width="2.2" stroke-linecap="round" opacity=".9">
    <path d="M28 46 q14 -6 28 -4"/><path d="M60 52 q16 -6 34 -6"/><path d="M84 38 q12 0 22 6"/>
  </g>
  <g fill="#b7631f" opacity=".75"><circle cx="40" cy="50" r="2.4"/><circle cx="70" cy="44" r="2"/><circle cx="104" cy="50" r="2.6"/><circle cx="86" cy="56" r="1.8"/><circle cx="56" cy="58" r="1.6"/></g>
</svg>`;

const bell = `
<svg viewBox="0 0 110 134" aria-hidden="true" focusable="false">
  <path d="M44 26 C44 7 66 7 66 26" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
  <path d="M44 26 C44 7 66 7 66 26" fill="none" stroke="#8a4b25" stroke-width="6.5" stroke-linecap="round"/>
  <g stroke-linecap="round">
    <path d="M68 30 q14 6 20 30" stroke="${INK}" stroke-width="8" fill="none"/>
    <path d="M68 30 q14 6 20 30" stroke="#e3262f" stroke-width="4.5" fill="none"/>
    <path d="M70 31 q20 2 28 24" stroke="${INK}" stroke-width="7" fill="none"/>
    <path d="M70 31 q20 2 28 24" stroke="#ff5a5f" stroke-width="3.5" fill="none"/>
  </g>
  <path d="M55 22 C36 22 31 38 31 56 L29 84 C28 96 21 102 13 106 L97 106 C89 102 82 96 81 84 L79 56 C79 38 74 22 55 22 Z" fill="url(#g-brass)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M32 50 h46 M30 88 h50" stroke="#b9771a" stroke-width="3" fill="none"/>
  <path d="M41 33 q-6 22 -7 50" fill="none" stroke="#fff3c4" stroke-width="5" stroke-linecap="round" opacity=".9"/>
  <circle cx="55" cy="122" r="8.5" fill="#5a3a20" stroke="${INK}" stroke-width="3"/>
  <path d="M9 105 h92 v6 q0 5 -5 5 h-82 q-5 0 -5 -5 z" fill="#d59a2a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="55" cy="68" r="5.5" fill="none" stroke="#b9771a" stroke-width="2.5"/>
</svg>`;

const tram = `
<svg viewBox="0 0 40 24" aria-hidden="true" focusable="false">
  <path d="M8 4 h24 q3 0 3 3 v10 h-30 v-10 q0 -3 3 -3z" fill="currentColor"/>
  <path d="M20 4 l-4 -3 h8 z" fill="currentColor"/>
  <rect x="9" y="7" width="6" height="5" rx="1" fill="#f6edd3"/><rect x="17" y="7" width="6" height="5" rx="1" fill="#f6edd3"/><rect x="25" y="7" width="6" height="5" rx="1" fill="#f6edd3"/>
  <circle cx="12" cy="19.5" r="2.5" fill="currentColor"/><circle cx="28" cy="19.5" r="2.5" fill="currentColor"/>
  <path d="M2 23 h36" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

const stork = `
<svg viewBox="0 0 210 130" aria-hidden="true" focusable="false">
  <path d="M64 70 L10 78 M64 73 L14 86" stroke="#e8442e" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M52 66 l-14 -6 l2 12 z" fill="${INK}"/>
  <ellipse cx="86" cy="66" rx="36" ry="15" fill="#fffdf7" stroke="${INK}" stroke-width="2.5"/>
  <path d="M114 60 C132 54 146 52 160 54" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
  <path d="M114 60 C132 54 146 52 160 54" fill="none" stroke="#fffdf7" stroke-width="7" stroke-linecap="round"/>
  <circle cx="163" cy="54" r="8" fill="#fffdf7" stroke="${INK}" stroke-width="2.5"/>
  <path d="M169 51 L206 58 L169 59 Z" fill="#e8442e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="164" cy="52" r="1.8" fill="${INK}"/>
  <g class="stork-wing">
    <path d="M72 60 C82 26 108 8 134 4 C122 22 108 42 104 62 Z" fill="#fffdf7" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M112 12 C122 7 130 5 134 4 C126 16 118 26 112 34 Z" fill="${INK}"/>
  </g>
</svg>`;

const icon = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${d}</svg>`;

const icons = {
  photos: icon('<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="7" y="6" width="10" height="9" rx="1"/><path d="M8.5 13.5l2.5-3 2 2 1.5-1.5 1.5 2.5"/>'),
  shake: icon('<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 8c-1.3 2.6-1.3 5.4 0 8M20 8c1.3 2.6 1.3 5.4 0 8"/>'),
  tilt: icon('<rect x="8.2" y="3.6" width="8" height="15" rx="2" transform="rotate(18 12 12)"/><path d="M3.5 18.5c2.5 2.2 6 2.8 9 1.6"/><path d="M11.4 21.6l1.3-1.5-1.8-.9"/>'),
  cleanup: icon('<path d="M2.5 7h7.5M14 7h7.5"/><path d="M12 10v9M8.5 15.8L12 19.3l3.5-3.5"/><path d="M4.5 4l2 3M19.5 4l-2 3"/>'),
  list: icon('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>'),
  soundOn: icon('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>'),
  soundOff: icon('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
  prev: icon('<path d="M15 5l-7 7 7 7"/>'),
  next: icon('<path d="M9 5l7 7-7 7"/>'),
  back: icon('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
};

const doodles = {
  arrow: `<svg viewBox="0 0 120 90" aria-hidden="true" focusable="false"><path d="M8 10 C40 6 70 18 74 38 C78 58 50 66 44 52 C38 38 70 30 88 48 C98 58 102 70 104 82" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M94 74 L104 84 L110 70" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1 C13 8 16 11 23 12 C16 13 13 16 12 23 C11 16 8 13 1 12 C8 11 11 8 12 1Z" fill="currentColor"/></svg>`,
  ring: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
};

return { shared, vanya, martenitsa, banitsa, bell, tram, stork, icons, doodles };
})();

// ===================================================================== sound
const SOUND = (() => {
// Tiny synthesised sound kit. Always off until the visitor turns it on (never autoplays).
let ctx = null;
let master = null;
let enabled = false;
let lastThud = 0;
let noiseBuf = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

const sound = {
  get on() {
    return enabled;
  },
  set(on) {
    enabled = Boolean(on) && ensure();
    try {
      localStorage.setItem('gravity-sound', enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
    return enabled;
  },
  // A soft cardboard "thock". strength 0..1, size 0..1 (bigger = lower).
  thud(strength, size = 0.5) {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastThud < 0.035) return;
    lastThud = now;
    const s = Math.min(1, Math.max(0.05, strength));
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    const f = 210 - size * 130 + Math.random() * 30;
    o.frequency.setValueAtTime(f, now);
    o.frequency.exponentialRampToValueAtTime(f * 0.45, now + 0.12);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35 * s, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.2);
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900 + (1 - size) * 1400;
    bp.Q.value = 0.9;
    const ng = ctx.createGain();
    ng.gain.value = 0.18 * s;
    n.connect(bp).connect(ng).connect(master);
    n.start(now);
    n.stop(now + 0.08);
  },
  bell() {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    [1, 2.76, 5.4, 8.93].forEach((m, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 330 * m;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.22 / (i + 1), now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6 / (i * 0.6 + 1));
      o.connect(g).connect(master);
      o.start(now);
      o.stop(now + 1.8);
    });
  },
  click() {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    n.connect(hp).connect(g).connect(master);
    n.start(now);
    n.stop(now + 0.03);
  },
  whoosh() {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    n.playbackRate.value = 0.5;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, now);
    bp.frequency.exponentialRampToValueAtTime(2400, now + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.5, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    n.connect(bp).connect(g).connect(master);
    n.start(now);
    n.stop(now + 0.5);
  },
};

return { sound };
})();

// ===================================================================== items
const ITEMS = (() => {
// DOM factories for everything that falls. Each returns { el, kind, shape, data }.
// The element is a real, focusable DOM node; world.js measures it and gives it a body.
const { ui } = I18N;
const art = ART;
const B = () => window.Blog;
const INK = '#1b1640';

const LETTER_COLORS = [
  ['#ff5a3c', '#a3261a'],
  ['#ffc93c', '#b06f10'],
  ['#ff8cc6', '#a83c74'],
  ['#4fdcaa', '#147a5f'],
  ['#fff1db', '#c2915a'],
];
const TAPES = ['rgba(255,140,198,.78)', 'rgba(79,220,170,.72)', 'rgba(255,201,60,.8)', 'rgba(140,170,255,.75)'];

const mctx = document.createElement('canvas').getContext('2d');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const rnd = (seed) => {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

function letterAdvance(ch, fs) {
  mctx.font = `900 ${fs}px Unbounded`;
  const m = mctx.measureText(ch);
  return m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
}

function makeLetter(ch, fs, i) {
  mctx.font = `900 ${fs}px Unbounded`;
  const m = mctx.measureText(ch);
  const pad = Math.max(2, Math.round(fs * 0.03));
  const depth = Math.max(3, Math.round(fs * 0.07));
  const L = m.actualBoundingBoxLeft;
  const R = m.actualBoundingBoxRight;
  const A = m.actualBoundingBoxAscent;
  const D = Math.max(0, m.actualBoundingBoxDescent);
  const w = Math.ceil(L + R + pad * 2);
  const h = Math.ceil(A + D + pad * 2 + depth);
  const x = (L + pad).toFixed(1);
  const y = A + pad;
  const [face, side] = LETTER_COLORS[i % LETTER_COLORS.length];
  const stroke = Math.max(2, fs * 0.035).toFixed(1);
  let layers = `<text x="${x}" y="${(y + depth).toFixed(1)}" fill="${INK}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round">${esc(ch)}</text>`;
  for (let k = depth - 1; k >= 1; k -= 1.25) {
    layers += `<text x="${x}" y="${(y + k).toFixed(1)}" fill="${side}">${esc(ch)}</text>`;
  }
  layers += `<text x="${x}" y="${y.toFixed(1)}" fill="${face}" stroke="${INK}" stroke-width="${(stroke * 0.55).toFixed(1)}" paint-order="stroke">${esc(ch)}</text>`;
  const el = document.createElement('span');
  el.className = 'body letter';
  el.setAttribute('aria-hidden', 'true');
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.innerHTML = `<span class="skin"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="font-size:${fs}px">${layers}</svg></span>`;

  const up = ch.toUpperCase();
  let shape = { kind: 'rect', chamfer: Math.min(w, h) * 0.08 };
  if (up === 'О' || up === 'O') shape = { kind: 'circle', r: (w + h) / 4 - pad };
  else if (up === 'Т' || up === 'T') {
    const barH = (A + D) * 0.34 + pad;
    const stemW = w * 0.38;
    shape = {
      kind: 'parts',
      parts: [
        { cx: 0, cy: -h / 2 + barH / 2, w, h: barH },
        { cx: 0, cy: barH / 2, w: stemW, h: h - barH },
      ],
    };
  } else if (up === 'А' || up === 'A') shape = { kind: 'trap', slope: 0.5 };
  return { el, kind: 'letter', shape, data: { ch }, w, h, density: 0.005, restitution: 0.1, inertia: 3, upright: true };
}

function tornPolygon(seed) {
  const r = rnd(seed);
  const pts = ['0 0', '100% 0', '100% calc(100% - 4px)'];
  let x = 100;
  while (x > 0) {
    x = Math.max(0, x - (3 + r() * 5));
    pts.push(`${x.toFixed(1)}% calc(100% - ${(r() * 9).toFixed(1)}px)`);
  }
  return `polygon(${pts.join(',')})`;
}

const typeLabel = (post) => (post.type === 'story' ? B().t('story') : B().t('opinion'));

function shortDate(iso) {
  return B().date(iso);
}

function makePost(post, idx) {
  const v = B().view(post);
  const el = document.createElement('a');
  el.href = `#/post/${post.slug}`;
  el.setAttribute('draggable', 'false');
  el.dataset.slug = post.slug;
  if (!v.translated) el.lang = 'bg';
  const bgOnly = !v.translated ? `<span class="bg-only" lang="${B().lang}">${esc(ui('onlyBgTag'))}</span>` : '';
  const kicker = `<span class="kicker"><span class="kind">${esc(typeLabel(post))}</span> <time datetime="${post.date}">${esc(shortDate(post.date))}</time></span>`;
  const title = `<span class="title">${esc(v.title)}</span>`;
  const seed = [...post.slug].reduce((a, c) => a + c.charCodeAt(0), 0);
  let variant;
  let shape = { kind: 'rect', chamfer: 3 };

  if (post.type === 'story') {
    const storyIdx = B().stories.indexOf(post);
    variant = storyIdx % 2 === 0 ? 'torn' : 'note';
    const tape = TAPES[storyIdx % TAPES.length];
    el.className = `body post story v-${variant}`;
    el.innerHTML = `<span class="skin" style="--tape:${tape}">
      <span class="paper" style="clip-path:${tornPolygon(seed)}">${kicker}${title}</span>
      <span class="tape" aria-hidden="true"></span>${bgOnly}
    </span>`;
  } else {
    const opIdx = B().opinions.indexOf(post);
    variant = ['sign', 'sticker', 'bubble'][opIdx % 3];
    el.className = `body post opinion v-${variant}`;
    if (variant === 'sign') {
      el.innerHTML = `<span class="skin"><span class="board">${kicker}${title}<span class="staple s1" aria-hidden="true"></span><span class="staple s2" aria-hidden="true"></span></span><span class="stick" aria-hidden="true"></span>${bgOnly}</span>`;
      shape = { kind: 'sign' };
    } else if (variant === 'sticker') {
      el.innerHTML = `<span class="skin"><span class="sticker">${kicker}${title}</span><span class="bang" aria-hidden="true">!</span>${bgOnly}</span>`;
      shape = { kind: 'rect', chamfer: 18 };
    } else {
      el.innerHTML = `<span class="skin"><span class="speech">${kicker}${title}</span><span class="tail" aria-hidden="true"></span>${bgOnly}</span>`;
      shape = { kind: 'rect', chamfer: 16 };
    }
  }
  return { el, kind: 'post', shape, data: { post, variant }, density: 0.0016, restitution: 0.2 };
}

const PROPS = {
  vanya: { svg: art.vanya, post: 'kotkata-koyato-me-osinovi', shape: { kind: 'circle' } },
  banitsa: { svg: art.banitsa, post: 'kasmet-astronavt', shape: { kind: 'rect', chamfer: 10 } },
  ticket: { svg: null, post: 'pet-minuti-zakasnenie', shape: { kind: 'rect', chamfer: 4 } },
  martenitsa: { svg: art.martenitsa, post: 'martenitsata-i-shturkelat', shape: { kind: 'rect', chamfer: 14 } },
  bell: { svg: art.bell, post: 'kukerite-me-goniha', shape: { kind: 'rect', chamfer: 12 } },
};

const PROP_ORDER = ['vanya', 'banitsa', 'martenitsa', 'ticket', 'bell'];

function makeProp(name) {
  const p = PROPS[name];
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `body prop prop-${name}`;
  el.dataset.prop = name;
  el.setAttribute('aria-label', ui(name).name);
  if (name === 'ticket') {
    el.innerHTML = `<span class="skin"><span class="ticket">
      <span class="t-top"><span class="t-tram">${art.tram}</span><span class="t-head">${esc(ui('ticketHead'))}</span></span>
      <span class="t-sub">${esc(ui('ticketSub'))}</span>
      <span class="t-row"><span class="t-no">№ 023 571 23</span><span class="t-price">${esc(ui('ticketPrice'))}</span></span>
      <span class="t-holes" aria-hidden="true"></span>
    </span></span>`;
  } else {
    el.innerHTML = `<span class="skin">${p.svg}</span>`;
  }
  return { el, kind: 'prop', shape: { ...p.shape }, data: { name, post: p.post, taps: 0 }, density: 0.0022, restitution: name === 'vanya' ? 0.45 : 0.25 };
}

function makePhoto(photo) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'body photo';
  el.dataset.album = photo.album;
  el.dataset.index = String(photo.index);
  const cap = B().text(photo.caption);
  const ratio = photo.w / photo.h;
  el.innerHTML = `<span class="skin"><span class="print">
    <span class="pic" style="--ar:${ratio.toFixed(3)}"><img src="${B().thumbUrl(photo.file)}" alt="${esc(cap)}" draggable="false" decoding="async"></span>
    <span class="cap" aria-hidden="true">${esc(cap)}</span>
  </span><span class="pin" aria-hidden="true"></span></span>`;
  return { el, kind: 'photo', shape: { kind: 'rect', chamfer: 3 }, data: { photo }, density: 0.0012, restitution: 0.18 };
}

function makeAbout() {
  const el = document.createElement('div');
  el.className = 'body about';
  el.setAttribute('role', 'note');
  el.innerHTML = `<span class="skin"><span class="tag">
    <span class="eyelet" aria-hidden="true"></span>
    <span class="about-k">${esc(B().t('about'))}</span>
    <span class="about-t">${esc(B().text(B().site.about))}</span>
  </span></span>`;
  return { el, kind: 'about', shape: { kind: 'rect', chamfer: 8 }, data: {}, density: 0.0012, restitution: 0.2 };
}

function makeCat() {
  const el = document.createElement('span');
  el.className = 'body cat';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span class="skin">${art.vanya}</span>`;
  return { el, kind: 'cat', shape: { kind: 'circle' }, data: {}, density: 0.0015, restitution: 0.55 };
}

return { letterAdvance, makeLetter, makePost, PROP_ORDER, makeProp, makePhoto, makeAbout, makeCat };
})();

// ===================================================================== world
const WORLD = (() => {
// The physics world: Matter.js bodies, each mirrored by a real DOM element.
const { sound } = SOUND;
const { Engine, Bodies, Body, Composite, Constraint, Events, Sleeping } = window.Matter;

const STEP = 1000 / 60;
const CAT = { WALL: 0x1, CEIL: 0x2, ITEM: 0x4, HANG: 0x8 };
const AIR = 0.014;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function createWorld({ worldEl, layers, getFloorY }) {
  const engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 6 });
  engine.gravity.scale = 0.0013;

  const items = new Set();
  const pending = new Set();
  const byEl = new WeakMap();
  const drags = new Map();
  const tasks = [];
  let simTime = 0;
  let W = 0;
  let H = 0;
  let floorY = 0;
  let u = 1;
  let walls = null;
  let floorOpen = false;
  let paused = false;
  let reduced = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let zTop = 10;
  let lastThudAt = 0;
  const listeners = { render: [], fling: [], poke: [] };

  // ---------- bounds & walls ----------
  function measure() {
    W = worldEl.clientWidth;
    H = worldEl.clientHeight;
    floorY = getFloorY();
  }

  function buildWalls() {
    if (walls) Composite.remove(engine.world, Object.values(walls).filter((b) => b !== walls.floor || !floorOpen));
    const t = 600;
    const top = -4 * H;
    const bottom = floorY + t;
    const wallOpts = { isStatic: true, friction: 0.4, restitution: 0.2, collisionFilter: { category: CAT.WALL, mask: CAT.ITEM } };
    walls = {
      floor: Bodies.rectangle(W / 2, floorY + t / 2, W + t * 4, t, { ...wallOpts, friction: 0.9 }),
      left: Bodies.rectangle(-t / 2, (top + bottom) / 2, t, bottom - top, wallOpts),
      right: Bodies.rectangle(W + t / 2, (top + bottom) / 2, t, bottom - top, wallOpts),
      ceil: Bodies.rectangle(W / 2, -t / 2, W + t * 4, t, { ...wallOpts, collisionFilter: { category: CAT.CEIL, mask: CAT.ITEM } }),
    };
    Composite.add(engine.world, Object.values(walls).filter((b) => b !== walls.floor || !floorOpen));
  }

  function setBounds(scale) {
    measure();
    u = scale;
    buildWalls();
    for (const it of items) {
      if (it.hang) it.hang.c.pointA.x = W * it.hang.fx;
      if (!it.body || it.ghost || it.hang) continue;
      const b = it.body;
      const hw = (b.bounds.max.x - b.bounds.min.x) / 2;
      const hh = (b.bounds.max.y - b.bounds.min.y) / 2;
      const x = clamp(b.position.x, hw + 2, Math.max(hw + 2, W - hw - 2));
      const y = Math.min(b.position.y, floorY - hh - 2);
      if (x !== b.position.x || y !== b.position.y) {
        Body.setPosition(b, { x, y });
        Sleeping.set(b, false);
      }
    }
    if (reduced) renderAll(true);
  }

  // ---------- bodies ----------
  function makeBody(it, x, y) {
    const { w, h, shape } = it;
    const opts = {
      friction: it.kind === 'letter' ? 0.6 : 0.3,
      frictionStatic: it.kind === 'letter' ? 0.9 : 0.55,
      frictionAir: AIR,
      restitution: it.restitution ?? 0.2,
      density: it.density ?? 0.0015,
      slop: 0.04,
      collisionFilter: { category: CAT.ITEM, mask: CAT.WALL | CAT.ITEM, group: 0 },
    };
    let body;
    if (shape.kind === 'circle') {
      body = Bodies.circle(x, y, shape.r ?? Math.min(w, h) / 2 - 1, opts, 24);
    } else if (shape.kind === 'trap') {
      body = Bodies.trapezoid(x, y, w, h, shape.slope, opts);
    } else if (shape.kind === 'parts' || shape.kind === 'sign') {
      let parts = shape.parts;
      if (shape.kind === 'sign') {
        const bh = it.boardH;
        const sw = Math.max(10, w * 0.09);
        parts = [
          { cx: 0, cy: -h / 2 + bh / 2, w, h: bh, chamfer: 6 },
          { cx: 0, cy: -h / 2 + bh + (h - bh) / 2, w: sw, h: h - bh },
        ];
      }
      const bodies = parts.map((p) =>
        Bodies.rectangle(x + p.cx, y + p.cy, p.w, p.h, {
          density: opts.density,
          chamfer: p.chamfer ? { radius: p.chamfer } : undefined,
        }),
      );
      body = Body.create({ ...opts, parts: bodies });
    } else {
      const ch = Math.min(shape.chamfer || 0, Math.min(w, h) / 2 - 1);
      body = Bodies.rectangle(x, y, w, h, { ...opts, chamfer: ch > 0 ? { radius: ch } : undefined });
    }
    // Offset between the element's box centre and the body's centre of mass (local frame).
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const part of body.parts.length > 1 ? body.parts.slice(1) : body.parts) {
      for (const v of part.vertices) {
        minX = Math.min(minX, v.x);
        minY = Math.min(minY, v.y);
        maxX = Math.max(maxX, v.x);
        maxY = Math.max(maxY, v.y);
      }
    }
    if (shape.kind === 'circle') {
      it.ox = 0;
      it.oy = 0;
    } else {
      it.ox = (minX + maxX) / 2 - body.position.x;
      it.oy = (minY + maxY) / 2 - body.position.y;
    }
    Body.setPosition(body, { x: x - it.ox, y: y - it.oy });
    if (it.inertia) Body.setInertia(body, body.inertia * it.inertia);
    body.plugin.item = it;
    return body;
  }

  // Create DOM for a batch of specs, measure once, then attach bodies.
  function materialise(specs) {
    const made = specs.map((spec) => {
      const it = { ...spec, body: null, ghost: false, entered: false, last: null, suppressUntil: 0 };
      it.el.classList.add('is-waiting');
      const layer = { cat: 'props', photo: 'photos', prop: 'props', post: 'posts', about: 'about' }[it.kind] || 'letters';
      layers[layer].appendChild(it.el);
      byEl.set(it.el, it);
      pending.add(it);
      return it;
    });
    for (const it of made) {
      if (!it.w) {
        it.w = it.el.offsetWidth;
        it.h = it.el.offsetHeight;
      }
      if (it.shape.kind === 'sign') {
        const board = it.el.querySelector('.board');
        it.boardH = board ? board.offsetHeight : it.h * 0.7;
      }
      it.el.style.width = it.w + 'px';
      it.el.style.height = it.h + 'px';
    }
    return made;
  }

  function attach(it, x, y, { angle = 0, vx = 0, vy = 0, av = 0 } = {}) {
    it.body = makeBody(it, x, y);
    if (angle) Body.setAngle(it.body, angle);
    pending.delete(it);
    items.add(it);
    if (!reduced) {
      Composite.add(engine.world, it.body);
      Body.setVelocity(it.body, { x: vx, y: vy });
      Body.setAngularVelocity(it.body, av);
    }
    it.el.style.zIndex = String(++zTop);
    it.el.classList.remove('is-waiting');
    it.born = simTime;
    render(it, true);
    return it;
  }

  function cut(it) {
    if (!it.hang) return;
    Composite.remove(engine.world, it.hang.c);
    it.hang.stringEl.remove();
    it.hang = null;
  }

  function remove(it) {
    cut(it);
    if (it.body) Composite.remove(engine.world, it.body);
    for (const [id, d] of drags) {
      if (d.item === it) {
        Composite.remove(engine.world, d.c);
        drags.delete(id);
      }
    }
    items.delete(it);
    pending.delete(it);
    it.el.remove();
    it.removed = true;
  }

  function removeAll() {
    for (const it of [...items, ...pending]) remove(it);
    for (const t of tasks.splice(0)) t.cancelled = true;
  }

  // Find a spawn spot above the viewport that doesn't overlap anything still up there.
  function spawnSpot(it, prefX) {
    const halfW = it.w / 2;
    const minX = halfW + 6;
    const maxX = Math.max(minX, W - halfW - 6);
    let best = null;
    const tries = prefX != null ? 1 : 10;
    for (let i = 0; i < tries; i++) {
      const x = prefX != null ? clamp(prefX, minX, maxX) : rand(minX, maxX);
      let y = -it.h / 2 - 30;
      for (const o of items) {
        if (!o.body || o.ghost) continue;
        const b = o.body.bounds;
        if (b.min.y > 40) continue;
        if (b.max.x > x - halfW - 4 && b.min.x < x + halfW + 4) y = Math.min(y, b.min.y - it.h / 2 - 12);
      }
      if (!best || y > best.y) best = { x, y };
      if (y >= -it.h / 2 - 30) break;
    }
    return best;
  }

  // Drop a list of specs from the sky, one by one.
  function drop(specs, { stagger = 120, delay = 0, xs = null, spin = 0.5, speed = 5 } = {}) {
    const made = materialise(specs);
    made.forEach((it, i) => {
      after(delay + i * stagger, () => {
        if (it.removed) return;
        if (reduced) return;
        const s = spawnSpot(it, xs ? xs[i] : null);
        attach(it, s.x, s.y, { angle: rand(-spin, spin), vy: speed + rand(0, 3), av: rand(-0.02, 0.02) * (spin > 0.1 ? 1 : 0.3) });
      });
    });
    return made;
  }

  // A card on a string, hanging from the ceiling on the back wall. It swings, but the
  // falling things pass in front of it (it only collides with the walls).
  function hang(spec, { fx = 0.5, length = 100, swing = -0.9 } = {}) {
    const [it] = materialise([spec]);
    if (reduced) return it;
    const ax = W * fx;
    const ay = -8;
    const px = ax + Math.sin(swing) * length;
    const py = ay + Math.cos(swing) * length;
    attach(it, px, py + it.h / 2 - 12);
    it.body.collisionFilter = { category: CAT.HANG, mask: CAT.WALL, group: 0 };
    it.body.frictionAir = 0.025;
    it.entered = true;
    const c = Constraint.create({
      pointA: { x: ax, y: ay },
      bodyB: it.body,
      pointB: { x: 0, y: -it.h / 2 + 12 },
      length,
      stiffness: 0.5,
      damping: 0.04,
    });
    Composite.add(engine.world, c);
    const stringEl = document.createElement('span');
    stringEl.className = 'hang-string';
    stringEl.setAttribute('aria-hidden', 'true');
    it.el.before(stringEl);
    it.hang = { c, fx, stringEl };
    it.el.style.zIndex = '1';
    stringEl.style.zIndex = '1';
    render(it, true);
    return it;
  }

  function swing(it, power = 1) {
    if (!it.body || reduced || paused) return;
    Sleeping.set(it.body, false);
    Body.setVelocity(it.body, { x: it.body.velocity.x + (Math.random() < 0.5 ? -1 : 1) * 9 * power, y: it.body.velocity.y - 2 });
  }

  // ---------- actions ----------
  function launch(it, { up = true } = {}) {
    if (!it.body || it.ghost) {
      if (!it.body) remove(it);
      return;
    }
    cut(it);
    it.ghost = true;
    it.ghostAt = simTime;
    it.el.classList.add('is-leaving');
    it.body.collisionFilter.mask = 0;
    Sleeping.set(it.body, false);
    const k = Math.sqrt(H / 800);
    Body.setVelocity(it.body, { x: rand(-7, 7), y: up ? -rand(30, 42) * k : rand(4, 8) });
    Body.setAngularVelocity(it.body, rand(-0.22, 0.22));
  }

  function wakeAll() {
    for (const it of items) if (it.body) Sleeping.set(it.body, false);
  }

  function shake(power = 1) {
    const k = clamp(Math.sqrt(H / 800), 0.75, 1.2) * power;
    for (const it of items) {
      if (!it.body || it.ghost) continue;
      Sleeping.set(it.body, false);
      const v = it.body.velocity;
      Body.setVelocity(it.body, { x: v.x + rand(-9, 9) * k, y: v.y - rand(9, 19) * k });
      Body.setAngularVelocity(it.body, it.body.angularVelocity + rand(-0.2, 0.2));
    }
  }

  function poke(x, y) {
    const R = 240 * Math.max(0.7, u);
    let hit = false;
    for (const it of items) {
      if (!it.body || it.ghost) continue;
      const p = it.body.position;
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > R) continue;
      const f = (1 - d / R) * 15;
      Sleeping.set(it.body, false);
      Body.setVelocity(it.body, { x: it.body.velocity.x + (dx / d) * f, y: it.body.velocity.y + (dy / d) * f - 5 * (1 - d / R) });
      Body.setAngularVelocity(it.body, it.body.angularVelocity + rand(-0.08, 0.08));
      hit = true;
    }
    listeners.poke.forEach((fn) => fn(x, y, hit));
  }

  function hop(it, power = 1) {
    if (!it.body || reduced || paused) return;
    Sleeping.set(it.body, false);
    Body.setVelocity(it.body, { x: it.body.velocity.x + rand(-2, 2), y: -9 * power });
    Body.setAngularVelocity(it.body, rand(-0.12, 0.12));
  }

  function openFloor() {
    if (floorOpen) return;
    floorOpen = true;
    Composite.remove(engine.world, walls.floor);
    wakeAll();
  }

  function closeFloor() {
    if (!floorOpen) return;
    floorOpen = false;
    Composite.add(engine.world, walls.floor);
  }

  function setGravity(x, y) {
    engine.gravity.x = x;
    engine.gravity.y = y;
  }

  function setSleeping(on) {
    engine.enableSleeping = on;
    if (!on) wakeAll();
  }

  // ---------- scheduler (runs in simulation time, so pausing pauses it) ----------
  function after(ms, fn) {
    const t = { t: simTime + ms, fn, cancelled: false };
    tasks.push(t);
    tasks.sort((a, b) => a.t - b.t);
    return t;
  }

  function runTasks() {
    while (tasks.length && tasks[0].t <= simTime) {
      const t = tasks.shift();
      if (!t.cancelled) t.fn();
    }
  }

  // ---------- simulation ----------
  function step() {
    Engine.update(engine, STEP);
    simTime += STEP;
    const maxV = 48;
    for (const it of items) {
      const b = it.body;
      if (!b) continue;
      if (b.speed > maxV) {
        const k = maxV / b.speed;
        Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
      }
      if (Math.abs(b.angularVelocity) > 0.45) Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * 0.45);
      const bb = b.bounds;
      if (it.ghost) {
        if (bb.max.y < -30 || bb.min.y > H + 30 || bb.max.x < -30 || bb.min.x > W + 30 || simTime - it.ghostAt > 3200) remove(it);
        continue;
      }
      if (it.upright && !it.held) {
        // Letters are roly-poly toys: they slowly pick themselves back up.
        const g = engine.gravity;
        if (Math.hypot(g.x, g.y) > 0.25) {
          let d = Math.atan2(-g.x, g.y) - b.angle;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          if (Math.abs(d) > 0.03) {
            if (b.isSleeping) Sleeping.set(b, false);
            const push = Math.abs(d) > 1.2 ? Math.sign(d) : Math.sin(d);
            Body.setAngularVelocity(b, b.angularVelocity * 0.97 + 0.0042 * push);
          }
        }
      }
      if (!it.entered && bb.min.y > 2) {
        it.entered = true;
        b.collisionFilter.mask = CAT.WALL | CAT.ITEM | CAT.CEIL;
      }
      if (it.hang) continue;
      if (floorOpen) {
        if (bb.min.y > floorY + 30) remove(it);
        continue;
      }
      // Rescue anything that tunnelled out of the box.
      if (bb.min.y > floorY + 40 || bb.max.x < -60 || bb.min.x > W + 60) {
        Body.setPosition(b, { x: rand(it.w / 2 + 10, Math.max(it.w / 2 + 10, W - it.w / 2 - 10)), y: -it.h });
        Body.setVelocity(b, { x: 0, y: 2 });
        it.entered = false;
        b.collisionFilter.mask = CAT.WALL | CAT.ITEM;
      }
    }
    runTasks();
  }

  function fastForward(ms) {
    const target = simTime + ms;
    while (simTime < target) step();
    renderAll(true);
  }

  // ---------- rendering ----------
  function render(it, force) {
    const b = it.body;
    if (!b) return;
    const a = b.angle;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const cx = b.position.x + it.ox * c - it.oy * s;
    const cy = b.position.y + it.ox * s + it.oy * c;
    const l = it.last;
    if (!force && l && Math.abs(l.x - cx) < 0.05 && Math.abs(l.y - cy) < 0.05 && Math.abs(l.a - a) < 0.0005) return;
    it.last = { x: cx, y: cy, a };
    it.el.style.transform = `translate3d(${(cx - it.w / 2).toFixed(2)}px,${(cy - it.h / 2).toFixed(2)}px,0) rotate(${a.toFixed(4)}rad)`;
    if (it.hang) {
      const A = it.hang.c.pointA;
      const pb = it.hang.c.pointB;
      const dx = b.position.x + pb.x - A.x;
      const dy = b.position.y + pb.y - A.y;
      it.hang.stringEl.style.height = Math.hypot(dx, dy).toFixed(1) + 'px';
      it.hang.stringEl.style.transform = `translate3d(${A.x.toFixed(1)}px,${A.y.toFixed(1)}px,0) rotate(${Math.atan2(-dx, dy).toFixed(4)}rad)`;
    }
  }

  function renderAll(force) {
    for (const it of items) render(it, force);
    listeners.render.forEach((fn) => fn());
  }

  function frame(t) {
    raf = 0;
    if (paused || reduced || document.hidden) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(t - last, 100) : STEP;
    last = t;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 4) {
      step();
      acc -= STEP;
      n++;
    }
    if (n === 4) acc = 0;
    renderAll(false);
  }

  function start() {
    if (raf || paused || reduced || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    paused = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    for (const [id, d] of drags) {
      Composite.remove(engine.world, d.c);
      d.item.el.classList.remove('is-held', 'is-dragging');
      drags.delete(id);
    }
    worldEl.classList.remove('is-dragging');
  }

  function resume() {
    paused = false;
    wakeAll();
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) start();
  });

  // ---------- sound on impact ----------
  Events.on(engine, 'collisionStart', (ev) => {
    if (!sound.on) return;
    for (const pair of ev.pairs) {
      const a = pair.bodyA.parent;
      const b = pair.bodyB.parent;
      const rel = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
      if (rel < 3.5 || simTime - lastThudAt < 30) continue;
      lastThudAt = simTime;
      const m = Math.max(a.isStatic ? 0 : a.mass, b.isStatic ? 0 : b.mass);
      sound.thud(rel / 24, clamp(m / 40, 0, 1));
    }
  });

  // ---------- pointer: grab, drag, fling, poke ----------
  function raise(it) {
    if (it.hang) return;
    it.el.style.zIndex = String(++zTop);
  }

  worldEl.addEventListener('pointerdown', (e) => {
    if (paused) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.bubble, a:not(.body), button:not(.body)')) return;
    const el = e.target.closest('.body');
    if (!el) {
      if (!reduced) poke(e.clientX, e.clientY);
      return;
    }
    const it = byEl.get(el);
    if (!it || it.ghost || !it.body) return;
    e.preventDefault();
    raise(it);
    if (reduced) return;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    const p = { x: e.clientX, y: e.clientY };
    const c = Constraint.create({
      pointA: { ...p },
      bodyB: it.body,
      pointB: { x: p.x - it.body.position.x, y: p.y - it.body.position.y },
      stiffness: 0.2,
      damping: 0.12,
      length: 0,
    });
    Composite.add(engine.world, c);
    Sleeping.set(it.body, false);
    it.body.frictionAir = 0.06;
    it.held = true;
    drags.set(e.pointerId, { item: it, c, x0: p.x, y0: p.y, moved: false });
    el.classList.add('is-held');
  });

  function move(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    const x = clamp(e.clientX, 2, W - 2);
    const y = clamp(e.clientY, 2, floorY - 2);
    d.c.pointA.x = x;
    d.c.pointA.y = y;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 7) {
      d.moved = true;
      d.item.el.classList.add('is-dragging');
      worldEl.classList.add('is-dragging');
    }
    Sleeping.set(d.item.body, false);
  }

  function up(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    Composite.remove(engine.world, d.c);
    const it = d.item;
    it.held = false;
    it.el.classList.remove('is-held', 'is-dragging');
    if (!drags.size) worldEl.classList.remove('is-dragging');
    if (!it.body) return;
    it.body.frictionAir = AIR;
    if (d.moved) {
      it.suppressUntil = performance.now() + 450;
      const v = it.body.velocity;
      Body.setVelocity(it.body, { x: v.x * 1.25, y: v.y * 1.25 });
      listeners.fling.forEach((fn) => fn(it));
    }
  }

  worldEl.addEventListener('pointermove', move);
  worldEl.addEventListener('pointerup', up);
  worldEl.addEventListener('pointercancel', up);
  worldEl.addEventListener('lostpointercapture', up);
  worldEl.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest('.body');
      const it = el && byEl.get(el);
      if (it && it.suppressUntil > performance.now()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  worldEl.addEventListener('dragstart', (e) => e.preventDefault());
  worldEl.addEventListener('focusin', (e) => {
    const it = byEl.get(e.target);
    if (it) raise(it);
  });

  // ---------- static placement (reduced motion) ----------
  function place(it, x, y, angle) {
    if (!it.body) it.body = makeBody(it, x, y);
    else Body.setPosition(it.body, { x: x - it.ox, y: y - it.oy });
    Body.setAngle(it.body, angle);
    pending.delete(it);
    items.add(it);
    it.el.classList.remove('is-waiting');
    it.el.style.zIndex = String(++zTop);
    render(it, true);
  }

  function setReduced(on) {
    reduced = on;
    if (on && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (!on) start();
  }

  return {
    engine,
    get items() {
      return items;
    },
    get pending() {
      return pending;
    },
    get size() {
      return { W, H, floorY, u };
    },
    get paused() {
      return paused;
    },
    get reduced() {
      return reduced;
    },
    get floorOpen() {
      return floorOpen;
    },
    itemOf: (el) => byEl.get(el),
    setBounds,
    measure,
    materialise,
    attach,
    drop,
    hang,
    swing,
    remove,
    removeAll,
    launch,
    shake,
    poke,
    hop,
    openFloor,
    closeFloor,
    setGravity,
    setSleeping,
    after,
    fastForward,
    renderAll,
    start,
    pause,
    resume,
    place,
    setReduced,
    centerOf(it) {
      if (!it.last) return null;
      return { x: it.last.x, y: it.last.y, a: it.last.a };
    },
    on(evt, fn) {
      listeners[evt].push(fn);
    },
  };
}

return { createWorld };
})();

// ===================================================================== reader
const READER = (() => {
// The calm reading view: a paper page that slides over the paused, blurred world.
const { ui } = I18N;
const { icons } = ART;
const B = () => window.Blog;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function createReader({ root, langSwitch, onClose, onGo, reduced }) {
  root.innerHTML = `
    <div class="ov-backdrop" aria-hidden="true"></div>
    <div class="reader-scroll">
      <div class="reader-progress" aria-hidden="true"><span></span></div>
      <div class="reader-bar">
        <button type="button" class="round-btn reader-close">${icons.close}</button>
        <span class="reader-lang"></span>
      </div>
      <article class="page"></article>
    </div>`;
  const scroller = root.querySelector('.reader-scroll');
  const page = root.querySelector('.page');
  const progress = root.querySelector('.reader-progress span');
  const closeBtn = root.querySelector('.reader-close');
  root.querySelector('.reader-lang').appendChild(langSwitch);
  let slug = null;
  let closing = null;

  closeBtn.addEventListener('click', onClose);
  scroller.addEventListener(
    'scroll',
    () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scroller.scrollTop / max) : 0})`;
    },
    { passive: true },
  );
  root.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      onGo(go.dataset.go);
    }
    if (e.target.closest('[data-close]')) onClose();
  });

  function photoSize(file) {
    const p = B().photos.find((ph) => ph.file === file);
    return p ? [p.w, p.h] : [1600, 1067];
  }

  function render() {
    const Blog = B();
    const post = Blog.post(slug);
    const v = Blog.view(post);
    const L = Blog.lang;
    const i = Blog.posts.indexOf(post);
    const prev = Blog.posts[i - 1];
    const next = Blog.posts[i + 1];
    const typeLabel = post.type === 'story' ? Blog.t('story') : Blog.t('opinion');
    const body = v.body
      .map((b) => {
        if (b.p) return `<p>${esc(b.p)}</p>`;
        if (b.h) return `<h2>${esc(b.h)}</h2>`;
        if (b.quote) return `<blockquote class="pull"><p>${esc(b.quote)}</p></blockquote>`;
        if (b.img) {
          const [w, h] = photoSize(b.img);
          const cap = Blog.text(b.caption);
          return `<figure class="page-fig"><span class="fig-tape" aria-hidden="true"></span><img src="${Blog.photoUrl(b.img)}" width="${w}" height="${h}" alt="${esc(cap)}" loading="lazy" decoding="async"><figcaption lang="${L}">${esc(cap)}</figcaption></figure>`;
        }
        return '';
      })
      .join('');
    const navItem = (p, dir) => {
      if (!p) return '<span class="pn-empty"></span>';
      const pv = Blog.view(p);
      return `<a class="pn pn-${dir}" href="#/post/${p.slug}" data-go="${p.slug}">
        <span class="pn-dir" lang="${L}">${dir === 'prev' ? '← ' + esc(Blog.t('prev')) : esc(Blog.t('next')) + ' →'}</span>
        <span class="pn-title"${pv.translated ? '' : ' lang="bg"'}>${esc(pv.title)}</span></a>`;
    };
    page.className = `page page-${post.type}`;
    page.lang = v.translated ? L : 'bg';
    page.setAttribute('aria-labelledby', 'reader-title');
    page.innerHTML = `
      <span class="page-tape" aria-hidden="true"></span>
      <header class="page-head">
        <p class="page-kicker" lang="${L}"><span class="type-pill">${esc(typeLabel)}</span><time datetime="${post.date}">${esc(Blog.date(post.date))}</time><span aria-hidden="true">·</span><span>${Blog.readMinutes(post)} ${esc(Blog.t('minRead'))}</span></p>
        <h1 id="reader-title" tabindex="-1">${esc(v.title)}</h1>
        <p class="page-mood" lang="${L}"><span>${esc(Blog.t('mood'))}:</span> ${esc(Blog.text(post.mood))}</p>
        ${v.translated ? '' : `<p class="only-bg" lang="${L}">${esc(Blog.t('onlyBg'))}</p>`}
      </header>
      <div class="page-body">${body}</div>
      <nav class="page-nav" aria-label="${esc(Blog.t('allPosts'))}" lang="${L}">${navItem(prev, 'prev')}${navItem(next, 'next')}</nav>
      <p class="page-end" lang="${L}"><button type="button" class="back-btn" data-close>${icons.back}<span>${esc(ui('backToMess'))}</span></button></p>`;
    closeBtn.setAttribute('aria-label', Blog.t('close'));
    root.setAttribute('aria-label', v.title);
  }

  return {
    get slug() {
      return slug;
    },
    open(nextSlug, { swap = false } = {}) {
      const same = slug === nextSlug && !root.hidden && !closing;
      if (same) return;
      slug = nextSlug;
      if (closing) {
        closing.cancel();
        closing = null;
      }
      if (swap && !root.hidden) {
        // Next / previous: the current sheet slides off sideways, the new one slides up.
        page.classList.add('is-swapping');
        setTimeout(
          () => {
            render();
            scroller.scrollTop = 0;
            page.classList.remove('is-swapping');
            page.classList.add('is-entering');
            void page.offsetWidth;
            page.classList.remove('is-entering');
            page.querySelector('h1').focus({ preventScroll: true });
          },
          reduced() ? 0 : 260,
        );
        return;
      }
      render();
      root.hidden = false;
      root.classList.remove('is-closing');
      scroller.scrollTop = 0;
      progress.style.transform = 'scaleX(0)';
      void root.offsetWidth;
      root.classList.add('is-open');
      page.querySelector('h1').focus({ preventScroll: true });
    },
    close({ instant = false } = {}) {
      if (root.hidden) return Promise.resolve();
      root.classList.remove('is-open');
      if (instant || reduced()) {
        root.hidden = true;
        slug = null;
        return Promise.resolve();
      }
      root.classList.add('is-closing');
      return new Promise((resolve) => {
        const t = setTimeout(done, 520);
        function done() {
          clearTimeout(t);
          root.hidden = true;
          root.classList.remove('is-closing');
          slug = null;
          closing = null;
          resolve();
        }
        closing = {
          cancel() {
            clearTimeout(t);
            root.classList.remove('is-closing');
            resolve();
          },
        };
      });
    },
    update() {
      if (slug && !root.hidden) {
        const y = scroller.scrollTop;
        render();
        scroller.scrollTop = y;
      }
    },
  };
}

return { createReader };
})();

// ===================================================================== viewer
const VIEWER = (() => {
// Photo viewer: a stack of prints over the paused world. Fling the top print away for the next one.
const { ui } = I18N;
const { icons } = ART;
const B = () => window.Blog;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
const T = (x, y, r, s = 1) => `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;

function createViewer({ root, langSwitch, onClose, onChange, reduced, coarse }) {
  root.innerHTML = `
    <div class="ov-backdrop" aria-hidden="true"></div>
    <div class="viewer-inner">
      <header class="viewer-top">
        <div class="viewer-tabs" role="tablist"></div>
        <div class="viewer-actions"><span class="viewer-lang"></span><button type="button" class="round-btn viewer-close">${icons.close}</button></div>
      </header>
      <p class="viewer-note"></p>
      <div class="viewer-stage"><div class="stack" tabindex="0"></div></div>
      <div class="viewer-controls">
        <button type="button" class="round-btn v-prev">${icons.prev}</button>
        <p class="v-count"></p>
        <button type="button" class="round-btn v-next">${icons.next}</button>
      </div>
      <p class="viewer-hint"></p>
      <p class="sr-only v-live" aria-live="polite"></p>
    </div>`;
  const tabs = root.querySelector('.viewer-tabs');
  const note = root.querySelector('.viewer-note');
  const stage = root.querySelector('.viewer-stage');
  const stack = root.querySelector('.stack');
  const count = root.querySelector('.v-count');
  const live = root.querySelector('.v-live');
  const hint = root.querySelector('.viewer-hint');
  const btnPrev = root.querySelector('.v-prev');
  const btnNext = root.querySelector('.v-next');
  const btnClose = root.querySelector('.viewer-close');
  root.querySelector('.viewer-lang').appendChild(langSwitch);

  let gi = 0;
  let animating = false;
  let isOpen = false;
  let closeTimer = 0;

  const seq = () => B().photos;
  const albumOf = (p) => B().albums.find((a) => a.slug === p.album);

  btnClose.addEventListener('click', onClose);
  btnPrev.addEventListener('click', () => prev());
  btnNext.addEventListener('click', () => next());
  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('[data-album]');
    if (!t) return;
    const i = seq().findIndex((p) => p.album === t.dataset.album);
    if (i >= 0 && i !== gi) {
      gi = i;
      renderAll({ enter: true });
    }
  });
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const all = [...tabs.querySelectorAll('[role=tab]')];
    const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
    n.focus();
    n.click();
  });
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('[role=tab]')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  });
  window.addEventListener('resize', () => {
    if (isOpen) renderStack();
  });

  function fit(p) {
    const r = stage.getBoundingClientRect();
    const pad = Math.round(Math.max(10, Math.min(18, r.width * 0.03)));
    const capH = Math.round(Math.max(52, Math.min(70, r.height * 0.09)));
    const maxW = Math.min(r.width - 28, 700) - pad * 2;
    const maxH = r.height - 28 - pad - capH;
    const ar = p.w / p.h;
    let pw = maxW;
    let ph = pw / ar;
    if (ph > maxH) {
      ph = maxH;
      pw = ph * ar;
    }
    return { pw: Math.round(pw), ph: Math.round(ph), pad, capH };
  }

  function restRot(p, depth) {
    const h = hash(p.file);
    if (depth === 0) return ((h % 30) - 15) / 10;
    return (depth % 2 ? 1 : -1) * (3 + (h % 30) / 10);
  }

  function makePrint(p, depth, curAlbum) {
    const { pw, ph, pad, capH } = fit(p);
    const cap = B().text(p.caption);
    const el = document.createElement('figure');
    el.className = 'vprint';
    el.dataset.depth = String(depth);
    el.style.width = pw + pad * 2 + 'px';
    el.style.setProperty('--pad', pad + 'px');
    el.style.setProperty('--cap', capH + 'px');
    const rot = restRot(p, depth);
    el.dataset.rot = String(rot);
    el.style.transform = T(depth * 10 * (depth % 2 ? 1 : -1), depth * 8, rot, 1 - depth * 0.035);
    const other = p.album !== curAlbum.slug ? `<span class="vtag">${esc(ui('albumEnd'))}: ${esc(B().text(albumOf(p).title))}</span>` : '';
    el.innerHTML = `<div class="vpic" style="height:${ph}px"><img class="thumb" src="${B().thumbUrl(p.file)}" alt="" draggable="false">${
      depth === 0 ? `<img class="full" src="${B().photoUrl(p.file)}" alt="${esc(cap)}" draggable="false" decoding="async">` : ''
    }</div><figcaption>${esc(cap)}</figcaption>${other}`;
    if (depth === 0) {
      const full = el.querySelector('.full');
      if (full.complete) full.classList.add('is-loaded');
      else full.addEventListener('load', () => full.classList.add('is-loaded'), { once: true });
      bindDrag(el, rot);
    } else {
      el.setAttribute('aria-hidden', 'true');
    }
    return el;
  }

  function renderStack() {
    const s = seq();
    const cur = s[gi];
    const album = albumOf(cur);
    stack.innerHTML = '';
    for (let k = 2; k >= 0; k--) stack.appendChild(makePrint(s[(gi + k) % s.length], k, album));
  }

  function renderChrome() {
    const Blog = B();
    const cur = seq()[gi];
    const album = albumOf(cur);
    tabs.setAttribute('aria-label', ui('albumsLabel'));
    tabs.innerHTML = Blog.albums
      .map(
        (a) =>
          `<button type="button" role="tab" class="vtab" data-album="${a.slug}" aria-selected="${a.slug === album.slug}" tabindex="${a.slug === album.slug ? 0 : -1}">${esc(Blog.text(a.title))}<span class="vtab-n">${a.photos.length}</span></button>`,
      )
      .join('');
    note.textContent = Blog.text(album.note);
    count.textContent = `${cur.index + 1} / ${album.photos.length}`;
    live.textContent = `${Blog.text(album.title)}, ${cur.index + 1} / ${album.photos.length}: ${Blog.text(cur.caption)}`;
    stack.setAttribute('aria-label', `${Blog.text(album.title)}: ${Blog.text(cur.caption)}. ${coarse ? ui('swipeHint') : ui('swipeHintMouse')}`);
    hint.textContent = coarse ? ui('swipeHint') : ui('swipeHintMouse');
    btnPrev.setAttribute('aria-label', Blog.t('prev'));
    btnNext.setAttribute('aria-label', Blog.t('next'));
    btnClose.setAttribute('aria-label', Blog.t('close'));
    root.setAttribute('aria-label', Blog.t('gallery'));
    onChange(cur.album, cur.index);
  }

  function renderAll({ enter = false } = {}) {
    renderChrome();
    renderStack();
    if (enter && !reduced()) {
      const top = stack.lastElementChild;
      const rot = Number(top.dataset.rot);
      top.animate([{ transform: T(-10, 8, rot - 4, 0.965) }, { transform: T(0, 0, rot, 1) }], {
        duration: 320,
        easing: 'cubic-bezier(.2,.9,.3,1.2)',
      });
    }
  }

  function next(dir = { x: -1, y: -0.35 }, from = null) {
    if (animating) return;
    const top = stack.lastElementChild;
    const advance = () => {
      gi = (gi + 1) % seq().length;
      renderAll({ enter: true });
      animating = false;
    };
    if (reduced() || !top) {
      advance();
      return;
    }
    animating = true;
    const rot = Number(top.dataset.rot);
    const f = from || { x: 0, y: 0, r: rot };
    const len = Math.hypot(dir.x, dir.y) || 1;
    const dist = Math.max(innerWidth, innerHeight) * 1.15;
    const tx = f.x + (dir.x / len) * dist;
    const ty = f.y + (dir.y / len) * dist;
    const tr = f.r + (dir.x >= 0 ? 1 : -1) * 38;
    top.style.pointerEvents = 'none';
    top.animate([{ transform: T(f.x, f.y, f.r) }, { transform: T(tx, ty, tr) }], {
      duration: 430,
      easing: 'cubic-bezier(.35,.4,.5,1)',
      fill: 'forwards',
    }).finished.then(advance, advance);
  }

  function prev() {
    if (animating) return;
    gi = (gi - 1 + seq().length) % seq().length;
    renderChrome();
    renderStack();
    if (reduced()) return;
    const top = stack.lastElementChild;
    const rot = Number(top.dataset.rot);
    animating = true;
    const dist = Math.max(innerWidth, innerHeight) * 1.1;
    top
      .animate([{ transform: T(-dist, -dist * 0.25, -40) }, { transform: T(0, 0, rot) }], {
        duration: 520,
        easing: 'cubic-bezier(.2,.95,.3,1.08)',
      })
      .finished.then(
        () => (animating = false),
        () => (animating = false),
      );
  }

  function bindDrag(el, rot) {
    let d = null;
    el.addEventListener('pointerdown', (e) => {
      if (animating || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* best-effort */
      }
      d = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0, hist: [{ t: performance.now(), x: e.clientX, y: e.clientY }] };
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id) return;
      d.x = e.clientX - d.x0;
      d.y = e.clientY - d.y0;
      d.hist.push({ t: performance.now(), x: e.clientX, y: e.clientY });
      if (d.hist.length > 6) d.hist.shift();
      el.style.transform = T(d.x, d.y, rot + d.x * 0.06);
    });
    const end = (e) => {
      if (!d || e.pointerId !== d.id) return;
      const h = d.hist;
      const a = h[0];
      const b = h[h.length - 1];
      const dt = Math.max(1, b.t - a.t);
      const vx = (b.x - a.x) / dt;
      const vy = (b.y - a.y) / dt;
      const dist = Math.hypot(d.x, d.y);
      const speed = Math.hypot(vx, vy);
      el.classList.remove('is-dragging');
      const from = { x: d.x, y: d.y, r: rot + d.x * 0.06 };
      d = null;
      if (dist > 110 || (speed > 0.55 && dist > 24)) {
        next(speed > 0.55 ? { x: vx, y: vy } : { x: from.x, y: from.y }, from);
      } else if (dist > 2) {
        el.animate([{ transform: T(from.x, from.y, from.r) }, { transform: T(0, 0, rot) }], {
          duration: reduced() ? 1 : 380,
          easing: 'cubic-bezier(.2,.9,.3,1.25)',
        });
        el.style.transform = T(0, 0, rot);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  return {
    get isOpen() {
      return isOpen;
    },
    open({ album, index = 0 }) {
      const s = seq();
      let i = s.findIndex((p) => p.album === album && p.index === index);
      if (i < 0) i = Math.max(0, s.findIndex((p) => p.album === album));
      if (isOpen && i === gi) return;
      clearTimeout(closeTimer);
      gi = i;
      const wasOpen = isOpen && !root.hidden;
      isOpen = true;
      root.hidden = false;
      root.classList.remove('is-closing');
      renderAll({ enter: wasOpen });
      void root.offsetWidth;
      root.classList.add('is-open');
      if (!wasOpen) stack.focus({ preventScroll: true });
    },
    close({ instant = false } = {}) {
      if (!isOpen) return Promise.resolve();
      isOpen = false;
      root.classList.remove('is-open');
      if (instant || reduced()) {
        root.hidden = true;
        stack.innerHTML = '';
        return Promise.resolve();
      }
      root.classList.add('is-closing');
      return new Promise((resolve) => {
        closeTimer = setTimeout(() => {
          root.hidden = true;
          root.classList.remove('is-closing');
          stack.innerHTML = '';
          resolve();
        }, 460);
      });
    },
    update() {
      if (isOpen) renderAll();
    },
  };
}

return { createViewer };
})();

// ===================================================================== listview
const LISTVIEW = (() => {
// "Just show me a list": a plain, calm, accessible index of every post and album.
const { icons } = ART;
const B = () => window.Blog;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function createList({ root, langSwitch, onClose, reduced }) {
  root.innerHTML = `
    <div class="ov-backdrop" aria-hidden="true"></div>
    <div class="list-scroll">
      <div class="sheet">
        <header class="sheet-head">
          <h2 id="list-title" tabindex="-1"></h2>
          <span class="sheet-lang"></span>
          <button type="button" class="round-btn list-close">${icons.close}</button>
        </header>
        <div class="sheet-body"></div>
      </div>
    </div>`;
  const title = root.querySelector('#list-title');
  const body = root.querySelector('.sheet-body');
  const closeBtn = root.querySelector('.list-close');
  root.querySelector('.sheet-lang').appendChild(langSwitch);
  closeBtn.addEventListener('click', onClose);
  let isOpen = false;
  let timer = 0;

  function render() {
    const Blog = B();
    title.textContent = Blog.t('allPosts');
    closeBtn.setAttribute('aria-label', Blog.t('close'));
    const posts = Blog.posts
      .map((p) => {
        const v = Blog.view(p);
        const lang = v.translated ? '' : ' lang="bg"';
        return `<li><a class="li-post li-${p.type}" href="#/post/${p.slug}">
          <span class="li-meta"><span class="li-type">${esc(p.type === 'story' ? Blog.t('story') : Blog.t('opinion'))}</span><time datetime="${p.date}">${esc(Blog.date(p.date))}</time><span>${Blog.readMinutes(p)} ${esc(Blog.t('minRead'))}</span></span>
          <span class="li-title"${lang}>${esc(v.title)}</span>
          <span class="li-excerpt"${lang}>${esc(v.excerpt)}</span>
          ${v.translated ? '' : `<span class="li-note">${esc(Blog.t('onlyBg'))}</span>`}
        </a></li>`;
      })
      .join('');
    const albums = Blog.albums
      .map(
        (a) => `<li><a class="li-album" href="#/photos/${a.slug}/1">
          <span class="li-thumbs" aria-hidden="true">${a.photos
            .slice(0, 3)
            .map((p) => `<img src="${Blog.thumbUrl(p.file)}" alt="" loading="lazy" decoding="async">`)
            .join('')}</span>
          <span class="li-album-text"><span class="li-title">${esc(Blog.text(a.title))}</span>
          <span class="li-excerpt">${esc(Blog.text(a.note))} · ${a.photos.length} ${esc(Blog.t('photos'))}</span></span>
        </a></li>`,
      )
      .join('');
    body.innerHTML = `
      <p class="sheet-about">${esc(Blog.text(Blog.site.about))}</p>
      <ol class="li-posts">${posts}</ol>
      <h3 class="sheet-sub">${esc(Blog.t('gallery'))}</h3>
      <ul class="li-albums">${albums}</ul>`;
    root.setAttribute('aria-label', Blog.t('allPosts'));
  }

  return {
    get isOpen() {
      return isOpen;
    },
    open() {
      clearTimeout(timer);
      if (isOpen && !root.hidden) return;
      isOpen = true;
      render();
      root.hidden = false;
      root.classList.remove('is-closing');
      void root.offsetWidth;
      root.classList.add('is-open');
      title.focus({ preventScroll: true });
    },
    close({ instant = false } = {}) {
      if (!isOpen) return Promise.resolve();
      isOpen = false;
      root.classList.remove('is-open');
      if (instant || reduced()) {
        root.hidden = true;
        return Promise.resolve();
      }
      root.classList.add('is-closing');
      return new Promise((resolve) => {
        timer = setTimeout(() => {
          root.hidden = true;
          root.classList.remove('is-closing');
          resolve();
        }, 380);
      });
    },
    update() {
      if (isOpen) render();
    },
  };
}

return { createList };
})();

// ===================================================================== main
(() => {
// Бъркотия — gravity playground. Orchestrates the world, the toolbar, routing and the easter eggs.
const { ui } = I18N;
const art = ART;
const { sound } = SOUND;
const { createWorld } = WORLD;
const { makeLetter, letterAdvance, makePost, makeProp, makePhoto, makeAbout, makeCat, PROP_ORDER } = ITEMS;
const { createReader } = READER;
const { createViewer } = VIEWER;
const { createList } = LISTVIEW;
const Blog = window.Blog;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => rmq.matches;
const coarse = matchMedia('(pointer: coarse)').matches;

document.body.insertAdjacentHTML('afterbegin', art.shared);

const app = $('#app');
const worldEl = $('#world');
const ground = $('#ground');
const bubble = $('#bubble');
const toastEl = $('#toast');
const liveEl = $('#live');
const hint = $('#hint');
const layers = {
  letters: $('#layer-letters'),
  about: $('#layer-about'),
  posts: $('#layer-posts'),
  photos: $('#layer-photos'),
  props: $('#layer-props'),
};

// ---------------------------------------------------------------- language switches
const switches = [];
function makeLangSwitch() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'lang-switch';
  b.innerHTML = '<span class="ls-knob" aria-hidden="true"></span><span class="ls-opt" lang="bg">БГ</span><span class="ls-opt" lang="en">EN</span>';
  b.addEventListener('click', () => {
    b.classList.remove('is-flipping');
    void b.offsetWidth;
    b.classList.add('is-flipping');
    Blog.toggleLang();
  });
  switches.push(b);
  return b;
}

// ---------------------------------------------------------------- world
const world = createWorld({ worldEl, layers, getFloorY: () => Math.round(ground.getBoundingClientRect().top) });
let u = 1;
let tier = 'desktop';
let filter = 'all';
let busy = false;
let scenePhotos = [];
let photoCursor = 0;
let photosDropped = false;
let gravityOverride = false;
let tiltOn = false;
const tiltG = { x: 0, y: 1 };

const photoQueue = (() => {
  const out = [];
  const max = Math.max(...Blog.albums.map((a) => a.photos.length));
  for (let i = 0; i < max; i++) for (const a of Blog.albums) if (a.photos[i]) out.push(a.photos[i]);
  return out;
})();

function measureScale() {
  const W = worldEl.clientWidth;
  const floorY = ground.getBoundingClientRect().top;
  return {
    u: clamp(Math.sqrt((W * floorY) / (1440 * 800)), 0.6, 1.25),
    tier: W < 600 ? 'phone' : W < 1000 ? 'tablet' : 'desktop',
  };
}

function applyScale(s) {
  u = s.u;
  tier = s.tier;
  document.documentElement.style.setProperty('--u', u.toFixed(3));
  document.documentElement.dataset.tier = tier;
  world.setBounds(u);
}

const postsForFilter = () => (filter === 'story' ? Blog.stories : filter === 'opinion' ? Blog.opinions : Blog.posts);
const propSpecs = () => PROP_ORDER.slice(0, tier === 'phone' ? 4 : 5).map(makeProp);

function letterSpecs() {
  const name = Blog.text(Blog.site.name).toLocaleUpperCase(Blog.lang);
  const chars = [...name];
  const { W, floorY } = world.size;
  const target = W * (tier === 'phone' ? 0.92 : tier === 'tablet' ? 0.84 : 0.7);
  const gapK = 0.045;
  const adv = chars.reduce((s, ch) => s + letterAdvance(ch, 100), 0) / 100;
  let fs = target / (adv + gapK * (chars.length - 1) + chars.length * 0.06);
  fs = Math.min(fs, floorY * 0.24, 220);
  const specs = chars.map((ch, i) => makeLetter(ch, fs, i));
  const gap = fs * gapK;
  const total = specs.reduce((s, it) => s + it.w, 0) + gap * (specs.length - 1);
  let x = (W - total) / 2;
  const xs = specs.map((it) => {
    const cx = x + it.w / 2;
    x += it.w + gap;
    return cx;
  });
  return { specs, xs, gap };
}

function sortPosts() {
  const order = Blog.posts.map((p) => p.slug);
  const els = [...layers.posts.children].sort((a, b) => order.indexOf(a.dataset.slug) - order.indexOf(b.dataset.slug));
  if (els.some((el, i) => layers.posts.children[i] !== el)) els.forEach((el) => layers.posts.appendChild(el));
}

function populate({ instant = false, withPhotos = true } = {}) {
  if (reduced()) {
    collage();
    return;
  }
  const { specs, xs } = letterSpecs();
  const st = 90;
  world.drop(specs, { stagger: st, xs, spin: 0.05, speed: 7 });
  const posts = postsForFilter().map(makePost);
  const postDelay = specs.length * st + 420;
  const spin = tier === 'phone' ? 0.3 : 0.55;
  world.drop(posts, { delay: postDelay, stagger: 170, spin });
  const props = propSpecs();
  const propDelay = postDelay + posts.length * 170 + 160;
  world.drop(props, { delay: propDelay, stagger: 230, spin });
  if (withPhotos && scenePhotos.length) {
    world.drop(scenePhotos.map(makePhoto), { delay: propDelay + props.length * 230 + 120, stagger: 150, spin: 0.7 });
  }
  if (tier !== 'phone' && ![...world.items].some((it) => it.hang)) {
    world.after(postDelay - 200, () => world.hang(makeAbout(), { ...tagPlacement(), swing: -0.85 }));
  }
  sortPosts();
  if (instant) world.fastForward(7000);
}

// Where the "about" tag hangs: centred, with its string long enough to clear the sky texts.
function tagPlacement() {
  const { W } = world.size;
  const fx = tier === 'desktop' ? 0.5 : 0.47;
  const half = Math.max(230, 300 * u) / 2 + 12;
  const ax = W * fx;
  let top = 84 * u + 10;
  for (const el of [$('#sky-intro'), hint]) {
    const r = el.getBoundingClientRect();
    if (r.width && r.right > ax - half && r.left < ax + half) top = Math.max(top, r.bottom + 14);
  }
  return { fx, length: top + 20 };
}

// A calm, static collage for prefers-reduced-motion: nothing falls.
function collage({ shuffle = false } = {}) {
  world.removeAll();
  const { W, floorY } = world.size;
  let seed = shuffle ? Math.floor(Math.random() * 1e6) : 7;
  const rng = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const { specs: letterSpecList, gap } = letterSpecs();
  const made = world.materialise([...letterSpecList, ...postsForFilter().map(makePost), ...propSpecs()]);
  const letters = made.filter((it) => it.kind === 'letter');
  const posts = made.filter((it) => it.kind === 'post');
  const props = made.filter((it) => it.kind === 'prop');
  sortPosts();
  const margin = tier === 'phone' ? 12 : 36;
  const top = Math.max($('#sky-intro').getBoundingClientRect().bottom, hint.getBoundingClientRect().bottom) + (tier === 'phone' ? 8 : 16);
  const lh = Math.max(...letters.map((l) => l.h));
  const lw = letters.reduce((s, l) => s + l.w, 0) + gap * (letters.length - 1);
  let x = (W - lw) / 2;
  letters.forEach((it, i) => {
    const sgn = i % 2 ? 1 : -1;
    world.place(it, x + it.w / 2, top + lh / 2 + sgn * lh * 0.04, sgn * (0.025 + rng() * 0.04));
    x += it.w + gap;
  });
  // Posts interleaved with props, dealt into the shortest of a few columns.
  const rest = [];
  const pq = [...props];
  posts.forEach((p, i) => {
    rest.push(p);
    if (i % 2 === 1 && pq.length) rest.push(pq.shift());
  });
  rest.push(...pq);
  if (shuffle) rest.sort(() => rng() - 0.5);
  const gx = (tier === 'phone' ? 10 : 22) * u;
  const gy = (tier === 'phone' ? 12 : 22) * u;
  const colW = Math.max(...rest.map((i) => i.w)) + 8;
  const availW = W - margin * 2;
  const cols = Math.max(2, Math.min(5, Math.floor((availW + gx) / (colW + gx))));
  const colH = Array(cols).fill(0);
  const slots = rest.map((it) => {
    const c = colH.indexOf(Math.min(...colH));
    const y = colH[c];
    colH[c] += it.h + gy;
    return { it, c, y };
  });
  const yTop = top + lh + 20 * u;
  const avail = floorY - yTop - 12;
  const total = Math.max(...colH) - gy;
  const k = total > avail ? avail / total : 1;
  const y0 = yTop + Math.max(0, (avail - total) / 2);
  const cw = availW / cols;
  for (const { it, c, y } of slots) {
    const jx = (rng() - 0.5) * Math.max(0, cw - it.w) * 0.6;
    world.place(it, margin + cw * (c + 0.5) + jx, y0 + (y + it.h / 2) * k, (rng() - 0.5) * 0.12);
  }
  // Last resort on very short screens: tuck the collage in a little.
  if (k < 1) {
    for (const { it } of slots) it.el.querySelector('.skin').style.scale = Math.max(0.75, k).toFixed(3);
  }
  world.renderAll(true);
}

// ---------------------------------------------------------------- toolbar actions
function setFilter(f) {
  if (f === filter) return;
  filter = f;
  syncFilter();
  if (reduced()) {
    collage();
    return;
  }
  if (busy) return; // the refill after cleanup will respect the new filter
  const want = new Set(postsForFilter().map((p) => p.slug));
  for (const it of [...world.pending]) if (it.kind === 'post' && !want.has(it.data.post.slug)) world.remove(it);
  const have = new Set();
  for (const it of [...world.items, ...world.pending]) {
    if (it.kind !== 'post' || it.ghost) continue;
    if (want.has(it.data.post.slug)) have.add(it.data.post.slug);
    else world.launch(it);
  }
  const missing = postsForFilter()
    .filter((p) => !have.has(p.slug))
    .map(makePost);
  if (missing.length) {
    world.drop(missing, { delay: 280, stagger: 160, spin: 0.55 });
    sortPosts();
  }
  sound.whoosh();
}

function syncFilter() {
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  ground.dataset.filter = filter;
}

function dropPhotos() {
  if (busy) return;
  const n = tier === 'phone' ? 3 : tier === 'tablet' ? 4 : 5;
  const cap = tier === 'phone' ? 4 : tier === 'tablet' ? 6 : 8;
  const batch = [];
  for (let i = 0; i < n; i++) batch.push(photoQueue[photoCursor++ % photoQueue.length]);
  if (reduced()) {
    // Nothing falls in reduced motion: go straight to the prints.
    const p = batch[0];
    navigate(`#/photos/${p.album}/${p.index + 1}`);
    return;
  }
  photosDropped = true;
  syncPhotosLabel();
  const live = [...world.items, ...world.pending].filter((it) => it.kind === 'photo' && !it.ghost);
  const excess = live.length + n - cap;
  for (let i = 0; i < excess; i++) {
    const it = live[i];
    scenePhotos.splice(scenePhotos.indexOf(it.data.photo), 1);
    if (it.body) world.launch(it);
    else world.remove(it);
  }
  scenePhotos.push(...batch);
  world.drop(batch.map(makePhoto), { stagger: 150, spin: 0.7, speed: 4 });
}

function syncPhotosLabel() {
  $('#photos-label').textContent = ui(photosDropped ? 'morePhotos' : 'photos');
}

function doShake(power = 1) {
  if (reduced()) {
    collage({ shuffle: true });
    return;
  }
  world.shake(power);
  app.classList.remove('is-jolting');
  void app.offsetWidth;
  app.classList.add('is-jolting');
  sound.thud(0.7, 1);
}

function resetCleanup() {
  busy = false;
  world.closeFloor();
  ground.classList.remove('is-open');
  gravityOverride = false;
  applyGravity();
}

function cleanup() {
  if (busy) return;
  if (reduced()) {
    collage({ shuffle: true });
    return;
  }
  busy = true;
  scenePhotos = [];
  photosDropped = false;
  syncPhotosLabel();
  hideBubble();
  for (const it of [...world.pending]) world.remove(it);
  ground.classList.add('is-open');
  sound.whoosh();
  gravityOverride = true;
  world.setGravity(0, 1);
  world.after(140, () => world.openFloor());
  let waited = 0;
  const check = () => {
    waited += 100;
    const left = [...world.items].filter((it) => !it.hang);
    if (left.length === 0 || waited > 2800) {
      for (const it of left) world.remove(it);
      world.closeFloor();
      ground.classList.remove('is-open');
      gravityOverride = false;
      applyGravity();
      world.after(480, () => {
        busy = false;
        populate({ withPhotos: false });
      });
    } else world.after(100, check);
  };
  world.after(300, check);
}

function relaunch() {
  if (reduced()) {
    collage();
    return;
  }
  hideBubble();
  if (world.paused || busy) {
    world.removeAll();
    resetCleanup();
    populate({ instant: world.paused });
    return;
  }
  for (const it of [...world.pending]) world.remove(it);
  for (const it of [...world.items]) world.launch(it);
  sound.whoosh();
  world.after(440, () => populate());
}

// ---------------------------------------------------------------- props, bubbles, easter eggs
let bubbleItem = null;
let bubbleTimer = 0;
let bubbleSize = { w: 0, h: 0 };

function say(it, text, slug) {
  const post = Blog.post(slug);
  const v = Blog.view(post);
  bubble.innerHTML = `<span class="bubble-in"><span class="bubble-text">${esc(text)}</span><a class="bubble-link" href="#/post/${slug}"><span class="bubble-read">${esc(ui('readOn'))}:</span> <span${
    v.translated ? '' : ' lang="bg"'
  }>${esc(v.title)}</span> →</a></span>`;
  bubble.hidden = false;
  bubbleItem = it;
  bubbleSize = { w: bubble.offsetWidth, h: bubble.offsetHeight };
  bubble.classList.remove('is-in');
  void bubble.offsetWidth;
  bubble.classList.add('is-in');
  liveEl.textContent = text;
  positionBubble();
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(hideBubble, 5600);
}

function hideBubble() {
  bubble.hidden = true;
  bubbleItem = null;
}

function positionBubble() {
  if (!bubbleItem || bubble.hidden) return;
  if (bubbleItem.removed || bubbleItem.ghost) {
    hideBubble();
    return;
  }
  const c = world.centerOf(bubbleItem);
  if (!c) return;
  const { W } = world.size;
  const { w: bw, h: bh } = bubbleSize;
  const r = Math.max(bubbleItem.w, bubbleItem.h) / 2;
  let y = c.y - r - 12 - bh;
  let below = false;
  if (y < 56) {
    y = c.y + r + 12;
    below = true;
  }
  const x = clamp(c.x - bw / 2, 10, W - bw - 10);
  bubble.classList.toggle('is-below', below);
  bubble.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  bubble.style.setProperty('--tail', `${clamp(c.x - x, 22, bw - 22).toFixed(1)}px`);
}
world.on('render', positionBubble);

function punch(it) {
  const holes = it.el.querySelector('.t-holes');
  const spots = [
    [84, 26],
    [90, 58],
    [76, 50],
    [68, 24],
    [80, 76],
  ];
  const n = holes.children.length;
  if (n < spots.length) {
    const h = document.createElement('span');
    h.className = 'hole';
    h.style.left = spots[n][0] + '%';
    h.style.top = spots[n][1] + '%';
    holes.appendChild(h);
  }
  return Math.min(n + 1, spots.length);
}

let lastFortune = -1;
function propTap(it) {
  const name = it.data.name;
  const d = ui(name);
  const taps = ++it.data.taps;
  let line = d.lines[(taps - 1) % d.lines.length];
  if (name === 'vanya') {
    world.hop(it, 1.15);
    if (taps % 5 === 0) catRain();
  } else if (name === 'banitsa') {
    let i;
    do i = Math.floor(Math.random() * d.lines.length);
    while (i === lastFortune);
    lastFortune = i;
    line = d.lines[i];
    world.hop(it, 0.7);
  } else if (name === 'ticket') {
    const n = punch(it);
    line = d.lines[Math.min(n, d.lines.length) - 1];
    sound.click();
  } else if (name === 'martenitsa') {
    if (taps % 3 === 0) {
      line = d.stork;
      flyStork();
    } else line = d.lines[(taps - 1) % 3 === 0 ? 0 : 1];
    world.hop(it, 0.8);
  } else if (name === 'bell') {
    sound.bell();
    world.hop(it, 0.9);
    it.el.classList.remove('is-ringing');
    void it.el.offsetWidth;
    it.el.classList.add('is-ringing');
  }
  say(it, line, it.data.post);
}

function flyStork() {
  if (reduced()) return;
  const s = document.createElement('div');
  s.className = 'stork';
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = art.stork;
  s.style.top = `${12 + Math.random() * 16}%`;
  worldEl.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
}

function catRain() {
  if (reduced() || world.paused) return;
  const n = tier === 'phone' ? 6 : 10;
  const cats = Array.from({ length: n }, makeCat);
  world.drop(cats, { stagger: 110, spin: 0.9, speed: 3 });
  toast(ui('catRain'));
  world.after(n * 110 + 9000, () => cats.forEach((c) => (c.body ? world.launch(c) : world.remove(c))));
}

let typed = '';
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current) {
    e.preventDefault();
    closeOverlay();
    return;
  }
  if (current || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-8);
  if (/(мяу|meow|ваня|vanya)$/.test(typed)) {
    typed = '';
    catRain();
  }
});

let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3400);
}

world.on('fling', () => hint.classList.add('is-done'));
world.on('poke', (x, y) => {
  if (reduced()) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.left = x + 'px';
  r.style.top = y + 'px';
  r.setAttribute('aria-hidden', 'true');
  worldEl.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
});

// ---------------------------------------------------------------- tilt + shake sensors
const D2R = Math.PI / 180;
let gotReading = false;
let lastShake = 0;

function applyGravity() {
  if (gravityOverride) return;
  if (tiltOn) world.setGravity(tiltG.x, tiltG.y);
  else world.setGravity(0, 1);
}

function onOrient(e) {
  if (e.beta == null || e.gamma == null) return;
  gotReading = true;
  const b = e.beta * D2R;
  const g = e.gamma * D2R;
  const gx = Math.cos(b) * Math.sin(g);
  const gy = Math.sin(b);
  const ang = ((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) * D2R;
  const sx = gx * Math.cos(ang) + gy * Math.sin(ang);
  const sy = -gx * Math.sin(ang) + gy * Math.cos(ang);
  tiltG.x += (sx * 1.25 - tiltG.x) * 0.3;
  tiltG.y += (sy * 1.25 - tiltG.y) * 0.3;
  applyGravity();
}

function onMotion(e) {
  const a = e.acceleration;
  let mag;
  if (a && a.x != null) mag = Math.hypot(a.x, a.y, a.z);
  else {
    const g = e.accelerationIncludingGravity;
    if (!g || g.x == null) return;
    mag = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
  }
  const now = performance.now();
  if (mag > 17 && now - lastShake > 700 && !world.paused && !reduced()) {
    lastShake = now;
    doShake(1.15);
  }
}

// Where motion needs no permission (Android), a real shake kicks things even without tilt mode.
const freeMotion = coarse && typeof window.DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission !== 'function';
if (freeMotion) window.addEventListener('devicemotion', onMotion);

function setTilt(on) {
  tiltOn = on;
  const btn = $('[data-act=tilt]');
  btn.setAttribute('aria-pressed', String(on));
  if (on) {
    window.addEventListener('deviceorientation', onOrient);
    if (!freeMotion) window.addEventListener('devicemotion', onMotion);
    world.setSleeping(false);
  } else {
    window.removeEventListener('deviceorientation', onOrient);
    if (!freeMotion) window.removeEventListener('devicemotion', onMotion);
    world.setSleeping(true);
    tiltG.x = 0;
    tiltG.y = 1;
  }
  applyGravity();
}

async function toggleTilt() {
  if (tiltOn) {
    setTilt(false);
    toast(ui('tiltOff'));
    return;
  }
  // iOS: both permission requests must start synchronously inside the tap.
  const ask = (E) => (typeof E !== 'undefined' && typeof E.requestPermission === 'function' ? E.requestPermission().catch(() => 'denied') : 'granted');
  const [orientation] = await Promise.all([ask(window.DeviceOrientationEvent), ask(window.DeviceMotionEvent)]);
  if (orientation !== 'granted') {
    toast(ui('tiltDenied'));
    return;
  }
  gotReading = false;
  setTilt(true);
  toast(ui('tiltOn'));
  setTimeout(() => {
    if (tiltOn && !gotReading) {
      setTilt(false);
      toast(ui('tiltMissing'));
    }
  }, 1600);
}

// ---------------------------------------------------------------- overlays + routing
const reader = createReader({
  root: $('#reader'),
  langSwitch: makeLangSwitch(),
  onClose: () => closeOverlay(),
  onGo: (slug) => navigate(`#/post/${slug}`, true),
  reduced,
});
const viewer = createViewer({
  root: $('#viewer'),
  langSwitch: makeLangSwitch(),
  onClose: () => closeOverlay(),
  onChange: (album, index) => {
    const h = `#/photos/${album}/${index + 1}`;
    if (location.hash !== h) history.replaceState(history.state, '', h);
  },
  reduced,
  coarse,
});
const list = createList({ root: $('#list'), langSwitch: makeLangSwitch(), onClose: () => closeOverlay(), reduced });
const overlays = { reader, viewer, list };
let current = null;
let lastFocus = null;

function parseRoute() {
  const h = decodeURIComponent(location.hash);
  let m;
  if ((m = h.match(/^#\/post\/([\w-]+)$/)) && Blog.post(m[1])) return { type: 'reader', arg: m[1] };
  if ((m = h.match(/^#\/photos\/([\w-]+)(?:\/(\d+))?$/)) && Blog.albums.some((a) => a.slug === m[1])) {
    return { type: 'viewer', arg: { album: m[1], index: Math.max(0, Number(m[2] || 1) - 1) } };
  }
  if (h === '#/list') return { type: 'list' };
  return null;
}

function route() {
  const r = parseRoute();
  if (!r) {
    if (current) hideOverlays();
    return;
  }
  if (!current) {
    lastFocus = document.activeElement;
    pauseWorld();
  }
  if (current && current !== r.type) overlays[current].close();
  const swap = current === 'reader' && r.type === 'reader';
  current = r.type;
  if (r.type === 'reader') reader.open(r.arg, { swap });
  else if (r.type === 'viewer') viewer.open(r.arg);
  else list.open();
  updateTitle();
}

function hideOverlays() {
  const was = current;
  current = null;
  app.classList.remove('is-paused');
  app.inert = false;
  overlays[was].close().then(() => {
    if (!current) resumeWorld();
  });
  updateTitle();
  let target = lastFocus;
  if (target && !document.contains(target) && target.dataset && target.dataset.slug) {
    // The world was rebuilt meanwhile (e.g. a language switch): find the same post again.
    target = layers.posts.querySelector(`[data-slug="${target.dataset.slug}"]`);
  }
  if (target && document.contains(target) && target !== document.body) target.focus({ preventScroll: true });
  lastFocus = null;
}

function navigate(hash, replace = false) {
  if (replace) history.replaceState(history.state, '', hash);
  else history.pushState({ app: true }, '', hash);
  route();
}

function closeOverlay() {
  if (history.state && history.state.app) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    route();
  }
}

function pauseWorld() {
  hideBubble();
  world.pause();
  app.classList.add('is-paused');
  app.inert = true;
}

function resumeWorld() {
  app.classList.remove('is-paused');
  app.inert = false;
  if (!reduced()) world.resume();
}

function updateTitle() {
  const name = Blog.text(Blog.site.name);
  if (current === 'reader' && reader.slug) document.title = `${Blog.view(Blog.post(reader.slug)).title} — ${name}`;
  else if (current === 'viewer') document.title = `${Blog.t('gallery')} — ${name}`;
  else if (current === 'list') document.title = `${Blog.t('allPosts')} — ${name}`;
  else document.title = `${name} — ${Blog.text(Blog.site.tagline)}`;
}

window.addEventListener('popstate', route);
window.addEventListener('hashchange', route);

// Internal links go through the router (keeps history tidy: close = back).
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  const body = a.closest('.body');
  if (body) body.classList.add('is-picked');
  navigate(a.getAttribute('href'));
});

layers.props.addEventListener('click', (e) => {
  const el = e.target.closest('.prop');
  const it = el && world.itemOf(el);
  if (it) propTap(it);
});
layers.about.addEventListener('click', (e) => {
  const el = e.target.closest('.about');
  const it = el && world.itemOf(el);
  if (it) world.swing(it);
});
layers.photos.addEventListener('click', (e) => {
  const el = e.target.closest('.photo');
  if (!el) return;
  el.classList.add('is-picked');
  navigate(`#/photos/${el.dataset.album}/${Number(el.dataset.index) + 1}`);
});

// ---------------------------------------------------------------- static text + chrome
function applyText() {
  $$('[data-ui]').forEach((el) => (el.textContent = ui(el.dataset.ui)));
  $$('[data-t]').forEach((el) => (el.textContent = Blog.t(el.dataset.t)));
  $$('[data-ui-label]').forEach((el) => el.setAttribute('aria-label', ui(el.dataset.uiLabel)));
  $$('[data-t-label]').forEach((el) => el.setAttribute('aria-label', Blog.t(el.dataset.tLabel)));
  $('#site-name').textContent = Blog.text(Blog.site.name);
  $('#sky-meaning').textContent = Blog.text(Blog.site.nameMeaning);
  $('#sky-tagline').textContent = Blog.text(Blog.site.tagline);
  $('#hint-a').textContent = reduced() ? '' : ui('hintGrab');
  $('#hint-b').textContent = ui(coarse ? 'hintTapTouch' : 'hintTapMouse');
  syncPhotosLabel();
  syncSound();
  switches.forEach((b) => {
    b.dataset.lang = Blog.lang;
    b.setAttribute('aria-label', `${Blog.t('language')}: ${Blog.t('switchTo')}`);
  });
  updateTitle();
}

function syncSound() {
  const b = $('#sound-btn');
  b.setAttribute('aria-pressed', String(sound.on));
  b.setAttribute('aria-label', ui(sound.on ? 'soundOn' : 'soundOff'));
  b.innerHTML = sound.on ? art.icons.soundOn : art.icons.soundOff;
}

function buildChrome() {
  $('#lang-slot').appendChild(makeLangSwitch());
  $('[data-act=photos] .ico').innerHTML = art.icons.photos;
  $('[data-act=shake] .ico').innerHTML = art.icons.shake;
  $('[data-act=tilt] .ico').innerHTML = art.icons.tilt;
  $('[data-act=cleanup] .ico').innerHTML = art.icons.cleanup;
  $('#list-link .ico').innerHTML = art.icons.list;
  $('#hint-arrow').innerHTML = art.doodles.arrow;
  $$('.sparkle').forEach((s, i) => (s.innerHTML = i % 3 === 2 ? art.doodles.ring : art.doodles.sparkle));
  const canTilt = coarse && typeof window.DeviceOrientationEvent !== 'undefined';
  $('[data-act=tilt]').hidden = !canTilt || reduced();

  $$('[data-filter]').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  $('[data-act=photos]').addEventListener('click', dropPhotos);
  $('[data-act=shake]').addEventListener('click', () => doShake(1));
  $('[data-act=tilt]').addEventListener('click', toggleTilt);
  $('[data-act=cleanup]').addEventListener('click', cleanup);
  $('#sound-btn').addEventListener('click', () => {
    sound.set(!sound.on);
    syncSound();
    if (sound.on) sound.thud(0.6, 0.4);
  });
  syncFilter();
}

// ---------------------------------------------------------------- lifecycle
Blog.onLangChange(() => {
  applyText();
  reader.update();
  viewer.update();
  list.update();
  relaunch();
  updateTitle();
});

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const prevU = u;
    const prevTier = tier;
    const s = measureScale();
    const big = s.tier !== prevTier || Math.abs(s.u - prevU) / prevU > 0.12;
    if (big || reduced()) applyScale(s);
    else world.setBounds(u);
    if (reduced()) collage();
    else if (big) {
      world.removeAll();
      resetCleanup();
      populate({ instant: world.paused });
    }
  }, 180);
});

rmq.addEventListener('change', () => {
  world.setReduced(reduced());
  applyText();
  $('[data-act=tilt]').hidden = !coarse || reduced();
  if (reduced() && tiltOn) setTilt(false);
  world.removeAll();
  resetCleanup();
  populate({ instant: world.paused });
  if (!reduced() && !current) world.start();
});

async function boot() {
  buildChrome();
  applyText();
  const fonts = Promise.all([
    document.fonts.load('900 100px Unbounded', 'БЪРКОТИЯBĂRKOTIYA'),
    document.fonts.load('700 30px Caveat', 'Аа Bb'),
    document.fonts.load('800 20px Rubik', 'Аа Bb'),
    document.fonts.load('600 20px Rubik', 'Аа Bb'),
  ]).catch(() => null);
  await Promise.race([fonts, new Promise((r) => setTimeout(r, 3500))]);
  applyScale(measureScale());
  world.setReduced(reduced());
  const loader = $('#loader');
  loader.classList.add('is-done');
  setTimeout(() => loader.remove(), 700);
  app.classList.add('is-ready');
  if (parseRoute()) {
    populate({ instant: true });
    route();
  } else {
    populate();
    world.start();
  }
}

boot();

})();
