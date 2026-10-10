import "./fonts";
import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { Main, SCENES, TOTAL } from "./Main";
import { Backdrop, FilmLook } from "./theme";
import { SceneShell, type SceneId } from "./timing";
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

const SIZE = { fps: 30, width: 1080, height: 1920 } as const;

/** Wraps a single scene with the shared backdrop so it can be previewed alone. */
const withLook = (Scene: React.FC, id: SceneId) => {
  const Wrapped: React.FC = () => (
    <AbsoluteFill>
      <Backdrop />
      <SceneShell scene={id}>
        <Scene />
      </SceneShell>
      <FilmLook />
    </AbsoluteFill>
  );
  return Wrapped;
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="VideoClip" component={Main} durationInFrames={TOTAL} {...SIZE} />
      <Composition id="Intro" component={withLook(Intro, "Intro")} durationInFrames={SCENES.Intro} {...SIZE} />
      <Composition id="Imagine" component={withLook(Imagine, "Imagine")} durationInFrames={SCENES.Imagine} {...SIZE} />
      <Composition id="NotJust" component={withLook(NotJust, "NotJust")} durationInFrames={SCENES.NotJust} {...SIZE} />
      <Composition id="Step1" component={withLook(Step1, "Step1")} durationInFrames={SCENES.Step1} {...SIZE} />
      <Composition id="Step2" component={withLook(Step2, "Step2")} durationInFrames={SCENES.Step2} {...SIZE} />
      <Composition id="Step3" component={withLook(Step3, "Step3")} durationInFrames={SCENES.Step3} {...SIZE} />
      <Composition id="Step4" component={withLook(Step4, "Step4")} durationInFrames={SCENES.Step4} {...SIZE} />
      <Composition id="Step5" component={withLook(Step5, "Step5")} durationInFrames={SCENES.Step5} {...SIZE} />
      <Composition id="WhyDeck" component={withLook(WhyDeck, "WhyDeck")} durationInFrames={SCENES.WhyDeck} {...SIZE} />
      <Composition id="WhyCreate" component={withLook(WhyCreate, "WhyCreate")} durationInFrames={SCENES.WhyCreate} {...SIZE} />
      <Composition id="Summary" component={withLook(Summary, "Summary")} durationInFrames={SCENES.Summary} {...SIZE} />
      <Composition id="Cta" component={withLook(Cta, "Cta")} durationInFrames={SCENES.Cta} {...SIZE} />
    </>
  );
};
