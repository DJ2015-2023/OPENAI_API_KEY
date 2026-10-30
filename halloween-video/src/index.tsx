import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Main} from './Main';
import {FPS, H, TOTAL, W} from './timeline';

const Root: React.FC = () => (
  <Composition id="LatinFusionHalloween" component={Main} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);

registerRoot(Root);
