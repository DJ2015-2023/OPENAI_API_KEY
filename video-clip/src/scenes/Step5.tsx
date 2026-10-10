import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BODY, C, clamp, HEAD, Reveal, Sfx, StepBadge, useIn } from "../theme";
import { useSceneFrame } from "../timing";

const Tile: React.FC<{ emoji: string; text: string; delay: number; color: string }> = ({ emoji, text, delay, color }) => {
  const p = useIn(delay, 13, 100);
  const frame = useSceneFrame();
  return (
    <div style={{ perspective: 1200 }}>
      <div
        style={{
          rotate: `x ${(1 - p) * -100}deg`,
          transformOrigin: "50% 0%",
          opacity: interpolate(frame, [delay, delay + 5], [0, 1], clamp),
          height: 300,
          borderRadius: 36,
          background: `linear-gradient(160deg, ${color}44, rgba(15,8,28,0.9) 70%)`,
          border: `3px solid ${color}`,
          boxShadow: `0 0 40px ${color}44`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 100, translate: `0px ${Math.sin((frame - delay) / 14) * 6}px` }}>{emoji}</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, lineHeight: 1.2, color: C.white }}>{text}</div>
      </div>
    </div>
  );
};

const Avatar: React.FC<{ color: string; emoji: string; delay: number }> = ({ color, emoji, delay }) => {
  const p = useIn(delay, 12, 120);
  return (
    <div style={{ width: 120, height: 120, borderRadius: "50%", background: `${color}33`, border: `4px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, scale: String(p) }}>
      {emoji}
    </div>
  );
};

export const Step5: React.FC = () => {
  const frame = useSceneFrame();
  const stamp = useIn(30, 9, 200);
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="impact" at={30} volume={0.8} />
      <Sfx name="whoosh-soft" at={115} volume={0.5} />
      <Sfx name="pop" at={115} />
      <Sfx name="pop" at={130} />
      <Sfx name="pop" at={145} />
      <Sfx name="pop-high" at={160} />
      <Sfx name="shimmer" at={215} volume={0.5} />

      <StepBadge n={5} title="Индивидуальная организация" color={C.gold} />

      <div style={{ position: "absolute", top: 420, left: 80, right: 80, display: "flex", alignItems: "center", gap: 36 }}>
        <div
          style={{
            fontFamily: HEAD,
            fontWeight: 900,
            fontSize: 54,
            color: C.pink,
            border: `6px solid ${C.pink}`,
            borderRadius: 18,
            padding: "10px 24px",
            rotate: `${-8 + (1 - stamp) * 20}deg`,
            scale: String(3 - 2 * stamp),
            opacity: interpolate(frame, [30, 33], [0, 1], clamp),
            boxShadow: `0 0 30px ${C.pink}88`,
          }}
        >
          ВАЖНО!
        </div>
        <Reveal delay={48} from="right" style={{ flex: 1 }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, lineHeight: 1.25, color: C.white }}>
            Каждый участник работает со мной <span style={{ color: C.gold }}>индивидуально</span>
          </div>
        </Reveal>
      </div>

      {/* one-on-one illustration */}
      <div style={{ position: "absolute", top: 660, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
        <Avatar color={C.pink} emoji="🙋" delay={70} />
        <Avatar color={C.gold} emoji="👩‍🎤" delay={80} />
        <Reveal delay={88} from="scale">
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.dim, width: 420 }}>
            не все вместе, а <span style={{ color: C.white }}>в своём ритме</span>
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 860, left: 80, right: 80 }}>
        <Reveal delay={105}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 42, color: C.cyan, textAlign: "center", marginBottom: 26 }}>
            Обсудим и согласуем лично:
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          <Tile emoji="📍" text="Место репетиций" delay={115} color={C.pink} />
          <Tile emoji="📅" text="Даты и время занятий" delay={130} color={C.violet} />
          <Tile emoji="🎬" text="Место съёмки" delay={145} color={C.cyan} />
          <Tile emoji="🎥" text="Дата и время съёмки" delay={160} color={C.gold} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 1660, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={215} from="blur">
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, lineHeight: 1.3, color: C.white }}>
            Комфортные условия — для <span style={{ color: C.gold }}>твоей идеи</span>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
