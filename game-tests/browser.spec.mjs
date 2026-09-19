import {Game} from '../game/simulation.js';
import {planInputs} from './driver.mjs';
import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const url='/?test=1&seed=42';
const viewports=[{name:'desktop',width:1280,height:800},{name:'phone',width:390,height:844},{name:'small-phone',width:320,height:568},{name:'landscape',width:844,height:390},{name:'deck-720',width:1280,height:720},{name:'ultrawide',width:2560,height:1080}];
async function open(page){await page.goto(url);await page.waitForFunction(()=>window.__RUN_TEST__?.ready());await page.evaluate(()=>document.fonts.ready);}
async function start(page){await page.locator('#startButton').click();await page.waitForFunction(()=>window.__RUN_TEST__.snapshot().phase==='running');}
async function snapshot(page){return page.evaluate(()=>window.__RUN_TEST__.snapshot());}
async function advance(page,seconds){await page.evaluate(s=>window.__RUN_TEST__.advance(s),seconds);}
async function contained(page,selector){
 const errors=await page.locator(selector).evaluateAll(elements=>elements.filter(e=>e.checkVisibility()).flatMap(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1||r.top< -1||r.bottom>innerHeight+1?[`${e.id||e.className}: ${JSON.stringify(r.toJSON())}`]:[];}));expect(errors).toEqual([]);
}
for(const viewport of viewports)test(`${viewport.name}: whole sprites and reachable menus`,async({page})=>{
 await page.setViewportSize(viewport);const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 const homeText=(await page.locator('#homePanel').innerText()).split(/\s+/).filter(Boolean);
 expect(homeText.slice(0,4)).toEqual(['Sneakers','Run','Start','Settings']);
 await expect(page.locator('#homePanel .home-actions button:visible')).toHaveCount(2);
 await expect(page.locator('#levelList .level-card')).toHaveCount(10);
 await expect(page.locator('#levelList .level-card:disabled')).toHaveCount(9);
 await expect(page.locator('#levelList .lock-icon')).toHaveCount(9);
 expect(await page.evaluate(()=>document.fonts.check('900 64px BarlowCondensed'))).toBe(true);
 expect(await page.locator('.masthead').isVisible()).toBe(false);expect(await page.locator('.control-deck').isVisible()).toBe(false);
 await contained(page,'#homeTitle,#startButton,#levelList,#endlessButton,#settingsButton');
 await start(page);await page.evaluate(()=>window.__RUN_TEST__.scenario('gate',260));
 await contained(page,'.masthead,.scoreboard,.control-deck,#cue,#jumpButton,#rollButton');
  let state=await snapshot(page);for(const sprite of state.draws.filter(s=>s.name==='run'||s.name.startsWith('chaser'))){expect(sprite.x).toBeGreaterThanOrEqual(0);expect(sprite.y).toBeGreaterThanOrEqual(0);expect(sprite.y+sprite.h).toBeLessThanOrEqual(state.view.height+.5);}
 expect((state.view.worldWidth-224-23)/352).toBeGreaterThan(1.5);
 await page.evaluate(()=>{window.__RUN_TEST__.scenario('gate',-20);window.__RUN_TEST__.command('roll');window.__RUN_TEST__.advance(.05);});
 state=await snapshot(page);expect(state.hits).toBe(0);const roll=state.draws.find(d=>d.name==='roll');expect(roll.h/state.view.scale).toBeLessThan(95);
 await page.evaluate(()=>{window.__RUN_TEST__.clear();window.__RUN_TEST__.command('jump');window.__RUN_TEST__.advance(.3);window.__RUN_TEST__.command('jump');window.__RUN_TEST__.advance(.45);});
 state=await snapshot(page);for(const sprite of state.draws.filter(s=>s.name==='jump'))expect(sprite.y).toBeGreaterThanOrEqual(0);
 await page.keyboard.press('Escape');await expect(page.locator('#resumeButton')).toBeFocused();await contained(page,'#pausePanel');
 const before=(await snapshot(page)).world;await advance(page,2);expect((await snapshot(page)).world).toBe(before);
 await page.locator('#pauseSettingsButton').click();await expect(page.locator('#settingsPanel')).toBeVisible();await contained(page,'#settingsPanel');
 await page.locator('#settingsDone').click();await page.locator('#pauseHomeButton').click();
 await expect(page.locator('#homePanel .home-actions button:visible')).toHaveCount(2);await expect(page.locator('#settingsButton')).toBeVisible();
 await contained(page,'#homePanel');
 expect(errors).toEqual([]);
});
test('landing preview and home level access load quickly',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await open(page);
 await expect(page.locator('#homePreview')).toBeVisible();
 await expect(page.locator('.home-preview-backdrop')).toHaveJSProperty('complete',true);
 await expect(page.locator('.home-preview-character')).toHaveCount(3);
 expect(await page.locator('#music').getAttribute('src')).toBe('assets/music/sneakers-run-lite.mp3');
 expect(await page.locator('#dialogue').getAttribute('src')).toBe('assets/audio/intro-dialogue.mp3');
 await expect(page.locator('#levelList .level-card')).toHaveCount(10);
 expect(await page.locator('#levelList .level-card').evaluateAll(cards=>cards.filter(card=>getComputedStyle(card.parentElement).gridTemplateColumns.split(' ').length===5).length)).toBe(10);
 await expect(page.locator('#levelList .level-card:disabled')).toHaveCount(9);
 await expect(page.locator('#levelList .lock-icon')).toHaveCount(9);
 await expect(page.locator('#levelList .medal-count')).toHaveCount(0);
 expect((await page.locator('#levelList').innerText()).toLowerCase()).not.toMatch(/marks|medals/);
 await page.locator('#settingsButton').click();
 await page.locator('#unlockAllButton').click();
 await expect(page.locator('#unlockAllButton')).toBeDisabled();await expect(page.locator('#unlockAllButton')).toHaveText('Unlock all levels');
 expect((await snapshot(page)).save.unlocked).toBe(9);await page.locator('#settingsDone').click();
 await expect(page.locator('#levelList .level-card:disabled')).toHaveCount(0);
 await page.reload();await page.waitForFunction(()=>window.__RUN_TEST__?.ready());
 expect((await snapshot(page)).save.unlocked).toBe(9);
 await expect(page.locator('#levelList .level-card:disabled')).toHaveCount(0);
});
test('2 GB profile uses the compact runtime atlas',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'deviceMemory',{configurable:true,value:2}));
 await page.setViewportSize({width:1280,height:800});await open(page);
 const assets=(await snapshot(page)).assets;
 expect(assets.quality).toBe('low');expect(assets.image).toBe('sprites-low.webp');expect(assets.size[0]).toBeLessThan(5120);
});
test('a whole block clears through keyboard events with normal damage enabled',async({page})=>{
 await open(page);await start(page);
 const mirror=new Game();mirror.reset();
 for(let n=0;n<700&&mirror.phase==='running';n++){
  const plan=planInputs(mirror,{depth:10,beam:8});expect(plan.commands.length).toBeGreaterThan(0);
  for(const action of plan.commands){
   if(action==='jump')await page.keyboard.press('Space');
   if(action==='roll'){await page.keyboard.up('ArrowDown');await page.keyboard.down('ArrowDown');}
   if(action==='releaseRoll')await page.keyboard.up('ArrowDown');
   if(action!=='none')mirror.command(action,action==='roll');
   for(let i=0;i<plan.frames&&mirror.phase==='running';i++)mirror.tick();
   await advance(page,plan.frames/120);
  }
 }
 await page.keyboard.up('ArrowDown');
 const state=await snapshot(page);expect(state.phase).toBe('cleared');expect(state.hits).toBe(0);expect(state.coins).toBeGreaterThanOrEqual(40);
 await expect(page.locator('#resultPrimary')).toHaveText('Next level');
 await page.reload();await page.waitForFunction(()=>window.__RUN_TEST__?.ready());expect((await snapshot(page)).save.unlocked).toBe(1);
});
test('stomp feedback keeps rendering and real-time scrolling alive',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await open(page);await start(page);
 await page.evaluate(()=>{window.__RUN_TEST__.scenario('rival',230);window.__RUN_TEST__.command('jump');});
 for(let frame=0;frame<240;frame++){
  await advance(page,1/120);
  if((await snapshot(page)).stomps>0)break;
 }
 const impact=await snapshot(page);expect(impact.stomps).toBeGreaterThan(0);
 await page.evaluate(()=>window.__RUN_TEST__.freeze(false));
 await expect.poll(async()=>(await snapshot(page)).world).toBeGreaterThan(impact.world+180);
 expect((await snapshot(page)).phase).toBe('running');expect(errors).toEqual([]);
});
test('chasers commit to an air drop before the runner lands',async({page})=>{
 await open(page);await start(page);
 await page.evaluate(()=>{window.__RUN_TEST__.clear();window.__RUN_TEST__.command('jump');});
 await advance(page,.24);
 await page.evaluate(()=>window.__RUN_TEST__.command('roll',true));
 await advance(page,.01);
 const state=await snapshot(page);
 expect(state.player.grounded).toBe(false);
 expect(state.player.airAction).toBe('drop');
 expect(state.chasers[0].airAction).toBe('drop');
 expect(state.chasers[0].state).toBe('dropping');
 const chaserJump=state.draws.find(item=>item.name==='chaserJump');
 expect(chaserJump).toBeTruthy();
 expect(chaserJump.anchorY).toBeLessThan(state.view.ground);
});
test('real time requestAnimationFrame advances without debug intervention',async({page})=>{
 await open(page);await start(page);await page.evaluate(()=>window.__RUN_TEST__.freeze(false));
 await expect.poll(async()=>(await snapshot(page)).world).toBeGreaterThan(60);
 await page.keyboard.press('Space');await expect.poll(async()=>(await snapshot(page)).player.y).toBeGreaterThan(30);
 await page.keyboard.press('Escape');const before=(await snapshot(page)).world;await page.waitForTimeout(180);expect((await snapshot(page)).world).toBe(before);
 await page.locator('#resumeButton').click();await expect(page.locator('#countdown')).toBeVisible();
 await expect.poll(async()=>(await snapshot(page)).phase).toBe('running');
 expect((await snapshot(page)).timings.length).toBeGreaterThan(20);
});
test('pointer controls act on press, release capture, and keyboard remapping persists',async({page})=>{
 await open(page);await start(page);await page.evaluate(()=>window.__RUN_TEST__.clear());await page.locator('#jumpButton').dispatchEvent('pointerdown',{pointerId:3,pointerType:'touch'});await advance(page,.05);expect((await snapshot(page)).player.y).toBeGreaterThan(0);
 await page.locator('#jumpButton').dispatchEvent('pointercancel',{pointerId:3,pointerType:'touch'});await advance(page,1.5);
 await page.locator('#rollButton').dispatchEvent('pointerdown',{pointerId:4,pointerType:'touch'});await advance(page,1.3);expect((await snapshot(page)).player.low).toBe(true);
 await page.locator('#rollButton').dispatchEvent('pointercancel',{pointerId:4,pointerType:'touch'});await advance(page,.1);expect((await snapshot(page)).player.low).toBe(false);
 await page.keyboard.press('Escape');await page.locator('#pauseSettingsButton').click();await page.locator('#bindJump').click();await page.keyboard.press('KeyJ');await expect(page.locator('#bindJump')).toHaveText('Jump: J');
 await page.reload();await page.waitForFunction(()=>window.__RUN_TEST__?.ready());expect((await snapshot(page)).save.settings.jumpKey).toBe('KeyJ');
});
test('controller can start, play, pause, adjust settings, return and disconnect',async({page})=>{
 await page.addInitScript(()=>{window.padButtons=Array(17).fill(false);window.padPresent=true;Object.defineProperty(navigator,'getGamepads',{value:()=>window.padPresent?[{index:0,mapping:'standard',connected:true,axes:[0,0],buttons:window.padButtons.map(pressed=>({pressed,value:pressed?1:0}))}]:[]});});
 await open(page);
 async function press(index){await page.evaluate(i=>{window.padButtons[i]=true;window.__RUN_TEST__.poll();window.padButtons[i]=false;window.__RUN_TEST__.poll();},index);}
 await press(0);await expect.poll(async()=>(await snapshot(page)).phase).toBe('running');await press(0);await advance(page,.1);expect((await snapshot(page)).player.y).toBeGreaterThan(0);
 await press(9);expect((await snapshot(page)).phase).toBe('paused');await expect(page.locator('#resumeButton')).toBeFocused();
 await press(13);await press(0);await expect(page.locator('#settingsPanel')).toBeVisible();await press(13);await press(0);await expect(page.locator('#pace')).toHaveValue('relaxed');
 await press(1);await expect(page.locator('#pausePanel')).toBeVisible();await press(1);await expect(page.locator('#countdown')).toBeVisible();
 await page.evaluate(()=>window.__RUN_TEST__.freeze(false));await expect.poll(async()=>(await snapshot(page)).phase).toBe('running');
 await page.evaluate(()=>{window.padPresent=false;window.__RUN_TEST__.poll();});expect((await snapshot(page)).phase).toBe('paused');await expect(page.locator('#pauseReason')).toHaveText('Controller disconnected');
});
test('loading failure is visible and retries; denied saves do not crash',async({page,context})=>{
 await page.route('**/assets/runtime/sprites*.webp*',route=>route.abort());await page.goto(url);await expect(page.locator('#errorPanel')).toBeVisible();await expect(page.locator('#reloadButton')).toBeEnabled();
 await page.unroute('**/assets/runtime/sprites*.webp*');await page.locator('#reloadButton').click();await page.waitForFunction(()=>window.__RUN_TEST__?.ready());
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('denied');};});await start(page);await page.evaluate(()=>window.__RUN_TEST__.finish());await expect(page.locator('#saveNotice')).toBeVisible();await expect(page.locator('#resultPanel')).toBeVisible();
});
test('long-frame and focus recovery do not fast-forward or leave held input',async({page})=>{
 await open(page);await start(page);await page.keyboard.down('ArrowDown');await advance(page,.1);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 const state=await snapshot(page);expect(state.phase).toBe('paused');expect(state.player.heldRoll).toBe(false);
 await page.locator('#resumeButton').click();await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.keyboard.press('Escape');await expect(page.locator('#pausePanel')).toBeVisible();
});
test('resizing redraws the playfield before the browser can present a blank frame',async({page})=>{
 await open(page);await start(page);
 const pixel=await page.evaluate(()=>new Promise(resolve=>{
  const field=document.getElementById('playfield'),canvas=document.getElementById('game');
  const observer=new ResizeObserver(()=>{
   const pixel=canvas.getContext('2d').getImageData(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1).data;
   observer.disconnect();resolve([...pixel]);
  });
  observer.observe(field);field.style.width='calc(100% - 10px)';
 }));
 expect(pixel.slice(0,3).some(value=>value>0)).toBe(true);
});

