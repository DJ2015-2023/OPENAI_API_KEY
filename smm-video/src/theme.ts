import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// "Gradient glass pop": deep violet base, hot social-media gradients, frosted glass.
export const C = {
  base: '#1B0B3F',
  violet: '#6A2CFF',
  pink: '#FF2E93',
  orange: '#FF8A00',
  yellow: '#FFD84D',
  cyan: '#21E6FF',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.13)',
  glassLine: 'rgba(255,255,255,0.38)',
};
export const GRAD = `linear-gradient(100deg, ${C.yellow} 0%, ${C.orange} 30%, ${C.pink} 62%, ${C.violet} 100%)`;
export const FONT = "'Montserrat', sans-serif";

export type SceneKey = 'hook' | 'pro' | 'services' | 'platforms' | 'system' | 'cta';
export const T = timing as unknown as {
  fps: number;
  total: number;
  scenes: Record<SceneKey, {from: number; dur: number}>;
  clips: Record<string, {from: number; dur: number}>;
  words: Record<string, [string, number][]>;
  insert: {from: number; to: number};
};

/** Frame (relative to scene start) when word #i of clip is spoken. */
export const wf = (clip: string, i: number, scene: SceneKey) => T.words[clip][i][1] - T.scenes[scene].from;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});
export const springy = (f: number, start: number, damping = 13, stiffness = 150) =>
  spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass: 0.8}});
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
