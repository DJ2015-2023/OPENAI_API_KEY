import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import type { TimedScene, Timeline } from './types';
import { C, FPS, W, H, HEAD, S, TimelineCtx, applyStyle, clamp, easeIn, easeOut, impactEnergy, noise1, prog, rgba } from './lib';
import { Canvas } from './components/canvas';
import { Captions } from './components/captions';
import { mono, sora } from './components/type';
import { Hook } from './scenes/Hook';
import { Reveal } from './scenes/Reveal';
import { List } from './scenes/List';
import { Stat } from './scenes/Stat';
import { Cards } from './scenes/Cards';
import { Outro } from './scenes/Outro';

const SCENES: Record<TimedScene['type'], React.FC<{ s: any }>> = {
  hook: Hook, reveal: Reveal, list: List, stat: Stat, cards: Cards, outro: Outro,
};
const PAD = 0.4; // seconds of overlap for transitions

/** Each scene flies in from behind the lens and leaves by flying past the camera. */
const SceneShell: React.FC<{ start: number; end: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ start, end, first, last, children }) => {
  const t = useCurrentFrame() / FPS;
  const pin = first ? 1 : prog(t, start - 0.12, 0.5, easeOut);
  const pout = last ? 0 : prog(t, end - 0.28, 0.4, easeIn);
  let transform = '';
  let blur = 0;
  let op = clamp(pin * 1.6) * (1 - pout);
  let clip: string | undefined;
  if (S.transition === 'whip') {
    // fast horizontal pan: arrive from the right, leave to the left
    transform = `translateX(${(1 - pin) * W * 1.1 - pout * W * 1.1}px) skewX(${((1 - pin) - pout) * -8}deg)`;
    blur = (1 - pin) * 18 + pout * 18;
    op = clamp(pin * 3) * (1 - clamp(pout * 1.5));
  } else if (S.transition === 'iris') {
    // circular reveal from the center; the old scene shrinks away behind it
    clip = pin < 1 ? `circle(${pin * 120}% at 50% 50%)` : undefined;
    transform = `scale(${1 + (1 - pin) * 0.15 - pout * 0.2})`;
    op = 1 - pout;
  } else if (S.transition === 'glitch') {
    // stepped jitter with hard cuts
    const j = (1 - pin) + pout;
    const step = Math.floor(t * 24);
    const dx = j > 0.02 ? (((step * 7919) % 13) - 6) * 14 * j : 0;
    transform = `translate(${dx}px, ${-dx * 0.3}px) scaleY(${1 + j * 0.08})`;
    op = pin < 0.25 ? (step % 2 ? 0.4 : 1) * pin * 4 : pout > 0.75 ? (step % 2 ? 0.5 : 0) : 1;
    blur = j * 6;
  } else {
    const scale = (0.72 + 0.28 * pin) * (1 + pout * 1.4);
    transform = `scale(${scale}) rotate(${(1 - pin) * -4 + pout * 3}deg)`;
    blur = (1 - pin) * 24 + pout * 30;
  }
  return (
    <AbsoluteFill style={{ opacity: op, transform, clipPath: clip, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

const Flash: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const t = useCurrentFrame() / FPS;
  let f = 0;
  for (const s of tl.scenes.slice(1)) f = Math.max(f, Math.exp(-Math.abs(t - s.start) * 14));
  // Loop seam: the video ends on a white flash and opens out of one, so a replay feels continuous.
  f = Math.max(f, clamp(1 - t / 0.3), clamp((t - (tl.duration - 0.3)) / 0.3));
  const first = tl.scenes[0].cues[0];
  if (t >= first) f = Math.max(f, Math.exp(-(t - first) * 6));
  const e = clamp(impactEnergy(tl.sfx, t) * 0.5);
  const flare = Math.max(f, e);
  if (flare < 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${f * 0.95}) 0%, ${rgba(C.cyan, f * 0.6)} 30%, ${rgba(C.violet, f * 0.25)} 60%, transparent 85%)` }} />
      <div style={{ position: 'absolute', left: -200, right: -200, top: H / 2 - 3, height: 6, background: `linear-gradient(90deg, transparent, ${C.cyan}, #fff, ${C.cyan}, transparent)`, opacity: flare, filter: 'blur(2px)', transform: `scaleY(${1 + flare * 3})` }} />
      <div style={{ position: 'absolute', left: -200, right: -200, top: H / 2 - 40, height: 80, background: `linear-gradient(90deg, transparent, ${C.blue}66, ${C.cyan}88, ${C.blue}66, transparent)`, opacity: flare * 0.6, filter: 'blur(24px)' }} />
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Canvas
      deps={[frame]}
      style={{ mixBlendMode: 'overlay', opacity: 0.2, pointerEvents: 'none' }}
      draw={(ctx, w, h) => {
        const tile = 180;
        const img = ctx.createImageData(tile, tile);
        let s = frame * 9301 + 49297;
        for (let i = 0; i < img.data.length; i += 4) {
          s = (s * 1103515245 + 12345) & 0x7fffffff;
          const v = (s >> 16) & 255;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        const c = document.createElement('canvas');
        c.width = c.height = tile;
        c.getContext('2d')!.putImageData(img, 0, 0);
        ctx.fillStyle = ctx.createPattern(c, 'repeat')!;
        ctx.fillRect(0, 0, w, h);
      }}
    />
  );
};

const Hud: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const t = useCurrentFrame() / FPS;
  const on = tl.scenes[0].cues[0] + 0.35;
  const p = prog(t, on, 0.7);
  if (p <= 0) return null;
  const live = Math.sin(t * Math.PI * 2) > -0.2;
  const ticker = `${tl.ticker.toUpperCase()}  •  `;
  const corner = (r: number) => (
    <div style={{ position: 'absolute', width: 70, height: 70, borderColor: `${C.cyan}99`, borderStyle: 'solid', borderWidth: 0, transform: `rotate(${r}deg)`, borderTopWidth: 3, borderLeftWidth: 3 }} />
  );
  if (S.hud === 'minimal') {
    return (
      <AbsoluteFill style={{ opacity: p, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 130, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, alignItems: 'center', fontFamily: mono, fontSize: 24, letterSpacing: '0.4em', color: '#e6f2ff' }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: live ? '#ff3b5c' : '#5a1020' }} />
          AI NEWS
        </div>
        <div style={{ position: 'absolute', top: 175, left: '50%', width: 220 * p, height: 2, transform: 'translateX(-50%)', background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }} />
      </AbsoluteFill>
    );
  }
  if (S.hud === 'badge') {
    return (
      <AbsoluteFill style={{ opacity: p, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 120, left: 60, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 26px', borderRadius: 999, background: `linear-gradient(90deg, ${C.blue}, ${C.violet})`, boxShadow: `0 0 40px ${rgba(C.violet, 0.5)}`, transform: `translateX(${(1 - p) * -300}px)`, fontFamily: HEAD.family, fontSize: 30, color: '#fff', letterSpacing: '0.06em' }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: live ? '#fff' : 'rgba(255,255,255,0.4)' }} />
          AI NEWS · LIVE
        </div>
        <div style={{ position: 'absolute', top: 132, right: 60, fontFamily: mono, fontSize: 24, color: '#cfe9ff', opacity: 0.75 }}>
          {`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ opacity: p, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 120, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: mono, fontSize: 26, color: '#cfe9ff', letterSpacing: '0.2em', transform: `translateY(${(1 - p) * -40}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: live ? '#ff3b5c' : '#5a1020', boxShadow: live ? '0 0 18px #ff3b5c' : 'none' }} />
          <span style={{ fontWeight: 700 }}>LIVE</span>
          <span style={{ opacity: 0.55 }}>AI NEWS NETWORK</span>
        </div>
        <span style={{ opacity: 0.7 }}>{`00:${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 30)).padStart(2, '0')}`}</span>
      </div>
      <div style={{ position: 'absolute', top: 178, left: 0, right: 0, height: 56, overflow: 'hidden', background: 'linear-gradient(90deg, #0b1630ee, #101b3dcc)', borderTop: `1px solid ${C.cyan}55`, borderBottom: `1px solid ${C.cyan}55`, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 190, background: `linear-gradient(90deg, ${C.blue}, ${C.violet})`, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sora, fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: '0.12em' }}>
          AI NEWS
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontFamily: mono, fontWeight: 700, fontSize: 26, color: '#e8f4ff', letterSpacing: '0.08em', transform: `translateX(${210 + W * 0.4 - (t - on) * 190}px)` }}>
          {ticker.repeat(Math.ceil(12000 / (ticker.length * 17)))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 40, top: 270 }}>{corner(0)}</div>
      <div style={{ position: 'absolute', right: 40, top: 270 }}>{corner(90)}</div>
      <div style={{ position: 'absolute', left: 40, bottom: 330 }}>{corner(-90)}</div>
      <div style={{ position: 'absolute', right: 40, bottom: 330 }}>{corner(180)}</div>
    </AbsoluteFill>
  );
};

export const Video: React.FC<{ timeline: Timeline }> = ({ timeline: tl }) => {
  applyStyle(tl);
  const t = useCurrentFrame() / FPS;
  const e = impactEnergy(tl.sfx, t) * (S.camera === 'calm' ? 0.55 : 1.15);
  // Camera never stops: slow drift + breathing zoom + impact shake/punch.
  const drift = S.camera === 'calm' ? 0.6 : 1.25;
  const sx = noise1(t * 0.35, 1) * 18 * drift + noise1(t * 22, 2) * e * 16;
  const sy = noise1(t * 0.3, 3) * 24 * drift + noise1(t * 22, 4) * e * 16;
  const rot = noise1(t * 0.25, 5) * 0.9 * drift + noise1(t * 18, 6) * e * 0.8;
  const zoom = 1.04 + 0.02 * Math.sin(t * 0.8) + e * 0.05;

  return (
    <TimelineCtx.Provider value={tl}>
      <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
        <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${zoom})` }}>
          {tl.scenes.map((s, i) => {
            if (t < s.start - PAD || t > s.end + PAD) return null;
            const S = SCENES[s.type];
            return (
              <SceneShell key={i} start={s.start} end={s.end} first={i === 0} last={i === tl.scenes.length - 1}>
                <S s={s} />
              </SceneShell>
            );
          })}
          <Flash tl={tl} />
        </AbsoluteFill>
        <AbsoluteFill>
          <Hud tl={tl} />
        </AbsoluteFill>
        <Captions tl={tl} />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.75) 100%)', pointerEvents: 'none' }} />
        <Grain />
        {tl.audio && <Audio src={staticFile(tl.audio)} />}
      </AbsoluteFill>
    </TimelineCtx.Provider>
  );
};
