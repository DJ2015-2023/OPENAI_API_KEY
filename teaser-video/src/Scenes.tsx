import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {Bokeh, Particles, Smoke} from './components/FX';
import {Candle, Lipstick, Mask, Mirror, Phone, WitchHat} from './components/Shapes';
import {C, H, ITALIC, LUX, SANS, SERIF, T, W, clamp, ease, gold, handheld, kick, rand, snap, wf} from './theme';

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
const Small: React.CSSProperties = {fontFamily: ITALIC, fontStyle: 'italic', fontWeight: 600, fontSize: 64, color: C.ivory, textShadow: shadow};
const Label: React.CSSProperties = {fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 14, color: C.gold, textShadow: shadow};
const Big = (size: number, color: string = C.ivory, glow = 'rgba(224,16,47,0.6)'): React.CSSProperties => ({
  fontFamily: SANS,
  fontWeight: 800,
  fontSize: size,
  lineHeight: 0.95,
  letterSpacing: -2,
  color,
  textShadow: `0 0 30px ${glow}, 0 0 80px ${glow}, ${shadow}`,
});
const Block: React.FC<{top: number; children: React.ReactNode}> = ({top, children}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>{children}</div>
);

/* ---------- transitions ---------- */
type Tr = 'whip' | 'zoom' | 'none';
/** Whip-pan / zoom-blur in & out at the scene edges. */
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

