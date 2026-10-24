import React from 'react';
import {C, H, W, rand} from '../theme';

const INK = '#040106';

/** Haunted house on a hill with a dead tree; `lights` 0..1 per window. */
export const House: React.FC<{lights: number[]; style?: React.CSSProperties}> = ({lights, style}) => {
  const win = (x: number, y: number, w: number, h: number, i: number) => {
    const l = lights[i] ?? 0;
    return (
      <g key={i}>
        <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill={`rgba(255,150,40,${0.18 * l})`} style={{filter: 'blur(8px)'}} />
        <rect x={x} y={y} width={w} height={h} fill={l > 0.02 ? `rgba(255,${150 + 60 * l},${40 + 40 * l},${0.15 + 0.85 * l})` : '#0b0410'} />
        <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={INK} strokeWidth={5} />
        <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={INK} strokeWidth={5} />
      </g>
    );
  };
  return (
    <svg width={W} height={900} viewBox="0 1020 1080 900" style={{position: 'absolute', left: 0, bottom: 0, ...style}}>
      <path d="M0 1560 C 200 1480 360 1450 540 1452 C 760 1455 900 1500 1080 1560 L1080 1920 L0 1920 Z" fill={INK} />
      {/* tower */}
      <rect x={250} y={1150} width={130} height={330} fill={INK} />
      <path d="M232 1160 L315 960 L398 1160 Z" fill={INK} />
      <line x1={315} y1={960} x2={315} y2={915} stroke={INK} strokeWidth={6} />
      {/* main body + roof */}
      <rect x={370} y={1250} width={400} height={230} fill={INK} />
      <path d="M345 1262 L570 1110 L795 1262 Z" fill={INK} />
      <rect x={690} y={1120} width={36} height={90} fill={INK} />
      {/* porch */}
      <path d="M470 1480 L470 1395 L670 1395 L670 1480" fill="none" stroke={INK} strokeWidth={10} />
      <path d="M450 1400 L570 1350 L690 1400 Z" fill={INK} />
      {win(290, 1200, 50, 70, 0)}
      {win(290, 1320, 50, 70, 1)}
      {win(410, 1290, 60, 70, 2)}
      {win(670, 1290, 60, 70, 3)}
      {win(545, 1180, 50, 50, 4)}
      {win(545, 1405, 50, 75, 5)}
      {/* dead tree */}
      <g stroke={INK} strokeLinecap="round" fill="none">
        <path d="M900 1530 C 905 1420 880 1350 905 1250" strokeWidth={26} />
        <path d="M903 1300 C 960 1260 990 1230 1040 1150" strokeWidth={12} />
        <path d="M900 1340 C 840 1300 820 1260 790 1200" strokeWidth={11} />
        <path d="M905 1255 C 910 1200 940 1160 930 1100" strokeWidth={9} />
        <path d="M1000 1210 C 1030 1205 1060 1210 1080 1190" strokeWidth={6} />
        <path d="M820 1250 C 800 1240 780 1250 760 1235" strokeWidth={5} />
        <path d="M930 1120 C 950 1100 945 1080 960 1060" strokeWidth={5} />
      </g>
      {/* fence */}
      <g fill={INK}>
        {new Array(22).fill(0).map((_, i) => (
          <path key={i} d={`M${i * 50 + 5} 1620 L${i * 50 + 5} ${1560 - (i % 3) * 6} L${i * 50 + 13} ${1545 - (i % 3) * 6} L${i * 50 + 21} ${1560 - (i % 3) * 6} L${i * 50 + 21} 1620 Z`} transform={`rotate(${(rand(i) - 0.5) * 10} ${i * 50 + 13} 1620)`} />
        ))}
        <rect x={0} y={1570} width={1080} height={8} />
      </g>
    </svg>
  );
};

