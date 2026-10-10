import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BODY, C, clamp, HEAD, Reveal, Sfx, useIn } from "../theme";

const DeckCard: React.FC<{ i: number; word: string; noun: string; emoji: string; color: string; delay: number }> = ({
  i,
  word,
  noun,
  emoji,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const p = useIn(delay, 13, 110);
  const fan = useIn(150, 14, 90);
  const baseRot = (i - 1.5) * 3;
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 140,
        top: 600 + i * 235 - fan * (i - 1.5) * 10,
        perspective: 1400,
      }}
    >
      <div
        style={{
          height: 220,
          borderRadius: 34,
          background: `linear-gradient(120deg, ${color}, ${color}88 45%, rgba(20,10,35,0.95))`,
          boxShadow: `0 25px 60px rgba(0,0,0,0.55), 0 0 40px ${color}55`,
          display: "flex",
          alignItems: "center",
          gap: 30,
          padding: "0 44px",
          rotate: `${baseRot * fan + (1 - p) * 40}deg`,
          translate: `${(1 - p) * (i % 2 ? 900 : -900)}px 0px`,
          transform: `rotateY(${(1 - p) * 70 + Math.sin((frame + i * 10) / 25) * 4}deg)`,
          opacity: interpolate(frame, [delay, delay + 5], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 100 }}>{emoji}</div>
        <div>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: "rgba(255,255,255,0.85)" }}>{word}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 58, color: "white" }}>{noun}</div>
        </div>
      </div>
    </div>
  );
};

export const WhyDeck: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="whoosh-soft" at={60} volume={0.7} />
      <Sfx name="whoosh-soft" at={78} volume={0.7} />
      <Sfx name="whoosh-soft" at={96} volume={0.7} />
      <Sfx name="whoosh-soft" at={114} volume={0.7} />
      <Sfx name="shimmer" at={150} volume={0.5} />

      <div style={{ position: "absolute", top: 160, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={0} from="blur">
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, letterSpacing: 6, color: C.pink }}>❤️ ПОЧЕМУ ЭТО</div>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 92, lineHeight: 1.1, color: C.white, textShadow: `0 0 40px ${C.pink}88` }}>
            особенный
            <br />
            проект?
          </div>
        </Reveal>
        <Reveal delay={28}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 46, lineHeight: 1.3, color: C.dim, marginTop: 34 }}>
            Здесь нет одной одинаковой истории для всех
          </div>
        </Reveal>
      </div>
      <DeckCard i={0} word="своя" noun="песня" emoji="🎵" color={C.violet} delay={60} />
      <DeckCard i={1} word="своя" noun="хореография" emoji="💃" color={C.pink} delay={78} />
      <DeckCard i={2} word="свой" noun="сюжет" emoji="📖" color="#e0700f" delay={96} />
      <DeckCard i={3} word="свой" noun="видеоклип" emoji="🎬" color="#0fa3b8" delay={114} />
    </AbsoluteFill>
  );
};
