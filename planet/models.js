// Procedural toy models for the tiny planet. Everything is built from primitives and merged
// into a few vertex-coloured meshes per object so the draw-call count stays phone-friendly.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const jr = rng(1234);

/**
 * Prepare one primitive for merging: transform it, strip uvs, give it a flat vertex colour
 * (with a tiny per-triangle wobble so surfaces look hand-painted rather than plastic).
 * `color` may be a function (triangleIndex, centroid) => colour for striped parts.
 */
export function part(geo, color, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], jitter = 0.035) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  geo.dispose();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  _e.set(r[0], r[1], r[2]);
  _q.setFromEuler(_e);
  _m.compose(_p.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
  g.applyMatrix4(_m);
  const pos = g.attributes.position;
  const n = pos.count;
  const col = new Float32Array(n * 3);
  const isFn = typeof color === 'function';
  if (!isFn) _c.set(color);
  const cen = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    if (isFn) {
      cen.set(
        (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3,
        (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3,
        (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3,
      );
      _c.set(color(i / 3, cen));
    }
    const j = 1 + (jr() - 0.5) * 2 * jitter;
    for (let k = 0; k < 3; k++) {
      col[(i + k) * 3] = _c.r * j;
      col[(i + k) * 3 + 1] = _c.g * j;
      col[(i + k) * 3 + 2] = _c.b * j;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Same as part() but positioned by an explicit matrix (used for things placed on the sphere). */
export function partM(geo, color, matrix, jitter = 0.035) {
  const g = part(geo, color, [0, 0, 0], [0, 0, 0], [1, 1, 1], jitter);
  g.applyMatrix4(matrix);
  return g;
}

export const merge = (parts) => {
  const g = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return g;
};

/** Plain (uncoloured) quad for window glass etc. */
function pane(w, h, p, ry = 0) {
  const g = new THREE.PlaneGeometry(w, h);
  g.deleteAttribute('uv');
  g.rotateY(ry);
  g.translate(p[0], p[1], p[2]);
  return g;
}

function hipRoofLayer(rb, rt, h, y, z, color, sx, sz) {
  const g = new THREE.CylinderGeometry(rt, rb, h, 4, 1);
  g.rotateY(Math.PI / 4);
  return part(g, color, [0, y, z], [0, 0, 0], [sx, 1, sz], 0.06);
}

export function makeGradientMap() {
  const tones = [96, 150, 205, 255];
  const data = new Uint8Array(tones.length * 4);
  tones.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  const tex = new THREE.DataTexture(data, tones.length, 1);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function radialTexture(stops, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function signTexture(text, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = bg;
  x.fillRect(0, 0, 128, 64);
  x.fillStyle = fg;
  x.font = '700 46px Onest, system-ui, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, 64, 35);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const WOOD = '#5b3a29';
const WOOD_L = '#7d5236';
const WALL = '#f4ede2';
const STONE = '#b9ab97';

/* ------------------------------------------------------------------ */
/* Bulgarian Revival house                                            */
/* ------------------------------------------------------------------ */
export function buildHouse({ upper = '#f6efe3', shutters = '#4f7a5a', bodyMat, doorLightMat }) {
  const parts = [];
  const add = (...a) => parts.push(part(...a));
  // stone plinth (sinks into the ground so it never floats on the curved surface)
  add(new THREE.BoxGeometry(1.12, 0.3, 0.92), STONE, [0, -0.05, 0]);
  // ground floor
  add(new RoundedBoxGeometry(1.0, 0.56, 0.8, 1, 0.03), WALL, [0, 0.38, 0]);
  // floor beam where the upper floor juts out
  add(new THREE.BoxGeometry(1.34, 0.07, 1.08), WOOD, [0, 0.69, 0.11]);
  // the overhanging upper floor
  add(new RoundedBoxGeometry(1.26, 0.5, 1.02, 1, 0.025), upper, [0, 0.975, 0.11]);
  add(new THREE.BoxGeometry(1.32, 0.05, 1.08), WOOD, [0, 1.23, 0.11]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.055, 0.5, 0.055), WOOD, [sx * 0.625, 0.975, 0.11 + sz * 0.505]);
  for (const x of [-0.21, 0.21]) add(new THREE.BoxGeometry(0.035, 0.5, 0.02), WOOD, [x, 0.975, 0.63]);
  add(new THREE.BoxGeometry(1.27, 0.03, 0.02), WOOD, [0, 0.8, 0.63]);
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.02, 0.5, 0.035), WOOD, [sx * 0.633, 0.975, 0.11]);
    add(new THREE.BoxGeometry(0.02, 0.03, 1.03), WOOD, [sx * 0.633, 0.8, 0.11]);
  }
  // diagonal brackets carrying the overhang
  for (const x of [-0.42, 0, 0.42]) add(new THREE.BoxGeometry(0.045, 0.045, 0.3), WOOD, [x, 0.555, 0.5], [-Math.PI / 4, 0, 0]);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.3, 0.045, 0.045), WOOD, [sx * 0.57, 0.555, 0.1], [0, 0, sx * Math.PI / 4]);
  // eaves + stepped tiled hip roof
  add(new THREE.BoxGeometry(1.66, 0.045, 1.4), WOOD, [0, 1.275, 0.11]);
  parts.push(hipRoofLayer(1.0, 0.66, 0.22, 1.4, 0.11, '#c9583d', 1.17, 0.99));
  parts.push(hipRoofLayer(0.76, 0.38, 0.21, 1.585, 0.11, '#bb4c35', 1.17, 0.99));
  parts.push(hipRoofLayer(0.48, 0.05, 0.25, 1.785, 0.11, '#c9583d', 1.17, 0.99));
  add(new THREE.IcosahedronGeometry(0.035, 0), '#8f3a28', [0, 1.92, 0.11]);
  // chimney
  add(new THREE.BoxGeometry(0.13, 0.42, 0.13), WALL, [0.3, 1.71, -0.08]);
  add(new THREE.BoxGeometry(0.19, 0.05, 0.19), '#a8452f', [0.3, 1.94, -0.08]);
  // door frame + step
  add(new THREE.BoxGeometry(0.32, 0.045, 0.035), WOOD, [-0.22, 0.485, 0.41]);
  for (const x of [-0.345, -0.095]) add(new THREE.BoxGeometry(0.035, 0.38, 0.035), WOOD, [x, 0.29, 0.41]);
  add(new THREE.BoxGeometry(0.36, 0.05, 0.14), STONE, [-0.22, 0.11, 0.47]);
  // ground-floor window with open shutters
  add(new THREE.BoxGeometry(0.25, 0.22, 0.02), WOOD, [0.22, 0.42, 0.405]);
  add(new THREE.BoxGeometry(0.29, 0.03, 0.06), STONE, [0.22, 0.3, 0.42]);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.21, 0.015), shutters, [0.22 + sx * 0.185, 0.42, 0.415]);
  // upper front windows: frames, mullions, flower boxes with geraniums
  for (const x of [-0.42, 0, 0.42]) {
    add(new THREE.BoxGeometry(0.2, 0.28, 0.02), WOOD, [x, 0.985, 0.627]);
    add(new THREE.BoxGeometry(0.012, 0.22, 0.01), WOOD, [x, 0.985, 0.645]);
    add(new THREE.BoxGeometry(0.15, 0.012, 0.01), WOOD, [x, 1.0, 0.645]);
    add(new THREE.BoxGeometry(0.21, 0.05, 0.07), WOOD_L, [x, 0.83, 0.67]);
    for (const dx of [-0.065, 0, 0.065]) {
      add(new THREE.IcosahedronGeometry(0.03, 0), dx === 0 ? '#ee6a8c' : '#e2453a', [x + dx, 0.875, 0.67]);
      add(new THREE.IcosahedronGeometry(0.022, 0), '#4f8a46', [x + dx * 0.6, 0.86, 0.695]);
    }
  }
  // side + back window frames
  for (const sx of [-1, 1])
    for (const zz of [-0.11, 0.33]) add(new THREE.BoxGeometry(0.02, 0.27, 0.19), WOOD, [sx * 0.637, 0.985, zz]);
  for (const x of [-0.3, 0.3]) add(new THREE.BoxGeometry(0.19, 0.27, 0.02), WOOD, [x, 0.985, -0.412]);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.02, 0.2, 0.2), WOOD, [sx * 0.505, 0.42, -0.05]);

  const body = new THREE.Mesh(merge(parts), bodyMat);

  // glass (separate so it can light up at night)
  const glass = [
    pane(0.17, 0.15, [0.22, 0.42, 0.417]),
    ...[-0.42, 0, 0.42].map((x) => pane(0.155, 0.225, [x, 0.985, 0.639])),
    ...[-1, 1].flatMap((sx) => [-0.11, 0.33].map((zz) => pane(0.15, 0.225, [sx * 0.649, 0.985, zz], sx * Math.PI / 2))),
    ...[-0.3, 0.3].map((x) => pane(0.15, 0.225, [x, 0.985, -0.424], Math.PI)),
    ...[-1, 1].map((sx) => pane(0.16, 0.15, [sx * 0.517, 0.42, -0.05], sx * Math.PI / 2)),
    pane(0.2, 0.06, [-0.22, 0.455, 0.425]),
  ];
  const windowsMat = new THREE.MeshBasicMaterial({ color: '#3a4766' });
  const windows = new THREE.Mesh(mergeGeometries(glass, false), windowsMat);

  // warm light behind the door (revealed when it opens)
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.34), doorLightMat);
  doorLight.position.set(-0.22, 0.28, 0.403);

  // the door itself, hinged on its left edge
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.33, 0.11, 0.415);
  const doorParts = [
    part(new THREE.BoxGeometry(0.22, 0.34, 0.025), '#70432a', [0.11, 0.17, 0]),
    part(new THREE.BoxGeometry(0.075, 0.12, 0.012), '#8a5636', [0.06, 0.24, 0.016]),
    part(new THREE.BoxGeometry(0.075, 0.12, 0.012), '#8a5636', [0.16, 0.24, 0.016]),
    part(new THREE.BoxGeometry(0.17, 0.1, 0.012), '#8a5636', [0.11, 0.08, 0.016]),
    part(new THREE.IcosahedronGeometry(0.016, 0), '#e8c35a', [0.19, 0.16, 0.025]),
  ];
  const door = new THREE.Mesh(merge(doorParts), bodyMat);
  doorPivot.add(door);

  const group = new THREE.Group();
  group.add(body, windows, doorLight, doorPivot);
  return {
    group,
    windowsMat,
    doorPivot,
    doorLight,
    chimneyTop: new THREE.Vector3(0.3, 2.0, -0.08),
    doorCorners: [
      new THREE.Vector3(-0.33, 0.11, 0.42),
      new THREE.Vector3(-0.11, 0.11, 0.42),
      new THREE.Vector3(-0.33, 0.45, 0.42),
      new THREE.Vector3(-0.11, 0.45, 0.42),
    ],
    anchor: new THREE.Vector3(0, 2.25, 0.1),
    hitCenter: new THREE.Vector3(0, 0.95, 0.1),
    hitRadius: 1.0,
    glowAt: new THREE.Vector3(0, 0.85, 0.85),
  };
}