/* ---------- 0 · logo intro (user's animation) ---------- */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.intro.dur;
  const push = 1 + 0.06 * (f / dur);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* blurred fill so the 848×752 animation sits in a full 9:16 frame */}
      <AbsoluteFill style={{transform: 'scale(2.3)', filter: 'blur(40px) brightness(0.55) saturate(1.3)'}}>
        <OffthreadVideo src={staticFile('clips/intro.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Bokeh n={12} seed={4} color="255,120,200" opacity={0.35} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${push})`}}>
        <div style={{width: W, height: (W * 752) / 848, WebkitMaskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)', maskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)'}}>
          <OffthreadVideo src={staticFile('clips/intro.mp4')} muted style={{width: '100%', height: '100%'}} />
        </div>
      </AbsoluteFill>
      <Particles n={30} seed={8} color="255,190,240" opacity={0.6} />
      <Block top={1450}>
        <Word at={dur - 70} style={Label}>
          HALLOWEEN EDITION
        </Word>
        <Word at={dur - 62} style={{...Small, fontSize: 54}}>
          31 октября · Temple Bar
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 1 · mirror: witch costume, warm light turning crimson ---------- */
export const MirrorScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'mirror';
  const light = interpolateColors(f, [0, 30, 66], ['#FFB45A', '#FF7A3A', '#E0102F']);
  const hh = handheld(f, 6, 2);
  const hat = snap(f, 8, 16, 120);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 45%, ${light}55 0%, #1a0608 55%, #050304 100%)`}}>
      <AbsoluteFill style={{transform: `translate(${hh.x}px, ${hh.y}px) scale(${1.04 + 0.08 * (f / 72)}) rotate(${hh.r}deg)`}}>
        <div style={{position: 'absolute', left: (W - 640) / 2, top: 600}}>
          <Mirror w={640} glass="#1c0b10">
            <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 55% at 50% 40%, ${light}88, transparent 70%)`}} />
            {/* reflection: the hat being put on, mirrored, softly out of focus */}
            <div style={{position: 'absolute', left: 120, top: 210 - hat * 70, filter: 'blur(2.5px)', opacity: 0.85, transform: 'scaleX(-1)'}}>
              <WitchHat size={400} band={C.crimson} />
            </div>
            <Bokeh n={6} seed={11} color="255,180,100" opacity={0.5} minR={30} maxR={80} />
          </Mirror>
        </div>
        {/* the real hat in the foreground, sharp */}
        <div style={{position: 'absolute', left: -60, top: 1080 + (1 - hat) * 300, transform: `rotate(${-14 + hat * 6}deg)`, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.8))'}}>
          <WitchHat size={560} band={C.crimson} />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: 700 + i * 110, top: 1240 - i * 40, transform: `scale(${1 - i * 0.12})`, filter: i ? `blur(${i * 1.5}px)` : undefined}}>
            <Candle h={260 - i * 40} flick={0.5 + 0.5 * Math.sin(f / 2.3 + i * 2)} />
          </div>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{background: light, mixBlendMode: 'soft-light', opacity: 0.45}} />
      <Smoke opacity={0.25} tint="rgba(255,170,140,1)" />
      <Particles n={22} seed={3} color="255,190,110" opacity={0.7} />
      <Block top={150}>
        <Word at={wf('v1', 0, S)} style={Small}>
          Кто-то уже
        </Word>
        <Word at={wf('v1', 2, S)} style={Big(108)}>
          ВЫБИРАЕТ
        </Word>
        <Word at={wf('v1', 3, S)} style={{...Big(150), ...gold, textShadow: 'none', filter: 'drop-shadow(0 0 24px rgba(231,194,125,0.55)) drop-shadow(0 6px 10px rgba(0,0,0,0.9))'}}>
          КОСТЮМ…
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 2 · lipstick & vampire masquerade ---------- */
export const LipstickScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'lipstick';
  const up = ease(f, 4, 22, 0, 1, Easing.inOut(Easing.cubic));
  const swipe = ease(f, 18, 34, 0, 1, Easing.inOut(Easing.cubic));
  const mask = snap(f, 36, 12, 150);
  const hh = handheld(f, 5, 7);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 55% at 50% 55%, #4a0612 0%, #160205 60%, #050304 100%)'}}>
      <Bokeh n={14} seed={21} color="255,60,80" opacity={0.45} />
      <AbsoluteFill style={{transform: `translate(${hh.x}px, ${hh.y}px) scale(${1.1 - 0.06 * (f / 72)})`}}>
        {/* red lipstick stroke drawn across the frame */}
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d="M-60 1180 C 220 1060 420 1240 640 1120 C 820 1020 960 1080 1160 980" stroke={C.blood} strokeWidth={90} strokeLinecap="round" fill="none" strokeDasharray={1500} strokeDashoffset={1500 * (1 - swipe)} style={{filter: 'drop-shadow(0 0 30px rgba(224,16,47,0.6))'}} />
          <path d="M-60 1160 C 220 1040 420 1220 640 1100 C 820 1000 960 1060 1160 960" stroke="#ff6a7a" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.6} strokeDasharray={1500} strokeDashoffset={1500 * (1 - swipe)} />
        </svg>
        <div style={{position: 'absolute', left: 120 + swipe * 620, top: 1250 - swipe * 260, transform: `rotate(${30 + swipe * 10}deg) scale(${1.2 - 0.3 * mask})`, filter: `drop-shadow(0 30px 40px rgba(0,0,0,0.8)) blur(${mask * 3}px)`, opacity: 1 - mask * 0.5}}>
          <Lipstick h={620} up={up} />
        </div>
        {/* vampire masquerade reveal */}
        <div style={{position: 'absolute', left: W / 2 - 420, top: 720, transform: `scale(${0.6 + 0.4 * mask}) rotate(${(1 - mask) * -12}deg)`, opacity: Math.min(1, mask * 1.4), filter: 'drop-shadow(0 0 40px rgba(224,16,47,0.6)) drop-shadow(0 20px 30px rgba(0,0,0,0.9))'}}>
          <Mask size={840} color={C.crimson} trim={C.gold} />
        </div>
      </AbsoluteFill>
      <Smoke opacity={0.22} tint="rgba(255,120,130,1)" />
      <Particles n={18} seed={5} color="255,90,110" opacity={0.6} />
      <Block top={190}>
        <Word at={wf('v2', 0, S)} style={Small}>
          Кто-то
        </Word>
        <Word at={wf('v2', 1, S)} style={Big(110)}>
          ГОТОВИТСЯ
        </Word>
        <Word at={wf('v2', 2, S)} style={Big(132, C.blood, 'rgba(255,40,70,0.7)')}>
          УДИВЛЯТЬ…
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 3 · the crew gathers ---------- */
const Badge: React.FC<{at: number; x: number; y: number; r: number; children: React.ReactNode}> = ({at, x, y, r, children}) => {
  const f = useCurrentFrame();
  const p = snap(f, at, 11, 170);
  const bob = Math.sin((f + at * 3) / 9) * 8;
  return (
    <div style={{position: 'absolute', left: x, top: y + bob + (1 - p) * 400, transform: `rotate(${r * p}deg) scale(${p})`, opacity: Math.min(1, p * 2)}}>
      <div style={{width: 300, height: 380, borderRadius: 28, background: 'linear-gradient(160deg, #2a0a14, #0c0306)', border: `3px solid ${C.gold}`, boxShadow: '0 30px 60px rgba(0,0,0,0.7), 0 0 30px rgba(231,194,125,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
        {children}
      </div>
    </div>
  );
};
export const FriendsScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'friends';
  const banda = wf('v3', 5, S);
  const shake = f >= banda && f < banda + 8 ? (rand(f) - 0.5) * 22 : 0;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 60% at 50% 60%, #3b0a10 0%, #120306 60%, #050304 100%)', transform: `translate(${shake}px, ${-shake * 0.6}px)`}}>
      <Bokeh n={18} seed={31} color="255,170,80" opacity={0.5} />
      <Badge at={2} x={60} y={900} r={-10}>
        <WitchHat size={260} />
      </Badge>
      <Badge at={8} x={390} y={840} r={3}>
        <div style={{transform: 'scale(0.65)'}}>
          <Mask size={380} color={C.crimson} />
        </div>
      </Badge>
      <Badge at={14} x={720} y={920} r={11}>
        <svg width={220} height={220} viewBox="-50 -50 100 100">
          {/* vampire fangs smile */}
          <path d="M-40 -6 Q 0 26 40 -6 Q 0 10 -40 -6 Z" fill={C.blood} />
          <path d="M-20 2 L -14 22 L -8 4 Z M 8 4 L 14 22 L 20 2 Z" fill="#fff" />
        </svg>
      </Badge>
      <Badge at={20} x={230} y={1300} r={-5}>
        <Candle h={200} flick={0.5 + 0.5 * Math.sin(f / 2)} />
      </Badge>
      <Badge at={26} x={560} y={1290} r={7}>
        <div style={{...LuxSmall, fontSize: 64, textAlign: 'center', lineHeight: 1.1}}>
          31
          <br />
          <span style={{fontSize: 30, letterSpacing: 6}}>OCT</span>
        </div>
      </Badge>
      <Particles n={30} seed={6} color="255,200,120" opacity={0.7} rise={1.4} />
      <Block top={160}>
        <Word at={wf('v3', 1, S)} style={Small}>
          А кто-то собирает
        </Word>
        <Word at={wf('v3', 3, S)} style={Big(84)}>
          ВСЮ СВОЮ
        </Word>
        <Word at={banda} from={-60} style={{...Big(190, C.ivory, 'rgba(231,194,125,0.6)'), ...gold, textShadow: 'none', filter: 'drop-shadow(0 0 30px rgba(231,194,125,0.6)) drop-shadow(0 8px 12px rgba(0,0,0,0.9))'}}>
          БАНДУ!
        </Word>
      </Block>
    </AbsoluteFill>
  );
};
const LuxSmall: React.CSSProperties = {fontFamily: LUX, fontWeight: 900, color: C.gold};

/* ---------- 4 · alone with the phone · «А ТЫ?» ---------- */
export const PhoneScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'phone';
  const s0 = T.scenes.phone.from;
  const ty = wf('v4', 1, S);
  const [p0, p1] = [T.pause[0] - s0, T.pause[1] - s0];
  const dur = T.scenes.phone.dur;
  const punch = ease(f, ty - 3, ty + 2, 1, 1.45, Easing.out(Easing.cubic));
  const rebuild = ease(f, p1, dur, 0, 1, Easing.in(Easing.quad));
  const blackout = f >= p0 - 2 && f < p1;
  const hh = handheld(f, 4 + rebuild * 14, 9);
  const notif = snap(f, 6, 13, 160);
  return (
    <AbsoluteFill style={{background: '#030206'}}>
      <AbsoluteFill style={{transform: `translate(${hh.x}px, ${hh.y}px) scale(${punch * (1 + 0.12 * rebuild)}) rotate(${hh.r}deg)`, opacity: blackout ? 0.12 : 1}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 40% at 50% 52%, rgba(90,110,220,0.35), transparent 70%)'}} />
        {/* lone silhouette lit by the screen */}
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <radialGradient id="rim" cx="0.5" cy="0.3" r="0.7">
              <stop offset="0" stopColor="#3a4a9a" />
              <stop offset="1" stopColor="#05040a" />
            </radialGradient>
          </defs>
          <path d="M540 520 C 640 520 690 600 690 690 C 690 770 650 830 610 850 C 700 880 820 940 880 1060 C 940 1180 960 1500 960 1920 L 120 1920 C 120 1500 140 1180 200 1060 C 260 940 380 880 470 850 C 430 830 390 770 390 690 C 390 600 440 520 540 520 Z" fill="url(#rim)" opacity={0.9} />
        </svg>
        <div style={{position: 'absolute', left: W / 2 - 170, top: 980}}>
          <Phone w={340} glow={1}>
            <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 500, color: '#fff', fontSize: 92}}>23:30</div>
            <div style={{position: 'absolute', top: 240 + (1 - notif) * 40, left: 18, right: 18, opacity: notif, borderRadius: 22, padding: '18px 18px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: SANS, color: '#fff'}}>
              <div style={{fontSize: 20, fontWeight: 700, color: C.gold, letterSpacing: 2}}>LATIN FUSION</div>
              <div style={{fontSize: 24, fontWeight: 500, marginTop: 6}}>Halloween Party · 31.10 🎃</div>
            </div>
          </Phone>
        </div>
      </AbsoluteFill>
      {/* the stop: «А ТЫ?» */}
      {f >= ty - 1 && f < p1 + 4 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 300, lineHeight: 1, color: C.ivory, transform: `scale(${1.25 - 0.25 * snap(f, ty - 1, 10, 220)})`, textShadow: '0 0 60px rgba(224,16,47,0.9), 0 0 140px rgba(224,16,47,0.6)', opacity: f > p1 ? 1 - (f - p1) / 4 : 1}}>
            А ТЫ?
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: C.crimson, mixBlendMode: 'soft-light', opacity: rebuild * 0.8}} />
      {f >= p1 && (
        <Block top={240}>
          <Word at={wf('v4', 2, S)} style={Small}>
            всё ещё думаешь,
          </Word>
          <Word at={wf('v4', 5, S)} style={Big(120)}>
            ИДТИ
          </Word>
          <Word at={wf('v4', 6, S)} style={Big(120, C.blood, 'rgba(255,40,70,0.7)')}>
            ИЛИ НЕТ?
          </Word>
        </Block>
      )}
      {f >= p1 && <Particles n={26} seed={12} color="255,80,100" opacity={rebuild} rise={1 + rebuild * 3} />}
    </AbsoluteFill>
  );
};

/* ---------- 5 · the party: beat-cut close-ups inside the user's poster (no title, saved for the reveal) ---------- */
const PW = 1122;
const PH = 1402;
// square crops [left, top, size] from the poster's upper half (the title stays hidden for the final reveal)
const SHOTS: [number, number, number, number][] = [
  [230, 30, 520, 1],
  [370, 150, 340, -1],
  [800, 20, 320, 1],
  [600, 160, 380, -1],
  [0, 250, 340, 1],
  [150, 40, 440, -1],
  [820, 280, 300, 1],
  [300, 0, 540, -1],
];
const CARD = 1000;
const CARD_TOP = 440;
const Crop: React.FC<{x: number; y: number; size: number; px: number; drift: number}> = ({x, y, size, px, drift}) => {
  const k = px / size;
  return <Img src={staticFile('img/poster.png')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: `scale(${k}) translate(${-x - drift}px, ${-y}px)`}} />;
};
const PosterShot: React.FC<{x: number; y: number; size: number; dir: number; len: number}> = ({x, y, size, dir, len}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 4], [1.15, 1], {...clamp, easing: Easing.out(Easing.cubic)}) * (1 + 0.07 * (f / len));
  const drift = dir * 0.05 * size * (f / len);
  return (
    <AbsoluteFill>
      {/* full-bleed blurred copy behind the card */}
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', filter: 'blur(30px) brightness(0.5)', transform: 'scale(1.2)'}}>
        <div style={{position: 'absolute', left: (W - H) / 2, top: 0, width: H, height: H, overflow: 'hidden'}}>
          <Crop x={x} y={y} size={size} px={H} drift={drift} />
        </div>
      </div>
      <div style={{position: 'absolute', left: (W - CARD) / 2, top: CARD_TOP, width: CARD, height: CARD, overflow: 'hidden', borderRadius: 18, border: `2px solid rgba(231,194,125,0.7)`, boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(224,16,47,0.35)'}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`}}>
          <Crop x={x} y={y} size={size} px={CARD} drift={drift} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const PartyScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'party';
  const dur = T.scenes.party.dur;
  const beat = T.beat;
  const cuts = SHOTS.map((_, i) => Math.round(i * beat));
  const orbit = Math.sin(f / 14) * 4;
  const k = kick(T.scenes.party.from + f);
  const hh = handheld(f, 10, 13);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map(([x, y, size, dir], i) => {
        const from = cuts[i];
        const to = i + 1 < cuts.length ? cuts[i + 1] : dur;
        if (from >= dur) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <AbsoluteFill style={{transform: `translate(${hh.x}px, ${hh.y}px) scale(${1.06 + 0.05 * k}) rotate(${hh.r + orbit * 0.3}deg) perspective(1600px) rotateY(${orbit}deg)`, filter: `contrast(1.1) saturate(1.15) brightness(${0.95 + 0.25 * k})`}}>
              <PosterShot x={x} y={y} size={size} dir={dir} len={to - from} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* red-gold club grade */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #B3001B 0%, #3a0008 50%, #E7A03D 100%)', mixBlendMode: 'soft-light', opacity: 0.35}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 40% at 50% 10%, rgba(255,190,100,0.5), transparent 70%)', mixBlendMode: 'screen'}} />
      {/* moving beams */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: W / 2 - 60, top: -200, width: 120, height: H * 1.3, transformOrigin: '50% 0', transform: `rotate(${Math.sin(f / 10 + i * 2) * 35 + (i - 1) * 25}deg)`, background: `linear-gradient(180deg, rgba(${i === 1 ? '255,200,120' : '255,40,70'},0.55), transparent 80%)`, filter: 'blur(14px)', mixBlendMode: 'screen', opacity: 0.5 + 0.5 * k}} />
      ))}
      {/* cut flashes */}
      {cuts.slice(1).map((c) => (
        <AbsoluteFill key={c} style={{background: '#fff3e0', mixBlendMode: 'screen', opacity: interpolate(f, [c - 1, c, c + 3], [0, 0.3, 0], clamp)}} />
      ))}
      <Particles n={50} seed={17} color="255,205,120" opacity={0.9} rise={2.5} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)'}} />
      <Block top={150}>
        <Word at={wf('v5', 0, S)} style={Small}>
          Нас ждёт
        </Word>
        <Word at={wf('v5', 2, S)} style={Big(150)}>
          НОЧЬ
        </Word>
      </Block>
      <Block top={1490}>
        <div style={{display: 'flex', gap: 26, alignItems: 'baseline'}}>
          <Word at={wf('v5', 3, S)} style={Big(64, C.gold, 'rgba(231,194,125,0.5)')}>
            МУЗЫКИ
          </Word>
          <Word at={wf('v5', 4, S)} style={Big(64, C.ivory)}>
            ТАНЦЕВ
          </Word>
        </div>
        <Word at={wf('v5', 5, S)} style={Big(96, C.blood, 'rgba(255,40,70,0.7)')}>
          И ЭМОЦИЙ!
        </Word>
      </Block>
    </AbsoluteFill>
  );
};

