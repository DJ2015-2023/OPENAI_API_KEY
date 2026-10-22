import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Globe} from '../components/Objects3D';
import {Couple, Reveal, Rule, Sans, Serif, Stage} from '../components/UI';
import {C, T, clamp, ease, silk, wf} from '../theme';

const S = 'styles' as const;
const NAMES = [
  {i: 3, name: 'Бачата'},
  {i: 4, name: 'Сальса'},
  {i: 5, name: 'Кизомба'},
  {i: 6, name: 'Танго'},
  {i: 7, name: 'Хип-хоп'},
  {i: 9, name: 'и другие…'},
];

export const Styles: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s02', i, S);
  const partA = 1 - ease(f, w(13) - 6, w(13) + 4);
  const partB = ease(f, w(13) - 4, w(13) + 6) * (1 - ease(f, w(23) - 6, w(23) + 4));
  const partC = ease(f, w(23) - 4, w(23) + 8);
  // continuous drum index
  const keys: number[] = [];
  const vals: number[] = [];
  NAMES.forEach((n, k) => {
    keys.push(w(n.i) - 6, w(n.i) + 2);
    vals.push(k - 1, k);
  });
  const idx = interpolate(f, keys, vals, {...clamp, easing: Easing.inOut(Easing.cubic)});

  return (
    <AbsoluteFill>
      <Stage offset={T.scenes.styles.from} intensity={0.8 + partC * 0.2} spot="50% 55%" />

      {/* A: the dance styles drum */}
      <AbsoluteFill style={{opacity: partA}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', opacity: 0.12}}>
          <Couple size={900} color={C.gold} />
        </div>
        <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center'}}>
          <Reveal at={w(0) - 3}>
            <Sans size={44} color={C.rose} spacing="0.18em">
              ЕСЛИ ВЫ ПРЕПОДАВАТЕЛЬ
            </Sans>
          </Reveal>
          <Rule at={w(1)} width={300} style={{marginTop: 22}} />
        </div>
        <div style={{position: 'absolute', top: 760, left: 0, right: 0, height: 420, perspective: 1200}}>
          {NAMES.map((n, k) => {
            const d = k - idx;
            if (Math.abs(d) > 1.4) return null;
            return (
              <div
                key={n.name}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 120 + d * 260,
                  textAlign: 'center',
                  transform: `rotateX(${-d * 55}deg) scale(${1 - Math.abs(d) * 0.35})`,
                  opacity: 1 - Math.min(1, Math.abs(d)) * 0.75,
                }}
              >
                <Serif size={k === 5 ? 110 : 168} gold italic>
                  {n.name}
                </Serif>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* B: next level */}
      <AbsoluteFill style={{opacity: partB}}>
        <div style={{position: 'absolute', top: 520, left: 70, right: 70, textAlign: 'center'}}>
          <Reveal at={w(13) - 3}>
            <Serif size={78} weight={700}>
              профессиональный сайт
            </Serif>
          </Reveal>
          <Reveal at={w(16) - 3} style={{marginTop: 24}}>
            <Sans size={44} color="rgba(255,244,230,0.85)">выведет ваши занятия</Sans>
          </Reveal>
          <Reveal at={w(20) - 3} style={{marginTop: 30}}>
            <Serif size={130} gold italic>
              на новый
            </Serif>
            <Serif size={130} gold italic>
              уровень
            </Serif>
          </Reveal>
          {/* rising stairs */}
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginTop: 50, height: 260}}>
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} style={{width: 110, height: ease(f, w(20) + k * 3, w(20) + k * 3 + 14) * (60 + k * 48), background: `linear-gradient(to top, ${C.burgundy}, ${C.gold})`, borderRadius: '10px 10px 0 0', opacity: 0.85}} />
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* C: students from anywhere */}
      <AbsoluteFill style={{opacity: partC}}>
        <Globe size={900} appear={silk(f, w(23) - 4, 16, 70)} pins={ease(f, w(24), w(29) + 10)} style={{left: 90, top: 330}} />
        <div style={{position: 'absolute', top: 170, left: 60, right: 60, textAlign: 'center'}}>
          <Reveal at={w(23) - 2}>
            <Sans size={46} color={C.rose} spacing="0.14em">
              ПРИВЛЕЧЁТ УЧЕНИКОВ
            </Sans>
          </Reveal>
        </div>
        <div style={{position: 'absolute', top: 1310, left: 60, right: 60, textAlign: 'center'}}>
          <Reveal at={w(26) - 3}>
            <Serif size={96} gold italic>
              из любого города
            </Serif>
          </Reveal>
          <Reveal at={w(28) - 3}>
            <Serif size={96} weight={700}>
              и страны
            </Serif>
          </Reveal>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
