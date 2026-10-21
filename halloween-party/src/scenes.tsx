import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import {
  BEAT,
  Burst,
  C,
  F,
  Flip3D,
  Rise,
  Shimmer,
  Shockwave,
  Slam,
  clamp01,
  ease,
  easeIn,
  fireText,
  goldText,
  useProgress,
  useShake,
  useTime,
  backOut,
} from "./fx";
import { Big31, PumpkinMoon } from "./three3d";

export type Enter = "iris" | "glitch" | "flip" | "zoom" | "drop" | "none";
export type Exit = "flip" | "zoom" | "fade" | "none";

/** Wraps a scene with its in/out transition. Times are local to the scene. */
export const Shell: React.FC<{ dur: number; enter: Enter; exit: Exit; children: React.ReactNode }> = ({ dur, enter, exit, children }) => {
  const t = useTime();
  const pin = clamp01(t / 0.5);
  const e = ease(pin);
  const pout = clamp01((t - (dur - 0.35)) / 0.35);
  const x = easeIn(pout);
  let transform = "";
  let filter = "";
  let clipPath: string | undefined;
  let opacity = 1;
  if (enter === "iris") clipPath = `circle(${e * 140}% at 50% 50%)`;
  if (enter === "glitch" && t < 0.4) {
    const j = Math.floor(t * 30);
    transform += ` translateX(${(j % 2 ? 1 : -1) * (1 - t / 0.4) * 40}px)`;
    filter += ` hue-rotate(${(j % 3) * 40}deg) saturate(1.6)`;
  }
  if (enter === "flip") transform += ` perspective(1600px) rotateY(${(1 - e) * -90}deg)`;
  if (enter === "zoom") {
    transform += ` scale(${0.55 + e * 0.45})`;
    filter += ` blur(${(1 - e) * 20}px)`;
    opacity = e;
  }
  if (enter === "drop") transform += ` translateY(${(1 - e) * -220}px)`;
  if (exit === "flip") transform += ` perspective(1600px) rotateY(${x * 90}deg)`;
  if (exit === "zoom") {
    transform += ` scale(${1 + x * 2.2})`;
    filter += ` blur(${x * 24}px)`;
    opacity *= 1 - x;
  }
  if (exit === "fade") {
    opacity *= 1 - x;
    filter += ` brightness(${1 + x * 1.5})`;
  }
  return <AbsoluteFill style={{ transform, filter: filter || undefined, clipPath, opacity }}>{children}</AbsoluteFill>;
};

const Col: React.FC<{ children: React.ReactNode; top?: number; bottom?: number; style?: React.CSSProperties }> = ({
  children,
  top = 250,
  bottom = 300,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 70,
      right: 70,
      top,
      bottom,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      ...style,
    }}
  >
    {children}
  </div>
);

const Kicker: React.FC<{ text: string; at: number; color?: string }> = ({ text, at, color = C.gold }) => {
  const p = useProgress(at, 0.6);
  return (
    <div
      style={{
        fontFamily: F.oswald,
        fontWeight: 500,
        fontSize: 40,
        letterSpacing: "0.5em",
        paddingLeft: "0.5em",
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      <span style={{ width: 70 * p, height: 2, background: color, display: "block" }} />
      {text}
      <span style={{ width: 70 * p, height: 2, background: color, display: "block" }} />
    </div>
  );
};

// ---------------- Icons ----------------
const ICON: Record<string, string[]> = {
  clock: ["M60 14 A46 46 0 1 1 59.9 14 Z", "M60 32 V60 L82 74"],
  hat: ["M14 96 C40 86 80 86 106 96 C88 104 32 104 14 96 Z", "M36 90 L58 22 C62 14 70 16 70 24 L84 90", "M42 74 C54 70 68 70 80 74"],
  mask: [
    "M10 44 C30 30 50 38 60 46 C70 38 90 30 110 44 C108 70 92 84 74 78 C66 76 62 68 60 62 C58 68 54 76 46 78 C28 84 12 70 10 44 Z",
    "M28 54 C34 48 42 48 48 56 C42 62 34 62 28 54 Z",
    "M92 54 C86 48 78 48 72 56 C78 62 86 62 92 54 Z",
  ],
  rose: [
    "M60 54 C44 54 40 38 50 30 C54 22 66 22 70 30 C80 38 76 54 60 54 Z",
    "M54 34 C58 40 66 40 66 32",
    "M60 54 C60 74 58 92 56 110",
    "M58 80 C46 74 38 76 32 84 C44 88 52 86 58 80",
  ],
  ticket: ["M12 36 H108 V54 C100 54 100 66 108 66 V84 H12 V66 C20 66 20 54 12 54 Z", "M80 38 V82"],
  pin: ["M60 110 C40 80 24 64 24 44 C24 24 40 10 60 10 C80 10 96 24 96 44 C96 64 80 80 60 110 Z", "M60 30 A14 14 0 1 1 59.9 30 Z"],
  plane: ["M10 56 L108 16 L88 104 L60 78 L44 98 L42 72 L96 26 L36 66 Z"],
  globe: ["M60 14 A46 46 0 1 1 59.9 14 Z", "M14 60 H106", "M60 14 C36 36 36 84 60 106 C84 84 84 36 60 14"],
  chat: ["M16 24 H104 V80 H50 L28 100 V80 H16 Z", "M36 46 H84 M36 60 H70"],
};

export const Icon: React.FC<{ name: string; at: number; size?: number; color?: string; dur?: number; width?: number }> = ({
  name,
  at,
  size = 120,
  color = C.gold,
  dur = 0.9,
  width = 4,
}) => {
  const p = useProgress(at, dur);
  const paths = ICON[name];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible", filter: `drop-shadow(0 0 10px ${color})` }}>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - clamp01(p * paths.length - i * 0.6)}
        />
      ))}
    </svg>
  );
};

