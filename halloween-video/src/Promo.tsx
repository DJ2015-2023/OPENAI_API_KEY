import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {FontFaces, GOLD, GOLD_DEEP, clamp} from './lib';
import {SceneGang, SceneLips, ScenePoster, SceneParty, SceneWitch} from './scenes';
import {FPS} from './timeline';

// 15s beat-cut promo on "Montagem Coral" (song window 29.86s–44.86s, see audio/promo_mix.sh).
export const PROMO_FRAMES = 360;
const SONG_OFFSET = 29.86;

// Cuts land on the strongest kicks of the song (song seconds − offset).
type Shot = {from: number; dur: number; skip: number; node: React.ReactNode; caption?: string};
const at = (songT: number) => Math.round((songT - SONG_OFFSET) * FPS);
const C = [0, at(31.86), at(33.47), at(35.415), at(37.02), at(38.64), at(42.09), PROMO_FRAMES];

// Secondary hits for flash/zoom pulses (song seconds, strength 0..1)
const HITS: [number, number][] = [
  [31.86, 1], [32.835, 0.4], [33.06, 0.4], [33.47, 0.6], [34.565, 0.45], [34.89, 0.7], [35.415, 0.95],
  [36.49, 0.4], [37.02, 0.6], [38.64, 0.9], [38.865, 0.9], [39.065, 0.8], [40.135, 0.4], [40.625, 0.5],
  [41.83, 0.5], [42.09, 0.7], [42.68, 1], [44.25, 0.45],
];

const IntroFast: React.FC = () => {
  // logo build-up from the user's clip at 2x speed
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: 'blur(45px) brightness(.45) saturate(1.3)', transform: 'scale(1.3)'}}>
        <OffthreadVideo src={staticFile('intro.mp4')} muted playbackRate={2} startFrom={48} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center'}}>
        <OffthreadVideo src={staticFile('intro.mp4')} muted playbackRate={2} startFrom={48} style={{width: 1080, height: 958, objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Alone: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile('scene4.mp4')} muted startFrom={34} />
  </AbsoluteFill>
);

const SHOTS: Shot[] = [
  {from: C[0], dur: C[1] - C[0], skip: 0, node: <IntroFast />},
  {from: C[1], dur: C[2] - C[1], skip: 8, node: <SceneWitch />, caption: 'КТО-ТО УЖЕ ВЫБИРАЕТ КОСТЮМ'},
  {from: C[2], dur: C[3] - C[2], skip: 14, node: <SceneLips />, caption: 'КТО-ТО ГОТОВИТСЯ УДИВЛЯТЬ'},
  {from: C[3], dur: C[4] - C[3], skip: 10, node: <SceneGang />, caption: 'КТО-ТО СОБИРАЕТ БАНДУ'},
  {from: C[4], dur: C[5] - C[4], skip: 0, node: <Alone />},
  {from: C[5], dur: C[6] - C[5], skip: 0, node: <SceneParty />},
  {from: C[6], dur: C[7] - C[6], skip: 0, node: <ScenePoster />},
];

// Hard beat cut: zoom punch + RGB split for the first frames of every shot.
const Punch: React.FC<{children: React.ReactNode; first: boolean}> = ({children, first}) => {
  const f = useCurrentFrame();
  const s = first ? 1 : interpolate(f, [0, 6], [1.18, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const split = first ? 0 : interpolate(f, [0, 4], [22, 0], clamp);
  return (
    <AbsoluteFill style={{transform: `scale(${s})`}}>
      {split > 0.5 && (
        <>
          <AbsoluteFill style={{transform: `translateX(${-split}px)`, opacity: 0.5, mixBlendMode: 'screen', filter: 'sepia(1) saturate(8) hue-rotate(-50deg)'}}>
            {children}
          </AbsoluteFill>
          <AbsoluteFill style={{transform: `translateX(${split}px)`, opacity: 0.5, mixBlendMode: 'screen', filter: 'sepia(1) saturate(8) hue-rotate(150deg)'}}>
            {children}
          </AbsoluteFill>
        </>
      )}
      <AbsoluteFill style={{opacity: split > 0.5 ? 0.75 : 1}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{text: string; dur: number}> = ({text, dur}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [2, 7], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const out = interpolate(f, [dur - 3, dur], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 1500,
        textAlign: 'center',
        fontFamily: 'Playfair',
        fontWeight: 900,
        fontSize: 74,
        lineHeight: 1.08,
        letterSpacing: 2,
        opacity: p * out,
        transform: `scale(${0.8 + p * 0.2})`,
        background: `linear-gradient(#fff1c4, ${GOLD} 50%, ${GOLD_DEEP})`,
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        filter: 'drop-shadow(0 0 18px rgba(196,16,42,.8)) drop-shadow(0 5px 0 rgba(0,0,0,.85))',
      }}
    >
      {text}
    </div>
  );
};

const BeatFX: React.FC = () => {
  const f = useCurrentFrame();
  let flash = 0;
  for (const [t, s] of HITS) {
    const d = f - (t - SONG_OFFSET) * FPS;
    if (d >= 0 && d < 6) flash = Math.max(flash, s * (1 - d / 6));
  }
  const cut = C.slice(1, -1).some((c) => f >= c && f < c + 2);
  return (
    <>
      <AbsoluteFill style={{background: cut ? '#fff' : '#ff2a3c', opacity: cut ? 0.75 : flash * 0.22, mixBlendMode: cut ? 'normal' : 'screen'}} />
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${160 + flash * 140}px rgba(196,16,42,${0.35 + flash * 0.4})`}} />
    </>
  );
};

export const Promo: React.FC = () => {
  const f = useCurrentFrame();
  let bump = 0;
  for (const [t, s] of HITS) {
    const d = f - (t - SONG_OFFSET) * FPS;
    if (d >= 0 && d < 8) bump = Math.max(bump, s * Math.pow(1 - d / 8, 2));
  }
  const fadeOut = interpolate(f, [PROMO_FRAMES - 8, PROMO_FRAMES], [1, 0.0], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <FontFaces />
      <AbsoluteFill style={{transform: `scale(${1 + bump * 0.035})`, opacity: fadeOut < 1 ? 0.3 + fadeOut * 0.7 : 1}}>
        {SHOTS.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur}>
            <Punch first={i === 0}>
              <Sequence from={-s.skip}>{s.node}</Sequence>
            </Punch>
            {s.caption && <Caption text={s.caption} dur={s.dur} />}
          </Sequence>
        ))}
      </AbsoluteFill>
      <BeatFX />
    </AbsoluteFill>
  );
};

