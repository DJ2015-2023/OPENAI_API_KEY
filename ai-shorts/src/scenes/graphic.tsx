// "B" designs: graphic, motion-design layouts that sit on the world backdrop instead of
// building their own 3D set. Same scene data as the A designs, completely different look.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { CardsScene, HookScene, ListScene, OutroScene, RevealScene, StatScene, TimedScene } from '../types';
import { C, FPS, HEAD, S, THEME, W, clamp, cue, easeIn, easeInOut, easeOut, mix, prog, rgba } from '../lib';
import { Tag, Title, fitText, headWeight, mono } from '../components/type';

const useT = () => useCurrentFrame() / FPS;
const ACCENTS = () => [C.blue, C.magenta, C.violet, C.cyan];
const left = () => S.layout === 'left';

/** Panel look for each world. */
function panel(color: string): React.CSSProperties {
  switch (THEME.world) {
    case 'editorial':
      return { background: color, borderRadius: 0 };
    case 'liquid':
      return { background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 36, backdropFilter: 'blur(18px)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' };
    case 'synthwave':
      return { background: `linear-gradient(135deg, ${rgba(C.magenta, 0.85)}, ${rgba(C.violet, 0.85)})`, border: '3px solid #fff', borderRadius: 8, boxShadow: `0 0 50px ${rgba(C.magenta, 0.6)}` };
    case 'terminal':
      return { background: 'rgba(0,0,0,0.55)', border: `2px dashed ${C.cyan}`, borderRadius: 0 };
    default:
      return { background: rgba('#050a1c', 0.7), border: `2px solid ${rgba(color, 0.8)}`, borderRadius: 22, boxShadow: `0 0 50px ${rgba(color, 0.35)}` };
  }
}
const panelText = () => (THEME.world === 'terminal' ? C.cyan : '#ffffff');

