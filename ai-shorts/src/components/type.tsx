import React from 'react';
import { continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { C, FPS, HEAD, S, clamp, easeIn, mix, prog, rand } from '../lib';

// Fonts are bundled in public/fonts so rendering never depends on the network.
export const sora = 'Sora';
export const mono = 'JetBrains Mono';
const FONTS: [string, string, string][] = [
  [sora, '300', 'Sora-300.woff2'], [sora, '600', 'Sora-600.woff2'], [sora, '800', 'Sora-800.woff2'],
  [mono, '400', 'JetBrainsMono-400.woff2'], [mono, '700', 'JetBrainsMono-700.woff2'],
  ['Space Grotesk', '700', 'SpaceGrotesk-700.woff2'], ['Unbounded', '800', 'Unbounded-800.woff2'], ['Syne', '800', 'Syne-800.woff2'],
  ['Archivo Black', '400', 'ArchivoBlack-400.woff2'], ['Bebas Neue', '400', 'BebasNeue-400.woff2'], ['Oswald', '700', 'Oswald-700.woff2'],
  ['Montserrat', '900', 'Montserrat-900.woff2'],
];
if (typeof document !== 'undefined') {
  const handle = delayRender('fonts');
  Promise.all(
    FONTS.map(([family, weight, file]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, { weight });
      document.fonts.add(face);
      return face.load();
    }),
  ).then(() => continueRender(handle));
}

type Variant = 'rise' | 'slam' | 'decode' | 'wide';

type Props = {
  text: string;
  at: number; // seconds (absolute)
  out?: number; // seconds (absolute) when it leaves
  size: number;
  weight?: number;
  variant?: Variant;
  gradient?: string;
  glow?: string;
  tracking?: number;
  stagger?: number;
  style?: React.CSSProperties;
  font?: string;
};

const GLYPHS = '01<>/{}[]#$%&*+=?ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Kinetic headline. Letters arrive individually (blur → sharp, offset → home),
 * with an RGB-split on entry and a clean push-out on exit.
 */
// Text is measured with the real font (loaded before the first frame), so any headline
// length and any of the style's fonts fit on screen.
let measureCtx: CanvasRenderingContext2D | null = null;
/** Weight to request for the headline face: the extra fonts ship a single weight. */
export const headWeight = (w: number | string) => (S.font === 'sora' ? w : 'normal');
export function fitText(text: string, family: string, weight: number | string, wanted: number, maxW = 960, trackingEm = 0) {
  if (typeof document === 'undefined') return wanted;
  measureCtx ??= document.createElement('canvas').getContext('2d');
  measureCtx!.font = `${weight} 100px "${family}"`;
  const w = measureCtx!.measureText(text).width + trackingEm * 100 * [...text].length;
  return Math.min(wanted, (maxW * 100) / Math.max(1, w));
}

// The episode style decides how headlines enter: hard slams, digital decoding, or soft rises.
const MOTION: Record<string, Partial<Record<Variant, Variant>>> = {
  impact: {},
  digital: { slam: 'decode', rise: 'decode', wide: 'wide' },
  elegant: { slam: 'rise', wide: 'rise' },
};

