import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

export const C = {
  bg: "#070204",
  blood: "#d1121f",
  red: "#ff2a3a",
  ember: "#ff7a1a",
  orange: "#ff8c1a",
  gold: "#f0c060",
  goldLight: "#fff0c4",
  goldDeep: "#9a5a1c",
  cream: "#f4e8dc",
  muted: "rgba(244,232,220,0.66)",
  violet: "#b06cff",
};

export const F = {
  oswald: "Oswald, sans-serif",
  script: "'Marck Script', cursive",
  sc: "'Playfair Display SC', serif",
  cinzel: "'Cinzel Decorative', serif",
  creep: "Creepster, cursive",
  garamond: "'Cormorant Garamond', serif",
};

export const BPM = 120;
export const BEAT = 60 / BPM;

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const useProgress = (start: number, dur: number, e = ease) => {
  const t = useTime();
  return interpolate(t, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const goldText: React.CSSProperties = {
  background: `linear-gradient(180deg, ${C.goldLight} 0%, ${C.gold} 42%, ${C.goldDeep} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: C.gold,
};

export const fireText: React.CSSProperties = {
  background: "linear-gradient(0deg, #ff2a10 0%, #ff8c1a 45%, #ffe39a 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: C.orange,
};

/** Decaying camera shake started at `at` seconds. */
export const useShake = (hits: number[], amp = 18) => {
  const t = useTime();
  let x = 0;
  let y = 0;
  hits.forEach((h, i) => {
    const d = t - h;
    if (d < 0 || d > 0.5) return;
    const k = Math.exp(-d * 9) * amp;
    x += Math.sin(d * 90 + i) * k;
    y += Math.cos(d * 77 + i * 2) * k;
  });
  return `translate(${x}px, ${y}px)`;
};

/** Word that slams in from huge scale with motion blur and an RGB split. */
export const Slam: React.FC<{ text: string; at: number; style?: React.CSSProperties; textStyle?: React.CSSProperties }> = ({
  text,
  at,
  style,
  textStyle,
}) => {
  const t = useTime();
  const p = interpolate(t, [at, at + 0.28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const split = interpolate(t, [at, at + 0.4], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (t < at - 0.01) return <div style={{ ...style, opacity: 0 }}>{text}</div>;
  return (
    <div
      style={{
        position: "relative",
        transform: `scale(${3.2 - p * 2.2})`,
        opacity: p,
        filter: `blur(${(1 - p) * 16}px)`,
        ...style,
      }}
    >
      <span style={{ position: "absolute", inset: 0, transform: `translateX(${split}px)`, color: "rgba(255,0,60,0.6)", mixBlendMode: "screen" }}>
        {text}
      </span>
      <span style={{ position: "absolute", inset: 0, transform: `translateX(${-split}px)`, color: "rgba(0,200,255,0.5)", mixBlendMode: "screen" }}>
        {text}
      </span>
      <span style={{ position: "relative", ...textStyle }}>{text}</span>
    </div>
  );
};

/** Letters flipping up in 3D one by one. */
export const Flip3D: React.FC<{ text: string; at: number; stagger?: number; style?: React.CSSProperties; letter?: React.CSSProperties }> = ({
  text,
  at,
  stagger = 0.05,
  style,
  letter,
}) => {
  const t = useTime();
  return (
    <div style={{ display: "flex", justifyContent: "center", whiteSpace: "pre", perspective: 900, ...style }}>
      {text.split("").map((ch, i) => {
        const p = interpolate(t, [at + i * stagger, at + i * stagger + 0.7], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: clamp01(p * 2),
              transform: `translateZ(${(1 - p) * -600}px) translateY(${(1 - p) * 120}px) rotateX(${(1 - p) * -100}deg)`,
              filter: `blur(${(1 - p) * 10}px)`,
              ...letter,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const Rise: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number }> = ({
  at,
  children,
  style,
  dist = 60,
}) => {
  const p = useProgress(at, 0.7);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * dist}px)`, filter: `blur(${(1 - p) * 12}px)`, ...style }}>{children}</div>
  );
};