/** Night city skyline (high-rises with spires + onion domes); `lights` 0..1. */
export const Skyline: React.FC<{lights?: number; style?: React.CSSProperties}> = ({lights = 1, style}) => {
  const blds: React.ReactNode[] = [];
  let x = -20;
  let i = 0;
  while (x < W + 20) {
    const w = 60 + rand(i * 3.3) * 90;
    const h = 220 + rand(i * 7.1) * 380;
    const kind = i === 4 ? 'spire' : i === 9 ? 'dome' : 'box';
    blds.push(
      <g key={i}>
        <rect x={x} y={900 - h} width={w} height={h} fill={INK} />
        {kind === 'spire' && (
          <>
            <rect x={x + w * 0.15} y={900 - h - 120} width={w * 0.7} height={120} fill={INK} />
            <rect x={x + w * 0.3} y={900 - h - 210} width={w * 0.4} height={90} fill={INK} />
            <path d={`M${x + w * 0.38} ${900 - h - 210} L${x + w / 2} ${900 - h - 380} L${x + w * 0.62} ${900 - h - 210} Z`} fill={INK} />
            <circle cx={x + w / 2} cy={900 - h - 390} r={8} fill={C.blood} style={{filter: `drop-shadow(0 0 10px ${C.blood})`}} />
          </>
        )}
        {kind === 'dome' && (
          <>
            <path d={`M${x + w * 0.15} ${900 - h} C ${x - w * 0.1} ${900 - h - 80} ${x + w * 0.4} ${900 - h - 110} ${x + w / 2} ${900 - h - 170} C ${x + w * 0.6} ${900 - h - 110} ${x + w * 1.1} ${900 - h - 80} ${x + w * 0.85} ${900 - h} Z`} fill={INK} />
            <line x1={x + w / 2} y1={900 - h - 170} x2={x + w / 2} y2={900 - h - 230} stroke={INK} strokeWidth={5} />
          </>
        )}
        {new Array(Math.floor(h / 40)).fill(0).map((_, r) =>
          new Array(Math.max(1, Math.floor(w / 28))).fill(0).map((__, c) => {
            const on = rand(i * 100 + r * 10 + c) > 0.62;
            return on ? <rect key={`${r}-${c}`} x={x + 10 + c * 26} y={900 - h + 20 + r * 40} width={10} height={14} fill={`rgba(255,${170 + rand(r + c) * 60},90,${0.75 * lights})`} /> : null;
          }),
        )}
      </g>,
    );
    x += w + 4;
    i++;
  }
  return (
    <svg width={W} height={900} viewBox="0 0 1080 900" style={{position: 'absolute', left: 0, ...style}}>
      {blds}
    </svg>
  );
};

/** Venetian masquerade mask. */
export const Mask: React.FC<{size: number; color?: string; trim?: string}> = ({size, color = C.blood, trim = C.gold}) => {
  const half = 'M0 18 C 20 2 45 -14 85 -24 C 130 -36 172 -34 200 -62 C 198 -12 182 38 142 60 C 102 80 52 72 22 52 C 12 44 6 34 0 34 Z';
  return (
    <svg width={size} height={size * 0.62} viewBox="-215 -120 430 266">
      <defs>
        <linearGradient id="mk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#3a0010" />
        </linearGradient>
      </defs>
      {/* feathers */}
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

/** Glowing eyes in the dark; `open` 0..1. */
export const Eyes: React.FC<{open: number; size: number; color?: string; look?: number}> = ({open, size, color = C.blood, look = 0}) => (
  <svg width={size} height={size * 0.3} viewBox="-100 -30 200 60" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${size * 0.03}px ${color}) drop-shadow(0 0 ${size * 0.08}px ${color})`}}>
    {[-1, 1].map((s) => (
      <g key={s} transform={`translate(${s * 52} 0)`}>
        <path d={`M-34 0 Q 0 ${-44 * open} 34 0 Q 0 ${30 * open} -34 0 Z`} fill={color} />
        <ellipse cx={look * 8} cy={0} rx={4} ry={14 * open} fill="#0a0003" />
      </g>
    ))}
  </svg>
);

/** Card-back ornament: crescent + stars. */
export const MoonGlyph: React.FC<{size: number; color?: string}> = ({size, color = C.gold}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    <circle r={44} fill="none" stroke={color} strokeWidth={1.5} />
    <circle r={38} fill="none" stroke={color} strokeWidth={0.8} strokeDasharray="2 3" />
    <path d="M10 -26 A 28 28 0 1 0 10 26 A 22 22 0 1 1 10 -26 Z" fill={color} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
      <circle key={k} cx={Math.cos((k / 8) * Math.PI * 2) * 44} cy={Math.sin((k / 8) * Math.PI * 2) * 44} r={2.4} fill={color} />
    ))}
  </svg>
);

export const BIG_W = W;
export const BIG_H = H;
