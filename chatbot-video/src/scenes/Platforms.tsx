import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {PLATFORMS} from '../components/Platforms';
import {Big, Body, Card, Grain, Marker, Paper, Punch, SlotLine} from '../components/UI';
import {C, DISPLAY, T, bounce, ease, wf} from '../theme';

const S = 'platforms' as const;

// final 2x2 grid slots (card centre)
const SLOTS = [
  [295, 1010],
  [785, 1010],
  [295, 1530],
  [785, 1530],
];

export const Platforms: React.FC = () => {
  const f = useCurrentFrame();
  const dur = T.scenes.platforms.dur;
  const w = (i: number) => wf('s04', i, S);
  // telegram, whatsapp, vk ("в-к"), max (~8 frames after "и")
  const deal = [w(8), w(9), w(10), w(12) + 8];

  return (
    <AbsoluteFill>
      <Paper color={C.paper} dots="#2B3BFF18" drift={-1} />
      <Punch dur={dur} hits={deal} amount={0.03} drift={[1.04, 1.0]}>
        <div style={{position: 'absolute', left: 70, right: 70, top: 130}}>
          <SlotLine at={w(0) - 2}>
            <Big size={92}>Я создаю</Big>
          </SlotLine>
          <SlotLine at={w(2) - 3}>
            <Big size={92} color={C.orange}>
              чат-ботов
            </Big>
          </SlotLine>
          <div style={{marginTop: 26, opacity: ease(f, w(3), w(3) + 8)}}>
            <Body size={44} weight={700}>
              под <Marker at={w(4)}>задачи</Marker> вашего бизнеса для:
            </Body>
          </div>
        </div>

        {PLATFORMS.map((p, i) => {
          const s = bounce(f, deal[i], 12, 150);
          // cards start stacked in a deck at bottom-centre, slightly fanned
          const deckX = 540 + (i - 1.5) * 14;
          const deckY = 1960 + i * 6;
          const [sx, sy] = SLOTS[i];
          const x = interpolate(s, [0, 1], [deckX, sx]);
          const y = interpolate(s, [0, 1], [deckY, sy]);
          const rot = interpolate(s, [0, 1], [(i - 1.5) * 8, i % 2 ? 3 : -3]);
          const tilt = interpolate(s, [0, 1], [50, 0]);
          const {Icon} = p;
          return (
            <div
              key={p.name}
              style={{
                position: 'absolute',
                left: x - 220,
                top: y - 230,
                width: 440,
                height: 460,
                transform: `perspective(1400px) rotate(${rot}deg) rotateX(${tilt}deg)`,
              }}
            >
              <Card bg={p.bg} style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34}}>
                <Icon size={210} />
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.ink}}>{p.name}</div>
              </Card>
            </div>
          );
        })}
      </Punch>
      <Grain />
    </AbsoluteFill>
  );
};