/* ------------------------------------------------------------------ */
/* Soapbox with megaphone (opinions)                                  */
/* ------------------------------------------------------------------ */
export function buildSoapbox({ bodyMat, accent = '#e0a526' }) {
  const parts = [];
  const add = (...a) => parts.push(part(...a));
  add(new RoundedBoxGeometry(0.74, 0.46, 0.58, 1, 0.025), '#c9965c', [0, 0.15, 0]);
  for (const y of [0.04, 0.27]) add(new THREE.BoxGeometry(0.76, 0.035, 0.6), '#996a3d', [0, y, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.04, 0.46, 0.04), '#a87443', [sx * 0.36, 0.15, sz * 0.28]);
  add(new THREE.BoxGeometry(0.38, 0.15, 0.012), '#f3e6c9', [0, 0.155, 0.296]);
  add(new THREE.BoxGeometry(0.38, 0.035, 0.014), '#d8443a', [0, 0.155, 0.298]);
  // second, smaller crate on top, slightly askew
  add(new RoundedBoxGeometry(0.5, 0.3, 0.42, 1, 0.02), '#d9aa6c', [-0.05, 0.53, -0.03], [0, 0.14, 0]);
  add(new THREE.BoxGeometry(0.52, 0.03, 0.44), '#a8763f', [-0.05, 0.53, -0.03], [0, 0.14, 0]);
  add(new THREE.BoxGeometry(0.2, 0.08, 0.008), accent, [-0.08, 0.53, 0.195], [0, 0.14, 0]);
  // megaphone on a stand
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.52, 6), '#4a4a55', [0.15, 0.93, 0.05]);
  const mega = [
    part(new THREE.CylinderGeometry(0.17, 0.05, 0.34, 18, 1), '#d8443a', [0, 0.17, 0]),
    part(new THREE.TorusGeometry(0.168, 0.02, 6, 22), '#f4ede2', [0, 0.34, 0], [Math.PI / 2, 0, 0]),
    part(new THREE.CylinderGeometry(0.152, 0.152, 0.01, 18), '#5a1f1a', [0, 0.336, 0]),
    part(new THREE.CylinderGeometry(0.036, 0.03, 0.08, 8), '#3a3a44', [0, -0.03, 0]),
    part(new THREE.BoxGeometry(0.03, 0.12, 0.03), '#3a3a44', [0, 0.06, -0.1]),
  ];
  const megaGeo = merge(mega);
  const tilt = (65 * Math.PI) / 180;
  megaGeo.rotateX(tilt);
  megaGeo.translate(0.15, 1.17, 0.05);
  parts.push(megaGeo);
  // pennant pole (opinions get a little flag)
  add(new THREE.CylinderGeometry(0.01, 0.01, 0.75, 5), '#4a4a55', [-0.24, 1.0, -0.14]);
  const flag = new THREE.ConeGeometry(0.09, 0.26, 3);
  add(flag, accent, [-0.1, 1.27, -0.14], [0, 0, -Math.PI / 2], [1, 1, 0.25]);

  const body = new THREE.Mesh(merge(parts), bodyMat);
  const windowsMat = new THREE.MeshBasicMaterial({ color: '#3a4766' });
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1), windowsMat);
  bulb.position.set(-0.24, 1.4, -0.14);

  const axis = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt));
  const mouth = new THREE.Vector3(0.15, 1.17, 0.05).addScaledVector(axis, 0.34);

  // sound rings
  const rings = [];
  const ringGroup = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: '#fff6d8', transparent: true, opacity: 0, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.014, 5, 28), mat);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
    ringGroup.add(ring);
    rings.push(ring);
  }

  const group = new THREE.Group();
  group.add(body, bulb, ringGroup);
  return {
    group,
    windowsMat,
    rings,
    mouth,
    axis,
    anchor: new THREE.Vector3(0, 1.75, 0),
    hitCenter: new THREE.Vector3(0, 0.65, 0),
    hitRadius: 0.95,
    glowAt: new THREE.Vector3(-0.24, 1.4, 0.05),
    megaPivot: body,
  };
}

