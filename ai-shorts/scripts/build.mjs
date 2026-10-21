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
import { checkLayout, pastStyles, pickStyle, styleId } from './style.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const epDir = resolve(args.find((a) => !a.startsWith('--')) ?? '');
const NO_RENDER = args.includes('--no-render');
const STILLS = args.includes('--stills');
const FPS = 30;

const TTS_DIR = process.env.PIPER_DIR ?? join(ROOT, '.tts');
const PIPER = join(TTS_DIR, 'piper/piper');
const VOICE = join(TTS_DIR, 'en-us-ryan-high.onnx');
const KOKORO_DIR = join(TTS_DIR, 'kokoro');
// Channel settings shared by every episode (e.g. the narrator's voice).
const CONFIG = existsSync(join(ROOT, 'config.json')) ? JSON.parse(readFileSync(join(ROOT, 'config.json'), 'utf8')) : {};

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

/** Cut leading/trailing silence only; pauses inside a phrase are part of the delivery. */
function trim(out) {
  const trimmed = out.replace(/\.wav$/, '.t.wav');
  const edge = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03';
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-af', `${edge},areverse,${edge},areverse`, trimmed]);
  copyFileSync(trimmed, out);
  rmSync(trimmed);
  return probeDuration(out);
}

/** Kokoro (natural neural voice) when its model is available, otherwise Piper. */
function ensureKokoro() {
  const model = join(KOKORO_DIR, 'kokoro-v1.0.onnx');
  if (!existsSync(model)) {
    log('downloading the Kokoro voice model (one time)…');
    mkdirSync(KOKORO_DIR, { recursive: true });
    const base = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0';
    try {
      for (const f of ['kokoro-v1.0.onnx', 'voices-v1.0.bin']) run('curl', ['-sfL', '-o', join(KOKORO_DIR, f), `${base}/${f}`]);
    } catch {
      rmSync(KOKORO_DIR, { recursive: true, force: true });
      return false;
    }
  }
  try {
    run('python3', ['-c', 'import kokoro_onnx, soundfile']);
    return true;
  } catch {
    return false;
  }
}

function synthesize(jobs) {
  if (CONFIG.tts !== 'piper' && ensureKokoro()) {
    const voice = CONFIG.voice ?? 'am_michael';
    log(`voiceover (Kokoro, ${voice})…`);
    const file = join(buildDir, 'vo', 'jobs.json');
    writeFileSync(file, JSON.stringify(jobs));
    run('python3', [join(ROOT, 'scripts/tts_kokoro.py'), KOKORO_DIR, voice, file], { stdio: ['ignore', 'ignore', 'ignore'] });
    return jobs.map((j) => trim(j.out));
  }
  ensurePiper();
  log('voiceover (Piper fallback)…');
  return jobs.map(({ text, out }) => {
    // Piper reads acronyms better spelled with dots ("A.I.").
    const spoken = text.replace(/\bAI\b/g, 'A.I.').replace(/\bAPI\b/g, 'A.P.I.').replace(/\bGPU(s?)\b/g, 'G.P.U.$1');
    run(PIPER, ['--model', VOICE, '--length_scale', '0.92', '--output_file', out], { input: spoken, stdio: ['pipe', 'ignore', 'ignore'] });
    return trim(out);
  });
}