/* ---------- 6 · the user's poster ---------- */
export const PosterScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = 'poster';
  const dur = T.scenes.poster.dur;
  const pin = snap(f, 0, 16, 110);
  const push = 1 + 0.05 * (f / dur);
  const sweep = interpolate(f, [wf('v6', 0, S), wf('v6', 0, S) + 26], [-0.4, 1.4], clamp);
  const pw = W;
  const ph = (W * 1402) / 1122;
  const top = 150;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.4)', filter: 'blur(36px) brightness(0.45) saturate(1.3)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Bokeh n={14} seed={41} color="255,150,70" opacity={0.45} />
      <div style={{position: 'absolute', left: 0, top, width: pw, height: ph, transform: `scale(${(0.86 + 0.14 * pin) * push})`, opacity: Math.min(1, pin * 1.5), boxShadow: '0 40px 80px rgba(0,0,0,0.8)', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 4%, #000 92%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 4%, #000 92%, transparent 100%)'}}>
        <Img src={staticFile('img/poster.png')} style={{width: '100%', height: '100%'}} />
        {/* gold light sweep across the title */}
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${sweep * 100}%`, width: '22%', transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, transparent, rgba(255,236,190,0.55), transparent)', mixBlendMode: 'screen'}} />
      </div>
      <Smoke opacity={0.3} speed={0.6} tint="rgba(255,150,120,1)" />
      <Particles n={36} seed={23} color="255,180,90" opacity={0.85} />
      <Block top={top + ph + 30}>
        <Word at={wf('v6', 4, S)} style={{...Big(104, C.ivory, 'rgba(224,16,47,0.7)')}}>
          СОБИРАЙ
        </Word>
        <Word at={wf('v6', 5, S)} style={{...Big(110), ...gold, textShadow: 'none', filter: 'drop-shadow(0 0 24px rgba(231,194,125,0.55)) drop-shadow(0 6px 10px rgba(0,0,0,0.9))'}}>
          ДРУЗЕЙ!
        </Word>
      </Block>
      <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [dur - 14, dur], [0, 1], clamp)}} />
    </AbsoluteFill>
  );
};
