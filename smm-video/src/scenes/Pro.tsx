import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Glass, Head, Liquid, Rise, Text} from '../components/UI';
import {C, FONT, GRAD, clamp, ease, springy, wf} from '../theme';

const S = 'pro' as const;
const POSTS = [
  ['#FF2E93', '#FF8A00', '📸'],
  ['#6A2CFF', '#21E6FF', '🎬'],
  ['#FFD84D', '#FF2E93', '✨'],
  ['#21E6FF', '#6A2CFF', '📈'],
  ['#FF8A00', '#FFD84D', '🛍️'],
  ['#FF2E93', '#6A2CFF', '💬'],
];

export const Pro: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s02', i, S);
  const card = springy(f, 2, 14, 120);
  const name = 'SMM-специалист';
  const typed = Math.floor(interpolate(f, [w(4) - 4, w(5) + 8], [0, name.length], clamp));
  const followed = f >= w(5) + 6;
  const tap = f >= w(5) + 3 && f < w(5) + 9 ? 0.9 : 1;
  const flash = interpolate(f, [w(3), w(3) + 2, w(3) + 8], [0, 0.8, 0], clamp);

  return (
    <AbsoluteFill>
      <Liquid hue={30} />
      <div style={{position: 'absolute', top: 130, left: 0, right: 0, textAlign: 'center'}}>
        <Rise at={w(0) - 3}>
          <Head size={70}>Именно этим занимается</Head>
        </Rise>
        <Rise at={w(3) - 3}>
          <Head size={70} grad style={{marginTop: 10}}>
            профессиональный
          </Head>
        </Rise>
      </div>

      <div style={{position: 'absolute', left: 70, right: 70, top: 470, transform: `translateY(${(1 - card) * 900}px) rotate(${(1 - card) * 6}deg)`}}>
        <Glass style={{padding: 44}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
            <div style={{position: 'relative', width: 210, height: 210}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from ${f * 4}deg, ${C.yellow}, ${C.orange}, ${C.pink}, ${C.violet}, ${C.yellow})`}} />
              <div style={{position: 'absolute', inset: 10, borderRadius: '50%', background: C.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 110}}>
                👨‍💻
              </div>
            </div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: FONT, fontWeight: 900, fontStyle: 'italic', fontSize: 58, color: C.white, minHeight: 70}}>
                {name.slice(0, typed)}
                {typed > 0 && typed < name.length && f % 14 < 7 ? '|' : ''}
                {typed >= name.length && (
                  <span style={{display: 'inline-flex', marginLeft: 12, width: 50, height: 50, borderRadius: 25, background: C.cyan, color: C.base, fontSize: 32, alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle'}}>✓</span>
                )}
              </div>
              <Text size={32} color="rgba(255,255,255,0.75)" style={{marginTop: 8}}>
                стратегия · контент · реклама
              </Text>
            </div>
          </div>
          <div
            style={{
              marginTop: 38,
              height: 110,
              borderRadius: 30,
              background: followed ? 'rgba(255,255,255,0.18)' : GRAD,
              border: followed ? `2px solid ${C.glassLine}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 44,
              color: C.white,
              transform: `scale(${tap})`,
            }}
          >
            {followed ? '✓ Вы подписаны' : 'Подписаться'}
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 38}}>
            {POSTS.map(([a, b, e], k) => {
              const s = springy(f, w(1) + k * 3, 12, 180);
              return (
                <div
                  key={k}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 22,
                    background: `linear-gradient(135deg, ${a}, ${b})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 90,
                    transform: `scale(${s})`,
                  }}
                >
                  {e}
                </div>
              );
            })}
          </div>
        </Glass>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <div style={{position: 'absolute', bottom: 110, left: 0, right: 0, textAlign: 'center', opacity: ease(f, w(5), w(5) + 8)}}>
        <Head size={64} grad>
          SMM-специалист
        </Head>
      </div>
    </AbsoluteFill>
  );
};
