import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  BlurWords,
  C,
  F,
  FilmStrip,
  GoldLine,
  Letters,
  Shimmer,
  Sparks,
  Wipe,
  ease,
  goldText,
  useProgress,
  useTime,
} from "./fx";
import { DrawIcon, IconBadge, IconName } from "./icons";

export type Scene = { id: string; start: number; dur: number; voiceAt?: number; voiceDur?: number; text?: string };

/** Local time (s) at which the narrator reaches `phrase`, estimated from character position. */
export const cue = (s: Scene, phrase: string) => {
  const text = s.text ?? "";
  const idx = Math.max(0, text.indexOf(phrase));
  return (s.voiceAt! - s.start) + (s.voiceDur! * idx) / text.length;
};

/** Enter: de-blur + settle; exit: push past camera with blur. Whole scene slowly dollies in. */
export const SceneShell: React.FC<{ s: Scene; children: React.ReactNode }> = ({ s, children }) => {
  const t = useTime();
  const enter = interpolate(t, [0, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const exit = interpolate(t, [s.dur - 0.35, s.dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dolly = 1 + (t / s.dur) * 0.04;
  const scale = dolly * (1.08 - enter * 0.08) * (1 + exit * 0.12);
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enter, 1 - exit),
        transform: `scale(${scale})`,
        filter: `blur(${(1 - enter) * 14 + exit * 18}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Stack: React.FC<{ children: React.ReactNode; top?: number; gap?: number }> = ({ children, top = 330, gap = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: 90,
      right: 90,
      top: 250,
      bottom: 330,
      paddingTop: Math.max(0, top - 330),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap,
    }}
  >
    {children}
  </div>
);

const Kicker: React.FC<{ text: string; at: number; color?: string }> = ({ text, at, color = C.gold }) => {
  const p = useProgress(at, 0.9);
  return (
    <div
      style={{
        fontFamily: F.sans,
        fontWeight: 600,
        fontSize: 34,
        letterSpacing: "0.45em",
        paddingLeft: "0.45em",
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
      }}
    >
      {text}
    </div>
  );
};

// ---------------- 1. Hook ----------------
export const Hook: React.FC<{ s: Scene }> = ({ s }) => {
  const t = useTime();
  const youAt = cue(s, "ты?");
  const you = useProgress(youAt - 0.1, 0.9);
  const pulse = 1 + Math.max(0, Math.sin((t - youAt) * 6)) * 0.03 * you;
  return (
    <SceneShell s={s}>
      <FilmStrip x={-20} speed={90} opacity={0.28} />
      <FilmStrip x={990} speed={-70} opacity={0.28} />
      <Stack top={360}>
        <Kicker text="А ЧТО, ЕСЛИ" at={cue(s, "А что")} />
        <div style={{ height: 40 }} />
        <BlurWords
          text="твоя любимая песня"
          at={cue(s, "твоя")}
          style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 700, fontSize: 104, lineHeight: 1.1, color: C.cream }}
          wordStyle={(w) => (w === "песня" ? goldText : undefined)}
        />
        <div style={{ height: 30 }} />
        <BlurWords
          text="превратится в настоящий"
          at={cue(s, "превратится")}
          style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 46, letterSpacing: "0.08em", color: C.muted }}
        />
        <Letters
          text="ФИЛЬМ"
          at={cue(s, "фильм")}
          style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 176, letterSpacing: "0.08em", color: C.cream, marginTop: 6 }}
        />
        <div style={{ height: 30 }} />
        <BlurWords
          text="где главный герой —"
          at={cue(s, "где")}
          style={{ fontFamily: F.elegant, fontStyle: "italic", fontWeight: 500, fontSize: 70, color: C.cream }}
        />
        <div
          style={{
            position: "relative",
            marginTop: 0,
            fontFamily: F.serif,
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 250,
            lineHeight: 1,
            opacity: you,
            transform: `scale(${(2.2 - you * 1.2) * pulse})`,
            filter: `blur(${(1 - you) * 20}px) drop-shadow(0 0 40px rgba(224,38,63,0.7))`,
          }}
        >
          <span style={goldText}>ТЫ</span>
        </div>
      </Stack>
      <Sparks at={youAt} cx={540} cy={1250} count={36} />
    </SceneShell>
  );
};

// ---------------- 2. About ----------------
const Chip: React.FC<{ icon: IconName; label: string; at: number }> = ({ icon, label, at }) => {
  const p = useProgress(at, 0.8);
  return (
    <div
      style={{
        width: 420,
        height: 210,
        borderRadius: 28,
        border: "1px solid rgba(233,194,122,0.35)",
        background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(224,38,63,0.08))",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        opacity: p,
        transform: `translateY(${(1 - p) * 60}px) rotateX(${(1 - p) * 40}deg)`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.45), inset 0 0 40px rgba(233,194,122,${0.08 * p})`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <DrawIcon name={icon} at={at + 0.1} size={92} dur={1} width={4} />
      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, letterSpacing: "0.16em", color: C.cream }}>{label}</div>
      <Shimmer at={at + 1} period={3.2} />
    </div>
  );
};

