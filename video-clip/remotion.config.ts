import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL for the Three.js scenes
Config.setChromiumOpenGlRenderer("angle");
