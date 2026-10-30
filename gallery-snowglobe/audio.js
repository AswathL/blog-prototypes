// Tiny synthesised sound kit. Silent until the visitor turns it on.
let ctx = null;
let master = null;
let noise = null;
let enabled = false;
const lastPlayed = {};

function init() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  const len = ctx.sampleRate * 1.5;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return true;
}

export function setEnabled(on) {
  enabled = on;
  if (on && !ctx && !init()) enabled = false;
  if (ctx) on ? ctx.resume() : ctx.suspend();
  return enabled;
}

export const isEnabled = () => enabled;

function gate(name, ms) {
  const now = performance.now();
  if (now - (lastPlayed[name] || 0) < ms) return false;
  lastPlayed[name] = now;
  return true;
}

function env(node, t, a, peak, d) {
  node.gain.setValueAtTime(0.0001, t);
  node.gain.exponentialRampToValueAtTime(peak, t + a);
  node.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

/* water sloshing in the glass */
export function swish(power = 5) {
  if (!enabled || !gate('swish', 210)) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(280, t);
  bp.frequency.exponentialRampToValueAtTime(900 + Math.min(power, 60) * 12, t + 0.18);
  bp.frequency.exponentialRampToValueAtTime(240, t + 0.5);
  const g = ctx.createGain();
  env(g, t, 0.06, Math.min(0.32, 0.06 + power * 0.006), 0.5);
  src.connect(bp).connect(g).connect(master);
  src.start(t, Math.random());
  src.stop(t + 0.7);
}

/* a glassy chime when a photo arrives at the front */
export function chime() {
  if (!enabled || !gate('chime', 400)) return;
  const t = ctx.currentTime;
  [1318.5, 1975.5, 2637].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    env(g, t + i * 0.06, 0.005, 0.09 / (i + 1), 1.6 - i * 0.3);
    o.connect(g).connect(master);
    o.start(t + i * 0.06);
    o.stop(t + 2);
  });
}

/* a fingertip on the glass */
export function tink() {
  if (!enabled || !gate('tink', 120)) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = 3100 + Math.random() * 400;
  const g = ctx.createGain();
  env(g, t, 0.002, 0.08, 0.35);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.5);
}

/* wooden base on the sill */
export function thud(v = 1) {
  if (!enabled || !gate('thud', 160)) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
  const g = ctx.createGain();
  env(g, t, 0.004, Math.min(0.5, 0.12 + v * 0.12), 0.25);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.35);
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const g2 = ctx.createGain();
  env(g2, t, 0.002, 0.08, 0.06);
  src.connect(lp).connect(g2).connect(master);
  src.start(t);
  src.stop(t + 0.1);
}

/* the band on the base turning: a soft ratchet */
export function ratchet() {
  if (!enabled) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 9; i++) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const g = ctx.createGain();
    const at = t + 0.18 + i * 0.09 + Math.sin(i * 0.6) * 0.02;
    env(g, at, 0.001, 0.07, 0.03);
    src.connect(hp).connect(g).connect(master);
    src.start(at, Math.random());
    src.stop(at + 0.06);
  }
}

/* a little music-box phrase, for the cat */
export function musicBox() {
  if (!enabled || !gate('music', 1200)) return;
  const t = ctx.currentTime;
  const notes = [76, 79, 83, 81, 79, 76, 78, 79];
  notes.forEach((n, i) => {
    const f = 440 * Math.pow(2, (n - 69) / 12);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = f * 4.01;
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.2;
    env(g, t + i * 0.19, 0.003, 0.08, 0.9);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(master);
    o.start(t + i * 0.19);
    o2.start(t + i * 0.19);
    o.stop(t + i * 0.19 + 1);
    o2.stop(t + i * 0.19 + 1);
  });
}