export const About: React.FC<{ s: Scene }> = ({ s }) => (
  <SceneShell s={s}>
    <Stack top={330}>
      <Letters text="VIDEO" at={0.25} style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 120, letterSpacing: "0.16em", color: C.cream }} />
      <Letters
        text="Clip"
        at={0.5}
        gold
        style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 900, fontSize: 170, lineHeight: 0.9, marginTop: -6 }}
      />
      <GoldLine at={0.8} width={560} style={{ marginTop: 28 }} />
      <div style={{ height: 34 }} />
      <BlurWords
        text="уникальный индивидуальный проект"
        at={cue(s, "уникальный")}
        style={{ fontFamily: F.elegant, fontStyle: "italic", fontWeight: 500, fontSize: 64, lineHeight: 1.15, color: C.cream }}
      />
      <div style={{ height: 56 }} />
      <div style={{ display: "grid", gridTemplateColumns: "420px 420px", gap: 24, perspective: 900 }}>
        <Chip icon="dancer" label="ТАНЕЦ" at={cue(s, "Танец")} />
        <Chip icon="heart" label="ЭМОЦИИ" at={cue(s, "эмоции")} />
        <Chip icon="star" label="АКТЁРСКАЯ ИГРА" at={cue(s, "актёрская")} />
        <Chip icon="clapper" label="КИНО-ИСТОРИЯ" at={cue(s, "кинематографичная")} />
      </div>
    </Stack>
  </SceneShell>
);

