import t from "./timeline.json";

// Scene cuts are snapped to the song's beat grid by tools/analyze_song.py:
// the drop lands on the title at 4.0 s and every later cut sits on a downbeat.
export const FPS = 30;
export const TOTAL = 40;
export const BEAT_SEC = t.beat;
const c = t.cuts;
const order = [
  ["intro", 0],
  ["title", c.title],
  ["passion", c.passion],
  ["date", c.date],
  ["dress", c.dress],
  ["prices", c.prices],
  ["location", c.location],
  ["poster", c.poster],
] as const;
export const SCENES = order.map(([id, start], i) => ({
  id,
  start,
  dur: (i + 1 < order.length ? order[i + 1][1] : TOTAL) - start,
}));
export const CUT = c;
