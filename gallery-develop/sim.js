// Development chemistry, simulated on a small grid per print.
//
// Two fields:
//   d  development, 0 (undeveloped mud) .. 1 (final image). Uploaded to the GPU as a texture.
//   c  "reagent". Rubbing deposits it; it seeps outward through a noisy permeability field
//      (so fronts finger and bleed organically), and is used up as it develops the emulsion.
//
// Nothing here touches the DOM.

const GRID = 56;
const SAVE_GRID = 24;

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// Seeded value noise on a lattice, sampled with smooth interpolation.
function makeNoise(seed) {
  const r = rng(seed);
  const P = 64;
  const lat = new Float32Array(P * P);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  const at = (x, y) => lat[((y & (P - 1)) * P) + (x & (P - 1))];
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class PrintState {
  constructor(file, aspect) {
    this.file = file;
    this.aspect = aspect;
    if (aspect >= 1) {
      this.nx = GRID;
      this.ny = Math.max(10, Math.round(GRID / aspect));
    } else {
      this.ny = GRID;
      this.nx = Math.max(10, Math.round(GRID * aspect));
    }
    const n = this.nx * this.ny;
    this.d = new Float32Array(n);
    this.c = new Float32Array(n);
    this.e = new Float32Array(n); // latent activation; the visible image (d) catches up with it
    this.tmp = new Float32Array(n);
    this.perm = new Float32Array(n);
    this.gain = new Float32Array(n);
    this.bytes = new Uint8Array(n);
    this.seed = hashSeed(file);
    this.seedF = (this.seed % 1000) / 37.3;

    const noise = makeNoise(this.seed);
    const noise2 = makeNoise(this.seed ^ 0x9e3779b9);
    const s = 1 / Math.min(this.nx, this.ny);
    for (let y = 0; y < this.ny; y++) {
      for (let x = 0; x < this.nx; x++) {
        const i = y * this.nx + x;
        const fx = x * s;
        const fy = y * s;
        const f = noise(fx * 5, fy * 5) * 0.55 + noise(fx * 11 + 7, fy * 11 + 3) * 0.3 + noise(fx * 23, fy * 23) * 0.15;
        // Channels where the reagent flows easily, and stubborn patches where it barely moves.
        this.perm[i] = 0.12 + 1.45 * smooth(0.28, 0.72, f);
        const g = noise2(fx * 4 + 2, fy * 4 + 5) * 0.6 + noise2(fx * 13, fy * 13) * 0.4;
        this.gain[i] = 0.62 + 0.76 * g;
      }
    }

    this.version = 0;
    this.mean = 0;
    this.ready = false; // caption written, can be opened
    this.developed = false;
    this.finishing = false;
    this.floods = [];
    this.fade = 0; // 0..1 cross-fade straight to the final image (reduced motion, keyboard)
    this.fadeFrom = 0;
    this.fadeStart = 0;
    this.fadeDur = 0;
    this.busy = false;
    this.touched = false;
    this.undev = null;
    this.lastT = null;
    this.acc = 0;
  }

  // Rubbing. u,v are 0..1 inside the image window; strength ~ rubbing speed.
  stamp(u, v, strength, reduced) {
    if (this.developed) return;
    this.undev = null;
    const { nx, ny, c, d, e, gain } = this;
    const r = 0.17 * Math.min(nx, ny);
    const cx = u * nx - 0.5;
    const cy = v * ny - 0.5;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(nx - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(ny - 1, Math.ceil(cy + r));
    const r2 = r * r;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const q = (dx * dx + dy * dy) / r2;
        if (q >= 1) continue;
        const fall = (1 - q) * (1 - q);
        const i = y * nx + x;
        if (reduced) {
          // No bleeding: the rubbed spot simply develops where the finger is.
          d[i] = Math.min(1, d[i] + 0.16 * strength * fall);
          e[i] = d[i];
        } else {
          c[i] = Math.min(1.5, c[i] + 0.42 * strength * fall * (0.7 + 0.3 * gain[i]));
          e[i] = Math.min(1, e[i] + 0.012 * strength * fall);
        }
      }
    }
    this.touched = true;
    this.busy = true;
    this.version++;
  }

  // A little reagent everywhere (the shake joke).
  nudge(amount) {
    if (this.developed) return;
    const { c, gain } = this;
    for (let i = 0; i < c.length; i++) c[i] = Math.min(1.5, c[i] + amount * gain[i] * gain[i]);
    this.busy = true;
  }

  // "Develop all": a wave of reagent rolling in from one edge.
  flood(now, delay, ox, oy) {
    if (this.developed) return;
    const m = Math.max(this.nx, this.ny);
    // Timed in simulation steps, so a stuttering device still gets the whole wave.
    this.floods.push({ elapsed: -delay, ox: (ox * this.nx) / m, oy: (oy * this.ny) / m, dur: 1500 });
    this.busy = true;
  }

  // Soft cross-fade straight to the final image.
  fadeIn(now, dur) {
    if (this.developed) return;
    this.fadeStart = now;
    this.fadeDur = dur;
    this.fade = 0.0001;
    this.busy = true;
  }

  // "Back to the dark": patches of the image sink back into the mud at slightly different times.
  undevelop(now, dur) {
    this.undev = { t0: now, dur, from: Float32Array.from(this.d) };
    this.c.fill(0);
    this.floods = [];
    this.fade = 0;
    this.finishing = false;
    this.ready = false;
    this.developed = false;
    this.busy = true;
  }

  reset() {
    this.undev = null;
    this.d.fill(0);
    this.e.fill(0);
    this.c.fill(0);
    this.floods = [];
    this.fade = 0;
    this.finishing = false;
    this.ready = false;
    this.developed = false;
    this.mean = 0;
    this.touched = false;
    this.busy = false;
    this.version++;
  }

  markDeveloped() {
    this.undev = null;
    this.d.fill(1);
    this.e.fill(1);
    this.c.fill(0);
    this.floods = [];
    this.fade = 0;
    this.finishing = false;
    this.mean = 1;
    this.ready = true;
    this.developed = true;
    this.busy = false;
    this.version++;
  }

  // Advance the chemistry. Returns events: { ready, developed }.
  update(now, reduced) {
    const ev = { ready: false, developed: false };
    if (!this.busy) return ev;
    const { nx, ny, c, d, e, tmp, perm, gain } = this;
    const n = nx * ny;

    if (this.undev) {
      const { t0, dur, from } = this.undev;
      const t = (now - t0) / dur;
      if (t >= 1) {
        this.reset();
        return ev;
      }
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const th = 0.2 + 0.55 * (1.38 - gain[i]) + 0.25 * (perm[i] / 1.57);
        d[i] = from[i] * (1 - smooth(th - 0.35, th, t * 1.1));
        this.e[i] = d[i];
        sum += d[i];
      }
      this.mean = sum / n;
      this.version++;
      return ev;
    }

    if (this.fade > 0) {
      const t = Math.min(1, (now - this.fadeStart) / this.fadeDur);
      this.fade = Math.max(0.0001, t);
      this.version++;
      if (t >= 1) {
        const wasReady = this.ready;
        this.markDeveloped();
        ev.developed = true;
        ev.ready = !wasReady;
      }
      return ev;
    }

    // Fixed time step, so a slow phone develops at the same pace as a fast laptop.
    const STEP = 1000 / 120;
    const dt = this.lastT == null || now - this.lastT > 1500 ? 1000 / 60 : Math.max(0, now - this.lastT);
    this.lastT = now;
    this.acc = Math.min(STEP * 60, (this.acc || 0) + dt);
    let steps = Math.floor(this.acc / STEP);
    this.acc -= steps * STEP;

    let sum = 0;
    let live = false;
    const inv = 1 / Math.max(nx, ny);
    const D = 0.155;
    for (let step = 0; step < steps; step++) {
      // Develop-all waves.
      if (this.floods.length) {
        this.floods = this.floods.filter((f) => {
          f.elapsed += STEP;
          const t = f.elapsed / f.dur;
          if (t < 0) return true;
          const reach = t * 1.6;
          for (let y = 0; y < ny; y++) {
            for (let x = 0; x < nx; x++) {
              const i = y * nx + x;
              const dist = Math.hypot(x * inv - f.ox, y * inv - f.oy) + (gain[i] - 1) * 0.12;
              if (dist < reach) {
                if (reduced) d[i] = e[i] = Math.min(1, d[i] + 0.025);
                else {
                  c[i] = Math.min(1.5, c[i] + 0.012 * perm[i] + 0.003);
                  e[i] = Math.min(1, e[i] + 0.022 * gain[i]);
                }
              }
            }
          }
          return t < 1;
        });
      }

      if (reduced) {
        // Reduced motion: no bleed, just a quiet finish once it's nearly there.
        if (this.mean > 0.85) for (let i = 0; i < n; i++) d[i] = e[i] = Math.min(1, d[i] + 0.02);
        continue;
      }

      for (let y = 0; y < ny; y++) {
        const row = y * nx;
        for (let x = 0; x < nx; x++) {
          const i = row + x;
          const cc = c[i];
          const l = x > 0 ? c[i - 1] : cc;
          const r = x < nx - 1 ? c[i + 1] : cc;
          const u = y > 0 ? c[i - nx] : cc;
          const dn = y < ny - 1 ? c[i + nx] : cc;
          tmp[i] = cc + D * perm[i] * (l + r + u + dn - 4 * cc);
        }
      }
      for (let i = 0; i < n; i++) {
        let cc = tmp[i];
        const ee = e[i];
        const use = 1 - ee;
        // Activation, modulated by a patchy emulsion...
        e[i] = ee + 0.0125 * gain[i] * cc * use;
        // ...and the visible image takes its time to catch up: that delay is the chemistry you watch.
        d[i] += (e[i] - d[i]) * (0.011 + 0.006 * gain[i]);
        // Reagent is used up where it works and slowly evaporates everywhere.
        cc -= cc * (0.0085 + 0.009 * use);
        c[i] = cc < 0.003 ? 0 : cc;
      }

      // Once most of the print has come up, the rest bleeds in from the developed areas.
      if (this.finishing) {
        for (let y = 0; y < ny; y++) {
          for (let x = 0; x < nx; x++) {
            const i = y * nx + x;
            if (d[i] > 0.985) continue;
            const l = x > 0 ? d[i - 1] : d[i];
            const r = x < nx - 1 ? d[i + 1] : d[i];
            const u = y > 0 ? d[i - nx] : d[i];
            const dn = y < ny - 1 ? d[i + nx] : d[i];
            const nb = Math.max(l, r, u, dn);
            c[i] = Math.min(1.5, c[i] + 0.01 * nb * nb * perm[i] + 0.001);
          }
        }
      }
    }
    if (!reduced && this.mean > 0.7) this.finishing = true;

    for (let i = 0; i < n; i++) {
      sum += d[i];
      if (c[i] > 0 || e[i] - d[i] > 0.004) live = true;
    }
    this.mean = sum / n;
    this.version++;

    if (!this.ready && this.mean >= 0.9) {
      this.ready = true;
      ev.ready = true;
    }
    if (this.mean >= 0.985) {
      this.markDeveloped();
      ev.developed = true;
      return ev;
    }
    if (!live && !this.floods.length && !this.finishing && this.fade === 0) {
      if (!(reduced && this.mean > 0.85)) {
        this.busy = false;
        this.lastT = null;
      }
    }
    return ev;
  }

  toBytes() {
    const { d, bytes } = this;
    for (let i = 0; i < d.length; i++) bytes[i] = d[i] >= 1 ? 255 : (d[i] * 255) | 0;
    return bytes;
  }

  serialize() {
    if (this.developed) return 1;
    if (this.mean < 0.01) return null;
    const out = new Uint8Array(SAVE_GRID * SAVE_GRID);
    for (let y = 0; y < SAVE_GRID; y++) {
      for (let x = 0; x < SAVE_GRID; x++) {
        const sx = Math.min(this.nx - 1, Math.floor(((x + 0.5) / SAVE_GRID) * this.nx));
        const sy = Math.min(this.ny - 1, Math.floor(((y + 0.5) / SAVE_GRID) * this.ny));
        out[y * SAVE_GRID + x] = Math.round(this.d[sy * this.nx + sx] * 255);
      }
    }
    let s = '';
    for (let i = 0; i < out.length; i++) s += String.fromCharCode(out[i]);
    return btoa(s);
  }

  restore(data) {
    if (data === 1) {
      this.markDeveloped();
      return;
    }
    if (typeof data !== 'string') return;
    let bin;
    try {
      bin = atob(data);
    } catch {
      return;
    }
    if (bin.length !== SAVE_GRID * SAVE_GRID) return;
    const at = (x, y) => bin.charCodeAt(Math.min(SAVE_GRID - 1, y) * SAVE_GRID + Math.min(SAVE_GRID - 1, x)) / 255;
    let sum = 0;
    for (let y = 0; y < this.ny; y++) {
      for (let x = 0; x < this.nx; x++) {
        const gx = ((x + 0.5) / this.nx) * SAVE_GRID - 0.5;
        const gy = ((y + 0.5) / this.ny) * SAVE_GRID - 0.5;
        const x0 = Math.max(0, Math.floor(gx));
        const y0 = Math.max(0, Math.floor(gy));
        const fx = Math.min(1, Math.max(0, gx - x0));
        const fy = Math.min(1, Math.max(0, gy - y0));
        const v =
          at(x0, y0) * (1 - fx) * (1 - fy) +
          at(x0 + 1, y0) * fx * (1 - fy) +
          at(x0, y0 + 1) * (1 - fx) * fy +
          at(x0 + 1, y0 + 1) * fx * fy;
        this.d[y * this.nx + x] = v;
        this.e[y * this.nx + x] = v;
        sum += v;
      }
    }
    this.mean = sum / (this.nx * this.ny);
    this.touched = this.mean > 0;
    this.ready = this.mean >= 0.9;
    if (this.mean >= 0.7) {
      // It was nearly there when they left; let it finish quietly.
      this.finishing = true;
      this.busy = true;
    }
    this.version++;
  }
}
