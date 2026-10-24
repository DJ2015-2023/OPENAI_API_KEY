import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// "Latin Noir Halloween": ink-black night, blood red passion, pumpkin fire, bone white type.
export const C = {
  night: '#07040B',
  plum: '#1C0A26',
  violet: '#4B1670',
  blood: '#E0102F',
  crimson: '#8E0018',
  pumpkin: '#FF6A00',
  ember: '#FFB347',
  gold: '#E8C27A',
  bone: '#F3E9DC',
  smoke: '#9C8FA8',
  neon: '#FF2D55',
};
export const HORROR = "'Rubik Wet Paint', 'Unbounded', sans-serif";
export const GLITCH = "'Rubik Glitch', 'Unbounded', sans-serif";
export const SERIF = "'Cormorant Garamond', serif";
export const DISPLAY = "'Unbounded', sans-serif";
export const COND = "'Oswald', sans-serif";

export type SceneKey = 'hook' | 'night' | 'city' | 'forget' | 'temple' | 'title' | 'vibes' | 'come' | 'info' | 'book' | 'finale' | 'end';
export const T = timing as unknown as {
  fps: number;
  total: number;
  beat: number;
  phase: number;
  drops: number[];
  scenes: Record<SceneKey, {from: number; dur: number}>;
  clips: Record<string, {from: number; dur: number}>;
  words: Record<string, [string, number][]>;
};

/** Frame (relative to `scene`) at which word `i` of `clip` is spoken. */
export const wf = (clip: string, i: number, scene: SceneKey) => T.words[clip][i][1] - T.scenes[scene].from;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});
export const snap = (f: number, start: number, damping = 14, stiffness = 200) =>
  spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass: 0.7}});
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** 1 on every kick of the song (absolute frame), decaying over ~a quarter beat. Zero before the first drop. */
export const kick = (abs: number, from = T.drops[0]) => {
  if (abs < from - 1) return 0;
  const p = (((abs - T.phase) % T.beat) + T.beat) % T.beat;
  return Math.exp(-p / 2.6);
};
/** Small deterministic camera shake. */
export const shake = (f: number, amt: number, seed = 1) => ({
  x: (rand(Math.floor(f) * 1.7 + seed) - 0.5) * 2 * amt,
  y: (rand(Math.floor(f) * 2.3 + seed + 9) - 0.5) * 2 * amt,
});
