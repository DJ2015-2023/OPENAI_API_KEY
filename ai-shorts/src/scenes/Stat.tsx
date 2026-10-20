import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { StatScene, TimedScene } from '../types';
import { C, FPS, W, clamp, cue, easeIn, easeOut, mix, prog, rand, rgba } from '../lib';
import { Canvas, glowSprite, project } from '../components/canvas';
import { Title, mono, sora } from '../components/type';

const DEPTH = 6000;
const TUNNEL_R = 900;

type Card = { ang: number; z0: number; kind: number; rot: number; s: number };

function drawCard(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, sc: number, rot: number, a: number) {
  const w = 220 * sc;
  const h = (kind === 2 ? 140 : 280) * sc;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba(C.blue, 0.3);
  ctx.strokeStyle = rgba(kind === 1 ? C.violet : C.cyan, 0.9);
  ctx.lineWidth = Math.max(1, 3 * sc);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 10 * sc);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = Math.max(1, 4 * sc);
  if (kind === 0) {
    // document
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = 'rgba(200,235,255,0.6)';
      ctx.beginPath();
      ctx.moveTo(-w * 0.38, -h * 0.36 + i * h * 0.11);
      ctx.lineTo(w * (i % 3 === 2 ? 0.1 : 0.38), -h * 0.36 + i * h * 0.11);
      ctx.stroke();
    }
  } else if (kind === 1) {
    // code
    const cols = [C.violet, C.cyan, '#7dffb2', '#cfe3ff'];
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = cols[i % 4];
      const ind = (i % 3) * w * 0.08;
      ctx.beginPath();
      ctx.moveTo(-w * 0.38 + ind, -h * 0.38 + i * h * 0.1);
      ctx.lineTo(-w * 0.38 + ind + w * (0.2 + ((i * 37) % 40) / 100), -h * 0.38 + i * h * 0.1);
      ctx.stroke();
    }
  } else if (kind === 2) {
    // video frame
    ctx.fillStyle = 'rgba(200,235,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(-w * 0.08, -h * 0.18);
    ctx.lineTo(w * 0.12, 0);
    ctx.lineTo(-w * 0.08, h * 0.18);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(-w * 0.45 + i * w * 0.17, -h * 0.45, w * 0.08, h * 0.08);
      ctx.fillRect(-w * 0.45 + i * w * 0.17, h * 0.37, w * 0.08, h * 0.08);
    }
  } else {
    // diagram
    const pts = [[-0.25, -0.25], [0.25, -0.1], [-0.1, 0.25], [0.28, 0.3]];
    ctx.strokeStyle = rgba(C.cyan, 0.8);
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * w, py * h) : ctx.moveTo(px * w, py * h)));
    ctx.stroke();
    ctx.fillStyle = '#fff';
    pts.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px * w, py * h, 9 * sc, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

