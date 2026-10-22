import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Core3D} from '../components/Core3D';
import {Beam, Camera, CyberBackground, Particles, Shockwave, Txt} from '../components/FX';
import {CHANNELS} from '../components/Icons';
import {C, FONT, FPS, T, clamp, ease, pop, rel} from '../theme';

const CX = 540;
const CY = 900;

export const Channels: React.FC = () => {
  const f = useCurrentFrame();
  const S = T.scenes.channels;
  const c2 = rel('c2', 'channels');
  const hits = T.channelHits.map((h) => h - S.from);
  const unify = pop(f, c2, 14, 120);
  const t = f / FPS;

  return (
    <AbsoluteFill>
      <CyberBackground hue={C.cyan} gridSpeed={1.6} />
      <Particles count={60} color={C.violet} speed={1.4} />
      <Camera dur={S.dur} zoom={[1.0, 1.1]} rotate={[0, 3]} tilt={[-8, 4]}>
        {/* beams */}
        {CHANNELS.map((c, i) => {
          const orbitA = (i / 5) * Math.PI * 2 - Math.PI / 2 + t * 0.35 * (1 - unify);
          const r = interpolate(unify, [0, 1], [400, 360]);
          const x = CX + Math.cos(orbitA) * r;
          const y = CY + Math.sin(orbitA) * r * interpolate(unify, [0, 1], [0.75, 1]);
          const bp = interpolate(f, [hits[i] + 6, hits[i] + 16], [0, 1], clamp);
          return <Beam key={`b${i}`} x1={x} y1={y} x2={CX} y2={CY} p={bp} color={c.color} width={5 + unify * 3} />;
        })}

        <Core3D size={560} reveal={1} pulse={Math.max(0, 1 - Math.abs(f - c2) / 10)} spin={1.6} style={{left: CX - 280, top: CY - 280}} />

        {CHANNELS.map((c, i) => {
          const s = pop(f, hits[i], 11, 170);
          const orbitA = (i / 5) * Math.PI * 2 - Math.PI / 2 + t * 0.35 * (1 - unify);
          const r = interpolate(unify, [0, 1], [400, 360]);
          const x = CX + Math.cos(orbitA) * r;
          const y = CY + Math.sin(orbitA) * r * interpolate(unify, [0, 1], [0.75, 1]);
          const depth = 0.85 + 0.15 * Math.sin(orbitA);
          const fromX = (i % 2 === 0 ? -1 : 1) * 900;
          const {Icon} = c;
          return (
            <div
              key={c.name}
              style={{
                position: 'absolute',
                left: x - 75 + (1 - s) * fromX,
                top: y - 75 + (1 - s) * -400,
                transform: `scale(${s * depth}) rotate(${(1 - s) * 180}deg)`,
                opacity: Math.min(1, s * 2),
                zIndex: Math.round(depth * 10),
              }}
            >
              <Icon size={150} />
              <div
                style={{
                  position: 'absolute',
                  top: 162,
                  left: -60,
                  width: 270,
                  textAlign: 'center',
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 30,
                  color: C.white,
                  opacity: ease(f, hits[i] + 4, hits[i] + 12),
                  textShadow: `0 0 20px ${c.color}`,
                }}
              >
                {c.name}
              </div>
            </div>
          );
        })}
        <Shockwave at={c2} x={CX} y={CY} color={C.cyan} />
      </Camera>

      {/* title */}
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}>
        <Txt size={46} weight={600} color={C.dim} style={{letterSpacing: '0.25em', opacity: ease(f, 0, 12)}}>
          ВСЕ КАНАЛЫ
        </Txt>
        <Txt size={46} weight={600} color={C.dim} style={{letterSpacing: '0.25em', opacity: ease(f, 6, 18)}}>
          В ОДНОМ МЕСТЕ
        </Txt>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1450,
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `scale(${interpolate(unify, [0, 1], [1.8, 1])})`,
          opacity: interpolate(unify, [0, 0.3], [0, 1], clamp),
          filter: `blur(${(1 - Math.min(unify, 1)) * 12}px)`,
        }}
      >
        <Txt size={58} weight={600} color={C.cyan} style={{letterSpacing: '0.2em'}}>
          ЕДИНАЯ
        </Txt>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 140,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: C.white,
            textShadow: `0 0 40px ${C.cyan}, 0 0 90px ${C.violet}`,
          }}
        >
          СИСТЕМА
        </div>
      </div>
    </AbsoluteFill>
  );
};
