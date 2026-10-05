// Glass hover note for rociodelaloye.com, generated from scratch (no samples):
//   node tools/glass.mjs <outDir>   -> glass.wav (then encode to .mp4 and .ogg)
// A soft glass tone at E6, in the ambient's key: a sine body with a faint inharmonic
// shimmer and a breath of air at the attack, a short bright room. The site plays it
// at E, F#, G#, B and C# (playback rates 1, 9/8, 5/4, 3/2, 5/3), one note per piece.
import fs from 'fs';
import path from 'path';

const SR = 44100, TAU = Math.PI * 2;
const OUT = process.argv[2] || 'glass-out';
fs.mkdirSync(OUT, { recursive: true });
const n = Math.floor(0.9 * SR), L = new Float32Array(n), R = new Float32Array(n);
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

const f0 = 1318.51;                                  // E6
const parts = [[1, 0.62, 0.32], [2.76, 0.16, 0.11], [5.40, 0.07, 0.05], [2, 0.08, 0.16], [8.93, 0.025, 0.025]];
for (let k = 0; k < n; k++) {
  const t = k / SR, att = Math.min(1, t / 0.004);
  let v = 0;
  parts.forEach(([r, a, tau]) => { v += Math.sin(TAU * f0 * r * t * (1 + 0.0009 * Math.sin(TAU * 5.5 * t))) * a * Math.exp(-t / tau); });
  v += (rnd() * 2 - 1) * 0.05 * Math.exp(-t / 0.006);   // air at the strike
  v *= att * Math.min(1, (n - k) / (0.05 * SR));
  L[k] = v; R[k] = v;
}
// short bright room: a few cross-fed echoes, slightly wider on the right
[[0.019, 0.32, 0], [0.031, 0.26, 1], [0.047, 0.2, 0], [0.071, 0.14, 1], [0.103, 0.09, 0], [0.149, 0.06, 1]].forEach(([dt, g, side]) => {
  const d = Math.floor(dt * SR), src = side ? L : R, dst = side ? R : L;
  for (let i = n - 1; i >= d; i--) dst[i] += src[i - d] * g;
});
let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = Math.pow(10, -4 / 20) / peak;
const buf = Buffer.alloc(44 + n * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(OUT, 'glass.wav'), buf);
console.log('written:', path.join(OUT, 'glass.wav'));