export const Title: React.FC<Props> = ({
  text, at, out, size: wanted, weight = 800, variant: asked = 'rise', gradient, glow = C.cyan, tracking = -0.02, stagger, style, font,
}) => {
  const t = useCurrentFrame() / FPS;
  const chars = [...text];
  const head = !font || font === sora; // headline face comes from the episode style
  const variant = (head ? MOTION[S.motion]?.[asked] : undefined) ?? asked;
  // Auto-fit: headlines come from the news agent, so their length varies.
  const family = head ? HEAD.family : font!;
  const fw = head ? headWeight(weight) : weight;
  const size = fitText(text, family, fw, wanted, 950, tracking);
  const st = stagger ?? (variant === 'slam' ? 0.018 : variant === 'decode' ? 0.028 : 0.03);
  const exitP = out ? prog(t, out, 0.35, easeIn) : 0;
  if (t < at - 0.05 || exitP >= 1) return null;
  const r = rand(text.length * 97 + Math.round(at * 10));
  const seeds = chars.map(() => r());

  const grad = gradient ?? `linear-gradient(180deg, #ffffff 0%, #dff6ff 45%, ${C.cyan} 100%)`;
  const entryAll = prog(t, at, 0.5);
  const split = (1 - prog(t, at, 0.45)) * (variant === 'slam' ? 26 : 12) + exitP * 30;

  const layer = (dx: number, color: string | null, blend?: string) => (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
        transform: `translateX(${dx}px)`, mixBlendMode: blend as React.CSSProperties['mixBlendMode'], whiteSpace: 'pre',
      }}
    >
      {chars.map((ch, i) => {
        const p = prog(t, at + i * st, variant === 'slam' ? 0.5 : 0.7);
        const sd = seeds[i];
        let tf = '';
        let blur = 0;
        let op = p;
        let glyph = ch;
        if (variant === 'rise') {
          tf = `translateY(${(1 - p) * size * 0.9}px) rotateX(${(1 - p) * -70}deg)`;
          blur = (1 - p) * 14;
        } else if (variant === 'slam') {
          tf = `scale(${mix(2.6, 1, p)}) translateZ(0)`;
          blur = (1 - p) * 22;
          op = clamp(p * 2.2);
        } else if (variant === 'wide') {
          tf = `translateX(${(i - chars.length / 2) * (1 - p) * size * 0.5}px)`;
          blur = (1 - p) * 18;
        } else if (variant === 'decode') {
          const settle = at + i * st + 0.32;
          if (t < settle && ch !== ' ') glyph = GLYPHS[Math.floor((sd * 50 + t * 30) % GLYPHS.length)];
          tf = `translateY(${(1 - p) * 24}px)`;
          op = clamp(p * 3);
          blur = (1 - p) * 6;
        }
        if (exitP > 0) {
          tf += ` translateY(${-exitP * size * 0.6 * (0.6 + sd)}px) scale(${1 + exitP * 0.3})`;
          blur += exitP * 16;
          op *= 1 - exitP;
        }
        return (
          <span
            key={i}
            style={{
              display: 'inline-block', transform: tf, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, opacity: op,
              ...(color
                ? { color }
                : { backgroundImage: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }),
            }}
          >
            {glyph === ' ' ? ' ' : glyph}
          </span>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        position: 'relative', width: '100%', height: size * 1.25, fontFamily: family, fontWeight: fw, fontSize: size,
        letterSpacing: `${tracking + (1 - entryAll) * (variant === 'wide' ? 0.25 : 0.06)}em`, lineHeight: 1, perspective: 800,
        ...style,
      }}
    >
      {split > 0.5 && layer(-split, C.magenta, 'screen')}
      {split > 0.5 && layer(split, C.cyan, 'screen')}
      <div style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${size * 0.18}px ${glow}aa) drop-shadow(0 0 ${size * 0.5}px ${glow}55)` }}>
        {layer(0, null)}
      </div>
    </div>
  );
};

/** Small broadcast label with a wiping bar. */
export const Tag: React.FC<{ text: string; at: number; out?: number; color?: string; style?: React.CSSProperties }> = ({ text, at, out, color = C.cyan, style }) => {
  const t = useCurrentFrame() / FPS;
  const p = prog(t, at, 0.5);
  const e = out ? prog(t, out, 0.3, easeIn) : 0;
  if (p <= 0 || e >= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', opacity: 1 - e, ...style }}>
      <div
        style={{
          position: 'relative', padding: '14px 30px', fontFamily: mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.32em',
          color: '#fff', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, background: `linear-gradient(90deg, ${color}33, ${color}11)`,
          border: `2px solid ${color}aa`, borderRadius: 6, boxShadow: `0 0 40px ${color}44, inset 0 0 20px ${color}22`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
