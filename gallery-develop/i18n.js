// Concept-specific UI strings. Everything about posts, albums and photos comes from window.Blog.
const S = {
  bg: {
    docTitle: 'Прояви снимката',
    labTag: 'тъмна стая без тъмна стая',
    brand: 'ПРОЯВА',
    brandSub: 'моментален филм',
    boxShots: '{n} кадъра',
    boxDeveloped: 'проявени {d} от {n}',
    boxWarning: 'не разклащай',
    albums: 'Албуми',
    hintMouse: 'Задръж бутона и търкай, за да се прояви. Хвани рамката, за да я местиш.',
    hintTouch: 'Търкай с пръст, за да се прояви. Хвани рамката, за да я местиш.',
    hintPhone: 'Търкай снимката. Плъзгай масата за следващата.',
    rubCue: 'търкай',
    developAll: 'Прояви всички',
    developAllNote: '(за нетърпеливите)',
    developAllDone: [
      'Добре, добре. Химията се обиди, но се зае.',
      'Моментален филм, моментално търпение.',
      'Някъде един химик току-що въздъхна.',
    ],
    developAllNone: 'Всичко вече е проявено. Нетърпелива и бърза.',
    reset: 'Обратно в тъмното',
    resetDone: 'Всичко отново е загадка.',
    resetNone: 'Тук още нищо не е проявено. Тъмно е и без това.',
    shy: ['Първо я потъркай. Срамежлива е.', 'Още не е готова. Търкай.', 'Химията иска малко внимание.'],
    shake: [
      'Разклащането не помага. Наистина. …Е, добре, мъничко.',
      'Това е мит от осемдесетте. Но ето ти малко.',
      'Търкай я, не я разклащай. …Добре де, ето.',
    ],
    shakePhone: 'Следващия път просто разклати телефона.',
    tableRub: 'Масата е чиста. Снимките са ей там.',
    albumDone: 'Целият албум е проявен. Браво, химико.',
    printUndev: 'Непроявена снимка {i} от {n}. Натисни Enter, за да се прояви.',
    printDev: '{caption} Снимка {i} от {n}. Натисни Enter, за да я отвориш.',
    photoOf: '{i} от {n}',
    prevPhoto: 'Предишна снимка',
    nextPhoto: 'Следваща снимка',
    closePhoto: 'Обратно на масата',
    backToTable: 'Обратно към масата',
    langBg: 'Български',
    langEn: 'Английски',
    langSwitch: 'Смени езика на {lang}',
    listAlbums: 'Албуми',
    openAlbum: 'Сложи албума на масата',
    mood: 'настроение',
    onlyBgShort: 'само на БГ',
    devCount: 'проявени {d} от {n}',
    postNav: 'Още публикации',
  },
  en: {
    docTitle: 'Develop the photo',
    labTag: 'a darkroom without the dark room',
    brand: 'ПРОЯВА',
    brandSub: 'instant film',
    boxShots: '{n} exp.',
    boxDeveloped: '{d} of {n} developed',
    boxWarning: 'do not shake',
    albums: 'Albums',
    hintMouse: 'Hold the button and rub to develop. Grab the frame to move it.',
    hintTouch: 'Rub with a finger to develop. Grab the frame to move it.',
    hintPhone: 'Rub the photo. Swipe the table for the next one.',
    rubCue: 'rub',
    developAll: 'Develop all',
    developAllNote: '(for the impatient)',
    developAllDone: [
      'Fine, fine. The chemistry is offended, but it’s on it.',
      'Instant film, instant patience.',
      'Somewhere, a chemist just sighed.',
    ],
    developAllNone: 'Everything is already developed. Impatient and fast.',
    reset: 'Back to the dark',
    resetDone: 'Everything is a mystery again.',
    resetNone: 'Nothing is developed here yet. It’s dark enough already.',
    shy: ['Rub it first. It’s shy.', 'Not ready yet. Keep rubbing.', 'The chemistry wants a little attention.'],
    shake: [
      'Shaking doesn’t actually help. Really. …Okay, a tiny bit.',
      'That’s a myth from the eighties. But here’s a little.',
      'Rub it, don’t shake it. …Fine, here you go.',
    ],
    shakePhone: 'Next time, just shake the phone.',
    tableRub: 'The table is clean. The photos are over there.',
    albumDone: 'The whole album is developed. Nice work, chemist.',
    printUndev: 'Undeveloped photo {i} of {n}. Press Enter to develop it.',
    printDev: '{caption} Photo {i} of {n}. Press Enter to open it.',
    photoOf: '{i} of {n}',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    closePhoto: 'Back to the table',
    backToTable: 'Back to the table',
    langBg: 'Bulgarian',
    langEn: 'English',
    langSwitch: 'Switch language to {lang}',
    listAlbums: 'Albums',
    openAlbum: 'Put this album on the table',
    mood: 'mood',
    onlyBgShort: 'BG only',
    devCount: '{d} of {n} developed',
    postNav: 'More posts',
  },
};

const lastPick = new Map();

/** UI string in the current language. Arrays pick a random entry (never the same twice in a row). */
export function u(key, vars) {
  const lang = window.Blog.lang;
  let v = S[lang]?.[key] ?? S.bg[key] ?? key;
  if (Array.isArray(v)) {
    let i = Math.floor(Math.random() * v.length);
    if (v.length > 1 && lastPick.get(key) === i) i = (i + 1) % v.length;
    lastPick.set(key, i);
    v = v[i];
  }
  if (vars) v = v.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));
  return v;
}
