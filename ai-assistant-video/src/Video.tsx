import React from 'react';
import {AbsoluteFill, Composition, Sequence, interpolate, random, useCurrentFrame} from 'remotion';
import {FilmFinish, Flash} from './components/FX';
import {Channels} from './scenes/Channels';
import {Features} from './scenes/Features';
import {Hook} from './scenes/Hook';
import {Imagine} from './scenes/Imagine';
import {Result} from './scenes/Result';
import {C, FPS, H, T, W, clamp} from './theme';

const OVERLAP = 12;

type Kind = 'glitch' | 'zoom' | 'whip' | 'flash' | 'none';

/** Applies enter/exit transition styling to a scene based on its local frame. */
const TransitionWrap: React.FC<{dur: number; enter: Kind; exit: Kind; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useCurrentFrame();
  const pin = interpolate(f, [0, OVERLAP], [0, 1], clamp); // 0 -> 1 entering
  const pout = interpolate(f, [dur - OVERLAP, dur], [0, 1], clamp); // 0 -> 1 leaving
  let transform = '';
  let filter = '';
  let opacity = 1;
  let clip: string | undefined;

  if (enter === 'zoom' && pin < 1) {
    transform += ` scale(${0.55 + 0.45 * pin})`;
    filter += ` blur(${(1 - pin) * 18}px)`;
    opacity *= pin;
  }
  if (enter === 'whip' && pin < 1) {
    const e = 1 - Math.pow(1 - pin, 3);
    transform += ` translateX(${(1 - e) * W}px) skewX(${(1 - e) * -12}deg)`;
    filter += ` blur(${(1 - e) * 30}px)`;
  }
  if (enter === 'glitch' && pin < 1) {
    const slices = random(`ge${f}`) * 100;
    clip = pin < 0.6 ? `inset(${slices}% 0 ${Math.max(0, 80 - slices)}% 0)` : undefined;
    transform += ` translateX(${(random(`gex${f}`) - 0.5) * 120 * (1 - pin)}px)`;
  }
  if (enter === 'flash' && pin < 1) {
    transform += ` scale(${1.25 - 0.25 * pin})`;
    opacity *= pin;
  }

  if (exit === 'zoom' && pout > 0) {
    transform += ` scale(${1 + pout * 2.2})`;
    filter += ` blur(${pout * 24}px)`;
    opacity *= 1 - pout;
  }
  if (exit === 'whip' && pout > 0) {
    const e = pout * pout;
    transform += ` translateX(${-e * W}px) skewX(${e * 12}deg)`;
    filter += ` blur(${e * 30}px)`;
  }
  if (exit === 'glitch' && pout > 0) {
    transform += ` translateX(${(random(`gx${f}`) - 0.5) * 160 * pout}px) scale(${1 + pout * 0.15})`;
    filter += ` hue-rotate(${pout * 90}deg) saturate(${1 + pout * 2}) contrast(${1 + pout})`;
    opacity *= 1 - pout * pout;
  }
  if (exit === 'flash' && pout > 0) {
    transform += ` scale(${1 + pout * 0.3})`;
    filter += ` brightness(${1 + pout * 3})`;
  }

  return (
    <AbsoluteFill style={{transform: transform || undefined, filter: filter || undefined, opacity, clipPath: clip}}>
      {children}
    </AbsoluteFill>
  );
};

const SCENES: {key: keyof typeof T.scenes; C: React.FC; enter: Kind; exit: Kind}[] = [
  {key: 'hook', C: Hook, enter: 'none', exit: 'glitch'},
  {key: 'imagine', C: Imagine, enter: 'glitch', exit: 'zoom'},
  {key: 'channels', C: Channels, enter: 'zoom', exit: 'whip'},
  {key: 'features', C: Features, enter: 'whip', exit: 'flash'},
  {key: 'result', C: Result, enter: 'flash', exit: 'none'},
];

export const AIAssistant: React.FC = () => {
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {SCENES.map(({key, C: Scene, enter, exit}) => {
        const s = T.scenes[key];
        return (
          <Sequence key={key} from={s.from} durationInFrames={s.dur} name={key}>
            <TransitionWrap dur={s.dur} enter={enter} exit={exit}>
              <Scene />
            </TransitionWrap>
          </Sequence>
        );
      })}
      {/* transition accents */}
      <Flash at={T.scenes.imagine.from + 4} dur={10} />
      <Flash at={T.scenes.result.from + 4} dur={8} color={C.green} />
      <Flash at={T.scenes.channels.from + 3} dur={6} color={C.cyan} />
      <FilmFinish />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition id="AIAssistant" component={AIAssistant} durationInFrames={T.total} fps={FPS} width={W} height={H} />
);
