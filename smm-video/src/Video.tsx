import React from 'react';
import {AbsoluteFill, Composition, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {FontGate, StoryBars} from './components/UI';
import {Cta} from './scenes/Cta';
import {Hook} from './scenes/Hook';
import {Pro} from './scenes/Pro';
import {Services} from './scenes/Services';
import {System} from './scenes/System';
import {C, FPS, H, SceneKey, T, W, clamp} from './theme';

const OVER = 14;
type Kind = 'heartzoom' | 'feed' | 'spin' | 'none';

const Wrap: React.FC<{dur: number; enter: Kind; exit: Kind; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.cubic);
  const pin = interpolate(f, [0, OVER], [0, 1], {...clamp, easing: e});
  const pout = interpolate(f, [dur - OVER, dur], [0, 1], {...clamp, easing: e});
  const tr: string[] = [];
  const st: React.CSSProperties = {};
  const filters: string[] = [];
  if (enter === 'heartzoom' && pin < 1) {
    tr.push(`scale(${0.7 + pin * 0.3})`);
    st.opacity = pin;
  }
  if (exit === 'heartzoom' && pout > 0) {
    tr.push(`scale(${1 + pout * 3})`);
    filters.push(`blur(${pout * 20}px)`);
    st.opacity = 1 - pout;
  }
  if (enter === 'feed' && pin < 1) tr.push(`translateY(${(1 - pin) * H}px)`);
  if (exit === 'feed' && pout > 0) tr.push(`translateY(${-pout * H}px)`);
  if (enter === 'spin' && pin < 1) {
    tr.push(`rotate(${(1 - pin) * -25}deg) scale(${1.4 - pin * 0.4})`);
    filters.push(`blur(${(1 - pin) * 16}px)`);
  }
  if (exit === 'spin' && pout > 0) {
    tr.push(`rotate(${pout * 25}deg) scale(${1 + pout * 0.6})`);
    filters.push(`blur(${pout * 16}px)`);
    st.opacity = 1 - pout;
  }
  if (tr.length) st.transform = tr.join(' ');
  if (filters.length) st.filter = filters.join(' ');
  return <AbsoluteFill style={st}>{children}</AbsoluteFill>;
};

/** Panel sliding up to cover the frame, ending fully covered at `at` (hands over to the HyperFrames insert). */
const PanelUp: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - 12, at], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  if (p <= 0 || f > at) return null;
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - p) * H}px)`, background: `linear-gradient(160deg, ${C.pink}, ${C.violet})`, borderRadius: `${(1 - p) * 120}px ${(1 - p) * 120}px 0 0`}} />
  );
};

/** Yellow screen with a growing circular hole: picks up where the HyperFrames insert ends. */
const IrisOpen: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  if (p >= 1 || f < at) return null;
  const r = p * 1150;
  return (
    <AbsoluteFill
      style={{
        background: C.yellow,
        WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r + 2}px)`,
        maskImage: `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r + 2}px)`,
      }}
    />
  );
};

const SCENES: {key: SceneKey; Comp: React.FC; enter: Kind; exit: Kind}[] = [
  {key: 'hook', Comp: Hook, enter: 'none', exit: 'heartzoom'},
  {key: 'pro', Comp: Pro, enter: 'heartzoom', exit: 'feed'},
  {key: 'services', Comp: Services, enter: 'feed', exit: 'none'},
  {key: 'system', Comp: System, enter: 'none', exit: 'spin'},
  {key: 'cta', Comp: Cta, enter: 'spin', exit: 'none'},
];

export const SMM: React.FC = () => {
  const ins = T.insert;
  const segs = (['hook', 'pro', 'services', 'platforms', 'system', 'cta'] as SceneKey[]).map((k, i, arr) => ({
    from: T.scenes[k].from,
    to: i < arr.length - 1 ? T.scenes[arr[i + 1]].from : T.total,
  }));
  return (
    <FontGate>
      <AbsoluteFill style={{background: C.base}}>
        {SCENES.map(({key, Comp, enter, exit}) => {
          const s = T.scenes[key];
          // keep scenes out of the HyperFrames insert window
          const from = key === 'system' ? ins.to : s.from;
          const dur = key === 'services' ? ins.from - s.from : s.dur - (from - s.from);
          return (
            <Sequence key={key} from={from} durationInFrames={dur} name={key}>
              <Wrap dur={dur} enter={enter} exit={exit}>
                <Comp />
              </Wrap>
            </Sequence>
          );
        })}
        <PanelUp at={ins.from} />
        <Sequence from={ins.from} durationInFrames={ins.to - ins.from} name="platforms (HyperFrames insert)">
          <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.pink}, ${C.violet})`}} />
        </Sequence>
        <IrisOpen at={ins.to} />
        <StoryBars segments={segs} />
      </AbsoluteFill>
    </FontGate>
  );
};

export const Root: React.FC = () => <Composition id="SMM" component={SMM} durationInFrames={T.total} fps={FPS} width={W} height={H} />;
