import React from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, GLITCH, H, W, ease, rand} from '../theme';

/* ---------- fonts ---------- */
let ready: Promise<unknown> | null = null;
const FACES: [string, string, number, 'normal' | 'italic'][] = [
  ['Rubik Wet Paint', 'rubik-wet-paint', 400, 'normal'],
  ['Rubik Glitch', 'rubik-glitch', 400, 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond', 600, 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond', 500, 'italic'],
  ['Cormorant Garamond', 'cormorant-garamond', 700, 'italic'],
  ['Unbounded', 'unbounded', 400, 'normal'],
  ['Unbounded', 'unbounded', 800, 'normal'],
  ['Oswald', 'oswald', 500, 'normal'],
  ['Oswald', 'oswald', 700, 'normal'],
];
const loadFonts = () => {
  if (ready) return ready;
  const loads: Promise<FontFace>[] = [];
  for (const [fam, file, w, style] of FACES) {
    for (const subset of ['latin', 'cyrillic']) {
      const ff = new FontFace(fam, `url(${staticFile(`fonts/${file}-${subset}-${w}-${style}.woff2`)})`, {
        weight: String(w),
        style,
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

/* ---------- night sky backdrop ---------- */
export const Sky: React.FC<{top?: string; bottom?: string; glow?: string; glowY?: number}> = ({top = C.night, bottom = C.plum, glow, glowY = 30}) => (
  <AbsoluteFill style={{background: `linear-gradient(to bottom, ${top} 0%, ${bottom} 100%)`}}>
    {glow && <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 40% at 50% ${glowY}%, ${glow}, transparent 70%)`}} />}
  </AbsoluteFill>
);

/* ---------- generative fog (tileable fbm textures from scripts/make_assets.py) ---------- */
export const Fog: React.FC<{opacity?: number; speed?: number; tint?: string; top?: number; height?: number; scale?: number}> = ({
  opacity = 0.5,
  speed = 1,
  tint,
  top = 0,
  height = H,
  scale = 1,
}) => {
  const f = useCurrentFrame();
  const layer = (img: string, size: number, vx: number, vy: number, o: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${staticFile(img)})`,
    backgroundSize: `${size * scale}px ${size * scale}px`,
    backgroundPosition: `${f * vx * speed}px ${f * vy * speed}px`,
    opacity: o,
  });
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, height, opacity, mixBlendMode: 'screen', pointerEvents: 'none', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 25%, #000 75%, transparent)'}}>
      <div style={layer('img/fog0.png', 1300, 1.3, -0.15, 0.9)} />
      <div style={layer('img/fog1.png', 900, -2.1, 0.1, 0.7)} />
      {tint && <div style={{position: 'absolute', inset: 0, background: tint, mixBlendMode: 'multiply'}} />}
    </div>
  );
};

/* ---------- film grain + vignette ---------- */
export const Grain: React.FC<{amount?: number}> = ({amount = 0.11}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: amount, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.85, color = '0,0,0'}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 60% at 50% 48%, transparent 45%, rgba(${color},${strength}) 100%)`, pointerEvents: 'none'}} />
);

/* ---------- rising embers ---------- */
export const Embers: React.FC<{n?: number; seed?: number; color?: string; speed?: number; opacity?: number; size?: number}> = ({
  n = 40,
  seed = 1,
  color = C.ember,
  speed = 1,
  opacity = 1,
  size = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(seed * 100 + i * 7.3 + k);
        const life = 90 + r(1) * 120;
        const t = ((f * speed + r(2) * life) % life) / life;
        const x = r(3) * W + Math.sin(f / (18 + r(4) * 20) + r(5) * 6) * 40;
        const y = H + 40 - t * (H * (0.6 + r(6) * 0.6));
        const s = (4 + r(7) * 9) * size;
        const o = Math.sin(t * Math.PI) * (0.5 + 0.5 * Math.sin(f / 3 + i));
        return (
          <div
            key={i}
            style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: color, opacity: o, boxShadow: `0 0 ${s * 2}px ${s * 0.6}px ${color}`}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- bats ---------- */
export const Bat: React.FC<{size: number; flap: number; color?: string}> = ({size, flap, color = '#050208'}) => {
  const w = Math.sin(flap) * 0.8; // wing angle
  return (
    <svg width={size} height={size * 0.6} viewBox="-50 -30 100 60" style={{overflow: 'visible'}}>
      <g fill={color}>
        <g transform={`scale(1, ${w})`}>
          <path d="M0 0 C -10 -12 -28 -14 -48 -6 C -40 -2 -38 4 -36 8 C -32 2 -26 2 -22 8 C -18 2 -12 2 -8 8 Z" />
          <path d="M0 0 C 10 -12 28 -14 48 -6 C 40 -2 38 4 36 8 C 32 2 26 2 22 8 C 18 2 12 2 8 8 Z" />
        </g>
        <ellipse cx="0" cy="2" rx="6" ry="9" />
        <path d="M-5 -6 L -6 -14 L -1 -8 Z M5 -6 L 6 -14 L 1 -8 Z" />
      </g>
    </svg>
  );
};
/** A flock crossing the frame between [start, start+dur] frames. */
export const Bats: React.FC<{start: number; dur?: number; n?: number; seed?: number; fromLeft?: boolean; y?: number; spread?: number; scale?: number; color?: string}> = ({
  start,
  dur = 70,
  n = 9,
  seed = 3,
  fromLeft = true,
  y = 600,
  spread = 500,
  scale = 1,
  color,
}) => {
  const f = useCurrentFrame();
  const p = (f - start) / dur;
  if (p < -0.3 || p > 1.6) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(seed * 31 + i * 5.1 + k);
        const q = p * (0.8 + r(1) * 0.5) - r(2) * 0.3;
        const x = fromLeft ? -200 + q * (W + 400) : W + 200 - q * (W + 400);
        const yy = y + (r(3) - 0.5) * spread + Math.sin(q * 8 + r(4) * 6) * 40 - q * 200;
        const s = (60 + r(5) * 110) * scale;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: yy, transform: `rotate(${(fromLeft ? -1 : 1) * (8 + r(6) * 10)}deg)`, filter: s < 90 ? 'blur(1.5px)' : undefined}}>
            <Bat size={s} flap={f * (0.9 + r(7) * 0.5) + r(8) * 6} color={color} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- lightning ---------- */
const bolt = (seed: number, x0: number, len: number) => {
  const pts: [number, number][] = [[x0, -20]];
  let x = x0;
  for (let k = 1; k <= 14; k++) {
    x += (rand(seed + k) - 0.5) * 120;
    pts.push([x, (k / 14) * len]);
  }
  return pts;
};
export const Lightning: React.FC<{at: number; seed?: number; x?: number; len?: number}> = ({at, seed = 1, x = 640, len = 1100}) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < 0 || d > 9) return null;
  const on = [1, 0.3, 1, 0.8, 0.2, 0.6, 0.3, 0.15, 0.08, 0][d];
  const main = bolt(seed, x, len);
  const branch = bolt(seed + 50, main[5][0], len * 0.5).map(([bx, by]) => [bx + (by / len) * 160, by + main[5][1]] as [number, number]);
  const path = (p: [number, number][]) => p.map(([a, b], i) => `${i ? 'L' : 'M'}${a} ${b}`).join(' ');
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'rgba(200,190,255,0.55)', opacity: on * 0.6, mixBlendMode: 'screen'}} />
      <svg width={W} height={H} style={{position: 'absolute', opacity: on}}>
        <g fill="none" stroke="#fff" strokeLinejoin="bevel" style={{filter: 'drop-shadow(0 0 12px #b9a8ff) drop-shadow(0 0 40px #7a5cff)'}}>
          <path d={path(main)} strokeWidth={6} />
          <path d={path(branch)} strokeWidth={3} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- moon ---------- */
export const Moon: React.FC<{size: number; x: number; y: number; glow?: number; tint?: string}> = ({size, x, y, glow = 1, tint}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size}}>
    <div style={{position: 'absolute', inset: -size * 0.6, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,235,200,${0.35 * glow}) 0%, rgba(255,140,60,${0.12 * glow}) 35%, transparent 65%)`}} />
    <Img src={staticFile('img/moon.png')} style={{width: size, height: size, filter: `drop-shadow(0 0 ${size * 0.12}px rgba(255,230,190,${0.8 * glow}))`}} />
    {tint && <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: tint, mixBlendMode: 'multiply'}} />}
  </div>
);

