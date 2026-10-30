// The snow globe: scene, glass (own transmission pass), fluid-ish snow, floating prints, gestures.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as TX from './textures.js';

const V3 = THREE.Vector3;
const INSIDE = 1; // layer for everything inside the glass (seen only through refraction)
const PIVOT_Y = 1.12; // middle of the object, used as the flip pivot
const CENTER_Y = 0.12; // sphere centre above the pivot
const WALL = 0.945;
const FEATURE_SCALE = 2.0; // the featured print grows as it drifts to the front
const FRONT_LIFT = 0.15; // and floats above the little house
const IOR = 1.4;
const THICK = 0.62;
export const LENS = 1 / (1 - THICK * (1 - 1 / IOR)); // approx. magnification at the front of the glass

const TIERS = {
  high: { dpr: 2, rt: 0.85, bloom: true, shadow: 1024, snow: 1300, glitter: 240, seg: 96, msaa: 4, dispersion: 0.12 },
  medium: { dpr: 1.5, rt: 0.7, bloom: true, shadow: 1024, snow: 950, glitter: 170, seg: 80, msaa: 0, dispersion: 0 },
  low: { dpr: 1.5, rt: 0.6, bloom: false, shadow: 512, snow: 620, glitter: 110, seg: 64, msaa: 0, dispersion: 0 },
};

