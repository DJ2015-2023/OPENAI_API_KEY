import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Laptop, Phone, Site, Tablet, THEMES} from '../components/Site';
import {CheckItem, Couple, Reveal, Serif, Stage} from '../components/UI';
import {C, GOLD, SANS, SERIF, SceneKey, T, ease, silk, wf} from '../theme';

type Item = {clip: string; i: number; text: string; visual: (f: number, at: number) => React.ReactNode};

const th = THEMES[0];

const Speed: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = ease(f, at, at + 30);
  const ang = -120 + p * 220;
  return (
    <div style={{position: 'absolute', left: 190, top: 380, width: 700, height: 700, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <svg width={560} height={340} viewBox="0 0 200 120">
        <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={14} strokeLinecap="round" />
        <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke={C.gold} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p * 0.95} />
        <line x1={100} y1={110} x2={100 + Math.cos(((ang - 90) * Math.PI) / 180) * 70} y2={110 + Math.sin(((ang - 90) * Math.PI) / 180) * 70} stroke={C.cream} strokeWidth={4} strokeLinecap="round" />
        <circle cx={100} cy={110} r={7} fill={C.cream} />
      </svg>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 90, color: C.gold, marginTop: 10}}>⚡ Быстро</div>
      <div style={{marginTop: 30, width: 620, padding: '22px 28px', borderRadius: 24, background: '#fff', opacity: ease(f, at + 14, at + 24)}}>
        <div style={{fontFamily: SANS, fontSize: 26, color: '#555'}}>🔎 уроки бачаты онлайн</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#1a0dab', marginTop: 12}}>ВашеИмя Dance — онлайн-школа танца</div>
        <div style={{fontFamily: SANS, fontSize: 22, color: '#2a7a2a'}}>vashe-imya.dance</div>
      </div>
    </div>
  );
};

