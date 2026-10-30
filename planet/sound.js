// Tiny synthesized sounds. Always off until the visitor turns them on.
export class Sound {
  constructor() {
    this.on = false;
    this.ctx = null;
  }

  toggle() {
    this.on = !this.on;
    if (this.on && this.ensure()) this.chime();
    return this.on;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  ready() {
    return this.on && this.ensure();
  }

  tone(freq, dur, { type = 'sine', gain = 0.3, attack = 0.006, at = 0, glide = null, glideAt = 1, filter = null } = {}) {
    const c = this.ctx;
    const t0 = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur * glideAt);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (filter) {
      const f = c.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = filter.freq;
      f.Q.value = filter.q || 1;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return o;
  }

  noise(dur, { type = 'bandpass', freq = 1000, to = null, q = 1, gain = 0.3, at = 0 } = {}) {
    const c = this.ctx;
    const t0 = c.currentTime + at;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t0);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  pop() {
    if (!this.ready()) return;
    this.tone(480, 0.14, { glide: 900, gain: 0.22 });
  }
  whoosh() {
    if (!this.ready()) return;
    this.noise(1.1, { freq: 260, to: 1900, q: 0.7, gain: 0.22 });
  }
  door() {
    if (!this.ready()) return;
    this.tone(150, 0.5, { type: 'sawtooth', glide: 230, gain: 0.05, filter: { freq: 700, q: 4 } });
    this.tone(90, 0.18, { gain: 0.25, at: 0.42 });
  }
  shout() {
    if (!this.ready()) return;
    this.tone(330, 0.32, { type: 'square', glide: 620, gain: 0.07, filter: { type: 'bandpass', freq: 1200, q: 2 } });
    this.tone(495, 0.28, { type: 'square', glide: 930, gain: 0.04, at: 0.04, filter: { type: 'bandpass', freq: 1500, q: 2 } });
  }
  ding() {
    if (!this.ready()) return;
    for (const at of [0, 0.24]) {
      this.tone(1318, 1.1, { type: 'triangle', gain: 0.2, at });
      this.tone(1975, 0.7, { gain: 0.07, at });
      this.tone(2637, 0.4, { gain: 0.03, at });
    }
  }
  clatter() {
    if (!this.ready()) return;
    for (let i = 0; i < 11; i++) this.noise(0.035, { type: 'highpass', freq: 2200, gain: 0.25, at: i * 0.06 + (i % 2) * 0.01 });
  }
  meow() {
    if (!this.ready()) return;
    const o = this.tone(520, 0.62, { type: 'sawtooth', gain: 0.09, filter: { freq: 1500, q: 3 } });
    const t = this.ctx.currentTime;
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(820, t + 0.22);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.6);
  }
  jingle() {
    if (!this.ready()) return;
    for (let i = 0; i < 9; i++) this.tone(1800 + Math.random() * 1800, 0.35, { gain: 0.06, at: i * 0.05 });
    this.tone(160, 0.3, { gain: 0.2, type: 'triangle' });
  }
  baa() {
    if (!this.ready()) return;
    const o = this.tone(360, 0.7, { type: 'sawtooth', gain: 0.08, filter: { type: 'bandpass', freq: 900, q: 2 } });
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    lfo.frequency.value = 22;
    lg.gain.value = 18;
    lfo.connect(lg);
    lg.connect(o.frequency);
    lfo.start();
    lfo.stop(this.ctx.currentTime + 0.75);
  }
  chime() {
    if (!this.ready()) return;
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => this.tone(f, 0.9, { gain: 0.1, at: i * 0.09 }));
  }
  liftoff() {
    if (!this.ready()) return;
    this.noise(1.3, { type: 'lowpass', freq: 300, to: 2400, q: 0.5, gain: 0.3 });
  }
  waves() {
    if (!this.ready()) return;
    this.noise(1.6, { type: 'lowpass', freq: 500, to: 1400, q: 0.3, gain: 0.18 });
  }
}
