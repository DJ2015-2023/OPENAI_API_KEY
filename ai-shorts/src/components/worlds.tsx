import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FPS, H, S, THEME, W, clamp, easeOut, mix, prog, rand, rgba, useTimeline } from '../lib';
import { Canvas, glowSprite } from './canvas';
import { mono } from './type';

// The backdrop every graphic (B) scene sits on. Each world is its own visual universe.

const Neon: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const dots = useMemo(() => {
    const r = rand(5);
    return Array.from({ length: 220 }, () => ({ x: r() * W, y: r() * H, z: r(), s: r() }));
  }, []);
  return (
    <Canvas
      deps={[frame]}
      draw={(ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, 1100);
        g.addColorStop(0, rgba(C.blue, 0.3));
        g.addColorStop(0.55, rgba(C.violet, 0.1));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        const sp = glowSprite(C.cyan);
        for (const d of dots) {
          const y = (d.y - t * (20 + d.z * 60) + h * 10) % h;
          const sz = 6 + d.s * 16;
          ctx.globalAlpha = 0.25 + d.z * 0.5;
          ctx.drawImage(sp, d.x + Math.sin(t + d.y) * 20 - sz / 2, y - sz / 2, sz, sz);
        }
        ctx.globalAlpha = 1;
      }}
    />
  );
};

const Liquid: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const blobs = useMemo(() => {
    const r = rand(Math.round(S.hue) + 3);
    return Array.from({ length: 6 }, (_, i) => ({ x: r(), y: r(), r: 380 + r() * 380, sp: 0.15 + r() * 0.25, ph: r() * 6, c: i % 4 }));
  }, []);
  const cols = [C.blue, C.cyan, C.violet, C.magenta];
  return (
    <AbsoluteFill>
      <Canvas
        deps={[frame]}
        draw={(ctx, w, h) => {
          for (const b of blobs) {
            const x = (b.x + Math.sin(t * b.sp + b.ph) * 0.18) * w;
            const y = (b.y + Math.cos(t * b.sp * 0.8 + b.ph) * 0.12) * h;
            const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
            g.addColorStop(0, rgba(cols[b.c], 0.55));
            g.addColorStop(1, rgba(cols[b.c], 0));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
          }
        }}
      />
      {/* frosted sheen */}
      <AbsoluteFill style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, transparent 35%, transparent 70%, rgba(255,255,255,0.06) 100%)' }} />
    </AbsoluteFill>
  );
};

