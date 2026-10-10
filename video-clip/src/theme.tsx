import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { useSceneFrame, useToActual } from "./timing";

export const C = {
  bg: "#07040d",
  pink: "#ff2e88",
  gold: "#ffc94d",
  cyan: "#4de8ff",
  violet: "#8b5cff",
  white: "#fff8f2",
  dim: "rgba(255,248,242,0.62)",
};

export const HEAD = "Unbounded, 'Noto Color Emoji', sans-serif";
export const BODY = "Montserrat, 'Noto Color Emoji', sans-serif";

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 0→1 spring that starts at `delay` frames. */
export const useIn = (delay: number, damping = 14, stiffness = 120) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness } });
};

/** 1→0 fade used to clear a group before the next beat of a scene. */
export const useOut = (start: number, len = 12) => {
  const frame = useSceneFrame();
  return interpolate(frame, [start, start + len], [1, 0], clamp);
};

type RevealProps = {
  delay: number;
  children: React.ReactNode;
  from?: "bottom" | "top" | "left" | "right" | "scale" | "blur";
  style?: React.CSSProperties;
  distance?: number;
};

export const Reveal: React.FC<RevealProps> = ({
  delay,
  children,
  from = "bottom",
  style,
  distance = 80,
}) => {
  const frame = useSceneFrame();
  const p = useIn(delay);
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], clamp);
  const d = (1 - p) * distance;
  const translate =
    from === "bottom"
      ? `0px ${d}px`
      : from === "top"
        ? `0px ${-d}px`
        : from === "left"
          ? `${-d}px 0px`
          : from === "right"
            ? `${d}px 0px`
            : "0px 0px";
  return (
    <div
      style={{
        opacity,
        translate,
        scale: from === "scale" ? String(0.4 + 0.6 * p) : undefined,
        filter: from === "blur" ? `blur(${(1 - p) * 24}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Kinetic typography: each word springs in after the previous one. */
export const Words: React.FC<{
  text: string;
  delay: number;
  stagger?: number;
  style?: React.CSSProperties;
  highlight?: string[];
  highlightColor?: string;
}> = ({ text, delay, stagger = 3, style, highlight = [], highlightColor = C.gold }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: "0.28em",
        ...style,
      }}
    >
      {words.map((w, i) => {
        const start = delay + i * stagger;
        const p = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 140 } });
        const hl = highlight.some((h) => w.toLowerCase().includes(h.toLowerCase()));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(frame, [start, start + 6], [0, 1], clamp),
              translate: `0px ${(1 - p) * 50}px`,
              rotate: `${(1 - p) * 8}deg`,
              color: hl ? highlightColor : undefined,
              textShadow: hl ? `0 0 30px ${highlightColor}88` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Big "ШАГ N" header used by every step scene. */
export const StepBadge: React.FC<{ n: number; title: string; color?: string }> = ({
  n,
  title,
  color = C.pink,
}) => {
  const frame = useSceneFrame();
  const p = useIn(0, 13, 110);
  const sweep = interpolate(frame, [8, 40], [-120, 120], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 130,
        left: 80,
        right: 80,
        display: "flex",
        alignItems: "center",
        gap: 28,
      }}
    >
      <div
        style={{
          fontFamily: HEAD,
          fontWeight: 900,
          fontSize: 160,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `4px ${color}`,
          textShadow: `0 0 40px ${color}66`,
          scale: String(0.3 + 0.7 * p),
          rotate: `${(1 - p) * -25}deg`,
          opacity: p,
        }}
      >
        {String(n).padStart(2, "0")}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: 38,
            letterSpacing: 10,
            color,
            opacity: interpolate(frame, [6, 14], [0, 1], clamp),
            translate: `${(1 - useIn(6)) * -60}px 0px`,
          }}
        >
          ШАГ {n}
        </div>
        <div
          style={{
            position: "relative",
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 46,
            lineHeight: 1.18,
            color: C.white,
            marginTop: 10,
            translate: `${(1 - useIn(10)) * 300}px 0px`,
            opacity: interpolate(frame, [10, 18], [0, 1], clamp),
          }}
        >
          {title}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)`,
              translate: `${sweep}% 0px`,
              mixBlendMode: "overlay",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}> = ({ children, style, accent = C.pink }) => (
  <div
    style={{
      background: "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
      border: `2px solid ${accent}66`,
      borderRadius: 36,
      boxShadow: `0 20px 60px rgba(0,0,0,0.45), inset 0 0 40px ${accent}22, 0 0 50px ${accent}33`,
      backdropFilter: "blur(10px)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Sound effect helper — keeps every SFX one line in the scenes. */
export const Sfx: React.FC<{ name: string; at: number; volume?: number }> = ({
  name,
  at,
  volume = 0.8,
}) => {
  const { fps } = useVideoConfig();
  const toActual = useToActual();
  return (
    <Audio
      name={name}
      src={staticFile(`sfx/${name}.wav`)}
      from={toActual(at)}
      volume={volume}
      premountFor={fps}
    />
  );
};

/** Animated cinematic background shared by the whole video. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const blobs = [
    { c: C.pink, x: 0.2, y: 0.25, r: 700, s: 0.011 },
    { c: C.violet, x: 0.85, y: 0.55, r: 800, s: 0.008 },
    { c: C.cyan, x: 0.3, y: 0.85, r: 600, s: 0.013 },
    { c: C.gold, x: 0.75, y: 0.1, r: 450, s: 0.009 },
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1c0b2e 0%, ${C.bg} 70%)` }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.r,
            height: b.r,
            borderRadius: "50%",
            left: b.x * width - b.r / 2 + Math.sin(frame * b.s + i) * 160,
            top: b.y * height - b.r / 2 + Math.cos(frame * b.s * 1.3 + i * 2) * 200,
            background: `radial-gradient(circle, ${b.c}55 0%, transparent 65%)`,
            filter: "blur(40px)",
          }}
        />
      ))}
      {new Array(45).fill(0).map((_, i) => {
        const x = random(`x${i}`) * width;
        const speed = 0.4 + random(`s${i}`) * 1.4;
        const size = 4 + random(`r${i}`) * 22;
        const y = (((random(`y${i}`) * height - frame * speed) % height) + height) % height;
        const tw = 0.25 + 0.35 * Math.sin(frame * 0.05 + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: [C.gold, C.pink, C.white, C.cyan][i % 4],
              opacity: tw * (size > 18 ? 0.35 : 0.8),
              filter: size > 18 ? "blur(6px)" : "blur(1px)",
              boxShadow: `0 0 ${size}px ${[C.gold, C.pink, C.white, C.cyan][i % 4]}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Film grain + vignette + subtle flicker laid over everything. */
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 6;
  const flicker = 0.035 + random(`f${frame}`) * 0.03;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.13, mixBlendMode: "overlay" }}>
        <filter id={`grain${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
      </svg>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <AbsoluteFill style={{ background: "white", opacity: flicker * 0.4 }} />
    </AbsoluteFill>
  );
};

/** White flash that peaks at `at`. */
export const Flash: React.FC<{ at: number; len?: number; color?: string; max?: number }> = ({
  at,
  len = 14,
  color = "white",
  max = 0.85,
}) => {
  const frame = useSceneFrame();
  const o = interpolate(frame, [at - 2, at, at + len], [0, max, 0], clamp);
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen" }} />;
};

/** Animated strike-through line for "не просто…" statements. */
export const Strike: React.FC<{ at: number; color?: string }> = ({ at, color = C.pink }) => {
  const frame = useSceneFrame();
  const w = interpolate(frame, [at, at + 10], [0, 104], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: "-2%",
        top: "50%",
        height: 10,
        width: `${w}%`,
        background: color,
        borderRadius: 6,
        rotate: "-3deg",
        boxShadow: `0 0 20px ${color}`,
      }}
    />
  );
};
