import { Composition } from 'remotion';
import { Video } from './Video';
import tl from './timeline.json';

export const Root = () => (
  <Composition
    id="GeminiArgon"
    component={Video}
    width={1080}
    height={1920}
    fps={tl.fps}
    durationInFrames={tl.duration * tl.fps}
  />
);
