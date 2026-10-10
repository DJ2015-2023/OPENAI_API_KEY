import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Heart3D } from "../three/Objects";
import { BODY, C, clamp, HEAD, Reveal, Sfx, useIn } from "../theme";

const BEATS = [20, 50, 80, 110, 140, 170, 200, 230];

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const btn = useIn(85, 10, 140);
  const pulse = 1 + 0.04 * Math.max(0, Math.sin((frame - 85) / 6));
  const fadeOut = interpolate(frame, [240, 270], [1, 0], clamp);
  const lines = ["Твоя песня.", "Твои эмоции.", "Твой танец.", "Твоя история."];
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Sfx name="whoosh" at={0} volume={0.5} />
      {BEATS.slice(0, 3).map((b) => (
        <Sfx key={b} name="heartbeat" at={b} volume={0.7} />
      ))}
      <Sfx name="impact" at={85} volume={0.7} />
      <Sfx name="pop" at={150} />
      <Sfx name="pop" at={162} />
      <Sfx name="pop" at={174} />
      <Sfx name="pop-high" at={186} />
      <Sfx name="shimmer" at={190} volume={0.6} />

      <Heart3D y={1.8} beats={BEATS} />

      <div style={{ position: "absolute", top: 820, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={30}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 70, lineHeight: 1.15, color: C.white }}>
            Готов(а) стать
            <br />
            <span style={{ color: C.gold, textShadow: `0 0 40px ${C.gold}` }}>главным героем</span>
            <br />
            своей истории?
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 1170, left: 40, right: 40, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            scale: String(btn * pulse),
            opacity: Math.min(1, btn * 2),
            padding: "34px 50px",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${C.pink}, #ff6a3d)`,
            boxShadow: `0 0 ${50 + 30 * Math.sin(frame / 6)}px ${C.pink}, 0 20px 50px rgba(0,0,0,0.5)`,
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: 40,
            color: "white",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          🔥 Напиши мне в личные сообщения
        </div>
      </div>
      <Reveal delay={100} style={{ position: "absolute", top: 1340, left: 80, right: 80, textAlign: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.dim }}>и мы начнём создавать твой VIDEO CLIP!</div>
      </Reveal>

      <div style={{ position: "absolute", top: 1500, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 22, rowGap: 6 }}>
        {lines.map((l, i) => (
          <Reveal key={l} delay={150 + i * 12} from="scale">
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 50, color: [C.pink, C.cyan, C.gold, C.white][i] }}>{l}</div>
          </Reveal>
        ))}
      </div>
    </AbsoluteFill>
  );
};
