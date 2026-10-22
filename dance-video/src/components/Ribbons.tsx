import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, H, W} from '../theme';
import {ClaveParams, DEFAULT_PARAMS, buildPairs, drawClave, makeNoise} from './claveCurrents';

/** Generative "Clave Currents" ribbons. `offset` = scene start frame, so the motion is continuous across scenes. */
export const Ribbons: React.FC<{offset: number; params?: Partial<ClaveParams>; intensity?: number; background?: string | null; style?: React.CSSProperties}> = ({
  offset,
  params,
  intensity = 1,
  background = null,
  style,
}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const prm = useMemo(() => ({...DEFAULT_PARAMS, ...params}), [params]);
  const noise = useMemo(() => makeNoise(prm.seed), [prm.seed]);
  const pairs = useMemo(() => buildPairs(prm, W, H), [prm]);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    drawClave(ctx, (f + offset) / FPS, W, H, prm, noise, pairs, {background, intensity});
  }, [f, offset, prm, noise, pairs, background, intensity]);
  return (
    <AbsoluteFill style={style}>
      <canvas ref={ref} width={W} height={H} style={{width: W, height: H}} />
    </AbsoluteFill>
  );
};
