import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Atmosphere, Flash, Grain, Vignette, Viewfinder, useTime } from "./fx";
import { SCENES, Scene } from "./scenes";
import timeline from "./timeline.json";

const scenes = timeline.scenes as Scene[];

// Hues above 360 wrap to warm ambers; keeping them unwrapped stops the interpolation sweeping through green.
// Background hue drifts from wine-red to warmer amber and back as the story progresses.
const HUES: Record<string, number> = {
  hook: 348, about: 352, how: 342, s1: 350, s2: 364, s3: 346, s4: 370, s5: 352, why: 346, feel: 366, cta: 350, outro: 352,
};

const Background: React.FC = () => {
  const t = useTime();
  const pts = scenes.filter((s) => s.id !== "intro");
  const hue = interpolate(
    t,
    pts.map((s) => s.start + s.dur / 2),
    pts.map((s) => HUES[s.id] ?? 350),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <Atmosphere hue={hue} />;
};

export const VideoClip: React.FC = () => {
  const { fps } = useVideoConfig();
  const intro = scenes[0];
  return (
    <AbsoluteFill style={{ background: "#060408" }}>
      <Background />
      {scenes.slice(1).map((s) => {
        const Comp = SCENES[s.id];
        return (
          <Sequence key={s.id} from={Math.round(s.start * fps)} durationInFrames={Math.round(s.dur * fps)} name={s.id}>
            <Comp s={s} />
          </Sequence>
        );
      })}
      <Viewfinder />
      <Grain />
      <Vignette />
      {/* HyperFrames-rendered title sting sits on top for the opening seconds. */}
      <Sequence from={0} durationInFrames={Math.round(intro.dur * fps)} name="intro (HyperFrames)">
        <OffthreadVideo src={staticFile("intro.mp4")} muted />
      </Sequence>
      {scenes.slice(1).map((s) => (
        <Flash key={`f-${s.id}`} at={s.start} peak={s.id === "hook" ? 0.9 : 0.5} />
      ))}
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
