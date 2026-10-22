import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, GRAD, H, T, W, clamp, ease, rand, springy} from '../theme';

/* ---------- fonts ---------- */
let ready: Promise<unknown> | null = null;
const loadFonts = () => {
  if (ready) return ready;
  const loads: Promise<FontFace>[] = [];
  for (const w of [600, 800, 900]) {
    for (const st of ['normal', 'italic']) {
      for (const subset of ['latin', 'cyrillic']) {
        const ff = new FontFace('Montserrat', `url(${staticFile(`fonts/montserrat-${subset}-${w}-${st}.woff2`)})`, {
          weight: String(w),
          style: st,
          unicodeRange: subset === 'latin' ? 'U+0000-00FF, U+2000-206F, U+2122' : 'U+0400-045F, U+0490-0491',
        });
        document.fonts.add(ff);
        loads.push(ff.load());
      }
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

/* ---------- animated liquid gradient background ---------- */
export const Liquid: React.FC<{hue?: number; speed?: number}> = ({hue = 0, speed = 1}) => {
  const f = useCurrentFrame() * speed;
  const blobs = [
    {c: C.pink, x: 30, y: 25, r: 70},
    {c: C.violet, x: 75, y: 40, r: 75},
    {c: C.orange, x: 20, y: 80, r: 60},
    {c: C.cyan, x: 85, y: 85, r: 45},
  ];
  return (
    <AbsoluteFill style={{background: C.base, filter: hue ? `hue-rotate(${hue}deg)` : undefined}}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x + Math.sin(f / (60 + i * 13) + i) * 14}%`,
            top: `${b.y + Math.cos(f / (70 + i * 11) + i * 2) * 10}%`,
            width: `${b.r}%`,
            height: `${b.r * 0.6}%`,
            transform: 'translate(-50%,-50%)',
            // soft blob via radial gradient (much cheaper than a CSS blur when rendering)
            background: `radial-gradient(closest-side, ${b.c}cc, ${b.c}55 55%, transparent 100%)`,
          }}
        />
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(10,0,30,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/* ---------- frosted glass card ---------- */
export const Glass: React.FC<{children: React.ReactNode; style?: React.CSSProperties; radius?: number; tint?: string}> = ({
  children,
  style,
  radius = 40,
  tint = C.glass,
}) => (
  <div
    style={{
      background: `linear-gradient(160deg, rgba(255,255,255,0.22), ${tint})`,
      border: `2px solid ${C.glassLine}`,
      borderRadius: radius,
      boxShadow: '0 30px 80px rgba(20,0,60,0.45), inset 0 2px 0 rgba(255,255,255,0.45)',
      ...style,
    }}
  >
    {children}
  </div>
);

/* ---------- italic display type, optional gradient fill ---------- */
export const Head: React.FC<{children: React.ReactNode; size: number; grad?: boolean; color?: string; style?: React.CSSProperties}> = ({
  children,
  size,
  grad,
  color = C.white,
  style,
}) => (
  <div
    style={{
      fontFamily: FONT,
      fontStyle: 'italic',
      fontWeight: 900,
      fontSize: size,
      lineHeight: 0.98,
      letterSpacing: '-0.03em',
      textTransform: 'uppercase',
      color: grad ? 'transparent' : color,
      background: grad ? GRAD : undefined,
      WebkitBackgroundClip: grad ? 'text' : undefined,
      backgroundClip: grad ? 'text' : undefined,
      filter: 'drop-shadow(0 8px 24px rgba(20,0,60,0.45))',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Text: React.FC<{children: React.ReactNode; size: number; color?: string; weight?: number; style?: React.CSSProperties}> = ({
  children,
  size,
  color = C.white,
  weight = 600,
  style,
}) => <div style={{fontFamily: FONT, fontWeight: weight, fontSize: size, color, lineHeight: 1.2, ...style}}>{children}</div>;

/* ---------- word-by-word kinetic caption (each word lands on its spoken frame) ---------- */
export const Caption: React.FC<{clip: string; from: number; to: number; sceneFrom: number; size?: number; hl?: number[]; style?: React.CSSProperties}> = ({
  clip,
  from,
  to,
  sceneFrom,
  size = 52,
  hl = [],
  style,
}) => {
  const f = useCurrentFrame();
  const words = T.words[clip].slice(from, to + 1);
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `4px ${size * 0.28}px`, ...style}}>
      {words.map(([w, at], k) => {
        const s = springy(f, at - sceneFrom - 2, 12, 220);
        const isHl = hl.includes(from + k);
        return (
          <span
            key={k}
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: size,
              color: isHl ? C.yellow : C.white,
              display: 'inline-block',
              transform: `translateY(${(1 - s) * 30}px) scale(${0.8 + s * 0.2})`,
              opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
              textShadow: '0 4px 18px rgba(20,0,60,0.6)',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- rising reaction emojis ---------- */
export const Reactions: React.FC<{count?: number; set?: string[]; rate?: number}> = ({count = 16, set = ['❤️', '🔥', '👍', '😍', '💯'], rate = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const period = 110 + rand(i) * 70;
        const p = (((f * rate + rand(i * 7) * period) % period) + period) % period / period;
        const x = W * (0.72 + rand(i * 3) * 0.24) + Math.sin(p * 9 + i) * 26;
        const y = H * (1.02 - p * 0.75);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 54 + rand(i * 5) * 34, opacity: Math.sin(p * Math.PI), transform: `scale(${0.6 + p * 0.6})`}}>
            {set[i % set.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- story progress bars (persistent social chrome) ---------- */
export const StoryBars: React.FC<{segments: {from: number; to: number}[]}> = ({segments}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top: 44, left: 36, right: 36, display: 'flex', gap: 10}}>
      {segments.map((s, i) => (
        <div key={i} style={{flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.3)', overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${interpolate(f, [s.from, s.to], [0, 100], clamp)}%`, background: C.white}} />
        </div>
      ))}
    </div>
  );
};

/* ---------- sparkles ---------- */
export const Sparkle: React.FC<{x: number; y: number; at: number; size?: number; color?: string}> = ({x, y, at, size = 60, color = C.yellow}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 18], [0, 1], clamp);
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${Math.sin(p * Math.PI) * 1.3}) rotate(${p * 90}deg)`, color, fontSize: size, lineHeight: 1}}>
      ✦
    </div>
  );
};

export const Rise: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number}> = ({at, children, style, dist = 80}) => {
  const f = useCurrentFrame();
  const s = springy(f, at);
  return <div style={{transform: `translateY(${(1 - s) * dist}px)`, opacity: ease(f, at, at + 8), ...style}}>{children}</div>;
};
