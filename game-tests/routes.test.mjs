import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {makeRoute,LEVELS,endlessSection,SECTION_LENGTH,PLATFORM_RULES} from '../game/routes.js';
import {SHAPES,PLAYER_X,topFaces,solidBoxes} from '../game/config.js';
const boxesOverlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
test('every block has traversable height choices and enemies; every gameplay family appears',()=>{
 const used=new Set(),powers=new Set();
 for(let stage=0;stage<LEVELS.length;stage++){
  const route=makeRoute(stage),heights=new Set();
  for(const e of route.entities){used.add(e.type);for(const f of topFaces(e))heights.add(Math.round(f.y));}
  for(const p of route.pickups)powers.add(p.type);
  assert.ok(heights.size>=5,`block ${stage+1} lacks varied surfaces`);
  assert.ok(route.entities.some(e=>SHAPES[e.type].enemy&&e.y===0));
  assert.ok(Math.max(...heights)>300);
 }
 for(const type of ['chinatownDragon','chinatownDrumCart','chinatownLionCart','chinatownLanternGate','chinatownShopSign','chinatownLanternCluster','chinatownShopShutter','chinatownLanternPole','chinatownMarketCrate','chinatownFanStand','chinatownSteamCart','subwayConductor','subwayCart','subwayToolbox','subwayTurnstile','subwayBench','subwaySignalBox','subwayVendingMachine','subwayTicketMachine','subwayEmergencyBox','subwayPlatformSign','subwayRailJunction','subwayTrackSwitch','subwayPlatformWarningLamp','airportHandler','airportCart','airportSecurityDog','airportBaggageBot','airportSuitcases','airportBaggageCluster','airportBaggageCarousel','airportBoardingGate','airportBoardingStanchion','airportTugCart','airportJetway','airportStairs','airportDepartureBoard','airportSecurityScanner','airportRunwayCone','yamCreature','yamScarecrow','yamGobbler','yamDrop','yamRoller','yamCrate','yamHarvestCrate','yamWheelbarrow','yamSackBundle','yamFieldFence','yamHarvestBasket','yamIrrigationWheel','yamIrrigationSprinkler','yamHayBale','factoryWorker','factoryBoxRunner','factoryBelt','factoryPress','factoryShoePile','factoryLaceBin','factoryThreadCart','factoryLabelRoll','factoryRobotArm','factorySneakerMold','factoryLaceSpool','factoryShoeDryer','factorySneakerTray','rooftopDish','rooftopDishArray','rooftopFan','rooftopAntenna','rooftopClothesline','rooftopClotheslineFlutter','rooftopBirdFlock','rooftopWaterTank','sunsetBarrier','sunsetSignal','sunsetNeonSign','sunsetBollards','sunsetLitSign','sneakerRack','sneakerShopRope','sneakerShopPolishCart','sneakerLaceDisplay','sneakerBoxTower','sneakerShopWindow','sneakerFittingMirror','sneakerBoxStack','sneakerSalePennants','victoryFan','victoryBanner','victoryDrum','victoryBarrelStack','sneakerMascot','suitBoss'])assert.ok(used.has(type),`missing campaign family ${type}`);
 for(const type of ['airportSuitcasePile','factoryGluePuddle','victoryBossBarrel'])assert.ok(used.has(type),`missing campaign family ${type}`);
 assert.ok([...used].every(type=>SHAPES[type]),'route references an unregistered gameplay family');
 for(const type of ['coin','shield','magnet','speed'])assert.ok(powers.has(type));
});
test('each authored block carries grounded signature beats for its setting',()=>{
 const signatures=new Set();
  for(let stage=0;stage<LEVELS.length;stage++){
  const route=makeRoute(stage),dressing=route.entities.filter(e=>e.decorative);
  assert.ok(dressing.length>=3,`block ${stage+1} needs at least three setting landmarks`);
  const arrival=route.entities.filter(entity=>entity.backgroundGroup==='finish-arrival');
  assert.equal(arrival.length,stage===LEVELS.length-1?4:2,`block ${stage+1} should keep its finish arrival sparse`);
  for(const item of dressing){assert.equal(item.y,0);assert.equal(item.background,true);assert.equal(solidBoxes(item).length,0);signatures.add(item.type);}
 }
 assert.equal([...signatures].some(type=>type.startsWith('loop')),false,'finish dressing should not use looping prop clutter');
 assert.ok(signatures.has('victoryBanner')&&signatures.has('victoryDrum'),'the victory approach needs two legible arrival cues');
});
test('the campaign is authored as ten distinct beat decks with place-specific finales',()=>{
 const beatIds=new Set(),finales=new Set();
 for(let stage=0;stage<LEVELS.length;stage++){
  const level=LEVELS[stage],route=makeRoute(stage);
  assert.equal(level.beats.length,level.sections.length,`block ${stage+1} beat count drifted from its chapter plan`);
  assert.equal(route.design.chapter,level.name);
  assert.deepEqual(route.design.beats.slice(0,level.beats.length),level.beats.map(beat=>beat.id));
  assert.ok(route.design.beats.length>level.beats.length,`block ${stage+1} should develop across the whole song`);
  assert.ok(level.beats.every(beat=>beat.id&&beat.pattern&&beat.signature&&beat.kit&&beat.enemy&&beat.enemy2&&beat.reward));
  for(const beat of level.beats){assert.equal(beatIds.has(beat.id),false,`duplicate authored beat ${beat.id}`);beatIds.add(beat.id);}
  finales.add(level.finale);
  const authored=route.entities.filter(entity=>entity.id.startsWith(`${level.beats[0].id}:`));
  assert.ok(authored.length>=8,`block ${stage+1} should contain a full authored compound`);
 }
 assert.equal(beatIds.size,60);
 assert.equal(finales.size,10);
});