// ---------- timeline ----------
// Seconds of visuals before the voice starts. The hook speaks almost at once: viewers decide in
// the first second whether to swipe away.
const LEAD = { hook: 0.25, reveal: 1.2, stat: 1.0 };
const GAP = 0.2; // pause between phrases
const TAIL = 0.55; // after the last phrase of a scene
const OUTRO_TAIL = 1.7; // CTA hold + final pulse that loops back into the opening flash
const FINAL_PULSE = 1.25; // seconds before the end

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

  // Word-by-word captions. Piper gives no word timings, so spread each phrase's
  // duration over its words by length; the eye forgives a few frames.
  const captions = [];
  let group = 0;
  ep.scenes.forEach((s, i) => {
    s.vo.forEach((line, j) => {
      // the outro's closing question is already on screen in large type
      if (s.type === 'outro' && j === s.names.length + 1) return;
      const at = scenes[i].cues[j];
      const dur = voDur[i][j];
      const words = line.replace(/\bA\.I\./g, 'AI').replace(/\bA\.P\.I\./g, 'API').split(/\s+/).filter(Boolean);
      const weights = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 2);
      const total = weights.reduce((a, b) => a + b, 0);
      let x = at;
      let chunkLen = 0;
      group++;
      words.forEach((w, k) => {
        const d = (dur * 0.94 * weights[k]) / total;
        // at most 3 words / 16 letters on screen at once
        if (chunkLen && (chunkLen + w.length > 16 || k % 3 === 0)) {
          group++;
          chunkLen = 0;
        }
        chunkLen += w.length + 1;
        captions.push({ text: w, at: +x.toFixed(3), end: +(x + d).toFixed(3), group });
        x += d;
      });
    });
  });
  return { scenes, vo, duration, captions };
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
      if (c[0] > 1.2) {
        add('drone', 0, { len: c[0] + 0.05 });
        add('riser', 0.4, { len: c[0] - 0.4 });
      }
      add('impact', 0, { size: 1.0 }); // the video opens on a hit
      [0.5, 0.9, 1.3].forEach((z) => add('zap', c[0] + z));
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
      const fin = s.end - FINAL_PULSE;
      add('riser', fin - 1.1, { len: 1.1 });
      add('impact', fin, { size: 1.2 });
      add('pulse', fin + 0.02);
      add('whoosh', s.end - 0.5, { len: 0.5 }); // carries the loop back to the opening hit
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

// Every video gets its own look, sound and structure (see scripts/style.mjs).
const past = pastStyles(ep.id);
if (!ep.style) {
  ep.style = pickStyle(past);
  writeFileSync(join(epDir, 'episode.json'), JSON.stringify(ep, null, 2) + '\n');
}
try {
  checkLayout(ep.scenes, past);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
log(`style ${styleId(ep.style, ep.scenes)}`);
const buildDir = join(epDir, 'build');
mkdirSync(join(buildDir, 'vo'), { recursive: true });

const jobs = ep.scenes.flatMap((s, i) => s.vo.map((text, j) => ({ text, out: join(buildDir, 'vo', `s${i}_p${j}.wav`), i, j })));
const durs = synthesize(jobs);
const voDur = ep.scenes.map((s) => s.vo.map(() => 0));
jobs.forEach((job, k) => (voDur[job.i][job.j] = durs[k]));

const { scenes, vo, duration, captions } = buildTimeline(ep, voDur, buildDir);
const outro = scenes.at(-1);
const breakdowns = scenes.filter((s) => s.type === 'reveal' || s.type === 'stat').map((s) => [s.start, s.cues[0]]);
const audioRel = `episodes/${ep.id}.wav`;
const timeline = {
  id: ep.id,
  palette: ep.palette ?? 'electric',
  style: ep.style,
  ticker: ep.ticker ?? ep.youtube.title,
  fps: FPS,
  duration,
  audio: audioRel,
  scenes,
  captions,
  sfx: buildSfx(scenes, duration),
  vo,
  music: { beatStart: scenes[0].cues[0], breakdowns, finalHit: outro.end - FINAL_PULSE, bpm: ep.style.bpm, progression: ep.style.progression, key: ep.style.key },
};
writeFileSync(join(buildDir, 'timeline.json'), JSON.stringify(timeline, null, 1));
log(`timeline: ${duration.toFixed(1)} s, ${scenes.length} scenes, ${timeline.sfx.length} sound effects`);
if (duration > 40) console.warn(`! ${duration.toFixed(1)} s: Shorts retain best at 25–35 s. Trim the vo phrases.`);

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
  `Question: ${outro.cta} Tell us in the comments 👇`,
  '',
  'Sources:',
  ...ep.sources.map((s) => `• ${s.title}: ${s.url}`),
  '',
  'Voiceover and visuals are AI-generated.',
  `Style ID: ${styleId(ep.style, ep.scenes)}`,
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
