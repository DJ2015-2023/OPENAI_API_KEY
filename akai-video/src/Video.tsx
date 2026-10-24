import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import layers from '../public/img/layers.json';

const FPS = 30;
const W = 1080;
const H = 1920;
const TOTAL = 14 * FPS;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (f: number, a: number, b: number, e = Easing.out(Easing.cubic)) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const rand = (s: number) => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const s2f = (s: number) => Math.round(s * FPS);

/** Cue sheet in seconds (mirrors scripts/build_audio.py). */
const CUE = {
  red: 0.6,
  blue: 0.9,
  gold: 1.1,
  logo: 2.0,
  akai: 3.0,
  live: 3.75,
  date: 4.4,
  artist: 5.0,
  flash: 7.0,
  temp: 7.25,
  euro: 7.95,
  moskva: 8.8,
  dates: 9.4,
  inv1: 10.0,
  inv2: 10.5,
  inv3: 11.0,
  inv4: 11.5,
  final: 12.0,
};
const F = Object.fromEntries(Object.entries(CUE).map(([k, v]) => [k, s2f(v)])) as Record<keyof typeof CUE, number>;
type Box = [number, number, number, number];
const BOX = layers as unknown as Record<string, Box>;

/* ---------------------------------------------------------------- poster layers */
const Layer: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => (
  <Img src={staticFile(`img/${name}.png`)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, ...style}} />
);

/** Bright band that travels across a layer, masked to that layer's own pixels (metal / gold shine). */
const Sweep: React.FC<{name: string; p: number; angle?: number; color?: string; strength?: number}> = ({name, p, angle = 105, color = '255,240,200', strength = 0.9}) => {
  if (p <= 0 || p >= 1) return null;
  const pos = -20 + p * 140;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        WebkitMaskImage: `url(${staticFile(`img/${name}.png`)})`,
        WebkitMaskSize: `${W}px ${H}px`,
        background: `linear-gradient(${angle}deg, transparent ${pos - 12}%, rgba(${color},${strength}) ${pos}%, transparent ${pos + 12}%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

/* ---------------------------------------------------------------- atmosphere */
const Fog: React.FC<{opacity: number; speed?: number; tint?: string}> = ({opacity, speed = 1, tint}) => {
  const f = useCurrentFrame();
  const layer = (img: string, size: number, vx: number, vy: number, o: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${staticFile(img)})`,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${f * vx * speed}px ${f * vy * speed}px`,
    opacity: o,
  });
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <div style={layer('img/fog0.png', 1400, 1.1, -0.4, 0.8)} />
      <div style={layer('img/fog1.png', 1000, -1.6, -0.2, 0.6)} />
      {tint && <div style={{position: 'absolute', inset: 0, background: tint, mixBlendMode: 'multiply'}} />}
    </AbsoluteFill>
  );
};

/** Volumetric stage beam from a fixture. */
const Beam: React.FC<{x: number; y: number; angle: number; color: string; on: number; len?: number; spread?: number}> = ({x, y, angle, color, on, len = 1500, spread = 9}) => {
  if (on <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: x - len, top: y, width: len * 2, height: len, transformOrigin: '50% 0%', transform: `rotate(${angle}deg)`, opacity: on, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `polygon(50% 0%, ${50 + spread}% 100%, ${50 - spread}% 100%)`,
          background: `linear-gradient(to bottom, ${color} 0%, transparent 85%)`,
          filter: 'blur(14px)',
        }}
      />
      <div style={{position: 'absolute', left: len - 30, top: -30, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle, #fff 0%, ${color} 35%, transparent 70%)`}} />
    </div>
  );
};

