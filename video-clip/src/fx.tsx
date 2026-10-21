import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

export const C = {
  bg: "#060408",
  wine: "#3a0a14",
  crimson: "#e0263f",
  gold: "#e9c27a",
  goldLight: "#fff1cf",
  goldDeep: "#a8702e",
  cream: "#f5ebdd",
  muted: "rgba(245,235,221,0.62)",
};

export const F = {
  serif: "'Playfair Display', serif",
  sans: "Montserrat, sans-serif",
  elegant: "'Cormorant Garamond', serif",
};

export const ease = Easing.bezier(0.16, 1, 0.3, 1); // expo-out feel
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 progress over [start, start+dur] seconds, eased. */
export const useProgress = (start: number, dur: number, e = ease) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return interpolate(frame / fps, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });
};

export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const goldText: React.CSSProperties = {
  background: `linear-gradient(180deg, ${C.goldLight} 0%, ${C.gold} 45%, ${C.goldDeep} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: C.gold,
};

/** Text that rises out of blur, word by word. */
export const BlurWords: React.FC<{
  text: string;
  at: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: (w: string, i: number) => React.CSSProperties | undefined;
}> = ({ text, at, stagger = 0.08, style, wordStyle }) => {
  const t = useTime();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.28em", ...style }}>
      {words.map((w, i) => {
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
              opacity: p,
              transform: `translateY(${(1 - p) * 50}px) scale(${1 + (1 - p) * 0.15})`,
              filter: `blur(${(1 - p) * 18}px)`,
              ...wordStyle?.(w, i),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Letters that drop in one by one, with a chromatic split while moving. */
export const Letters: React.FC<{ text: string; at: number; stagger?: number; style?: React.CSSProperties; gold?: boolean }> = ({
  text,
  at,
  stagger = 0.045,
  style,
  gold,
}) => {
  const t = useTime();
  return (
    <div style={{ display: "flex", justifyContent: "center", whiteSpace: "pre", ...style }}>
      {text.split("").map((ch, i) => {
        const p = interpolate(t, [at + i * stagger, at + i * stagger + 0.8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });
        const split = (1 - p) * 14;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 80}px) rotateX(${(1 - p) * 70}deg)`,
              filter: `blur(${(1 - p) * 14}px)`,
              textShadow: gold ? undefined : `${split}px 0 rgba(255,40,80,0.7), ${-split}px 0 rgba(60,200,255,0.6)`,
              ...(gold ? goldText : null),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Horizontal mask wipe reveal. */
export const Wipe: React.FC<{ at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  dur = 0.9,
  children,
  style,
}) => {
  const p = useProgress(at, dur);
  return (
    <div style={{ clipPath: `inset(-20% ${100 - p * 100}% -20% 0)`, ...style }}>
      <div style={{ transform: `translateX(${(1 - p) * -40}px)` }}>{children}</div>
    </div>
  );
};

export const GoldLine: React.FC<{ at: number; width?: number; style?: React.CSSProperties }> = ({ at, width = 640, style }) => {
  const p = useProgress(at, 1.1, easeInOut);
  return (
    <div
      style={{
        width,
        height: 2,
        margin: "0 auto",
        transform: `scaleX(${p})`,
        background: `linear-gradient(90deg, transparent, ${C.gold} 20%, ${C.goldLight} 50%, ${C.gold} 80%, transparent)`,
        boxShadow: `0 0 18px rgba(233,194,122,${0.6 * p})`,
        ...style,
      }}
    />
  );
};

