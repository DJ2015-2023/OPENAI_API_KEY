import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';

/*
 * Freeze-frame character intro.
 * Per character: live footage → FREEZE (subject in colour over a flickering red/brown halftone newsprint
 * background, a dark-red echo of the silhouette, comic name banner with a lightning tail + a typed paper
 * strip) → vertical whip → footage resumes from the freeze moment. Film-burn intro, vertical whip outro.
 */
type Char = {from: number; lead: number; tail: number; name: string; tag: string; accent: string; tagY: number; tagSide: string};
const TL = timeline as unknown as {fps: number; total: number; hold: number; intro: number; outro: number; characters: Char[]};
const W = 1080;
const H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const rand = (s: number) => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** Short holds (many characters) type twice as fast so the tag is complete well before the whip. */
const TYPE_EVERY = TL.hold < 60 ? 1 : 2;
const NAME_FONT = "'Rubik', sans-serif";
const TAG_FONT = "'Caveat', cursive";

/* ---------- fonts ---------- */
let ready: Promise<unknown> | null = null;
const FACES: [string, string, number][] = [
  ['Rubik', 'rubik', 800],
  ['Rubik', 'rubik', 900],
  ['Caveat', 'caveat', 700],
];
const loadFonts = () => {
  if (ready) return ready;
  const loads: Promise<FontFace>[] = [];
  for (const [fam, file, w] of FACES) {
    for (const sub of ['latin', 'cyrillic']) {
      const ff = new FontFace(fam, `url(${staticFile(`fonts/${file}-${sub}-${w}-normal.woff2`)})`, {weight: String(w), unicodeRange: sub === 'latin' ? 'U+0000-00FF, U+2000-206F' : 'U+0400-045F, U+0490-0491'});
      document.fonts.add(ff);
      loads.push(ff.load());
    }
  }
  ready = Promise.all(loads);
  return ready;
};
const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    loadFonts().then(() => continueRender(h));
  }, [h]);
  return <>{children}</>;
};