export const Stat: React.FC<{ s: TimedScene & StatScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const lt = t - s.start;
  const land = cue(s.cues, 0);
  const second = cue(s.cues, 1, 1.4);
  const data = useMemo(() => {
    const r = rand(23);
    const parts = Array.from({ length: 2600 }, () => ({ ang: r() * Math.PI * 2, rad: 0.55 + r() * 0.5, z0: r() * DEPTH, c: r() }));
    const cards: Card[] = Array.from({ length: 46 }, (_, i) => ({ ang: r() * Math.PI * 2, z0: r() * DEPTH, kind: i % 4, rot: (r() - 0.5) * 0.8, s: 0.7 + r() * 0.6 }));
    return { parts, cards };
  }, []);

  const surge = t >= land ? Math.exp(-(t - land) * 2.5) : 0;
  const travel = lt * 2400 + easeIn(clamp(lt / Math.max(0.6, land - s.start))) * 1500 + (t > land ? (1 - Math.exp(-(t - land) * 2.5)) * 2600 : 0);
  const spin = lt * 0.25;
  const zoomPulse = 1 + surge * 0.12;

  const counterP = prog(t, s.start + 0.15, Math.max(0.4, land - s.start - 0.15), easeIn);
  const decimals = (String(s.value).split('.')[1] || '').length;
  const shown = s.value * counterP ** 3;
  const count = `${s.prefix ?? ''}${shown.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: s.grouping ?? true })}${s.suffix ?? ''}`;
  const landed = t >= land;
  const pulses = [land, s.end - 1.6];

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoomPulse})` }}>
        <Canvas
          deps={[frame]}
          draw={(ctx, w, h) => {
            ctx.globalCompositeOperation = 'lighter';
            const sp = [glowSprite(C.cyan), glowSprite(C.blue), glowSprite(C.violet), glowSprite('#e0f8ff')];
            const cx = w / 2 + Math.sin(lt * 0.7) * 60;
            const cy = h / 2 + Math.cos(lt * 0.5) * 80;
            // depth glow at the vanishing point
            const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 700);
            vg.addColorStop(0, `rgba(180,240,255,${0.55 + surge * 0.4})`);
            vg.addColorStop(0.15, rgba(C.blue, 0.35));
            vg.addColorStop(0.5, rgba(C.violet, 0.1));
            vg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, w, h);

            // ring guides
            for (let k = 0; k < 14; k++) {
              const z = DEPTH - ((travel * 0.9 + k * (DEPTH / 14)) % DEPTH);
              if (z < 60) continue;
              const p = project(0, 0, z, 900, cx, cy);
              const a = clamp(1 - z / DEPTH) * 0.35;
              ctx.strokeStyle = rgba(C.cyan, a);
              ctx.lineWidth = 2 + p.s * 2;
              ctx.beginPath();
              ctx.ellipse(cx, cy, TUNNEL_R * p.s, TUNNEL_R * 1.15 * p.s, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            // particle streams with motion streaks
            const streak = 60 + surge * 600 + 120;
            for (const q of data.parts) {
              const z = DEPTH - ((travel + q.z0) % DEPTH);
              if (z < 40) continue;
              const ang = q.ang + spin;
              const x = Math.cos(ang) * TUNNEL_R * q.rad;
              const y = Math.sin(ang) * TUNNEL_R * 1.15 * q.rad;
              const p = project(x, y, z, 900, cx, cy);
              const p2 = project(x, y, z + streak, 900, cx, cy);
              const a = clamp(1 - z / DEPTH) ** 1.3;
              ctx.strokeStyle = rgba(q.c > 0.8 ? C.violet : C.cyan, a);
              ctx.lineWidth = Math.min(6, 0.8 + p.s * 1.6);
              ctx.beginPath();
              ctx.moveTo(p2.x, p2.y);
              ctx.lineTo(p.x, p.y);
              ctx.stroke();
              if (q.c > 0.9) {
                const sz = Math.min(80, 10 + p.s * 18);
                ctx.globalAlpha = a;
                ctx.drawImage(sp[3], p.x - sz / 2, p.y - sz / 2, sz, sz);
                ctx.globalAlpha = 1;
              }
            }
            // flying documents, code, video frames and diagrams
            ctx.globalCompositeOperation = 'source-over';
            const cards = data.cards
              .map((c) => ({ c, z: DEPTH - ((travel * 0.8 + c.z0) % DEPTH) }))
              .filter((o) => o.z > 120)
              .sort((a, b) => b.z - a.z);
            for (const { c, z } of cards) {
              const ang = c.ang + spin * 0.6;
              const p = project(Math.cos(ang) * TUNNEL_R * 0.7, Math.sin(ang) * TUNNEL_R * 0.8, z, 900, cx, cy);
              const a = clamp(1 - z / DEPTH) * clamp((z - 120) / 400);
              drawCard(ctx, c.kind, p.x, p.y, p.s * c.s, c.rot + spin * 0.4, a);
            }
            ctx.globalAlpha = 1;
            // blue energy pulse rings
            ctx.globalCompositeOperation = 'lighter';
            for (const at of pulses) {
              const dt = t - at;
              if (dt < 0 || dt > 1.2) continue;
              const e = easeOut(clamp(dt / 1.2));
              ctx.strokeStyle = rgba(C.cyan, 1 - e);
              ctx.lineWidth = 40 * (1 - e) + 3;
              ctx.beginPath();
              ctx.ellipse(w / 2, h / 2, 100 + e * 1300, 100 + e * 1500, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }}
        />
      </AbsoluteFill>
      {/* readability plate */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 30% at 50% 50%, rgba(2,4,11,0.75), transparent 75%)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: W, transform: `translateY(-40px) perspective(900px) rotateX(${Math.sin(lt * 0.9) * 6}deg) rotateY(${Math.sin(lt * 0.6) * 8}deg)` }}>
          <div
            style={{
              textAlign: 'center', fontFamily: sora, fontWeight: 800, fontSize: Math.min(landed ? 168 : 150, 1500 / Math.max(4, count.length + 1)), letterSpacing: '-0.03em', lineHeight: 1,
              transform: `scale(${landed ? 1 + surge * 0.2 : mix(0.6, 0.95, counterP)})`, opacity: clamp((lt - 0.1) * 4),
              backgroundImage: `linear-gradient(180deg, #ffffff 20%, ${C.cyan} 70%, ${C.blue})`, WebkitBackgroundClip: 'text', color: 'transparent',
              filter: `drop-shadow(0 0 30px ${C.cyan}cc) drop-shadow(0 0 90px ${C.blue}aa) ${landed ? '' : `blur(${(1 - counterP) * 6}px)`}`,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </div>
          <Title text={s.unit} at={land} size={150} variant="wide" tracking={0.18} gradient={`linear-gradient(90deg, ${C.violet}, #fff 50%, ${C.cyan})`} glow={C.violet} />
          <div style={{ height: 40 }} />
          <Title text={s.label} at={second} size={44} weight={700} variant="decode" font={mono} tracking={0.2} gradient="linear-gradient(90deg,#cdefff,#fff)" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
