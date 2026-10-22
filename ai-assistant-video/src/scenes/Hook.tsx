import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Camera, CyberBackground, GlitchText, Particles, WordReveal} from '../components/FX';
import {CHANNELS} from '../components/Icons';
import {C, FONT, T, clamp, ease, pop, rel} from '../theme';

const MSGS = [
  {ch: 0, who: 'Анна', text: 'Здравствуйте, вы работаете?'},
  {ch: 1, who: 'Игорь', text: 'Сколько стоит услуга?'},
  {ch: 2, who: 'mila_beauty', text: 'Можно записаться на завтра?'},
  {ch: 3, who: 'Дмитрий', text: 'Есть свободное время?'},
  {ch: 4, who: 'Заявка с сайта', text: 'Перезвоните мне, пожалуйста'},
  {ch: 0, who: 'Ольга', text: 'Ау?? Мне кто-нибудь ответит?'},
  {ch: 2, who: 'alex.k', text: 'Цена актуальна?'},
  {ch: 1, who: 'Сергей', text: 'Ладно, пойду к конкурентам…'},
];

const Bubble: React.FC<{m: (typeof MSGS)[number]; p: number; lost: number}> = ({m, p, lost}) => {
  const {Icon} = CHANNELS[m.ch];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 20px',
        marginBottom: 14,
        borderRadius: 26,
        background: 'rgba(22,26,52,0.92)',
        border: `1.5px solid ${lost > 0.5 ? C.red + 'aa' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: lost > 0.5 ? `0 0 30px ${C.red}55` : '0 10px 30px rgba(0,0,0,0.4)',
        transform: `translateY(${(1 - p) * -80}px) scale(${0.85 + p * 0.15})`,
        opacity: p * (1 - lost * 0.45),
        filter: `grayscale(${lost * 0.8})`,
      }}
    >
      <Icon size={62} />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontFamily: FONT, fontSize: 25, fontWeight: 700, color: C.white}}>{m.who}</div>
        <div style={{fontFamily: FONT, fontSize: 24, fontWeight: 500, color: C.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {m.text}
        </div>
      </div>
      <div
        style={{
          minWidth: 38,
          height: 38,
          borderRadius: 19,
          background: C.red,
          color: '#fff',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {1 + (m.who.length % 3)}
      </div>
    </div>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const S = T.scenes.hook;
  const h1 = rel('h1', 'hook');
  const h2 = rel('h2', 'hook');
  const span = S.dur - 30;
  const shown = MSGS.map((_, i) => 6 + (i * span) / MSGS.length);
  const visible = MSGS.map((m, i) => ({m, i, at: shown[i]})).filter((x) => f >= x.at);
  const unread = Math.floor(interpolate(f, [0, S.dur - 10], [3, 147], clamp));
  const alarm = 0.5 + 0.5 * Math.sin(f / 3);

  return (
    <AbsoluteFill>
      <CyberBackground hue={C.red} gridSpeed={0.6} intensity={0.8} />
      <Particles count={40} color={C.red} speed={0.6} />
      <Camera dur={S.dur} zoom={[1.0, 1.12]} rotate={[-1, 1.5]} shake={(fr) => interpolate(fr, [h2, S.dur], [0.02, 0.35], clamp)}>
        {/* phone */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 300,
            top: 150,
            width: 600,
            height: 1060,
            transform: `perspective(1400px) rotateY(${interpolate(f, [0, S.dur], [-16, 10])}deg) rotateX(${8 - f * 0.03}deg) translateZ(${ease(f, 0, 30, -400, 0)}px)`,
            opacity: ease(f, 0, 12),
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 70,
              background: 'linear-gradient(160deg,#20243f,#0b0d1d)',
              border: '3px solid rgba(255,255,255,0.18)',
              boxShadow: `0 40px 120px rgba(0,0,0,0.8), 0 0 ${60 + alarm * 60}px ${C.red}55`,
              overflow: 'hidden',
              padding: '90px 26px 26px',
            }}
          >
            <div style={{position: 'absolute', top: 24, left: '50%', width: 150, height: 38, marginLeft: -75, borderRadius: 20, background: '#000'}} />
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white}}>Сообщения</div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 30,
                  color: '#fff',
                  background: C.red,
                  borderRadius: 30,
                  padding: '6px 18px',
                  transform: `scale(${1 + alarm * 0.08})`,
                  boxShadow: `0 0 30px ${C.red}`,
                }}
              >
                {unread > 99 ? '99+' : unread}
              </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column-reverse'}}>
              {visible.slice(-8).map(({m, i, at}) => (
                <Bubble key={i} m={m} p={pop(f, at, 13, 180)} lost={interpolate(f, [at + 40, at + 60], [0, 1], clamp)} />
              ))}
            </div>
          </div>
        </div>

        {/* flying notification chips around the phone (parallax depth) */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const at = 10 + i * 22;
          const p = interpolate(f, [at, at + 70], [0, 1], clamp);
          if (p <= 0 || p >= 1) return null;
          const {Icon} = CHANNELS[i % 5];
          const side = i % 2 === 0 ? -1 : 1;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 540 + side * (330 + p * 260) - 50,
                top: 300 + i * 150 - p * 120,
                transform: `scale(${0.6 + p * 0.9}) rotate(${side * p * 25}deg)`,
                opacity: Math.sin(p * Math.PI),
                filter: `blur(${p * 6}px)`,
              }}
            >
              <Icon size={100} />
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: C.red,
                  color: '#fff',
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 3}
              </div>
            </div>
          );
        })}
      </Camera>

      {/* headline */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 1250}}>
        <WordReveal text="Ваш бизнес" start={h1} size={78} weight={700} color={C.white} />
        <div style={{opacity: ease(f, h1 + 8, h1 + 14), transform: `scale(${interpolate(pop(f, h1 + 8, 10, 200), [0, 1], [2.2, 1])})`, marginTop: 8}}>
          <GlitchText text={'ТЕРЯЕТ КЛИЕНТОВ'} size={94} color={C.red} strength={1.2} />
        </div>
        <div style={{marginTop: 26}}>
          <WordReveal
            text="из-за сообщений, на которые никто не успевает ответить?"
            start={h1 + 30}
            perWord={Math.max(2, Math.floor((h2 + 30 - h1 - 30) / 8))}
            size={54}
            weight={600}
            color={'#d7dcf5'}
            highlight={{никто: C.red, ответить: C.gold}}
          />
        </div>
      </div>

      {/* red alarm edge */}
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${120 + alarm * 80}px ${C.red}${f > h2 ? '88' : '44'}`}} />
    </AbsoluteFill>
  );
};
