import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Glass, Head, Liquid, Text} from '../components/UI';
import {C, FONT, H, clamp, ease, springy, wf} from '../theme';

const S = 'services' as const;

const ITEMS = [
  {i: 2, emoji: '🧭', title: 'Стратегия', sub: 'продвижения', a: '#6A2CFF', b: '#21E6FF'},
  {i: 6, emoji: '🎨', title: 'Визуальный', sub: 'стиль', a: '#FF2E93', b: '#FF8A00'},
  {i: 9, emoji: '✍️', title: 'Продающий', sub: 'контент', a: '#FF8A00', b: '#FFD84D'},
  {i: 11, emoji: '🪪', title: 'Оформление', sub: 'профилей', a: '#21E6FF', b: '#6A2CFF'},
  {i: 14, emoji: '🎯', title: 'Реклама', sub: 'кампании', a: '#FF2E93', b: '#6A2CFF'},
  {i: 17, emoji: '📊', title: 'Аналитика', sub: 'результатов', a: '#FFD84D', b: '#FF2E93'},
];
const CW = 600;
const CH = 860;

export const Services: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s03', i, S);
  const keys: number[] = [];
  const vals: number[] = [];
  ITEMS.forEach((it, k) => {
    keys.push(w(it.i) - 8, w(it.i) + 4);
    vals.push(Math.max(0, k - 1), k);
  });
  // continuous carousel position (0..5) — glides to each card as it is named
  const pos = interpolate(f, keys, vals, {...clamp, easing: Easing.inOut(Easing.cubic)});
  const enter = springy(f, 0, 14, 110);
  const growth = springy(f, w(20) - 3, 11, 160);
  const exitUp = ease(f, w(23) + 18, w(23) + 34, 0, 1, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill>
      <Liquid hue={-25} speed={1.4} />
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', opacity: ease(f, 0, 10)}}>
        <Text size={40} weight={800} color="rgba(255,255,255,0.8)" style={{letterSpacing: '0.2em'}}>
          ЧТО Я ДЕЛАЮ
        </Text>
        <Head size={90} grad style={{marginTop: 8}}>
          {String(Math.min(6, Math.floor(pos + 1.5))).padStart(2, '0')} / 06
        </Head>
      </div>
      <AbsoluteFill style={{perspective: 1800, transform: `translateY(${(1 - enter) * H}px)`}}>
        {ITEMS.map((it, k) => {
          const d = k - pos;
          const x = 540 + d * 560;
          const rot = Math.max(-55, Math.min(55, -d * 38));
          const sc = 1 - Math.min(1, Math.abs(d)) * 0.22;
          const shown = ease(f, w(it.i) - 10, w(it.i) - 2);
          if (Math.abs(d) > 2.2) return null;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: x - CW / 2,
                top: 380,
                width: CW,
                height: CH,
                transform: `rotateY(${rot}deg) scale(${sc})`,
                zIndex: 10 - Math.round(Math.abs(d) * 3),
                opacity: 0.35 + 0.65 * shown,
                filter: `brightness(${1 - Math.min(1, Math.abs(d)) * 0.35})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 48,
                  background: `linear-gradient(160deg, ${it.a}, ${it.b})`,
                  border: '3px solid rgba(255,255,255,0.55)',
                  boxShadow: '0 40px 90px rgba(20,0,60,0.55)',
                  overflow: 'hidden',
                }}
              >
                {/* story chrome */}
                <div style={{position: 'absolute', top: 26, left: 26, right: 26, display: 'flex', gap: 8}}>
                  {ITEMS.map((_, j) => (
                    <div key={j} style={{flex: 1, height: 6, borderRadius: 3, background: j <= k ? '#fff' : 'rgba(255,255,255,0.35)'}} />
                  ))}
                </div>
                <div style={{position: 'absolute', top: 56, left: 26, display: 'flex', alignItems: 'center', gap: 14}}>
                  <div style={{width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30}}>👨‍💻</div>
                  <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff'}}>smm.pro</span>
                </div>
                <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontSize: 230, transform: `rotate(${Math.sin(f / 12 + k) * 6}deg)`}}>{it.emoji}</div>
                <div style={{position: 'absolute', bottom: 70, left: 40, right: 40}}>
                  <div style={{fontFamily: FONT, fontStyle: 'italic', fontWeight: 900, fontSize: 58, color: '#fff', textTransform: 'uppercase', lineHeight: 1}}>{it.title}</div>
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, color: 'rgba(255,255,255,0.9)', marginTop: 8}}>{it.sub}</div>
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      {/* growth banner */}
      <div style={{position: 'absolute', left: 90, right: 90, top: 1350, transform: `scale(${growth}) translateY(${-exitUp * 300}px)`, opacity: growth}}>
        <Glass radius={999} style={{padding: '26px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
          <span style={{fontSize: 70}}>📈</span>
          <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.white}}>постоянный рост бизнеса</span>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};