const Rigs: React.FC = () => {
  const f = useCurrentFrame();
  const red = ease(f, F.red, F.red + 12);
  const blue = ease(f, F.blue, F.blue + 12);
  const gold = ease(f, F.gold, F.gold + 10);
  const t = f / FPS;
  const beams: React.ReactNode[] = [];
  // left truss: red, right truss: electric blue (sway slowly, more during the groove)
  const groove = ease(f, F.flash, F.flash + 20);
  for (let i = 0; i < 4; i++) {
    const sway = Math.sin(t * (0.6 + i * 0.13) + i) * (8 + 10 * groove);
    beams.push(<Beam key={`r${i}`} x={40} y={150 + i * 230} angle={-60 + i * 8 + sway} color="rgba(255,40,30,0.32)" on={red * (0.75 + 0.25 * Math.sin(t * 3 + i))} len={1300} />);
    beams.push(<Beam key={`b${i}`} x={1040} y={150 + i * 230} angle={60 - i * 8 - sway} color="rgba(40,120,255,0.32)" on={blue * (0.75 + 0.25 * Math.sin(t * 3.3 + i))} len={1300} />);
  }
  // golden spots sweeping through the dark from the top
  const sweepA = interpolate(f, [F.gold, F.logo + 20], [-55, 25], {...clamp, easing: Easing.inOut(Easing.cubic)}) + Math.sin(t * 0.8) * 10 * groove;
  const sweepB = interpolate(f, [F.gold + 6, F.logo + 26], [55, -25], {...clamp, easing: Easing.inOut(Easing.cubic)}) - Math.sin(t * 0.7) * 10 * groove;
  beams.push(<Beam key="g1" x={300} y={-40} angle={sweepA} color="rgba(255,190,80,0.26)" on={gold * (1 - 0.7 * ease(f, F.artist, F.flash))} len={2000} spread={3.5} />);
  beams.push(<Beam key="g2" x={780} y={-40} angle={sweepB} color="rgba(255,190,80,0.26)" on={gold * (1 - 0.7 * ease(f, F.artist, F.flash))} len={2000} spread={3.5} />);
  return <AbsoluteFill style={{pointerEvents: 'none', opacity: 1 - 0.55 * ease(f, F.flash, F.flash + 30)}}>{beams}</AbsoluteFill>;
};

const Particles: React.FC<{n: number; seed: number; opacity: number}> = ({n, seed, opacity}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(seed * 97 + i * 13.1 + k);
        const life = 120 + r(1) * 140;
        const p = ((f + r(2) * life) % life) / life;
        const x = r(3) * W + Math.sin(f / (25 + r(4) * 30) + r(5) * 6) * 30;
        const y = H * (0.25 + r(6) * 0.8) - p * 500;
        const s = 2 + r(7) * 5;
        const tw = 0.5 + 0.5 * Math.sin(f / (3 + r(8) * 4) + r(9) * 6);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFD27A', opacity: Math.sin(p * Math.PI) * tw, boxShadow: `0 0 ${s * 3}px ${s}px rgba(255,190,80,0.8)`}} />;
      })}
    </AbsoluteFill>
  );
};

const Confetti: React.FC<{n: number; opacity: number}> = ({n, opacity}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, perspective: 800, pointerEvents: 'none'}}>
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: number) => rand(500 + i * 7.7 + k);
        const fall = 0.8 + r(1) * 1.4;
        const y = ((r(2) * H + f * fall * 2.2) % (H + 100)) - 50;
        const x = r(3) * W + Math.sin(f / 20 + r(4) * 6) * 40;
        const s = 10 + r(5) * 14;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: s,
              height: s * 0.7,
              background: `linear-gradient(135deg, #FFE7A3, #E0A030 55%, #8A5A10)`,
              transform: `rotateX(${f * (4 + r(6) * 6)}deg) rotateY(${f * (3 + r(7) * 5)}deg) rotateZ(${r(8) * 360}deg)`,
              opacity: 0.85,
              boxShadow: '0 0 8px rgba(255,200,90,0.6)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Anamorphic lens flare: core, horizontal streak and a few ghosts. */
