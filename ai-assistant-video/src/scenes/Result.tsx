import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Camera, CyberBackground, Flash, LightLeak, Particles, Shockwave} from '../components/FX';
import {C, FONT, T, clamp, ease, pop, rel} from '../theme';

const STATS = [
  {id: 'r2', a: 'Больше', b: 'клиентов', arrow: '↑', color: C.green},
  {id: 'r3', a: 'Меньше', b: 'рутины', arrow: '↓', color: C.cyan},
  {id: 'r4', a: 'Больше', b: 'прибыли', arrow: '↑', color: C.gold},
];

export const Result: React.FC = () => {
  const f = useCurrentFrame();
  const S = T.scenes.result;
  const r1 = rel('r1', 'result');
  const r2 = rel('r2', 'result');
  const slam = pop(f, r1, 9, 220);
  const lift = ease(f, r2 - 8, r2 + 8);
  const shake = (fr: number) => interpolate(fr, [r1, r1 + 4, r1 + 22], [0, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <CyberBackground hue={C.green} gridSpeed={2.4} />
      <Particles count={80} color={C.green} speed={2.2} />
      {/* rising chart bars in background */}
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 40, height: 700, display: 'flex', alignItems: 'flex-end', gap: 18, opacity: 0.22}}>
        {new Array(10).fill(0).map((_, i) => {
          const h = ease(f, r2 + i * 3, r2 + i * 3 + 30, 0, 120 + i * 55);
          return <div key={i} style={{flex: 1, height: h, borderRadius: 14, background: `linear-gradient(to top, ${C.green}, ${C.cyan})`}} />;
        })}
      </div>
      <Camera dur={S.dur} zoom={[1.0, 1.08]} rotate={[1, -1]} shake={shake}>
        {/* headline: НИ ОДНОГО ПРОПУЩЕННОГО ОБРАЩЕНИЯ */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: interpolate(lift, [0, 1], [560, 170]),
            textAlign: 'center',
            transform: `scale(${interpolate(slam, [0, 1], [3.2, 1]) * interpolate(lift, [0, 1], [1, 0.72])})`,
            opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
            filter: `blur(${Math.max(0, 1 - slam) * 20}px)`,
          }}
        >
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 64, color: C.green, letterSpacing: '0.18em', textShadow: `0 0 30px ${C.green}`}}>НИ ОДНОГО</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 118, color: C.white, letterSpacing: '-0.035em', lineHeight: 1.0, textShadow: `0 0 50px ${C.green}88`}}>
            ПРОПУЩЕННОГО
          </div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 118, color: C.white, letterSpacing: '-0.035em', lineHeight: 1.0, textShadow: `0 0 50px ${C.green}88`}}>
            ОБРАЩЕНИЯ!
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 34,
              padding: '14px 34px',
              borderRadius: 60,
              background: `${C.green}22`,
              border: `2px solid ${C.green}`,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 44,
              color: C.green,
              opacity: ease(f, r1 + 12, r1 + 20) * (1 - lift),
              transform: `scale(${pop(f, r1 + 12, 10, 200)})`,
            }}
          >
            ✓ 0 пропущенных
          </div>
        </div>

        {/* stats */}
        <div style={{position: 'absolute', left: 80, right: 80, top: 760}}>
          {STATS.map((s) => {
            const at = rel(s.id, 'result') - 3;
            const p = pop(f, at, 12, 170);
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 250,
                  marginBottom: 30,
                  padding: '0 50px',
                  borderRadius: 44,
                  background: `linear-gradient(110deg, ${s.color}30, rgba(12,16,36,0.9) 65%)`,
                  border: `2px solid ${s.color}aa`,
                  boxShadow: `0 0 60px ${s.color}44`,
                  transform: `perspective(1200px) translateY(${(1 - p) * 300}px) rotateX(${(1 - p) * 70}deg) scale(${0.8 + p * 0.2})`,
                  opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
                }}
              >
                <div>
                  <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 46, color: C.dim}}>{s.a}</div>
                  <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.white, letterSpacing: '-0.03em', lineHeight: 1}}>{s.b}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      fontSize: 120,
                      color: s.color,
                      lineHeight: 1,
                      textShadow: `0 0 40px ${s.color}`,
                      transform: `translateY(${Math.sin((f - at) / 6) * 6 * (s.arrow === '↑' ? -1 : 1)}px)`,
                    }}
                  >
                    {s.arrow}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Shockwave at={r1} x={540} y={760} color={C.green} />
      </Camera>
      <Flash at={r1} dur={8} />
      <LightLeak start={rel('r4', 'result')} dur={30} color={C.gold} />
    </AbsoluteFill>
  );
};
