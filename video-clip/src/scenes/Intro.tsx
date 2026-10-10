import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Clapperboard3D } from "../three/Objects";
import { BODY, C, clamp, Flash, HEAD, Reveal, Sfx, useIn } from "../theme";

const SNAP = 48;

const Letter: React.FC<{ ch: string; delay: number }> = ({ ch, delay }) => {
  const frame = useCurrentFrame();
  const p = useIn(delay, 10, 160);
  const jitter = Math.max(0, 1 - (frame - SNAP) / 30) * 10;
  return (
    <span
      style={{
        fontFamily: HEAD,
        fontWeight: 900,
        fontSize: 140,
        lineHeight: 1,
        color: C.white,
        display: "inline-block",
        width: ch === " " ? 50 : undefined,
        opacity: frame >= delay ? 1 : 0,
        scale: String(0.2 + 0.8 * p),
        translate: `0px ${(1 - p) * -120}px`,
        textShadow: `${jitter}px 0 0 ${C.pink}, ${-jitter}px 0 0 ${C.cyan}, 0 0 50px ${C.pink}aa`,
      }}
    >
      {ch}
    </span>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const title = "VIDEO CLIP".split("");
  const zoom = interpolate(frame, [SNAP, SNAP + 140], [1.08, 1], clamp);
  return (
    <AbsoluteFill style={{ scale: String(zoom) }}>
      <Sfx name="riser" at={0} volume={0.55} />
      <Sfx name="clap" at={SNAP} volume={1} />
      <Sfx name="impact" at={SNAP} volume={0.9} />
      <Sfx name="shimmer" at={SNAP + 6} volume={0.5} />
      <Sfx name="pop" at={95} volume={0.5} />
      <Sfx name="pop" at={110} volume={0.5} />
      <Sfx name="pop-high" at={125} volume={0.55} />

      <Clapperboard3D snapAt={SNAP} y={2.15} />

      <div style={{ position: "absolute", top: 1020, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {title.map((ch, i) => (
            <Letter key={i} ch={ch} delay={SNAP + 2 + i * 2} />
          ))}
        </div>
        <div
          style={{
            height: 8,
            margin: "34px auto 0",
            width: interpolate(frame, [SNAP + 20, SNAP + 45], [0, 760], clamp),
            background: `linear-gradient(90deg, ${C.pink}, ${C.gold}, ${C.cyan})`,
            borderRadius: 4,
            boxShadow: `0 0 30px ${C.pink}`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1290,
          left: 80,
          right: 80,
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.3,
          color: C.white,
        }}
      >
        <Reveal delay={95}>Твоя песня.</Reveal>
        <Reveal delay={110}>Твоя история.</Reveal>
        <Reveal delay={125} from="scale">
          <span style={{ color: C.gold, textShadow: `0 0 40px ${C.gold}88` }}>Твой собственный видеоклип.</span>
        </Reveal>
      </div>
      <Flash at={SNAP} />
    </AbsoluteFill>
  );
};
