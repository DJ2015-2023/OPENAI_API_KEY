import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
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

/* ---------- shared scenery ---------- */
const Moon: React.FC<{size: number; glow?: number}> = ({size, glow = 1}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at 40% 38%, #ffd9c0 0%, #ff8a6a 35%, #c0202e 70%, #6a0010 100%)', boxShadow: `0 0 ${120 * glow}px ${30 * glow}px rgba(224,40,50,0.55), 0 0 ${300 * glow}px rgba(224,16,47,0.35)`}} />
);
const Castle: React.FC<{y: number; color?: string}> = ({y, color = '#070204'}) => (
  <svg width={W} height={H - y} viewBox={`0 0 ${W} ${H - y}`} style={{position: 'absolute', left: 0, top: y}}>
    <path
      d={`M0 260 L0 170 L60 170 L60 120 L90 120 L90 170 L160 170 L160 60 L175 20 L190 60 L190 170 L260 170 L260 110 L300 110 L300 170 L380 170 L380 40 L400 0 L420 40 L420 110 L470 110 L470 70 L485 30 L500 70 L500 170 L620 170 L620 90 L660 90 L660 170 L740 170 L740 50 L755 10 L770 50 L770 170 L860 170 L860 120 L900 120 L900 170 L980 170 L980 80 L995 40 L1010 80 L1010 170 L${W} 170 L${W} ${H} L0 ${H} Z`}
      fill={color}
    />
    {[[175, 90], [400, 60], [485, 110], [755, 80], [995, 120]].map(([x, yy], i) => (
      <rect key={i} x={x - 6} y={yy} width={12} height={20} rx={6} fill="rgba(255,170,80,0.85)" />
    ))}
  </svg>
);
const Bats: React.FC<{n?: number; seed?: number}> = ({n = 7, seed = 1}) => {
  const f = useCurrentFrame();
  return (
    <>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(seed * 19 + i * 5.3 + k);
        const x = ((r(1) * W + f * (4 + r(2) * 5)) % (W + 200)) - 100;
        const y = 200 + r(3) * 700 + Math.sin(f / 6 + i) * 30;
        const flap = Math.sin(f / 1.6 + i * 2);
        const s = 40 + r(4) * 50;
        return (
          <svg key={i} width={s} height={s * 0.5} viewBox="-50 -25 100 50" style={{position: 'absolute', left: x, top: y}}>
            <path d={`M0 0 C -10 ${-14 * flap} -30 ${-20 * flap} -50 ${-6 * flap} C -36 2 -22 6 -12 10 C -6 4 -2 4 0 8 C 2 4 6 4 12 10 C 22 6 36 2 50 ${-6 * flap} C 30 ${-20 * flap} 10 ${-14 * flap} 0 0 Z`} fill="#050103" />
          </svg>
        );
      })}
    </>
  );
};
/** Short lightning flash on a frame. */
const flash = (f: number, at: number, len = 6) => interpolate(f, [at - 1, at, at + len], [0, 1, 0], clamp);

/* ---------- 1 · СЕГОДНЯ ТОТ САМЫЙ ДЕНЬ! (on the orchestral stabs) ---------- */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'hook';
  const hits = T.hits;
  const lit = Math.max(0, ...hits.map((h) => flash(f, h, 8)));
  const moon = snap(f, hits[0], 18, 90);
  const pumpkins = f >= hits[1];
  const hh = handheld(f, 4, 3);
  return (
    <AbsoluteFill>
      <Night tint="#2a0610" />
      <AbsoluteFill style={{background: '#ffe6e0', opacity: lit * 0.35, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{transform: `translate(${hh.x}px, ${hh.y}px) scale(${1.02 + 0.03 * lit})`}}>
        <div style={{position: 'absolute', left: W / 2 - 330, top: 1060 - moon * 260, opacity: moon}}>
          <Moon size={660} glow={0.7 + 0.5 * lit} />
        </div>
        <Castle y={1380} />
        <Bats n={6} seed={2} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: 90 + i * 330, top: 1600 - (i === 1 ? 40 : 0), transform: `scale(${pumpkins ? snap(f, hits[1] + i * 3, 11, 170) : 0})`}}>
            <Pumpkin size={240} glow={0.5 + 0.5 * lit} />
          </div>
        ))}
      </AbsoluteFill>
      <Block top={260} gap={6}>
        <Word at={wf('n1', 0, S)} from={-60} style={Big(150, C.ivory, 'rgba(255,30,60,0.9)')}>
          СЕГОДНЯ
        </Word>
        <Word at={wf('n1', 1, S)} style={Big(96)}>
          ТОТ САМЫЙ
        </Word>
        <Word at={wf('n1', 3, S)} style={Gold(200)}>
          ДЕНЬ!
        </Word>
      </Block>
      <Particles n={24} seed={3} color="255,120,90" opacity={0.7} />
    </AbsoluteFill>
  );
};

