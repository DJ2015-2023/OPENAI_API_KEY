import { existsSync } from 'node:fs';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setChromiumOpenGlRenderer('swangle');

// Cloud sessions ship a headless Chromium; elsewhere Remotion downloads its own.
const LOCAL_SHELL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (existsSync(LOCAL_SHELL)) Config.setBrowserExecutable(LOCAL_SHELL);