/** Motion-design box wipe: a colored bar sweeps across and leaves the text behind (or stays as a label). */
const BlockText: React.FC<{ text: string; at: number; size: number; color: string; label?: boolean; ink?: string; align?: 'center' | 'left'; maxW?: number }> = ({
  text, at, size: wanted, color, label, ink, align, maxW = 940,
}) => {
  const t = useT();
  const a = align ?? (left() ? 'left' : 'center');
  const size = fitText(text, HEAD.family, headWeight(800), wanted, maxW - 40);
  const grow = prog(t, at, 0.28, easeInOut);
  const shrink = label ? 0 : prog(t, at + 0.26, 0.3, easeInOut);
  const reveal = prog(t, at + 0.2, 0.01);
  if (t < at - 0.02) return <div style={{ height: size * 1.22 }} />;
  const textColor = ink ?? (label ? (THEME.world === 'terminal' ? '#000' : '#fff') : THEME.ink);
  return (
    <div style={{ display: 'flex', justifyContent: a === 'left' ? 'flex-start' : 'center', padding: a === 'left' ? '0 70px' : 0 }}>
      <div style={{ position: 'relative', padding: label ? '4px 24px' : '0 6px' }}>
        <div
          style={{
            position: 'absolute', inset: 0, background: color, transformOrigin: shrink > 0 ? 'right' : 'left',
            transform: `scaleX(${grow * (1 - shrink)})`, boxShadow: THEME.glow && label ? `0 0 40px ${rgba(color, 0.5)}` : undefined,
          }}
        />
        <div
          style={{
            position: 'relative', fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: size, lineHeight: 1.12, color: textColor,
            opacity: reveal, whiteSpace: 'nowrap', letterSpacing: '-0.01em', textTransform: 'uppercase',
            textShadow: THEME.glow && !label ? `0 0 ${size * 0.3 * THEME.glow}px ${rgba(color, 0.7)}` : undefined,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

/** Large rotating outline of the episode's motif shape. */
const Motif: React.FC<{ size: number; at: number; color: string; x?: number; y?: number; spin?: number; rings?: number }> = ({ size, at, color, x = W / 2, y = 900, spin = 12, rings = 3 }) => {
  const t = useT();
  const p = prog(t, at, 0.9);
  const shape = S.shape ?? 'circle';
  return (
    <svg width={W} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: rings }, (_, k) => {
        const r = (size / 2) * (1 - k * 0.22) * mix(0.6, 1, p);
        const rot = t * spin * (k % 2 ? -1 : 1) + k * 15;
        const common = { fill: 'none', stroke: k === 0 ? color : rgba(color, 0.5), strokeWidth: k === 0 ? 6 : 3, opacity: p, transform: `rotate(${rot} ${x} ${y})` };
        if (shape === 'circle') return <circle key={k} cx={x} cy={y} r={r} {...common} strokeDasharray={`${r * 0.9} ${r * 0.25}`} />;
        if (shape === 'diamond') return <rect key={k} x={x - r * 0.7} y={y - r * 0.7} width={r * 1.4} height={r * 1.4} {...common} transform={`rotate(${45 + rot} ${x} ${y})`} />;
        if (shape === 'stripe') return <rect key={k} x={x - r} y={y - r * 0.18} width={r * 2} height={r * 0.36} {...common} />;
        return <rect key={k} x={x - r * 0.8} y={y - r * 0.8} width={r * 1.6} height={r * 1.6} {...common} />;
      })}
    </svg>
  );
};

// ---------- hook: box-wipe headline stack ----------
export const HookB: React.FC<{ s: TimedScene & HookScene }> = ({ s }) => {
  const t = useT();
  const c0 = cue(s.cues, 0);
  const c1 = cue(s.cues, 1, 1.3);
  const lift = prog(t, c1 - 0.1, 0.5);
  const acc = ACCENTS();
  return (
    <AbsoluteFill>
      <Motif size={1250} at={0} color={C.blue} y={820} spin={20} />
      {/* vertical side label */}
      <div style={{ position: 'absolute', left: 28, top: 1180, transform: 'rotate(-90deg)', transformOrigin: 'left top', fontFamily: mono, fontSize: 22, letterSpacing: '0.5em', color: THEME.ink, opacity: 0.6 * prog(t, c0, 0.5) }}>
        {s.kicker}
      </div>
      <AbsoluteFill style={{ justifyContent: 'center' }}>
        <div style={{ transform: `translateY(${-230 - lift * 200}px) scale(${1 - lift * 0.15})` }}>
          <Tag text={s.kicker} at={c0} color={C.magenta} style={{ marginBottom: 24, justifyContent: left() ? 'flex-start' : 'center', paddingLeft: left() ? 70 : 0 }} />
          {s.title.map((line, i) => (
            <BlockText key={i} text={line} at={c0 + i * 0.14} size={170} color={acc[i % 4]} />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center' }}>
        <div style={{ transform: 'translateY(170px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {s.lines.map((line, i) => (
            <BlockText key={i} text={line} at={c1 + i * 0.18} size={i === 1 ? 150 : 100} color={acc[(i + 1) % 4]} label />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- reveal: outline type that fills up ----------
export const RevealB: React.FC<{ s: TimedScene & RevealScene }> = ({ s }) => {
  const t = useT();
  const c0 = cue(s.cues, 0);
  const c1 = cue(s.cues, 1, 1.4);
  const big = s.title2 ?? s.title;
  const size = fitText(big, HEAD.family, headWeight(800), 300, 960);
  const fill = prog(t, c0 + 0.2, 1.2, easeInOut);
  const enter = prog(t, s.start, 0.7);
  return (
    <AbsoluteFill>
      <Motif size={1000} at={s.start} color={C.violet} y={980} spin={-16} rings={4} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: left() ? 'flex-start' : 'center', paddingLeft: left() ? 70 : 0 }}>
        <Tag text={s.word.toUpperCase()} at={s.start + 0.1} color={C.cyan} style={{ marginBottom: 30 }} />
        {s.title2 && <BlockText text={s.title} at={c0} size={110} color={C.blue} />}
        <div
          style={{
            fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: size, lineHeight: 1.05, textTransform: 'uppercase', whiteSpace: 'nowrap',
            color: 'transparent', WebkitTextStroke: `3px ${THEME.world === 'editorial' ? '#111' : '#fff'}`,
            backgroundImage: `linear-gradient(0deg, ${THEME.world === 'editorial' ? C.blue : C.cyan} ${fill * 100}%, transparent ${fill * 100}%)`,
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            transform: `translateY(${(1 - enter) * 120}px) scale(${mix(1.3, 1, enter)})`, opacity: enter,
            filter: THEME.glow ? `drop-shadow(0 0 ${30 * THEME.glow}px ${rgba(C.cyan, 0.6)})` : undefined,
          }}
        >
          {big}
        </div>
        <div style={{ height: 30 }} />
        <Title text={s.subtitle} at={c1} size={46} weight={700} variant="decode" font={mono} tracking={0.2} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- list: numbered rows with progress rules ----------
export const ListB: React.FC<{ s: TimedScene & ListScene }> = ({ s }) => {
  const t = useT();
  const acc = ACCENTS();
  const n = s.items.length;
  return (
    <AbsoluteFill>
      {/* giant faded count */}
      <div style={{ position: 'absolute', right: -40, top: 260, fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: 900, lineHeight: 1, color: 'transparent', WebkitTextStroke: `4px ${rgba(THEME.dark ? '#ffffff' : '#000000', 0.12)}` }}>
        {n}
      </div>
      <AbsoluteFill style={{ justifyContent: 'center', gap: 34, padding: '0 60px' }}>
        {s.items.map((it, i) => {
          const at = cue(s.cues, i);
          const p = prog(t, at, 0.55);
          const line = prog(t, at + 0.15, 0.9);
          const from = i % 2 ? 1 : -1;
          const size = fitText(it.toUpperCase(), HEAD.family, headWeight(800), 78, 700);
          return (
            <div key={i} style={{ opacity: clamp(p * 2), transform: `translateX(${(1 - p) * from * 500}px)` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}>
                <div style={{ fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: 110, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${acc[i % 4]}`, minWidth: 170 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: size, color: THEME.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: THEME.glow ? `0 0 24px ${rgba(acc[i % 4], 0.6)}` : undefined }}>
                  {it}
                </div>
              </div>
              <div style={{ height: 6, marginTop: 12, background: rgba(THEME.dark ? '#ffffff' : '#000000', 0.12) }}>
                <div style={{ height: '100%', width: `${line * 100}%`, background: acc[i % 4], boxShadow: THEME.glow ? `0 0 16px ${acc[i % 4]}` : undefined }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- stat: odometer number inside a gauge ----------
const Odometer: React.FC<{ text: string; p: number; size: number; color: string }> = ({ text, p, size, color }) => (
  <div style={{ display: 'flex', fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: size, lineHeight: 1, color, height: size * 1.05, overflow: 'hidden' }}>
    {[...text].map((ch, i) => {
      if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
      const target = +ch;
      const local = clamp(p * 1.25 - i * 0.04);
      const spins = 2 + (i % 3);
      const pos = easeOut(local) * (spins * 10 + target);
      return (
        <span key={i} style={{ display: 'inline-block', position: 'relative', width: '0.62em', height: size * 1.05 }}>
          <span style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${-(pos % 10) * size * 1.05}px)`, display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: 11 }, (_, d) => (
              <span key={d} style={{ height: size * 1.05, display: 'block', textAlign: 'center' }}>{d % 10}</span>
            ))}
          </span>
        </span>
      );
    })}
  </div>
);

export const StatB: React.FC<{ s: TimedScene & StatScene }> = ({ s }) => {
  const t = useT();
  const land = cue(s.cues, 0);
  const c1 = cue(s.cues, 1, 1.4);
  const p = prog(t, s.start + 0.1, Math.max(0.5, land - s.start), easeOut);
  const decimals = (String(s.value).split('.')[1] || '').length;
  const text = `${s.prefix ?? ''}${s.value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: s.grouping ?? true })}${s.suffix ?? ''}`;
  const size = fitText(text, HEAD.family, headWeight(800), 240, 760);
  const R = 330;
  const CY = 820;
  const circ = 2 * Math.PI * R;
  const pulse = t >= land ? Math.exp(-(t - land) * 4) : 0;
  const ink = THEME.world === 'editorial' ? '#111' : THEME.world === 'terminal' ? C.cyan : '#fff';
  return (
    <AbsoluteFill>
      <svg width={W} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`rotate(-90 ${W / 2} ${CY})`}>
          <circle cx={W / 2} cy={CY} r={R} fill="none" stroke={rgba(THEME.dark ? '#ffffff' : '#000000', 0.12)} strokeWidth={26} />
          <circle cx={W / 2} cy={CY} r={R} fill="none" stroke={C.blue} strokeWidth={26} strokeLinecap="round" strokeDasharray={`${circ * p} ${circ}`} style={{ filter: THEME.glow ? `drop-shadow(0 0 18px ${C.blue})` : undefined }} />
        </g>
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2 + t * 0.2;
          const r1 = R + 50;
          const r2 = R + (i % 5 ? 64 : 84);
          return <line key={i} x1={W / 2 + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1} x2={W / 2 + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2} stroke={rgba(i % 5 ? C.cyan : C.magenta, 0.7)} strokeWidth={i % 5 ? 2 : 4} />;
        })}
        {pulse > 0.01 && <circle cx={W / 2} cy={CY} r={R + (1 - pulse) * 400} fill="none" stroke={C.cyan} strokeWidth={20 * pulse} opacity={pulse} />}
      </svg>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ transform: `translateY(${CY - 960}px) scale(${1 + pulse * 0.12})`, textShadow: THEME.glow ? `0 0 40px ${rgba(C.cyan, 0.8)}` : undefined }}>
          <Odometer text={text} p={p} size={size} color={ink} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-start', paddingTop: 1215 }}>
        <BlockText text={s.unit} at={land} size={84} color={C.magenta} label align="center" />
        <div style={{ height: 10 }} />
        <Title text={s.label} at={c1} size={36} weight={700} variant="decode" font={mono} tracking={0.18} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- cards: split comparison or timeline ----------
export const CardsB: React.FC<{ s: TimedScene & CardsScene }> = ({ s }) => {
  const t = useT();
  const titleAt = cue(s.cues, 0);
  const acc = ACCENTS();
  const n = s.cards.length;
  const compare = n === 2;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ paddingTop: 300 }}>
        <Tag text={s.tag} at={titleAt - 0.15} color={C.cyan} style={{ marginBottom: 20, justifyContent: left() ? 'flex-start' : 'center', paddingLeft: left() ? 70 : 0 }} />
        <BlockText text={s.title} at={titleAt} size={120} color={C.blue} />
      </AbsoluteFill>
      {compare ? (
        <AbsoluteFill style={{ paddingTop: 640, alignItems: 'center', gap: 0 }}>
          {s.cards.map((c, i) => {
            const at = cue(s.cues, i + 1, 0.9);
            const p = prog(t, at, 0.6);
            const from = i ? 1 : -1;
            return (
              <React.Fragment key={i}>
                <div style={{ width: 900, padding: '34px 44px', ...panel(acc[i * 2 % 4]), transform: `translateX(${(1 - p) * from * 1100}px) rotate(${(1 - p) * from * 4}deg)`, opacity: clamp(p * 2) }}>
                  <div style={{ fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: fitText(c.title.toUpperCase(), HEAD.family, headWeight(800), 86, 800), color: panelText(), textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontFamily: mono, fontSize: 30, letterSpacing: '0.2em', color: panelText(), opacity: 0.8, marginTop: 8, textTransform: 'uppercase' }}>{c.sub}</div>
                </div>
                {i === 0 && (
                  <div style={{ margin: '-26px 0', zIndex: 2, width: 120, height: 120, borderRadius: S.shape === 'circle' ? '50%' : 0, transform: `rotate(${S.shape === 'diamond' ? 45 : 0}deg) scale(${prog(t, cue(s.cues, 2, 0.9) - 0.1, 0.4)})`, background: THEME.world === 'editorial' ? '#111' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ transform: `rotate(${S.shape === 'diamond' ? -45 : 0}deg)`, fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: 46, color: THEME.world === 'editorial' ? '#fff' : '#000' }}>→</div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ paddingTop: 620, paddingLeft: 110, paddingRight: 60 }}>
          {/* timeline rail */}
          <div style={{ position: 'absolute', left: 84, top: 640, width: 6, height: 230 * n * prog(t, titleAt, n * 0.9), background: C.cyan, boxShadow: THEME.glow ? `0 0 16px ${C.cyan}` : undefined }} />
          {s.cards.map((c, i) => {
            const at = cue(s.cues, i + 1, 0.9);
            const p = prog(t, at, 0.5);
            return (
              <div key={i} style={{ position: 'relative', height: 230, opacity: clamp(p * 2), transform: `translateX(${(1 - p) * 120}px)` }}>
                <div style={{ position: 'absolute', left: -44, top: 30, width: 34, height: 34, borderRadius: S.shape === 'circle' ? '50%' : 0, background: acc[i % 4], transform: `scale(${p}) rotate(${S.shape === 'diamond' ? 45 : 0}deg)` }} />
                <div style={{ padding: '18px 30px', ...panel(acc[i % 4]), width: 820 }}>
                  <div style={{ fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: fitText(c.title.toUpperCase(), HEAD.family, headWeight(800), 64, 760), color: panelText(), textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: '0.18em', color: panelText(), opacity: 0.8, textTransform: 'uppercase' }}>{c.sub}</div>
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------- outro: name stack, headline, question card ----------
export const OutroB: React.FC<{ s: TimedScene & OutroScene }> = ({ s }) => {
  const t = useT();
  const nn = s.names.length;
  const headAt = cue(s.cues, nn, 1.0);
  const ctaAt = cue(s.cues, nn + 1, 1.6);
  const fin = s.end - 1.25;
  const acc = ACCENTS();
  const squeeze = prog(t, headAt - 0.1, 0.5);
  const cta = prog(t, ctaAt, 0.5);
  const pulse = t - fin;
  return (
    <AbsoluteFill>
      {/* names: big stacked labels, then they collapse into a row of chips */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: squeeze > 0.5 ? 'row' : 'column', gap: squeeze > 0.5 ? 14 : 18, alignItems: 'center', transform: `translateY(${mix(-120, -560, easeInOut(squeeze))}px) scale(${mix(1, 0.42, easeInOut(squeeze))})`, flexWrap: 'wrap', justifyContent: 'center', width: squeeze > 0.5 ? 2200 : 'auto' }}>
          {s.names.map((nm, i) => (
            <BlockText key={i} text={nm.toUpperCase()} at={cue(s.cues, i, 0.5)} size={150} color={acc[i % 4]} label align="center" />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center' }}>
        <div style={{ transform: `translateY(${mix(-40, -230, cta)}px)` }}>
          {s.headline.map((h, i) => (
            <BlockText key={i} text={h.toUpperCase()} at={headAt + i * 0.16} size={i ? 120 : 140} color={acc[(i + 2) % 4]} align="center" />
          ))}
        </div>
      </AbsoluteFill>
      {cta > 0 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 1050 }}>
          <div style={{ width: 920, padding: '36px 40px', ...panel(C.blue), transform: `translateY(${(1 - cta) * 160}px) rotate(${(1 - cta) * -3}deg)`, opacity: clamp(cta * 2), textAlign: 'center' }}>
            <div style={{ fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: fitText(s.cta.toUpperCase(), HEAD.family, headWeight(800), 72, 1600), color: panelText(), textTransform: 'uppercase', lineHeight: 1.1 }}>{s.cta}</div>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 24 }}>
              {['💬 COMMENT', '＋ FOLLOW'].map((b, i) => (
                <div key={b} style={{ padding: '14px 30px', borderRadius: THEME.world === 'editorial' || THEME.world === 'terminal' ? 0 : 999, background: i ? C.magenta : (THEME.world === 'terminal' ? C.cyan : '#fff'), color: i ? '#fff' : '#000', fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: 34, transform: `scale(${1 - (t > ctaAt + 0.9 + i * 0.35 ? Math.exp(-(t - ctaAt - 0.9 - i * 0.35) * 10) * 0.1 : 0)})` }}>
                  {b.replace(/^\S+ /, '')}
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      )}
      {pulse > 0 && <Motif size={300 + easeIn(clamp(pulse / 1.2)) * 2600} at={fin} color={C.cyan} y={960} spin={40} rings={3} />}
    </AbsoluteFill>
  );
};
