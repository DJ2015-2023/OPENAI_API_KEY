import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BODY, C, clamp, Flash, HEAD, Reveal, Sfx, Strike, useIn } from "../theme";
import { useSceneFrame } from "../timing";

const Word: React.FC<{ text: string; delay: number; color: string }> = ({ text, delay, color }) => {
  const p = useIn(delay, 9, 170);
  const frame = useSceneFrame();
  return (
    <div
      style={{
        fontFamily: HEAD,
        fontWeight: 900,
        fontSize: 76,
        color,
        scale: String(0.3 + 0.7 * p),
        opacity: interpolate(frame, [delay, delay + 4], [0, 1], clamp),
        textShadow: `0 0 40px ${color}88`,
      }}
    >
      {text}
    </div>
  );
};

export const WhyCreate: React.FC = () => {
  const frame = useSceneFrame();
  const dim = interpolate(frame, [62, 75], [1, 0.35], clamp);
  return (
    <AbsoluteFill>
      <Sfx name="whoosh-soft" at={0} volume={0.5} />
      <Sfx name="tick" at={22} />
      <Sfx name="tick" at={50} />
      <Sfx name="riser" at={30} volume={0.35} />
      <Sfx name="impact" at={78} volume={0.85} />
      <Sfx name="heartbeat" at={120} volume={0.9} />
      <Sfx name="heartbeat" at={140} volume={0.9} />
      <Sfx name="heartbeat" at={160} volume={0.9} />

      <div style={{ position: "absolute", top: 230, left: 80, right: 80, textAlign: "center", opacity: dim }}>
        <Reveal delay={4}>
          <div style={{ position: "relative", display: "inline-block", fontFamily: BODY, fontWeight: 700, fontSize: 44, color: C.white, whiteSpace: "nowrap" }}>
            Не просто выучить движения.
            <Strike at={22} color={C.violet} />
          </div>
        </Reveal>
        <Reveal delay={30}>
          <div style={{ position: "relative", display: "inline-block", fontFamily: BODY, fontWeight: 700, fontSize: 44, color: C.white, marginTop: 34, whiteSpace: "nowrap" }}>
            Не просто станцевать перед камерой.
            <Strike at={50} color={C.violet} />
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 620, left: 70, right: 70, textAlign: "center" }}>
        <Reveal delay={78} from="scale">
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 100, lineHeight: 1.1, color: C.gold, textShadow: `0 0 60px ${C.gold}aa` }}>
            А создать
            <br />
            что-то своё.
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 1130, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <Word text="Личное." delay={120} color={C.pink} />
        <Word text="Эмоциональное." delay={140} color={C.cyan} />
        <Word text="Незабываемое." delay={160} color={C.white} />
      </div>
      <Flash at={78} color={C.gold} max={0.5} />
    </AbsoluteFill>
  );
};
