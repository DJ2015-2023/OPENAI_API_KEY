import { Composition, continueRender, delayRender } from "remotion";
import "../public/fonts/fonts.css";
import { Main } from "./Main";
import { FPS, TOTAL } from "./timeline";

// Hold rendering until the web fonts (incl. Cyrillic subsets) are decoded.
if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  const faces = [
    "400 80px Oswald", "500 80px Oswald", "600 80px Oswald", "700 80px Oswald", "400 80px 'Marck Script'",
    "700 80px 'Playfair Display SC'", "900 80px 'Playfair Display SC'", "900 80px 'Cinzel Decorative'",
    "400 80px Creepster", "italic 600 80px 'Cormorant Garamond'",
  ];
  Promise.all(faces.flatMap((f) => [document.fonts.load(f, "Аa1"), document.fonts.load(f, "Va")])).then(() => continueRender(handle));
}

export const RemotionRoot = () => (
  <Composition id="HalloweenParty" component={Main} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL * FPS} />
);