const Flare: React.FC<{x: number; y: number; at: number; dur?: number; size?: number; color?: string}> = ({x, y, at, dur = 22, size = 1, color = '255,200,120'}) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < -4 || d > dur) return null;
  const o = d < 0 ? (d + 4) / 4 : Math.exp(-d / (dur / 3));
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x - 260 * size, top: y - 260 * size, width: 520 * size, height: 520 * size, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(${color},0.6) 12%, transparent 60%)`}} />
      <div style={{position: 'absolute', left: x - 900 * size, top: y - 6 * size, width: 1800 * size, height: 12 * size, background: `linear-gradient(90deg, transparent, rgba(${color},0.9) 40%, #fff 50%, rgba(${color},0.9) 60%, transparent)`, filter: 'blur(2px)'}} />
      {[0.35, 0.6, 1.3].map((k, i) => {
        const gx = x + (540 - x) * k * 2;
        const gy = y + (960 - y) * k * 2;
        const r = (40 + i * 30) * size;
        return <div key={i} style={{position: 'absolute', left: gx - r, top: gy - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `2px solid rgba(${color},0.25)`, background: `radial-gradient(circle, rgba(${color},0.12), transparent 70%)`}} />;
      })}
    </AbsoluteFill>
  );
};

const Flash: React.FC<{at: number; color?: string; peak?: number; dur?: number}> = ({at, color = '255,235,190', peak = 0.85, dur = 12}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 3, at, at + dur], [0, peak, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(${color},1), rgba(${color},0.6) 60%)`, opacity: o, mixBlendMode: 'screen'}} />;
};

/* ---------------------------------------------------------------- reveals */
const clipLR = (p: number) => `inset(0 ${(1 - p) * 100}% 0 0)`;
const clipCenter = (p: number) => `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`;

const TextLine: React.FC<{name: string; at: number; mode: 'lr' | 'center' | 'rise' | 'pop'; sweep?: boolean}> = ({name, at, mode, sweep = true}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + (mode === 'lr' ? 16 : 12), Easing.out(Easing.quad));
  if (p <= 0) return null;
  const st: React.CSSProperties = {};
  if (mode === 'lr') st.clipPath = clipLR(p);
  if (mode === 'center') st.clipPath = clipCenter(p);
  const b = BOX[name];
  const cy = (b[1] + b[3]) / 2;
  if (mode === 'rise') {
    st.opacity = p;
    st.transform = `translateY(${(1 - p) * 26}px)`;
    st.filter = `blur(${(1 - p) * 6}px)`;
  }
  if (mode === 'pop') {
    st.opacity = Math.min(1, p * 2);
    st.transform = `scale(${1.12 - 0.12 * p})`;
    st.transformOrigin = `540px ${cy}px`;
  }
  const glow = Math.max(0, 1 - (f - at) / 14);
  return (
    <AbsoluteFill style={st}>
      <Layer name={name} style={{filter: `brightness(${1 + glow * 0.9})`}} />
      {sweep && <Sweep name={name} p={ease(f, at + 2, at + 26, Easing.inOut(Easing.quad))} />}
      {mode === 'lr' && p < 1 && (
        <div style={{position: 'absolute', left: b[0] + (b[2] - b[0]) * p - 40, top: b[1] - 10, width: 80, height: b[3] - b[1] + 20, background: 'radial-gradient(ellipse, rgba(255,240,200,0.9), transparent 70%)', mixBlendMode: 'screen'}} />
      )}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- composition */
export const Akai: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // camera: slow dolly-in during the build, settles back to the exact poster framing for the hold
  const push = interpolate(f, [0, F.final - 6], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const settle = ease(f, F.final - 6, F.final + 14, Easing.inOut(Easing.cubic));
  const zoom = 0.06 * push * (1 - settle);
  const camFg = 1 + zoom;
  const camBg = 1 + zoom * 0.45 + 0.04 * (1 - ease(f, 0, 70)) * (1 - settle);
  const drift = Math.sin(t * 0.5) * 6 * (1 - settle);
  // stage exposure: black -> dim stage -> full when the artist is lit
  const stage = 0.08 + 0.42 * ease(f, 4, 55, Easing.inOut(Easing.quad)) + 0.5 * ease(f, F.artist, F.artist + 40);
  const centerDark = 1 - ease(f, F.artist - 4, F.artist + 30);
  const finalPoster = ease(f, F.final - 4, F.final + 16);

  // artist reveal: amber backlight, head-to-torso wipe, rim light
  const back = ease(f, F.artist - 6, F.artist + 16) * (1 - 0.45 * ease(f, F.flash + 10, F.flash + 40));
  const wipe = ease(f, F.artist + 4, F.artist + 46, Easing.inOut(Easing.cubic));
  const rim = ease(f, F.artist + 10, F.artist + 30) * (1 - 0.5 * ease(f, F.final, F.final + 20));

  // title
  const tp = ease(f, F.temp, F.temp + 14, Easing.out(Easing.back(1.4)));
  const ep = ease(f, F.euro, F.euro + 16, Easing.inOut(Easing.quad));
  const logoP = ease(f, F.logo, F.logo + 22, Easing.out(Easing.cubic));

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {/* ---------------- background stage (parallax: moves less than the foreground) */}
      <AbsoluteFill style={{transform: `scale(${camBg}) translateY(${drift * 0.5}px)`}}>
        <Img src={staticFile('img/plate.jpg')} style={{position: 'absolute', width: W, height: H, filter: `brightness(${stage}) saturate(${0.7 + 0.3 * stage})`}} />
        <Img src={staticFile('img/poster.jpg')} style={{position: 'absolute', width: W, height: H, opacity: finalPoster}} />
        <AbsoluteFill style={{background: `radial-gradient(ellipse 45% 32% at 50% 42%, rgba(0,0,0,${0.75 * centerDark}), transparent 100%)`}} />
        <Rigs />
        {/* amber backlight behind the artist */}
        <AbsoluteFill style={{background: `radial-gradient(ellipse 42% 30% at 50% 36%, rgba(255,170,60,${0.75 * back}), rgba(255,90,20,${0.35 * back}) 45%, transparent 75%)`, mixBlendMode: 'screen'}} />
        {back > 0 && (
          <AbsoluteFill style={{mixBlendMode: 'screen', opacity: back * 0.7}}>
            {new Array(14).fill(0).map((_, i) => (
              <div
                key={i}
                style={{position: 'absolute', left: 540 - 6, top: 650, width: 12, height: 1100, transformOrigin: '50% 0%', transform: `rotate(${i * (360 / 14) + t * 6}deg) scaleY(${0.4 + 0.6 * back})`, background: 'linear-gradient(to bottom, rgba(255,200,110,0.55), transparent 80%)', filter: 'blur(10px)'}}
              />
            ))}
          </AbsoluteFill>
        )}
        <Fog opacity={0.28 - 0.16 * ease(f, F.artist, F.flash) - 0.1 * finalPoster} />
      </AbsoluteFill>

      {/* ---------------- foreground (artist + typography) */}
      <AbsoluteFill style={{transform: `scale(${camFg}) translateY(${drift}px)`}}>
        {/* artist: wipe from the head down, rim light hugging the silhouette */}
        <AbsoluteFill style={{WebkitMaskImage: `linear-gradient(to bottom, #000 ${24 + wipe * 34}%, transparent ${30 + wipe * 34}%)`, transform: `scale(${1.03 - 0.03 * wipe})`, transformOrigin: '540px 760px'}}>
          <Layer name="artist" style={{filter: `brightness(${1 + 0.6 * (1 - wipe)}) drop-shadow(0 0 ${14 * rim}px rgba(255,170,70,${0.9 * rim})) drop-shadow(0 0 ${3 * rim}px rgba(255,230,180,${rim}))`}} />
          <Sweep name="artist" p={ease(f, F.artist + 30, F.artist + 60, Easing.inOut(Easing.quad))} angle={160} strength={0.35} />
        </AbsoluteFill>

        {/* emblem: radial reveal + energy shimmer + pulse ring */}
        {logoP > 0 && (
          <AbsoluteFill>
            <AbsoluteFill style={{WebkitMaskImage: `radial-gradient(circle at 539px 110px, #000 ${logoP * 165}px, transparent ${logoP * 165 + 30}px)`}}>
              <Layer name="logo" style={{filter: `brightness(${1 + 1.2 * (1 - logoP) + 0.15 * Math.sin(t * 4)})`}} />
              <Sweep name="logo" p={ease(f, F.logo + 10, F.logo + 34)} angle={120} strength={0.8} />
            </AbsoluteFill>
            {(() => {
              const d = f - F.logo - 8;
              if (d < 0 || d > 30) return null;
              const r = 90 + d * 5;
              return <div style={{position: 'absolute', left: 539 - r, top: 110 - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `3px solid rgba(255,210,120,${0.7 * (1 - d / 30)})`, boxShadow: '0 0 20px rgba(255,190,80,0.6)'}} />;
            })()}
          </AbsoluteFill>
        )}

        <TextLine name="t_akai" at={F.akai} mode="lr" />
        <TextLine name="t_live" at={F.live} mode="pop" />
        <TextLine name="t_date" at={F.date} mode="center" />

        {/* TEMPERATURA: emerges forward from depth */}
        {tp > 0 && (
          <AbsoluteFill style={{opacity: Math.min(1, tp * 2.2), transform: `scale(${0.72 + 0.28 * tp})`, transformOrigin: '540px 1060px', filter: `blur(${(1 - Math.min(1, tp)) * 10}px) brightness(${1 + 0.8 * Math.max(0, 1 - (f - F.temp) / 12)})`}}>
            <Layer name="t_temp" />
            <Sweep name="t_temp" p={ease(f, F.temp + 6, F.temp + 30, Easing.inOut(Easing.quad))} angle={100} />
          </AbsoluteFill>
        )}
        {/* EUROPEA: diagonal light sweep reveal */}
        {ep > 0 && (
          <AbsoluteFill style={{clipPath: `polygon(0 0, ${ep * 140 - 20}% 0, ${ep * 140 - 40}% 100%, 0 100%)`}}>
            <Layer name="t_euro" style={{filter: `brightness(${1 + 0.7 * Math.max(0, 1 - (f - F.euro) / 16)})`}} />
            <Sweep name="t_euro" p={ease(f, F.euro, F.euro + 22, Easing.inOut(Easing.quad))} angle={65} strength={1} />
          </AbsoluteFill>
        )}
        <TextLine name="t_moskva" at={F.moskva} mode="rise" />
        <TextLine name="t_dates" at={F.dates} mode="rise" />
        <TextLine name="t_inv1" at={F.inv1} mode="lr" />
        <TextLine name="t_inv2" at={F.inv2} mode="lr" />
        <TextLine name="t_inv3" at={F.inv3} mode="pop" />
        <TextLine name="t_inv4" at={F.inv4} mode="lr" />
      </AbsoluteFill>

      {/* ---------------- light & particles in front */}
      <Particles n={70} seed={3} opacity={ease(f, 20, 60)} />
      <Confetti n={26} opacity={ease(f, 30, 70) * (1 - 0.4 * ease(f, F.final, F.final + 20))} />
      <Flare x={180} y={300} at={F.red} size={0.6} color="255,80,60" />
      <Flare x={900} y={300} at={F.blue} size={0.6} color="80,150,255" />
      <Flare x={539} y={110} at={F.logo + 6} size={0.8} />
      <Flare x={540} y={380} at={F.live} size={0.9} />
      <Flare x={540} y={640} at={F.artist + 10} size={1.2} dur={30} />
      <Flare x={540} y={1060} at={F.temp} size={1.3} dur={26} />
      <Flare x={960} y={1220} at={F.euro + 10} size={0.8} color="120,190,255" />
      <Flare x={540} y={1720} at={F.inv3} size={0.7} />
      <Flash at={F.flash} peak={0.9} dur={14} />
      <Flash at={F.final} peak={0.35} dur={16} />
      {/* subtle floor reflection shimmer */}
      <AbsoluteFill style={{background: `linear-gradient(to top, rgba(255,150,60,${0.08 + 0.05 * Math.sin(t * 5)}), transparent 18%)`, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 65% at 50% 50%, transparent 60%, rgba(0,0,0,${0.45 * (1 - settle)}) 100%)`}} />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => <Composition id="Akai" component={Akai} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />;
