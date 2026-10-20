import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { OutroScene, TimedScene } from '../types';
import { C, FPS, W, clamp, cue, easeIn, easeOut, mix, prog, rand, rgba } from '../lib';
import { Canvas, glowSprite } from '../components/canvas';
import { Title, mono, sora } from '../components/type';

const Beam: React.FC<{ x: number; at: number; color: string }> = ({ x, at, color }) => {
  const t = useCurrentFrame() / FPS;
  const p = prog(t, at - 0.08, 0.35);
  const flick = 0.85 + 0.15 * Math.sin(t * 40 + x);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute', left: x - 160, top: -200, width: 320, height: 1700, transformOrigin: 'top center',
        transform: `scaleX(${mix(0.1, 1, p)}) rotate(${(x - W / 2) * -0.012}deg)`, opacity: p * 0.55 * flick,
        background: `linear-gradient(180deg, ${color}cc, ${color}33 55%, transparent)`, clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
        filter: 'blur(14px)', mixBlendMode: 'screen',
      }}
    />
  );
};

const Name: React.FC<{ text: string; at: number; color: string; dim: number }> = ({ text, at, color, dim }) => {
  const t = useCurrentFrame() / FPS;
  const p = prog(t, at, 0.45);
  if (p <= 0) return null;
  return (
    <div style={{ position: 'relative', height: 190, opacity: 1 - dim * 0.72, filter: dim > 0 ? `blur(${dim * 5}px)` : undefined }}>
      <Title text={text} at={at} size={170} variant="slam" stagger={0.02} glow={color} gradient={`linear-gradient(180deg, #ffffff 25%, ${color})`} />
      {/* impact underline */}
      <div style={{ position: 'absolute', left: '50%', bottom: 6, height: 4, width: 640 * p, transform: 'translateX(-50%)', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 24px ${color}` }} />
    </div>
  );
};

export const Outro: React.FC<{ s: TimedScene & OutroScene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const lt = t - s.start;
  const embers = useMemo(() => {
    const r = rand(66);
    return Array.from({ length: 420 }, () => ({ x: r() * W, sp: 80 + r() * 260, ph: r() * 3000, s: r(), sw: r() * 6 }));
  }, []);
  const nn = s.names.length;
  const nameColors = [C.cyan, '#e9f3ff', C.violet, C.magenta];
  const NAMES = s.names.map((text, i) => ({ text: text.toUpperCase(), at: cue(s.cues, i, 0.5), color: nameColors[i % nameColors.length] }));
  const headAt = cue(s.cues, nn, 1.0);
  const ctaAt = cue(s.cues, nn + 1, 1.6);
  const finalPulse = s.end - 1.6;
  const heat = prog(t, headAt, 0.8);
  const back = prog(t, headAt - 0.1, 0.6);
  const cta = prog(t, ctaAt, 0.6);
  const pulse = t - finalPulse;
  const beamX = (i: number) => W / 2 + (i - (nn - 1) / 2) * (nn > 3 ? 220 : 280);

  return (
    <AbsoluteFill style={{ perspective: 1400 }}>
      {/* arena floor */}
      <AbsoluteFill style={{ transformStyle: 'preserve-3d', transform: `rotateY(${Math.sin(lt * 0.5) * 6}deg) translateZ(${lt * 30}px)` }}>
        <div style={{ position: 'absolute', left: -1200, width: 3480, top: 1240, height: 2600, transform: 'rotateX(80deg)', transformOrigin: 'top', background: `radial-gradient(ellipse at 50% 0%, ${C.blue}55, transparent 60%), repeating-linear-gradient(90deg, ${C.cyan}2a 0 2px, transparent 2px 140px), repeating-linear-gradient(0deg, ${C.cyan}2a 0 2px, transparent 2px 140px)`, maskImage: 'linear-gradient(180deg, #000, transparent 75%)' }} />
        {/* stadium rings */}
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ position: 'absolute', left: W / 2 - 700 - k * 200, top: 1180 - k * 30, width: 1400 + k * 400, height: 300 + k * 60, borderRadius: '50%', border: `3px solid ${k === 1 ? C.violet : C.cyan}${k === 0 ? '88' : '44'}`, transform: `rotateX(75deg) rotateZ(${t * (k % 2 ? -12 : 10)}deg)`, boxShadow: `0 0 40px ${C.blue}66` }} />
        ))}
      </AbsoluteFill>
      {NAMES.map((n, i) => <Beam key={i} x={beamX(i)} at={n.at} color={n.color} />)}

      <Canvas
        deps={[frame]}
        draw={(ctx, w, h) => {
          ctx.globalCompositeOperation = 'lighter';
          const sp = [glowSprite(C.violet), glowSprite(C.magenta), glowSprite(C.cyan)];
          for (const e of embers) {
            const y = h + 50 - ((lt * e.sp + e.ph) % (h + 100));
            const x = e.x + Math.sin(lt * 1.3 + e.ph) * 30 * e.sw;
            const sz = 6 + e.s * 22 * (0.6 + heat);
            ctx.globalAlpha = (0.25 + 0.75 * heat) * (0.4 + 0.6 * e.s);
            ctx.drawImage(sp[e.s > 0.66 ? 1 : e.s > 0.3 ? 0 : 2], x - sz / 2, y - sz / 2, sz, sz);
          }
          ctx.globalAlpha = 1;
          // final energy pulse
          if (pulse >= 0) {
            const e = easeOut(clamp(pulse / 1.3));
            for (let k = 0; k < 3; k++) {
              const rr = e * (1500 + k * 400);
              ctx.strokeStyle = rgba(k === 1 ? C.violet : C.cyan, (1 - e) * 0.9);
              ctx.lineWidth = 60 * (1 - e) + 4;
              ctx.beginPath();
              ctx.arc(w / 2, h * 0.5, rr, 0, Math.PI * 2);
              ctx.stroke();
            }
            const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 1200);
            g.addColorStop(0, `rgba(255,255,255,${Math.exp(-pulse * 3)})`);
            g.addColorStop(0.3, rgba(C.cyan, 0.6 * Math.exp(-pulse * 2.5)));
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
          }
        }}
      />

      {/* Contenders */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: W, transform: `translateY(${mix(-60, -520, easeOut(back))}px) scale(${mix(1, 0.5, easeOut(back))})` }}>
          {NAMES.map((n) => <Name key={n.text} {...n} dim={back} />)}
          <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 30, letterSpacing: '0.5em', color: '#9fc6ff', opacity: (nn > 1 ? prog(t, NAMES[nn - 1].at + 0.2, 0.5) : 0) * (1 - back), marginTop: 10 }}>
            {Array(Math.max(1, nn)).fill('VS').join(' · ')}
          </div>
        </div>
      </AbsoluteFill>

      {/* Headline */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: W, transform: `translateY(${mix(40, -60, cta)}px)` }}>
          {s.headline.map((line, i) => (
            <Title
              key={i}
              text={line.toUpperCase()}
              at={headAt + i * 0.2}
              size={i ? 118 : 136}
              variant={i ? 'rise' : 'slam'}
              glow={C.magenta}
              gradient={i ? `linear-gradient(90deg, ${C.violet}, ${C.magenta} 50%, #ffb36b)` : `linear-gradient(180deg, #fff 20%, ${C.cyan})`}
            />
          ))}
        </div>
      </AbsoluteFill>

      {/* Call to action */}
      {cta > 0 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 1230 }}>
          <div style={{ opacity: clamp(cta * 2) * (1 - prog(t, s.end - 1.5, 0.4, easeIn)), transform: `translateY(${(1 - cta) * 80}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 18, padding: '26px 54px', borderRadius: 999,
                background: `linear-gradient(90deg, ${C.blue}, ${C.violet})`, boxShadow: `0 0 60px ${C.violet}aa, inset 0 1px 0 rgba(255,255,255,0.4)`,
                transform: `scale(${1 - Math.exp(-Math.max(0, t - (ctaAt + 0.9)) * 10) * (t > ctaAt + 0.9 ? 0.08 : 0)})`,
                fontFamily: sora, fontWeight: 800, fontSize: 54, color: '#fff', letterSpacing: '0.02em',
              }}
            >
              <svg width="54" height="54" viewBox="0 0 24 24" fill="#fff"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z" /></svg>
              FOLLOW
            </div>
            <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 34, color: '#e6f3ff', letterSpacing: '0.24em', clipPath: `inset(0 ${(1 - cta) * 100}% 0 0)` }}>{s.cta.toUpperCase()}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

