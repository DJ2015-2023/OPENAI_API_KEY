import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Big, Body, Card, Confetti, Grain, Paper, Pill, Punch, SlotLine} from '../components/UI';
import {BODY, C, T, bounce, clamp, ease, rand, wf} from '../theme';

const S = 'mission' as const;

const GOALS = [
  {i: 9, emoji: '⏱', text: 'Экономить ваше время', bg: C.lime},
  {i: 12, emoji: '⭐', text: 'Улучшать сервис', bg: C.sky},
];

export const Mission: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.mission.dur;
  const w = (i: number) => wf('s08', i, S);
  const strike = ease(f, w(7) + 4, w(7) + 16);
  const funnelIn = bounce(f, w(15) - 4, 12, 140);
  const convert = w(16);

  return (
    <AbsoluteFill>
      <Paper color={C.cream} />
      <Punch dur={dur} hits={[w(5), w(9), w(12), w(15), w(18)]} amount={0.03} drift={[1.03, 1.0]}>
        <div style={{position: 'absolute', left: 70, top: 120}}>
          <Pill bg={C.orange} color={C.paper} size={36} style={{transform: `scale(${bounce(f, w(0) - 2)})`}}>
            Главная задача чат-бота
          </Pill>
        </div>

        {/* struck-through line */}
        <div style={{position: 'absolute', left: 70, right: 70, top: 250}}>
          <SlotLine at={w(3) - 3}>
            <Big size={56} color={strike > 0.5 ? C.grey : C.ink}>
              не просто отвечать
            </Big>
          </SlotLine>
          <SlotLine at={w(6) - 3}>
            <Big size={56} color={strike > 0.5 ? C.grey : C.ink}>
              на сообщения
            </Big>
          </SlotLine>
          <svg width={840} height={140} viewBox="0 0 940 140" preserveAspectRatio="none" style={{position: 'absolute', left: -10, top: 0, overflow: 'visible'}}>
            <path
              d="M10 38 C 200 22, 420 56, 620 30 S 880 22, 920 40 M20 104 C 220 86, 460 120, 640 96 S 800 92, 700 104"
              fill="none"
              stroke={C.orange}
              strokeWidth={16}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - strike}
            />
          </svg>
        </div>

        {/* "а ..." goals */}
        <div style={{position: 'absolute', left: 70, top: 420, opacity: ease(f, w(8), w(8) + 6)}}>
          <Big size={64} color={C.orange}>
            а…
          </Big>
        </div>
        {GOALS.map((g, k) => {
          const s = bounce(f, w(g.i) - 3, 11, 170);
          return (
            <div key={g.text} style={{position: 'absolute', left: 70, right: 70, top: 520 + k * 190, transform: `translateX(${(1 - s) * 1100}px) rotate(${k ? 1.5 : -1.5}deg)`}}>
              <Card bg={g.bg} style={{padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 26}}>
                <div style={{fontSize: 80, lineHeight: 1}}>{g.emoji}</div>
                <Big size={50}>{g.text}</Big>
              </Card>
            </div>
          );
        })}

        {/* funnel: обращения -> клиенты */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1000, height: 820, transform: `scale(${funnelIn})`, transformOrigin: '50% 0%'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center'}}>
            <Body size={40} weight={800}>
              превращать <span style={{background: C.ink, color: C.paper, padding: '2px 14px', borderRadius: 10}}>обращения</span> в клиентов
            </Body>
          </div>
          {/* falling chat bubbles */}
          {new Array(9).fill(0).map((_, i) => {
            const t0 = convert - 10 + i * 4;
            const p = interpolate(f, [t0, t0 + 22], [0, 1], clamp);
            if (p <= 0 || p >= 1) return null;
            const x = 540 + (rand(i * 2.3) - 0.5) * 520 * (1 - p);
            return (
              <div key={i} style={{position: 'absolute', left: x - 40, top: 90 + p * 330, fontSize: 70, opacity: 1 - p * 0.3, transform: `scale(${1 - p * 0.5})`}}>
                💬
              </div>
            );
          })}
          <svg width={1080} height={520} viewBox="0 0 1080 520" style={{position: 'absolute', top: 160}}>
            <path d="M240 20 H840 L620 300 V420 H460 V300 Z" fill={C.paper} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
            <path d="M240 20 H840 L620 300 V420 H460 V300 Z" fill={C.orange} opacity={0.25} />
          </svg>
          {/* clients coming out */}
          {new Array(5).fill(0).map((_, i) => {
            const t0 = convert + 8 + i * 5;
            const p = bounce(f, t0, 10, 180);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 540 - 60 + (i - 2) * 150 * p,
                  top: 600 + p * 60,
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  background: [C.lime, C.sky, C.pink, '#FFD27A', '#B9F0D9'][i],
                  border: `5px solid ${C.ink}`,
                  boxShadow: `6px 6px 0 ${C.ink}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 62,
                  opacity: Math.min(1, p * 3),
                  transform: `scale(${p})`,
                }}
              >
                🤩
              </div>
            );
          })}
        </div>
        <Confetti at={w(18)} x={540} y={1650} n={46} />
      </Punch>
      <Grain />
    </AbsoluteFill>
  );
};
