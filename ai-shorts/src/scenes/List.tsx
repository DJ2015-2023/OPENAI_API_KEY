import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { ListScene, TimedScene } from '../types';
import { C, FPS, W, clamp, cue, easeOut, mix, prog, rand, rgba } from '../lib';
import { Title, mono, sora } from '../components/type';

const CODE = [
  ['k', 'async def '], ['f', 'reason'], ['p', '(task, ctx):'],
  ['n', ''], ['p', '  plan = '], ['f', 'decompose'], ['p', '(task)'],
  ['n', ''], ['k', '  for '], ['p', 'step '], ['k', 'in '], ['p', 'plan:'],
  ['n', ''], ['p', '    out = '], ['k', 'await '], ['f', 'model.think'], ['p', '(step)'],
  ['n', ''], ['p', '    ctx.'], ['f', 'update'], ['p', '(out)'],
  ['n', ''], ['k', '  return '], ['f', 'verify'], ['p', '(ctx)'],
  ['n', ''], ['c', '# context window loaded'],
  ['n', ''], ['k', 'class '], ['f', 'Agent'], ['p', '(Model):'],
  ['n', ''], ['p', '  layers = '], ['s', '"mixture-of-experts"'],
  ['n', ''], ['p', '  modal  = ['], ['s', '"text"'], ['p', ', '], ['s', '"code"'], ['p', ', '], ['s', '"video"'], ['p', ']'],
];
const COL: Record<string, string> = { k: C.violet, f: C.cyan, p: '#cfe3ff', s: '#7dffb2', c: '#5f7aa8' };

