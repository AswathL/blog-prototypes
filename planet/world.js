// The tiny planet: scene, procedural layout, life (tram, smoke, clouds, stork, moon),
// spin/zoom input, camera flights and day/night.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import * as M from './models.js';

const R = 10;
const TRACK_H = 0.1;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const Y = new THREE.Vector3(0, 1, 0);
const S_HOUSE = 1.5;
const S_BOX = 1.55;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  outBack: (t) => {
    const c1 = 1.5;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

/* ---------------- noise ---------------- */
function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function fbm(x, y, z) {
  return vnoise(x, y, z) * 0.55 + vnoise(x * 2.03 + 5.1, y * 2.03 + 1.7, z * 2.03 + 3.3) * 0.3 + vnoise(x * 4.1 + 9.2, y * 4.1 + 2.8, z * 4.1 + 7.4) * 0.15;
}

const latOf = (d) => Math.asin(clamp(d.y, -1, 1));
function dirLL(lat, lon) {
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
}
/** Tangent "front" for an object at n: it faces the equator (and the tram). */
function frontAt(n) {
  const east = new THREE.Vector3().crossVectors(Y, n);
  if (east.lengthSq() < 1e-8) east.set(1, 0, 0);
  east.normalize();
  const north = new THREE.Vector3().crossVectors(n, east).normalize();
  return n.y >= 0 ? north.negate() : north;
}
function basisQuat(n, f) {
  const x = new THREE.Vector3().crossVectors(n, f).normalize();
  const ff = new THREE.Vector3().crossVectors(x, n).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, n, ff));
}