/* ------------------------------------------------------------------ */
/* Vegetation & scenery                                               */
/* ------------------------------------------------------------------ */
export function coniferGeometry() {
  return merge([
    part(new THREE.CylinderGeometry(0.035, 0.055, 0.26, 5), '#6b4a33', [0, 0.05, 0]),
    part(new THREE.ConeGeometry(0.3, 0.4, 7), '#2f6b4b', [0, 0.33, 0], [0, 0, 0], [1, 1, 1], 0.08),
    part(new THREE.ConeGeometry(0.235, 0.34, 7), '#3a7d55', [0, 0.53, 0], [0, 0.3, 0], [1, 1, 1], 0.08),
    part(new THREE.ConeGeometry(0.16, 0.3, 7), '#4b9160', [0, 0.72, 0], [0, 0.6, 0], [1, 1, 1], 0.08),
  ]);
}

export function roundTreeGeometry() {
  return merge([
    part(new THREE.CylinderGeometry(0.03, 0.045, 0.36, 5), '#8b6a55', [0, 0.1, 0]),
    part(new THREE.IcosahedronGeometry(0.27, 0), '#ffffff', [0, 0.45, 0], [0, 0, 0], [1, 1.12, 1], 0.1),
    part(new THREE.IcosahedronGeometry(0.17, 0), '#f0f0f0', [0.12, 0.6, 0.05], [0.4, 0.2, 0], [1, 1, 1], 0.1),
  ]);
}

export function cloudGeometry(seed) {
  const r = rng(seed);
  const parts = [];
  const blobs = 6 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + r() * 0.6;
    const d = i === 0 ? 0 : 0.35 + r() * 0.45;
    const x = Math.cos(a) * d * 1.3;
    const z = Math.sin(a) * d * 0.75;
    const s = i === 0 ? 0.62 : 0.52 - d * 0.35 + r() * 0.1;
    parts.push(part(new THREE.IcosahedronGeometry(s, 2), i % 3 ? '#ffffff' : '#fdf7ef', [x, s * 0.25 + r() * 0.05, z], [0, 0, 0], [1, 0.62, 1], 0));
  }
  return merge(parts);
}

