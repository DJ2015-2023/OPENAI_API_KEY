import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Big, Grain, Paper, Punch} from '../components/UI';
import {BODY, C, DISPLAY, T, bounce, ease, wf} from '../theme';

const S = 'industries' as const;

// word index in s07 -> sticker; positions hand-placed as a collage
const STICKERS = [
  {i: 2, emoji: '💅', text: 'Салоны красоты', x: 70, y: 420, r: -7, bg: C.pink},
  {i: 4, emoji: '🍽️', text: 'Рестораны', x: 560, y: 560, r: 5, bg: '#FFD27A'},
  {i: 5, emoji: '☕', text: 'Кафе', x: 120, y: 690, r: 4, bg: '#E8D2B8'},
  {i: 6, emoji: '🛍️', text: 'Интернет-магазины', x: 300, y: 850, r: -4, bg: C.sky},
  {i: 7, emoji: '💪', text: 'Фитнес', x: 60, y: 1030, r: -8, bg: C.lime},
  {i: 8, emoji: '🎓', text: 'Школы', x: 640, y: 1060, r: 7, bg: '#D9D2FF'},
  {i: 9, emoji: '🏠', text: 'Недвижимость', x: 210, y: 1230, r: 3, bg: '#B9F0D9'},
  {i: 10, emoji: '🩺', text: 'Клиники', x: 620, y: 1380, r: -5, bg: '#FFC1A8'},
  {i: 11, emoji: '🎉', text: 'Мероприятия', x: 80, y: 1430, r: 6, bg: C.orange},
];

const Marquee: React.FC<{y: number; dir: 1 | -1; f: number}> = ({y, dir, f}) => (
  <div style={{position: 'absolute', top: y, left: -400, whiteSpace: 'nowrap', transform: `translateX(${((f * 3 * dir) % 900) - (dir > 0 ? 900 : 0)}px) rotate(-6deg)`}}>
    <span style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, color: 'transparent', WebkitTextStroke: `3px ${C.ink}22`}}>
      {'БИЗНЕС • БИЗНЕС • БИЗНЕС • БИЗНЕС • БИЗНЕС • '}
    </span>
  </div>
);

export const Industries: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.industries.dur;
  const w = (i: number) => wf('s07', i, S);
  const stamp = bounce(f, w(13) - 2, 8, 220);

  return (
    <AbsoluteFill>
      <Paper color={C.paper} dots="#FF5A1F22" />
      <Marquee y={300} dir={1} f={f} />
      <Marquee y={980} dir={-1} f={f} />
      <Marquee y={1660} dir={1} f={f} />
      <Punch dur={dur} hits={STICKERS.map((s) => w(s.i))} amount={0.02} drift={[1.0, 1.05]}>
        <div style={{position: 'absolute', top: 130, left: 0, right: 0, textAlign: 'center', transform: `translateY(${(1 - bounce(f, w(0) - 2)) * -200}px)`}}>
          <Big size={84}>Подходит для</Big>
        </div>
        {STICKERS.map((s) => {
          const p = bounce(f, w(s.i) - 2, 9, 230);
          return (
            <div
              key={s.text}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                transform: `scale(${0.3 + p * 0.7}) rotate(${s.r + (1 - p) * 25}deg)`,
                opacity: Math.min(1, p * 4),
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '22px 34px',
                  borderRadius: 999,
                  background: s.bg,
                  border: `5px solid ${C.ink}`,
                  boxShadow: `9px 9px 0 ${C.ink}`,
                  fontFamily: BODY,
                  fontWeight: 800,
                  fontSize: 46,
                  color: C.ink,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{fontSize: 60}}>{s.emoji}</span>
                {s.text}
              </div>
            </div>
          );
        })}
        {/* "и других направлений" stamp */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 1600,
            textAlign: 'center',
            transform: `scale(${2.5 - stamp * 1.5}) rotate(-4deg)`,
            opacity: ease(f, w(13) - 2, w(13) + 3),
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '14px 34px',
              border: `7px solid ${C.cobalt}`,
              borderRadius: 18,
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: 46,
              color: C.cobalt,
              background: '#ffffffcc',
            }}
          >
            + ДРУГИЕ НАПРАВЛЕНИЯ
          </span>
        </div>
      </Punch>
      <Grain />
    </AbsoluteFill>
  );
};
