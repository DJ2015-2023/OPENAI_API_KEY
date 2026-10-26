import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {Block, Chip, Eyebrow, Glass, Icon, Rule, Script, Words, sans, serifItalic} from './components/Text';
import {Glint, Sparkles} from './components/FX';
import {C, SANS, SCRIPT, T, W, bf, clamp, ease, pulse, roseGold, snap} from './theme';

const Bottom: React.FC<{children: React.ReactNode; bottom?: number}> = ({children, bottom = 250}) => (
  <div style={{position: 'absolute', left: 60, right: 60, bottom, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>{children}</div>
);

/** BACHATA + Lady Style lockup. */
const Lockup: React.FC<{at: number; scale?: number}> = ({at, scale = 1}) => {
  const f = useCurrentFrame();
  const letters = 'BACHATA'.split('');
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${scale})`}}>
      <div style={{display: 'flex'}}>
        {letters.map((l, i) => {
          const p = snap(f, at + i * 2, 13, 200);
          return (
            <span key={i} style={{...sans(150, 800, {letterSpacing: '0.06em'}), ...roseGold, display: 'inline-block', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * (i % 2 ? 8 : -8)}deg)`, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.5))'}}>
              {l}
            </span>
          );
        })}
      </div>
      <Script text="Lady Style" at={at + 12} size={170} style={{marginTop: -40}} />
    </div>
  );
};

/* ================================================================ INTRO */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const b = (i: number) => bf('intro', i);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: 1 - ease(f, 0, 10)}} />
      <Bottom bottom={330}>
        <Lockup at={b(4) - 4} />
        <Rule at={b(8) - 2} width={560} style={{marginTop: 26}} />
        <Block at={b(8)} style={{position: 'relative', marginTop: 22}}>
          <div style={sans(42, 700, {letterSpacing: '0.2em', color: C.ivory})}>ХОРЕОКУРС</div>
          <div style={sans(34, 500, {letterSpacing: '0.12em', color: C.rose, marginTop: 10})}>+ профессиональная видеосъёмка</div>
        </Block>
      </Bottom>
      <Glint x={860} y={1180} size={120} p={ease(f, b(6), b(8))} />
      <Glint x={250} y={1350} size={80} p={ease(f, b(9), b(11))} />
    </AbsoluteFill>
  );
};

/* ================================================================ TAGLINE */
export const Tagline: React.FC = () => {
  const b = (i: number) => bf('tagline', i);
  const L: [string, string, number][] = [
    ['Раскрой свою', 'женственность', 0],
    ['почувствуй', 'уверенность', 4],
    ['и стань главной героиней', 'своего танца!', 8],
  ];
  return (
    <AbsoluteFill>
      {L.map(([a, s, i], k) => (
        <Block key={k} at={b(i)} out={k < 2 ? b(i + 4) : 1e9} style={{left: 60, right: 60, bottom: 300, textAlign: 'center'}}>
          <Words text={a} at={b(i)} style={serifItalic(k === 2 ? 72 : 84)} />
          <Script text={s} at={b(i) + 8} size={k === 2 ? 128 : 150} style={{marginTop: 4}} />
        </Block>
      ))}
    </AbsoluteFill>
  );
};

/* ================================================================ NOT JUST CLASSES */
export const NotJust: React.FC = () => {
  const b = (i: number) => bf('notjust', i);
  return (
    <AbsoluteFill>
      <Block at={b(0)} out={b(4)} style={{left: 60, right: 60, bottom: 330, textAlign: 'center'}}>
        <Words text="Это не просто занятия —" at={b(0)} style={serifItalic(84)} />
      </Block>
      <Block at={b(4)} out={b(8)} style={{left: 60, right: 60, bottom: 300, textAlign: 'center'}}>
        <Words text="это возможность" at={b(4)} style={serifItalic(80)} />
        <Script text="раскрыть себя" at={b(4) + 8} size={140} />
        <Words text="по-новому" at={b(4) + 16} style={serifItalic(80)} />
      </Block>
      <Block at={b(8)} style={{left: 60, right: 60, bottom: 280}}>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18}}>
          {['красота движений', 'музыкальность', 'эмоции', 'атмосфера танца'].map((t, i) => (
            <Chip key={t} at={b(8) + i * 4}>
              {t}
            </Chip>
          ))}
        </div>
      </Block>
    </AbsoluteFill>
  );
};