export function mountainsGeometry(placements) {
  // placements: [{ matrix, scale }]
  const parts = [];
  for (const { matrix, h } of placements) {
    const m = matrix;
    parts.push(partM(new THREE.ConeGeometry(1, 1, 7), '#8f8bab', new THREE.Matrix4().makeScale(0.9 * h, h * 1.6, 0.9 * h).premultiply(new THREE.Matrix4().makeTranslation(0, h * 0.7, 0)).premultiply(m), 0.07));
    parts.push(partM(new THREE.ConeGeometry(1, 1, 7), '#fbf8f4', new THREE.Matrix4().makeScale(0.42 * h, h * 0.75, 0.42 * h).premultiply(new THREE.Matrix4().makeTranslation(0, h * 1.13, 0)).premultiply(m), 0.03));
  }
  return merge(parts);
}

export function rockSpiresGeometry(placements) {
  const parts = [];
  for (const { matrix, h, tint } of placements) {
    parts.push(partM(new THREE.CylinderGeometry(0.16 * h, 0.3 * h, h, 6), tint, new THREE.Matrix4().makeTranslation(0, h / 2 - 0.05, 0).premultiply(matrix), 0.08));
    parts.push(partM(new THREE.IcosahedronGeometry(0.2 * h, 0), tint, new THREE.Matrix4().makeTranslation(0, h - 0.02, 0).premultiply(matrix), 0.08));
  }
  return merge(parts);
}

/* ------------------------------------------------------------------ */
/* Tram                                                               */
/* ------------------------------------------------------------------ */
export function buildTramCar({ lead, bodyMat }) {
  const parts = [];
  const add = (...a) => parts.push(part(...a));
  for (const x of [-0.3, 0.3]) add(new THREE.BoxGeometry(0.22, 0.09, 0.27), '#2c2c33', [x, 0.05, 0]);
  add(new RoundedBoxGeometry(0.96, 0.2, 0.34, 1, 0.04), '#2f8a4a', [0, 0.2, 0]);
  add(new THREE.BoxGeometry(0.965, 0.045, 0.346), '#f3e7c4', [0, 0.315, 0]);
  add(new RoundedBoxGeometry(0.94, 0.17, 0.33, 1, 0.045), '#43a05c', [0, 0.42, 0]);
  add(new RoundedBoxGeometry(0.86, 0.06, 0.29, 1, 0.025), '#dcd8cf', [0, 0.53, 0]);
  for (let k = 0; k < 6; k++) {
    const x = -0.45 + k * 0.18;
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.03, 0.12, 0.01), '#2f8a4a', [x, 0.425, sz * 0.168]);
  }
  if (lead) {
    add(new THREE.BoxGeometry(0.16, 0.025, 0.12), '#3a3a44', [0, 0.57, 0]);
    add(new THREE.BoxGeometry(0.012, 0.2, 0.012), '#3a3a44', [-0.04, 0.66, 0], [0, 0, 0.55]);
    add(new THREE.BoxGeometry(0.012, 0.2, 0.012), '#3a3a44', [0.04, 0.66, 0], [0, 0, -0.55]);
    add(new THREE.BoxGeometry(0.03, 0.015, 0.3), '#3a3a44', [0, 0.75, 0]);
  }
  const body = new THREE.Mesh(merge(parts), bodyMat);
  const glass = [];
  for (let k = 0; k < 5; k++) {
    const x = -0.36 + k * 0.18;
    glass.push(pane(0.14, 0.11, [x, 0.425, 0.172]));
    glass.push(pane(0.14, 0.11, [x, 0.425, -0.172], Math.PI));
  }
  glass.push(pane(0.26, 0.11, [0.472, 0.425, 0], Math.PI / 2));
  glass.push(pane(0.26, 0.11, [-0.472, 0.425, 0], -Math.PI / 2));
  if (lead) {
    glass.push(pane(0.05, 0.05, [0.482, 0.22, 0.1], Math.PI / 2));
    glass.push(pane(0.05, 0.05, [0.482, 0.22, -0.1], Math.PI / 2));
  }
  const windowsMat = new THREE.MeshBasicMaterial({ color: '#3a4766' });
  const windows = new THREE.Mesh(mergeGeometries(glass, false), windowsMat);
  const group = new THREE.Group();
  group.add(body, windows);
  if (lead) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.07), new THREE.MeshBasicMaterial({ map: signTexture('23', '#1d1d24', '#ffcf5a') }));
    sign.position.set(0.474, 0.515, 0);
    sign.rotation.y = Math.PI / 2;
    group.add(sign);
  }
  return { group, windowsMat };
}

