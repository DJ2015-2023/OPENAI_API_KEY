import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Bats, Embers, Fog, Glitchy, Lightning, Moon, Neon, Sky, Web} from '../components/FX';
import {Pumpkin3D} from '../components/Pumpkin3D';
import {House, Skyline} from '../components/Shapes';
import {C, COND, DISPLAY, H, HORROR, SERIF, T, W, clamp, ease, kick, rand, shake, snap, wf} from '../theme';

/** Word reveal that rises out of a blur. */
export const Rise: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number}> = ({at, children, style, dist = 60}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 12);
  return <div style={{opacity: p, transform: `translateY(${(1 - p) * dist}px)`, filter: `blur(${(1 - p) * 12}px)`, ...style}}>{children}</div>;
};
/** Hard slam-in (scale down onto the screen). */
export const Slam: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number}> = ({at, children, style, from = 2.2}) => {
  const f = useCurrentFrame();
  if (f < at) return <div style={{opacity: 0, ...style}}>{children}</div>;
  const s = interpolate(f, [at, at + 5], [from, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const o = ease(f, at, at + 3);
  return <div style={{opacity: o, transform: `scale(${s})`, ...style}}>{children}</div>;
};
/** Text revealed top-down like paint dripping. */
const Drip: React.FC<{at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, dur = 18, children, style}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + dur, 0, 1, Easing.inOut(Easing.quad));
  return <div style={{clipPath: `inset(0 0 ${(1 - p) * 100}% 0)`, ...style}}>{children}</div>;
};

/* ================= HOOK: haunted house, lightning, the lights go out ================= */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s01', i, 'hook');
  const reveal = ease(f, 4, 30);
  const off = (k: number) => 1 - ease(f, w(6) + k * 2, w(6) + k * 2 + 3);
  const flick = 0.85 + 0.15 * Math.sin(f * 0.9 + 1) * Math.sin(f * 0.37);
  const lights = [0, 1, 2, 3, 4, 5].map((k) => off([3, 1, 4, 0, 5, 2][k]) * flick);
  const push = interpolate(f, [0, 180], [1.0, 1.12]);
  const th = f > w(6) && f < w(6) + 12 ? shake(f, 10) : {x: 0, y: 0};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: reveal, transform: `scale(${push}) translate(${th.x}px, ${th.y}px)`}}>
        <Sky top="#05020A" bottom="#24102F" glow="rgba(120,80,200,0.25)" glowY={22} />
        <Moon size={430} x={770} y={420} glow={1 - 0.4 * ease(f, w(6), w(6) + 10)} />
        <Fog opacity={0.45} top={200} height={900} />
        <Bats start={w(3)} dur={80} y={520} seed={4} />
        <House lights={lights} />
        <Fog opacity={0.55} top={1250} height={700} speed={1.4} tint="rgba(120,90,170,1)" />
      </AbsoluteFill>
      <Lightning at={5} seed={7} x={260} />
      <Lightning at={w(6) - 3} seed={19} x={820} len={900} />
      <div style={{position: 'absolute', top: 210, left: 60, right: 60, textAlign: 'center'}}>
        <Rise at={w(0) - 4}>
          <div style={{fontFamily: DISPLAY, fontSize: 46, letterSpacing: '0.5em', color: C.bone, marginRight: '-0.5em'}}>ЭТОТ</div>
        </Rise>
        <Drip at={w(1) - 3} style={{marginTop: 8}}>
          <div style={{fontFamily: HORROR, fontSize: 132, lineHeight: 1.05, color: C.blood, textShadow: `0 0 40px rgba(224,16,47,0.55)`}}>ХЭЛЛОУИН</div>
        </Drip>
        <Rise at={w(2) - 3} style={{marginTop: 26}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 76, color: C.bone}}>ты не захочешь</div>
        </Rise>
        <Rise at={w(5) - 3}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 76, color: C.bone}}>
            провести <span style={{fontFamily: HORROR, fontStyle: 'normal', color: C.pumpkin, fontSize: 92}}>дома…</span>
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

