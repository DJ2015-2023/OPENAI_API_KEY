import React from 'react';
import {AbsoluteFill, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const GOLD = '#e9c27a';
export const GOLD_DEEP = '#b8862f';
export const BLOOD = '#c4102a';
export const INK = '#07050a';

export const FontFaces: React.FC = () => (
  <style>{`
    @font-face { font-family: 'Playfair'; src: url('${staticFile('fonts/PlayfairDisplay[wght].ttf')}'); font-weight: 400 900; }
    @font-face { font-family: 'Playfair'; font-style: italic; src: url('${staticFile('fonts/PlayfairDisplay-Italic[wght].ttf')}'); font-weight: 400 900; }
    @font-face { font-family: 'Oswald'; src: url('${staticFile('fonts/Oswald[wght].ttf')}'); font-weight: 200 700; }
    @font-face { font-family: 'Cinzel Deco'; src: url('${staticFile('fonts/CinzelDecorative-Bold.ttf')}'); }
    @font-face { font-family: 'Russo'; src: url('${staticFile('fonts/RussoOne-Regular.ttf')}'); }
  `}</style>
);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Whip-pan in/out: motion smear at the head and tail of every scene.
export const Whip: React.FC<{dur: number; dir?: 1 | -1; children: React.ReactNode; noIn?: boolean; noOut?: boolean}> = ({
  dur,
  dir = 1,
  children,
  noIn,
  noOut,
}) => {
  const f = useCurrentFrame();
  const n = 5;
  const pin = noIn ? 1 : interpolate(f, [0, n], [0, 1], clamp);
  const pout = noOut ? 0 : interpolate(f, [dur - n, dur], [0, 1], clamp);
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const x = (1 - ease(pin)) * 900 * dir - Math.pow(pout, 2) * 900 * dir;
  const blur = (1 - pin) * 40 + pout * 40;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

// Floating dust / embers, deterministic.
export const Particles: React.FC<{count?: number; color?: string; seed?: string; speed?: number; size?: number; rise?: boolean}> = ({
  count = 60,
  color = GOLD,
  seed = 'p',
  speed = 1,
  size = 5,
  rise = true,
}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const s = size * (0.3 + r('s') * 1.4);
        const vy = (rise ? -1 : 1) * (0.6 + r('v') * 2.2) * speed;
        const y = (((r('y') * height + f * vy) % height) + height) % height;
        const x = r('x') * width + Math.sin(f / (12 + r('w') * 20) + r('p') * 6) * 30;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (5 + r('t') * 8) + i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: '50%',
              background: color,
              opacity: tw * (0.4 + r('o') * 0.6),
              boxShadow: `0 0 ${s * 3}px ${color}`,
              filter: r('b') > 0.7 ? 'blur(3px)' : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Soft drifting smoke made of large blurred blobs.
export const Smoke: React.FC<{color?: string; opacity?: number; seed?: string; y?: number}> = ({
  color = 'rgba(200,190,210,1)',
  opacity = 0.18,
  seed = 's',
  y = 1300,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity, mixBlendMode: 'screen'}}>
      {new Array(9).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const w = 500 + r('w') * 700;
        const x = -300 + r('x') * 1300 + Math.sin(f / 40 + i) * 60 + f * (r('d') - 0.5) * 2;
        const yy = y - 300 + r('y') * 700 + Math.cos(f / 50 + i) * 40;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: yy,
              width: w,
              height: w * 0.55,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${color}, transparent)`,
              filter: 'blur(40px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.85}) => (
  <AbsoluteFill style={{background: `radial-gradient(80% 62% at 50% 50%, transparent 45%, rgba(0,0,0,${strength}))`}} />
);

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const ox = (random(`g${f}`) * 200) | 0;
  const oy = (random(`h${f}`) * 200) | 0;
  return (
    <AbsoluteFill
      style={{
        opacity: 0.06,
        mixBlendMode: 'overlay',
        backgroundImage: 'repeating-radial-gradient(circle at 13% 27%, #fff 0 1px, transparent 1px 3px), repeating-radial-gradient(circle at 71% 63%, #000 0 1px, transparent 1px 4px)',
        backgroundPosition: `${ox}px ${oy}px`,
      }}
    />
  );
};

// Bokeh lights for backgrounds.
export const Bokeh: React.FC<{seed: string; colors: string[]; count?: number; drift?: number; top?: number; bottom?: number}> = ({
  seed,
  colors,
  count = 18,
  drift = 0.6,
  top = 0,
  bottom = 1920,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const s = 40 + r('s') * 160;
        const c = colors[Math.floor(r('c') * colors.length)];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: r('x') * 1180 - 50 + f * drift * (r('d') - 0.3),
              top: top + r('y') * (bottom - top),
              width: s,
              height: s,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${c}, transparent)`,
              opacity: 0.35 + 0.4 * Math.abs(Math.sin(f / 18 + i)),
              filter: 'blur(4px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Shaky handheld camera wrapper.
export const Handheld: React.FC<{amp?: number; children: React.ReactNode; seed?: string}> = ({amp = 6, children, seed = 'hh'}) => {
  const f = useCurrentFrame();
  const n = (k: number) => Math.sin(f * 0.37 + k) * 0.6 + Math.sin(f * 0.91 + k * 2.1) * 0.4;
  const x = n(1) * amp;
  const y = n(4) * amp;
  const r = n(7) * amp * 0.06;
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(1.04)`}}>{children}</AbsoluteFill>;
};

export const Subtitle: React.FC<{text: string; opacity: number}> = ({text, opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: 70,
      right: 70,
      top: 1540,
      textAlign: 'center',
      fontFamily: 'Playfair',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: 62,
      lineHeight: 1.15,
      color: '#fff6e6',
      opacity,
      transform: `translateY(${(1 - opacity) * 20}px)`,
      textShadow: '0 4px 18px rgba(0,0,0,.95), 0 0 40px rgba(0,0,0,.8), 0 0 2px #000',
    }}
  >
    {text}
  </div>
);