/* ------------------------------------------------------------------ */
/* Stork                                                              */
/* ------------------------------------------------------------------ */
export function buildStork(mat) {
  const W = '#fbf8f2';
  const B = '#24212b';
  const O = '#e2552b';
  const body = merge([
    part(new THREE.IcosahedronGeometry(0.2, 1), W, [0, 0, 0], [0, 0, 0], [1.7, 0.85, 0.85], 0.02),
    part(new THREE.ConeGeometry(0.11, 0.26, 6), W, [-0.4, 0.01, 0], [0, 0, Math.PI / 2], [1, 1, 0.6], 0.02),
    part(new THREE.ConeGeometry(0.07, 0.1, 6), B, [-0.55, 0.01, 0], [0, 0, Math.PI / 2], [1, 1, 0.6], 0.02),
    part(new THREE.CylinderGeometry(0.035, 0.055, 0.3, 6), W, [0.4, 0.08, 0], [0, 0, -1.25], [1, 1, 1], 0.02),
    part(new THREE.IcosahedronGeometry(0.075, 1), W, [0.56, 0.13, 0], [0, 0, 0], [1.2, 1, 1], 0.02),
    part(new THREE.ConeGeometry(0.026, 0.3, 6), O, [0.76, 0.1, 0], [0, 0, -Math.PI / 2 - 0.12], [1, 1, 1], 0.02),
    part(new THREE.IcosahedronGeometry(0.014, 0), B, [0.6, 0.16, 0.055]),
    part(new THREE.IcosahedronGeometry(0.014, 0), B, [0.6, 0.16, -0.055]),
    part(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 4), O, [-0.48, -0.08, 0.045], [0, 0, Math.PI / 2 + 0.12]),
    part(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 4), O, [-0.48, -0.08, -0.045], [0, 0, Math.PI / 2 + 0.12]),
  ]);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(body, mat));
  const wing = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.05, 0.06, side * 0.1);
    const inner = merge([
      part(new THREE.BoxGeometry(0.34, 0.025, 0.4), W, [0, 0, side * 0.2], [0, 0, 0], [1, 1, 1], 0.02),
      part(new THREE.BoxGeometry(0.1, 0.027, 0.4), B, [-0.13, 0, side * 0.2], [0, 0, 0], [1, 1, 1], 0.02),
    ]);
    pivot.add(new THREE.Mesh(inner, mat));
    const outerPivot = new THREE.Group();
    outerPivot.position.set(0, 0, side * 0.4);
    const outer = merge([
      part(new THREE.BoxGeometry(0.3, 0.022, 0.38), B, [-0.02, 0, side * 0.19], [0, side * 0.12, 0], [1, 1, 1], 0.02),
      part(new THREE.BoxGeometry(0.06, 0.02, 0.18), B, [-0.12, 0, side * 0.42], [0, side * 0.3, 0], [1, 1, 1], 0.02),
      part(new THREE.BoxGeometry(0.06, 0.02, 0.16), B, [-0.03, 0, side * 0.43], [0, side * 0.1, 0], [1, 1, 1], 0.02),
    ]);
    outerPivot.add(new THREE.Mesh(outer, mat));
    pivot.add(outerPivot);
    group.add(pivot);
    return { pivot, outerPivot };
  };
  return { group, left: wing(1), right: wing(-1) };
}

/* ------------------------------------------------------------------ */
/* Moon                                                               */
/* ------------------------------------------------------------------ */
export function moonGeometry(radius, seed, mergeVertices) {
  const r = rng(seed);
  let g = new THREE.IcosahedronGeometry(1, 6);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g);
  const craters = [];
  for (let i = 0; i < 14; i++) {
    const d = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
    craters.push({ d, size: 0.12 + r() * 0.26 });
  }
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const base = new THREE.Color('#f1e3bd');
  const dark = new THREE.Color('#c4ad7f');
  const rim = new THREE.Color('#fffaf0');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let h = 0;
    c.copy(base);
    for (const k of craters) {
      const a = v.angleTo(k.d);
      const t = a / k.size;
      if (t < 1) {
        h -= 0.08 * (1 - t * t);
        c.lerp(dark, 0.9 * Math.sqrt(1 - t * t));
      } else if (t < 1.35) {
        const u = 1 - Math.abs(t - 1.15) / 0.2;
        if (u > 0) {
          h += 0.025 * u;
          c.lerp(rim, 0.5 * u);
        }
      }
    }
    v.multiplyScalar(radius * (1 + h));
    pos.setXYZ(i, v.x, v.y, v.z);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/* Little story details                                               */
/* ------------------------------------------------------------------ */
export function buildCat(mat) {
  const W = '#fbf6ee';
  const O = '#e08a3c';
  const B = '#2a2430';
  const g = merge([
    part(new THREE.IcosahedronGeometry(0.1, 1), W, [0, 0.08, 0], [0, 0, 0], [1, 0.85, 1.35], 0.02),
    part(new THREE.IcosahedronGeometry(0.06, 1), O, [0.04, 0.12, -0.05], [0, 0, 0], [1, 0.7, 1.3], 0.02),
    part(new THREE.IcosahedronGeometry(0.075, 1), W, [0, 0.2, 0.1], [0, 0, 0], [1, 0.95, 0.95], 0.02),
    part(new THREE.IcosahedronGeometry(0.04, 1), B, [-0.035, 0.24, 0.1], [0, 0, 0], [1, 0.8, 1], 0.02),
    part(new THREE.ConeGeometry(0.028, 0.06, 4), O, [0.04, 0.29, 0.1], [0, 0, -0.2]),
    part(new THREE.ConeGeometry(0.028, 0.06, 4), B, [-0.04, 0.29, 0.1], [0, 0, 0.2]),
    part(new THREE.IcosahedronGeometry(0.01, 0), '#3f8a3a', [0.03, 0.21, 0.17]),
    part(new THREE.IcosahedronGeometry(0.01, 0), '#3f8a3a', [-0.03, 0.21, 0.17]),
  ]);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(g, mat));
  const tail = new THREE.Group();
  tail.position.set(0, 0.08, -0.13);
  tail.add(new THREE.Mesh(merge([part(new THREE.CylinderGeometry(0.016, 0.02, 0.2, 5), B, [0, 0.1, 0], [0.35, 0, 0])]), mat));
  group.add(tail);
  return { group, tail };
}

export function buildRocket(mat, windowsMat) {
  const R = '#d8443a';
  const W = '#f6f1e7';
  const g = merge([
    part(new THREE.CylinderGeometry(0.11, 0.12, 0.5, 10), W, [0, 0.33, 0]),
    part(new THREE.ConeGeometry(0.11, 0.24, 10), R, [0, 0.7, 0]),
    part(new THREE.CylinderGeometry(0.125, 0.125, 0.04, 10), R, [0, 0.12, 0]),
    ...[0, 1, 2].map((k) => part(new THREE.BoxGeometry(0.02, 0.18, 0.14), R, [Math.sin((k * Math.PI * 2) / 3) * 0.13, 0.13, Math.cos((k * Math.PI * 2) / 3) * 0.13], [0, (k * Math.PI * 2) / 3, 0])),
    part(new THREE.TorusGeometry(0.05, 0.012, 5, 14), '#9a9aa8', [0, 0.42, 0.105]),
    part(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 8), '#4a4a55', [0, 0.06, 0]),
  ]);
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.add(new THREE.Mesh(g, mat));
  const port = new THREE.Mesh(new THREE.CircleGeometry(0.042, 12), windowsMat);
  port.position.set(0, 0.42, 0.113);
  body.add(port);
  group.add(body);
  return { group, body };
}

