// The living room: procedural textures + SVG illustration.
// Procedural textures: walnut veneer, paper grain, cross-stitch "goblen".
// Everything is generated once into canvases and handed out as object URLs,
// so the static scene never re-runs filters while the camera moves.

function hasher(seed) {
  return (x, y) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed) {
  const hash = hasher(seed);
  const vnoise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, oct = 4) => {
    let s = 0;
    let a = 0.5;
    let f = 1;
    let norm = 0;
    for (let i = 0; i < oct; i++) {
      s += a * vnoise(x * f, y * f);
      norm += a;
      f *= 2.03;
      a *= 0.5;
    }
    return s / norm;
  };
  return { vnoise, fbm, hash };
}

const mix = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function toURL(canvas, type = 'image/jpeg', q = 0.9) {
  return new Promise((res) => {
    canvas.toBlob((b) => res(URL.createObjectURL(b)), type, q);
  });
}

/**
 * Flat-sawn walnut. Grain runs along x.
 * palette: [light, mid, dark] rgb arrays.
 */
function wood(w, h, { seed = 1, palette, ringFreq = 0.045, warp = 60, figure = 1, pores = 1 } = {}) {
  const { vnoise, fbm } = makeNoise(seed);
  const [L, M, D] = palette;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const data = img.data;
  // Coarse warp field, interpolated (cheap and smooth).
  const gx = 48;
  const gy = 24;
  const grid = new Float32Array((gx + 1) * (gy + 1));
  for (let j = 0; j <= gy; j++)
    for (let i = 0; i <= gx; i++) grid[j * (gx + 1) + i] = fbm(i * 0.11, j * 0.35, 4) * 2 - 1;
  const warpAt = (x, y) => {
    const fx = (x / w) * gx;
    const fy = (y / h) * gy;
    const i = Math.min(gx - 1, Math.floor(fx));
    const j = Math.min(gy - 1, Math.floor(fy));
    const tx = fx - i;
    const ty = fy - j;
    const a = grid[j * (gx + 1) + i];
    const b = grid[j * (gx + 1) + i + 1];
    const c = grid[(j + 1) * (gx + 1) + i];
    const d = grid[(j + 1) * (gx + 1) + i + 1];
    return mix(mix(a, b, tx), mix(c, d, tx), ty);
  };
  let p = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const wv = warpAt(x, y);
      const ring = (y + wv * warp + (vnoise(x * 0.01, y * 0.04) - 0.5) * 10) * ringFreq;
      const g = ring - Math.floor(ring);
      // latewood: sharp dark line that fades into earlywood
      const late = Math.pow(1 - g, 7) + smooth(0.86, 1, g) * 0.6;
      const fib = vnoise(x * 0.035, y * 1.25);
      const fib2 = vnoise(x * 0.09 + 31, y * 3.1);
      const fig = fbm(x * 0.006 + 7, y * 0.02, 3);
      let t = 0.32 + late * 0.42 + (fib - 0.5) * 0.22 + (fib2 - 0.5) * 0.1 + (fig - 0.5) * 0.45 * figure;
      // pores: elongated dark flecks
      const pr = vnoise(x * 0.22 + 91, y * 2.2);
      if (pr > 0.86) t += (pr - 0.86) * 2.4 * pores;
      t = clamp01(t);
      let r;
      let gg;
      let b;
      if (t < 0.5) {
        const k = t / 0.5;
        r = mix(L[0], M[0], k);
        gg = mix(L[1], M[1], k);
        b = mix(L[2], M[2], k);
      } else {
        const k = (t - 0.5) / 0.5;
        r = mix(M[0], D[0], k);
        gg = mix(M[1], D[1], k);
        b = mix(M[2], D[2], k);
      }
      data[p++] = r;
      data[p++] = gg;
      data[p++] = b;
      data[p++] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

function rotate90(src) {
  const cv = document.createElement('canvas');
  cv.width = src.height;
  cv.height = src.width;
  const ctx = cv.getContext('2d');
  ctx.translate(cv.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return cv;
}

/** Monochrome grain tile (transparent PNG) used for paper, plastic and film grain. */
function grain(size = 256, { seed = 3, amount = 1, scale = 1 } = {}) {
  const { vnoise, hash } = makeNoise(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  let p = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // tileable: blend hash at wrapped coords
      const n = hash(x, y) * 0.7 + vnoise((x % size) * 0.25 * scale, (y % size) * 0.25 * scale) * 0.3;
      const v = n > 0.5 ? 255 : 0;
      d[p++] = v;
      d[p++] = v;
      d[p++] = v;
      d[p++] = Math.abs(n - 0.5) * 2 * 60 * amount;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/** Wallpaper paper fibres + mottling, multiplied over the pattern. */
function paper(size = 512, seed = 9) {
  const { fbm, vnoise, hash } = makeNoise(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  let p = 0;
  const period = size / 16;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // tileable fbm by blending four samples
      const fx = x / size;
      const fy = y / size;
      const s = (xx, yy) => fbm(xx / period, yy / period, 4);
      const m =
        s(x, y) * (1 - fx) * (1 - fy) +
        s(x - size, y) * fx * (1 - fy) +
        s(x, y - size) * (1 - fx) * fy +
        s(x - size, y - size) * fx * fy;
      const fib = vnoise(x * 0.9, y * 0.12) * 0.5 + hash(x, y) * 0.5;
      const v = 0.82 + (m - 0.5) * 0.3 + (fib - 0.5) * 0.1;
      const c = Math.round(clamp01(v) * 255);
      d[p++] = c;
      d[p++] = c;
      d[p++] = Math.round(c * 0.98);
      d[p++] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/**
 * Cross-stitch tapestry ("гоблен") from a photo: every pixel of a tiny
 * downsample becomes an X of two twisted threads on aida cloth.
 */
async function goblen(src, cols = 46, rows = 36, cell = 12) {
  const img = await loadImage(src);
  const small = document.createElement('canvas');
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  const ar = img.width / img.height;
  const tar = cols / rows;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ar > tar) {
    sw = img.height * tar;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tar;
    sy = (img.height - sh) / 2;
  }
  sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  const px = sctx.getImageData(0, 0, cols, rows).data;
  const cv = document.createElement('canvas');
  cv.width = cols * cell;
  cv.height = rows * cell;
  const ctx = cv.getContext('2d');
  // aida cloth
  ctx.fillStyle = '#d9cdb4';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = 'rgba(90,70,40,.25)';
  for (let i = 0; i <= cols; i++) ctx.fillRect(i * cell - 0.5, 0, 1, cv.height);
  for (let j = 0; j <= rows; j++) ctx.fillRect(0, j * cell - 0.5, cv.width, 1);
  const { hash } = makeNoise(17);
  // quantise to a thread palette for the hand-made look
  const q = (v) => Math.round(v / 28) * 28;
  ctx.lineCap = 'round';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      // warm, slightly saturated like DMC floss
      let r = q(px[k] * 1.04 + 6);
      let g = q(px[k + 1] * 0.98);
      let b = q(px[k + 2] * 0.9);
      const x = i * cell;
      const y = j * cell;
      const pad = 1.6;
      const jit = (hash(i, j) - 0.5) * 0.8;
      // under stitch (darker)
      ctx.lineWidth = cell * 0.36;
      ctx.strokeStyle = `rgb(${r * 0.72 | 0},${g * 0.72 | 0},${b * 0.72 | 0})`;
      ctx.beginPath();
      ctx.moveTo(x + pad, y + cell - pad + jit);
      ctx.lineTo(x + cell - pad, y + pad);
      ctx.stroke();
      // top stitch
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = cell * 0.34;
      ctx.beginPath();
      ctx.moveTo(x + pad, y + pad + jit);
      ctx.lineTo(x + cell - pad, y + cell - pad);
      ctx.stroke();
      // thread sheen
      ctx.strokeStyle = 'rgba(255,245,225,.22)';
      ctx.lineWidth = cell * 0.08;
      ctx.beginPath();
      ctx.moveTo(x + pad + 1.2, y + pad + 0.4);
      ctx.lineTo(x + cell - pad - 0.4, y + cell - pad - 1.2);
      ctx.stroke();
    }
  }
  return toURL(cv, 'image/jpeg', 0.88);
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}


// The living room, painted in SVG on top of procedural textures.
// Stage units: 1760 × 1100. The TV sits at (400, 270), 800 × 600.

export const TV = { x: 400, y: 270, w: 800, h: 600 };
export const OPENING =
  'M92,56 Q330,51.5 568,56 Q604,56 604,92 Q608.5,261.5 604,431 Q604,467 568,467 Q330,471.5 92,467 Q56,467 56,431 Q51.5,261.5 56,92 Q56,56 92,56 Z';

function wallpaperTile() {
  // folk rosette + tulip sprig, half-drop, between gilt pinstripes
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a = i * 45;
    return `<ellipse cx="0" cy="-13" rx="5.6" ry="10.5" transform="rotate(${a})"/>`;
  }).join('');
  const inner = Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-7" rx="2.4" ry="4.6" transform="rotate(${i * 45 + 22.5})"/>`).join('');
  const dots = Array.from({ length: 20 }, (_, i) => `<circle cx="11" cy="${i * 12 + 6}" r="1.5"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240" viewBox="0 0 160 240">
  <rect width="160" height="240" fill="#b89366"/>
  <rect width="22" height="240" fill="#a9845a"/>
  <rect x="4.5" width="1.3" height="240" fill="#dcbb84" opacity=".75"/>
  <rect x="16.2" width="1.3" height="240" fill="#dcbb84" opacity=".75"/>
  <g fill="#c9a571">${dots}</g>
  <g transform="translate(91 66)">
    <path d="M-4 16 C-18 26 -30 24 -36 16 C-26 12 -14 12 -4 16 Z M4 16 C18 26 30 24 36 16 C26 12 14 12 4 16 Z" fill="#a98458" stroke="#8d6b43" stroke-width=".7"/>
    <path d="M0 14 V34" stroke="#8d6b43" stroke-width="1.4"/>
    <g fill="#c9a676" stroke="#8d6b43" stroke-width=".8">${petals}</g>
    <g fill="#b38c5c">${inner}</g>
    <circle r="3.6" fill="#8d6b43"/>
    <circle r="1.4" fill="#d8b985"/>
  </g>
  <g transform="translate(91 186)" stroke="#8d6b43" stroke-width=".8">
    <path d="M0 6 V30" stroke-width="1.3" fill="none"/>
    <path d="M0 22 C-8 14 -18 16 -22 22 C-14 26 -6 26 0 22 Z M0 26 C8 18 18 20 22 26 C14 30 6 30 0 26 Z" fill="#a98458"/>
    <path d="M0 8 C-9 6 -12 -6 -8 -14 C-5 -8 -3 -6 0 -6 C3 -6 5 -8 8 -14 C12 -6 9 6 0 8 Z" fill="#c9a676"/>
    <path d="M0 -6 C-3 -10 -2 -16 0 -20 C2 -16 3 -10 0 -6 Z" fill="#b38c5c"/>
  </g>
  <g transform="translate(11 126)" fill="#c9a571" opacity=".0"></g>
</svg>`;
  return svg;
}

function svgImage(markup, w, h) {
  const m = markup
    .replace(/\sclass="[^"]*"/, '')
    .replace(/\sstyle="[^"]*"/, '')
    .replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `)
    .replace(/\saria-hidden="true"/, '');
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(m);
  });
}

/**
 * The wall is painted once into a canvas: wallpaper, paper fibres, lamp falloff (multiply)
 * and lamp glow (screen). Canvas compositing instead of CSS blend modes keeps the
 * compositor idle while the telly animates.
 */
// The wallpaper is painted offscreen and shown as a plain <img>. A big on-page canvas gets promoted to its own
// compositor layer, which forced the stage, remote and TV body onto huge layers of their own; on Android that blew
// the GPU tile budget and parts of the room blinked out for a frame. A static image needs no layer.
async function makeWall(img) {
  const cv = document.createElement('canvas');
  let url = null;
  const tileSvg = wallpaperTile();
  const [tileImg, darkImg, warmImg] = await Promise.all([
    new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(tileSvg);
    }),
    svgImage(wallFxSVG(), 4560, 3000),
    svgImage(wallLightSVG(), 1300, 1400),
  ]);
  const paperCv = paper(384, 9);
  return {
    paint(vw0, vh0, s, ox0, oy0, m = 28) {
      // painted with a margin so the parallax drift never shows an edge
      const vw = vw0 + m * 2;
      const vh = vh0 + m * 2;
      const ox = ox0 + m;
      const oy = oy0 + m;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.ceil(vw * dpr);
      const H = Math.ceil(vh * dpr);
      if (cv.width !== W || cv.height !== H) {
        cv.width = W;
        cv.height = H;
      }
      const c = cv.getContext('2d');
      const k = s * dpr;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#b89366';
      c.fillRect(0, 0, W, H);
      c.setTransform(k, 0, 0, k, ox * dpr, oy * dpr);
      const x0 = -ox / s;
      const y0 = -oy / s;
      const w = vw / s;
      const h = vh / s;
      const tk = Math.max(0.3, Math.min(3, k));
      const tc = document.createElement('canvas');
      tc.width = Math.round(160 * tk);
      tc.height = Math.round(240 * tk);
      tc.getContext('2d').drawImage(tileImg, 0, 0, tc.width, tc.height);
      const pat = c.createPattern(tc, 'repeat');
      pat.setTransform(new DOMMatrix().scaleSelf(160 / tc.width, 240 / tc.height));
      c.fillStyle = pat;
      c.fillRect(x0, y0, w, h);
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = c.createPattern(paperCv, 'repeat');
      c.fillRect(x0, y0, w, h);
      c.drawImage(darkImg, -1400, -900, 4560, 3000);
      c.globalCompositeOperation = 'screen';
      c.drawImage(warmImg, -400, -400, 1300, 1400);
      c.globalCompositeOperation = 'source-over';
      if (BAKE_VIGNETTE) {
        // touch devices skip the full-screen .lens overlay (another big layer); keep its vignette on the wall
        c.setTransform(vw0 * 0.75 * dpr, 0, 0, vh0 * 0.7 * dpr, (m + vw0 * 0.5) * dpr, (m + vh0 * 0.46) * dpr);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0.55, 'rgba(6, 3, 1, 0)');
        g.addColorStop(1, 'rgba(6, 3, 1, 0.5)');
        c.fillStyle = g;
        c.fillRect(-4, -4, 8, 8);
      }
      cv.toBlob(
        (blob) => {
          if (!blob) return;
          const prev = url;
          url = URL.createObjectURL(blob);
          img.onload = () => prev && URL.revokeObjectURL(prev);
          img.src = url;
        },
        'image/jpeg',
        0.92,
      );
    },
  };
}

const BAKE_VIGNETTE = window.matchMedia('(hover: none), (pointer: coarse)').matches;

function leafPath(x, y, size, angleDeg) {
  // heart-shaped pothos leaf, base at (0,0) pointing up (-y)
  const pts = [
    [0, 0],
    [-0.16, 0.1, -0.58, 0.06, -0.62, -0.3],
    [-0.68, -0.78, -0.2, -1.02, 0.02, -1.28],
    [0.2, -1.0, 0.66, -0.76, 0.62, -0.3],
    [0.56, 0.06, 0.15, 0.1, 0, 0],
  ];
  const a = (angleDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const T = (px, py) => {
    const X = px * size;
    const Y = py * size;
    return `${(x + X * ca - Y * sa).toFixed(1)},${(y + X * sa + Y * ca).toFixed(1)}`;
  };
  let d = `M${T(0, 0)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    d += ` C${T(p[0], p[1])} ${T(p[2], p[3])} ${T(p[4], p[5])}`;
  }
  const rib = `M${T(0, -0.04)} Q${T(0.06, -0.6)} ${T(0.02, -1.2)}`;
  const vein = `M${T(0.01, -0.35)} Q${T(0.3, -0.45)} ${T(0.44, -0.62)} M${T(0.02, -0.6)} Q${T(-0.26, -0.7)} ${T(-0.38, -0.86)} M${T(0.01, -0.3)} Q${T(-0.3, -0.36)} ${T(-0.46, -0.5)}`;
  const vari = `M${T(0.02, -0.2)} Q${T(0.3, -0.5)} ${T(0.36, -0.9)} M${T(-0.02, -0.4)} Q${T(-0.2, -0.7)} ${T(-0.12, -1.0)}`;
  return { d, rib, vein, vari };
}

function leaves(list, gradId) {
  return list
    .map(([x, y, s, a, shade = 0]) => {
      const L = leafPath(x, y, s, a);
      return `<g>
        <path d="${L.d}" fill="url(#${gradId})"/>
        <path d="${L.vari}" stroke="#e7e19a" stroke-opacity=".35" stroke-width="${(s * 0.07).toFixed(1)}" fill="none" stroke-linecap="round"/>
        <path d="${L.d}" fill="#0b1a08" opacity="${shade}"/>
        <path d="${L.rib}" stroke="#cfe3a0" stroke-opacity=".55" stroke-width="1.2" fill="none"/>
        <path d="${L.vein}" stroke="#cfe3a0" stroke-opacity=".25" stroke-width=".8" fill="none"/>
      </g>`;
    })
    .join('');
}

function lace() {
  // crocheted doily hanging over the TV's front edge (stage coords, x 520..1090)
  const x0 = 524;
  const x1 = 1086;
  const n = 15;
  const sw = (x1 - x0) / n;
  let mesh = '';
  for (let x = x0 - 40; x < x1 + 40; x += 11) {
    mesh += `M${x},276 L${x + 20},296 M${x + 20},276 L${x},296 `;
  }
  let scal = '';
  let fans = '';
  let picots = '';
  let roses = '';
  for (let i = 0; i < n; i++) {
    const a = x0 + i * sw;
    const b = a + sw;
    const m = (a + b) / 2;
    scal += `M${a},296 C${a + 2},316 ${b - 2},316 ${b},296 `;
    for (let k = 1; k < 6; k++) {
      const tt = k / 6;
      const ang = Math.PI * tt;
      const ex = m - Math.cos(ang) * (sw / 2) * 0.92;
      const ey = 296 + Math.sin(ang) * 15.5;
      fans += `M${m},298 L${ex.toFixed(1)},${ey.toFixed(1)} `;
    }
    for (let k = 0; k <= 8; k++) {
      const ang = (Math.PI * k) / 8;
      const ex = m - Math.cos(ang) * (sw / 2) * 1.02;
      const ey = 296 + Math.sin(ang) * 17.2;
      picots += `<circle cx="${ex.toFixed(1)}" cy="${(ey + 1.4).toFixed(1)}" r="1.6"/>`;
    }
    roses += `<g transform="translate(${m.toFixed(1)} 287)">${[0, 72, 144, 216, 288]
      .map((r) => `<ellipse cx="0" cy="-3.2" rx="2" ry="3.2" transform="rotate(${r})"/>`)
      .join('')}</g>`;
  }
  const g = `<g fill="none" stroke-linecap="round">
      <path d="M${x0},266 H${x1}" stroke-width="7"/>
      <path d="M${x0},274 H${x1}" stroke-width="2.2"/>
      <path d="${mesh}" stroke-width="1.5" clip-path="url(#laceClip)"/>
      <path d="M${x0},296 H${x1}" stroke-width="2"/>
      <path d="${scal}" stroke-width="2.6"/>
      <path d="${fans}" stroke-width="1.3"/>
    </g>
    <g stroke="none">${picots}</g>
    <g stroke="none">${roses}</g>`;
  return `<svg class="doily" viewBox="500 250 610 80" style="left:500px;top:250px;width:610px;height:80px" aria-hidden="true">
    <defs>
      <clipPath id="laceClip"><rect x="${x0}" y="276" width="${x1 - x0}" height="20"/></clipPath>
      <linearGradient id="laceG" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x1}" y2="0">
        <stop offset="0" stop-color="#fbf1dc"/><stop offset=".55" stop-color="#e3d5b8"/><stop offset="1" stop-color="#b6a586"/>
      </linearGradient>
      <filter id="laceShadow" x="-5%" y="-30%" width="110%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.4"/>
        <feOffset dx="2.5" dy="2.6" result="s"/>
        <feColorMatrix in="s" type="matrix" values="0 0 0 0 0.06 0 0 0 0 0.03 0 0 0 0 0.01 0 0 0 .75 0"/>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#laceShadow)" stroke="url(#laceG)" fill="url(#laceG)">${g}</g>
    <path d="M${x0},263.5 H${x1}" stroke="#fff8e8" stroke-opacity=".7" stroke-width="1.4"/>
  </svg>`;
}

function catBodySVG() {
  return `<svg class="cat cat-body" viewBox="0 0 420 220" aria-hidden="true">
  <defs>
    <filter id="fur" x="-6%" y="-8%" width="112%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6 0.16" numOctaves="2" seed="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" result="disp"/>
      <feTurbulence type="fractalNoise" baseFrequency="2.1 0.42" numOctaves="2" seed="11" result="fine"/>
      <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0 0.03  1.25 0 0 0 -0.66" result="strands"/>
      <feComposite in="strands" in2="disp" operator="atop"/>
    </filter>
    <clipPath id="bodyClip"><path id="bodyShape" d="M36,214 C16,182 20,128 58,100 C96,70 160,58 222,62 C262,64 296,80 314,104 C330,128 336,170 334,214 Z"/></clipPath>
    <radialGradient id="catLight" cx="110" cy="70" r="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffd9a6" stop-opacity=".42"/><stop offset=".6" stop-color="#ffd9a6" stop-opacity=".05"/><stop offset="1" stop-color="#ffd9a6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="catBottom" x1="0" y1="120" x2="0" y2="210" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1a0c05" stop-opacity="0"/><stop offset="1" stop-color="#1a0c05" stop-opacity=".62"/>
    </linearGradient>
    <linearGradient id="catRight" x1="180" y1="0" x2="340" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0d0705" stop-opacity="0"/><stop offset="1" stop-color="#0d0705" stop-opacity=".42"/>
    </linearGradient>
  </defs>
  <g filter="url(#fur)">
    <g clip-path="url(#bodyClip)">
      <rect width="420" height="220" fill="#e6dac6"/>
      <path d="M22,170 C26,112 76,84 128,86 C164,88 176,120 152,144 C128,166 84,150 56,210 L20,214 Z" fill="#221a16"/>
      <path d="M116,72 C168,54 238,56 276,78 C286,100 254,114 218,110 C182,106 162,126 132,120 C108,114 100,86 116,72 Z" fill="#b8642d"/>
      <ellipse cx="96" cy="196" rx="30" ry="13" fill="#b8642d"/>
      <path d="M150,96 C170,92 196,94 214,100" stroke="#8e4519" stroke-width="5" fill="none" opacity=".5"/>
      <path d="M140,108 C160,104 182,106 200,112" stroke="#8e4519" stroke-width="4" fill="none" opacity=".4"/>
      <path d="M64,214 C52,176 72,130 122,124 C168,120 198,152 194,214" stroke="#0d0705" stroke-opacity=".28" stroke-width="5" fill="none"/>
      <path d="M78,150 C92,132 116,128 136,132" stroke="#fff3df" stroke-opacity=".25" stroke-width="4" fill="none"/>
      <ellipse cx="240" cy="196" rx="34" ry="12" fill="#f1e8da"/>
      <rect width="420" height="220" fill="url(#catLight)"/>
      <rect width="420" height="220" fill="url(#catRight)"/>
      <rect width="420" height="220" fill="url(#catBottom)"/>
      <radialGradient id="neckShade" cx="300" cy="150" r="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0d0705" stop-opacity=".45"/><stop offset="1" stop-color="#0d0705" stop-opacity="0"/></radialGradient>
      <rect width="420" height="220" fill="url(#neckShade)"/>
    </g>
  </g>
  <path d="M60,98 C98,70 160,60 222,64" stroke="#ffe7c4" stroke-opacity=".35" stroke-width="2" fill="none"/>
</svg>`;
}

function catHeadSVG() {
  return `<svg class="cat cat-head" viewBox="0 0 420 220" aria-hidden="true">
  <defs>
    <filter id="furHead" x="-6%" y="-8%" width="112%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7 0.5" numOctaves="2" seed="5" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="disp"/>
      <feTurbulence type="fractalNoise" baseFrequency="2.4 0.9" numOctaves="2" seed="21" result="fine"/>
      <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0 0.03  1.15 0 0 0 -0.64" result="strands"/>
      <feComposite in="strands" in2="disp" operator="atop"/>
    </filter>
    <clipPath id="headClip"><path d="M268,162 C262,126 286,100 320,100 C356,100 378,124 374,160 C372,190 350,212 320,212 C292,212 272,192 268,162 Z"/></clipPath>
    <linearGradient id="headLight" x1="270" y1="100" x2="370" y2="210" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffdcae" stop-opacity=".32"/><stop offset=".5" stop-color="#ffdcae" stop-opacity="0"/><stop offset="1" stop-color="#120804" stop-opacity=".5"/>
    </linearGradient>
  </defs>
  <g transform="translate(320 168) scale(1.13) translate(-320 -168)">
  <g filter="url(#furHead)">
    <g class="ear ear-l">
      <path d="M276,134 C274,112 278,92 285,80 C289,75 294,76 298,80 C306,92 313,102 318,108 Z" fill="#221a16"/>
      <path d="M284,122 C284,108 286,96 289,88 C293,94 300,102 305,108 Z" fill="#8f5f58"/>
    </g>
    <g class="ear ear-r">
      <path d="M326,106 C337,96 348,88 358,80 C362,77 366,79 367,83 C371,98 372,118 371,136 Z" fill="#b8642d"/>
      <path d="M336,108 C344,101 352,95 359,90 C361,100 362,112 362,122 Z" fill="#b57f74"/>
    </g>
    <g clip-path="url(#headClip)">
      <rect x="250" y="90" width="140" height="130" fill="#ece2d2"/>
      <path d="M262,170 C262,124 286,100 314,98 L320,128 C304,130 292,144 288,170 Z" fill="#221a16"/>
      <path d="M326,98 C356,100 380,122 378,154 C362,146 346,134 330,128 Z" fill="#b8642d"/>
      <path d="M300,126 C306,122 314,122 320,128" stroke="#2a1d16" stroke-opacity=".35" stroke-width="3" fill="none"/>
      <rect x="250" y="90" width="140" height="130" fill="url(#headLight)"/>
    </g>
  </g>
  <g class="eyes-closed" stroke="#2a1b14" stroke-width="2.6" stroke-linecap="round" fill="none">
    <path d="M289,151 Q299,158 309,151"/>
    <path d="M331,151 Q340,158 349,151"/>
    <path d="M289,151 l-3,-2 M349,151 l3,-2" stroke-width="1.6"/>
  </g>
  <g class="eye-open" opacity="0">
    <ellipse cx="340" cy="151" rx="9.5" ry="7" fill="#c8c24a"/>
    <ellipse cx="340" cy="151" rx="2.2" ry="6.4" fill="#120c08"/>
    <circle cx="343" cy="148" r="1.8" fill="#fff" opacity=".85"/>
    <path d="M330,146 Q340,141 350,146" stroke="#2a1b14" stroke-width="2.4" fill="none"/>
  </g>
  <ellipse cx="312" cy="173" rx="9" ry="6.5" fill="#fff8ee" opacity=".55"/>
  <ellipse cx="328" cy="173" rx="9" ry="6.5" fill="#fff8ee" opacity=".55"/>
  <path d="M314.5,164 Q320,162 325.5,164 Q323,170 320,171 Q317,170 314.5,164 Z" fill="#c77f7a"/>
  <path d="M320,171 Q317,176 312,174 M320,171 Q323,176 328,174" stroke="#6b4a40" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <g stroke="#fbf4e8" stroke-opacity=".72" stroke-width="1" fill="none" stroke-linecap="round">
    <path d="M306,172 Q284,166 258,166"/><path d="M306,175 Q284,175 256,178"/><path d="M307,178 Q286,182 262,190"/>
    <path d="M334,172 Q356,166 384,164"/><path d="M334,175 Q358,175 386,178"/><path d="M333,178 Q356,182 380,190"/>
  </g>
  </g>
</svg>`;
}

function catFrontSVG() {
  // the paw dangling over the edge
  return `<svg class="cat cat-paw" viewBox="0 0 420 260" aria-hidden="true">
  <defs>
    <linearGradient id="pawG" x1="0" y1="194" x2="0" y2="238" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#cdbfa8"/><stop offset=".35" stop-color="#efe6d6"/><stop offset="1" stop-color="#d9ccb6"/>
    </linearGradient>
    <filter id="pawShadow" x="-40%" y="-20%" width="180%" height="160%">
      <feDropShadow dx="3" dy="5" stdDeviation="3" flood-color="#0a0503" flood-opacity=".6"/>
    </filter>
  </defs>
  <g filter="url(#pawShadow)">
    <path d="M330,192 C328,212 331,228 340,234 C349,239 361,235 362,226 C363,214 357,201 355,192 Z" fill="url(#pawG)"/>
    <path d="M343,233 v-6 M350,235 v-6 M357,232 v-5" stroke="#9e8f79" stroke-width="1.3" stroke-linecap="round"/>
  </g>
</svg>`;
}

function antennaSVG() {
  const rod = (x0, y0, x1, y1) => {
    const segs = 3;
    let out = '';
    for (let i = 0; i < segs; i++) {
      const a = i / segs;
      const b = (i + 1) / segs;
      const ax = x0 + (x1 - x0) * a;
      const ay = y0 + (y1 - y0) * a;
      const bx = x0 + (x1 - x0) * b;
      const by = y0 + (y1 - y0) * b;
      const w = 5.2 - i * 1.3;
      out += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#3a3d40" stroke-width="${w + 1.4}" stroke-linecap="round"/>
              <line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="url(#chrome)" stroke-width="${w}" stroke-linecap="round"/>
              <line x1="${ax - 1}" y1="${ay}" x2="${bx - 1}" y2="${by}" stroke="#fff" stroke-opacity=".7" stroke-width="${Math.max(0.8, w * 0.28)}" stroke-linecap="round"/>`;
      if (i > 0) out += `<circle cx="${ax}" cy="${ay}" r="${w * 0.75 + 1}" fill="#c9ccce" stroke="#4b4f53" stroke-width=".8"/>`;
    }
    out += `<circle cx="${x1}" cy="${y1}" r="5.4" fill="url(#ball)" stroke="#3a3d40" stroke-width=".8"/>`;
    return out;
  };
  return `<svg class="antenna" viewBox="660 0 480 280" style="left:660px;top:0;width:480px;height:280px" aria-hidden="true">
    <defs>
      <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3f5f6"/><stop offset=".5" stop-color="#9da3a8"/><stop offset="1" stop-color="#e6e9eb"/></linearGradient>
      <radialGradient id="ball" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#b7bcc0"/><stop offset="1" stop-color="#4b4f53"/></radialGradient>
      <linearGradient id="baseG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3f38"/><stop offset=".5" stop-color="#231c18"/><stop offset="1" stop-color="#0f0b09"/></linearGradient>
    </defs>
    ${rod(898, 252, 742, 18)}
    ${rod(918, 252, 1088, 36)}
    <path d="M868,276 C868,252 882,240 908,240 C934,240 948,252 948,276 Z" fill="url(#baseG)"/>
    <path d="M878,258 C884,248 896,244 908,244" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none"/>
    <rect x="896" y="236" width="24" height="10" rx="3" fill="#2a221d"/>
  </svg>`;
}

function plantBackSVG() {
  const top = [
    [1072, 186, 46, -58, 0.25],
    [1100, 182, 50, 38, 0.2],
    [1086, 180, 54, -22, 0.12],
    [1110, 184, 44, 66, 0.3],
    [1062, 188, 42, -84, 0.35],
    [1094, 178, 58, 6, 0],
    [1078, 182, 48, -38, 0.05],
    [1118, 186, 40, 88, 0.38],
  ];
  const stems = top
    .map(([x, y, s, a]) => {
      const r = (a * Math.PI) / 180;
      return `M1090,196 Q${(1090 + (x - 1090) * 0.5).toFixed(1)},${(190 - 6).toFixed(1)} ${x},${y}`;
    })
    .join(' ');
  return `<svg class="plant plant-back" viewBox="980 80 260 200" style="left:980px;top:80px;width:260px;height:200px" aria-hidden="true">
    <defs>
      <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8bc25b"/><stop offset=".5" stop-color="#4f8a35"/><stop offset="1" stop-color="#2b5521"/></linearGradient>
      <linearGradient id="potG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#d48455"/><stop offset=".3" stop-color="#b8663d"/><stop offset=".75" stop-color="#8a4427"/><stop offset="1" stop-color="#5e2c18"/>
      </linearGradient>
      <linearGradient id="rimG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e09468"/><stop offset=".35" stop-color="#c47249"/><stop offset="1" stop-color="#6e351e"/>
      </linearGradient>
      <filter id="plantShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="7" dy="5" stdDeviation="4" flood-color="#120804" flood-opacity=".5"/></filter>
    </defs>
    <g filter="url(#plantShadow)">
      <path d="M1038,198 L1046,276 L1134,276 L1142,198 Z" fill="url(#potG)"/>
      <path d="M1046,226 L1134,226" stroke="#5e2c18" stroke-opacity=".35" stroke-width="2"/>
      <rect x="1030" y="186" width="120" height="16" rx="3" fill="url(#rimG)"/>
      <path d="M1033,188 H1147" stroke="#f3b58c" stroke-opacity=".5" stroke-width="1.5"/>
      <path d="${stems}" stroke="#5f8a34" stroke-width="2.4" fill="none"/>
      ${leaves(top, 'leafG')}
    </g>
  </svg>`;
}

function plantFrontSVG() {
  // trailing vines over the TV's right side
  const vine1 = 'M1144,192 C1178,196 1196,232 1194,292 C1192,352 1182,420 1196,500 C1202,540 1206,560 1200,590';
  const vine2 = 'M1132,196 C1160,206 1172,250 1168,310 C1166,360 1174,400 1170,440';
  const v1 = [
    [1186, 228, 34, 120, 0.1],
    [1196, 270, 36, 205, 0.2],
    [1190, 316, 34, 150, 0.15],
    [1188, 360, 32, 215, 0.25],
    [1186, 404, 33, 150, 0.2],
    [1192, 452, 30, 210, 0.3],
    [1198, 500, 30, 160, 0.25],
    [1203, 548, 26, 200, 0.3],
    [1200, 588, 24, 170, 0.35],
  ];
  const v2 = [
    [1162, 232, 30, 150, 0.2],
    [1168, 286, 30, 210, 0.3],
    [1166, 340, 28, 150, 0.3],
    [1170, 392, 26, 205, 0.35],
    [1170, 438, 24, 175, 0.35],
  ];
  return `<svg class="plant plant-front" viewBox="1100 170 160 460" style="left:1100px;top:170px;width:160px;height:460px" aria-hidden="true">
    <defs>
      <linearGradient id="leafG2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fb552"/><stop offset=".5" stop-color="#457d2e"/><stop offset="1" stop-color="#244a1b"/></linearGradient>
      <filter id="vineShadow" x="-30%" y="-10%" width="160%" height="120%"><feDropShadow dx="6" dy="6" stdDeviation="3.5" flood-color="#0c0603" flood-opacity=".55"/></filter>
    </defs>
    <g filter="url(#vineShadow)">
      <path d="${vine2}" stroke="#4e7a2c" stroke-width="2.2" fill="none"/>
      ${leaves(v2, 'leafG2')}
      <path d="${vine1}" stroke="#5a8a33" stroke-width="2.4" fill="none"/>
      ${leaves(v1, 'leafG2')}
    </g>
  </svg>`;
}

function lampSVG() {
  // Troyan-pottery base, pleated fabric shade
  const pleats = Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    const xt = 118 + t * 204;
    const xb = 64 + t * 312;
    return `<path d="M${xt.toFixed(1)},470 L${xb.toFixed(1)},652" stroke="${i % 2 ? '#7a4b1c' : '#fff6e0'}" stroke-opacity="${i % 2 ? 0.12 : 0.2}" stroke-width="${i % 2 ? 2.2 : 1.6}"/>`;
  }).join('');
  const eyes = [
    [168, 780, 15],
    [214, 772, 17],
    [262, 778, 15],
    [190, 816, 11],
    [240, 818, 12],
  ]
    .map(
      ([x, y, r]) => `<g transform="translate(${x} ${y})">
        <ellipse rx="${r}" ry="${r * 1.15}" fill="#d9a13a"/>
        <ellipse rx="${r * 0.72}" ry="${r * 0.85}" fill="#2f6a52" cy="${r * 0.12}"/>
        <ellipse rx="${r * 0.44}" ry="${r * 0.52}" fill="#e6d3a0" cy="${r * 0.2}"/>
        <ellipse rx="${r * 0.2}" ry="${r * 0.26}" fill="#2a3f7a" cy="${r * 0.26}"/>
        <path d="M0,${r * 1.15} q-${r * 0.2},${r * 1.4} 0,${r * 2.6}" stroke="#d9a13a" stroke-width="${r * 0.35}" stroke-opacity=".7" fill="none" stroke-linecap="round"/>
      </g>`
    )
    .join('');
  return `<svg class="lamp" viewBox="40 430 360 490" style="left:40px;top:430px;width:360px;height:490px" aria-hidden="true">
    <defs>
      <linearGradient id="shadeG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#c88f4f"/><stop offset=".22" stop-color="#f4d29b"/><stop offset=".5" stop-color="#ffe6b8"/><stop offset=".78" stop-color="#ecc184"/><stop offset="1" stop-color="#b07a3e"/>
      </linearGradient>
      <radialGradient id="shadeHot" cx="220" cy="640" r="190" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff7e2" stop-opacity=".95"/><stop offset=".55" stop-color="#ffe2a8" stop-opacity=".35"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="glazeG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#4b2c17"/><stop offset=".25" stop-color="#6b3f1f"/><stop offset=".55" stop-color="#3a2212"/><stop offset="1" stop-color="#170d07"/>
      </linearGradient>
      <linearGradient id="brassG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#7a5a24"/><stop offset=".3" stop-color="#f1d58a"/><stop offset=".6" stop-color="#a47b33"/><stop offset="1" stop-color="#4a3510"/>
      </linearGradient>
      <clipPath id="vaseClip"><path id="vase" d="M200,690 C200,712 178,726 158,746 C130,774 128,826 150,862 C160,880 176,892 186,900 L254,900 C264,892 280,880 290,862 C312,826 310,774 282,746 C262,726 240,712 240,690 Z"/></clipPath>
      <filter id="lampShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="10" dy="4" stdDeviation="6" flood-color="#0c0603" flood-opacity=".45"/></filter>
    </defs>
    <ellipse cx="236" cy="904" rx="92" ry="9" fill="#0c0603" opacity=".55"/>
    <g filter="url(#lampShadow)">
      <rect x="208" y="646" width="24" height="50" fill="url(#brassG)"/>
      <rect x="200" y="684" width="40" height="10" rx="3" fill="url(#brassG)"/>
      <g clip-path="url(#vaseClip)">
        <rect x="120" y="680" width="200" height="230" fill="url(#glazeG)"/>
        <path d="M130,744 C160,754 280,754 310,744 L310,760 C280,770 160,770 130,760 Z" fill="#c98a2c" opacity=".55"/>
        ${eyes}
        <path d="M140,836 C170,846 270,846 300,836" stroke="#2f6a52" stroke-width="6" fill="none" opacity=".7"/>
        <path d="M150,862 C180,870 260,870 290,862" stroke="#d9a13a" stroke-width="3" fill="none" opacity=".6"/>
        <path d="M168,740 C150,770 150,830 170,876" stroke="#fff4dc" stroke-opacity=".55" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M176,744 C166,768 164,790 166,806" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M186,900 L254,900 L250,906 L190,906 Z" fill="#120a05"/>
    </g>
    <path d="M118,470 Q220,462 322,470 L376,652 Q220,664 64,652 Z" fill="url(#shadeG)"/>
    <path d="M118,470 Q220,462 322,470 L376,652 Q220,664 64,652 Z" fill="url(#shadeHot)"/>
    <g clip-path="url(#shadeClip)">${pleats}</g>
    <clipPath id="shadeClip"><path d="M118,470 Q220,462 322,470 L376,652 Q220,664 64,652 Z"/></clipPath>
    <path d="M118,470 Q220,462 322,470" stroke="#9a6a32" stroke-width="5" fill="none"/>
    <path d="M64,652 Q220,664 376,652" stroke="#a87436" stroke-width="6" fill="none"/>
    <path d="M66,650 Q220,661 374,650" stroke="#fff1cf" stroke-opacity=".7" stroke-width="1.5" fill="none"/>
  </svg>`;
}

function wallFxSVG() {
  // multiply layer: falloff from the lamp + cast shadows on the wall
  return `<svg class="wall-dark" viewBox="-1400 -900 4560 3000" style="left:-1400px;top:-900px;width:4560px;height:3000px" aria-hidden="true">
    <defs>
      <radialGradient id="falloff" cx="220" cy="560" r="2100" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff3e2"/>
        <stop offset=".12" stop-color="#e6c9a6"/>
        <stop offset=".3" stop-color="#8f7059"/>
        <stop offset=".52" stop-color="#46342a"/>
        <stop offset=".8" stop-color="#1e1611"/>
        <stop offset="1" stop-color="#140e0b"/>
      </radialGradient>
      <filter id="castBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
    </defs>
    <rect x="-1400" y="-900" width="4560" height="3000" fill="url(#falloff)"/>
    <g filter="url(#castBlur)" fill="#2a1a10" opacity=".7">
      <rect x="470" y="282" width="820" height="600" rx="20"/>
      <ellipse cx="660" cy="214" rx="190" ry="78"/>
      <ellipse cx="1166" cy="206" rx="80" ry="70"/>
      <rect x="1200" y="230" width="48" height="380" rx="20"/>
      <path d="M948,256 L820,20 L836,16 L962,252 Z M970,252 L1170,40 L1182,48 L984,258 Z"/>
    </g>
  </svg>`;
}

function wallLightSVG() {
  return `<svg class="wall-warm" viewBox="-400 -400 1300 1400" style="left:-400px;top:-400px;width:1300px;height:1400px" aria-hidden="true">
    <defs>
      <radialGradient id="halo" cx="220" cy="560" r="560" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffb867" stop-opacity=".75"/>
        <stop offset=".35" stop-color="#ff9c4a" stop-opacity=".28"/>
        <stop offset="1" stop-color="#ff9c4a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="coneUp" x1="0" y1="470" x2="0" y2="-200" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffd79c" stop-opacity=".85"/>
        <stop offset=".5" stop-color="#ffc47a" stop-opacity=".25"/>
        <stop offset="1" stop-color="#ffc47a" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="coneDown" x1="0" y1="650" x2="0" y2="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffd79c" stop-opacity=".7"/>
        <stop offset="1" stop-color="#ffc47a" stop-opacity=".15"/>
      </linearGradient>
      <filter id="coneBlur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="22"/></filter>
    </defs>
    <rect x="-400" y="-400" width="1300" height="1400" fill="url(#halo)"/>
    <g filter="url(#coneBlur)">
      <path d="M126,474 L314,474 L520,-260 L-80,-260 Z" fill="url(#coneUp)"/>
      <path d="M70,650 L370,650 L470,900 L-30,900 Z" fill="url(#coneDown)"/>
    </g>
  </svg>`;
}

function goblenSVG() {
  // gilded frame; the cross-stitched picture is filled in later
  return `<svg class="goblen" viewBox="0 0 300 236" style="left:66px;top:96px;width:300px;height:236px" role="img">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f6dd95"/><stop offset=".3" stop-color="#b98a3a"/><stop offset=".55" stop-color="#ecd08a"/><stop offset=".8" stop-color="#8c6424"/><stop offset="1" stop-color="#5a3c12"/>
      </linearGradient>
      <linearGradient id="goldIn" x1="1" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#f6dd95"/><stop offset=".5" stop-color="#9c7230"/><stop offset="1" stop-color="#3e290c"/>
      </linearGradient>
      <filter id="frameShadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="9" dy="10" stdDeviation="7" flood-color="#0c0603" flood-opacity=".55"/></filter>
      <pattern id="beads" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="2.6" fill="#e7c879"/><circle cx="3.6" cy="3.6" r="1" fill="#fff6d8" opacity=".8"/></pattern>
    </defs>
    <g filter="url(#frameShadow)">
      <rect x="0" y="0" width="300" height="236" rx="3" fill="url(#gold)"/>
      <rect x="12" y="12" width="276" height="212" fill="url(#beads)"/>
      <rect x="21" y="21" width="258" height="194" fill="url(#goldIn)"/>
      <rect x="26" y="26" width="248" height="184" fill="#d9cdb4"/>
      <image decoding="sync" class="goblen-img" x="26" y="26" width="248" height="184" preserveAspectRatio="xMidYMid slice"/>
      <rect x="26" y="26" width="248" height="184" fill="none" stroke="#1c1006" stroke-opacity=".6" stroke-width="2"/>
      <rect x="1.5" y="1.5" width="297" height="233" rx="2" fill="none" stroke="#fff3c8" stroke-opacity=".35" stroke-width="1.5"/>
    </g>
  </svg>`;
}

function cabinetSVG(tex) {
  // y' = y - 850 ; front face continues far below the viewport
  const drawer = (x, w) => `
    <g>
      <rect x="${x}" y="118" width="${w}" height="118" fill="url(#cabWood2)"/>
      <rect x="${x}" y="118" width="${w}" height="118" fill="url(#cabLight)"/>
      <path d="M${x},118.5 H${x + w}" stroke="#ffd9a6" stroke-opacity=".35" stroke-width="2"/>
      <path d="M${x + 0.5},118 V236" stroke="#ffd9a6" stroke-opacity=".18" stroke-width="2"/>
      <path d="M${x},235 H${x + w} M${x + w - 0.5},118 V236" stroke="#000" stroke-opacity=".55" stroke-width="2.5"/>
      <g transform="translate(${x + w / 2} 176)">
        <rect x="-82" y="-4" width="164" height="16" rx="8" fill="#000" opacity=".45" filter="url(#hShadow)"/>
        <rect x="-80" y="-9" width="160" height="14" rx="7" fill="url(#handle)"/>
        <rect x="-74" y="-7" width="148" height="3" rx="1.5" fill="#fff6d0" opacity=".65"/>
        <circle cx="-66" cy="-2" r="4.6" fill="#7a5a1c"/><circle cx="66" cy="-2" r="4.6" fill="#7a5a1c"/>
      </g>
    </g>`;
  return `<svg class="cabinet" viewBox="0 0 1760 1000" style="left:0;top:850px;width:1760px;height:1000px" aria-hidden="true">
    <defs>
      <pattern id="cabTop" patternUnits="userSpaceOnUse" width="1700" height="320" patternTransform="translate(30 -60) scale(1 .3)"><image decoding="sync" href="${tex.cab}" width="1700" height="320" preserveAspectRatio="none"/></pattern>
      <pattern id="cabWood" patternUnits="userSpaceOnUse" width="1700" height="850" x="30" y="0"><image decoding="sync" href="${tex.cab}" width="1700" height="850" preserveAspectRatio="none"/></pattern>
      <pattern id="cabWood2" patternUnits="userSpaceOnUse" width="1700" height="850" patternTransform="translate(30 -260)"><image decoding="sync" href="${tex.cab}" width="1700" height="850" preserveAspectRatio="none"/></pattern>
      <linearGradient id="cabLight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffcf96" stop-opacity=".22"/><stop offset=".22" stop-color="#ffcf96" stop-opacity=".06"/><stop offset=".55" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".62"/>
      </linearGradient>
      <linearGradient id="topGloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe2b8" stop-opacity=".14"/><stop offset=".6" stop-color="#ffe2b8" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".2"/>
      </linearGradient>
      <linearGradient id="nosing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd9a6" stop-opacity=".55"/><stop offset=".25" stop-color="#5a311a" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/>
      </linearGradient>
      <linearGradient id="handle" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fbe7a8"/><stop offset=".45" stop-color="#c79a3c"/><stop offset="1" stop-color="#6e4c14"/>
      </linearGradient>
      <linearGradient id="tvRefl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#050302" stop-opacity=".72"/><stop offset="1" stop-color="#050302" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="lampPool" cx="230" cy="52" r="320" gradientUnits="userSpaceOnUse" gradientTransform="translate(230 52) scale(1 .22) translate(-230 -52)">
        <stop offset="0" stop-color="#ffd7a0" stop-opacity=".6"/><stop offset="1" stop-color="#ffd7a0" stop-opacity="0"/>
      </radialGradient>
      <filter id="hShadow"><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="reflBlur" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="5 2"/></filter>
      <filter id="shBlur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <path d="M70,0 H1690 L1722,80 H38 Z" fill="url(#cabTop)"/>
    <path d="M70,0 H1690 L1722,80 H38 Z" fill="url(#cabLight)" opacity=".8"/>
    <path d="M70,0 H1690 L1722,80 H38 Z" fill="url(#topGloss)"/>
    <ellipse cx="230" cy="52" rx="320" ry="70" fill="url(#lampPool)"/>
    <g filter="url(#reflBlur)">
      <rect x="404" y="40" width="792" height="40" fill="url(#tvRefl)"/>
      <path d="M150,58 Q230,48 310,58 L300,76 Q230,70 160,76 Z" fill="#fff0d0" opacity=".25"/>
    </g>
    <path d="M1200,36 L1520,36 L1560,72 L1196,74 Z" fill="#0a0603" opacity=".45" filter="url(#shBlur)"/>
    <ellipse cx="800" cy="38" rx="410" ry="7" fill="#050302" opacity=".75" filter="url(#hShadow)"/>
    <rect x="38" y="80" width="1684" height="26" rx="3" fill="url(#cabWood)"/>
    <rect x="38" y="80" width="1684" height="26" rx="3" fill="url(#nosing)"/>
    <rect x="38" y="80" width="1684" height="26" rx="3" fill="url(#cabLight)"/>
    <path d="M40,81 H1720" stroke="#ffe7c2" stroke-opacity=".55" stroke-width="1.4"/>
    <rect x="46" y="106" width="1668" height="900" fill="url(#cabWood)"/>
    <rect x="46" y="106" width="1668" height="900" fill="url(#cabLight)"/>
    <rect x="46" y="106" width="1668" height="10" fill="#000" opacity=".45"/>
    ${drawer(64, 806)}
    ${drawer(890, 806)}
    <g>
      <rect x="64" y="252" width="806" height="760" fill="url(#cabWood2)"/>
      <rect x="890" y="252" width="806" height="760" fill="url(#cabWood)"/>
      <rect x="46" y="244" width="1668" height="760" fill="url(#cabLight)"/>
      <path d="M64,252.5 H870 M890,252.5 H1696" stroke="#ffd9a6" stroke-opacity=".3" stroke-width="2"/>
      <rect x="110" y="300" width="714" height="700" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="3"/>
      <rect x="936" y="300" width="714" height="700" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="3"/>
      <path d="M112,302 H822 M938,302 H1648" stroke="#ffd9a6" stroke-opacity=".2" stroke-width="2"/>
    </g>
  </svg>`;
}

function tvBodySVG(tex) {
  const presets = ['0', '1', '2', '3', '4', 'AV'];
  const pk = presets
    .map((p, i) => {
      const x = 646 + (i % 2) * 52;
      const y = 300 + Math.floor(i / 2) * 42;
      return `<g class="preset" data-ch="${p === 'AV' ? 'av' : p}">
        <rect x="${x}" y="${y}" width="44" height="26" rx="4" fill="#0c0a09"/>
        <g class="preset-cap"><rect x="${x + 1}" y="${y}" width="42" height="24" rx="3.5" fill="url(#keyG)"/>
        <rect x="${x + 3}" y="${y + 1.5}" width="38" height="3" rx="1.5" fill="#fff" opacity=".45"/>
        <text x="${x + 22}" y="${y + 17}" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="600" font-size="11" fill="#2b2622">${p}</text></g>
      </g>`;
    })
    .join('');
  const knob = (cx, cy, cls) => {
    const ticks = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return `M${(cx + Math.cos(a) * 13).toFixed(1)},${(cy + Math.sin(a) * 13).toFixed(1)} L${(cx + Math.cos(a) * 16).toFixed(1)},${(cy + Math.sin(a) * 16).toFixed(1)}`;
    }).join(' ');
    return `<g class="${cls}">
      <circle cx="${cx}" cy="${cy + 2}" r="17" fill="#000" opacity=".5"/>
      <circle cx="${cx}" cy="${cy}" r="16.5" fill="url(#knobG)"/>
      <path d="${ticks}" stroke="#0b0908" stroke-width="1.2" opacity=".6"/>
      <circle cx="${cx}" cy="${cy}" r="11.5" fill="url(#knobTop)"/>
    </g>`;
  };
  return `<svg class="tv-body" viewBox="0 0 800 612" aria-hidden="true">
  <defs>
    <pattern id="woodH" patternUnits="userSpaceOnUse" width="800" height="300"><image decoding="sync" href="${tex.tvH}" width="800" height="300" preserveAspectRatio="none"/></pattern>
    <pattern id="woodH2" patternUnits="userSpaceOnUse" width="800" height="300" patternTransform="translate(0 130)"><image decoding="sync" href="${tex.tvH}" width="800" height="300" preserveAspectRatio="none"/></pattern>
    <pattern id="woodV" patternUnits="userSpaceOnUse" width="300" height="800"><image decoding="sync" href="${tex.tvV}" width="300" height="800" preserveAspectRatio="none"/></pattern>
    <pattern id="woodV2" patternUnits="userSpaceOnUse" width="300" height="800" patternTransform="translate(140 0)"><image decoding="sync" href="${tex.tvV}" width="300" height="800" preserveAspectRatio="none"/></pattern>
    <linearGradient id="tvLight" x1="0" y1="0" x2="1" y2=".5">
      <stop offset="0" stop-color="#ffd7a3" stop-opacity=".3"/><stop offset=".4" stop-color="#ffd7a3" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".5"/>
    </linearGradient>
    <linearGradient id="edgeG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe4bd" stop-opacity=".75"/><stop offset=".4" stop-color="#ffe4bd" stop-opacity=".15"/><stop offset=".6" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".7"/>
    </linearGradient>
    <linearGradient id="panelG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b231e"/><stop offset=".06" stop-color="#1e1916"/><stop offset="1" stop-color="#110e0c"/>
    </linearGradient>
    <linearGradient id="panelSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffd7a3" stop-opacity=".06"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
    </linearGradient>
    <linearGradient id="bevelG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#030202"/><stop offset=".45" stop-color="#110e0c"/><stop offset="1" stop-color="#41382f"/>
    </linearGradient>
    <linearGradient id="bevelSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2c251f"/><stop offset=".08" stop-color="#2c251f" stop-opacity="0"/><stop offset=".92" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/>
    </linearGradient>
    <linearGradient id="trimG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f1e5c8"/><stop offset=".3" stop-color="#9e927b"/><stop offset=".5" stop-color="#e2d6ba"/><stop offset=".75" stop-color="#7d7262"/><stop offset="1" stop-color="#4b443a"/>
    </linearGradient>
    <linearGradient id="alu" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2efe8"/><stop offset=".45" stop-color="#bdb7ac"/><stop offset=".55" stop-color="#a9a397"/><stop offset="1" stop-color="#d8d3c9"/>
    </linearGradient>
    <pattern id="brush" width="400" height="3" patternUnits="userSpaceOnUse"><rect width="400" height="1" fill="#fff" opacity=".18"/><rect y="2" width="400" height="1" fill="#000" opacity=".06"/></pattern>
    <linearGradient id="keyG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9e4d9"/><stop offset=".6" stop-color="#b9b2a5"/><stop offset="1" stop-color="#8e877b"/>
    </linearGradient>
    <radialGradient id="knobG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#5b524b"/><stop offset=".7" stop-color="#231d19"/><stop offset="1" stop-color="#0e0b09"/></radialGradient>
    <radialGradient id="knobTop" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#d9d3c8"/><stop offset=".5" stop-color="#8f877b"/><stop offset="1" stop-color="#3d3731"/></radialGradient>
    <pattern id="grille" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#2c2621"/>
      <circle cx="4" cy="4" r="2.15" fill="#050403"/>
      <path d="M2,5.2 A2.2,2.2 0 0 0 6,5.2" stroke="#5b5048" stroke-width=".7" fill="none"/>
    </pattern>
    <linearGradient id="grilleShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".1" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#ffd7a3" stop-opacity="0"/><stop offset="1" stop-color="#ffd7a3" stop-opacity=".12"/>
    </linearGradient>
    <linearGradient id="irG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0b0d"/><stop offset="1" stop-color="#140304"/></linearGradient>
    <linearGradient id="footG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a221d"/><stop offset="1" stop-color="#0b0807"/></linearGradient>
    <clipPath id="tvClip"><rect width="800" height="600" rx="16"/></clipPath>
    <clipPath id="holeClip"><path clip-rule="evenodd" d="M-20,-20 H820 V640 H-20 Z ${OPENING}"/></clipPath>
    <filter id="inner" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <g clip-path="url(#holeClip)">
  <rect x="58" y="596" width="70" height="14" rx="3" fill="url(#footG)"/>
  <rect x="672" y="596" width="70" height="14" rx="3" fill="url(#footG)"/>
  <g clip-path="url(#tvClip)">
    <path d="M0,0 H800 L770,30 H30 Z" fill="url(#woodH)"/>
    <path d="M0,600 H800 L770,566 H30 Z" fill="url(#woodH2)"/>
    <path d="M0,0 L30,30 V566 L0,600 Z" fill="url(#woodV)"/>
    <path d="M800,0 L770,30 V566 L800,600 Z" fill="url(#woodV2)"/>
    <path d="M0,0 L30,30 M800,0 L770,30 M0,600 L30,566 M800,600 L770,566" stroke="#1a0d05" stroke-opacity=".55" stroke-width="1.2"/>
    <rect width="800" height="600" fill="url(#tvLight)"/>
    <rect x="1.5" y="1.5" width="797" height="597" rx="15" fill="none" stroke="url(#edgeG)" stroke-width="3.5"/>
    <rect x="30" y="30" width="740" height="536" fill="url(#panelG)"/>
    <rect x="30" y="30" width="740" height="536" fill="url(#panelSide)"/>
    <path d="M30,36 H770 M36,30 V566" stroke="#000" stroke-opacity=".7" stroke-width="12" filter="url(#inner)"/>
    <path d="M30,565.5 H770 M769.5,30 V566" stroke="#ffd9a6" stroke-opacity=".22" stroke-width="1.5"/>
    <path d="M28.5,28.5 H771.5 V567.5 H28.5 Z" fill="none" stroke="#0a0604" stroke-opacity=".8" stroke-width="2"/>
  </g>
  <!-- screen surround -->
  <path fill-rule="evenodd" fill="url(#bevelG)" d="M84,44 H576 Q616,44 616,84 V439 Q616,479 576,479 H84 Q44,479 44,439 V84 Q44,44 84,44 Z ${OPENING}"/>
  <path fill-rule="evenodd" fill="url(#bevelSide)" d="M84,44 H576 Q616,44 616,84 V439 Q616,479 576,479 H84 Q44,479 44,439 V84 Q44,44 84,44 Z ${OPENING}"/>
  <path d="M84,44 H576 Q616,44 616,84 V439 Q616,479 576,479 H84 Q44,479 44,439 V84 Q44,44 84,44 Z" fill="none" stroke="url(#trimG)" stroke-width="3"/>
  <path d="${OPENING}" fill="none" stroke="#000" stroke-width="2.5"/>
  <!-- nameplate -->
  <g transform="translate(330 516)">
    <rect x="-92" y="-17" width="184" height="34" rx="3" fill="url(#alu)"/>
    <rect x="-92" y="-17" width="184" height="34" rx="3" fill="url(#brush)"/>
    <rect x="-92" y="-17" width="184" height="34" rx="3" fill="none" stroke="#2c2620" stroke-width="1.2"/>
    <path d="M-91,-16 H91" stroke="#fff" stroke-opacity=".8" stroke-width="1"/>
    <g transform="translate(-68 0)">
      <circle r="7.5" fill="#ffb02e" opacity=".35"/>
      <circle r="4" fill="#ff9a1a"/>
      <circle r="2" fill="#fff4c2"/>
      <ellipse cx="-5" cy="-6" rx="5" ry="2.6" transform="rotate(-30 -5 -6)" fill="none" stroke="#3a312a" stroke-width="1.2"/>
      <ellipse cx="5" cy="-6" rx="5" ry="2.6" transform="rotate(30 5 -6)" fill="none" stroke="#3a312a" stroke-width="1.2"/>
    </g>
    <g transform="skewX(-10)">
      <text x="10" y="8.5" text-anchor="middle" font-family="'Russo One', sans-serif" font-size="22" letter-spacing="3" fill="#fff" opacity=".55">СВЕТУЛКА</text>
      <text x="10" y="7.5" text-anchor="middle" font-family="'Russo One', sans-serif" font-size="22" letter-spacing="3" fill="#1d1814">СВЕТУЛКА</text>
    </g>
  </g>
  <text class="tv-sub" x="330" y="551" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="500" font-size="9.5" letter-spacing="2.4" fill="#8a7f71">ЦВЕТЕН ТЕЛЕВИЗОР · 51ТЦ-89</text>
  <g transform="translate(66 506)">
    <rect width="96" height="20" rx="3" fill="#0c0a09"/>
    <text x="48" y="14" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="600" font-size="9.5" letter-spacing="1.6" fill="#b5ab9b">PAL · SECAM</text>
  </g>
  <rect x="514" y="503" width="70" height="24" rx="5" fill="url(#irG)"/>
  <path d="M518,506 H580" stroke="#ff9a9a" stroke-opacity=".25" stroke-width="1.5"/>
  <!-- right control panel -->
  <rect x="628" y="44" width="128" height="508" rx="8" fill="#191411"/>
  <rect x="628" y="44" width="128" height="508" rx="8" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="2"/>
  <path d="M636,551 H748" stroke="#ffd9a6" stroke-opacity=".15" stroke-width="1.2"/>
  <rect x="640" y="58" width="104" height="204" rx="6" fill="url(#grille)"/>
  <rect x="640" y="58" width="104" height="204" rx="6" fill="url(#grilleShade)"/>
  <rect x="640" y="58" width="104" height="204" rx="6" fill="none" stroke="#000" stroke-width="1.5"/>
  <text class="tv-presets" x="692" y="286" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="600" font-size="8.5" letter-spacing="1.8" fill="#8a7f71">ПРОГРАМИ</text>
  ${pk}
  ${knob(666, 448, 'knob-b')}
  <g class="knob-v-wrap">${knob(718, 448, 'knob-v')}</g>
  <text class="tv-knob-b" x="666" y="480" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="600" font-size="7.5" letter-spacing="1.2" fill="#8a7f71">ЯРКОСТ</text>
  <text class="tv-knob-v" x="718" y="480" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="600" font-size="7.5" letter-spacing="1.2" fill="#8a7f71">ЗВУК</text>
  <g class="tv-power">
    <rect x="644" y="496" width="96" height="40" rx="5" fill="#0a0807"/>
    <g class="tv-power-cap">
      <rect x="646" y="496" width="92" height="36" rx="4" fill="url(#keyG)"/>
      <rect x="649" y="498" width="86" height="4" rx="2" fill="#fff" opacity=".45"/>
      <circle cx="668" cy="514" r="6" fill="none" stroke="#3a332c" stroke-width="2"/>
      <path d="M668,505 V513" stroke="#3a332c" stroke-width="2.2" stroke-linecap="round"/>
      <text class="tv-power-label" x="704" y="518" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="600" font-size="9" letter-spacing="1.2" fill="#3a332c">МРЕЖА</text>
    </g>
  </g>
  </g>
</svg>`;
}

function tvGlassSVG() {
  return `<svg class="tv-glass" viewBox="0 0 800 612" aria-hidden="true">
  <defs>
    <clipPath id="glassClip"><path d="${OPENING}"/></clipPath>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".35" stop-color="#fff" stop-opacity=".03"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/>
    </linearGradient>
    <radialGradient id="lampRefl" cx="0" cy="0" r="1"><stop offset="0" stop-color="#ffe0ae" stop-opacity=".55"/><stop offset=".6" stop-color="#ffc77a" stop-opacity=".14"/><stop offset="1" stop-color="#ffc77a" stop-opacity="0"/></radialGradient>
    <filter id="gBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="gBlur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <g clip-path="url(#glassClip)">
    <path d="${OPENING}" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="34" filter="url(#gBlur)"/>
    <rect x="50" y="50" width="560" height="420" fill="url(#sheen)"/>
    <ellipse cx="0" cy="0" rx="1" ry="1" fill="url(#lampRefl)" transform="translate(112 150) scale(92 70)"/>
    <ellipse cx="98" cy="136" rx="11" ry="16" fill="#fff4dc" opacity=".22" filter="url(#gBlur2)"/>
    <path d="M100,70 Q300,60 520,68" stroke="#fff" stroke-opacity=".16" stroke-width="5" fill="none" filter="url(#gBlur2)" stroke-linecap="round"/>
    <path d="M66,120 Q60,260 70,400" stroke="#fff" stroke-opacity=".07" stroke-width="8" fill="none" filter="url(#gBlur2)"/>
    <path d="M60,420 Q330,436 600,420 L600,470 L60,470 Z" fill="#ffcf96" opacity=".05" filter="url(#gBlur)"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------- build

export async function buildScene(stage, wallCanvas) {
  // textures
  const walnutTV = [
    [150, 98, 60],
    [104, 64, 36],
    [52, 30, 16],
  ];
  const walnutCab = [
    [132, 76, 42],
    [86, 46, 24],
    [38, 18, 8],
  ];
  const tvH = wood(900, 340, { seed: 7, palette: walnutTV, ringFreq: 0.05, warp: 70 });
  const tvV = rotate90(wood(900, 340, { seed: 13, palette: walnutTV, ringFreq: 0.05, warp: 70 }));
  const cab = wood(1100, 560, { seed: 21, palette: walnutCab, ringFreq: 0.032, warp: 110, figure: 1.3 });
  const [tvHU, tvVU, cabU] = await Promise.all([toURL(tvH), toURL(tvV), toURL(cab)]);
  const tex = { tvH: tvHU, tvV: tvVU, cab: cabU };
  const grainU = await toURL(grain(256, { seed: 5, amount: 0.4 }), 'image/png');

  const wall = await makeWall(wallCanvas);
  const html = [
    `<div class="screenlight" aria-hidden="true"></div>`,
    goblenSVG(),
    antennaSVG(),
    `<div class="cat-wrap"><div class="cat-breath">${catBodySVG()}</div><div class="cat-headbob">${catHeadSVG()}</div></div>`,
    plantBackSVG(),
    cabinetSVG(tex),
    `<div class="screenspill" aria-hidden="true"></div>`,
    lampSVG(),
    `<div class="tv" id="tv">
       <canvas class="screen" id="screen" role="img"></canvas>
       ${tvBodySVG(tex)}
       <div class="screen-halo" aria-hidden="true"></div>
       ${tvGlassSVG()}
       <span class="led led-standby" aria-hidden="true"></span>
       ${['0', '1', '2', '3', '4', 'av'].map((p, i) => `<span class="led led-preset" data-ch="${p}" style="left:${646 + (i % 2) * 52 + 18}px;top:${300 + Math.floor(i / 2) * 42 - 7}px" aria-hidden="true"></span>`).join('')}
     </div>`,
    lace(),
    `<svg class="cat-tail" viewBox="380 236 150 300" style="left:380px;top:236px;width:150px;height:300px" aria-hidden="true">
       <defs>
         <linearGradient id="tailG" gradientUnits="userSpaceOnUse" x1="0" y1="260" x2="0" y2="470">
           <stop offset="0" stop-color="#b8642d"/><stop offset=".34" stop-color="#b8642d"/><stop offset=".4" stop-color="#231a15"/><stop offset=".56" stop-color="#231a15"/><stop offset=".62" stop-color="#a95a26"/><stop offset=".82" stop-color="#a95a26"/><stop offset=".88" stop-color="#1d1612"/><stop offset="1" stop-color="#1d1612"/>
         </linearGradient>
         <linearGradient id="tailLight" gradientUnits="userSpaceOnUse" x1="410" y1="0" x2="470" y2="0">
           <stop offset="0" stop-color="#ffdcae" stop-opacity=".38"/><stop offset=".5" stop-color="#ffdcae" stop-opacity="0"/><stop offset="1" stop-color="#0b0503" stop-opacity=".45"/>
         </linearGradient>
         <filter id="tailFur" x="-30%" y="-10%" width="160%" height="120%">
           <feTurbulence type="fractalNoise" baseFrequency="0.5 0.25" numOctaves="2" seed="8" result="n"/>
           <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
           <feDropShadow in="d" dx="5" dy="5" stdDeviation="3.5" flood-color="#0a0503" flood-opacity=".55"/>
         </filter>
       </defs>
       <g filter="url(#tailFur)">
         <path class="tail-a" fill="url(#tailG)"/>
         <path class="tail-b" fill="url(#tailLight)"/>
       </g>
     </svg>`,
    catFrontSVG(),
    plantFrontSVG(),
    `<div class="cat-hit" aria-hidden="true"></div>`,
    `<div class="cat-bubble" aria-hidden="true"></div>`,
  ].join('');
  stage.insertAdjacentHTML('beforeend', html);

  // cross-stitch picture
  goblen(window.Blog.thumbUrl('rila-lakes.jpg'), 50, 37, 12)
    .then((url) => stage.querySelector('.goblen-img').setAttribute('href', url))
    .catch(() => {});
  const gob = stage.querySelector('.goblen');
  const rila = window.Blog.photos.find((p) => p.file === 'rila-lakes.jpg');
  if (rila) gob.setAttribute('aria-label', window.Blog.text(rila.caption));

  return {
    wall,
    grainU,
    tv: stage.querySelector('.tv'),
    canvas: stage.querySelector('#screen'),
    glass: stage.querySelector('.tv-glass'),
    halo: stage.querySelector('.screen-halo'),
    ledStandby: stage.querySelector('.led-standby'),
    presetLeds: [...stage.querySelectorAll('.led-preset')],
    presets: [...stage.querySelectorAll('.preset')],
    tvPower: stage.querySelector('.tv-power'),
    knobV: stage.querySelector('.knob-v'),
    catHead: stage.querySelector('.cat-head'),
    catHit: stage.querySelector('.cat-hit'),
    bubble: stage.querySelector('.cat-bubble'),
    tailA: stage.querySelector('.tail-a'),
    tailB: stage.querySelector('.tail-b'),
    goblen: gob,
    tvTexts: {
      sub: stage.querySelector('.tv-sub'),
      presets: stage.querySelector('.tv-presets'),
      knobB: stage.querySelector('.tv-knob-b'),
      knobV: stage.querySelector('.tv-knob-v'),
      power: stage.querySelector('.tv-power-label'),
    },
  };
}

// ---------------------------------------------------------------- tail
const N = 14;
const SEG = 14.5;
export function tailPath(flick, t) {
  // root sits on the TV top behind the doily edge, then drapes over
  let x = 470;
  let y = 262;
  const pts = [[x, y]];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    let a = 1.5 * Math.exp(-i * 0.75) + 0.06; // from sideways to hanging
    a += -0.75 * Math.pow(Math.max(0, (u - 0.68) / 0.32), 1.6); // tip curls outward
    a += flick * Math.sin(t * 9 - i * 0.55) * Math.pow(u, 1.5) * 0.55;
    a += flick * 0.25 * Math.pow(u, 2);
    x += -Math.sin(a) * SEG;
    y += Math.cos(a) * SEG;
    pts.push([x, y]);
  }
  // outline with taper
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const o = pts[Math.max(0, i - 1)];
    let dx = q[0] - o[0];
    let dy = q[1] - o[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    const u = i / (pts.length - 1);
    const w = (11.5 - 3.5 * u + Math.sin(u * Math.PI) * 1.2) * (i === 0 ? 0.9 : 1);
    left.push([p[0] - dy * w, p[1] + dx * w]);
    right.push([p[0] + dy * w, p[1] - dx * w]);
  }
  const f = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const smooth = (arr) => {
    let d = '';
    for (let i = 1; i < arr.length - 1; i++) {
      const m = [(arr[i][0] + arr[i + 1][0]) / 2, (arr[i][1] + arr[i + 1][1]) / 2];
      d += ` Q${f(arr[i])} ${f(m)}`;
    }
    d += ` L${f(arr[arr.length - 1])}`;
    return d;
  };
  const tip = pts[pts.length - 1];
  const r = right.slice().reverse();
  let d = `M${f(left[0])}` + smooth(left);
  d += ` Q${(tip[0] + (tip[0] - pts[pts.length - 2][0]) * 0.9).toFixed(1)},${(tip[1] + (tip[1] - pts[pts.length - 2][1]) * 0.9).toFixed(1)} ${f(r[0])}`;
  d += smooth(r);
  d += ' Z';
  return d;
}
