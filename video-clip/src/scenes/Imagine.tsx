import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BODY, C, clamp, GlassCard, HEAD, Reveal, Sfx, useIn, Words } from "../theme";
import { useSceneFrame } from "../timing";

const Icon: React.FC<{ emoji: string; label: string; delay: number; color: string }> = ({ emoji, label, delay, color }) => {
  const p = useIn(delay, 10, 130);
  const frame = useSceneFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: Math.min(1, p * 2) }}>
      <div
        style={{
          width: 230,
          height: 230,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 120,
          background: `radial-gradient(circle at 35% 30%, ${color}aa, ${color}22 70%)`,
          border: `3px solid ${color}`,
          boxShadow: `0 0 60px ${color}88`,
          scale: String(p),
          translate: `0px ${Math.sin((frame - delay) / 12) * 8}px`,
        }}
      >
        {emoji}
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: C.white }}>{label}</div>
    </div>
  );
};

const Arrow: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useSceneFrame();
  const w = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
  return (
    <div style={{ fontSize: 70, color: C.gold, opacity: w, scale: String(w), marginBottom: 70 }}>➜</div>
  );
};

export const Imagine: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sfx name="whoosh-soft" at={0} volume={0.5} />
      <Sfx name="pop" at={70} />
      <Sfx name="pop" at={88} />
      <Sfx name="pop-high" at={106} />
      <Sfx name="shimmer" at={112} volume={0.4} />

      <div style={{ position: "absolute", top: 200, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={0} from="blur">
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 104, color: C.pink, textShadow: `0 0 50px ${C.pink}88` }}>
            Представь…
          </div>
        </Reveal>
        <Words
          text="твоя любимая песня превращается в настоящую историю"
          delay={14}
          stagger={3}
          highlight={["песня", "историю"]}
          style={{ fontFamily: BODY, fontWeight: 800, fontSize: 66, lineHeight: 1.25, color: C.white, marginTop: 50 }}
        />
      </div>

      <div style={{ position: "absolute", top: 880, left: 40, right: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        <Icon emoji="🎵" label="Песня" delay={70} color={C.violet} />
        <Arrow delay={80} />
        <Icon emoji="🎞️" label="История" delay={88} color={C.cyan} />
        <Arrow delay={98} />
        <Icon emoji="⭐" label="Ты" delay={106} color={C.gold} />
      </div>

      <div style={{ position: "absolute", top: 1360, left: 80, right: 80 }}>
        <Reveal delay={112} from="scale">
          <GlassCard accent={C.gold} style={{ padding: "44px 40px", textAlign: "center" }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 52, color: C.white, lineHeight: 1.3 }}>
              а ты становишься её
              <br />
              <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 70, color: C.gold }}>главным героем</span>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