const Panel: React.FC<{ x: number; y: number; z: number; ry: number; w: number; h: number; at: number; title: string; children: React.ReactNode }> = ({ x, y, z, ry, w, h, at, title, children }) => {
  const t = useCurrentFrame() / FPS;
  const p = prog(t, at, 0.7);
  return (
    <div
      style={{
        position: 'absolute', left: W / 2 + x - w / 2, top: 960 + y - h / 2, width: w, height: h,
        transform: `translateZ(${z}px) rotateY(${ry}deg) scaleY(${mix(0.02, 1, p)})`, opacity: clamp(p * 2),
        background: `linear-gradient(160deg, ${rgba(C.blue, 0.22)}, rgba(10,20,50,0.35))`, border: `2px solid ${C.cyan}66`,
        borderRadius: 18, boxShadow: `0 0 60px ${C.blue}44, inset 0 0 40px ${C.cyan}18`, overflow: 'hidden', backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: `1px solid ${C.cyan}44`, fontFamily: mono, fontSize: 18, color: C.cyan, letterSpacing: '0.2em' }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
        {title}
      </div>
      <div style={{ position: 'relative', height: h - 44 }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, transparent 0 3px, ${C.cyan}0d 3px 4px)` }} />
    </div>
  );
};

const CodePanel: React.FC<{ t: number }> = ({ t }) => {
  const shown = Math.floor(clamp(t / 4) * CODE.length);
  const lines: React.ReactNode[][] = [[]];
  CODE.slice(0, shown).forEach(([k, s], i) => (k === 'n' ? lines.push([]) : lines[lines.length - 1].push(<span key={i} style={{ color: COL[k] }}>{s}</span>)));
  return (
    <div style={{ padding: 18, fontFamily: mono, fontSize: 21, lineHeight: 1.55, whiteSpace: 'pre', transform: `translateY(${-Math.max(0, lines.length - 9) * 32}px)` }}>
      {lines.map((l, i) => <div key={i}>{l}{i === lines.length - 1 && <span style={{ background: C.cyan, opacity: Math.sin(t * 12) > 0 ? 1 : 0 }}>&nbsp;</span>}</div>)}
    </div>
  );
};

const EqPanel: React.FC<{ t: number }> = ({ t }) => {
  const eqs = ['∇ · E = ρ / ε₀', 'softmax(QKᵀ / √dₖ)·V', '∂ℒ/∂θ = −Σ yᵢ log ŷᵢ', 'Ψ(x,t) = A·e^{i(kx−ωt)}', 'P(A|B) = P(B|A)P(A) / P(B)'];
  return (
    <div style={{ padding: '14px 22px', fontFamily: sora, fontWeight: 300, fontSize: 30, color: '#e6f2ff' }}>
      {eqs.map((e, i) => {
        const p = prog(t, 0.6 + i * 0.35, 0.5);
        return <div key={i} style={{ opacity: p, transform: `translateX(${(1 - p) * 40}px)`, margin: '10px 0', textShadow: `0 0 16px ${C.cyan}` }}>{e}</div>;
      })}
    </div>
  );
};

const SimPanel: React.FC<{ t: number }> = ({ t }) => {
  const paths = [0, 1, 2].map((k) => {
    let d = '';
    for (let x = 0; x <= 400; x += 8) {
      const y = 120 + Math.sin(x * 0.03 + t * (2 + k) + k) * (40 - k * 10) * Math.cos(x * 0.008 + t * 0.6);
      d += `${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)} `;
    }
    return d;
  });
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="none">
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 50} y1={0} x2={i * 50} y2={240} stroke={`${C.blue}44`} />)}
      {paths.map((d, k) => <path key={k} d={d} stroke={[C.cyan, C.violet, '#fff'][k]} strokeWidth={3} fill="none" opacity={0.9 - k * 0.2} />)}
    </svg>
  );
};

const DataPanel: React.FC<{ t: number }> = ({ t }) => {
  const r = rand(3);
  const bars = Array.from({ length: 14 }, () => r());
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 18, height: '100%', boxSizing: 'border-box' }}>
      {bars.map((b, i) => {
        const p = prog(t, 0.8 + i * 0.06, 0.8);
        const v = (0.25 + 0.75 * b) * (0.85 + 0.15 * Math.sin(t * 3 + i)) * p;
        return <div key={i} style={{ flex: 1, height: `${v * 100}%`, background: `linear-gradient(0deg, ${C.blue}, ${i % 3 ? C.cyan : C.violet})`, borderRadius: 4, boxShadow: `0 0 14px ${C.cyan}66` }} />;
      })}
    </div>
  );
};

const Feature: React.FC<{ n: string; text: string; at: number; color: string }> = ({ n, text, at, color }) => {
  const t = useCurrentFrame() / FPS;
  const p = prog(t, at, 0.6);
  const line = prog(t, at, 0.9);
  if (p <= 0) return null;
  return (
    <div style={{ position: 'relative', width: W, padding: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: mono, fontSize: 28, color, letterSpacing: '0.4em', opacity: p, marginBottom: 6 }}>{n}</div>
      <Title text={text} at={at} size={74} variant="decode" stagger={0.03} glow={color} gradient={`linear-gradient(180deg, #ffffff 30%, ${color})`} />
      <div style={{ height: 3, width: 760 * line, marginTop: 10, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 20px ${color}` }} />
    </div>
  );
};

export const List: React.FC<{ s: TimedScene & ListScene }> = ({ s }) => {
  const t = useCurrentFrame() / FPS;
  const lt = t - s.start;
  const dolly = mix(-500, 260, easeOut(clamp(lt / Math.max(4, s.end - s.start))));
  const arc = Math.sin(lt * 0.45) * 12;
  const first = cue(s.cues, 0);
  const titlesOn = prog(t, first - 0.3, 0.6);
  const colors = [C.cyan, C.violet, C.blue, C.magenta];
  const n = s.items.length;

  return (
    <AbsoluteFill style={{ perspective: 1200, perspectiveOrigin: '50% 45%' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, ${C.blue}2a, transparent 65%)` }} />
      <AbsoluteFill style={{ transformStyle: 'preserve-3d', transform: `translateZ(${dolly}px) rotateY(${arc}deg) rotateX(${Math.sin(lt * 0.3) * 4}deg)` }}>
        <div style={{ position: 'absolute', left: -1500, width: 4080, top: 1350, height: 3000, transform: 'rotateX(84deg)', transformOrigin: 'top', background: `repeating-linear-gradient(90deg, ${C.cyan}30 0 2px, transparent 2px 120px), repeating-linear-gradient(0deg, ${C.cyan}30 0 2px, transparent 2px 120px)`, maskImage: 'linear-gradient(180deg, #000, transparent 70%)' }} />
        <Panel x={-330} y={-330} z={-500} ry={28} w={560} h={430} at={s.start + 0.15} title="AGENT.REASONING">
          <CodePanel t={lt - 0.3} />
        </Panel>
        <Panel x={340} y={-380} z={-700} ry={-26} w={560} h={360} at={s.start + 0.35} title="MATH.ENGINE">
          <EqPanel t={lt} />
        </Panel>
        <Panel x={-360} y={300} z={-650} ry={30} w={540} h={330} at={s.start + 0.55} title="SIM.MODEL">
          <SimPanel t={t} />
        </Panel>
        <Panel x={360} y={320} z={-450} ry={-30} w={520} h={340} at={s.start + 0.75} title="DATA.ANALYSIS">
          <DataPanel t={lt} />
        </Panel>
        <Panel x={0} y={-40} z={-1500} ry={0} w={900} h={560} at={s.start + 0.25} title="CORE.TELEMETRY">
          <SimPanel t={t + 3} />
        </Panel>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 22%, rgba(2,4,11,${0.74 * titlesOn}) 36%, rgba(2,4,11,${0.74 * titlesOn}) 76%, transparent 88%)` }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ transform: `translateY(${30 + Math.sin(lt * 0.8) * 8}px) scale(${n > 3 ? 0.88 : 1})` }}>
          {s.items.map((it, i) => (
            <Feature key={i} n={String(i + 1).padStart(2, '0')} text={it.toUpperCase()} at={cue(s.cues, i)} color={colors[i % colors.length]} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
