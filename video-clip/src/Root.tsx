import { Composition, continueRender, delayRender } from "remotion";
import "../public/fonts/fonts.css";
import { VideoClip } from "./VideoClip";
import timeline from "./timeline.json";

// Hold rendering until the Cyrillic web fonts are decoded.
if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  const faces = ["900 italic 100px 'Playfair Display'", "700 italic 100px 'Playfair Display'", "400 italic 100px 'Playfair Display'",
    "500 italic 100px 'Playfair Display'", "800 100px Montserrat", "700 100px Montserrat", "600 100px Montserrat", "500 100px Montserrat",
    "400 100px Montserrat", "300 100px Montserrat", "500 italic 100px 'Cormorant Garamond'"];
  Promise.all(faces.flatMap((f) => [document.fonts.load(f, "Аa"), document.fonts.load(f, "Va")])).then(() => continueRender(handle));
}

export const RemotionRoot = () => (
  <Composition
    id="VideoClip"
    component={VideoClip}
    width={1080}
    height={1920}
    fps={timeline.fps}
    durationInFrames={Math.ceil(timeline.total * timeline.fps)}
  />
);
