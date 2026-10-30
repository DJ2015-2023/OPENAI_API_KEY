import React from 'react';
import {C} from '../theme';

const GoldDefs: React.FC<{id: string}> = ({id}) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#FFF3C8" />
    <stop offset="0.35" stopColor="#E7C27D" />
    <stop offset="0.6" stopColor="#8E5E1E" />
    <stop offset="1" stopColor="#F5D58E" />
  </linearGradient>
);

/** Venetian masquerade mask (same mask as the first party video). */
export const Mask: React.FC<{size: number; color?: string; trim?: string}> = ({size, color = C.blood, trim = C.gold}) => {
  const half = 'M0 18 C 20 2 45 -14 85 -24 C 130 -36 172 -34 200 -62 C 198 -12 182 38 142 60 C 102 80 52 72 22 52 C 12 44 6 34 0 34 Z';
  return (
    <svg width={size} height={size * 0.62} viewBox="-215 -120 430 266" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="mk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#3a0010" />
        </linearGradient>
      </defs>
      {[-1, 1].map((s) => (
        <g key={s} transform={`scale(${s},1)`}>
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M150 -40 C ${170 + k * 10} ${-100 - k * 10} ${150 + k * 20} -120 ${120 + k * 30} -118 C ${150 + k * 10} -90 ${150} -70 150 -40 Z`} fill={k === 1 ? trim : '#22051a'} opacity={0.95} />
          ))}
        </g>
      ))}
      {[-1, 1].map((s) => (
        <g key={`m${s}`} transform={`scale(${s},1)`}>
          <path d={half} fill="url(#mk)" stroke={trim} strokeWidth={5} />
          <ellipse cx={88} cy={12} rx={38} ry={20} transform="rotate(-10 88 12)" fill="#050208" stroke={trim} strokeWidth={4} />
          <path d="M40 -6 C 70 -30 120 -34 150 -24" stroke={trim} strokeWidth={3} fill="none" />
          <circle cx={170} cy={-30} r={6} fill={trim} />
        </g>
      ))}
    </svg>
  );
};

/** Ornate gold oval mirror; `glass` is the reflection fill. */
export const Mirror: React.FC<{w: number; glass: string; children?: React.ReactNode}> = ({w, glass, children}) => (
  <div style={{position: 'relative', width: w, height: w * 1.42}}>
    <svg width={w} height={w * 1.42} viewBox="-120 -170 240 340" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <GoldDefs id="mg" />
        <radialGradient id="sheen" cx="0.35" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <ellipse rx={92} ry={138} fill={glass} />
      <ellipse rx={100} ry={146} fill="none" stroke="url(#mg)" strokeWidth={12} />
      <ellipse rx={108} ry={154} fill="none" stroke="url(#mg)" strokeWidth={3} />
      <ellipse rx={88} ry={134} fill="none" stroke="#5a3a10" strokeWidth={2} />
      {/* crest + scrolls */}
      <path d="M-40 -150 C -20 -175 20 -175 40 -150 C 20 -160 -20 -160 -40 -150 Z" fill="url(#mg)" />
      <circle cx={0} cy={-166} r={9} fill="url(#mg)" />
      <path d="M-30 150 C -10 168 10 168 30 150" stroke="url(#mg)" strokeWidth={6} fill="none" />
      {[-1, 1].map((s) => (
        <path key={s} transform={`scale(${s},1)`} d="M104 -40 C 124 -30 124 0 108 6 C 122 14 122 40 104 50" stroke="url(#mg)" strokeWidth={5} fill="none" />
      ))}
    </svg>
    <div style={{position: 'absolute', inset: 0, clipPath: `ellipse(${(92 / 240) * 100}% ${(138 / 340) * 100}% at 50% 50%)`}}>{children}</div>
    <svg width={w} height={w * 1.42} viewBox="-120 -170 240 340" style={{position: 'absolute', inset: 0}}>
      <ellipse rx={92} ry={138} fill="url(#sheen)" />
    </svg>
  </div>
);

export const WitchHat: React.FC<{size: number; band?: string}> = ({size, band = C.crimson}) => (
  <svg width={size} height={size} viewBox="-100 -110 200 200" style={{overflow: 'visible'}}>
    <defs>
      <GoldDefs id="hg" />
      <linearGradient id="hat" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#120810" />
        <stop offset="0.5" stopColor="#2b1424" />
        <stop offset="1" stopColor="#0a0408" />
      </linearGradient>
    </defs>
    <ellipse cx={0} cy={58} rx={98} ry={20} fill="url(#hat)" stroke="#3d2032" strokeWidth={2} />
    <path d="M-48 52 C -40 10 -20 -40 10 -80 C 20 -95 40 -100 52 -92 C 30 -86 26 -60 30 -30 C 34 0 42 30 48 52 Z" fill="url(#hat)" />
    <path d="M-46 40 C -16 48 18 48 46 40 L 48 54 C 18 60 -16 60 -48 54 Z" fill={band} />
    <rect x={-10} y={38} width={20} height={20} rx={3} fill="none" stroke="url(#hg)" strokeWidth={4} />
    {/* rose */}
    <circle cx={34} cy={44} r={11} fill={C.blood} />
    <path d="M28 44 C 30 36 40 36 40 44 C 38 50 30 50 28 44" fill="none" stroke="#5a0010" strokeWidth={2} />
  </svg>
);

export const Candle: React.FC<{h: number; flick: number}> = ({h, flick}) => (
  <div style={{position: 'relative', width: 46, height: h + 70}}>
    <div style={{position: 'absolute', left: 23 - 70, top: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,190,90,0.55), rgba(255,120,40,0.15) 45%, transparent 70%)', opacity: 0.8 + 0.2 * flick}} />
    <div style={{position: 'absolute', left: 15, top: 8 - flick * 3, width: 16, height: 40 + flick * 6, borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%', background: 'radial-gradient(ellipse at 50% 75%, #fff 0%, #FFE08A 35%, #FF8A2A 70%, transparent 75%)', filter: 'blur(0.6px)', transform: `skewX(${(flick - 0.5) * 10}deg)`}} />
    <div style={{position: 'absolute', left: 22, top: 46, width: 2, height: 10, background: '#222'}} />
    <div style={{position: 'absolute', left: 0, top: 56, width: 46, height: h, borderRadius: '6px 6px 2px 2px', background: 'linear-gradient(90deg, #d8c6b0, #fff5e6 40%, #b8a088)'}} />
  </div>
);

/** Lipstick: gold case, crimson bullet that twists up by `up` (0..1). */
export const Lipstick: React.FC<{h: number; up: number}> = ({h, up}) => (
  <svg width={h * 0.36} height={h} viewBox="-36 -100 72 200" style={{overflow: 'visible'}}>
    <defs>
      <GoldDefs id="lg" />
      <linearGradient id="bul" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5a0010" />
        <stop offset="0.4" stopColor={C.blood} />
        <stop offset="0.6" stopColor="#ff4a5e" />
        <stop offset="1" stopColor="#6a0012" />
      </linearGradient>
      <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6b4512" />
        <stop offset="0.3" stopColor="#F7DC9A" />
        <stop offset="0.55" stopColor="#B9832E" />
        <stop offset="1" stopColor="#4a2e0a" />
      </linearGradient>
    </defs>
    <g transform={`translate(0 ${-60 * up})`}>
      <path d="M-20 10 L -20 -30 L 20 -52 L 20 10 Z" fill="url(#bul)" />
    </g>
    <rect x={-24} y={0} width={48} height={22} fill="url(#cyl)" />
    <rect x={-30} y={22} width={60} height={78} rx={4} fill="url(#cyl)" />
    <rect x={-30} y={58} width={60} height={4} fill="#3a2006" opacity={0.6} />
  </svg>
);

/** Smartphone with a lock-screen notification. */
export const Phone: React.FC<{w: number; glow: number; children?: React.ReactNode}> = ({w, glow, children}) => (
  <div style={{position: 'relative', width: w, height: w * 2.05, borderRadius: w * 0.13, background: '#08060a', border: '6px solid #2a2530', boxShadow: `0 0 ${80 * glow}px ${20 * glow}px rgba(120,150,255,${0.35 * glow}), inset 0 0 0 2px #000`}}>
    <div style={{position: 'absolute', inset: 10, borderRadius: w * 0.11, overflow: 'hidden', background: `linear-gradient(180deg, rgba(40,30,70,${glow}) 0%, rgba(90,10,30,${glow}) 100%)`}}>{children}</div>
    <div style={{position: 'absolute', left: '50%', top: 22, width: w * 0.28, height: 26, marginLeft: -w * 0.14, borderRadius: 13, background: '#000'}} />
  </div>
);
