import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Couple, Reveal, Rule, Sans, Serif, Stage} from '../components/UI';
import {C, GOLD, SANS, SERIF, T, clamp, ease, silk, wf} from '../theme';

/* ---------------- business card -> platform ---------------- */
const TILES = [
  {i: 11, e: '🎓', t: 'Обучение'},
  {i: 12, e: '💳', t: 'Продажа курсов'},
  {i: 15, e: '⭐', t: 'Ваше имя'},
  {i: 19, e: '💃', t: 'Преподаватель'},
];

export const Platform: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s06', i, 'platform');
  const flip = interpolate(f, [w(7) - 2, w(7) + 14], [0, 180], clamp);
  const grow = ease(f, w(7) + 10, w(8) + 14);
  const cardIn = silk(f, 4, 14, 90);

  return (
    <AbsoluteFill>
      <Stage offset={T.scenes.platform.from} intensity={0.6} />
      <div style={{position: 'absolute', top: 160, left: 60, right: 60, textAlign: 'center'}}>
        <Reveal at={w(0) - 3}>
          <Sans size={44} color={C.rose} spacing="0.16em">
            ВАШ САЙТ СТАНЕТ
          </Sans>
        </Reveal>
        <Reveal at={w(3) - 3} style={{marginTop: 14}}>
          <Serif size={66} weight={700} style={{opacity: 1 - grow * 0.5}}>
            не просто{' '}
            <span style={{textDecoration: f > w(7) ? 'line-through' : 'none', textDecorationColor: C.crimson, textDecorationThickness: 6}}>визиткой</span>
          </Serif>
        </Reveal>
        <Reveal at={w(8) - 3} style={{marginTop: 14}}>
          <Serif size={96} gold italic>
            а платформой
          </Serif>
        </Reveal>
      </div>

      {/* card front (business card) / back expands into the platform */}
      <div style={{position: 'absolute', left: 540 - interpolate(grow, [0, 1], [380, 470]), top: interpolate(grow, [0, 1], [720, 560]), width: interpolate(grow, [0, 1], [760, 940]), height: interpolate(grow, [0, 1], [440, 1180]), perspective: 1800, transform: `translateY(${(1 - cardIn) * 600}px)`}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${flip}deg)`}}>
          {/* front */}
          <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 26, background: `linear-gradient(135deg, ${C.cream}, #EAD9C2)`, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', padding: 44, gap: 30}}>
            <Couple size={250} color={C.burgundy} />
            <div>
              <div style={{fontFamily: SERIF, fontWeight: 900, fontStyle: 'italic', fontSize: 64, color: C.burgundy}}>Ваше Имя</div>
              <div style={{fontFamily: SANS, fontSize: 30, color: '#6b5a50', marginTop: 8}}>преподаватель танцев</div>
              <div style={{height: 3, width: 220, background: GOLD, margin: '18px 0'}} />
              <div style={{fontFamily: SANS, fontSize: 28, color: '#6b5a50'}}>@vashe.imya</div>
            </div>
          </div>
          {/* back = platform */}
          <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 26, background: `linear-gradient(160deg, ${C.wine}, ${C.night})`, border: `2px solid ${C.gold}88`, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', padding: 40, overflow: 'hidden'}}>
            <div style={{fontFamily: SERIF, fontWeight: 900, fontStyle: 'italic', fontSize: 52, color: C.gold}}>ВашеИмя Dance · платформа</div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 34}}>
              {TILES.map((t) => {
                const s = silk(f, w(t.i) - 3, 12, 150);
                return (
                  <div key={t.t} style={{height: 300, borderRadius: 24, background: 'rgba(255,244,230,0.07)', border: `2px solid ${C.gold}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, transform: `scale(${s})`, opacity: Math.min(1, s * 2)}}>
                    <div style={{fontSize: 110}}>{t.e}</div>
                    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.cream}}>{t.t}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- больше учеников, продаж, свободы ---------------- */
export const More: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s07', i, 'more');
  const lines = [
    {i: 0, a: 'больше', b: 'учеников', gold: false},
    {i: 2, a: 'больше', b: 'продаж', gold: false},
    {i: 4, a: 'больше', b: 'свободы', gold: true},
  ];
  const free = silk(f, w(5) - 2, 10, 120);
  return (
    <AbsoluteFill>
      <Stage offset={T.scenes.more.from} intensity={1} />
      <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center'}}>
        {lines.map((l, k) => {
          const s = silk(f, w(l.i) - 3, 11, 170);
          return (
            <div key={k} style={{marginBottom: 80, transform: `scale(${0.6 + s * 0.4}) translateY(${(1 - s) * 80}px)`, opacity: Math.min(1, s * 2)}}>
              <Sans size={40} color={C.rose} spacing="0.3em">
                {l.a.toUpperCase()}
              </Sans>
              <Serif size={k === 2 ? 170 : 130} gold={l.gold} italic={l.gold}>
                {l.b}
              </Serif>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - free) * 300}px) rotate(${(1 - free) * -8}deg)`, opacity: free}}>
        <Couple size={520} color={C.gold} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- CTA ---------------- */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s09', i, 'cta');
  const pulse = 1 + Math.max(0, Math.sin(f / 7)) * 0.035;
  return (
    <AbsoluteFill>
      <Stage offset={T.scenes.cta.from} intensity={1} spot="50% 60%" />
      <div style={{position: 'absolute', top: 300, left: 40, right: 40, textAlign: 'center'}}>
        <Reveal at={w(0) - 3}>
          <Serif size={150} gold italic>
            Напишите
          </Serif>
          <Serif size={150} gold italic>
            мне
          </Serif>
        </Reveal>
        <Rule at={w(1)} width={460} style={{marginTop: 24}} />
        <Reveal at={w(2) - 3} style={{marginTop: 24}}>
          <Sans size={56} spacing="0.28em" color={C.cream}>
            ПРЯМО СЕЙЧАС
          </Sans>
        </Reveal>
      </div>
      <div style={{position: 'absolute', left: 140, right: 140, top: 1180, transform: `scale(${silk(f, w(3), 12, 160) * pulse})`}}>
        <div style={{height: 150, borderRadius: 999, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, boxShadow: `0 0 70px ${C.gold}66`, fontFamily: SERIF, fontWeight: 900, fontStyle: 'italic', fontSize: 58, color: C.night}}>
          📩 Написать мне
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', opacity: ease(f, w(3) + 10, w(3) + 24)}}>
        <Sans size={34} color="rgba(255,244,230,0.75)" spacing="0.12em">
          сайты для преподавателей танцев
        </Sans>
      </div>
    </AbsoluteFill>
  );
};