/* ---------- RGB-split glitch text ---------- */
export const Glitchy: React.FC<{children: React.ReactNode; amount: number; seed?: number; style?: React.CSSProperties}> = ({children, amount, seed = 1, style}) => {
  const f = useCurrentFrame();
  const j = (k: number) => (rand(f * 3.1 + seed + k) - 0.5) * 2 * amount;
  const slice = amount > 0.5 ? rand(f + seed) * 100 : -1;
  return (
    <div style={{position: 'relative', ...style}}>
      {amount > 0.05 && (
        <>
          <div style={{position: 'absolute', inset: 0, color: '#00F0FF', transform: `translate(${j(1) * 14}px, ${j(2) * 4}px)`, mixBlendMode: 'screen', opacity: 0.8}}>{children}</div>
          <div style={{position: 'absolute', inset: 0, color: '#FF0040', transform: `translate(${j(3) * 14}px, ${j(4) * 4}px)`, mixBlendMode: 'screen', opacity: 0.8}}>{children}</div>
        </>
      )}
      <div style={{position: 'relative', clipPath: slice >= 0 ? `polygon(0 0,100% 0,100% ${slice}%,0 ${slice}%,0 ${slice + 8}%,100% ${slice + 8}%,100% 100%,0 100%)` : undefined, transform: slice >= 0 ? `translateX(${j(5) * 20}px)` : undefined}}>
        {children}
      </div>
    </div>
  );
};