const Integrations: React.FC<{f: number; at: number}> = ({f, at}) => {
  const chips = [
    {t: 'Telegram', c: '#2AABEE', e: '✈️'},
    {t: 'WhatsApp', c: '#25D366', e: '💬'},
    {t: 'AI-ассистент', c: C.gold, e: '✨'},
  ];
  return (
    <>
      <Phone w={360} style={{left: 360, top: 380}}>
        <Site w={332} h={680} th={th} page="home" mobile at={at} />
      </Phone>
      {chips.map((c, k) => {
        const s = silk(f, at + k * 8, 12, 150);
        const a = (k / 3) * Math.PI * 2 - Math.PI / 2 + f / 60;
        return (
          <div key={c.t} style={{position: 'absolute', left: 540 + Math.cos(a) * 380 - 150, top: 760 + Math.sin(a) * 330 - 45, width: 300, transform: `scale(${s})`, opacity: Math.min(1, s * 2)}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderRadius: 999, background: c.c, color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.4)'}}>
              <span>{c.e}</span>
              {c.t}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Brand: React.FC<{f: number; at: number}> = ({f, at}) => {
  const s = silk(f, at, 14, 80);
  return (
    <div style={{position: 'absolute', left: 140, top: 360, width: 800, height: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.8 + s * 0.2})`, opacity: s}}>
      <div style={{width: 420, height: 420, borderRadius: '50%', border: `6px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle, ${C.burgundy}, ${C.night})`, boxShadow: `0 0 80px ${C.gold}44`}}>
        <div style={{textAlign: 'center'}}>
          <Couple size={220} color={C.gold} />
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 900, fontSize: 48, background: GOLD, WebkitBackgroundClip: 'text', color: 'transparent', marginTop: -10}}>Ваше Имя</div>
        </div>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, letterSpacing: '0.4em', color: C.rose, marginTop: 40}}>PREMIUM UI / UX</div>
    </div>
  );
};

const ITEMS_A: Item[] = [
  {clip: 's04', i: 2, text: 'Продажа онлайн-курсов и видеоуроков', visual: (f, at) => <Tablet w={620} style={{left: 230, top: 330}}><Site w={588} h={790} th={th} page="courses" mobile at={at} /></Tablet>},
  {clip: 's04', i: 8, text: 'Онлайн-запись на занятия и мастер-классы', visual: (f, at) => <Phone w={380} style={{left: 350, top: 330}}><Site w={350} h={720} th={THEMES[1]} page="booking" mobile at={at} /></Phone>},
  {clip: 's04', i: 14, text: 'Личный кабинет ученика', visual: (f, at) => <Tablet w={620} style={{left: 230, top: 330}}><Site w={588} h={790} th={THEMES[3]} page="account" mobile at={at} /></Tablet>},
  {clip: 's04', i: 17, text: 'Онлайн-оплата и автоматический доступ', visual: (f, at) => <Phone w={380} style={{left: 350, top: 330}}><Site w={350} h={720} th={th} page="payment" mobile at={at} /></Phone>},
  {clip: 's04', i: 23, text: 'Расписание занятий и календарь', visual: (f, at) => <Laptop w={900} style={{left: 90, top: 470}}><Site w={876} h={516} th={THEMES[2]} page="schedule" at={at} /></Laptop>},
];

const ITEMS_B: Item[] = [
  {clip: 's05', i: 0, text: 'Интеграция с Telegram, WhatsApp и AI', visual: (f, at) => <Integrations f={f} at={at} />},
  {
    clip: 's05',
    i: 7,
    text: 'Адаптация для ПК, планшетов и смартфонов',
    visual: (f, at) => (
      <>
        <Laptop w={760} style={{left: 160, top: 420, transform: `translateY(${(1 - silk(f, at, 14, 120)) * 300}px)`}}><Site w={736} h={432} th={th} page="home" at={at} /></Laptop>
        <Tablet w={300} style={{left: 60, top: 740, transform: `translateX(${(1 - silk(f, at + 8, 14, 120)) * -500}px)`}}><Site w={268} h={360} th={th} page="home" mobile at={at} /></Tablet>
        <Phone w={190} style={{left: 830, top: 760, transform: `translateX(${(1 - silk(f, at + 14, 14, 120)) * 500}px)`}}><Site w={174} h={360} th={th} page="home" mobile at={at} /></Phone>
      </>
    ),
  },
  {clip: 's05', i: 13, text: 'Высокая скорость и SEO-оптимизация', visual: (f, at) => <Speed f={f} at={at} />},
  {clip: 's05', i: 19, text: 'Премиальный UI/UX-дизайн под ваш бренд', visual: (f, at) => <Brand f={f} at={at} />},
];

export const Features: React.FC<{scene: SceneKey; part: 'A' | 'B'}> = ({scene, part}) => {
  const f = useCurrentFrame();
  const items = part === 'A' ? ITEMS_A : ITEMS_B;
  const at = items.map((it) => wf(it.clip, it.i, scene) - 3);
  let active = -1;
  at.forEach((a, k) => {
    if (f >= a) active = k;
  });
  const total = 9;
  const done = (part === 'A' ? 0 : 5) + Math.max(0, active + 1);

  return (
    <AbsoluteFill>
      <Stage offset={T.scenes[scene].from} intensity={0.45} spot="50% 40%" />
      <div style={{position: 'absolute', top: 120, left: 70, right: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <Reveal at={part === 'A' ? wf('s04', 0, scene) - 3 : 0}>
          <Serif size={74} gold italic>
            Что входит
          </Serif>
        </Reveal>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: C.cream}}>
          {done}
          <span style={{fontSize: 36, color: C.rose}}>/{total}</span>
        </div>
      </div>
      <div style={{position: 'absolute', top: 230, left: 70, right: 70, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)'}}>
        <div style={{height: '100%', width: `${(done / total) * 100}%`, background: GOLD, borderRadius: 2}} />
      </div>

      {/* visual for the active item (cross-fades between items) */}
      {items.map((it, k) => {
        const inP = ease(f, at[k] - 4, at[k] + 8);
        const outP = k < items.length - 1 ? ease(f, at[k + 1] - 6, at[k + 1] + 2) : 0;
        const vis = inP * (1 - outP);
        if (vis <= 0.001) return null;
        return (
          <AbsoluteFill key={k} style={{opacity: vis, transform: `translateX(${(1 - inP) * 120 - outP * 120}px) scale(${0.94 + vis * 0.06})`}}>
            {it.visual(f, at[k])}
          </AbsoluteFill>
        );
      })}

      {/* checklist */}
      <div style={{position: 'absolute', left: 80, right: 60, top: part === 'A' ? 1260 : 1310, display: 'flex', flexDirection: 'column', gap: part === 'A' ? 26 : 34}}>
        {items.map((it, k) => (
          <CheckItem key={k} at={at[k]} text={it.text} active={k === active} size={38} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const FeaturesA: React.FC = () => <Features scene="featuresA" part="A" />;
export const FeaturesB: React.FC = () => <Features scene="featuresB" part="B" />;
