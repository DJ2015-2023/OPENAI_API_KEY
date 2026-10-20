import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import land from '../land.json';
import { C, FPS, T, W, clamp, easeOut, mix, prog } from '../lib';
import { Canvas, glowSprite } from '../components/canvas';
import { Tag, Title, mono, sora } from '../components/type';

const CITIES: [number, number][] = [
  [-122.4, 37.8], [-74, 40.7], [-46.6, -23.5], [-0.1, 51.5], [2.35, 48.85], [13.4, 52.5], [31.2, 30.0], [28, -26.2],
  [55.3, 25.2], [77.2, 28.6], [103.8, 1.35], [121.5, 31.2], [139.7, 35.7], [151.2, -33.9], [-99.1, 19.4], [-3.7, 40.4],
];
const LINKS: [number, number][] = [[0, 12], [1, 3], [3, 9], [9, 11], [11, 13], [1, 2], [4, 6], [6, 7], [8, 10], [14, 1], [5, 8], [0, 14], [15, 2], [12, 10], [3, 15], [2, 7]];

const toVec = (lon: number, lat: number) => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), -Math.sin(la), Math.cos(la) * Math.cos(lo)];
};

function rot(v: number[], yaw: number, tilt: number) {
  const [x, y, z] = v;
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
  const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
  return [x1, y2, z2];
}

function slerp(a: number[], b: number[], p: number) {
  const d = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
  if (d < 1e-4) return a;
  const s1 = Math.sin((1 - p) * d) / Math.sin(d);
  const s2 = Math.sin(p * d) / Math.sin(d);
  return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2];
}

const Card: React.FC<{ title: string; sub: string; at: number; icon: React.ReactNode; color: string }> = ({ title, sub, at, icon, color }) => {
  const t = useCurrentFrame() / FPS;
  const p = prog(t, at, 0.7);
  if (p <= 0) return null;
  return (
    <div
      style={{
        width: 860, margin: '0 auto 22px', display: 'flex', alignItems: 'center', gap: 26, padding: '24px 30px', boxSizing: 'border-box',
        transform: `translateX(${(1 - p) * 300}px) perspective(800px) rotateY(${(1 - p) * -30}deg)`, opacity: clamp(p * 2),
        background: 'linear-gradient(120deg, rgba(60,110,255,0.22), rgba(20,30,70,0.45))', border: `2px solid ${color}88`, borderRadius: 24,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 50px ${color}33, inset 0 1px 0 rgba(255,255,255,0.25)`, backdropFilter: 'blur(14px)',
        clipPath: `inset(0 ${(1 - p) * 60}% 0 0 round 24px)`,
      }}
    >
      <div style={{ width: 84, height: 84, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${color}, ${C.violet})`, boxShadow: `0 0 30px ${color}88`, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 50, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontFamily: mono, fontSize: 22, color: '#a9d8ff', letterSpacing: '0.25em', marginTop: 8 }}>{sub}</div>
      </div>
    </div>
  );
};

