import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Rocket3D} from '../components/Objects3D';
import {Glass, Head, Liquid, Reactions, Rise, Sparkle, Text} from '../components/UI';
import {C, FONT, GRAD, clamp, ease, rand, springy, wf} from '../theme';

const S = 'cta' as const;

export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s06', i, S);
  const launch = interpolate(f, [w(8), w(8) + 110], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const shake = interpolate(f, [w(8) - 20, w(8), w(8) + 60], [0, 1, 0.4], clamp);
  const phaseA = 1 - ease(f, w(8) - 6, w(8) + 6); // headline phase fades as rocket goes
  const big = springy(f, w(21) - 3, 9, 170);
  const results = springy(f, w(27) - 3, 11, 170);
  const pulse = 1 + Math.max(0, Math.sin(f / 6)) * 0.04;

  return (
    <AbsoluteFill>
      <Liquid hue={-40} speed={1.6} />
      <Reactions count={20} set={['🚀', '❤️', '🔥', '⭐']} rate={1.4} />

      {/* phase A: call */}
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', opacity: phaseA}}>
        <Rise at={w(0) - 3}>
          <Head size={96}>Свяжитесь</Head>
          <Head size={96}>со мной</Head>
        </Rise>
        <Rise at={w(3) - 3}>
          <Head size={120} grad style={{marginTop: 12}}>
            сегодня
          </Head>
        </Rise>
      </div>

      {/* rocket launch with smoke */}
      {new Array(16).fill(0).map((_, i) => {
        const t0 = w(8) - 6 + i * 3;
        const p = interpolate(f, [t0, t0 + 50], [0, 1], clamp);
        if (p <= 0 || p >= 1) return null;
        const dir = rand(i) - 0.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540 + dir * 700 * p - 90,
              top: 1500 + p * 120 - 90,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.75), rgba(255,255,255,0) 70%)',
              transform: `scale(${0.6 + p * 1.8})`,
              opacity: 1 - p,
            }}
          />
        );
      })}
      <Rocket3D size={620} lift={launch} shake={shake} style={{left: 230, top: 700}} />

      {/* phase B: presence */}
      <div style={{position: 'absolute', top: 300, left: 60, right: 60, textAlign: 'center', opacity: ease(f, w(9) - 4, w(9) + 4) * (1 - ease(f, w(20), w(21)))}}>
        <Text size={48} weight={800}>вместе мы создадим</Text>
        <Head size={92} grad style={{marginTop: 12}}>
          сильное присутствие
        </Head>
        <Text size={48} weight={800} style={{marginTop: 12}}>
          в социальных сетях
        </Text>
      </div>

      {/* phase C: 24/7 + real results */}
      <div style={{position: 'absolute', top: 240, left: 0, right: 0, textAlign: 'center', transform: `scale(${big})`, opacity: Math.min(1, big * 2)}}>
        <Text size={44} weight={800}>работает на вас</Text>
        <div style={{fontFamily: FONT, fontStyle: 'italic', fontWeight: 900, fontSize: 300, lineHeight: 1, color: 'transparent', background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', filter: 'drop-shadow(0 12px 30px rgba(20,0,60,0.5))'}}>
          24/7
        </div>
      </div>
      <div style={{position: 'absolute', top: 760, left: 90, right: 90, transform: `scale(${results})`, opacity: results}}>
        <Glass style={{padding: '30px 36px', textAlign: 'center'}}>
          <Head size={66}>реальные</Head>
          <Head size={66} grad>
            результаты
          </Head>
          <div style={{display: 'flex', justifyContent: 'center', gap: 22, marginTop: 20}}>
            {['✓', '✓', '✓'].map((c, k) => (
              <div key={k} style={{width: 80, height: 80, borderRadius: 40, background: C.cyan, color: C.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 900, transform: `scale(${springy(f, w(28) + k * 4, 9, 220)})`}}>
                {c}
              </div>
            ))}
          </div>
        </Glass>
      </div>
      {[0, 1, 2, 3, 4].map((k) => (
        <Sparkle key={k} at={w(24) + k * 4} x={[160, 920, 260, 840, 540][k]} y={[300, 340, 620, 640, 180][k]} size={90} />
      ))}

      {/* persistent CTA button */}
      <div style={{position: 'absolute', left: 90, right: 90, bottom: 120, transform: `scale(${springy(f, w(0), 12, 160) * pulse})`}}>
        <div
          style={{
            height: 150,
            borderRadius: 999,
            background: GRAD,
            boxShadow: '0 30px 70px rgba(255,46,147,0.45), inset 0 3px 0 rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            fontFamily: FONT,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 58,
            color: C.white,
            textTransform: 'uppercase',
          }}
        >
          📩 Написать мне
        </div>
      </div>
    </AbsoluteFill>
  );
};
