// Film timeline in frames @24fps. Mirrors the constants in audio/music.py and audio/mix.sh.
export const FPS = 24;
export const W = 1080;
export const H = 1920;

export const INTRO = { from: 0, dur: 144 }; // user's logo clip (6s)
export const S1 = { from: 144, dur: 72 }; // witch at the mirror
export const S2 = { from: 216, dur: 72 }; // lipstick + vampire masquerade
export const S3 = { from: 288, dur: 72 }; // the gang gathers
export const S4 = { from: 360, dur: 82 }; // "А ТЫ?" (HyperFrames render)
export const S5 = { from: 442, dur: 105 }; // the party, bass drop at frame 442
export const S6 = { from: 547, dur: 135 }; // poster reveal
export const TOTAL = S6.from + S6.dur;

export const BEAT_FRAMES = (60 / 128) * FPS;

// Subtitles (absolute film seconds), matching the VO placement in audio/mix.sh
export const SUBS: { t0: number; t1: number; text: string }[] = [
  { t0: 6.35, t1: 8.9, text: 'Кто-то уже выбирает костюм…' },
  { t0: 9.1, t1: 11.9, text: 'Кто-то готовится удивлять…' },
  { t0: 12.15, t1: 14.85, text: 'А кто-то собирает всю свою банду!' },
  { t0: 14.9, t1: 16.85, text: 'А ты всё ещё думаешь, идти или нет?' },
];
