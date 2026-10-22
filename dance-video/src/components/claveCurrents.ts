/**
 * Clave Currents — deterministic, frame-seekable generative ribbons (see art/clave-currents.md).
 * Every strand position is an analytic function of time, so any frame renders in isolation.
 */

export type ClaveParams = {
  seed: number;
  pairs: number; // partner pairs (each = two silk strands)
  flowScale: number; // how far / how curvy the shared centre drifts
  radius: number; // orbit radius in px (open position)
  trail: number; // trail length in seconds
  twist: number; // silk twist rate
  glow: number; // additive light 0..1
  bpm: number;
  palette: string[];
};

export const DEFAULT_PARAMS: ClaveParams = {
  seed: 1907,
  pairs: 6,
  flowScale: 1,
  radius: 120,
  trail: 3.4,
  twist: 1.4,
  glow: 0.55,
  bpm: 190,
  palette: ['#6B0F2A', '#C8102E', '#F2A7B5', '#E8C27A'],
};

// 3-2 son clave accents within an 8-beat cycle
const CLAVE = [0, 1.5, 3, 5, 6];

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Seeded 3D gradient noise (Perlin-style), range ~[-1, 1]. */
export const makeNoise = (seed: number) => {
  const r = mulberry32(seed);
  const p = new Uint8Array(512);
  const perm = Array.from({length: 256}, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (h: number, x: number, y: number, z: number) => {
    const g = h & 15;
    const u = g < 8 ? x : y;
    const v = g < 4 ? y : g === 12 || g === 14 ? x : z;
    return ((g & 1) === 0 ? u : -u) + ((g & 2) === 0 ? v : -v);
  };
  return (x: number, y: number, z: number) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u), lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u), lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v),
      w,
    );
  };
};

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Accumulated "turn" angle: an eased half-turn on every clave accent up to beat b. */
const claveTurns = (b: number) => {
  const cycle = Math.floor(b / 8);
  let acc = cycle * CLAVE.length * Math.PI;
  const inCycle = b - cycle * 8;
  for (const c of CLAVE) acc += smooth((inCycle - c) / 0.9) * Math.PI;
  return acc;
};

type Pair = {ax: number; ay: number; ox: number; oy: number; spin: number; phase: number; hue: number; scale: number};

export const buildPairs = (prm: ClaveParams, w: number, h: number): Pair[] => {
  const r = mulberry32(prm.seed * 7 + 3);
  return Array.from({length: prm.pairs}, (_, i) => ({
    ax: w * (0.15 + 0.7 * r()),
    ay: h * (0.1 + 0.8 * ((i + r() * 0.6) / prm.pairs)),
    ox: r() * 100,
    oy: r() * 100,
    spin: r() < 0.5 ? 1 : -1,
    phase: r() * Math.PI * 2,
    hue: r(),
    scale: 0.7 + r() * 0.6,
  }));
};

const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = ch(pa), [r2, g2, b2] = ch(pb);
  return [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map((v) => Math.round(v));
};

/** Draws one frame at time t (seconds). Pure: depends only on (params, t). */
export const drawClave = (
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number,
  prm: ClaveParams,
  noise: (x: number, y: number, z: number) => number,
  pairs: Pair[],
  opts: {background?: string | null; intensity?: number} = {},
) => {
  const intensity = opts.intensity ?? 1;
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, w, h);
  }
  const beatsPerSec = prm.bpm / 60;
  const pos = (pr: Pair, tt: number) => {
    const k = 0.32 * prm.flowScale;
    // two octaves: a broad sweep across the floor + a smaller sway
    const cx = pr.ax + (noise(pr.ox, tt * k, 0.5) * 0.85 + noise(pr.ox + 9, tt * k * 2.3, 2.1) * 0.25) * w * 0.75 * prm.flowScale;
    const cy = pr.ay + (noise(pr.oy, tt * k, 7.3) * 0.85 + noise(pr.oy + 9, tt * k * 2.3, 4.4) * 0.25) * h * 0.45 * prm.flowScale;
    const b = tt * beatsPerSec;
    const theta = pr.phase + pr.spin * (tt * 0.25 + claveTurns(b) * 0.3);
    // breathe between close embrace and open position (8-beat cycle)
    const rad = prm.radius * pr.scale * (0.55 + 0.45 * Math.sin((b / 8) * Math.PI * 2 + pr.phase));
    return {cx, cy, theta, rad};
  };
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const steps = 110;
  for (const pr of pairs) {
    for (const side of [1, -1]) {
      const pts: {x: number; y: number; tw: number; s: number}[] = [];
      for (let k = 0; k <= steps; k++) {
        const s = k / steps; // 0 = tail, 1 = head
        const tt = t - prm.trail * (1 - s);
        const q = pos(pr, tt);
        pts.push({
          x: q.cx + side * Math.cos(q.theta) * q.rad,
          y: q.cy + side * Math.sin(q.theta) * q.rad,
          tw: Math.cos(tt * prm.twist * 2 + pr.phase + (side > 0 ? 0 : 1.3)),
          s,
        });
      }
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const width = (3 + 30 * Math.pow(b.s, 1.1)) * pr.scale * (0.25 + 0.75 * Math.abs(b.tw)) * intensity;
        const wa = (3 + 30 * Math.pow(a.s, 1.1)) * pr.scale * (0.25 + 0.75 * Math.abs(a.tw)) * intensity;
        const ci = Math.min(prm.palette.length - 2, Math.floor((pr.hue + b.s * 0.6) * (prm.palette.length - 1)) % (prm.palette.length - 1));
        const [r, g, bl] = mix(prm.palette[ci], prm.palette[ci + 1], (pr.hue * 3 + b.s) % 1);
        const back = b.tw < 0 ? 0.45 : 1; // underside of the silk is darker
        const alpha = Math.pow(b.s, 1.2) * prm.glow * back * 0.55 * intensity;
        ctx.fillStyle = `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * wa, a.y + ny * wa);
        ctx.lineTo(b.x + nx * width, b.y + ny * width);
        ctx.lineTo(b.x - nx * width, b.y - ny * width);
        ctx.lineTo(a.x - nx * wa, a.y - ny * wa);
        ctx.closePath();
        ctx.fill();
        // hairline highlight on the lit side of the silk
        if (b.tw > 0.6) {
          ctx.strokeStyle = `rgba(255,240,210,${(alpha * 0.8).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x + nx * wa, a.y + ny * wa);
          ctx.lineTo(b.x + nx * width, b.y + ny * width);
          ctx.stroke();
        }
      }
      // a bright bead at the head of each strand
      const head = pts[pts.length - 1];
      const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 26 * pr.scale);
      g.addColorStop(0, `rgba(255,236,190,${0.8 * intensity})`);
      g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 26 * pr.scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // gold dust drifting on the same field
  for (let i = 0; i < 90; i++) {
    const px = ((i * 97.13) % w) + noise(i * 0.37, t * 0.08, 3.1) * 120;
    const py = (((i * 211.7) % h) - t * (12 + (i % 7) * 4) + h * 10) % h;
    const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
    ctx.fillStyle = `rgba(232,194,122,${(0.15 + 0.5 * tw) * intensity})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.4 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};
