import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Bats, Embers, Fog, Glitchy, Logo, Moon} from './components/FX';
import {Pumpkin3D} from './components/Pumpkin3D';
import {C, COND, DISPLAY, H, HORROR, SERIF, T, W, clamp, ease, goldText, kick, rand, shake, snap, wf} from './theme';

/* ================================================================ shared pieces */

/** Gothic red room: dark crimson gradient, smoke and flickering candle bokeh. */
export const RedRoom: React.FC<{glow?: number; abs: number}> = ({glow = 0.3, abs}) => {
  const f = useCurrentFrame();
  const k = kick(abs);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 60% at 50% 40%, #3d0510 0%, #1a0207 55%, #060103 100%)'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 40% at 50% 45%, rgba(224,16,47,${glow * (0.8 + 0.4 * k)}), transparent 70%)`}} />
      {new Array(14).fill(0).map((_, i) => {
        const r = (n: number) => rand(i * 9.1 + n);
        const x = r(1) * W;
        const y = 300 + r(2) * 1500;
        const s = 40 + r(3) * 110;
        const fl = 0.55 + 0.25 * Math.sin(f / (3 + r(4) * 3) + i) + 0.15 * Math.sin(f / 1.7 + i * 2);
        return <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,190,110,0.9), rgba(255,120,40,0.35) 40%, transparent 70%)', opacity: fl * 0.55, filter: 'blur(6px)'}} />;
      })}
      <Fog opacity={0.22} speed={1.2} />
      <Embers n={30} seed={7} color="#FFB060" opacity={0.7} size={0.8} />
    </AbsoluteFill>
  );
};

