import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BODY, C, clamp, Flash, HEAD, Reveal, Sfx, StepBadge, useIn } from "../theme";

const FlipCard: React.FC<{
  delay: number;
  emoji: string;
  title: string;
  text: string;
  color: string;
  top: number;
  mergeAt: number;
  dir: 1 | -1;
}> = ({ delay, emoji, title, text, color, top, mergeAt, dir }) => {
  const frame = useCurrentFrame();
  const p = useIn(delay, 14, 90);
  const merge = useIn(mergeAt, 16, 90);
  const rotY = (1 - p) * 180 * dir;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: top + merge * (dir === 1 ? 260 : -260), perspective: 1600 }}>
      <div
        style={{
          transformStyle: "preserve-3d",
          rotate: `y ${rotY + Math.sin(frame / 30) * 6}deg`,
          scale: String(1 - merge * 0.25),
          opacity: interpolate(frame, [delay, delay + 6], [0, 1], clamp) * (1 - merge),
        }}
      >
        <div
          style={{
            backfaceVisibility: "hidden",
            borderRadius: 40,
            padding: "40px 44px",
            background: `linear-gradient(140deg, ${color}55, rgba(20,10,35,0.85) 65%)`,
            border: `3px solid ${color}`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${color}55`,
            display: "flex",
            gap: 32,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 150, lineHeight: 1 }}>{emoji}</div>
          <div>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 52, color, whiteSpace: "nowrap" }}>{title}</div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, lineHeight: 1.3, color: C.white, marginTop: 12 }}>{text}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const MERGE = 185;
  const loop = useIn(105, 14, 100);
  const final = useIn(MERGE + 12, 12, 110);
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="whoosh-soft" at={35} volume={0.7} />
      <Sfx name="whoosh-soft" at={60} volume={0.7} />
      <Sfx name="pop-high" at={105} volume={0.6} />
      <Sfx name="riser" at={MERGE - 58} volume={0.4} />
      <Sfx name="impact" at={MERGE + 10} volume={0.8} />
      <Sfx name="shimmer" at={MERGE + 14} volume={0.55} />

      <StepBadge n={2} title="Создаём твою историю" color={C.pink} />
      <Reveal delay={18} style={{ position: "absolute", top: 400, left: 80, right: 80, textAlign: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 50, color: C.dim }}>Две части — одна история</div>
      </Reveal>

      <FlipCard delay={35} emoji="💃" title="ТАНЕЦ" text="Хореография, передающая настроение и эмоции песни" color={C.pink} top={530} mergeAt={MERGE} dir={1} />
      <FlipCard delay={60} emoji="🎬" title="МИНИ-ФИЛЬМ" text="Сюжет, взгляды, чувства и актёрская игра" color={C.cyan} top={1110} mergeAt={MERGE} dir={-1} />

      {/* the two parts flow into each other */}
      <div
        style={{
          position: "absolute",
          top: 885,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 30,
          opacity: loop * (1 - useIn(MERGE - 10)),
        }}
      >
        <svg width="210" height="210" viewBox="0 0 100 100" style={{ rotate: `${frame * 3}deg`, scale: String(loop) }}>
          <defs>
            <linearGradient id="lg" x1="0" x2="1">
              <stop offset="0" stopColor={C.pink} />
              <stop offset="1" stopColor={C.cyan} />
            </linearGradient>
          </defs>
          <path d="M50 12 A38 38 0 1 1 18 30" fill="none" stroke="url(#lg)" strokeWidth="8" strokeLinecap="round" />
          <path d="M8 26 L18 30 L22 18" fill="none" stroke={C.cyan} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.white, lineHeight: 1.3, width: 560 }}>
          История переходит в танец, а танец — продолжает историю
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 700,
          left: 70,
          right: 70,
          scale: String(final),
          opacity: Math.min(1, final * 2),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 200 }}>🎞️</div>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 84, lineHeight: 1.1, color: C.white, textShadow: `0 0 50px ${C.pink}` }}>
          Музыкальный
          <br />
          <span style={{ color: C.gold }}>мини-фильм</span>
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 52, color: C.white, marginTop: 36 }}>
          …где ты играешь <span style={{ color: C.pink }}>главную роль</span>
        </div>
      </div>
      <Flash at={MERGE + 10} color={C.gold} max={0.6} />
    </AbsoluteFill>
  );
};
