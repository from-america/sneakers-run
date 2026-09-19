import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'game-tests/review');await mkdir(out,{recursive:true});
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch(existsSync(chrome)?{executablePath:chrome}:{});
const measurements=[];
try{
 for(const view of [{name:'desktop',width:1280,height:800},{name:'phone',width:390,height:844},{name:'small-phone',width:320,height:568},{name:'landscape',width:844,height:390}]){
  const page=await browser.newPage({viewport:view,hasTouch:view.width<900});
  await page.goto('http://127.0.0.1:4197/?test=1&seed=42');await page.waitForFunction(()=>window.__RUN_TEST__?.ready());await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(out,`${view.name}-home.png`)});
  await page.locator('#startButton').click();await page.waitForFunction(()=>window.__RUN_TEST__.snapshot().phase==='running');
  await page.evaluate(()=>window.__RUN_TEST__.scenario('gate',280));await page.screenshot({path:path.join(out,`${view.name}-running.png`)});
  await page.evaluate(()=>{window.__RUN_TEST__.scenario('gate',-60);window.__RUN_TEST__.command('roll');window.__RUN_TEST__.advance(.1);});await page.screenshot({path:path.join(out,`${view.name}-roll.png`)});
  await page.evaluate(()=>{window.__RUN_TEST__.clear();window.__RUN_TEST__.setPlayer({y:380,previousY:380,vy:0,grounded:false,action:'jump'});});await page.screenshot({path:path.join(out,`${view.name}-apex.png`)});
  await page.keyboard.press('Escape');await page.screenshot({path:path.join(out,`${view.name}-pause.png`)});
  await page.locator('#pauseHomeButton').click();await page.locator('#startButton').click();await page.waitForFunction(()=>window.__RUN_TEST__.snapshot().phase==='running');await page.evaluate(()=>window.__RUN_TEST__.finish());await page.screenshot({path:path.join(out,`${view.name}-result.png`)});
  await page.locator('#resultHome').click();await page.locator('#settingsButton').click();await page.screenshot({path:path.join(out,`${view.name}-settings.png`)});
  measurements.push({name:view.name,...await page.evaluate(()=>{const s=window.__RUN_TEST__.snapshot();return {view:s.view,maxDrawMs:Math.max(...s.timings),frames:s.timings.length};})});
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto('http://127.0.0.1:4197/?test=1&seed=42');await page.waitForFunction(()=>window.__RUN_TEST__?.ready());
 for(let stage=0;stage<10;stage++){
  await page.evaluate(stage=>window.__RUN_TEST__.start(stage),stage);
  // Capture the authored route after its entrance runway, rather than a
  // synthetic test prop. This keeps the visual review tied to the actual
  // chapter beat deck and its setting-specific composition.
  await page.evaluate(()=>window.__RUN_TEST__.advance(2.6));
  await page.screenshot({path:path.join(out,`block-${String(stage+1).padStart(2,'0')}.png`)});
 }
 await writeFile(path.join(out,'measurements.json'),JSON.stringify(measurements,null,2)+'\n');
 console.log(`Captured ${measurements.length} viewports, seven states each, and ten environments.`);
}finally{await browser.close();}