// ---------------- 1. Title: Latin Fusion · Halloween Party ----------------
export const Title: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useTime();
  const shake = useShake([0, BEAT, 3 * BEAT, 4 * BEAT], 22);
  const halo = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <Shell dur={dur} enter="iris" exit="fade">
      <PumpkinMoon />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        <Col top={420} bottom={640}>
          <Flip3D
            text="LATIN"
            at={0.0}
            stagger={0.06}
            style={{ fontFamily: F.cinzel, fontWeight: 900, fontSize: 196, lineHeight: 1 }}
            letter={{ ...goldText, filter: "drop-shadow(0 0 30px rgba(255,140,40,0.55))" }}
          />
          <Flip3D
            text="FUSION"
            at={BEAT}
            stagger={0.06}
            style={{ fontFamily: F.cinzel, fontWeight: 900, fontSize: 164, lineHeight: 1.05 }}
            letter={{ ...goldText, filter: "drop-shadow(0 0 30px rgba(255,140,40,0.55))" }}
          />
          <div style={{ height: 40 }} />
          <Slam
            text="HALLOWEEN"
            at={3 * BEAT}
            style={{ fontFamily: F.creep, fontSize: 168, lineHeight: 1, letterSpacing: "0.04em" }}
            textStyle={{ ...fireText, filter: `drop-shadow(0 0 ${20 + halo * 20}px rgba(255,90,20,0.8))` }}
          />
          <Slam
            text="Party"
            at={4 * BEAT}
            style={{ fontFamily: F.script, fontSize: 150, lineHeight: 0.9, marginTop: -6 }}
            textStyle={{ color: C.red, textShadow: `0 0 ${30 + halo * 25}px rgba(255,30,50,0.9)` }}
          />
          <Shimmer at={1.0} period={2.2} />
        </Col>
      </div>
      <Burst at={3 * BEAT} cx={540} cy={1060} count={44} />
      <Shockwave at={3 * BEAT} cy={1060} color={C.ember} />
    </Shell>
  );
};