/** Moving specular sweep on top of gold text/blocks. */
export const Shimmer: React.FC<{ at: number; period?: number }> = ({ at, period = 2.6 }) => {
  const t = useTime();
  const local = ((t - at) % period) / period;
  if (t < at) return null;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(105deg, transparent ${local * 140 - 30}%, rgba(255,255,255,0.55) ${local * 140 - 20}%, transparent ${local * 140 - 10}%)`,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

// ---------- Global atmosphere ----------

export const Atmosphere: React.FC<{ hue: number }> = ({ hue }) => {
  const t = useTime();
  const lx = 50 + Math.sin(t * 0.35) * 30;
  const ly = 35 + Math.cos(t * 0.27) * 15;
  const rx = 50 + Math.cos(t * 0.31) * 35;
  const ry = 72 + Math.sin(t * 0.22) * 12;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 45% at 50% 45%, hsla(${hue},70%,22%,0.9), hsla(${hue},70%,8%,0.4) 60%, transparent 85%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 28% at ${lx}% ${ly}%, rgba(255,120,70,0.32), transparent 70%)`,
          mixBlendMode: "screen",
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(45% 30% at ${rx}% ${ry}%, rgba(233,194,122,0.22), transparent 70%)`,
          mixBlendMode: "screen",
          filter: "blur(50px)",
        }}
      />
      <Bokeh />
    </AbsoluteFill>
  );
};

const BOKEH = new Array(34).fill(0).map((_, i) => ({
  x: random(`bx${i}`) * 1080,
  y: random(`by${i}`) * 1920,
  s: 14 + random(`bs${i}`) * 80,
  speed: 10 + random(`bv${i}`) * 40,
  blur: 2 + random(`bb${i}`) * 12,
  warm: random(`bw${i}`) > 0.45,
  phase: random(`bp${i}`) * Math.PI * 2,
}));

const Bokeh: React.FC = () => {
  const t = useTime();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {BOKEH.map((b, i) => {
        const y = (((b.y - t * b.speed) % 2100) + 2100) % 2100 - 90;
        const x = b.x + Math.sin(t * 0.5 + b.phase) * 30;
        const o = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 0.9 + b.phase));
        const col = b.warm ? "255,206,140" : "255,80,105";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: b.s,
              height: b.s,
              borderRadius: "50%",
              opacity: o,
              filter: `blur(${b.blur}px)`,
              background: `radial-gradient(circle, rgba(${col},0.9), rgba(${col},0.08) 70%)`,
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
    <AbsoluteFill style={{ opacity: 0.12, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 24} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{ background: "radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.82) 100%)", pointerEvents: "none" }}
  />
);

/** Camera viewfinder: corners, REC dot and running timecode. */
export const Viewfinder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = Math.floor(frame / fps);
  const tc = `00:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(frame % fps).padStart(2, "0")}`;
  const corner = (pos: React.CSSProperties, bw: string): React.CSSProperties => ({
    position: "absolute",
    width: 80,
    height: 80,
    borderColor: "rgba(245,235,221,0.4)",
    borderStyle: "solid",
    borderWidth: bw,
    ...pos,
  });
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={corner({ left: 60, top: 140 }, "3px 0 0 3px")} />
      <div style={corner({ right: 60, top: 140 }, "3px 3px 0 0")} />
      <div style={corner({ left: 60, bottom: 140 }, "0 0 3px 3px")} />
      <div style={corner({ right: 60, bottom: 140 }, "0 3px 3px 0")} />
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 180,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: "0.2em",
          color: "rgba(245,235,221,0.7)",
        }}
      >
        <i
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: C.crimson,
            boxShadow: `0 0 16px ${C.crimson}`,
            opacity: blink ? 1 : 0.2,
            display: "block",
          }}
        />
        REC
      </div>
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 182,
          fontFamily: F.sans,
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: "0.12em",
          color: "rgba(245,235,221,0.55)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {tc}
      </div>
      <div
        style={{
          position: "absolute",
          right: 100,
          bottom: 180,
          fontFamily: F.sans,
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: "0.2em",
          color: "rgba(245,235,221,0.45)",
        }}
      >
        4K · 24FPS
      </div>
    </AbsoluteFill>
  );
};

/** Vertical film strip that scrolls endlessly. */
export const FilmStrip: React.FC<{ x: number; speed?: number; opacity?: number }> = ({ x, speed = 120, opacity = 0.35 }) => {
  const t = useTime();
  const off = (t * speed) % 120;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: -120,
        width: 110,
        height: 2160,
        opacity,
        transform: `translateY(${off}px)`,
        background: "rgba(10,6,8,0.85)",
        borderLeft: "1px solid rgba(233,194,122,0.3)",
        borderRight: "1px solid rgba(233,194,122,0.3)",
      }}
    >
      {new Array(18).fill(0).map((_, i) => (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: 8, top: i * 120 + 20, width: 14, height: 22, borderRadius: 3, background: "rgba(245,235,221,0.5)" }} />
          <div style={{ position: "absolute", right: 8, top: i * 120 + 20, width: 14, height: 22, borderRadius: 3, background: "rgba(245,235,221,0.5)" }} />
          <div
            style={{
              position: "absolute",
              left: 30,
              top: i * 120 + 8,
              width: 50,
              height: 100,
              borderRadius: 4,
              background: `linear-gradient(160deg, rgba(224,38,63,${0.15 + (i % 3) * 0.1}), rgba(233,194,122,0.12))`,
            }}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

/** Bright light burst used as a cut between scenes. */
export const Flash: React.FC<{ at: number; peak?: number }> = ({ at, peak = 0.55 }) => {
  const t = useTime();
  const o = interpolate(t, [at - 0.12, at, at + 0.45], [0, peak, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: o,
        mixBlendMode: "screen",
        background: "radial-gradient(circle at 50% 50%, #fff7ea, #ffc994 45%, rgba(255,110,80,0.6) 75%, transparent)",
        pointerEvents: "none",
      }}
    />
  );
};

/** Sparks drifting out from a point. */
export const Sparks: React.FC<{ at: number; cx: number; cy: number; count?: number }> = ({ at, cx, cy, count = 40 }) => {
  const t = useTime();
  if (t < at) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const life = 1.8 + random(`sl${i}`) * 1.6;
        const local = ((t - at - random(`sd${i}`) * 2) % life + life) % life;
        const a = random(`sa${i}`) * Math.PI * 2;
        const dist = 60 + local * (90 + random(`sv${i}`) * 140);
        const o = interpolate(local, [0, 0.2, life], [0, 1, 0]);
        const s = 3 + random(`ss${i}`) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * dist,
              top: cy + Math.sin(a) * dist - local * 40,
              width: s,
              height: s,
              borderRadius: "50%",
              opacity: o,
              background: i % 3 ? C.gold : C.crimson,
              boxShadow: `0 0 ${s * 3}px ${i % 3 ? C.gold : C.crimson}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
