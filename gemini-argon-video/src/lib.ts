import { Easing, interpolate } from 'remotion';
import tl from './timeline.json';

export const FPS = tl.fps;
export const W = 1080;
export const H = 1920;
export const T = tl.text;

export const C = {
  bg: '#02040b',
  blue: '#2f7bff',
  cyan: '#38e8ff',
  violet: '#8b5cff',
  magenta: '#ff3fd2',
  white: '#f2f7ff',
};

// Strong ease-out curves: things arrive fast and settle, never linear.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.83, 0, 0.17, 1);

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/** 0→1 progress of `dur` seconds starting at `start` seconds, eased. */
export const prog = (t: number, start: number, dur: number, ease = easeOut) =>
  interpolate(t, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth value noise, deterministic in t. */
export function noise1(t: number, seed = 0) {
  const i = Math.floor(t);
  const f = t - i;
  const h = (n: number) => {
    const x = Math.sin((n + seed * 131.7) * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  const u = f * f * (3 - 2 * f);
  return mix(h(i), h(i + 1), u) * 2 - 1;
}

const IMPACTS = tl.sfx.filter((e) => ['impact', 'slam', 'hit', 'pulse'].includes(e.type));

/** Energy from recent impacts: drives camera shake, zoom punch, flashes. */
export function impactEnergy(t: number) {
  let e = 0;
  for (const im of IMPACTS) {
    const dt = t - im.at;
    if (dt >= 0 && dt < 1.2) {
      const w = im.type === 'impact' || im.type === 'slam' ? (im as { size?: number }).size ?? 1 : im.type === 'pulse' ? 0.6 : 0.35;
      e += w * Math.exp(-dt * 7);
    }
  }
  return e;
}

export const scene = (id: string) => tl.scenes.find((s) => s.id === id)!;
