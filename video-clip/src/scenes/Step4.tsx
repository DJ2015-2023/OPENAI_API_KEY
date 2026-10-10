import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { FilmCamera3D } from "../three/Objects";
import { BODY, C, clamp, Flash, HEAD, Reveal, Sfx, StepBadge } from "../theme";
import { useSceneFrame } from "../timing";

const Viewfinder: React.FC = () => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const o = interpolate(frame, [10, 25], [0, 1], clamp);
  const corner = (s: React.CSSProperties) => (
    <div style={{ position: "absolute", width: 90, height: 90, borderColor: "rgba(255,255,255,0.85)", borderStyle: "solid", borderWidth: 0, ...s }} />
  );
  const secs = Math.floor(frame / fps);
  const ff = String(frame % fps).padStart(2, "0");
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {corner({ top: 60, left: 50, borderTopWidth: 6, borderLeftWidth: 6 })}
      {corner({ top: 60, right: 50, borderTopWidth: 6, borderRightWidth: 6 })}
      {corner({ bottom: 60, left: 50, borderBottomWidth: 6, borderLeftWidth: 6 })}
      {corner({ bottom: 60, right: 50, borderBottomWidth: 6, borderRightWidth: 6 })}
      <div style={{ position: "absolute", bottom: 90, left: 90, display: "flex", alignItems: "center", gap: 14, fontFamily: BODY, fontWeight: 800, fontSize: 36, color: "white" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#ff2a2a", opacity: Math.floor(frame / 15) % 2 ? 0.2 : 1, boxShadow: "0 0 18px #ff2a2a" }} />
        REC
      </div>
      <div style={{ position: "absolute", bottom: 90, right: 90, fontFamily: "monospace", fontWeight: 700, fontSize: 36, color: "white" }}>
        00:00:{String(secs).padStart(2, "0")}:{ff}
      </div>
    </AbsoluteFill>
  );
};

export const Step4: React.FC = () => {
  const shots = [125, 150, 175];
  return (
    <AbsoluteFill>
      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="clap" at={60} volume={0.9} />
      <Sfx name="impact" at={60} volume={0.6} />
      <Sfx name="shutter" at={shots[0]} volume={0.9} />
      <Sfx name="shutter" at={shots[1]} volume={0.9} />
      <Sfx name="shutter" at={shots[2]} volume={0.9} />
      <Sfx name="shimmer" at={200} volume={0.45} />

      <FilmCamera3D y={1.25} />
      <Viewfinder />
      <StepBadge n={4} title="Съёмка видеоклипа" color={C.cyan} />

      <div style={{ position: "absolute", top: 1180, left: 80, right: 80, textAlign: "center" }}>
        <Reveal delay={60} from="scale">
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 120, lineHeight: 1, color: C.white, textShadow: `0 0 50px ${C.cyan}` }}>
            1–2 <span style={{ fontSize: 70 }}>ЧАСА</span>
          </div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, letterSpacing: 4, color: C.cyan, marginTop: 10 }}>ВИДЕОСЪЁМКИ</div>
        </Reveal>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 44 }}>
          <Reveal delay={shots[0]} from="left">
            <div style={{ padding: "20px 30px", borderRadius: 24, background: `${C.pink}30`, border: `2px solid ${C.pink}`, fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.white }}>
              💃 Танцевальные сцены
            </div>
          </Reveal>
          <Reveal delay={shots[1]} from="right">
            <div style={{ padding: "20px 30px", borderRadius: 24, background: `${C.gold}30`, border: `2px solid ${C.gold}`, fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.white }}>
              🎬 Сюжет
            </div>
          </Reveal>
        </div>
        <Reveal delay={200} from="blur">
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, lineHeight: 1.3, color: C.white, marginTop: 50 }}>
            Каждое движение, взгляд и эмоция — <span style={{ color: C.pink }}>одна история ❤️</span>
          </div>
        </Reveal>
      </div>
      {shots.map((s) => (
        <Flash key={s} at={s} len={8} max={0.7} />
      ))}
    </AbsoluteFill>
  );
};