const Editorial: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const tl = useTimeline();
  const idx = Math.max(0, tl.scenes.findIndex((s) => t >= s.start - 0.2 && t < s.end + 0.2));
  const sc = tl.scenes[idx];
  // A big printed shape per scene, swapping corners as the story moves on.
  const p = prog(t, sc.start - 0.2, 0.6);
  const corner = idx % 4;
  const size = 820;
  const pos = [
    { left: -260, top: 360 },
    { right: -300, top: 980 },
    { left: -220, top: 1180 },
    { right: -260, top: 300 },
  ][corner];
  const color = [C.blue, C.magenta, C.violet, C.cyan][idx % 4];
  const shape = S.shape ?? 'circle';
  const shapeStyle: React.CSSProperties =
    shape === 'circle' ? { borderRadius: '50%' } : shape === 'diamond' ? { transform: 'rotate(45deg)' } : shape === 'stripe' ? { height: 180, borderRadius: 0 } : {};
  return (
    <AbsoluteFill>
      {/* halftone field */}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${rgba('#000000', 0.16)} 1.6px, transparent 1.8px)`, backgroundSize: '16px 16px', maskImage: 'linear-gradient(200deg, #000 0%, transparent 55%)' }} />
      <div
        style={{
          position: 'absolute', width: size, height: size, background: color, ...pos, ...shapeStyle,
          opacity: 0.92, transform: `${shapeStyle.transform ?? ''} scale(${mix(0.2, 1, easeOut(p))})`, transformOrigin: 'center',
        }}
      />
      {/* print furniture */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1690, height: 3, background: '#111' }} />
      <div style={{ position: 'absolute', left: 60, top: 1705, fontFamily: mono, fontSize: 22, letterSpacing: '0.3em', color: '#111' }}>
        AI NEWS · ISSUE {String(Math.round(S.hue * 7 + S.bpm) % 997).padStart(3, '0')}
      </div>
      <div style={{ position: 'absolute', right: 60, top: 1705, fontFamily: mono, fontSize: 22, color: '#111' }}>{String(idx + 1).padStart(2, '0')} / {String(tl.scenes.length).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

const Synthwave: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const stars = useMemo(() => {
    const r = rand(77);
    return Array.from({ length: 160 }, () => ({ x: r() * W, y: r() * 1050, s: r() }));
  }, []);
  const horizon = 1420; // low horizon keeps the sun out from behind the headlines
  return (
    <Canvas
      deps={[frame]}
      draw={(ctx, w, h) => {
        const sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, '#05010f');
        sky.addColorStop(0.6, rgba(C.violet, 0.55));
        sky.addColorStop(1, rgba(C.magenta, 0.85));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, horizon);
        for (const s of stars) {
          ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * Math.abs(Math.sin(t * 2 + s.x))})`;
          ctx.fillRect(s.x, s.y, 2 + s.s * 2, 2 + s.s * 2);
        }
        // striped sun
        const R = 230;
        const sun = ctx.createLinearGradient(0, horizon - R * 2, 0, horizon);
        sun.addColorStop(0, '#ffe66d');
        sun.addColorStop(1, C.magenta);
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(w / 2, horizon - 40, R, Math.PI, 0);
        ctx.clip();
        ctx.fillStyle = sun;
        ctx.fillRect(w / 2 - R, horizon - 40 - R, R * 2, R);
        ctx.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 7; i++) {
          const y = horizon - 60 - i * 34 - ((t * 20) % 34);
          ctx.fillRect(w / 2 - R, y, R * 2, 4 + i * 1.6);
        }
        ctx.restore();
        // floor
        const floor = ctx.createLinearGradient(0, horizon, 0, h);
        floor.addColorStop(0, '#12002a');
        floor.addColorStop(1, '#000');
        ctx.fillStyle = floor;
        ctx.fillRect(0, horizon, w, h - horizon);
        ctx.strokeStyle = rgba(C.cyan, 0.8);
        ctx.lineWidth = 2;
        for (let i = -14; i <= 14; i++) {
          ctx.beginPath();
          ctx.moveTo(w / 2 + i * 20, horizon);
          ctx.lineTo(w / 2 + i * 260, h);
          ctx.stroke();
        }
        for (let k = 0; k < 14; k++) {
          const z = ((k + (t * 1.6) % 1) / 14) ** 2;
          const y = horizon + z * (h - horizon);
          ctx.globalAlpha = clamp(z * 3);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }}
    />
  );
};

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEF<>/{}[]=+*';
const Terminal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cols = useMemo(() => {
    const r = rand(13);
    return Array.from({ length: 36 }, (_, i) => ({ x: i * 30 + 8, sp: 80 + r() * 220, ph: r() * 2000, len: 8 + Math.floor(r() * 18) }));
  }, []);
  return (
    <AbsoluteFill>
      <Canvas
        deps={[frame]}
        draw={(ctx, w, h) => {
          ctx.font = `600 24px "${'JetBrains Mono'}"`;
          for (const c of cols) {
            const head = ((t * c.sp + c.ph) % (h + 600)) - 300;
            for (let k = 0; k < c.len; k++) {
              const y = head - k * 28;
              if (y < -30 || y > h) continue;
              const g = GLYPHS[Math.floor((c.x * 7 + k * 13 + frame * (k === 0 ? 1 : 0.2)) % GLYPHS.length)];
              ctx.fillStyle = k === 0 ? '#eafff2' : rgba(C.cyan, 0.5 * (1 - k / c.len));
              ctx.fillText(g, c.x, y);
            }
          }
        }}
        style={{ opacity: 0.35 }}
      />
      <AbsoluteFill style={{ background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 5px)` }} />
      <AbsoluteFill style={{ background: rgba(C.cyan, 0.03 + 0.02 * Math.sin(t * 50)) }} />
    </AbsoluteFill>
  );
};

export const WorldBackdrop: React.FC = () => {
  const W_ = { neon: Neon, liquid: Liquid, editorial: Editorial, synthwave: Synthwave, terminal: Terminal }[THEME.world] ?? Neon;
  return <W_ />;
};
