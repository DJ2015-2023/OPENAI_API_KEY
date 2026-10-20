#!/usr/bin/env node
// Build one episode: voiceover → timeline → soundtrack → 1080x1920 render → thumbnail.
//
//   node scripts/build.mjs episodes/<id> [--no-render] [--stills]
//
// Reads episodes/<id>/episode.json and writes everything to episodes/<id>/build/.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const epDir = resolve(args.find((a) => !a.startsWith('--')) ?? '');
const NO_RENDER = args.includes('--no-render');
const STILLS = args.includes('--stills');
const FPS = 30;

const TTS_DIR = process.env.PIPER_DIR ?? join(ROOT, '.tts');
const PIPER = join(TTS_DIR, 'piper/piper');
const VOICE = join(TTS_DIR, 'en-us-ryan-high.onnx');

const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { stdio: ['pipe', 'pipe', 'inherit'], ...opts });
const log = (...m) => console.log('›', ...m);

// ---------- validate ----------
const SCENE_FIELDS = {
  hook: ['kicker', 'title', 'lines'],
  reveal: ['word', 'tag', 'title', 'subtitle'],
  list: ['items'],
  stat: ['value', 'unit', 'label'],
  cards: ['tag', 'title', 'cards'],
  outro: ['names', 'headline', 'cta'],
};
function validate(ep) {
  const errs = [];
  if (!ep.id) errs.push('id missing');
  if (!Array.isArray(ep.scenes) || ep.scenes.length < 3) errs.push('need at least 3 scenes');
  if (ep.scenes?.[0]?.type !== 'hook') errs.push('first scene must be a hook');
  if (ep.scenes?.at(-1)?.type !== 'outro') errs.push('last scene must be an outro');
  ep.scenes?.forEach((s, i) => {
    const need = SCENE_FIELDS[s.type];
    if (!need) return errs.push(`scene ${i}: unknown type ${s.type}`);
    for (const f of need) if (s[f] === undefined) errs.push(`scene ${i} (${s.type}): ${f} missing`);
    if (!Array.isArray(s.vo) || !s.vo.length) errs.push(`scene ${i} (${s.type}): vo phrases missing`);
  });
  if (!ep.youtube?.title) errs.push('youtube.title missing');
  if (!ep.sources?.length) errs.push('sources missing: every episode must cite where the news comes from');
  if (errs.length) {
    console.error('episode.json is invalid:\n  - ' + errs.join('\n  - '));
    process.exit(1);
  }
}

// ---------- tools ----------
function ensurePiper() {
  if (existsSync(PIPER) && existsSync(VOICE)) return;
  log('downloading Piper TTS and voice (one time)…');
  mkdirSync(TTS_DIR, { recursive: true });
  const base = 'https://github.com/rhasspy/piper/releases/download';
  run('sh', ['-c', `curl -sL ${base}/2023.11.14-2/piper_linux_x86_64.tar.gz | tar xz -C "${TTS_DIR}"`]);
  run('sh', ['-c', `curl -sL ${base}/v0.0.2/voice-en-us-ryan-high.tar.gz | tar xz -C "${TTS_DIR}"`]);
}

const probeDuration = (f) => parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

function tts(text, out) {
  // Piper reads acronyms better spelled with dots ("A.I.").
  const spoken = text.replace(/\bAI\b/g, 'A.I.').replace(/\bAPI\b/g, 'A.P.I.').replace(/\bGPU(s?)\b/g, 'G.P.U.$1');
  run(PIPER, ['--model', VOICE, '--length_scale', '0.92', '--output_file', out], { input: spoken, stdio: ['pipe', 'ignore', 'ignore'] });
  // Trim Piper's trailing silence so cues stay tight.
  const trimmed = out.replace(/\.wav$/, '.t.wav');
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-af', 'silenceremove=stop_periods=-1:stop_duration=0.12:stop_threshold=-45dB', trimmed]);
  copyFileSync(trimmed, out);
  rmSync(trimmed);
  return probeDuration(out);
}

// ---------- timeline ----------
const LEAD = { hook: 2.0, reveal: 2.0, stat: 1.4 }; // seconds of visuals before the voice starts
const GAP = 0.2; // pause between phrases
const TAIL = 0.55; // after the last phrase of a scene
const OUTRO_TAIL = 2.6; // CTA hold + final pulse + fade

