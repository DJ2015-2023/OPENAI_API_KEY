import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Heart3D} from '../components/Objects3D';
import {Caption, Glass, Head, Liquid, Reactions, Rise, Sparkle} from '../components/UI';
import {C, FONT, T, ease, springy, wf} from '../theme';

const S = 'hook' as const;

const CHIPS = [
  {i: 10, emoji: '👥', text: 'Новые клиенты'},
  {i: 12, emoji: '✨', text: 'Узнаваемость бренда'},
  {i: 16, emoji: '💸', text: 'Рост продаж'},
];

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s01', i, S);
  const beats = [w(10), w(13), w(16)];
  let beat = 0;
  for (const b of beats) if (f >= b && f < b + 10) beat = Math.max(beat, 1 - (f - b) / 10);

  return (
    <AbsoluteFill>
      <Liquid />
      <Reactions />
      <Heart3D size={760} appear={springy(f, 6, 11, 90)} beat={beat} style={{left: 160, top: 330}} />
      <div style={{position: 'absolute', top: 130, left: 0, right: 0, textAlign: 'center'}}>
        <Rise at={w(0) - 3}>
          <Head size={112} grad>
            Социальные
          </Head>
        </Rise>
        <Rise at={w(1) - 3}>
          <Head size={150}>сети</Head>
        </Rise>
      </div>
      <div style={{position: 'absolute', top: 1080, left: 60, right: 60}}>
        <Caption clip="s01" from={2} to={9} sceneFrom={T.scenes.hook.from} size={46} hl={[6]} />
      </div>
      <div style={{position: 'absolute', top: 1270, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 26}}>
        {CHIPS.map((c, k) => {
          const s = springy(f, w(c.i) - 3, 12, 170);
          return (
            <div key={c.text} style={{transform: `translateX(${(1 - s) * (k % 2 ? 900 : -900)}px)`, opacity: ease(f, w(c.i) - 3, w(c.i) + 4)}}>
              <Glass radius={999} style={{display: 'flex', alignItems: 'center', padding: '22px 34px', gap: 22}}>
                <span style={{fontSize: 64}}>{c.emoji}</span>
                <span style={{flex: 1, fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.white}}>{c.text}</span>
                <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: C.white, background: C.pink, padding: '8px 18px', borderRadius: 999}}>❤</span>
              </Glass>
            </div>
          );
        })}
      </div>
      {beats.map((b, k) => (
        <Sparkle key={k} at={b} x={[250, 860, 520][k]} y={[420, 520, 980][k]} size={80} />
      ))}
    </AbsoluteFill>
  );
};
