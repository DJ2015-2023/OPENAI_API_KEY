import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {BlandCard, ProCard} from '../components/Card';
import {Body, Head, Snap, Studio, Tag, Up} from '../components/UI';
import {BODY, C, DISPLAY, SceneKey, ease, snap, wf} from '../theme';

/* ================= INCLUDES: infographic callouts pointing at the card ================= */
type Callout = {i: number; n: number; text: string; dot: [number, number]};

const CALLOUTS_A: Callout[] = [
  {i: 4, n: 1, text: 'Продающий дизайн карточек', dot: [0.3, 0.2]},
  {i: 7, n: 2, text: 'Профессиональная инфографика', dot: [0.25, 0.68]},
  {i: 9, n: 3, text: 'Анализ конкурентов', dot: [0.8, 0.12]},
  {i: 11, n: 4, text: 'Выделение преимуществ товара', dot: [0.75, 0.62]},
];
const CALLOUTS_B: Callout[] = [
  {i: 0, n: 5, text: 'Современный Premium-дизайн', dot: [0.4, 0.3]},
  {i: 3, n: 6, text: 'Адаптация под маркетплейсы', dot: [0.15, 0.9]},
  {i: 7, n: 7, text: 'Высокое качество изображений', dot: [0.68, 0.62]},
  {i: 10, n: 8, text: 'Индивидуальный стиль бренда', dot: [0.88, 0.1]},
];

const CW = 450;
const CX = 540 - CW / 2;
const CY = 300;
const CH = CW * (4 / 3);
// 2x2 grid of callout boxes below the card
const BOX = (k: number) => ({x: k % 2 === 0 ? 50 : 560, y: 940 + Math.floor(k / 2) * 250, w: 470, h: 210});

