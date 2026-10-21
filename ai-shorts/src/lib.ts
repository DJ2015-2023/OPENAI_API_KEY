import { createContext, useContext } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Palette, Sfx, Style, Timeline } from './types';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const PALETTES: Record<Palette, { blue: string; cyan: string; violet: string; magenta: string; bg: string }> = {
  electric: { blue: '#2f7bff', cyan: '#38e8ff', violet: '#8b5cff', magenta: '#ff3fd2', bg: '#02040b' },
  aurora: { blue: '#1f9e8f', cyan: '#5cffd6', violet: '#3aa0ff', magenta: '#b46bff', bg: '#010907' },
  ember: { blue: '#ff6a3d', cyan: '#ffc857', violet: '#ff3d7f', magenta: '#ff2d55', bg: '#0b0403' },
  royal: { blue: '#5b5bff', cyan: '#b9a6ff', violet: '#ff5ccf', magenta: '#ffd166', bg: '#05030d' },
};

/** Active palette. Set once per render by <Video> before any scene renders. */
export const C = { ...PALETTES.electric, white: '#f2f7ff' };
export function setPalette(p: Palette) {
  Object.assign(C, PALETTES[p] ?? PALETTES.electric);
}

function hsl(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

/** A full palette from one hue, so every episode can have its own colors. */
export function paletteFromHue(hue: number, harmony: Style['harmony']) {
  const off = { triad: [40, 120, 240], split: [30, 150, 210], analog: [25, 55, 320], complement: [20, 180, 200] }[harmony];
  return {
    blue: hsl(hue, 85, 56),
    cyan: hsl(hue + off[0], 95, 66),
    violet: hsl(hue + off[1], 85, 64),
    magenta: hsl(hue + off[2], 90, 62),
    bg: hsl(hue, 55, 3.5),
  };
}

// Headline faces: family name and average glyph width (em) used to auto-fit text.
export const FONTS: Record<Style['font'], { family: string; em: number }> = {
  sora: { family: 'Sora', em: 0.74 },
  space: { family: 'Space Grotesk', em: 0.66 },
  unbounded: { family: 'Unbounded', em: 0.9 },
  syne: { family: 'Syne', em: 0.78 },
  archivo: { family: 'Archivo Black', em: 0.82 },
  bebas: { family: 'Bebas Neue', em: 0.46 },
  oswald: { family: 'Oswald', em: 0.56 },
  montserrat: { family: 'Montserrat', em: 0.82 },
};

/** Active style, defaulting to the original look for episodes without one. */
export const S: Style = {
  hue: 220, harmony: 'triad', font: 'sora', transition: 'zoom', hud: 'ticker', motion: 'impact', camera: 'energetic', bpm: 120, progression: 0, key: 0,
};
export const HEAD = { family: 'Sora', em: 0.74 };

/** How the active world treats text and the frame. Filled by applyStyle. */
export const THEME = {
  world: 'neon' as NonNullable<Style['world']>,
  dark: true, // light worlds (editorial) use dark text on a light page
  ink: '#ffffff', // main text color for flat fills
  glow: 1, // 0 = no glow
  chroma: true, // RGB split on headline entry
  grain: 0.2,
  vignette: 0.75,
  page: '#02040b', // base background
};

export const variantOf = (type: string): 'A' | 'B' => {
  if (S.world && S.world !== 'neon') return 'B'; // the immersive sets carry their own neon backdrops
  return (S.variants?.[type as keyof NonNullable<Style['variants']>] as 'A' | 'B') ?? 'A';
};

export function applyStyle(tl: { palette?: Palette; style?: Style }) {
  if (tl.style) {
    Object.assign(S, tl.style);
    Object.assign(C, paletteFromHue(tl.style.hue, tl.style.harmony));
  } else {
    setPalette(tl.palette ?? 'electric');
  }
  Object.assign(HEAD, FONTS[S.font] ?? FONTS.sora);
  const w = S.world ?? 'neon';
  const page = {
    neon: C.bg,
    liquid: hslHex(S.hue, 45, 9),
    editorial: hslHex(S.hue, 28, 92),
    synthwave: hslHex(S.hue + 260, 70, 7),
    terminal: '#020403',
  }[w];
  Object.assign(THEME, {
    world: w,
    dark: w !== 'editorial',
    ink: w === 'editorial' ? '#111111' : w === 'terminal' ? C.cyan : '#ffffff',
    glow: { neon: 1, liquid: 0.45, editorial: 0, synthwave: 1.2, terminal: 0.8 }[w],
    chroma: w === 'neon' || w === 'synthwave' || w === 'terminal',
    grain: { neon: 0.2, liquid: 0.12, editorial: 0.28, synthwave: 0.18, terminal: 0.3 }[w],
    vignette: { neon: 0.75, liquid: 0.5, editorial: 0, synthwave: 0.6, terminal: 0.9 }[w],
    page,
  });
  if (w === 'terminal') Object.assign(HEAD, { family: 'JetBrains Mono', em: 0.62 });
  C.bg = page;
}

export const hslHex = (h: number, s: number, l: number) => hsl(h, s, l);

/** hex (#rrggbb) → rgba() string. */
export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}

export const TimelineCtx = createContext<Timeline | null>(null);
export const useTimeline = () => useContext(TimelineCtx)!;
export const useT = () => useCurrentFrame() / FPS;

// Strong ease-out curves: things arrive fast and settle, never linear.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.83, 0, 0.17, 1);

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** 0→1 progress of `dur` seconds starting at `start` seconds, eased. */
export const prog = (t: number, start: number, dur: number, ease = easeOut) =>
  interpolate(t, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

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

/** Energy from recent impacts: drives camera shake, zoom punch, flares. */
export function impactEnergy(sfx: Sfx[], t: number) {
  let e = 0;
  for (const im of sfx) {
    if (!['impact', 'slam', 'hit', 'pulse'].includes(im.type)) continue;
    const dt = t - im.at;
    if (dt >= 0 && dt < 1.2) {
      const w = im.type === 'impact' || im.type === 'slam' ? im.size ?? 1 : im.type === 'pulse' ? 0.6 : 0.35;
      e += w * Math.exp(-dt * 7);
    }
  }
  return e;
}

/** Cue i of a scene, or a spaced fallback when the voiceover has fewer phrases. */
export const cue = (cues: number[], i: number, spacing = 1.1) =>
  i < cues.length ? cues[i] : cues[cues.length - 1] + (i - cues.length + 1) * spacing;

/** Font size that keeps `text` within `maxW` px for a face whose average glyph is `em` wide. */
export const fit = (text: string, size: number, maxW = 960, em = 0.72) => Math.min(size, maxW / Math.max(1, text.length * em));