// ---------------- 2. Passion ----------------
export const Passion: React.FC<{ dur: number }> = ({ dur }) => {
  const hits = [BEAT, 2 * BEAT, 3 * BEAT, 5 * BEAT];
  const shake = useShake(hits, 26);
  const t = useTime();
  const flick = 0.85 + 0.15 * Math.sin(t * 31) * Math.sin(t * 13);
  return (
    <Shell dur={dur} enter="glitch" exit="none">
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        <Col top={300} bottom={360}>
          <Rise at={0.1}>
            <div style={{ fontFamily: F.garamond, fontStyle: "italic", fontWeight: 600, fontSize: 70, color: C.muted }}>это будет</div>
          </Rise>
          <Slam
            text="САМАЯ"
            at={0.15}
            style={{ fontFamily: F.oswald, fontWeight: 500, fontSize: 80, letterSpacing: "0.4em", paddingLeft: "0.4em", color: C.cream, marginTop: 10 }}
          />
          <Slam
            text="ЖАРКАЯ"
            at={hits[0]}
            style={{ fontFamily: F.oswald, fontWeight: 700, fontSize: 210, lineHeight: 1.0, marginTop: 6 }}
            textStyle={{ ...fireText, filter: `brightness(${flick}) drop-shadow(0 0 30px rgba(255,100,20,0.8))` }}
          />
          <Slam
            text="СТРАСТНАЯ"
            at={hits[1]}
            style={{ fontFamily: F.oswald, fontWeight: 700, fontSize: 162, lineHeight: 1.05 }}
            textStyle={{ color: C.red, textShadow: "0 0 40px rgba(255,20,50,0.9)" }}
          />
          <Slam
            text="МИСТИЧЕСКАЯ"
            at={hits[2]}
            style={{ fontFamily: F.oswald, fontWeight: 600, fontSize: 128, lineHeight: 1.1 }}
            textStyle={{ color: "#e9d8ff", textShadow: "0 0 40px rgba(176,108,255,0.95), 0 0 90px rgba(120,40,255,0.6)" }}
          />
          <div style={{ height: 30 }} />
          <Slam
            text="ночь осени"
            at={hits[3]}
            style={{ fontFamily: F.script, fontSize: 140, lineHeight: 1 }}
            textStyle={{ ...goldText, filter: "drop-shadow(0 0 24px rgba(255,170,60,0.7))" }}
          />
        </Col>
      </div>
      <Burst at={hits[0]} cx={540} cy={760} />
      <Burst at={hits[1]} cx={540} cy={930} color={C.red} />
      <Burst at={hits[2]} cx={540} cy={1080} color={C.violet} />
      <Shockwave at={hits[3]} cy={1240} color={C.gold} />
    </Shell>
  );
};

