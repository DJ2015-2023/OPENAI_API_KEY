import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Glass, Head, Liquid, Rise, Sparkle, Text} from '../components/UI';
import {C, FONT, GRAD, clamp, ease, rand, springy, wf} from '../theme';

const S = 'system' as const;
const POST_COLORS = ['#FF2E93', '#FF8A00', '#FFD84D', '#21E6FF', '#6A2CFF', '#FF2E93', '#FF8A00', '#21E6FF', '#6A2CFF'];
const POST_EMO = ['🌸', '☕', '👗', '🍰', '💄', '🏋️', '📷', '🎧', '🌿'];

const KPIS = [
  {i: 13, emoji: '👁', label: 'Охваты', fill: 0.86, color: C.cyan},
  {i: 14, emoji: '💬', label: 'Вовлечённость', fill: 0.78, color: C.pink},
  {i: 17, emoji: '📩', label: 'Заявки', fill: 0.7, color: C.orange},
  {i: 20, emoji: '🛡️', label: 'Доверие к бренду', fill: 0.92, color: C.yellow},
];

const Spark: React.FC<{p: number; color: string; seed: number}> = ({p, color, seed}) => {
  const pts = new Array(12).fill(0).map((_, k) => {
    const x = (k / 11) * 220;
    const y = 70 - (k / 11) * 55 - rand(seed + k) * 14;
    return `${x},${y}`;
  });
  return (
    <svg width={220} height={80} viewBox="0 0 220 80">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
    </svg>
  );
};

export const System: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s05', i, S);
  const postsIn = springy(f, w(4) - 4, 12, 150);
  // posts collapse into a strip on "полноценную систему"
  const collapse = ease(f, w(7) - 4, w(8) + 8, 0, 1, Easing.inOut(Easing.cubic));
  const dash = springy(f, w(8), 13, 120);

  return (
    <AbsoluteFill>
      <Liquid hue={60} />
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center'}}>
        <Rise at={w(2) - 3}>
          <Text size={46} weight={800}>
            не просто <span style={{textDecoration: f > w(6) ? 'line-through' : 'none', textDecorationColor: C.pink, textDecorationThickness: 6}}>красивые публикации</span>
          </Text>
        </Rise>
        <Rise at={w(7) - 3}>
          <Head size={96} grad style={{marginTop: 14}}>
            а систему
          </Head>
          <Head size={70} style={{marginTop: 4}}>
            продвижения
          </Head>
        </Rise>
      </div>

      {/* 3x3 posts grid -> strip */}
      {POST_COLORS.map((c, k) => {
        const gx = 90 + (k % 3) * 310;
        const gy = 520 + Math.floor(k / 3) * 310;
        const sx = 75 + k * 104;
        const sy = 520;
        const x = interpolate(collapse, [0, 1], [gx, sx]);
        const y = interpolate(collapse, [0, 1], [gy, sy]);
        const size = interpolate(collapse, [0, 1], [290, 92]);
        const s = Math.min(1, postsIn * 1.2 - k * 0.04);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: interpolate(collapse, [0, 1], [30, 20]),
              background: `linear-gradient(135deg, ${c}, ${POST_COLORS[(k + 3) % 9]})`,
              border: '3px solid rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.45,
              transform: `scale(${Math.max(0, s)}) rotate(${(1 - collapse) * (k % 2 ? 2 : -2)}deg)`,
              boxShadow: '0 20px 50px rgba(20,0,60,0.4)',
            }}
          >
            {POST_EMO[k]}
          </div>
        );
      })}

      {/* dashboard */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 680, transform: `translateY(${(1 - dash) * 1300}px)`}}>
        <Glass style={{padding: '34px 40px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
            <Text size={38} weight={800}>📊 Результаты</Text>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 28, color: C.base, background: GRAD, padding: '8px 20px', borderRadius: 999}}>LIVE</div>
          </div>
          {KPIS.map((k, j) => {
            const p = ease(f, w(k.i) - 4, w(k.i) + 26, 0, 1, Easing.out(Easing.cubic));
            const on = f >= w(k.i) - 4;
            return (
              <div key={k.label} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '22px 0', borderTop: j ? '2px solid rgba(255,255,255,0.18)' : 'none', opacity: on ? 1 : 0.35}}>
                <div style={{fontSize: 62, width: 80, textAlign: 'center'}}>{k.emoji}</div>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white}}>{k.label}</span>
                    <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 44, color: k.color, transform: `translateY(${Math.sin(f / 5) * 4 * p}px)`, display: 'inline-block'}}>↑</span>
                  </div>
                  <div style={{marginTop: 12, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.18)', overflow: 'hidden'}}>
                    <div style={{width: `${p * k.fill * 100}%`, height: '100%', borderRadius: 11, background: `linear-gradient(90deg, ${k.color}88, ${k.color})`}} />
                  </div>
                </div>
                <Spark p={p} color={k.color} seed={j * 10} />
              </div>
            );
          })}
        </Glass>
      </div>
      {KPIS.map((k, j) => (
        <Sparkle key={j} at={w(k.i)} x={940} y={870 + j * 190} size={70} color={k.color} />
      ))}
    </AbsoluteFill>
  );
};
