// Ambient for rociodelaloye.com, generated from scratch (no samples):
//   node tools/ambient.mjs <outDir>   -> ambient.wav (then encode to .m4a and .ogg)
// Same family as the OONA bed (lo-fi pads, tape wobble, long reverb, a faint haze,
// no beat) but its own piece: 48 s in three slow sections around E major
// (E sus2, A maj7, B add9 over F#), no arpeggio, only rare high glass notes,
// a little cooler and more open. The end folds over the start, so it loops seamlessly.
import fs from 'fs';
import path from 'path';

const SR = 44100;
const OUT = process.argv[2] || 'ambient-out';
fs.mkdirSync(OUT, { recursive: true });

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const db = d => Math.pow(10, d / 20);
const TAU = Math.PI * 2;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function make(sec) { const n = Math.ceil(sec * SR); return { L: new Float32Array(n), R: new Float32Array(n), n }; }
function panGains(p) { const a = (p + 1) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; }
function put(b, i, l, r) { if (i < 0 || i >= b.n) return; b.L[i] += l; b.R[i] += r; }

// Band-passed noise burst.
function noise(b, t0, { dur, amp = 1, attack = 0.0005, tau = 0.01, f = 4000, f1 = f, q = 1, pan = 0 }, R = rng(7)) {
  const [gl, gr] = panGains(pan), n = Math.floor(dur * SR), s0 = Math.floor(t0 * SR);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR, fc = f * Math.pow(f1 / f, k / n);
    const w = TAU * Math.min(fc, SR * 0.45) / SR, al = Math.sin(w) / (2 * q), cw = Math.cos(w);
    const x = R() * 2 - 1, y = (al * x - al * x2 + 2 * cw * y1 - (1 - al) * y2) / (1 + al);
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    const v = y * 2 * amp * (t < attack ? t / attack : Math.exp(-(t - attack) / tau)) * Math.min(1, (n - k) / (0.002 * SR));
    put(b, s0 + k, v * gl, v * gr);
  }
}
// One-pole low-pass over a whole buffer (rolls the highs off, like the reference bed).
function lowpass(b, fc) { const a = Math.exp(-TAU * fc / SR); let l = 0, r = 0; for (let i = 0; i < b.n; i++) { l = (1 - a) * b.L[i] + a * l; r = (1 - a) * b.R[i] + a * r; b.L[i] = l; b.R[i] = r; } }
function normalize(b, peakDb = -3) { let p = 0; for (let i = 0; i < b.n; i++) p = Math.max(p, Math.abs(b.L[i]), Math.abs(b.R[i])); const g = db(peakDb) / (p || 1); for (let i = 0; i < b.n; i++) { b.L[i] *= g; b.R[i] *= g; } }
function fadeOut(b, sec) { const z = Math.floor(sec * SR); for (let i = 0; i < z && i < b.n; i++) { const g = i / z, j = b.n - 1 - i; b.L[j] *= g; b.R[j] *= g; } }
function write(b, name) {
  const n = b.n, d = Buffer.alloc(44 + n * 4);
  d.write('RIFF', 0); d.writeUInt32LE(36 + n * 4, 4); d.write('WAVE', 8); d.write('fmt ', 12); d.writeUInt32LE(16, 16); d.writeUInt16LE(1, 20); d.writeUInt16LE(2, 22);
  d.writeUInt32LE(SR, 24); d.writeUInt32LE(SR * 4, 28); d.writeUInt16LE(4, 32); d.writeUInt16LE(16, 34); d.write('data', 36); d.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { d.writeInt16LE(Math.max(-1, Math.min(1, b.L[i])) * 32767 | 0, 44 + i * 4); d.writeInt16LE(Math.max(-1, Math.min(1, b.R[i])) * 32767 | 0, 46 + i * 4); }
  fs.writeFileSync(path.join(OUT, name + '.wav'), d);
}