test('coins rotate through edge views and freeze while paused',async({page})=>{
 await open(page);await start(page);const frames=()=>page.evaluate(()=>window.__RUN_TEST__.snapshot().draws.filter(d=>d.name==='coin').map(d=>d.frame));
 const first=await frames();await advance(page,.17);expect(await frames()).not.toEqual(first);
 await page.keyboard.press('Escape');const stopped=await frames();await advance(page,.5);expect(await frames()).toEqual(stopped);
});
test('static hazard kit renders with floor-locked camera and shared geometry',async({page})=>{
 await open(page);await start(page);
 for(const [type,drawName] of [['spikes','kit:spikes'],['electric','kit:electric'],['train','kit:train'],['checkpoint','kit:checkpoint'],['finish','kit:finish'],['button','kit:button'],['securityGate','kit:gate']]){
  await page.evaluate(t=>window.__RUN_TEST__.scenario(t,120),type);
  const state=await snapshot(page),draw=state.draws.find(item=>item.name===drawName);
  expect(draw,`${type} should be visible in the kit`).toBeTruthy();expect(draw.w).toBeGreaterThan(0);expect(draw.h).toBeGreaterThan(0);
 }
 await page.evaluate(()=>window.__RUN_TEST__.scenario('truck',120));
 const pulseBefore=(await snapshot(page)).draws.filter(item=>item.name==='spark').map(item=>item.frame);
 expect(pulseBefore).toHaveLength(2);await advance(page,.25);
 const pulseAfter=(await snapshot(page)).draws.filter(item=>item.name==='spark').map(item=>item.frame);
 expect(pulseAfter).not.toEqual(pulseBefore);
 await page.evaluate(()=>window.__RUN_TEST__.clear());
 const ground=(await snapshot(page)).view.ground;await page.evaluate(()=>window.__RUN_TEST__.setPlayer({y:380,previousY:380,vy:0,grounded:false,action:'jump'}));
 const apex=await snapshot(page);expect(apex.view.ground).toBe(ground);expect(apex.draws.find(item=>item.name==='jump').anchorY).toBeLessThan(ground);
});

