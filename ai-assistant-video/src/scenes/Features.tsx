import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Camera, CyberBackground, Particles} from '../components/FX';
import {BoltIcon, CalendarIcon, ChartIcon, FormIcon, WhatsAppIcon} from '../components/Icons';
import {C, FONT, T, clamp, ease, pop, rel} from '../theme';

const FEATURES = [
  {id: 'f1', title: 'Мгновенно отвечает', sub: 'клиентам за 1 секунду', Icon: BoltIcon, color: C.cyan},
  {id: 'f2', title: 'Принимает заявки', sub: 'и сохраняет контакты', Icon: FormIcon, color: C.violet},
  {id: 'f3', title: 'Автоматизирует запись', sub: 'в ваш календарь', Icon: CalendarIcon, color: C.green},
  {id: 'f4', title: 'Увеличивает продажи', sub: 'и средний чек', Icon: ChartIcon, color: C.gold},
];

const ChatMock: React.FC<{f: number}> = ({f}) => {
  const q = pop(f, 4, 14, 160);
  const typing = f > 14 && f < 26;
  const a = pop(f, 26, 13, 170);
  const dots = [0, 1, 2].map((i) => 0.4 + 0.6 * Math.abs(Math.sin(f / 3 + i)));
  const bubble: React.CSSProperties = {fontFamily: FONT, fontSize: 32, fontWeight: 500, padding: '20px 26px', borderRadius: 30, maxWidth: 600, lineHeight: 1.25};
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 170,
        width: 900,
        padding: 34,
        borderRadius: 44,
        background: 'linear-gradient(160deg, rgba(30,36,74,0.9), rgba(10,12,30,0.9))',
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 60px ${C.cyan}22`,
        transform: `perspective(1600px) rotateY(${interpolate(f, [0, 200], [-14, 6])}deg) rotateX(6deg)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26}}>
        <WhatsAppIcon size={70} />
        <div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: C.white}}>ИИ-ассистент</div>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.green}}>● онлайн 24/7</div>
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 18}}>
        <div style={{...bubble, background: C.violet, color: '#fff', transform: `scale(${q})`, transformOrigin: '100% 100%', opacity: q}}>
          Здравствуйте! Можно записаться на завтра?
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-start', minHeight: 130}}>
        {typing ? (
          <div style={{...bubble, background: 'rgba(255,255,255,0.1)', display: 'flex', gap: 10}}>
            {dots.map((o, i) => (
              <div key={i} style={{width: 16, height: 16, borderRadius: 8, background: C.cyan, opacity: o}} />
            ))}
          </div>
        ) : (
          <div
            style={{
              ...bubble,
              background: 'rgba(39,232,255,0.14)',
              border: `1.5px solid ${C.cyan}88`,
              color: C.white,
              transform: `scale(${a})`,
              transformOrigin: '0% 100%',
              opacity: a,
            }}
          >
            Конечно! Свободно в 12:00 и 15:30. Записать вас? ✅
            <div style={{fontSize: 22, color: C.cyan, marginTop: 6, fontWeight: 700}}>ответ за 0,8 сек ⚡</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Features: React.FC = () => {
  const f = useCurrentFrame();
  const S = T.scenes.features;
  return (
    <AbsoluteFill>
      <CyberBackground hue={C.violet} gridSpeed={2} />
      <Particles count={50} color={C.cyan} speed={1.8} />
      <Camera dur={S.dur} zoom={[1.06, 1.0]} rotate={[-1.5, 1]} tilt={[4, -2]}>
        <ChatMock f={f} />
        <div style={{position: 'absolute', left: 80, right: 80, top: 860}}>
          {FEATURES.map((ft, i) => {
            const at = rel(ft.id, 'features') - 4;
            const s = pop(f, at, 13, 150);
            const active = i === FEATURES.length - 1 ? f >= at : f >= at && f < rel(FEATURES[i + 1].id, 'features') - 4;
            const {Icon} = ft;
            return (
              <div
                key={ft.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 30,
                  height: 200,
                  marginBottom: 24,
                  padding: '0 36px',
                  borderRadius: 36,
                  background: active ? `linear-gradient(90deg, ${ft.color}33, rgba(16,20,44,0.92) 60%)` : 'rgba(16,20,44,0.85)',
                  border: `2px solid ${active ? ft.color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: active ? `0 0 50px ${ft.color}66, inset 0 0 40px ${ft.color}22` : '0 20px 50px rgba(0,0,0,0.5)',
                  transform: `perspective(1200px) translateX(${(1 - s) * 900}px) rotateY(${(1 - s) * -50}deg) scale(${active ? 1.03 : 0.97})`,
                  opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 32,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(150deg, ${ft.color}, ${ft.color}55)`,
                    boxShadow: `0 0 40px ${ft.color}88`,
                  }}
                >
                  <Icon size={70} color="#fff" />
                </div>
                <div>
                  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 54, color: C.white, letterSpacing: '-0.02em', lineHeight: 1.05}}>{ft.title}</div>
                  <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 32, color: C.dim, marginTop: 6, opacity: ease(f, at + 8, at + 16)}}>{ft.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
