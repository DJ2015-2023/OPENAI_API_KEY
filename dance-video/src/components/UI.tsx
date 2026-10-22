import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, GOLD, SANS, SERIF, ease, silk} from '../theme';
import {Ribbons} from './Ribbons';

/* ---------- fonts ---------- */
let ready: Promise<unknown> | null = null;
const FACES: [string, string, number, string][] = [
  ['Playfair Display', 'playfair-display', 700, 'normal'],
  ['Playfair Display', 'playfair-display', 700, 'italic'],
  ['Playfair Display', 'playfair-display', 900, 'normal'],
  ['Playfair Display', 'playfair-display', 900, 'italic'],
  ['Jost', 'jost', 400, 'normal'],
  ['Jost', 'jost', 500, 'normal'],
  ['Jost', 'jost', 600, 'normal'],
];
const loadFonts = () => {
  if (ready) return ready;
  const loads: Promise<FontFace>[] = [];
  for (const [fam, file, w, st] of FACES) {
    for (const subset of ['latin', 'cyrillic']) {
      const ff = new FontFace(fam, `url(${staticFile(`fonts/${file}-${subset}-${w}-${st}.woff2`)})`, {
        weight: String(w),
        style: st,
        unicodeRange: subset === 'latin' ? 'U+0000-00FF, U+2000-206F, U+2122' : 'U+0400-045F, U+0490-0491',
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

/* ---------- night stage with generative ribbons ---------- */
export const Stage: React.FC<{offset: number; intensity?: number; spot?: string}> = ({offset, intensity = 1, spot = '50% 38%'}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at ${spot}, ${C.wine} 0%, ${C.night} 72%)`}}>
    <Ribbons offset={offset} intensity={intensity} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(6,0,3,0.7) 100%)'}} />
  </AbsoluteFill>
);

/* ---------- editorial serif title, optional gold foil ---------- */
export const Serif: React.FC<{children: React.ReactNode; size: number; gold?: boolean; italic?: boolean; color?: string; weight?: number; style?: React.CSSProperties}> = ({
  children,
  size,
  gold,
  italic,
  color = C.cream,
  weight = 900,
  style,
}) => (
  <div
    style={{
      fontFamily: SERIF,
      fontWeight: weight,
      fontStyle: italic ? 'italic' : 'normal',
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: '-0.01em',
      color: gold ? 'transparent' : color,
      background: gold ? GOLD : undefined,
      WebkitBackgroundClip: gold ? 'text' : undefined,
      backgroundClip: gold ? 'text' : undefined,
      textShadow: gold ? undefined : '0 6px 30px rgba(0,0,0,0.6)',
      filter: gold ? 'drop-shadow(0 6px 22px rgba(0,0,0,0.55))' : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Sans: React.FC<{children: React.ReactNode; size: number; color?: string; weight?: number; spacing?: string; style?: React.CSSProperties}> = ({
  children,
  size,
  color = C.cream,
  weight = 500,
  spacing = '0.02em',
  style,
}) => <div style={{fontFamily: SANS, fontWeight: weight, fontSize: size, color, letterSpacing: spacing, lineHeight: 1.25, ...style}}>{children}</div>;

/* ---------- thin gold rule that draws itself ---------- */
export const Rule: React.FC<{at: number; width?: number; style?: React.CSSProperties}> = ({at, width = 260, style}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 18);
  return <div style={{height: 3, width: width * p, background: GOLD, margin: '0 auto', borderRadius: 2, ...style}} />;
};

/* ---------- elegant reveal: rise + unblur ---------- */
export const Reveal: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; y?: number}> = ({at, children, style, y = 60}) => {
  const f = useCurrentFrame();
  const s = silk(f, at);
  return (
    <div style={{transform: `translateY(${(1 - s) * y}px)`, opacity: ease(f, at, at + 12), filter: `blur(${(1 - Math.min(1, s)) * 10}px)`, ...style}}>
      {children}
    </div>
  );
};

/* ---------- mask wipe reveal (left -> right), like a curtain ---------- */
export const Wipe: React.FC<{at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, dur = 16, children, style}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + dur);
  return <div style={{clipPath: `inset(-10% ${100 - p * 100}% -10% -10%)`, ...style}}>{children}</div>;
};

/* ---------- gold check item ---------- */
export const CheckItem: React.FC<{at: number; text: string; active?: boolean; size?: number}> = ({at, text, active, size = 40}) => {
  const f = useCurrentFrame();
  const s = silk(f, at, 14, 140);
  const draw = ease(f, at + 2, at + 12);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: ease(f, at, at + 8) * (active === false ? 0.55 : 1), transform: `translateX(${(1 - s) * -80}px)`}}>
      <div
        style={{
          width: size * 1.35,
          height: size * 1.35,
          flexShrink: 0,
          borderRadius: '50%',
          border: `3px solid ${C.gold}`,
          background: active ? 'rgba(232,194,122,0.18)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24">
          <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={C.gold} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
        </svg>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: size, color: C.cream, lineHeight: 1.15}}>{text}</div>
    </div>
  );
};

/* ---------- dancing couple silhouette (vector, used on the mock website) ---------- */
export const Couple: React.FC<{size: number; color?: string}> = ({size, color = C.cream}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill={color}>
    {/* lead */}
    <circle cx="82" cy="34" r="12" />
    <path d="M74 50c-8 6-12 18-13 32l-6 32 8 2 7-28 4 20-6 64h10l8-56 8 56h10l-6-70 2-26c10 6 20 6 28 2l-2-8c-10 2-18 0-26-8-6-8-14-12-27-12z" />
    {/* follow, leaning back with a flowing skirt */}
    <circle cx="132" cy="44" r="11" />
    <path d="M124 58c-6 4-8 12-8 20l2 22-20 46c14 8 34 10 52 4l-14-48 2-26 18-18-6-6-16 14c-2-6-6-8-10-8z" />
    <path d="M118 140c-6 18-4 34 2 52h8l2-48zM140 140l10 50h8l-4-52z" />
  </svg>
);
