import { useRef } from 'react';
import { heroVoice, useCanvasLoop } from '../motion/heroVoice';

// ─── The FrontDesk AI voice ribbon ─────────────────────────────────────────────────────────────
// A sculptural, full-bleed sound wave: many fine strands share one flowing centreline and twist
// through depth like a silk ribbon. A cyan light travels along it, signal particles ride the
// strands, and the amplitude rises and falls in speech-like phrases — a voice that never stops
// answering. Driven by `heroVoice` (entrance reveal, pointer, scroll settle).

const TAU = Math.PI * 2;
const AZURE = [43, 138, 247];
const CYAN = [96, 247, 252];
const DEEP = [23, 76, 150];

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Speech-like energy: phrases (slow) carrying syllables (fast).
function speechEnergy(t) {
  const phrase = smooth(-0.35, 0.65, Math.sin(t * 0.42) * 0.8 + Math.sin(t * 0.17) * 0.4);
  const syllable = 0.5 + 0.5 * Math.sin(t * 2.3 + Math.sin(t * 0.7) * 2.2);
  return 0.32 + 0.68 * phrase * (0.55 + 0.45 * syllable);
}

// Deterministic particle seeds.
const PARTICLES = Array.from({ length: 54 }, (_, i) => {
  const r = (n) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return { phase: r(1), speed: 0.018 + r(2) * 0.035, lane: r(3) * 2 - 1, size: 0.8 + r(4) * 1.8, twinkle: r(5) * TAU };
});

