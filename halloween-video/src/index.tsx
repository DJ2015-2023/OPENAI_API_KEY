import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Main} from './Main';
import {PROMO_FRAMES, Promo} from './Promo';
import {FPS, H, TOTAL, W} from './timeline';

const Root: React.FC = () => (
  <>
    <Composition id="LatinFusionHalloween" component={Main} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="Promo15" component={Promo} durationInFrames={PROMO_FRAMES} fps={FPS} width={W} height={H} />
  </>
);

registerRoot(Root);
