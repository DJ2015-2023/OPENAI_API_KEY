import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {Robot3D} from '../components/Robot3D';
import {Big, Body, Card, Grain, Pop, Punch} from '../components/UI';
import {BODY, C, T, bounce, clamp, ease, wf} from '../theme';

const S = 'instant' as const;

const MOODS = [
  {i: 6, label: 'заняты', emoji: '💼', bg: C.sky, rot: -6},
  {i: 7, label: 'отдыхаете', emoji: '🏖️', bg: C.lime, rot: 4},
  {i: 9, label: 'спите', emoji: '🌙', bg: C.pink, rot: -3},
];

export const Instant: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.instant.dur;
  const w = (i: number) => wf('s03', i, S);
  // day -> sunset -> night as the moods change
  const sky = interpolateColors(f, [w(6) - 6, w(7), w(9) - 4, w(9) + 10], [C.cream, '#FFD9A8', '#2A2F66', C.night]);
  const night = interpolate(f, [w(9) - 4, w(9) + 10], [0, 1], clamp);
  const ink = night > 0.5 ? C.paper : C.ink;
  const arc = interpolate(f, [0, dur], [0, 1], clamp);
  const bubble = bounce(f, w(2) - 2, 9, 200);

  return (
    <AbsoluteFill style={{background: sky}}>
      {/* stars */}
      {new Array(40).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (i * 137) % 1080,
            top: (i * 293) % 1100,
            width: 6,
            height: 6,
            borderRadius: 3,
            background: '#fff',
            opacity: night * (0.4 + 0.6 * Math.abs(Math.sin(f / 9 + i))),
          }}
        />
      ))}
      {/* sun -> moon on an arc */}
      <div
        style={{
          position: 'absolute',
          left: interpolate(arc, [0, 1], [120, 820]) - 70,
          top: 440 - Math.sin(arc * Math.PI) * 110,
          width: 140,
          height: 140,
          borderRadius: 70,
          background: night > 0.5 ? '#FFF4C2' : C.orange,
          border: `5px solid ${C.ink}`,
          boxShadow: night > 0.5 ? '0 0 60px #FFF4C2' : `8px 8px 0 ${C.ink}`,
        }}
      />
      <Punch dur={dur} hits={[w(2), w(6), w(7), w(9)]} amount={0.03} drift={[1.0, 1.05]}>
        {/* headline */}
        <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center'}}>
          <Pop at={w(0)}>
            <Body size={44} weight={800} color={ink}>
              Чат-бот отвечает
            </Body>
          </Pop>
          <Pop at={w(2) - 2} rot={-8}>
            <Big size={112} color={night > 0.5 ? C.lime : C.cobalt} style={{marginTop: 6}}>
              мгновенно
            </Big>
          </Pop>
        </div>

        {/* robot */}
        <Robot3D size={900} appear={bounce(f, 4, 11, 120)} wave={ease(f, w(2), w(2) + 8) * (1 - ease(f, w(6), w(6) + 10))} style={{left: 90, top: 470}} />

        {/* instant reply bubble */}
        <div style={{position: 'absolute', right: 60, top: 470, transform: `scale(${bubble}) rotate(${(1 - bubble) * 10 + 3}deg)`, transformOrigin: '0% 100%'}}>
          <Card bg={C.lime} style={{padding: '18px 26px'}} radius={30}>
            <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 36}}>Ответ за 1 сек ⚡</div>
          </Card>
        </div>

        {/* "даже когда вы..." */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1310, textAlign: 'center', opacity: ease(f, w(3), w(3) + 8)}}>
          <Body size={44} weight={800} color={ink}>
            даже когда вы…
          </Body>
        </div>
        <div style={{position: 'absolute', left: 50, right: 50, top: 1400, display: 'flex', justifyContent: 'space-between'}}>
          {MOODS.map((m) => {
            const s = bounce(f, w(m.i) - 2, 9, 210);
            return (
              <div key={m.label} style={{transform: `scale(${s}) rotate(${m.rot + (1 - s) * 30}deg)`, opacity: Math.min(1, s * 3)}}>
                <Card bg={m.bg} style={{width: 300, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
                  <div style={{fontSize: 120, lineHeight: 1}}>{m.emoji}</div>
                  <Big size={m.label.length > 7 ? 34 : 44}>{m.label}</Big>
                </Card>
              </div>
            );
          })}
        </div>
      </Punch>
      <Grain />
    </AbsoluteFill>
  );
};
