import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

/** Full-frame photo with a slow Ken Burns move and a dark cinematic grade for legible text. */
export const PhotoBg: React.FC<{ src: string; duration: number; pan?: "up" | "down" | "left" | "right" }> = ({
  src,
  duration,
  pan = "up",
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d = 40 * p;
  const translate =
    pan === "up" ? `0px ${20 - d}px` : pan === "down" ? `0px ${d - 20}px` : pan === "left" ? `${20 - d}px 0px` : `${d - 20}px 0px`;
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: String(1.1 + 0.1 * p),
          translate,
          filter: "saturate(1.1) contrast(1.05)",
        }}
      />
      {/* grade: darken so text and 3D stay readable, keep the warm light */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(7,4,13,0.78) 0%, rgba(7,4,13,0.5) 35%, rgba(7,4,13,0.55) 60%, rgba(7,4,13,0.85) 100%)",
        }}
      />
      <AbsoluteFill style={{ background: "rgba(40,10,60,0.22)", mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  );
};