/* ================= NIGHT: three slams over a rising blood moon ================= */
const LINES: [string, string, number, string][] = [
  ['ОДНА', 'НОЧЬ.', 0, C.bone],
  ['ОДНА', 'АТМОСФЕРА.', 2, C.ember],
  ['ТЫСЯЧИ', 'ЭМОЦИЙ.', 4, C.blood],
];
export const Night: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s02', i, 'night');
  const moonY = interpolate(f, [0, 140], [1500, 900], {...clamp, easing: Easing.out(Easing.quad)});
  const blood = ease(f, w(4) - 4, w(4) + 10);
  const hits = [w(1), w(3), w(5)];
  const lastHit = Math.max(...hits.filter((h) => h <= f), -100);
  const sh = f - lastHit < 8 ? shake(f, 14 * (1 - (f - lastHit) / 8)) : {x: 0, y: 0};
  return (
    <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
      <Sky top="#030104" bottom={blood > 0.5 ? '#2a0008' : '#140818'} />
      <Moon size={860} x={540} y={moonY} glow={0.8} tint={`rgb(255,${Math.round(150 - 120 * blood)},${Math.round(90 - 70 * blood)})`} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.4))'}} />
      <Fog opacity={0.3 + 0.15 * ease(f, w(2), w(3) + 10)} speed={2} tint={blood > 0.5 ? 'rgba(255,60,60,1)' : 'rgba(150,110,200,1)'} />
      <Embers n={50} seed={2} color={blood > 0.5 ? C.blood : C.ember} opacity={ease(f, w(4), w(5))} speed={2} />
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        {LINES.map(([a, b, wi, col], k) => {
          const active = k === LINES.length - 1 || f < w(LINES[k + 1][2]) - 2;
          return (
            <div key={k} style={{textAlign: 'center', opacity: active ? 1 : 0.45, transition: 'none'}}>
              <Slam at={w(wi) - 2} from={1.8}>
                <div style={{fontFamily: COND, fontWeight: 500, fontSize: 64, letterSpacing: '0.35em', color: C.smoke, marginRight: '-0.35em'}}>{a}</div>
              </Slam>
              <Slam at={w(wi + 1) - 2}>
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: b.length > 7 ? 104 : 150, lineHeight: 1.05, color: col, textShadow: `0 0 50px ${col}66`}}>{b}</div>
              </Slam>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ================= CITY: "31 октября" + midnight bell + the city sinks into the night ================= */
export const City: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s03', i, 'city');
  const bell = f - w(0);
  const sink = ease(f, w(4) - 4, w(7) + 20, 0, 1, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <Sky top="#06030A" bottom="#2C1238" glow="rgba(255,106,0,0.18)" glowY={35} />
      <Moon size={260} x={190} y={260} glow={0.8} />
      <Web p={ease(f, 0, 70) * 1} size={460} style={{right: -20, top: -20, transform: 'scaleX(-1)'}} />
      {/* bell rings */}
      {[0, 1, 2].map((k) => {
        const t = bell - k * 10;
        if (t < 0 || t > 60) return null;
        const r = 200 + t * 12;
        return <div key={k} style={{position: 'absolute', left: 540 - r, top: 640 - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `4px solid rgba(255,106,0,${0.6 * (1 - t / 60)})`}} />;
      })}
      <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center'}}>
        <Slam at={w(0) - 2} from={3}>
          <div style={{fontFamily: HORROR, fontSize: 420, lineHeight: 0.9, color: C.pumpkin, textShadow: `0 0 60px rgba(255,106,0,0.6), 0 0 140px rgba(255,60,0,0.35)`}}>31</div>
        </Slam>
        <Rise at={w(2) - 3}>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, letterSpacing: '0.12em', color: C.bone, marginTop: 10}}>ОКТЯБРЯ</div>
        </Rise>
        <div style={{marginTop: 70}}>
          <Rise at={w(3) - 3}>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 72, color: C.bone, lineHeight: 1.1}}>город погрузится</div>
          </Rise>
          <Rise at={w(5) - 3}>
            <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: C.ember, lineHeight: 1.1}}>в магию ночи…</div>
          </Rise>
        </div>
      </div>
      <Bats start={w(3)} dur={70} fromLeft={false} y={300} seed={11} n={7} />
      <Skyline lights={1 - sink * 0.7} style={{top: 1080 + sink * 260}} />
      <Fog opacity={0.35 + sink * 0.5} top={1100 - sink * 300} height={900} speed={1.6} tint="rgba(140,90,190,1)" />
    </AbsoluteFill>
  );
};