test('street kit sheet props render as distinct obstacles and the staged train charges on approach',async({page})=>{
 await open(page);await start(page);
 for(const type of ['trafficCone','roadworkSign','newspaperBox','fireHydrant','bikeRack','parkingMeter','trashBin','cableSpool','sawhorse','barricadeLamp']){
  await page.evaluate(t=>window.__RUN_TEST__.scenario(t,180),type);
  const state=await snapshot(page),draw=state.draws.find(item=>item.name===type);
  expect(draw,`${type} should render from the parsed street sheet`).toBeTruthy();expect(draw.anchorY).toBeCloseTo(state.view.ground,1);
 }
 await page.evaluate(()=>window.__RUN_TEST__.start(4));
 const before=await snapshot(page),train=before.entities.find(item=>item.type==='train'&&item.rush);
 await page.evaluate(x=>window.__RUN_TEST__.setWorld(x),train.x-224-(train.rush.trigger-40));
 const staged=await snapshot(page),stagedTrain=staged.entities.find(item=>item.type==='train');
 await page.evaluate(()=>window.__RUN_TEST__.advance(.1));
 const moving=await snapshot(page),movingTrain=moving.entities.find(item=>item.type==='train');
 expect(stagedTrain.rush.active).toBe(false);expect(movingTrain.rush.active).toBe(true);expect(movingTrain.x).toBeLessThan(stagedTrain.x);
});

