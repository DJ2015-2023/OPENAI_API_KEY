import React, { createContext, useContext } from "react";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import narration from "./narration.json";
import voiceDurations from "./voice-durations.json";

export type SceneId = keyof typeof narration;

/** Original (designed) length of every scene, before the voiceover stretches it. */
export const BASE: Record<SceneId, number> = {
  Intro: 180,
  Imagine: 165,
  NotJust: 215,
  Step1: 275,
  Step2: 285,
  Step3: 290,
  Step4: 245,
  Step5: 270,
  WhyDeck: 190,
  WhyCreate: 200,
  Summary: 220,
  Cta: 270,
};

const GAP = 5; // frames of breath between voice lines
const TAIL = 26; // frames after the last line (covers the 15-frame transition)

export type SceneTiming = {
  /** Piecewise-linear map points: [designedFrame, actualFrame]. */
  points: [number, number][];
  /** Actual start frame of each voice line. */
  starts: number[];
  duration: number;
};

/**
 * Each voice line is anchored to the frame where its visual beat was designed.
 * When a line is longer than the time until the next beat, the animation in between
 * is slowed down so the next visual still lands on the next spoken line.
 */
export const getTiming = (scene: SceneId): SceneTiming => {
  const lines = narration[scene];
  const durs = voiceDurations[scene];
  const base = BASE[scene];
  const points: [number, number][] = [[0, 0]];
  const starts: number[] = [];
  let shift = 0;
  let prevEnd = 0;
  lines.forEach((line, k) => {
    const s = Math.max(line.at + shift, k === 0 ? 0 : prevEnd + GAP);
    shift = s - line.at;
    if (line.at > 0) points.push([line.at, s]);
    starts.push(s);
    prevEnd = s + durs[k];
  });
  points.push([base, base + shift]);
  const duration = Math.max(base + shift, prevEnd + TAIL);
  return { points, starts, duration };
};

const interp = (x: number, pts: [number, number][], from: 0 | 1) => {
  const to = from === 0 ? 1 : 0;
  if (x <= pts[0][from]) return x;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (x <= b[from]) {
      const span = b[from] - a[from];
      return span === 0 ? b[to] : a[to] + ((x - a[from]) / span) * (b[to] - a[to]);
    }
  }
  const last = pts[pts.length - 1];
  // After the designed end the scene holds its final state (actual → designed).
  return from === 1 ? last[0] : last[1] + (x - last[0]);
};

type Ctx = { toDesigned: (f: number) => number; toActual: (f: number) => number };

const SceneTimeContext = createContext<Ctx | null>(null);

/** Frame in the scene's designed timeline (use instead of useCurrentFrame inside scenes). */
export const useSceneFrame = () => {
  const frame = useCurrentFrame();
  const ctx = useContext(SceneTimeContext);
  return ctx ? ctx.toDesigned(frame) : frame;
};

/** Converts a designed frame (e.g. an SFX cue) into the actual frame. */
export const useToActual = () => {
  const ctx = useContext(SceneTimeContext);
  return (f: number) => (ctx ? Math.round(ctx.toActual(f)) : f);
};

/** Wraps a scene: remaps its time and plays its voice lines. */
export const SceneShell: React.FC<{ scene: SceneId; children: React.ReactNode }> = ({ scene, children }) => {
  const { fps } = useVideoConfig();
  const t = getTiming(scene);
  const value: Ctx = {
    toDesigned: (f) => interp(f, t.points, 1),
    toActual: (f) => interp(f, t.points, 0),
  };
  return (
    <SceneTimeContext.Provider value={value}>
      {children}
      {t.starts.map((s, k) => (
        <Audio
          key={k}
          name={`Голос ${k + 1}`}
          src={staticFile(`voice/${scene}-${k}.wav`)}
          from={s}
          premountFor={fps}
          volume={1}
        />
      ))}
    </SceneTimeContext.Provider>
  );
};
