import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { Timeline } from '../types';
import { C, FPS, HEAD, S, THEME, clamp, prog, rgba } from '../lib';
import { fitText, headWeight } from './type';

// Most Shorts are watched muted: every spoken word appears, the current one highlighted.
// Placed above the bottom ~20% that YouTube covers with its own title and buttons.
const TOP = 1430;

export const Captions: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const t = useCurrentFrame() / FPS;
  const caps = tl.captions ?? [];
  const current = caps.find((c) => t >= c.at && t < c.end + 0.25);
  if (!current) return null;
  const words = caps.filter((c) => c.group === current.group);
  const groupStart = words[0].at;
  const pop = prog(t, groupStart, 0.18);
  // leave room for the active word's pop (up to 15% larger)
  const size = fitText(words.map((w) => w.text).join(' ').toUpperCase(), HEAD.family, headWeight(800), 74, 860);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute', top: TOP, left: 40, right: 40, display: 'flex', justifyContent: 'center', gap: '0 0.28em',
          fontFamily: HEAD.family, fontWeight: headWeight(800), fontSize: size, lineHeight: 1.15, textTransform: 'uppercase', whiteSpace: 'nowrap', flexWrap: 'nowrap',
          transform: `translateY(${(1 - pop) * 26}px) scale(${0.92 + 0.08 * pop})`, opacity: clamp(pop * 2),
        }}
      >
        {words.map((w, i) => {
          const active = t >= w.at && t < w.end + 0.05;
          const spoken = t >= w.at;
          const base: React.CSSProperties = {
            display: 'inline-block', color: spoken ? '#ffffff' : 'rgba(255,255,255,0.55)', padding: '0 0.08em',
            textShadow: '0 4px 0 rgba(0,0,0,0.55), 0 0 24px rgba(0,0,0,0.9)', WebkitTextStroke: '2px rgba(0,0,0,0.65)',
          };
          if (THEME.world === 'editorial') {
            // print style: dark ink, the spoken word gets a solid color block
            Object.assign(base, { color: spoken ? '#111' : 'rgba(0,0,0,0.4)', textShadow: 'none', WebkitTextStroke: '0px' });
            if (active) Object.assign(base, { color: '#fff', background: C.blue });
          } else if (THEME.world === 'terminal') {
            Object.assign(base, { color: spoken ? C.cyan : rgba(C.cyan, 0.35), WebkitTextStroke: '0px', textShadow: `0 0 14px ${rgba(C.cyan, 0.8)}` });
            if (active) Object.assign(base, { color: '#000', background: C.cyan, textShadow: 'none' });
          } else if (active && S.motion === 'impact') {
            // filled box behind the word
            Object.assign(base, { color: '#fff', background: C.blue, borderRadius: 10, boxShadow: `0 0 30px ${rgba(C.blue, 0.7)}`, WebkitTextStroke: '0px', transform: 'rotate(-2deg) scale(1.08)' });
          } else if (active && S.motion === 'digital') {
            // color pop
            Object.assign(base, { color: C.cyan, transform: 'scale(1.15)', textShadow: `0 0 26px ${rgba(C.cyan, 0.9)}, 0 4px 0 rgba(0,0,0,0.6)` });
          } else if (active) {
            // underline sweep
            Object.assign(base, { color: C.cyan, borderBottom: `6px solid ${C.violet}` });
          }
          return <span key={i} style={base}>{w.text.replace(/[,.;:]+$/, '')}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