function drawRibbon(ctx, w, h, t) {
  const { reveal, amp, particles, settle, pointerX, pointerY, pointerOn } = heroVoice;
  if (reveal <= 0.001) return;

  const compact = w < 1024; // below desktop the ribbon runs level through its band
  const strands = w < 640 ? 24 : 38;
  // Desktop: the ribbon enters low on the left and rises in an S-curve into the open space
  // beside the headline; below desktop it stays level.
  const baseY = (u) => (compact ? h * 0.5 : h * (0.7 - 0.44 * smooth(0.42, 1, u)));
  const A = h * (compact ? 0.21 : 0.13); // centreline amplitude
  const W = h * (compact ? 0.18 : 0.13); // ribbon half-width
  const energy = speechEnergy(t) * (1 - 0.65 * settle);
  const calm = 1 - 0.7 * settle;
  const ampK = amp * calm;
  const step = compact ? 6 : 7;
  const n = Math.ceil(w / step);
  const uMax = Math.min(1, reveal);
  const lightPos = ((t * 0.085) % 1.7) - 0.35;

  // Precompute the centreline, twist and edge window once per frame.
  const cx = new Float32Array(n + 1);
  const cyl = new Float32Array(n + 1);
  const cosT = new Float32Array(n + 1);
  const sinT = new Float32Array(n + 1);
  const win = new Float32Array(n + 1);
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const x = u * w;
    const wnd = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.55);
    const flow = 0.58 * Math.sin(u * TAU * 1.05 - t * 0.55) + 0.3 * Math.sin(u * TAU * 2.2 + t * 0.85);
    const speech = 0.34 * energy * Math.exp(-((u - 0.55) ** 2) / 0.09) * Math.sin(u * TAU * 7.5 - t * 3.1);
    const bend = pointerOn * pointerY * 0.55 * Math.exp(-((u - pointerX) ** 2) / 0.018);
    const theta = u * TAU * 1.2 + t * 0.32;
    cx[k] = x;
    cyl[k] = baseY(u) + A * wnd * ampK * (flow + speech) + A * bend * wnd;
    cosT[k] = Math.cos(theta);
    sinT[k] = Math.sin(theta);
    win[k] = wnd;
  }
  const kMax = Math.max(1, Math.floor(uMax * n));
  const widthK = (0.12 + 0.88 * amp) * (0.75 + 0.25 * calm);

  // Soft volume beneath the strands
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const glow = ctx.createLinearGradient(0, 0, w, 0);
  glow.addColorStop(0, 'rgba(43,138,247,0)');
  glow.addColorStop(0.35, `rgba(43,138,247,${0.1 + 0.06 * energy})`);
  glow.addColorStop(0.7, `rgba(96,247,252,${0.16 + 0.1 * energy})`);
  glow.addColorStop(1, 'rgba(43,138,247,0)');
  ctx.strokeStyle = glow;
  ctx.lineWidth = W * 1.9 * widthK;
  ctx.beginPath();
  for (let k = 0; k <= kMax; k++) (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx[k], cyl[k]);
  ctx.stroke();

  // Strands, back to front: depth = lane * sin(twist)
  const order = Array.from({ length: strands }, (_, i) => -1 + (2 * i) / (strands - 1));
  ctx.globalCompositeOperation = 'lighter';
  for (const v of order) {
    // gradient along x encodes depth shading + the travelling light
    const g = ctx.createLinearGradient(0, 0, w, 0);
    const stops = 9;
    for (let s = 0; s <= stops; s++) {
      const u = s / stops;
      const k = Math.round(u * n);
      const front = 0.5 + 0.5 * v * sinT[k];
      const light = Math.exp(-((u - lightPos) ** 2) / 0.012);
      const a = (0.09 + 0.6 * front * front + 0.6 * light * front) * win[k] * (0.6 + 0.4 * energy);
      const c = AZURE.map((ch, j) => Math.round(ch + (CYAN[j] - ch) * Math.min(1, light + front * 0.25)));
      g.addColorStop(u, `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, a).toFixed(3)})`);
    }
    ctx.strokeStyle = g;
    ctx.lineWidth = 0.8 + 0.9 * (0.5 + 0.5 * Math.abs(v));
    ctx.beginPath();
    for (let k = 0; k <= kMax; k++) {
      const y = cyl[k] + v * W * cosT[k] * widthK * (0.55 + 0.45 * win[k]);
      if (k === 0) ctx.moveTo(cx[k], y);
      else ctx.lineTo(cx[k], y);
    }
    ctx.stroke();
  }

  // Leading tip while the ribbon draws in
  if (uMax < 1) {
    const k = kMax;
    const r = ctx.createRadialGradient(cx[k], cyl[k], 0, cx[k], cyl[k], W * 0.9);
    r.addColorStop(0, 'rgba(160,250,255,0.85)');
    r.addColorStop(1, 'rgba(96,247,252,0)');
    ctx.fillStyle = r;
    ctx.beginPath();
    ctx.arc(cx[k], cyl[k], W * 0.9, 0, TAU);
    ctx.fill();
  }

  // Signal particles riding the ribbon
  if (particles > 0.01) {
    for (const p of PARTICLES) {
      const u = ((p.phase + t * p.speed * (0.6 + energy)) % 1.1) - 0.05;
      if (u < 0 || u > uMax) continue;
      const k = Math.min(n, Math.max(0, Math.round(u * n)));
      const front = 0.5 + 0.5 * p.lane * sinT[k];
      const y = cyl[k] + p.lane * W * cosT[k] * widthK * (0.55 + 0.45 * win[k]);
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + p.twinkle);
      const a = particles * win[k] * tw * (0.25 + 0.75 * front);
      if (a < 0.02) continue;
      const rad = p.size * (0.7 + 0.6 * front);
      const halo = ctx.createRadialGradient(cx[k], y, 0, cx[k], y, rad * 5);
      halo.addColorStop(0, `rgba(${CYAN.join(',')},${(0.45 * a).toFixed(3)})`);
      halo.addColorStop(1, `rgba(${CYAN.join(',')},0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx[k], y, rad * 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(235,253,255,${Math.min(1, a).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx[k], y, rad, 0, TAU);
      ctx.fill();
    }
  }

  // A fine baseline the voice rises from (an oscilloscope reference line)
  ctx.globalCompositeOperation = 'source-over';
  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, `rgba(${DEEP.join(',')},0)`);
  base.addColorStop(0.5, `rgba(${DEEP.join(',')},0.16)`);
  base.addColorStop(1, `rgba(${DEEP.join(',')},0)`);
  ctx.strokeStyle = base;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k <= kMax; k++) (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx[k], baseY(k / n));
  ctx.stroke();
  ctx.restore();
}

export default function HeroRibbon({ className = '' }) {
  const ref = useRef(null);
  useCanvasLoop(ref, drawRibbon);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