export function pickTier() {
  const q = new URLSearchParams(location.search).get('quality');
  if (TIERS[q]) return { name: q, pinned: true };
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 600;
  const cores = navigator.hardwareConcurrency || 4;
  if (small) return { name: 'low', pinned: false };
  if (coarse || cores <= 4) return { name: 'medium', pinned: false };
  return { name: 'high', pinned: false };
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function groundY(x, z) {
  const r = Math.sqrt(x * x + z * z);
  let y = -0.575;
  y += 0.12 * Math.exp(-((x - 0.02) ** 2 + (z + 0.22) ** 2) / 0.16);
  y += 0.06 * Math.exp(-((x + 0.42) ** 2 + (z + 0.06) ** 2) / 0.05);
  y += 0.012 * Math.sin(x * 9 + 1) * Math.cos(z * 7);
  y += 0.06 * smooth(0.55, 0.84, r);
  return y;
}

// house footprint (G-local)
const HOUSE = { x: 0.03, z: -0.24, rot: -0.38, w: 0.54, d: 0.42, roofH: 0.12 };
HOUSE.y = groundY(HOUSE.x, HOUSE.z) - 0.035;
HOUSE.roofBase = HOUSE.y + 0.29;
HOUSE.cos = Math.cos(-HOUSE.rot);
HOUSE.sin = Math.sin(-HOUSE.rot);

function roofSurface(x, z) {
  const dx = x - HOUSE.x, dz = z - HOUSE.z;
  const lx = dx * HOUSE.cos - dz * HOUSE.sin;
  const lz = dx * HOUSE.sin + dz * HOUSE.cos - 0.03;
  const hw = HOUSE.w / 2, hd = HOUSE.d / 2;
  if (Math.abs(lx) > hw || Math.abs(lz) > hd) return null;
  const ridge = (HOUSE.w - HOUSE.d) / 2;
  const f = Math.max(Math.abs(lz) / hd, (Math.abs(lx) - ridge) / hd);
  return HOUSE.roofBase + 0.012 + HOUSE.roofH * (1 - clamp(f, 0, 1));
}

/* ------------------------------------------------------------------ */

export async function createGlobe(canvas, opts) {
  const { blog, reducedMotion = false } = opts;
  const tierInfo = pickTier();
  let Q = { ...TIERS[tierInfo.name] };
  let rm = reducedMotion;

  const listeners = {};
  const emit = (name, data) => (listeners[name] || []).forEach((fn) => fn(data));

  /* ---------- renderer ---------- */
  // three r170 needs WebGL2; check on a throwaway canvas so a missing context fails quietly
  const probe = document.createElement('canvas').getContext('webgl2');
  if (!probe) throw new Error('webgl2-unavailable');
  probe.getExtension('WEBGL_lose_context')?.loseContext();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.msaa === 0 && tierInfo.name !== 'low', powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x0b090d, 1);
  const halfFloat = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  camera.layers.set(0);

  /* ---------- environment for reflections (procedural room) ---------- */
  scene.environment = buildEnvironment(renderer);
  scene.environmentIntensity = 0.9;

  /* ---------- the glass's own transmission target ---------- */
  const glassRT = new THREE.WebGLRenderTarget(4, 4, {
    type: halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType,
    samples: Q.msaa,
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

  /* ---------- room: sill, window, lights ---------- */
  const backdropTex = TX.toTexture(TX.backdropCanvas());
  backdropTex.generateMipmaps = true;
  const backdropMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: backdropTex }, uTime: { value: 0 }, uSnow: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float uTime; uniform float uSnow; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float flakes(vec2 uv, float scale, float speed, float size, float t){
        vec2 p = uv * vec2(scale * 2.0, scale);
        p.y += t * speed;
        p.x += sin(t * 0.35 + p.y * 0.45) * 0.35;
        vec2 cell = floor(p); vec2 f = fract(p) - 0.5;
        vec2 o = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
        float d = length(f - o * 0.6);
        return smoothstep(size, size * 0.25, d) * step(0.45, hash(cell));
      }
      void main(){
        vec3 col = texture2D(map, vUv).rgb;
        float x = vUv.x * 16.0 - 8.0, y = vUv.y * 8.0 - 1.0;
        float inWin = step(-4.25, x) * step(x, 4.25) * step(0.26, y) * step(y, 6.75);
        inWin *= step(0.08, abs(abs(x) - 2.6)) * step(0.07, abs(y - 4.4));
        float s = flakes(vUv, 70.0, 2.2, 0.09, uTime) * 0.22 + flakes(vUv + 0.37, 46.0, 1.5, 0.1, uTime) * 0.16 + flakes(vUv + 0.71, 30.0, 1.0, 0.11, uTime) * 0.1;
        col += vec3(0.6, 0.66, 0.82) * s * inWin * uSnow;
        float lum = dot(col, vec3(0.3, 0.55, 0.15));
        float tw = 0.84 + 0.16 * sin(uTime * 1.3 + vUv.x * 47.0 + sin(vUv.y * 31.0 + uTime * 0.4) * 2.5);
        col *= 1.0 + smoothstep(0.12, 0.45, lum) * (0.7 * tw);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(TX.BACKDROP.w, TX.BACKDROP.h), backdropMat);
  backdrop.position.set(0, TX.BACKDROP.y0 + TX.BACKDROP.h / 2, -2.6);
  scene.add(backdrop);

  const sillTex = TX.toTexture(TX.woodCanvas({ along: 'x', base: '#6a3d22', dark: '#2a1409', light: '#9a6438', seed: 31 }), { repeat: true });
  sillTex.repeat.set(9, 3.2);
  const sillMat = new THREE.MeshStandardMaterial({ map: sillTex, color: 0xd8c0a8, roughness: 0.52, envMapIntensity: 0.06 });
  const sill = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 10.6), sillMat);
  sill.position.set(0, -0.25, 2.7);
  sill.receiveShadow = true;
  scene.add(sill);

  const key = new THREE.SpotLight(0xffc690, 190, 0, 0.33, 0.9, 2);
  key.position.set(-3.6, 5.6, 4.4);
  key.target.position.set(0.1, 0.9, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(Q.shadow, Q.shadow);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 6;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 14;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xc8d0e8, 0.6);
  rim.position.set(2.5, 3.5, -5);
  scene.add(rim);
  const hemi = new THREE.HemisphereLight(0x3b3430, 0x24160d, 0.4);
  scene.add(hemi);

  /* ---------- the object: rig (flip pivot) > G (sphere centre) ---------- */
  const rig = new THREE.Group();
  rig.position.y = PIVOT_Y;
  scene.add(rig);
  const G = new THREE.Group();
  G.position.y = CENTER_Y;
  rig.add(G);

  // glass
  const glassU = {
    transmission: { value: 1 },
    thickness: { value: THICK },
    attenuationDistance: { value: 4.5 },
    attenuationColor: { value: new THREE.Color(0.9, 0.96, 1.0) },
    transmissionSamplerMap: { value: glassRT.texture },
    transmissionSamplerSize: { value: new THREE.Vector2(4, 4) },
  };
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0,
    ior: IOR,
    specularIntensity: 1,
    envMapIntensity: 1.25,
    dispersion: Q.dispersion,
  });
  glassMat.defines = { ...glassMat.defines, USE_TRANSMISSION: '' };
  glassMat.onBeforeCompile = (sh) => Object.assign(sh.uniforms, glassU);
  glassMat.customProgramCacheKey = () => 'globe-glass';
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1, Q.seg, Math.round(Q.seg * 0.66)), glassMat);
  G.add(glass);

  // base
  const base = buildBase(blog);
  G.add(base.group);
  base.group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  // interior
  const inside = new THREE.Group();
  G.add(inside);
  const scenery = buildScenery();
  inside.add(scenery.group);
  const houseGlow = new THREE.PointLight(0xffa04a, 0.3, 0.9, 2);
  houseGlow.position.set(HOUSE.x + 0.05, HOUSE.y + 0.2, HOUSE.z + 0.32);
  G.add(houseGlow);

  const bubble = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 20, 12),
    new THREE.MeshStandardMaterial({ color: 0xdfe8f4, metalness: 1, roughness: 0.08, envMapIntensity: 1.6 })
  );
  bubble.scale.set(1, 0.42, 1);
  bubble.position.set(0, 0.93, 0);
  inside.add(bubble);

  // contact shadow + caustic on the sill
  const shadowTex = TX.toTexture(TX.radialCanvas([[0, 'rgba(255,255,255,1)'], [0.62, 'rgba(255,255,255,0.92)'], [0.8, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]), { srgb: false });
  const softTex = TX.toTexture(TX.radialCanvas([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.7)'], [0.6, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]), { srgb: false });
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: shadowTex, transparent: true, depthWrite: false, opacity: 0.75 }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.003;
  const soft = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), new THREE.MeshBasicMaterial({ color: 0x050302, alphaMap: softTex, transparent: true, depthWrite: false, opacity: 0.4 }));
  soft.rotation.x = -Math.PI / 2;
  soft.position.set(0.5, 0.002, -0.35);
  const causticTex = TX.toTexture(TX.radialCanvas([[0, 'rgba(255,214,160,1)'], [0.25, 'rgba(255,190,120,0.55)'], [1, 'rgba(255,160,90,0)']]));
  const caustic = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({ map: causticTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
  caustic.rotation.x = -Math.PI / 2;
  caustic.rotation.z = 0.55;
  caustic.position.set(1.55, 0.004, -1.05);
  scene.add(contact, soft, caustic);

  /* ---------- snow + glitter ---------- */
  const flakes = buildFlakes(Q.snow, Q.glitter);
  inside.add(flakes.snow, flakes.glitter);

  /* ---------- prints ---------- */
  const albumCache = new Map();
  let prints = [];
  let album = null;
  const printsGroup = new THREE.Group();
  inside.add(printsGroup);
  // reduced-motion display: two cross-fading prints at the front
  const rmPrints = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.62, transparent: true, opacity: 0, depthWrite: false, emissive: 0xffffff, emissiveIntensity: 0.16 }));
    m.visible = false;
    inside.add(m);
    return m;
  });
  let rmFront = 0;

  inside.traverse((o) => o.layers.set(INSIDE));
  key.shadow.camera.layers.enable(INSIDE);

  /* ---------- post ---------- */
  let composer = null;
  let bloom = null;
  function setupComposer() {
    if (composer) {
      composer.dispose();
      composer = null;
    }
    if (!Q.bloom) return;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: Q.msaa });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.26, 0.45, 1.05);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  setupComposer();

  /* ---------- state ---------- */
  const fluid = { U: new V3(), om: new V3(), turb: 0.0, ph: new V3(1.3, 2.1, 0.4), energy: 0, swirlSign: 1 };
  const motion = { held: false, target: new V3(), pos: new V3(), vel: new V3(), tilt: new V3(), tiltVel: new V3() };
  const flip = { lift: 0, roll: 0, zoom: 0, active: false };
  const feat = { idx: -1, next: 0, active: false, arrived: false, agitated: true, calm: 0 };
  const view = { W: 1, H: 1, s: 200, target: new V3(0, PIVOT_Y, 0), base: new V3(0, 3, 9), par: new THREE.Vector2(), parS: new THREE.Vector2() };
  const tmpA = new Float32Array(3);
  const gL = new V3(0, -1, 0);
  const camL = new V3(0, 0.15, 1);
  const prevG = new V3(), prevVel = new V3(), accS = new V3();
  let prevRotZ = 0, prevRotX = 0;
  let running = false, raf = 0, last = 0, time = 0;
  let shadowsDirty = true;
  let firstFrame = false;
  let lastMess = -99;
  let houseCat = false;

  /* ---------- album handling ---------- */
  async function loadImage(src) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      try {
        await img.decode();
        return img;
      } catch {
        await new Promise((r) => setTimeout(r, 450));
      }
    }
    return null; // the print gets a paper placeholder with a snowflake
  }
  async function loadImages(srcs, limit = 3) {
    const out = new Array(srcs.length);
    let next = 0;
    const worker = async () => {
      while (next < srcs.length) {
        const k = next++;
        out[k] = await loadImage(srcs[k]);
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, srcs.length) }, worker));
    return out;
  }

  function printMaterial(tex) {
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.16, transparent: true, opacity: 1 });
  }

  function bentPlane(w, h) {
    const g = new THREE.PlaneGeometry(w, h, 8, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (w / 2);
      p.setZ(i, -x * x * 0.012);
    }
    g.computeVertexNormals();
    return g;
  }

  function backInfo(a, photo, i) {
    return { caption: blog.text(photo.caption), album: blog.text(a.title), number: i + 1, seed: i + 3 };
  }

  async function buildAlbum(a) {
    if (albumCache.has(a.slug)) {
      const c = albumCache.get(a.slug);
      if (c.lang !== blog.lang) refreshBacks(c);
      return c;
    }
    const imgs = await loadImages(a.photos.map((p) => blog.thumbUrl(p.file)));
    const items = a.photos.map((photo, i) => {
      const front = TX.printFront(imgs[i], photo.w, photo.h, i + 1);
      const long = 0.31;
      const W = front.aspect >= 1 ? long : long * front.aspect;
      const H = front.aspect >= 1 ? long / front.aspect : long;
      const frontTex = TX.toTexture(front.canvas);
      const bc = document.createElement('canvas');
      bc.width = 512;
      bc.height = Math.round(512 / front.aspect);
      TX.printBack(bc, backInfo(a, photo, i));
      const backTex = TX.toTexture(bc);
      const geo = bentPlane(W, H);
      const fm = printMaterial(frontTex);
      const bm = printMaterial(backTex);
      const group = new THREE.Group();
      const f = new THREE.Mesh(geo, fm);
      const b = new THREE.Mesh(geo, bm);
      b.rotation.y = Math.PI;
      group.add(f, b);
      group.traverse((o) => o.layers.set(INSIDE));
      f.userData.print = b.userData.print = i;
      return {
        i, photo, group, front: f, frontTex, backTex, backCanvas: bc, w: W, h: H, half: Math.max(W, H) / 2,
        pos: new V3(), vel: new V3(), q: new THREE.Quaternion(), w3: new V3(), scale: 0, scaleTarget: 1,
        home: new V3(), homeQ: new THREE.Quaternion(), phase: i * 1.7 + 0.4,
      };
    });
    const entry = { slug: a.slug, album: a, items, lang: blog.lang };
    albumCache.set(a.slug, entry);
    return entry;
  }

  function refreshBacks(entry) {
    entry.items.forEach((it) => {
      TX.printBack(it.backCanvas, backInfo(entry.album, it.photo, it.i));
      it.backTex.needsUpdate = true;
    });
    entry.lang = blog.lang;
  }

  function assignHomes(items) {
    const n = items.length;
    const r = TX.rng(n * 13 + 7);
    // fan the prints around the scene, leaving the front centre for the featured one
    const slots = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const side = i % 2 === 0 ? -1 : 1;
      const ang = side * (0.62 + (t * 1.9 + r() * 0.3));
      const rad = 0.52 + r() * 0.12;
      const y = -0.1 + ((i * 0.37) % 1) * 0.55 + (r() - 0.5) * 0.08;
      slots.push(new V3(Math.sin(ang) * rad, y, Math.cos(ang) * rad));
    }
    items.forEach((it, i) => {
      it.home.copy(slots[i]);
      const toCam = camL.clone().sub(it.home).normalize();
      const m = new THREE.Matrix4().lookAt(toCam, new V3(), new V3(0, 1, 0));
      it.homeQ.setFromRotationMatrix(m);
      const jitter = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.35, (r() - 0.5) * 0.9, (r() - 0.5) * 0.4));
      it.homeQ.multiply(jitter);
    });
  }

  function mountAlbum(entry, { scatter = 'homes' } = {}) {
    prints.forEach((p) => printsGroup.remove(p.group));
    album = entry.album;
    prints = entry.items;
    assignHomes(prints);
    const r = TX.rng(5);
    prints.forEach((p) => {
      if (scatter === 'top') {
        // spawn where gravity currently points (the dome while upside down)
        p.pos.set((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.5).addScaledVector(gL, 0.55);
      } else p.pos.copy(p.home).add(new V3((r() - 0.5) * 0.2, (r() - 0.5) * 0.2, (r() - 0.5) * 0.2));
      p.vel.set(0, 0, 0);
      p.q.copy(p.homeQ);
      p.w3.set(0, 0, 0);
      p.scale = scatter === 'instant' ? 1 : 0.001;
      p.scaleTarget = 1;
      p.group.position.copy(p.pos);
      p.group.scale.setScalar(p.scale);
      printsGroup.add(p.group);
      p.group.visible = !rm;
    });
    feat.idx = -1;
    feat.next = 0;
    feat.active = false;
    feat.arrived = false;
    feat.agitated = true;
    feat.calm = 0;
  }

  /* ---------- sizing ---------- */
  function resize() {
    const W = canvas.clientWidth || innerWidth;
    const H = canvas.clientHeight || innerHeight;
    view.W = W;
    view.H = H;
    const dpr = Math.min(devicePixelRatio || 1, Q.dpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const rt = Math.max(Q.rt, Math.min(1, 1 / dpr)); // never below one sample per CSS pixel
    const rw = Math.max(4, Math.round(W * dpr * rt));
    const rh = Math.max(4, Math.round(H * dpr * rt));
    glassRT.setSize(rw, rh);
    glassU.transmissionSamplerSize.value.set(rw, rh);
    if (composer) {
      composer.setPixelRatio(dpr);
      composer.setSize(W, H);
    }
    shadowsDirty = true;
  }

  function layout({ top = 0, bottom = 0, left = 0, right = 0 } = {}) {
    resize();
    const { W, H } = view;
    const availH = Math.max(120, H - top - bottom);
    const availW = Math.max(120, W - left - right);
    const s = Math.min((availH * 0.95) / 2.3, (availW * 0.94) / 2.1);
    view.s = s;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dist = H / (2 * Math.tan(fov / 2) * s);
    const elev = 0.16;
    const dy = (top + availH / 2 - H / 2) / s;
    const dx = (left + availW / 2 - W / 2) / s;
    view.target.set(-dx, PIVOT_Y + dy - 0.04, 0);
    view.base.set(view.target.x, view.target.y + Math.sin(elev) * dist, Math.cos(elev) * dist);
    placeCamera();
    return metrics();
  }

  const _cd = new V3();
  function placeCamera() {
    const k = 1 + flip.zoom * 0.2;
    camera.position.copy(view.target).addScaledVector(_cd.copy(view.base).sub(view.target), k);
    camera.position.y += flip.zoom * 0.25;
    camera.position.x += view.parS.x * 0.28;
    camera.position.y += view.parS.y * 0.14;
    camera.lookAt(_cd.copy(view.target).setY(view.target.y + flip.zoom * 0.22));
    camera.updateMatrixWorld();
  }

  const _p = new V3();
  function toScreen(v) {
    _p.copy(v).project(camera);
    return { x: (_p.x * 0.5 + 0.5) * view.W, y: (-_p.y * 0.5 + 0.5) * view.H };
  }
  function metrics() {
    rig.updateMatrixWorld(true);
    const c = G.getWorldPosition(new V3());
    const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0);
    const sc = toScreen(c);
    const se = toScreen(c.clone().addScaledVector(right, 1));
    const bottom = toScreen(new V3(c.x, 0, 0.9));
    return { cx: sc.x, cy: sc.y, r: Math.abs(se.x - sc.x), baseBottom: bottom.y, scale: view.s };
  }

  /* ---------- gestures ---------- */
  const pointer = { id: null, x0: 0, y0: 0, x: 0, y: 0, t0: 0, moved: false, startTarget: new V3() };
  const raycaster = new THREE.Raycaster();
  raycaster.layers.enableAll();

  function ndc(x, y) {
    const r = canvas.getBoundingClientRect();
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  }

  function pick(x, y) {
    // outside the glass first (base parts)
    raycaster.setFromCamera(ndc(x, y), camera);
    const baseHit = raycaster.intersectObjects(base.pickables, false)[0];
    if (baseHit) return { kind: baseHit.object.userData.pick, point: baseHit.point };
    // inside: undo the lens magnification around the sphere's screen centre
    const m = metrics();
    const d = Math.hypot(x - m.cx, y - m.cy);
    if (d > m.r * 0.98) return null;
    const ux = m.cx + (x - m.cx) / LENS;
    const uy = m.cy + (y - m.cy) / LENS;
    raycaster.setFromCamera(ndc(ux, uy), camera);
    const inner = [...scenery.pickables];
    if (feat.active && prints[feat.idx]) inner.push(prints[feat.idx].front);
    if (rm) inner.push(...rmPrints.filter((p) => p.visible));
    const hit = raycaster.intersectObjects(inner, false)[0];
    if (hit) {
      if (hit.object.userData.print !== undefined || rmPrints.includes(hit.object)) return { kind: 'photo' };
      return { kind: hit.object.userData.pick };
    }
    if (featuredRect() && inRect(x, y, featuredRect(), 10)) return { kind: 'photo' };
    return { kind: 'glass' };
  }
  const inRect = (x, y, r, pad = 0) => x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;

  function onDown(e) {
    if (pointer.id !== null) return;
    pointer.id = e.pointerId;
    pointer.x0 = pointer.x = e.clientX;
    pointer.y0 = pointer.y = e.clientY;
    pointer.t0 = performance.now();
    pointer.moved = false;
    pointer.startTarget.copy(motion.target);
    canvas.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    if (e.pointerType === 'mouse') {
      view.par.set((e.clientX / view.W) * 2 - 1, -((e.clientY / view.H) * 2 - 1));
    }
    if (pointer.id !== e.pointerId) {
      if (e.pointerType === 'mouse' && !flip.active) hover(e.clientX, e.clientY);
      return;
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    const dx = pointer.x - pointer.x0, dy = pointer.y - pointer.y0;
    if (!pointer.moved && Math.hypot(dx, dy) > 7) {
      pointer.moved = true;
      if (!rm && !flip.active) {
        motion.held = true;
        canvas.classList.add('is-grabbing');
        emit('grab');
      }
    }
    if (pointer.moved && motion.held) {
      const k = 1 / view.s;
      motion.target.set(clamp(dx * k * 0.85, -0.85, 0.85), clamp(-dy * k * 0.85, 0, 0.55), 0);
    }
  }
  function onUp(e) {
    if (pointer.id !== e.pointerId) return;
    pointer.id = null;
    canvas.classList.remove('is-grabbing');
    const dt = performance.now() - pointer.t0;
    if (!pointer.moved && dt < 450) tap(e.clientX, e.clientY);
    if (motion.held) {
      motion.held = false;
      motion.target.set(0, 0, 0);
    }
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', () => view.par.set(0, 0));

  let hoverT = 0;
  function hover(x, y) {
    const now = performance.now();
    if (now - hoverT < 70) return;
    hoverT = now;
    const h = pick(x, y);
    const interactive = h && h.kind && h.kind !== 'glass';
    canvas.classList.toggle('is-pointer', !!interactive);
  }

  function tap(x, y) {
    const h = pick(x, y);
    if (!h) return;
    if (h.kind === 'photo') {
      if (feat.idx >= 0 && (rm || feat.arrived)) emit('openPhoto', { index: feat.idx, album: album.slug });
      return;
    }
    if (h.kind === 'house') {
      houseCat = !houseCat;
      scenery.setCat(houseCat);
      emit('cat', houseCat);
      return;
    }
    if (['knob', 'plate', 'martenitsa'].includes(h.kind)) {
      emit(h.kind);
      return;
    }
    if (h.kind === 'glass' && !rm) {
      // a fingertip tap on the glass: a little shiver
      fluid.turb = Math.min(1, fluid.turb + 0.07);
      motion.vel.x += (Math.random() - 0.5) * 0.6;
      emit('tink');
    }
  }

  /* ---------- actions ---------- */
  let shakeTl = null;
  function shake(power = 1) {
    if (rm) {
      nextRM();
      return;
    }
    if (flip.active) return;
    shakeTl?.kill();
    motion.held = true;
    fluid.swirlSign = Math.random() > 0.5 ? 1 : -1;
    const steps = [-0.42, 0.46, -0.4, 0.36, -0.24, 0.12, 0];
    const lifts = [0.2, 0.26, 0.22, 0.2, 0.12, 0.05, 0];
    shakeTl = window.gsap.timeline({ onComplete: () => { motion.held = false; motion.target.set(0, 0, 0); } });
    steps.forEach((x, i) => shakeTl.to(motion.target, { x: x * power, y: lifts[i] * power, duration: i === 0 ? 0.16 : 0.13, ease: 'sine.inOut' }));
    emit('shake');
  }

  function impulse(ax, ay, az) {
    // device motion, in screen-ish axes (m/s²)
    if (rm || flip.active) return;
    const a = Math.hypot(ax, ay, az);
    motion.vel.x += ax * 0.012;
    motion.vel.y += Math.abs(ay) * 0.006;
    const inv = new THREE.Quaternion().copy(G.getWorldQuaternion(new THREE.Quaternion())).invert();
    const aL = new V3(ax, ay, az).applyQuaternion(inv);
    fluid.U.addScaledVector(aL, -0.012);
    fluid.turb = Math.min(1.1, fluid.turb + a * 0.0035);
    fluid.om.y += fluid.swirlSign * a * 0.0025;
  }

  function turnKnob(a) {
    const i = Math.max(0, blog.albums.findIndex((x) => x.slug === a.slug));
    const target = -i * ((Math.PI * 2) / blog.albums.length);
    if (rm || !window.gsap) base.knob.rotation.z = target;
    else window.gsap.to(base.knob.rotation, { z: target, duration: 0.9, ease: 'back.out(2)' });
    shadowsDirty = true;
  }

  async function setAlbum(a, { animate = true } = {}) {
    if (album && a.slug === album.slug) return;
    if (flip.active) return;
    turnKnob(a);
    const loading = buildAlbum(a);
    if (!album || !animate) {
      const entry = await loading;
      mountAlbum(entry, { scatter: album ? 'homes' : 'homes' });
      if (rm) showRM(0, true);
      emit('album', a.slug);
      return;
    }
    if (rm) {
      const entry = await loading;
      mountAlbum(entry);
      showRM(0, false);
      emit('album', a.slug);
      return;
    }
    flip.active = true;
    feat.active = false;
    emit('unfeatured');
    emit('flipStart');
    shakeTl?.kill();
    motion.held = false;
    motion.target.set(0, 0, 0);
    const gsap = window.gsap;
    await new Promise((res) => {
      const tl = gsap.timeline({ onComplete: res });
      tl.to(flip, { lift: 0.42, duration: 0.5, ease: 'power2.out' });
      tl.to(flip, { zoom: 1, duration: 0.8, ease: 'power2.inOut' }, 0);
      tl.to(flip, { roll: Math.PI, duration: 0.95, ease: 'power2.inOut' }, 0.2);
    });
    const entry = await loading;
    // swap while upside down
    const old = prints;
    old.forEach((p) => (p.scaleTarget = 0));
    await new Promise((r) => setTimeout(r, 260));
    mountAlbum(entry, { scatter: 'top' });
    emit('album', a.slug);
    emit('clunk');
    await new Promise((res) => {
      const tl = gsap.timeline({ onComplete: res });
      tl.to(flip, { roll: Math.PI * 2, duration: 1.0, ease: 'power2.inOut' }, 0.15);
      tl.to(flip, { lift: 0, duration: 0.42, ease: 'power2.in' }, 0.85);
      tl.to(flip, { zoom: 0, duration: 1.0, ease: 'power2.inOut' }, 0.45);
    });
    flip.roll = 0;
    prevRotZ -= Math.PI * 2;
    flip.active = false;
    motion.vel.y = -0.9;
    emit('flipEnd');
  }

  function feature(index) {
    if (!prints[index]) return;
    if (rm) {
      showRM(index, false);
      return;
    }
    if (feat.active && feat.idx === index) return;
    feat.idx = index;
    feat.next = (index + 1) % prints.length;
    feat.active = true;
    feat.arrived = false;
    feat.agitated = false;
    emit('featuring', { index });
  }

  /* ---------- reduced motion ---------- */
  function showRM(index, instant) {
    if (!prints[index]) return;
    feat.idx = index;
    feat.next = (index + 1) % prints.length;
    feat.active = true;
    const it = prints[index];
    const incoming = rmPrints[1 - rmFront];
    const outgoing = rmPrints[rmFront];
    incoming.material.map = it.frontTex;
    incoming.material.emissiveMap = it.frontTex;
    incoming.material.needsUpdate = true;
    incoming.scale.set(it.w * FEATURE_SCALE, it.h * FEATURE_SCALE, 1);
    incoming.visible = true;
    incoming.renderOrder = 2;
    outgoing.renderOrder = 1;
    rmFront = 1 - rmFront;
    placeRM();
    const gsap = window.gsap;
    gsap.killTweensOf([incoming.material, outgoing.material]);
    if (instant) {
      incoming.material.opacity = 1;
      outgoing.material.opacity = 0;
      outgoing.visible = false;
    } else {
      gsap.to(incoming.material, { opacity: 1, duration: 0.9, ease: 'sine.inOut' });
      gsap.to(outgoing.material, {
        opacity: 0,
        duration: 0.9,
        ease: 'sine.inOut',
        onComplete: () => {
          outgoing.visible = false;
          renderUntil = performance.now() + 120;
        },
      });
    }
    renderUntil = performance.now() + 1200;
    feat.arrived = true;
    emit('featured', { index, album: album.slug });
  }
  function placeRM() {
    const p = camL.clone().multiplyScalar(0.5).add(new V3(0, FRONT_LIFT, 0));
    const m = new THREE.Matrix4().lookAt(camL, new V3(), new V3(0, 1, 0));
    rmPrints.forEach((mesh) => {
      mesh.position.copy(p);
      mesh.quaternion.setFromRotationMatrix(m);
    });
  }
  function nextRM() {
    if (!prints.length) return;
    showRM(feat.next, false);
  }
  let renderUntil = 0;
  let rmTail = false;

  function setReducedMotion(v) {
    rm = v;
    prints.forEach((p) => (p.group.visible = !rm));
    rmPrints.forEach((m) => (m.visible = false));
    if (rm) {
      flakes.freeze();
      showRM(Math.max(0, feat.idx), true);
    } else {
      rmPrints.forEach((m) => (m.material.opacity = 0));
      feat.active = false;
      feat.agitated = true;
      fluid.turb = 0.3;
    }
    renderUntil = performance.now() + 600;
  }

  /* ---------- language: the band on the base turns to show the other plate ---------- */
  let ringHalf = 0;
  function setLang(lang, animate = true) {
    const want = lang === 'en' ? 1 : 0;
    if (ringHalf % 2 !== want) {
      ringHalf++;
      if (animate && !rm) {
        window.gsap.to(base.ring.rotation, {
          y: ringHalf * Math.PI,
          duration: 1.25,
          ease: 'back.inOut(1.4)',
          onStart: () => emit('ratchet'),
        });
      } else base.ring.rotation.y = ringHalf * Math.PI;
      shadowsDirty = true;
    }
    if (album) refreshBacks(albumCache.get(album.slug));
    renderUntil = performance.now() + 1500;
  }

  function featuredRect() {
    if (feat.idx < 0) return null;
    const mesh = rm ? rmPrints[rmFront] : prints[feat.idx]?.front;
    if (!mesh) return null;
    mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const m = metrics();
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const [x, y] of [[bb.min.x, bb.min.y], [bb.max.x, bb.min.y], [bb.min.x, bb.max.y], [bb.max.x, bb.max.y]]) {
      const s = toScreen(new V3(x, y, 0).applyMatrix4(mesh.matrixWorld));
      const sx = m.cx + (s.x - m.cx) * LENS;
      const sy = m.cy + (s.y - m.cy) * LENS;
      l = Math.min(l, sx); r = Math.max(r, sx); t = Math.min(t, sy); b = Math.max(b, sy);
    }
    return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
  }

  /* ---------- simulation ---------- */
  const _q = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _v = new V3(), _w = new V3(), _a = new V3();
  function fluidAt(x, y, z, out) {
    const r2 = x * x + y * y + z * z;
    const f = r2 < 1 ? 1 - r2 : 0;
    const U = fluid.U, o = fluid.om;
    let vx = U.x * f + (o.y * z - o.z * y);
    let vy = U.y * f + (o.z * x - o.x * z);
    let vz = U.z * f + (o.x * y - o.y * x);
    const A = (fluid.turb + 0.022) * 0.5, k = 3.3, p = fluid.ph;
    const sx = x * k + p.x, sy = y * k + p.y, sz = z * k + p.z;
    vx += A * (Math.sin(sz) + Math.cos(sy));
    vy += A * (Math.sin(sx) + Math.cos(sz));
    vz += A * (Math.sin(sy) + Math.cos(sx));
    if (r2 > 0.64) {
      const rr = Math.sqrt(r2), vr = (vx * x + vy * y + vz * z) / rr;
      if (vr > 0) {
        const w = Math.min(1, (rr - 0.8) / 0.15) / rr;
        vx -= vr * x * w; vy -= vr * y * w; vz -= vr * z * w;
      }
    }
    out[0] = vx; out[1] = vy; out[2] = vz;
  }

  function stepRig(dt) {
    const held = motion.held;
    const k = held ? 150 : 44, c = held ? 19 : 3.4;
    const ky = held ? 150 : 75, cy = held ? 19 : 10;
    motion.vel.x += (k * (motion.target.x - motion.pos.x) - c * motion.vel.x) * dt;
    motion.vel.y += (ky * (motion.target.y - motion.pos.y) - cy * motion.vel.y) * dt;
    motion.pos.x += motion.vel.x * dt;
    motion.pos.y += motion.vel.y * dt;
    if (motion.pos.y < 0) {
      if (motion.vel.y < -0.7) emit('thud', -motion.vel.y);
      motion.pos.y = 0;
      motion.vel.y *= -0.22;
    }
    const tz = clamp(motion.vel.x * 0.075, -0.34, 0.34);
    const tx = clamp(-motion.vel.y * 0.035, -0.14, 0.14);
    const kt = 85, ct = held ? 10 : 2.4;
    motion.tiltVel.z += (kt * (tz - motion.tilt.z) - ct * motion.tiltVel.z) * dt;
    motion.tiltVel.x += (kt * (tx - motion.tilt.x) - ct * motion.tiltVel.x) * dt;
    motion.tilt.z += motion.tiltVel.z * dt;
    motion.tilt.x += motion.tiltVel.x * dt;
    const tm = Math.hypot(motion.tilt.x, motion.tilt.z);
    const rimLift = Math.max(0, 1.12 * Math.cos(tm) + 1.0 * Math.sin(tm) - 1.12);
    rig.position.set(motion.pos.x, PIVOT_Y + motion.pos.y + rimLift + flip.lift, 0);
    rig.rotation.set(motion.tilt.x, 0, motion.tilt.z + flip.roll);
    rig.updateMatrixWorld(true);

    // how the glass moved -> what the water feels
    const gp = G.getWorldPosition(_v);
    const vel = _w.copy(gp).sub(prevG).divideScalar(dt);
    _a.copy(vel).sub(prevVel).divideScalar(dt);
    accS.lerp(_a, 0.5);
    prevVel.copy(vel);
    prevG.copy(gp);
    const rz = motion.tilt.z + flip.roll, rx = motion.tilt.x;
    const wz = (rz - prevRotZ) / dt, wx = (rx - prevRotX) / dt;
    prevRotZ = rz;
    prevRotX = rx;
    G.getWorldQuaternion(_q);
    _qi.copy(_q).invert();
    gL.set(0, -1, 0).applyQuaternion(_qi);
    camL.copy(camera.position).sub(gp).applyQuaternion(_qi).normalize();
    const moving = vel.lengthSq() > 1e-6 || Math.abs(wz) + Math.abs(wx) > 1e-4;
    if (moving) shadowsDirty = true;

    const aL = _a.copy(accS).applyQuaternion(_qi);
    const am = Math.min(aL.length(), 120);
    if (am > 0.4) {
      fluid.U.addScaledVector(aL, -dt * 0.2);
      if (fluid.U.length() > 1.2) fluid.U.setLength(1.2);
      fluid.turb = Math.min(1.6, fluid.turb + am * dt * 0.02);
      fluid.om.y += fluid.swirlSign * am * dt * 0.016;
    }
    const wL = _w.set(wx, 0, wz).applyQuaternion(_qi);
    fluid.om.addScaledVector(wL, -dt * 0.62);
    if (fluid.om.length() > 4.2) fluid.om.setLength(4.2);
    if (am > 3) emit('swish', am);
  }

  function stepFluid(dt) {
    fluid.U.multiplyScalar(Math.exp(-dt * 1.7));
    fluid.om.multiplyScalar(Math.exp(-dt * 0.5));
    fluid.turb *= Math.exp(-dt * 0.6);
    const up = _v.copy(gL).negate();
    const U = fluid.U;
    fluid.om.x += (up.y * U.z - up.z * U.y) * dt * 0.9;
    fluid.om.y += (up.z * U.x - up.x * U.z) * dt * 0.9;
    fluid.om.z += (up.x * U.y - up.y * U.x) * dt * 0.9;
    const sp = 0.35 + fluid.turb * 1.4 + fluid.om.length() * 0.25;
    fluid.ph.x += dt * 0.61 * sp;
    fluid.ph.y += dt * 0.47 * sp;
    fluid.ph.z += dt * 0.53 * sp;
    fluid.energy = U.length() + fluid.om.length() * 0.4 + fluid.turb;
    if (fluid.energy > 3.3 && time - lastMess > 25) {
      lastMess = time;
      emit('mess');
    }
  }

  function stepFlakes(dt) {
    const F = flakes;
    const n = F.count;
    const P = F.pos, Vv = F.vel, rest = F.rest, RN = F.restN;
    const kS = 1 - Math.exp(-dt / 0.11), kG = 1 - Math.exp(-dt / 0.17);
    const gx = gL.x, gy = gL.y, gz = gL.z;
    const upright = gy < -0.7;
    const t = time;
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      let x = P[i3], y = P[i3 + 1], z = P[i3 + 2];
      if (rest[i]) {
        fluidAt(x, y, z, tmpA);
        const s2 = tmpA[0] * tmpA[0] + tmpA[1] * tmpA[1] + tmpA[2] * tmpA[2];
        const hold = -(gx * RN[i3] + gy * RN[i3 + 1] + gz * RN[i3 + 2]);
        const lt = F.lift[i];
        if (s2 < lt * lt && hold > 0.5) continue;
        rest[i] = 0;
        Vv[i3] = tmpA[0]; Vv[i3 + 1] = tmpA[1] + 0.05; Vv[i3 + 2] = tmpA[2];
      }
      fluidAt(x, y, z, tmpA);
      const vs = F.settle[i], ph = F.phase[i];
      const tx = tmpA[0] + gx * vs + Math.sin(t * 1.7 + ph) * 0.02;
      const ty = tmpA[1] + gy * vs;
      const tz = tmpA[2] + gz * vs + Math.cos(t * 1.3 + ph * 1.7) * 0.02;
      const k = i < F.nSnow ? kS : kG;
      let vx = Vv[i3] + (tx - Vv[i3]) * k;
      let vy = Vv[i3 + 1] + (ty - Vv[i3 + 1]) * k;
      let vz = Vv[i3 + 2] + (tz - Vv[i3 + 2]) * k;
      x += vx * dt; y += vy * dt; z += vz * dt;
      const fs2 = tmpA[0] * tmpA[0] + tmpA[1] * tmpA[1] + tmpA[2] * tmpA[2];
      const lt = F.lift[i] * 0.8;
      // ground
      const g0 = groundY(x, z) + 0.006;
      if (y < g0) {
        y = g0;
        if (vy < 0) vy = 0;
        if (upright && fs2 < lt * lt) {
          rest[i] = 1;
          RN[i3] = 0; RN[i3 + 1] = 1; RN[i3 + 2] = 0;
          F.rot[i * 2] = -1.5708 + (F.phase[i] % 0.5) - 0.25;
        }
      }
      // roof
      if (y < HOUSE.roofBase + 0.2) {
        const rs = roofSurface(x, z);
        if (rs !== null && y < rs && y > HOUSE.y) {
          y = rs;
          if (vy < 0) vy = 0;
          if (upright && fs2 < lt * lt) {
            rest[i] = 1;
            RN[i3] = 0; RN[i3 + 1] = 1; RN[i3 + 2] = 0;
          }
        }
      }
      // glass wall
      const r2 = x * x + y * y + z * z;
      if (r2 > WALL * WALL) {
        const rr = Math.sqrt(r2), s = WALL / rr;
        x *= s; y *= s; z *= s;
        const nx = -x / WALL, ny = -y / WALL, nz = -z / WALL;
        const vn = vx * nx + vy * ny + vz * nz;
        if (vn < 0) { vx -= vn * nx; vy -= vn * ny; vz -= vn * nz; }
        const hold = -(gx * nx + gy * ny + gz * nz);
        if (hold > 0.72 && fs2 < lt * lt) {
          rest[i] = 1;
          RN[i3] = nx; RN[i3 + 1] = ny; RN[i3 + 2] = nz;
        }
      }
      P[i3] = x; P[i3 + 1] = y; P[i3 + 2] = z;
      Vv[i3] = vx; Vv[i3 + 1] = vy; Vv[i3 + 2] = vz;
      const sp = Math.abs(vx) + Math.abs(vy) + Math.abs(vz);
      const i2 = i * 2;
      F.rot[i2] += F.spin[i] * (0.5 + sp * 9) * dt;
      F.rot[i2 + 1] += F.spin[i] * 0.8 * (0.4 + sp * 7) * dt;
      F.write(i);
    }
    F.snow.instanceMatrix.needsUpdate = true;
    F.glitter.instanceMatrix.needsUpdate = true;
  }

  const _m4 = new THREE.Matrix4(), _qt = new THREE.Quaternion(), _qd = new THREE.Quaternion(), _up = new V3(0, 1, 0);
  function stepPrints(dt) {
    const E = fluid.energy;
    const calm = flip.active ? 0 : smooth(0.55, 0.1, E);
    const n = prints.length;
    const front = _v.copy(camL).multiplyScalar(0.5);
    front.y += FRONT_LIFT + Math.sin(time * 0.9) * 0.008;
    for (let j = 0; j < n; j++) {
      const p = prints[j];
      const isF = feat.active && feat.idx === j;
      fluidAt(p.pos.x, p.pos.y, p.pos.z, tmpA);
      const target = isF ? front : p.home;
      const bob = isF ? 0 : Math.sin(time * 0.55 + p.phase) * 0.025;
      const ks = isF ? 2.6 : 1.1, cs = isF ? 2.9 : 1.8;
      const c2 = calm * calm;
      const sx = (target.x - p.pos.x) * ks * c2 - p.vel.x * cs * calm;
      const sy = (target.y + bob - p.pos.y) * ks * c2 - p.vel.y * cs * calm;
      const sz = (target.z - p.pos.z) * ks * c2 - p.vel.z * cs * calm;
      const kd = 1 - Math.exp(-dt / 0.42);
      const vs = 0.05;
      p.vel.x += (tmpA[0] + gL.x * vs - p.vel.x) * kd * (1 - c2 * 0.7) + sx * dt;
      p.vel.y += (tmpA[1] + gL.y * vs - p.vel.y) * kd * (1 - c2 * 0.7) + sy * dt;
      p.vel.z += (tmpA[2] + gL.z * vs - p.vel.z) * kd * (1 - c2 * 0.7) + sz * dt;
      // keep apart
      for (let k = j + 1; k < n; k++) {
        const o = prints[k];
        const dx = p.pos.x - o.pos.x, dy = p.pos.y - o.pos.y, dz = p.pos.z - o.pos.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-5;
        const minD = (feat.active && (feat.idx === j || feat.idx === k)) ? 0.42 : 0.24;
        if (d < minD) {
          const f = ((minD - d) / d) * 2.2 * dt;
          const oF = feat.active && feat.idx === k, pF = feat.active && feat.idx === j;
          if (!pF) { p.vel.x += dx * f; p.vel.y += dy * f; p.vel.z += dz * f; }
          if (!oF) { o.vel.x -= dx * f; o.vel.y -= dy * f; o.vel.z -= dz * f; }
        }
      }
      p.pos.addScaledVector(p.vel, dt);
      // collisions
      const lim = WALL - p.half * p.scale * 0.75;
      const r = p.pos.length();
      if (r > lim) {
        p.pos.multiplyScalar(lim / r);
        const vn = p.vel.dot(p.pos) / lim;
        if (vn > 0) p.vel.addScaledVector(p.pos, -vn / lim);
      }
      const gy0 = groundY(p.pos.x, p.pos.z) + p.half * 0.55;
      if (p.pos.y < gy0) {
        p.pos.y = gy0;
        if (p.vel.y < 0) p.vel.y *= -0.2;
      }
      const rs = roofSurface(p.pos.x, p.pos.z);
      if (rs !== null && p.pos.y < rs + p.half * 0.4 && p.pos.y > HOUSE.y - 0.1) {
        p.pos.y += (rs + p.half * 0.4 - p.pos.y) * 0.3;
        if (p.vel.y < 0) p.vel.y = 0;
      }
      // tumbling
      const speed = p.vel.length();
      const wt = 1 - calm;
      _w.set(Math.sin(time * 1.9 + p.phase), Math.sin(time * 1.3 + p.phase * 2.1), Math.sin(time * 2.3 + p.phase * 0.7)).multiplyScalar(speed * 5 * wt).addScaledVector(fluid.om, 0.6 * wt);
      p.w3.lerp(_w, 1 - Math.exp(-dt / 0.35));
      const wl = p.w3.length();
      if (wl > 1e-4) {
        _qd.setFromAxisAngle(_a.copy(p.w3).divideScalar(wl), wl * dt);
        p.q.premultiply(_qd);
      }
      if (isF) {
        _m4.lookAt(camL, front, _up);
        _qt.setFromRotationMatrix(_m4);
        _qd.setFromAxisAngle(_a.set(0, 0, 1), Math.sin(time * 0.7) * 0.025);
        _qt.multiply(_qd);
      } else _qt.copy(p.homeQ);
      p.q.slerp(_qt, 1 - Math.exp(-dt * 2.4 * calm));
      p.q.normalize();
      // scale
      const st = p.scaleTarget * (isF ? FEATURE_SCALE : 1);
      p.scale += (st - p.scale) * (1 - Math.exp(-dt * (p.scaleTarget === 0 ? 14 : 2.4)));
      p.group.position.copy(p.pos);
      p.group.quaternion.copy(p.q);
      p.group.scale.setScalar(Math.max(0.001, p.scale));
      if (isF && !feat.arrived && p.pos.distanceTo(front) < 0.035 && p.scale > FEATURE_SCALE - 0.1) {
        feat.arrived = true;
        emit('featured', { index: j, album: album.slug });
      }
    }
  }

  function stepFeature(dt) {
    if (flip.active || !prints.length) return;
    const E = fluid.energy;
    if (E > 0.32) {
      feat.calm = 0;
      if (!feat.agitated) {
        feat.agitated = true;
        if (feat.active) {
          feat.active = false;
          feat.arrived = false;
          emit('unfeatured');
        }
      }
    } else if (feat.agitated) {
      feat.calm = E < 0.15 ? feat.calm + dt : 0;
      if (feat.calm > 0.35) {
        feat.agitated = false;
        feat.idx = feat.next % prints.length;
        feat.next = (feat.idx + 1) % prints.length;
        feat.active = true;
        feat.arrived = false;
        emit('featuring', { index: feat.idx });
      }
    }
  }

  function stepBubble(dt) {
    const up = _v.copy(gL).negate();
    const cur = bubble.position.clone().normalize();
    cur.lerp(up, 1 - Math.exp(-dt * 2.2)).normalize();
    bubble.position.copy(cur).multiplyScalar(0.935);
    bubble.quaternion.setFromUnitVectors(_up, cur);
  }

  function stepShadow() {
    const lift = rig.position.y - PIVOT_Y;
    const tm = Math.abs(rig.rotation.z % (Math.PI * 2));
    const away = Math.min(1, lift * 1.6 + Math.min(tm, Math.PI * 2 - tm) * 0.25);
    contact.position.x = rig.position.x;
    contact.scale.setScalar(1 + away * 0.6);
    contact.material.opacity = 0.75 * (1 - away * 0.85);
    soft.position.x = 0.5 + rig.position.x;
    soft.material.opacity = 0.4 * (1 - away * 0.6);
    caustic.position.x = 1.55 + rig.position.x;
    caustic.material.opacity = 0.55 * (1 - away);
  }

  /* ---------- render ---------- */
  function render() {
    glass.visible = false;
    camera.layers.enable(INSIDE);
    if (shadowsDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    renderer.setRenderTarget(glassRT);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    camera.layers.disable(INSIDE);
    glass.visible = true;
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  /* ---------- adaptive quality ---------- */
  const perf = { warm: 0, sum: 0, n: 0, level: 0 };
  const degrade = [
    () => (Q.dpr = Math.min(Q.dpr, 1.25)),
    () => (Q.rt = Math.min(Q.rt, 0.5)),
    () => { Q.bloom = false; setupComposer(); },
    () => flakes.setCount(Math.round(flakes.count * 0.6)),
    () => (Q.dpr = 1),
  ];
  function watchPerf(raw) {
    if (tierInfo.pinned || perf.level >= degrade.length) return;
    perf.warm += raw;
    if (perf.warm < 2 || raw > 1.2) return; // skip the warm-up and tab-switch hitches
    perf.sum += raw;
    perf.n++;
    if (perf.n >= 60 || perf.sum > 1.5) {
      if (perf.sum / perf.n > 1 / 38) {
        degrade[perf.level++]();
        resize();
        perf.warm = 1.2;
      }
      perf.sum = perf.n = 0;
    }
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000;
    last = now;
    const dt = Math.min(Math.max(raw, 0.001), 1 / 24);
    time += dt;
    view.parS.lerp(view.par, 1 - Math.exp(-dt * 3));
    placeCamera();
    if (rm) {
      // render on demand, plus one last frame after each change settles
      const live = now < renderUntil;
      if (!live && !rmTail && firstFrame) return;
      rmTail = live;
      stepRig(dt);
      stepBubble(1);
      render();
    } else {
      stepRig(dt);
      stepFluid(dt);
      stepFeature(dt);
      stepFlakes(dt);
      stepPrints(dt);
      stepBubble(dt);
      stepShadow();
      backdropMat.uniforms.uTime.value = time;
      render();
      watchPerf(raw);
    }
    if (!firstFrame) {
      firstFrame = true;
      emit('firstFrame');
    }
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /* ---------- boot ---------- */
  resize();
  const first = blog.albums.find((a) => a.slug === opts.initialAlbum) || blog.albums[0];
  const entry = await buildAlbum(first);
  mountAlbum(entry);
  turnKnob(first);
  prints.forEach((p) => (p.scale = 1));
  setLang(blog.lang, false);
  if (rm) {
    flakes.freeze();
    showRM(0, true);
  } else {
    // arrive mid-swirl: the globe has "just been shaken"
    fluid.turb = 0.55;
    fluid.om.set(0.15, 1.1, 0.05);
    prints.forEach((p) => p.pos.set((Math.random() - 0.5) * 0.9, Math.random() * 0.6 - 0.1, (Math.random() - 0.5) * 0.9));
  }

  // compile every program up front (in parallel where supported) while the loader is still up
  try {
    camera.layers.enable(INSIDE);
    rmPrints.forEach((m) => (m.visible = true));
    if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
  } catch {
    /* compiled lazily on first frame instead */
  } finally {
    camera.layers.disable(INSIDE);
    rmPrints.forEach((m, i) => (m.visible = rm && m.material.opacity > 0));
  }

  return {
    on: (name, fn) => ((listeners[name] ||= []).push(fn)),
    layout,
    metrics,
    start,
    stop,
    shake,
    impulse,
    setAlbum,
    feature,
    setLang,
    setReducedMotion,
    featuredRect,
    get album() { return album; },
    get featured() { return feat.active ? feat.idx : -1; },
    get busy() { return flip.active; },
    get tier() { return tierInfo.name; },
    debug: () => ({ energy: fluid.energy, feat: { ...feat }, Q, perf: { ...perf } }),
    screenOf(x, y, z) {
      G.updateWorldMatrix(true, false);
      return toScreen(new V3(x, y, z).applyMatrix4(G.matrixWorld));
    },
    fastForward(sec) {
      const h = 1 / 60;
      for (let i = 0; i < Math.round(sec * 60); i++) {
        time += h;
        stepRig(h);
        stepFluid(h);
        stepFeature(h);
        stepFlakes(h);
        stepPrints(h);
        stepBubble(h);
      }
      stepShadow();
    },
  };

  /* ================= builders ================= */

  function buildBase(b) {
    const group = new THREE.Group();
    const pickables = [];
    const woodC = TX.woodCanvas({ seed: 7 });
    const wood = TX.toTexture(woodC, { repeat: true });
    wood.repeat.set(3, 1);
    const woodMat = new THREE.MeshPhysicalMaterial({ map: wood, roughness: 0.42, clearcoat: 0.85, clearcoatRoughness: 0.16, bumpMap: wood, bumpScale: 0.5, envMapIntensity: 0.9 });
    const ebonyMat = new THREE.MeshPhysicalMaterial({ map: wood, color: 0x3a2618, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd9b468, metalness: 1, roughness: 0.28, envMapIntensity: 1.3 });
    const P = (arr) => arr.map(([r, y]) => new THREE.Vector2(r, y));
    const SEG = 96;
    const plinth = new THREE.Mesh(new THREE.LatheGeometry(P([
      [0, -1.24], [0.96, -1.24], [0.995, -1.236], [1.01, -1.225], [1.016, -1.205],
      [1.016, -1.125], [1.009, -1.108], [0.99, -1.1], [0.955, -1.097], [0.94, -1.088],
      [0.926, -1.072], [0.916, -1.052], [0.913, -1.033], [0.916, -1.015], [0.928, -1.007],
      [0.937, -0.995], [0.937, -0.983], [0.929, -0.972], [0.915, -0.966], [0.9, -0.962], [0, -0.962],
    ]), SEG), woodMat);
    const ring = new THREE.Group();
    const band = new THREE.Mesh(new THREE.LatheGeometry(P([
      [0, -0.962], [0.893, -0.962], [0.9, -0.955], [0.905, -0.93], [0.906, -0.85], [0.905, -0.772], [0.9, -0.747], [0.893, -0.74], [0, -0.74],
    ]), SEG), ebonyMat);
    ring.add(band);
    const collar = new THREE.Mesh(new THREE.LatheGeometry(P([
      [0, -0.74], [0.9, -0.74], [0.915, -0.733], [0.923, -0.722], [0.921, -0.709], [0.906, -0.701],
      [0.886, -0.694], [0.862, -0.679], [0.846, -0.659], [0.839, -0.638], [0.837, -0.62], [0.832, -0.606],
      [0.82, -0.598], [0.8, -0.597], [0.77, -0.6], [0, -0.6],
    ]), SEG), woodMat);
    group.add(plinth, ring, collar);

    // brass plates, one per language, on opposite sides of the band
    const L = 1.0;
    const mkPlate = (text, angle) => {
      const c = TX.plateCanvases(text);
      const map = TX.toTexture(c.map);
      const bump = TX.toTexture(c.bump, { srgb: false });
      const mat = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2.2, metalness: 1, roughness: 0.34, envMapIntensity: 1.6 });
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.91, 0.91, 0.15, 48, 1, true, angle - L / 2, L), mat);
      plate.position.y = -0.851;
      plate.userData.pick = 'plate';
      ring.add(plate);
      pickables.push(plate);
      for (const s of [-1, 1]) {
        const screw = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), brassMat);
        const a = angle + s * (L / 2 - 0.035);
        screw.position.set(Math.sin(a) * 0.912, -0.851, Math.cos(a) * 0.912);
        screw.scale.set(1, 1, 0.5);
        screw.lookAt(screw.position.clone().multiplyScalar(2));
        ring.add(screw);
      }
    };
    mkPlate(b.site.name.bg, 0);
    mkPlate(b.site.name.en, Math.PI);

    // album knob on the plinth, front right
    const knob = new THREE.Group();
    const ka = 0.62;
    knob.position.set(Math.sin(ka) * 1.016, -1.165, Math.cos(ka) * 1.016);
    knob.rotation.y = ka;
    const kc = new THREE.CylinderGeometry(0.04, 0.043, 0.04, 28);
    kc.rotateX(Math.PI / 2);
    const kb = new THREE.Mesh(kc, brassMat);
    kb.position.z = 0.02;
    const pointerBar = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.03, 0.004), new THREE.MeshStandardMaterial({ color: 0x2a1a0c, roughness: 0.6 }));
    pointerBar.position.set(0, 0.012, 0.041);
    const knobSpin = new THREE.Group();
    knobSpin.add(kb, pointerBar);
    knob.add(knobSpin);
    kb.userData.pick = 'knob';
    pickables.push(kb);
    group.add(knob);

    // martenitsa tied around the collar
    const cordTex = TX.toTexture(TX.cordCanvas(), { repeat: true });
    cordTex.repeat.set(90, 1);
    const cordMat = new THREE.MeshStandardMaterial({ map: cordTex, roughness: 0.85 });
    class Circle extends THREE.Curve {
      getPoint(t, out = new V3()) {
        const a = t * Math.PI * 2;
        return out.set(Math.sin(a) * 0.927, -0.719, Math.cos(a) * 0.927);
      }
    }
    const cord = new THREE.Mesh(new THREE.TubeGeometry(new Circle(), 200, 0.0075, 6, true), cordMat);
    cord.userData.pick = 'martenitsa';
    pickables.push(cord);
    group.add(cord);
    const knotA = -0.92;
    const knotP = new V3(Math.sin(knotA) * 0.935, -0.72, Math.cos(knotA) * 0.935);
    const out = new V3(Math.sin(knotA), 0, Math.cos(knotA));
    const red = new THREE.MeshStandardMaterial({ color: 0xc2242f, roughness: 0.8 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf2ece2, roughness: 0.85 });
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), cordMat);
    knot.position.copy(knotP);
    knot.userData.pick = 'martenitsa';
    pickables.push(knot);
    group.add(knot);
    [[red, -0.05, 0.16], [white, 0.05, 0.13]].forEach(([mat, side, len]) => {
      const tang = new V3(Math.cos(knotA), 0, -Math.sin(knotA)).multiplyScalar(side);
      const pts = [
        knotP.clone(),
        knotP.clone().addScaledVector(out, 0.02).add(tang.clone().multiplyScalar(0.3)).add(new V3(0, -len * 0.35, 0)),
        knotP.clone().addScaledVector(out, 0.028).add(tang).add(new V3(0, -len, 0)),
      ];
      const strand = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.004, 5), mat);
      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.055, 12), mat);
      tassel.position.copy(pts[2]).add(new V3(0, -0.02, 0));
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), mat);
      pom.position.copy(pts[2]).add(new V3(0, 0.008, 0));
      for (const m of [strand, tassel, pom]) {
        m.userData.pick = 'martenitsa';
        pickables.push(m);
        group.add(m);
      }
    });

    return { group, ring, knob: knobSpin, pickables };
  }

  function buildScenery() {
    const group = new THREE.Group();
    const pickables = [];
    // snowy ground: a polar grid displaced by groundY, with a skirt down into the collar
    const RINGS = 26, SEGS = 72;
    const pos = [], col = [], idx = [];
    for (let i = 0; i <= RINGS + 1; i++) {
      for (let j = 0; j < SEGS; j++) {
        const a = (j / SEGS) * Math.PI * 2;
        let r, y;
        if (i <= RINGS) {
          r = 0.845 * Math.pow(i / RINGS, 0.75);
          y = groundY(Math.sin(a) * r, Math.cos(a) * r);
        } else {
          r = 0.87;
          y = -0.63;
        }
        pos.push(Math.sin(a) * r, y, Math.cos(a) * r);
        const shade = 0.9 + (y + 0.575) * 0.6;
        col.push(shade * 0.96, shade * 0.98, Math.min(1.05, shade * 1.04));
      }
    }
    for (let i = 0; i <= RINGS; i++) {
      for (let j = 0; j < SEGS; j++) {
        const a = i * SEGS + j, b = i * SEGS + ((j + 1) % SEGS), c = (i + 1) * SEGS + j, d = (i + 1) * SEGS + ((j + 1) % SEGS);
        idx.push(a, c, b, b, c, d);
      }
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    gg.setIndex(idx);
    gg.computeVertexNormals();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ee, vertexColors: true, roughness: 0.85, emissive: 0x161b28, emissiveIntensity: 0.5 });
    const ground = new THREE.Mesh(gg, snowMat);
    ground.receiveShadow = true;
    group.add(ground);

    // a small Revival-style house: stone ground floor, blue upper floor, hip roof
    const house = new THREE.Group();
    house.position.set(HOUSE.x, HOUSE.y, HOUSE.z);
    house.rotation.y = HOUSE.rot;
    const stone = TX.toTexture(TX.stoneCanvas());
    const blue = TX.toTexture(TX.plasterCanvas('#3e6fae'));
    const timber = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.8 });
    const gf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.21, 0.24), new THREE.MeshStandardMaterial({ map: stone, roughness: 0.9 }));
    gf.position.y = 0.045;
    const uf = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.3), new THREE.MeshStandardMaterial({ map: blue, roughness: 0.85 }));
    uf.position.set(0, 0.22, 0.03);
    const floorBeam = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.014, 0.31), timber);
    floorBeam.position.set(0, 0.152, 0.03);
    house.add(gf, uf, floorBeam);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.14, 0.014), timber);
      post.position.set(sx * 0.206, 0.22, 0.176);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.08, 0.012), timber);
      br.position.set(sx * 0.15, 0.12, 0.14);
      br.rotation.x = 0.7;
      house.add(post, br);
    }
    const winTex = TX.toTexture(TX.windowCanvas(false));
    const catTex = TX.toTexture(TX.windowCanvas(true));
    const winMat = new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: 2.4, roughness: 0.4 });
    const catMat = winMat.clone();
    const addWin = (x, y, z, w, h, ry = 0, mat = winMat) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      house.add(m);
      return m;
    };
    addWin(-0.13, 0.225, 0.1815, 0.055, 0.075);
    const catWindow = addWin(0, 0.225, 0.1815, 0.055, 0.075, 0, catMat);
    addWin(0.13, 0.225, 0.1815, 0.055, 0.075);
    addWin(0.2115, 0.225, 0.06, 0.05, 0.07, Math.PI / 2);
    addWin(0.2115, 0.225, -0.06, 0.05, 0.07, Math.PI / 2);
    addWin(-0.2115, 0.225, 0.04, 0.05, 0.07, -Math.PI / 2);
    addWin(-0.08, 0.075, 0.1215, 0.05, 0.06);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.1), new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.7 }));
    door.position.set(0.08, 0.06, 0.1215);
    house.add(door);
    // roof
    const tiles = TX.toTexture(TX.tilesCanvas());
    const roof = new THREE.Mesh(hipRoof(HOUSE.w, HOUSE.d, HOUSE.roofH), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.75 }));
    roof.position.set(0, 0.29, 0.03);
    const roofSnow = new THREE.Mesh(hipRoof(HOUSE.w * 0.93, HOUSE.d * 0.91, HOUSE.roofH * 0.97), new THREE.MeshStandardMaterial({ color: 0xf6f8fc, roughness: 0.8, emissive: 0x1a2030, emissiveIntensity: 0.5 }));
    roofSnow.position.set(0, 0.302, 0.03);
    const eaves = new THREE.Mesh(new THREE.BoxGeometry(HOUSE.w, 0.014, HOUSE.d), timber);
    eaves.position.set(0, 0.286, 0.03);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.045), new THREE.MeshStandardMaterial({ map: stone, roughness: 0.9 }));
    chim.position.set(0.11, 0.39, -0.02);
    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.07), new THREE.MeshStandardMaterial({ color: 0xf6f8fc, roughness: 0.8 }));
    chimCap.position.set(0.11, 0.452, -0.02);
    house.add(roof, roofSnow, eaves, chim, chimCap);
    house.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.pick = 'house';
        pickables.push(o);
      }
    });
    group.add(house);

    // firs
    const fir = (x, z, h, r0) => {
      const g = new THREE.Group();
      g.position.set(x, groundY(x, z) - 0.01, z);
      const green = new THREE.MeshStandardMaterial({ color: 0x1d4630, roughness: 0.9 });
      const snowy = new THREE.MeshStandardMaterial({ color: 0xf2f5fb, roughness: 0.85, emissive: 0x1a2030, emissiveIntensity: 0.5 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r0 * 0.12, r0 * 0.15, h * 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x3b2618 }));
      trunk.position.y = h * 0.1;
      g.add(trunk);
      const tiers = 4;
      for (let i = 0; i < tiers; i++) {
        const rr = r0 * (1 - i * 0.2);
        const th = h * 0.36;
        const y = h * 0.15 + i * h * 0.2 + th / 2;
        const c = new THREE.Mesh(new THREE.ConeGeometry(rr, th, 10), green);
        c.position.y = y;
        c.rotation.y = i * 0.5;
        const s = new THREE.Mesh(new THREE.ConeGeometry(rr * 0.8, th * 0.55, 10), snowy);
        s.position.y = y + th * 0.24;
        s.rotation.y = i * 0.5 + 0.3;
        g.add(c, s);
      }
      g.traverse((o) => o.isMesh && (o.castShadow = true));
      group.add(g);
    };
    fir(-0.42, -0.08, 0.58, 0.18);
    fir(0.43, -0.22, 0.34, 0.11);
    fir(-0.18, -0.52, 0.4, 0.12);

    // snowman with a martenitsa scarf
    const sm = new THREE.Group();
    const smx = 0.36, smz = 0.3;
    sm.position.set(smx, groundY(smx, smz) - 0.01, smz);
    sm.rotation.y = -0.4;
    const snowW = new THREE.MeshStandardMaterial({ color: 0xf6f8fc, roughness: 0.8, emissive: 0x1a2030, emissiveIntensity: 0.5 });
    [[0.05, 0.045], [0.036, 0.122], [0.026, 0.177]].forEach(([r, y]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), snowW);
      b.position.y = y;
      sm.add(b);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0xe8792a }));
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.177, 0.038);
    const coal = new THREE.MeshStandardMaterial({ color: 0x1a1414 });
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 6), coal);
      e.position.set(sx * 0.009, 0.185, 0.023);
      sm.add(e);
    }
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 18), new THREE.MeshStandardMaterial({ map: (() => { const t = TX.toTexture(TX.cordCanvas(), { repeat: true }); t.repeat.set(6, 1); return t; })(), roughness: 0.85 }));
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.152;
    sm.add(nose, scarf);
    sm.traverse((o) => o.isMesh && (o.castShadow = true));
    group.add(sm);

    return {
      group,
      pickables,
      setCat(on) {
        catWindow.material.map = on ? catTex : winTex;
        catWindow.material.emissiveMap = on ? catTex : winTex;
        catWindow.material.needsUpdate = true;
      },
    };
  }

  function buildFlakes(nSnow, nGlit) {
    const snowGeo = new THREE.CircleGeometry(0.0072, 6);
    const glitGeo = new THREE.PlaneGeometry(0.01, 0.01);
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7d8aa0, emissiveIntensity: 0.6, roughness: 0.5, side: THREE.DoubleSide });
    const glitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.16, side: THREE.DoubleSide, envMapIntensity: 3.2, emissive: 0x3a3020, emissiveIntensity: 0.4 });
    const snow = new THREE.InstancedMesh(snowGeo, snowMat, nSnow);
    const glitter = new THREE.InstancedMesh(glitGeo, glitMat, nGlit);
    snow.frustumCulled = glitter.frustumCulled = false;
    const tints = [new THREE.Color(0xffd98a), new THREE.Color(0xe8eef8), new THREE.Color(0xffb0a0), new THREE.Color(0xc8e0ff)];
    for (let i = 0; i < nGlit; i++) glitter.setColorAt(i, tints[i % tints.length]);
    const count = nSnow + nGlit;
    const F = {
      snow, glitter, nSnow, count,
      pos: new Float32Array(count * 3), vel: new Float32Array(count * 3), restN: new Float32Array(count * 3),
      rest: new Uint8Array(count), settle: new Float32Array(count), lift: new Float32Array(count),
      phase: new Float32Array(count), spin: new Float32Array(count), rot: new Float32Array(count * 2), size: new Float32Array(count),
    };
    const r = TX.rng(42);
    for (let i = 0; i < count; i++) {
      const g = i >= nSnow;
      let x, y, z;
      do {
        x = (r() - 0.5) * 1.8; y = r() * 1.5 - 0.5; z = (r() - 0.5) * 1.8;
      } while (x * x + y * y + z * z > 0.85 || y < groundY(x, z) + 0.02);
      F.pos.set([x, y, z], i * 3);
      F.settle[i] = g ? 0.022 + r() * 0.03 : 0.05 + r() * 0.07;
      F.lift[i] = 0.12 + r() * 0.2;
      F.phase[i] = r() * 100;
      F.spin[i] = (r() - 0.5) * 6;
      F.rot[i * 2] = r() * 6.28;
      F.rot[i * 2 + 1] = r() * 6.28;
      F.size[i] = g ? 0.7 + r() * 0.6 : 0.55 + r() * 0.75;
    }
    F.write = (i) => {
      const s = F.size[i];
      const rx = F.rot[i * 2], ry = F.rot[i * 2 + 1];
      const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
      const g = i >= nSnow;
      const arr = g ? glitter.instanceMatrix.array : snow.instanceMatrix.array;
      const o = (g ? i - nSnow : i) * 16;
      arr[o] = cy * s; arr[o + 1] = 0; arr[o + 2] = -sy * s; arr[o + 3] = 0;
      arr[o + 4] = sy * sx * s; arr[o + 5] = cx * s; arr[o + 6] = cy * sx * s; arr[o + 7] = 0;
      arr[o + 8] = sy * cx * s; arr[o + 9] = -sx * s; arr[o + 10] = cy * cx * s; arr[o + 11] = 0;
      arr[o + 12] = F.pos[i * 3]; arr[o + 13] = F.pos[i * 3 + 1]; arr[o + 14] = F.pos[i * 3 + 2]; arr[o + 15] = 1;
    };
    for (let i = 0; i < count; i++) F.write(i);
    F.freeze = () => {
      // a calm, still globe: most snow on the ground, a little hanging in the water
      for (let i = 0; i < count; i++) {
        if (r() < 0.72) {
          const a = r() * 6.28, rr = Math.sqrt(r()) * 0.8;
          const x = Math.sin(a) * rr, z = Math.cos(a) * rr;
          const rs = roofSurface(x, z);
          F.pos.set([x, rs !== null ? rs : groundY(x, z) + 0.006, z], i * 3);
          F.rot[i * 2] = -1.5708;
          F.rest[i] = 1;
          F.restN.set([0, 1, 0], i * 3);
        }
        F.write(i);
      }
      snow.instanceMatrix.needsUpdate = glitter.instanceMatrix.needsUpdate = true;
    };
    F.setCount = (c) => {
      const s = Math.min(nSnow, Math.round(c * (nSnow / count)));
      const g = Math.min(nGlit, c - s);
      snow.count = s;
      glitter.count = g;
    };
    return F;
  }
}