function lofiPad(b, t0, f, { amp = 0.1, dur = 4, attack = 1.5, release = 2.5, pan = 0, trem = 0, tremHz = 6, flick = 0, flickHz = 22, spread = 18, wobble = 1 } = {}, R = Math.random) {
  const s0 = Math.floor(t0 * SR), n = Math.floor((dur + release) * SR);
  const H = [1, 0.36, 0.14, 0.06, 0.025];
  const voices = [-1, 0, 1].map(v => ({ det: v * spread * (0.6 + 0.4 * R()) / 1200, side: v, ph: H.map(() => R() * TAU),
    w1: R() * TAU, w2: R() * TAU, r1: 0.35 + R() * 0.3, r2: 0.8 + R() * 0.5 }));
  const tp = R() * TAU, tHz = tremHz * (0.85 + R() * 0.3), fp = R() * TAU;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    let env = t < attack ? 0.5 - 0.5 * Math.cos(Math.PI * t / attack) : 1;
    if (t > dur) env *= 0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, (t - dur) / release));
    if (trem) env *= 1 - trem * (0.5 + 0.5 * Math.sin(TAU * tHz * t + tp + 0.8 * Math.sin(TAU * 0.3 * t)));
    if (flick) env *= 1 - flick * (0.5 + 0.5 * Math.sin(TAU * flickHz * t + fp));
    let l = 0, r = 0;
    for (const V of voices) {
      const wob = wobble * (9 * Math.sin(TAU * V.r1 * t + V.w1) + 4 * Math.sin(TAU * V.r2 * t + V.w2) + 2.5 * Math.sin(TAU * 6.1 * t + V.w1)) / 1200;
      const ff = f * (1 + V.det + wob);
      let v = 0;
      for (let j = 0; j < H.length; j++) { V.ph[j] += TAU * ff * (j + 1) / SR; v += Math.sin(V.ph[j]) * H[j]; }
      const g = 0.5 + 0.1 * V.side + 0.3 * pan;
      l += v * (1 - g); r += v * g;
    }
    const k2 = s0 + k; if (k2 < 0 || k2 >= b.n) continue;
    b.L[k2] += l * env * amp / 2; b.R[k2] += r * env * amp / 2;
  }
}
// Long stereo reverb: an 8-line feedback delay network with damping.
function reverb(b, { rt60 = 4.5, wet = 0.9, dry = 0.65, damp = 0.35, pre = 0.02 } = {}) {
  const lens = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map(x => Math.round(x * 1.9));
  const lines = lens.map(l => new Float32Array(l)), idx = lens.map(() => 0), lp = lens.map(() => 0);
  const g = lens.map(l => Math.pow(10, -3 * l / SR / rt60));
  const pd = Math.floor(pre * SR), outL = new Float32Array(b.n), outR = new Float32Array(b.n);
  for (let i = 0; i < b.n; i++) {
    const inp = i >= pd ? (b.L[i - pd] + b.R[i - pd]) * 0.5 : 0;
    const o = lines.map((ln, j) => ln[idx[j]]);
    const sum = o.reduce((x, y) => x + y, 0) * 2 / o.length;   // Householder
    let l = 0, r = 0;
    for (let j = 0; j < 8; j++) {
      lp[j] = (1 - damp) * (o[j] - sum) + damp * lp[j];
      lines[j][idx[j]] = inp * 0.35 + lp[j] * g[j];
      idx[j] = (idx[j] + 1) % lens[j];
      if (j % 2) r += o[j]; else l += o[j];
    }
    outL[i] = l * 0.68 + r * 0.32; outR[i] = r * 0.68 + l * 0.32;   // partly shared: wide, not split
  }
  for (let i = 0; i < b.n; i++) { b.L[i] = b.L[i] * dry + outL[i] * wet * 0.5; b.R[i] = b.R[i] * dry + outR[i] * wet * 0.5; }
}
{
  const SEC = 16, LEN = SEC * 3, X = 7, R = rng(1989);
  const b = make(LEN + X);
  const half = { spread: 8, wobble: 0.45 };
  const sections = [
    // E sus2: open, cool
    { t0: 0,       bass: [40], chord: [59, 64, 66, 71], colour: [68, 75], line: [[71, 1.2, 6.5], [76, 8.4, 6.0]] },
    // A maj7: a little warmer, the middle of the day
    { t0: SEC,     bass: [45], chord: [57, 61, 64, 68], colour: [71, 78], line: [[76, 0.8, 5.5], [73, 6.8, 7.4]] },
    // B add9 over F#: suspended, turning back toward the start
    { t0: SEC * 2, bass: [42], chord: [54, 59, 61, 66], colour: [75, 70], line: [[73, 1.0, 6.0], [71, 7.6, 7.2]] }
  ];
  for (const S of sections) {
    const T = S.t0;
    S.bass.forEach(m => lofiPad(b, T, mtof(m), { ...half, amp: 0.11, dur: SEC - 0.4, attack: 2.4, release: 3.2 }, R));
    S.chord.forEach((m, i) => lofiPad(b, T + i * 0.2, mtof(m), { ...half, amp: [0.09, 0.13, 0.12, 0.11][i], dur: SEC - 0.8, attack: 2.6, release: 3.4,
      pan: -0.5 + i * 0.33, trem: i >= 2 ? 0.22 : 0, tremHz: 3 + R() * 3 }, R));
    S.colour.forEach((m, i) => lofiPad(b, T + 5 + i * 4.5, mtof(m), { ...half, amp: 0.07, dur: 4.5, attack: 2.2, release: 3, pan: i ? 0.55 : -0.55, trem: 0.25, tremHz: 4.5 }, R));
    S.line.forEach(([m, st, d]) => lofiPad(b, T + st, mtof(m), { ...half, amp: 0.13, dur: d, attack: 1.4, release: 2.2, pan: 0.05, spread: 4 }, R));
  }
  // rare high glass notes, like drops of light: E6 B5 F#6 G#6, every 3.5–7 s
  const glass = [88, 83, 90, 92, 83, 88];
  for (let t = 2.5, k = 0; t < LEN - 1; t += 3.5 + R() * 3.5, k++) {
    lofiPad(b, t, mtof(glass[k % glass.length]), { amp: 0.035 + R() * 0.02, dur: 0.3, attack: 0.06, release: 2.8, pan: R() * 1.2 - 0.6, spread: 3, wobble: 0.2 }, R);
  }
  noise(b, 0, { dur: LEN + X, amp: db(-34), attack: 0.5, tau: 1e9, f: 650, q: 0.4 }, R);
  for (let i = 0; i < b.n; i++) { const g = 0.82 + 0.18 * Math.sin(TAU * (i / SR) / SEC - Math.PI / 2); b.L[i] *= g; b.R[i] *= g; }
  lowpass(b, 2400);
  reverb(b, { rt60: 5, wet: 1.1, dry: 0.6, damp: 0.42 });
  const n = Math.floor(LEN * SR), x = Math.floor(X * SR), out = make(LEN);
  for (let i = 0; i < n; i++) { out.L[i] = b.L[i]; out.R[i] = b.R[i]; }
  for (let i = 0; i < x; i++) { out.L[i] += b.L[n + i]; out.R[i] += b.R[n + i]; }
  normalize(out, -5); write(out, 'ambient');
}
console.log('written:', path.join(OUT, 'ambient.wav'));
