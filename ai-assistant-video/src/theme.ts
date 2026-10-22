import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const C = {
  bg: '#04050d',
  bg2: '#0a0d24',
  cyan: '#27e8ff',
  violet: '#8d5cff',
  magenta: '#ff3d81',
  red: '#ff2e4d',
  green: '#3dffa2',
  gold: '#ffc94a',
  white: '#f4f7ff',
  dim: '#8a93b8',
};

export const FONT = "'Inter Display', 'Inter', sans-serif";

export type Phrase = {from: number; dur: number; text: string};
export type Scene = {from: number; dur: number};

export const T = timing as unknown as {
  fps: number;
  total: number;
  scenes: Record<'hook' | 'imagine' | 'channels' | 'features' | 'result', Scene>;
  phrases: Record<string, Phrase>;
  channelHits: number[];
};

// Phrase start relative to a scene start
export const rel = (phrase: string, scene: keyof typeof T.scenes) =>
  T.phrases[phrase].from - T.scenes[scene].from;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});

export const pop = (f: number, start: number, damping = 12, stiffness = 140) =>
  spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass: 0.8}});

// Deterministic pseudo random
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Smooth noise for handheld camera
export const noise1 = (t: number, seed: number) =>
  Math.sin(t * 0.9 + seed) * 0.5 + Math.sin(t * 2.3 + seed * 1.7) * 0.3 + Math.sin(t * 5.1 + seed * 3.1) * 0.2;
