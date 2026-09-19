import {chromium} from '@playwright/test';
import {Game} from '../game/simulation.js';
import {planInputs} from './driver.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('./review/',import.meta.url));
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 for(const view of [{name:'desktop',width:1280,height:800},{name:'phone',width:390,height:844},{name:'deck',width:1280,height:720}]){
  const page=await browser.newPage({viewport:view});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4197/?test=1');await page.waitForFunction(()=>window.__RUN_TEST__?.ready());
  await page.evaluate(()=>window.__RUN_TEST__.start(0));
  const g=new Game();g.reset();let count=0;
  while(g.world<2200&&g.phase==='running'){
   const plan=planInputs(g);
   for(const action of plan.commands){if(action!=='none'){g.command(action,action==='roll');await page.evaluate(a=>window.__RUN_TEST__.command(a,a==='roll'),action);}for(let i=0;i<plan.frames;i++)g.tick();await page.evaluate(s=>window.__RUN_TEST__.advance(s),plan.frames/120);
    if(g.world>1500&&count++===0)await page.screenshot({path:path.join(out,`${view.name}-multilevel.png`)});
   }
  }
  await page.screenshot({path:path.join(out,`${view.name}-enemy-route.png`)});
  console.log(view.name,errors,await page.evaluate(()=>{const s=window.__RUN_TEST__.snapshot();return {hits:s.hits,stomps:s.stomps,elevation:s.player.y,world:s.world,draws:s.draws.length};}));
  await page.close();
 }
}finally{await browser.close();}