function buildTimeline(ep, voDur, buildDir) {
  let t = 0;
  const scenes = [];
  const vo = [];
  ep.scenes.forEach((s, i) => {
    const start = t;
    let at = start + (LEAD[s.type] ?? 0.45);
    const cues = [];
    s.vo.forEach((_, j) => {
      cues.push(+at.toFixed(3));
      vo.push({ file: relative(buildDir, join(buildDir, 'vo', `s${i}_p${j}.wav`)), at: +at.toFixed(3) });
      at += voDur[i][j] + GAP;
    });
    const last = i === ep.scenes.length - 1;
    const end = Math.max(start + 3.8, at - GAP + (last ? OUTRO_TAIL : TAIL));
    scenes.push({ ...s, start: +start.toFixed(3), end: +end.toFixed(3), cues });
    t = end;
  });
  const duration = Math.ceil(t * FPS) / FPS;
  return { scenes, vo, duration };
}

function buildSfx(scenes, duration) {
  const fx = [];
  const add = (type, at, extra = {}) => at >= 0 && at < duration && fx.push({ type, at: +at.toFixed(3), ...extra });
  scenes.forEach((s, i) => {
    const c = s.cues;
    const len = s.end - s.start;
    if (i > 0) {
      add('whoosh', s.start - 0.45, { len: 0.5 });
      add('impact', s.start, { size: 0.7 });
    }
    if (s.type === 'hook') {
      add('drone', 0, { len: c[0] + 0.05 });
      add('riser', 0.4, { len: c[0] - 0.4 });
      [0.6, 1.1, 1.5, 1.8].forEach((z) => z < c[0] && add('zap', z));
      add('impact', c[0], { size: 1.0 });
      c.slice(1).forEach((x) => { add('whoosh', x - 0.42, { len: 0.45 }); add('glitch', x); add('hit', x); });
    } else if (s.type === 'reveal') {
      add('shimmer', s.start + 0.1, { len: 2.0 });
      add('chime', s.start + 1.0);
      add('whoosh', c[0] - 0.5, { len: 0.5 });
      add('impact', c[0], { size: 0.85 });
      add('glitch', c[0]);
      c.slice(1).forEach((x) => { add('blip', x); add('blip', x + 0.16); });
      add('swell', s.end - 1.6, { len: 1.4 });
    } else if (s.type === 'list') {
      [0.25, 0.45, 0.7, 0.9].forEach((d) => add('blip', s.start + d));
      add('data', s.start + 0.3, { len: len - 0.6 });
      c.forEach((x) => { add('glitch', x); add('hit', x); });
    } else if (s.type === 'stat') {
      add('rush', s.start, { len });
      add('riser', s.start + 0.1, { len: c[0] - s.start - 0.1 });
      add('impact', c[0], { size: 1.0 });
      add('pulse', c[0] + 0.05);
      c.slice(1).forEach((x) => { add('glitch', x); add('hit', x); });
      for (let z = c[0] + 3; z < s.end - 1.2; z += 1.05) add('zap', z);
      add('pulse', s.end - 1.6);
    } else if (s.type === 'cards') {
      add('chime', c[0]);
      c.slice(1).forEach((x) => { add('blip', x); add('hit', x); });
      for (let z = c[0] + 1.6; z < s.end - 1.4; z += 0.8) add('zap', z);
      add('swell', s.end - 1.8, { len: 1.4 });
    } else if (s.type === 'outro') {
      const n = s.names.length;
      c.slice(0, n).forEach((x) => add('slam', x));
      const head = c[n] ?? c.at(-1) + 1;
      add('riser', head - 1.0, { len: 1.0 });
      add('impact', head, { size: 1.0 });
      add('glitch', head);
      if (c[n + 1] !== undefined) { add('whoosh', c[n + 1] - 0.45, { len: 0.45 }); add('chime', c[n + 1]); add('blip', c[n + 1] + 0.25); }
      const fin = s.end - 1.6;
      add('riser', fin - 1.1, { len: 1.1 });
      add('impact', fin, { size: 1.2 });
      add('pulse', fin + 0.02);
    }
  });
  return fx.sort((a, b) => a.at - b.at);
}