/* ================= FORGET: "ordinary parties" crossed out, build-up to the drop ================= */
export const Forget: React.FC = () => {
  const f = useCurrentFrame();
  const w = (i: number) => wf('s04', i, 'forget');
  const dur = T.scenes.forget.dur - 10;
  const strike = ease(f, w(3) + 2, w(3) + 10);
  const build = ease(f, w(3), dur, 0, 1, Easing.in(Easing.quad));
  const sh = shake(f, 3 + build * 16, 5);
  const g = Math.max(build, f > w(0) && f < w(0) + 6 ? 1 : 0);
  return (
    <AbsoluteFill style={{background: '#0b0a0c'}}>
      <AbsoluteFill style={{transform: `scale(${1 + build * 0.25}) translate(${sh.x}px, ${sh.y}px)`}}>
        {/* a dull, desaturated "ordinary party" */}
        <AbsoluteFill style={{filter: 'grayscale(1) contrast(0.8)', opacity: 0.55 - build * 0.3}}>
          <div style={{position: 'absolute', top: 1050, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 50, fontSize: 150}}>
            <span style={{transform: `rotate(${Math.sin(f / 9) * 6}deg)`}}>🎈</span>
            <span>🥤</span>
            <span style={{transform: `rotate(${Math.sin(f / 7) * -6}deg)`}}>🎉</span>
          </div>
        </AbsoluteFill>
        <div style={{position: 'absolute', top: 470, left: 60, right: 60, textAlign: 'center'}}>
          <Slam at={w(0) - 2}>
            <Glitchy amount={g} seed={3}>
              <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, color: C.blood, lineHeight: 1}}>ЗАБУДЬ</div>
            </Glitchy>
          </Slam>
          <Rise at={w(1) - 3} style={{marginTop: 40, position: 'relative'}}>
            <div style={{fontFamily: COND, fontWeight: 500, fontSize: 96, color: '#8c8890', lineHeight: 1.05, textTransform: 'uppercase'}}>
              об обычных
              <br />
              вечеринках
            </div>
            <div style={{position: 'absolute', left: '4%', top: '48%', height: 16, width: `${strike * 92}%`, background: C.blood, transform: 'rotate(-6deg)', boxShadow: `0 0 20px ${C.blood}`}} />
          </Rise>
        </div>
      </AbsoluteFill>
      {/* everything collapses into darkness right before the drop */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 0%, #000 70%)', opacity: build}} />
    </AbsoluteFill>
  );
};

