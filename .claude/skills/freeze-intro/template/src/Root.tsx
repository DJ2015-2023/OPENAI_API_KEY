import React from 'react';
import {Composition} from 'remotion';
import {FreezeIntro} from './FreezeIntro';
import timeline from './timeline.json';

export const Root: React.FC = () => <Composition id="FreezeIntro" component={FreezeIntro} durationInFrames={timeline.total} fps={timeline.fps} width={1080} height={1920} />;