export const Global: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const lt = t - 32;
  const grow = prog(t, 32.0, 1.2);
  const R = mix(250, 360, grow) + lt * 4;
  const yaw = -1.2 + lt * 0.32;
  const tilt = 0.32 + Math.sin(lt * 0.4) * 0.05;
  const GX = W / 2;
  const GY = 980;

  return (
    <AbsoluteFill>
      <Canvas
        deps={[frame]}
        draw={(ctx) => {
          const sCyan = glowSprite(C.cyan);
          const sWhite = glowSprite('#e8faff');
          const sViolet = glowSprite(C.violet);
          // atmosphere
          const atm = ctx.createRadialGradient(GX, GY, R * 0.85, GX, GY, R * 1.5);
          atm.addColorStop(0, 'rgba(56,160,255,0.0)');
          atm.addColorStop(0.18, 'rgba(56,200,255,0.45)');
          atm.addColorStop(0.45, 'rgba(90,110,255,0.14)');
          atm.addColorStop(1, 'rgba(139,92,255,0)');
          ctx.fillStyle = atm;
          ctx.fillRect(0, 0, 1080, 1920);
          // ocean body with a lit limb
          const body = ctx.createRadialGradient(GX - R * 0.35, GY - R * 0.4, R * 0.1, GX, GY, R);
          body.addColorStop(0, '#173a8a');
          body.addColorStop(0.7, '#08132f');
          body.addColorStop(1, '#050a1c');
          ctx.fillStyle = body;
          ctx.beginPath();
          ctx.arc(GX, GY, R, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'lighter';
          // land dots
          for (const [lon, lat] of land as [number, number][]) {
            const v = rot(toVec(lon, lat), yaw, tilt);
            if (v[2] < 0) continue;
            const sz = 3 + 4 * v[2];
            ctx.globalAlpha = 0.25 + 0.75 * v[2] * grow;
            ctx.fillStyle = v[2] > 0.6 ? '#7fe6ff' : '#3f7dff';
            ctx.fillRect(GX + v[0] * R - sz / 2, GY + v[1] * R - sz / 2, sz, sz);
          }
          ctx.globalAlpha = 1;
          // latitude rings for the holographic feel
          ctx.strokeStyle = 'rgba(56,232,255,0.12)';
          ctx.lineWidth = 1.5;
          for (let la = -60; la <= 60; la += 30) {
            ctx.beginPath();
            for (let lo = -180; lo <= 180; lo += 6) {
              const v = rot(toVec(lo, la), yaw, tilt);
              const x = GX + v[0] * R;
              const y = GY + v[1] * R;
              if (v[2] < 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          // connection arcs
          LINKS.forEach(([a, b], i) => {
            const start = 32.6 + i * 0.28;
            const p = easeOut(clamp((t - start) / 0.9));
            if (p <= 0) return;
            const va = toVec(...CITIES[a]);
            const vb = toVec(...CITIES[b]);
            ctx.strokeStyle = i % 3 === 0 ? 'rgba(170,130,255,0.85)' : 'rgba(120,235,255,0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            let head = null as number[] | null;
            const steps = 40;
            for (let k = 0; k <= steps * p; k++) {
              const q = k / steps;
              const v = slerp(va, vb, q);
              const lift = 1 + Math.sin(q * Math.PI) * 0.22;
              const rv = rot([v[0] * lift, v[1] * lift, v[2] * lift], yaw, tilt);
              const x = GX + rv[0] * R;
              const y = GY + rv[1] * R;
              if (rv[2] < -0.2) {
                ctx.moveTo(x, y);
              } else if (k === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              head = [x, y, rv[2]];
            }
            ctx.stroke();
            if (head && head[2] > -0.2) ctx.drawImage(i % 3 === 0 ? sViolet : sWhite, head[0] - 18, head[1] - 18, 36, 36);
          });
          // city nodes with radar pulses
          CITIES.forEach((c, i) => {
            const v = rot(toVec(...c), yaw, tilt);
            if (v[2] < 0) return;
            const x = GX + v[0] * R;
            const y = GY + v[1] * R;
            const ph = (t * 0.8 + i * 0.13) % 1;
            ctx.strokeStyle = `rgba(120,235,255,${(1 - ph) * 0.8 * grow})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 6 + ph * 34, 0, Math.PI * 2);
            ctx.stroke();
            ctx.drawImage(sCyan, x - 16, y - 16, 32, 32);
          });
          // orbit ring
          ctx.strokeStyle = 'rgba(56,232,255,0.35)';
          ctx.lineWidth = 2;
          ctx.setLineDash([14, 18]);
          ctx.lineDashOffset = -t * 60;
          ctx.beginPath();
          ctx.ellipse(GX, GY, R * 1.35, R * 0.32, -0.25, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          const oa = t * 1.1;
          ctx.drawImage(sWhite, GX + Math.cos(oa) * R * 1.35 * Math.cos(-0.25) - Math.sin(oa) * R * 0.32 * Math.sin(-0.25) - 20, GY + Math.cos(oa) * R * 1.35 * Math.sin(-0.25) + Math.sin(oa) * R * 0.32 * Math.cos(-0.25) - 20, 40, 40);
        }}
      />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 330 }}>
        <div style={{ width: W }}>
          <Tag text="GLOBAL ROLLOUT" at={T.available - 0.2} color={C.cyan} style={{ marginBottom: 20 }} />
          <Title text="NOW AVAILABLE" at={T.available} size={100} variant="rise" />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ paddingTop: 1300 }}>
        <Card
          title="GOOGLE AI PRO & ULTRA"
          sub="SUBSCRIBERS · ROLLING OUT"
          at={T.proUltra}
          color={C.cyan}
          icon={<svg width="46" height="46" viewBox="0 0 24 24"><path d="M12 2l2.9 6.6L22 9.3l-5.4 4.8L18.2 21 12 17.3 5.8 21l1.6-6.9L2 9.3l7.1-.7z" fill="#fff" /></svg>}
        />
        <Card
          title="DEVELOPER API ACCESS"
          sub="BUILD WITH GEMINI 4 ARGON"
          at={T.api}
          color={C.violet}
          icon={<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" /></svg>}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