test('obstacle-only mechanics render as readable raster props',async({page})=>{
 await open(page);await start(page);
 for(const type of ['rollingCart','dropGate','oilSlick']){
  await page.evaluate(t=>window.__RUN_TEST__.scenario(t,180),type);
  const state=await snapshot(page),draw=state.draws.find(item=>item.name===`raster:${type}`);
  expect(draw,`${type} should render as a standalone raster obstacle`).toBeTruthy();
  expect(draw.anchorY).toBeCloseTo(state.view.ground,1);
  expect(draw.w).toBeGreaterThan(0);expect(draw.h).toBeGreaterThan(0);
 }
});
test('campaign-specific raster families render from their four-frame families',async({page})=>{
 await open(page);await start(page);
 for(const type of ['subwayCart','subwayToolbox','subwayTurnstile','subwayBench','subwaySignalBox','subwayVendingMachine','subwayTicketMachine','subwayEmergencyBox','subwayPlatformSign','subwayRailJunction','subwayTrackSwitch','factoryBelt','factoryPress','factoryShoePile','factoryLaceBin','factoryThreadCart','factoryLabelRoll','factoryRobotArm','factorySneakerMold','factoryLaceSpool','factoryBoxRunner','factoryShoeDryer','factorySneakerTray','yamRoller','yamCrate','yamHarvestCrate','yamWheelbarrow','yamSackBundle','yamFieldFence','yamHarvestBasket','yamIrrigationWheel','yamIrrigationSprinkler','yamScarecrow','yamGobbler','chinatownDrumCart','chinatownLionCart','chinatownLanternGate','chinatownShopSign','chinatownLanternCluster','chinatownShopShutter','chinatownLanternPole','chinatownMarketCrate','chinatownFanStand','chinatownSteamCart','rooftopDish','rooftopDishArray','rooftopAntenna','rooftopClothesline','rooftopClotheslineFlutter','rooftopBirdFlock','rooftopWaterTank','airportSecurityDog','airportBaggageBot','airportSuitcases','airportBaggageCluster','airportBaggageCarousel','airportBoardingGate','airportBoardingStanchion','airportTugCart','airportJetway','airportStairs','airportDepartureBoard','airportSecurityScanner','airportRunwayCone','rooftopFan','sunsetBarrier','sunsetSignal','sunsetNeonSign','sunsetBollards','sunsetLitSign','sneakerRack','sneakerShopRope','sneakerShopPolishCart','sneakerLaceDisplay','sneakerBoxTower','sneakerShopWindow','sneakerFittingMirror','sneakerBoxStack','victoryFan','victoryFoamFinger','victoryBanner','victoryConfettiPopper','victoryPennant','victoryDrum','victoryScarf','victoryRibbonBouquet','victoryStarBadge','victoryBalloonCluster','victoryStarWreath','victoryChampionCrown','victoryPomPoms','victoryScarfStand','victoryMegaphone','victoryBarrelStack','sneakerMascot']){
  await page.evaluate(t=>window.__RUN_TEST__.scenario(t,180),type);
  const state=await snapshot(page),draw=state.draws.find(item=>item.name===type);
  expect(draw,`${type} should render from its packed raster family`).toBeTruthy();
  expect(draw.anchorY).toBeCloseTo(state.view.ground,1);
  expect(draw.w).toBeGreaterThan(0);expect(draw.h).toBeGreaterThan(0);
 }
});