function hipRoof(w, d, h) {
  const hw = w / 2, hd = d / 2, rr = Math.max(0, (w - d) / 2);
  const A = [-hw, 0, -hd], B = [hw, 0, -hd], C = [hw, 0, hd], D = [-hw, 0, hd], E = [-rr, h, 0], F = [rr, h, 0];
  const tris = [D, C, F, D, F, E, B, A, E, B, E, F, A, D, E, C, B, F];
  const pos = new Float32Array(tris.length * 3);
  const uv = new Float32Array(tris.length * 2);
  tris.forEach((p, i) => {
    pos.set(p, i * 3);
    uv.set([(p[0] / w + 0.5) * 2.5, (p[1] / h) * 1.6 + (p[2] / d) * 0.2], i * 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function buildEnvironment(renderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(26, 14, 26), new THREE.MeshBasicMaterial({ color: 0x15100d, side: THREE.BackSide }));
  room.position.y = 5;
  s.add(room);
  const glow = (w, h, color, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 1, 0);
    s.add(m);
    return m;
  };
  // the room's window behind the viewer, up and to the left: it reflects on the glass as four little panes
  const lampWin = glow(5.6, 4.4, 0xffd9b0, 4.2, [-7, 6.8, 8]);
  const mull = new THREE.MeshBasicMaterial({ color: 0x0d0a08 });
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4.6, 0.1), mull);
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.42, 0.1), mull);
  for (const bar of [vBar, hBar]) {
    bar.position.copy(lampWin.position).add(new THREE.Vector3(0, 1, 0).sub(lampWin.position).normalize().multiplyScalar(0.15));
    bar.quaternion.copy(lampWin.quaternion);
    s.add(bar);
  }
  glow(1.6, 4.5, 0xffe6c8, 2.2, [8.5, 3.5, 6]); // a warm doorway on the right
  glow(10, 6.5, 0x6f8cc8, 1.4, [0, 4, -11]); // the window behind
  glow(9, 2.2, 0xffc08a, 1.6, [0, -0.9, 9]); // warm bounce low in front: lights the brass and varnish
  const bar = new THREE.MeshBasicMaterial({ color: 0x0c0a09 });
  for (const x of [-1.9, 1.9]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 7, 0.2), bar);
    m.position.set(x, 4, -10.8);
    s.add(m);
  }
  const t = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.22, 0.2), bar);
  t.position.set(0, 5.2, -10.8);
  s.add(t);
  // warm string lights
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb460).multiplyScalar(5) }));
    b.position.set(-5 + i * 0.77, 6.6 - Math.sin((i / 13) * Math.PI) * 0.8, -10.5);
    s.add(b);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ color: 0x2a1b12 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.5;
  s.add(floor);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.02).texture;
  pm.dispose();
  return tex;
}
