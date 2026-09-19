import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateAssets,checkReview} from '../tools/check-rebuild-review.mjs';
import {SHAPES,LEVEL_SIGNATURES,STREET_KIT_ASSETS} from '../game/config.js';
import {compactSprites,chooseManifest} from '../game/load-manifest.js';
const atlas=JSON.parse(readFileSync(new URL('../assets/runtime/sprites.json',import.meta.url)));

test('oversized atlases use bounded delivery textures even on desktop',()=>{
 const selected=chooseManifest(atlas);
 assert.equal(selected.image,'sprites-low.webp');
 assert.equal(selected.compactAtlasActive,true);
 assert.ok(selected.size[0]*selected.size[1]<20_000_000);
 assert.equal(selected.sprites.run[0].width,atlas.sprites.run[0].width);
 assert.equal(selected.sprites.run[0].pivotY,atlas.sprites.run[0].pivotY);
});

test('every shipping sprite uses unchanged raster sources and a valid world footprint',()=>assert.deepEqual(validateAssets(),[]));
test('the retired service tunnel is absent from the shipping atlas',()=>{
 assert.equal(atlas.sprites.tunnel,undefined);
 assert.equal(Object.keys(atlas.sources).some(source=>source.includes('roll-tunnel')),false);
});
test('the complete roll art fits the beam; supports and characters have stable pivots',()=>{
 for(const frame of atlas.sprites.roll)assert.ok(frame.height<SHAPES.gate.solids[0][1]);
 for(const name of ['jump','roll','land','platform'])for(const frame of atlas.sprites[name]){
  assert.equal(frame.pivotY,frame.height);assert.equal(frame.pivotX,frame.width/2);
 }
});
test('the parked car ships as a two-frame wheel-anchored engine idle',()=>{
 const frames=atlas.sprites.car;
 assert.equal(frames?.length,2);
 assert.ok(Object.keys(atlas.sources).some(source=>source.endsWith('/car-idle-v2.png')));
 assert.ok(frames[1].height>frames[0].height*1.15);
 assert.equal(frames[0].pivotY,frames[0].height);
 assert.equal(frames[1].pivotY,frames[1].height);
});
test('the two pursuers have independent eight-frame source lists',()=>{
 assert.equal(atlas.sprites.chaser.length,8);assert.equal(atlas.sprites.chaser2.length,8);
 assert.notEqual(atlas.sprites.chaser[0].character,atlas.sprites.chaser2[0].character);
 assert.ok(Object.keys(atlas.sources).some(source=>source.endsWith('/run-gray-suit-v1.png')));
 assert.ok(Object.keys(atlas.sources).some(source=>source.endsWith('/run-blue-suit-v1.png')));
 for(const name of ['chaser','chaser2'])for(const frame of atlas.sprites[name]){
  assert.equal(frame.registration,'head-axis / shared ground',name);
  assert.ok(frame.pivotY>=frame.height,name);assert.ok(frame.pivotX>=0&&frame.pivotX<=frame.width,name);
 }
});
test('the two pursuers have matching intro, finish, jump, and roll families',()=>{
 const families=[['chaserStart','chaser2Start',6,'start-point','head-axis / shared ground'],
  ['chaserFinish','chaser2Finish',6,'out-of-breath','head-axis / shared ground'],
  ['chaserJump','chaser2Jump',4,'jump','head-axis / action anchor'],
  ['chaserRoll','chaser2Roll',4,'roll','head-axis / action anchor']];
 for(const [gray,blue,count,action,registration] of families){
  for(const name of [gray,blue]){
   const frames=atlas.sprites[name];assert.equal(frames.length,count,name);
   for(const frame of frames){assert.equal(frame.action,action,name);assert.equal(frame.registration,registration,name);assert.ok(frame.character,name);}
  }
 }
 assert.equal(atlas.sprites.chaserJump[0].character, 'gray-suit-bald');
 assert.equal(atlas.sprites.chaser2Roll[0].character, 'blue-suit-brown-haired');
});
test('the delivery boss keeps a four-frame generated raster family with shared registration',()=>{
 const frames=atlas.sprites.deliveryBoss;
 assert.equal(frames?.length,4);
 assert.equal(Object.keys(atlas.sources).filter(source=>source.includes('delivery-boss/run-v2-frames')).length,4);
 for(const frame of frames){
  assert.equal(frame.character,'delivery-courier');
  assert.equal(frame.action,'run');
  assert.equal(frame.registration,'head-axis / shared ground');
  assert.ok(frame.pivotY>=frame.height&&frame.pivotX>=0&&frame.pivotX<=frame.width);
 }
});
test('visual review cannot silently survive a changed input',()=>{
 const review={status:'locally-reviewed',reviewer:'test',date:'2026-09-16',criteria:Object.fromEntries(['runnerStyle','protectedCharacters','cameraComposition','laneReadability','uiHierarchy','collisionGeometry'].map(k=>[k,{verdict:'pass',evidence:'inspected'}])),fingerprints:{renderer:'old'}};
 assert.deepEqual(checkReview(review,{renderer:'old'}),[]);
 assert.ok(checkReview(review,{renderer:'new'}).some(e=>e.includes('stale')));
});

