import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Vinyl3D } from "../three/Objects";
import { BODY, C, clamp, GlassCard, HEAD, Reveal, Sfx, StepBadge, useIn } from "../theme";
import { useSceneFrame } from "../timing";

const Note: React.FC<{ i: number }> = ({ i }) => {
  const frame = useSceneFrame();
  const cycle = 70;
  const t = ((frame + i * 23) % cycle) / cycle;
  const x = 540 + Math.sin(i * 1.7 + t * 4) * (180 + i * 30) * (i % 2 ? 1 : -1);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 760 - t * 420,
        fontSize: 60 + (i % 3) * 14,
        color: [C.gold, C.pink, C.cyan][i % 3],
        opacity: Math.sin(t * Math.PI) * interpolate(frame, [20, 35], [0, 1], clamp),
        textShadow: `0 0 20px ${[C.gold, C.pink, C.cyan][i % 3]}`,
        rotate: `${Math.sin(t * 6 + i) * 20}deg`,
      }}
    >
      {["♪", "♫", "♬", "♩"][i % 4]}
    </div>
  );
};

const Check: React.FC<{ label: string; emoji: string; delay: number }> = ({ label, emoji, delay }) => {
  const p = useIn(delay, 12, 140);
  const frame = useSceneFrame();
  const tick = interpolate(frame, [delay + 6, delay + 16], [0, 1], clamp);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "22px 30px",
        borderRadius: 28,
        background: "rgba(255,255,255,0.08)",
        border: `2px solid ${C.cyan}55`,
        scale: String(p),
        opacity: Math.min(1, p * 2),
        width: 450,
      }}
    >
      <span style={{ fontSize: 54 }}>{emoji}</span>
      <span style={{ flex: 1, fontFamily: BODY, fontWeight: 800, fontSize: 42, color: C.white }}>{label}</span>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="24" fill={`${C.cyan}33`} stroke={C.cyan} strokeWidth="3" />
        <path d="M14 27 L23 35 L39 17" fill="none" stroke={C.cyan} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset={40 * (1 - tick)} />
      </svg>
    </div>
  );
};

export const Step1: React.FC = () => {
  const frame = useSceneFrame();
  const bubble = useIn(70, 12, 120);
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="pop-high" at={70} volume={0.8} />
      <Sfx name="pop" at={128} />
      <Sfx name="pop" at={140} />
      <Sfx name="pop" at={152} />
      <Sfx name="pop" at={164} />
      <Sfx name="shimmer" at={210} volume={0.6} />

      <Vinyl3D y={1.5} scale={0.62} />
      {new Array(7).fill(0).map((_, i) => (
        <Note key={i} i={i} />
      ))}
      <StepBadge n={1} title="Твоя песня — начало истории" color={C.gold} />

      {/* chat bubble: the participant sends their song */}
      <div
        style={{
          position: "absolute",
          top: 930,
          right: 90,
          scale: String(bubble),
          transformOrigin: "100% 100%",
          opacity: Math.min(1, bubble * 2),
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${C.pink}, ${C.violet})`,
            borderRadius: "40px 40px 8px 40px",
            padding: "26px 40px",
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: 48,
            color: "white",
            boxShadow: `0 20px 50px ${C.pink}55`,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <span style={{ fontSize: 56 }}>🎧</span> Вот моя песня!
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginLeft: 8 }}>
            {new Array(7).fill(0).map((_, i) => (
              <div key={i} style={{ width: 7, borderRadius: 4, background: "white", height: 14 + Math.abs(Math.sin(frame / 4 + i)) * 32 }} />
            ))}
          </div>
        </div>
      </div>
      <Reveal delay={80} style={{ position: "absolute", top: 1070, left: 80, right: 80, textAlign: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, color: C.dim }}>
          Ты присылаешь мне любимую песню
        </div>
      </Reveal>

      <div style={{ position: "absolute", top: 1170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Reveal delay={118}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 46, color: C.cyan, marginBottom: 22 }}>Я изучу:</div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Check emoji="📝" label="Текст" delay={128} />
          <Check emoji="💡" label="Смысл" delay={140} />
          <Check emoji="🌙" label="Настроение" delay={152} />
          <Check emoji="💗" label="Эмоции" delay={164} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 1590, left: 80, right: 80 }}>
        <Reveal delay={210} from="scale">
          <GlassCard accent={C.gold} style={{ padding: "34px 30px", textAlign: "center" }}>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: C.gold }}>✨ Уникальный сюжет</div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.white, marginTop: 10 }}>
              придумаем вместе — по твоей песне
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
