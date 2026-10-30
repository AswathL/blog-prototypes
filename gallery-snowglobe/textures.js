// Procedural canvas textures: wood, brass plates, prints, the night window behind the globe.
import * as THREE from 'three';

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

export function toTexture(c, { srgb = true, repeat = false, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}

/* ---------- wood ---------- */
export function woodCanvas({ w = 1024, h = 512, base = '#5a321c', dark = '#2e170b', light = '#86532f', seed = 7, along = 'y' } = {}) {
  const [c, x] = make(w, h);
  const r = rng(seed);
  x.fillStyle = base;
  x.fillRect(0, 0, w, h);
  const vertical = along === 'y';
  const len = vertical ? h : w;
  const span = vertical ? w : h;
  // broad growth bands
  for (let i = 0; i < 26; i++) {
    const p = r() * span;
    const width = 10 + r() * 60;
    const g = vertical ? x.createLinearGradient(p - width, 0, p + width, 0) : x.createLinearGradient(0, p - width, 0, p + width);
    const col = r() > 0.5 ? dark : light;
    g.addColorStop(0, 'transparent');
    g.addColorStop(0.5, col);
    g.addColorStop(1, 'transparent');
    x.globalAlpha = 0.12 + r() * 0.18;
    x.fillStyle = g;
    if (vertical) x.fillRect(p - width, 0, width * 2, h);
    else x.fillRect(0, p - width, w, width * 2);
  }
  // fibres with a gentle wobble
  for (let i = 0; i < 900; i++) {
    const p = r() * span;
    const amp = 2 + r() * 10;
    const freq = (1 + r() * 3) * Math.PI * 2 / len;
    const ph = r() * 6.28;
    x.globalAlpha = 0.04 + r() * 0.16;
    x.strokeStyle = r() > 0.4 ? dark : light;
    x.lineWidth = 0.6 + r() * 1.8;
    x.beginPath();
    for (let s = 0; s <= len; s += 16) {
      const o = p + Math.sin(s * freq + ph) * amp;
      if (vertical) s === 0 ? x.moveTo(o, s) : x.lineTo(o, s);
      else s === 0 ? x.moveTo(s, o) : x.lineTo(s, o);
    }
    x.stroke();
  }
  // pores
  x.globalAlpha = 0.25;
  x.fillStyle = dark;
  for (let i = 0; i < 2600; i++) {
    const a = r() * w, b = r() * h;
    if (vertical) x.fillRect(a, b, 1, 2 + r() * 5);
    else x.fillRect(a, b, 2 + r() * 5, 1);
  }
  x.globalAlpha = 1;
  return c;
}

/* ---------- brass name plate ---------- */
function snowflakeGlyph(x, cx, cy, s) {
  x.save();
  x.translate(cx, cy);
  for (let i = 0; i < 6; i++) {
    x.rotate(Math.PI / 3);
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(0, -s);
    x.moveTo(0, -s * 0.55);
    x.lineTo(-s * 0.22, -s * 0.78);
    x.moveTo(0, -s * 0.55);
    x.lineTo(s * 0.22, -s * 0.78);
    x.stroke();
  }
  x.restore();
}

function plateLayout(x, w, h, text, mode) {
  // mode: 'shadow' | 'light' | 'bump'
  const inset = 16;
  x.lineWidth = mode === 'bump' ? 4 : 2.2;
  x.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  x.lineWidth = mode === 'bump' ? 2.5 : 1.2;
  x.strokeRect(inset + 7, inset + 7, w - (inset + 7) * 2, h - (inset + 7) * 2);
  x.font = `700 ${Math.round(h * 0.5)}px "Cormorant SC", "Cormorant", Georgia, serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, w / 2, h * 0.53);
  const tw = x.measureText(text).width;
  x.lineWidth = mode === 'bump' ? 4 : 2.4;
  snowflakeGlyph(x, w / 2 - tw / 2 - 58, h / 2, h * 0.15);
  snowflakeGlyph(x, w / 2 + tw / 2 + 58, h / 2, h * 0.15);
}

export function plateCanvases(text, seed = 11) {
  const w = 1024, h = 168;
  const [c, x] = make(w, h);
  const r = rng(seed);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f1d896');
  g.addColorStop(0.45, '#cfa756');
  g.addColorStop(1, '#9b7130');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  // brushed metal
  for (let i = 0; i < 1400; i++) {
    x.globalAlpha = 0.04 + r() * 0.08;
    x.fillStyle = r() > 0.5 ? '#fff4d0' : '#6b4b1c';
    x.fillRect(r() * w - 80, r() * h, 60 + r() * 260, 1);
  }
  x.globalAlpha = 1;
  // bevel
  const b = x.createLinearGradient(0, 0, 0, h);
  b.addColorStop(0, 'rgba(255,248,220,0.6)');
  b.addColorStop(0.07, 'rgba(255,248,220,0)');
  b.addColorStop(0.93, 'rgba(60,35,5,0)');
  b.addColorStop(1, 'rgba(60,35,5,0.6)');
  x.fillStyle = b;
  x.fillRect(0, 0, w, h);
  // engraving: light lip below, dark cut above
  x.save();
  x.translate(0, 1.6);
  x.strokeStyle = x.fillStyle = 'rgba(255,240,200,0.55)';
  plateLayout(x, w, h, text, 'light');
  x.restore();
  x.strokeStyle = x.fillStyle = 'rgba(38,22,4,0.96)';
  plateLayout(x, w, h, text, 'shadow');

  const [bc, bx] = make(w, h);
  bx.fillStyle = '#fff';
  bx.fillRect(0, 0, w, h);
  bx.strokeStyle = bx.fillStyle = '#000';
  plateLayout(bx, w, h, text, 'bump');
  return { map: c, bump: bc };
}

/* ---------- prints ---------- */
function paperNoise(x, w, h, seed, alpha = 0.05) {
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 90; i++) {
    x.globalAlpha = alpha * r();
    x.fillStyle = r() > 0.5 ? '#ffffff' : '#7a6a50';
    x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  x.globalAlpha = 1;
}

export function printFront(img, pw, ph, seed = 3) {
  const long = 600;
  const aspect = pw / ph;
  const iw = Math.round(aspect >= 1 ? long : long * aspect);
  const ih = Math.round(aspect >= 1 ? long / aspect : long);
  const b = Math.round(Math.min(iw, ih) * 0.065);
  const W = iw + b * 2, H = ih + b * 2;
  const [c, x] = make(W, H);
  x.fillStyle = '#f5efe2';
  x.fillRect(0, 0, W, H);
  paperNoise(x, W, H, seed, 0.06);
  if (img) {
    x.drawImage(img, b, b, iw, ih);
  } else {
    x.fillStyle = '#c9d3e0';
    x.fillRect(b, b, iw, ih);
    x.strokeStyle = '#8796ad';
    x.lineWidth = 6;
    snowflakeGlyph(x, W / 2, H / 2, Math.min(iw, ih) * 0.2);
  }
  // soft print edge on the photo
  const v = x.createRadialGradient(W / 2, H / 2, Math.min(iw, ih) * 0.35, W / 2, H / 2, Math.max(iw, ih) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(30,20,10,0.22)');
  x.fillStyle = v;
  x.fillRect(b, b, iw, ih);
  x.strokeStyle = 'rgba(40,30,20,0.25)';
  x.lineWidth = 1;
  x.strokeRect(b + 0.5, b + 0.5, iw - 1, ih - 1);
  return { canvas: c, aspect: W / H };
}

function wrapLines(x, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const wd of words) {
    const t = line ? line + ' ' + wd : wd;
    if (x.measureText(t).width > maxW && line) {
      lines.push(line);
      line = wd;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export function printBack(canvas, { caption, album, number, seed = 5 }) {
  const W = canvas.width, H = canvas.height;
  const x = canvas.getContext('2d');
  x.clearRect(0, 0, W, H);
  x.fillStyle = '#efe8da';
  x.fillRect(0, 0, W, H);
  paperNoise(x, W, H, seed, 0.07);
  // photo-lab stamp
  x.fillStyle = 'rgba(120,108,90,0.55)';
  x.font = `500 ${Math.round(W * 0.034)}px Onest, sans-serif`;
  x.textAlign = 'left';
  x.textBaseline = 'alphabetic';
  x.fillText(`${album}  ·  №${number}`, W * 0.08, H - W * 0.07);
  // handwriting
  x.save();
  x.translate(W * 0.08, H * 0.12);
  x.rotate(-0.035);
  x.fillStyle = '#29407e';
  let size = Math.round(W * 0.085);
  x.font = `600 ${size}px Caveat, "Bad Script", cursive`;
  let lines = wrapLines(x, caption, W * 0.84);
  while (lines.length * size * 1.08 > H * 0.62 && size > 18) {
    size -= 3;
    x.font = `600 ${size}px Caveat, "Bad Script", cursive`;
    lines = wrapLines(x, caption, W * 0.84);
  }
  x.textBaseline = 'top';
  lines.forEach((l, i) => x.fillText(l, 0, i * size * 1.08));
  x.restore();
  return canvas;
}

/* ---------- little house bits ---------- */
export function windowCanvas(cat = false) {
  const [c, x] = make(64, 96);
  const g = x.createRadialGradient(32, 52, 4, 32, 48, 52);
  g.addColorStop(0, '#fff1c4');
  g.addColorStop(0.5, '#ffc062');
  g.addColorStop(1, '#e0702a');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 96);
  if (cat) {
    x.fillStyle = '#2a1a12';
    x.beginPath();
    x.ellipse(30, 84, 15, 13, 0, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.arc(30, 64, 10, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.moveTo(21, 60); x.lineTo(23, 49); x.lineTo(28, 56);
    x.moveTo(39, 60); x.lineTo(37, 49); x.lineTo(32, 56);
    x.fill();
    x.lineWidth = 4;
    x.strokeStyle = '#2a1a12';
    x.beginPath();
    x.moveTo(44, 90);
    x.quadraticCurveTo(58, 86, 52, 70);
    x.stroke();
    x.fillStyle = '#ffe9a8';
    x.fillRect(25, 62, 3, 2);
    x.fillRect(33, 62, 3, 2);
  }
  x.fillStyle = '#3b2416';
  x.fillRect(0, 0, 64, 6);
  x.fillRect(0, 90, 64, 6);
  x.fillRect(0, 0, 6, 96);
  x.fillRect(58, 0, 6, 96);
  x.fillRect(29, 0, 6, 96);
  x.fillRect(0, 38, 64, 5);
  return c;
}

export function plasterCanvas(color, seed = 9) {
  const [c, x] = make(128, 128);
  const r = rng(seed);
  x.fillStyle = color;
  x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    x.globalAlpha = 0.05 + r() * 0.08;
    x.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
    x.beginPath();
    x.arc(r() * 128, r() * 128, 1 + r() * 4, 0, 7);
    x.fill();
  }
  x.globalAlpha = 1;
  return c;
}

export function stoneCanvas(seed = 4) {
  const [c, x] = make(256, 128);
  const r = rng(seed);
  x.fillStyle = '#6f6458';
  x.fillRect(0, 0, 256, 128);
  let y = 0;
  while (y < 128) {
    const rh = 14 + r() * 12;
    let px = -r() * 20;
    while (px < 256) {
      const sw = 18 + r() * 30;
      const l = 150 + r() * 60;
      x.fillStyle = `rgb(${l},${l - 8 - r() * 10},${l - 22 - r() * 12})`;
      x.beginPath();
      x.roundRect(px + 1.5, y + 1.5, sw - 3, rh - 3, 4);
      x.fill();
      px += sw;
    }
    y += rh;
  }
  return c;
}

export function tilesCanvas(seed = 6) {
  const [c, x] = make(256, 256);
  const r = rng(seed);
  x.fillStyle = '#7b2f1d';
  x.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 12; col++) {
      const ox = col * 22 + (row % 2) * 11;
      const oy = row * 16;
      const l = r() * 30;
      const g = x.createLinearGradient(ox, 0, ox + 20, 0);
      g.addColorStop(0, `rgb(${120 + l},${48 + l * 0.4},${30})`);
      g.addColorStop(0.5, `rgb(${178 + l},${82 + l * 0.5},${50})`);
      g.addColorStop(1, `rgb(${110 + l},${42},${26})`);
      x.fillStyle = g;
      x.beginPath();
      x.roundRect(ox, oy, 20, 15, [0, 0, 8, 8]);
      x.fill();
    }
  }
  return c;
}

export function cordCanvas() {
  const [c, x] = make(64, 16);
  x.fillStyle = '#f4efe6';
  x.fillRect(0, 0, 64, 16);
  x.fillStyle = '#c2242f';
  for (let i = -2; i < 6; i++) {
    x.beginPath();
    x.moveTo(i * 16, 0);
    x.lineTo(i * 16 + 8, 0);
    x.lineTo(i * 16 + 24, 16);
    x.lineTo(i * 16 + 16, 16);
    x.fill();
  }
  return c;
}

export function radialCanvas(stops, size = 256) {
  const [c, x] = make(size, size);
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  return c;
}

/* ---------- the night window behind everything ----------
   World mapping: canvas covers x ∈ [-8, 8], y ∈ [-1, 7] on the backdrop plane. */
export const BACKDROP = { w: 16, h: 8, y0: -1, win: { x0: -4.3, x1: 4.3, y0: 0, y1: 6.8 } };

function softBlur(c, steps = 3) {
  // progressive down/up sampling: a cheap, smooth, cross-browser blur
  const chain = [c];
  let w = c.width, h = c.height;
  for (let i = 0; i < steps; i++) {
    w = Math.max(8, w >> 1);
    h = Math.max(8, h >> 1);
    const [d, dx] = make(w, h);
    dx.imageSmoothingQuality = 'high';
    dx.drawImage(chain[chain.length - 1], 0, 0, w, h);
    chain.push(d);
  }
  for (let i = chain.length - 2; i >= 0; i--) {
    const t = chain[i];
    const tx = t.getContext('2d');
    tx.imageSmoothingQuality = 'high';
    tx.clearRect(0, 0, t.width, t.height);
    tx.drawImage(chain[i + 1], 0, 0, t.width, t.height);
  }
}

export function backdropCanvas(seed = 21) {
  const W = 2048, H = 1024;
  const [c, x] = make(W, H);
  const r = rng(seed);
  const sx = (wx) => ((wx + 8) / 16) * W;
  const sy = (wy) => H - ((wy + 1) / 8) * H;
  const px = W / 16; // pixels per world unit

  // wall, warm lamp from the upper left
  x.fillStyle = '#0f0b0c';
  x.fillRect(0, 0, W, H);
  const lamp = x.createRadialGradient(sx(-7.5), sy(4.5), 0, sx(-7.5), sy(4.5), px * 8);
  lamp.addColorStop(0, 'rgba(110,62,34,0.6)');
  lamp.addColorStop(1, 'rgba(110,62,34,0)');
  x.fillStyle = lamp;
  x.fillRect(0, 0, W, H);

  const wx0 = sx(BACKDROP.win.x0), wx1 = sx(BACKDROP.win.x1);
  const wy1 = sy(BACKDROP.win.y1), wy0 = sy(BACKDROP.win.y0);

  // outside: sky
  x.save();
  x.beginPath();
  x.rect(wx0, wy1, wx1 - wx0, wy0 - wy1);
  x.clip();
  const sky = x.createLinearGradient(0, sy(5), 0, wy0);
  sky.addColorStop(0, '#050816');
  sky.addColorStop(0.5, '#0a1028');
  sky.addColorStop(0.8, '#181834');
  sky.addColorStop(1, '#2a1d2c');
  x.fillStyle = sky;
  x.fillRect(wx0, wy1, wx1 - wx0, wy0 - wy1);
  // moon glow
  const mx = sx(3.3), my = sy(2.35);
  let g = x.createRadialGradient(mx, my, 0, mx, my, px * 1.8);
  g.addColorStop(0, 'rgba(170,190,240,0.32)');
  g.addColorStop(0.25, 'rgba(150,170,230,0.12)');
  g.addColorStop(1, 'rgba(130,150,220,0)');
  x.fillStyle = g;
  x.fillRect(mx - px * 2, my - px * 2, px * 4, px * 4);
  // Vitosha, far away
  x.fillStyle = '#121733';
  x.beginPath();
  x.moveTo(wx0, sy(0.9));
  const ridge = [[-4.3, 1.1], [-3.4, 1.3], [-2.2, 1.68], [-1.1, 1.85], [-0.2, 1.62], [0.9, 1.45], [2.2, 1.25], [3.4, 1.14], [4.3, 1.02]];
  ridge.forEach(([a, b]) => x.lineTo(sx(a), sy(b)));
  x.lineTo(wx1, sy(0.9));
  x.closePath();
  x.fill();
  // rooftops
  x.fillStyle = '#0a0a16';
  let rx = wx0;
  x.beginPath();
  x.moveTo(wx0, wy0);
  while (rx < wx1) {
    const bw = px * (0.4 + r() * 0.9);
    const bh = 0.45 + r() * 0.55;
    x.lineTo(rx, sy(bh));
    if (r() > 0.6) {
      x.lineTo(rx + bw / 2, sy(bh + 0.25));
      x.lineTo(rx + bw, sy(bh));
    } else x.lineTo(rx + bw, sy(bh));
    rx += bw;
  }
  x.lineTo(wx1, wy0);
  x.closePath();
  x.fill();
  x.fillStyle = '#231c28';
  x.beginPath();
  x.arc(sx(1.9), sy(1.05), px * 0.32, Math.PI, 0);
  x.fill();
  x.restore();

  // window frame
  const frame = (fx0, fy0, fx1, fy1) => {
    x.fillStyle = '#1f1917';
    x.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    const hl = x.createLinearGradient(fx0, 0, fx1, 0);
    hl.addColorStop(0, 'rgba(255,190,130,0.12)');
    hl.addColorStop(1, 'rgba(0,0,0,0.2)');
    x.fillStyle = hl;
    x.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
  };
  const fw = px * 0.3;
  frame(wx0 - fw, wy1 - fw, wx0 + fw * 0.4, wy0);
  frame(wx1 - fw * 0.4, wy1 - fw, wx1 + fw, wy0);
  frame(wx0 - fw, wy0 - px * 0.24, wx1 + fw, wy0 + 4);
  frame(sx(-2.6) - px * 0.07, wy1, sx(-2.6) + px * 0.07, wy0);
  frame(sx(2.6) - px * 0.07, wy1, sx(2.6) + px * 0.07, wy0);
  frame(wx0, sy(4.4) - px * 0.06, wx1, sy(4.4) + px * 0.06);
  // frost in the pane corners
  for (const [a, b] of [[-4.3, -2.6], [-2.6, 2.6], [2.6, 4.3]]) {
    for (const cx of [a, b]) {
      for (let i = 0; i < 16; i++) {
        const fx = sx(cx) + (cx === a ? 1 : -1) * r() * px * 0.6;
        const fy = sy(0.24) - r() * px * 0.45;
        const fr = px * (0.1 + r() * 0.3);
        const gg = x.createRadialGradient(fx, fy, 0, fx, fy, fr);
        gg.addColorStop(0, 'rgba(190,205,235,0.14)');
        gg.addColorStop(1, 'rgba(190,205,235,0)');
        x.fillStyle = gg;
        x.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
      }
    }
  }
  // out of focus: everything so far is far behind the globe
  softBlur(c, 4);

  // bokeh on top keeps its soft-but-defined disc edge
  const bokeh = (bx, by, rad, col, a) => {
    const gg = x.createRadialGradient(bx, by, 0, bx, by, rad);
    gg.addColorStop(0, `rgba(${col},${a * 0.55})`);
    gg.addColorStop(0.7, `rgba(${col},${a * 0.8})`);
    gg.addColorStop(0.88, `rgba(${col},${a})`);
    gg.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = gg;
    x.beginPath();
    x.arc(bx, by, rad, 0, 7);
    x.fill();
  };
  x.save();
  x.beginPath();
  x.rect(wx0, wy1, wx1 - wx0, wy0 - wy1);
  x.clip();
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 110; i++) {
    const bx = wx0 + r() * (wx1 - wx0);
    const by = sy(0.2 + r() * 0.75);
    const warm = r() > 0.2;
    bokeh(bx, by, px * (0.035 + r() * 0.07), warm ? '255,170,85' : '160,195,255', 0.12 + r() * 0.22);
  }
  for (let i = 0; i < 7; i++) {
    const bx = wx0 + ((i + 0.5) / 7) * (wx1 - wx0) + (r() - 0.5) * px * 0.6;
    bokeh(bx, sy(0.3 + r() * 0.45), px * (0.16 + r() * 0.12), '255,150,62', 0.13 + r() * 0.1);
  }
  g = x.createRadialGradient(mx, my, 0, mx, my, px * 0.2);
  g.addColorStop(0, 'rgba(235,240,255,0.5)');
  g.addColorStop(0.75, 'rgba(225,232,255,0.4)');
  g.addColorStop(1, 'rgba(225,232,255,0)');
  x.fillStyle = g;
  x.beginPath();
  x.arc(mx, my, px * 0.2, 0, 7);
  x.fill();
  x.restore();

  // a garland of warm lights across the top of the window, close and very out of focus
  x.globalCompositeOperation = 'lighter';
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const gx = -5 + t * 10;
    const sag = Math.sin(((t * 2) % 1) * Math.PI);
    const gy = 2.98 - sag * 0.34;
    const rad = px * (0.15 + r() * 0.08);
    bokeh(sx(gx), sy(gy), rad, i % 5 === 2 ? '255,120,90' : '255,190,110', 0.2 + r() * 0.14);
  }
  x.globalCompositeOperation = 'source-over';
  return c;
}