/* ================= TEMPLE: the drop — neon Temple Bar, passion / music / magic ================= */
const Beams: React.FC<{abs: number; tint: string}> = ({abs, tint}) => {
  const k = kick(abs);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.55 + 0.35 * k}}>
      {[0, 1, 2].map((i) => {
        const a = Math.sin(abs / (24 + i * 7) + i * 2) * 28 + (i - 1) * 22;
        return (
          <div
            key={i}
            style={{position: 'absolute', left: 540 - 700, top: -200, width: 1400, height: 2400, transformOrigin: '50% 0%', transform: `rotate(${a}deg)`, background: `conic-gradient(from 174deg at 50% 0%, transparent 0deg, ${tint} 6deg, transparent 12deg)`, filter: 'blur(6px)'}}
          />
        );
      })}
    </AbsoluteFill>
  );
};
const Brick: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: '#1a0508',
      backgroundImage:
        'linear-gradient(rgba(0,0,0,0.65) 6px, transparent 6px), linear-gradient(90deg, rgba(0,0,0,0.65) 6px, transparent 6px), linear-gradient(90deg, rgba(0,0,0,0.65) 6px, transparent 6px)',
      backgroundSize: '160px 70px, 160px 140px, 160px 140px',
      backgroundPosition: '0 0, 0 0, 80px 70px',
    }}
  />
);
export const Temple: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.temple.from;
  const w = (i: number) => wf('s04', i, 'temple');
  const k = kick(abs);
  const words: [string, number, string][] = [
    ['СТРАСТЬ', 14, C.blood],
    ['МУЗЫКА', 15, C.ember],
    ['МАГИЯ', 18, '#B07CFF'],
  ];
  const zoomIn = interpolate(f, [0, 8], [1.25, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: `scale(${zoomIn * (1 + k * 0.012)})`}}>
      <Brick />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 45% at 50% 25%, rgba(255,45,85,${0.25 + 0.15 * k}), transparent 70%)`}} />
      <Beams abs={abs} tint="rgba(255,60,90,0.55)" />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7) 65%, #000)'}} />
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}>
        <Slam at={0} from={1.6}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: C.bone}}>в эту ночь</div>
        </Slam>
        <div style={{marginTop: 40, display: 'inline-block', padding: '34px 44px', border: `6px solid ${f >= w(7) - 2 ? '#FF6F8E' : '#3a1520'}`, borderRadius: 30, boxShadow: f >= w(7) - 2 ? `0 0 40px ${C.neon}, inset 0 0 40px ${C.neon}88` : 'none'}}>
          <Neon on={1} size={128} flickerAt={w(7) - 2} font={DISPLAY}>
            TEMPLE
          </Neon>
          <div style={{height: 14}} />
          <Neon on={1} size={128} flickerAt={w(8) - 1} font={DISPLAY} color="#FF7A1A">
            BAR
          </Neon>
        </div>
        <Rise at={w(9) - 3} style={{marginTop: 46}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 68, color: C.bone, lineHeight: 1.15, padding: '0 90px'}}>превратится в место, где встречаются</div>
        </Rise>
      </div>
      <div style={{position: 'absolute', top: 1130, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
        {words.map(([t, i, col]) => {
          const p = snap(f, w(i) - 2, 12, 220);
          return (
            <div key={t} style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 112, lineHeight: 1.08, color: col, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300)}px) skewX(${(1 - p) * -20}deg)`, textShadow: `0 0 ${30 + k * 30}px ${col}99`}}>
              {t}
            </div>
          );
        })}
      </div>
      <Rise at={w(19) - 3} style={{position: 'absolute', bottom: 120, left: 40, right: 40, textAlign: 'center'}}>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: C.gold, lineHeight: 1.1}}>
          латиноамериканских
          <br />
          <span style={{fontSize: 96}}>танцев</span>
        </div>
      </Rise>
      <Embers n={45} seed={8} color={C.pumpkin} opacity={ease(f, w(19) - 6, w(19) + 6)} speed={2.2} />
    </AbsoluteFill>
  );
};

/* ================= TITLE: 3D jack-o'-lantern + party lockup ================= */
export const Title: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + T.scenes.title.from;
  const w = (i: number) => wf('s05', i, 'title');
  const k = kick(abs);
  const appear = snap(f, 0, 12, 90);
  const words = ['LATIN', 'FUSION', 'PARTY'];
  return (
    <AbsoluteFill>
      <Sky top="#050208" bottom="#2a0a05" glow={`rgba(255,106,0,${0.3 + 0.2 * k})`} glowY={62} />
      <Fog opacity={0.4} speed={2} tint="rgba(255,120,60,1)" />
      <Lightning at={w(3) - 2} seed={41} x={760} len={700} />
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}>
        {words.map((t, i) => {
          const p = snap(f, w(i) - 3, 11, 240);
          return (
            <div key={t} style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 1.0, color: C.bone, opacity: Math.min(1, p * 2), transform: `scale(${2 - p})`, letterSpacing: '-0.02em', textShadow: `0 0 ${20 + 30 * k}px rgba(255,106,0,0.6)`}}>
              {t}
            </div>
          );
        })}
      </div>
      <Pumpkin3D size={980} appear={appear} turn={interpolate(f, [0, 30], [-1.2, 0], {...clamp, easing: Easing.out(Easing.cubic)})} glow={0.6 + 0.6 * k} style={{left: 50, top: 720}} />
      <Drip at={w(3) - 2} dur={14} style={{position: 'absolute', top: 690, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontFamily: HORROR, fontSize: 112, lineHeight: 1.05, color: C.pumpkin, textShadow: '0 6px 0 #4a0f00, 0 0 40px rgba(255,90,0,0.6)'}}>HALLOWEEN</div>
        <div style={{fontFamily: HORROR, fontSize: 96, lineHeight: 1.05, color: C.blood, textShadow: '0 6px 0 #300008'}}>EDITION</div>
      </Drip>
      <Embers n={50} seed={12} color={C.pumpkin} speed={1.6} />
    </AbsoluteFill>
  );
};

export const _rand = rand;
export const _dims = {W, H};
