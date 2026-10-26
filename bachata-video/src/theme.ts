import type React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// "Lady Style": ink black, deep wine, blush pink and a rose-gold accent; ivory type.
export const C = {
  ink: '#0B0608',
  wine: '#4A0E24',
  red: '#E8304F',
  rose: '#F4B6C2',
  blush: '#FADADD',
  ivory: '#FFF4EE',
  gold: '#E9C4A0',
};
export const SANS = "'Montserrat', sans-serif";
export const SERIF = "'Cormorant Garamond', serif";
export const SCRIPT = "'Great Vibes', cursive";

export const roseGold: React.CSSProperties = {
  background: 'linear-gradient(180deg, #FFF1E6 0%, #F2C9B0 35%, #C98E73 60%, #FBE0CF 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

export type SectionKey = 'shoot' | 'intro' | 'tagline' | 'notjust' | 'expect' | 'song' | 'schedule' | 'price' | 'why' | 'cta' | 'outro';
export type Segment = {clip: string; src: number; from: number; dur: number; section: SectionKey};
export const T = timing as unknown as {
  fps: number;
  total: number;
  beat: number;
  beats: number[];
  sections: Record<SectionKey, {from: number; dur: number; beat0: number}>;
  segments: Segment[];
};

/** Frame (relative to the section) of beat `i` counted from the section's first beat. */
export const bf = (section: SectionKey, i: number) => {
  const s = T.sections[section];
  const idx = Math.min(T.beats.length - 1, s.beat0 + i);
  return T.beats[idx] - s.from;
};
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});
export const snap = (f: number, start: number, damping = 14, stiffness = 170) =>
  spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass: 0.7}});
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** 1 on every beat of the track (absolute frame), decaying over ~1/3 beat. */
export const pulse = (abs: number) => {
  let last = -999;
  for (const b of T.beats) {
    if (b > abs) break;
    last = b;
  }
  return Math.exp(-(abs - last) / 3.2);
};
