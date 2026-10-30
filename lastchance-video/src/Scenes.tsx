import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Bokeh, Particles, Smoke} from './components/FX';
import {Mask} from './components/Shapes';
import {C, H, ITALIC, SANS, T, W, clamp, ease, gold, handheld, kick, rand, snap, wf} from './theme';

/* ---------- type ---------- */
const shadow = '0 4px 18px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)';

/** A word that rises out of blur exactly when the narrator says it. */
const Word: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number}> = ({at, children, style, from = 40}) => {
  const f = useCurrentFrame();
  const p = snap(f, at - 2, 13, 190);
  return (
    <span style={{display: 'inline-block', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * from}px) scale(${0.9 + 0.1 * p})`, filter: `blur(${Math.max(0, 1 - p) * 12}px)`, ...style}}>
      {children}
    </span>
  );
};
const Small: React.CSSProperties = {fontFamily: ITALIC, fontStyle: 'italic', fontWeight: 600, fontSize: 62, color: C.ivory, textShadow: shadow};
const Label: React.CSSProperties = {fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 12, color: C.gold, textShadow: shadow};
const Big = (size: number, color: string = C.ivory, glow = 'rgba(224,16,47,0.6)'): React.CSSProperties => ({
  fontFamily: SANS,
  fontWeight: 800,
  fontSize: size,
  lineHeight: 0.95,
  letterSpacing: -2,
  color,
  textShadow: `0 0 30px ${glow}, 0 0 80px ${glow}, ${shadow}`,
});
const Gold = (size: number): React.CSSProperties => ({...Big(size), ...gold, textShadow: 'none', filter: 'drop-shadow(0 0 24px rgba(231,194,125,0.55)) drop-shadow(0 6px 10px rgba(0,0,0,0.9))'});
const Block: React.FC<{top: number; children: React.ReactNode; gap?: number}> = ({top, children, gap = 14}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap}}>{children}</div>
);
const Night: React.FC<{tint?: string}> = ({tint = '#3b0a10'}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 55%, ${tint} 0%, #120306 60%, #050304 100%)`}} />
);