/* ================================================================ WHAT TO EXPECT */
const ITEMS: {icon: 'clock' | 'dancer' | 'wave' | 'heart' | 'camera'; big: string; sub: string}[] = [
  {icon: 'clock', big: '6 часов', sub: 'интенсивных занятий и работы над хореографией'},
  {icon: 'dancer', big: 'Женственная постановка', sub: 'красивая и выразительная — в стиле Bachata Lady Style'},
  {icon: 'wave', big: 'Пластика и музыкальность', sub: 'техника движений и уверенность в танце'},
  {icon: 'heart', big: 'Эмоции и подача', sub: 'особое внимание индивидуальности каждой участницы'},
  {icon: 'camera', big: 'Видеосъёмка', sub: 'сохрани результат в красивом танцевальном видео'},
];
const Viewfinder: React.FC<{on: number}> = ({on}) => {
  const f = useCurrentFrame();
  if (on <= 0) return null;
  const corner = (r: number): React.CSSProperties => ({position: 'absolute', width: 90, height: 90, borderColor: 'rgba(255,255,255,0.85)', borderStyle: 'solid', borderWidth: 0, transform: `rotate(${r}deg)`});
  const s = `${String(Math.floor(f / 30) % 60).padStart(2, '0')}:${String(f % 30).padStart(2, '0')}`;
  return (
    <AbsoluteFill style={{opacity: on}}>
      {[
        [60, 140, 0],
        [W - 150, 140, 90],
        [W - 150, 1690, 180],
        [60, 1690, 270],
      ].map(([x, y, r], i) => (
        <div key={i} style={{...corner(r), left: x, top: y, borderTopWidth: 5, borderLeftWidth: 5}} />
      ))}
      <div style={{position: 'absolute', top: 170, left: 120, display: 'flex', alignItems: 'center', gap: 16, fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#fff'}}>
        <div style={{width: 26, height: 26, borderRadius: '50%', background: C.red, opacity: f % 30 < 18 ? 1 : 0.2, boxShadow: `0 0 16px ${C.red}`}} />
        REC
      </div>
      <div style={{position: 'absolute', top: 170, right: 120, fontFamily: SANS, fontWeight: 500, fontSize: 36, color: '#fff'}}>00:{s}</div>
    </AbsoluteFill>
  );
};
export const Expect: React.FC = () => {
  const f = useCurrentFrame();
  const b = (i: number) => bf('expect', i);
  return (
    <AbsoluteFill>
      {/* title */}
      <Block at={b(0)} out={b(8)} style={{left: 60, right: 60, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(20,4,10,0.65), transparent 75%)'}} />
        <Eyebrow>Bachata Lady Style</Eyebrow>
        <Words text="ЧТО ВАС" at={b(0) + 2} style={{...sans(150, 800), marginTop: 20}} gold />
        <Words text="ЖДЁТ?" at={b(2)} style={sans(190, 800)} gold />
      </Block>
      {ITEMS.map((it, i) => {
        const at = b(8 + i * 8);
        const out = b(16 + i * 8);
        const ip = ease(f, at + 4, at + 18);
        return (
          <React.Fragment key={i}>
            {it.icon === 'camera' && <Viewfinder on={ease(f, at, at + 8) * (1 - ease(f, out - 6, out))} />}
            <Block at={at} out={i < 4 ? out : 1e9} style={{left: 60, right: 60, bottom: 240}}>
              <Glass style={{padding: '40px 46px 44px'}} glow={0.3 + 0.4 * pulse(f + T.sections.expect.from)}>
                <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
                  <Icon name={it.icon} size={96} p={ip} />
                  <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 30, color: C.rose, letterSpacing: '0.2em'}}>0{i + 1} / 05</div>
                </div>
                <div style={{...sans(it.big.length > 12 ? 70 : 104, 800), ...roseGold, marginTop: 18, textTransform: 'none'}}>{it.big}</div>
                <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 40, lineHeight: 1.3, color: C.ivory, marginTop: 14}}>{it.sub}</div>
              </Glass>
              <div style={{display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24}}>
                {ITEMS.map((_, k) => (
                  <div key={k} style={{width: k === i ? 46 : 12, height: 12, borderRadius: 6, background: k === i ? C.rose : 'rgba(255,255,255,0.35)'}} />
                ))}
              </div>
            </Block>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ================================================================ OUR SONG */
export const Song: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.sections.song.from;
  const b = (i: number) => bf('song', i);
  const audio = useAudioData(staticFile('audio/mix.wav'));
  const bars = audio ? visualizeAudio({fps: 30, frame: abs, audioData: audio, numberOfSamples: 64}) : new Array(64).fill(0);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(10,2,6,0.45)'}} />
      <Block at={b(0)} style={{left: 0, right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        {/* vinyl */}
        <div style={{width: 360, height: 360, borderRadius: '50%', background: 'repeating-radial-gradient(circle, #111 0 3px, #1c1c1c 3px 6px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,140,170,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${f * 4}deg) scale(${snap(f, b(0), 14, 120)})`}}>
          <div style={{width: 130, height: 130, borderRadius: '50%', background: `linear-gradient(135deg, ${C.rose}, #C98E73)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="music" size={70} />
          </div>
        </div>
        <Eyebrow style={{marginTop: 50}}>Наша композиция</Eyebrow>
        <Script text="Lips On You" at={b(2)} size={170} rotate={-3} style={{marginTop: 6}} />
        <Words text="DJ KHALID" at={b(4)} style={sans(56, 700, {letterSpacing: '0.3em'})} />
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, marginTop: 40}}>
          {bars.slice(0, 32).map((v, i) => (
            <div key={i} style={{width: 14, height: Math.max(6, Math.min(140, v * 900 * (1 + i / 10))), borderRadius: 7, background: `linear-gradient(to top, #C98E73, ${C.rose})`}} />
          ))}
        </div>
      </Block>
    </AbsoluteFill>
  );
};

/* ================================================================ SCHEDULE (HyperFrames overlay, transparent) */
export const Schedule: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(10,2,6,0.55), rgba(10,2,6,0.35) 50%, rgba(10,2,6,0.7))'}} />
    <OffthreadVideo src={staticFile('hf/schedule.mov')} transparent muted />
  </AbsoluteFill>
);

/* ================================================================ PRICE */
const Price: React.FC<{at: number; value: number; title: string; sub: string; hero?: boolean}> = ({at, value, title, sub, hero}) => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [at, at + 20], [0, value], {...clamp, easing: Easing.out(Easing.cubic)}));
  const p = snap(f, at, 13, 150);
  return (
    <div style={{opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 80}px) scale(${0.9 + 0.1 * p})`, width: '100%'}}>
      <Glass style={{padding: '34px 40px', border: hero ? '2.5px solid #F2C9B0' : undefined}} glow={hero ? 0.6 : 0.1}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20}}>
          <div style={{...sans(116, 800), ...roseGold, whiteSpace: 'nowrap'}}>{n.toLocaleString('ru-RU').replace(/ /g, ' ')} ₽</div>
          <Icon name={hero ? 'camera' : 'dancer'} size={90} p={ease(f, at + 6, at + 22)} />
        </div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 42, color: C.ivory, marginTop: 8}}>{title}</div>
        <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, color: C.rose, marginTop: 6}}>{sub}</div>
      </Glass>
    </div>
  );
};
export const PriceSection: React.FC = () => {
  const b = (i: number) => bf('price', i);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(10,2,6,0.2) 20%, rgba(10,2,6,0.75) 60%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        <Block at={b(0)} style={{position: 'relative'}}>
          <Eyebrow>Стоимость участия</Eyebrow>
        </Block>
        <Price at={b(2)} value={7000} title="Полный хореокурс" sub="6 часов занятий" />
        <Price at={b(7)} value={9000} title="Хореокурс + видеосъёмка" sub="6 часов занятий и участие в съёмке" hero />
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================ WHY */
export const Why: React.FC = () => {
  const f = useCurrentFrame();
  const b = (i: number) => bf('why', i);
  return (
    <AbsoluteFill>
      <Block at={b(0)} out={b(4)} style={{left: 60, right: 60, bottom: 300, textAlign: 'center'}}>
        <Eyebrow>Почему стоит присоединиться?</Eyebrow>
        <Words text="Танец — это гораздо больше," at={b(0) + 4} style={{...serifItalic(76), marginTop: 22}} />
        <Words text="чем просто движения под музыку" at={b(0) + 12} style={serifItalic(64, {color: C.rose})} />
      </Block>
      <Block at={b(4)} out={b(8)} style={{left: 60, right: 60, bottom: 300, textAlign: 'center'}}>
        {['уверенность в себе', 'красивые эмоции', 'вдохновение'].map((t, i) => (
          <Script key={t} text={t} at={b(4) + i * 5} size={120} rotate={-3} style={{marginTop: i ? -6 : 0}} />
        ))}
      </Block>
      <Viewfinder on={ease(f, b(8), b(8) + 6)} />
      <Block at={b(8)} style={{left: 60, right: 60, bottom: 300, textAlign: 'center'}}>
        <Words text="Выйди перед камерой" at={b(8)} style={serifItalic(78)} />
        <Script text="и почувствуй себя звездой" at={b(8) + 8} size={104} />
      </Block>
      <Sparkles n={30} seed={9} opacity={ease(f, b(8), b(9))} />
    </AbsoluteFill>
  );
};

/* ================================================================ CTA */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const b = (i: number) => bf('cta', i);
  const typed = 'BACHATA'.slice(0, Math.max(0, Math.floor((f - b(5)) / 3)));
  const sent = f >= b(8);
  const sp = snap(f, b(8), 12, 180);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(10,2,6,0.35), rgba(10,2,6,0.15) 40%, rgba(10,2,6,0.8))'}} />
      <Block at={b(0)} out={b(4)} style={{left: 60, right: 60, bottom: 320, textAlign: 'center'}}>
        <Words text="НЕ ОТКЛАДЫВАЙ" at={b(0)} style={sans(104, 800)} gold />
        <Words text="своё желание танцевать!" at={b(0) + 8} style={{...serifItalic(78), marginTop: 10}} />
      </Block>
      <Block at={b(4)} style={{left: 60, right: 60, bottom: 230}}>
        <div style={{textAlign: 'center', ...serifItalic(58)}}>Напиши нам в личные сообщения слово</div>
        <div style={{textAlign: 'center', ...sans(150, 800), ...roseGold, marginTop: 6, transform: `scale(${1 + 0.05 * pulse(f + T.sections.cta.from)})`}}>«BACHATA»</div>
        {/* DM mock-up */}
        <Glass style={{marginTop: 30, padding: '24px 28px'}}>
          {sent && (
            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 18}}>
              <div style={{opacity: sp, transform: `translateY(${(1 - sp) * 30}px) scale(${0.8 + 0.2 * sp})`, transformOrigin: '100% 100%', background: `linear-gradient(135deg, ${C.red}, #B0124A)`, borderRadius: '30px 30px 6px 30px', padding: '18px 34px', fontFamily: SANS, fontWeight: 700, fontSize: 46, color: '#fff'}}>
                BACHATA
              </div>
            </div>
          )}
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{flex: 1, height: 84, borderRadius: 42, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', padding: '0 30px', fontFamily: SANS, fontWeight: 500, fontSize: 40, color: sent ? 'rgba(255,255,255,0.4)' : '#fff'}}>
              {sent ? 'Сообщение…' : typed}
              {!sent && <span style={{opacity: f % 16 < 8 ? 1 : 0, marginLeft: 4}}>|</span>}
            </div>
            <div style={{width: 84, height: 84, borderRadius: '50%', background: `linear-gradient(135deg, ${C.rose}, #C98E73)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${f >= b(8) - 2 && f < b(8) + 4 ? 0.85 : 1})`}}>
              <svg width={44} height={44} viewBox="0 0 24 24">
                <path d="M3 11.5 21 3l-8.5 18-2-7.5z" fill="#2a0612" />
              </svg>
            </div>
          </div>
        </Glass>
      </Block>
    </AbsoluteFill>
  );
};

/* ================================================================ OUTRO */
export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const b = (i: number) => bf('outro', i);
  const end = T.total - T.sections.outro.from;
  const out = ease(f, end - 24, end);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 60% at 50% 60%, rgba(10,2,6,0.25), rgba(10,2,6,0.75))'}} />
      <Block at={b(0)} out={b(6)} style={{left: 40, right: 40, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <Script text="Твой танец." at={b(0)} size={170} rotate={-5} />
        <Script text="Твоя энергия." at={b(2)} size={170} rotate={-5} color={C.rose} />
      </Block>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: ease(f, b(6), b(6) + 4)}}>
        {f >= b(6) - 2 && <Lockup at={b(6)} scale={0.95} />}
        <Rule at={b(8)} width={520} style={{marginTop: 24}} />
        <Block at={b(8)} style={{position: 'relative', marginTop: 20, textAlign: 'center'}}>
          <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 36, color: C.ivory, letterSpacing: '0.06em'}}>
            Напиши <span style={{fontWeight: 800, color: C.rose}}>«BACHATA»</span> в личные сообщения
          </div>
        </Block>
      </div>
      <Sparkles n={34} seed={21} opacity={0.8} />
      <AbsoluteFill style={{background: '#000', opacity: out}} />
    </AbsoluteFill>
  );
};

export const _s = SCRIPT;
