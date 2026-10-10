import { continueRender, delayRender, staticFile } from "remotion";
import { FONT_FILES } from "./fontList";

const handle = delayRender("Loading fonts");

Promise.all(
  FONT_FILES.map((f) => {
    const face = new FontFace(
      f.family,
      `url(${staticFile(`fonts/${f.file}`)}) format('woff2')`,
      { unicodeRange: f.unicodeRange, weight: "100 900" },
    );
    return face.load().then((loaded) => document.fonts.add(loaded));
  }),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error(err);
    continueRender(handle);
  });
