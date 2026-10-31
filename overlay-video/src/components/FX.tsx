import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {H, W, rand} from '../theme';

/* ---------- fonts ---------- */
let ready: Promise<unknown> | null = null;
const FACES: [string, string, number, 'normal' | 'italic', ('latin' | 'cyrillic')[]][] = [
  ['Cinzel', 'cinzel', 700, 'normal', ['latin']],
  ['Cinzel', 'cinzel', 900, 'normal', ['latin']],
  ['Playfair Display', 'playfair-display', 700, 'normal', ['latin', 'cyrillic']],
  ['Playfair Display', 'playfair-display', 900, 'normal', ['latin', 'cyrillic']],
  ['Playfair Display', 'playfair-display', 700, 'italic', ['latin', 'cyrillic']],
  ['Playfair Display', 'playfair-display', 900, 'italic', ['latin', 'cyrillic']],
  ['Cormorant Garamond', 'cormorant-garamond', 600, 'italic', ['latin', 'cyrillic']],
  ['Montserrat', 'montserrat', 500, 'normal', ['latin', 'cyrillic']],
  ['Montserrat', 'montserrat', 700, 'normal', ['latin', 'cyrillic']],
  ['Montserrat', 'montserrat', 800, 'normal', ['latin', 'cyrillic']],
];
const loadFonts = () => {
  if (ready) return ready;
  const loads: Promise<FontFace>[] = [];
  for (const [fam, file, w, style, subsets] of FACES) {
    for (const subset of subsets) {
      const ff = new FontFace(fam, `url(${staticFile(`fonts/${file}-${subset}-${w}-${style}.woff2`)})`, {
        weight: String(w),
        style,
        unicodeRange: subset === 'latin' ? 'U+0000-00FF, U+2000-206F' : 'U+0400-045F, U+0490-0491',
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

/* ---------- atmosphere ---------- */
export const Smoke: React.FC<{opacity?: number; speed?: number; tint?: string}> = ({opacity = 0.35, speed = 1, tint = 'rgba(255,200,190,1)'}) => {
  const f = useCurrentFrame();
  const layer = (img: string, size: number, vx: number, vy: number, o: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${staticFile(img)})`,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${f * vx * speed}px ${f * vy * speed}px`,
    opacity: o,
  });
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <div style={layer('img/fog0.png', 1400, 1.4, -0.5, 0.8)} />
      <div style={layer('img/fog1.png', 1000, -2, -0.3, 0.6)} />
      <AbsoluteFill style={{background: tint, mixBlendMode: 'multiply', opacity: 0.6}} />
    </AbsoluteFill>
  );
};

/** Out-of-focus light orbs (shallow depth of field). */
export const Bokeh: React.FC<{n?: number; seed?: number; color?: string; opacity?: number; minR?: number; maxR?: number}> = ({n = 16, seed = 1, color = '255,170,90', opacity = 0.6, minR = 40, maxR = 150}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(seed * 37 + i * 7.7 + k);
        const s = minR + r(1) * (maxR - minR);
        const x = r(2) * W + Math.sin(f / (40 + r(3) * 40) + i) * 30;
        const y = r(4) * H + Math.cos(f / (50 + r(5) * 40) + i) * 30;
        const fl = 0.6 + 0.4 * Math.sin(f / (4 + r(6) * 5) + i);
        return (
          <div
            key={i}
            style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: `radial-gradient(circle, rgba(${color},0.75) 0%, rgba(${color},0.35) 45%, rgba(${color},0.08) 68%, transparent 72%)`, opacity: fl, filter: 'blur(3px)'}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Particles: React.FC<{n?: number; seed?: number; color?: string; opacity?: number; rise?: number}> = ({n = 40, seed = 2, color = '255,200,120', opacity = 0.8, rise = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(seed * 53 + i * 9.1 + k);
        const life = 70 + r(1) * 120;
        const p = ((f * rise + r(2) * life) % life) / life;
        const x = r(3) * W + Math.sin(f / (18 + r(4) * 20) + i) * 40;
        const y = H * (0.2 + r(5) * 0.9) - p * 600;
        const s = 2 + r(6) * 6;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: `rgb(${color})`, opacity: Math.sin(p * Math.PI), boxShadow: `0 0 ${s * 3}px ${s}px rgba(${color},0.7)`}} />;
      })}
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{amount?: number}> = ({amount = 0.08}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: amount, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 71} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.7}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 62% at 50% 46%, transparent 45%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: 'none'}} />
);
/** Cinematic letterbox bars that breathe in on the drop. */
export const Bars: React.FC<{h: number}> = ({h}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#000'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#000'}} />
  </>
);
