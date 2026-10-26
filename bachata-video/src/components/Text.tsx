import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, SANS, SCRIPT, SERIF, clamp, ease, roseGold, snap} from '../theme';

/** Section-local visibility: fades/rises in at `at`, leaves (faster) at `out`. */
export const Block: React.FC<{at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number}> = ({at, out = 1e9, children, style, dy = 30}) => {
  const f = useCurrentFrame();
  const pin = ease(f, at, at + 10);
  const pout = ease(f, out - 7, out, 0, 1, Easing.in(Easing.cubic));
  if (pin <= 0 || pout >= 1) return null;
  return <div style={{position: 'absolute', opacity: pin * (1 - pout), transform: `translateY(${(1 - pin) * dy - pout * 20}px)`, filter: `blur(${(1 - pin) * 8 + pout * 8}px)`, ...style}}>{children}</div>;
};

/** Words that rise out of a blur one after another (3-frame stagger). */
export const Words: React.FC<{text: string; at: number; style?: React.CSSProperties; stagger?: number; gold?: boolean}> = ({text, at, style, stagger = 3, gold}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.28em', ...style}}>
      {text.split(' ').map((w, i) => {
        const p = snap(f, at + i * stagger, 15, 160);
        return (
          <span key={i} style={{display: 'inline-block', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 50}px) scale(${0.9 + 0.1 * p})`, filter: `blur(${(1 - Math.min(1, p)) * 10}px)`, ...(gold ? roseGold : {})}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Script word "written" left to right with a soft glow. */
export const Script: React.FC<{text: string; at: number; size: number; dur?: number; color?: string; style?: React.CSSProperties; rotate?: number}> = ({text, at, size, dur = 18, color = C.blush, style, rotate = -4}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + dur, 0, 1, Easing.inOut(Easing.sin));
  return (
    <div
      style={{
        fontFamily: SCRIPT,
        fontSize: size,
        lineHeight: 1.05,
        color,
        whiteSpace: 'nowrap',
        clipPath: `inset(-20% ${(1 - p) * 100}% -20% -5%)`,
        transform: `rotate(${rotate}deg)`,
        textShadow: `0 0 30px rgba(255,140,170,0.55), 0 4px 16px rgba(0,0,0,0.45)`,
        padding: '0 0.15em',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Thin rose-gold rule that draws from the centre. */
export const Rule: React.FC<{at: number; width?: number; style?: React.CSSProperties}> = ({at, width = 420, style}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 14, 0, 1, Easing.inOut(Easing.cubic));
  return <div style={{width: width * p, height: 2, margin: '0 auto', background: 'linear-gradient(90deg, transparent, #F2C9B0, transparent)', ...style}} />;
};

export const Eyebrow: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, letterSpacing: '0.32em', paddingLeft: '0.32em', color: C.rose, textTransform: 'uppercase', ...style}}>{children}</div>
);

/** Frosted glass card. */
export const Glass: React.FC<{children: React.ReactNode; style?: React.CSSProperties; glow?: number}> = ({children, style, glow = 0}) => (
  <div
    style={{
      background: 'linear-gradient(160deg, rgba(60,14,32,0.62), rgba(14,4,9,0.62))',
      border: '1.5px solid rgba(255,205,215,0.42)',
      borderRadius: 36,
      boxShadow: `0 30px 70px rgba(0,0,0,0.45), 0 0 ${40 * glow}px rgba(255,140,170,${0.6 * glow}), inset 0 1px 0 rgba(255,255,255,0.18)`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const f = useCurrentFrame();
  const p = snap(f, at, 13, 190);
  return (
    <div style={{opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 30}px) scale(${0.8 + 0.2 * p})`, padding: '14px 30px', borderRadius: 999, border: '1.5px solid rgba(255,205,215,0.6)', background: 'rgba(40,8,20,0.55)', fontFamily: SANS, fontWeight: 500, fontSize: 36, color: C.ivory, backdropFilter: 'blur(10px)'}}>
      {children}
    </div>
  );
};

export const serifItalic = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: size, lineHeight: 1.08, color: C.ivory, textShadow: '0 4px 24px rgba(0,0,0,0.55)', ...extra});
export const sans = (size: number, weight = 800, extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: 1.05, color: C.ivory, textTransform: 'uppercase', textShadow: '0 4px 24px rgba(0,0,0,0.5)', ...extra});

/* ---------- line icons (rose gold) ---------- */
const stroke = {fill: 'none', stroke: '#F2C9B0', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
export const Icon: React.FC<{name: 'clock' | 'dancer' | 'wave' | 'heart' | 'camera' | 'calendar' | 'music'; size: number; p?: number}> = ({name, size, p = 1}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{filter: 'drop-shadow(0 0 10px rgba(255,170,190,0.6))'}}>
    <g {...stroke} strokeDasharray={60} strokeDashoffset={60 * (1 - p)}>
      {name === 'clock' && (
        <>
          <circle cx={12} cy={12} r={9} />
          <path d="M12 7v5l3.5 2" />
        </>
      )}
      {name === 'dancer' && <path d="M13 3.5a1.5 1.5 0 1 1-.01 0M12 6.5l-1 5 3 3-1 6M11 11.5l-4-2.5M12 8l5-2.5M14 14.5l3 1.5" />}
      {name === 'wave' && <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />}
      {name === 'heart' && <path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z" />}
      {name === 'camera' && (
        <>
          <rect x={2.5} y={6.5} width={14} height={11} rx={2} />
          <path d="M16.5 10l5-3v10l-5-3" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <rect x={3} y={5} width={18} height={16} rx={2} />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </>
      )}
      {name === 'music' && <path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" />}
    </g>
  </svg>
);

export const _i = interpolate;
