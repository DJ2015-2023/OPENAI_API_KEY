import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// Bright "sunny clay" palette — deliberately the opposite of a dark neon look.
export const C = {
  cream: '#F6F1E7',
  paper: '#FFFDF8',
  ink: '#121212',
  orange: '#FF5A1F',
  cobalt: '#2B3BFF',
  lime: '#C8F53C',
  pink: '#FF9BD2',
  sky: '#8FD3FF',
  night: '#141A3A',
  grey: '#8B8578',
};

export const DISPLAY = "'Unbounded', sans-serif";
export const BODY = "'Manrope', sans-serif";

type SceneKey = 'question' | 'instant' | 'platforms' | 'features' | 'industries' | 'mission' | 'custom' | 'cta';
export const T = timing as unknown as {
  fps: number;
  total: number;
  beat: number;
  scenes: Record<SceneKey, {from: number; dur: number}>;
  clips: Record<string, {from: number; dur: number}>;
  words: Record<string, [string, number][]>;
};
export type {SceneKey};

/** Frame (relative to scene start) at which word #i of a narration clip is spoken. */
export const wf = (clip: string, i: number, scene: SceneKey) => T.words[clip][i][1] - T.scenes[scene].from;
/** Frame (relative to scene start) at which a clip starts. */
export const cf = (clip: string, scene: SceneKey) => T.clips[clip].from - T.scenes[scene].from;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});

export const bounce = (f: number, start: number, damping = 10, stiffness = 160) =>
  spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass: 0.7}});

export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
