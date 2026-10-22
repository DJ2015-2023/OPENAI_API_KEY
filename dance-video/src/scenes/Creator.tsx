import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Laptop, Site, THEMES} from '../components/Site';
import {Reveal, Sans, Serif, Stage} from '../components/UI';
import {C, SANS, T, ease, silk, wf} from '../theme';

const S = 'creator' as const;
const ICONS = [
  ['🎬', 'Видео'],
  ['💳', 'Оплата'],
  ['📅', 'Запись'],
  ['👤', 'Кабинет'],
];

export const Creator: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s03', i, S);
  const open = silk(f, 4, 16, 70);
  // design swaps through palettes on "индивидуальным дизайном"
  const swapStart = w(8);
  const ti = f < swapStart ? 0 : Math.min(THEMES.length - 1, Math.floor((f - swapStart) / 7) % THEMES.length);
  const th = THEMES[f > w(10) ? 0 : ti];
  const swatchP = ease(f, w(8) - 4, w(8) + 6) * (1 - ease(f, w(10) + 6, w(10) + 14));

  return (
    <AbsoluteFill>
      <Stage offset={T.scenes.creator.from} intensity={0.55} spot="50% 45%" />
      <div style={{position: 'absolute', top: 170, left: 60, right: 60, textAlign: 'center'}}>
        <Reveal at={w(0) - 3}>
          <Sans size={44} color={C.rose} spacing="0.22em">
            Я СОЗДАЮ
          </Sans>
        </Reveal>
        <Reveal at={w(2) - 3} style={{marginTop: 10}}>
          <Serif size={92} gold italic>
            современные сайты
          </Serif>
        </Reveal>
        <Reveal at={w(4) - 3} style={{marginTop: 8}}>
          <Serif size={56} weight={700}>
            для преподавателей танцев
          </Serif>
        </Reveal>
      </div>

      <Laptop w={900} style={{left: 90, top: 640, transform: `perspective(1600px) rotateX(${(1 - open) * 70}deg) translateY(${(1 - open) * 200}px)`, transformOrigin: '50% 100%'}}>
        <Site w={876} h={516} th={th} page="home" at={8} />
      </Laptop>

      {/* palette swatches */}
      <div style={{position: 'absolute', top: 1270, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26, opacity: swatchP, transform: `translateY(${(1 - swatchP) * 40}px)`}}>
        {THEMES.map((t, k) => (
          <div key={k} style={{width: 90, height: 90, borderRadius: 45, background: `conic-gradient(${t.bg} 0 50%, ${t.accent} 50% 100%)`, border: `4px solid ${k === ti ? C.gold : 'rgba(255,255,255,0.3)'}`, transform: `scale(${k === ti ? 1.2 : 1})`}} />
        ))}
      </div>
      <div style={{position: 'absolute', top: 1270, left: 0, right: 0, textAlign: 'center', opacity: ease(f, w(10) + 6, w(10) + 14) * (1 - ease(f, w(11) - 4, w(11) + 4))}}>
        <Serif size={60} italic gold>
          индивидуальный дизайн
        </Serif>
      </div>

      <div style={{position: 'absolute', top: 1400, left: 60, right: 60, textAlign: 'center'}}>
        <Reveal at={w(11) - 3}>
          <Sans size={40} color="rgba(255,244,230,0.85)">всё для успешного онлайн-обучения</Sans>
        </Reveal>
        <div style={{display: 'flex', justifyContent: 'center', gap: 30, marginTop: 36}}>
          {ICONS.map(([e, l], k) => {
            const s = silk(f, w(12) + k * 5, 12, 160);
            return (
              <div key={l} style={{width: 190, padding: '22px 0', borderRadius: 28, border: `2px solid ${C.gold}66`, background: 'rgba(58,7,24,0.65)', transform: `scale(${s})`, opacity: Math.min(1, s * 2)}}>
                <div style={{fontSize: 64}}>{e}</div>
                <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 30, color: C.cream, marginTop: 6}}>{l}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
