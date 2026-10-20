import { Composition } from 'remotion';
import { Video } from './Video';
import { FPS } from './lib';
import type { Timeline } from './types';
import sample from './sample-timeline.json';

export const Root = () => (
  <Composition
    id="AiShort"
    component={Video}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={Math.round((sample as Timeline).duration * FPS)}
    defaultProps={{ timeline: sample as Timeline }}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.timeline.duration * FPS) })}
  />
);