test('song-length chapters keep enemies grounded and separate duck beams from decks',()=>{
 for(let stage=0;stage<LEVELS.length;stage++)for(const difficulty of ['relaxed','standard']){
  const level=LEVELS[stage],route=makeRoute(stage,difficulty);
  assert.ok(Math.abs(route.duration-level.songSeconds*.8)<.001,`block ${stage+1} does not use 80% of its song`);
  const supports=route.entities.filter(entity=>!entity.decorative&&!SHAPES[entity.type].enemy);
  for(const enemy of route.entities.filter(entity=>SHAPES[entity.type].enemy)){
   if(enemy.y===0)continue;
   const center=enemy.x+enemy.width/2;
   assert.ok(supports.some(support=>topFaces(support).some(face=>Math.abs(face.y-enemy.y)<.01&&center>=face.x&&center<=face.x+face.w)),`block ${stage+1} floats ${enemy.type}`);
  }
  const beams=route.entities.filter(entity=>['barrier','securityGate','dropGate'].includes(entity.type));
  const decks=route.entities.filter(entity=>['platform','fireEscape'].includes(entity.type));
  for(const beam of beams)for(const deck of decks)
   assert.equal(beam.x<deck.x+deck.width&&beam.x+beam.width>deck.x,false,`block ${stage+1} stacks ${beam.type} under ${deck.type}`);
  }
});

test('background traffic is visual-only and platforms stay inside the double-jump ceiling',()=>{
 for(let stage=0;stage<LEVELS.length;stage++){
  const route=makeRoute(stage);
  for(const entity of route.entities.filter(entity=>entity.background))assert.equal(solidBoxes(entity).length,0,`block ${stage+1} gives background ${entity.type} a collider`);
  for(const platform of route.entities.filter(entity=>['platform','fireEscape'].includes(entity.type)))
   assert.ok(Math.max(...topFaces(platform).map(face=>face.y),0)<=PLATFORM_RULES.maxPlatformTop,`block ${stage+1} puts ${platform.type} above the double-jump ceiling`);
  const dense=[];
  for(let x=0;x<route.finishX;x+=2400){const count=route.entities.filter(entity=>entity.background&&!entity.backgroundGroup&&entity.x>=x&&entity.x<x+2400).length;if(count>3)dense.push(count);}
  assert.equal(dense.length,0,`block ${stage+1} crowds its background track`);
 }
});