/** Directional (vertical) motion blur via an SVG filter; `amt` in px. */
const VBlur: React.FC<{id: string; amt: number; children: React.ReactNode; style?: React.CSSProperties}> = ({id, amt, children, style}) => (
  <AbsoluteFill style={style}>
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <filter id={id} x="0" y="-20%" width="100%" height="140%">
        <feGaussianBlur stdDeviation={`0 ${Math.max(0, amt)}`} />
      </filter>
    </svg>
    <AbsoluteFill style={{filter: amt > 0.5 ? `url(#${id})` : undefined}}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

/* ---------- live footage ---------- */
const Live: React.FC<{i: number; startFrom: number; dur: number; whipIn: boolean; whipOut: boolean}> = ({i, startFrom, dur, whipIn, whipOut}) => {
  const f = useCurrentFrame();
  const pin = whipIn ? 1 - interpolate(f, [0, 6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 0;
  const pout = whipOut ? interpolate(f, [dur - 5, dur], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)}) : 0;
  const y = pin * -260 + pout * 260;
  return (
    <VBlur id={`lv${i}-${startFrom}`} amt={pin * 70 + pout * 70}>
      <AbsoluteFill style={{transform: `translateY(${y}px) scale(${1 + 0.08 * (pin + pout)})`, filter: `brightness(${1 + 0.35 * pin})`}}>
        <OffthreadVideo src={staticFile(`gen/${i}/clip.mp4`)} startFrom={startFrom} muted style={{width: W, height: H}} />
      </AbsoluteFill>
    </VBlur>
  );
};

/* ---------- the freeze card ---------- */
const Typed: React.FC<{text: string; at: number; every: number}> = ({text, at, every}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) / every) + 1));
  return <>{text.slice(0, n)}</>;
};
const PopLetters: React.FC<{text: string; at: number; every: number; accent: string}> = ({text, at, every, accent}) => {
  const f = useCurrentFrame();
  return (
    <>
      {text.split('').map((ch, k) => {
        const t0 = at + k * every;
        if (f < t0) return <span key={k} style={{opacity: 0}}>{ch === ' ' ? ' ' : ch}</span>;
        const p = spring({frame: f - t0, fps: TL.fps, config: {damping: 11, stiffness: 260, mass: 0.6}});
        const tint = f - t0 < 2;
        return (
          <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - p) * 30}px) scale(${0.6 + 0.4 * p})`, color: tint ? accent : '#fff'}}>
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
    </>
  );
};

const NameTag: React.FC<{c: Char}> = ({c}) => {
  const f = useCurrentFrame();
  const pop = spring({frame: f, fps: TL.fps, config: {damping: 10, stiffness: 240, mass: 0.6}});
  const nameSize = c.name.length > 12 ? 82 : c.name.length > 9 ? 96 : 108;
  const right = c.tagSide === 'right';
  return (
    <div style={{position: 'absolute', top: c.tagY, ...(right ? {right: 60} : {left: 60}), transform: `rotate(-2deg) scale(${0.3 + 0.7 * pop})`, transformOrigin: right ? '100% 100%' : '0% 100%', display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start'}}>
      {c.tag && (
        <div style={{marginLeft: 70, marginRight: 70, marginBottom: -6, padding: '4px 26px 0', background: '#F3E9D2', clipPath: 'polygon(0 8%, 6% 0, 18% 6%, 33% 0, 51% 7%, 68% 0, 84% 6%, 100% 0, 98% 52%, 100% 100%, 82% 93%, 64% 100%, 47% 92%, 30% 100%, 14% 94%, 0 100%, 2% 50%)', fontFamily: TAG_FONT, fontWeight: 700, fontSize: 58, letterSpacing: 2, color: '#2A2420', textTransform: 'uppercase', minHeight: 70, minWidth: 60}}>
          <Typed text={c.tag} at={2} every={TYPE_EVERY} />
        </div>
      )}
      <div style={{position: 'relative'}}>
        {/* hard black offset shadow */}
        <div style={{position: 'absolute', inset: 0, transform: 'translate(12px, 12px) skewX(-6deg)', background: '#000'}} />
        <div style={{position: 'relative', padding: '10px 44px 8px', background: c.accent, border: '5px solid #111', transform: 'skewX(-6deg)'}}>
          <div style={{transform: 'skewX(6deg)', fontFamily: NAME_FONT, fontWeight: 900, fontSize: nameSize, lineHeight: 1.05, color: '#fff', whiteSpace: 'nowrap', textShadow: '4px 4px 0 #111, -2px -2px 0 #111, 2px -2px 0 #111, -2px 2px 0 #111', minWidth: 200}}>
            <PopLetters text={c.name} at={5} every={TYPE_EVERY} accent={c.accent} />
          </div>
        </div>
        {/* lightning tail */}
        <svg width={260} height={150} viewBox="0 0 260 150" style={{position: 'absolute', top: '100%', marginTop: -8, ...(right ? {right: 40, transform: 'scaleX(-1)'} : {left: 40}), overflow: 'visible'}}>
          <path d="M40 0 L150 0 L118 46 L196 36 L28 148 L88 64 L20 72 Z" fill="#000" transform="translate(12 10)" />
          <path d="M40 0 L150 0 L118 46 L196 36 L28 148 L88 64 L20 72 Z" fill={c.accent} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

const Freeze: React.FC<{i: number; c: Char}> = ({i, c}) => {
  const f = useCurrentFrame();
  const hold = TL.hold;
  // red ↔ brown flicker in 3-frame steps, opening on red
  const step = Math.floor(f / 3);
  const bg = step === 0 ? 0 : rand(step * 7.1 + i) > 0.5 ? 0 : 1;
  const zoom = 1 + 0.035 * (f / hold);
  const pout = interpolate(f, [hold - 5, hold], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const kick = interpolate(f, [0, 4], [1.06, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <VBlur id={`fz${i}`} amt={pout * 70}>
      <AbsoluteFill style={{transform: `translateY(${pout * 260}px) scale(${zoom * kick})`}}>
        <Img src={staticFile(`gen/${i}/bg${bg}.jpg`)} style={{position: 'absolute', width: W, height: H}} />
        <Img src={staticFile(`gen/${i}/echo.png`)} style={{position: 'absolute', width: W, height: H, mixBlendMode: 'multiply', transform: `translate(${Math.sin(f / 5) * 4}px, 0)`}} />
        <Img src={staticFile(`gen/${i}/cutout.png`)} style={{position: 'absolute', width: W, height: H, filter: 'drop-shadow(0 0 18px rgba(0,0,0,0.35))'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `translateY(${pout * 260}px)`}}>
        <NameTag c={c} />
      </AbsoluteFill>
      {/* white kiss on the freeze hit */}
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 3], [0.55, 0], clamp)}} />
    </VBlur>
  );
};

/* ---------- intro film burn & outro ---------- */
const Burn: React.FC = () => {
  const f = useCurrentFrame();
  const n = TL.intro;
  const black = interpolate(f, [0, 5], [1, 0], clamp);
  const burn = interpolate(f, [3, 6, n], [0, 1, 0], clamp);
  return (
    <>
      <AbsoluteFill style={{background: '#0b0806', opacity: black}} />
      <AbsoluteFill style={{opacity: burn, mixBlendMode: 'screen'}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at ${30 + f * 4}% 40%, #fff6e8 0%, #ffd6a8 30%, #ff9a5a 55%, transparent 80%)`}} />
        <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 50% at 80% ${20 + f * 3}%, #ffb347 0%, #ff6a88 45%, transparent 75%)`, opacity: 0.85}} />
        {/* film-gate burn blobs down the left edge */}
        {[0, 1, 2, 3, 4].map((k) => (
          <div key={k} style={{position: 'absolute', left: 30, top: 140 + k * 360 - f * 18, width: 110, height: 150, borderRadius: 30, background: 'radial-gradient(circle, #ffb02e 0%, rgba(255,140,40,0.6) 50%, transparent 75%)', filter: 'blur(6px)'}} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [4, 6, 9], [0, 0.6, 0], clamp)}} />
    </>
  );
};