// ---------------- 3. How ----------------
export const How: React.FC<{ s: Scene }> = ({ s }) => {
  const line = useProgress(0.3, 1.6);
  return (
    <SceneShell s={s}>
      <Stack top={520}>
        <Kicker text="5 ШАГОВ" at={0.1} />
        <div style={{ height: 30 }} />
        <BlurWords
          text="Как всё будет"
          at={0.25}
          style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 700, fontSize: 120, lineHeight: 1.05, color: C.cream }}
        />
        <BlurWords
          text="проходить?"
          at={0.5}
          style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 900, fontSize: 140, lineHeight: 1.05 }}
          wordStyle={() => goldText}
        />
        <div style={{ position: "relative", width: 760, height: 120, marginTop: 70 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 58,
              height: 3,
              transformOrigin: "left",
              transform: `scaleX(${line})`,
              background: `linear-gradient(90deg, ${C.crimson}, ${C.gold})`,
              boxShadow: `0 0 20px ${C.gold}`,
            }}
          />
          {[0, 1, 2, 3, 4].map((i) => {
            const on = line >= i / 4 - 0.001;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (i / 4) * 760 - 34,
                  top: 26,
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  border: `2px solid ${C.gold}`,
                  background: on ? "rgba(224,38,63,0.9)" : "rgba(10,5,8,0.9)",
                  transform: `scale(${on ? 1 : 0.4})`,
                  opacity: on ? 1 : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: F.sans,
                  fontWeight: 700,
                  fontSize: 30,
                  color: C.cream,
                  boxShadow: on ? `0 0 26px rgba(224,38,63,0.8)` : undefined,
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </Stack>
    </SceneShell>
  );
};

// ---------------- 4-8. Steps ----------------
type StepDef = {
  n: number;
  icon: IconName;
  title: string;
  lines: { text: string; cue: string }[];
  stat?: { value: string; unit: string; cue: string };
};

export const STEPS: Record<string, StepDef> = {
  s1: {
    n: 1,
    icon: "music",
    title: "Твоя песня",
    lines: [
      { text: "Ты выбираешь любимую песню", cue: "Ты выбираешь" },
      { text: "и присылаешь её мне", cue: "и присылаешь" },
      { text: "Текст · смысл · настроение", cue: "Я изучаю" },
      { text: "→ особенная история", cue: "чтобы вместе" },
    ],
  },
  s2: {
    n: 2,
    icon: "clapper",
    title: "Твой сюжет",
    lines: [
      { text: "Индивидуальная хореография", cue: "индивидуальную" },
      { text: "и сценарий мини-фильма", cue: "и сценарий" },
      { text: "Танец продолжает историю", cue: "Танец продолжает" },
      { text: "Движения · взгляды · эмоции", cue: "через движения" },
    ],
  },
  s3: {
    n: 3,
    icon: "dancer",
    title: "Репетиции",
    stat: { value: "6", unit: "ЧАСОВ", cue: "шесть" },
    lines: [
      { text: "Хореография", cue: "подготовим" },
      { text: "Эмоции и актёрская игра", cue: "проработаем" },
      { text: "Все сцены для клипа", cue: "и все сцены" },
    ],
  },
  s4: {
    n: 4,
    icon: "camera",
    title: "Видеосъёмка",
    stat: { value: "1–2", unit: "ЧАСА", cue: "от одного" },
    lines: [
      { text: "Танцевальные и сюжетные сцены", cue: "Снимем" },
      { text: "→ твой музыкальный мини-фильм", cue: "и объединим" },
    ],
  },
  s5: {
    n: 5,
    icon: "calendar",
    title: "Всё индивидуально",
    lines: [
      { text: "Каждый участник — отдельно со мной", cue: "Каждый участник" },
      { text: "Даты · время · место репетиций", cue: "Даты" },
      { text: "Локацию съёмки согласуем лично", cue: "локацию" },
    ],
  },
};

const StepProgress: React.FC<{ n: number }> = ({ n }) => {
  const p = useProgress(0.2, 0.8);
  return (
    <div style={{ position: "absolute", top: 262, left: 200, right: 200, display: "flex", gap: 14 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(245,235,221,0.15)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: i < n ? "100%" : i === n ? `${p * 100}%` : "0%",
              background: `linear-gradient(90deg, ${C.crimson}, ${C.gold})`,
              boxShadow: `0 0 12px ${C.gold}`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

const Stat: React.FC<{ value: string; unit: string; at: number }> = ({ value, unit, at }) => {
  const p = useProgress(at - 0.15, 0.9);
  const t = useTime();
  const numeric = /^\d+$/.test(value);
  const shown = numeric ? Math.round(interpolate(p, [0, 1], [0, Number(value)])) : value;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 22,
        opacity: p,
        transform: `scale(${1.4 - p * 0.4})`,
        filter: `blur(${(1 - p) * 12}px)`,
        marginTop: 6,
      }}
    >
      <span
        style={{
          fontFamily: F.serif,
          fontWeight: 900,
          fontStyle: "italic",
          fontSize: 190,
          lineHeight: 1,
          ...goldText,
          filter: `drop-shadow(0 0 ${20 + Math.sin(t * 4) * 8}px rgba(233,150,90,0.55))`,
        }}
      >
        {shown}
      </span>
      <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 56, letterSpacing: "0.2em", color: C.cream }}>{unit}</span>
    </div>
  );
};