test('all ten authored level openings keep a distinct, readable floor composition', async ({ page }) => {
 await open(page);const ground=[];const lengths=[];const names=[];
 for(let stage=0;stage<10;stage++){
  await page.evaluate(s=>window.__RUN_TEST__.start(s),stage);
  const state=await snapshot(page);ground.push(state.view.ground);lengths.push(state.length);names.push(await page.locator('#chapterName').innerText());
  expect(state.screen).toBe('running');expect(state.draws.find(item=>item.name==='run')).toBeTruthy();
  expect(state.draws.find(item=>item.name.startsWith('chaser'))).toBeTruthy();
  for(const sprite of state.draws.filter(item=>item.name==='run'||item.name.startsWith('chaser'))){
   expect(sprite.x).toBeGreaterThanOrEqual(0);expect(sprite.y).toBeGreaterThanOrEqual(0);expect(sprite.y+sprite.h).toBeLessThanOrEqual(state.view.height+.5);
  }
 }
 expect(new Set(names).size).toBe(10);expect(new Set(lengths).size).toBeGreaterThanOrEqual(3);expect(new Set(ground).size).toBe(1);expect(lengths.every(length=>length>20000)).toBe(true);
});

test('latest raster batch renders from its four-frame families',async({page})=>{
 await open(page);await start(page);
 for(const type of ['subwayPlatformUmbrella','airportSecurityTray','factoryBoxChute','chinatownSteamBasket','rooftopCableAnchor','victoryConfettiCannon','airportJetwayChock','yamIrrigationWindmill','factoryLaceBundle','rooftopValveFlag','sneakerShopBench','victoryHandPennant','chinatownFirecrackerCrate','subwaySignalLantern','victoryCrowdDrum','airportJetwayDoor','factoryPolishWheel','rooftopPigeonCrate','subwayPlatformWarningLamp','yamHayBale','sneakerSalePennants']){
  await page.evaluate(t=>window.__RUN_TEST__.scenario(t,180),type);
  const state=await snapshot(page),draw=state.draws.find(item=>item.name===type);
  expect(draw,`${type} should render from its packed raster family`).toBeTruthy();
  expect(draw.anchorY).toBeCloseTo(state.view.ground,1);expect(draw.w).toBeGreaterThan(0);expect(draw.h).toBeGreaterThan(0);
 }
});

test('new airport factory and victory raster families render from their packed frames',async({page})=>{
 await open(page);await start(page);
 for(const type of ['airportSuitcasePile','factoryGluePuddle','victoryBossBarrel']){
  await page.evaluate(t=>window.__RUN_TEST__.scenario(t,180),type);
  const state=await snapshot(page),draw=state.draws.find(item=>item.name===type);
  expect(draw,`${type} should render from its packed raster family`).toBeTruthy();
  expect(draw.anchorY).toBeCloseTo(state.view.ground,1);expect(draw.w).toBeGreaterThan(0);expect(draw.h).toBeGreaterThan(0);
 }
});

test('direct file launch keeps the game playable from the desktop designer', async ({ page }) => {
 await page.goto(new URL('../index.html?test=1&file-test=1', import.meta.url).href);
 await page.waitForFunction(()=>window.__RUN_TEST__?.ready());
 await expect(page.locator('#startButton')).toBeEnabled();
 await page.locator('#startButton').click();
 await expect.poll(async()=>page.evaluate(()=>window.__RUN_TEST__.snapshot().phase)).toBe('running');
 expect(await page.locator('#app').getAttribute('data-screen')).toBe('running');
});