// ---------- main ----------
if (!existsSync(join(epDir, 'episode.json'))) {
  console.error(`usage: node scripts/build.mjs episodes/<id>   (no episode.json in ${epDir})`);
  process.exit(1);
}
const ep = JSON.parse(readFileSync(join(epDir, 'episode.json'), 'utf8'));
validate(ep);
const buildDir = join(epDir, 'build');
mkdirSync(join(buildDir, 'vo'), { recursive: true });

ensurePiper();
log('voiceover…');
const voDur = ep.scenes.map((s, i) => s.vo.map((line, j) => tts(line, join(buildDir, 'vo', `s${i}_p${j}.wav`))));

const { scenes, vo, duration } = buildTimeline(ep, voDur, buildDir);
const outro = scenes.at(-1);
const breakdowns = scenes.filter((s) => s.type === 'reveal' || s.type === 'stat').map((s) => [s.start, s.cues[0]]);
const audioRel = `episodes/${ep.id}.wav`;
const timeline = {
  id: ep.id,
  palette: ep.palette ?? 'electric',
  ticker: ep.ticker ?? ep.youtube.title,
  fps: FPS,
  duration,
  audio: audioRel,
  scenes,
  sfx: buildSfx(scenes, duration),
  vo,
  music: { beatStart: scenes[0].cues[0], breakdowns, finalHit: outro.end - 1.6 },
};
writeFileSync(join(buildDir, 'timeline.json'), JSON.stringify(timeline, null, 1));
log(`timeline: ${duration.toFixed(1)} s, ${scenes.length} scenes, ${timeline.sfx.length} sound effects`);
if (duration > 59) console.warn(`! ${duration.toFixed(1)} s is over YouTube's 60 s sweet spot for Shorts; trim the vo phrases.`);

log('soundtrack…');
run('python3', [join(ROOT, 'scripts/make_audio.py'), join(buildDir, 'timeline.json'), join(buildDir, 'mix_raw.wav')], { stdio: 'inherit' });
mkdirSync(join(ROOT, 'public/episodes'), { recursive: true });
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(buildDir, 'mix_raw.wav'), '-af', 'loudnorm=I=-14:TP=-1:LRA=9', '-ar', '48000', join(ROOT, 'public', audioRel)]);

writeFileSync(join(buildDir, 'props.json'), JSON.stringify({ timeline }));
if (!existsSync(join(ROOT, 'src/sample-timeline.json'))) writeFileSync(join(ROOT, 'src/sample-timeline.json'), JSON.stringify(timeline));

// YouTube metadata: sources go in the description so viewers can check the news.
const desc = [
  ep.youtube.description,
  '',
  'Sources:',
  ...ep.sources.map((s) => `• ${s.title}: ${s.url}`),
  '',
  'Voiceover and visuals are AI-generated.',
  '#Shorts #AI #AINews #ArtificialIntelligence',
].join('\n');
writeFileSync(join(buildDir, 'youtube.json'), JSON.stringify({ title: ep.youtube.title.slice(0, 100), description: desc, tags: ep.youtube.tags ?? [] }, null, 1));

const remotion = (cmd, extra) =>
  run('npx', ['remotion', cmd, 'src/index.ts', 'AiShort', ...extra, `--props=${join(buildDir, 'props.json')}`, '--log=error'], { cwd: ROOT, stdio: 'inherit' });

if (STILLS) {
  log('preview stills…');
  scenes.forEach((s, i) => {
    const at = Math.min(s.end - 0.5, (s.cues.at(-1) ?? s.start) + 0.9);
    remotion('still', [join(buildDir, `still_${i}_${s.type}.jpg`), `--frame=${Math.round(at * FPS)}`, '--scale=0.5']);
  });
}
if (!NO_RENDER) {
  log('rendering 1080x1920 (takes a while)…');
  const t0 = Date.now();
  remotion('render', [join(buildDir, 'video.mp4'), '--concurrency=4', '--audio-codec=aac', '--audio-bitrate=256k']);
  remotion('still', [join(buildDir, 'thumb.jpg'), `--frame=${Math.round((scenes[0].cues[1] ?? scenes[0].cues[0]) * FPS + 25)}`]);
  log(`done in ${((Date.now() - t0) / 60000).toFixed(1)} min → ${relative(ROOT, join(buildDir, 'video.mp4'))}`);
}
