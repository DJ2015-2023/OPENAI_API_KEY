import React from 'react';
import {BODY, C, DISPLAY} from '../theme';

/** Stylised perfume bottle (2D, used on the product cards). */
export const Bottle: React.FC<{size: number; liquid?: string; cap?: string}> = ({size, liquid = '#C9A2FF', cap = '#1B1B1F'}) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 100 130">
    <defs>
      <linearGradient id={`glass${liquid}`} x1="0" x2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="0.35" stopColor={liquid} stopOpacity="0.55" />
        <stop offset="0.7" stopColor={liquid} stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id={`cap${cap}`} x1="0" x2="1">
        <stop offset="0" stopColor="#555" />
        <stop offset="0.4" stopColor={cap} />
        <stop offset="1" stopColor="#444" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="126" rx="34" ry="4" fill="rgba(0,0,0,0.18)" />
    <rect x="34" y="8" width="32" height="26" rx="4" fill={`url(#cap${cap})`} />
    <rect x="42" y="32" width="16" height="8" fill="#bbb" />
    <rect x="16" y="40" width="68" height="84" rx="14" fill={`url(#glass${liquid})`} stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
    <rect x="22" y="46" width="8" height="70" rx="4" fill="rgba(255,255,255,0.6)" />
    <rect x="34" y="74" width="32" height="20" rx="3" fill="rgba(255,255,255,0.85)" />
    <text x="50" y="87" textAnchor="middle" fontFamily="Oswald" fontWeight="700" fontSize="9" fill="#222">NOIR</text>
  </svg>
);

/** Plain, unremarkable competitor card (what the buyer scrolls past). */
export const BlandCard: React.FC<{w: number; emoji: string; seed?: number}> = ({w, emoji}) => (
  <div style={{width: w, background: C.white, borderRadius: w * 0.06, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.08)'}}>
    <div style={{height: w * 1.25, background: '#F1F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: w * 0.45, filter: 'saturate(0.4)'}}>{emoji}</div>
    <div style={{padding: w * 0.06}}>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: w * 0.09, color: C.ink}}>{['1 290 ₽', '990 ₽', '2 150 ₽', '1 760 ₽'][Math.floor(w) % 4]}</div>
      <div style={{height: w * 0.045, width: '80%', background: '#E6E4E0', borderRadius: 4, marginTop: w * 0.04}} />
      <div style={{height: w * 0.045, width: '55%', background: '#E6E4E0', borderRadius: 4, marginTop: w * 0.03}} />
    </div>
  </div>
);

export type Layers = {bg: number; product: number; title: number; info: number; badge: number};
export const ALL: Layers = {bg: 1, product: 1, title: 1, info: 1, badge: 1};

/**
 * The designed, selling product card (3:4). `layers` reveal each design layer 0..1;
 * `explode` (0..1) separates the layers in Z for the 3D "exploded view".
 */
export const ProCard: React.FC<{w: number; layers?: Layers; explode?: number; theme?: 'violet' | 'premium'}> = ({w, layers = ALL, explode = 0, theme = 'violet'}) => {
  const h = w * (4 / 3);
  const s = w / 600;
  const z = (k: number) => `translateZ(${explode * k * 140 * s}px)`;
  const bgGrad =
    theme === 'violet'
      ? `radial-gradient(circle at 70% 35%, #9A6BFF 0%, ${C.violet} 45%, #2C0D7A 100%)`
      : `radial-gradient(circle at 70% 35%, #3A3A40 0%, #18181B 55%, #0B0B0D 100%)`;
  const accent = theme === 'violet' ? C.lemon : '#E9C77B';
  const layer: React.CSSProperties = {position: 'absolute', inset: 0, transformStyle: 'preserve-3d'};
  return (
    <div style={{width: w, height: h, position: 'relative', transformStyle: 'preserve-3d'}}>
      {/* L0 background */}
      <div style={{...layer, transform: z(0), borderRadius: 28 * s, overflow: 'hidden', background: bgGrad, opacity: layers.bg, boxShadow: explode > 0.05 ? '0 30px 80px rgba(0,0,0,0.35)' : '0 40px 90px rgba(30,10,80,0.35)'}}>
        <div style={{position: 'absolute', left: -100 * s, top: 520 * s, width: 800 * s, height: 400 * s, borderRadius: '50%', background: 'rgba(255,255,255,0.08)'}} />
        <div style={{position: 'absolute', right: 40 * s, top: 120 * s, width: 300 * s, height: 300 * s, borderRadius: '50%', border: `${3 * s}px solid rgba(255,255,255,0.15)`}} />
      </div>
      {/* L1 product photo */}
      <div style={{...layer, transform: z(1), opacity: layers.product, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 70 * s}}>
        <div style={{transform: `translate(${(1 - layers.product) * 0}px, ${(1 - layers.product) * 60 * s}px) translateX(${70 * s}px)`, filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.35))'}}>
          <Bottle size={330 * s} liquid={theme === 'violet' ? '#E2CCFF' : '#E9C77B'} cap={theme === 'violet' ? '#141414' : '#E9C77B'} />
        </div>
      </div>
      {/* L2 headline */}
      <div style={{...layer, transform: z(2), opacity: layers.title, padding: 44 * s}}>
        <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 26 * s, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.8)'}}>ПАРФЮМ</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 112 * s, lineHeight: 0.92, color: C.white, textTransform: 'uppercase', marginTop: 8 * s}}>
          Аромат
          <br />
          <span style={{color: accent}}>Noir</span>
        </div>
      </div>
      {/* L3 infographics */}
      <div style={{...layer, transform: z(3), opacity: layers.info}}>
        {[
          {t: 'Стойкий аромат', i: '⏳', y: 380},
          {t: 'Объём 50 мл', i: '💧', y: 480},
          {t: 'Подарочная упаковка', i: '🎁', y: 580},
        ].map((c, k) => (
          <div key={c.t} style={{position: 'absolute', left: 36 * s, top: c.y * s, display: 'flex', alignItems: 'center', gap: 12 * s, background: 'rgba(255,255,255,0.14)', border: `${2 * s}px solid rgba(255,255,255,0.35)`, borderRadius: 999, padding: `${10 * s}px ${20 * s}px`, opacity: Math.min(1, layers.info * 3 - k)}}>
            <span style={{fontSize: 30 * s}}>{c.i}</span>
            <span style={{fontFamily: BODY, fontWeight: 600, fontSize: 26 * s, color: C.white}}>{c.t}</span>
          </div>
        ))}
      </div>
      {/* L4 badges */}
      <div style={{...layer, transform: z(4), opacity: layers.badge}}>
        <div style={{position: 'absolute', right: 30 * s, top: 34 * s, background: accent, color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 32 * s, padding: `${8 * s}px ${18 * s}px`, borderRadius: 12 * s, transform: `rotate(6deg) scale(${0.6 + layers.badge * 0.4})`}}>ХИТ</div>
        <div style={{position: 'absolute', left: 36 * s, bottom: 36 * s, background: C.white, color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 34 * s, padding: `${8 * s}px ${18 * s}px`, borderRadius: 12 * s}}>−30%</div>
      </div>
    </div>
  );
};
