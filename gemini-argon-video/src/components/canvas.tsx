import { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill } from 'remotion';
import { W, H } from '../lib';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Full-frame canvas at device resolution (2x when rendered with --scale=2). Draws synchronously each frame. */
export const Canvas: React.FC<{ draw: Draw; style?: React.CSSProperties; deps: unknown[] }> = ({ draw, style, deps }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  useLayoutEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, W, H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return (
    <AbsoluteFill style={style}>
      <canvas ref={ref} width={W * dpr} height={H * dpr} style={{ width: W, height: H }} />
    </AbsoluteFill>
  );
};

const sprites = new Map<string, HTMLCanvasElement>();
/** Pre-rendered radial glow, much cheaper than shadowBlur. */
export function glowSprite(color: string, size = 64) {
  const key = color + size;
  if (sprites.has(key)) return sprites.get(key)!;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.12, color);
  grd.addColorStop(0.4, color + '55');
  grd.addColorStop(1, color + '00');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  sprites.set(key, c);
  return c;
}

/** Perspective projection helper: camera at z=0 looking down +z. */
export function project(x: number, y: number, z: number, fov = 900, cx = W / 2, cy = H / 2) {
  const s = fov / Math.max(z, 1);
  return { x: cx + x * s, y: cy + y * s, s };
}
