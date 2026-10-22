import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Big, Body, Card, Grain, Marker, Paper, Punch, SlotLine} from '../components/UI';
import {BODY, C, T, bounce, clamp, ease, wf} from '../theme';

const S = 'question' as const;

export const Question: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.question.dur;
  const w = (i: number) => wf('s02', i, S);
  // "hours since sent" keeps climbing — nobody answered
  const hours = Math.floor(interpolate(f, [10, dur], [1, 9], clamp));
  const lostFrom = w(4);
  const lost = Math.max(0, Math.min(10, Math.floor((f - lostFrom) / 6)));

  return (
    <AbsoluteFill>
      <Paper />
      <Punch dur={dur} hits={[w(0), w(3), w(9)]} amount={0.035} drift={[1.02, 1.08]}>
        {/* unanswered customer message */}
        <div style={{position: 'absolute', left: 90, right: 90, top: 150, transform: `translateY(${(1 - bounce(f, 2)) * -300}px) rotate(-2deg)`}}>
          <Card style={{padding: '30px 36px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{width: 84, height: 84, borderRadius: 42, background: C.pink, border: `4px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46}}>
                🙋‍♀️
              </div>
              <div style={{flex: 1}}>
                <Body size={34} weight={800}>Клиент</Body>
                <Body size={30} weight={600} color={C.grey}>
                  Здравствуйте! Сколько стоит?
                </Body>
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22}}>
              <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 28, color: C.orange}}>⏱ без ответа {hours} ч</div>
              <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 28, color: C.grey}}>✓ доставлено</div>
            </div>
          </Card>
        </div>

        {/* headline */}
        <div style={{position: 'absolute', left: 80, right: 60, top: 560}}>
          <SlotLine at={w(0) - 3}>
            <Big size={118}>Сколько</Big>
          </SlotLine>
          <SlotLine at={w(1) - 3}>
            <Big size={118} color={C.cobalt}>
              клиентов
            </Big>
          </SlotLine>
          <SlotLine at={w(2) - 3}>
            <Big size={118}>
              вы{' '}
              <Marker at={w(3)} color={C.orange}>
                <span style={{color: C.paper}}>теряете?</span>
              </Marker>
            </Big>
          </SlotLine>
          <div style={{marginTop: 30, opacity: ease(f, w(4), w(4) + 8), transform: `translateX(${ease(f, w(4), w(4) + 12, 40, 0)}px)`}}>
            <Body size={46} weight={700}>
              …пока не успеваете ответить на&nbsp;сообщение
            </Body>
          </div>
        </div>

        {/* customers walking away */}
        <div style={{position: 'absolute', left: 70, right: 70, top: 1390, display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'center'}}>
          {new Array(10).fill(0).map((_, i) => {
            const gone = i < lost;
            const g = ease(f, lostFrom + i * 6, lostFrom + i * 6 + 10);
            return (
              <div
                key={i}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  border: `5px solid ${C.ink}`,
                  background: gone ? '#E4DED2' : [C.lime, C.sky, C.pink, C.orange][i % 4],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 76,
                  transform: `translateY(${g * 40}px) rotate(${g * (i % 2 ? 18 : -18)}deg) scale(${1 - g * 0.15})`,
                  opacity: 1 - g * 0.55,
                  filter: `grayscale(${g})`,
                  boxShadow: `6px 6px 0 ${C.ink}`,
                }}
              >
                {gone ? '😞' : '🙂'}
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 80,
            top: 1300,
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: 54,
            color: C.orange,
            opacity: lost > 0 ? 1 : 0,
            transform: `scale(${1 + (lost > 0 ? Math.exp(-((f - lostFrom) % 6) / 2) * 0.15 : 0)})`,
          }}
        >
          −{lost} {lost === 1 ? 'клиент' : lost < 5 ? 'клиента' : 'клиентов'}
        </div>
      </Punch>
      <Grain />
    </AbsoluteFill>
  );
};
