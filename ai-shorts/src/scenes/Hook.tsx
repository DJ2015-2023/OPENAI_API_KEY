import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { HookScene, TimedScene } from '../types';
import { C, FPS, W, clamp, cue, easeIn, easeOut, mix, prog, rand, rgba } from '../lib';
import { Canvas, glowSprite, project } from '../components/canvas';
import { Tag, Title } from '../components/type';

function useNetwork() {
  return useMemo(() => {
    const r = rand(11);
    const nodes = Array.from({ length: 340 }, () => {
      const a = r() * Math.PI * 2;
      const rad = 120 + r() * 1300;
      return { x: Math.cos(a) * rad, y: Math.sin(a) * rad * 1.5, z: r() * 9000 };
    });
    const edges: [number, number][] = [];
    nodes.forEach((n, i) => {
      const d = nodes.map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 + ((m.z - n.z) * 0.35) ** 2 })).sort((a, b) => a.d - b.d);
      for (let k = 1; k <= 2; k++) if (d[k].j > i) edges.push([i, d[k].j]);
    });
    const burst = Array.from({ length: 900 }, () => {
      const th = r() * Math.PI * 2;
      const ph = Math.acos(2 * r() - 1);
      const sp = 300 + r() * 2600;
      return { vx: Math.sin(ph) * Math.cos(th) * sp, vy: Math.sin(ph) * Math.sin(th) * sp, vz: Math.cos(ph) * sp, c: r() };
    });
    return { nodes, edges, burst };
  }, []);
}

