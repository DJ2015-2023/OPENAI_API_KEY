import React from "react";
import { C, useProgress } from "./fx";

// Line-art icons drawn on with a stroke-dash reveal (pathLength=1 normalises every path).
const ICONS: Record<string, string[]> = {
  music: [
    "M52 88 V32 L98 22 V78",
    "M52 44 L98 34",
    "M52 88 A12 10 0 1 1 28 88 A12 10 0 1 1 52 88 Z",
    "M98 78 A12 10 0 1 1 74 78 A12 10 0 1 1 98 78 Z",
  ],
  clapper: [
    "M20 52 H100 V100 H20 Z",
    "M20 52 L18 36 L96 24 L100 40",
    "M34 34 L44 48 M54 31 L64 45 M74 28 L84 42",
    "M32 70 H88 M32 84 H70",
  ],
  dancer: [
    "M66 24 A9 9 0 1 1 65.9 24 Z",
    "M64 36 C 60 48, 58 56, 56 66",
    "M62 44 L40 32 L28 38",
    "M62 44 L84 52 L98 40",
    "M56 66 L40 86 L28 104",
    "M56 66 L76 82 L72 106",
  ],
  camera: [
    "M16 46 H82 V96 H16 Z",
    "M82 62 L106 48 V94 L82 80",
    "M44 30 A13 13 0 1 1 43.9 30 Z",
    "M70 30 A11 11 0 1 1 69.9 30 Z",
    "M30 60 H52",
  ],
  calendar: [
    "M20 32 H100 V102 H20 Z",
    "M20 50 H100",
    "M42 22 V40 M78 22 V40",
    "M42 76 L55 89 L80 63",
  ],
  heart: [
    "M60 100 C 30 78, 14 62, 14 42 C 14 28, 25 18, 38 18 C 48 18, 56 24, 60 32 C 64 24, 72 18, 82 18 C 95 18, 106 28, 106 42 C 106 62, 90 78, 60 100 Z",
  ],
  envelope: ["M16 34 H104 V92 H16 Z", "M16 34 L60 66 L104 34", "M16 92 L48 60 M104 92 L72 60"],
  star: ["M60 14 L72 46 L106 48 L80 70 L88 104 L60 86 L32 104 L40 70 L14 48 L48 46 Z"],
  clock: ["M60 16 A44 44 0 1 1 59.9 16 Z", "M60 34 V60 L80 72"],
};

export type IconName = keyof typeof ICONS;

export const DrawIcon: React.FC<{
  name: IconName;
  at: number;
  size?: number;
  color?: string;
  dur?: number;
  width?: number;
  fill?: string;
}> = ({ name, at, size = 220, color = C.gold, dur = 1.4, width = 3.2, fill }) => {
  const p = useProgress(at, dur);
  const fillP = useProgress(at + dur * 0.7, 0.6);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible", filter: `drop-shadow(0 0 14px ${color})` }}>
      {ICONS[name].map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill={fill && i === 0 ? fill : "none"}
          fillOpacity={fill ? fillP : 0}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1}
          strokeDashoffset={1 - Math.min(1, Math.max(0, p * ICONS[name].length - i * 0.6) / 1)}
        />
      ))}
    </svg>
  );
};

/** Icon inside a glowing ring with rotating dashed orbit. */
export const IconBadge: React.FC<{ name: IconName; at: number; size?: number }> = ({ name, at, size = 340 }) => {
  const p = useProgress(at, 1.0);
  const spin = useProgress(at, 30, (x) => x);
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${0.7 + p * 0.3})`, opacity: p }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(224,38,63,0.35), rgba(58,10,20,0.35) 60%, transparent 72%)",
        }}
      />
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, transform: `rotate(${spin * 1800}deg)` }}>
        <circle cx="50" cy="50" r="47" fill="none" stroke={C.gold} strokeOpacity={0.55} strokeWidth={0.5} strokeDasharray="1 3" />
      </svg>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="rgba(10,5,8,0.55)"
          stroke={C.gold}
          strokeWidth={0.8}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DrawIcon name={name} at={at + 0.25} size={size * 0.5} />
      </div>
    </div>
  );
};
