import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, interpolateColors, staticFile, useCurrentFrame, Easing} from 'remotion';
import {Bokeh, BLOOD, GOLD, GOLD_DEEP, Grain, Handheld, Particles, Smoke, Vignette, clamp} from './lib';
import {Person} from './figures';
import {BEAT_FRAMES} from './timeline';

const GoldGrad: React.FC<{id: string}> = ({id}) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#fff1c4" />
    <stop offset=".35" stopColor={GOLD} />
    <stop offset=".7" stopColor={GOLD_DEEP} />
    <stop offset="1" stopColor="#ffe3a0" />
  </linearGradient>
);

// ───────────────────────── INTRO: the user's logo clip, fitted to 9:16
export const Intro: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{filter: 'blur(45px) brightness(.45) saturate(1.3)', transform: 'scale(1.3)'}}>
      <OffthreadVideo src={staticFile('intro.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'center'}}>
      <OffthreadVideo src={staticFile('intro.mp4')} muted style={{width: 1080, height: 958, objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(#000 0, transparent 22%, transparent 78%, #000 100%)', opacity: 0.6}} />
  </AbsoluteFill>
);

// ───────────────────────── S1: witch costume at the mirror, warm light turning crimson
export const SceneWitch: React.FC = () => {
  const f = useCurrentFrame();
  const light = interpolateColors(f, [0, 30, 66], ['#ffb35c', '#ff7a3a', '#d0122e']);
  const hatY = interpolate(f, [6, 44], [-90, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const hatRot = interpolate(f, [6, 44], [-8, -3], clamp);
  const zoom = interpolate(f, [0, 72], [1.0, 1.1]);
  return (
    <AbsoluteFill style={{background: '#0a0507', transform: `scale(${zoom})`}}>
      <AbsoluteFill style={{background: `radial-gradient(55% 40% at 50% 42%, ${light}66, transparent 70%)`}} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <GoldGrad id="g1" />
          <radialGradient id="mirrorIn" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor={light} stopOpacity=".55" />
            <stop offset=".6" stopColor="#1c0b10" />
            <stop offset="1" stopColor="#060305" />
          </radialGradient>
          <radialGradient id="skin" cx="50%" cy="30%" r="70%">
            <stop offset="0" stopColor="#f6d6c0" />
            <stop offset=".7" stopColor={light} stopOpacity=".9" />
            <stop offset="1" stopColor="#3a1414" />
          </radialGradient>
          <clipPath id="mclip">
            <ellipse cx={540} cy={820} rx={320} ry={460} />
          </clipPath>
        </defs>
        {/* vanity bulbs */}
        {new Array(14).fill(0).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const x = 540 + Math.cos(a) * 395;
          const y = 820 + Math.sin(a) * 540;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={40} fill={light} opacity={0.18} />
              <circle cx={x} cy={y} r={15} fill="#fff4dc" opacity={0.95} />
            </g>
          );
        })}
        {/* reflection */}
        <ellipse cx={540} cy={820} rx={320} ry={460} fill="url(#mirrorIn)" />
        <g clipPath="url(#mclip)">
          {/* hair + shoulders */}
          <path d="M400 760 C370 950 360 1100 330 1280 L750 1280 C720 1100 710 950 680 760 Z" fill="#120609" />
          <path d="M300 1300 C330 1150 420 1110 540 1105 C660 1110 750 1150 780 1300 Z" fill="#1a080d" />
          <path d="M455 1150 Q540 1240 625 1150" stroke={GOLD} strokeWidth={4} fill="none" opacity={0.8} />
          <circle cx={540} cy={1198} r={9} fill={BLOOD} stroke={GOLD} strokeWidth={3} />
          {/* face */}
          <rect x={515} y={1000} width={50} height={110} rx={20} fill="url(#skin)" />
          <ellipse cx={540} cy={905} rx={98} ry={128} fill="url(#skin)" />
          <path d="M488 890 q22 10 42 0 M552 890 q22 10 42 0" stroke="#2a0c10" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M486 868 q24 -12 46 -2 M550 866 q24 -10 46 2" stroke="#2a0c10" strokeWidth={5} fill="none" />
          <path d="M512 975 Q540 960 568 975 Q540 995 512 975 Z" fill="#a0101f" />
          {/* hands on the brim */}
          <ellipse cx={392} cy={790 + hatY} rx={34} ry={46} fill="url(#skin)" />
          <ellipse cx={688} cy={790 + hatY} rx={34} ry={46} fill="url(#skin)" />
          {/* the witch hat */}
          <g transform={`translate(0 ${hatY}) rotate(${hatRot} 540 790)`}>
            <ellipse cx={540} cy={800} rx={250} ry={46} fill="#0c0508" stroke={GOLD} strokeOpacity={0.5} strokeWidth={3} />
            <path d="M420 795 C440 660 480 520 610 420 C560 540 600 660 660 795 Z" fill="#0c0508" stroke={GOLD} strokeOpacity={0.4} strokeWidth={3} />
            <path d="M428 770 Q540 735 652 770 L656 795 Q540 760 424 795 Z" fill={BLOOD} />
            <circle cx={600} cy={768} r={16} fill="#8a0a1a" stroke="#ff4060" strokeWidth={2} />
          </g>
        </g>
        {/* mirror glass sheen */}
        <ellipse cx={540} cy={820} rx={320} ry={460} fill="url(#mirrorIn)" opacity={0.15} />
        <path d={`M300 ${600 - f} L420 ${520 - f} L300 ${1100 - f} Z`} fill="#fff" opacity={0.05} />
        {/* gold frame + crest */}
        <ellipse cx={540} cy={820} rx={338} ry={478} fill="none" stroke="url(#g1)" strokeWidth={34} />
        <ellipse cx={540} cy={820} rx={360} ry={500} fill="none" stroke="url(#g1)" strokeWidth={5} opacity={0.8} />
        <path d="M440 330 Q540 230 640 330 Q600 300 540 310 Q480 300 440 330 Z" fill="url(#g1)" />
        <circle cx={540} cy={282} r={18} fill={BLOOD} stroke="url(#g1)" strokeWidth={6} />
        {/* blurred foreground shoulder (shallow depth of field) */}
      </svg>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', filter: 'blur(14px)'}}>
        <path d="M-80 1920 C-60 1650 80 1520 260 1500 C420 1520 520 1650 560 1920 Z" fill="#050203" />
        <ellipse cx={240} cy={1440} rx={110} ry={130} fill="#070304" />
      </svg>
      <Smoke color={light} opacity={0.16} seed="s1" y={1400} />
      <Particles count={45} seed="p1" color={GOLD} size={5} speed={0.8} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

// ───────────────────────── S2: red lipstick close-up → vampire masquerade reveal
const UPPER = 'M330 1080 C380 1030 450 1000 505 1030 Q540 1045 575 1030 C630 1000 700 1030 750 1080 C700 1095 620 1100 540 1098 C460 1100 380 1095 330 1080 Z';
const LOWER = 'M330 1080 C380 1095 460 1100 540 1098 C620 1100 700 1095 750 1080 C710 1160 630 1195 540 1195 C450 1195 370 1160 330 1080 Z';

export const SceneLips: React.FC = () => {
  const f = useCurrentFrame();
  const swipe = interpolate(f, [4, 32], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const tubeX = 290 + swipe * 500;
  const tubeOut = interpolate(f, [32, 40], [0, -1800], clamp);
  const zoom = interpolate(f, [0, 34, 52], [1.45, 1.4, 1.0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const camY = interpolate(f, [0, 34, 52], [-260, -260, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const maskY = interpolate(f, [36, 50], [-700, 0], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const part = interpolate(f, [52, 60], [0, 1], clamp);
  const eyes = interpolate(f, [50, 58], [0, 1], clamp);
  const glint = interpolate(f, [58, 62, 68], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(70% 50% at 50% 45%, #5a0612, #160105 70%, #050002)'}}>
      <AbsoluteFill style={{transform: `translateY(${camY}px) scale(${zoom})`, transformOrigin: '50% 58%'}}>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
          <defs>
            <GoldGrad id="g2" />
            <radialGradient id="face2" cx="45%" cy="40%" r="65%">
              <stop offset="0" stopColor="#f3dfd6" />
              <stop offset=".6" stopColor="#c99a92" />
              <stop offset="1" stopColor="#3a0d14" />
            </radialGradient>
            <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e3102d" />
              <stop offset="1" stopColor="#7d0014" />
            </linearGradient>
            <clipPath id="swipe">
              <rect x={0} y={0} width={290 + swipe * 520} height={1920} />
            </clipPath>
          </defs>
          {/* hair framing */}
          <path d="M200 400 C120 900 140 1400 220 1920 L860 1920 C940 1400 960 900 880 400 Q540 200 200 400 Z" fill="#0c0306" />
          {/* face */}
          <ellipse cx={540} cy={860} rx={300} ry={420} fill="url(#face2)" />
          <path d="M420 1270 Q540 1330 660 1270 L640 1500 L440 1500 Z" fill="#c99a92" opacity={0.85} />
          {/* nose shadow */}
          <path d="M520 930 Q540 990 510 1000 Q540 1015 570 1000" stroke="#8a5550" strokeWidth={6} fill="none" opacity={0.6} />
          {/* eyes behind mask */}
          <g opacity={eyes}>
            <ellipse cx={430} cy={760} rx={42} ry={20} fill="#1a0004" />
            <ellipse cx={650} cy={760} rx={42} ry={20} fill="#1a0004" />
            <circle cx={430} cy={760} r={13} fill="#ff1e3c" />
            <circle cx={650} cy={760} r={13} fill="#ff1e3c" />
            <circle cx={430} cy={760} r={28} fill="#ff1e3c" opacity={0.25} />
            <circle cx={650} cy={760} r={28} fill="#ff1e3c" opacity={0.25} />
          </g>
          {/* lips: natural, then red as the lipstick passes */}
          <g transform={`translate(0 ${part * 6})`}>
            <path d={LOWER} fill="#b47a76" />
            <path d={LOWER} fill="url(#red)" clipPath="url(#swipe)" />
          </g>
          {/* teeth + fangs when lips part */}
          <g opacity={part}>
            <path d="M440 1098 Q540 1112 640 1098 L640 1104 Q540 1120 440 1104 Z" fill="#f4eee6" />
            <path d="M470 1100 L482 1140 L494 1102 Z M586 1102 L598 1140 L610 1100 Z" fill="#fffaf2" />
            <circle cx={598} cy={1132} r={20 * glint} fill="#fff" opacity={0.8} />
          </g>
          <g transform={`translate(0 ${-part * 6})`}>
            <path d={UPPER} fill="#a96e6b" />
            <path d={UPPER} fill="url(#red)" clipPath="url(#swipe)" />
            <path d="M420 1060 Q470 1040 510 1050" stroke="#fff" strokeOpacity={0.35 * swipe} strokeWidth={6} fill="none" strokeLinecap="round" />
          </g>
          <path d="M610 1150 Q650 1145 680 1130" stroke="#fff" strokeOpacity={0.4 * swipe} strokeWidth={7} fill="none" strokeLinecap="round" />
          {/* lipstick tube */}
          <g transform={`translate(${tubeX} ${1060 + tubeOut}) rotate(-28)`}>
            <path d="M-26 -10 L26 -10 L26 -90 Q0 -130 -26 -70 Z" fill="#d10e2c" />
            <rect x={-30} y={-12} width={60} height={70} fill="url(#g2)" />
            <rect x={-34} y={58} width={68} height={190} rx={6} fill="#120408" stroke="url(#g2)" strokeWidth={6} />
          </g>
          {/* masquerade mask */}
          <g transform={`translate(0 ${maskY})`}>
            <path
              d="M300 760 C320 680 420 660 540 720 C660 660 760 680 780 760 C770 830 700 850 650 830 C600 815 570 800 540 820 C510 800 480 815 430 830 C380 850 310 830 300 760 Z M380 760 C400 790 470 790 480 760 C470 735 400 735 380 760 Z M600 760 C610 790 680 790 700 760 C680 735 610 735 600 760 Z"
              fill="#0b0508"
              fillRule="evenodd"
              stroke="url(#g2)"
              strokeWidth={8}
            />
            <path d="M320 740 C380 700 450 700 520 735 M560 735 C630 700 700 700 760 740" stroke="url(#g2)" strokeWidth={4} fill="none" strokeDasharray="10 8" />
            <path d="M780 740 C860 640 880 520 840 420 C900 520 900 640 790 760 Z" fill="#14050a" stroke={BLOOD} strokeWidth={4} />
            <path d="M790 735 C880 620 940 560 960 470" stroke={BLOOD} strokeWidth={6} fill="none" />
            <circle cx={540} cy={735} r={16} fill={BLOOD} stroke="url(#g2)" strokeWidth={5} />
          </g>
        </svg>
      </AbsoluteFill>
      <Particles count={35} seed="p2" color="#ff3355" size={4} speed={0.6} />
      <Particles count={25} seed="p2b" color={GOLD} size={4} speed={0.5} />
      <Vignette strength={0.9} />
      <Grain />
    </AbsoluteFill>
  );
};

// ───────────────────────── S3: the gang gathers to go out
const GANG: {kind: React.ComponentProps<typeof Person>['kind']; x: number; s: number; phase: number}[] = [
  {kind: 'cat', x: 150, s: 0.95, phase: 0.2},
  {kind: 'vampire', x: 345, s: 1.06, phase: 1.1},
  {kind: 'witch', x: 540, s: 1.02, phase: 2.3},
  {kind: 'skull', x: 735, s: 1.08, phase: 0.7},
  {kind: 'devil', x: 930, s: 0.96, phase: 1.8},
];

export const SceneGang: React.FC = () => {
  const f = useCurrentFrame();
  const walk = interpolate(f, [0, 72], [0.92, 1.08]);
  const pan = interpolate(f, [0, 72], [40, -40]);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#12040c, #2a0712 55%, #0a0204)'}}>
      {/* glowing doorway / street behind */}
      <AbsoluteFill style={{background: 'radial-gradient(30% 22% at 50% 40%, rgba(255,170,90,.55), transparent 70%)'}} />
      <Bokeh seed="b3" colors={['#ffb35c', '#ff5a3a', '#e9c27a', '#c4102a']} count={22} top={300} bottom={1100} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute'}}>
        {/* string lights */}
        <path d="M-20 420 Q540 600 1100 420" stroke="#2a1a10" strokeWidth={3} fill="none" />
        {new Array(16).fill(0).map((_, i) => {
          const t = i / 15;
          const x = -20 + t * 1120;
          const y = 420 + Math.sin(t * Math.PI) * 135;
          return <circle key={i} cx={x} cy={y + 14} r={9} fill={i % 3 === 0 ? '#ff7a2a' : '#ffd9a0'} opacity={0.6 + 0.4 * Math.abs(Math.sin(f / 6 + i))} />;
        })}
      </svg>
      <AbsoluteFill style={{transform: `translateX(${pan}px) scale(${walk})`, transformOrigin: '50% 90%'}}>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
          {/* floor glow */}
          <ellipse cx={540} cy={1690} rx={620} ry={80} fill="#ff6a3a" opacity={0.12} />
          {GANG.map((p, i) => {
            const bob = Math.abs(Math.sin(f / 4.5 + p.phase)) * 14;
            const tilt = Math.sin(f / 5 + p.phase) * 7;
            const armUp = i === 2 ? interpolate(f, [24, 36], [0, 1], clamp) : i === 4 ? interpolate(f, [40, 50], [0, 0.7], clamp) : 0;
            return (
              <g key={i} transform={`translate(${p.x} ${1690 - bob}) scale(${p.s * 1.25})`}>
                <Person kind={p.kind} headTilt={tilt} armUp={armUp} skirt={Math.sin(f / 6 + p.phase) * 0.4} rim={i % 2 ? 'rgba(255,90,70,.75)' : 'rgba(233,194,122,.8)'} />
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
      <Smoke color="#ff9a6a" opacity={0.14} seed="s3" y={1500} />
      <Particles count={40} seed="p3" color={GOLD} size={5} speed={1.2} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

// ───────────────────────── S4: rendered with HyperFrames
export const SceneAlone: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile('scene4.mp4')} muted />
  </AbsoluteFill>
);

// ───────────────────────── S5: the party — drop, beams, orbit, couples
const Couple: React.FC<{f: number; phase: number; rim: string}> = ({f, phase, rim}) => {
  const beat = (f + phase * 7) / BEAT_FRAMES;
  const sway = Math.sin(beat * Math.PI) * 14; // bachata side-to-side
  const turn = Math.cos((f + phase * 30) / (BEAT_FRAMES * 4) * Math.PI); // slow partner turn
  return (
    <g transform={`translate(${sway} 0) scale(${0.75 + 0.25 * Math.abs(turn)} 1)`}>
      <g transform={`translate(${-60 * turn} 0)`}>
        <Person kind="lead" rim={rim} headTilt={-6 * turn} />
      </g>
      <g transform={`translate(${60 * turn} 8)`}>
        <Person kind="follow" fill="#12040a" rim="rgba(255,60,80,.8)" headTilt={8 * turn} skirt={Math.sin(beat * Math.PI) * 0.8} />
      </g>
    </g>
  );
};

const WORDS: {t: number; text: string}[] = [
  {t: 14, text: 'НОЧЬ'},
  {t: 30, text: 'МУЗЫКИ'},
  {t: 60, text: 'ТАНЦЕВ'},
  {t: 86, text: 'ЭМОЦИЙ!'},
];

export const SceneParty: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 8], [1, 0], clamp);
  const beatPhase = (f % BEAT_FRAMES) / BEAT_FRAMES;
  const pulse = Math.pow(1 - beatPhase, 4);
  const orbit = Math.sin(f / 26) * 12;
  const punch = interpolate(f, [0, 6], [1.25, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const layer = (depth: number) => `translateX(${orbit * depth * -9}px)`;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(80% 50% at 50% 30%, #4a0610, #120104 65%, #040001)'}}>
      <Handheld amp={9}>
        <AbsoluteFill style={{perspective: 1400, transform: `scale(${punch})`}}>
          <AbsoluteFill style={{transform: `rotateY(${orbit}deg)`, transformStyle: 'preserve-3d'}}>
            {/* light beams */}
            <AbsoluteFill style={{mixBlendMode: 'screen', transform: layer(0.3)}}>
              {new Array(8).fill(0).map((_, i) => {
                const ang = Math.sin(f / (14 + i * 2) + i) * 32 + (i - 3.5) * 9;
                const col = i % 2 ? 'rgba(255,40,60,' : 'rgba(255,200,110,';
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 80 + i * 130,
                      top: -40,
                      width: 160,
                      height: 1700,
                      transformOrigin: '50% 0',
                      transform: `rotate(${ang}deg)`,
                      background: `linear-gradient(${col}${0.55 + pulse * 0.35}), ${col}0))`,
                      clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)',
                      filter: 'blur(6px)',
                    }}
                  />
                );
              })}
            </AbsoluteFill>
            {/* rig lights */}
            <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', transform: layer(0.3)}}>
              {new Array(8).fill(0).map((_, i) => (
                <circle key={i} cx={145 + i * 130} cy={-20} r={30} fill={i % 2 ? '#ff2840' : '#ffd08a'} opacity={0.6 + pulse * 0.4} />
              ))}
            </svg>
            <Smoke color="#ff3a4a" opacity={0.28} seed="s5" y={900} />
            {/* back crowd */}
            <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', transform: layer(0.6), filter: 'blur(3px)'}}>
              {new Array(16).fill(0).map((_, i) => {
                const bob = Math.abs(Math.sin((f / BEAT_FRAMES) * Math.PI + i)) * 18;
                const arm = f > 10 && i % 4 === 1;
                return (
                  <g key={i} transform={`translate(${-20 + i * 75} ${1330 - bob + (i % 3) * 25}) scale(0.62)`}>
                    <Person kind={i % 3 === 0 ? 'follow' : 'lead'} fill="#0c0306" rim="rgba(255,80,80,.35)" armUp={arm ? 1 : 0} />
                  </g>
                );
              })}
            </svg>
            {/* mid couples */}
            <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', transform: layer(1)}}>
              <g transform="translate(200 1520) scale(0.85)">
                <Couple f={f} phase={1} rim="rgba(233,194,122,.7)" />
              </g>
              <g transform="translate(880 1540) scale(0.88)">
                <Couple f={f} phase={2.5} rim="rgba(233,194,122,.7)" />
              </g>
            </svg>
            {/* hero couple, foreground */}
            <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', transform: layer(1.8)}}>
              <ellipse cx={540} cy={1880} rx={360} ry={50} fill="#ff2840" opacity={0.18 + pulse * 0.15} />
              <g transform="translate(540 1900) scale(1.45)">
                <Couple f={f} phase={0} rim="rgba(255,215,140,.95)" />
              </g>
            </svg>
          </AbsoluteFill>
        </AbsoluteFill>
        <Particles count={70} seed="p5" color={GOLD} size={6} speed={2.2} />
        <Particles count={30} seed="p5r" color="#ff3355" size={5} speed={1.6} />
      </Handheld>
      {/* kinetic words */}
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 230}}>
        {WORDS.map((w, i) => {
          const p = interpolate(f, [w.t, w.t + 5], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
          return (
            <div
              key={i}
              style={{
                fontFamily: 'Playfair',
                fontWeight: 900,
                fontSize: i === 3 ? 150 : 120,
                lineHeight: 1.05,
                letterSpacing: 4,
                opacity: p,
                transform: `scale(${0.6 + p * 0.4}) translateY(${(1 - p) * 40}px)`,
                background: i === 3 ? 'linear-gradient(#ff8a9a, #e0102a 60%, #8a0014)' : `linear-gradient(#fff1c4, ${GOLD} 50%, ${GOLD_DEEP})`,
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                filter: `drop-shadow(0 0 ${18 + pulse * 20}px rgba(255,${i === 3 ? 40 : 170},${i === 3 ? 60 : 80},.75)) drop-shadow(0 6px 0 rgba(0,0,0,.6))`,
              }}
            >
              {w.text}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.9 + pulse * 0.05}} />
      <Vignette strength={0.8} />
      <Grain />
    </AbsoluteFill>
  );
};

// ───────────────────────── S6: poster reveal
export const ScenePoster: React.FC = () => {
  const f = useCurrentFrame();
  const rev = interpolate(f, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const push = interpolate(f, [0, 135], [1.0, 1.06]);
  const sweep = interpolate(f, [20, 50], [-600, 1700], clamp);
  const cta = interpolate(f, [40, 50], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
  const info = interpolate(f, [8, 22], [0, 1], clamp);
  // poster is 1122x1402 → 1000x1250 on canvas
  const pw = 1000;
  const ph = 1250;
  const top = 300;
  return (
    <AbsoluteFill style={{background: '#050103'}}>
      <AbsoluteFill style={{filter: 'blur(50px) brightness(.4) saturate(1.4)', transform: 'scale(1.4)'}}>
        <Img src={staticFile('poster.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(60% 45% at 50% 45%, rgba(196,16,42,.35), transparent 70%)'}} />
      <div
        style={{
          position: 'absolute',
          left: (1080 - pw) / 2,
          top,
          width: pw,
          height: ph,
          transform: `scale(${(1.12 - rev * 0.12) * push})`,
          opacity: rev,
          filter: rev < 1 ? `blur(${(1 - rev) * 20}px)` : undefined,
          boxShadow: '0 0 0 3px rgba(233,194,122,.85), 0 0 60px rgba(196,16,42,.6), 0 30px 80px rgba(0,0,0,.9)',
          overflow: 'hidden',
          borderRadius: 6,
        }}
      >
        <Img src={staticFile('poster.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div
          style={{
            position: 'absolute',
            top: -300,
            left: sweep,
            width: 180,
            height: 2000,
            transform: 'rotate(20deg)',
            background: 'linear-gradient(90deg, transparent, rgba(255,240,200,.45), transparent)',
            mixBlendMode: 'screen',
          }}
        />
      </div>
      {/* CTA above the poster */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Playfair',
          fontWeight: 900,
          fontSize: 92,
          letterSpacing: 3,
          opacity: cta,
          transform: `scale(${0.7 + cta * 0.3})`,
          background: `linear-gradient(#fff1c4, ${GOLD} 50%, ${GOLD_DEEP})`,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 0 22px rgba(255,170,80,.6)) drop-shadow(0 5px 0 rgba(0,0,0,.7))',
        }}
      >
        СОБИРАЙ ДРУЗЕЙ!
      </div>
      {/* event line below the poster */}
      <div
        style={{
          position: 'absolute',
          top: top + ph + 70,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Oswald',
          fontWeight: 600,
          fontSize: 58,
          letterSpacing: 4,
          color: '#fff6e6',
          opacity: info,
          textShadow: '0 0 20px rgba(196,16,42,.9), 0 3px 8px #000',
        }}
      >
        31 ОКТЯБРЯ <span style={{color: GOLD}}>·</span> 23:30 <span style={{color: GOLD}}>·</span> TEMPLE BAR
      </div>
      <Particles count={60} seed="p6" color={GOLD} size={5} speed={0.9} />
      <Particles count={20} seed="p6r" color="#ff3355" size={4} speed={0.7} />
      <Vignette strength={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};