export const FreezeIntro: React.FC = () => {
  const f = useCurrentFrame();
  const total = TL.total;
  const outro = interpolate(f, [total - TL.outro, total], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <FontGate>
      <AbsoluteFill style={{background: '#000'}}>
        <VBlur id="outro" amt={outro * 90}>
          <AbsoluteFill style={{transform: `translateY(${-outro * 400}px)`}}>
            {TL.characters.map((c, i) => {
              const last = i === TL.characters.length - 1;
              return (
                <React.Fragment key={i}>
                  <Sequence from={c.from} durationInFrames={c.lead} name={`${c.name}: live`}>
                    <Live i={i} startFrom={0} dur={c.lead} whipIn={i > 0} whipOut={false} />
                  </Sequence>
                  <Sequence from={c.from + c.lead} durationInFrames={TL.hold} name={`${c.name}: freeze`}>
                    <Freeze i={i} c={c} />
                  </Sequence>
                  <Sequence from={c.from + c.lead + TL.hold} durationInFrames={c.tail} name={`${c.name}: resume`}>
                    <Live i={i} startFrom={c.lead} dur={c.tail} whipIn whipOut={!last} />
                  </Sequence>
                </React.Fragment>
              );
            })}
          </AbsoluteFill>
        </VBlur>
        <Sequence durationInFrames={TL.intro}>
          <Burn />
        </Sequence>
        <AbsoluteFill style={{background: '#000', opacity: outro}} />
        <Audio src={staticFile('audio/mix.wav')} />
      </AbsoluteFill>
    </FontGate>
  );
};
