import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FontGate, Grain, Vignette} from './components/FX';
import {Await, Final, Forget, Home, Hook, Info, Logo, NightScene, Tickets, Tr, Wrap} from './Scenes';
import {FPS, H, SceneKey, T, W, clamp} from './theme';

const ORDER: [SceneKey, React.FC, Tr, Tr, number][] = [
  ['hook', Hook, 'none', 'zoom', 1],
  ['logo', Logo, 'zoom', 'whip', 1],
  ['night', NightScene, 'whip', 'whip', 1],
  ['forget', Forget, 'whip', 'zoom', -1],
  ['await', Await, 'zoom', 'whip', 1],
  ['home', Home, 'whip', 'zoom', -1],
  ['tickets', Tickets, 'zoom', 'whip', 1],
  ['info', Info, 'whip', 'none', -1],
  ['final', Final, 'zoom', 'none', 1],
];

/** Flash burst: white-hot on the drop, gold leak into the poster. */
const Burst: React.FC<{at: number; color: string; len?: number; peak?: number}> = ({at, color, len = 10, peak = 1}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + len], [0, peak, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #fff 0%, ${color} 40%, transparent 85%)`, mixBlendMode: 'screen', opacity: o}} />;
};

export const Promo: React.FC = () => (
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
      {T.hits.map((h) => (
        <Burst key={h} at={h} color="rgba(255,60,60,0.6)" len={6} peak={0.35} />
      ))}
      <Burst at={T.scenes.await.from} color="rgba(255,190,90,0.9)" len={10} peak={0.8} />
      <Burst at={T.scenes.tickets.from} color="rgba(255,60,60,0.8)" len={8} peak={0.6} />
      <Burst at={T.drop} color="rgba(231,194,125,0.95)" len={14} />
      <Vignette strength={0.5} />
      <Grain amount={0.06} />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  </FontGate>
);

export const Root: React.FC = () => <Composition id="Promo" component={Promo} durationInFrames={T.total} fps={FPS} width={W} height={H} />;
