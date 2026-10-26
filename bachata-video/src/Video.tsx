import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FontGate, Grain, LightLeak, Vignette} from './components/FX';
import {Footage, sectionStarts} from './components/Footage';
import {Cta, Expect, Intro, NotJust, Outro, PriceSection, Schedule, Song, Tagline, Why} from './Sections';
import {FPS, H, SectionKey, T, W, clamp, pulse} from './theme';

const OVERLAYS: [SectionKey, React.FC][] = [
  ['intro', Intro],
  ['tagline', Tagline],
  ['notjust', NotJust],
  ['expect', Expect],
  ['song', Song],
  ['schedule', Schedule],
  ['price', PriceSection],
  ['why', Why],
  ['cta', Cta],
  ['outro', Outro],
];

/** Warm rose grade + legibility gradients over the footage. */
const Grade: React.FC = () => {
  const f = useCurrentFrame();
  const k = pulse(f);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'linear-gradient(160deg, rgba(255,120,150,0.10), rgba(90,10,40,0.12))', mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(8,2,5,0.35) 0%, transparent 18%, transparent 45%, rgba(8,2,5,0.78) 100%)'}} />
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${120 + 60 * k}px rgba(255,90,130,${0.08 * k})`}} />
    </AbsoluteFill>
  );
};

/** Light-leak burst across every section change. */
const Bursts: React.FC = () => {
  const f = useCurrentFrame();
  const starts = sectionStarts();
  let burst = 0;
  for (const s of starts) {
    const p = interpolate(f, [s.at - 9, s.at + 9], [0, 1], clamp);
    if (p > 0 && p < 1) burst = p;
  }
  return <LightLeak ambient={0.12} burst={burst} />;
};

export const Bachata: React.FC = () => (
  <FontGate>
    <AbsoluteFill style={{background: '#000'}}>
      <Footage />
      <Grade />
      {OVERLAYS.map(([key, Comp]) => {
        const s = T.sections[key];
        const dur = key === 'outro' ? T.total - s.from : s.dur;
        return (
          <Sequence key={key} from={s.from} durationInFrames={dur} name={`txt:${key}`}>
            <Comp />
          </Sequence>
        );
      })}
      <Bursts />
      <Vignette strength={0.55} />
      <Grain amount={0.06} />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  </FontGate>
);

export const Root: React.FC = () => <Composition id="Bachata" component={Bachata} durationInFrames={T.total} fps={FPS} width={W} height={H} />;
