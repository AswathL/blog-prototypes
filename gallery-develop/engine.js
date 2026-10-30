// One shared WebGL context renders every print (and the wooden table) into ordinary 2D canvases.
// That keeps us far below the browser's context limit no matter how many prints are on the table.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}`;

// The chemistry. d = 0: the muddy grey-green of fresh instant film.
// Rising d: shadows come up first, dark, flat and cold blue-green; then mids and highlights;
// colour arrives last, warming and saturating into the final image.
const PRINT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPhoto;
uniform sampler2D uDev;
uniform vec4 uCrop;
uniform vec2 uSize;
uniform float uAspect;
uniform float uSeed;
uniform float uFade;
uniform float uReady;
uniform sampler2D uNoise;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec2 uv = vUv;
  vec2 pa = uv * vec2(uAspect, 1.0);
  vec2 so = vec2(fract(uSeed * 0.137), fract(uSeed * 0.071));
  vec3 photo = texture2D(uPhoto, uCrop.xy + uv * uCrop.zw).rgb;
  photo = mix(vec3(0.34, 0.36, 0.32), photo, uReady);
  float lum = dot(photo, vec3(0.299, 0.587, 0.114));

  float d = texture2D(uDev, uv).r;
  // Static noise is baked into a tiling texture once, so the per-frame shader stays cheap on phones.
  float n1 = texture2D(uNoise, pa * 0.875 + so).r;
  float n2 = texture2D(uNoise, pa * 1.62 - so).g;
  float front = 1.0 - abs(2.0 * d - 1.0);
  float dd = clamp(d + ((n1 - 0.5) * 0.62 + (n2 - 0.5) * 0.3) * front, 0.0, 1.0);
  dd = smoothstep(0.04, 0.97, dd);

  float mott = texture2D(uNoise, pa * 0.65 + so.yx).b;
  vec3 mud = vec3(0.318, 0.345, 0.305) + (mott - 0.5) * vec3(0.05, 0.052, 0.04);
  float mudL = dot(mud, vec3(0.299, 0.587, 0.114));

  // Shadows first, highlights last.
  float k = smoothstep(0.03 + 0.52 * lum, 0.36 + 0.62 * lum, dd);
  float L = mix(mudL, lum, k);
  // Dark at first: once the chemistry wakes up the whole frame sinks, then lifts as it finishes.
  L *= 1.0 - 0.27 * smoothstep(0.0, 0.22, dd) * (1.0 - smoothstep(0.42, 1.0, dd));

  vec3 tint = mix(mud / mudL, vec3(1.0), smoothstep(0.22, 0.86, dd));
  vec3 col = L * tint;

  float cold = smoothstep(0.04, 0.32, dd) * (1.0 - smoothstep(0.52, 0.95, dd));
  col += vec3(-0.05, 0.014, 0.055) * cold;

  vec3 chroma = photo - lum;
  float sat = smoothstep(0.45, 1.0, dd);
  col += chroma * sat * (0.65 + 0.35 * sat);

  float warm = smoothstep(0.62, 0.86, dd) * (1.0 - smoothstep(0.9, 1.0, dd));
  col += vec3(0.035, 0.012, -0.03) * warm;

  // A slightly darker, brownish chemical front where the emulsion is turning.
  float fringe = smoothstep(0.06, 0.3, d) * (1.0 - smoothstep(0.3, 0.78, d));
  col *= 1.0 - 0.09 * fringe;
  col += vec3(0.012, 0.004, -0.01) * fringe;

  vec3 finalCol = photo;
  col = mix(col, finalCol, uFade);

  // Edges of the window are always a touch darker, like the real thing.
  vec2 e = min(uv, 1.0 - uv) * vec2(uAspect, 1.0);
  float edge = smoothstep(0.0, 0.07, min(e.x, e.y));
  col *= mix(0.86, 1.0, edge);

  // Emulsion grain.
  float g = hash(floor(uv * uSize) + uSeed) - 0.5;
  col += g * mix(0.04, 0.022, dd);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// A calm oak desk under a window. Planks run left to right.
