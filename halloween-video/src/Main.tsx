import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {FontFaces, Subtitle, Whip, clamp} from './lib';
import {Intro, SceneAlone, SceneGang, SceneLips, ScenePoster, SceneParty, SceneWitch} from './scenes';
import {FPS, INTRO, S1, S2, S3, S4, S5, S6, SUBS} from './timeline';

const Subs: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const s = SUBS.find((x) => t >= x.t0 - 0.1 && t <= x.t1);
  if (!s) return null;
  const o = Math.min(interpolate(t, [s.t0 - 0.1, s.t0 + 0.15], [0, 1], clamp), interpolate(t, [s.t1 - 0.2, s.t1], [1, 0], clamp));
  return <Subtitle text={s.text} opacity={o} />;
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <FontFaces />
    <Sequence from={INTRO.from} durationInFrames={INTRO.dur}>
      <Whip dur={INTRO.dur} noIn>
        <Intro />
      </Whip>
    </Sequence>
    <Sequence from={S1.from} durationInFrames={S1.dur}>
      <Whip dur={S1.dur}>
        <SceneWitch />
      </Whip>
    </Sequence>
    <Sequence from={S2.from} durationInFrames={S2.dur}>
      <Whip dur={S2.dur} dir={-1}>
        <SceneLips />
      </Whip>
    </Sequence>
    <Sequence from={S3.from} durationInFrames={S3.dur}>
      <Whip dur={S3.dur}>
        <SceneGang />
      </Whip>
    </Sequence>
    <Sequence from={S4.from} durationInFrames={S4.dur}>
      <Whip dur={S4.dur} dir={-1} noOut>
        <SceneAlone />
      </Whip>
    </Sequence>
    <Sequence from={S5.from} durationInFrames={S5.dur}>
      <Whip dur={S5.dur} noIn>
        <SceneParty />
      </Whip>
    </Sequence>
    <Sequence from={S6.from} durationInFrames={S6.dur}>
      <Whip dur={S6.dur} dir={-1} noOut>
        <ScenePoster />
      </Whip>
    </Sequence>
    <Subs />
  </AbsoluteFill>
);
