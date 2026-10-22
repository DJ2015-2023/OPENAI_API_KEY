import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, SANS, SERIF, ease} from '../theme';
import {Couple} from './UI';

export type SiteTheme = {bg: string; ink: string; accent: string; soft: string};
export const THEMES: SiteTheme[] = [
  {bg: '#1A0610', ink: '#FFF4E6', accent: '#E8C27A', soft: '#3A0718'},
  {bg: '#FFF4E6', ink: '#2A0A14', accent: '#C8102E', soft: '#F6DCD8'},
  {bg: '#0E1726', ink: '#F2F5FF', accent: '#FF6B8B', soft: '#1D2B45'},
  {bg: '#F7EFE2', ink: '#1E1A16', accent: '#B8893B', soft: '#EADBC2'},
];

export type Page = 'home' | 'courses' | 'booking' | 'account' | 'payment' | 'schedule';

const Btn: React.FC<{th: SiteTheme; children: React.ReactNode; s: number}> = ({th, children, s}) => (
  <div style={{display: 'inline-block', background: th.accent, color: th.bg, fontFamily: SANS, fontWeight: 600, fontSize: 14 * s, padding: `${8 * s}px ${18 * s}px`, borderRadius: 999}}>{children}</div>
);

/** A mock dance-teacher website. `w` = viewport width in px; `mobile` switches to a stacked layout. */
export const Site: React.FC<{w: number; h: number; th: SiteTheme; page?: Page; mobile?: boolean; at?: number}> = ({w, h, th, page = 'home', mobile, at = 0}) => {
  const f = useCurrentFrame();
  const s = mobile ? w / 360 : w / 900;
  const p = ease(f, at, at + 14);
  const card = (title: string, sub: string, k: number) => (
    <div key={title} style={{flex: 1, background: th.soft, borderRadius: 12 * s, padding: 12 * s, opacity: ease(f, at + 4 + k * 4, at + 14 + k * 4), transform: `translateY(${(1 - ease(f, at + 4 + k * 4, at + 14 + k * 4)) * 20}px)`}}>
      <div style={{height: 60 * s, borderRadius: 8 * s, background: `linear-gradient(135deg, ${th.accent}, ${th.soft})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden'}}>
        <Couple size={56 * s} color={th.bg} />
      </div>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 15 * s, color: th.ink, marginTop: 8 * s}}>{title}</div>
      <div style={{fontFamily: SANS, fontSize: 11 * s, color: th.ink, opacity: 0.7}}>{sub}</div>
    </div>
  );
  let body: React.ReactNode = null;
  if (page === 'home') {
    body = (
      <div style={{display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: 16 * s, padding: `${18 * s}px ${22 * s}px`}}>
        <div style={{flex: 1}}>
          <div style={{fontFamily: SANS, fontSize: 11 * s, letterSpacing: '0.2em', color: th.accent}}>ОНЛАЙН-ШКОЛА ТАНЦА</div>
          <div style={{fontFamily: SERIF, fontWeight: 900, fontStyle: 'italic', fontSize: 38 * s, lineHeight: 1, color: th.ink, margin: `${8 * s}px 0`}}>Танцуй бачату из любой точки мира</div>
          <Btn th={th} s={s}>Записаться на урок</Btn>
        </div>
        <div style={{width: mobile ? '100%' : 300 * s, height: 190 * s, borderRadius: 16 * s, background: `radial-gradient(circle at 50% 70%, ${th.accent}, ${th.soft})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
          <Couple size={180 * s} color={th.bg} />
        </div>
      </div>
    );
  } else if (page === 'courses') {
    body = (
      <div style={{padding: 20 * s}}>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 28 * s, color: th.ink}}>Онлайн-курсы</div>
        <div style={{display: 'flex', gap: 12 * s, marginTop: 12 * s}}>
          {card('Бачата: старт', '12 видеоуроков', 0)}
          {card('Сальса Pro', '20 видеоуроков', 1)}
          {!mobile && card('Кизомба', '15 видеоуроков', 2)}
        </div>
        <div style={{marginTop: 14 * s}}>
          <Btn th={th} s={s}>Купить курс</Btn>
        </div>
      </div>
    );
  } else if (page === 'booking' || page === 'schedule') {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const picked = page === 'booking' ? 10 : -1;
    body = (
      <div style={{padding: 20 * s}}>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 26 * s, color: th.ink}}>{page === 'booking' ? 'Запись на мастер-класс' : 'Расписание занятий'}</div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 * s, marginTop: 12 * s}}>
          {days.map((d) => (
            <div key={d} style={{fontFamily: SANS, fontSize: 11 * s, color: th.ink, opacity: 0.6, textAlign: 'center'}}>{d}</div>
          ))}
          {new Array(21).fill(0).map((_, i) => {
            const has = [2, 4, 9, 10, 13, 16, 18].includes(i);
            const sel = i === picked && f > at + 12;
            return (
              <div key={i} style={{height: 34 * s, borderRadius: 8 * s, background: sel ? th.accent : has ? th.soft : 'transparent', border: `1px solid ${th.soft}`, fontFamily: SANS, fontSize: 12 * s, color: sel ? th.bg : th.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${sel ? 1.08 : 1})`}}>
                {i + 1}
                {has && !sel && <span style={{width: 5 * s, height: 5 * s, borderRadius: 3 * s, background: th.accent, marginLeft: 3 * s}} />}
              </div>
            );
          })}
        </div>
        {page === 'booking' && (
          <div style={{marginTop: 12 * s, opacity: ease(f, at + 14, at + 22)}}>
            <Btn th={th} s={s}>✓ Вы записаны · Сб 19:00</Btn>
          </div>
        )}
      </div>
    );
  } else if (page === 'account') {
    body = (
      <div style={{padding: 20 * s}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12 * s}}>
          <div style={{width: 46 * s, height: 46 * s, borderRadius: 23 * s, background: th.accent}} />
          <div>
            <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 22 * s, color: th.ink}}>Личный кабинет</div>
            <div style={{fontFamily: SANS, fontSize: 12 * s, color: th.ink, opacity: 0.7}}>Мои курсы и прогресс</div>
          </div>
        </div>
        {['Бачата: старт', 'Сальса Pro'].map((c, k) => (
          <div key={c} style={{marginTop: 14 * s}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 13 * s, color: th.ink}}>
              <span>{c}</span>
              <span>Урок {k ? 4 : 9}</span>
            </div>
            <div style={{height: 8 * s, background: th.soft, borderRadius: 4 * s, marginTop: 5 * s}}>
              <div style={{height: '100%', width: `${(k ? 30 : 75) * ease(f, at + 4, at + 24)}%`, background: th.accent, borderRadius: 4 * s}} />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (page === 'payment') {
    const paid = f > at + 14;
    body = (
      <div style={{padding: 20 * s, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * s}}>
        <div style={{width: 70 * s, height: 70 * s, borderRadius: 35 * s, background: paid ? th.accent : th.soft, color: th.bg, fontSize: 36 * s, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${paid ? 1 : 0.8})`}}>{paid ? '✓' : '…'}</div>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 24 * s, color: th.ink}}>{paid ? 'Оплата прошла' : 'Оплата курса'}</div>
        <div style={{fontFamily: SANS, fontSize: 13 * s, color: th.ink, opacity: 0.8}}>{paid ? 'Доступ к курсу открыт автоматически' : 'Банковская карта · СБП'}</div>
        {paid && <Btn th={th} s={s}>Смотреть урок 1 ▶</Btn>}
      </div>
    );
  }
  return (
    <div style={{width: w, height: h, background: th.bg, overflow: 'hidden', opacity: 0.4 + 0.6 * p, transition: 'none'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${10 * s}px ${22 * s}px`, borderBottom: `1px solid ${th.soft}`}}>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontStyle: 'italic', fontSize: 18 * s, color: th.ink}}>
          Ваше<span style={{color: th.accent}}>Имя</span> Dance
        </div>
        {!mobile ? (
          <div style={{display: 'flex', gap: 16 * s, fontFamily: SANS, fontSize: 12 * s, color: th.ink, opacity: 0.85}}>
            <span>Курсы</span>
            <span>Расписание</span>
            <span>Кабинет</span>
          </div>
        ) : (
          <div style={{fontSize: 18 * s, color: th.ink}}>☰</div>
        )}
      </div>
      {body}
    </div>
  );
};

/* ---------- device frames ---------- */
export const Laptop: React.FC<{w: number; children: React.ReactNode; style?: React.CSSProperties}> = ({w, children, style}) => {
  const sh = w * 0.6;
  return (
    <div style={{position: 'absolute', width: w, ...style}}>
      <div style={{width: w, height: sh, borderRadius: 18, background: '#0c0c0e', padding: 12, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', border: '2px solid #2a2a30'}}>
        <div style={{width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden'}}>{children}</div>
      </div>
      <div style={{width: w * 1.12, marginLeft: -w * 0.06, height: 22, borderRadius: '0 0 18px 18px', background: 'linear-gradient(#cfc9c2, #8e8880)'}} />
    </div>
  );
};

export const Tablet: React.FC<{w: number; children: React.ReactNode; style?: React.CSSProperties}> = ({w, children, style}) => (
  <div style={{position: 'absolute', width: w, height: w * 1.33, borderRadius: 28, background: '#0c0c0e', padding: 16, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', border: '2px solid #2a2a30', ...style}}>
    <div style={{width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden'}}>{children}</div>
  </div>
);

export const Phone: React.FC<{w: number; children: React.ReactNode; style?: React.CSSProperties}> = ({w, children, style}) => (
  <div style={{position: 'absolute', width: w, height: w * 2.05, borderRadius: w * 0.14, background: '#0c0c0e', padding: w * 0.04, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', border: '2px solid #2a2a30', ...style}}>
    <div style={{width: '100%', height: '100%', borderRadius: w * 0.1, overflow: 'hidden'}}>{children}</div>
  </div>
);

export const goldText = C.gold;