export const Step: React.FC<{ s: Scene }> = ({ s }) => {
  const def = STEPS[s.id];
  const t = useTime();
  const num = useProgress(0, 1.2);
  return (
    <SceneShell s={s}>
      <StepProgress n={def.n} />
      {/* Giant outlined numeral drifting behind the content */}
      <div
        style={{
          position: "absolute",
          right: 30,
          top: 1180,
          fontFamily: F.serif,
          fontWeight: 900,
          fontStyle: "italic",
          fontSize: 560,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: "2px rgba(233,194,122,0.28)",
          opacity: num,
          transform: `translate(${(1 - num) * 120 - t * 6}px, ${t * 4}px)`,
        }}
      >
        0{def.n}
      </div>
      <Stack top={360}>
        <IconBadge name={def.icon} at={0.15} size={300} />
        <div style={{ height: 26 }} />
        <Kicker text={`ШАГ ${def.n}`} at={cue(s, "Шаг")} />
        <div style={{ height: 14 }} />
        <BlurWords
          text={def.title}
          at={cue(s, def.title.split(" ")[0]) - 0.15}
          style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 900, fontSize: def.title.length > 12 ? 100 : 118, lineHeight: 1.05 }}
          wordStyle={(_, i) => (i === def.title.split(" ").length - 1 ? goldText : { color: C.cream })}
        />
        {def.stat ? <Stat value={def.stat.value} unit={def.stat.unit} at={cue(s, def.stat.cue)} /> : null}
        <GoldLine at={cue(s, def.title.split(" ")[0]) + 0.3} width={520} style={{ margin: "30px auto 30px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          {def.lines.map((l, i) => (
            <Wipe key={i} at={cue(s, l.cue) - 0.1}>
              <div
                style={{
                  fontFamily: F.sans,
                  fontWeight: i === def.lines.length - 1 && l.text.startsWith("→") ? 600 : 400,
                  fontSize: 44,
                  lineHeight: 1.25,
                  color: l.text.startsWith("→") ? C.gold : C.cream,
                }}
              >
                {l.text}
              </div>
            </Wipe>
          ))}
        </div>
      </Stack>
    </SceneShell>
  );
};