export function buildKuker(mat) {
  const F = '#4a3426';
  const F2 = '#5e4331';
  const g = merge([
    part(new THREE.ConeGeometry(0.22, 0.34, 8), F, [0, 0.17, 0], [0, 0, 0], [1, 1, 1], 0.12),
    part(new THREE.ConeGeometry(0.19, 0.3, 8), F2, [0, 0.33, 0], [0, 0.4, 0], [1, 1, 1], 0.12),
    part(new THREE.ConeGeometry(0.15, 0.26, 8), F, [0, 0.47, 0], [0, 0.8, 0], [1, 1, 1], 0.12),
    part(new RoundedBoxGeometry(0.16, 0.16, 0.06, 1, 0.02), '#d8443a', [0, 0.62, 0.08]),
    part(new THREE.IcosahedronGeometry(0.02, 0), '#fff2c2', [-0.035, 0.64, 0.115]),
    part(new THREE.IcosahedronGeometry(0.02, 0), '#fff2c2', [0.035, 0.64, 0.115]),
    part(new THREE.BoxGeometry(0.08, 0.02, 0.01), '#fff2c2', [0, 0.585, 0.115]),
    part(new THREE.ConeGeometry(0.025, 0.2, 5), '#efe3c4', [-0.09, 0.74, 0.06], [0, 0, 0.5]),
    part(new THREE.ConeGeometry(0.025, 0.2, 5), '#efe3c4', [0.09, 0.74, 0.06], [0, 0, -0.5]),
    part(new THREE.IcosahedronGeometry(0.05, 1), '#e7b84a', [-0.12, 0.26, 0.13]),
    part(new THREE.IcosahedronGeometry(0.05, 1), '#e7b84a', [0.12, 0.26, 0.13]),
    part(new THREE.IcosahedronGeometry(0.04, 1), '#e7b84a', [0, 0.22, 0.19]),
    ...[0, 1, 2, 3, 4].map((k) => part(new THREE.BoxGeometry(0.03, 0.03, 0.03), ['#e2453a', '#f4ede2', '#3f86c6', '#f2c14e', '#4f8a46'][k], [Math.sin(k) * 0.13, 0.5 + (k % 2) * 0.04, Math.cos(k) * 0.13])),
  ]);
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.add(new THREE.Mesh(g, mat));
  group.add(body);
  return { group, body };
}

export function buildBlossomTree(mat) {
  return new THREE.Mesh(
    merge([
      part(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6), '#7a5640', [0, 0.25, 0]),
      part(new THREE.CylinderGeometry(0.025, 0.04, 0.3, 5), '#7a5640', [0.12, 0.55, 0], [0, 0, -0.6]),
      part(new THREE.IcosahedronGeometry(0.36, 1), '#f7d4dc', [0, 0.78, 0], [0, 0, 0], [1, 0.85, 1], 0.06),
      part(new THREE.IcosahedronGeometry(0.24, 1), '#fbe6ea', [0.26, 0.72, 0.08], [0, 0, 0], [1, 0.9, 1], 0.06),
      part(new THREE.IcosahedronGeometry(0.22, 1), '#f3c2cf', [-0.24, 0.7, -0.05], [0, 0, 0], [1, 0.9, 1], 0.06),
    ]),
    mat,
  );
}

/** Red-and-white martenitsa threads; hidden until a stork has been spotted. */
export function buildMartenitsas(mat) {
  const group = new THREE.Group();
  const spots = [
    [0.22, 0.6, 0.22], [-0.2, 0.58, 0.24], [0.33, 0.62, -0.08], [-0.3, 0.6, -0.12], [0.02, 0.56, 0.32],
    [0.1, 0.6, -0.3], [-0.08, 0.57, -0.28], [0.4, 0.6, 0.12],
  ];
  const items = spots.map(([x, y, z], i) => {
    const g = merge([
      part(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), '#e2453a', [-0.012, -0.08, 0], [0, 0, 0.1], [1, 1, 1], 0),
      part(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), '#ffffff', [0.012, -0.08, 0], [0, 0, -0.1], [1, 1, 1], 0),
      part(new THREE.IcosahedronGeometry(0.026, 0), '#e2453a', [-0.03, -0.17, 0], [0, 0, 0], [1, 1, 1], 0),
      part(new THREE.IcosahedronGeometry(0.026, 0), '#ffffff', [0.03, -0.17, 0], [0, 0, 0], [1, 1, 1], 0),
    ]);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    m.rotation.y = i * 1.3;
    m.scale.setScalar(0.001);
    group.add(m);
    return m;
  });
  return { group, items };
}

export function buildNest(mat) {
  return new THREE.Mesh(
    merge([
      part(new THREE.CylinderGeometry(0.03, 0.04, 1.3, 6), '#6b5a4c', [0, 0.65, 0]),
      part(new THREE.CylinderGeometry(0.2, 0.15, 0.1, 9), '#8a6a45', [0, 1.33, 0], [0, 0, 0], [1, 1, 1], 0.15),
      part(new THREE.TorusGeometry(0.17, 0.05, 5, 12), '#9b7a52', [0, 1.38, 0], [Math.PI / 2, 0, 0], [1, 1, 1], 0.15),
    ]),
    mat,
  );
}