export const Shimmer: React.FC<{ at: number; period?: number }> = ({ at, period = 2.4 }) => {
  const t = useTime();
  if (t < at) return null;
  const l = (((t - at) % period) / period) * 160 - 30;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(105deg, transparent ${l - 10}%, rgba(255,255,255,0.6) ${l}%, transparent ${l + 10}%)`,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

// ---------------- Atmosphere ----------------

export const Background: React.FC = () => {
  const t = useTime();
  const beat = Math.exp(-((t % BEAT) / BEAT) * 5); // decays every beat
  const fx = 50 + Math.sin(t * 0.4) * 25;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(80% 50% at ${fx}% 45%, rgba(130,10,24,${0.75 + beat * 0.12}), rgba(40,3,10,0.6) 55%, transparent 85%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(60% 30% at 50% 100%, rgba(255,110,30,0.28), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <Fog />
      <Embers />
    </AbsoluteFill>
  );
};

const Fog: React.FC = () => {
  const t = useTime();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.7 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -500 + Math.sin(t * 0.2 + i * 2) * 300 + ((t * (30 + i * 15)) % 600),
            top: 1250 + i * 180 - 700 * (i === 2 ? 1 : 0),
            width: 2000,
            height: 650,
            borderRadius: "50%",
            filter: "blur(80px)",
            background: `radial-gradient(ellipse, rgba(${i === 1 ? "200,70,80" : "160,120,140"},0.28), transparent 65%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const EMBERS = new Array(60).fill(0).map((_, i) => ({
  x: random(`ex${i}`) * 1080,
  speed: 60 + random(`ev${i}`) * 160,
  size: 2 + random(`es${i}`) * 6,
  sway: 20 + random(`ew${i}`) * 60,
  ph: random(`ep${i}`) * 10,
  life: 4 + random(`el${i}`) * 6,
}));

export const Embers: React.FC<{ boost?: number }> = ({ boost = 1 }) => {
  const t = useTime();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {EMBERS.map((e, i) => {
        const local = (t + e.ph) % e.life;
        const y = 2000 - local * e.speed;
        const o = interpolate(local, [0, 0.5, e.life * 0.7, e.life], [0, 1, 0.6, 0]) * boost;
        const col = i % 4 === 0 ? "255,220,140" : "255,110,30";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: e.x + Math.sin(local * 1.7 + e.ph) * e.sway,
              top: y,
              width: e.size,
              height: e.size,
              borderRadius: "50%",
              opacity: Math.min(1, o),
              background: `rgb(${col})`,
              boxShadow: `0 0 ${e.size * 3}px rgba(${col},0.9)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.13, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 24} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => {
  const t = useTime();
  const beat = Math.exp(-((t % BEAT) / BEAT) * 6);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, transparent ${44 - beat * 4}%, rgba(0,0,0,0.88) 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};

/** Spider webs that draw themselves in the top corners. */
export const Webs: React.FC = () => {
  const t = useTime();
  const p = clamp01((t - 4.3) / 1.6);
  const web = (flip: boolean) => {
    const spokes = [0, 15, 30, 45, 60, 75, 90];
    const rings = [60, 120, 190, 260];
    return (
      <svg
        width="340"
        height="340"
        viewBox="0 0 300 300"
        style={{ position: "absolute", top: 0, [flip ? "right" : "left"]: 0, transform: flip ? "scaleX(-1)" : undefined, opacity: 0.5 }}
      >
        {spokes.map((a) => {
          const r = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={0}
              y1={0}
              x2={Math.cos(r) * 300}
              y2={Math.sin(r) * 300}
              stroke="#e8dcd0"
              strokeWidth={1}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
            />
          );
        })}
        {rings.map((rr, j) => {
          const d = spokes
            .map((a, k) => {
              const r = (a * Math.PI) / 180;
              const x = Math.cos(r) * rr;
              const y = Math.sin(r) * rr;
              if (k === 0) return `M${x} ${y}`;
              const pr = ((a - 7.5) * Math.PI) / 180;
              return `Q${Math.cos(pr) * rr * 0.86} ${Math.sin(pr) * rr * 0.86} ${x} ${y}`;
            })
            .join(" ");
          return (
            <path
              key={rr}
              d={d}
              fill="none"
              stroke="#e8dcd0"
              strokeWidth={1}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - clamp01(p * 2 - j * 0.25)}
            />
          );
        })}
      </svg>
    );
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {web(false)}
      {web(true)}
    </AbsoluteFill>
  );
};

export const BAT_PATH =
  "M60 30 C52 18 40 10 22 8 C28 16 28 22 22 28 C14 24 6 26 0 32 C14 32 24 38 30 48 C38 40 50 38 60 44 C70 38 82 40 90 48 C96 38 106 32 120 32 C114 26 106 24 98 28 C92 22 92 16 98 8 C80 10 68 18 60 30 Z";

export const Bat: React.FC<{ x: number; y: number; size: number; flap: number; opacity?: number }> = ({ x, y, size, flap, opacity = 1 }) => (
  <svg
    viewBox="0 0 120 60"
    width={size}
    height={size / 2}
    style={{ position: "absolute", left: x - size / 2, top: y - size / 4, opacity, transform: `scaleY(${0.3 + 0.7 * Math.abs(Math.sin(flap))})`, overflow: "visible" }}
  >
    <path d={BAT_PATH} fill="#080305" stroke="rgba(255,50,50,0.6)" strokeWidth={1.4} />
  </svg>
);

/** Bats crossing the frame in the background now and then. */
export const AmbientBats: React.FC = () => {
  const t = useTime();
  const flights = [5.2, 14.5, 24, 30.5];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {flights.flatMap((start, f) =>
        new Array(5).fill(0).map((_, i) => {
          const local = t - start - i * 0.12;
          if (local < 0 || local > 3) return null;
          const dir = f % 2 ? -1 : 1;
          const x = 540 + dir * (-800 + local * 600) + i * 40 * dir;
          const y = 300 + f * 90 + Math.sin(local * 3 + i) * 50 + i * 30;
          return <Bat key={`${f}-${i}`} x={x} y={y} size={50 + (i % 3) * 20} flap={local * 22 + i} opacity={0.75} />;
        }),
      )}
    </AbsoluteFill>
  );
};

/** Burst of sparks from a point at time `at`. */
export const Burst: React.FC<{ at: number; cx: number; cy: number; count?: number; color?: string }> = ({
  at,
  cx,
  cy,
  count = 36,
  color = C.ember,
}) => {
  const t = useTime();
  const d = t - at;
  if (d < 0 || d > 1.4) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const a = random(`ba${at}${i}`) * Math.PI * 2;
        const v = 300 + random(`bv${at}${i}`) * 900;
        const dist = v * (1 - Math.exp(-d * 3)) / 3;
        const s = 3 + random(`bs${at}${i}`) * 7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * dist,
              top: cy + Math.sin(a) * dist + d * d * 160,
              width: s,
              height: s,
              borderRadius: "50%",
              background: i % 3 ? color : C.goldLight,
              boxShadow: `0 0 ${s * 3}px ${color}`,
              opacity: 1 - d / 1.4,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Expanding shockwave ring. */
export const Shockwave: React.FC<{ at: number; cx?: number; cy?: number; color?: string }> = ({ at, cx = 540, cy = 960, color = C.red }) => {
  const t = useTime();
  const d = t - at;
  if (d < 0 || d > 0.8) return null;
  const r = 40 + d * 1800;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `${10 * (1 - d / 0.8)}px solid ${color}`,
        boxShadow: `0 0 60px ${color}, inset 0 0 60px ${color}`,
        opacity: 1 - d / 0.8,
        pointerEvents: "none",
      }}
    />
  );
};
