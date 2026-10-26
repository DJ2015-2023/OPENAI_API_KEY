import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {H, W, rand} from '../theme';

/* ---------- fonts ---------- */
let ready: Promise<unknown> | null = null;
const FACES: [string, string, number, 'normal' | 'italic'][] = [
  ['Montserrat', 'montserrat', 300, 'normal'],
  ['Montserrat', 'montserrat', 500, 'normal'],
  ['Montserrat', 'montserrat', 700, 'normal'],
  ['Montserrat', 'montserrat', 800, 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond', 600, 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond', 500, 'italic'],
  ['Cormorant Garamond', 'cormorant-garamond', 600, 'italic'],
  ['Great Vibes', 'great-vibes', 400, 'normal'],
];
const loadFonts = () => {
  if (ready) return ready;
  const loads: Promise<FontFace>[] = [];
  for (const [fam, file, w, style] of FACES) {
    for (const subset of ['latin', 'cyrillic']) {
      const ff = new FontFace(fam, `url(${staticFile(`fonts/${file}-${subset}-${w}-${style}.woff2`)})`, {
        weight: String(w),
        style,
        unicodeRange: subset === 'latin' ? 'U+0000-00FF, U+2000-206F, U+20BD' : 'U+0400-045F, U+0490-0491',
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

/* ---------- film grain + vignette ---------- */
export const Grain: React.FC<{amount?: number}> = ({amount = 0.07}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: amount, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 89} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.6}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 65% at 50% 45%, transparent 50%, rgba(8,2,5,${strength}) 100%)`, pointerEvents: 'none'}} />
);

/** Drifting warm light leak (screen blend). `burst` 0..1 sweeps a big flare across for transitions. */
export const LightLeak: React.FC<{ambient?: number; burst?: number; seed?: number}> = ({ambient = 0.18, burst = 0, seed = 1}) => {
  const f = useCurrentFrame();
  const x = 50 + Math.sin(f / 70 + seed) * 40;
  const y = 30 + Math.cos(f / 90 + seed * 2) * 25;
  const bx = -40 + burst * 180;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <AbsoluteFill style={{opacity: ambient, background: `radial-gradient(ellipse 60% 45% at ${x}% ${y}%, rgba(255,150,170,0.9), rgba(255,120,80,0.35) 40%, transparent 70%)`}} />
      {burst > 0 && burst < 1 && (
        <AbsoluteFill
          style={{
            opacity: Math.sin(burst * Math.PI),
            background: `radial-gradient(ellipse 55% 80% at ${bx}% 50%, rgba(255,255,240,1), rgba(255,180,150,0.9) 25%, rgba(255,90,120,0.6) 50%, transparent 75%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/** Floating bokeh sparkles. */
export const Sparkles: React.FC<{n?: number; seed?: number; opacity?: number; color?: string}> = ({n = 26, seed = 2, opacity = 0.7, color = '255,220,210'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(seed * 71 + i * 9.3 + k);
        const life = 120 + r(1) * 160;
        const p = ((f + r(2) * life) % life) / life;
        const x = r(3) * W + Math.sin(f / (30 + r(4) * 30) + i) * 30;
        const y = H * (0.15 + r(5) * 0.85) - p * 260;
        const s = 3 + r(6) * 8;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / (5 + r(7) * 6) + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: `rgb(${color})`, opacity: Math.sin(p * Math.PI) * tw, boxShadow: `0 0 ${s * 3}px ${s}px rgba(${color},0.7)`}} />;
      })}
    </AbsoluteFill>
  );
};

/** Four-point star glint. */
export const Glint: React.FC<{x: number; y: number; size: number; p: number}> = ({x, y, size, p}) => {
  if (p <= 0 || p >= 1) return null;
  const s = Math.sin(p * Math.PI);
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, opacity: s, transform: `scale(${0.4 + 0.8 * s}) rotate(${p * 60}deg)`, mixBlendMode: 'screen'}}>
      <path d="M0 -50 C 4 -8 8 -4 50 0 C 8 4 4 8 0 50 C -4 8 -8 4 -50 0 C -8 -4 -4 -8 0 -50 Z" fill="#fff" style={{filter: 'drop-shadow(0 0 8px #ffd9e0)'}} />
    </svg>
  );
};