// ---------------- 9. Why ----------------
const OwnRow: React.FC<{ icon: IconName; word: string; at: number }> = ({ icon, word, at }) => {
  const p = useProgress(at - 0.1, 0.8);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 34,
        width: 820,
        padding: "22px 40px",
        borderRadius: 24,
        background: "linear-gradient(90deg, rgba(224,38,63,0.18), rgba(255,255,255,0.03))",
        borderLeft: `4px solid ${C.gold}`,
        opacity: p,
        transform: `translateX(${(1 - p) * -120}px)`,
        filter: `blur(${(1 - p) * 10}px)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <DrawIcon name={icon} at={at} size={86} dur={0.9} width={4.5} />
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 66, lineHeight: 1.1, color: C.cream, textAlign: "left" }}>
        <span style={{ ...goldText, fontWeight: 900 }}>{word.split(" ")[0]} </span>
        <span style={{ fontWeight: 400 }}>{word.split(" ").slice(1).join(" ")}</span>
      </div>
      <Shimmer at={at + 0.8} period={3} />
    </div>
  );
};

export const Why: React.FC<{ s: Scene }> = ({ s }) => (
  <SceneShell s={s}>
    <Stack top={330}>
      <Kicker text="ПОЧЕМУ ЭТО" at={cue(s, "Почему")} />
      <Letters
        text="ОСОБЕННО?"
        at={cue(s, "особенно")}
        style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 116, letterSpacing: "0.06em", color: C.cream, marginTop: 14 }}
      />
      <div style={{ height: 30 }} />
      <BlurWords
        text="у каждого будет"
        at={cue(s, "у каждого")}
        style={{ fontFamily: F.elegant, fontStyle: "italic", fontWeight: 500, fontSize: 62, color: C.muted }}
      />
      <div style={{ height: 40 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <OwnRow icon="music" word="Своя песня" at={cue(s, "своя песня")} />
        <OwnRow icon="dancer" word="Своя хореография" at={cue(s, "Своя хореография")} />
        <OwnRow icon="star" word="Своя уникальная история" at={cue(s, "Своя уникальная")} />
        <OwnRow icon="camera" word="Свой видеоклип" at={cue(s, "И свой")} />
      </div>
    </Stack>
  </SceneShell>
);

// ---------------- 10. Feel ----------------
export const Feel: React.FC<{ s: Scene }> = ({ s }) => {
  const strike = useProgress(cue(s, "а почувствовать") - 0.25, 0.6);
  const verbs = [
    { w: "почувствовать", c: "почувствовать" },
    { w: "сыграть", c: "сыграть" },
    { w: "прожить", c: "прожить" },
  ];
  return (
    <SceneShell s={s}>
      <FilmStrip x={-20} speed={60} opacity={0.22} />
      <FilmStrip x={990} speed={-60} opacity={0.22} />
      <Stack top={400}>
        <BlurWords
          text="не просто"
          at={cue(s, "не просто")}
          style={{ fontFamily: F.elegant, fontStyle: "italic", fontWeight: 500, fontSize: 70, color: C.muted }}
        />
        <div style={{ position: "relative", display: "inline-block" }}>
          <BlurWords
            text="станцевать"
            at={cue(s, "станцевать")}
            style={{ fontFamily: F.sans, fontWeight: 300, fontSize: 92, letterSpacing: "0.06em", color: `rgba(245,235,221,${1 - strike * 0.55})` }}
          />
          <div
            style={{
              position: "absolute",
              left: -10,
              right: -10,
              top: "52%",
              height: 6,
              transformOrigin: "left",
              transform: `scaleX(${strike}) rotate(-3deg)`,
              background: C.crimson,
              boxShadow: `0 0 18px ${C.crimson}`,
              borderRadius: 3,
            }}
          />
        </div>
        <div style={{ height: 60 }} />
        {verbs.map((v, i) => (
          <Letters
            key={v.w}
            text={v.w.toUpperCase()}
            at={cue(s, v.c)}
            stagger={0.03}
            gold={i === 2}
            style={{
              fontFamily: i === 2 ? F.serif : F.sans,
              fontStyle: i === 2 ? "italic" : "normal",
              fontWeight: i === 2 ? 900 : 800,
              fontSize: i === 2 ? 150 : 82,
              letterSpacing: i === 2 ? "0.02em" : "0.06em",
              color: C.cream,
              lineHeight: 1.25,
            }}
          />
        ))}
        <div style={{ height: 40 }} />
        <BlurWords
          text="свою историю перед камерой"
          at={cue(s, "свою историю")}
          style={{ fontFamily: F.elegant, fontStyle: "italic", fontWeight: 500, fontSize: 62, color: C.cream }}
        />
      </Stack>
    </SceneShell>
  );
};

// ---------------- 11. CTA ----------------
export const Cta: React.FC<{ s: Scene }> = ({ s }) => {
  const t = useTime();
  const btnAt = cue(s, "Пиши");
  const btn = useProgress(btnAt - 0.2, 0.9);
  const glow = 0.5 + 0.5 * Math.sin((t - btnAt) * 5);
  return (
    <SceneShell s={s}>
      <Stack top={340}>
        <Kicker text="ГОТОВ(А)" at={cue(s, "Готов")} color={C.crimson} />
        <div style={{ height: 20 }} />
        <BlurWords
          text="стать главным героем"
          at={cue(s, "стать")}
          style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 700, fontSize: 96, lineHeight: 1.08, color: C.cream }}
        />
        <BlurWords
          text="своего видеоклипа?"
          at={cue(s, "своего")}
          style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 900, fontSize: 96, lineHeight: 1.08 }}
          wordStyle={() => goldText}
        />
        <div style={{ height: 90 }} />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 26,
            padding: "36px 56px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${C.crimson}, #8e1028)`,
            boxShadow: `0 0 ${40 + glow * 50}px rgba(224,38,63,${0.55 + glow * 0.3}), inset 0 2px 0 rgba(255,255,255,0.25)`,
            opacity: btn,
            transform: `translateY(${(1 - btn) * 80}px) scale(${0.85 + btn * 0.15 + glow * 0.015})`,
            overflow: "hidden",
          }}
        >
          <DrawIcon name="envelope" at={btnAt} size={76} color={C.cream} width={5} dur={0.9} />
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 40, letterSpacing: "0.08em", color: C.cream, textAlign: "left", lineHeight: 1.2 }}>
            ПИШИ МНЕ
            <br />В ЛИЧНЫЕ СООБЩЕНИЯ
          </div>
          <Shimmer at={btnAt + 0.6} period={2.2} />
        </div>
        <div style={{ height: 70 }} />
        <BlurWords
          text="и мы начнём создавать твою историю"
          at={cue(s, "и мы начнём")}
          style={{ fontFamily: F.elegant, fontStyle: "italic", fontWeight: 500, fontSize: 60, lineHeight: 1.2, color: C.cream, maxWidth: 820 }}
        />
      </Stack>
      <Sparks at={btnAt + 0.3} cx={540} cy={1010} count={44} />
    </SceneShell>
  );
};