/* ---------- neon tube text with flicker-on ---------- */
export const Neon: React.FC<{children: React.ReactNode; on: number; color?: string; size: number; font?: string; flickerAt?: number}> = ({children, on, color = C.neon, size, font = "'Unbounded', sans-serif", flickerAt = 0}) => {
  const f = useCurrentFrame();
  const d = f - flickerAt;
  const flick = d < 0 ? 0 : d < 14 ? [1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0.4, 1][d] : 0.93 + 0.07 * Math.sin(f * 1.7);
  const lit = on * flick;
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        lineHeight: 1,
        color: lit > 0.5 ? '#FFF2F5' : 'rgba(80,40,50,0.9)',
        textShadow: lit > 0.5 ? `0 0 ${size * 0.05}px #fff, 0 0 ${size * 0.12}px ${color}, 0 0 ${size * 0.3}px ${color}, 0 0 ${size * 0.6}px ${color}` : 'none',
        WebkitTextStroke: lit > 0.5 ? undefined : `2px ${color}55`,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- spider web drawn on ---------- */
export const Web: React.FC<{p: number; size: number; style?: React.CSSProperties; color?: string}> = ({p, size, style, color = 'rgba(243,233,220,0.75)'}) => {
  const spokes = 9;
  const rings = 7;
  const lines: React.ReactNode[] = [];
  for (let k = 0; k < spokes; k++) {
    const a = (k / (spokes - 1)) * (Math.PI / 2);
    lines.push(<line key={`s${k}`} x1={0} y1={0} x2={Math.cos(a) * 100} y2={Math.sin(a) * 100} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p, k * 0.04, 0.35 + k * 0.04)} />);
  }
  for (let r = 1; r <= rings; r++) {
    const rad = (r / rings) * 96;
    const pts = new Array(spokes).fill(0).map((_, k) => {
      const a = (k / (spokes - 1)) * (Math.PI / 2);
      const sag = k > 0 && k < spokes ? 0.93 : 1;
      return `${Math.cos(a) * rad * (k % 1 ? sag : 1)} ${Math.sin(a) * rad}`;
    });
    let dPath = `M${pts[0]}`;
    for (let k = 1; k < spokes; k++) {
      const am = ((k - 0.5) / (spokes - 1)) * (Math.PI / 2);
      dPath += ` Q${Math.cos(am) * rad * 0.9} ${Math.sin(am) * rad * 0.9} ${pts[k]}`;
    }
    lines.push(<path key={`r${r}`} d={dPath} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p, 0.3 + r * 0.07, 0.55 + r * 0.07)} />);
  }
  return (
    <svg width={size} height={size} viewBox="-2 -2 104 104" style={{position: 'absolute', ...style}}>
      <g stroke={color} strokeWidth={0.5} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 1.5px rgba(255,255,255,0.6))'}}>
        {lines}
      </g>
    </svg>
  );
};

/* ---------- glitch font word ---------- */
export const GlitchWord: React.FC<{children: React.ReactNode; size: number; color?: string}> = ({children, size, color = C.bone}) => (
  <div style={{fontFamily: GLITCH, fontSize: size, color, lineHeight: 1}}>{children}</div>
);

/* ---------- client logo (transparent PNG from scripts/make_logo.py) with spin-in reveal, light sweep and kick pulse ---------- */
export const Logo: React.FC<{size: number; at: number; pulse?: number; style?: React.CSSProperties}> = ({size, at, pulse = 0, style}) => {
  const f = useCurrentFrame();
  const d = f - at;
  const p = d < 0 ? 0 : 1 - Math.exp(-d / 5) * Math.cos(d / 4);
  const o = ease(f, at, at + 6);
  const sweep = ease(f, at + 8, at + 30);
  return (
    <div style={{position: 'absolute', width: size, height: size, opacity: o, transform: `scale(${(0.3 + 0.7 * p) * (1 + 0.035 * pulse)}) rotate(${(1 - Math.min(1, p)) * -25}deg)`, filter: `brightness(${1 + 0.6 * Math.max(0, 1 - d / 8) + 0.25 * pulse})`, ...style}}>
      <Img src={staticFile('img/logo.png')} style={{width: size, height: size}} />
      {sweep > 0 && sweep < 1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `url(${staticFile('img/logo.png')})`,
            WebkitMaskSize: '100% 100%',
            background: `linear-gradient(115deg, transparent ${sweep * 140 - 30}%, rgba(255,255,255,0.75) ${sweep * 140 - 20}%, transparent ${sweep * 140 - 10}%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
};
