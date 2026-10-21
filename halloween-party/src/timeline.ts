// Scene cuts sit on the 120 BPM beat grid (0.5 s per beat) so music hits land on transitions.
export const FPS = 30;
export const SCENES = [
  { id: "intro", start: 0, dur: 4 },
  { id: "title", start: 4, dur: 5 },
  { id: "passion", start: 9, dur: 4 },
  { id: "date", start: 13, dur: 5 },
  { id: "dress", start: 18, dur: 4.5 },
  { id: "prices", start: 22.5, dur: 5.5 },
  { id: "location", start: 28, dur: 4.5 },
  { id: "poster", start: 32.5, dur: 7.5 },
] as const;
export const TOTAL = 40;