// ---------------- 12. Outro ----------------
export const Outro: React.FC<{ s: Scene }> = ({ s }) => {
  const t = useTime();
  const items = [
    { w: "Твоя песня.", c: "Твоя песня" },
    { w: "Твои эмоции.", c: "Твои эмоции" },
    { w: "Твой танец.", c: "Твой танец" },
    { w: "Твоя история.", c: "Твоя история" },
  ];
  const heartAt = cue(s, "Твоя история") + 0.6;
  const heart = useProgress(heartAt, 0.8);
  const beat = 1 + Math.max(0, Math.sin((t - heartAt) * 7)) * 0.08 * heart;
  return (
    <SceneShell s={s}>
      <Stack top={380}>
        <Letters text="VIDEO" at={0.15} style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 150, letterSpacing: "0.16em", color: C.cream }} />
        <div style={{ position: "relative" }}>
          <Letters
            text="Clip"
            at={0.4}
            gold
            style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 900, fontSize: 220, lineHeight: 0.9, marginTop: -8 }}
          />
        </div>
        <GoldLine at={0.7} width={620} style={{ marginTop: 34 }} />
        <div style={{ height: 50 }} />
        {items.map((it, i) => (
          <BlurWords
            key={it.w}
            text={it.w}
            at={cue(s, it.c)}
            style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: i === 3 ? 900 : 500, fontSize: i === 3 ? 84 : 66, lineHeight: 1.3, color: C.cream }}
            wordStyle={(_, j) => (i === 3 && j === 1 ? goldText : undefined)}
          />
        ))}
        <div style={{ height: 40, marginTop: 30, opacity: heart, transform: `scale(${heart * beat})` }}>
          <DrawIcon name="heart" at={heartAt} size={120} color={C.crimson} fill={C.crimson} dur={0.8} width={4} />
        </div>
      </Stack>
      <Sparks at={heartAt} cx={540} cy={1330} count={30} />
    </SceneShell>
  );
};

export const SCENES: Record<string, React.FC<{ s: Scene }>> = {
  hook: Hook,
  about: About,
  how: How,
  s1: Step,
  s2: Step,
  s3: Step,
  s4: Step,
  s5: Step,
  why: Why,
  feel: Feel,
  cta: Cta,
  outro: Outro,
};
