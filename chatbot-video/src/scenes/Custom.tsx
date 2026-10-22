import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Robot3D} from '../components/Robot3D';
import {Big, Body, Card, Grain, Paper, Pop, Punch} from '../components/UI';
import {BODY, C, DISPLAY, FPS, T, bounce, clamp, ease, wf} from '../theme';

const S = 'custom' as const;

const INTEGRATIONS = [
  {emoji: '📇', label: 'CRM'},
  {emoji: '📅', label: 'Календарь'},
  {emoji: '💳', label: 'Оплата'},
  {emoji: '📊', label: 'Таблицы'},
  {emoji: '🌐', label: 'Сайт'},
];

export const Custom: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.custom.dur;
  const w = (i: number) => wf('s09', i, S);
  const knob = interpolate(f, [w(6), w(7) + 6, w(9), w(11) + 6], [0.04, 0.12, 0.12, 0.96], clamp);
  const upgrade = ease(f, w(9), w(11) + 6);
  const robotScale = interpolate(upgrade, [0, 1], [0.62, 0.92]);
  const t = f / FPS;

  return (
    <AbsoluteFill>
      <Paper color={upgrade > 0.5 ? '#EEF7D2' : C.cream} />
      <Punch dur={dur} hits={[w(0), w(9), w(13)]} amount={0.03} drift={[1.0, 1.04]}>
        <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center'}}>
          <Pop at={w(0) - 2} rot={-10}>
            <div style={{fontSize: 110, lineHeight: 1}}>💎</div>
          </Pop>
          <Pop at={w(1) - 2}>
            <Big size={78} style={{marginTop: 14}}>
              Индивидуально
            </Big>
          </Pop>
          <div style={{opacity: ease(f, w(2), w(2) + 8), marginTop: 12}}>
            <Body size={44} weight={700}>
              под ваш бизнес
            </Body>
          </div>
        </div>

        {/* robot levels up */}
        <Robot3D size={860} appear={robotScale * bounce(f, 2, 12, 120)} upgrade={upgrade} wave={ease(f, w(11), w(11) + 8)} style={{left: 110, top: 470}} />

        {/* integrations orbiting in */}
        {INTEGRATIONS.map((it, k) => {
          const s = bounce(f, w(13) - 4 + k * 4, 10, 190);
          const a = (k / INTEGRATIONS.length) * Math.PI * 2 - Math.PI / 2 + t * 0.6;
          const x = 540 + Math.cos(a) * 330;
          const y = 900 + Math.sin(a) * 330;
          return (
            <div key={it.label} style={{position: 'absolute', left: x - 95, top: y - 60, transform: `scale(${s})`, opacity: Math.min(1, s * 3)}}>
              <Card bg={C.paper} radius={24} shadow={7} style={{padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10}}>
                <span style={{fontSize: 48}}>{it.emoji}</span>
                <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 30}}>{it.label}</span>
              </Card>
            </div>
          );
        })}

        {/* slider: simple automation -> AI assistant */}
        <div style={{position: 'absolute', left: 70, right: 70, top: 1440, opacity: ease(f, w(5), w(5) + 8)}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
            <Body size={34} weight={800} color={knob < 0.5 ? C.ink : C.grey}>
              Простая
              <br />
              автоматизация
            </Body>
            <Body size={34} weight={800} color={knob > 0.5 ? C.ink : C.grey} style={{textAlign: 'right'}}>
              AI-ассистент
              <br />с интеграциями
            </Body>
          </div>
          <div style={{position: 'relative', height: 70, borderRadius: 35, background: C.paper, border: `5px solid ${C.ink}`, boxShadow: `8px 8px 0 ${C.ink}`}}>
            <div style={{position: 'absolute', left: 6, top: 6, bottom: 6, width: `calc(${knob * 100}% - 12px)`, borderRadius: 30, background: `linear-gradient(90deg, ${C.sky}, ${C.lime})`}} />
            <div
              style={{
                position: 'absolute',
                top: -18,
                left: `calc(${knob * 100}% - 48px)`,
                width: 96,
                height: 96,
                borderRadius: 48,
                background: C.orange,
                border: `5px solid ${C.ink}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 30,
                color: C.paper,
              }}
            >
              {knob > 0.5 ? 'AI' : '1.0'}
            </div>
          </div>
        </div>
      </Punch>
      <Grain />
    </AbsoluteFill>
  );
};
