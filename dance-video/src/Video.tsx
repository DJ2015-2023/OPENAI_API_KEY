import React from 'react';
import {AbsoluteFill, Composition, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {FontGate} from './components/UI';
import {Creator} from './scenes/Creator';
import {FeaturesA, FeaturesB} from './scenes/Features';
import {Cta, More, Platform} from './scenes/Finale';
import {Intro} from './scenes/Intro';
import {Styles} from './scenes/Styles';
import {C, FPS, H, SceneKey, T, W, clamp} from './theme';

const OVER = 14;
type Kind = 'spin' | 'sweep' | 'none';

/** Velvet stage curtain; `close` 0 = open, 1 = fully closed. */
export const Curtain: React.FC<{close: number}> = ({close}) => {
  if (close <= 0.001) return null;
  const panel = (side: 'left' | 'right') => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: W / 2 + 4,
        transform: `translateX(${(side === 'left' ? -1 : 1) * (1 - close) * (W / 2 + 10)}px)`,
        background: `repeating-linear-gradient(90deg, #5a0a1e 0px, #8e1430 38px, #b01a3a 60px, #8e1430 82px, #5a0a1e 120px)`,
        boxShadow: side === 'left' ? 'inset -30px 0 60px rgba(0,0,0,0.6)' : 'inset 30px 0 60px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: `repeating-linear-gradient(90deg, ${C.gold} 0 6px, ${C.goldDeep} 6px 12px)`, opacity: 0.9}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: 'linear-gradient(rgba(0,0,0,0.55), transparent)'}} />
    </div>
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {panel('left')}
      {panel('right')}
    </AbsoluteFill>
  );
};

const Wrap: React.FC<{dur: number; enter: Kind; exit: Kind; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.cubic);
  const pin = interpolate(f, [0, OVER], [0, 1], {...clamp, easing: e});
  const pout = interpolate(f, [dur - OVER, dur], [0, 1], {...clamp, easing: e});
  const tr: string[] = [];
  const st: React.CSSProperties = {};
  const flt: string[] = [];
  if (enter === 'spin' && pin < 1) {
    tr.push(`rotate(${(1 - pin) * 40}deg) scale(${1.3 - pin * 0.3})`);
    flt.push(`blur(${(1 - pin) * 14}px)`);
    st.opacity = pin;
  }
  if (exit === 'spin' && pout > 0) {
    tr.push(`rotate(${-pout * 40}deg) scale(${1 + pout * 0.3})`);
    flt.push(`blur(${pout * 14}px)`);
  }
  if (enter === 'sweep' && pin < 1) st.clipPath = `inset(0 0 0 ${(1 - pin) * 100}%)`;
  if (exit === 'sweep' && pout > 0) flt.push(`brightness(${1 + pout * 0.8})`);
  if (tr.length) st.transform = tr.join(' ');
  if (flt.length) st.filter = flt.join(' ');
  return <AbsoluteFill style={st}>{children}</AbsoluteFill>;
};

/** Gold light streak travelling across at a sweep transition. */
const LightSweep: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - 2, at + 14], [-0.3, 1.3], clamp);
  if (f < at - 2 || f > at + 16) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <div style={{position: 'absolute', top: -200, bottom: -200, left: p * W - 160, width: 320, background: `linear-gradient(90deg, transparent, ${C.gold}cc, #fff6e0, ${C.gold}cc, transparent)`, transform: 'skewX(-12deg)', filter: 'blur(6px)'}} />
    </AbsoluteFill>
  );
};

/** Curtains close at `closeAt` (fully shut) and/or open from `openAt`. */
const CurtainCue: React.FC<{closeAt?: number; openAt?: number}> = ({closeAt, openAt}) => {
  const f = useCurrentFrame();
  let c = 0;
  if (closeAt !== undefined && f <= closeAt) c = interpolate(f, [closeAt - 16, closeAt], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  if (openAt !== undefined && f >= openAt) c = interpolate(f, [openAt, openAt + 20], [1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <Curtain close={c} />;
};

const SCENES: {key: SceneKey; Comp: React.FC; enter: Kind; exit: Kind}[] = [
  {key: 'intro', Comp: Intro, enter: 'none', exit: 'spin'},
  {key: 'styles', Comp: Styles, enter: 'spin', exit: 'none'},
  {key: 'creator', Comp: Creator, enter: 'none', exit: 'sweep'},
  {key: 'featuresA', Comp: FeaturesA, enter: 'sweep', exit: 'none'},
  {key: 'featuresB', Comp: FeaturesB, enter: 'none', exit: 'spin'},
  {key: 'platform', Comp: Platform, enter: 'spin', exit: 'sweep'},
  {key: 'more', Comp: More, enter: 'sweep', exit: 'none'},
  {key: 'cta', Comp: Cta, enter: 'none', exit: 'none'},
];

export const Dance: React.FC = () => {
  const ins = T.insert;
  const S = T.scenes;
  return (
    <FontGate>
      <AbsoluteFill style={{background: C.night}}>
        {SCENES.map(({key, Comp, enter, exit}) => {
          const s = S[key];
          const from = key === 'cta' ? ins.to : s.from;
          const dur = key === 'more' ? ins.from - s.from : s.dur - (from - s.from);
          return (
            <Sequence key={key} from={from} durationInFrames={dur} name={key}>
              <Wrap dur={dur} enter={enter} exit={exit}>
                <Comp />
              </Wrap>
            </Sequence>
          );
        })}
        <Sequence from={ins.from} durationInFrames={ins.to - ins.from} name="offer (HyperFrames insert)">
          <AbsoluteFill style={{background: C.wine}} />
        </Sequence>
        <LightSweep at={S.featuresA.from} />
        <LightSweep at={S.more.from} />
        {/* curtains: between styles/creator, around the HyperFrames insert */}
        <CurtainCue closeAt={S.creator.from} />
        <Sequence from={S.creator.from} durationInFrames={30}>
          <CurtainCue openAt={0} />
        </Sequence>
        <CurtainCue closeAt={ins.from} />
        <Sequence from={ins.to} durationInFrames={30}>
          <CurtainCue openAt={0} />
        </Sequence>
      </AbsoluteFill>
    </FontGate>
  );
};

export const Root: React.FC = () => <Composition id="Dance" component={Dance} durationInFrames={T.total} fps={FPS} width={W} height={H} />;
