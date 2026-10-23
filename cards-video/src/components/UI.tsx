import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {BODY, C, DISPLAY, ease, snap} from '../theme';

/* ---------- fonts ---------- */
let ready: Promise<unknown> | null = null;
const FACES: [string, string, number][] = [
  ['Oswald', 'oswald', 500],
  ['Oswald', 'oswald', 700],
  ['Golos Text', 'golos-text', 400],
  ['Golos Text', 'golos-text', 500],
  ['Golos Text', 'golos-text', 600],
  ['Golos Text', 'golos-text', 700],
];
const loadFonts = () => {
  if (ready) return ready;
  const loads: Promise<FontFace>[] = [];
  for (const [fam, file, w] of FACES) {
    for (const subset of ['latin', 'cyrillic']) {
      const ff = new FontFace(fam, `url(${staticFile(`fonts/${file}-${subset}-${w}-normal.woff2`)})`, {
        weight: String(w),
        unicodeRange: subset === 'latin' ? 'U+0000-00FF, U+2000-206F, U+20BD, U+2122' : 'U+0400-045F, U+0490-0491',
      });
      document.fonts.add(ff);
      loads.push(ff.load());
    }
  }
  ready = Promise.all(loads);
  return ready;
};
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    loadFonts().then(() => continueRender(h));
  }, [h]);
  return <>{children}</>;
};

/* ---------- seamless photo-studio cyclorama ---------- */
export const Studio: React.FC<{tint?: string; spot?: number}> = ({tint, spot = 0.55}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(to bottom, ${C.studio} 0%, ${C.studio} 52%, ${C.floor} 100%)`}}>
      {tint && <AbsoluteFill style={{background: tint, opacity: 0.12}} />}
      {/* softbox highlight */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 38% at 50% ${32 + Math.sin(f / 90) * 2}%, rgba(255,255,255,${spot}), transparent 70%)`}} />
      {/* horizon fade where wall meets floor */}
      <div style={{position: 'absolute', left: 0, right: 0, top: '58%', height: 220, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.05), transparent)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 60%, rgba(40,35,30,0.18) 100%)'}} />
    </AbsoluteFill>
  );
};

/* ---------- condensed display heading ---------- */
export const Head: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties}> = ({children, size, color = C.ink, style}) => (
  <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 0.95, letterSpacing: '-0.005em', textTransform: 'uppercase', color, ...style}}>{children}</div>
);

export const Body: React.FC<{children: React.ReactNode; size: number; color?: string; weight?: number; style?: React.CSSProperties}> = ({children, size, color = C.ink, weight = 500, style}) => (
  <div style={{fontFamily: BODY, fontWeight: weight, fontSize: size, color, lineHeight: 1.25, ...style}}>{children}</div>
);

/* ---------- lemon "sale" tag ---------- */
export const Tag: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties}> = ({children, bg = C.lemon, color = C.ink, size = 34, style}) => (
  <div style={{display: 'inline-block', background: bg, color, fontFamily: DISPLAY, fontWeight: 700, fontSize: size, textTransform: 'uppercase', padding: `${size * 0.18}px ${size * 0.45}px`, borderRadius: size * 0.22, ...style}}>{children}</div>
);

/* ---------- slide-up mask line ---------- */
export const Up: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 10);
  return (
    <div style={{overflow: 'hidden', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 105}%)`}}>{children}</div>
    </div>
  );
};

export const Snap: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number}> = ({at, children, style, from = 0.4}) => {
  const f = useCurrentFrame();
  const s = snap(f, at);
  return <div style={{transform: `scale(${from + (1 - from) * s})`, opacity: Math.min(1, s * 3), ...style}}>{children}</div>;
};

/* ---------- barcode-scanner laser line ---------- */
export const Laser: React.FC<{at: number; dur?: number; vertical?: boolean}> = ({at, dur = 16, vertical}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + dur, 0, 1, (x) => x);
  if (f < at || f > at + dur) return null;
  return (
    <div
      style={{
        position: 'absolute',
        ...(vertical ? {top: 0, bottom: 0, left: `${p * 100}%`, width: 6} : {left: 0, right: 0, top: `${p * 100}%`, height: 6}),
        background: C.red,
        boxShadow: `0 0 24px ${C.red}, 0 0 60px ${C.red}`,
      }}
    />
  );
};
