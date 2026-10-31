import React from 'react';
import {AbsoluteFill, Composition, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FontGate} from './components/FX';
import {C, FPS, H, ITALIC, SANS, W, clamp, gold, snap} from './theme';

/*
 * Party info laid over the user's own promo footage. The footage is untouched: every overlay is a compact
 * card in the lower third (above the Reels/Stories UI) or a small badge at the top, shown one at a time,
 * so the dancers stay in view. Nothing is drawn over the user's poster at the end (from 56.7 s).
 */
const TOTAL = Math.round(62.2 * FPS);
const s = (sec: number) => Math.round(sec * FPS);

/** Glassy card that slides up with a gold edge, holds, then slides away. */
const Card: React.FC<{from: number; to: number; children: React.ReactNode; top?: number}> = ({from, to, children, top = 1360}) => {
  const f = useCurrentFrame();
  if (f < from - 2 || f > to + 12) return null;
  const pin = snap(f, from, 15, 160);
  const out = interpolate(f, [to, to + 10], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const p = pin * (1 - out);
  const shine = interpolate(f, [from + 6, from + 30], [-0.3, 1.3], clamp);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * 60}px)`, opacity: Math.min(1, p * 1.4)}}>
      <div style={{position: 'relative', overflow: 'hidden', padding: '26px 40px', borderRadius: 28, background: 'linear-gradient(180deg, rgba(20,4,8,0.72), rgba(40,4,12,0.72))', backdropFilter: 'blur(6px)', border: `2px solid rgba(231,194,125,0.75)`, boxShadow: '0 18px 40px rgba(0,0,0,0.55), 0 0 30px rgba(224,16,47,0.3)', textAlign: 'center'}}>
        {children}
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${shine * 100}%`, width: '25%', transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, transparent, rgba(255,236,190,0.25), transparent)'}} />
      </div>
    </div>
  );
};
const Title: React.CSSProperties = {fontFamily: SANS, fontWeight: 800, fontSize: 54, lineHeight: 1.1, color: C.ivory, letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,0.6)'};
const Gold: React.CSSProperties = {...Title, ...gold, textShadow: 'none', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))'};
const Sub: React.CSSProperties = {fontFamily: SANS, fontWeight: 600, fontSize: 32, lineHeight: 1.3, color: C.ivory, marginTop: 6, textShadow: '0 2px 6px rgba(0,0,0,0.7)'};
const Note: React.CSSProperties = {fontFamily: ITALIC, fontStyle: 'italic', fontWeight: 600, fontSize: 40, color: C.gold, marginTop: 4};
const Row: React.FC<{l: string; r: string; hot?: boolean}> = ({l, r, hot}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', gap: 40, alignItems: 'baseline', minWidth: 760, padding: '6px 0'}}>
    <span style={{...Sub, marginTop: 0, fontSize: 34, fontWeight: hot ? 800 : 600, color: hot ? C.gold : C.ivory}}>{l}</span>
    <span style={hot ? {...Gold, fontSize: 56} : {...Title, fontSize: 44, color: r === '1500 ₽' ? '#ff4a5e' : C.ivory}}>{r}</span>
  </div>
);

/** Small persistent badge at the top once the logo intro is over. */
const Badge: React.FC = () => {
  const f = useCurrentFrame();
  const from = s(4.6);
  if (f < from) return null;
  const p = snap(f, from, 15, 160);
  const fade = interpolate(f, [s(56.2), s(56.7)], [1, 0], clamp); // the user's poster closes the video
  const pulse = 0.5 + 0.5 * Math.sin(f / 8);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * -40}px)`, opacity: Math.min(1, p * 1.5) * fade}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 28px', borderRadius: 999, background: 'rgba(15,3,6,0.6)', border: '1.5px solid rgba(231,194,125,0.6)', fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.ivory}}>
        <span style={{width: 14, height: 14, borderRadius: '50%', background: C.blood, boxShadow: `0 0 ${8 + 10 * pulse}px ${C.blood}`}} />
        СЕГОДНЯ · 31.10 · 23:30 · TEMPLE BAR
      </div>
    </div>
  );
};

export const Overlay: React.FC = () => (
  <FontGate>
    <AbsoluteFill style={{background: '#000'}}>
      <OffthreadVideo src={staticFile('clips/promo.mp4')} style={{width: W, height: H}} />
      <Badge />
      <Card from={s(5)} to={s(11)}>
        <div style={{...Sub, marginTop: 0, color: C.gold, letterSpacing: 6, fontSize: 28}}>🎃 СЕГОДНЯ ТОТ САМЫЙ ДЕНЬ!</div>
        <div style={Gold}>LATIN FUSION</div>
        <div style={Title}>HALLOWEEN PARTY</div>
      </Card>
      <Card from={s(13)} to={s(19)}>
        <div style={Title}>📅 31 ОКТЯБРЯ · СУББОТА</div>
        <div style={{...Gold, fontSize: 60, marginTop: 6}}>⏰ 23:30 – 05:00</div>
      </Card>
      <Card from={s(21)} to={s(27)}>
        <div style={Gold}>📍 TEMPLE BAR</div>
        <div style={{...Sub, fontSize: 28, whiteSpace: 'nowrap'}}>м. Курская, Нижний Сусальный переулок, 5, стр. 4а</div>
      </Card>
      <Card from={s(29)} to={s(37)} top={1300}>
        <div style={{...Sub, marginTop: 0, color: C.gold, letterSpacing: 4, fontSize: 30, marginBottom: 6}}>🎟️ НЕ ЗАБУДЬ ПРО БИЛЕТЫ!</div>
        <Row l="⏳ Сегодня до 23:30" r="950 ₽" hot />
        <div style={{...Sub, fontSize: 26, color: '#ff8a9a', margin: '4px 0'}}>⚡ после 23:30 цена повышается:</div>
        <Row l="🌐 На сайте" r="1000 ₽" />
        <Row l="🚪 На входе в клуб" r="1500 ₽" />
      </Card>
      <Card from={s(39)} to={s(45)}>
        <div style={Title}>🎭 Надевай самый эффектный костюм</div>
        <div style={Note}>и приходи за своей порцией магии ✨</div>
      </Card>
      <Card from={s(46)} to={s(51.2)}>
        <div style={{...Sub, marginTop: 0, letterSpacing: 4, fontSize: 28, color: C.gold}}>БИЛЕТЫ НА САЙТЕ</div>
        <div style={{...Gold, fontSize: 64}}>🌐 latinfusion.ru</div>
      </Card>
      <Card from={s(52)} to={s(56.4)}>
        <div style={Title}>💃🕺 ДО ВСТРЕЧИ СЕГОДНЯ</div>
        <div style={{...Gold, fontSize: 60}}>НА ТАНЦПОЛЕ!</div>
        <div style={{...Sub, color: C.gold}}>31.10 · 23:30 · Temple Bar · latinfusion.ru</div>
      </Card>
    </AbsoluteFill>
  </FontGate>
);

export const Root: React.FC = () => <Composition id="Overlay" component={Overlay} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />;