export function buildTramStop(mat) {
  return new THREE.Mesh(
    merge([
      part(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 6), '#4a4a55', [0, 0.42, 0]),
      part(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 14), '#f2c14e', [0, 0.86, 0], [Math.PI / 2, 0, 0]),
      part(new THREE.BoxGeometry(0.1, 0.035, 0.03), '#2f8a4a', [0, 0.86, 0.015]),
      part(new THREE.BoxGeometry(0.5, 0.04, 0.16), '#c9965c', [0.38, 0.2, 0.05]),
      part(new THREE.BoxGeometry(0.5, 0.14, 0.03), '#c9965c', [0.38, 0.3, -0.03]),
      part(new THREE.BoxGeometry(0.03, 0.2, 0.12), '#4a4a55', [0.17, 0.1, 0.05]),
      part(new THREE.BoxGeometry(0.03, 0.2, 0.12), '#4a4a55', [0.59, 0.1, 0.05]),
    ]),
    mat,
  );
}

export function buildUmbrella(mat) {
  const cone = new THREE.ConeGeometry(0.42, 0.18, 10, 1, true);
  return new THREE.Mesh(
    merge([
      part(new THREE.CylinderGeometry(0.014, 0.014, 0.85, 5), '#efe6d6', [0, 0.42, 0], [0.12, 0, 0]),
      part(cone, (i, c) => (Math.floor(((Math.atan2(c.z, c.x) + Math.PI) / (Math.PI * 2)) * 10) % 2 ? '#e2453a' : '#fbf6ee'), [0, 0.86, 0.05], [0.12, 0, 0], [1, 1, 1], 0.02),
      part(new THREE.BoxGeometry(0.42, 0.03, 0.2), '#f2c14e', [0.42, 0.06, 0.2], [0, 0.4, 0]),
    ]),
    mat,
  );
}

export function buildBoat(mat) {
  const sail = new THREE.ConeGeometry(0.2, 0.42, 3);
  return new THREE.Mesh(
    merge([
      part(new RoundedBoxGeometry(0.42, 0.1, 0.16, 1, 0.04), '#f6efe3', [0, 0.03, 0]),
      part(new THREE.BoxGeometry(0.43, 0.025, 0.165), '#3f86c6', [0, 0.07, 0]),
      part(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), '#6b4a33', [0, 0.32, 0]),
      part(sail, '#fffaf0', [0.1, 0.31, 0], [0, Math.PI / 2, 0], [0.15, 1, 1], 0.02),
      part(new THREE.ConeGeometry(0.03, 0.07, 3), '#e2453a', [0, 0.6, 0.02], [0, 0, -Math.PI / 2], [1, 1, 0.3], 0),
    ]),
    mat,
  );
}

export function buildCobbles(mat) {
  const r = rng(77);
  const parts = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    parts.push(part(new THREE.CylinderGeometry(0.07 + r() * 0.03, 0.08 + r() * 0.03, 0.05, 6), i % 2 ? '#c9bba6' : '#b3a590', [Math.sin(t * 3) * 0.12 + (r() - 0.5) * 0.06, 0.0, t * 0.9], [0, r() * 3, 0], [1, 1, 1], 0.08));
  }
  return new THREE.Mesh(merge(parts), mat);
}

/* ------------------------------------------------------------------ */
/* Countryside features                                               */
/* ------------------------------------------------------------------ */
export function sunflowerGeometry() {
  const tilt = Math.PI / 2 - 0.35;
  return merge([
    part(new THREE.CylinderGeometry(0.012, 0.018, 0.46, 4), '#4f8a3a', [0, 0.23, 0], [0, 0, 0], [1, 1, 1], 0),
    part(new THREE.BoxGeometry(0.13, 0.012, 0.06), '#5f9a46', [0.055, 0.22, 0], [0, 0.3, 0.55]),
    part(new THREE.BoxGeometry(0.11, 0.012, 0.05), '#5f9a46', [-0.05, 0.3, 0], [0, -0.3, -0.55]),
    part(new THREE.CylinderGeometry(0.1, 0.1, 0.022, 12), (i) => (i % 2 ? '#f7c51e' : '#f39b1a'), [0, 0.48, 0.02], [tilt, 0, 0], [1, 1, 1], 0.02),
    part(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 9), '#6b3e1e', [0, 0.486, 0.038], [tilt, 0, 0], [1, 1, 1], 0.04),
  ]);
}

export function soilBedGeometry(w, d, rows) {
  const parts = [part(new RoundedBoxGeometry(w, 0.1, d, 1, 0.04), '#8a5a3c', [0, -0.02, 0], [0, 0, 0], [1, 1, 1], 0.05)];
  for (let i = 0; i < rows; i++) {
    const z = -d / 2 + ((i + 0.5) / rows) * d;
    parts.push(part(new THREE.BoxGeometry(w - 0.12, 0.03, 0.07), '#6c432c', [0, 0.035, z], [0, 0, 0], [1, 1, 1], 0.05));
  }
  return merge(parts);
}

export function sheepGeometry() {
  const W = '#f8f4ec';
  const D = '#3a3340';
  return merge([
    part(new THREE.IcosahedronGeometry(0.15, 1), W, [0, 0.21, 0], [0, 0, 0], [1.35, 1, 1.05], 0.07),
    part(new THREE.IcosahedronGeometry(0.1, 1), W, [-0.08, 0.3, 0.02], [0, 0, 0], [1, 1, 1], 0.07),
    part(new THREE.IcosahedronGeometry(0.09, 1), W, [0.07, 0.29, -0.03], [0, 0, 0], [1, 1, 1], 0.07),
    part(new THREE.IcosahedronGeometry(0.075, 1), D, [0.2, 0.25, 0], [0, 0, 0], [1.25, 1, 0.9], 0.03),
    part(new THREE.BoxGeometry(0.06, 0.02, 0.03), D, [0.19, 0.3, 0.07], [0.5, 0, 0]),
    part(new THREE.BoxGeometry(0.06, 0.02, 0.03), D, [0.19, 0.3, -0.07], [-0.5, 0, 0]),
    ...[
      [0.1, 0.07],
      [0.1, -0.07],
      [-0.1, 0.07],
      [-0.1, -0.07],
    ].map(([x, z]) => part(new THREE.BoxGeometry(0.035, 0.13, 0.035), D, [x, 0.065, z])),
  ]);
}

