// Shape of episodes/<id>/episode.json (written by the news agent) and of the
// computed timeline (written by scripts/build.mjs) that drives video and audio.

export type HookScene = { type: 'hook'; kicker: string; title: string[]; lines: string[]; vo: string[] };
export type RevealScene = { type: 'reveal'; word: string; tag: string; title: string; title2?: string; subtitle: string; vo: string[] };
export type ListScene = { type: 'list'; items: string[]; vo: string[] };
export type StatScene = { type: 'stat'; value: number; prefix?: string; suffix?: string; grouping?: boolean; unit: string; label: string; vo: string[] };
export type CardsScene = { type: 'cards'; tag: string; title: string; cards: { title: string; sub: string }[]; vo: string[] };
export type OutroScene = { type: 'outro'; names: string[]; headline: string[]; cta: string; vo: string[] };
export type Scene = HookScene | RevealScene | ListScene | StatScene | CardsScene | OutroScene;

export type Palette = 'electric' | 'aurora' | 'ember' | 'royal';

/** Visual + musical identity of one episode. Picked by scripts/style.mjs so no two videos match. */
export type Style = {
  hue: number; // base hue of the generated palette, 0–359
  harmony: 'triad' | 'split' | 'analog' | 'complement';
  font: 'sora' | 'space' | 'unbounded' | 'syne' | 'archivo' | 'bebas' | 'oswald' | 'montserrat';
  transition: 'zoom' | 'whip' | 'iris' | 'glitch';
  hud: 'ticker' | 'badge' | 'minimal';
  motion: 'impact' | 'digital' | 'elegant'; // how headlines animate in
  camera: 'calm' | 'energetic';
  bpm: number;
  progression: number; // index into the score's chord progressions
  key: number; // semitone transposition
};

export type Episode = {
  id: string;
  palette?: Palette;
  style?: Style;
  ticker: string;
  scenes: Scene[];
  youtube: { title: string; description: string; tags: string[] };
  sources: { title: string; url: string }[];
};

export type TimedScene = Scene & { start: number; end: number; cues: number[] };
export type Sfx = { type: string; at: number; len?: number; size?: number };

export type Timeline = {
  id: string;
  palette?: Palette;
  style?: Style;
  ticker: string;
  fps: number;
  duration: number;
  audio: string; // path under public/
  scenes: TimedScene[];
  sfx: Sfx[];
  vo: { file: string; at: number }[];
  music: { breakdowns: [number, number][]; beatStart: number; finalHit: number; bpm?: number; progression?: number; key?: number };
};