export const Hook: React.FC<{ s: TimedScene & HookScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const net = useNetwork();
  const boom = cue(s.cues, 0);
  const second = cue(s.cues, 1, 1.3);
  const camZ = t < boom ? mix(0, 7600, easeIn(clamp(t / boom))) : 7600 + (t - boom) * 260;
  const coreZ = 8200;
  const lift = prog(t, second - 0.1, 0.6);

  return (
    <AbsoluteFill>
      <Canvas
        deps={[frame]}
        draw={(ctx, w, h) => {
          ctx.globalCompositeOperation = 'lighter';
          const blueG = glowSprite(C.cyan);
          const violetG = glowSprite(C.violet);
          const whiteG = glowSprite('#e6f6ff');
          const darkness = clamp(t / 0.6);
          const yaw = Math.sin(t * 0.6) * 160;
          const after = t < boom ? 1 : Math.exp(-(t - boom) * 1.4);

          const P = net.nodes.map((n) => project(n.x + yaw, n.y, n.z - camZ));
          for (let i = 0; i < net.edges.length; i++) {
            const [a, b] = net.edges[i];
            const za = net.nodes[a].z - camZ;
            const zb = net.nodes[b].z - camZ;
            if (za < 40 || zb < 40) continue;
            const fd = clamp(1 - Math.min(za, zb) / 7000) * darkness * after;
            if (fd < 0.02) continue;
            ctx.strokeStyle = rgba(C.blue, 0.4 * fd);
            ctx.lineWidth = Math.min(3, 0.6 + P[a].s * 0.6);
            ctx.beginPath();
            ctx.moveTo(P[a].x, P[a].y);
            ctx.lineTo(P[b].x, P[b].y);
            ctx.stroke();
            const ph = (t * (0.8 + (i % 7) * 0.15) + i * 0.137) % 1;
            const sz = 10 + 28 * Math.min(P[a].s, 2) * fd;
            ctx.globalAlpha = fd;
            ctx.drawImage(i % 5 === 0 ? violetG : blueG, mix(P[a].x, P[b].x, ph) - sz / 2, mix(P[a].y, P[b].y, ph) - sz / 2, sz, sz);
            ctx.globalAlpha = 1;
          }
          net.nodes.forEach((n, i) => {
            const z = n.z - camZ;
            if (z < 40) return;
            const sz = 6 + 40 * Math.min(P[i].s, 3);
            ctx.globalAlpha = clamp(1 - z / 8000) * darkness * after;
            ctx.drawImage(blueG, P[i].x - sz / 2, P[i].y - sz / 2, sz, sz);
          });
          ctx.globalAlpha = 1;

          // light streaks while accelerating
          const speed = t < boom ? easeIn(clamp(t / boom)) : Math.exp(-(t - boom) * 2) * 0.6;
          const r = rand(5);
          for (let i = 0; i < 70; i++) {
            const ang = r() * Math.PI * 2;
            const base = (r() + t * (0.4 + speed * 2.2)) % 1;
            const d0 = base ** 2 * 1400;
            const len = 40 + speed * 520 * base;
            const cx = w / 2 + Math.cos(ang) * d0;
            const cy = h / 2 + Math.sin(ang) * d0 * 1.4;
            const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len * 1.4);
            g.addColorStop(0, rgba(C.cyan, 0));
            g.addColorStop(1, rgba(i % 4 ? C.cyan : C.violet, 0.7 * speed * darkness));
            ctx.strokeStyle = g;
            ctx.lineWidth = 2 + speed * 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len * 1.4);
            ctx.stroke();
          }

          // AI core
          if (t < boom + 0.2) {
            const p = project(yaw * 0.2, 0, Math.max(coreZ - camZ, 300));
            const R = 260 * p.s;
            const pulse = 1 + 0.08 * Math.sin(t * 18);
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 3.2 * pulse);
            glow.addColorStop(0, 'rgba(255,255,255,0.95)');
            glow.addColorStop(0.12, rgba(C.cyan, 0.85));
            glow.addColorStop(0.35, rgba(C.blue, 0.35));
            glow.addColorStop(1, rgba(C.violet, 0));
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, R * 3.2 * pulse, 0, Math.PI * 2);
            ctx.fill();
            for (let k = 0; k < 3; k++) {
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(t * (0.9 + k * 0.5) * (k % 2 ? -1 : 1) + k);
              ctx.scale(1, 0.32 + k * 0.12);
              ctx.strokeStyle = rgba(k === 1 ? C.violet : C.cyan, 0.8);
              ctx.lineWidth = 3;
              ctx.setLineDash([R * 0.4, R * 0.15]);
              ctx.beginPath();
              ctx.arc(0, 0, R * (1.4 + k * 0.35), 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
            ctx.setLineDash([]);
          }

          // explosion
          if (t >= boom) {
            const dt = t - boom;
            const sw = easeOut(clamp(dt / 1.1));
            for (let k = 0; k < 2; k++) {
              const rr = sw * (1400 + k * 500);
              ctx.strokeStyle = rgba(k ? C.violet : C.cyan, (k ? 0.7 : 0.9) * (1 - sw));
              ctx.lineWidth = 30 * (1 - sw) + 2;
              ctx.beginPath();
              ctx.ellipse(w / 2, h / 2, rr, rr * 0.9, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            const drag = (1 - Math.exp(-dt * 2.2)) / 2.2;
            const life = 1 - dt / 3.6;
            if (life > 0) {
              for (const b of net.burst) {
                const z = 900 - b.vz * drag * 0.4;
                if (z < 30) continue;
                const p = project(b.vx * drag, b.vy * drag, z);
                const sz = (8 + 26 * b.c) * Math.min(p.s, 4);
                ctx.globalAlpha = life;
                ctx.drawImage(b.c > 0.8 ? violetG : b.c > 0.3 ? blueG : whiteG, p.x - sz / 2, p.y - sz / 2, sz, sz);
              }
              ctx.globalAlpha = 1;
            }
            const f = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, 900);
            f.addColorStop(0, rgba(C.blue, 0.28 * clamp(dt * 2)));
            f.addColorStop(0.5, rgba(C.violet, 0.12 * clamp(dt * 2)));
            f.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = f;
            ctx.fillRect(0, 0, w, h);
          }
        }}
      />

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: W, transform: `translateY(${-160 - lift * 260}px) scale(${1 - lift * 0.18})` }}>
          <Tag text={s.kicker} at={boom + 0.05} color="#ff3b5c" style={{ marginBottom: 26 }} />
          {s.title.map((line, i) => (
            <Title key={i} text={line} at={boom + i * 0.12} size={150} variant="slam" gradient={i % 2 ? `linear-gradient(180deg,#fff 10%,${C.cyan} 60%,${C.blue})` : undefined} />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: W, transform: 'translateY(260px)' }}>
          {s.lines.map((line, i) => {
            const style = i % 3;
            return (
              <Title
                key={i}
                text={line}
                at={second + i * 0.22}
                size={style === 0 ? 96 : style === 1 ? 150 : 128}
                weight={style === 0 ? 600 : 800}
                variant={style === 1 ? 'wide' : 'rise'}
                gradient={style === 1 ? `linear-gradient(90deg, ${C.cyan}, #fff 50%, ${C.violet})` : style === 2 ? `linear-gradient(180deg,#fff,${C.violet})` : undefined}
                glow={style ? C.violet : C.cyan}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
