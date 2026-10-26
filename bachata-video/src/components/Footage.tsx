import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FPS, Segment, T, W, clamp} from '../theme';

type Trans = 'cut' | 'whip' | 'zoom' | 'leak';
/** Transition used when a section begins (cuts inside a section are hard beat cuts with a punch-in). */
const SECTION_IN: Record<string, Trans> = {
  tagline: 'whip',
  notjust: 'zoom',
  expect: 'leak',
  song: 'zoom',
  schedule: 'whip',
  price: 'leak',
  why: 'whip',
  cta: 'zoom',
  outro: 'leak',
};
const TR = 6;

const Shot: React.FC<{seg: Segment; enter: Trans; exit: Trans; idx: number}> = ({seg, enter, exit, idx}) => {
  const f = useCurrentFrame();
  const pin = interpolate(f, [0, TR], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const pout = interpolate(f, [seg.dur - TR, seg.dur], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  // punch-in on the cut, then a slow drift so no shot is ever static
  const punch = interpolate(f, [0, 8], [1.1, 1.03], {...clamp, easing: Easing.out(Easing.cubic)});
  const drift = 1 + 0.035 * (f / seg.dur);
  const dir = idx % 2 ? 1 : -1;
  const tr: string[] = [`scale(${punch * drift})`, `translateX(${dir * 12 * (f / seg.dur)}px)`];
  const fl: string[] = ['contrast(1.08)', 'saturate(1.12)', 'brightness(1.02)'];
  if (enter === 'whip' && pin < 1) {
    tr.unshift(`translateX(${(1 - pin) * W * 0.45}px)`);
    fl.push(`blur(${(1 - pin) * 26}px)`);
  }
  if (exit === 'whip' && pout > 0) {
    tr.unshift(`translateX(${-pout * W * 0.45}px)`);
    fl.push(`blur(${pout * 26}px)`);
  }
  if (enter === 'zoom' && pin < 1) {
    tr.push(`scale(${1.35 - 0.35 * pin})`);
    fl.push(`blur(${(1 - pin) * 18}px)`);
  }
  if (exit === 'zoom' && pout > 0) {
    tr.push(`scale(${1 + 0.5 * pout})`);
    fl.push(`blur(${pout * 18}px)`);
  }
  if (enter === 'leak' && pin < 1) fl.push(`brightness(${1 + (1 - pin) * 1.2})`);
  if (exit === 'leak' && pout > 0) fl.push(`brightness(${1 + pout * 1.2})`);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: tr.join(' '), filter: fl.join(' ')}}>
        <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} startFrom={Math.round(seg.src * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Short white kiss on every hard cut. */
const CutFlash: React.FC<{at: number; peak?: number}> = ({at, peak = 0.28}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + 4], [0, peak, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: '#fff4f0', opacity: o, mixBlendMode: 'screen'}} />;
};

export const Footage: React.FC = () => {
  const segs = T.segments;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {segs.map((s, i) => {
        const first = i === 0 || segs[i - 1].section !== s.section;
        const last = i === segs.length - 1 || segs[i + 1].section !== s.section;
        const enter: Trans = first && i > 0 ? SECTION_IN[s.section] ?? 'cut' : 'cut';
        const exit: Trans = last && i < segs.length - 1 ? SECTION_IN[segs[i + 1].section] ?? 'cut' : 'cut';
        return (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`${s.section}:${s.clip}`}>
            <Shot seg={s} enter={enter} exit={exit} idx={i} />
          </Sequence>
        );
      })}
      {segs.slice(1).map((s, i) => (segs[i].section === s.section ? <CutFlash key={i} at={s.from} /> : null))}
    </AbsoluteFill>
  );
};

/** Frames at which a section starts (for the light-leak bursts in Video.tsx). */
export const sectionStarts = () => Object.entries(T.sections).filter(([k]) => k !== 'intro').map(([k, v]) => ({key: k, at: v.from, kind: SECTION_IN[k]}));
