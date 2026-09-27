import { Config } from "remotion";

Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(18);
Config.setImageFormat("png");
Config.setBrowserExecutable(process.env.PUPPETEER_EXECUTABLE_PATH);
