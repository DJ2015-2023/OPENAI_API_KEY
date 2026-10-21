import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, random, staticFile } from "remotion";
import { AmbientBats, Background, Bat, Grain, Vignette, Webs, useTime } from "./fx";
import { DateTime, Dress, Location, Passion, Poster, Prices, Title } from "./scenes";
import { CUT, FPS, SCENES } from "./timeline";

const COMPONENTS: Record<string, React.FC<{ dur: number }>> = {
  title: Title,
  passion: Passion,
  date: DateTime,
  dress: Dress,
  prices: Prices,
  location: Location,
  poster: Poster,
};

const Flash: React.FC<{ at: number; color?: string; peak?: number }> = ({ at, color = "#ffd9c0", peak = 0.7 }) => {
  const t = useTime();
  const o = interpolate(t, [at - 0.08, at, at + 0.35], [0, peak, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Horizontal tearing bars around a glitch cut. */
const GlitchBars: React.FC<{ at: number }> = ({ at }) => {
  const t = useTime();
  const d = t - at;
  if (d < -0.2 || d > 0.3) return null;
  const f = Math.floor(t * 30);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {new Array(9).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (random(`gx${f}${i}`) - 0.5) * 200,
            top: random(`gy${f}${i}`) * 1920,
            width: 1300,
            height: 8 + random(`gh${f}${i}`) * 70,
            background: i % 3 === 0 ? "rgba(0,220,255,0.45)" : i % 3 === 1 ? "rgba(255,20,60,0.5)" : "rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Swarm of bats that blacks out the frame for a cut. */
const BatSwarm: React.FC<{ at: number }> = ({ at }) => {
  const t = useTime();
  const d = t - at;
  if (d < -0.7 || d > 0.8) return null;
  const k = (d + 0.7) / 1.5; // 0..1 through the swarm
  const cover = interpolate(d, [-0.25, 0, 0.25], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#050102", opacity: cover * 0.95 }} />
      {new Array(70).fill(0).map((_, i) => {
        const lane = random(`bl${i}`);
        const speed = 0.8 + random(`bs${i}`) * 0.6;
        const x = -300 + (k * speed * 1.4 + random(`bo${i}`) * 0.5 - 0.25) * 1700;
        const y = lane * 2000 - 40 + Math.sin(k * 12 + i) * 40;
        const size = 90 + random(`bz${i}`) * 230;
        return <Bat key={i} x={x} y={y} size={size} flap={t * 26 + i} />;
      })}
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: "#070204" }}>
    <Background />
    <AmbientBats />
    {SCENES.filter((s) => s.id !== "intro").map((s) => {
      const Comp = COMPONENTS[s.id];
      return (
        <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={Math.round(s.dur * FPS)} name={s.id}>
          <Comp dur={s.dur} />
        </Sequence>
      );
    })}
    <Sequence from={Math.round(4 * FPS)} durationInFrames={Math.round((CUT.poster - 4) * FPS)} name="webs">
      <Webs />
    </Sequence>
    <Grain />
    <Vignette />
    <Sequence from={0} durationInFrames={4 * FPS} name="intro (HyperFrames)">
      <OffthreadVideo src={staticFile("intro.mp4")} muted />
    </Sequence>
    <Flash at={CUT.title} color="#ff5a3a" peak={0.8} />
    <GlitchBars at={CUT.passion} />
    <Flash at={CUT.date} peak={0.6} />
    <BatSwarm at={CUT.dress} />
    <Flash at={CUT.prices} color="#ffb070" peak={0.4} />
    <Flash at={CUT.location} peak={0.55} />
    <Flash at={CUT.poster} color="#ff7a40" peak={0.7} />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