export function roseBushGeometry() {
  return merge([
    part(new THREE.IcosahedronGeometry(0.11, 0), '#3f7d4a', [0, 0.09, 0], [0, 0, 0], [1.2, 0.85, 1], 0.1),
    part(new THREE.IcosahedronGeometry(0.035, 0), '#ee6a8c', [0.05, 0.17, 0.04]),
    part(new THREE.IcosahedronGeometry(0.035, 0), '#f48fb1', [-0.06, 0.15, -0.02]),
    part(new THREE.IcosahedronGeometry(0.03, 0), '#e2453a', [0.0, 0.16, -0.07]),
    part(new THREE.IcosahedronGeometry(0.03, 0), '#ee6a8c', [-0.02, 0.17, 0.08]),
  ]);
}

export function hayGeometry(spots) {
  const parts = [];
  for (const [x, z, s] of spots) {
    parts.push(part(new THREE.CylinderGeometry(0.12 * s, 0.24 * s, 0.32 * s, 9), '#e2b24a', [x, 0.14 * s, z], [0, 0, 0], [1, 1, 1], 0.12));
    parts.push(part(new THREE.IcosahedronGeometry(0.13 * s, 1), '#ecc05a', [x, 0.31 * s, z], [0, 0, 0], [1, 0.75, 1], 0.12));
    parts.push(part(new THREE.CylinderGeometry(0.245 * s, 0.245 * s, 0.025, 9), '#b9862f', [x, 0.07 * s, z], [0, 0, 0], [1, 1, 1], 0.05));
  }
  return merge(parts);
}

export function buildChurch(mat, windowsMat) {
  const WH = '#f4ede2';
  const GOLD = '#e9b949';
  const GREEN = '#5fa38a';
  const dome = (r) => new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const g = merge([
    part(new THREE.BoxGeometry(1.02, 0.18, 1.22), '#c9bba6', [0, -0.02, 0]),
    part(new RoundedBoxGeometry(0.86, 0.46, 1.06, 1, 0.02), WH, [0, 0.27, 0]),
    part(new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12), WH, [0.43, 0.24, -0.05]),
    part(new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12), WH, [-0.43, 0.24, -0.05]),
    part(dome(0.245), GREEN, [0.43, 0.44, -0.05], [0, 0, 0], [1, 1, 1], 0.03),
    part(dome(0.245), GREEN, [-0.43, 0.44, -0.05], [0, 0, 0], [1, 1, 1], 0.03),
    part(new THREE.BoxGeometry(0.9, 0.05, 1.1), '#d9c7a3', [0, 0.52, 0]),
    part(new THREE.CylinderGeometry(0.25, 0.27, 0.3, 12), WH, [0, 0.69, -0.05]),
    part(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 12), '#d9c7a3', [0, 0.85, -0.05]),
    part(dome(0.27), GOLD, [0, 0.86, -0.05], [0, 0, 0], [1, 1.15, 1], 0.03),
    part(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4), GOLD, [0, 1.25, -0.05]),
    part(new THREE.BoxGeometry(0.1, 0.012, 0.012), GOLD, [0, 1.28, -0.05]),
    part(new THREE.BoxGeometry(0.26, 0.8, 0.26), WH, [0, 0.42, 0.62]),
    part(new THREE.BoxGeometry(0.29, 0.04, 0.29), '#d9c7a3', [0, 0.84, 0.62]),
    part(dome(0.13), GOLD, [0, 0.86, 0.62], [0, 0, 0], [1, 1.3, 1], 0.03),
    part(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), GOLD, [0, 1.06, 0.62]),
    part(new THREE.BoxGeometry(0.12, 0.2, 0.02), '#70432a', [0, 0.1, 0.755]),
    part(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 10, 1, false, 0, Math.PI), '#70432a', [0, 0.2, 0.755], [Math.PI / 2, 0, Math.PI / 2]),
  ]);
  const glass = [];
  const pane = (w, h, p, ry) => {
    const q = new THREE.PlaneGeometry(w, h);
    q.deleteAttribute('uv');
    q.rotateY(ry);
    q.translate(...p);
    return q;
  };
  for (const z of [-0.3, 0, 0.3]) {
    glass.push(pane(0.08, 0.16, [0.432, 0.3, z], Math.PI / 2));
    glass.push(pane(0.08, 0.16, [-0.432, 0.3, z], -Math.PI / 2));
  }
  glass.push(pane(0.07, 0.14, [0, 0.62, 0.752], 0));
  for (const a of [0, 1, 2, 3]) {
    const ang = (a / 4) * Math.PI * 2 + Math.PI / 4;
    glass.push(pane(0.07, 0.12, [Math.sin(ang) * 0.262, 0.7, Math.cos(ang) * 0.262 - 0.05], ang));
  }
  const group = new THREE.Group();
  group.add(new THREE.Mesh(g, mat), new THREE.Mesh(mergeGeometries(glass, false), windowsMat));
  return group;
}

export function grassTuftGeometry() {
  return merge([
    part(new THREE.ConeGeometry(0.035, 0.2, 4), '#8fc463', [0, 0.08, 0], [0, 0, 0.2], [1, 1, 1], 0.1),
    part(new THREE.ConeGeometry(0.03, 0.16, 4), '#7cb257', [0.04, 0.06, 0.02], [0.2, 0, -0.35], [1, 1, 1], 0.1),
    part(new THREE.ConeGeometry(0.03, 0.15, 4), '#a3cf6c', [-0.04, 0.06, -0.01], [-0.2, 0, 0.4], [1, 1, 1], 0.1),
  ]);
}
