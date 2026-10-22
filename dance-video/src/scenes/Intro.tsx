import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DiscoBall} from '../components/Objects3D';
import {Reveal, Rule, Sans, Serif, Stage, Wipe} from '../components/UI';
import {C, T, ease, silk, wf} from '../theme';

const S = 'intro' as const;

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s01', i, S);
  const drop = silk(f, 2, 16, 40);
  const big = silk(f, w(11) - 3, 12, 120);
  // light beams sweeping from the ball
  const beams = [0, 1, 2, 3, 4];

  return (
    <AbsoluteFill>
      <Stage offset={T.scenes.intro.from} intensity={ease(f, 0, 30)} />
      {beams.map((b) => {
        const ang = Math.sin(f / 40 + b * 1.3) * 28 + (b - 2) * 16;
        return (
          <div
            key={b}
            style={{
              position: 'absolute',
              left: 540 - 60,
              top: 330,
              width: 120,
              height: 1700,
              transformOrigin: '50% 0%',
              transform: `rotate(${ang}deg)`,
              background: `linear-gradient(to bottom, ${b % 2 ? 'rgba(232,194,122,0.22)' : 'rgba(200,16,46,0.18)'}, transparent 80%)`,
              clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)',
              opacity: drop * 0.9,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
      <DiscoBall size={700} drop={drop} style={{left: 190, top: -10}} />

      <div style={{position: 'absolute', top: 700, left: 60, right: 60, textAlign: 'center'}}>
        <Reveal at={w(0) - 3}>
          <Sans size={46} weight={500} spacing="0.32em" color={C.rose}>
            ОНЛАЙН-УРОКИ
          </Sans>
        </Reveal>
        <Wipe at={w(2) - 2} dur={18}>
          <Serif size={150} gold italic style={{marginTop: 6}}>
            по танцам
          </Serif>
        </Wipe>
        <Reveal at={w(4) - 3} style={{marginTop: 26}}>
          <Serif size={62} weight={700}>
            заслуживают
          </Serif>
          <Serif size={62} weight={700} italic color={C.gold}>
            современный сайт
          </Serif>
        </Reveal>
        <Reveal at={w(7) - 3} style={{marginTop: 18}}>
          <Sans size={38} color="rgba(255,244,230,0.8)">который работает на вас</Sans>
        </Reveal>
      </div>

      <div style={{position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.6 + big * 0.4})`, opacity: Math.min(1, big * 2)}}>
        <Rule at={w(11)} width={420} />
        <Serif size={230} gold style={{margin: '10px 0'}}>
          24/7
        </Serif>
        <Rule at={w(11) + 6} width={420} />
      </div>
    </AbsoluteFill>
  );
};
