import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BODY, C, clamp, HEAD, Reveal, Sfx, useIn } from "../theme";

const Row: React.FC<{ emoji: string; text: string; delay: number; color: string }> = ({ emoji, text, delay, color }) => {
  const p = useIn(delay, 13, 140);
  const frame = useCurrentFrame();
  const shine = interpolate(frame, [delay + 6, delay + 26], [-100, 200], clamp);
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "28px 36px",
        borderRadius: 30,
        background: `linear-gradient(90deg, ${color}38, rgba(255,255,255,0.04))`,
        border: `2px solid ${color}88`,
        scale: String(0.6 + 0.4 * p),
        opacity: interpolate(frame, [delay, delay + 5], [0, 1], clamp),
      }}
    >
      <span style={{ fontSize: 70 }}>{emoji}</span>
      <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 48, color: C.white }}>{text}</span>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
          translate: `${shine}% 0px`,
        }}
      />
    </div>
  );
};

export const Summary: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="pop" at={50} />
      <Sfx name="pop" at={68} />
      <Sfx name="pop" at={86} />
      <Sfx name="pop" at={104} />
      <Sfx name="pop-high" at={122} />
      <Sfx name="shimmer" at={124} volume={0.5} />

      <div style={{ position: "absolute", top: 170, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={0} from="blur">
          <div style={{ fontSize: 110 }}>🎬</div>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 100, color: C.white, textShadow: `0 0 50px ${C.pink}` }}>VIDEO CLIP</div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 48, color: C.gold, marginTop: 8 }}>твоя история в кадре</div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 720, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 26 }}>
        <Row emoji="🎵" text="Твоя любимая песня" delay={50} color={C.violet} />
        <Row emoji="💃" text="6 часов репетиций" delay={68} color={C.pink} />
        <Row emoji="🎥" text="1–2 часа видеосъёмки" delay={86} color={C.cyan} />
        <Row emoji="❤️" text="Своя история и хореография" delay={104} color="#ff5a5a" />
        <Row emoji="✨" text="Твой музыкальный мини-фильм" delay={122} color={C.gold} />
      </div>
    </AbsoluteFill>
  );
};
