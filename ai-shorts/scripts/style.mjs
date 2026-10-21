#!/usr/bin/env node
// Give every episode its own look and sound, different from everything already published.
//
//   node scripts/style.mjs episodes/<id>   pick a style (if the episode has none) and write it into episode.json
//
// Past styles come from the "Style ID" line that build.mjs writes into each YouTube
// description (read with youtube.mjs recent --json) plus local episodes/*/episode.json.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FONTS = ['sora', 'space', 'unbounded', 'syne', 'archivo', 'bebas', 'oswald', 'montserrat'];
const HARMONIES = ['triad', 'split', 'analog', 'complement'];
const TRANSITIONS = ['zoom', 'whip', 'iris', 'glitch'];
const HUDS = ['ticker', 'badge', 'minimal'];
const MOTIONS = ['impact', 'digital', 'elegant'];
const CAMERAS = ['calm', 'energetic'];
const BPMS = [112, 116, 120, 124, 128];
const WORLDS = ['neon', 'liquid', 'editorial', 'synthwave', 'terminal'];
const SCENE_TYPES = ['hook', 'reveal', 'list', 'stat', 'cards', 'outro'];
const LAYOUTS = ['center', 'left'];
const SHAPES = ['circle', 'square', 'diamond', 'stripe'];
// Each world brings its own genre, so tempo ranges differ too.
const WORLD_BPM = { neon: [120, 124, 128], liquid: [92, 96, 100], editorial: [112, 116, 120], synthwave: [100, 104, 108], terminal: [126, 130, 134] };

/** Scene layout code, e.g. hook→reveal→stat→outro = "HRSO". */
export const layoutOf = (scenes) => scenes.map((s) => s.type[0].toUpperCase()).join('');

/** Compact, human-readable fingerprint stored in the YouTube description. */
const variantCode = (st) => SCENE_TYPES.map((t) => st.variants?.[t] ?? 'A').join('');

export function styleId(st, scenes) {
  const look = `${(st.world ?? 'neon').slice(0, 3)}.${variantCode(st)}.${(st.layout ?? 'center')[0]}${(st.shape ?? 'circle')[0]}`;
  return [`${st.hue}${st.harmony[0]}`, st.font, st.transition, st.hud, st.motion, st.camera, `${st.bpm}.${st.progression}.${st.key + 3}`, layoutOf(scenes), look].join('-');
}

export function parseStyleId(id) {
  const p = id.trim().split('-');
  if (p.length < 8) return null;
  const [hb, font, transition, hud, motion, camera, music, layout, look] = p;
  const [bpm, progression, k] = music.split('.').map(Number);
  const out = { hue: parseInt(hb, 10), font, transition, hud, motion, camera, bpm, progression, key: k - 3, layout };
  if (look) {
    const [w, v, ls] = look.split('.');
    Object.assign(out, {
      world: WORLDS.find((x) => x.startsWith(w)) ?? 'neon',
      variants: Object.fromEntries(SCENE_TYPES.map((t, i) => [t, v?.[i] ?? 'A'])),
      align: ls?.[0] === 'l' ? 'left' : 'center',
      shape: SHAPES.find((x) => x[0] === ls?.[1]) ?? 'circle',
    });
  }
  return out;
}

/** Styles used before, most recent first. */
export function pastStyles(exceptId) {
  const out = [];
  try {
    const raw = execFileSync('node', [join(ROOT, 'scripts/youtube.mjs'), 'recent', '--json'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    for (const v of JSON.parse(raw)) {
      const m = /Style ID: (\S+)/.exec(v.description ?? '');
      const st = m && parseStyleId(m[1]);
      if (st) out.push(st);
    }
  } catch {
    // no credentials or no network: fall back to local episodes only
  }
  const dir = join(ROOT, 'episodes');
  const local = existsSync(dir) ? readdirSync(dir).filter((d) => d !== exceptId).sort().reverse() : [];
  for (const d of local) {
    const f = join(dir, d, 'episode.json');
    if (!existsSync(f)) continue;
    const ep = JSON.parse(readFileSync(f, 'utf8'));
    if (ep.style && ep.scenes) out.push({ ...ep.style, align: ep.style.layout, layout: layoutOf(ep.scenes) });
  }
  return out;
}

const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const pick = (arr, avoid) => {
  const ok = arr.filter((x) => !avoid.includes(x));
  return (ok.length ? ok : arr)[Math.floor(Math.random() * (ok.length ? ok.length : arr.length))];
};

/** Mix of immersive (A) and graphic (B) scene designs, never the same mix as the last video. */
function pickVariants(past) {
  const lastCode = past[0]?.variants ? SCENE_TYPES.map((t) => past[0].variants[t] ?? 'A').join('') : '';
  for (let i = 0; i < 30; i++) {
    const v = Object.fromEntries(SCENE_TYPES.map((t) => [t, Math.random() < 0.5 ? 'A' : 'B']));
    if (SCENE_TYPES.map((t) => v[t]).join('') !== lastCode) return v;
  }
  return Object.fromEntries(SCENE_TYPES.map((t) => [t, 'B']));
}

export function pickStyle(past) {
  const last = (n, k) => past.slice(0, n).map((p) => p[k]);
  let hue;
  for (let i = 0; i < 200; i++) {
    hue = Math.floor(Math.random() * 360);
    if (past.slice(0, 6).every((p) => hueDist(p.hue, hue) >= 35)) break;
  }
  // A different visual universe from the last two videos, then everything else varies within it.
  const world = pick(WORLDS, past.slice(0, 2).map((p) => p.world ?? 'neon'));
  const music = () => ({ bpm: pick(WORLD_BPM[world] ?? BPMS, []), progression: Math.floor(Math.random() * 4), key: Math.floor(Math.random() * 7) - 3 });
  let m = music();
  for (let i = 0; i < 50 && past.slice(0, 10).some((p) => p.bpm === m.bpm && p.progression === m.progression && p.key === m.key); i++) m = music();
  return {
    hue,
    harmony: pick(HARMONIES, last(1, 'harmony')),
    font: pick(FONTS, last(3, 'font')),
    transition: pick(TRANSITIONS, last(2, 'transition')),
    hud: pick(HUDS, last(1, 'hud')),
    motion: pick(MOTIONS, last(1, 'motion')),
    camera: pick(CAMERAS, last(1, 'camera')),
    ...m,
    world,
    variants: pickVariants(past),
    layout: pick(LAYOUTS, past.slice(0, 1).map((p) => p.align)),
    shape: pick(SHAPES, past.slice(0, 2).map((p) => p.shape)),
  };
}

/** Fail loudly when the scene layout repeats a recent video's structure. */
export function checkLayout(scenes, past) {
  const layout = layoutOf(scenes);
  const clash = past.slice(0, 10).find((p) => p.layout === layout);
  if (clash) {
    throw new Error(`Scene layout ${layout} was used by one of the last 10 videos. Change the order or types of the middle scenes (recent layouts: ${past.slice(0, 10).map((p) => p.layout).join(', ')}).`);
  }
}

// CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? '');
  const f = join(dir, 'episode.json');
  const ep = JSON.parse(readFileSync(f, 'utf8'));
  const past = pastStyles(ep.id);
  if (!ep.style) {
    ep.style = pickStyle(past);
    writeFileSync(f, JSON.stringify(ep, null, 2) + '\n');
  }
  console.log(`style ${styleId(ep.style, ep.scenes)}`);
  console.log(`recent layouts: ${past.slice(0, 10).map((p) => p.layout).join(', ') || '(none)'}`);
}
