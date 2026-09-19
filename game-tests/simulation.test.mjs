import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, FixedClock, STEP, PHYSICS, PLAYER_X, SHAPES, playerBox, hazardBox } from '../game/simulation.js';
import { LEVELS, makeRoute } from '../game/routes.js';
import { readSave, writeSave, recordResult, SAVE_KEY } from '../game/save.js';

const ticks = (g, seconds) => { for (let n = 0; n < Math.round(seconds / STEP); n++) g.tick(); };
function empty() { const g = new Game(); g.reset(); g.entities = []; g.pickups = []; g.routeLength = Infinity; return g; }
function hazard(g, type, delta) { const e = { type, x: g.world + PLAYER_X + delta, width: SHAPES[type].width, hit: false, passed: false }; g.entities.push(e); return e; }

import {drive,planInputs} from './driver.mjs';
export {drive};
test('all ten multilevel routes clear through real inputs at both paces',()=>{
 for(const difficulty of ['standard','relaxed'])for(let stage=0;stage<LEVELS.length;stage++){
  const g=new Game();g.reset({stage,difficulty});let plans=0,maxElevation=0;
  while(g.phase==='running'&&plans++<700){let plan=planInputs(g,{depth:16,beam:12});if(!plan.commands.length)plan=planInputs(g,{depth:20,beam:24});assert.ok(plan.commands.length,`No safe continuation ${stage} ${difficulty} at ${g.world}`);
   for(const action of plan.commands){if(action!=='none')g.command(action,action==='roll');for(let n=0;n<plan.frames&&g.phase==='running';n++){g.tick();maxElevation=Math.max(maxElevation,g.player.y);g.drainEvents();}}
  }
  assert.equal(g.phase,'cleared',`${stage} ${difficulty}`);assert.equal(g.hits,0,`${stage} ${difficulty}`);assert.ok(g.coins>=40);assert.ok(maxElevation>300);assert.ok(g.stomps>0);
 }
});
test('no input loses through real collisions; hit immunity cannot be renewed by one obstacle', () => {
  const g = empty(); const e = hazard(g, 'car', 0); g.tick();
  assert.equal(g.lives, 2); assert.equal(e.hit, true); ticks(g, .5); assert.equal(g.lives, 2);
  g.entities = []; ticks(g, 1); hazard(g, 'barrier', 0); g.tick(); assert.equal(g.lives, 1);
  ticks(g, 1.3); hazard(g, 'car', 0); g.tick(); assert.equal(g.phase, 'gameover');
});
test('low beam hits upright body; held, tapped, and safely exiting rolls all fit', () => {
  let g = empty(); hazard(g, 'gate', 0); g.tick(); assert.equal(g.hits, 1);
  for (const held of [false, true]) {
    g = empty(); hazard(g, 'gate', 75); g.command('roll', held); g.command('releaseRoll'); ticks(g, 1.2);
    assert.equal(g.hits, 0); assert.equal(g.player.low, false);
  }
});
test('double jump is limited, bounded, and buffered on landing', () => {
  const g = empty(); g.command('jump'); ticks(g, .15); g.command('jump'); g.tick();
  const vy = g.player.vy; g.command('jump'); g.tick(); assert.ok(g.player.vy < vy);
  let max = 0; for (let i = 0; i < 200; i++) { g.tick(); max = Math.max(max, g.player.y); }
  assert.ok(max <= PHYSICS.maxHeight); assert.equal(g.player.grounded, true);
  g.command('jump'); ticks(g, .2); g.command('jump'); ticks(g, .65);
  while (g.player.y > 30) g.tick();
  g.command('jump'); ticks(g, .14); assert.ok(g.player.vy > 0, 'late third press buffers until landing');
});
test('jump is safe and buffered while rolling beneath a beam', () => {
  const g = empty(); hazard(g, 'gate', 0); g.command('roll'); g.tick(); g.command('jump'); g.tick();
  assert.equal(g.player.low, true); assert.equal(g.hits, 0); assert.ok(g.player.jumpBuffer > 0);
});
test('platform contact uses the visible front top, with coyote time at the edge', () => {
  const g = empty(), e = hazard(g, 'platform', 0);
  g.player.y = SHAPES.platform.top + 2; g.player.vy = -100; g.player.grounded = false;
  ticks(g, .03); assert.equal(g.player.y, SHAPES.platform.top); assert.equal(g.player.grounded, true);
  while (g.player.grounded) g.tick();
  assert.ok(g.player.coyote > 0); g.command('jump'); g.tick(); assert.equal(g.player.jumps, 1);
  assert.ok(g.player.vy > 0);
});
test('a supported skateboard rival can jump down and lands on the street line',()=>{
 const g=empty(),rival={type:'rival',x:g.world+PLAYER_X+250,y:260,width:SHAPES.rival.width,ledgeDrop:true,direction:-1};
 g.entities=[rival];g.tick();assert.equal(rival.dropping,true);assert.ok(rival.y>260);
 ticks(g,1.5);assert.equal(rival.y,0);assert.equal(rival.dropping,false);assert.equal(rival.ledgeDrop,false);
});
test('a low frame rate cannot tunnel through obstacles or change the run', () => {
  const run = fps => { const g = empty(); hazard(g, 'barrier', 400); const clock = new FixedClock(g);
    for (let i = 0; i < fps * 3; i++) clock.advance(1 / fps); return g.snapshot(); };
  const baseline = run(120);
  for (const fps of [15, 30, 60, 144]) assert.deepEqual(run(fps), baseline, `${fps} Hz`);
});
test('pause freezes physics, releases held controls, and restarts without stale input', () => {
  const g = empty(); g.command('roll', true); g.tick(); g.pause(); const before = g.snapshot();
  ticks(g, 2); assert.deepEqual(g.snapshot(), before); g.resume(); ticks(g, 1.2); assert.equal(g.player.low, false);
  g.reset(); assert.equal(g.hits, 0); assert.equal(g.player.low, false); assert.equal(g.time, 0);
});
test('shield absorbs one hit; regular recovery, scoring and magnet still function', () => {
  const g = empty(); g.shield = true; hazard(g, 'barrier', 0); g.tick(); assert.equal(g.lives, 3); assert.equal(g.shield, false);
  g.pickups.push({ type: 'magnet', x: g.world + PLAYER_X, y: 55 }); g.tick(); assert.ok(g.magnet > 0);
  g.pickups.push({ type: 'coin', x: g.world + PLAYER_X + 160, y: 130 }); ticks(g, .3);
  assert.equal(g.coins, 1); assert.equal(g.score, 25);
});
test('delivery boss needs three clean stomps without changing runner controls', () => {
  const g = empty(); const e = hazard(g, 'deliveryBoss', 120); e.bossHealth = SHAPES.deliveryBoss.bossHealth;
  g.stomp(e); assert.equal(e.dead, undefined); assert.equal(e.bossHealth, 2); assert.equal(g.hits, 0);
  g.stomp(e); assert.equal(e.dead, undefined); assert.equal(e.bossHealth, 1);
  g.stomp(e); assert.equal(e.dead, true); assert.equal(e.bossHealth, 0); assert.equal(g.stomps, 3);
  assert.equal(g.player.heldRoll, false);
});
test('seeded endless compounds are reproducible, varied and bounded',()=>{
 for(const seed of [1,42,881]){
  const g=new Game();g.reset({mode:'endless',stage:9,seed});let plans=0;
  while(g.time<75&&plans++<260){const plan=planInputs(g);assert.ok(plan.commands.length);for(const action of plan.commands){if(action!=='none')g.command(action,action==='roll');for(let i=0;i<plan.frames;i++){g.tick();g.drainEvents();assert.ok(g.entities.length<35);assert.ok(g.pickups.length<150);}}}
  assert.equal(g.hits,0);assert.equal(g.phase,'running');assert.ok(g.stomps>0);
 }
});
test('save validation handles corruption, storage denial, separate records and unlocks', () => {
  let raw; const storage = { getItem: key => key === SAVE_KEY ? raw : null, setItem: (_, value) => raw = value };
  raw = '{oops'; let save = readSave(storage); assert.equal(save.unlocked, 0);
  raw = JSON.stringify({version:2,unlocked:-1,settings:{music:99,jumpKey:'Escape',rollKey:'Escape'}});
  save = readSave(storage); assert.equal(save.settings.music, 1); assert.equal(save.settings.jumpKey, 'Space');
  const g = empty(); g.phase = 'cleared'; g.coins = 50; g.score = 500;
  save = recordResult(save, g); assert.equal(save.unlocked, 1); assert.deepEqual(save.records['standard:0'].stars, [true,true,true]);
  g.mode = 'endless'; g.phase = 'gameover'; g.world = 10000; save = recordResult(save, g);
  assert.equal(save.endless.standard.meters, 1000); assert.equal(writeSave(storage, save), true);
  assert.deepEqual(readSave(storage), save);
  assert.equal(writeSave({setItem(){throw Error('blocked');}}, save), false);
});

test('a second jump always improves height and never shortens airtime',()=>{
 const measure=second=>{const g=empty();g.command('jump');let max=0;do{if(second!==null&&Math.abs(g.time-second)<STEP/2)g.command('jump');g.tick();max=Math.max(max,g.player.y);}while(!g.player.grounded);return {max,time:g.time};};
 const single=measure(null);for(const time of [.05,.1,.2,.3,.45,.6,.8]){const jump=measure(time);assert.ok(jump.max>=single.max,`${time}: ${jump.max} < ${single.max}`);assert.ok(jump.time>=single.time,`${time}: shortened jump`);assert.ok(jump.max<=PHYSICS.maxHeight);}
});
test('loaded controls reject reserved keys and permanent opposite-action aliases',()=>{
 for(const [key,value] of [['jumpKey','KeyP'],['jumpKey','KeyR'],['jumpKey','KeyS'],['rollKey','ArrowUp'],['rollKey','KeyW']]){
  const save=readSave({getItem:()=>JSON.stringify({version:2,settings:{[key]:value}})});assert.notEqual(save.settings[key],value);
 }
});
