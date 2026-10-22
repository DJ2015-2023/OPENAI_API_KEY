import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Big, Grain, Paper} from '../components/UI';
import {BODY, C, DISPLAY, T, clamp, ease, wf} from '../theme';

const S = 'features' as const;

const ITEMS = [
  {clip: 's05', i: 0, emoji: '⚡', text: 'Мгновенные ответы клиентам', bg: C.lime},
  {clip: 's05', i: 3, emoji: '📅', text: 'Запись и бронирование', bg: C.sky},
  {clip: 's05', i: 6, emoji: '🛒', text: 'Приём заявок и заказов', bg: C.pink},
  {clip: 's05', i: 10, emoji: '💬', text: 'Консультации и поддержка', bg: '#FFD27A'},
  {clip: 's06', i: 0, emoji: '📊', text: 'Сбор данных клиентов', bg: '#B9F0D9'},
  {clip: 's06', i: 3, emoji: '🔔', text: 'Уведомления и напоминания', bg: '#FFC1A8'},
  {clip: 's06', i: 6, emoji: '⚙️', text: 'Автоматизация рутинных процессов', bg: '#D9D2FF'},
  {clip: 's06', i: 9, emoji: '💰', text: 'Помощь в увеличении продаж', bg: C.orange},
];

const TW = 470;
const TH = 330;
const GX = 50;
const GY = 330;
const tileXY = (k: number) => [GX + (k % 2) * (TW + 40), GY + Math.floor(k / 2) * (TH + 30)] as const;

export const Features: React.FC = () => {
  const f = useCurrentFrame();
  const at = ITEMS.map((it) => wf(it.clip, it.i, S) - 3);
  let active = -1;
  at.forEach((a, k) => {
    if (f >= a) active = k;
  });
  // camera follows the active tile: interpolate between consecutive tile centres
  const camKeys: number[] = [];
  const camX: number[] = [];
  const camY: number[] = [];
  at.forEach((a, k) => {
    // hold on the previous tile until this one flips, then glide over
    const [px, py] = tileXY(Math.max(0, k - 1));
    const [x, y] = tileXY(k);
    camKeys.push(a, a + 12);
    camX.push(px + TW / 2, x + TW / 2);
    camY.push(py + TH / 2, y + TH / 2);
  });
  const cx = interpolate(f, camKeys, camX, {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cy = interpolate(f, camKeys, camY, {...clamp, easing: Easing.inOut(Easing.cubic)});
  const zoom = interpolate(f, [at[0] - 10, at[0] + 10, at[7] + 20, at[7] + 45], [1, 1.05, 1.05, 1], clamp);
  const allIn = ease(f, at[7] + 20, at[7] + 45);
  const tx = (540 - cx) * (zoom - 1) * 1.2 * (1 - allIn);
  const ty = (960 - cy) * (zoom - 1) * 1.6 * (1 - allIn);
  const n = Math.max(0, active + 1);

  return (
    <AbsoluteFill>
      <Paper color={C.cream} />
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${zoom})`}}>
        <div style={{position: 'absolute', left: 60, right: 60, top: 120, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <Big size={70}>Что умеет бот</Big>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: C.orange}}>
            {String(n).padStart(2, '0')}
            <span style={{color: C.grey, fontSize: 40}}>/08</span>
          </div>
        </div>
        {ITEMS.map((it, k) => {
          const [x, y] = tileXY(k);
          const flip = interpolate(f, [at[k], at[k] + 12], [180, 0], {...clamp, easing: Easing.out(Easing.back(1.6))});
          const showFront = flip < 90;
          const isActive = k === active && allIn < 0.5;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: TW,
                height: TH,
                transform: `perspective(1600px) rotateY(${flip}deg) scale(${isActive ? 1.04 : 1})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 34,
                  border: `5px solid ${C.ink}`,
                  boxShadow: `${isActive ? 16 : 10}px ${isActive ? 16 : 10}px 0 ${C.ink}`,
                  background: showFront ? it.bg : C.ink,
                  transform: showFront ? undefined : 'scaleX(-1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 30,
                }}
              >
                {showFront ? (
                  <>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <div style={{fontSize: 96, lineHeight: 1}}>{it.emoji}</div>
                      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, color: C.ink, opacity: 0.5}}>{String(k + 1).padStart(2, '0')}</div>
                    </div>
                    <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 40, lineHeight: 1.1, color: C.ink}}>{it.text}</div>
                  </>
                ) : (
                  <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, color: '#ffffff22', textAlign: 'center', marginTop: 70}}>?</div>
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};