test('chapter finales use distinct setting-specific sequences instead of the generic hazard pile',()=>{
 const sequences=[];
 for(let stage=0;stage<LEVELS.length;stage++){
  const route=makeRoute(stage),finale=route.entities.filter(entity=>entity.x>route.finishX-7600&&!entity.decorative).map(entity=>entity.type);
  assert.ok(!['securityGate','train','spikes','electric'].every(type=>finale.includes(type)),`block ${stage+1} repeats the generic finale pile`);
  sequences.push(finale.filter(type=>type!=='coin').join(','));
 }
 assert.equal(new Set(sequences).size,LEVELS.length);
});
test('each authored chapter keeps a distinct raster scene plate',()=>{
 const scenes=LEVELS.map(level=>level.scene);
 assert.equal(new Set(scenes).size,10);
 for(const scene of scenes)assert.ok(existsSync(`assets/imagegen/streets-v2/${scene}`),`missing scene plate ${scene}`);
});
test('story layouts are seeded, repeatable, and bounded by platform rules',()=>{
 const a=makeRoute(4,'standard',12345),b=makeRoute(4,'standard',12345),c=makeRoute(4,'standard',54321);
 assert.deepEqual(a.design,b.design);
 assert.notDeepEqual(a.design.variants,c.design.variants);
 assert.equal(a.design.seed,12345);
 assert.equal(a.design.rules.reactionWindow,240);
 assert.ok(a.design.variants.every(variant=>variant>=0&&variant<3));
});

test('every chapter has a clear three-hit boss arena with no solid overlaps',()=>{
 for(let stage=0;stage<LEVELS.length;stage++){
  const route=makeRoute(stage),bossType=stage===LEVELS.length-1?'suitBoss':'deliveryBoss',bosses=route.entities.filter(entity=>entity.type===bossType);
  assert.equal(bosses.length,1,`block ${stage+1} needs one finale boss`);
  const boss=bosses[0]; assert.equal(boss.bossHealth,3);
  const next=route.entities.filter(entity=>!entity.decorative&&solidBoxes(entity).length&&entity.x>boss.x).sort((a,b)=>a.x-b.x)[0];
  assert.ok(next&&next.x-(boss.x+boss.width)>=90,`block ${stage+1} needs a recovery runway after the boss`);
  const solids=route.entities.filter(entity=>!entity.decorative&&solidBoxes(entity).length);
  for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++)for(const first of solidBoxes(solids[i]))for(const second of solidBoxes(solids[j]))
   assert.equal(boxesOverlap(first,second),false,`block ${stage+1} overlaps ${solids[i].type} and ${solids[j].type}`);
 }
});

test('replayed campaign beats retain their local authored layouts at both paces',()=>{
 const seeds=[1,42,881,12345],mechanics=new Set(['rollingCart','dropGate','oilSlick']);
 for(const difficulty of ['relaxed','standard'])for(const seed of seeds)for(let stage=0;stage<LEVELS.length;stage++){
  const route=makeRoute(stage,difficulty,seed),beatCount=LEVELS[stage].beats.length;
  if(route.design.beats.length<beatCount*2)continue;
  const layout=(sectionIndex)=>{
   const start=PLAYER_X+900+sectionIndex*SECTION_LENGTH,end=start+SECTION_LENGTH;
   return route.entities.filter(entity=>entity.x>=start&&entity.x<end&&!entity.background&&!mechanics.has(entity.type)).map(entity=>entity.type).sort();
  };
  for(let beat=0;beat<beatCount;beat++)assert.deepEqual(layout(beat+beatCount),layout(beat),`seed ${seed}, block ${stage+1}, beat ${beat+1} drifted after one authored deck`);
 }
});

