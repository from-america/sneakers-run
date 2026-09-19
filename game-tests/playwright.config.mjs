import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root=new URL('../',import.meta.url).pathname;
export default defineConfig({
 testDir:'.',testMatch:'**/*.spec.mjs',timeout:90000,workers:1,fullyParallel:false,
 outputDir:'results',reporter:'list',
 use:{baseURL:'http://127.0.0.1:4198',browserName:'chromium',viewport:{width:1280,height:800},
  launchOptions:existsSync(chrome)?{executablePath:chrome}:{},screenshot:'only-on-failure'},
 webServer:{command:`python3 -m http.server 4198 --bind 127.0.0.1 --directory "${root}"`,url:'http://127.0.0.1:4198/',reuseExistingServer:false}
});
