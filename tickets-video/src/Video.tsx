import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FontGate, Grain, Vignette} from './components/FX';
import {Alert, Hurry, Party, Poster, Price, Venue} from './scenes';
import {C, FPS, H, SceneKey, T, W, clamp, kick, rand} from './theme';

const OVER = 10;
// drip = blood curtain, zoom = push through, glitch = RGB slice, flash = white-hot cut on a drop,
// whip = motion-blurred pan, smoke = blur dissolve
type Kind = 'drip' | 'zoom' | 'glitch' | 'flash' | 'whip' | 'smoke' | 'none';

const Wrap: React.FC<{dur: number; enter: Kind; exit: Kind; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.cubic);
  const pin = interpolate(f, [0, OVER], [0, 1], {...clamp, easing: e});
  const pout = interpolate(f, [dur - OVER, dur], [0, 1], {...clamp, easing: e});
  const st: React.CSSProperties = {};
  const tr: string[] = [];
  const fl: string[] = [];
  if (pin < 1) {
    if (enter === 'zoom') {
      tr.push(`scale(${0.6 + pin * 0.4})`);
      st.opacity = pin;
    }
    if (enter === 'whip') {
      tr.push(`translateX(${(1 - pin) * W}px)`);
      fl.push(`blur(${(1 - pin) * 30}px)`);
    }
    if (enter === 'smoke') {
      st.opacity = pin;
      fl.push(`blur(${(1 - pin) * 24}px)`);
    }
    if (enter === 'flash') tr.push(`scale(${1.15 - pin * 0.15})`);
    if (enter === 'glitch') st.opacity = pin > 0.3 ? 1 : 0;
  }
  if (pout > 0) {
    if (exit === 'zoom') {
      tr.push(`scale(${1 + pout * 2.2})`);
      st.opacity = 1 - pout;
      fl.push(`blur(${pout * 16}px)`);
    }
    if (exit === 'whip') {
      tr.push(`translateX(${-pout * W}px)`);
      fl.push(`blur(${pout * 30}px)`);
    }
    if (exit === 'smoke') {
      st.opacity = 1 - pout;
      fl.push(`blur(${pout * 24}px) brightness(${1 + pout})`);
    }
  }
  if (tr.length) st.transform = tr.join(' ');
  if (fl.length) st.filter = fl.join(' ');
  return <AbsoluteFill style={st}>{children}</AbsoluteFill>;
};

/** Blood curtain with dripping edge that sweeps down across a cut. */
const BloodDrip: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - 14, at + 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  if (p <= 0 || p >= 1) return null;
  const y = -2 * H + p * 3 * H;
  let d = `M0 0 L${W} 0 L${W} ${2 * H - 120}`;
  for (let i = 18; i >= 0; i--) {
    const x = (i / 18) * W;
    const len = 60 + rand(i * 3.7) * 260;
    d += ` L${x + 20} ${2 * H - 120} Q${x + 14} ${2 * H - 120 + len} ${x} ${2 * H - 120 + len * 0.8} Q${x - 14} ${2 * H - 120 + len} ${x - 20} ${2 * H - 120}`;
  }
  d += ' L0 0 Z';
  return (
    <svg width={W} height={2 * H + 400} style={{position: 'absolute', left: 0, top: y}}>
      <defs>
        <linearGradient id="bl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a0008" />
          <stop offset="0.85" stopColor="#9a0018" />
          <stop offset="1" stopColor="#c8102e" />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#bl)" />
    </svg>
  );
};

const Flash: React.FC<{at: number; color?: string}> = ({at, color = '#fff'}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + 9], [0, 1, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: o}} />;
};

/** Horizontal RGB slice tear across a cut. */
const GlitchCut: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < -6 || d > 6) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(9).fill(0).map((_, i) => {
        const r = (k: number) => rand(f * 13 + i * 7 + k);
        return (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: r(1) * H, height: 20 + r(2) * 120, background: i % 2 ? 'rgba(0,240,255,0.35)' : 'rgba(255,0,64,0.45)', transform: `translateX(${(r(3) - 0.5) * 300}px)`, mixBlendMode: 'screen'}} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Red light pulse on every kick of the track after the first drop. */
/** Red light pulse on every beat of the dembow (quiet over the poster hold). */
const KickLight: React.FC = () => {
  const f = useCurrentFrame();
  const k = kick(f);
  const amt = f > T.scenes.poster.from + 110 ? 0.08 : 0.2;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 70% at 50% 50%, transparent 55%, rgba(224,16,47,${amt * k}) 100%)`, pointerEvents: 'none'}} />;
};

const SCENES: {key: SceneKey; Comp: React.FC; enter: Kind; exit: Kind}[] = [
  {key: 'alert', Comp: Alert, enter: 'none', exit: 'whip'},
  {key: 'price', Comp: Price, enter: 'whip', exit: 'none'},
  {key: 'hurry', Comp: Hurry, enter: 'glitch', exit: 'zoom'},
  {key: 'party', Comp: Party, enter: 'flash', exit: 'none'},
  {key: 'venue', Comp: Venue, enter: 'glitch', exit: 'none'},
  {key: 'poster', Comp: Poster, enter: 'none', exit: 'none'},
];

export const Tickets: React.FC = () => {
  const S = T.scenes;
  return (
    <FontGate>
      <AbsoluteFill style={{background: C.night}}>
        {SCENES.map(({key, Comp, enter, exit}) => {
          const s = S[key];
          return (
            <Sequence key={key} from={s.from} durationInFrames={s.dur} name={key}>
              <Wrap dur={s.dur} enter={enter} exit={exit}>
                <Comp />
              </Wrap>
            </Sequence>
          );
        })}
        <GlitchCut at={S.hurry.from + 5} />
        <Flash at={S.party.from} color="#ffb060" />
        <GlitchCut at={S.venue.from + 5} />
        <BloodDrip at={S.poster.from + 5} />
        <Flash at={S.poster.from + 12} color="#ff3050" />
        <KickLight />
        <Vignette strength={0.6} />
        <Grain amount={0.08} />
        <Audio src={staticFile('audio/mix.wav')} />
      </AbsoluteFill>
    </FontGate>
  );
};

export const Root: React.FC = () => <Composition id="Tickets" component={Tickets} durationInFrames={T.total} fps={FPS} width={W} height={H} />;