const WOOD_FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uScale;
${NOISE}
void main() {
  vec2 px = vUv * uRes;
  vec2 p = px / uScale;
  float plankH = 0.74;
  float row = floor(p.y / plankH);
  float fy = fract(p.y / plankH);
  float rs = hash(vec2(row * 1.7, 3.1));
  float jointX = rs * 3.0 + 0.7 + mod(row, 2.0) * 1.5;
  float seg = step(jointX, p.x) + step(jointX + 4.8, p.x);
  float ss = hash(vec2(row + 0.37, seg + 11.0));
  float ss2 = hash(vec2(seg + 3.1, row + 7.7));

  // Flat-sawn grain: stretched elliptical growth rings, centred off the plank,
  // so we see long parallel lines that occasionally arch into a cathedral.
  float y = p.y + (fbm(vec2(p.x * 0.14 + ss * 9.0, p.y * 0.7)) - 0.5) * 0.24;
  vec2 c = vec2(jointX - 2.4 + seg * 4.8 + (ss - 0.5) * 3.0, (row + 0.5 + (ss2 - 0.5) * 2.4) * plankH);
  float dist = length(vec2((p.x - c.x) * 0.085, y - c.y));
  float rings = dist * 21.0 + fbm(vec2(p.x * 0.35, y * 2.2)) * 1.1;
  float r = fract(rings);
  float late = smoothstep(0.0, 0.07, r) * (1.0 - smoothstep(0.16, 0.55, r));
  float fib = noise(vec2(p.x * 2.4, y * 230.0));
  float fib2 = noise(vec2(p.x * 0.8, y * 64.0));
  float broad = fbm(vec2(p.x * 0.2 + ss * 5.0, y * 1.2));
  float pores = smoothstep(0.78, 0.96, noise(vec2(p.x * 10.0, y * 300.0)));

  vec3 lightW = vec3(0.792, 0.627, 0.463);
  vec3 darkW = vec3(0.640, 0.478, 0.330);
  vec3 col = mix(lightW, darkW, clamp(broad * 0.75 + ss * 0.3 - 0.1, 0.0, 1.0));
  col *= 1.0 - 0.15 * late * (0.55 + 0.45 * fib2);
  col *= 0.955 + 0.06 * fib;
  col *= 1.0 - 0.06 * pores;
  col = mix(col, col * vec3(1.03, 0.99, 0.94), ss2 * 0.6);

  // plank seams, with a faint bevel highlight
  float seamT = 0.005;
  float top = smoothstep(0.0, seamT * 1.6, fy * plankH);
  float bot = smoothstep(0.0, seamT, (1.0 - fy) * plankH);
  col *= mix(0.4, 1.0, top * bot);
  col *= 1.0 + 0.06 * (1.0 - smoothstep(0.0, seamT * 5.0, fy * plankH)) * top;
  float jx = min(abs(p.x - jointX), abs(p.x - jointX - 4.8));
  col *= mix(0.45, 1.0, smoothstep(0.0, 0.005, jx));

  // window light from the upper left, soft falloff, gentle vignette
  vec2 lc = vUv - vec2(0.1, -0.15);
  lc.x *= uRes.x / uRes.y;
  float l = exp(-dot(lc, lc) * 0.55);
  col *= 0.74 + 0.4 * l;

  // the window itself: four soft panes thrown across the desk
  vec2 wq = vUv * vec2(uRes.x / uRes.y, 1.0);
  float a = 0.32;
  vec2 w = mat2(cos(a), sin(a), -sin(a), cos(a)) * (wq - vec2(-0.08, -0.32));
  w.x += w.y * 0.22;
  float sf = 0.085;
  float bx = smoothstep(0.0, sf, w.x) * (1.0 - smoothstep(0.95 - sf, 0.95, w.x));
  float by = smoothstep(0.0, sf, w.y) * (1.0 - smoothstep(0.78 - sf, 0.78, w.y));
  float mx = 1.0 - smoothstep(0.035, 0.0, abs(w.x - 0.475) - 0.012) * 0.85;
  float my = 1.0 - smoothstep(0.035, 0.0, abs(w.y - 0.39) - 0.012) * 0.85;
  float win = bx * by * mx * my;
  col *= 1.0 + 0.17 * win;
  col = mix(col, col * vec3(1.05, 1.0, 0.9), win * 0.45);
  vec2 v = vUv - 0.5;
  col *= 1.0 - 0.3 * dot(v, v);

  col += (hash(px) - 0.5) * 0.016;
  gl_FragColor = vec4(col, 1.0);
}`;

// Tileable value-noise fbm, three frequencies in three channels.
function buildNoise(size = 256) {
  const out = new Uint8Array(size * size * 4);
  let seed = 1337;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const lattices = [4, 8, 16, 32, 64, 128].map((p) => {
    const a = new Float32Array(p * p);
    for (let i = 0; i < a.length; i++) a[i] = rnd();
    return { p, a };
  });
  const sample = (L, x, y) => {
    const { p, a } = L;
    const fx = (x / size) * p;
    const fy = (y / size) * p;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const u = tx * tx * (3 - 2 * tx);
    const v = ty * ty * (3 - 2 * ty);
    const at = (i, j) => a[((j + p) % p) * p + ((i + p) % p)];
    const A = at(x0, y0);
    const B = at(x0 + 1, y0);
    const C = at(x0, y0 + 1);
    const D = at(x0 + 1, y0 + 1);
    return A + (B - A) * u + (C - A) * v + (A - B - C + D) * u * v;
  };
  const fbm = (x, y, first) => {
    let v = 0;
    let amp = 0.5;
    let norm = 0;
    for (let o = 0; o < 4 && first + o < lattices.length; o++) {
      v += amp * sample(lattices[first + o], x, y);
      norm += amp;
      amp *= 0.5;
    }
    return v / norm;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      out[i] = Math.round(fbm(x, y, 1) * 255);
      out[i + 1] = Math.round(fbm(x, y, 2) * 255);
      out[i + 2] = Math.round(fbm(x, y, 0) * 255);
      out[i + 3] = 255;
    }
  }
  return { size, data: out };
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(msg || 'shader compile failed');
  }
  return s;
}

function program(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link failed');
  const uni = {};
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(p, i);
    uni[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, uni };
}

/** Images are loaded once and shared between the GL path and the 2D fallback. */
const images = new Map();
export function loadImage(url) {
  let rec = images.get(url);
  if (rec) return rec;
  rec = { url, img: new Image(), ready: false, failed: false, listeners: new Set() };
  rec.img.decoding = 'async';
  rec.promise = new Promise((resolve) => {
    rec.img.onload = () => {
      rec.ready = true;
      rec.listeners.forEach((fn) => fn(rec));
      resolve(rec);
    };
    let tries = 0;
    rec.img.onerror = () => {
      // A busy dev server occasionally drops a request; try again before giving up.
      if (tries++ < 2) {
        setTimeout(() => {
          rec.img.src = `${url}${url.includes('?') ? '&' : '?'}r=${tries}`;
        }, 500 * tries);
        return;
      }
      rec.failed = true;
      resolve(rec);
    };
  });
  rec.img.src = url;
  images.set(url, rec);
  return rec;
}

export function createEngine() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const opts = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  };
  let gl = null;
  let isGL2 = false;
  try {
    gl = canvas.getContext('webgl2', opts);
    isGL2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', opts);
  } catch {
    gl = null;
  }

  let printProg = null;
  let woodProg = null;
  let quad = null;
  let lost = !gl;
  const photoTex = new Map(); // url -> WebGLTexture
  const devTex = new WeakMap(); // PrintState -> { tex, version }
  const devTexList = new Set();
  const onRestore = new Set();

  let noiseTex = null;
  const noise = buildNoise();
  function setup() {
    printProg = program(gl, PRINT_FRAG);
    noiseTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, noise.size, noise.size, 0, gl.RGBA, gl.UNSIGNED_BYTE, noise.data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    woodProg = program(gl, WOOD_FRAG);
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  if (gl) {
    try {
      setup();
    } catch {
      gl = null;
      lost = true;
    }
  }

  if (gl) {
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      lost = true;
      photoTex.clear();
      devTexList.clear();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      try {
        setup();
        lost = false;
        onRestore.forEach((fn) => fn());
      } catch {
        lost = true;
      }
    });
  }

  function ensureSize(w, h) {
    if (canvas.width < w || canvas.height < h) {
      canvas.width = Math.max(canvas.width, w);
      canvas.height = Math.max(canvas.height, h);
    }
  }

  function getPhotoTex(rec) {
    let tex = photoTex.get(rec.url);
    if (tex) return tex;
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, rec.img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (isGL2) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    photoTex.set(rec.url, tex);
    return tex;
  }

  function getDevTex(state) {
    let rec = devTex.get(state);
    if (!rec || !devTexList.has(rec)) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      rec = { tex, version: -1 };
      devTex.set(state, rec);
      devTexList.add(rec);
    }
    if (rec.version !== state.version) {
      gl.bindTexture(gl.TEXTURE_2D, rec.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, state.nx, state.ny, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, state.toBytes());
      rec.version = state.version;
    }
    return rec.tex;
  }

  function cropFor(rec, aspect) {
    if (!rec || !rec.ready) return [0, 0, 1, 1];
    const A = rec.img.naturalWidth / rec.img.naturalHeight;
    if (A > aspect) {
      const s = aspect / A;
      return [(1 - s) / 2, 0, s, 1];
    }
    const s = A / aspect;
    return [0, (1 - s) / 2, 1, s];
  }

  // 2D fallback when WebGL is unavailable: mud, then the photo masked by the development map.
  const mask = document.createElement('canvas');
  const tmp = document.createElement('canvas');
  function render2D(view, rec) {
    const { ctx, canvas: out, state } = view;
    const w = out.width;
    const h = out.height;
    ctx.fillStyle = '#545a50';
    ctx.fillRect(0, 0, w, h);
    if (!rec || !rec.ready) return;
    mask.width = state.nx;
    mask.height = state.ny;
    const mctx = mask.getContext('2d');
    const id = mctx.createImageData(state.nx, state.ny);
    const bytes = state.toBytes();
    const f = state.fade;
    for (let i = 0; i < bytes.length; i++) {
      id.data[i * 4 + 3] = f > 0 ? Math.max(bytes[i], f * 255) : bytes[i];
    }
    mctx.putImageData(id, 0, 0);
    tmp.width = w;
    tmp.height = h;
    const t = tmp.getContext('2d');
    const [cx, cy, cw, ch] = cropFor(rec, w / h);
    const iw = rec.img.naturalWidth;
    const ih = rec.img.naturalHeight;
    t.globalCompositeOperation = 'source-over';
    t.drawImage(rec.img, cx * iw, cy * ih, cw * iw, ch * ih, 0, 0, w, h);
    t.globalCompositeOperation = 'destination-in';
    t.imageSmoothingEnabled = true;
    t.drawImage(mask, 0, 0, w, h);
    ctx.drawImage(tmp, 0, 0);
  }

  function pickRec(view) {
    for (const url of view.urls) {
      const rec = loadImage(url);
      if (rec.ready) return rec;
    }
    return null;
  }

  function render(view) {
    const out = view.canvas;
    const w = out.width;
    const h = out.height;
    if (!w || !h) return;
    const rec = pickRec(view);
    view.renderedVersion = view.state.version;
    view.renderedUrl = rec ? rec.url : null;
    if (!gl || lost) {
      render2D(view, rec);
      return;
    }
    ensureSize(w, h);
    gl.viewport(0, 0, w, h);
    gl.useProgram(printProg.p);
    const u = printProg.uni;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, getDevTex(view.state));
    gl.uniform1i(u.uDev, 1);
    gl.activeTexture(gl.TEXTURE0);
    if (rec) gl.bindTexture(gl.TEXTURE_2D, getPhotoTex(rec));
    else gl.bindTexture(gl.TEXTURE_2D, getDevTex(view.state));
    gl.uniform1i(u.uPhoto, 0);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    gl.uniform1i(u.uNoise, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform4fv(u.uCrop, cropFor(rec, w / h));
    gl.uniform2f(u.uSize, w, h);
    gl.uniform1f(u.uAspect, w / h);
    gl.uniform1f(u.uSeed, view.state.seedF);
    gl.uniform1f(u.uFade, view.state.fade > 0 ? view.state.fade * view.state.fade * (3 - 2 * view.state.fade) : 0);
    gl.uniform1f(u.uReady, rec ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    view.ctx.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, w, h);
  }

  function renderWood(target, scale) {
    if (!gl || lost) return false;
    const w = target.width;
    const h = target.height;
    ensureSize(w, h);
    gl.viewport(0, 0, w, h);
    gl.useProgram(woodProg.p);
    gl.uniform2f(woodProg.uni.uRes, w, h);
    gl.uniform1f(woodProg.uni.uScale, scale);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const ctx = target.getContext('2d', { alpha: false });
    ctx.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, w, h);
    return true;
  }

  function dropPhoto(url) {
    const tex = photoTex.get(url);
    if (tex && gl) gl.deleteTexture(tex);
    photoTex.delete(url);
  }

  return {
    get webgl() {
      return !!gl && !lost;
    },
    render,
    renderWood,
    dropPhoto,
    onRestore: (fn) => onRestore.add(fn),
  };
}
