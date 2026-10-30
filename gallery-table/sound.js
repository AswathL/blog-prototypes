// Paper sounds synthesised with Web Audio (filtered noise). Off by default;
// nothing is created until the visitor turns sound on.

let ctx = null;
let master = null;
let noise = null;
let enabled = false;
let lastSlide = 0;

function init() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);
  const len = Math.floor(ctx.sampleRate * 2);
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) {
    // slightly pinked noise sounds more like paper than pure white noise
    b = 0.86 * b + 0.14 * (Math.random() * 2 - 1);
    d[i] = b * 2.4 + (Math.random() * 2 - 1) * 0.25;
  }
}

function burst({ dur, freq, q = 0.8, type = 'bandpass', gain = 0.2, attack = 0.006, to = null, delay = 0 }) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 1.2);
  src.stop(t + dur + 0.05);
}

export const sound = {
  get on() {
    return enabled;
  },
  set(on) {
    enabled = on;
    if (on && !ctx) init();
    if (ctx && on && ctx.state === 'suspended') ctx.resume();
    if (on) this.flip();
  },
  /** a print sliding over wood; amount 0..1 */
  slide(amount = 0.5) {
    const now = performance.now();
    if (now - lastSlide < 40) return;
    lastSlide = now;
    const a = Math.max(0.05, Math.min(1, amount));
    burst({ dur: 0.12 + a * 0.45, freq: 2600, to: 900, q: 0.5, gain: 0.03 + a * 0.12, attack: 0.03 });
  },
  flip() {
    burst({ dur: 0.07, freq: 4200, q: 1.4, gain: 0.16, attack: 0.002 });
    burst({ dur: 0.1, freq: 1500, q: 0.9, gain: 0.1, attack: 0.004, delay: 0.16 });
  },
  tap(amount = 0.5) {
    burst({ dur: 0.08, freq: 900, type: 'lowpass', q: 0.7, gain: 0.08 + amount * 0.25, attack: 0.002 });
  },
  rustle() {
    for (let i = 0; i < 4; i++) {
      burst({ dur: 0.18 + Math.random() * 0.2, freq: 1800 + Math.random() * 1500, to: 800, q: 0.6, gain: 0.07, attack: 0.03, delay: i * 0.07 });
    }
  },
};
