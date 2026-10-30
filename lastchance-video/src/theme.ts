import type React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 24;
export const W = 1080;
export const H = 1920;

// Black · crimson · gold. Luxurious Halloween night.
export const C = {
  ink: '#050304',
  crimson: '#B3001B',
  blood: '#E0102F',
  ember: '#FFB45A',
  gold: '#E7C27D',
  ivory: '#F8EEE4',
  smoke: '#A89AA5',
};
export const LUX = "'Cinzel', serif"; // Latin display caps
export const SERIF = "'Playfair Display', serif"; // Cyrillic display
export const ITALIC = "'Cormorant Garamond', serif";
export const SANS = "'Montserrat', 'Inter', sans-serif";

export const gold: React.CSSProperties = {
  background: 'linear-gradient(180deg, #FFF6D8 0%, #F1CF84 30%, #B9832E 55%, #F7DC9A 75%, #9C6A22 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

export type SceneKey = 'hook' | 'logo' | 'today' | 'price' | 'ladder' | 'why' | 'vibes' | 'info' | 'cta' | 'final';
export const T = timing as unknown as {
  fps: number;
  total: number;
  drop: number;
  beat: number;
  phase: number;
  stop: [number, number];
  scenes: Record<SceneKey, {from: number; dur: number}>;
  words: Record<string, [string, number][]>;
};
/** Frame (relative to `scene`) of word `i` of voiceover clip `vo`. */
export const wf = (vo: string, i: number, scene: SceneKey) => T.words[vo][i][1] - T.scenes[scene].from;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});
export const snap = (f: number, start: number, damping = 14, stiffness = 170) =>
  spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass: 0.7}});
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** 1 on every beat once the drop hits (absolute frame). */
export const kick = (abs: number) => {
  if (abs < T.drop - 1) return 0;
  const p = (((abs - T.phase) % T.beat) + T.beat) % T.beat;
  return Math.exp(-p / 2.4);
};
/** Smooth hand-held camera drift (deterministic). */
export const handheld = (f: number, amt: number, seed = 1) => ({
  x: (Math.sin(f / 7.3 + seed) + 0.5 * Math.sin(f / 3.1 + seed * 2)) * amt,
  y: (Math.cos(f / 6.1 + seed * 3) + 0.5 * Math.sin(f / 2.7 + seed)) * amt,
  r: Math.sin(f / 9.7 + seed) * amt * 0.06,
});