/* ---------------- shaders ---------------- */
const SKY_VS = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const SKY_FS = /* glsl */ `
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot;
uniform vec3 uGlowA; uniform vec3 uGlowB; uniform vec3 uSun; uniform vec3 uSunDir; uniform float uDay;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uBot, uMid, smoothstep(-0.75, -0.05, h));
  col = mix(col, uTop, smoothstep(-0.05, 0.7, h));
  float a = pow(max(dot(d, normalize(vec3(-0.62, 0.32, -0.72))), 0.0), 5.0);
  float b = pow(max(dot(d, normalize(vec3(0.7, -0.28, -0.66))), 0.0), 4.0);
  col += uGlowA * a * 0.42 + uGlowB * b * 0.36;
  float s = max(dot(d, uSunDir), 0.0);
  col += uSun * (smoothstep(0.9975, 0.9985, s) * 1.2 + pow(s, 40.0) * 0.45 + pow(s, 6.0) * 0.12) * uDay;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
const STAR_VS = /* glsl */ `
attribute float aSize; attribute float aPhase;
uniform float uTime; uniform float uPR;
varying float vTw;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vTw = 0.6 + 0.4 * sin(uTime * (0.7 + aPhase * 1.3) + aPhase * 40.0);
  gl_PointSize = aSize * uPR * (0.75 + 0.35 * vTw);
}`;
const STAR_FS = /* glsl */ `
uniform float uOpacity;
varying float vTw;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = smoothstep(0.5, 0.0, d);
  float cross = max(0.0, 1.0 - abs(c.x) * 14.0) * max(0.0, 1.0 - abs(c.y) * 2.2) + max(0.0, 1.0 - abs(c.y) * 14.0) * max(0.0, 1.0 - abs(c.x) * 2.2);
  float a = pow(core, 2.2) + cross * 0.25;
  gl_FragColor = vec4(vec3(1.0, 0.95, 0.86) * a * uOpacity * vTw, 1.0);
}`;
const HALO_VS = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const HALO_FS = /* glsl */ `
uniform vec3 uColor; uniform float uStrength;
varying vec3 vN; varying vec3 vV;
void main() {
  float d = -dot(normalize(vN), normalize(vV));
  float g = smoothstep(0.05, 0.58, d);
  g = pow(g, 3.8);
  gl_FragColor = vec4(uColor * g * uStrength, 1.0);
  #include <colorspace_fragment>
}`;

/* ---------------- palettes ---------------- */
const P = {
  night: {
    top: '#0b0a2c', mid: '#271f66', bot: '#3c2a74', glowA: '#7b54d6', glowB: '#2e86b0', sun: '#000000',
    hemiSky: '#8a86e0', hemiGround: '#2c2344', hemi: 0.78, light: '#b4bcff', lightI: 1.75,
    halo: '#8c7dff', rim: '#7f6fe0', cloud: '#c9c3ea', cloudE: '#2a2456', water: '#3f7fb2', clear: '#120f33',
  },
  day: {
    top: '#7fb6e8', mid: '#bfe0f4', bot: '#ffd9c2', glowA: '#fff4e2', glowB: '#ffd0b5', sun: '#fff1c9',
    hemiSky: '#fff3df', hemiGround: '#61844f', hemi: 0.9, light: '#fff1d8', lightI: 2.55,
    halo: '#cfeeff', rim: '#d8f1ff', cloud: '#ffffff', cloudE: '#000000', water: '#5cc4d4', clear: '#bfe0f4',
  },
  dusk: { mid: '#d8a6c8', bot: '#ff9f8a', glowA: '#ffb38a', glowB: '#c48ae0', halo: '#ffc2a8' },
};
const col = (h) => new THREE.Color(h);
const PN = Object.fromEntries(Object.entries(P.night).map(([k, v]) => [k, typeof v === 'string' ? col(v) : v]));
const PD = Object.fromEntries(Object.entries(P.day).map(([k, v]) => [k, typeof v === 'string' ? col(v) : v]));
const PK = Object.fromEntries(Object.entries(P.dusk).map(([k, v]) => [k, col(v)]));

const HOUSE_COLORS = ['#f6efe3', '#86b3dc', '#eab665', '#e8a7a1', '#a9d2b8', '#f6efe3'];
const SHUTTERS = ['#4f7a5a', '#7a4a32', '#3f6d8f', '#4f7a5a', '#8a3f35'];

export class World {
  constructor(opts) {
    this.o = opts;
    this.canvas = opts.canvas;
    this.reduced = !!opts.reduced;
    this.lite = !!opts.lite;
    this.time = 0;
    this.paused = false;
    this.running = false;
    this.mode = 'home';
    this.zoom = 1;
    this.zoomTarget = 1;
    this.spin = { vx: 0, vy: 0, auto: 0 };
    this.lastInteract = -10;
    this.holdUntil = 0;
    this.flight = null;
    this.tweens = [];
    this.hot = null;
    this.focused = null;
    this.camPos = new THREE.Vector3();
    this.camTarget = new THREE.Vector3();
    this.dayness = opts.dayness ?? 1;
    this.dayTarget = this.dayness;
    this._appliedDay = -1;

    const dpr = Math.min(window.devicePixelRatio || 1, this.lite ? 1.75 : 2);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: dpr < 2, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1500);

    this.gradient = M.makeGradientMap();
    this.bodyMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: this.gradient });
    this.doorLightMat = new THREE.MeshBasicMaterial({ color: '#ffcf7a' });
    this.glowTex = M.radialTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]);
    this.shadowTex = M.radialTexture([[0, 'rgba(0,0,0,0.85)'], [0.55, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]);
    this.shadowMat = new THREE.MeshBasicMaterial({ map: this.shadowTex, color: '#1c2a1c', transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

    this.planetRoot = new THREE.Group();
    this.scene.add(this.planetRoot);
    this.hitTargets = [];
    this.windowMats = [];

    this.layout();
    this.buildSky();
    this.buildLights();
    this.buildPlanet();
    this.buildEntries();
    this.buildFeatures();
    this.buildScenery();
    this.buildTrack();
    this.buildClouds();
    this.buildSmoke();
    this.buildMoon();
    this.buildStork();
    this.setupAssembly(!!opts.skipIntro || this.reduced);

    // a pleasant first view: the newest post faces us
    if (this.entries[0]) this.planetRoot.quaternion.setFromAxisAngle(Y, -this.entries[0].lon - 0.32);

    this.raycaster = new THREE.Raycaster();
    this.resize();
    this.applyDay(this.dayness);
    this.bindInput();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else if (!this.paused) this.start();
    });
    this.frame = this.frame.bind(this);
  }

  /* ================================================================ */
  /* Layout                                                           */
  /* ================================================================ */
  layout() {
    const posts = this.o.posts;
    const n = posts.length;
    this.entries = posts.map((post, i) => {
      const hemi = i % 2 === 0 ? 1 : -1;
      let lat, lon;
      if (n <= 12) {
        lat = hemi * (27 + ((i * 0.618034) % 1) * 15) * DEG;
        lon = ((i * 360) / Math.max(n, 1)) * DEG;
      } else {
        lat = hemi * (20 + ((i * 0.618034) % 1) * 38) * DEG;
        lon = i * 137.508 * DEG;
      }
      const dir = dirLL(lat, lon);
      return { post, slug: post.slug, kind: post.type, dir, lat, lon, index: i, tie: this.o.ties[post.slug] || null };
    });
    this.bySlug = Object.fromEntries(this.entries.map((e) => [e.slug, e]));

    const seaEntry = this.entries.find((e) => e.tie === 'sea');
    if (seaEntry) {
      const s = Math.sign(seaEntry.lat) || 1;
      this.sea = { dir: dirLL(seaEntry.lat + s * 19 * DEG, seaEntry.lon), r: 9.5 * DEG };
    } else {
      // pick the emptiest spot for a sea
      let best = null;
      for (let k = 0; k < 24; k++) {
        const d = dirLL((k % 2 ? -1 : 1) * 48 * DEG, k * 15 * DEG);
        const m = Math.min(...this.entries.map((e) => d.angleTo(e.dir)), 9);
        if (!best || m > best.m) best = { d, m };
      }
      this.sea = { dir: best.d, r: 9 * DEG };
    }
    this.pads = this.entries.map((e) => ({ dir: e.dir, cos0: Math.cos(15 * DEG), r: 9 * DEG, h: clamp(this.baseHeight(e.dir), 0.12, 0.3) }));
    this.entries.forEach((e, i) => (e.h = this.pads[i].h));
    this.rocksDir = dirLL(-70 * DEG, 150 * DEG);
    const kinds = ['sunflowers', 'church', 'sheep', 'roses', 'hay'];
    this.spots = this.freeSpots(kinds.length).map((dir, i) => {
      const pad = { dir, cos0: Math.cos(12 * DEG), r: 7 * DEG, h: clamp(this.baseHeight(dir), 0.1, 0.28) };
      this.pads.push(pad);
      return { kind: kinds[i], dir, h: pad.h };
    });
  }

  freeSpots(n) {
    const cands = [];
    const N = 600;
    for (let i = 0; i < N; i++) {
      const y = 1 - ((i + 0.5) / N) * 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * 2.399963;
      const d = new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r);
      const lat = Math.abs(latOf(d));
      if (lat < 15 * DEG || lat > 55 * DEG) continue;
      cands.push(d);
    }
    const blockers = [...this.entries.map((e) => [e.dir, 0]), [this.sea.dir, this.sea.r], [this.rocksDir, 6 * DEG]];
    const chosen = [];
    for (let k = 0; k < n; k++) {
      let best = null;
      let bs = -1;
      for (const d of cands) {
        let m = Infinity;
        for (const [b, pad] of blockers) m = Math.min(m, d.angleTo(b) - pad);
        for (const c of chosen) m = Math.min(m, d.angleTo(c) * 0.85);
        if (m > bs) {
          bs = m;
          best = d;
        }
      }
      chosen.push(best);
    }
    return chosen;
  }

  baseHeight(d) {
    let h = 0.16 + (fbm(d.x * 1.7 + 3.1, d.y * 1.7 + 1.3, d.z * 1.7 + 7.7) - 0.5) * 0.75;
    h += smooth(58 * DEG, 86 * DEG, latOf(d)) * 0.22;
    return h;
  }

  heightAt(d) {
    let h = this.baseHeight(d);
    for (const p of this.pads) {
      const c = d.dot(p.dir);
      if (c > p.cos0) {
        const a = Math.acos(clamp(c, -1, 1));
        h = lerp(p.h, h, smooth(p.r * 0.75, p.r * 1.65, a));
      }
    }
    h = lerp(TRACK_H, h, smooth(3.5 * DEG, 9 * DEG, Math.abs(latOf(d))));
    h = Math.max(h, 0.07);
    if (this.sea) {
      const a = d.angleTo(this.sea.dir) + (fbm(d.x * 5 + 1, d.y * 5 + 2, d.z * 5 + 3) - 0.5) * 4 * DEG;
      h = lerp(-0.32, h, smooth(this.sea.r - 3 * DEG, this.sea.r + 1.5 * DEG, a));
    }
    return h;
  }

  /** Planet-space transform for something standing on the surface at `dir`. */
  surfaceMatrix(dir, yaw = 0, scale = 1, lift = 0, front = null) {
    const n = dir.clone().normalize();
    const q = basisQuat(n, front || frontAt(n));
    if (yaw) q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, yaw));
    const p = n.clone().multiplyScalar(R + this.heightAt(n) + lift);
    return new THREE.Matrix4().compose(p, q, new THREE.Vector3(scale, scale, scale));
  }

  /* ================================================================ */
  /* Sky, lights, planet                                              */
  /* ================================================================ */
  buildSky() {
    this.skyU = {
      uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uBot: { value: new THREE.Color() },
      uGlowA: { value: new THREE.Color() }, uGlowB: { value: new THREE.Color() }, uSun: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(-0.55, 0.42, -0.72).normalize() }, uDay: { value: 1 },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 32, 20),
      new THREE.ShaderMaterial({ uniforms: this.skyU, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false }),
    );
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    this.scene.add(sky);

    const count = this.lite ? 520 : 950;
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const r = M.rng(9);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
      if (v.lengthSq() > 1 || v.lengthSq() < 0.01) { i--; continue; }
      v.normalize().multiplyScalar(450);
      pos.set([v.x, v.y, v.z], i * 3);
      const big = r() < 0.06;
      size[i] = big ? 6 + r() * 5 : 1.8 + r() * 2.6;
      phase[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    this.starU = { uTime: { value: 0 }, uPR: { value: this.renderer.getPixelRatio() }, uOpacity: { value: 1 } };
    this.stars = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: this.starU, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.stars.renderOrder = -9;
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.haloU = { uColor: { value: new THREE.Color() }, uStrength: { value: 1 } };
    this.halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(R * 1.2, 5),
      new THREE.ShaderMaterial({ uniforms: this.haloU, vertexShader: HALO_VS, fragmentShader: HALO_FS, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.scene.add(this.halo);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight('#fff', '#444', 1);
    this.sun = new THREE.DirectionalLight('#fff', 2);
    this.sun.position.set(-6, 8, 9);
    this.scene.add(this.hemi, this.sun);
  }

  buildPlanet() {
    const detail = this.lite ? 22 : 30;
    let g = new THREE.IcosahedronGeometry(1, detail);
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g = mergeVertices(g);
    const pos = g.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const d = new THREE.Vector3();
    const c = new THREE.Color();
    const C = {
      a: col('#78b05c'), b: col('#a0c96a'), dark: col('#5c9752'), meadow: col('#c3cf68'), sand: col('#f0d9a2'),
      bed: col('#3f8fa6'), gravel: col('#b9a58b'), snow: col('#f4f6fb'), alpine: col('#7ea57d'), yard: col('#cdbf8e'),
    };
    for (let i = 0; i < pos.count; i++) {
      d.fromBufferAttribute(pos, i).normalize();
      const h = this.heightAt(d);
      const n1 = fbm(d.x * 2.4 + 11, d.y * 2.4 + 3, d.z * 2.4 + 5);
      const n2 = fbm(d.x * 6.3 + 2, d.y * 6.3 + 9, d.z * 6.3 + 1);
      c.copy(C.a).lerp(C.b, smooth(0.38, 0.68, n1));
      c.lerp(C.dark, smooth(0.52, 0.74, n2) * 0.65);
      c.lerp(C.meadow, smooth(0.64, 0.8, n1) * 0.55);
      const lat = latOf(d);
      c.lerp(C.alpine, smooth(55 * DEG, 68 * DEG, lat) * 0.7);
      c.lerp(C.snow, smooth(71 * DEG, 77 * DEG, lat + (n2 - 0.5) * 6 * DEG));
      for (const p of this.pads) {
        const cc = d.dot(p.dir);
        if (cc > 0.98) c.lerp(C.yard, (1 - smooth(p.r * 0.32, p.r * 0.62, Math.acos(clamp(cc, -1, 1)))) * 0.35);
      }
      c.lerp(C.gravel, 1 - smooth(1.4 * DEG, 3.4 * DEG, Math.abs(lat)));
      if (this.sea) {
        const a = d.angleTo(this.sea.dir);
        c.lerp(C.sand, (1 - smooth(this.sea.r + 0.5 * DEG, this.sea.r + 3.5 * DEG, a)) * (h < 0.2 ? 1 : 0.4));
        if (h < 0.0) c.copy(C.bed);
      }
      d.multiplyScalar(R + h);
      pos.setXYZ(i, d.x, d.y, d.z);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.computeVertexNormals();
    this.rimU = { value: new THREE.Color() };
    const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: this.gradient });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uRim = this.rimU;
      shader.fragmentShader = 'uniform vec3 uRim;\n' + shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        'outgoingLight += uRim * pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6) * 0.55;\n#include <opaque_fragment>',
      );
    };
    this.planet = new THREE.Mesh(g, mat);
    this.planetRoot.add(this.planet);

    // sea
    this.waterMat = new THREE.MeshToonMaterial({ color: '#5cc4d4', gradientMap: this.gradient, transparent: true, opacity: 0.92 });
    const cap = this.sea.r + 6 * DEG;
    const wg = new THREE.SphereGeometry(R + 0.03, 40, 10, 0, TAU, 0, cap);
    wg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, this.sea.dir));
    this.water = new THREE.Mesh(wg, this.waterMat);
    this.planetRoot.add(this.water);
  }

  /* ================================================================ */
  /* Posts: houses and soapboxes                                      */
  /* ================================================================ */
  buildEntries() {
    let storyN = 0;
    for (const e of this.entries) {
      const isStory = e.kind === 'story';
      let model;
      if (isStory) {
        const k = storyN++;
        model = M.buildHouse({
          upper: e.tie === 'plovdiv' ? '#86b3dc' : HOUSE_COLORS[k % HOUSE_COLORS.length],
          shutters: SHUTTERS[k % SHUTTERS.length],
          bodyMat: this.bodyMat,
          doorLightMat: this.doorLightMat,
        });
      } else {
        model = M.buildSoapbox({ bodyMat: this.bodyMat });
      }
      e.model = model;
      e.S = isStory ? S_HOUSE : S_BOX;
      const g = model.group;
      e.group = g;
      e.front = frontAt(e.dir);
      e.quat = basisQuat(e.dir, e.front);
      e.basePos = e.dir.clone().multiplyScalar(R + e.h);
      g.position.copy(e.basePos);
      g.quaternion.copy(e.quat);
      g.scale.setScalar(e.S);
      e.scaleNow = e.S;
      e.hoverK = 0;
      this.windowMats.push(model.windowsMat);
      e.windowsMat = model.windowsMat;

      // soft contact shadow
      const sh = new THREE.Mesh(new THREE.CircleGeometry(isStory ? 1.05 : 0.7, 24), this.shadowMat);
      sh.rotation.x = -Math.PI / 2;
      sh.position.y = 0.02;
      sh.scale.set(1.15, isStory ? 1.05 : 1, 1);
      g.add(sh);

      // warm window glow
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: '#ffb85c', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.position.copy(model.glowAt);
      glow.scale.setScalar(isStory ? 2.6 : 1.4);
      g.add(glow);
      e.glow = glow;

      const hit = new THREE.Mesh(new THREE.SphereGeometry(model.hitRadius * (this.lite ? 1.2 : 1), 10, 8), new THREE.MeshBasicMaterial());
      hit.visible = false;
      hit.position.copy(model.hitCenter);
      hit.userData = { kind: 'post', slug: e.slug };
      g.add(hit);
      this.hitTargets.push(hit);

      this.addTie(e);
      this.planetRoot.add(g);
    }
  }

  /** Place a decoration on the tangent plane of an entry, sinking it to follow the curvature. */
  decor(e, obj, x, z, yaw = 0, scale = 1) {
    const sag = (e.S * (x * x + z * z)) / (2 * (R + e.h));
    obj.position.set(x, -sag, z);
    obj.rotation.y = yaw;
    obj.scale.setScalar(scale);
    e.group.add(obj);
    return obj;
  }

  egg(obj, name, radius, center = [0, 0.3, 0]) {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), new THREE.MeshBasicMaterial());
    hit.visible = false;
    hit.position.set(...center);
    hit.userData = { kind: 'egg', egg: name };
    obj.add(hit);
    this.hitTargets.push(hit);
  }

  addTie(e) {
    const mat = this.bodyMat;
    switch (e.tie) {
      case 'sea': {
        const u = this.decor(e, M.buildUmbrella(mat), 0.95, 0.15, 0.4);
        u.userData.kind = 'umbrella';
        this.boat = M.buildBoat(mat);
        this.boat.scale.setScalar(1.6);
        this.planetRoot.add(this.boat);
        this.egg(this.boat, 'boat', 0.45, [0, 0.25, 0]);
        break;
      }
      case 'tramstop':
        this.decor(e, M.buildTramStop(mat), 0.75, 0.62, -0.3, 1.1);
        break;
      case 'plovdiv':
        this.decor(e, M.buildCobbles(mat), -0.22, 0.58, 0);
        break;
      case 'martenitsa': {
        const tree = this.decor(e, new THREE.Group(), 0.95, -0.25, 0.3, 1.25);
        tree.add(M.buildBlossomTree(mat));
        const m = M.buildMartenitsas(mat);
        tree.add(m.group);
        this.martenitsas = m.items;
        this.decor(e, M.buildNest(mat), -0.75, -0.45, 0, 1.1);
        break;
      }
      case 'cat': {
        const cat = M.buildCat(mat);
        cat.group.position.set(0, 1.9, 0.11);
        cat.group.scale.setScalar(1.25);
        e.group.add(cat.group);
        this.cat = cat;
        this.egg(cat.group, 'cat', 0.32, [0, 0.15, 0]);
        break;
      }
      case 'rocket': {
        const rk = M.buildRocket(mat, e.windowsMat);
        this.decor(e, rk.group, 0.98, 0.25, 0, 1.15);
        this.rocket = rk;
        this.egg(rk.group, 'rocket', 0.45, [0, 0.4, 0]);
        break;
      }
      case 'kuker': {
        const k = M.buildKuker(mat);
        this.decor(e, k.group, -0.98, 0.42, 0.35, 1.2);
        this.kuker = k;
        this.egg(k.group, 'kuker', 0.42, [0, 0.4, 0]);
        break;
      }
      default:
    }
  }


  /* ================================================================ */
  /* Countryside features (sunflowers, church, sheep, roses, hay)     */
  /* ================================================================ */
  spotGroup(sp, yaw = 0) {
    const g = new THREE.Group();
    const n = sp.dir.clone().normalize();
    g.position.copy(n).multiplyScalar(R + sp.h);
    g.quaternion.copy(basisQuat(n, frontAt(n)));
    if (yaw) g.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Y, yaw));
    g.userData.sagR = R + sp.h;
    g.userData.dir = n;
    this.planetRoot.add(g);
    this.featureGroups.push(g);
    return g;
  }

  sag(g, x, z) {
    return -(x * x + z * z) / (2 * g.userData.sagR);
  }

  buildFeatures() {
    this.featureGroups = [];
    const r = M.rng(11);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (const sp of this.spots) {
      if (sp.kind === 'sunflowers') {
        const g = this.spotGroup(sp, 0.4);
        const bed = new THREE.Mesh(M.soilBedGeometry(2.3, 1.7, 6), this.bodyMat);
        g.add(bed);
        const rows = 6, cols = 8;
        const inst = new THREE.InstancedMesh(M.sunflowerGeometry(), this.bodyMat, rows * cols);
        let k = 0;
        this.rebel = null;
        for (let i = 0; i < rows; i++)
          for (let j = 0; j < cols; j++) {
            const x = -1.0 + (j / (cols - 1)) * 2.0 + (r() - 0.5) * 0.06;
            const z = -0.7 + (i / (rows - 1)) * 1.4;
            const rebel = i === 2 && j === 5;
            const yaw = rebel ? Math.PI : (r() - 0.5) * 0.3;
            const s = 1.15 + r() * 0.35;
            q.setFromAxisAngle(Y, yaw);
            m.compose(new THREE.Vector3(x, 0.05 + this.sag(g, x, z), z), q, new THREE.Vector3(s, s, s));
            inst.setMatrixAt(k, m);
            if (rebel) this.rebel = { inst, k, x, z, s, yaw, y: 0.05 + this.sag(g, x, z) };
            k++;
          }
        g.add(inst);
        this.sunflowers = inst;
        this.egg(g, 'sunflowers', 1.3, [0, 0.4, 0]);
      } else if (sp.kind === 'church') {
        const g = this.spotGroup(sp, -0.5);
        const wm = new THREE.MeshBasicMaterial({ color: '#3a4766' });
        this.windowMats.push(wm);
        this.churchWindows = wm;
        const c = M.buildChurch(this.bodyMat, wm);
        c.scale.setScalar(1.45);
        g.add(c);
        const sh = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), this.shadowMat);
        sh.rotation.x = -Math.PI / 2;
        sh.position.y = 0.03;
        g.add(sh);
        this.egg(g, 'church', 1.2, [0, 0.8, 0]);
      } else if (sp.kind === 'sheep') {
        const g = this.spotGroup(sp, 0);
        const n = 6;
        const inst = new THREE.InstancedMesh(M.sheepGeometry(), this.bodyMat, n);
        inst.frustumCulled = false;
        g.add(inst);
        this.sheep = {
          inst,
          g,
          list: Array.from({ length: n }, (_, i) => ({ cx: (r() - 0.5) * 1.6, cz: (r() - 0.5) * 1.3, rad: 0.18 + r() * 0.25, ph: r() * TAU, sp: (0.25 + r() * 0.25) * (r() < 0.5 ? -1 : 1), s: 1.2 + r() * 0.35 })),
        };
        this.egg(g, 'sheep', 1.3, [0, 0.3, 0]);
      } else if (sp.kind === 'roses') {
        const g = this.spotGroup(sp, 0.9);
        const rows = 4, cols = 7;
        const inst = new THREE.InstancedMesh(M.roseBushGeometry(), this.bodyMat, rows * cols);
        let k = 0;
        for (let i = 0; i < rows; i++)
          for (let j = 0; j < cols; j++) {
            const x = -0.9 + (j / (cols - 1)) * 1.8;
            const z = -0.55 + (i / (rows - 1)) * 1.1;
            q.setFromAxisAngle(Y, r() * TAU);
            const s = 1.25 + r() * 0.4;
            m.compose(new THREE.Vector3(x, this.sag(g, x, z) - 0.02, z), q, new THREE.Vector3(s, s, s));
            inst.setMatrixAt(k++, m);
          }
        g.add(inst);
      } else if (sp.kind === 'hay') {
        const g = this.spotGroup(sp, 0.2);
        const spots = [
          [-0.6, -0.3, 1.5], [0.15, -0.5, 1.3], [0.7, 0.15, 1.6], [-0.2, 0.45, 1.2], [-0.95, 0.4, 1.1],
        ].map(([x, z, s]) => [x, z, s]);
        const hay = new THREE.Mesh(M.hayGeometry(spots), this.bodyMat);
        g.add(hay);
        hay.position.y = this.sag(g, 0.6, 0.4);
      }
    }
  }

  updateFeatures(dt) {
    const t = this.time;
    const sh = this.sheep;
    if (sh) {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const p = new THREE.Vector3();
      const sc = new THREE.Vector3();
      sh.list.forEach((s, i) => {
        const walking = Math.sin(t * 0.35 + i * 1.7) > -0.1;
        s.ph += (walking ? s.sp : 0) * dt * (this.reduced ? 0.4 : 1) + (s.boost || 0) * dt;
        if (s.boost) s.boost = Math.max(0, s.boost - dt * 3);
        const x = s.cx + Math.cos(s.ph) * s.rad;
        const z = s.cz + Math.sin(s.ph) * s.rad;
        const hop = walking ? Math.abs(Math.sin(t * 7 + i)) * 0.025 : 0;
        p.set(x, this.sag(sh.g, x, z) + hop + (s.jump || 0), z);
        const sg = Math.sign(s.sp) || 1;
        q.setFromAxisAngle(Y, Math.atan2(-Math.cos(s.ph) * sg, -Math.sin(s.ph) * sg));
        const k = this.asm.done ? 1 : Math.max(0.001, clamp((this.asm.t - 1.4 - i * 0.08) / 0.4, 0, 1));
        m.compose(p, q, sc.setScalar(s.s * k));
        sh.inst.setMatrixAt(i, m);
      });
      sh.inst.instanceMatrix.needsUpdate = true;
    }
    if (this.rebelSpin != null && this.rebel) {
      const k = clamp((t - this.rebelSpin) / 2.6, 0, 1);
      const rb = this.rebel;
      const yaw = rb.yaw + Math.sin(k * Math.PI) * Math.PI;
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(rb.x, rb.y, rb.z),
        new THREE.Quaternion().setFromAxisAngle(Y, yaw),
        new THREE.Vector3(rb.s, rb.s, rb.s),
      );
      rb.inst.setMatrixAt(rb.k, m);
      rb.inst.instanceMatrix.needsUpdate = true;
      if (k >= 1) this.rebelSpin = null;
    }
  }

  /* ================================================================ */
  /* Scenery: trees, flowers, rocks, mountains                        */
  /* ================================================================ */
  okForScenery(d, minEntry = 12) {
    const lat = latOf(d);
    if (Math.abs(lat) < 7 * DEG) return false;
    if (lat > 64 * DEG) return false;
    if (this.sea && d.angleTo(this.sea.dir) < this.sea.r + 3.5 * DEG) return false;
    const c = Math.cos(minEntry * DEG);
    for (const e of this.entries) if (d.dot(e.dir) > c) return false;
    if (d.dot(this.rocksDir) > Math.cos(9 * DEG)) return false;
    const cs = Math.cos(9.5 * DEG);
    for (const sp of this.spots) if (d.dot(sp.dir) > cs) return false;
    return true;
  }

  buildScenery() {
    const r = M.rng(42);
    const rand = () => new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
    // trees, clustered into little forests by noise
    const want = this.lite ? 96 : 150;
    const trees = [];
    const minCos = Math.cos(2.75 * DEG);
    for (let tries = 0; tries < 9000 && trees.length < want; tries++) {
      const d = rand();
      if (d.lengthSq() > 1 || d.lengthSq() < 0.01) continue;
      d.normalize();
      if (!this.okForScenery(d)) continue;
      if (fbm(d.x * 2.6 + 7, d.y * 2.6 + 1, d.z * 2.6 + 4) < 0.47) continue;
      if (trees.some((t) => t.dot(d) > minCos)) continue;
      trees.push(d);
    }
    const nRound = Math.round(trees.length * 0.22);
    const conifer = new THREE.InstancedMesh(M.coniferGeometry(), this.bodyMat, Math.max(1, trees.length));
    const round = new THREE.InstancedMesh(M.roundTreeGeometry(), this.bodyMat, Math.max(1, nRound));
    const autumn = ['#f0a43c', '#e2703a', '#f4c64e', '#d9542f', '#f2b45a'].map(col);
    const tint = [col('#ffffff'), col('#e4f3d6'), col('#d6e8ee'), col('#fff3dc')];
    this.treeData = [];
    let ci = 0, ri = 0;
    const m = new THREE.Matrix4();
    trees.forEach((d, i) => {
      const isRound = i % Math.round(trees.length / Math.max(nRound, 1)) === 0 && ri < nRound;
      const s = (isRound ? 1.05 : 0.95) * (0.75 + r() * 0.65);
      m.copy(this.surfaceMatrix(d, r() * TAU, s, -0.03));
      const mesh = isRound ? round : conifer;
      const idx = isRound ? ri++ : ci++;
      mesh.setMatrixAt(idx, m);
      mesh.setColorAt(idx, isRound ? autumn[Math.floor(r() * autumn.length)] : tint[Math.floor(r() * tint.length)]);
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
      m.decompose(p, q, sc);
      this.treeData.push({ mesh, idx, p, q, s, delay: 0.55 + (1 - d.dot(new THREE.Vector3(0, 0.4, 1).normalize())) * 0.45 + r() * 0.2 });
    });
    conifer.count = ci;
    round.count = ri;
    this.trees = [conifer, round];
    this.planetRoot.add(conifer, round);

    // flower patches
    const fl = this.lite ? 80 : 150;
    const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.045, 0), new THREE.MeshToonMaterial({ gradientMap: this.gradient }), fl);
    const fcols = ['#ffffff', '#ffd23f', '#ff6f8f', '#e2453a', '#b9a4ff'].map(col);
    let fi = 0;
    for (let tries = 0; tries < 400 && fi < fl; tries++) {
      const c = rand();
      if (c.lengthSq() > 1 || c.lengthSq() < 0.01) continue;
      c.normalize();
      if (!this.okForScenery(c, 8)) continue;
      const fc = fcols[Math.floor(r() * fcols.length)];
      for (let k = 0; k < 7 && fi < fl; k++) {
        const d = c.clone().add(rand().multiplyScalar(0.035)).normalize();
        if (!this.okForScenery(d, 8)) continue;
        flowers.setMatrixAt(fi, this.surfaceMatrix(d, 0, 0.8 + r() * 0.6, 0.02));
        flowers.setColorAt(fi, fc);
        fi++;
      }
    }
    flowers.count = fi;
    this.flowers = flowers;
    this.planetRoot.add(flowers);

    // grass tufts give the meadows some texture
    const gt = this.lite ? 150 : 280;
    const tufts = new THREE.InstancedMesh(M.grassTuftGeometry(), this.bodyMat, gt);
    let ti = 0;
    for (let tries = 0; tries < 3000 && ti < gt; tries++) {
      const d = rand();
      if (d.lengthSq() > 1 || d.lengthSq() < 0.01) continue;
      d.normalize();
      if (!this.okForScenery(d, 8.5)) continue;
      tufts.setMatrixAt(ti++, this.surfaceMatrix(d, r() * TAU, 1.1 + r() * 0.9, -0.02));
    }
    tufts.count = ti;
    this.tufts = tufts;
    this.planetRoot.add(tufts);

    // pebbles
    const pebbles = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.13, 0), new THREE.MeshToonMaterial({ color: '#a39caa', gradientMap: this.gradient }), 34);
    let pi = 0;
    for (let tries = 0; tries < 400 && pi < 34; tries++) {
      const d = rand();
      if (d.lengthSq() > 1 || d.lengthSq() < 0.01) continue;
      d.normalize();
      if (!this.okForScenery(d, 8.5)) continue;
      pebbles.setMatrixAt(pi++, this.surfaceMatrix(d, r() * 6, 0.6 + r() * 1.1, -0.03));
    }
    pebbles.count = pi;
    this.pebbles = pebbles;
    this.planetRoot.add(pebbles);

    // a snowy little Rila on the north pole
    const peaks = [
      { lat: 86, lon: 0, h: 1.25 }, { lat: 77, lon: 40, h: 0.9 }, { lat: 78, lon: 160, h: 1.0 }, { lat: 76, lon: 270, h: 0.8 }, { lat: 80, lon: 220, h: 0.7 },
    ].map((p) => ({ matrix: this.surfaceMatrix(dirLL(p.lat * DEG, p.lon * DEG), p.lon * DEG, 1, -0.05), h: p.h }));
    this.mountains = new THREE.Mesh(M.mountainsGeometry(peaks), this.bodyMat);
    this.planetRoot.add(this.mountains);

    // Belogradchik-ish rock spires in the south
    const spires = [];
    for (let k = 0; k < 6; k++) {
      const d = this.rocksDir.clone().add(new THREE.Vector3(Math.sin(k * 2.1), Math.cos(k * 1.7), Math.sin(k * 3.3)).multiplyScalar(0.07)).normalize();
      spires.push({ matrix: this.surfaceMatrix(d, k, 1, -0.05), h: 0.7 + ((k * 0.37) % 1) * 0.9, tint: k % 2 ? '#c96f4f' : '#d98c61' });
    }
    this.spires = new THREE.Mesh(M.rockSpiresGeometry(spires), this.bodyMat);
    this.planetRoot.add(this.spires);
  }

  /* ================================================================ */
  /* Tram on the equator                                              */
  /* ================================================================ */
  buildTrack() {
    this.track = new THREE.Group();
    const railMat = new THREE.MeshToonMaterial({ color: '#7d7a86', gradientMap: this.gradient });
    const rr = R + TRACK_H + 0.04;
    for (const y of [-0.085, 0.085]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(Math.sqrt(rr * rr - y * y), 0.014, 4, 220), railMat);
      t.rotation.x = Math.PI / 2;
      t.position.y = y;
      this.track.add(t);
    }
    const n = this.lite ? 170 : 230;
    const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.055, 0.03, 0.27), new THREE.MeshToonMaterial({ color: '#6e5442', gradientMap: this.gradient }), n);
    for (let i = 0; i < n; i++) sleepers.setMatrixAt(i, this.trackMatrix((i / n) * TAU, TRACK_H + 0.012, 1));
    this.track.add(sleepers);
    this.planetRoot.add(this.track);

    const a = M.buildTramCar({ lead: true, bodyMat: this.bodyMat });
    const b = M.buildTramCar({ lead: false, bodyMat: this.bodyMat });
    this.windowMats.push(a.windowsMat, b.windowsMat);
    this.tramWindowMats = [a.windowsMat, b.windowsMat];
    const bellows = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.28), new THREE.MeshToonMaterial({ color: '#2a2a30', gradientMap: this.gradient }));
    this.tram = { cars: [a.group, b.group], bellows, angle: 0.6, speed: TAU / 46, stopUntil: 0, scale: 1.5, k: 1 };
    this.tram.cars.forEach((c) => c.scale.setScalar(1.5));
    bellows.scale.setScalar(1.5);
    this.planetRoot.add(a.group, b.group, bellows);
    this.egg(a.group, 'tram', 0.6, [0, 0.3, 0]);
    this.egg(b.group, 'tram', 0.6, [0, 0.3, 0]);
  }

  trackMatrix(theta, lift, s) {
    const rad = R + lift;
    const p = new THREE.Vector3(Math.cos(theta) * rad, 0, -Math.sin(theta) * rad);
    const x = new THREE.Vector3(-Math.sin(theta), 0, -Math.cos(theta));
    const up = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
    const z = new THREE.Vector3().crossVectors(x, up);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, z));
    return new THREE.Matrix4().compose(p, q, new THREE.Vector3(s, s, s));
  }

  /* ================================================================ */
  /* Clouds & smoke                                                   */
  /* ================================================================ */
  buildClouds() {
    this.cloudMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: this.gradient, emissive: '#000000' });
    const n = this.lite ? 4 : 6;
    const r = M.rng(5);
    this.clouds = [];
    for (let i = 0; i < n; i++) {
      const pivot = new THREE.Group();
      pivot.quaternion.setFromEuler(new THREE.Euler(r() * TAU, r() * TAU, r() * TAU));
      const mesh = new THREE.Mesh(M.cloudGeometry(i + 3), this.cloudMat);
      mesh.position.y = R + 2.6 + r() * 1.1;
      const s = 0.9 + r() * 0.6;
      mesh.scale.setScalar(s);
      pivot.add(mesh);
      this.planetRoot.add(pivot);
      this.clouds.push({ pivot, mesh, s, speed: (0.025 + r() * 0.03) * (r() < 0.5 ? -1 : 1), vis: 1 });
    }
  }

  buildSmoke() {
    const chimneys = this.entries.filter((e) => e.kind === 'story');
    this.puffsPer = 5;
    const geo = new THREE.IcosahedronGeometry(1, 1);
    this.smokeMat = new THREE.MeshToonMaterial({ color: '#f4f1ec', gradientMap: this.gradient, transparent: true, opacity: 0.88, emissive: '#000000' });
    this.smoke = new THREE.InstancedMesh(geo, this.smokeMat, Math.max(1, chimneys.length * this.puffsPer));
    this.smoke.frustumCulled = false;
    this.smokeSrc = chimneys.map((e) => {
      e.group.updateMatrix();
      const top = e.model.chimneyTop.clone().applyMatrix4(e.group.matrix);
      const east = new THREE.Vector3().crossVectors(Y, e.dir).normalize();
      return { top, up: e.dir.clone(), wind: east, e };
    });
    this.planetRoot.add(this.smoke);
  }

  /* ================================================================ */
  /* Moon with a ring of photos                                       */
  /* ================================================================ */
  buildMoon() {
    this.moonMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: this.gradient, emissive: '#fff1c8', emissiveIntensity: 0 });
    this.moonR = 1.55;
    this.moon = new THREE.Group();
    this.moonBody = new THREE.Mesh(M.moonGeometry(this.moonR, 3, mergeVertices), this.moonMat);
    this.moon.add(this.moonBody);
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: '#fff0c4', transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.moonGlow.scale.setScalar(this.moonR * 5.5);
    this.moon.add(this.moonGlow);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(this.moonR * 2.1, 10, 8), new THREE.MeshBasicMaterial());
    hit.visible = false;
    hit.userData = { kind: 'moon' };
    this.moon.add(hit);
    this.hitTargets.push(hit);

    this.ring = new THREE.Group();
    this.ring.rotation.set(0.42, 0, -0.25);
    this.moon.add(this.ring);
    const photos = this.o.ringPhotos || [];
    this.polaroids = [];
    const loader = new THREE.TextureLoader();
    const frameGeo = new THREE.PlaneGeometry(0.95, 1.1);
    const photoGeo = new THREE.PlaneGeometry(0.8, 0.8);
    photos.forEach((ph, i) => {
      const a = (i / photos.length) * TAU;
      const holder = new THREE.Group();
      holder.position.set(Math.cos(a) * 3.0, 0, Math.sin(a) * 3.0);
      const card = new THREE.Group();
      const frameMat = new THREE.MeshBasicMaterial({ color: '#fbf6ec' });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      const photoMat = new THREE.MeshBasicMaterial({ color: '#d9cfc0' });
      const photo = new THREE.Mesh(photoGeo, photoMat);
      photo.position.set(0, 0.07, 0.004);
      card.add(frame, photo);
      card.rotation.z = (i % 2 ? 1 : -1) * 0.08;
      card.scale.setScalar(0.001);

      holder.add(card);
      this.ring.add(holder);
      const p = { holder, card, frameMat, photoMat, loaded: false, popT: -1 };
      this.polaroids.push(p);
      p.ph = ph;
    });
    // load the prints one at a time (gentle on small servers), retrying once on a hiccup
    const queue = [...this.polaroids];
    const next = (tries = 0) => {
      const p = queue[0];
      if (!p) return;
      loader.load(
        p.ph.url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const ar = p.ph.w / p.ph.h;
          if (ar > 1) {
            tex.repeat.set(1 / ar, 1);
            tex.offset.set((1 - 1 / ar) / 2, 0);
          } else {
            tex.repeat.set(1, ar);
            tex.offset.set(0, (1 - ar) / 2);
          }
          p.photoMat.map = tex;
          p.photoMat.color.setScalar(lerp(0.78, 1, this.dayness));
          p.photoMat.needsUpdate = true;
          p.loaded = true;
          queue.shift();
          next();
        },
        undefined,
        () => {
          if (tries < 2) setTimeout(() => next(tries + 1), 700 * (tries + 1));
          else {
            queue.shift();
            next();
          }
        },
      );
    };
    setTimeout(next, 400);
    this.moonPhase = 0.35;
    this.moonPaused = false;
    this.scene.add(this.moon);
  }

  /* ================================================================ */
  /* Stork                                                            */
  /* ================================================================ */
  buildStork() {
    const s = M.buildStork(this.bodyMat);
    s.group.scale.setScalar(1.7);
    s.group.visible = false;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 6), new THREE.MeshBasicMaterial());
    hit.visible = false;
    hit.userData = { kind: 'stork' };
    s.group.add(hit);
    this.hitTargets.push(hit);
    this.scene.add(s.group);
    this.stork = { ...s, active: false, wait: this.reduced ? 14 : 7, u: 0, celebrate: -1 };
  }

  startStork() {
    const s = this.stork;
    const r = Math.random();
    const dir = r < 0.5 ? 1 : -1;
    const camDir = this.camPos.clone().sub(this.camTarget).normalize();
    const right = new THREE.Vector3().crossVectors(Y, camDir).normalize();
    const up = new THREE.Vector3().crossVectors(camDir, right).normalize();
    const center = this.camTarget.clone().addScaledVector(camDir, R + 5);
    const depth = this.camPos.distanceTo(center);
    const tanV = Math.tan((this.camera.fov * DEG) / 2);
    const halfW = depth * tanV * this.camera.aspect;
    const halfH = depth * tanV;
    s.path = { center, right, up, camDir, x0: -dir * (halfW + 3), x1: dir * (halfW + 3), y0: (Math.random() * 0.55 + 0.05) * halfH, arc: (Math.random() - 0.3) * halfH * 0.35, dir };
    s.dur = (this.reduced ? 16 : 11) * Math.max(1, halfW / 14);
    s.u = 0;
    s.active = true;
    s.celebrate = -1;
    s.speedK = 1;
    s.group.visible = true;
  }

  storkPos(u, out) {
    const p = this.stork.path;
    const x = lerp(p.x0, p.x1, u);
    const y = p.y0 + Math.sin(u * Math.PI) * p.arc + Math.sin(this.time * 1.1) * 0.25;
    return out.copy(p.center).addScaledVector(p.right, x).addScaledVector(p.up, y).addScaledVector(p.camDir, Math.sin(u * Math.PI) * 3);
  }

  /* ================================================================ */
  /* Assembly ("the planet builds itself")                            */
  /* ================================================================ */
  setupAssembly(skip) {
    this.asm = { t: skip ? 99 : -0.15, done: false };
    if (skip) this.applyAssembly(99);
    else this.applyAssembly(0);
  }

  applyAssembly(t) {
    const prog = (start, dur) => clamp((t - start) / dur, 0, 1);
    const pl = ease.outBack(prog(0, 1.0));
    const ps = Math.max(0.001, pl);
    this.planet.scale.setScalar(ps);
    this.water.scale.setScalar(ps);
    this.halo.scale.setScalar(Math.max(0.001, ease.out(prog(0.1, 1.1))));
    const rise = (start, dur, k = 0.06) => 1 - k + k * ease.outBack(prog(start, dur));
    const vis = (o, start) => (o.visible = t > start);
    this.mountains.scale.setScalar(rise(0.7, 0.8, 0.12));
    vis(this.mountains, 0.7);
    this.spires.scale.setScalar(rise(0.8, 0.8, 0.1));
    vis(this.spires, 0.8);
    this.flowers.scale.setScalar(rise(1.0, 0.6, 0.04));
    vis(this.flowers, 1.0);
    this.pebbles.scale.setScalar(rise(0.9, 0.6, 0.04));
    vis(this.pebbles, 0.9);
    this.tufts.scale.setScalar(rise(0.95, 0.6, 0.04));
    vis(this.tufts, 0.95);
    this.track.scale.setScalar(rise(1.1, 0.7, 0.08));
    vis(this.track, 1.1);
    this.tram.k = ease.outBack(prog(1.6, 0.6));
    this.boat && (this.boat.visible = t > 1.4);

    const m = new THREE.Matrix4();
    const sc = new THREE.Vector3();
    for (const d of this.treeData) {
      const k = Math.max(0.0001, ease.outBack(prog(d.delay, 0.45)));
      d.mesh.setMatrixAt(d.idx, m.compose(d.p, d.q, sc.setScalar(d.s * k)));
    }
    this.trees.forEach((tm) => (tm.instanceMatrix.needsUpdate = true));

    this.entries.forEach((e, i) => {
      const k = prog(1.0 + i * 0.11, 0.6);
      e.dropK = 1 - ease.out(k);
      e.popK = Math.max(0.001, ease.outBack(k));
    });
    this.featureGroups.forEach((g, i) => {
      const k = Math.max(0.001, ease.outBack(prog(1.15 + i * 0.1, 0.55)));
      g.scale.setScalar(k);
    });
    this.clouds.forEach((c, i) => (c.mesh.scale.setScalar(Math.max(0.001, ease.outBack(prog(1.6 + i * 0.1, 0.6))) * c.s)));
    this.moonIntro = 1 - ease.out(prog(1.3, 1.4));
    this.starIntro = ease.inOutSine(prog(0, 1.8));
    if (t >= 3.2) this.asm.done = true;
  }

  /* ================================================================ */
  /* Day / night                                                      */
  /* ================================================================ */
  setDayness(v, animate = true) {
    this.dayTarget = v;
    if (!animate || this.reduced) this.dayness = v;
  }

  applyDay(d) {
    this._appliedDay = d;
    const nd = 1 - d;
    const dusk = 1 - Math.abs(2 * d - 1);
    const mix = (k) => new THREE.Color().copy(PN[k]).lerp(PD[k], d);
    const u = this.skyU;
    u.uTop.value.copy(mix('top'));
    u.uMid.value.copy(mix('mid')).lerp(PK.mid, dusk * 0.6);
    u.uBot.value.copy(mix('bot')).lerp(PK.bot, dusk * 0.7);
    u.uGlowA.value.copy(mix('glowA')).lerp(PK.glowA, dusk * 0.5);
    u.uGlowB.value.copy(mix('glowB')).lerp(PK.glowB, dusk * 0.5);
    u.uSun.value.copy(PD.sun);
    u.uDay.value = smooth(0.35, 1, d);
    this.starU.uOpacity.value = Math.pow(nd, 1.4) * (this.starIntro ?? 1);
    this.hemi.color.copy(mix('hemiSky'));
    this.hemi.groundColor.copy(mix('hemiGround'));
    this.hemi.intensity = lerp(PN.hemi, PD.hemi, d);
    this.sun.color.copy(mix('light'));
    this.sun.intensity = lerp(PN.lightI, PD.lightI, d);
    this.haloU.uColor.value.copy(mix('halo')).lerp(PK.halo, dusk * 0.5);
    this.rimU.value.copy(mix('rim')).multiplyScalar(lerp(0.9, 0.55, d));
    this.cloudMat.emissive.copy(mix('cloudE'));
    this.smokeMat.emissive.copy(mix('cloudE')).multiplyScalar(1.6);
    this.waterMat.color.copy(mix('water'));
    this.renderer.setClearColor(mix('clear'));
    this.moonMat.emissiveIntensity = nd * 0.12;
    this.moonGlow.material.opacity = 0.12 + nd * 0.3;
    const glass = new THREE.Color('#3a4766').lerp(new THREE.Color('#9fc2dc'), d * 0.5);
    const warm = new THREE.Color('#ffc865');
    this.entries.forEach((e, i) => {
      const lit = smooth(0.25 + (i % 6) * 0.05, 0.45 + (i % 6) * 0.05, nd);
      e.windowsMat.color.copy(glass).lerp(warm, lit);
      e.glow.material.opacity = lit * (e.kind === 'story' ? 0.55 : 0.4);
    });
    this.tramWindowMats.forEach((m) => m.color.copy(glass).lerp(warm, smooth(0.3, 0.6, nd)));
    this.churchWindows?.color.copy(glass).lerp(warm, smooth(0.35, 0.65, nd));
    this.polaroids.forEach((p) => p.photoMat.map && p.photoMat.color.setScalar(lerp(0.78, 1, d)));
    this.polaroids.forEach((p) => p.frameMat.color.set('#fbf6ec').multiplyScalar(lerp(0.8, 1, d)));
  }

  /* ================================================================ */
  /* Sizing & camera                                                  */
  /* ================================================================ */
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    const portrait = aspect < 1;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.75 ? 50 : aspect < 1.15 ? 44 : 36;
    this.camera.updateProjectionMatrix();
    const tanV = Math.tan((this.camera.fov * DEG) / 2);
    const tanH = tanV * aspect;
    const frac = portrait ? (aspect < 0.6 ? 0.82 : 0.74) : aspect > 1.3 ? 0.56 : 0.6;
    this.homeDist = R / (frac * Math.min(tanV, tanH));
    this.homeElev = 23 * DEG;
    this.homeShiftX = aspect > 1.3 ? this.homeDist * tanH * 0.11 : 0;
    this.homeShift = portrait ? this.homeDist * tanV * (aspect < 0.6 ? 0.06 : 0.04) : -this.homeDist * tanV * 0.02;
    this.pxPerUnit = h / 2 / (this.homeDist * tanV);
    // moon orbit plane: wide screens get a flat orbit, tall screens a steep one
    const tilt = portrait ? 66 * DEG : 11 * DEG;
    this.orbitA = portrait ? R * 1.52 : R * 1.68;
    this.orbitU = new THREE.Vector3(Math.cos(tilt), Math.sin(tilt), 0).normalize();
    const v = new THREE.Vector3(-0.12, 0.18, -1).normalize();
    this.orbitV = v.sub(this.orbitU.clone().multiplyScalar(v.dot(this.orbitU))).normalize();
    if (this.mode === 'home' && !this.flight) this.homePose(this.camPos, this.camTarget);
    this.starU.uPR.value = this.renderer.getPixelRatio();
    if (this.firstFrame && !this.running) this.renderOnce();
  }

  homePose(pos, target, zoom = this.zoom) {
    target.set(-(this.homeShiftX || 0), this.homeShift, 0);
    pos.set(0, Math.sin(this.homeElev), Math.cos(this.homeElev)).multiplyScalar(this.homeDist * zoom).add(target);
  }

  presentQuat(e, liftLat = 0.36) {
    if (!e) return new THREE.Quaternion();
    const qy = new THREE.Quaternion().setFromAxisAngle(Y, -e.lon);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), e.lat - (this.homeElev || 14 * DEG) - liftLat);
    return qx.multiply(qy);
  }

  focusQuat(e) {
    const q = e.quat.clone().invert();
    return new THREE.Quaternion().setFromAxisAngle(Y, e.kind === 'story' ? -0.34 : 0.3).multiply(q);
  }

  focusPose(e, pos, target) {
    const tanV = Math.tan((this.camera.fov * DEG) / 2);
    const tanH = tanV * this.camera.aspect;
    const base = R + e.h;
    const k = e.S / 1.25;
    if (e.kind === 'story') {
      const dist = Math.max(5.4 * k, (1.6 * k) / tanH);
      pos.set(0.4 * k, base + 1.5 * k, dist);
      target.set(0.05 * k, base + 1.3 * k, 0);
    } else {
      const dist = Math.max(4.8 * k, (1.4 * k) / tanH);
      pos.set(-0.3 * k, base + 1.1 * k, dist);
      target.set(0, base + 0.95 * k, 0);
    }
  }

  fly({ pos, target, quat = null, dur = 1.6, arc = 0 }) {
    if (this.flight) this.flight.res();
    return new Promise((res) => {
      this.flight = {
        t0: this.time, dur, arc, res,
        fromPos: this.camPos.clone(), fromTarget: this.camTarget.clone(), toPos: pos.clone(), toTarget: target.clone(),
        fromQ: this.planetRoot.quaternion.clone(), toQ: quat ? quat.clone() : null,
      };
      if (!this.running) this.start();
    });
  }

  updateFlight() {
    const f = this.flight;
    if (!f) return;
    const t = clamp((this.time - f.t0) / f.dur, 0, 1);
    const e = ease.inOut(t);
    this.camPos.lerpVectors(f.fromPos, f.toPos, e);
    this.camPos.y += Math.sin(Math.PI * e) * f.arc;
    this.camTarget.lerpVectors(f.fromTarget, f.toTarget, e);
    if (f.toQ) this.planetRoot.quaternion.slerpQuaternions(f.fromQ, f.toQ, ease.inOut(clamp(t * 1.12, 0, 1)));
    if (t >= 1) {
      this.flight = null;
      f.res();
    }
  }

  tween(dur, fn, easeFn = ease.inOut) {
    return new Promise((res) => {
      this.tweens.push({ t0: this.time, dur, fn, easeFn, res });
      if (!this.running) this.start();
    });
  }

  /* ---------------- public flights ---------------- */
  focusPost(slug, { instant = false } = {}) {
    const e = this.bySlug[slug];
    if (!e) return Promise.resolve();
    this.mode = 'focus';
    this.focused = e;
    this.setHot(null);
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();
    this.focusPose(e, pos, target);
    const quat = this.focusQuat(e);
    this.spin.vx = this.spin.vy = 0;
    if (instant || this.reduced) {
      if (this.flight) {
        this.flight.res();
        this.flight = null;
      }
      this.camPos.copy(pos);
      this.camTarget.copy(target);
      this.planetRoot.quaternion.copy(quat);
      this.syncCamera();
      return Promise.resolve();
    }
    return this.fly({ pos, target, quat, dur: 1.7, arc: 2.5 });
  }

  flyHome({ instant = false } = {}) {
    this.mode = 'home';
    this.focused = null;
    this.moonPaused = false;
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();
    this.homePose(pos, target);
    this.lastInteract = this.time;
    if (instant || this.reduced) {
      if (this.flight) {
        this.flight.res();
        this.flight = null;
      }
      this.camPos.copy(pos);
      this.camTarget.copy(target);
      this.syncCamera();
      return Promise.resolve();
    }
    return this.fly({ pos, target, dur: 1.5, arc: 1.5 });
  }

  flyToMoon({ instant = false } = {}) {
    this.mode = 'moon';
    this.moonPaused = true;
    this.setHot(null);
    const m = this.moon.position.clone();
    const out = m.clone().normalize();
    const toCam = this.camPos.clone().sub(m).normalize();
    const dir = out.multiplyScalar(0.55).add(toCam).normalize();
    const pos = m.clone().addScaledVector(dir, 9.5 + (this.camera.aspect < 1 ? 3 : 0));
    pos.y += 0.6;
    if (instant || this.reduced) {
      this.camPos.copy(pos);
      this.camTarget.copy(m);
      this.syncCamera();
      return Promise.resolve();
    }
    return this.fly({ pos, target: m, dur: 1.5, arc: 1.2 });
  }

  present(slug) {
    const e = this.bySlug[slug];
    if (!e || this.mode !== 'home') return;
    this.holdUntil = this.time + 7;
    this.spin.vx = this.spin.vy = 0;
    if (this.reduced) {
      this.planetRoot.quaternion.copy(this.presentQuat(e));
      return;
    }
    this.fly({ pos: this.camPos, target: this.camTarget, quat: this.presentQuat(e), dur: 1.1 });
  }

  /* ---------------- entrances ---------------- */
  openEntrance(slug, { instant = false } = {}) {
    const e = this.bySlug[slug];
    if (!e) return Promise.resolve();
    if (e.kind === 'story') {
      const d = e.model.doorPivot;
      if (instant || this.reduced) {
        d.rotation.y = -1.95;
        return Promise.resolve();
      }
      this.o.onEvent?.('door');
      const from = d.rotation.y;
      return this.tween(0.6, (k) => (d.rotation.y = lerp(from, -1.95, k)), ease.out);
    }
    e.shoutT = this.time;
    if (instant || this.reduced) return Promise.resolve();
    this.o.onEvent?.('shout');
    return this.tween(0.5, (k) => (e.shoutK = Math.sin(k * Math.PI)), ease.out);
  }

  closeEntrance(slug, { instant = false } = {}) {
    const e = this.bySlug[slug];
    if (!e || e.kind !== 'story') return Promise.resolve();
    const d = e.model.doorPivot;
    if (instant || this.reduced) {
      d.rotation.y = 0;
      return Promise.resolve();
    }
    const from = d.rotation.y;
    return this.tween(0.45, (k) => (d.rotation.y = lerp(from, 0, k)), ease.inOut);
  }

  /** Where the reader should grow from: the open doorway or the megaphone. */
  getOrigin(slug) {
    const e = this.bySlug[slug];
    if (!e) return null;
    this.syncCamera();
    this.scene.updateMatrixWorld(true);
    if (e.kind === 'story') {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const c of e.model.doorCorners) {
        const p = this.project(e.group.localToWorld(c.clone()));
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
      }
      return { kind: 'door', rect: { left: x0, top: y0, right: x1, bottom: y1 } };
    }
    const p = this.project(e.group.localToWorld(e.model.mouth.clone()));
    return { kind: 'point', x: p.x, y: p.y };
  }

  getMoonPoint() {
    this.syncCamera();
    this.scene.updateMatrixWorld(true);
    return this.project(this.moon.position.clone());
  }

  project(v) {
    v.project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.width, y: (-v.y * 0.5 + 0.5) * this.height };
  }

  spinHop() {
    if (this.reduced || this.mode !== 'home') return;
    this.spin.vx += 2.6;
    this.hop = this.time;
  }

  setHot(slug) {
    this.hot = slug;
  }

  /* ---------------- easter eggs ---------------- */
  celebrateStork() {
    const s = this.stork;
    if (!s.active) return;
    s.celebrate = this.time;
    this.martenitsas?.forEach((m, i) => {
      const t0 = this.time + 0.4 + i * 0.12;
      this.tweens.push({ t0, dur: 0.5, easeFn: ease.outBack, fn: (k) => m.scale.setScalar(Math.max(0.001, k)), res: () => {} });
    });
  }

  eggAction(name) {
    if (name === 'tram') this.tram.stopUntil = this.time + 3.2;
    const hop = (obj, h, dur = 0.7) => {
      if (!obj || obj.userData.hopping) return;
      obj.userData.hopping = true;
      const y0 = obj.position.y;
      this.tween(dur, (k) => (obj.position.y = y0 + Math.sin(k * Math.PI) * h), (t) => t).then(() => {
        obj.position.y = y0;
        obj.userData.hopping = false;
      });
    };
    if (name === 'rocket') hop(this.rocket?.body, 1.4, 1.4);
    if (name === 'kuker') hop(this.kuker?.body, 0.35, 0.5);
    if (name === 'cat' && this.cat) {
      const g = this.cat.group;
      const r0 = g.rotation.y;
      this.tween(0.9, (k) => (g.rotation.y = r0 + Math.sin(k * Math.PI * 2) * 0.6), (t) => t);
    }
    if (name === 'boat' && this.boat) this.boatSpin = this.time;
    if (name === 'sunflowers') this.rebelSpin = this.time;
    if (name === 'sheep' && this.sheep) this.sheep.list.forEach((s, i) => {
      s.boost = 6;
      const t0 = this.time + i * 0.06;
      this.tweens.push({ t0, dur: 0.45, easeFn: (x) => x, fn: (k) => (s.jump = Math.sin(k * Math.PI) * 0.22), res: () => (s.jump = 0) });
    });
  }

  /* ================================================================ */
  /* Input                                                            */
  /* ================================================================ */
  interactive() {
    return this.mode === 'home' && !this.flight;
  }

  bindInput() {
    const c = this.canvas;
    this.pointers = new Map();
    this.drag = null;
    this.pinch = null;
    c.addEventListener('pointerdown', (e) => {
      if (!this.interactive()) return;
      c.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0, lt: performance.now() };
        this.spin.vx = this.spin.vy = 0;
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoomTarget };
        if (this.drag) this.drag.moved = 999;
      }
      this.lastInteract = this.time;
      this.o.onInteract?.();
    });
    c.addEventListener('pointermove', (e) => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.zoomTarget = clamp((this.pinch.z * this.pinch.d) / Math.max(d, 1), 0.72, 1.3);
        return;
      }
      const dr = this.drag;
      if (dr && dr.id === e.pointerId) {
        const dx = e.clientX - dr.x;
        const dy = e.clientY - dr.y;
        dr.x = e.clientX;
        dr.y = e.clientY;
        dr.moved += Math.abs(dx) + Math.abs(dy);
        const now = performance.now();
        const dt = Math.max(1, now - dr.lt) / 1000;
        dr.lt = now;
        const k = 1 / (this.pxPerUnit * R * this.zoom);
        this.rotateBy(dx * k, dy * k);
        this.spin.vx = lerp(this.spin.vx, (dx * k) / dt, 0.5);
        this.spin.vy = lerp(this.spin.vy, (dy * k) / dt, 0.5);
        this.lastInteract = this.time;
        if (dr.moved > 8) this.setCursor('grabbing');
        return;
      }
      if (e.pointerType === 'mouse') this.queueHover(e.clientX, e.clientY);
    });
    const end = (e) => {
      const dr = this.drag;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (dr && dr.id === e.pointerId) {
        this.drag = null;
        const dt = performance.now() - dr.t;
        if (dr.moved < 10 && dt < 600 && e.type === 'pointerup') this.tap(e.clientX, e.clientY);
        else {
          const sp = Math.hypot(this.spin.vx, this.spin.vy);
          if (sp > 6) {
            this.spin.vx *= 6 / sp;
            this.spin.vy *= 6 / sp;
          }
          if (performance.now() - dr.lt > 90) this.spin.vx = this.spin.vy = 0;
        }
        this.setCursor(this.hotPick ? 'pointer' : 'grab');
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => {
      if (!this.drag) this.applyHover(null);
    });
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.interactive()) return;
        e.preventDefault();
        this.zoomTarget = clamp(this.zoomTarget * Math.exp(e.deltaY * 0.0011), 0.72, 1.3);
        this.lastInteract = this.time;
      },
      { passive: false },
    );
    this.setCursor('grab');
  }

  keySpin(dx, dy) {
    if (!this.interactive()) return;
    this.spin.vx += dx * 1.4;
    this.spin.vy += dy * 1.4;
    this.lastInteract = this.time;
  }

  setCursor(c) {
    if (this._cursor !== c) this.canvas.style.cursor = this._cursor = c;
  }

  rotateBy(ax, ay) {
    const qy = new THREE.Quaternion().setFromAxisAngle(Y, ax);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ay);
    this.planetRoot.quaternion.premultiply(qy).premultiply(qx).normalize();
  }

  pick(x, y) {
    if (!this.width) return null;
    const ndc = new THREE.Vector2((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitTargets, false);
    const ray = this.raycaster.ray;
    const tPlanet = ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), R + 0.15), new THREE.Vector3());
    const dPlanet = tPlanet ? tPlanet.distanceTo(ray.origin) : Infinity;
    for (const h of hits) {
      if (!h.object.parent || !this.visibleChain(h.object)) continue;
      const u = h.object.userData;
      // objects standing on the planet may poke out in front of the sphere; reject only clearly-hidden ones
      if (h.distance > dPlanet + (u.kind === 'post' || u.kind === 'egg' ? 0.9 : 0.1)) continue;
      return u;
    }
    return null;
  }

  visibleChain(o) {
    let p = o.parent;
    while (p) {
      if (!p.visible) return false;
      p = p.parent;
    }
    return true;
  }

  queueHover(x, y) {
    this._hoverXY = [x, y];
    if (this._hoverQueued) return;
    this._hoverQueued = true;
    requestAnimationFrame(() => {
      this._hoverQueued = false;
      if (!this.interactive() || this.drag) return;
      const u = this.pick(...this._hoverXY);
      this.applyHover(u);
    });
  }

  applyHover(u) {
    const key = u ? (u.kind === 'post' ? u.slug : u.kind === 'egg' ? 'egg:' + u.egg : u.kind) : null;
    this.hotPick = !!u;
    if (key === this._hoverKey) return;
    this._hoverKey = key;
    this.setCursor(u ? 'pointer' : 'grab');
    this.hot = u && u.kind === 'post' ? u.slug : null;
    this.o.onHover?.(u);
  }

  tap(x, y) {
    const u = this.pick(x, y);
    if (!u) return;
    if (u.kind === 'egg') this.eggAction(u.egg);
    if (u.kind === 'stork') this.celebrateStork();
    this.o.onPick?.(u, { x, y });
  }

  /* ================================================================ */
  /* Loop                                                             */
  /* ================================================================ */
  start() {
    if (this.running || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  setPaused(p) {
    this.paused = p;
    if (p) this.stop();
    else this.start();
  }

  renderOnce() {
    this.syncCamera();
    this.renderer.render(this.scene, this.camera);
  }

  syncCamera() {
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
    this.camera.updateMatrixWorld();
  }

  frame(now) {
    if (!this.running) return;
    requestAnimationFrame(this.frame);
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
    this.last = Math.max(now, this.last);
    this.time += dt;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    if (!this.firstFrame) {
      this.firstFrame = true;
      this.o.onFirstFrame?.();
    }
    this.o.onFrame?.(this.anchors());
  }

  update(dt) {
    const t = this.time;
    // assembly
    if (!this.asm.done) {
      this.asm.t += dt;
      this.applyAssembly(this.asm.t);
    }
    // tweens
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      if (t < tw.t0) continue;
      const k = clamp((t - tw.t0) / tw.dur, 0, 1);
      tw.fn(tw.easeFn(k));
      if (k >= 1) {
        this.tweens.splice(i, 1);
        tw.res();
      }
    }
    // spin
    if (this.mode === 'home' && !this.flight) {
      if (!this.drag) {
        if (Math.abs(this.spin.vx) + Math.abs(this.spin.vy) > 1e-4) {
          this.rotateBy(this.spin.vx * dt, this.spin.vy * dt);
          const damp = Math.exp(-dt * (this.reduced ? 5 : 2.0));
          this.spin.vx *= damp;
          this.spin.vy *= damp;
        }
        const idle = t - this.lastInteract > 2.5 && t > this.holdUntil;
        const target = idle ? (this.reduced ? 0.018 : 0.075) : 0;
        this.spin.auto = lerp(this.spin.auto, target, Math.min(1, dt * 0.8));
        if (this.spin.auto > 1e-4) this.rotateBy(this.spin.auto * dt, 0);
        // gently self-right so the equator stays roughly level
        const up = Y.clone().applyQuaternion(this.planetRoot.quaternion);
        const roll = Math.atan2(up.x, up.y);
        if (Math.abs(roll) > 0.002 && t > this.holdUntil) {
          const k = (t - this.lastInteract > 1 ? 0.9 : 0.25) * dt;
          this.planetRoot.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll * Math.min(1, k)));
        }
        const tiltAway = up.angleTo(Y);
        if (t - this.lastInteract > 6 && t > this.holdUntil && tiltAway > 0.7) {
          const axis = new THREE.Vector3().crossVectors(up, Y).normalize();
          this.planetRoot.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, (tiltAway - 0.7) * dt * 0.4));
        }
      }
      this.zoom = lerp(this.zoom, this.zoomTarget, Math.min(1, dt * 6));
      this.homePose(this.camPos, this.camTarget);
    }
    this.updateFlight();
    if (this.hop) {
      const k = (t - this.hop) / 0.7;
      const s = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.035 : 1;
      this.planetRoot.scale.setScalar(s);
      if (k >= 1) this.hop = 0;
    }
    this.syncCamera();

    // day / night
    if (Math.abs(this.dayTarget - this.dayness) > 0.0005) {
      this.dayness = lerp(this.dayness, this.dayTarget, Math.min(1, dt * 1.6));
      if (Math.abs(this.dayTarget - this.dayness) < 0.002) this.dayness = this.dayTarget;
    }
    if (this.dayness !== this._appliedDay || !this.asm.done) this.applyDay(this.dayness);

    this.updateEntries(dt);
    this.updateFeatures(dt);
    this.updateTram(dt);
    this.updateClouds(dt);
    this.updateSmoke();
    this.updateMoon(dt);
    this.updateStork(dt);
    this.starU.uTime.value = t;
    const camDist = this.camPos.length();
    this.haloU.uStrength.value = smooth(R * 1.25, R * 2.2, camDist) * lerp(0.5, 0.5, this.dayness);
  }

  updateEntries(dt) {
    const t = this.time;
    for (const e of this.entries) {
      const hot = this.hot === e.slug && this.mode === 'home';
      e.hoverK = lerp(e.hoverK, hot ? 1 : 0, Math.min(1, dt * 10));
      const s = e.S * (e.popK ?? 1) * (1 + e.hoverK * 0.07 + (e.shoutK || 0) * 0.06);
      e.group.scale.setScalar(s);
      e.group.position.copy(e.basePos).addScaledVector(e.dir, (e.dropK || 0) * 4 + e.hoverK * 0.12);
      if (e.kind === 'opinion') {
        const loud = e.shoutT && t - e.shoutT < 1.2 ? 1 : 0;
        e.model.rings.forEach((ring, i) => {
          const speed = loud ? 1.8 : 0.55;
          const ph = (t * speed + i * 0.5) % 1;
          ring.position.copy(e.model.mouth).addScaledVector(e.model.axis, 0.05 + ph * (loud ? 1.2 : 0.55));
          ring.scale.setScalar(0.5 + ph * (loud ? 2.4 : 1.2));
          ring.material.opacity = (1 - ph) * (loud ? 0.95 : 0.45 + e.hoverK * 0.4);
        });
      }
    }
    if (this.cat) this.cat.tail.rotation.z = Math.sin(t * 2.2) * 0.35;
    if (this.kuker && !this.kuker.body.userData.hopping) this.kuker.body.rotation.y = Math.sin(t * 1.3) * 0.25;
  }

  updateTram(dt) {
    const tr = this.tram;
    const moving = this.time > tr.stopUntil;
    tr.v = lerp(tr.v ?? tr.speed, moving ? tr.speed * (this.reduced ? 0.5 : 1) : 0, Math.min(1, dt * 2.5));
    tr.angle += tr.v * dt;
    const k = Math.max(0.001, tr.k);
    const len = (0.98 * tr.scale) / (R + TRACK_H);
    const bob = Math.sin(this.time * 9) * 0.004 * (tr.v / tr.speed);
    tr.cars.forEach((c, i) => {
      this.trackMatrix(tr.angle - i * len * 1.08, TRACK_H + 0.03 + bob, tr.scale * k).decompose(c.position, c.quaternion, c.scale);
    });
    this.trackMatrix(tr.angle - len * 0.54, TRACK_H + 0.07, tr.scale * k).decompose(tr.bellows.position, tr.bellows.quaternion, tr.bellows.scale);
    tr.bellows.position.addScaledVector(tr.bellows.position.clone().normalize(), 0.18);
    if (this.boat) {
      const a = this.time * (this.boatSpin && this.time - this.boatSpin < 2 ? 1.6 : 0.12);
      const sd = this.sea.dir;
      const t1 = new THREE.Vector3().crossVectors(sd, Y).normalize();
      const t2 = new THREE.Vector3().crossVectors(sd, t1).normalize();
      const d = sd.clone().addScaledVector(t1, Math.cos(a) * 0.06).addScaledVector(t2, Math.sin(a) * 0.06).normalize();
      const fwd = t1.clone().multiplyScalar(-Math.sin(a)).addScaledVector(t2, Math.cos(a));
      const q = basisQuat(d, fwd.sub(d.clone().multiplyScalar(fwd.dot(d))).normalize());
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(this.time * 1.7) * 0.08));
      this.boat.quaternion.copy(q);
      this.boat.position.copy(d).multiplyScalar(R + 0.02 + Math.sin(this.time * 2.1) * 0.015);
    }
  }

  updateClouds(dt) {
    const fe = this.focused;
    const camUp = new THREE.Vector3();
    for (const c of this.clouds) {
      c.pivot.rotateZ(c.speed * dt * (this.reduced ? 0.4 : 1));
      let want = 1;
      if (fe || this.mode === 'moon') {
        c.mesh.getWorldPosition(camUp);
        // keep the view clear around whatever we flew to
        const d = camUp.distanceTo(this.camPos);
        if (d < 9) want = 0;
        if (fe) {
          const wp = fe.group.getWorldPosition(new THREE.Vector3());
          if (camUp.distanceTo(wp) < 6) want = 0;
        }
      }
      c.vis = lerp(c.vis, want, Math.min(1, dt * 4));
      if (this.asm.done) c.mesh.scale.setScalar(Math.max(0.001, c.vis) * c.s);
    }
  }

  updateSmoke() {
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const t = this.time * (this.reduced ? 0.15 : 0.28);
    let i = 0;
    for (const src of this.smokeSrc) {
      const pop = src.e.popK ?? 1;
      for (let k = 0; k < this.puffsPer; k++) {
        const u = (t + k / this.puffsPer + src.e.index * 0.13) % 1;
        p.copy(src.top)
          .addScaledVector(src.up, u * 1.6 * src.e.S + (src.e.dropK || 0) * 4)
          .addScaledVector(src.wind, u * u * 0.8);
        const size = (0.05 + u * 0.12) * smooth(0, 0.15, u) * (1 - smooth(0.7, 1, u)) * pop * src.e.S;
        m.compose(p, q, s.setScalar(Math.max(size, 0.0001)));
        this.smoke.setMatrixAt(i++, m);
      }
    }
    this.smoke.instanceMatrix.needsUpdate = true;
  }

  updateMoon(dt) {
    if (!this.moonPaused) this.moonPhase += dt * (TAU / 80) * (this.reduced ? 0.5 : 1);
    // while we visit a house, the moon politely drifts far away so it never photobombs the close-up
    this.moonFar = lerp(this.moonFar || 0, this.mode === 'focus' ? 1 : 0, Math.min(1, dt * (this.mode === 'focus' ? 3 : 1.2)));
    const a = this.orbitA * (1 + (this.moonIntro || 0) * 2.5 + this.moonFar * 3.5);
    const ph = this.moonPhase - (this.moonIntro || 0) * 1.2;
    this.moon.position.copy(this.orbitU).multiplyScalar(Math.cos(ph) * a).addScaledVector(this.orbitV, Math.sin(ph) * a);
    this.moonBody.rotation.y += dt * 0.05;
    this.ring.rotation.y += dt * (this.reduced ? 0.04 : 0.12);
    const camQ = this.camera.quaternion;
    const parentQ = new THREE.Quaternion();
    this.polaroids.forEach((p, i) => {
      if (p.loaded && p.popT < 0 && this.moonIntro < 0.3) p.popT = this.time + i * 0.08;
      const k = p.popT >= 0 ? clamp((this.time - p.popT) / 0.5, 0, 1) : 0;
      p.card.scale.setScalar(Math.max(0.001, ease.outBack(k)) * 1.3);
      // billboard: cancel the parent rotation, then face the camera
      p.holder.parent.getWorldQuaternion(parentQ);
      p.holder.quaternion.copy(parentQ.invert().multiply(camQ));
    });
  }

  updateStork(dt) {
    const s = this.stork;
    if (!s.active) {
      if (this.mode === 'home' && this.asm.done) {
        s.wait -= dt;
        if (s.wait <= 0) this.startStork();
      }
      return;
    }
    if (this.mode !== 'home') {
      s.active = false;
      s.group.visible = false;
      s.wait = 6;
      return;
    }
    const cel = s.celebrate >= 0 ? (this.time - s.celebrate) / 1.4 : -1;
    if (cel > 1) s.speedK = 1.7;
    s.u += (dt / s.dur) * (cel >= 0 && cel <= 1 ? 0.35 : s.speedK);
    if (s.u >= 1) {
      s.active = false;
      s.group.visible = false;
      s.wait = (this.reduced ? 40 : 24) + Math.random() * 18;
      return;
    }
    const p = this.storkPos(s.u, new THREE.Vector3());
    const p2 = this.storkPos(Math.min(1, s.u + 0.01), new THREE.Vector3());
    const fwd = p2.sub(p).normalize();
    let pitch = 0;
    if (cel >= 0 && cel <= 1) {
      const a = cel * TAU;
      const up0 = s.path.up;
      p.addScaledVector(fwd, Math.sin(a) * 1.5).addScaledVector(up0, (1 - Math.cos(a)) * 1.5);
      pitch = a;
    }
    s.group.position.copy(p);
    const side = new THREE.Vector3().crossVectors(fwd, Y).normalize();
    const up = new THREE.Vector3().crossVectors(side, fwd).normalize();
    s.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd, up, side));
    s.group.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pitch));
    s.group.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(this.time * 0.9) * 0.12));
    const flapping = Math.sin(this.time * 0.8) > -0.2 || cel >= 0;
    s.flapAmp = lerp(s.flapAmp || 0, flapping ? 0.55 : 0.06, Math.min(1, dt * 3));
    const w = Math.sin(this.time * 6.5) * s.flapAmp;
    const w2 = Math.sin(this.time * 6.5 - 0.9) * s.flapAmp * 0.9;
    s.left.pivot.rotation.x = -w;
    s.left.outerPivot.rotation.x = -w2 * 0.8;
    s.right.pivot.rotation.x = w;
    s.right.outerPivot.rotation.x = w2 * 0.8;
  }

  storkScreen() {
    return this.stork.active ? this.project(this.stork.group.position.clone()) : null;
  }

  /* ================================================================ */
  /* Screen anchors for the HTML labels                               */
  /* ================================================================ */
  anchors() {
    const out = this._anchors || (this._anchors = []);
    out.length = 0;
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();
    const toCam = new THREE.Vector3();
    const q = this.planetRoot.quaternion;
    for (const e of this.entries) {
      v.copy(e.model.anchor).applyMatrix4(e.group.matrixWorld);
      n.copy(e.dir).applyQuaternion(q);
      toCam.copy(this.camPos).sub(v).normalize();
      const facing = n.dot(toCam);
      const p = this.project(v);
      out.push({ id: e.slug, x: p.x, y: p.y, facing: (e.popK ?? 1) < 0.9 ? -1 : facing });
    }
    // moon: hidden when behind the planet
    v.copy(this.moon.position);
    const dir = v.clone().sub(this.camPos);
    const dist = dir.length();
    dir.normalize();
    const oc = this.camPos.clone();
    const b = oc.dot(dir);
    const c = oc.lengthSq() - R * R * 1.05;
    const disc = b * b - c;
    const tHit = disc > 0 ? -b - Math.sqrt(disc) : Infinity;
    const hidden = tHit > 0 && tHit < dist;
    v.addScaledVector(this.camera.up, this.moonR * 1.9);
    const p = this.project(v);
    out.push({ id: '@moon', x: p.x, y: p.y, facing: hidden || this.moonIntro > 0.2 ? -1 : 1 });
    return out;
  }
}