/* ---------- 2 · logo · мы начинаем уже сегодня ---------- */
export const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'logo';
  const dur = T.scenes.logo.dur;
  const abs = T.scenes.logo.from + f;
  const pulse = Math.max(0, ...T.hits.map((h) => flash(abs, h, 6)));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(2.3)', filter: 'blur(40px) brightness(0.55) saturate(1.3)'}}>
        <OffthreadVideo src={staticFile('clips/intro.mp4')} startFrom={30} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Bokeh n={12} seed={4} color="255,120,200" opacity={0.35} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${(1 + 0.05 * (f / dur)) * (1 + 0.04 * pulse)})`}}>
        <div style={{width: W, height: (W * 752) / 848, WebkitMaskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)', maskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)'}}>
          <OffthreadVideo src={staticFile('clips/intro.mp4')} startFrom={30} muted style={{width: '100%', height: '100%'}} />
        </div>
      </AbsoluteFill>
      <Particles n={30} seed={8} color="255,190,240" opacity={0.6} />
      <Block top={250}>
        <Word at={4} style={Label}>
          👻 ДРУЗЬЯ!
        </Word>
        <Word at={wf('n2', 2, S)} style={Gold(64)}>
          HALLOWEEN EDITION
        </Word>
      </Block>
      <Block top={1460} gap={6}>
        <Word at={wf('n2', 5, S)} style={Big(84)}>
          МЫ НАЧИНАЕМ
        </Word>
        <Word at={wf('n2', 6, S)} style={Big(104, C.blood, 'rgba(255,40,70,0.75)')}>
          УЖЕ СЕГОДНЯ!
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 3 · наконец-то наступила ночь ---------- */
export const NightScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'night';
  const dur = T.scenes.night.dur;
  const rise = ease(f, 0, dur, 0, 1, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(180deg, #050208 0%, ${interpolateColors(rise, [0, 1], ['#1a0a2a', '#4a0614'])} 70%, #0a0204 100%)`}} />
      <Particles n={60} seed={41} color="255,240,230" opacity={0.6} rise={0.1} />
      <div style={{position: 'absolute', left: W / 2 - 380, top: 1150 - rise * 420}}>
        <Moon size={760} glow={0.6 + 0.4 * rise} />
      </div>
      <Smoke opacity={0.35} speed={0.8} tint="rgba(255,150,140,1)" />
      <Castle y={1300} />
      <Bats n={9} seed={5} />
      <Block top={180} gap={8}>
        <Word at={wf('n3', 0, S)} style={Small}>
          Наконец-то
        </Word>
        <Word at={wf('n3', 1, S)} style={Big(96)}>
          НАСТУПИЛА
        </Word>
        <Word at={wf('n3', 2, S)} style={Gold(170)}>
          НОЧЬ
        </Word>
        <Word at={wf('n3', 3, S)} style={{...Small, fontSize: 54}}>
          которую мы так долго ждали 🥳
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 4 · забудь о заботах → окунись в Хэллоуин ---------- */
export const Forget: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'forget';
  const turn = wf('n4', 3, S);
  const away = ease(f, turn - 2, turn + 12, 0, 1, Easing.in(Easing.cubic));
  const sat = ease(f, turn, turn + 16, 0, 1);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #2a2a30, #121216)', opacity: 1 - sat}} />
      <AbsoluteFill style={{opacity: sat}}>
        <Night tint="#5a0812" />
      </AbsoluteFill>
      <Smoke opacity={0.25 + 0.2 * sat} speed={1.2} tint="rgba(255,140,130,1)" />
      {/* everyday worries drift away into dust */}
      <Block top={520} gap={6}>
        <Word at={wf('n4', 0, S)} style={{...Big(96, '#d8d8de', 'rgba(0,0,0,0)'), opacity: 1 - away}}>
          ЗАБУДЬ
        </Word>
        <div style={{...Big(96, '#d8d8de', 'rgba(0,0,0,0)'), opacity: (1 - away) * ease(f, wf('n4', 1, S) - 2, wf('n4', 1, S) + 4, 0, 1), transform: `translateY(${-away * 200}px) scale(${1 + away * 0.6})`, filter: `blur(${away * 30}px)`, letterSpacing: away * 40}}>
          О ЗАБОТАХ
        </div>
      </Block>
      <Particles n={40} seed={44} color="200,200,210" opacity={away * (1 - sat * 0.6)} rise={3} />
      <Block top={340} gap={10}>
        <Word at={wf('n4', 4, S)} style={Small}>
          окунись в атмосферу
        </Word>
        <Word at={wf('n4', 7, S)} style={Big(90)}>
          НАСТОЯЩЕГО
        </Word>
        <Word at={wf('n4', 8, S)} style={Gold(128)}>
          ХЭЛЛОУИНА
        </Word>
      </Block>
      <div style={{position: 'absolute', left: W / 2 - 420, top: 1000, transform: `scale(${snap(f, wf('n4', 6, S), 12, 140)}) rotate(${(1 - sat) * -10}deg)`, filter: 'drop-shadow(0 0 40px rgba(224,16,47,0.6)) drop-shadow(0 20px 30px rgba(0,0,0,0.9))'}}>
        <Mask size={840} color={C.crimson} />
      </div>
      <Bats n={5} seed={9} />
    </AbsoluteFill>
  );
};

