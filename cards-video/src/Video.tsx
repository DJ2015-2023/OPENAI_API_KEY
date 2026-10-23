import React from 'react';
import {AbsoluteFill, Composition, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {FontGate} from './components/UI';
import {Goal, IncludesA, IncludesB, Platforms} from './scenes/Closing';
import {Build, Hook, Seconds} from './scenes/Opening';
import {C, FPS, H, SceneKey, T, W, clamp} from './theme';

const OVER = 14;
// scan = barcode-laser reveal, flash = camera flash, swipe = feed swipe, zoom = push through
type Kind = 'scan' | 'flash' | 'swipe' | 'zoom' | 'none';

const Wrap: React.FC<{dur: number; enter: Kind; exit: Kind; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.cubic);
  const pin = interpolate(f, [0, OVER], [0, 1], {...clamp, easing: e});
  const pout = interpolate(f, [dur - OVER, dur], [0, 1], {...clamp, easing: e});
  const st: React.CSSProperties = {};
  const tr: string[] = [];
  if (enter === 'scan' && pin < 1) st.clipPath = `inset(0 0 ${(1 - pin) * 100}% 0)`;
  if (enter === 'swipe' && pin < 1) tr.push(`translateX(${(1 - pin) * W}px) rotate(${(1 - pin) * 6}deg)`);
  if (exit === 'swipe' && pout > 0) tr.push(`translateX(${-pout * W}px) rotate(${-pout * 6}deg)`);
  if (enter === 'zoom' && pin < 1) {
    tr.push(`scale(${0.85 + pin * 0.15})`);
    st.opacity = pin;
  }
  if (exit === 'zoom' && pout > 0) {
    tr.push(`scale(${1 + pout * 1.6})`);
    st.opacity = 1 - pout;
    st.filter = `blur(${pout * 14}px)`;
  }
  if (enter === 'flash' && pin < 1) tr.push(`scale(${1.08 - pin * 0.08})`);
  if (tr.length) st.transform = tr.join(' ');
  return <AbsoluteFill style={st}>{children}</AbsoluteFill>;
};

const ScanLine: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + OVER], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  if (f < at || f > at + OVER) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, height: 8, background: C.red, boxShadow: `0 0 30px ${C.red}, 0 0 80px ${C.red}`}} />;
};

const Flash: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 3, at, at + 10], [0, 1, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: '#fff', opacity: o}} />;
};

const SCENES: {key: SceneKey; Comp: React.FC; enter: Kind; exit: Kind}[] = [
  {key: 'hook', Comp: Hook, enter: 'none', exit: 'swipe'},
  {key: 'seconds', Comp: Seconds, enter: 'swipe', exit: 'none'},
  {key: 'build', Comp: Build, enter: 'scan', exit: 'zoom'},
  {key: 'includesA', Comp: IncludesA, enter: 'zoom', exit: 'none'},
  {key: 'includesB', Comp: IncludesB, enter: 'flash', exit: 'swipe'},
  {key: 'platforms', Comp: Platforms, enter: 'swipe', exit: 'none'},
  {key: 'goal', Comp: Goal, enter: 'scan', exit: 'none'},
];

export const Cards: React.FC = () => (
  <FontGate>
    <AbsoluteFill style={{background: C.studio}}>
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
      <ScanLine at={T.scenes.build.from} />
      <ScanLine at={T.scenes.goal.from} />
      <Flash at={T.scenes.includesB.from + 2} />
    </AbsoluteFill>
  </FontGate>
);

export const Root: React.FC = () => <Composition id="Cards" component={Cards} durationInFrames={T.total} fps={FPS} width={W} height={H} />;
