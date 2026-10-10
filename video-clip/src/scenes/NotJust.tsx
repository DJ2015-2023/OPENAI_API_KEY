import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BODY, C, clamp, HEAD, Reveal, Sfx, Strike, useIn } from "../theme";

const Chip: React.FC<{ emoji: string; text: string; delay: number; color: string; angle: number }> = ({
  emoji,
  text,
  delay,
  color,
  angle,
}) => {
  const p = useIn(delay, 11, 140);
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "26px 40px",
        borderRadius: 999,
        background: `${color}26`,
        border: `3px solid ${color}`,
        boxShadow: `0 0 40px ${color}66`,
        fontFamily: BODY,
        fontWeight: 800,
        fontSize: 54,
        color: C.white,
        scale: String(p),
        rotate: `${(1 - p) * angle + Math.sin((frame + delay) / 20) * 1.5}deg`,
        opacity: Math.min(1, p * 2),
      }}
    >
      <span style={{ fontSize: 64 }}>{emoji}</span>
      {text}
    </div>
  );
};

export const NotJust: React.FC = () => {
  const frame = useCurrentFrame();
  const dimOld = interpolate(frame, [70, 85], [1, 0.35], clamp);
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.4} />
      <Sfx name="tick" at={28} volume={0.9} />
      <Sfx name="tick" at={52} volume={0.9} />
      <Sfx name="impact" at={88} volume={0.6} />
      <Sfx name="pop" at={112} />
      <Sfx name="pop" at={122} />
      <Sfx name="pop-high" at={132} />
      <Sfx name="pop-high" at={142} />
      <Sfx name="shimmer" at={165} volume={0.45} />

      <div style={{ position: "absolute", top: 180, left: 80, right: 80, textAlign: "center", opacity: dimOld }}>
        <Reveal delay={4}>
          <div style={{ position: "relative", display: "inline-block", fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.dim, whiteSpace: "nowrap" }}>
            Не просто танцевальная постановка
            <Strike at={28} />
          </div>
        </Reveal>
        <Reveal delay={26}>
          <div style={{ position: "relative", display: "inline-block", fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.dim, marginTop: 30, whiteSpace: "nowrap" }}>
            Не обычная видеосъёмка
            <Strike at={52} />
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 520, left: 60, right: 60, textAlign: "center" }}>
        <Reveal delay={86} from="scale">
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, color: C.white, textShadow: `0 0 50px ${C.pink}` }}>
            VIDEO CLIP
          </div>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 48, color: C.gold, marginTop: 12 }}>
            индивидуальный творческий проект
          </div>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 30, marginTop: 70 }}>
          <Chip emoji="💃" text="Танец" delay={112} color={C.pink} angle={-30} />
          <Chip emoji="❤️" text="Эмоции" delay={122} color={C.violet} angle={25} />
          <Chip emoji="🎭" text="Актёрская игра" delay={132} color={C.cyan} angle={-20} />
          <Chip emoji="🎬" text="Кино-история" delay={142} color={C.gold} angle={30} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 1420, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={165} from="blur">
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 56, lineHeight: 1.3, color: C.white }}>
            И всё начнётся с песни,
            <br />
            которую выберешь <span style={{ color: C.pink }}>именно ты</span>{" "}
            <span style={{ display: "inline-block", scale: String(1 + 0.15 * Math.max(0, Math.sin(frame / 5))) }}>❤️</span>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