/* ---------- 5 · вас ждёт незабываемая ночь (beat-cut poster close-ups) ---------- */
const AWAIT_SHOTS: [number, number, number, number][] = [
  [230, 30, 520, 1],
  [0, 250, 340, -1],
  [370, 150, 340, 1],
  [150, 40, 440, -1],
  [800, 20, 320, 1],
  [820, 280, 300, -1],
  [600, 160, 380, 1],
  [300, 0, 540, -1],
];
export const Await: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'await';
  const dur = T.scenes.await.dur;
  const step = Math.round(T.beat * 2);
  const k = kick(T.scenes.await.from + f);
  const hh = handheld(f, 8, 13);
  const caps: [number, string, string][] = [
    [wf('n5', 0, S), '🔥 ГОРЯЧИЕ ЛАТИНСКИЕ РИТМЫ', C.ivory],
    [wf('n5', 3, S), '💃 ТАНЦЫ', C.gold],
    [wf('n5', 4, S), '🎃 МИСТИКА', C.blood],
    [wf('n5', 6, S), '🎭 ЯРКИЕ ОБРАЗЫ', C.gold],
    [wf('n6', 0, S), '✨ НОВЫЕ ЗНАКОМСТВА', C.ivory],
    [wf('n6', 2, S), '🕺 ДРУЗЬЯ', C.gold],
    [wf('n6', 4, S), '❤️‍🔥 ЭМОЦИИ НАДОЛГО', C.blood],
  ];
  const cur = caps.filter(([at]) => f >= at - 2).length - 1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {new Array(Math.ceil(dur / step)).fill(0).map((_, i) => {
        const [x, y, size, dir] = AWAIT_SHOTS[i % AWAIT_SHOTS.length];
        const from = i * step;
        const len = Math.min(step, dur - from);
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <AbsoluteFill style={{transform: `translate(${hh.x}px, ${hh.y}px) scale(${1.03 + 0.04 * k})`, filter: `contrast(1.1) saturate(1.15) brightness(${0.95 + 0.2 * k})`}}>
              <PosterShot x={x} y={y} size={size} dir={dir} len={len} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: W / 2 - 60, top: -200, width: 120, height: H * 1.3, transformOrigin: '50% 0', transform: `rotate(${Math.sin(f / 10 + i * 2) * 35 + (i - 1) * 25}deg)`, background: `linear-gradient(180deg, rgba(${i === 1 ? '255,200,120' : '255,40,70'},0.5), transparent 80%)`, filter: 'blur(14px)', mixBlendMode: 'screen', opacity: 0.35 + 0.5 * k}} />
      ))}
      <Particles n={40} seed={17} color="255,205,120" opacity={0.8} rise={2} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 24%, transparent 72%, rgba(0,0,0,0.8) 100%)'}} />
      <Block top={170} gap={6}>
        <Word at={0} style={Label}>
          🎭 ВАС ЖДЁТ
        </Word>
        <Word at={4} style={Big(70)}>
          НЕЗАБЫВАЕМАЯ НОЧЬ
        </Word>
      </Block>
      {cur >= 0 && (
        <Sequence from={caps[cur][0] - 2} key={cur}>
          <Block top={1560}>
            <Word at={0} style={{...Big(caps[cur][1].length > 20 ? 54 : caps[cur][1].length > 14 ? 66 : 100, caps[cur][2], caps[cur][2] === C.blood ? 'rgba(255,40,70,0.7)' : 'rgba(224,16,47,0.5)'), whiteSpace: 'nowrap'}}>
              {caps[cur][1]}
            </Word>
          </Block>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/* ---------- 6 · не сиди дома ---------- */
export const Home: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'home';
  const dur = T.scenes.home.dur;
  const k = kick(T.scenes.home.from + f);
  const door = ease(f, wf('n7', 1, S), wf('n7', 3, S), 0, 1, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <Night tint="#3b0a10" />
      {/* a door swings open onto the party light */}
      <div style={{position: 'absolute', left: W / 2 - 230, top: 760, width: 460, height: 760, perspective: 1400}}>
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 60%, rgba(255,210,140,${0.4 + 0.6 * door}), rgba(224,16,47,${0.6 * door}) 60%, #000 100%)`, boxShadow: `0 0 ${160 * door}px ${40 * door}px rgba(255,170,80,${0.5 * door})`}}>
          <AbsoluteFill style={{opacity: door}}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{position: 'absolute', left: 40 + i * 100, bottom: 0, width: 80, height: 220 + (i % 2) * 60, borderRadius: '40px 40px 0 0', background: '#120306', transform: `translateY(${Math.sin(f / 4 + i * 1.7) * 14 * (0.5 + k)}px)`}} />
            ))}
          </AbsoluteFill>
        </div>
        <div style={{position: 'absolute', inset: 0, transformOrigin: '0 50%', transform: `rotateY(${-door * 100}deg)`, background: 'linear-gradient(90deg, #2a1208, #4a2412 50%, #2a1208)', border: `6px solid ${C.gold}`, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8)'}}>
          <div style={{position: 'absolute', right: 40, top: 380, width: 30, height: 30, borderRadius: '50%', background: C.gold}} />
        </div>
      </div>
      <Particles n={30} seed={61} color="255,205,120" opacity={0.4 + 0.6 * door} rise={2} />
      <Block top={170} gap={8}>
        <Word at={wf('n7', 0, S)} style={{...Big(100), whiteSpace: 'nowrap'}}>
          НЕ СИДИ ДОМА!
        </Word>
        <Word at={wf('n7', 3, S)} style={Gold(92)}>
          СОБИРАЙ ДРУЗЕЙ
        </Word>
      </Block>
      <Block top={1580} gap={6}>
        <Word at={wf('n7', 6, S)} style={Big(62)}>
          И ПРИХОДИ ТАНЦЕВАТЬ
        </Word>
        <Word at={wf('n7', 7, S)} style={Big(84, C.blood, 'rgba(255,40,70,0.75)')}>
          С НАМИ! 🥳
        </Word>
      </Block>
      <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [dur - 30, dur - 18, dur - 6], [0, 0.85, 0.85], clamp)}} />
      <Block top={840}>
        <Word at={dur - 26} style={{...Gold(96), opacity: interpolate(f, [dur - 26, dur - 22], [0, 1], clamp)}}>
          ❤️ МЫ ЖДЁМ
        </Word>
        <Word at={dur - 22} style={Big(96)}>
          КАЖДОГО!
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 7 · tickets ---------- */
export const Tickets: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'tickets';
  const hh = handheld(f, 3, 5);
  const rows: [string, string, string, number, boolean][] = [
    ['⏳', 'СЕГОДНЯ ДО 23:30', '950 ₽', wf('n8', 7, S), true],
    ['🌐', 'НА САЙТЕ', '1000 ₽', wf('n9', 3, S), false],
    ['🚪', 'НА ВХОДЕ В КЛУБ', '1500 ₽', wf('n9', 7, S), false],
  ];
  const warn = wf('n9', 0, S);
  return (
    <AbsoluteFill>
      <Night tint="#2a0610" />
      <Bokeh n={14} seed={31} color="255,170,80" opacity={0.4} />
      <Block top={170} gap={8}>
        <Word at={wf('n8', 0, S)} from={-60} style={Big(120, C.ivory, 'rgba(255,30,60,0.9)')}>
          ВАЖНО!
        </Word>
        <Word at={wf('n8', 0, S) + 6} style={{...Gold(58), whiteSpace: 'nowrap'}}>
          🎟️ НЕ ЗАБУДЬ ПРО БИЛЕТЫ
        </Word>
      </Block>
      <div style={{position: 'absolute', left: 60, right: 60, top: 600, display: 'flex', flexDirection: 'column', gap: 30, transform: `translate(${hh.x}px, ${hh.y}px)`}}>
        {rows.map(([icon, when, price, at, hot], i) => {
          const p = snap(f, at, 12, 170);
          const pulse = hot ? 0.5 + 0.5 * Math.sin(f / 5) : 0;
          return (
            <React.Fragment key={i}>
              {i === 1 && (
                <div style={{...Label, fontSize: 32, letterSpacing: 6, color: C.blood, textAlign: 'center', opacity: ease(f, warn, warn + 6, 0, 1), margin: '14px 0 0'}}>⚡ ПОСЛЕ 23:30 ЦЕНА ПОВЫШАЕТСЯ:</div>
              )}
              <div style={{display: 'flex', alignItems: 'center', gap: 26, padding: hot ? '40px 40px' : '28px 40px', borderRadius: 26, background: hot ? 'linear-gradient(90deg, rgba(179,0,27,0.9), rgba(90,0,16,0.9))' : 'rgba(20,6,10,0.8)', border: `3px solid ${hot ? C.gold : 'rgba(231,194,125,0.35)'}`, boxShadow: hot ? `0 0 ${30 + 30 * pulse}px rgba(231,194,125,0.5)` : '0 20px 40px rgba(0,0,0,0.5)', transform: `translateX(${(1 - p) * (i % 2 ? 1 : -1) * 700}px)`, opacity: Math.min(1, p * 1.5)}}>
                <div style={{fontSize: 64}}>{icon}</div>
                <div style={{flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 42, color: C.ivory, lineHeight: 1.1}}>{when}</div>
                <div style={hot ? Gold(110) : Big(84, i === 2 ? C.blood : C.ivory, i === 2 ? 'rgba(255,40,70,0.6)' : 'rgba(0,0,0,0)')}>{price}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <Block top={1460} gap={6}>
        <Word at={wf('n9', 8, S) + 4} style={Big(60)}>
          💥 УСПЕЙ КУПИТЬ ЗАРАНЕЕ
        </Word>
        <Word at={wf('n9', 8, S) + 10} style={{...Small, fontSize: 56}}>
          и не переплачивай!
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 8 · when & where ---------- */
export const Info: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'info';
  const [s0, s1] = T.silence.map((x) => x - T.scenes.info.from);
  const hush = ease(f, s0, s0 + 8, 0, 1);
  const beatIn = ease(f, s0, s1, 1, 1.12, Easing.in(Easing.quad));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${1.3 + 0.05 * (f / 200)})`, filter: 'blur(26px) brightness(0.35) saturate(1.2)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Smoke opacity={0.3} speed={0.6} tint="rgba(255,150,120,1)" />
      <Bokeh n={10} seed={51} color="255,150,70" opacity={0.4} />
      <AbsoluteFill style={{transform: `scale(${beatIn})`}}>
        <Block top={180}>
          <Word at={wf('n10', 0, S)} style={Big(110, C.ivory, 'rgba(255,30,60,0.9)')}>
            СЕГОДНЯ
          </Word>
        </Block>
        <div style={{position: 'absolute', left: 90, right: 60, top: 520, display: 'flex', flexDirection: 'column', gap: 90}}>
          <InfoRow i={0} at={wf('n10', 0, S)} icon="cal" title="31 ОКТЯБРЯ" sub="СУББОТА" />
          <InfoRow i={1} at={wf('n10', 4, S)} icon="pin" title="TEMPLE BAR" sub={<>м. Курская, Нижний Сусальный<br />переулок, 5, стр. 4а</>} />
          <InfoRow i={2} at={wf('n10', 9, S)} icon="clock" title="23:30 – 05:00" sub="ТАНЦУЕМ ДО УТРА" />
        </div>
        <Block top={1480} gap={8}>
          <Word at={wf('n10', 13, S)} style={{...Small, fontSize: 52}}>
            надевай самый эффектный костюм 🎃
          </Word>
          <Word at={wf('n10', 15, S)} style={{...Small, fontSize: 52}}>
            и приходи за своей порцией магии ✨
          </Word>
        </Block>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.9) 100%)', opacity: hush}} />
      <Particles n={26} seed={26} color="255,180,90" opacity={0.7} />
    </AbsoluteFill>
  );
};

/* ---------- 9 · poster finale on the drop ---------- */
export const Final: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'final';
  const dur = T.scenes.final.dur;
  const pin = snap(f, 0, 14, 120);
  const push = 1 + 0.05 * (f / dur);
  const k = kick(T.scenes.final.from + f);
  const sweep = interpolate(f, [8, 38], [-0.4, 1.4], clamp);
  const ph = (W * PH) / PW;
  const top = 60;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.4)', filter: 'blur(36px) brightness(0.45) saturate(1.3)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top, width: W, height: ph, transform: `scale(${(0.8 + 0.2 * pin) * push * (1 + 0.012 * k)})`, opacity: Math.min(1, pin * 1.5), overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 4%, #000 92%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 4%, #000 92%, transparent 100%)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%'}} />
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${sweep * 100}%`, width: '22%', transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, transparent, rgba(255,236,190,0.55), transparent)', mixBlendMode: 'screen'}} />
      </div>
      <Smoke opacity={0.3} speed={0.6} tint="rgba(255,150,120,1)" />
      <Particles n={40} seed={23} color="255,180,90" opacity={0.85} rise={1.5} />
      <div style={{position: 'absolute', left: 0, right: 0, top: top + ph + 20, display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${snap(f, wf('n11', 0, S), 12, 170)})`, padding: '18px 54px', borderRadius: 999, background: 'linear-gradient(180deg, #F7DC9A, #B9832E)', boxShadow: `0 0 ${30 + 30 * k}px rgba(231,194,125,0.7)`, fontFamily: SANS, fontWeight: 800, fontSize: 54, color: '#2a0508'}}>
          🎟️ latinfusion.ru
        </div>
      </div>
      <Block top={top + ph + 140} gap={4}>
        <Word at={wf('n12', 3, S)} style={{...Big(66), whiteSpace: 'nowrap'}}>
          ДО ВСТРЕЧИ СЕГОДНЯ
        </Word>
        <Word at={wf('n12', 6, S)} style={{...Gold(84), whiteSpace: 'nowrap'}}>
          НА ТАНЦПОЛЕ! 💃🕺
        </Word>
      </Block>
      <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [dur - 18, dur], [0, 1], clamp)}} />
    </AbsoluteFill>
  );
};