export const Includes: React.FC<{scene: SceneKey; part: 'A' | 'B'}> = ({scene, part}) => {
  const f = useCurrentFrame();
  const clip = part === 'A' ? 's04' : 's05';
  const items = part === 'A' ? CALLOUTS_A : CALLOUTS_B;
  const at = items.map((c) => wf(clip, c.i, scene) - 3);
  const cardIn = snap(f, 2, 15, 120);

  return (
    <AbsoluteFill>
      <Studio tint={part === 'B' ? '#000' : undefined} />
      <div style={{position: 'absolute', top: 110, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <Up at={part === 'A' ? wf('s04', 0, scene) - 3 : 0}>
          <Head size={66}>{part === 'A' ? 'Что входит в работу' : 'И ещё'}</Head>
        </Up>
        <Body size={30} weight={600} color={C.grey}>
          {part === 'A' ? '01–04' : '05–08'}
        </Body>
      </div>
      <div style={{position: 'absolute', left: CX, top: CY, transform: `translateY(${(1 - cardIn) * 900}px) rotate(${(1 - cardIn) * 6}deg)`}}>
        <ProCard w={CW} theme={part === 'A' ? 'violet' : 'premium'} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {items.map((c, k) => {
          const b = BOX(k);
          const dx = CX + c.dot[0] * CW;
          const dy = CY + c.dot[1] * CH;
          const bx = b.x + b.w / 2;
          const by = b.y;
          const p = ease(f, at[k], at[k] + 12);
          return (
            <g key={k} opacity={p > 0 ? 1 : 0}>
              <line x1={dx} y1={dy} x2={dx + (bx - dx) * p} y2={dy + (by - dy) * p} stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" />
              <circle cx={dx} cy={dy} r={14 * Math.min(1, p * 2)} fill={C.lemon} stroke={C.ink} strokeWidth={4} />
              <circle cx={dx} cy={dy} r={14 + ((f - at[k]) % 30) * 1.2} fill="none" stroke={C.lemon} strokeWidth={3} opacity={Math.max(0, 1 - ((f - at[k]) % 30) / 30)} />
            </g>
          );
        })}
      </svg>
      {items.map((c, k) => {
        const b = BOX(k);
        const s = snap(f, at[k] + 6, 13, 190);
        return (
          <div key={k} style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: C.white, borderRadius: 26, padding: '22px 26px', boxShadow: '0 16px 40px rgba(0,0,0,0.1)', borderTop: `8px solid ${k % 2 ? C.violet : C.lemon}`, transform: `scale(${s})`, opacity: Math.min(1, s * 3)}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 54, color: C.violet, lineHeight: 1}}>0{c.n}</div>
            <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 36, color: C.ink, marginTop: 10, lineHeight: 1.15}}>{c.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const IncludesA: React.FC = () => <Includes scene="includesA" part="A" />;
export const IncludesB: React.FC = () => <Includes scene="includesB" part="B" />;

/* ================= PLATFORMS ================= */
const MARKETS = [
  {i: 1, name: 'Wildberries', bg: 'linear-gradient(135deg,#CB11AB,#481173)', fg: '#fff', dot: '🟣'},
  {i: 2, name: 'Ozon', bg: '#005BFF', fg: '#fff', dot: '🔵'},
  {i: 3, name: 'Lamoda', bg: '#111111', fg: '#fff', dot: '⚫'},
  {i: 4, name: 'Яндекс Маркет', bg: '#FFCC00', fg: '#111', dot: '🟡'},
  {i: 6, name: 'Авито', bg: '#00AAFF', fg: '#fff', dot: '🛒'},
];

const Screen: React.FC<{m: (typeof MARKETS)[number]; s: number}> = ({m, s}) => (
  <div style={{width: 300, height: 470, borderRadius: 34, background: C.white, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.14)', transform: `scale(${s}) rotate(${(1 - s) * 10}deg)`, opacity: Math.min(1, s * 3)}}>
    <div style={{height: 76, background: m.bg, color: m.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: m.name.length > 9 ? 30 : 36}}>{m.name}</div>
    <div style={{display: 'flex', justifyContent: 'center', paddingTop: 22}}>
      <ProCard w={240} />
    </div>
    <div style={{padding: '12px 30px', fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.ink}}>
      2 490 ₽ <span style={{color: C.grey, fontWeight: 500, textDecoration: 'line-through', fontSize: 20}}>3 550 ₽</span>
    </div>
  </div>
);

export const Platforms: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s06', i, 'platforms');
  const pos = [
    [50, 330],
    [390, 330],
    [730, 330],
    [220, 850],
    [560, 850],
  ];
  return (
    <AbsoluteFill>
      <Studio />
      <div style={{position: 'absolute', top: 120, left: 60, right: 60}}>
        <Up at={w(0) - 3}>
          <Head size={84}>Работаю с</Head>
        </Up>
      </div>
      {MARKETS.map((m, k) => (
        <div key={m.name} style={{position: 'absolute', left: pos[k][0], top: pos[k][1]}}>
          <Screen m={m} s={snap(f, w(m.i) - 3, 13, 170)} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 60, right: 60, top: 1350, display: 'flex', gap: 24}}>
        {[
          {i: 10, e: '🛍️', t: 'Интернет-магазины'},
          {i: 12, e: '🏪', t: 'Офлайн-бизнес'},
        ].map((x) => {
          const s = snap(f, w(x.i) - 3, 13, 170);
          return (
            <div key={x.t} style={{flex: 1, height: 110, borderRadius: 999, background: C.ink, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: BODY, fontWeight: 600, fontSize: 34, transform: `scale(${s})`, opacity: Math.min(1, s * 3)}}>
              <span style={{fontSize: 46}}>{x.e}</span>
              {x.t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ================= GOAL: centre of attention ================= */
export const Goal: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s07', i, 'goal');
  const strike = ease(f, w(6), w(6) + 10);
  const spot = ease(f, w(17), w(20), 0, 1, Easing.inOut(Easing.cubic));
  const hero = snap(f, w(8) - 3, 14, 120);
  const chart = ease(f, w(11) - 4, w(12) + 30);
  const end = ease(f, w(21) + 18, w(21) + 30);
  const pulse = 1 + Math.max(0, Math.sin(f / 7)) * 0.04;
  const crowd = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) crowd.push([c, r]);

  return (
    <AbsoluteFill>
      <Studio />
      {/* crowd of competitor cards, dimming as the spotlight comes on */}
      <AbsoluteFill style={{opacity: 0.25 + 0.75 * hero * (1 - spot * 0.7), filter: `blur(${spot * 3}px)`}}>
        {crowd.map(([c, r], k) => (
          <div key={k} style={{position: 'absolute', left: 30 + c * 262, top: 250 + r * 290, transform: 'scale(0.82)', transformOrigin: '0 0'}}>
            <BlandCard w={290} emoji={['👟', '🧴', '🎧', '⌚', '👜', '🧸', '🕶️', '💄'][k % 8]} />
          </div>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 42% 30% at 50% 47%, transparent 0%, rgba(10,10,12,${spot * 0.82}) 75%)`}} />
      {/* sales line chart behind the hero */}
      <svg width={1080} height={700} viewBox="0 0 1080 700" style={{position: 'absolute', top: 400, opacity: chart * (1 - spot * 0.6)}}>
        <polyline points="60,640 220,600 380,610 540,480 700,420 860,250 1020,90" fill="none" stroke={C.violet} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - chart} />
      </svg>
      <div style={{position: 'absolute', left: 540 - 230, top: 470, transform: `scale(${(0.6 + hero * 0.4) * (1 + spot * 0.18)})`, opacity: hero, filter: spot > 0 ? `drop-shadow(0 0 ${spot * 70}px ${C.lemon}aa)` : undefined}}>
        <ProCard w={460} />
      </div>

      <div style={{position: 'absolute', top: 110, left: 60, right: 60, textAlign: 'center', opacity: 1 - end}}>
        <Up at={w(2) - 3}>
          <Body size={44} weight={600} color={spot > 0.5 ? C.white : C.ink}>
            не просто <span style={{textDecoration: strike > 0.5 ? 'line-through' : 'none', textDecorationColor: C.red, textDecorationThickness: 6}}>красивый дизайн</span>
          </Body>
        </Up>
        <Up at={w(8) - 3}>
          <Head size={86} color={spot > 0.5 ? C.lemon : C.violet} style={{marginTop: 10}}>
            карточка, которая продаёт
          </Head>
        </Up>
      </div>
      {/* end card */}
      <div style={{position: 'absolute', left: 80, right: 80, top: 1180, textAlign: 'center', opacity: end, transform: `scale(${pulse})`}}>
        <Tag size={64} style={{padding: '22px 46px'}}>
          📩 Напишите мне
        </Tag>
        <Body size={34} weight={600} color={C.white} style={{marginTop: 22}}>
          Карточки для маркетплейсов
        </Body>
      </div>
      <Snap at={w(19) - 2} style={{position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center', opacity: spot * (1 - end)}}>
        <Head size={64} color={C.white}>
          в центре внимания
        </Head>
      </Snap>
    </AbsoluteFill>
  );
};

