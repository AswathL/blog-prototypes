// Concept-specific UI strings. Post / album / photo text always comes from window.Blog.
export const UI = {
  bg: {
    title: 'Бъркотия · Телевизорът',
    remote: 'Дистанционно управление',
    power: 'Включи или изключи телевизора',
    mute: 'Звук: включи или изключи',
    lang: 'Език: превключи на английски',
    chUp: 'Следващ канал',
    chDown: 'Предишен канал',
    volUp: 'Усили звука',
    volDown: 'Намали звука',
    up: 'Следващ канал',
    down: 'Предишен канал',
    left: 'Назад в канала',
    right: 'Напред в канала',
    ok: 'Отвори',
    channel: (n) => `Канал ${n}`,
    prevCh: 'Последният гледан канал',
    info: 'Какво дават сега',
    guide: 'Програмата (списък с всичко)',
    fastext: ['Канал 1: Истории', 'Канал 2: Мнения', 'Канал 3: Снимки', 'Канал 4: За мен'],
    printCh: 'КАН',
    printVol: 'ЗВУК',
    printMute: 'БЕЗ ЗВУК',
    printGuide: 'ПРОГРАМА',
    printInfo: 'ИНФО',
    printPower: 'МРЕЖА',
    printLang: 'ЕЗИК · LANG',
    printPrev: 'P<P',
    soundOff: 'Звук: изкл.',
    soundOn: 'Звук: вкл.',
    noteHint: 'Натисни червеното копче!',
    noteHintSub: '— баба',
    screenLabel: 'Екранът на телевизора',
    // OSD + channels
    osdVol: 'ЗВУК',
    osdMuted: 'БЕЗ ЗВУК',
    osdLang: 'ЕЗИК',
    osdLangName: 'БЪЛГАРСКИ',
    osdTrack: 'I',
    ch0: 'ТЕСТ',
    ch9: 'ВАНЯ ТВ',
    av: 'AV',
    noSignal: 'НЯМА СИГНАЛ',
    snowName: '———',
    testTop: 'НАСТРОЙТЕ ПРИЕМНИКА СИ',
    testGuide: 'ДНЕС:',
    lateNight: 'ЗА ЛЕКА НОЩ',
    of: 'от',
    onAir: 'НА ЖИВО',
    position: 'ПОЗИЦИЯ',
    hot: 'ГОРЕЩО',
    browse: 'избор',
    readIt: 'чети',
    openPhoto: 'отвори',
    tt: {
      service: 'БЪРКОТИЯ',
      pages: ['ЗА МЕН', 'ИНДЕКС', 'ВРЕМЕТО'],
      aboutHead: 'КОЯ СЪМ АЗ',
      indexHead: 'ВСИЧКО В ЕФИР',
      weatherHead: 'ПРОГНОЗА',
      weather: [
        ['СОФИЯ', 'облачно, шанс за котка', '18°'],
        ['ПЛОВДИВ', 'калдъръм, пазете се', '21°'],
        ['МОРЕТО', 'октомври. Перфектно.', '19°'],
        ['ПЕРНИК', 'звънци, без валежи', '12°'],
        ['МЕЖДУ ВАС', 'топло и уютно', '∞°'],
      ],
      weatherNote: 'Прогнозата е съставена от Ваня.',
      hidden: 'Канал 9 е само за котки.',
      fastext: ['Истории', 'Мнения', 'Снимки', 'Индекс'],
      sub: 'стр.',
      openAbout: 'OK — прочети спокойно',
    },
    vanya: {
      rec: 'ЗАПИС',
      day: 'ДЕН',
      title: 'ВАНЯ ТВ · КАНАЛ ЗА КОТКИ',
      live: 'НА ЖИВО: ВАНЯ СПИ',
      schedule:
        'ПРОГРАМАТА ЗА ДНЕС  ◆  06:00 Сън  ◆  09:00 Сън (повторение)  ◆  12:00 Обяд, после сън  ◆  15:00 Документален: „Птицата на перваза“  ◆  18:00 Хладилникът се отваря  ◆  18:05 Сън  ◆  03:00 Тичане по коридора (на живо)  ◆',
    },
    tvBrandSub: 'ЦВЕТЕН ТЕЛЕВИЗОР',
    knobBright: 'ЯРКОСТ',
    knobVol: 'ЗВУК',
    presets: 'ПРОГРАМИ',
    // reader
    backToTv: 'Обратно към телевизора',
    channelLabel: (n, name) => `П${n} · ${name}`,
    photoOf: (i, n) => `${i} от ${n}`,
    aboutTitle: 'За мен',
    nameMeaning: 'Името',
    guideTitle: 'ТВ програма',
    guideKicker: 'Седмичник за всичко, което дават',
    guideClose: 'Затвори програмата',
    guideOpenPhoto: (c) => `Отвори снимката: ${c}`,
    channelWord: 'Канал',
    cat: ['Мрр.', 'Мрррр…', '*отваря едно око*'],
    langNoteOn: 'English',
    langNoteOff: 'Български',
    swipeHint: 'плъзни ◀ ▶ · докосни за OK',
    keysHint: 'Цифри · ◀ ▶ · Enter · Esc · + − · M · L',
  },
  en: {
    title: 'Bărkotiya · The Telly',
    remote: 'Remote control',
    power: 'Turn the TV on or off',
    mute: 'Sound: turn on or off',
    lang: 'Language: switch to Bulgarian',
    chUp: 'Next channel',
    chDown: 'Previous channel',
    volUp: 'Volume up',
    volDown: 'Volume down',
    up: 'Next channel',
    down: 'Previous channel',
    left: 'Back within the channel',
    right: 'Forward within the channel',
    ok: 'Open',
    channel: (n) => `Channel ${n}`,
    prevCh: 'Last channel watched',
    info: 'What’s on now',
    guide: 'TV guide (a list of everything)',
    fastext: ['Channel 1: Stories', 'Channel 2: Opinions', 'Channel 3: Photos', 'Channel 4: About'],
    printCh: 'CH',
    printVol: 'VOL',
    printMute: 'MUTE',
    printGuide: 'GUIDE',
    printInfo: 'INFO',
    printPower: 'POWER',
    printLang: 'LANG · ЕЗИК',
    printPrev: 'P<P',
    soundOff: 'Sound: off',
    soundOn: 'Sound: on',
    noteHint: 'Press the red button!',
    noteHintSub: '— Grandma',
    screenLabel: 'The TV screen',
    osdVol: 'VOLUME',
    osdMuted: 'MUTE',
    osdLang: 'LANGUAGE',
    osdLangName: 'ENGLISH',
    osdTrack: 'II',
    ch0: 'TEST',
    ch9: 'VANYA TV',
    av: 'AV',
    noSignal: 'NO SIGNAL',
    snowName: '———',
    testTop: 'PLEASE TUNE YOUR RECEIVER',
    testGuide: 'TODAY:',
    lateNight: 'BEDTIME STORIES',
    of: 'of',
    onAir: 'LIVE',
    position: 'STANCE',
    hot: 'HOT TAKE',
    browse: 'browse',
    readIt: 'read',
    openPhoto: 'open',
    tt: {
      service: 'BARKOTIYA',
      pages: ['ABOUT', 'INDEX', 'WEATHER'],
      aboutHead: 'WHO I AM',
      indexHead: 'EVERYTHING ON AIR',
      weatherHead: 'FORECAST',
      weather: [
        ['SOFIA', 'cloudy, chance of cat', '18°'],
        ['PLOVDIV', 'cobblestones, beware', '21°'],
        ['THE SEA', 'October. Perfect.', '19°'],
        ['PERNIK', 'bells, no rain', '12°'],
        ['BETWEEN US', 'warm and cosy', '∞°'],
      ],
      weatherNote: 'Forecast compiled by Vanya.',
      hidden: 'Channel 9 is for cats only.',
      fastext: ['Stories', 'Opinions', 'Photos', 'Index'],
      sub: 'p.',
      openAbout: 'OK — read in peace',
    },
    vanya: {
      rec: 'REC',
      day: 'DAY',
      title: 'VANYA TV · A CHANNEL FOR CATS',
      live: 'LIVE: VANYA IS ASLEEP',
      schedule:
        'TODAY’S SCHEDULE  ◆  06:00 Sleep  ◆  09:00 Sleep (repeat)  ◆  12:00 Lunch, then sleep  ◆  15:00 Documentary: “The Bird on the Windowsill”  ◆  18:00 The fridge opens  ◆  18:05 Sleep  ◆  03:00 Hallway sprints (live)  ◆',
    },
    tvBrandSub: 'COLOUR TELEVISION',
    knobBright: 'BRIGHT',
    knobVol: 'VOL',
    presets: 'PROGRAMS',
    backToTv: 'Back to the telly',
    channelLabel: (n, name) => `P${n} · ${name}`,
    photoOf: (i, n) => `${i} of ${n}`,
    aboutTitle: 'About',
    nameMeaning: 'The name',
    guideTitle: 'TV guide',
    guideKicker: 'The weekly for everything on air',
    guideClose: 'Close the guide',
    guideOpenPhoto: (c) => `Open photo: ${c}`,
    channelWord: 'Channel',
    cat: ['Mrrp.', 'Mrrrrr…', '*opens one eye*'],
    langNoteOn: 'English',
    langNoteOff: 'Български',
    swipeHint: 'swipe ◀ ▶ · tap for OK',
    keysHint: 'Digits · ◀ ▶ · Enter · Esc · + − · M · L',
  },
};


