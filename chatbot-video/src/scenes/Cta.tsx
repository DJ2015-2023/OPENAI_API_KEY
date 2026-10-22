import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Big, Body, Card, Confetti, Grain, Paper, Pop, Punch} from '../components/UI';
import {BODY, C, DISPLAY, T, bounce, clamp, ease, wf} from '../theme';

const S = 'cta' as const;
const MSG = 'Хочу чат-бота для бизнеса!';

export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.cta.dur;
  const v = (i: number) => wf('s10', i, S);
  const w = (i: number) => wf('s11', i, S);
  const typeStart = v(0);
  const sendAt = w(0);
  const typed = Math.floor(interpolate(f, [typeStart, sendAt - 6], [0, MSG.length], clamp));
  const sent = bounce(f, sendAt, 12, 180);
  const reply = bounce(f, w(4), 12, 180);
  const plane = interpolate(f, [sendAt, sendAt + 26], [0, 1], clamp);
  const pulse = 1 + Math.max(0, Math.sin((f - w(3)) / 4)) * 0.04 * (f > w(3) ? 1 : 0);

  return (
    <AbsoluteFill>
      <Paper color={C.orange} dots="#00000022" />
      <Punch dur={dur} hits={[v(1), sendAt, w(3), w(9)]} amount={0.03} drift={[1.02, 1.0]}>
        <div style={{position: 'absolute', top: 110, left: 60, right: 60}}>
          <Pop at={v(0) - 2} rot={-6}>
            <Big size={80} color={C.paper}>
              Хотите
            </Big>
          </Pop>
          <Pop at={v(1) - 2} rot={4}>
            <Big size={96} color={C.ink}>
              чат-бота?
            </Big>
          </Pop>
        </div>

        {/* DM screen */}
        <div style={{position: 'absolute', left: 120, right: 120, top: 420, transform: `rotate(-2deg) translateY(${(1 - bounce(f, 4, 13, 120)) * 1400}px)`}}>
          <Card bg={C.paper} radius={56} shadow={16} style={{height: 900, padding: 30, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 22, borderBottom: `4px solid ${C.ink}`}}>
              <div style={{width: 76, height: 76, borderRadius: 38, border: `4px solid ${C.ink}`, background: `linear-gradient(135deg, ${C.orange}, ${C.pink}, ${C.cobalt})`}} />
              <div>
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 32}}>Direct</div>
                <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 24, color: '#1BAA55'}}>● в сети</div>
              </div>
            </div>
            <div style={{flex: 1, position: 'relative'}}>
              {/* sent bubble */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 40,
                  transform: `scale(${sent})`,
                  transformOrigin: '100% 100%',
                  opacity: Math.min(1, sent * 3),
                }}
              >
                <div style={{background: C.cobalt, color: C.paper, fontFamily: BODY, fontWeight: 700, fontSize: 34, padding: '18px 26px', borderRadius: '30px 30px 6px 30px', border: `4px solid ${C.ink}`}}>
                  {MSG}
                </div>
              </div>
              {/* reply bubble */}
              <div style={{position: 'absolute', left: 0, top: 210, transform: `scale(${reply})`, transformOrigin: '0% 100%', opacity: Math.min(1, reply * 3)}}>
                <div style={{background: C.lime, fontFamily: BODY, fontWeight: 700, fontSize: 34, padding: '18px 26px', borderRadius: '30px 30px 30px 6px', border: `4px solid ${C.ink}`, maxWidth: 560}}>
                  Отлично! Обсудим задачу и подберём решение 🙌
                </div>
              </div>
            </div>
            {/* input */}
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{flex: 1, minHeight: 84, borderRadius: 42, border: `4px solid ${C.ink}`, padding: '20px 26px', fontFamily: BODY, fontWeight: 600, fontSize: 30, color: typed ? C.ink : C.grey}}>
                {f < sendAt ? (typed ? MSG.slice(0, typed) + (f % 16 < 8 ? '|' : '') : 'Сообщение…') : 'Сообщение…'}
              </div>
              <div style={{width: 84, height: 84, borderRadius: 42, background: C.cobalt, border: `4px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${f >= sendAt - 3 && f < sendAt + 4 ? 0.85 : 1})`}}>
                <svg width="40" height="40" viewBox="0 0 24 24">
                  <path d="M3 11.5 21 3l-6.5 18-3.2-7.3L3 11.5z" fill="#fff" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* flying paper plane */}
        {plane > 0 && plane < 1 && (
          <div style={{position: 'absolute', left: interpolate(plane, [0, 1], [820, 1200]), top: interpolate(plane, [0, 1], [1230, 200]) - Math.sin(plane * Math.PI) * 200, fontSize: 110, transform: `rotate(${-20 + plane * 30}deg)`}}>
            ✈️
          </div>
        )}

        {/* big CTA */}
        <div style={{position: 'absolute', left: 60, right: 60, top: 1380, textAlign: 'center', transform: `scale(${bounce(f, w(0) - 2, 9, 200) * pulse})`}}>
          <Card bg={C.ink} radius={40} shadow={0} style={{padding: '34px 30px', boxShadow: `0 0 0 6px ${C.paper}`}}>
            <Big size={60} color={C.paper}>
              Напишите мне
            </Big>
            <Big size={84} color={C.lime} style={{marginTop: 8}}>
              в Direct 📩
            </Big>
          </Card>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1720, textAlign: 'center', opacity: ease(f, w(4), w(4) + 10)}}>
          <Body size={38} weight={800} color={C.ink}>
            обсудим задачу и подберём решение
          </Body>
        </div>
        <Confetti at={w(9)} x={540} y={1450} n={60} />
      </Punch>
      <Grain />
    </AbsoluteFill>
  );
};