test('authored props stay within their beat and elevated static solids have support',()=>{
 const seeds=[1,42,881,12345],staticProps=new Set(['sunsetSignal','chinatownLanternCluster','chinatownShopSign','yamDrop']);
 for(const difficulty of ['relaxed','standard'])for(const seed of seeds)for(let stage=0;stage<LEVELS.length;stage++){
  const route=makeRoute(stage,difficulty,seed),sectionCount=route.design.beats.length;
  for(let section=0;section<sectionCount;section++){
   const start=PLAYER_X+900+section*SECTION_LENGTH,end=start+SECTION_LENGTH;
   for(const entity of route.entities.filter(item=>item.x>=start&&item.x<end&&item.type!=='train'))
    assert.ok(entity.x+entity.width<=end,`seed ${seed}, block ${stage+1}, beat ${section+1} spills ${entity.type} into the next beat`);
  }
  for(const entity of route.entities.filter(item=>staticProps.has(item.type)&&solidBoxes(item).length)){
   if(entity.y===0)continue;
   const center=entity.x+entity.width/2;
   const supported=route.entities.some(support=>support!==entity&&!support.decorative&&!SHAPES[support.type].enemy&&topFaces(support).some(face=>Math.abs(face.y-entity.y)<.01&&center>=face.x&&center<=face.x+face.w));
   assert.ok(supported,`seed ${seed}, block ${stage+1} leaves ${entity.type} floating`);
  }
 }
});

test('the victory lap keeps the suited boss barrel sequence authored',()=>{
 const route=makeRoute(9),boss=route.entities.find(entity=>entity.type==='suitBoss');
 const thrown=route.entities.filter(entity=>['barrel','victoryBossBarrel'].includes(entity.type)&&entity.thrown);
 assert.ok(boss,'the finale must use the suited boss');
 assert.equal(boss.bossHealth,3);
 assert.equal(thrown.length,3);
 assert.ok(thrown.every(entity=>entity.patrol?.speed>0&&entity.direction===-1));
 assert.ok(thrown.every((entity,index)=>entity.x>boss.x+boss.width+index*500));
});

test('endless mode keeps its opening fair, then expands into a varied six-piece deck',()=>{
 for(const seed of [1,42,881]){
  const sections=Array.from({length:32},(_,sequence)=>endlessSection(sequence,seed,1350+sequence*SECTION_LENGTH,352));
  assert.equal(new Set(sections.slice(20).map(section=>section.kind)).size,6,`seed ${seed} should exercise every late-run set piece`);
  for(let i=1;i<sections.length;i++)assert.notEqual(sections[i].kind,sections[i-1].kind,`seed ${seed} repeats ${sections[i].kind} at ${i}`);
  for(let i=0;i<sections.length;i++){
   assert.equal(sections[i].end,1350+(i+1)*SECTION_LENGTH);
   assert.ok(sections[i].entities.every(entity=>entity.x>=224+1350+i*SECTION_LENGTH),`seed ${seed} leaked an entity before its section`);
  }
 }
});

test('latest raster batch is reachable in its authored chapters',()=>{
 const used=new Set([
   ...makeRoute(0).entities,
   ...makeRoute(2).entities,
   ...makeRoute(3).entities,
   ...makeRoute(4).entities,
   ...makeRoute(5).entities,
   ...makeRoute(6).entities,
   ...makeRoute(7).entities,
   ...makeRoute(8).entities,
   ...makeRoute(9).entities,
 ].map(entity=>entity.type));
 for(const type of ['subwayPlatformUmbrella','airportSecurityTray','factoryBoxChute','chinatownSteamBasket','rooftopCableAnchor','victoryConfettiCannon','airportJetwayChock','yamIrrigationWindmill','factoryLaceBundle','rooftopValveFlag','sneakerShopBench','victoryHandPennant','chinatownFirecrackerCrate','subwaySignalLantern','victoryCrowdDrum','airportJetwayDoor','factoryPolishWheel','rooftopPigeonCrate','subwayPlatformWarningLamp','yamHayBale','sneakerSalePennants'])assert.ok(used.has(type),`missing latest raster family ${type}`);
 for(const type of ['airportSuitcasePile','factoryGluePuddle','victoryBossBarrel'])assert.ok(used.has(type),`missing latest raster family ${type}`);
});
