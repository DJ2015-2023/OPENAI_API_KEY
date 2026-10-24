import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Bats, Embers, Fog, Lightning, Moon, Sky, Web} from '../components/FX';
import {Pumpkin3D} from '../components/Pumpkin3D';
import {Eyes, Mask, MoonGlyph} from '../components/Shapes';
import {C, COND, DISPLAY, HORROR, SERIF, T, clamp, ease, kick, rand, snap, wf} from '../theme';
import {Rise, Slam} from './Part1';

/* ================= VIBES: four tarot cards turned over one by one ================= */
const CARDS: {n: string; icon: string; title: string; sub: string; word: number; col: string}[] = [
  {n: 'I', icon: '🔥', title: 'Самые горячие танцы', sub: 'HOT DANCE', word: 0, col: C.pumpkin},
  {n: 'II', icon: '🖤', title: 'Атмосфера тайн и соблазна', sub: 'MYSTERY', word: 3, col: '#B07CFF'},
  {n: 'III', icon: '🎭', title: 'Эффектные образы и безумная энергия', sub: 'ENERGY', word: 7, col: C.gold},
  {n: 'IV', icon: '❤️‍🔥', title: 'Bachata, Latin vibes и незабываемые эмоции', sub: 'LATIN VIBES', word: 12, col: C.blood},
];
const CW = 450;
const CH = 690;
const Tarot: React.FC<{i: number; flip: number; deal: number; active: number; glow: number}> = ({i, flip, deal, active, glow}) => {
  const c = CARDS[i];
  const face: React.CSSProperties = {position: 'absolute', inset: 0, borderRadius: 26, backfaceVisibility: 'hidden', overflow: 'hidden'};
  return (
    <div style={{width: CW, height: CH, perspective: 1600, opacity: deal, transform: `translateY(${(1 - deal) * 900}px) rotate(${(1 - deal) * (i % 2 ? 25 : -25)}deg) scale(${1 + active * 0.04})`}}>
      <div style={{position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${180 - flip * 180}deg)`}}>
        {/* front */}
        <div
          style={{
            ...face,
            background: `linear-gradient(160deg, #1d0b26 0%, #0b0410 70%)`,
            border: `3px solid ${C.gold}`,
            boxShadow: `0 0 ${20 + 50 * glow}px ${c.col}${glow > 0.3 ? 'cc' : '55'}, inset 0 0 0 10px #0b0410, inset 0 0 0 12px ${C.gold}88`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 34px',
          }}
        >
          <div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 48, color: C.gold}}>{c.n}</div>
          <div style={{fontSize: 150, marginTop: 30, filter: `drop-shadow(0 0 30px ${c.col})`}}>{c.icon}</div>
          <div style={{flex: 1}} />
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, lineHeight: 1.12, color: C.bone, textAlign: 'center', textTransform: 'uppercase'}}>{c.title}</div>
          <div style={{marginTop: 24, fontFamily: COND, fontWeight: 500, fontSize: 28, letterSpacing: '0.4em', color: c.col}}>{c.sub}</div>
        </div>
        {/* back */}
        <div style={{...face, transform: 'rotateY(180deg)', background: `repeating-linear-gradient(45deg, #2a0d3a 0 14px, #1c0828 14px 28px)`, border: `3px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 12px #14061c, inset 0 0 0 14px #E8C27A88'}}>
          <MoonGlyph size={260} />
        </div>
      </div>
    </div>
  );
};
export const Vibes: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.vibes.from;
  const w = (i: number) => wf('s06', i, 'vibes');
  const k = kick(abs);
  const flips = CARDS.map((c) => ease(f, w(c.word) - 6, w(c.word) + 8, 0, 1, Easing.inOut(Easing.cubic)));
  const activeIdx = CARDS.reduce((a, c, i) => (f >= w(c.word) - 6 ? i : a), -1);
  return (
    <AbsoluteFill>
      <Sky top="#06020a" bottom="#1d0820" glow="rgba(176,124,255,0.18)" glowY={50} />
      <Fog opacity={0.3} speed={1.2} tint="rgba(150,90,200,1)" />
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 58, color: C.gold, opacity: ease(f, 4, 16)}}>
        ✦ Halloween Edition ✦
      </div>
      <div style={{position: 'absolute', top: 250, left: 50, right: 50, display: 'grid', gridTemplateColumns: `${CW}px ${CW}px`, gap: '40px 80px', justifyContent: 'center'}}>
        {CARDS.map((c, i) => (
          <Tarot key={i} i={i} flip={flips[i]} deal={snap(f, 2 + i * 4, 15, 120)} active={i === activeIdx ? 1 : 0} glow={i === activeIdx ? 0.6 + 0.4 * k : 0.15 + 0.2 * k} />
        ))}
      </div>
      <Embers n={30} seed={21} color={C.gold} opacity={0.7} size={0.8} />
    </AbsoluteFill>
  );
};

/* ================= COME: with friends / your other half / alone … then the eyes in the dark ================= */
export const Come: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.come.from;
  const w = (i: number) => wf('s07', i, 'come');
  const dark = ease(f, w(9) - 10, w(9) + 4);
  const opts: [string, string, number][] = [
    ['👯', 'с друзьями', 1],
    ['💞', 'со второй половинкой', 3],
    ['🕯️', 'или в одиночку', 6],
  ];
  const beat = ((f - w(9)) % 25) / 25;
  const heart = f > w(9) ? Math.exp(-beat * 9) + 0.6 * Math.exp(-Math.max(0, beat - 0.3) * 12) * (beat > 0.3 ? 1 : 0) : 0;
  const drop = T.drops[2] - T.scenes.come.from;
  const boom = f >= drop ? Math.exp(-(f - drop) / 8) : 0;
  const k = f >= drop ? kick(abs) : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: 1 - dark}}>
        <Sky top="#0b0310" bottom="#3a0a1e" glow="rgba(255,45,85,0.25)" glowY={70} />
        <Fog opacity={0.35} tint="rgba(255,90,120,1)" />
        <div style={{position: 'absolute', top: 300, left: 70, right: 70}}>
          <Slam at={w(0) - 2} from={1.6}>
            <div style={{fontFamily: HORROR, fontSize: 150, color: C.neon, textShadow: `0 0 40px ${C.neon}88`, textAlign: 'center'}}>ПРИХОДИ</div>
          </Slam>
          <div style={{marginTop: 70, display: 'flex', flexDirection: 'column', gap: 46}}>
            {opts.map(([ic, t, wi], i) => {
              const p = snap(f, w(wi) - 3, 13, 180);
              return (
                <div key={t} style={{display: 'flex', alignItems: 'center', gap: 34, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -500}px)`}}>
                  <div style={{width: 150, height: 150, borderRadius: '50%', border: `3px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 84, background: 'rgba(20,5,20,0.7)', boxShadow: `0 0 30px ${C.neon}55`}}>{ic}</div>
                  <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: i === 1 ? 70 : 82, color: C.bone, lineHeight: 1.0, flex: 1}}>{t}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      {/* darkness: eyes + heartbeat */}
      <AbsoluteFill style={{opacity: dark}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 55% at 50% 50%, rgba(140,0,24,${0.15 + 0.35 * heart + 0.4 * boom}), transparent 70%)`}} />
        <div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${1 + 0.05 * heart})`}}>
          <Eyes open={ease(f, w(9), w(9) + 8) * (f % 90 > 86 ? 0.15 : 1)} size={560} look={Math.sin(f / 20)} />
        </div>
        <div style={{position: 'absolute', top: 700, left: 70, right: 70, textAlign: 'center'}}>
          <Rise at={w(9) - 2}>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 70, color: C.smoke, lineHeight: 1.15}}>возможно, именно</div>
          </Rise>
          <Rise at={w(11) - 2}>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: C.bone, lineHeight: 1.15}}>этой ночью</div>
          </Rise>
          <Rise at={w(13) - 2} style={{marginTop: 30}}>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 70, color: C.bone, lineHeight: 1.15}}>ты встретишь</div>
          </Rise>
          <Slam at={w(15) - 2} from={1.5}>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 86, color: C.blood, lineHeight: 1.1, textShadow: `0 0 ${30 + 40 * k}px ${C.blood}`}}>кого-то особенного…</div>
          </Slam>
        </div>
        <div style={{position: 'absolute', top: 1380, left: 0, right: 0, textAlign: 'center', fontSize: 190, transform: `scale(${0.9 + 0.15 * heart + 0.3 * boom})`, opacity: ease(f, w(13), w(14)), filter: `drop-shadow(0 0 ${40 + 60 * boom}px ${C.blood})`}}>❤️</div>
        <Embers n={40} seed={33} color={C.blood} opacity={ease(f, drop, drop + 10)} speed={2} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================= INFO: HyperFrames invitation card (rendered separately, see hyperframes/info) ================= */
export const Info: React.FC = () => (
  <AbsoluteFill style={{background: C.night}}>
    <OffthreadVideo src={staticFile('hf/info.mp4')} muted />
  </AbsoluteFill>
);

/* ================= BOOK: the ticket tears, stamp, masks ================= */
export const Book: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.book.from;
  const w = (i: number) => wf('s09', i, 'book');
  const tear = ease(f, w(0), w(0) + 10, 0, 1, Easing.out(Easing.back(2)));
  const stamp = f >= w(2) ? interpolate(f, [w(2), w(2) + 5], [2.4, 1], {...clamp, easing: Easing.in(Easing.quad)}) : 0;
  const masks = ease(f, w(4) - 6, w(4) + 14);
  const k = kick(abs);
  return (
    <AbsoluteFill>
      <Sky top="#070309" bottom="#2a0b12" glow="rgba(232,194,122,0.15)" glowY={40} />
      <Fog opacity={0.3} speed={1.5} />
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}>
        <Slam at={w(0) - 2} from={1.7}>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 110, color: C.bone, lineHeight: 1}}>БРОНИРУЙ</div>
        </Slam>
        <Rise at={w(1) - 2}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 76, color: C.gold}}>место заранее</div>
        </Rise>
      </div>
      {/* ticket */}
      <div style={{position: 'absolute', top: 470, left: 90, width: 900, height: 360, transform: `rotate(-4deg) scale(${snap(f, 0, 14, 120)})`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 650, height: 360, background: `linear-gradient(135deg, ${C.crimson}, #3a000c)`, borderRadius: '24px 0 0 24px', border: `3px solid ${C.gold}`, borderRight: 'none', padding: '36px 44px'}}>
          <div style={{fontFamily: COND, fontWeight: 500, fontSize: 30, letterSpacing: '0.4em', color: C.gold}}>ADMIT ONE</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 62, lineHeight: 1.0, color: C.bone, marginTop: 18}}>LATIN FUSION</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 62, lineHeight: 1.0, color: C.bone}}>PARTY</div>
          <div style={{fontFamily: HORROR, fontSize: 46, color: C.pumpkin, marginTop: 14}}>HALLOWEEN EDITION</div>
        </div>
        <div style={{position: 'absolute', left: 650, top: 0, width: 250, height: 360, background: `linear-gradient(135deg, #5a0014, #22000a)`, borderRadius: '0 24px 24px 0', border: `3px solid ${C.gold}`, borderLeft: `4px dashed ${C.gold}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transformOrigin: '0% 100%', transform: `translate(${tear * 70}px, ${tear * 140}px) rotate(${tear * 24}deg)`}}>
          <div style={{fontSize: 90}}>🎟️</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.bone}}>31.10</div>
          <div style={{fontFamily: COND, fontSize: 30, color: C.gold, letterSpacing: '0.2em'}}>23:30</div>
        </div>
        {stamp > 0 && (
          <div style={{position: 'absolute', left: 640, top: 250, transform: `rotate(-14deg) scale(${stamp})`, opacity: Math.min(1, 3.4 - stamp), border: `8px solid ${C.blood}`, borderRadius: 18, padding: '8px 22px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, whiteSpace: 'nowrap', color: C.blood, background: 'rgba(255,240,240,0.08)', mixBlendMode: 'screen'}}>
            31 ОКТЯБРЯ
          </div>
        )}
      </div>
      {/* masks */}
      <div style={{position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center'}}>
        <Rise at={w(4) - 2}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 66, color: C.bone}}>и готовь свой самый</div>
        </Rise>
        <Slam at={w(7) - 2} from={1.6}>
          <div style={{fontFamily: HORROR, fontSize: 118, color: '#B07CFF', lineHeight: 1.1, textShadow: '0 0 40px rgba(176,124,255,0.6)'}}>ЗАГАДОЧНЫЙ</div>
          <div style={{fontFamily: HORROR, fontSize: 118, color: '#B07CFF', lineHeight: 1.0, textShadow: '0 0 40px rgba(176,124,255,0.6)'}}>ОБРАЗ</div>
        </Slam>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: [40, 640, 330][i], top: [1580, 1560, 1700][i] + Math.sin(f / 14 + i) * 16, opacity: masks, transform: `rotate(${[-14, 12, -3][i] + Math.sin(f / 20 + i) * 4}deg) scale(${masks * (1 + 0.05 * k)})`}}>
          <Mask size={[380, 400, 420][i]} color={[C.blood, '#6b2bb0', C.gold][i]} trim={[C.gold, C.gold, '#3a1a00'][i]} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ================= FINALE: drop 4 — "dangerously attractive" ================= */
export const Finale: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.finale.from;
  const w = (i: number) => wf('s10', i, 'finale');
  const k = kick(abs);
  return (
    <AbsoluteFill style={{transform: `scale(${1 + 0.015 * k})`}}>
      <Sky top="#040106" bottom="#3a0508" glow={`rgba(224,16,47,${0.25 + 0.2 * k})`} glowY={75} />
      <Moon size={340} x={820} y={250} glow={0.9} tint="rgba(220,40,40,0.55)" />
      <Fog opacity={0.45} speed={2.4} tint="rgba(255,60,60,1)" />
      <Lightning at={w(7) - 2} seed={77} x={220} len={800} />
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center'}}>
        {['LATIN', 'FUSION', 'PARTY'].map((t, i) => (
          <Slam key={t} at={w(i) - 2} from={1.8}>
            <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 120, lineHeight: 1.02, color: i === 1 ? C.pumpkin : C.bone}}>{t}</div>
          </Slam>
        ))}
        <div style={{marginTop: 60}}>
          <Rise at={w(3) - 2}>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 72, color: C.bone}}>Этой ночью танцы будут…</div>
          </Rise>
          <Slam at={w(7) - 2} from={2.2}>
            <div style={{fontFamily: HORROR, fontSize: 132, color: C.blood, lineHeight: 1.05, marginTop: 20, textShadow: `0 0 ${30 + 40 * k}px rgba(224,16,47,0.7)`}}>ОПАСНО</div>
          </Slam>
          <Rise at={w(8) - 2}>
            <div style={{fontFamily: HORROR, fontSize: 76, color: C.blood, lineHeight: 1.05, textShadow: `0 0 ${30 + 40 * k}px rgba(224,16,47,0.7)`}}>ПРИТЯГАТЕЛЬНЫМИ</div>
          </Rise>
        </div>
      </div>
      <Pumpkin3D size={760} appear={snap(f, 4, 13, 100)} turn={Math.sin(f / 30) * 0.3} glow={0.6 + 0.7 * k} style={{left: 160, top: 1180}} />
      <Embers n={60} seed={44} color={C.pumpkin} speed={2} />
    </AbsoluteFill>
  );
};

/* ================= END: lockup + details + Telegram QR ================= */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.end.from;
  const k = kick(abs);
  const row = (at: number) => ({opacity: ease(f, at, at + 10), transform: `translateY(${(1 - ease(f, at, at + 10)) * 30}px)`});
  const out = ease(f, T.scenes.end.dur - 40, T.scenes.end.dur);
  return (
    <AbsoluteFill>
      <Sky top="#050208" bottom="#200712" glow={`rgba(255,106,0,${0.18 + 0.1 * k})`} glowY={30} />
      <Moon size={300} x={540} y={250} glow={1} />
      <Web p={ease(f, 0, 60)} size={360} style={{left: -20, top: -20}} />
      <Web p={ease(f, 10, 70)} size={360} style={{right: -20, top: -20, transform: 'scaleX(-1)'}} />
      <Fog opacity={0.35} speed={1.2} />
      <Bats start={20} dur={110} y={420} seed={51} n={8} scale={0.8} />
      <div style={{position: 'absolute', top: 440, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 112, lineHeight: 1.0, color: C.bone, ...row(0)}}>LATIN FUSION</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 112, lineHeight: 1.0, color: C.bone, ...row(3)}}>PARTY</div>
        <div style={{fontFamily: HORROR, fontSize: 80, color: C.pumpkin, marginTop: 10, textShadow: '0 0 30px rgba(255,106,0,0.6)', ...row(6)}}>HALLOWEEN EDITION</div>
      </div>
      <div style={{position: 'absolute', top: 830, left: 100, right: 100, display: 'flex', flexDirection: 'column', gap: 22}}>
        {[
          ['📅', '31 ОКТЯБРЯ | СУББОТА'],
          ['⏰', '23:30 – 05:00'],
          ['📍', 'TEMPLE BAR | м. Курская'],
        ].map(([ic, t], i) => (
          <div key={t} style={{display: 'flex', alignItems: 'center', gap: 26, borderBottom: `2px solid ${C.gold}44`, paddingBottom: 18, ...row(12 + i * 5)}}>
            <span style={{fontSize: 54}}>{ic}</span>
            <span style={{fontFamily: COND, fontWeight: 700, fontSize: 56, color: C.bone, letterSpacing: '0.04em'}}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 1250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', ...row(30)}}>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 54, color: C.gold}}>👉 Подробности и видео:</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 40, marginTop: 30}}>
          <div style={{padding: 12, background: C.bone, borderRadius: 20, boxShadow: `0 0 ${30 + 30 * k}px rgba(255,106,0,0.5)`}}>
            <Img src={staticFile('img/qr.svg')} style={{width: 250, height: 250, display: 'block'}} />
          </div>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <svg width={64} height={64} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#29A9EB" />
                <path d="M5.5 11.7l11.6-4.5c.5-.2 1 .1.8.9l-2 9.3c-.1.6-.5.8-1 .5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5c.2-.2 0-.3-.4-.1l-6.9 4.3-3-.9c-.6-.2-.7-.6.1-.9z" fill="#fff" />
              </svg>
              <span style={{fontFamily: COND, fontWeight: 700, fontSize: 46, color: C.bone}}>Telegram</span>
            </div>
            <div style={{fontFamily: COND, fontWeight: 500, fontSize: 44, color: '#7fd0ff', marginTop: 10}}>t.me/MSDE_BACHATA</div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontSize: 64, ...row(40)}}>🔥🎃</div>
      <Embers n={40} seed={61} color={C.pumpkin} opacity={0.8} />
      <AbsoluteFill style={{background: '#000', opacity: out}} />
    </AbsoluteFill>
  );
};

export const _r = rand;
export const _c = clamp;
