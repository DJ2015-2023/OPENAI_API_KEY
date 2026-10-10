import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { BODY, C, clamp, HEAD, Reveal, Sfx, StepBadge, useIn } from "../theme";
import { useSceneFrame } from "../timing";

const Item: React.FC<{ emoji: string; text: string; delay: number }> = ({ emoji, text, delay }) => {
  const p = useIn(delay, 14, 130);
  const frame = useSceneFrame();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "16px 28px",
        borderRadius: 28,
        background: "linear-gradient(90deg, rgba(139,92,255,0.28), rgba(255,255,255,0.04))",
        borderLeft: `8px solid ${C.violet}`,
        translate: `${(1 - p) * 700}px 0px`,
        opacity: interpolate(frame, [delay, delay + 6], [0, 1], clamp),
      }}
    >
      <span style={{ fontSize: 54 }}>{emoji}</span>
      <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, lineHeight: 1.22, color: C.white }}>{text}</span>
    </div>
  );
};

export const Step3: React.FC = () => {
  const frame = useSceneFrame();
  const fill = interpolate(frame, [30, 95], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const hours = Math.round(fill * 6);
  const R = 170;
  const circ = 2 * Math.PI * R;
  const done = useIn(97, 9, 180);
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.5} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sfx key={i} name="tick" at={30 + Math.round((65 * (i + 0.5)) / 6)} volume={0.8} />
      ))}
      <Sfx name="impact" at={96} volume={0.6} />
      <Sfx name="pop" at={115} volume={0.5} />
      <Sfx name="pop" at={135} volume={0.5} />
      <Sfx name="pop" at={155} volume={0.5} />
      <Sfx name="pop" at={175} volume={0.5} />
      <Sfx name="pop" at={195} volume={0.5} />
      <Sfx name="shimmer" at={232} volume={0.5} />

      <StepBadge n={3} title="Подготовка и репетиции" color={C.violet} />

      <div style={{ position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div style={{ position: "relative", width: 2 * R + 40, height: 2 * R + 40, scale: String(1 + done * 0.06 - useIn(110) * 0.06) }}>
          <svg width={2 * R + 40} height={2 * R + 40} style={{ rotate: "-90deg" }}>
            <circle cx={R + 20} cy={R + 20} r={R} stroke="rgba(255,255,255,0.12)" strokeWidth="26" fill="none" />
            <circle
              cx={R + 20}
              cy={R + 20}
              r={R}
              stroke={C.violet}
              strokeWidth="26"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - fill)}
              style={{ filter: `drop-shadow(0 0 16px ${C.violet})` }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 190, lineHeight: 1, color: C.white, textShadow: `0 0 40px ${C.violet}` }}>{hours}</div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.gold }}>ЧАСОВ</div>
          </div>
        </div>
        <Reveal delay={98} from="right">
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 56, lineHeight: 1.15, color: C.white }}>
            ⏳<br />
            репе-
            <br />
            тиций
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 810, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 16 }}>
        <Item emoji="🩰" text="Разучим хореографию под твою песню" delay={115} />
        <Item emoji="🎶" text="Музыкальность, движения и эмоции" delay={135} />
        <Item emoji="📜" text="Разберём сюжет и нужные сцены" delay={155} />
        <Item emoji="👀" text="Актёрская подача, взгляды, работа с камерой" delay={175} />
        <Item emoji="🎒" text="Подготовим всё для съёмки" delay={195} />
      </div>

      <div style={{ position: "absolute", top: 1640, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={232} from="blur">
          <div style={{ fontFamily: BODY, fontWeight: 800, fontStyle: "italic", fontSize: 46, lineHeight: 1.3, color: C.white }}>
            Не просто движения —<br />
            ты <span style={{ color: C.gold }}>проживаешь</span> свою историю
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
