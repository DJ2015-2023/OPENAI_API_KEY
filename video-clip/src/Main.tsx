import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { Backdrop, clamp, FilmLook } from "./theme";
import { BASE, getTiming, SceneShell, type SceneId } from "./timing";
import { Intro } from "./scenes/Intro";
import { Imagine } from "./scenes/Imagine";
import { NotJust } from "./scenes/NotJust";
import { Step1 } from "./scenes/Step1";
import { Step2 } from "./scenes/Step2";
import { Step3 } from "./scenes/Step3";
import { Step4 } from "./scenes/Step4";
import { Step5 } from "./scenes/Step5";
import { WhyDeck } from "./scenes/WhyDeck";
import { WhyCreate } from "./scenes/WhyCreate";
import { Summary } from "./scenes/Summary";
import { Cta } from "./scenes/Cta";

const SCENE_IDS = Object.keys(BASE) as SceneId[];

export const SCENES = Object.fromEntries(SCENE_IDS.map((id) => [id, getTiming(id).duration])) as Record<SceneId, number>;

export const T = 15; // transition length in frames
export const TOTAL = SCENE_IDS.reduce((a, id) => a + SCENES[id], 0) - T * (SCENE_IDS.length - 1);

const Music: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Audio
      name="Music"
      src={staticFile("sfx/music.wav")}
      premountFor={fps}
      volume={interpolate(frame, [0, fps, durationInFrames - 2 * fps, durationInFrames], [0, 0.3, 0.3, 0], clamp)}
    />
  );
};

export const Main: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = linearTiming({ durationInFrames: T });
  const s = springTiming({ config: { damping: 200 }, durationInFrames: T });
  return (
    <AbsoluteFill style={{ backgroundColor: "#07040d" }}>
      <Backdrop />
      <Music />
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro" durationInFrames={SCENES.Intro} premountFor={fps}>
          <SceneShell scene="Intro">
            <Intro />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence name="Представь" durationInFrames={SCENES.Imagine} premountFor={fps}>
          <SceneShell scene="Imagine">
            <Imagine />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={s} />
        <TransitionSeries.Sequence name="Не просто" durationInFrames={SCENES.NotJust} premountFor={fps}>
          <SceneShell scene="NotJust">
            <NotJust />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={t} />
        <TransitionSeries.Sequence name="Шаг 1" durationInFrames={SCENES.Step1} premountFor={fps}>
          <SceneShell scene="Step1">
            <Step1 />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={s} />
        <TransitionSeries.Sequence name="Шаг 2" durationInFrames={SCENES.Step2} premountFor={fps}>
          <SceneShell scene="Step2">
            <Step2 />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={flip({ direction: "from-left" })} timing={t} />
        <TransitionSeries.Sequence name="Шаг 3" durationInFrames={SCENES.Step3} premountFor={fps}>
          <SceneShell scene="Step3">
            <Step3 />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={s} />
        <TransitionSeries.Sequence name="Шаг 4" durationInFrames={SCENES.Step4} premountFor={fps}>
          <SceneShell scene="Step4">
            <Step4 />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={clockWipe({ width: 1080, height: 1920 })} timing={t} />
        <TransitionSeries.Sequence name="Шаг 5" durationInFrames={SCENES.Step5} premountFor={fps}>
          <SceneShell scene="Step5">
            <Step5 />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={s} />
        <TransitionSeries.Sequence name="Почему особенный" durationInFrames={SCENES.WhyDeck} premountFor={fps}>
          <SceneShell scene="WhyDeck">
            <WhyDeck />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence name="Создать своё" durationInFrames={SCENES.WhyCreate} premountFor={fps}>
          <SceneShell scene="WhyCreate">
            <WhyCreate />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t} />
        <TransitionSeries.Sequence name="Итог" durationInFrames={SCENES.Summary} premountFor={fps}>
          <SceneShell scene="Summary">
            <Summary />
          </SceneShell>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence name="Призыв" durationInFrames={SCENES.Cta} premountFor={fps}>
          <SceneShell scene="Cta">
            <Cta />
          </SceneShell>
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <FilmLook />
    </AbsoluteFill>
  );
};
