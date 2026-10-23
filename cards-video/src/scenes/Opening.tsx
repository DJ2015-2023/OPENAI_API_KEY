import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Bottle3D} from '../components/Bottle3D';
import {BlandCard, Layers, ProCard} from '../components/Card';
import {Body, Head, Snap, Studio, Tag, Up} from '../components/UI';
import {BODY, C, DISPLAY, clamp, ease, snap, wf} from '../theme';

/* ================= HOOK ================= */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s01', i, 'hook');
  return (
    <AbsoluteFill>
      <Studio />
      <Bottle3D size={980} appear={snap(f, 2, 13, 110)} style={{left: 50, top: 420}} />
      <div style={{position: 'absolute', top: 150, left: 70, right: 70}}>
        <Up at={w(0) - 3}>
          <Head size={150}>Ваш товар</Head>
        </Up>
        <Up at={w(2) - 3}>
          <Head size={96} color={C.grey}>
            заслуживает
          </Head>
        </Up>
        <Snap at={w(3) - 2} style={{marginTop: 18, transformOrigin: '0% 50%'}}>
          <Tag size={84} bg={C.violet} color={C.white}>
            продавать больше ↗
          </Tag>
        </Snap>
      </div>
    </AbsoluteFill>
  );
};

/* ================= SECONDS: the 3-second scroll ================= */
const EMO = ['👟', '🧴', '🎧', '⌚', '👜', '🧸', '🕶️', '💄', '🥤', '🧢', '📱', '🪴'];

export const Seconds: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s02', i, 'seconds');
  const stop = w(12) - 6; // the feed stops on "карточка"
  // scroll fast, decelerate into the stop
  const scroll = interpolate(f, [0, stop - 20, stop], [0, 2600, 2900], {...clamp, easing: Easing.out(Easing.quad)});
  const pop = snap(f, stop, 16, 140);
  const count = Math.max(0, 3 - Math.floor(Math.max(0, f - (w(4) - 4)) / 12));
  const timerOn = ease(f, w(4) - 6, w(4)) * (1 - ease(f, stop - 6, stop));
  const ring = interpolate(f, [w(4) - 4, w(4) + 32], [1, 0], clamp);
  const cw = 455;

  return (
    <AbsoluteFill style={{background: '#F5F4F1'}}>
      {/* marketplace feed */}
      <AbsoluteFill style={{filter: `blur(${pop * 6}px) saturate(${1 - pop * 0.6})`, opacity: 1 - pop * 0.45}}>
        <div style={{position: 'absolute', left: 50, right: 50, top: 260 - (scroll % 1300), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40}}>
          {new Array(16).fill(0).map((_, i) => (
            <BlandCard key={i} w={cw} emoji={EMO[i % EMO.length]} />
          ))}
        </div>
      </AbsoluteFill>
      {/* app chrome */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 220, background: C.white, boxShadow: '0 6px 20px rgba(0,0,0,0.06)', padding: '70px 50px 0'}}>
        <div style={{height: 100, borderRadius: 26, background: '#F0EFEC', display: 'flex', alignItems: 'center', gap: 20, padding: '0 34px', fontFamily: BODY, fontSize: 38, color: C.grey}}>
          🔍 Искать на маркетплейсе
        </div>
      </div>

      {/* countdown */}
      <div style={{position: 'absolute', left: 540 - 170, top: 640, width: 340, height: 340, opacity: timerOn}}>
        <svg width={340} height={340} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="rgba(20,20,20,0.85)" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={C.lemon} strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ring} transform="rotate(-90 50 50)" />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 160, color: C.white, lineHeight: 1}}>{count || 1}</div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 30, color: C.lemon}}>секунды</div>
        </div>
      </div>

      {/* our card pops out of the feed */}
      <div style={{position: 'absolute', left: 540 - 270, top: 420, transform: `scale(${0.6 + pop * 0.4}) rotate(${(1 - pop) * -4}deg)`, opacity: pop, filter: `drop-shadow(0 0 ${pop * 60}px ${C.violet}88)`}}>
        <ProCard w={540} />
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 270, textAlign: 'center', opacity: ease(f, w(15) - 4, w(15) + 6)}}>
        <Head size={70}>главный инструмент продаж</Head>
      </div>
    </AbsoluteFill>
  );
};

/* ================= BUILD: exploded layers -> finished card -> metrics ================= */
const Meter: React.FC<{label: string; p: number; color: string}> = ({label, p, color}) => (
  <div style={{flex: 1, background: C.white, borderRadius: 28, padding: '22px 28px', boxShadow: '0 16px 40px rgba(0,0,0,0.08)'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
      <span style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, color: C.ink}}>{label}</span>
      <span style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color}}>↑</span>
    </div>
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 10, height: 110, marginTop: 10}}>
      {[0.3, 0.42, 0.38, 0.55, 0.68, 0.8, 1].map((v, k) => (
        <div key={k} style={{flex: 1, height: `${Math.max(4, v * 100 * Math.min(1, Math.max(0, p * 1.4 - k * 0.06)))}%`, background: k === 6 ? color : '#E3E0DA', borderRadius: 8}} />
      ))}
    </div>
  </div>
);

export const Build: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s03', i, 'build');
  const L: Layers = {
    bg: ease(f, w(2) - 4, w(2) + 6),
    product: ease(f, w(3) - 4, w(3) + 8),
    title: ease(f, w(5) - 4, w(5) + 6),
    info: ease(f, w(6) - 2, w(6) + 14),
    badge: ease(f, w(6) + 6, w(6) + 14),
  };
  const explode = 1 - ease(f, w(9), w(10) + 6, 0, 1, Easing.inOut(Easing.cubic));
  const rotY = interpolate(explode, [0, 1], [0, -38]);
  const rotX = interpolate(explode, [0, 1], [0, 18]);
  const rivals = ease(f, w(10), w(12) + 10);
  const metrics = snap(f, w(13) - 4, 14, 140);

  return (
    <AbsoluteFill>
      <Studio tint={C.violet} />
      <div style={{position: 'absolute', top: 110, left: 60, right: 60, textAlign: 'center'}}>
        <Up at={w(0) - 3}>
          <Body size={40} weight={600} color={C.grey} style={{letterSpacing: '0.2em'}}>
            Я СОЗДАЮ
          </Body>
        </Up>
        <Up at={w(5) - 3}>
          <Head size={84}>продающие карточки</Head>
        </Up>
      </div>
      {/* rivals that our card outshines */}
      {[-1, 1].map((side) => (
        <div key={side} style={{position: 'absolute', left: 540 + side * 390 - 130, top: 520, transform: `scale(${1 - rivals * 0.25})`, opacity: rivals * 0.8, filter: `grayscale(1) blur(${rivals * 2}px)`}}>
          <BlandCard w={260} emoji={side < 0 ? '🧴' : '💄'} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 540 - 250, top: 330, width: 500, perspective: 2000, transform: `scale(${1 - metrics * 0.12})`, transformOrigin: '50% 0%'}}>
        <div style={{transformStyle: 'preserve-3d', transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`}}>
          <ProCard w={500} layers={L} explode={explode} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 1130, display: 'flex', gap: 30, transform: `translateY(${(1 - metrics) * 300}px)`, opacity: metrics}}>
        <Meter label="CTR" p={ease(f, w(14) - 4, w(14) + 24)} color={C.violet} />
        <Meter label="Конверсия" p={ease(f, w(17) - 4, w(17) + 24)} color={C.red} />
      </div>
    </AbsoluteFill>
  );
};

