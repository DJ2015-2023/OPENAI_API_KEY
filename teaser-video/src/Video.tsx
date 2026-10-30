import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FontGate, Grain, Vignette} from './components/FX';
import {FriendsScene, Intro, LipstickScene, MirrorScene, PartyScene, PhoneScene, PosterScene, Wrap} from './Scenes';
import {FPS, H, SceneKey, T, W, clamp} from './theme';

type Tr = 'whip' | 'zoom' | 'none';
const ORDER: [SceneKey, React.FC, Tr, Tr, number][] = [
  ['intro', Intro, 'none', 'zoom', 1],
  ['mirror', MirrorScene, 'zoom', 'whip', 1],
  ['lipstick', LipstickScene, 'whip', 'whip', 1],
  ['friends', FriendsScene, 'whip', 'whip', -1],
  ['phone', PhoneScene, 'whip', 'zoom', -1],
  ['party', PartyScene, 'zoom', 'zoom', 1],
  ['poster', PosterScene, 'zoom', 'none', 1],
];

/** Flash burst: white-hot at the drop, gold leak into the poster. */
const Burst: React.FC<{at: number; color: string; len?: number; peak?: number}> = ({at, color, len = 10, peak = 1}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + len], [0, peak, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #fff 0%, ${color} 40%, transparent 85%)`, mixBlendMode: 'screen', opacity: o}} />;
};

export const Teaser: React.FC = () => (
  <FontGate>
    <AbsoluteFill style={{background: '#000'}}>
      {ORDER.map(([key, Scene, enter, exit, dir]) => {
        const s = T.scenes[key];
        return (
          <Sequence key={key} from={s.from} durationInFrames={s.dur} name={key}>
            <Wrap dur={s.dur} enter={enter} exit={exit} dir={dir}>
              <Scene />
            </Wrap>
          </Sequence>
        );
      })}
      <Burst at={T.scenes.mirror.from} color="rgba(255,120,200,0.8)" len={8} peak={0.7} />
      <Burst at={T.drop} color="rgba(255,60,60,0.9)" len={12} />
      <Burst at={T.scenes.poster.from} color="rgba(231,194,125,0.9)" len={12} peak={0.9} />
      <Vignette strength={0.55} />
      <Grain amount={0.07} />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  </FontGate>
);

export const Root: React.FC = () => <Composition id="Teaser" component={Teaser} durationInFrames={T.total} fps={FPS} width={W} height={H} />;
