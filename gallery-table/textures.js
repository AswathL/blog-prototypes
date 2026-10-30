// Procedural textures: the walnut table (painted once into a canvas) and small
// tiles for paper grain, kraft fibre and rubber-stamp ink. No image files.

function hash(ix, iy) {
  let h = (Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function vnoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// Walnut: earlywood, latewood and a deep pore colour.
const LIGHT = [132, 86, 54];
const DARK = [50, 29, 17];

/**
 * Paints planked walnut into `canvas`, sized to cssW × cssH CSS pixels.
 * Each board is modelled as a flat cut through a log: the growth-ring radius is
 * the distance from the log's axis, and a slightly tilted cut plane produces the
 * cathedral arches you see on real flat-sawn boards. Fibres, pores, seams and
 * end joints are layered on top.
 */
export function paintWood(canvas, cssW, cssH) {
  const maxPx = 2.6e6;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cssW * cssH * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (cssW * cssH));
  const W = Math.ceil(cssW * dpr);
  const H = Math.ceil(cssH * dpr);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const inv = 1 / dpr;

  const plankH = Math.max(110, Math.min(200, Math.min(cssW, cssH) / 4.2));
  const yOff = plankH * 0.41;
  const nPlanks = Math.ceil((cssH + yOff) / plankH) + 2;
  const boards = [];
  for (let i = 0; i < nPlanks; i++) {
    const joint = hash(i, 5) < 0.72 ? cssW * (0.14 + 0.72 * hash(i, 17)) : -1;
    const mk = (b) => {
      const r = (k) => hash(i * 13 + b * 7 + k, 4242 + k);
      return {
        tone: 0.84 + 0.3 * r(1),
        warm: r(2) - 0.5,
        axis: plankH * (-0.6 + 2.2 * r(3)), // log centre, often outside the board
        z0: 18 + 120 * r(4),
        tilt: (r(5) - 0.5) * 0.12,
        x0: cssW * r(6),
        spacing: 6 + 6 * r(7),
        seed: r(8) * 1000,
      };
    };
    boards.push({ joint, b: [mk(0), mk(1)] });
  }

  let k = 0;
  for (let py = 0; py < H; py++) {
    const y = py * inv + yOff;
    const pi = Math.floor(y / plankH);
    const v = y - pi * plankH;
    const P = boards[pi] || boards[0];
    const seam = Math.min(v, plankH - v);
    for (let px = 0; px < W; px++) {
      const x = px * inv;
      const bd = P.b[P.joint > 0 && x > P.joint ? 1 : 0];
      const so = bd.seed;
      const z = bd.z0 + bd.tilt * (x - bd.x0) + (vnoise(x * 0.0016 + so, 3.1) - 0.5) * 70;
      const dv = v - bd.axis;
      let R = Math.sqrt(dv * dv + z * z);
      R += (vnoise(x * 0.004 + so, v * 0.035) - 0.5) * 9 + (vnoise(x * 0.02 + so, v * 0.18) - 0.5) * 2.2;
      const ring = R / bd.spacing;
      const f = ring - Math.floor(ring);
      const f2 = f * f;
      const late = f2 * f2 * (0.6 + 0.4 * f); // dark latewood just before each ring boundary
      const fib = vnoise(x * 0.05 + so, v * 1.1);
      const fine = vnoise(x * 0.32, v * 3.2 + so);
      const big = vnoise(x * 0.0011 + 40, y * 0.0018);

      const soft = Math.sin(f * Math.PI); // broad early/late wood swell inside each ring
      let m =
        0.3 + late * 0.55 - soft * 0.07 + (fib - 0.5) * 0.36 + (fine - 0.5) * 0.18 + (big - 0.5) * 0.22 + (1 - bd.tone) * 0.9;
      // pores: tiny dark dashes along the grain
      if (vnoise(x * 0.55 + so, v * 5.5) > 0.8) m += 0.14;
      m = m < 0 ? 0 : m > 1 ? 1 : m;

      let r = LIGHT[0] + (DARK[0] - LIGHT[0]) * m;
      let g = LIGHT[1] + (DARK[1] - LIGHT[1]) * m;
      let b = LIGHT[2] + (DARK[2] - LIGHT[2]) * m;
      r *= 1 + bd.warm * 0.1;
      b *= 1 - bd.warm * 0.12;

      let shade = 1;
      if (seam < 1.1) shade = 0.3;
      else if (seam < 2.4) shade = v < plankH / 2 ? 1.1 : 0.74;
      else if (seam < 5) shade = v < plankH / 2 ? 1.03 : 0.94;
      if (P.joint > 0) {
        const dj = Math.abs(x - P.joint);
        if (dj < 0.9) shade *= 0.35;
        else if (dj < 2.2) shade *= x > P.joint ? 1.07 : 0.84;
      }

      data[k++] = r * shade;
      data[k++] = g * shade;
      data[k++] = b * shade;
      data[k++] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { width: cssW, height: cssH };
}

function tile(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return c.toDataURL('image/png');
}

/** Alpha-only paper grain: dark and light specks on transparent. */
export function grainTile(size = 140, strength = 26) {
  return tile(size, (ctx) => {
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const r = Math.random();
      const v = r < 0.5 ? 30 : 255;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = Math.abs(r - 0.5) * 2 * strength * (Math.random() < 0.03 ? 2.6 : 1);
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Kraft paper: warm base, short random fibres and speckle. */
export function kraftTile(size = 220) {
  return tile(size, (ctx) => {
    ctx.fillStyle = '#c29a62';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const a = Math.random() * Math.PI;
      const l = 2 + Math.random() * 9;
      const dark = Math.random() < 0.55;
      ctx.strokeStyle = dark ? `rgba(92,60,28,${0.08 + Math.random() * 0.16})` : `rgba(240,214,170,${0.08 + Math.random() * 0.18})`;
      ctx.lineWidth = 0.5 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Mask for rubber-stamp ink: mostly opaque with blotchy gaps. */
export function inkMask(size = 160) {
  return tile(size, (ctx) => {
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const n = vnoise(x * 0.09, y * 0.09) * 0.6 + vnoise(x * 0.4, y * 0.4) * 0.4;
        const a = n < 0.3 ? 0.15 : n < 0.38 ? 0.6 : 1;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
        img.data[i + 3] = a * (0.75 + Math.random() * 0.25) * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}