/* ---------- transitions ---------- */
export type Tr = 'whip' | 'zoom' | 'none';
export const Wrap: React.FC<{dur: number; enter?: Tr; exit?: Tr; dir?: number; children: React.ReactNode}> = ({dur, enter = 'whip', exit = 'whip', dir = 1, children}) => {
  const f = useCurrentFrame();
  const pin = 1 - ease(f, 0, 6, 0, 1);
  const pout = ease(f, dur - 6, dur, 0, 1, Easing.in(Easing.cubic));
  const tr: string[] = [];
  let blur = 0;
  if (enter === 'whip') {
    tr.push(`translateX(${dir * pin * W * 0.6}px)`);
    blur += pin * 30;
  }
  if (enter === 'zoom') {
    tr.push(`scale(${1 + pin * 0.5})`);
    blur += pin * 22;
  }
  if (exit === 'whip') {
    tr.push(`translateX(${-dir * pout * W * 0.6}px)`);
    blur += pout * 30;
  }
  if (exit === 'zoom') {
    tr.push(`scale(${1 + pout * 0.6})`);
    blur += pout * 22;
  }
  return <AbsoluteFill style={{overflow: 'hidden', transform: tr.join(' '), filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>;
};

/* ---------- shared props ---------- */
const Ticket: React.FC<{w: number; children: React.ReactNode; glow?: number}> = ({w, children, glow = 1}) => (
  <div style={{position: 'relative', width: w, height: w * 0.52}}>
    <svg width={w} height={w * 0.52} viewBox="0 0 400 208" style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 ${40 * glow}px rgba(231,194,125,0.5)) drop-shadow(0 30px 40px rgba(0,0,0,0.8))`}}>
      <defs>
        <linearGradient id="tk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a0010" />
          <stop offset="0.5" stopColor="#B3001B" />
          <stop offset="1" stopColor="#3a0008" />
        </linearGradient>
        <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF3C8" />
          <stop offset="0.4" stopColor="#E7C27D" />
          <stop offset="0.7" stopColor="#8E5E1E" />
          <stop offset="1" stopColor="#F5D58E" />
        </linearGradient>
      </defs>
      <path d="M14 0 H386 A14 14 0 0 0 400 14 V84 A20 20 0 0 0 400 124 V194 A14 14 0 0 0 386 208 H14 A14 14 0 0 0 0 194 V124 A20 20 0 0 0 0 84 V14 A14 14 0 0 0 14 0 Z" fill="url(#tk)" stroke="url(#tg)" strokeWidth={4} />
      <rect x={14} y={14} width={372} height={180} rx={8} fill="none" stroke="url(#tg)" strokeWidth={1.5} strokeDasharray="6 5" />
      <line x1={300} y1={20} x2={300} y2={188} stroke="url(#tg)" strokeWidth={2} strokeDasharray="4 6" />
    </svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: w * 0.25}}>{children}</div>
    <div style={{position: 'absolute', right: w * 0.04, top: 0, bottom: 0, width: w * 0.17, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: 'rotate(-90deg)', fontFamily: SANS, fontWeight: 800, fontSize: w * 0.045, letterSpacing: 6, color: C.gold, whiteSpace: 'nowrap'}}>LATIN FUSION</div>
    </div>
  </div>
);

const Pumpkin: React.FC<{size: number; glow: number}> = ({size, glow}) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${20 * glow}px rgba(255,140,40,0.7))`}}>
    <defs>
      <radialGradient id="pk" cx="0.4" cy="0.35" r="0.8">
        <stop offset="0" stopColor="#FFB040" />
        <stop offset="0.6" stopColor="#E06A10" />
        <stop offset="1" stopColor="#7a2a00" />
      </radialGradient>
    </defs>
    <path d="M-4 -40 C -2 -52 6 -56 12 -54 C 6 -50 4 -46 4 -40 Z" fill="#3a5a10" />
    {[-30, -12, 12, 30].map((x, i) => (
      <ellipse key={i} cx={x * 0.9} cy={4} rx={26} ry={42} fill="url(#pk)" />
    ))}
    <ellipse cx={0} cy={4} rx={28} ry={44} fill="url(#pk)" />
    <g fill={`rgba(255,230,120,${0.6 + 0.4 * glow})`}>
      <path d="M-30 -8 L -14 -18 L -10 -2 Z" />
      <path d="M30 -8 L 14 -18 L 10 -2 Z" />
      <path d="M-34 14 Q 0 44 34 14 L 22 18 L 14 10 L 6 20 L -6 10 L -14 20 L -22 12 Z" />
    </g>
  </svg>
);

/* ---------- 1 · ВНИМАНИЕ! ---------- */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'hook';
  const hit = wf('n1', 0, S);
  const strobe = f >= hit && f < hit + 14 ? (Math.floor((f - hit) / 2) % 2 ? 0.0 : 0.35) : 0;
  const shake = f >= hit && f < hit + 8 ? (rand(f) - 0.5) * 30 : 0;
  const sweep = (f / 26) % 1;
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${-shake * 0.5}px)`}}>
      <Night tint="#5a0812" />
      {/* rotating alarm light */}
      <AbsoluteFill style={{background: `conic-gradient(from ${sweep * 360}deg at 50% 38%, rgba(255,30,60,0.5), transparent 18%, transparent 50%, rgba(255,30,60,0.5) 68%, transparent 86%)`, mixBlendMode: 'screen', opacity: 0.6}} />
      <AbsoluteFill style={{background: C.blood, opacity: strobe, mixBlendMode: 'screen'}} />
      {/* hazard tape */}
      {[0, 1].map((i) => (
        <div key={i} style={{position: 'absolute', left: -200, width: W + 400, top: i ? 1560 : 300, height: 70, transform: `rotate(${i ? 6 : -6}deg) translateX(${(i ? -1 : 1) * ((f * 6) % 140) - 140}px)`, background: `repeating-linear-gradient(45deg, ${C.gold} 0 50px, #0a0204 50px 100px)`, opacity: ease(f, hit, hit + 6, 0, 0.9), boxShadow: '0 10px 30px rgba(0,0,0,0.7)'}} />
      ))}
      <Block top={560} gap={24}>
        <Word at={hit} from={-80} style={Big(132, C.ivory, 'rgba(255,30,60,0.9)')}>
          ВНИМАНИЕ!
        </Word>
        <Word at={wf('n1', 1, S)} style={Gold(118)}>
          ПОСЛЕДНИЙ
        </Word>
        <Word at={wf('n1', 2, S)} style={Gold(160)}>
          ШАНС
        </Word>
        <Word at={wf('n1', 3, S)} style={{...Small, marginTop: 20}}>
          купить билет по выгодной цене
        </Word>
      </Block>
      <div style={{position: 'absolute', left: 80, top: 1250, transform: `rotate(-8deg) scale(${snap(f, wf('n1', 4, S), 12, 170)})`}}>
        <Pumpkin size={230} glow={0.5 + 0.5 * Math.sin(f / 3)} />
      </div>
      <div style={{position: 'absolute', right: 70, top: 1230, transform: `rotate(10deg) scale(${snap(f, wf('n1', 6, S), 12, 170)})`}}>
        <Pumpkin size={260} glow={0.5 + 0.5 * Math.cos(f / 3)} />
      </div>
      <Particles n={30} seed={2} color="255,90,90" opacity={0.7} rise={1.5} />
    </AbsoluteFill>
  );
};