test('all eight whole-character phases use explicit registration; flight keeps air under the shoes',()=>{
 const frames=atlas.sprites.run;assert.equal(frames.length,8);assert.equal(new Set(frames.map(f=>f.phase)).size,8);
 for(const f of frames){assert.equal(f.registration,'authored pelvis / ground');if(f.phase.startsWith('flight'))assert.ok(f.pivotY>f.height+5);}
 assert.equal(atlas.sprites.coin.length,8);assert.ok(atlas.sprites.coin[2].width<atlas.sprites.coin[0].width*.4);
});
test('run poses keep a padded source canvas and never touch a sheet edge',()=>{
 for(const frame of atlas.sprites.run){
  const source=frame.file;
  const png=readFileSync(new URL(`../${source}`,import.meta.url));
  assert.equal(png.readUInt32BE(0),0x89504e47,source);
  assert.equal(png.readUInt32BE(16),512,source);
  assert.equal(png.readUInt32BE(20),512,source);
  const [left,top,right,bottom]=frame.source;
  assert.ok(left>=8&&top>=8&&right<=504&&bottom<=504,`${source} alpha bounds touch its canvas edge`);
 }
});
test('every level signature is a grounded decorative raster with no hidden collider',()=>{
 for(const type of LEVEL_SIGNATURES){
  const shape=SHAPES[type],frame=atlas.sprites[shape.art]?.[0];
  assert.ok(shape && frame,type);
  assert.equal(shape.decorative,true,type);assert.equal(shape.move,'route',type);
  assert.deepEqual(shape.solids,[],type);assert.equal(frame.registration,'authored ground / level signature',type);
  assert.equal(frame.pivotY,frame.height,type);assert.equal(frame.pivotX,frame.width/2,type);
  assert.ok(Math.abs(frame.width-shape.width)<1,type);assert.ok(Math.abs(frame.height-shape.height)<4,type);
 }
});
test('the ten-piece street kit keeps alpha-derived hitboxes with deterministic sheet cells',()=>{
 for(const type of STREET_KIT_ASSETS){
  const shape=SHAPES[type],frame=atlas.sprites[type]?.[0];
  assert.ok(shape && frame,type);assert.equal(frame.registration,'smart alpha grid / street kit',type);
  assert.ok(Array.isArray(frame.cell)&&frame.cell.length===2,type);
  assert.ok(Array.isArray(frame.hitbox)&&frame.hitbox.length===4,type);
  const [x,y,w,h]=frame.hitbox;assert.equal(y,0,type);assert.ok(x>=0&&w>0&&h>0&&x+w<=shape.width+1&&h<=shape.height+1,type);
  const solid=shape.solids[0];for(let i=0;i<4;i++)assert.ok(Math.abs(solid[i]-frame.hitbox[i])<.01,type);
 }
});

test('looping raster dressing has eight grounded frames and the atlas is content-pinned',()=>{
 const loopNames=['loopBarrel','loopDumpster','loopVendorCart','loopTurnstile','loopLamp','loopNewspaper','loopTaxi','loopBus','loopVent','loopPuddle'];
 for(const name of loopNames){
  const frames=atlas.sprites[name];assert.equal(frames?.length,8,name);
  for(const frame of frames){
   assert.equal(frame.loop,true,name);assert.equal(frame.fps,4,name);
   assert.equal(frame.registration,'looping alpha cell / shared baseline',name);
   assert.ok(frame.pivotY>=frame.height,name);assert.equal(frame.pivotX,frame.width/2,name);
   assert.ok(frame.sourceFrame>=0&&frame.sourceFrame<8,name);
  }
 }
 const bytes=readFileSync(new URL('../assets/runtime/sprites.webp',import.meta.url));
 assert.equal(atlas.atlasHash,createHash('sha256').update(bytes).digest('hex'));
});

test('low-memory atlas is half-resolution and content-pinned',()=>{
 const compact=atlas.lowMemory;assert.ok(compact);
 assert.deepEqual(compact.size,[Math.floor(atlas.size[0]/2),Math.ceil(atlas.size[1]/2)]);
 const bytes=readFileSync(new URL('../assets/runtime/sprites-low.webp',import.meta.url));
 assert.equal(compact.atlasHash,createHash('sha256').update(bytes).digest('hex'));
 const full=atlas.sprites.run[0],low=compactSprites(atlas.sprites).run[0];
 for(const [name,frames] of Object.entries(atlas.sprites))for(const [index,frame] of frames.entries()){
  const compactFrame=compactSprites({[name]:[frame]})[name][0];
  for(const key of ['width','height','pivotX','pivotY'])assert.equal(compactFrame[key],frame[key],`${name}:${index} ${key} must match collision geometry`);
  assert.deepEqual(compactFrame.rect,frame.rect.map(value=>Math.round(value/2)));
 }
 assert.deepEqual(low.source,full.source);
});
