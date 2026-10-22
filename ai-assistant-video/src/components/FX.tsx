import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, FONT, FPS, H, W, clamp, ease, noise1, pop, rand} from '../theme';

/* ---------- Background: deep gradient + perspective grid floor ---------- */
export const CyberBackground: React.FC<{hue?: string; gridSpeed?: number; intensity?: number}> = ({
  hue = C.violet,
  gridSpeed = 1,
  intensity = 1,
}) => {
  const f = useCurrentFrame();
  const scroll = (f * 4 * gridSpeed) % 120;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 35%, ${C.bg2} 0%, ${C.bg} 60%, #000 100%)`}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 42%, ${hue}55 0%, transparent 70%)`,
          opacity: 0.7 * intensity + Math.sin(f / 20) * 0.1,
        }}
      />
      {/* floor grid */}
      <div
        style={{
          position: 'absolute',
          left: -W,
          width: W * 3,
          top: H * 0.62,
          height: H * 1.2,
          transformOrigin: '50% 0%',
          transform: 'perspective(700px) rotateX(72deg)',
          backgroundImage: `linear-gradient(${hue}aa 2px, transparent 2px), linear-gradient(90deg, ${hue}aa 2px, transparent 2px)`,
          backgroundSize: '120px 120px',
          backgroundPosition: `0px ${scroll}px`,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)',
          opacity: 0.45 * intensity,
        }}
      />
      {/* ceiling grid (mirror) */}
      <div
        style={{
          position: 'absolute',
          left: -W,
          width: W * 3,
          bottom: H * 0.78,
          height: H * 1.0,
          transformOrigin: '50% 100%',
          transform: 'perspective(700px) rotateX(-72deg)',
          backgroundImage: `linear-gradient(${C.cyan}66 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}66 1px, transparent 1px)`,
          backgroundSize: '120px 120px',
          backgroundPosition: `0px ${-scroll}px`,
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)',
          opacity: 0.25 * intensity,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- Floating bokeh / dust particles with depth ---------- */
export const Particles: React.FC<{count?: number; color?: string; speed?: number}> = ({
  count = 60,
  color = C.cyan,
  speed = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const z = rand(i * 3.1);
        const size = 3 + z * 14;
        const x = (rand(i * 7.7) * W + Math.sin(f / 40 + i) * 30 * z) % W;
        const y = ((rand(i * 1.3) * H - f * (0.6 + z * 2.4) * speed) % H + H) % H;
        const blur = z > 0.75 ? (z - 0.75) * 30 : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: i % 5 === 0 ? C.magenta : color,
              opacity: 0.25 + z * 0.55,
              filter: `blur(${blur}px)`,
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Film grain + vignette + scanlines (cinematic finish) ---------- */
export const FilmFinish: React.FC = () => {
  const f = useCurrentFrame();
  const seed = f % 8;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', opacity: 0.13, mixBlendMode: 'overlay'}}>
        <filter id={`grain${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
      </svg>
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 2px, transparent 4px)',
          opacity: 0.35,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.75) 100%)'}} />
      {/* anamorphic letterbox hint */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 26, background: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 26, background: '#000'}} />
    </AbsoluteFill>
  );
};

/* ---------- Light leak sweep ---------- */
export const LightLeak: React.FC<{start: number; dur?: number; color?: string}> = ({start, dur = 24, color = C.magenta}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, start + dur], [0, 1], clamp);
  if (p <= 0 || p >= 1) return null;
  const o = Math.sin(p * Math.PI);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: 'screen',
        opacity: o * 0.9,
        background: `radial-gradient(40% 60% at ${-20 + p * 140}% ${30 + p * 30}%, ${color} 0%, ${C.gold}88 30%, transparent 70%)`,
        filter: 'blur(30px)',
      }}
    />
  );
};

/* ---------- Full-frame flash ---------- */
export const Flash: React.FC<{at: number; dur?: number; color?: string}> = ({at, dur = 10, color = '#fff'}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + dur], [0, 1, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: o, mixBlendMode: 'screen'}} />;
};

/* ---------- Shockwave ring ---------- */
export const Shockwave: React.FC<{at: number; x?: number; y?: number; color?: string; dur?: number}> = ({
  at,
  x = W / 2,
  y = H / 2,
  color = C.cyan,
  dur = 26,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], {...clamp});
  if (p <= 0 || p >= 1) return null;
  const r = 40 + p * 1400;
  return (
    <>
      {[0, 0.12].map((d, i) => {
        const pp = Math.max(0, p - d);
        const rr = 40 + pp * 1400;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - rr,
              top: y - rr,
              width: rr * 2,
              height: rr * 2,
              borderRadius: '50%',
              border: `${(1 - pp) * 26 + 2}px solid ${color}`,
              opacity: (1 - pp) * 0.9,
              boxShadow: `0 0 60px ${color}, inset 0 0 60px ${color}`,
            }}
          />
        );
      })}
      <div style={{display: 'none'}}>{r}</div>
    </>
  );
};

/* ---------- Camera rig: push-in, roll, handheld drift, shake ---------- */
export const Camera: React.FC<{
  children: React.ReactNode;
  zoom?: [number, number];
  dur: number;
  rotate?: [number, number];
  shake?: (f: number) => number;
  tilt?: [number, number];
  handheld?: number;
}> = ({children, zoom = [1, 1.08], dur, rotate = [0, 0], shake, tilt = [0, 0], handheld = 1}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const z = ease(f, 0, dur, zoom[0], zoom[1], (x) => x);
  const r = ease(f, 0, dur, rotate[0], rotate[1], (x) => x);
  const tl = ease(f, 0, dur, tilt[0], tilt[1], (x) => x);
  const s = shake ? shake(f) : 0;
  const hx = noise1(t, 1) * 6 * handheld + (random(`sx${f}`) - 0.5) * 40 * s;
  const hy = noise1(t, 7) * 6 * handheld + (random(`sy${f}`) - 0.5) * 40 * s;
  const hr = noise1(t, 3) * 0.3 * handheld + (random(`sr${f}`) - 0.5) * 2 * s;
  return (
    <AbsoluteFill style={{perspective: 1600, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${hx}px, ${hy}px) scale(${z}) rotate(${r + hr}deg) rotateX(${tl}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- Kinetic word-by-word reveal ---------- */
export const WordReveal: React.FC<{
  text: string;
  start: number;
  perWord?: number;
  size?: number;
  color?: string;
  weight?: number;
  highlight?: Record<string, string>;
  style?: React.CSSProperties;
  align?: 'center' | 'left';
  lineHeight?: number;
}> = ({text, start, perWord = 3, size = 84, color = C.white, weight = 800, highlight = {}, style, align = 'center', lineHeight = 1.08}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight,
        letterSpacing: '-0.02em',
        textAlign: align,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: `0 ${size * 0.26}px`,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const s = pop(f, start + i * perWord, 14, 170);
        const clean = w.replace(/[.,!?]/g, '');
        const hc = highlight[clean];
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
              transform: `translateY(${(1 - s) * 60}px) scale(${0.7 + s * 0.3}) rotateX(${(1 - s) * -70}deg)`,
              filter: `blur(${(1 - Math.min(1, s)) * 14}px)`,
              color: hc ?? color,
              textShadow: hc ? `0 0 30px ${hc}, 0 0 80px ${hc}88` : '0 6px 30px rgba(0,0,0,0.6)',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- RGB split glitch text ---------- */
export const GlitchText: React.FC<{
  text: string;
  size: number;
  color?: string;
  strength?: number;
  style?: React.CSSProperties;
}> = ({text, size, color = C.white, strength = 1, style}) => {
  const f = useCurrentFrame();
  const burst = random(`g${Math.floor(f / 3)}`) > 0.6 ? 1 : 0.15;
  const k = strength * burst;
  const dx = (random(`gx${f}`) - 0.5) * 24 * k;
  const sliceY = random(`gy${Math.floor(f / 2)}`) * 100;
  const base: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    fontFamily: FONT,
    fontSize: size,
    fontWeight: 900,
    letterSpacing: '-0.03em',
    lineHeight: 1,
    textAlign: 'center',
    whiteSpace: 'pre-line',
  };
  return (
    <div style={{position: 'relative', ...style}}>
      <div style={{...base, position: 'relative', color, visibility: 'hidden'}}>{text}</div>
      <div style={{...base, color: C.cyan, transform: `translateX(${-6 * k - dx}px)`, mixBlendMode: 'screen', opacity: 0.85}}>{text}</div>
      <div style={{...base, color: C.red, transform: `translateX(${6 * k + dx}px)`, mixBlendMode: 'screen', opacity: 0.85}}>{text}</div>
      <div style={{...base, color, textShadow: `0 0 40px ${C.red}88`}}>{text}</div>
      {k > 0.5 && (
        <div
          style={{
            ...base,
            color,
            clipPath: `inset(${sliceY}% 0 ${Math.max(0, 100 - sliceY - 12)}% 0)`,
            transform: `translateX(${dx * 2.5}px)`,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

/* ---------- Glow line / beam ---------- */
export const Beam: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; color: string; width?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  color,
  width = 6,
}) => {
  const f = useCurrentFrame();
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const pulse = ((f * 0.04) % 1) * len;
  return (
    <div
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - width / 2,
        width: len * p,
        height: width,
        transformOrigin: '0 50%',
        transform: `rotate(${ang}deg)`,
        background: `linear-gradient(90deg, ${color}, ${C.white})`,
        boxShadow: `0 0 20px ${color}, 0 0 50px ${color}`,
        borderRadius: width,
      }}
    >
      {p >= 1 && (
        <div
          style={{
            position: 'absolute',
            left: pulse - 30,
            top: -width,
            width: 60,
            height: width * 3,
            borderRadius: 20,
            background: '#fff',
            filter: 'blur(4px)',
          }}
        />
      )}
    </div>
  );
};

export const Txt: React.FC<{children: React.ReactNode; size: number; color?: string; weight?: number; style?: React.CSSProperties}> = ({
  children,
  size,
  color = C.white,
  weight = 800,
  style,
}) => (
  <div style={{fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: '-0.02em', lineHeight: 1.05, ...style}}>
    {children}
  </div>
);