/* ---------- 2 · logo · уже завтра ---------- */
export const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'logo';
  const dur = T.scenes.logo.dur;
  const push = 1 + 0.06 * (f / dur);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(2.3)', filter: 'blur(40px) brightness(0.55) saturate(1.3)'}}>
        <OffthreadVideo src={staticFile('clips/intro.mp4')} startFrom={40} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Bokeh n={12} seed={4} color="255,120,200" opacity={0.35} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${push})`}}>
        <div style={{width: W, height: (W * 752) / 848, WebkitMaskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)', maskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)'}}>
          <OffthreadVideo src={staticFile('clips/intro.mp4')} startFrom={40} muted style={{width: '100%', height: '100%'}} />
        </div>
      </AbsoluteFill>
      <Particles n={30} seed={8} color="255,190,240" opacity={0.6} />
      <Block top={230}>
        <Word at={wf('n2', 0, S)} style={Small}>
          уже
        </Word>
        <Word at={wf('n2', 1, S)} style={Big(130)}>
          ЗАВТРА
        </Word>
      </Block>
      <Block top={1480}>
        <Word at={wf('n2', 5, S)} style={Gold(70)}>
          HALLOWEEN EDITION
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 3 · СЕГОДНЯ — последний день (clock ticks into the stop) ---------- */
export const Today: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'today';
  const s0 = T.scenes.today.from;
  const stop = T.stop[0] - s0;
  const ticks = Math.floor(Math.max(0, f - 10) / T.beat);
  const tickP = ease((f - 10) % T.beat, 0, 4, 0, 1, Easing.out(Easing.back(3)));
  const ang = (ticks + (f > 10 ? tickP : 0)) * 30;
  const dark = ease(f, stop - 2, stop + 2, 0, 0.85);
  const zoom = 1 + 0.1 * ease(f, 0, stop, 0, 1, Easing.in(Easing.quad));
  return (
    <AbsoluteFill>
      <Night tint="#2a0a24" />
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFF3C8" />
              <stop offset="0.5" stopColor="#B9832E" />
              <stop offset="1" stopColor="#F5D58E" />
            </linearGradient>
          </defs>
          <g transform={`translate(${W / 2} 1180)`}>
            <circle r={330} fill="rgba(10,3,6,0.85)" stroke="url(#cg)" strokeWidth={14} />
            <circle r={300} fill="none" stroke="url(#cg)" strokeWidth={2} strokeDasharray="3 10" />
            {new Array(12).fill(0).map((_, i) => (
              <rect key={i} x={-6} y={-290} width={12} height={i % 3 ? 26 : 50} fill="url(#cg)" transform={`rotate(${i * 30})`} />
            ))}
            {/* countdown arc: the day running out */}
            <circle r={250} fill="none" stroke={C.blood} strokeWidth={22} strokeDasharray={`${2 * Math.PI * 250}`} strokeDashoffset={2 * Math.PI * 250 * (f / stop)} transform="rotate(-90)" opacity={0.8} style={{filter: 'drop-shadow(0 0 16px rgba(224,16,47,0.8))'}} />
            <rect x={-8} y={-170} width={16} height={180} rx={8} fill={C.ivory} transform={`rotate(${330})`} />
            <rect x={-5} y={-240} width={10} height={250} rx={5} fill={C.blood} transform={`rotate(${ang})`} />
            <circle r={18} fill="url(#cg)" />
          </g>
        </svg>
      </AbsoluteFill>
      <Block top={190}>
        <Word at={wf('n3', 0, S)} style={Big(140)}>
          СЕГОДНЯ
        </Word>
        <Word at={wf('n3', 1, S)} style={Big(78, C.blood, 'rgba(255,40,70,0.7)')}>
          ПОСЛЕДНИЙ ДЕНЬ
        </Word>
        <Word at={wf('n3', 3, S)} style={{...Small, marginTop: 10}}>
          когда билет стоит всего…
        </Word>
      </Block>
      <AbsoluteFill style={{background: '#000', opacity: dark}} />
      <Particles n={20} seed={14} color="255,200,120" opacity={0.6} />
    </AbsoluteFill>
  );
};

/* ---------- 4 · 850 ₽ on the drop ---------- */
export const Price: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'price';
  const p = snap(f, 0, 9, 200);
  const k = kick(T.scenes.price.from + f);
  const ring = ease(f, 0, 20, 0, 1);
  return (
    <AbsoluteFill>
      <Night tint="#6a0a14" />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(255,200,120,0.35), transparent 55%)', opacity: 0.6 + 0.4 * k}} />
      {[0, 1].map((i) => (
        <div key={i} style={{position: 'absolute', left: W / 2, top: 960, width: 10, height: 10, borderRadius: '50%', border: `${6 - i * 2}px solid ${C.gold}`, transform: `translate(-50%,-50%) scale(${(ring - i * 0.15) * 160})`, opacity: Math.max(0, 1 - ring - i * 0.1)}} />
      ))}
      {/* confetti burst */}
      {new Array(60).fill(0).map((_, i) => {
        const a = rand(i * 3.1) * Math.PI * 2;
        const v = 18 + rand(i * 7.7) * 30;
        const x = W / 2 + Math.cos(a) * v * f;
        const y = 960 + Math.sin(a) * v * f + 0.9 * f * f;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 14, height: 26, background: i % 3 ? C.gold : C.blood, transform: `rotate(${f * 20 + i * 40}deg)`, opacity: 1 - f / 58}} />;
      })}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{transform: `scale(${(0.4 + 0.6 * p) * (1 + 0.04 * k)}) rotate(${(1 - p) * -10}deg)`}}>
          <Ticket w={960}>
            <div style={{textAlign: 'center'}}>
              <div style={{...Label, fontSize: 34, letterSpacing: 10}}>ВСЕГО</div>
              <div style={{...Gold(210), lineHeight: 1}}>850 ₽</div>
            </div>
          </Ticket>
        </div>
      </AbsoluteFill>
      <Block top={1390}>
        <Word at={wf('n4', 2, S)} style={{...Big(70), whiteSpace: 'nowrap'}}>
          🔥 ТОЛЬКО СЕГОДНЯ 🔥
        </Word>
      </Block>
      <Particles n={40} seed={19} color="255,205,120" opacity={0.9} rise={2.5} />
    </AbsoluteFill>
  );
};

/* ---------- 5 · price ladder ---------- */
const ROWS: [string, string, string, string, number][] = [
  // icon, when, price, colour, n5 word index that reveals the row (-1: at once)
  ['🔥', 'СЕГОДНЯ', '850 ₽', C.gold, -1],
  ['⚡', 'ЗАВТРА ДО 23:30', '950 ₽', C.ivory, 5],
  ['🌙', 'ПОСЛЕ 23:30 НА САЙТЕ', '1000 ₽', C.ivory, 7],
  ['🚪', 'НА ВХОДЕ В КЛУБ', '1500 ₽', C.blood, 13],
];
export const Ladder: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'ladder';
  const hh = handheld(f, 3, 5);
  return (
    <AbsoluteFill>
      <Night tint="#2a0610" />
      <Bokeh n={14} seed={31} color="255,170,80" opacity={0.4} />
      <Block top={200}>
        <Word at={0} style={Label}>
          🎟️ ЦЕНЫ НА БИЛЕТЫ
        </Word>
        <Word at={4} style={Big(96)}>
          ЦЕНА РАСТЁТ
        </Word>
      </Block>
      <div style={{position: 'absolute', left: 60, right: 60, top: 560, display: 'flex', flexDirection: 'column', gap: 34, transform: `translate(${hh.x}px, ${hh.y}px)`}}>
        {ROWS.map(([icon, when, price, col, wi], i) => {
          const at = wi < 0 ? 2 : wf('n5', wi, S);
          const p = snap(f, at, 12, 170);
          const first = i === 0;
          const pulse = first ? 0.5 + 0.5 * Math.sin(f / 5) : 0;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '30px 40px',
                borderRadius: 26,
                background: first ? 'linear-gradient(90deg, rgba(179,0,27,0.85), rgba(90,0,16,0.85))' : 'rgba(20,6,10,0.78)',
                border: `3px solid ${first ? C.gold : 'rgba(231,194,125,0.35)'}`,
                boxShadow: first ? `0 0 ${30 + 30 * pulse}px rgba(231,194,125,0.5)` : '0 20px 40px rgba(0,0,0,0.5)',
                transform: `translateX(${(1 - p) * (i % 2 ? 1 : -1) * 700}px) scale(${first ? 1.04 : 1})`,
                opacity: Math.min(1, p * 1.5),
              }}
            >
              <div style={{fontSize: 64}}>{icon}</div>
              <div style={{flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.ivory, lineHeight: 1.1}}>{when}</div>
              <div style={first ? Gold(92) : {...Big(84, col, col === C.blood ? 'rgba(255,40,70,0.6)' : 'rgba(0,0,0,0)')}}>{price}</div>
            </div>
          );
        })}
      </div>
      {/* rising arrow */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <path d="M120 1560 C 400 1520 700 1460 960 1330" stroke={C.blood} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={1000} strokeDashoffset={1000 * (1 - ease(f, wf('n5', 13, S), wf('n5', 13, S) + 14, 0, 1))} style={{filter: 'drop-shadow(0 0 14px rgba(224,16,47,0.9))'}} />
      </svg>
      <Block top={1620}>
        <Word at={wf('n5', 13, S) + 6} style={{...Small, fontSize: 54}}>
          успей сегодня — 850 ₽
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 6 · Зачем платить больше? ---------- */
export const Why: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'why';
  const g = f % 6 < 2 && f < 20 ? (rand(f) - 0.5) * 40 : 0;
  const strike = ease(f, wf('n6', 2, S) + 4, wf('n6', 2, S) + 12, 0, 1);
  return (
    <AbsoluteFill>
      <Night tint="#40060e" />
      <Block top={420} gap={20}>
        <Word at={wf('n6', 0, S)} style={Big(120)}>
          ЗАЧЕМ
        </Word>
        <Word at={wf('n6', 1, S)} style={Big(120)}>
          ПЛАТИТЬ
        </Word>
        <Word at={wf('n6', 2, S)} style={{...Big(170, C.blood, 'rgba(255,40,70,0.8)'), transform: `translateX(${g}px)`}}>
          БОЛЬШЕ?
        </Word>
      </Block>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1180, display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'center'}}>
        <div style={{position: 'relative', ...Big(110, 'rgba(248,238,228,0.6)', 'rgba(0,0,0,0)')}}>
          1500 ₽
          <div style={{position: 'absolute', left: -10, top: '50%', height: 12, width: `${strike * 110}%`, background: C.blood, transform: 'rotate(-8deg)', boxShadow: '0 0 20px rgba(224,16,47,0.9)'}} />
        </div>
        <div style={{...Big(90, C.gold, 'rgba(0,0,0,0)'), opacity: strike}}>→</div>
        <div style={{...Gold(130), opacity: strike, transform: `scale(${0.6 + 0.4 * snap(f, wf('n6', 2, S) + 10, 10, 200)})`}}>850 ₽</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 7 · vibes over poster close-ups ---------- */
const PW = 1122;
const PH = 1402;
const SHOTS: [number, number, number, number][] = [
  [230, 30, 520, 1],
  [150, 40, 440, -1],
  [800, 20, 320, 1],
  [0, 250, 340, -1],
  [370, 150, 340, 1],
  [820, 280, 300, -1],
];
const CARD = 1000;
const CARD_TOP = 470;
const Crop: React.FC<{x: number; y: number; size: number; px: number; drift: number}> = ({x, y, size, px, drift}) => (
  <Img src={staticFile('img/poster.png')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: `scale(${px / size}) translate(${-x - drift}px, ${-y}px)`}} />
);
const PosterShot: React.FC<{x: number; y: number; size: number; dir: number; len: number}> = ({x, y, size, dir, len}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 4], [1.15, 1], {...clamp, easing: Easing.out(Easing.cubic)}) * (1 + 0.07 * (f / len));
  const drift = dir * 0.05 * size * (f / len);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', filter: 'blur(30px) brightness(0.5)', transform: 'scale(1.2)'}}>
        <div style={{position: 'absolute', left: (W - H) / 2, top: 0, width: H, height: H, overflow: 'hidden'}}>
          <Crop x={x} y={y} size={size} px={H} drift={drift} />
        </div>
      </div>
      <div style={{position: 'absolute', left: (W - CARD) / 2, top: CARD_TOP, width: CARD, height: CARD, overflow: 'hidden', borderRadius: 18, border: '2px solid rgba(231,194,125,0.7)', boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(224,16,47,0.35)'}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`}}>
          <Crop x={x} y={y} size={size} px={CARD} drift={drift} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const Vibes: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'vibes';
  const dur = T.scenes.vibes.dur;
  const step = Math.round(T.beat * 2);
  const k = kick(T.scenes.vibes.from + f);
  const hh = handheld(f, 8, 13);
  const n = Math.ceil(dur / step);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {new Array(n).fill(0).map((_, i) => {
        const [x, y, size, dir] = SHOTS[i % SHOTS.length];
        const from = i * step;
        const len = Math.min(step, dur - from);
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <AbsoluteFill style={{transform: `translate(${hh.x}px, ${hh.y}px) scale(${1.04 + 0.04 * k})`, filter: `contrast(1.1) saturate(1.15) brightness(${0.95 + 0.2 * k})`}}>
              <PosterShot x={x} y={y} size={size} dir={dir} len={len} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: W / 2 - 60, top: -200, width: 120, height: H * 1.3, transformOrigin: '50% 0', transform: `rotate(${Math.sin(f / 10 + i * 2) * 35 + (i - 1) * 25}deg)`, background: `linear-gradient(180deg, rgba(${i === 1 ? '255,200,120' : '255,40,70'},0.5), transparent 80%)`, filter: 'blur(14px)', mixBlendMode: 'screen', opacity: 0.4 + 0.5 * k}} />
      ))}
      <Particles n={40} seed={17} color="255,205,120" opacity={0.8} rise={2} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 24%, transparent 72%, rgba(0,0,0,0.75) 100%)'}} />
      <Block top={150}>
        <div style={{display: 'flex', gap: 24}}>
          <Word at={wf('n7', 1, S)} style={Big(74)}>
            🎭 КОСТЮМЫ
          </Word>
          <Word at={wf('n7', 3, S)} style={Big(74, C.gold, 'rgba(231,194,125,0.4)')}>
            ДРУЗЬЯ
          </Word>
        </div>
      </Block>
      <Block top={1520} gap={8}>
        <Word at={wf('n7', 4, S)} style={{...Big(54, C.ivory), whiteSpace: 'nowrap'}}>
          ГОРЯЧИЕ ЛАТИНСКИЕ РИТМЫ
        </Word>
        <Word at={wf('n7', 8, S)} style={{...Big(76, C.blood, 'rgba(255,40,70,0.7)'), whiteSpace: 'nowrap'}}>
          ЭМОЦИИ ДО УТРА ❤️‍🔥
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 8 · date · time · venue ---------- */
const Icon: React.FC<{kind: 'cal' | 'clock' | 'pin'; size: number}> = ({kind, size}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{filter: 'drop-shadow(0 0 12px rgba(224,16,47,0.8))'}}>
    <g fill="none" stroke={C.blood} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'cal' && (
        <>
          <rect x={-38} y={-30} width={76} height={70} rx={10} />
          <line x1={-38} y1={-10} x2={38} y2={-10} />
          <line x1={-18} y1={-42} x2={-18} y2={-22} />
          <line x1={18} y1={-42} x2={18} y2={-22} />
        </>
      )}
      {kind === 'clock' && (
        <>
          <circle r={40} />
          <path d="M0 -22 V0 L16 12" />
        </>
      )}
      {kind === 'pin' && (
        <>
          <path d="M0 44 C -20 18 -34 2 -34 -14 A 34 34 0 0 1 34 -14 C 34 2 20 18 0 44 Z" />
          <circle cy={-14} r={12} />
        </>
      )}
    </g>
  </svg>
);
const InfoRow: React.FC<{at: number; icon: 'cal' | 'clock' | 'pin'; title: React.ReactNode; sub?: React.ReactNode; i: number}> = ({at, icon, title, sub, i}) => {
  const f = useCurrentFrame();
  const p = snap(f, at, 12, 170);
  return (
    <div style={{display: 'flex', gap: 34, alignItems: 'center', transform: `translateX(${(1 - p) * (i % 2 ? 600 : -600)}px)`, opacity: Math.min(1, p * 1.5)}}>
      <Icon kind={icon} size={120} />
      <div>
        <div style={{...Gold(76), lineHeight: 1.05}}>{title}</div>
        {sub && <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, color: C.ivory, letterSpacing: 2, marginTop: 8, lineHeight: 1.3, textShadow: shadow}}>{sub}</div>}
      </div>
    </div>
  );
};
export const Info: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'info';
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${1.3 + 0.05 * (f / 140)})`, filter: 'blur(26px) brightness(0.35) saturate(1.2)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Smoke opacity={0.3} speed={0.6} tint="rgba(255,150,120,1)" />
      <Bokeh n={10} seed={51} color="255,150,70" opacity={0.4} />
      <div style={{position: 'absolute', left: 90, right: 60, top: 470, display: 'flex', flexDirection: 'column', gap: 90}}>
        <InfoRow i={0} at={wf('n8', 0, S)} icon="cal" title="31 ОКТЯБРЯ" sub="СУББОТА" />
        <InfoRow i={1} at={wf('n8', 3, S)} icon="clock" title="23:30 – 05:00" sub="ТАНЦУЕМ ДО УТРА" />
        <InfoRow i={2} at={wf('n8', 4, S)} icon="pin" title="TEMPLE BAR" sub={<>м. Курская, Нижний Сусальный<br />переулок, 5, стр. 4а</>} />
      </div>
      <div style={{position: 'absolute', left: W / 2 - 230, top: 1420, transform: `scale(${snap(f, wf('n8', 6, S), 12, 160)})`, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.8))'}}>
        <Mask size={460} color={C.crimson} />
      </div>
      <Particles n={26} seed={26} color="255,180,90" opacity={0.7} />
    </AbsoluteFill>
  );
};

/* ---------- 9 · CTA ---------- */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'cta';
  const site = wf('n9', 8, S);
  const tap = wf('n9', 11, S);
  const press = f >= tap && f < tap + 6 ? 0.94 : 1;
  const ripple = ease(f, tap, tap + 16, 0, 1);
  const k = kick(T.scenes.cta.from + f);
  return (
    <AbsoluteFill>
      <Night tint="#5a0812" />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 62%, rgba(231,194,125,0.25), transparent 50%)', opacity: 0.6 + 0.4 * k}} />
      <Block top={170} gap={10}>
        <Word at={wf('n9', 0, S)} style={Big(84)}>
          НЕ ОТКЛАДЫВАЙ
        </Word>
        <Word at={wf('n9', 2, S)} style={Big(84, C.blood, 'rgba(255,40,70,0.7)')}>
          НА ЗАВТРА!
        </Word>
        <Word at={wf('n9', 4, S)} style={{...Small, marginTop: 30}}>
          покупай билет сегодня за
        </Word>
      </Block>
      <div style={{position: 'absolute', left: (W - 860) / 2, top: 700, transform: `scale(${snap(f, wf('n9', 6, S), 11, 190) * (1 + 0.03 * k)}) rotate(-3deg)`}}>
        <Ticket w={860}>
          <div style={Gold(190)}>850 ₽</div>
        </Ticket>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1340, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', transform: `scale(${snap(f, site, 12, 170) * press})`}}>
          <div style={{padding: '34px 70px', borderRadius: 999, background: 'linear-gradient(180deg, #F7DC9A, #B9832E)', boxShadow: `0 0 ${40 + 30 * k}px rgba(231,194,125,0.7), 0 20px 40px rgba(0,0,0,0.6)`, fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#2a0508', letterSpacing: 1}}>
            🌐 latinfusion.ru
          </div>
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 600, height: 600, marginLeft: -300, marginTop: -300, borderRadius: '50%', border: `6px solid ${C.gold}`, transform: `scale(${ripple * 1.4})`, opacity: f >= tap ? 1 - ripple : 0}} />
          {/* tapping finger */}
          <div style={{position: 'absolute', right: 30, top: 70 + (f < tap ? 40 * (1 - ease(f, tap - 10, tap, 0, 1)) : 0), fontSize: 110, opacity: ease(f, site + 4, site + 10, 0, 1)}}>👆</div>
        </div>
      </div>
      <Block top={1620}>
        <Word at={wf('n9', 8, S) + 4} style={Label}>
          БИЛЕТЫ НА ОФИЦИАЛЬНОМ САЙТЕ
        </Word>
      </Block>
      <Particles n={30} seed={33} color="255,205,120" opacity={0.8} rise={2} />
    </AbsoluteFill>
  );
};

/* ---------- 10 · poster finale ---------- */
export const Final: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'final';
  const dur = T.scenes.final.dur;
  const pin = snap(f, 0, 16, 110);
  const push = 1 + 0.05 * (f / dur);
  const sweep = interpolate(f, [10, 40], [-0.4, 1.4], clamp);
  const ph = (W * PH) / PW;
  const top = 70;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.4)', filter: 'blur(36px) brightness(0.45) saturate(1.3)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top, width: W, height: ph, transform: `scale(${(0.86 + 0.14 * pin) * push})`, opacity: Math.min(1, pin * 1.5), overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 4%, #000 92%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 4%, #000 92%, transparent 100%)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%'}} />
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${sweep * 100}%`, width: '22%', transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, transparent, rgba(255,236,190,0.55), transparent)', mixBlendMode: 'screen'}} />
      </div>
      <Smoke opacity={0.3} speed={0.6} tint="rgba(255,150,120,1)" />
      <Particles n={36} seed={23} color="255,180,90" opacity={0.85} />
      <Block top={top + ph + 10} gap={6}>
        <Word at={wf('n10', 0, S)} style={Big(66)}>
          ЭТУ НОЧЬ ТЫ
        </Word>
        <Word at={wf('n10', 3, S)} style={{...Gold(78), whiteSpace: 'nowrap'}}>
          ЗАПОМНИШЬ НАДОЛГО!
        </Word>
        <Word at={wf('n10', 4, S) + 8} style={{...Label, marginTop: 10}}>
          🎟️ LATINFUSION.RU · 850 ₽
        </Word>
      </Block>
      <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [dur - 14, dur], [0, 1], clamp)}} />
    </AbsoluteFill>
  );
};

