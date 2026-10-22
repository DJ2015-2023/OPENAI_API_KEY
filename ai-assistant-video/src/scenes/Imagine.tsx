import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Core3D} from '../components/Core3D';
import {Camera, CyberBackground, LightLeak, Particles, Txt, WordReveal} from '../components/FX';
import {C, FONT, T, clamp, ease, pop, rel} from '../theme';

const ClockRing: React.FC<{p: number; size: number}> = ({p, size}) => {
  const ticks = 24;
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{position: 'absolute', overflow: 'visible'}}>
      <defs>
        <linearGradient id="ringG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={C.cyan} />
          <stop offset="1" stopColor={C.violet} />
        </linearGradient>
      </defs>
      <circle r="92" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        r="92"
        fill="none"
        stroke="url(#ringG)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${p * 578} 578`}
        transform="rotate(-90)"
        style={{filter: `drop-shadow(0 0 6px ${C.cyan})`}}
      />
      {new Array(ticks).fill(0).map((_, i) => {
        const on = i / ticks <= p;
        const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={Math.cos(a) * 80}
            y1={Math.sin(a) * 80}
            x2={Math.cos(a) * (i % 6 === 0 ? 70 : 75)}
            y2={Math.sin(a) * (i % 6 === 0 ? 70 : 75)}
            stroke={on ? C.cyan : 'rgba(255,255,255,0.15)'}
            strokeWidth={i % 6 === 0 ? 3 : 1.6}
          />
        );
      })}
      <circle cx={Math.cos(p * Math.PI * 2 - Math.PI / 2) * 92} cy={Math.sin(p * Math.PI * 2 - Math.PI / 2) * 92} r="6" fill="#fff" style={{filter: `drop-shadow(0 0 8px ${C.cyan})`}} />
    </svg>
  );
};

export const Imagine: React.FC = () => {
  const f = useCurrentFrame();
  const S = T.scenes.imagine;
  const i1 = rel('i1', 'imagine');
  const i2 = rel('i2', 'imagine');
  const i2d = T.phrases.i2.dur;
  const coreReveal = pop(f, i1 - 4, 11, 90);
  const ring = interpolate(f, [i2, i2 + i2d * 0.9], [0, 1], {...clamp});
  const big = pop(f, i2 + i2d * 0.18, 10, 160);
  const seven = pop(f, i2 + i2d * 0.62, 10, 160);

  return (
    <AbsoluteFill>
      <CyberBackground hue={C.violet} gridSpeed={1.2} />
      <Particles count={70} color={C.cyan} />
      <Camera dur={S.dur} zoom={[1.15, 1.0]} rotate={[2, -1]} tilt={[6, 0]}>
        {/* core */}
        <Core3D
          size={820}
          reveal={coreReveal}
          pulse={Math.max(0, 1 - Math.abs(f - (i2 + i2d * 0.18)) / 8)}
          style={{left: 540 - 410, top: 330 + (1 - coreReveal) * 60}}
        />
        {/* heading */}
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center'}}>
          <Txt
            size={50}
            weight={600}
            color={C.cyan}
            style={{letterSpacing: '0.32em', opacity: ease(f, i1, i1 + 10), transform: `translateY(${ease(f, i1, i1 + 14, 30, 0)}px)`}}
          >
            ПРЕДСТАВЬТЕ
          </Txt>
          <div
            style={{
              marginTop: 18,
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 100,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              background: `linear-gradient(90deg, ${C.white} 0%, ${C.cyan} 40%, ${C.violet} 70%, ${C.white} 100%)`,
              backgroundSize: '200% 100%',
              backgroundPosition: `${interpolate(f, [0, S.dur], [0, 100])}% 0`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              clipPath: `inset(0 ${100 - ease(f, i1 + 8, i1 + 26) * 100}% 0 0)`,
              filter: `drop-shadow(0 0 30px ${C.cyan}88)`,
            }}
          >
            ИИ-АССИСТЕНТА
          </div>
        </div>
        {/* 24/7 */}
        <div style={{position: 'absolute', left: 540 - 300, top: 1250, width: 600, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{opacity: ease(f, i2 - 4, i2 + 6), width: 600, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <ClockRing p={ring} size={520} />
            <div style={{display: 'flex', alignItems: 'baseline', fontFamily: FONT, fontWeight: 900, color: C.white, textShadow: `0 0 50px ${C.cyan}`}}>
              <span style={{fontSize: 210, transform: `scale(${big})`, display: 'inline-block'}}>24</span>
              <span style={{fontSize: 150, color: C.cyan, margin: '0 6px', opacity: big}}>/</span>
              <span style={{fontSize: 210, transform: `scale(${seven})`, display: 'inline-block'}}>7</span>
            </div>
          </div>
        </div>
      </Camera>
      <div style={{position: 'absolute', top: 1150, left: 40, right: 40}}>
        <WordReveal
          text="24 часа в сутки · 7 дней в неделю"
          start={i2 + Math.round(i2d * 0.15)}
          perWord={Math.max(2, Math.round((i2d * 0.7) / 9))}
          size={44}
          weight={600}
          color={'#cfd6ff'}
          highlight={{'24': C.cyan, '7': C.cyan}}
        />
      </div>
      <LightLeak start={2} dur={30} color={C.violet} />
    </AbsoluteFill>
  );
};
