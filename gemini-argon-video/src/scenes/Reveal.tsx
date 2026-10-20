import React, { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { C, FPS, T, W, clamp, easeIn, easeInOut, mix, prog, rand } from '../lib';
import { Canvas, glowSprite } from '../components/canvas';
import { Tag, Title, mono, sora } from '../components/type';

/** Sample pixel positions of a word so particles can assemble into it. */
function useWordPoints(word: string, size: number) {
  const [pts, setPts] = useState<{ x: number; y: number }[] | null>(null);
  const [handle] = useState(() => delayRender('sample word'));
  useEffect(() => {
    document.fonts.load(`600 ${size}px "${sora}"`).then(() => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = 400;
      const g = c.getContext('2d')!;
      g.fillStyle = '#fff';
      g.font = `600 ${size}px "${sora}"`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(word, W / 2, 200);
      const d = g.getImageData(0, 0, W, 400).data;
      const out: { x: number; y: number }[] = [];
      for (let y = 0; y < 400; y += 5) for (let x = 0; x < W; x += 5) if (d[(y * W + x) * 4 + 3] > 128) out.push({ x, y: y - 200 });
      setPts(out);
      continueRender(handle);
    });
  }, [handle, size, word]);
  return pts;
}

const Chip: React.FC<{ t: number }> = ({ t }) => {
  const appear = prog(t, 7.75, 0.9);
  const orbit = Math.sin((t - 7.7) * 0.55) * 32 + (t - 7.7) * 9;
  const tilt = mix(75, 58, appear) + Math.sin(t * 0.7) * 3;
  const traces = useMemo(() => {
    const r = rand(42);
    return Array.from({ length: 40 }, (_, i) => {
      const side = i % 4;
      const off = (r() - 0.5) * 320;
      const len = 120 + r() * 260;
      const bend = (r() - 0.5) * 160;
      let d = '';
      if (side === 0) d = `M ${off} -170 L ${off} ${-170 - len * 0.5} L ${off + bend} ${-170 - len}`;
      if (side === 1) d = `M ${off} 170 L ${off} ${170 + len * 0.5} L ${off + bend} ${170 + len}`;
      if (side === 2) d = `M -170 ${off} L ${-170 - len * 0.5} ${off} L ${-170 - len} ${off + bend}`;
      if (side === 3) d = `M 170 ${off} L ${170 + len * 0.5} ${off} L ${170 + len} ${off + bend}`;
      return { d, delay: r() * 0.8, speed: 0.6 + r() * 1.2, violet: r() > 0.7 };
    });
  }, []);
  if (appear <= 0) return null;
  return (
    <AbsoluteFill style={{ perspective: 1300, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `translateY(260px) rotateX(${tilt}deg) rotateZ(${orbit}deg) scale(${mix(0.4, 1, appear)})`, transformStyle: 'preserve-3d', opacity: appear }}>
        <svg width={1100} height={1100} viewBox="-550 -550 1100 1100" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="die" cx="50%" cy="50%" r="60%">
              <stop offset="0" stopColor="#1b3a7a" />
              <stop offset="1" stopColor="#060c1d" />
            </radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="6" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {traces.map((tr, i) => {
            const p = clamp((t - 7.8 - tr.delay) * 1.6);
            const dash = ((t * tr.speed * 400) % 600);
            return (
              <g key={i} opacity={p}>
                <path d={tr.d} stroke="#21407a" strokeWidth={4} fill="none" />
                <path d={tr.d} stroke={tr.violet ? C.violet : C.cyan} strokeWidth={5} fill="none" strokeDasharray="40 560" strokeDashoffset={-dash} filter="url(#glow)" />
                <circle r={7} fill={tr.violet ? C.violet : C.cyan} transform={`translate(${tr.d.split(' ').slice(-2).join(',')})`} filter="url(#glow)" />
              </g>
            );
          })}
          {/* pins */}
          {Array.from({ length: 48 }, (_, i) => {
            const side = Math.floor(i / 12);
            const k = (i % 12) - 5.5;
            const x = side < 2 ? k * 26 : side === 2 ? -190 : 172;
            const y = side < 2 ? (side === 0 ? -190 : 172) : k * 26;
            return <rect key={i} x={x - (side < 2 ? 6 : 0)} y={y - (side < 2 ? 0 : 6)} width={side < 2 ? 12 : 18} height={side < 2 ? 18 : 12} fill="#8fb7ff" opacity={0.7} />;
          })}
          <rect x={-172} y={-172} width={344} height={344} rx={18} fill="url(#die)" stroke={C.cyan} strokeWidth={3} filter="url(#glow)" />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} opacity={0.35}>
              <line x1={-150 + i * 37.5} y1={-150} x2={-150 + i * 37.5} y2={150} stroke={C.blue} strokeWidth={1.5} />
              <line x1={-150} y1={-150 + i * 37.5} x2={150} y2={-150 + i * 37.5} stroke={C.blue} strokeWidth={1.5} />
            </g>
          ))}
          <rect x={-90} y={-90} width={180} height={180} rx={12} fill="none" stroke="#fff" strokeOpacity={0.5 + 0.5 * Math.sin(t * 6)} strokeWidth={4} filter="url(#glow)" />
          <circle r={60 + 6 * Math.sin(t * 5)} fill={C.cyan} opacity={0.35} filter="url(#glow)" />
          <text y={14} textAnchor="middle" fontFamily={mono} fontWeight={700} fontSize={40} fill="#fff" letterSpacing={6}>G4·Ar</text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pts = useWordPoints('Google', 250);
  const seeds = useMemo(() => {
    const r = rand(77);
    return Array.from({ length: 2200 }, () => ({ x: (r() - 0.5) * 2600, y: (r() - 0.5) * 3600, z: r(), c: r(), d: r() }));
  }, []);
  const neural = useMemo(() => {
    const r = rand(9);
    return Array.from({ length: 70 }, () => ({ a: r() * Math.PI * 2, r1: 200 + r() * 200, r2: 420 + r() * 380, sp: 0.3 + r(), h: r() }));
  }, []);

  const gather = prog(t, 6.0, 1.15, easeInOut);
  const disperse = prog(t, 7.55, 0.6, easeIn);
  const wordY = 0 - 120;
  const yaw = Math.sin(t * 1.1) * 0.35;

  return (
    <AbsoluteFill>
      <Canvas
        deps={[frame, pts]}
        draw={(ctx, w, h) => {
          ctx.globalCompositeOperation = 'lighter';
          const sprites = [glowSprite(C.cyan), glowSprite(C.blue), glowSprite(C.violet), glowSprite('#d8f6ff')];
          // background haze
          const bg = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, 1100);
          bg.addColorStop(0, 'rgba(47,123,255,0.22)');
          bg.addColorStop(0.6, 'rgba(139,92,255,0.08)');
          bg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, w, h);

          if (pts && disperse < 1) {
            const n = Math.min(pts.length, seeds.length);
            for (let i = 0; i < n; i++) {
              const s = seeds[i];
              const p = pts[Math.floor((i / n) * pts.length)];
              const local = clamp((gather - s.d * 0.25) / 0.75);
              // orbit the wordmark in 3D (fake yaw by squashing x around center)
              const tx = p.x - w / 2;
              const rx = tx * Math.cos(yaw);
              const rz = tx * Math.sin(yaw);
              const tz = 1 + rz / 1600;
              const hx = w / 2 + rx / tz;
              const hy = h / 2 + wordY + p.y / tz;
              let x = mix(w / 2 + s.x, hx, local);
              let y = mix(h / 2 + s.y, hy, local);
              // shimmer + dispersal into the processor below
              x += Math.sin(t * 7 + i) * 1.5 * local;
              if (disperse > 0) {
                const ang = s.c * Math.PI * 2;
                x = mix(x, w / 2 + Math.cos(ang) * 420 * s.z, disperse);
                y = mix(y, h / 2 + 260 + Math.sin(ang) * 160 * s.z, disperse);
              }
              const sz = mix(5, 16, local) * (s.z > 0.92 ? 2.2 : 1);
              ctx.globalAlpha = clamp(0.25 + local) * (1 - disperse);
              ctx.drawImage(sprites[Math.floor(s.c * 4)], x - sz / 2, y - sz / 2, sz, sz);
            }
            ctx.globalAlpha = 1;
            // hologram scan bar over the wordmark
            if (gather > 0.8) {
              const sy = h / 2 + wordY - 110 + ((t * 260) % 260);
              const g = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
              g.addColorStop(0, 'rgba(56,232,255,0)');
              g.addColorStop(0.5, `rgba(56,232,255,${0.5 * (1 - disperse)})`);
              g.addColorStop(1, 'rgba(56,232,255,0)');
              ctx.fillStyle = g;
              ctx.fillRect(w / 2 - 420, sy - 20, 840, 40);
            }
          }

          // neural connections around the processor
          const na = prog(t, 7.9, 1.0);
          if (na > 0) {
            const cx = w / 2;
            const cy = h / 2 + 260;
            neural.forEach((nn, i) => {
              const a = nn.a + t * 0.12 * (i % 2 ? 1 : -1);
              const x1 = cx + Math.cos(a) * nn.r1;
              const y1 = cy + Math.sin(a) * nn.r1 * 0.45;
              const x2 = cx + Math.cos(a + 0.6) * nn.r2;
              const y2 = cy - 260 + Math.sin(a + 0.6) * nn.r2 * 0.5;
              ctx.strokeStyle = `rgba(${nn.h > 0.6 ? '139,92,255' : '56,200,255'},${0.28 * na})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo(cx + Math.cos(a) * nn.r2 * 0.4, cy - 420, x2, y2);
              ctx.stroke();
              const ph = (t * nn.sp + nn.h) % 1;
              const qx = (1 - ph) ** 2 * x1 + 2 * (1 - ph) * ph * (cx + Math.cos(a) * nn.r2 * 0.4) + ph ** 2 * x2;
              const qy = (1 - ph) ** 2 * y1 + 2 * (1 - ph) * ph * (cy - 420) + ph ** 2 * y2;
              ctx.globalAlpha = na;
              ctx.drawImage(sprites[nn.h > 0.6 ? 2 : 0], qx - 14, qy - 14, 28, 28);
              ctx.drawImage(sprites[3], x2 - 9, y2 - 9, 18, 18);
              ctx.globalAlpha = 1;
            });
          }
        }}
      />
      <Chip t={t} />
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 470 }}>
        <div style={{ width: W, transform: `translateY(${-prog(t, T.gemini, 0.6) * 40}px)` }}>
          <Tag text="GOOGLE" at={T.gemini - 0.1} color={C.blue} style={{ marginBottom: 18 }} />
          <Title text="GEMINI 4" at={T.gemini} size={150} variant="slam" />
          <Title text="ARGON" at={T.gemini + 0.25} size={196} variant="wide" tracking={0.04} gradient={`linear-gradient(90deg, ${C.cyan} 0%, #ffffff 45%, ${C.violet} 100%)`} glow={C.violet} />
          <Title text="NEXT-GENERATION AI" at={T.nextgen} size={50} weight={300} variant="decode" tracking={0.28} font={mono} style={{ marginTop: 18 }} gradient="linear-gradient(90deg,#bfefff,#fff)" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