// WebGL2 CRT: barrel distortion, scanlines, aperture grille, chromatic aberration,
// mip-based bloom, vignette, flicker, hum bar, snow, sync tear, vertical roll and
// the classic warm-up line / collapse-to-dot.

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uTex;
uniform sampler2D uBloom;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uScale;
uniform float uWhite;
uniform float uBright;
uniform float uStatic;
uniform float uTear;
uniform float uRoll;
uniform float uMotion;
uniform float uLines;
uniform float uMaskPx;
uniform float uDot;
uniform float uGhost;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 tex(vec2 p) { return texture(uTex, p).rgb; }
vec3 soft(vec2 p) { return texture(uBloom, p).rgb; }

void main() {
  vec2 c = vUv * 2.0 - 1.0;
  // tube curvature
  vec2 cc = c * (1.0 + vec2(0.055, 0.075) * (c.yx * c.yx));
  cc *= 0.972;

  // dark phosphor glass
  float rg = length(c * vec2(0.9, 1.0));
  vec3 glass = vec3(0.050, 0.058, 0.056) * (1.18 - 0.42 * rg * rg);

  vec2 pc = cc / max(uScale, vec2(0.0001));
  vec2 p = pc * 0.5 + 0.5;

  // vertical roll with blanking bar
  float blank = 1.0;
  if (uRoll > 0.0) {
    p.y = fract(p.y + uRoll);
    blank = smoothstep(0.0, 0.035, p.y) * smoothstep(1.0, 0.985, p.y);
  }

  float line = floor(p.y * uLines);
  // horizontal sync wobble
  float t24 = floor(uTime * 24.0);
  float tear = uTear * ((hash12(vec2(line * 0.013, t24)) - 0.5) * 0.05 + sin(p.y * 22.0 + uTime * 37.0) * 0.012 + step(0.93, hash12(vec2(floor(p.y * 9.0), t24))) * 0.06);
  p.x += tear;

  vec2 ca = cc * 0.0022 + vec2(0.0009, 0.0);
  vec3 col;
  col.r = tex(p + ca).r;
  col.g = tex(p).g;
  col.b = tex(p - ca).b;
  // ghosting (weak antenna echo)
  col += soft(p - vec2(0.012, 0.0)) * (0.06 + uGhost * 0.2);

  const float bo = 0.018;
  vec3 bloom = soft(p) * 0.4 + (soft(p + vec2(bo, 0.0)) + soft(p - vec2(bo, 0.0)) + soft(p + vec2(0.0, bo * 1.33)) + soft(p - vec2(0.0, bo * 1.33))) * 0.15;
  col = col * 0.92 + bloom * bloom * 0.55;

  // snow
  vec2 sp = floor(vUv * uRes / 1.6);
  float n = hash12(sp + fract(uTime * 7.13) * 917.0);
  float streak = hash12(vec2(floor(vUv.y * uRes.y / 2.0), floor(uTime * 50.0)));
  vec3 snow = vec3(n * (0.55 + 0.6 * streak));
  snow += vec3(0.03, 0.02, 0.05) * hash12(sp.yx + uTime);
  col = mix(col, snow, clamp(uStatic, 0.0, 1.0));

  // analog grain, always a little
  col += (hash12(sp * 1.7 + uTime * 61.0) - 0.5) * 0.035 * uMotion;

  // scanlines (bright lines bloom wider)
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float s = abs(sin(p.y * uLines * 3.14159265));
  float scan = mix(0.5, 1.0, pow(s, mix(1.8, 0.45, clamp(lum * 1.2, 0.0, 1.0))));
  col *= mix(1.0, scan, 0.78);

  // aperture grille
  float mx = gl_FragCoord.x / uMaskPx;
  vec3 mask = 0.78 + 0.22 * cos(6.2831853 * (mx - vec3(0.0, 1.0 / 3.0, 2.0 / 3.0)));
  col *= mix(vec3(1.0), mask * 1.12, 0.55);

  // hum bar + flicker
  float hum = sin((vUv.y - uTime * 0.085) * 6.2831853);
  col *= 1.0 + uMotion * 0.04 * smoothstep(0.55, 1.0, hum);
  col *= 1.0 + uMotion * (hash12(vec2(floor(uTime * 30.0), 7.0)) - 0.5) * 0.028;

  // picture bounds (curved), soft
  vec2 edge = smoothstep(vec2(1.0), vec2(0.975), abs(pc));
  float inside = edge.x * edge.y * blank;

  // vignette
  float vig = clamp((1.0 - cc.x * cc.x * 0.42) * (1.0 - cc.y * cc.y * 0.55), 0.0, 1.0);
  col *= pow(vig, 1.25);

  // slightly cool phosphors + contrast
  col = pow(max(col, 0.0), vec3(1.06)) * vec3(0.98, 1.0, 1.04) * 1.08;
  col = mix(col, vec3(1.0, 1.0, 1.02), uWhite);
  col *= uBright;

  vec3 outc = glass + col * inside;

  // warm-up line / collapse dot halo
  float lineHalo = uWhite * exp(-pow(abs(cc.y) / (uScale.y * 2.0 + 0.012), 2.0)) * smoothstep(uScale.x + 0.08, uScale.x - 0.04, abs(cc.x));
  outc += vec3(0.85, 0.92, 1.0) * lineHalo * 0.55 * uBright;
  float d = length(cc * vec2(1.333, 1.0));
  outc += vec3(0.9, 0.95, 1.0) * uDot * (exp(-d * d * 900.0) * 1.4 + exp(-d * d * 60.0) * 0.25);

  o = vec4(outc, 1.0);
}`;

export class CRT {
  constructor(canvas, source) {
    this.canvas = canvas;
    this.source = source;
    this.ok = false;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      this.fallback();
      return;
    }
    this.gl = gl;
    const prog = this.program(VERT, FRAG);
    if (!prog) {
      this.fallback();
      return;
    }
    this.prog = prog;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const mk = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.tex = mk();
    this.bloomTex = mk();
    // a tiny copy of the picture, linearly filtered, is all the bloom needs
    this.small = document.createElement('canvas');
    this.small.width = 120;
    this.small.height = 90;
    this.smallCtx = this.small.getContext('2d');
    this.u = {};
    for (const name of ['uTex', 'uBloom', 'uRes', 'uTime', 'uScale', 'uWhite', 'uBright', 'uStatic', 'uTear', 'uRoll', 'uMotion', 'uLines', 'uMaskPx', 'uDot', 'uGhost'])
      this.u[name] = gl.getUniformLocation(prog, name);
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform1i(this.u.uBloom, 1);
    this.ok = true;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.ok = false;
      this.fallback();
    });
  }

  // No (more) WebGL: put a plain 2D canvas in the same spot.
  fallback() {
    if (this.ctx2d) return;
    const old = this.canvas;
    let cv = old;
    if (this.gl || old.getContext('2d') === null) {
      cv = old.cloneNode(false);
      old.replaceWith(cv);
      cv.width = old.width;
      cv.height = old.height;
      this.onswap?.(cv);
    }
    this.canvas = cv;
    this.ctx2d = cv.getContext('2d');
  }

  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const v = sh(gl.VERTEX_SHADER, vs);
    const f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }

  resize(cssW, cssH, quality = 1) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * quality;
    const w = Math.max(2, Math.round(cssW * dpr));
    const h = Math.max(2, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
  }

  render(st, uploadSource = true) {
    if (!this.ok) {
      if (!this.ctx2d) this.fallback();
      return this.render2d(st);
    }
    const gl = this.gl;
    const w = this.canvas.width;
    const h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    if (uploadSource) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source);
      this.smallCtx.drawImage(this.source, 0, 0, 120, 90);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.small);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
    }
    const u = this.u;
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, st.time);
    gl.uniform2f(u.uScale, st.sx, st.sy);
    gl.uniform1f(u.uWhite, st.white);
    gl.uniform1f(u.uBright, st.bright);
    gl.uniform1f(u.uStatic, st.static);
    gl.uniform1f(u.uTear, st.tear);
    gl.uniform1f(u.uRoll, st.roll);
    gl.uniform1f(u.uMotion, st.motion);
    // keep scanlines >= ~2.6 device px apart so they never alias
    gl.uniform1f(u.uLines, Math.max(90, Math.min(288, h / 2.6)));
    gl.uniform1f(u.uMaskPx, Math.max(3, 3 * (this.dpr || 1)));
    gl.uniform1f(u.uDot, st.dot);
    gl.uniform1f(u.uGhost, st.ghost || 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Graceful fallback without WebGL2: plain picture + painted scanlines.
  render2d(st) {
    const ctx = this.ctx2d;
    if (!ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#0d0f0e';
    ctx.fillRect(0, 0, w, h);
    if (st.bright > 0.01) {
      ctx.globalAlpha = st.bright;
      const sw = w * st.sx;
      const sh = h * st.sy;
      ctx.drawImage(this.source, (w - sw) / 2, (h - sh) / 2, sw, sh);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    }
  }
}

// Draws what the TV station is broadcasting into a 960×720 canvas.
// The CRT shader turns it into a picture. All post/photo text comes from Blog.

export const W = 960;
export const H = 720;

const F = {
  osd: '"Press Start 2P", monospace',
  serif: 'Cormorant, "Cormorant Garamond", Georgia, serif',
  sans: 'Rubik, system-ui, sans-serif',
  russo: '"Russo One", Rubik, sans-serif',
  read: 'Literata, Georgia, serif',
};

const TT = {
  k: '#000000',
  r: '#ff2a1a',
  g: '#18f040',
  y: '#ffee22',
  b: '#1a2cff',
  m: '#ff2aff',
  c: '#1af0ff',
  w: '#ffffff',
};

const B = () => window.Blog;
const L = () => UI[window.Blog.lang];

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (line && ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function clampLines(ctx, lines, max, maxW) {
  if (lines.length <= max) return lines;
  const out = lines.slice(0, max);
  let last = out[max - 1];
  while (last.length && ctx.measureText(last + '…').width > maxW) last = last.replace(/\s*\S+$/, '');
  out[max - 1] = last + '…';
  return out;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cover(ctx, img, x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw;
  let sh;
  if (ir > r) {
    sh = img.height / zoom;
    sw = sh * r;
  } else {
    sw = img.width / zoom;
    sh = sw / r;
  }
  const sx = (img.width - sw) * fx;
  const sy = (img.height - sh) * fy;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

const pad2 = (n) => String(n).padStart(2, '0');
const clock = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export class Screen {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.imgs = new Map();
    this.blurs = new Map();
    this.ch = 0;
    this.idx = { 1: 0, 2: 0, 3: 0, 4: 0 };
    this.itemAt = 0;
    this.prevPhoto = null;
    this.osd = null;
    this.compact = false;
    this.card = null;
    this.catImg = null;
    this.cache = {};
    this.avgCv = document.createElement('canvas');
    this.avgCv.width = 6;
    this.avgCv.height = 4;
    this.avgCtx = this.avgCv.getContext('2d', { willReadFrequently: true });
    this.cat = { x: 0, y: 0 };
  }

  // ---------- data
  items(ch = this.ch) {
    const Bl = B();
    if (ch === 1) return Bl.stories;
    if (ch === 2) return Bl.opinions;
    if (ch === 3) return Bl.photos;
    if (ch === 4) return [0, 1, 2];
    return [];
  }
  current(ch = this.ch) {
    const list = this.items(ch);
    return list.length ? list[this.idx[ch] % list.length] : null;
  }

  // Thumbnails load through a tiny queue (3 at a time, current picture first).
  img(file, urgent = true) {
    const url = B().thumbUrl(file);
    let rec = this.imgs.get(url);
    if (!rec) {
      rec = { im: new Image(), ok: false, tries: 0, url };
      rec.im.decoding = 'async';
      this.imgs.set(url, rec);
      this.enqueue(rec, urgent);
    } else if (urgent && !rec.ok && !rec.started) {
      const i = this.queue.indexOf(rec);
      if (i > 0) {
        this.queue.splice(i, 1);
        this.queue.unshift(rec);
      }
    }
    return rec.ok ? rec.im : null;
  }

  enqueue(rec, urgent) {
    this.queue ??= [];
    this.loading ??= 0;
    if (urgent) this.queue.unshift(rec);
    else this.queue.push(rec);
    this.pump();
  }

  pump() {
    while (this.loading < 3 && this.queue.length) {
      const rec = this.queue.shift();
      rec.started = true;
      this.loading++;
      rec.im.onload = () => {
        rec.ok = true;
        this.loading--;
        this.pump();
      };
      rec.im.onerror = () => {
        this.loading--;
        rec.started = false;
        if (++rec.tries < 4) setTimeout(() => this.enqueue(rec, false), 700 * rec.tries);
        this.pump();
      };
      rec.im.src = rec.tries ? `${rec.url}?retry=${rec.tries}` : rec.url;
    }
  }

  blurred(file) {
    const im = this.img(file);
    if (!im) return null;
    let b = this.blurs.get(file);
    if (!b) {
      b = document.createElement('canvas');
      b.width = 24;
      b.height = 18;
      const c = b.getContext('2d');
      cover(c, im, 0, 0, 24, 18);
      this.blurs.set(file, b);
    }
    return b;
  }

  preload() {
    const Bl = B();
    Bl.posts.forEach((p) => this.img(p.cover, false));
    Bl.photos.slice(0, 4).forEach((p) => this.img(p.file, false));
  }

  setChannel(ch, t) {
    this.ch = ch;
    this.itemAt = t;
    this.prevPhoto = null;
  }

  step(dir, t) {
    const list = this.items();
    if (!list.length) return false;
    const n = list.length;
    if (this.ch === 3) this.prevPhoto = { photo: this.current(), at: t, kb: this.kbState(t) };
    this.idx[this.ch] = (this.idx[this.ch] + dir + n) % n;
    this.itemAt = t;
    if (this.ch === 3) {
      // warm the neighbours
      const i = this.idx[3];
      this.img(list[(i + 1) % n].file, false);
      this.img(list[(i - 1 + n) % n].file, false);
    }
    return true;
  }

  // ---------- OSD
  showOsd(type, data = {}, t, dur = 2600) {
    this.osd = { type, data, at: t, until: t + dur };
  }

  // ---------- frame
  draw(t, opts) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.textBaseline = 'alphabetic';
    if (this.card) this.drawCard(ctx, t);
    else {
      switch (this.ch) {
        case 0:
          this.drawTest(ctx, t);
          break;
        case 1:
          this.drawStories(ctx, t);
          break;
        case 2:
          this.drawOpinions(ctx, t);
          break;
        case 3:
          this.drawPhotos(ctx, t, opts);
          break;
        case 4:
          this.drawTeletext(ctx, t);
          break;
        case 9:
          this.drawVanya(ctx, t);
          break;
        case 'av':
          this.drawAV(ctx, t);
          break;
        default:
          ctx.fillStyle = '#111';
          ctx.fillRect(0, 0, W, H);
          if (this.reduced) {
            // calm "no signal" card instead of animated snow
            ctx.fillStyle = '#2a2d31';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#d9dde2';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `28px ${F.osd}`;
            ctx.fillText(L().noSignal, W / 2, H / 2);
          }
      }
      this.drawOsd(ctx, t, opts);
    }
    ctx.restore();
  }

  // ---------- 0 · test card
  buildTest() {
    const key = `test-${B().lang}`;
    if (this.cache[key]) return this.cache[key];
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d');
    const Lx = L();
    c.fillStyle = '#56595b';
    c.fillRect(0, 0, W, H);
    // grid
    c.fillStyle = '#e9e9e9';
    for (let x = 12; x < W; x += 48) c.fillRect(x - 1, 0, 2.5, H);
    for (let y = 12; y < H; y += 48) c.fillRect(0, y - 1, W, 2.5);
    // corner geometry rings
    const ring = (x, y) => {
      for (let r = 58, k = 0; r > 4; r -= 9, k++) {
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fillStyle = k % 2 ? '#111' : '#f3f3f3';
        c.fill();
      }
      c.beginPath();
      c.arc(x, y, 6, 0, Math.PI * 2);
      c.fillStyle = '#d62a20';
      c.fill();
    };
    ring(130, 128);
    ring(830, 128);
    ring(130, 600);
    ring(830, 600);
    const cx = 480;
    const cy = 368;
    const R = 256;
    c.save();
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = '#1a1a1a';
    c.fillRect(0, 0, W, H);
    // A: colour bars
    const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const bw = (R * 2) / 7;
    bars.forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect(cx - R + i * bw, cy - R, bw + 1, 128);
    });
    // B: martenitsa band (twisted red & white thread)
    const by = cy - R + 128;
    c.fillStyle = '#f4efe6';
    c.fillRect(cx - R, by, R * 2, 30);
    c.save();
    c.beginPath();
    c.rect(cx - R, by, R * 2, 30);
    c.clip();
    c.fillStyle = '#c8202a';
    for (let x = cx - R - 40; x < cx + R + 40; x += 26) {
      c.beginPath();
      c.moveTo(x, by + 30);
      c.lineTo(x + 13, by + 30);
      c.lineTo(x + 30, by);
      c.lineTo(x + 17, by);
      c.closePath();
      c.fill();
    }
    c.restore();
    // C: name
    const ny = by + 30;
    c.fillStyle = '#000';
    c.fillRect(cx - R, ny, R * 2, 84);
    c.fillStyle = '#fff';
    c.font = `58px ${F.russo}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(B().text(B().site.name).toUpperCase(), cx, ny + 44, R * 1.8);
    // D: crosshair line
    c.fillStyle = '#fff';
    c.fillRect(cx - R, ny + 84, R * 2, 4);
    // E: greyscale steps
    const gy = ny + 88;
    for (let i = 0; i < 6; i++) {
      const v = Math.round((i / 5) * 235 + 10);
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(cx - R + (i * R * 2) / 6, gy, (R * 2) / 6 + 1, 56);
    }
    // F: gratings
    const fy = gy + 56;
    c.fillStyle = '#000';
    c.fillRect(cx - R, fy, R * 2, 54);
    const periods = [16, 11, 8, 6, 4, 3];
    const gw = (R * 2 - 40) / periods.length;
    periods.forEach((p, i) => {
      const x0 = cx - R + 20 + i * gw;
      for (let x = 0; x < gw - 6; x += p) {
        c.fillStyle = '#ececec';
        c.fillRect(x0 + x, fy + 6, p / 2, 42);
      }
    });
    // G: clock box (digits per frame)
    const ky = fy + 54;
    c.fillStyle = '#000';
    c.fillRect(cx - R, ky, R * 2, 66);
    // H: luminance ramp
    const ry = ky + 66;
    const grad = c.createLinearGradient(cx - R, 0, cx + R, 0);
    grad.addColorStop(0, '#000');
    grad.addColorStop(1, '#fff');
    c.fillStyle = grad;
    c.fillRect(cx - R, ry, R * 2, 40);
    c.fillStyle = '#c8202a';
    c.fillRect(cx - R, ry + 40, R * 2, 80);
    c.fillStyle = '#fff';
    c.font = `600 22px ${F.sans}`;
    c.fillText(B().text(B().site.tagline).replace(/\.$/, ''), cx, ry + 66);
    c.restore();
    // center cross + outline
    c.strokeStyle = '#fff';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx, ny + 72);
    c.lineTo(cx, ny + 100);
    c.stroke();
    // top caption
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `15px ${F.osd}`;
    const top = Lx.testTop;
    const tw = c.measureText(top).width + 30;
    c.fillStyle = '#000';
    c.fillRect(cx - tw / 2, 54, tw, 34);
    c.fillStyle = '#fff';
    c.textBaseline = 'middle';
    c.fillText(top, cx, 72);
    this.cache[key] = cv;
    return cv;
  }

  drawTest(ctx, t) {
    ctx.drawImage(this.buildTest(), 0, 0);
    const cx = 480;
    const ky = 368 - 256 + 128 + 30 + 88 + 56 + 54;
    ctx.fillStyle = '#fff';
    ctx.font = `34px ${F.osd}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(clock(), cx, ky + 35);
    // programme ribbon
    const Lx = L();
    const Bl = B();
    const names = [Bl.t('stories'), Bl.t('opinions'), Bl.t('gallery'), Bl.t('about')];
    const s = `${Lx.testGuide}  ${names.map((n, i) => `${i + 1} ${n}`).join('  ·  ')}`;
    ctx.font = `${this.compact ? 22 : 17}px ${F.osd}`;
    const w = Math.min(860, ctx.measureText(s).width + 36);
    ctx.fillStyle = 'rgba(0,0,0,.88)';
    ctx.fillRect(480 - w / 2, 648, w, 40);
    ctx.fillStyle = '#ffee22';
    ctx.fillText(s.toUpperCase(), 480, 669, 840);
  }

  // ---------- 1 · stories, late night
  drawStories(ctx, t) {
    const Bl = B();
    const Lx = L();
    const post = this.current(1);
    const v = Bl.view(post);
    const im = this.img(post.cover);
    const age = (t - this.itemAt) / 1000;
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, W, H);
    if (im) {
      ctx.globalAlpha = easeOut(age / 1.2);
      cover(ctx, im, 0, 0, W, H, 1.06 + Math.min(age, 40) * 0.0025, 0.62, 0.45);
      ctx.globalAlpha = 1;
    }
    // night grade
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#4a5596';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    let g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(4,5,18,.95)');
    g.addColorStop(0.55, 'rgba(4,5,18,.7)');
    g.addColorStop(1, 'rgba(4,5,18,.15)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // fireside warmth
    const fl = 0.16 + 0.04 * Math.sin(t / 310) + 0.03 * Math.sin(t / 97);
    g = ctx.createRadialGradient(140, 700, 10, 140, 700, 560);
    g.addColorStop(0, `rgba(255,160,80,${fl})`);
    g.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // station bug: crescent + name
    this.moon(ctx, 842, 92, 22);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(244,234,214,.9)';
    ctx.font = `italic 600 30px ${F.serif}`;
    ctx.fillText(Bl.t('stories'), 808, 94);
    ctx.font = `500 13px ${F.sans}`;
    ctx.fillStyle = 'rgba(231,183,101,.85)';
    ctx.fillText(Lx.lateNight.split('').join(' '), 808, 120);

    const appear = easeOut(age / 0.9);
    ctx.globalAlpha = appear;
    const x = 84;
    const maxW = this.compact ? 780 : 600;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const list = this.items(1);
    const kick = `${Bl.t('story').toUpperCase()} ${this.idx[1] + 1} ${Lx.of.toUpperCase()} ${list.length}  ·  ${Bl.date(post.date).toUpperCase()}`;
    ctx.font = `500 ${this.compact ? 26 : 17}px ${F.sans}`;
    ctx.fillStyle = '#e7b765';
    let y = this.compact ? 200 : 214;
    this.spaced(ctx, kick, x, y, this.compact ? 2 : 2.5);
    y += this.compact ? 30 : 26;
    const tf = this.compact ? 84 : 64;
    ctx.font = `italic 600 ${tf}px ${F.serif}`;
    ctx.fillStyle = '#f6eedc';
    const tl = clampLines(ctx, wrap(ctx, v.title, maxW), 3, maxW);
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = 18;
    tl.forEach((ln) => {
      y += tf * 1.02;
      ctx.fillText(ln, x - 2, y);
    });
    ctx.shadowBlur = 0;
    if (!this.compact) {
      ctx.font = `500 29px ${F.serif}`;
      ctx.fillStyle = 'rgba(232,222,204,.92)';
      y += 26;
      clampLines(ctx, wrap(ctx, v.excerpt, 560), 3, 560).forEach((ln) => {
        y += 36;
        ctx.fillText(ln, x, y);
      });
    }
    y += this.compact ? 54 : 44;
    ctx.font = `500 ${this.compact ? 26 : 17}px ${F.sans}`;
    ctx.fillStyle = 'rgba(214,206,190,.85)';
    ctx.fillText(`${Bl.t('mood')}: ${Bl.text(post.mood)}  ·  ${Bl.readMinutes(post)} ${Bl.t('minRead')}`, x, y);
    ctx.globalAlpha = 1;
    this.hints(ctx, Lx.readIt, list.length, this.idx[1], '#e7b765');
  }

  moon(ctx, x, y, r) {
    ctx.save();
    ctx.fillStyle = '#f4ead6';
    ctx.shadowColor = 'rgba(255,230,180,.8)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x + r * 0.45, y - r * 0.25, r * 0.88, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  spaced(ctx, text, x, y, sp) {
    let cx = x;
    for (const ch of text) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + sp;
    }
    return cx;
  }

  hints(ctx, verb, n, i, accent) {
    const y = 648;
    const k = this.compact ? 1.35 : 1;
    ctx.save();
    if (this.touch) {
      // fingers swipe the glass instead of pressing arrows
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = `500 ${16 * k}px ${F.sans}`;
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillText(L().swipeHint, 84, y + 1);
    } else {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `600 ${16 * k}px ${F.sans}`;
    const cap = (label, x) => {
      const w = Math.max(30 * k, ctx.measureText(label).width + 16 * k);
      roundRect(ctx, x, y - 15 * k, w, 30 * k, 6 * k);
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + (w - ctx.measureText(label).width) / 2, y + 1);
      return x + w;
    };
    let x = 84;
    x = cap('◀', x) + 6;
    x = cap('▶', x) + 10;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.font = `500 ${16 * k}px ${F.sans}`;
    ctx.fillText(L().browse, x, y + 1);
    x += ctx.measureText(L().browse).width + 22;
    ctx.font = `600 ${16 * k}px ${F.sans}`;
    x = cap('OK', x) + 10;
    ctx.font = `500 ${16 * k}px ${F.sans}`;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText(verb, x, y + 1);
    }
    // dots
    if (n > 1 && n < 12) {
      for (let d = 0; d < n; d++) {
        ctx.beginPath();
        ctx.arc(876 - (n - 1 - d) * 22, y, d === i ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = d === i ? accent : 'rgba(255,255,255,.35)';
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- 2 · opinions, talk show
  drawOpinions(ctx, t) {
    const Bl = B();
    const Lx = L();
    const post = this.current(2);
    const v = Bl.view(post);
    const im = this.img(post.cover);
    const age = (t - this.itemAt) / 1000;
    // studio
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b0609');
    g.addColorStop(0.6, '#4d0b12');
    g.addColorStop(1, '#16040a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // light beams
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const bx = 120 + i * 240 + Math.sin(t / 2400 + i) * 30;
      g = ctx.createLinearGradient(bx, 0, bx, 520);
      g.addColorStop(0, 'rgba(255,120,90,.20)');
      g.addColorStop(1, 'rgba(255,120,90,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(bx - 14, 0);
      ctx.lineTo(bx + 14, 0);
      ctx.lineTo(bx + 120, 520);
      ctx.lineTo(bx - 120, 520);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // video wall
    const wx = this.compact ? 120 : 452;
    const wy = 70;
    const ww = this.compact ? 720 : 430;
    const wh = this.compact ? 300 : 360;
    const cols = 3;
    const rows = this.compact ? 2 : 3;
    const gap = 6;
    ctx.fillStyle = '#050505';
    ctx.fillRect(wx - 10, wy - 10, ww + 20, wh + 20);
    if (im) {
      const tw = (ww - gap * (cols - 1)) / cols;
      const th = (wh - gap * (rows - 1)) / rows;
      if (!this.wallCv) this.wallCv = document.createElement('canvas');
      const off = this.wallCv;
      if (off.width !== ww || off.height !== wh) {
        off.width = ww;
        off.height = wh;
      }
      const oc = off.getContext('2d');
      cover(oc, im, 0, 0, ww, wh, 1.04 + Math.min(age, 40) * 0.002, 0.5, 0.45);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const sx = c * (tw + gap);
          const sy = r * (th + gap);
          ctx.globalAlpha = easeOut((age - (r * cols + c) * 0.05) / 0.5);
          ctx.drawImage(off, sx, sy, tw, th, wx + sx, wy + sy, tw, th);
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(${(r + c) % 2 ? '255,230,220' : '20,30,80'},${0.06 + 0.04 * Math.sin(t / 900 + r + c * 2)})`;
          ctx.fillRect(wx + sx, wy + sy, tw, th);
        }
    }
    // the host's quote (big „ and the excerpt)
    if (!this.compact) {
      ctx.globalAlpha = easeOut(age / 0.8);
      ctx.fillStyle = '#ff4a3a';
      ctx.font = `160px ${F.serif}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(Bl.lang === 'bg' ? '„' : '“', 70, 200);
      ctx.font = `italic 500 25px ${F.sans}`;
      ctx.fillStyle = '#fff';
      let y = 214;
      clampLines(ctx, wrap(ctx, v.excerpt, 340), 6, 340).forEach((ln) => {
        y += 34;
        ctx.fillText(ln, 82, y);
      });
      ctx.globalAlpha = 1;
    }
    // channel bug
    ctx.save();
    roundRect(ctx, 764, 52, 132, 44, 8);
    ctx.fillStyle = '#e3241b';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `20px ${F.russo}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Bl.t('opinions').toUpperCase(), 830, 75, 118);
    ctx.restore();
    // chyron
    const cy = this.compact ? 404 : 462;
    const slide = easeOut((age - 0.15) / 0.55);
    const cxL = 60 - (1 - slide) * 900;
    // LIVE tag
    const blink = Math.floor(t / 600) % 2 === 0;
    ctx.fillStyle = '#e3241b';
    ctx.fillRect(cxL, cy - 40, this.compact ? 210 : 168, 36);
    ctx.fillStyle = '#fff';
    ctx.font = `${this.compact ? 24 : 19}px ${F.russo}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (blink) {
      ctx.beginPath();
      ctx.arc(cxL + 22, cy - 22, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillText(Lx.onAir, cxL + 38, cy - 21);
    const tf = this.compact ? 46 : 33;
    ctx.font = `600 ${tf}px ${F.sans}`;
    const titleW = 840 - (this.compact ? 30 : 176);
    const tl = clampLines(ctx, wrap(ctx, v.title, titleW), 2, titleW);
    const ch = tl.length * tf * 1.15 + 28;
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(cxL, cy, 840, ch);
    if (!this.compact) {
      ctx.fillStyle = '#e3241b';
      ctx.fillRect(cxL, cy, 150, ch);
      ctx.fillStyle = '#fff';
      ctx.font = `20px ${F.russo}`;
      ctx.textAlign = 'center';
      ctx.fillText(Bl.t('opinion').toUpperCase(), cxL + 75, cy + ch / 2 + 1);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#16161a';
    ctx.font = `600 ${tf}px ${F.sans}`;
    tl.forEach((ln, i) => ctx.fillText(ln, cxL + (this.compact ? 22 : 170), cy + 14 + tf * 0.58 + i * tf * 1.15));
    // sub strip
    const sy = cy + ch;
    ctx.fillStyle = '#141b3d';
    ctx.fillRect(cxL, sy, 840, this.compact ? 44 : 34);
    ctx.fillStyle = '#ffd34a';
    ctx.font = `600 ${this.compact ? 22 : 16}px ${F.sans}`;
    ctx.fillText(`${Lx.position}: ${Bl.text(post.mood).toUpperCase()}   ·   ${Bl.date(post.date)}   ·   ${Bl.readMinutes(post)} ${Bl.t('minRead')}`, cxL + 16, sy + (this.compact ? 23 : 18));
    // ticker
    const ty = this.compact ? 596 : 610;
    const th = this.compact ? 46 : 34;
    ctx.fillStyle = '#ffcf2e';
    ctx.fillRect(0, ty, W, th);
    const tick = this.items(2)
      .map((p) => `${Bl.view(p).title.toUpperCase()} — ${Bl.view(p).excerpt}`)
      .join('   ◆   ');
    ctx.font = `600 ${this.compact ? 24 : 18}px ${F.sans}`;
    ctx.fillStyle = '#1a1206';
    const tw = ctx.measureText(tick + '   ◆   ').width;
    const off = (t / 1000) * 70 % tw;
    ctx.save();
    ctx.beginPath();
    ctx.rect(150, ty, W, th);
    ctx.clip();
    for (let k = 0; k < 3; k++) ctx.fillText(tick + '   ◆   ', 150 - off + k * tw, ty + th / 2 + 1);
    ctx.restore();
    ctx.fillStyle = '#e3241b';
    ctx.fillRect(0, ty, 150, th);
    ctx.fillStyle = '#fff';
    ctx.font = `${this.compact ? 20 : 15}px ${F.russo}`;
    ctx.textAlign = 'right';
    ctx.fillText(Lx.hot, 138, ty + th / 2 + 1);
    ctx.textAlign = 'left';
    this.hints(ctx, Lx.readIt, this.items(2).length, this.idx[2], '#ff4a3a');
  }

  // ---------- 3 · photo slideshow with teletext subtitles
  kbState(t) {
    const age = (t - this.itemAt) / 1000;
    return { zoom: 1 + Math.min(age, 12) * 0.006 };
  }

  drawPhoto(ctx, photo, alpha, kb) {
    const bl = this.blurred(photo.file);
    const im = this.img(photo.file);
    ctx.globalAlpha = alpha;
    if (bl) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bl, -20, -20, W + 40, H + 40);
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#0b0b0b';
      ctx.fillRect(0, 0, W, H);
    }
    if (im) {
      const ar = im.width / im.height;
      let w = W;
      let h = W / ar;
      if (h > H) {
        h = H;
        w = H * ar;
      }
      // landscape shots fill the frame; portraits sit inside the blurred bed
      if (ar > 1.2) {
        w = W;
        h = H;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(kb.zoom, kb.zoom);
        cover(ctx, im, -W / 2, -H / 2, W, H);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(kb.zoom, kb.zoom);
        ctx.shadowColor = 'rgba(0,0,0,.6)';
        ctx.shadowBlur = 30;
        ctx.drawImage(im, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawPhotos(ctx, t, opts = {}) {
    const Bl = B();
    const Lx = L();
    const photo = this.current(3);
    const album = Bl.albums.find((a) => a.slug === photo.album);
    const age = (t - this.itemAt) / 1000;
    const kb = this.kbState(t);
    if (this.prevPhoto && age < 0.9) {
      this.drawPhoto(ctx, this.prevPhoto.photo, 1, this.prevPhoto.kb);
      this.drawPhoto(ctx, photo, easeOut(age / 0.9), kb);
    } else this.drawPhoto(ctx, photo, 1, kb);
    // gradient for legibility
    let g = ctx.createLinearGradient(0, 0, 0, 170);
    g.addColorStop(0, 'rgba(0,0,0,.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 170);
    // bug + album counter
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${this.compact ? 30 : 22}px ${F.sans}`;
    ctx.shadowColor = 'rgba(0,0,0,.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(`${Bl.text(album.title).toUpperCase()}  ${photo.index + 1}/${album.photos.length}`, 880, 82);
    ctx.font = `500 ${this.compact ? 20 : 15}px ${F.sans}`;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText(`3 · ${Bl.t('gallery').toUpperCase()}`, 880, this.compact ? 116 : 108);
    ctx.fillStyle = 'rgba(255,238,34,.85)';
    ctx.fillText(this.touch ? Lx.swipeHint : `◀ ▶ ${Lx.browse}  ·  OK ${Lx.openPhoto}`, 880, this.compact ? 146 : 132);
    ctx.shadowBlur = 0;
    // album title card on the first photo of an album
    if (photo.index === 0 && age < 3.2) {
      const a = Math.min(easeOut(age / 0.5), 1 - easeOut((age - 2.5) / 0.7));
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(0, 250, W, 190);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${this.compact ? 66 : 54}px ${F.sans}`;
      ctx.fillText(Bl.text(album.title).toUpperCase(), W / 2, 322);
      ctx.font = `italic 500 ${this.compact ? 34 : 30}px ${F.serif}`;
      ctx.fillStyle = '#f2e6c9';
      ctx.fillText(Bl.text(album.note), W / 2, 384, 820);
      ctx.globalAlpha = 1;
    }
    // subtitles: teletext boxes
    const cap = Bl.text(photo.caption);
    const fs = this.compact ? 40 : 30;
    ctx.font = `500 ${fs}px ${F.sans}`;
    const lines = clampLines(ctx, wrap(ctx, cap, this.compact ? 780 : 720), 2, 780);
    const lh = fs * 1.32;
    const subA = easeOut((age - 0.35) / 0.4);
    ctx.globalAlpha = subA;
    ctx.textAlign = 'center';
    lines.forEach((ln, i) => {
      const y = 612 - (lines.length - 1 - i) * lh - (this.compact ? 10 : 0);
      const w = ctx.measureText(ln).width + 24;
      ctx.fillStyle = 'rgba(0,0,0,.86)';
      ctx.fillRect(W / 2 - w / 2, y - lh / 2, w, lh);
      ctx.fillStyle = i === 0 && lines.length === 1 ? '#fff' : '#fff';
      ctx.fillText(ln, W / 2, y + 2);
    });
    ctx.globalAlpha = 1;
    // slideshow progress
    if (opts.slideshow) {
      const p = Math.min(1, age / opts.slideshow);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(84, 668, 792, 3);
      ctx.fillStyle = '#ffee22';
      ctx.fillRect(84, 668, 792 * p, 3);
    }
  }

  // ---------- 4 · teletext
  ttMosaicCat() {
    if (this.cache.ttcat) return this.cache.ttcat;
    // paint a tiny calico in teletext colours, then read it back as 2×3 sixels
    const cw = 40;
    const chh = 21;
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = chh;
    const x = c.getContext('2d', { willReadFrequently: true });
    const ell = (cx, cy, rx, ry, col) => {
      x.fillStyle = col;
      x.beginPath();
      x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      x.fill();
    };
    // tail around the front
    x.strokeStyle = '#ff0';
    x.lineWidth = 2.6;
    x.beginPath();
    x.moveTo(3, 15);
    x.quadraticCurveTo(6, 20.5, 20, 19.6);
    x.stroke();
    ell(16, 13.5, 14, 6.4, '#fff');
    ell(31, 12.5, 6.6, 6, '#fff');
    x.fillStyle = '#fff';
    x.beginPath();
    x.moveTo(25.5, 9);
    x.lineTo(26.5, 2.5);
    x.lineTo(30.5, 7);
    x.closePath();
    x.moveTo(32, 7);
    x.lineTo(36, 2.5);
    x.lineTo(37, 9.5);
    x.closePath();
    x.fill();
    ell(13, 9.5, 8, 3.4, '#ff0');
    ell(5.5, 13, 4, 3.6, '#000');
    x.fillStyle = '#ff0';
    x.beginPath();
    x.moveTo(32, 7);
    x.lineTo(36, 2.5);
    x.lineTo(37, 9.5);
    x.lineTo(34, 9);
    x.closePath();
    x.fill();
    x.fillStyle = '#000';
    x.fillRect(28, 12, 2, 1);
    x.fillRect(33, 12, 2, 1);
    x.fillStyle = '#f00';
    x.fillRect(31, 14, 1, 1);
    const d = x.getImageData(0, 0, cw, chh).data;
    const cells = [];
    const cols = cw / 2;
    const rows = chh / 3;
    for (let r = 0; r < rows; r++)
      for (let q = 0; q < cols; q++) {
        for (let sy = 0; sy < 3; sy++)
          for (let sx = 0; sx < 2; sx++) {
            const k = ((r * 3 + sy) * cw + q * 2 + sx) * 4;
            if (d[k + 3] < 120) continue;
            const R = d[k];
            const G = d[k + 1];
            const Bc = d[k + 2];
            let col = null;
            if (R > 170 && G > 170 && Bc > 170) col = TT.w;
            else if (R > 150 && G > 150) col = TT.y;
            else if (R > 150) col = TT.r;
            if (col) cells.push({ q, r, sx, sy, col });
          }
      }
    this.cache.ttcat = { cells, cols, rows };
    return this.cache.ttcat;
  }

  drawTeletext(ctx, t) {
    const Bl = B();
    const Lx = L();
    const tt = Lx.tt;
    const page = this.idx[4] % 3;
    const ox = 66;
    const oy = 50;
    const cw = 20.7;
    const rh = 25.4;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const put = (row, col, text, fg = TT.w, bg = null, dh = false) => {
      text = String(text);
      if (bg) {
        ctx.fillStyle = bg;
        ctx.fillRect(ox + col * cw, oy + row * rh, text.length * cw, rh * (dh ? 2 : 1));
      }
      ctx.save();
      ctx.translate(ox + col * cw, oy + row * rh + 3);
      ctx.scale(cw / 18, ((dh ? 2 : 1) * (rh - 5)) / 18);
      ctx.font = `18px ${F.osd}`;
      ctx.fillStyle = fg;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };
    const bar = (row, color, h = 1) => {
      ctx.fillStyle = color;
      ctx.fillRect(ox, oy + row * rh, 40 * cw, rh * h);
    };
    const upper = (s) => s.toLocaleUpperCase(Bl.lang === 'bg' ? 'bg' : 'en');
    const fit = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
    // header row
    const now = new Date();
    const dd = `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}`;
    const pg = 100 + page;
    put(0, 0, `P${pg}`, TT.w);
    put(0, 5, fit(upper(tt.service), 12), TT.y);
    put(0, 18, String(pg), TT.w);
    put(0, 23, dd, TT.c);
    put(0, 29, clock(now).slice(0, 8), TT.y);
    put(1, 33, `${page + 1}/3`, TT.c);
    if (page === 0) {
      bar(2, TT.b, 2);
      put(2, 1, upper(Bl.text(Bl.site.name)), TT.y, null, true);
      put(2, 22, fit(upper(tt.aboutHead), 17), TT.w, null, true);
      // mosaic cat
      const cat = this.ttMosaicCat();
      const mx = ox + 1 * cw;
      const my = oy + 5 * rh;
      const sw = cw / 2;
      const sh = rh / 3;
      for (const c of cat.cells) {
        ctx.fillStyle = c.col;
        ctx.fillRect(mx + c.q * cw + c.sx * sw, my + c.r * rh + c.sy * sh, sw + 0.4, sh + 0.4);
      }
      // tagline beside the cat
      const tagW = 20;
      const tag = Bl.text(Bl.site.tagline);
      this.ttWrap(tag, tagW)
        .slice(0, 5)
        .forEach((ln, i) => put(5 + i, 19, ln, TT.c));
      // about text
      const about = Bl.text(Bl.site.about);
      this.ttWrap(about, 38)
        .slice(0, 10)
        .forEach((ln, i) => put(12 + i, 1, ln, i === 0 ? TT.y : TT.w));
      put(22, 1, tt.openAbout, TT.g);
    } else if (page === 1) {
      bar(2, TT.m, 2);
      put(2, 1, fit(upper(tt.indexHead), 38), TT.w, null, true);
      let r = 5;
      const row = (num, title, date, col) => {
        put(r, 1, String(num), TT.y);
        put(r, 5, fit(title, 27), col);
        put(r, 33, date, TT.c);
        r++;
      };
      put(r++, 1, upper(Bl.t('stories')), TT.g);
      Bl.stories.forEach((p, i) => row(101 + i, Bl.view(p).title, p.date.slice(5).split('-').reverse().join('.'), TT.w));
      r++;
      put(r++, 1, upper(Bl.t('opinions')), TT.g);
      Bl.opinions.forEach((p, i) => row(201 + i, Bl.view(p).title, p.date.slice(5).split('-').reverse().join('.'), TT.w));
      r++;
      put(r++, 1, upper(Bl.t('gallery')), TT.g);
      put(r++, 1, fit(Bl.albums.map((a) => Bl.text(a.title)).join(' · '), 38), TT.w);
    } else {
      bar(2, TT.c, 2);
      put(2, 1, fit(upper(tt.weatherHead), 38), TT.k, null, true);
      tt.weather.forEach((w, i) => {
        const r = 6 + i * 2;
        put(r, 1, fit(w[0], 11), TT.y);
        put(r, 13, fit(w[1], 21), TT.w);
        put(r, 35, w[2], TT.c);
      });
      put(17, 1, tt.weatherNote, TT.g);
      put(19, 1, tt.hidden, TT.m);
    }
    // fastext row
    const ft = [TT.r, TT.g, TT.y, TT.c];
    tt.fastext.forEach((s, i) => put(23, i * 10, fit(s, 9), ft[i]));
  }

  ttWrap(text, n) {
    const words = text.split(/\s+/);
    const out = [];
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > n) {
        out.push(line.trim());
        line = w;
      } else line += ' ' + w;
    }
    if (line.trim()) out.push(line.trim());
    return out;
  }

  // ---------- 9 · Vanya TV (the hidden channel)
  drawVanya(ctx, t) {
    const Lx = L();
    const v = Lx.vanya;
    ctx.fillStyle = '#020a04';
    ctx.fillRect(0, 0, W, H);
    {
      const breathe = 1 + Math.sin(t / 680) * 0.012;
      ctx.save();
      ctx.translate(W / 2 - 10, 470);
      ctx.scale(1, breathe);
      if (this.catImg) {
        const iw = 760;
        const ih = (iw * this.catImg.height) / this.catImg.width;
        ctx.drawImage(this.catImg, -iw / 2, -ih, iw, ih);
      } else {
        // still developing the film: a soft sleeping silhouette
        this.needCat?.();
        ctx.fillStyle = '#e8ddcc';
        ctx.beginPath();
        ctx.ellipse(-40, -100, 260, 110, 0, Math.PI, 0);
        ctx.lineTo(220, 0);
        ctx.lineTo(-300, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(210, -95, 95, 88, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(140, -150);
        ctx.lineTo(150, -235);
        ctx.lineTo(205, -175);
        ctx.moveTo(230, -178);
        ctx.lineTo(285, -232);
        ctx.lineTo(292, -145);
        ctx.fill();
        ctx.strokeStyle = '#2a1d16';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(180, -98, 16, 0.2, Math.PI - 0.2);
        ctx.moveTo(262, -98);
        ctx.arc(246, -98, 16, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
      ctx.restore();
      // night vision
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#5dff7a';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 560);
      g.addColorStop(0, 'rgba(40,120,50,.35)');
      g.addColorStop(1, 'rgba(0,20,5,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    // Zzz
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const p = ((t / 2600 + i / 3) % 1);
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9;
      ctx.fillStyle = '#c8ffd0';
      ctx.font = `${22 + p * 26}px ${F.osd}`;
      ctx.fillText('z', 800 + p * 70 + Math.sin(p * 6 + i) * 10, 300 - p * 110);
    }
    ctx.globalAlpha = 1;
    // camcorder brackets
    ctx.strokeStyle = 'rgba(210,255,215,.85)';
    ctx.lineWidth = 4;
    const br = (x, y, dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * 40);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * 40, y);
      ctx.stroke();
    };
    br(80, 70, 1, 1);
    br(880, 70, -1, 1);
    br(80, 590, 1, -1);
    br(880, 590, -1, -1);
    ctx.textAlign = 'left';
    ctx.font = `20px ${F.osd}`;
    if (Math.floor(t / 700) % 2 === 0) {
      ctx.fillStyle = '#ff3b30';
      ctx.beginPath();
      ctx.arc(116, 112, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e8ffe9';
    ctx.fillText(v.rec, 136, 113);
    ctx.textAlign = 'right';
    const days = Math.floor((Date.now() - Date.UTC(2026, 1, 22)) / 864e5);
    ctx.fillText(`${v.day} ${days}  ${clock()}`, 850, 113);
    ctx.textAlign = 'center';
    ctx.font = `16px ${F.osd}`;
    ctx.fillText(v.title, W / 2, 160);
    ctx.fillStyle = '#9dffae';
    ctx.fillText(v.live, W / 2, 540);
    // schedule crawl
    ctx.fillStyle = 'rgba(0,0,0,.75)';
    ctx.fillRect(0, 614, W, 46);
    ctx.font = `${this.compact ? 22 : 17}px ${F.osd}`;
    ctx.fillStyle = '#e8ffe9';
    ctx.textAlign = 'left';
    const s = v.schedule + '   ';
    const tw = ctx.measureText(s).width;
    const off = ((t / 1000) * 80) % tw;
    for (let k = 0; k < 3; k++) ctx.fillText(s, 60 - off + k * tw, 638);
  }

  drawAV(ctx) {
    ctx.fillStyle = '#1434c8';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `52px ${F.osd}`;
    ctx.fillText('AV', W / 2, 300);
    ctx.font = `24px ${F.osd}`;
    ctx.fillText(L().noSignal, W / 2, 380);
  }

  // ---------- title card shown while the camera dives into the screen
  drawCard(ctx, t) {
    const c = this.card;
    ctx.fillStyle = '#121514';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 620);
    g.addColorStop(0, 'rgba(40,46,42,.6)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = c.accent;
    ctx.font = `600 ${this.compact ? 26 : 18}px ${F.sans}`;
    this.centerSpaced(ctx, c.kicker.toUpperCase(), W / 2, 300, 3);
    ctx.fillStyle = '#efe8da';
    const tf = this.compact ? 60 : 50;
    ctx.font = `600 ${tf}px ${F.read}`;
    const maxW = this.compact ? 520 : 760;
    const lines = clampLines(ctx, wrap(ctx, c.title, maxW), 3, maxW);
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, 370 + i * tf * 1.2));
  }

  centerSpaced(ctx, text, cx, y, sp) {
    const chars = [...text];
    const w = chars.reduce((s, ch) => s + ctx.measureText(ch).width + sp, -sp);
    ctx.textAlign = 'left';
    this.spaced(ctx, text, cx - w / 2, y, sp);
    ctx.textAlign = 'center';
  }

  // ---------- on-screen display (green/white, the classic kind)
  drawOsd(ctx, t, opts = {}) {
    const o = this.osd;
    if (!o || t > o.until) return;
    const Lx = L();
    const fade = Math.min(1, (o.until - t) / 300);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const green = '#3dff5c';
    const text = (s, x, y, size, col = '#fff', align = 'left') => {
      ctx.font = `${size}px ${F.osd}`;
      ctx.textAlign = align;
      ctx.fillStyle = 'rgba(0,0,0,.85)';
      ctx.fillText(s, x + size * 0.14, y + size * 0.14);
      ctx.fillStyle = col;
      ctx.fillText(s, x, y);
    };
    const k = this.compact ? 1.3 : 1;
    if (o.type === 'channel' || o.type === 'info') {
      const d = o.data;
      text(String(d.num), 84, 70, 58 * k, green);
      text(d.name, 84, 70 + 72 * k, 18 * k, '#fff');
      if (o.type === 'info') {
        ctx.fillStyle = 'rgba(0,0,0,.72)';
        ctx.fillRect(70, 560, 820, 92);
        text(d.title || '', 92, 578, 18 * k, '#fff');
        text(clock(), 92, 616, 16 * k, green);
      }
    } else if (o.type === 'volume') {
      const d = o.data;
      const n = 20;
      const bw = 22;
      const gap = 8;
      const total = n * (bw + gap) - gap;
      const x0 = 480 - total / 2;
      const y0 = 584;
      text(d.muted ? Lx.osdMuted : Lx.osdVol, x0, y0 - 40 * k, 18 * k, d.muted ? '#ff8a7a' : '#fff');
      for (let i = 0; i < n; i++) {
        const on = i < d.level;
        ctx.fillStyle = 'rgba(0,0,0,.8)';
        ctx.fillRect(x0 + i * (bw + gap) + 3, y0 + 3, bw, 40);
        ctx.fillStyle = on ? (d.muted ? '#5d8a63' : green) : '#123a18';
        ctx.fillRect(x0 + i * (bw + gap), y0, bw, 40);
      }
    } else if (o.type === 'mute') {
      const d = o.data;
      // speaker glyph
      const x = 780;
      const y = 76;
      ctx.fillStyle = 'rgba(0,0,0,.85)';
      ctx.fillRect(x + 4, y + 16, 22, 28);
      ctx.fillStyle = d.muted ? '#ff6b5b' : green;
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x + 18, y + 14);
      ctx.lineTo(x + 40, y - 6);
      ctx.lineTo(x + 40, y + 62);
      ctx.lineTo(x + 18, y + 42);
      ctx.lineTo(x, y + 42);
      ctx.closePath();
      ctx.fill();
      if (d.muted) {
        ctx.strokeStyle = '#ff6b5b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + 52, y + 10);
        ctx.lineTo(x + 80, y + 46);
        ctx.moveTo(x + 80, y + 10);
        ctx.lineTo(x + 52, y + 46);
        ctx.stroke();
      } else {
        ctx.strokeStyle = green;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x + 44, y + 28, 18, -0.8, 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 44, y + 28, 32, -0.8, 0.8);
        ctx.stroke();
      }
      text(d.muted ? Lx.osdMuted : Lx.osdVol, 880, 150, 16 * k, d.muted ? '#ff8a7a' : '#fff', 'right');
    } else if (o.type === 'lang') {
      const track = Lx.osdTrack;
      ctx.fillStyle = 'rgba(0,0,0,.72)';
      ctx.fillRect(250, 300, 460, 120);
      text(Lx.osdLang, 480, 318, 18 * k, '#fff', 'center');
      ctx.fillStyle = green;
      ctx.fillRect(316, 356, track.length * 26 + 22, 44);
      ctx.font = `26px ${F.osd}`;
      ctx.fillStyle = '#04180a';
      ctx.textAlign = 'left';
      ctx.fillText(track, 327, 366);
      text(Lx.osdLangName, 330 + track.length * 26 + 40, 366, 22 * k, green);
    }
    ctx.restore();
  }

  average() {
    const c = this.avgCtx;
    c.drawImage(this.canvas, 0, 0, 6, 4);
    const d = c.getImageData(0, 0, 6, 4).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
    }
    const n = d.length / 4;
    return [r / n, g / n, b / n];
  }
}
