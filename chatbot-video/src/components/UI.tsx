import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BODY, C, DISPLAY, H, T, W, bounce, clamp, ease, rand} from '../theme';

/* ---------- fonts (Unbounded + Manrope, cyrillic + latin) ---------- */
const FACES: [string, string, number][] = [
  ['Unbounded', 'unbounded', 700],
  ['Unbounded', 'unbounded', 800],
  ['Unbounded', 'unbounded', 900],
  ['Manrope', 'manrope', 500],
  ['Manrope', 'manrope', 600],
  ['Manrope', 'manrope', 700],
  ['Manrope', 'manrope', 800],
];
let fontsReady: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsReady) return fontsReady;
  const loads: Promise<FontFace>[] = [];
  for (const [family, file, weight] of FACES) {
    for (const subset of ['latin', 'cyrillic']) {
      const ff = new FontFace(family, `url(${staticFile(`fonts/${file}-${subset}-${weight}-normal.woff2`)})`, {
        weight: String(weight),
        unicodeRange: subset === 'latin' ? 'U+0000-00FF, U+2000-206F, U+20AC, U+2122' : 'U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
      });
      document.fonts.add(ff);
      loads.push(ff.load());
    }
  }
  fontsReady = Promise.all(loads);
  return fontsReady;
};
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    loadFonts().then(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};

/* ---------- paper background with dot grid ---------- */
export const Paper: React.FC<{color?: string; dots?: string; drift?: number}> = ({color = C.cream, dots = '#00000014', drift = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: color}}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${dots} 3px, transparent 3.5px)`,
          backgroundSize: '54px 54px',
          backgroundPosition: `${(f * 0.6 * drift) % 54}px ${(f * 0.9 * drift) % 54}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- paper grain + soft vignette ---------- */
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = f % 6;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', opacity: 0.09, mixBlendMode: 'multiply'}}>
        <filter id={`pg${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pg${seed})`} />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 62%, rgba(60,40,10,0.18) 100%)'}} />
    </AbsoluteFill>
  );
};

/* ---------- neo-brutalist card: thick ink border + hard offset shadow ---------- */
export const Card: React.FC<{
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
  shadow?: number;
  radius?: number;
}> = ({children, bg = C.paper, style, shadow = 12, radius = 34}) => (
  <div
    style={{
      background: bg,
      border: `5px solid ${C.ink}`,
      borderRadius: radius,
      boxShadow: `${shadow}px ${shadow}px 0 ${C.ink}`,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ---------- display text ---------- */
export const Big: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties; weight?: number}> = ({
  children,
  size,
  color = C.ink,
  style,
  weight = 900,
}) => (
  <div style={{fontFamily: DISPLAY, fontWeight: weight, fontSize: size, color, lineHeight: 0.98, letterSpacing: '-0.02em', textTransform: 'uppercase', ...style}}>
    {children}
  </div>
);

export const Body: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties; weight?: number}> = ({
  children,
  size,
  color = C.ink,
  style,
  weight = 700,
}) => <div style={{fontFamily: BODY, fontWeight: weight, fontSize: size, color, lineHeight: 1.2, ...style}}>{children}</div>;

/* ---------- mask-up line reveal (text slides up out of a slot) ---------- */
export const SlotLine: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dir?: 1 | -1}> = ({at, children, style, dir = 1}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 12, 0, 1);
  return (
    <div style={{overflow: 'hidden', paddingBottom: 6, ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 110 * dir}%) rotate(${(1 - p) * 4}deg)`}}>{children}</div>
    </div>
  );
};

/* ---------- marker highlight sweeping behind a word ---------- */
export const Marker: React.FC<{at: number; color?: string; children: React.ReactNode; dur?: number}> = ({at, color = C.lime, children, dur = 10}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + dur);
  return (
    <span style={{position: 'relative', display: 'inline-block', zIndex: 0}}>
      <span
        style={{
          position: 'absolute',
          left: -10,
          right: -10,
          top: '18%',
          bottom: '8%',
          background: color,
          zIndex: -1,
          transformOrigin: '0 50%',
          transform: `scaleX(${p}) skewX(-8deg)`,
          borderRadius: 8,
        }}
      />
      {children}
    </span>
  );
};

/* ---------- sticker pill ---------- */
export const Pill: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties}> = ({
  children,
  bg = C.ink,
  color = C.paper,
  size = 34,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: `${size * 0.36}px ${size * 0.8}px`,
      borderRadius: 999,
      background: bg,
      color,
      border: `4px solid ${C.ink}`,
      fontFamily: BODY,
      fontWeight: 800,
      fontSize: size,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

/* ---------- confetti burst (deterministic) ---------- */
export const Confetti: React.FC<{at: number; x?: number; y?: number; n?: number}> = ({at, x = W / 2, y = H / 2, n = 40}) => {
  const f = useCurrentFrame();
  const t = (f - at) / 30;
  if (t < 0 || t > 1.6) return null;
  const cols = [C.orange, C.cobalt, C.lime, C.pink, C.sky];
  return (
    <>
      {new Array(n).fill(0).map((_, i) => {
        const a = rand(i * 3.7) * Math.PI * 2;
        const v = 500 + rand(i * 1.1) * 900;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 900 * t * t;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: 18,
              height: i % 3 === 0 ? 18 : 34,
              borderRadius: i % 3 === 0 ? 9 : 4,
              background: cols[i % cols.length],
              border: `3px solid ${C.ink}`,
              transform: `rotate(${t * 720 * (rand(i) - 0.5)}deg)`,
              opacity: interpolate(t, [1.2, 1.6], [1, 0], clamp),
            }}
          />
        );
      })}
    </>
  );
};

/* ---------- beat-synced "zoom punch" camera ---------- */
export const Punch: React.FC<{children: React.ReactNode; hits: number[]; amount?: number; drift?: [number, number]; dur: number}> = ({
  children,
  hits,
  amount = 0.05,
  drift = [1, 1.04],
  dur,
}) => {
  const f = useCurrentFrame();
  let k = 0;
  for (const h of hits) {
    const d = f - h;
    if (d >= 0 && d < 12) k = Math.max(k, Math.exp(-d / 3.5));
  }
  const base = interpolate(f, [0, dur], drift, clamp);
  return <AbsoluteFill style={{transform: `scale(${base + k * amount})`}}>{children}</AbsoluteFill>;
};

export const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number; rot?: number}> = ({
  at,
  children,
  style,
  from = 0,
  rot = 0,
}) => {
  const f = useCurrentFrame();
  const s = bounce(f, at);
  return (
    <div style={{transform: `scale(${from + (1 - from) * s}) rotate(${(1 - s) * rot}deg)`, opacity: Math.min(1, s * 3), ...style}}>{children}</div>
  );
};

export const beatFrames = (from: number, to: number) => {
  const out: number[] = [];
  for (let b = Math.ceil(from / T.beat) * T.beat; b < to; b += T.beat) out.push(Math.round(b));
  return out;
};
