import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FontGate} from './components/UI';
import {Cta} from './scenes/Cta';
import {Custom} from './scenes/Custom';
import {Features} from './scenes/Features';
import {Industries} from './scenes/Industries';
import {Instant} from './scenes/Instant';
import {Mission} from './scenes/Mission';
import {Platforms} from './scenes/Platforms';
import {Question} from './scenes/Question';
import {C, FPS, H, SceneKey, T, W, clamp} from './theme';

const OVER = 14;
type Kind = 'iris' | 'stripes' | 'cube' | 'push' | 'none';

const Wrap: React.FC<{dur: number; enter: Kind; exit: Kind; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.cubic);
  const pin = interpolate(f, [0, OVER], [0, 1], {...clamp, easing: e});
  const pout = interpolate(f, [dur - OVER, dur], [0, 1], {...clamp, easing: e});
  const style: React.CSSProperties = {};
  const tr: string[] = [];
  if (enter === 'iris' && pin < 1) style.clipPath = `circle(${pin * 120}% at 50% 45%)`;
  if (enter === 'cube' && pin < 1) {
    style.transformOrigin = '0% 50%';
    tr.push(`translateX(${(1 - pin) * W}px) rotateY(${(1 - pin) * 90}deg)`);
  }
  if (enter === 'push' && pin < 1) tr.push(`translateY(${(1 - pin) * H}px)`);
  if (exit === 'cube' && pout > 0) {
    style.transformOrigin = '100% 50%';
    tr.push(`translateX(${-pout * W}px) rotateY(${-pout * 90}deg)`);
    style.filter = `brightness(${1 - pout * 0.4})`;
  }
  if (exit === 'push' && pout > 0) tr.push(`translateY(${-pout * H * 0.6}px) scale(${1 - pout * 0.15})`);
  if (exit === 'iris' && pout > 0) tr.push(`scale(${1 + pout * 0.25})`);
  if (tr.length) style.transform = tr.join(' ');
  return (
    <AbsoluteFill style={{perspective: 1800}}>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Three diagonal colour bars sweeping across; fully covering the frame at `at`. */
export const Stripes: React.FC<{at: number; colors?: string[]; span?: number}> = ({at, colors = [C.orange, C.cobalt, C.lime], span = 9}) => {
  const f = useCurrentFrame();
  if (f < at - span - 6 || f > at + span + 6) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {colors.map((c, i) => {
        const d = (i - 1) * 2;
        const x = interpolate(f, [at - span + d, at + d, at + span + d], [-3200, 0, 3200], {...clamp, easing: Easing.inOut(Easing.quad)});
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: W / 2 - 1500 + i * 1000 + x,
              top: -600,
              width: 1010,
              height: H + 1200,
              background: c,
              borderLeft: `8px solid ${C.ink}`,
              transform: 'rotate(18deg)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const SCENES: {key: SceneKey; Comp: React.FC; enter: Kind; exit: Kind}[] = [
  {key: 'question', Comp: Question, enter: 'none', exit: 'iris'},
  {key: 'instant', Comp: Instant, enter: 'iris', exit: 'none'},
  {key: 'platforms', Comp: Platforms, enter: 'none', exit: 'cube'},
  {key: 'features', Comp: Features, enter: 'cube', exit: 'push'},
  {key: 'industries', Comp: Industries, enter: 'push', exit: 'none'},
  {key: 'mission', Comp: Mission, enter: 'none', exit: 'iris'},
  {key: 'custom', Comp: Custom, enter: 'iris', exit: 'cube'},
  {key: 'cta', Comp: Cta, enter: 'cube', exit: 'none'},
];

export const ChatBot: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
  <FontGate>
    <AbsoluteFill style={{background: C.ink}}>
      {SCENES.map(({key, Comp, enter, exit}) => {
        const s = T.scenes[key];
        return (
          <Sequence key={key} from={s.from} durationInFrames={s.dur} name={key}>
            <Wrap dur={s.dur} enter={enter} exit={exit}>
              <Comp />
            </Wrap>
          </Sequence>
        );
      })}
      {/* opening: stripes leave (the HyperFrames intro ends with them covering) */}
      <Stripes at={0} />
      <Stripes at={T.scenes.platforms.from + 2} />
      <Stripes at={T.scenes.mission.from + 2} colors={[C.pink, C.ink, C.sky]} />
      {withAudio ? <Audio src={staticFile('audio/mix.wav')} /> : null}
    </AbsoluteFill>
  </FontGate>
);

export const Root: React.FC = () => (
  <Composition id="ChatBot" component={ChatBot} durationInFrames={T.total} fps={FPS} width={W} height={H} defaultProps={{withAudio: false}} />
);
