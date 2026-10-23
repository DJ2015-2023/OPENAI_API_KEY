import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// "Product studio": seamless light-grey cyclorama, graphite type, electric violet + acid lemon accents.
export const C = {
  studio: '#ECEAE6',
  floor: '#D6D2CB',
  ink: '#141414',
  graphite: '#2A2A2E',
  violet: '#6C2BFF',
  violetSoft: '#B9A1FF',
  lemon: '#E4FF3A',
  red: '#FF3B30',
  white: '#FFFFFF',
  grey: '#9A968F',
};
export const DISPLAY = "'Oswald', sans-serif";
export const BODY = "'Golos Text', sans-serif";
/** Bottom band reserved for the HyperFrames karaoke captions overlay. */
export const CAPTION_TOP = 1480;

export type SceneKey = 'hook' | 'seconds' | 'build' | 'includesA' | 'includesB' | 'platforms' | 'goal';
export const T = timing as unknown as {
  fps: number;
  total: number;
  beat: number;
  scenes: Record<SceneKey, {from: number; dur: number}>;
  clips: Record<string, {from: number; dur: number}>;
  words: Record<string, [string, number][]>;
};

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