/** Torn red brush-stroke banner (like the poster), wiped in from the left. */
export const Brush: React.FC<{p: number; children: React.ReactNode; color?: string; style?: React.CSSProperties; seed?: number}> = ({p, children, color = '#C8102E', style, seed = 1}) => {
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) pts.push(`${(i / 20) * 100}% ${rand(seed + i) * 12}%`);
  for (let i = 20; i >= 0; i--) pts.push(`${(i / 20) * 100}% ${88 + rand(seed + 50 + i) * 12}%`);
  return (
    <div style={{position: 'relative', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, ...style}}>
      <div style={{position: 'absolute', inset: '-6px -30px', background: `linear-gradient(100deg, #7a0014, ${color} 30%, #e01935 70%, #7a0014)`, clipPath: `polygon(${pts.join(',')})`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}} />
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

/** Ticket with notched sides. */
const Ticket: React.FC<{w: number; h: number; tone: 'red' | 'dark'; children: React.ReactNode; glow?: number}> = ({w, h, tone, children, glow = 0}) => (
  <div style={{position: 'relative', width: w, height: h, filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 ${30 * glow}px ${tone === 'red' ? 'rgba(255,40,60,0.9)' : 'rgba(255,255,255,0.6)'})`}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 26,
        background: tone === 'red' ? 'linear-gradient(135deg, #e01935, #8e0018 70%, #5a000f)' : 'linear-gradient(135deg, #3a3a40, #16161a 65%, #0b0b0d)',
        border: `4px solid ${tone === 'red' ? '#ff5a6e' : '#9a9aa4'}`,
        WebkitMaskImage: `radial-gradient(circle at 0 50%, transparent 34px, #000 35px), radial-gradient(circle at 100% 50%, transparent 34px, #000 35px)`,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
      }}
    />
    <div style={{position: 'absolute', left: 60, right: 60, top: '50%', height: 0, borderTop: `3px dashed ${tone === 'red' ? 'rgba(255,200,200,0.25)' : 'rgba(255,255,255,0.15)'}`}} />
    <div style={{position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
  </div>
);

/** Spring entrance: opacity + rise + scale together (never a lone fade). */
const In: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number; dy?: number}> = ({at, children, style, from = 0.85, dy = 40}) => {
  const f = useCurrentFrame();
  const p = snap(f, at, 13, 170);
  return <div style={{opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * dy}px) scale(${from + (1 - from) * p})`, ...style}}>{children}</div>;
};
const Slam: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number}> = ({at, children, style, from = 2}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [at, at + 5], [from, 1], {...clamp, easing: Easing.in(Easing.quad)});
  return <div style={{opacity: ease(f, at, at + 3), transform: `scale(${s})`, ...style}}>{children}</div>;
};

const big = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: COND, fontWeight: 700, fontSize: size, lineHeight: 1, textTransform: 'uppercase', ...extra});

/* ================================================================ 1. ALERT — "Внимание! Уже завтра повышается цена билетов!" */
export const Alert: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.alert.from;
  const w = (i: number) => wf('s01', i, 'alert');
  const siren = 0.5 + 0.5 * Math.sin(f / 4);
  const g = f >= w(0) && f < w(0) + 8 ? 1 : f < w(0) ? 0.3 : 0;
  const sh = f >= w(3) && f < w(3) + 10 ? shake(f, 12 * (1 - (f - w(3)) / 10)) : {x: 0, y: 0};
  // red arrow draws upward
  const ap = ease(f, w(3), w(5) + 6, 0, 1, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
      <RedRoom abs={abs} glow={0.25 + 0.25 * siren * (1 - ease(f, w(1), w(1) + 10))} />
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${120 + 80 * siren}px rgba(255,20,40,${0.35 * (1 - ease(f, w(1), w(2)))})`}} />
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${-ease(f, w(1), w(1) + 10) * 60}px) scale(${1 - 0.45 * ease(f, w(1), w(1) + 10)})`}}>
        <Slam at={w(0) - 2} from={2.6}>
          <Glitchy amount={g} seed={4}>
            <div style={big(170, {color: '#fff', WebkitTextStroke: '4px #e0102f', textShadow: '0 0 40px rgba(255,30,50,0.8)'})}>ВНИМАНИЕ!</div>
          </Glitchy>
        </Slam>
      </div>
      <div style={{position: 'absolute', top: 600, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <Brush p={ease(f, w(1) - 3, w(1) + 9, 0, 1, Easing.out(Easing.cubic))} seed={3}>
          <div style={big(118, {color: '#fff', padding: '18px 40px', letterSpacing: '0.03em'})}>УЖЕ ЗАВТРА</div>
        </Brush>
        <Slam at={w(3) - 2} from={1.9}>
          <div style={big(160, {...goldText, filter: 'drop-shadow(0 6px 0 #4a2a00) drop-shadow(0 0 30px rgba(255,190,80,0.45))'})}>ПОВЫШАЕТСЯ</div>
        </Slam>
        <In at={w(4) - 2}>
          <div style={big(124, {color: C.bone, textShadow: '0 6px 20px rgba(0,0,0,0.7)'})}>ЦЕНА БИЛЕТОВ!</div>
        </In>
      </div>
      {/* rising arrow */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="ag">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d="M 110 1820 C 360 1760 560 1640 700 1540 S 900 1400 960 1320" fill="none" stroke="#ff2a3f" strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ap} filter="url(#ag)" />
        {ap > 0.95 && <path d="M 900 1290 L 990 1290 L 975 1380" fill="none" stroke="#ff2a3f" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" filter="url(#ag)" />}
      </svg>
    </AbsoluteFill>
  );
};

/* ================================================================ 2. PRICE — 750 ₽ now, 850 ₽ tomorrow */
export const Price: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.price.from;
  const w = (i: number) => wf('s02', i, 'price');
  const k = kick(abs);
  const now = Math.round(interpolate(f, [w(2) - 4, w(3) + 8], [0, 750], {...clamp, easing: Easing.out(Easing.cubic)}));
  const tom = Math.round(interpolate(f, [w(8) - 2, w(9) + 6], [750, 850], {...clamp, easing: Easing.out(Easing.quad)}));
  const hitTom = f >= w(8) + 18 && f < w(8) + 26 ? 1 : 0;
  const chev = (i: number) => 0.25 + 0.75 * Math.max(0, Math.sin((f - w(5)) / 4 - i * 0.9));
  return (
    <AbsoluteFill>
      <RedRoom abs={abs} glow={0.22} />
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <In at={w(0) - 3} dy={-30}>
          <div style={big(64, {color: C.bone, letterSpacing: '0.3em', paddingLeft: '0.3em'})}>ЦЕНА БИЛЕТА</div>
        </In>
      </div>
      {/* now */}
      <div style={{position: 'absolute', top: 340, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <In at={w(0) - 3} from={0.6} dy={120}>
          <div style={{transform: `rotate(-3deg) scale(${1 + 0.02 * k * (f < w(5) ? 1 : 0)})`}}>
            <Ticket w={760} h={420} tone="red" glow={f < w(5) ? 0.4 + 0.4 * k : 0.1}>
              <div style={big(78, {color: '#fff', letterSpacing: '0.08em'})}>СЕЙЧАС</div>
              <div style={big(200, {...goldText, marginTop: 10, filter: 'drop-shadow(0 6px 0 #4a1a00)'})}>{now} ₽</div>
            </Ticket>
          </div>
        </In>
      </div>
      {/* chevrons */}
      <div style={{position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: ease(f, w(5) - 4, w(5) + 4)}}>
        {[0, 1, 2].map((i) => (
          <svg key={i} width={140} height={60} viewBox="0 0 140 60" style={{marginTop: -10, opacity: chev(i), filter: 'drop-shadow(0 0 12px #ff2a3f)'}}>
            <path d="M 15 10 L 70 45 L 125 10" fill="none" stroke="#ff2a3f" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ))}
      </div>
      {/* tomorrow */}
      <div style={{position: 'absolute', top: 1040, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <In at={w(5) - 2} from={0.6} dy={120}>
          <div style={{transform: `rotate(2deg) translate(${hitTom ? shake(f, 8).x : 0}px, 0)`}}>
            <Ticket w={760} h={420} tone="dark" glow={f > w(8) ? 0.3 + 0.3 * k : 0}>
              <div style={big(78, {color: '#fff', letterSpacing: '0.08em'})}>ЗАВТРА</div>
              <div style={big(200, {color: f >= w(8) ? '#f2f2f2' : '#8a8a90', marginTop: 10, textShadow: '0 6px 0 #000', transition: 'none'})}>{f >= w(8) - 2 ? tom : 750} ₽</div>
            </Ticket>
          </div>
        </In>
      </div>
      {/* up arrow badge when the price jumps */}
      <div style={{position: 'absolute', top: 1500, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <In at={w(8) + 14} from={0.4} dy={20}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '14px 36px', borderRadius: 999, background: 'rgba(224,16,47,0.9)', boxShadow: `0 0 ${30 + 30 * k}px rgba(255,30,50,0.8)`}}>
            <svg width={56} height={56} viewBox="0 0 24 24">
              <path d="M12 3 L20 13 H15 V21 H9 V13 H4 Z" fill="#fff" />
            </svg>
            <span style={big(60, {color: '#fff'})}>ЦЕНА РАСТЁТ</span>
          </div>
        </In>
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================ 3. HURRY — hourglass + "успей купить билет по самой выгодной цене!" */
const Hourglass: React.FC<{p: number; size: number}> = ({p, size}) => {
  const f = useCurrentFrame();
  const top = 1 - p;
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 100 140" style={{filter: 'drop-shadow(0 0 10px #ff2a3f) drop-shadow(0 0 30px rgba(255,40,60,0.6))'}}>
      <defs>
        <clipPath id="topc">
          <path d="M 22 18 L 78 18 C 78 45 56 58 52 68 L 48 68 C 44 58 22 45 22 18 Z" />
        </clipPath>
        <clipPath id="botc">
          <path d="M 48 72 L 52 72 C 56 82 78 95 78 122 L 22 122 C 22 95 44 82 48 72 Z" />
        </clipPath>
      </defs>
      <rect x={22} y={18 + 50 * (1 - top)} width={56} height={50} fill="#ffb347" clipPath="url(#topc)" />
      <rect x={22} y={122 - 50 * p} width={56} height={50} fill="#ffb347" clipPath="url(#botc)" />
      {p < 0.98 && <rect x={49} y={66} width={2} height={56 - 50 * p} fill="#ffb347" opacity={0.6 + 0.4 * Math.sin(f)} />}
      <path d="M 22 18 L 78 18 C 78 45 56 58 52 70 C 56 82 78 95 78 122 L 22 122 C 22 95 44 82 48 70 C 44 58 22 45 22 18 Z" fill="none" stroke="#ff3b50" strokeWidth={4} />
      <rect x={14} y={8} width={72} height={10} rx={3} fill="none" stroke="#ff3b50" strokeWidth={4} />
      <rect x={14} y={122} width={72} height={10} rx={3} fill="none" stroke="#ff3b50" strokeWidth={4} />
    </svg>
  );
};
export const Hurry: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.hurry.from;
  const w = (i: number) => wf('s03', i, 'hurry');
  const flip = interpolate(f, [0, 12], [180, 0], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const sand = ease(f, 10, T.scenes.hurry.dur, 0, 1, Easing.inOut(Easing.sin));
  const words: [string, number][] = [
    ['УСПЕЙ', 0],
    ['КУПИТЬ', 1],
    ['БИЛЕТ', 2],
  ];
  return (
    <AbsoluteFill>
      <RedRoom abs={abs} glow={0.3} />
      <div style={{position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `rotate(${flip}deg) scale(${1 + 0.03 * Math.sin(f / 8)})`}}>
        <Hourglass p={sand} size={330} />
      </div>
      <div style={{position: 'absolute', top: 760, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 34px'}}>
        {words.map(([t, i]) => (
          <Slam key={t} at={w(i) - 2} from={1.7}>
            <div style={big(150, {color: '#fff', textShadow: '0 8px 24px rgba(0,0,0,0.8)'})}>{t}</div>
          </Slam>
        ))}
      </div>
      <div style={{position: 'absolute', top: 1140, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <Brush p={ease(f, w(3) - 3, w(3) + 9, 0, 1, Easing.out(Easing.cubic))} seed={9}>
          <div style={big(84, {color: '#fff', padding: '14px 34px'})}>ПО САМОЙ</div>
        </Brush>
        <In at={w(5) - 2} from={0.7}>
          <div style={big(140, {...goldText, filter: 'drop-shadow(0 6px 0 #4a2a00) drop-shadow(0 0 30px rgba(255,190,80,0.45))'})}>ВЫГОДНОЙ</div>
        </In>
        <In at={w(6) - 2} from={0.7}>
          <div style={big(140, {...goldText, filter: 'drop-shadow(0 6px 0 #4a2a00) drop-shadow(0 0 30px rgba(255,190,80,0.45))'})}>ЦЕНЕ!</div>
        </In>
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================ 4. PARTY — logo, Halloween, date + time */
const Calendar: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ff3b50" strokeWidth={1.8} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 8px rgba(255,40,60,0.8))'}}>
    <rect x={3} y={5} width={18} height={16} rx={2} />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
const Clock: React.FC<{size: number; t: number}> = ({size, t}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ff3b50" strokeWidth={1.8} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 8px rgba(255,40,60,0.8))'}}>
    <circle cx={12} cy={12} r={9} />
    <path d={`M12 12 L${12 + 5 * Math.sin(t)} ${12 - 5 * Math.cos(t)}`} />
    <path d={`M12 12 L${12 + 3.5 * Math.sin(t / 12)} ${12 - 3.5 * Math.cos(t / 12)}`} />
  </svg>
);
export const Party: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.party.from;
  const w = (i: number) => wf('s04', i, 'party');
  const k = kick(abs);
  const shrink = ease(f, w(4) - 8, w(4) + 6, 0, 1, Easing.inOut(Easing.cubic));
  const logoSize = 860 - 380 * shrink;
  const logoTop = 260 - 200 * shrink;
  return (
    <AbsoluteFill>
      <RedRoom abs={abs} glow={0.28} />
      <Moon size={240} x={900} y={170} glow={0.8} tint="rgba(255,60,50,0.55)" />
      <Bats start={w(3) - 10} dur={70} y={420} seed={21} n={7} scale={0.8} />
      <Logo size={logoSize} at={w(0) - 6} pulse={k} style={{left: (W - logoSize) / 2, top: logoTop}} />
      <div style={{position: 'absolute', top: 1100 - 560 * shrink, left: 0, right: 0, textAlign: 'center', transform: `scale(${1 - 0.3 * shrink})`}}>
        <In at={w(3) - 3} from={0.6}>
          <div style={{fontFamily: HORROR, fontSize: 130, color: C.pumpkin, textShadow: '0 6px 0 #4a0f00, 0 0 40px rgba(255,100,0,0.6)'}}>HALLOWEEN</div>
        </In>
      </div>
      {/* date */}
      <div style={{position: 'absolute', top: 720, left: 90, right: 90, display: 'flex', alignItems: 'center', gap: 40}}>
        <In at={w(4) - 2} from={0.5}>
          <Calendar size={150} />
        </In>
        <div>
          <In at={w(4) - 2}>
            <div style={big(230, {lineHeight: 0.9, ...goldText, filter: 'drop-shadow(0 5px 0 #4a2a00)'})}>31</div>
          </In>
          <In at={w(6) - 2}>
            <div style={big(84, {color: C.bone, letterSpacing: '0.06em'})}>ОКТЯБРЯ</div>
          </In>
          <In at={w(7) - 2}>
            <div style={big(54, {color: '#ff5a6e', letterSpacing: '0.3em', marginTop: 6})}>СУББОТА</div>
          </In>
        </div>
      </div>
      {/* time */}
      <div style={{position: 'absolute', top: 1150, left: 90, right: 90, display: 'flex', alignItems: 'center', gap: 40}}>
        <In at={w(8) - 2} from={0.5}>
          <Clock size={150} t={f / 6} />
        </In>
        <div>
          <In at={w(8) - 2}>
            <div style={big(58, {color: '#ff5a6e', letterSpacing: '0.3em'})}>ТАНЦУЕМ</div>
          </In>
          <In at={w(10) - 2}>
            <div style={big(132, {color: C.bone, whiteSpace: 'nowrap'})}>
              23:30 <span style={{opacity: ease(f, w(13) - 2, w(13) + 6)}}>– 05:00</span>
            </div>
          </In>
        </div>
      </div>
      <Pumpkin3D size={600} appear={snap(f, w(3) - 4, 13, 100)} turn={Math.sin(f / 30) * 0.4} glow={0.6 + 0.6 * k} style={{left: (W - 600) / 2, top: 1380}} />
    </AbsoluteFill>
  );
};

/* ================================================================ 5. VENUE — HyperFrames insert */
export const Venue: React.FC = () => (
  <AbsoluteFill style={{background: C.night}}>
    <OffthreadVideo src={staticFile('hf/venue.mp4')} muted />
  </AbsoluteFill>
);

/* ================================================================ 6. POSTER — the client's poster: close-up on the couple, pull back, hold */
export const Poster: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.poster.from;
  const w = (i: number) => wf('s06', i, 'poster');
  const k = kick(abs);
  // camera keyframes: couple close-up -> title -> full poster
  const kf = [0, 55, 100, 128];
  const sc = interpolate(f, kf, [1.85, 1.6, 1.35, 1.0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cy = interpolate(f, kf, [420, 700, 900, 960], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cx = interpolate(f, kf, [560, 540, 540, 540], clamp);
  const tx = W / 2 - cx * sc;
  const ty = H / 2 - cy * sc;
  const reveal = ease(f, 0, 8);
  const textOn = ease(f, w(0) - 4, w(0) + 6) * (1 - ease(f, 100, 112));
  const sweep = (a: number) => ease(f, a, a + 26, 0, 1, Easing.inOut(Easing.quad));
  const breathe = f > 128 ? 1 + 0.008 * Math.sin((f - 120) / 20) : 1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${sc * breathe})`, transformOrigin: '0 0', opacity: reveal}}>
        <Img src={staticFile('img/poster.jpg')} style={{width: W, height: H}} />
        {/* light sweeps over the title and the price ticket once the full poster is visible */}
        {[
          [136, 470, 600, 330],
          [160, 1220, 1440, 240],
        ].map(([at, y0, y1, ww], i) => {
          const p = sweep(at);
          if (p <= 0 || p >= 1) return null;
          return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y0, height: y1 - y0, background: `linear-gradient(105deg, transparent ${p * 140 - 30}%, rgba(255,235,190,0.45) ${p * 140 - 20}%, transparent ${p * 140 - 10}%)`, mixBlendMode: 'screen', width: W, maxWidth: ww * 10}} />;
        })}
      </AbsoluteFill>
      {/* candle flicker & embers over the hold */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 55%, transparent 55%, rgba(255,90,20,${0.06 + 0.04 * Math.sin(f / 3) + 0.05 * k}) 100%)`, mixBlendMode: 'screen'}} />
      <Embers n={26} seed={33} color="#FFB060" opacity={0.6} size={0.8} />
      {/* tagline over the close-up */}
      <AbsoluteFill style={{opacity: textOn, background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.9) 78%)'}}>
        <div style={{position: 'absolute', bottom: 300, left: 60, right: 60, textAlign: 'center'}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: C.bone, textShadow: '0 4px 20px #000'}}>Не упусти…</div>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 76, ...goldText, marginTop: 8, opacity: ease(f, w(2) - 3, w(2) + 6)}}>увидимся на танцполе</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const _unused = {DISPLAY};
