import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer("angle");