// ---------------- 3. Date & time ----------------
const Digit: React.FC<{ to: string; at: number }> = ({ to, at }) => {
  // Odometer roll: spins through digits before landing.
  const t = useTime();
  const n = Number(to);
  const p = interpolate(t, [at, at + 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const pos = (n + 20) * p;
  return (
    <div style={{ height: 150, overflow: "hidden", position: "relative", width: "0.62em" }}>
      <div style={{ transform: `translateY(${-(pos % 10) * 150}px)`, filter: `blur(${(1 - p) * 6}px)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <div key={i} style={{ height: 150, lineHeight: "150px" }}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

const Time: React.FC<{ value: string; at: number }> = ({ value, at }) => (
  <div style={{ display: "flex", fontFamily: F.oswald, fontWeight: 600, fontSize: 140, color: C.cream, textShadow: "0 0 30px rgba(255,60,60,0.6)" }}>
    {value.split("").map((ch, i) =>
      /\d/.test(ch) ? <Digit key={i} to={ch} at={at + i * 0.06} /> : <div key={i} style={{ height: 150, lineHeight: "150px" }}>{ch}</div>,
    )}
  </div>
);

export const DateTime: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useTime();
  const clockAt = 4 * BEAT;
  const hand = interpolate(t, [clockAt, clockAt + 2.5], [0, 720], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Shell dur={dur} enter="drop" exit="none">
      <Big31 />
      <Col top={900} bottom={300}>
        <Flip3D text="ОКТЯБРЯ" at={0.7} stagger={0.04} style={{ fontFamily: F.sc, fontWeight: 900, fontSize: 124, lineHeight: 1 }} letter={goldText} />
        <Rise at={1.1}>
          <div style={{ fontFamily: F.oswald, fontWeight: 500, fontSize: 48, letterSpacing: "0.6em", paddingLeft: "0.6em", color: C.red, marginTop: 14 }}>
            СУББОТА
          </div>
        </Rise>
        <div style={{ height: 70 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ position: "relative", width: 110, height: 110 }}>
            <Icon name="clock" at={clockAt - 0.2} size={110} color={C.red} />
            <div
              style={{
                position: "absolute",
                left: 53,
                top: 22,
                width: 4,
                height: 34,
                background: C.cream,
                transformOrigin: "50% 100%",
                transform: `rotate(${hand}deg)`,
                opacity: clamp01((t - clockAt) * 3),
              }}
            />
          </div>
          <Rise at={clockAt}>
            <div style={{ fontFamily: F.oswald, fontWeight: 500, fontSize: 44, letterSpacing: "0.3em", color: C.muted, textAlign: "left" }}>ТАНЦУЕМ</div>
          </Rise>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
          <Time value="23:30" at={clockAt + 0.2} />
          <Rise at={clockAt + 0.5}>
            <div style={{ fontFamily: F.oswald, fontSize: 100, color: C.red }}>—</div>
          </Rise>
          <Time value="05:00" at={clockAt + 0.6} />
        </div>
        <Rise at={clockAt + 1.3}>
          <div style={{ fontFamily: F.script, fontSize: 92, ...goldText, marginTop: 6 }}>до самого утра!</div>
        </Rise>
      </Col>
      <Shockwave at={0.4} cy={520} color={C.gold} />
    </Shell>
  );
};

// ---------------- 4. Dress code ----------------
const DressCard: React.FC<{ title: string; icon: string; at: number; tilt: number }> = ({ title, icon, at, tilt }) => {
  const t = useTime();
  const p = interpolate(t, [at, at + 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: backOut });
  const float = Math.sin((t - at) * 2) * 8;
  return (
    <div style={{ perspective: 1200 }}>
      <div
        style={{
          width: 860,
          height: 200,
          borderRadius: 26,
          display: "flex",
          alignItems: "center",
          gap: 40,
          padding: "0 50px",
          background: "linear-gradient(120deg, rgba(20,4,8,0.92), rgba(70,6,16,0.85))",
          border: "1.5px solid rgba(240,192,96,0.5)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.6), inset 0 0 50px rgba(255,40,60,0.12)",
          transform: `translateY(${float}px) rotateY(${(1 - p) * 110 + tilt}deg) rotateX(${tilt * 0.4}deg)`,
          opacity: clamp01(p * 3),
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Icon name={icon} at={at + 0.2} size={120} />
        <div style={{ fontFamily: F.sc, fontWeight: 700, fontSize: 70, color: C.cream, letterSpacing: "0.02em" }}>{title}</div>
        <Shimmer at={at + 0.6} period={2.6} />
      </div>
    </div>
  );
};

export const Dress: React.FC<{ dur: number }> = ({ dur }) => (
  <Shell dur={dur} enter="none" exit="flip">
    <Col top={260} bottom={300}>
      <Kicker text="ДРЕСС-КОД" at={0.3} color={C.red} />
      <div style={{ height: 24 }} />
      <Rise at={0.5}>
        <div style={{ fontFamily: F.script, fontSize: 104, lineHeight: 1.05, ...goldText }}>самые дерзкие образы</div>
      </Rise>
      <div style={{ height: 50 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <DressCard title="Dark Elegance" icon="rose" at={2 * BEAT} tilt={-6} />
        <DressCard title="Total Black" icon="hat" at={3 * BEAT} tilt={5} />
        <DressCard title="Spooky Chic" icon="mask" at={4 * BEAT} tilt={-4} />
      </div>
      <div style={{ height: 50 }} />
      <Rise at={5 * BEAT}>
        <div style={{ fontFamily: F.oswald, fontWeight: 400, fontSize: 44, letterSpacing: "0.18em", color: C.muted }}>КОСТЮМЫ · МАСКИ · ГРИМ</div>
      </Rise>
    </Col>
  </Shell>
);

// ---------------- 5. Prices ----------------
const PRICES = [
  { date: "21.10 — 26.10", price: 750, tag: "ЛУЧШАЯ ЦЕНА" },
  { date: "27.10 — 30.10", price: 850 },
  { date: "31.10 до 23:30", price: 950 },
  { date: "НА ВХОДЕ", price: 1500 },
];

const Ticket: React.FC<{ date: string; price: number; tag?: string; at: number; i: number }> = ({ date, price, tag, at, i }) => {
  const t = useTime();
  const p = interpolate(t, [at, at + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const count = Math.round(interpolate(t, [at + 0.1, at + 0.7], [0, price], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const hot = i === 0;
  const pulse = hot ? 1 + Math.max(0, Math.sin((t - at) * 6)) * 0.02 : 1;
  return (
    <div style={{ perspective: 1400 }}>
      <div
        style={{
          position: "relative",
          width: 880,
          height: 170,
          display: "flex",
          alignItems: "center",
          transform: `translateZ(${(1 - p) * 700}px) rotateX(${(1 - p) * 70}deg) rotateZ(${(1 - p) * (i % 2 ? 8 : -8)}deg) scale(${pulse})`,
          opacity: clamp01(p * 2),
          filter: `blur(${(1 - p) * 8}px)`,
          // Ticket notches cut with radial masks on both sides.
          WebkitMaskImage:
            "radial-gradient(circle at 0 50%, transparent 26px, #000 27px), radial-gradient(circle at 100% 50%, transparent 26px, #000 27px)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
          background: hot
            ? "linear-gradient(110deg, #ffd27a, #f0a040 50%, #c2611a)"
            : "linear-gradient(110deg, rgba(60,8,16,0.95), rgba(25,4,8,0.95))",
          border: hot ? undefined : "1.5px solid rgba(240,192,96,0.45)",
          boxShadow: hot ? "0 0 60px rgba(255,150,40,0.6)" : "0 20px 50px rgba(0,0,0,0.5)",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, paddingLeft: 60, textAlign: "left" }}>
          <div style={{ fontFamily: F.oswald, fontWeight: 500, fontSize: 48, letterSpacing: "0.08em", color: hot ? "#2a0806" : C.cream }}>{date}</div>
          {tag ? (
            <div style={{ fontFamily: F.oswald, fontWeight: 700, fontSize: 26, letterSpacing: "0.3em", color: "#7a0a10", marginTop: 4 }}>{tag}</div>
          ) : null}
        </div>
        <div style={{ width: 0, height: 120, borderLeft: `3px dashed ${hot ? "rgba(60,10,6,0.5)" : "rgba(240,192,96,0.4)"}` }} />
        <div
          style={{
            width: 300,
            textAlign: "center",
            fontFamily: F.oswald,
            fontWeight: 700,
            fontSize: 92,
            color: hot ? "#2a0806" : C.gold,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
          <span style={{ fontSize: 54, marginLeft: 6 }}>₽</span>
        </div>
        <Shimmer at={at + 0.7} period={2} />
      </div>
    </div>
  );
};

export const Prices: React.FC<{ dur: number }> = ({ dur }) => (
  <Shell dur={dur} enter="flip" exit="zoom">
    <Col top={250} bottom={300}>
      <Kicker text="БИЛЕТЫ" at={0.3} />
      <div style={{ height: 20 }} />
      <Rise at={0.5}>
        <div style={{ fontFamily: F.script, fontSize: 96, color: C.red, textShadow: "0 0 30px rgba(255,30,50,0.8)" }}>успей купить дешевле</div>
      </Rise>
      <div style={{ height: 46 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {PRICES.map((p, i) => (
          <Ticket key={p.date} {...p} at={(2 + i) * BEAT} i={i} />
        ))}
      </div>
      <div style={{ height: 56 }} />
      <Rise at={6 * BEAT}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "22px 46px",
            borderRadius: 999,
            border: `2px solid ${C.gold}`,
            fontFamily: F.oswald,
            fontWeight: 600,
            fontSize: 50,
            letterSpacing: "0.06em",
            color: C.cream,
            boxShadow: "0 0 40px rgba(240,192,96,0.35)",
          }}
        >
          <Icon name="ticket" at={6 * BEAT} size={64} />
          latinfusion.ru
        </div>
      </Rise>
    </Col>
  </Shell>
);

// ---------------- 6. Location & contacts ----------------
export const Location: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useTime();
  const drop = interpolate(t, [BEAT, 2 * BEAT], [-700, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: backOut });
  const rings = [0, 1, 2].map((i) => clamp01(((t - 2 * BEAT - i * BEAT) % (3 * BEAT)) / (3 * BEAT)));
  return (
    <Shell dur={dur} enter="zoom" exit="none">
      <Col top={240} bottom={300}>
        <div style={{ position: "relative", width: 260, height: 260 }}>
          {t > 2 * BEAT
            ? rings.map((r, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 130 - r * 130,
                    top: 220 - r * 40,
                    width: r * 260,
                    height: r * 80,
                    borderRadius: "50%",
                    border: `3px solid ${C.red}`,
                    opacity: 1 - r,
                  }}
                />
              ))
            : null}
          <div style={{ position: "absolute", left: 50, top: 10, transform: `translateY(${drop}px)` }}>
            <svg width="160" height="200" viewBox="0 0 120 150" style={{ filter: "drop-shadow(0 0 24px rgba(255,30,50,0.9))" }}>
              <path d="M60 140 C36 104 16 84 16 56 C16 30 36 12 60 12 C84 12 104 30 104 56 C104 84 84 104 60 140 Z" fill={C.blood} />
              <circle cx="60" cy="56" r="18" fill="#1a0306" />
            </svg>
          </div>
        </div>
        <div style={{ height: 30 }} />
        <Flip3D text="TEMPLE BAR" at={2 * BEAT} stagger={0.045} style={{ fontFamily: F.sc, fontWeight: 900, fontSize: 132, lineHeight: 1 }} letter={goldText} />
        <Rise at={1.4}>
          <div style={{ fontFamily: F.oswald, fontWeight: 500, fontSize: 50, letterSpacing: "0.2em", color: C.red, marginTop: 20 }}>М. КУРСКАЯ</div>
        </Rise>
        <Rise at={1.6}>
          <div style={{ fontFamily: F.garamond, fontStyle: "italic", fontWeight: 600, fontSize: 52, lineHeight: 1.25, color: C.cream, marginTop: 10 }}>
            Нижний Сусальный пер., д. 5, стр. 4а
          </div>
        </Rise>
        <div style={{ height: 70 }} />
        {[
          { icon: "globe", text: "latinfusion.ru", sub: "билеты", at: 4 * BEAT },
          { icon: "plane", text: "t.me/MSDE_BACHATA", sub: "видео и подробности", at: 5 * BEAT },
          { icon: "chat", text: "Direct / ЛС", sub: "бронирование", at: 6 * BEAT },
        ].map((r) => (
          <Rise key={r.text} at={r.at} dist={40}>
            <div style={{ display: "flex", alignItems: "center", gap: 28, width: 800, padding: "14px 0" }}>
              <Icon name={r.icon} at={r.at} size={72} color={C.gold} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: F.oswald, fontWeight: 600, fontSize: 52, color: C.cream, letterSpacing: "0.02em" }}>{r.text}</div>
                <div style={{ fontFamily: F.oswald, fontWeight: 400, fontSize: 30, letterSpacing: "0.22em", color: C.muted }}>{r.sub.toUpperCase()}</div>
              </div>
            </div>
          </Rise>
        ))}
      </Col>
    </Shell>
  );
};

// ---------------- 7. Poster finale ----------------
export const Poster: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useTime();
  const iris = interpolate(t, [0, 0.9], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const zoom = 1.12 - 0.12 * ease(clamp01(t / 2.2)) + t * 0.006;
  const sweep = interpolate(t, [1.0, 2.2], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flicker = 0.92 + 0.08 * Math.sin(t * 17) * Math.sin(t * 5.3);
  const top = useProgress(1.2, 0.8);
  const bottom = useProgress(1.6, 0.8);
  // Poster is 1122x1402 (4:5); fit to width inside the 9:16 frame.
  const ph = (1080 / 1122) * 1402;
  const py = (1920 - ph) / 2;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${iris * 120}% at 50% 55%)` }}>
        <Img
          src={staticFile("poster.png")}
          style={{
            position: "absolute",
            left: -300,
            top: -100,
            width: 1680,
            height: 2120,
            objectFit: "cover",
            filter: "blur(40px) brightness(0.45) saturate(1.3)",
          }}
        />
        <div style={{ position: "absolute", left: 0, top: py, width: 1080, height: ph, overflow: "hidden", boxShadow: "0 0 80px rgba(255,40,40,0.35)" }}>
          <Img
            src={staticFile("poster.png")}
            style={{ width: "100%", height: "100%", transform: `scale(${zoom})`, filter: `brightness(${flicker})` }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(110deg, transparent ${sweep - 12}%, rgba(255,230,190,0.35) ${sweep}%, transparent ${sweep + 12}%)`,
              mixBlendMode: "screen",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: py / 2 - 60,
            textAlign: "center",
            opacity: top,
            transform: `translateY(${(1 - top) * -30}px)`,
            fontFamily: F.script,
            fontSize: 96,
            ...goldText,
            filter: "drop-shadow(0 0 20px rgba(255,140,40,0.6))",
          }}
        >
          до встречи 31 октября!
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: py + ph + (py - 70) / 2,
            textAlign: "center",
            opacity: bottom,
            transform: `translateY(${(1 - bottom) * 30}px)`,
            fontFamily: F.oswald,
            fontWeight: 600,
            fontSize: 52,
            letterSpacing: "0.12em",
            color: C.cream,
          }}
        >
          БИЛЕТЫ · LATINFUSION.RU
        </div>
      </AbsoluteFill>
      {/* Glowing rim of the iris while it opens */}
      {iris < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - iris * 1873,
            top: 1056 - iris * 1873,
            width: iris * 3746,
            height: iris * 3746,
            borderRadius: "50%",
            border: `${14 * (1 - iris)}px solid ${C.ember}`,
            boxShadow: `0 0 80px ${C.ember}`,
            opacity: 1 - iris,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
