import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// "Latin night couture": burgundy-black, crimson, rose and gold — an editorial luxury look.
export const C = {
  night: '#12030A',
  wine: '#3A0718',
  burgundy: '#6B0F2A',
  crimson: '#C8102E',
  rose: '#F2A7B5',
  gold: '#E8C27A',
  goldDeep: '#B8893B',
  cream: '#FFF4E6',
};
export const GOLD = `linear-gradient(100deg, #FBE7B5 0%, ${C.gold} 35%, ${C.goldDeep} 60%, #FBE7B5 100%)`;
export const SERIF = "'Playfair Display', serif";
export const SANS = "'Jost', sans-serif";

export type SceneKey = 'intro' | 'styles' | 'creator' | 'featuresA' | 'featuresB' | 'platform' | 'more' | 'offer' | 'cta';
export const T = timing as unknown as {
  fps: number;
  total: number;
  beat: number;
  scenes: Record<SceneKey, {from: number; dur: number}>;
  clips: Record<string, {from: number; dur: number}>;
  words: Record<string, [string, number][]>;
  insert: {from: number; to: number};
};

export const wf = (clip: string, i: number, scene: SceneKey) => T.words[clip][i][1] - T.scenes[scene].from;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});
export const silk = (f: number, start: number, damping = 18, stiffness = 90) =>
  spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass: 1}});
