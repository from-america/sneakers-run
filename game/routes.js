import { SHAPES, STREET_KIT_ASSETS, PLAYER_X, seeded, DIFFICULTIES, solidBoxes, topFaces } from './config.js?v=10';
const beat=(id,pattern,signature,kit,enemy,enemy2,reward,options={})=>Object.freeze({id,pattern,signature,kit,enemy,enemy2,reward,...options});
const level=(name,place,scene,speed,sections,enemies,dressing,beats,finale,style,music,songSeconds)=>Object.freeze({name,place,scene,speed,sections,enemies,dressing,beats,finale,style,music,songSeconds});
// Mission variation is bounded by authored alternatives instead of free-form
// noise. A seed chooses the authored deck, then every compound still obeys
// the same readable verbs: teach, give reaction space, offer a high/low
// choice, and finish with a recovery runway.
export const PLATFORM_RULES=Object.freeze({
  reactionWindow:240,
  recoveryWindow:220,
  maxStepRise:200,
  maxPlatformTop:350,
  maxConcurrentThreats:2,
  optionalLane:'high coins always have a grounded route',
});
const layoutVariant=(seed,stage,index)=>Math.floor(seeded((seed^Math.imul(stage+1,0x9e3779b9)^Math.imul(index+1,0x85ebca6b))>>>0)()*3);
// These actors are extra city motion. They are visible and animated, but live
// behind the playable lane and never count as stompable threats.
const BACKGROUND_ENEMIES=Object.freeze(new Set(['pigeons']));

// Every authored beat names the player's decision instead of relying on a
// generic token. The pattern is implemented below as a deterministic layout,
// while the signature, street prop, enemy pair, and reward make the beat
// legible in both the game and the internal editor.
const CAMPAIGN_BEATS = Object.freeze({
  waterfront: Object.freeze([
    beat('wake-up-call','pierSteps','waterfrontMarker','trafficCone','rival','business','shield'),
    beat('rail-underpass','lowRail','waterfrontMarker','roadworkSign','business','courier','coin'),
    beat('ferry-transfer','ferryTransfer','bridgeAnchor','sawhorse','courier','pigeons','magnet'),
    beat('tide-machine','machineDeck','waterfrontMarker','parkingMeter','roller','rival','speed'),
    beat('dock-return','marketThread','loadingCrates','cableSpool','business','courier','shield'),
  ]),
  loading: Object.freeze([
    beat('belt-entry','machineDeck','loadingCrates','trashBin','courier','roller','shield'),
    beat('shutter-climb','roofGap','warehouseSign','roadworkSign','roller','parking','coin'),
    beat('forklift-lane','enemyLanes','loadingCrates','cableSpool','parking','courier','magnet'),
    beat('button-run','lowRail','warehouseSign','barricadeLamp','courier','roller','speed'),
    beat('bay-exit','ferryTransfer','loadingCrates','trafficCone','parking','business','shield'),
  ]),
  rooftops: Object.freeze([
    beat('fire-escape-rise','pierSteps','rooftopTank','parkingMeter','pigeons','camera','magnet'),
    beat('parapet-gap','hazardRun','rooftopTank','roadworkSign','camera','rival','shield'),
    beat('hook-cover','machineDeck','bridgeAnchor','cableSpool','rival','pigeons','speed'),
    beat('skyline-return','ferryTransfer','rooftopTank','bikeRack','pigeons','camera','coin'),
    beat('roof-door','lowRail','rooftopTank','barricadeLamp','camera','rival','shield'),
    beat('last-roof','enemyLanes','bridgeAnchor','trafficCone','rival','pigeons','speed'),
  ]),
  market: Object.freeze([
    beat('awning-entry','marketThread','marketStall','trafficCone','courier','business2','magnet'),
    beat('stall-roof','pierSteps','marketStall','newspaperBox','business2','camera','coin'),
    beat('sweeper-lane','lowRail','marketStall','trashBin','camera','courier','shield'),
    beat('shutter-cut','machineDeck','marketStall','fireHydrant','courier','business2','speed'),
    beat('crowd-release','enemyLanes','marketStall','barricadeLamp','business2','camera','magnet'),
    beat('market-backdoor','ferryTransfer','marketStall','parkingMeter','camera','courier','shield'),
  ]),
  underpass: Object.freeze([
    beat('car-shadow','lowRail','underpassVent','parkingMeter','raincoat','bike','shield'),
    beat('third-rail','hazardRun','underpassVent','barricadeLamp','bike','parking','coin'),
    beat('beam-and-bike','machineDeck','underpassVent','trashBin','parking','raincoat','speed'),
    beat('tunnel-roof','trainTransfer','warehouseSign','cableSpool','bike','raincoat','magnet'),
    beat('steam-return','marketThread','underpassVent','fireHydrant','raincoat','parking','shield'),
    beat('daylight-mouth','ferryTransfer','warehouseSign','roadworkSign','bike','raincoat','speed'),
  ]),
  subway: Object.freeze([
    beat('train-entry','subwayRoof','subwaySignal','barricadeLamp','business','courier','shield'),
    beat('platform-drop','lowRail','subwaySignal','parkingMeter','courier','camera','coin'),
    beat('third-rail-hop','hazardRun','subwaySignal','barricadeLamp','camera','business','magnet'),
    beat('shutter-lip','machineDeck','subwaySignal','newspaperBox','courier','camera','speed'),
    beat('service-cart','trainTransfer','subwaySignal','cableSpool','business','courier','shield'),
    beat('tunnel-signal','enemyLanes','subwaySignal','trafficCone','camera','business','magnet'),
  ]),
  court: Object.freeze([
    beat('tip-off','pierSteps','basketballHoop','trafficCone','rival','pigeons','shield'),
    beat('bleacher-transfer','ferryTransfer','basketballHoop','bikeRack','business2','rival','coin'),
    beat('hoop-line','enemyLanes','basketballHoop','newspaperBox','pigeons','business2','magnet'),
    beat('sweeper-court','lowRail','basketballHoop','trashBin','business2','pigeons','speed'),
    beat('backboard-climb','machineDeck','basketballHoop','cableSpool','rival','business2','shield'),
    beat('court-gate','hazardRun','basketballHoop','barricadeLamp','pigeons','rival','speed',{kitDx:2140}),
  ]),
  bridge: Object.freeze([
    beat('crane-base','machineDeck','bridgeAnchor','cableSpool','roller','bike','shield'),
    beat('truck-transfer','pierSteps','bridgeAnchor','roadworkSign','bike','raincoat','coin'),
    beat('girder-zigzag','enemyLanes','bridgeAnchor','bikeRack','raincoat','bike','magnet'),
    beat('upper-rail','ferryTransfer','bridgeAnchor','parkingMeter','bike','roller','speed'),
    beat('maintenance-rail','hazardRun','bridgeAnchor','barricadeLamp','roller','raincoat','shield',{kitDx:2200}),
    beat('far-pier','lowRail','bridgeAnchor','barricadeLamp','raincoat','bike','speed'),
  ]),
  crosswalk: Object.freeze([
    beat('two-lane-read','enemyLanes','crosswalkSignal','trafficCone','parking','business2','shield'),
    beat('gate-arm','lowRail','crosswalkSignal','parkingMeter','business2','bike','coin'),
    beat('curb-platform','pierSteps','crosswalkSignal','newspaperBox','bike','parking','magnet'),
    beat('crossing-pair','marketThread','crosswalkSignal','fireHydrant','parking','business2','speed'),
    beat('work-strip','hazardRun','crosswalkSignal','roadworkSign','bike','parking','shield'),
    beat('storefront-run','machineDeck','crosswalkSignal','barricadeLamp','business2','bike','magnet'),
  ]),
  dawn: Object.freeze([
    beat('first-light','machineDeck','dawnStreetlight','trafficCone','rival','camera','shield'),
    beat('shutter-silhouette','roofGap','dawnStreetlight','newspaperBox','camera','roller','coin'),
    beat('crane-shadow','ferryTransfer','dawnStreetlight','cableSpool','roller','raincoat','magnet'),
    beat('train-transfer','trainTransfer','bridgeAnchor','bikeRack','camera','roller','speed'),
    beat('mixed-exam','enemyLanes','dawnStreetlight','fireHydrant','camera','raincoat','shield'),
    beat('split-rail','hazardRun','dawnStreetlight','barricadeLamp','roller','camera','magnet'),
    beat('dawn-finish','marketThread','bridgeAnchor','barricadeLamp','raincoat','roller','speed'),
  ]),
  sneakerShops: Object.freeze([
    beat('shop-door','marketThread','marketStall','trafficCone','courier','business','shield',{kitDx:2200}),
    beat('window-hop','pierSteps','marketStall','newspaperBox','business','courier','coin'),
    beat('sale-rush','lowRail','marketStall','barricadeLamp','courier','business','magnet'),
    beat('cross-shop','machineDeck','marketStall','parkingMeter','business','courier','speed'),
    beat('street-release','ferryTransfer','loadingCrates','sawhorse','sneakerMascot','business','shield'),
    beat('shop-backstreet','lowRail','marketStall','barricadeLamp','business','rival','speed'),
  ]),
  sneakerShopsHard: Object.freeze([
    beat('hard-shop-door','marketThread','marketStall','bollards','business','courier','shield'),
    beat('hard-window-hop','pierSteps','marketStall','fireHydrant','rival','business','coin'),
    beat('hard-sale-rush','lowRail','marketStall','parkingMeter','courier','business','magnet'),
    beat('hard-cross-shop','machineDeck','marketStall','sawhorse','business','rival','speed'),
    beat('hard-street-release','ferryTransfer','loadingCrates','cableSpool','courier','business','shield'),
    beat('hard-shop-backstreet','hazardRun','marketStall','roadworkSign','business','rival','speed',{kitDx:2200}),
  ]),
  sunsetCity: Object.freeze([
    beat('sunset-traffic','enemyLanes','waterfrontMarker','trafficCone','business2','bike','shield'),
    beat('long-shadow','lowRail','bridgeAnchor','roadworkSign','bike','camera','coin'),
    beat('bridge-light','machineDeck','bridgeAnchor','cableSpool','camera','business2','magnet'),
    beat('last-light','hazardRun','waterfrontMarker','barricadeLamp','business2','bike','speed'),
    beat('dark-corner','ferryTransfer','loadingCrates','parkingMeter','bike','camera','shield'),
    beat('city-exit','marketThread','waterfrontMarker','sawhorse','camera','business2','speed'),
  ]),
  chinatown: Object.freeze([
    beat('lantern-entry','marketThread','marketStall','trafficCone','chinatownDragon','courier','shield'),
    beat('dragon-back','pierSteps','marketStall','roadworkSign','chinatownDragon','business2','coin'),
    beat('shop-awning','lowRail','marketStall','barricadeLamp','courier','chinatownDragon','magnet'),
    beat('red-gate','machineDeck','marketStall','parkingMeter','chinatownDragon','courier','speed'),
    beat('crowd-crossing','enemyLanes','bridgeAnchor','sawhorse','business2','chinatownDragon','shield'),
    beat('night-arch','ferryTransfer','marketStall','cableSpool','chinatownDragon','business2','speed'),
  ]),
  rooftopNight: Object.freeze([
    beat('birdline','pierSteps','rooftopTank','parkingMeter','pigeons','camera','magnet'),
    beat('tank-gap','hazardRun','rooftopTank','roadworkSign','camera','pigeons','shield'),
    beat('antenna-run','machineDeck','bridgeAnchor','cableSpool','pigeons','camera','speed'),
    beat('roof-door','ferryTransfer','rooftopTank','bikeRack','camera','pigeons','coin'),
    beat('moon-rail','lowRail','rooftopTank','barricadeLamp','pigeons','camera','shield'),
    beat('last-parapet','enemyLanes','bridgeAnchor','trafficCone','camera','pigeons','speed'),
  ]),
  subwayUnderground: Object.freeze([
    beat('platform-entry','subwayRoof','subwaySignal','barricadeLamp','subwayConductor','courier','shield'),
    beat('train-warning','trainTransfer','subwaySignal','parkingMeter','subwayConductor','business','coin'),
    beat('third-rail','hazardRun','subwaySignal','barricadeLamp','camera','subwayConductor','magnet'),
    beat('service-platform','machineDeck','subwaySignal','cableSpool','subwayConductor','courier','speed'),
    beat('tunnel-mouth','enemyLanes','subwaySignal','trafficCone','business','subwayConductor','shield'),
    beat('last-car','lowRail','subwaySignal','newspaperBox','subwayConductor','camera','magnet'),
  ]),
  airport: Object.freeze([
    beat('baggage-claim','marketThread','loadingCrates','trafficCone','airportHandler','courier','shield'),
    beat('carousel-cross','machineDeck','loadingCrates','trashBin','airportCart','business','coin'),
    beat('moving-walkway','pierSteps','warehouseSign','roadworkSign','courier','airportCart','magnet'),
    beat('terminal-gate','lowRail','loadingCrates','barricadeLamp','airportCart','camera','speed'),
    beat('tarmac-window','enemyLanes','bridgeAnchor','cableSpool','airportSecurityDog','airportCart','shield',{kitDx:2200}),
    beat('boarding-run','ferryTransfer','loadingCrates','sawhorse','airportCart','courier','speed'),
  ]),
  yamFarm: Object.freeze([
    beat('field-entry','marketThread','loadingCrates','trafficCone','yamCreature','rival','shield'),
    beat('row-hop','pierSteps','waterfrontMarker','roadworkSign','yamCreature','business','coin'),
    beat('falling-crop','hazardRun','loadingCrates','cableSpool','yamCreature','yamCreature','magnet'),
    beat('barn-lane','machineDeck','warehouseSign','barrel','business','yamCreature','speed'),
    beat('irrigation-run','lowRail','waterfrontMarker','barricadeLamp','yamCreature','courier','shield'),
    beat('harvest-exit','ferryTransfer','loadingCrates','sawhorse','yamCreature','rival','speed'),
  ]),
  sneakerFactory: Object.freeze([
    beat('belt-entry','machineDeck','loadingCrates','trafficCone','factoryWorker','courier','shield'),
    beat('box-stack','pierSteps','warehouseSign','roadworkSign','factoryWorker','business','coin'),
    beat('conveyor-cut','lowRail','loadingCrates','cableSpool','courier','factoryWorker','magnet'),
    beat('press-room','hazardRun','warehouseSign','barricadeLamp','factoryWorker','camera','speed'),
    beat('packing-line','enemyLanes','loadingCrates','parkingMeter','business','factoryWorker','shield'),
    beat('factory-door','ferryTransfer','warehouseSign','sawhorse','factoryWorker','courier','speed'),
  ]),
  victory: Object.freeze([
    beat('crowd-entry','marketThread','bridgeAnchor','trafficCone','business2','camera','shield'),
    beat('banner-run','pierSteps','dawnStreetlight','roadworkSign','business2','roller','coin'),
    beat('final-approach','lowRail','bridgeAnchor','barricadeLamp','camera','business2','magnet'),
    beat('cheer-lane','machineDeck','bridgeAnchor','sawhorse','business2','roller','speed'),
    beat('fan-tunnel','ferryTransfer','dawnStreetlight','cableSpool','camera','business2','shield'),
    beat('barrel-approach','enemyLanes','bridgeAnchor','trafficCone','business2','roller','coin'),
  ]),
});

export const LEVELS=Object.freeze([
  level('Sneakers','Sneaker shops','01-sneaker-shops-flat-v1.png',296,['market','stairs','traffic','market','works','stairs'],['courier','business','rival'],[],CAMPAIGN_BEATS.sneakerShops,'pier','sneakerShops','assets/music/wasot-01.mp3',217.224),
  level('Sneaker Run','Sunset city','02-sunset-city-flat-v1.png',316,['traffic','stairs','works','market','stairs','works'],['business2','bike','camera'],[],CAMPAIGN_BEATS.sunsetCity,'loading','sunsetCity','assets/Sneakers Run theme.mp3',156.719979),
  level('Chinatown','Dragon street','03-chinatown-flat-v1.png',322,['market','stairs','traffic','market','works','stairs'],['chinatownDragon','courier','business2'],[],CAMPAIGN_BEATS.chinatown,'market','chinatown','assets/music/chinese-03.mp3',180.624),
  level('Rooftops','Night rooftops','04-rooftop-night-flat-v1.png',328,['stairs','traffic','stairs','market','works','stairs'],['pigeons','camera','business2'],[],CAMPAIGN_BEATS.rooftopNight,'rooftop','rooftopNight','assets/music/cancelme.mp3',107.136),
  level('Subway','Underground line','05-subway-underground-flat-v1.png',334,['works','market','stairs','traffic','market','works'],['subwayConductor','courier','business'],[],CAMPAIGN_BEATS.subwayUnderground,'subway','subwayUnderground','assets/music/05-prolly.mp3',182.952),
  level('Sneaker District','Day route','06-sneaker-district-flat-v1.png',342,['stairs','traffic','stairs','works','market','traffic'],['rival','business2','courier'],[],CAMPAIGN_BEATS.sneakerShopsHard,'court','sneakerShopsHard','assets/music/lace-up-06.mp3',186.936),
  level('Airport','Terminal run','07-airport-flat-v1.png',346,['works','market','stairs','traffic','market','works'],['airportHandler','courier','business'],[],CAMPAIGN_BEATS.airport,'bridge','airport','assets/music/airport-ooooo.mp3',201.552),
  level('Yam farm','Harvest route','08-yam-farm-flat-v1.png',350,['market','stairs','traffic','works','market','stairs'],['yamCreature','rival','courier'],[],CAMPAIGN_BEATS.yamFarm,'crosswalk','yamFarm','assets/music/gtyoyf.mp3',202.392),
  level('Factory','Sneaker factory','09-sneaker-factory-flat-v1.png',354,['works','traffic','works','stairs','market','works'],['factoryWorker','courier','business2'],[],CAMPAIGN_BEATS.sneakerFactory,'underpass','sneakerFactory','assets/music/pleasespeed-2ndlast.mp3',212.736),
  level('Victory lap','Final crowd','10-victory-lap-flat-v1.png',358,['market','stairs','works','market','stairs','works'],['business2','camera','roller'],[],CAMPAIGN_BEATS.victory,'victory','victory','assets/music/wasot-01.mp3',217.224),
]);
export const SECTION_LENGTH=2250;
function section(route,kind,start,index,stage=0,options={}){
  if(typeof kind!=='string')return authoredSection(route,kind,start,index,stage,options);
  const roster=LEVELS[stage].enemies;
  const put=(type,dx,y=0,patrol=0)=>{
    const x=start+dx,shape=SHAPES[type],id=`${index}:${route.entities.length}`;
    const background=shape.decorative||BACKGROUND_ENEMIES.has(type);
    const e={id,type,x,y,width:shape.width,hit:false,passed:false,...(shape.decorative?{decorative:true}:{}),...(background?{background:true}:{}),...(background&&BACKGROUND_ENEMIES.has(type)?{visualOnly:true}:{})};
    if(background&&BACKGROUND_ENEMIES.has(type))e.backgroundLift=130;
    if(patrol){e.patrol={min:x-patrol,max:x+patrol,speed:45+stage*4};e.direction=-1;}
    if(shape.timed){e.phaseOffset=(stage+index)*.37;e.floorPhase=(e.phaseOffset%shape.period)<shape.floorDuration;}
    route.entities.push(e);return e;
  };
  const coins=(dx,y,count=4,spacing=50)=>{for(let i=0;i<count;i++)route.pickups.push({id:`${index}:c:${route.pickups.length}`,type:'coin',x:start+dx+i*spacing,y});};
  const deck=(dx,y)=>{put('platform',dx,y);coins(dx+28,y+164,4,59);};
  const opponent=(dx,y,n=0,patrol=0)=>put(roster[(index+n)%roster.length],dx,y,patrol);
  if(kind==='stairs'){
    deck(0,0);deck(330,94);deck(660,188);deck(1000,188);deck(1450,94);
    opponent(405,0,0,55);put('gate',750);opponent(1080,309,1,25);
    put(stage===0&&index===0?'barrier':stage<2?'barrel':'bollards',1840);coins(810,40);coins(1880,155);
  } else if(kind==='market'){
    deck(0,0);put('gate',390);deck(1200,130);deck(1540,225);
    opponent(1275,251,1,25);opponent(1510,0,0,65);put('car',1880);
    coins(430,46,12,50);coins(440,282,11,51);coins(1910,165);
  } else if(kind==='works'){
    put('conveyor',0);put('truck',400);opponent(690,0,0,40);put('shutter',1000);
    deck(1320,150);put('crane',1720);
    // Keep the roaming opponent on the shared floor in endless mode. The
    // elevated deck is a visual route choice; putting an enemy inside its
    // lower support makes a late double jump collide with the legs before
    // the stomp plane can be reached. Story beats still use elevated enemies
    // where the platform landing is authored around them.
    opponent(1390,0,1,20);
    coins(30,140);coins(430,216);coins(1005,284);coins(1760,300);
  } else if(kind==='hazard'){
    // Endless needs a deliberate lethal read as well as ordinary street
    // clutter. This mirrors the authored hazard beat: each danger has a
    // landing surface or a clean floor runway so the player has a real jump
    // decision instead of a surprise wall.
    deck(0,0);put('spikes',390);deck(870,150);
    opponent(1090,271,0,35);put('electric',1350);put('gate',1810);
    coins(900,330,7,48);
  } else if(kind==='train'){
    // The train is a moving set piece in endless mode too. It begins in the
    // reaction window and sweeps a bounded lane, keeping its visual rush and
    // collider on one timeline.
    const train=put('train',260);train.patrol={min:train.x-1200,max:train.x+220,speed:330+stage*4};train.direction=-1;train.rush={trigger:1200,active:false};
    deck(1050,150);opponent(1270,271,0,35);put('gate',1660);put('bollards',1900);
    coins(1080,330,6,48);
  } else {
    put('car',0);opponent(400,0,0,75);deck(660,110);deck(1000,210);deck(1340,210);
    put('sweeper',1060);opponent(1400,331,1,20);put('bollards',1820);
    coins(30,155);coins(1860,157);coins(700,56,5);
  }
  // A compact street-kit beat gives every compound a tactile, setting-neutral
  // decision. The rotating roster keeps the authored blocks from feeling like
  // four repeated grammars while preserving a single jump-readable silhouette.
  const kitType=STREET_KIT_ASSETS[(stage+index)%STREET_KIT_ASSETS.length];
  // Keep the shared street prop on the recovery runway. The old stairs and
  // traffic offsets put tall meters/hydrants directly under an elevated
  // landing, leaving no safe answer after a double jump was spent climbing.
  const kitDx=kind==='market'?820:2050;
  const mechanic=(stage+index)%3;
  const endlessMechanic=kind!=='market'&&mechanic===0?'rollingCart':kind!=='market'&&mechanic===1?'dropGate':kitType;
  put(endlessMechanic,kitDx,endlessMechanic==='rollingCart'?0:0,endlessMechanic==='rollingCart'?105:0);
  // A short, deliberate landing runway separates compounds; the challenge is
  // inside the section, not a random obstacle spawned too late to react to.
  coins(2070,58,3,45);
  route.pickups.push({id:`${index}:flow`,type:'flow',x:start+1940,y:58});
  route.pickups.push({id:`${index}:power`,type:['shield','magnet','speed'][index%3],x:start+2070,y:index%2?150:58});
}

function authoredSection(route,spec,start,index,stage=0,options={}){
  const roster=LEVELS[stage].enemies;
  const variant=options.variant??0;
  const style=options.style||LEVELS[stage].style||'waterfront';
  // A song can run through the authored deck several times.  Geometry follows
  // the beat it is replaying, while sequence data below continues to use the
  // absolute section number for IDs, patrol timing, and deterministic variants.
  const sequenceIndex=index;
  const patternIndex=sequenceIndex%LEVELS[stage].beats.length;
  const layoutIndex=style==='victory'?patternIndex%3:patternIndex;
  index=layoutIndex;
  const shift=[0,45,-40][variant%3];
  const d=dx=>dx+shift;
  const put=(type,dx,y=0,extra={})=>{
    const x=start+d(dx),shape=SHAPES[type],id=`${spec.id}:${route.entities.length}`;
    if(!shape)throw new Error(`Unknown authored asset ${type}`);
    const background=shape.decorative||extra.background===true;
    const e={id,type,x,y,width:shape.width,hit:false,passed:false,...(shape.decorative?{decorative:true}:{}),...(background?{background:true}:{}),...(background&&BACKGROUND_ENEMIES.has(type)?{visualOnly:true}:{}),...extra};
    if(background&&BACKGROUND_ENEMIES.has(type))e.backgroundLift=130;
    if(extra.patrol){e.patrol={min:x-extra.patrol,max:x+extra.patrol,speed:45+stage*4};e.direction=-1;}
    if(shape.timed){e.phaseOffset=(stage+sequenceIndex)*.37;e.floorPhase=(e.phaseOffset%shape.period)<shape.floorDuration;}
    route.entities.push(e);return e;
  };
  const coins=(dx,y,count=4,spacing=50)=>{for(let i=0;i<count;i++)route.pickups.push({id:`${spec.id}:c:${route.pickups.length}`,type:'coin',x:start+d(dx+i*spacing),y});};
  const deck=(dx,y=190,type='platform')=>{put(type,dx,y);coins(dx+30,y+164,4,52);};
  const actor=(dx,y,type=spec.enemy,patrol=0)=>put(type||roster[(sequenceIndex+stage)%roster.length],dx,y,patrol?{patrol}:{});
  const actor2=(dx,y,type=spec.enemy2,patrol=0)=>put(type||roster[(sequenceIndex+stage+1)%roster.length],dx,y,patrol?{patrol}:{});
  const upper=(dx,topY=311,type=spec.enemy,patrol=0)=>actor(dx,topY,type,patrol);
  // A duck beam and a loading platform may never share a footprint. The old
  // stacked combination read as one malformed object and hid the required
  // move. A low beam is now a clean jump-or-duck decision with a coin line
  // above it; nearby platforms remain separate authored landings.
  const choice=(lowType,lowDx,highDx,highY=190)=>{put(lowType,lowDx);coins(Math.max(lowDx+36,highDx+36),highY+118,4,52);};

  // Each chapter has its own small vocabulary. The placements below are
  // deliberately sparse: one visible read, one commitment, then a recovery
  // runway before the next decision. High lanes carry coins and an enemy to
  // make them an earned shortcut, while the floor lane remains available.
  switch(style){
    case 'waterfront':
      if(index===0){put('barrier',320);deck(570);upper(760,311,spec.enemy,35);choice('gate',1110,1060);put('conveyor',1430);actor2(1710,0,spec.enemy2,35);}
      else if(index===1){choice('gate',330,300,180,'fireEscape');upper(520,301,spec.enemy);put('bollards',880);deck(1130,190);upper(1280,311,spec.enemy2,30);put('sawhorse',1660);}
      else if(index===2){put('barrier',320);upper(740,245,spec.enemy);deck(1260,190);upper(1410,311,spec.enemy2,30);put('barrier',1750);}
      else if(index===3){put('conveyor',300);put('truck',640);deck(1010,190);upper(1160,311,spec.enemy);put('crane',1420);put('barrel',1760);}
      else {put('sweeper',340);deck(310,190,'fireEscape');upper(520,311,spec.enemy);choice('gate',820,780);put('shutter',1120);upper(1510,311,spec.enemy2,30);}
      break;
    case 'loading':
      if(index===0){put('conveyor',300);put('barrel',650);deck(900);upper(1050,311,spec.enemy);put('trashBin',1390);put('shutter',1620);}
      else if(index===1){put('shutter',310);deck(780);upper(930,311,spec.enemy);choice('gate',1190,1150);put('crane',1450);put('roadworkSign',1770);}
      else if(index===2){put('truck',300);deck(760);upper(920,311,spec.enemy);put('bollards',1130);actor2(1460,0,spec.enemy2,35);put('cableSpool',1780);}
      else if(index===3){put('barrier',300);choice('gate',610,570);upper(760,301,spec.enemy);put('conveyor',1000);actor2(1320,0,spec.enemy2,35);put('fireHydrant',1710);}
      else {put('barrier',320);upper(720,245,spec.enemy);deck(1220,190,'fireEscape');upper(1370,311,spec.enemy2,30);put('car',1660);put('sawhorse',1880);}
      break;
    case 'rooftopNight':
    case 'rooftops':
      if(index===0){deck(300,190,'fireEscape');upper(500,311,spec.enemy);put('barrier',720);put('rooftopWaterTank',1040);put('rooftopDish',1320);deck(1450);upper(1600,311,spec.enemy2,30);}
      else if(index===1){deck(300);put('spikes',650);deck(1060);upper(1210,311,spec.enemy);choice('gate',1390,1350);actor2(1760,0,spec.enemy2,35);put('rooftopValveFlag',2040);}
      else if(index===2){put('crane',300);deck(700);upper(850,311,spec.enemy);put('rooftopDishArray',1090);actor2(1480,0,spec.enemy2,35);put('rooftopAntenna',1810);put('rooftopPigeonCrate',2040);}
      else if(index===3){put('barrier',320);upper(730,245,spec.enemy);deck(1200);upper(1360,311,spec.enemy2,30);put('electric',1580);put('rooftopFan',1160);put('rooftopClotheslineFlutter',2020);}
      else if(index===4){choice('gate',320,280);upper(470,311,spec.enemy);put('barrier',760);deck(1060,190,'fireEscape');upper(1220,311,spec.enemy2,30);put('rooftopClothesline',1500);put('rooftopBirdFlock',1800);}
      else {deck(300);upper(460,311,spec.enemy);put('sweeper',780);deck(1100,190,'fireEscape');upper(1260,311,spec.enemy2,30);put('bollards',1600);put('car',1760);put('rooftopCableAnchor',1980);}
      break;
    case 'sneakerShopsHard':
      if(index===0){put('bollards',300);deck(540);upper(700,311,spec.enemy);choice('gate',850,810);put('sneakerLaceDisplay',1190);deck(1480);upper(1640,311,spec.enemy2,30);}
      else if(index===1){put('car',300);deck(620);upper(780,311,spec.enemy);put('sneakerRack',990);choice('gate',1230,1190);upper(1420,311,spec.enemy2,30);put('barricadeLamp',1760);}
      else if(index===2){put('sweeper',300);deck(280);upper(450,311,spec.enemy);choice('gate',770,730);actor2(1110,0,spec.enemy2,35);deck(1390,190,'fireEscape');upper(1540,311,spec.enemy);put('sneakerRack',1800);put('sneakerShopRope',2030);}
      else if(index===3){put('shutter',300);deck(760);upper(920,311,spec.enemy);put('bollards',1160);choice('gate',1430,1390);upper(1600,311,spec.enemy2,30);put('sneakerRack',1810);put('sneakerSalePennants',1950,0,{decorative:true});}
      else if(index===4){put('car',300);actor(620,0,spec.enemy,35);deck(880);upper(1030,311,spec.enemy2);put('barrier',1250);deck(1480);upper(1630,311,spec.enemy,30);put('sneakerRack',1800);put('sneakerShopBench',2000);}
      else {put('barrier',320);upper(730,245,spec.enemy);deck(1210,190,'fireEscape');upper(1370,311,spec.enemy2,30);put('sneakerBoxTower',1650);put('sneakerRack',1880);put('sneakerBoxStack',2050);}
      break;
    case 'sneakerShops':
    case 'market':
      if(index===0){put('bollards',300);deck(540);upper(700,311,spec.enemy);choice('gate',850,810);put('sweeper',1190);deck(1560);upper(1720,311,spec.enemy2,30);}
      else if(index===1){put('car',300);deck(620);upper(780,311,spec.enemy);put('barrel',990);choice('gate',1230,1190);upper(1420,311,spec.enemy2,30);put('barricadeLamp',1760);}
      else if(index===2){put('sweeper',300);deck(280);upper(450,311,spec.enemy);choice('gate',770,730);actor2(1110,0,spec.enemy2,35);deck(1390,190,'fireEscape');upper(1540,311,spec.enemy);put('sneakerShopWindow',1800);}
      else if(index===3){put('shutter',300);deck(760);upper(920,311,spec.enemy);put('bollards',1160);choice('gate',1430,1390);upper(1600,311,spec.enemy2,30);put('sneakerFittingMirror',1810);}
      else if(index===4){put('car',300);actor(620,0,spec.enemy,35);deck(880);upper(1030,311,spec.enemy2);put('barrier',1250);deck(1480);upper(1630,311,spec.enemy,30);put('sneakerShopPolishCart',1800);}
      else {put('barrier',320);upper(730,245,spec.enemy);deck(1210,190,'fireEscape');upper(1370,311,spec.enemy2,30);put('sweeper',1650);put('barrel',1880);}
      break;
    case 'sunsetCity':
      if(index===0){put('car',300);actor(650,0,spec.enemy,45);deck(930);upper(1090,311,spec.enemy2);put('barrier',1390);put('sunsetBarrier',1780);}
      else if(index===1){choice('gate',300,260);upper(470,311,spec.enemy);put('truck',800);deck(1180,190,'fireEscape');upper(1340,311,spec.enemy2,30);put('sunsetBollards',1770);}
      else if(index===2){put('conveyor',300);put('sweeper',650);deck(980);upper(1140,311,spec.enemy);put('car',1450);actor2(1770,0,spec.enemy2,35);}
      else if(index===3){put('sunsetNeonSign',320);upper(730,245,spec.enemy);deck(1150);upper(1310,311,spec.enemy2,30);put('electric',1540);put('sunsetSignal',1170,311);}
      else if(index===4){put('truck',300);deck(760);upper(920,311,spec.enemy);choice('gate',1180,1140);put('sweeper',1500);actor2(1810,0,spec.enemy2,30);}
      else {put('car',320);actor(650,0,spec.enemy,35);deck(930,190,'fireEscape');upper(1090,311,spec.enemy2,30);put('shutter',1370);put('barrel',1810);put('sunsetLitSign',2050);}
      break;
    case 'chinatown':
      if(index===0){put('chinatownShopShutter',300);actor(650,0,spec.enemy,35);put('gate',930);deck(1190,190);upper(1350,311,spec.enemy2,25);put('chinatownLionCart',1750);}
      else if(index===1){deck(300,190,'fireEscape');upper(520,311,spec.enemy);put('chinatownDragon',760,0,{patrol:65});choice('gate',1110,1070);actor2(1510,0,spec.enemy2,35);put('chinatownFirecrackerCrate',1900);}
      else if(index===2){put('bollards',300);deck(620);upper(780,311,spec.enemy);put('chinatownShopShutter',1040);put('chinatownLanternCluster',1370);actor2(1650,0,spec.enemy2,35);put('chinatownDragon',1880,0,{patrol:40});put('chinatownSteamBasket',2080);}
      else if(index===3){put('conveyor',300);actor(650,0,spec.enemy,35);choice('gate',920,880);upper(1100,311,spec.enemy2,30);put('chinatownDragon',1450,0);put('chinatownDrumCart',1680);put('chinatownMarketCrate',1900);put('chinatownFanStand',2080);}
      else if(index===4){put('chinatownLanternPole',320);upper(730,245,spec.enemy);deck(1150);actor2(1320,311,spec.enemy2,30);put('chinatownDragon',1550,0,{patrol:70});put('chinatownShopSign',1910);put('chinatownSteamCart',2070);}
      else {deck(300);put('chinatownDragon',620,0,{patrol:55});upper(850,311,spec.enemy);put('gate',1120);deck(1410,190,'fireEscape');upper(1580,311,spec.enemy2,30);put('chinatownLanternGate',1840);}
      break;
    case 'underpass':
      if(index===0){put('car',300);choice('gate',620,580);upper(740,311,spec.enemy);actor2(1040,0,spec.enemy2,35);put('conveyor',1350);put('parkingMeter',1740);}
      else if(index===1){deck(300);put('electric',680);deck(1100);upper(1250,311,spec.enemy);put('barrier',1530);actor2(1810,0,spec.enemy2,30);}
      else if(index===2){put('conveyor',300);put('shutter',650);deck(1020);upper(1180,311,spec.enemy);put('truck',1410);actor2(1740,0,spec.enemy2,35);}
      else if(index===3){put('barrier',320);upper(730,245,spec.enemy);deck(1240);upper(1400,311,spec.enemy2,30);choice('gate',1660,1620);put('barrel',1900);}
      else if(index===4){put('sweeper',300);deck(280);upper(450,311,spec.enemy);choice('gate',790,750);actor2(1110,0,spec.enemy2,35);put('crane',1420);put('fireHydrant',1770);}
      else {put('conveyor',300);put('truck',650);deck(1040);upper(1200,311,spec.enemy);put('shutter',1410);actor2(1740,0,spec.enemy2,35);put('roadworkSign',1890);}
      break;
    case 'subwayUnderground':
      if(index===0){const train=put('train',270,0,{patrol:320});train.rush={trigger:1050,active:false};deck(1300,150);upper(1480,311,spec.enemy);put('electric',1770);}
      else if(index===1){choice('gate',300,260);put('subwayConductor',500,0,{patrol:45});put('train',760,0,{patrol:240});deck(1470,190,'fireEscape');upper(1660,311,spec.enemy2,30);put('subwayBench',1900);}
      else if(index===2){deck(300);put('subwayTrackSwitch',680);put('subwayConductor',930,0);deck(1190);upper(1370,311,spec.enemy);put('train',1580,0,{patrol:220});}
      else if(index===3){put('subwayPlatformSign',300);put('subwayConductor',700,0,{patrol:50});deck(980);upper(1140,311,spec.enemy2,30);put('subwayToolbox',1420);put('subwayVendingMachine',1680);put('subwayTicketMachine',1810);put('subwayRailJunction',1900);}
      else if(index===4){put('subwayCart',320,0,{patrol:80});upper(740,245,spec.enemy);put('train',980,0,{patrol:260});deck(1530);upper(1690,311,spec.enemy2,30);put('subwayEmergencyBox',2030);put('subwaySignalLantern',1920);put('subwayPlatformWarningLamp',2130);}
      else {put('subwayConductor',300,0,{patrol:45});choice('gate',620,580);put('train',920,0,{patrol:240});upper(1430,311,spec.enemy2,30);put('subwaySignalBox',1780);put('subwayTurnstile',1960);put('subwayPlatformUmbrella',2140);}
      break;
    case 'subway':
      if(index===0){put('barrier',300);upper(720,245,spec.enemy);deck(1220);upper(1380,311,spec.enemy2,30);put('electric',1600);put('car',1160);}
      else if(index===1){choice('gate',300,260);upper(430,311,spec.enemy);put('shutter',760);actor2(1110,0,spec.enemy2,35);deck(1390,190,'fireEscape');upper(1540,311,spec.enemy);}
      else if(index===2){deck(300);put('electric',680);deck(1110);upper(1260,311,spec.enemy);put('barrier',1530);actor2(1810,0,spec.enemy2,30);}
      else if(index===3){put('shutter',300);deck(780);upper(930,311,spec.enemy);put('conveyor',1160);actor2(1470,0,spec.enemy2,35);put('bollards',1780);}
      else if(index===4){put('barrier',320);upper(740,245,spec.enemy);deck(1240);upper(1390,311,spec.enemy2,30);put('gate',1660);put('cableSpool',1900);}
      else {put('car',300);actor(610,0,spec.enemy,35);deck(870);upper(1020,311,spec.enemy2);put('barrier',1260);deck(1490,190,'fireEscape');upper(1650,311,spec.enemy,30);}
      break;
    case 'airport':
      if(index===0){put('conveyor',300);put('airportHandler',660,0,{patrol:55});put('rollingCart',960,0,{patrol:110});deck(1300,150);upper(1480,311,spec.enemy2);put('airportBoardingGate',1810);}
      else if(index===1){put('airportHandler',300,0,{patrol:40});put('barrier',620);choice('gate',900,860);deck(1250,190,'fireEscape');upper(1440,311,spec.enemy);put('airportBaggageCluster',1730);put('airportBaggageCarousel',1900);put('airportJetwayDoor',2050);}
      else if(index===2){put('airportDepartureBoard',300);deck(760);upper(920,311,spec.enemy);put('airportBaggageBot',1160,0,{patrol:50});put('airportTugCart',1430,0,{patrol:70});put('airportBoardingStanchion',1640);put('dropGate',1810);put('airportSuitcasePile',2090);}
      else if(index===3){put('barrier',320);put('airportHandler',700,0,{patrol:50});choice('gate',980,940);upper(1200,311,spec.enemy2,30);put('airportSecurityScanner',1510);put('airportSuitcases',1850);put('airportSecurityTray',2080);}
      else if(index===4){put('conveyor',300);upper(700,311,spec.enemy);put('airportHandler',980,0,{patrol:50});deck(1270,190,'fireEscape');upper(1450,311,spec.enemy2,30);put('airportStairs',1780);put('airportRunwayCone',2050);}
      else {put('airportHandler',300,0,{patrol:45});put('barrier',650);deck(930);upper(1090,311,spec.enemy);put('dropGate',1320);actor2(1600,0,spec.enemy2,35);put('airportJetway',1840);put('airportJetwayChock',2050);}
      break;
    case 'yamFarm':
      if(index===0){put('yamFieldFence',300);put('yamCreature',650,0,{patrol:45});put('yamDrop',900);deck(1170,150);upper(1360,311,spec.enemy2);put('yamHarvestBasket',1730);}
      else if(index===1){deck(300,190,'fireEscape');put('yamCreature',560,0,{patrol:55});put('yamDrop',850);upper(1100,311,spec.enemy);put('yamScarecrow',1440,0,{patrol:45});put('yamSackBundle',1730);}
      else if(index===2){put('yamDrop',320);put('yamDrop',620);deck(930);put('yamCreature',1150,0,{patrol:60});put('yamDrop',1420);upper(1620,311,spec.enemy2);put('yamIrrigationWheel',1880);put('yamIrrigationSprinkler',2050);}
      else if(index===3){put('conveyor',300);put('yamCreature',650,0,{patrol:45});choice('gate',930,890);put('yamDrop',1200);upper(1430,311,spec.enemy2,30);put('yamRoller',1770);put('yamIrrigationWindmill',2070);put('yamHayBale',1930);}
      else if(index===4){put('barrier',320);put('yamDrop',640);upper(820,245,spec.enemy);deck(1120);put('yamCreature',1350,0,{patrol:65});put('yamDrop',1630);put('yamCrate',1880);put('yamHarvestCrate',2040);}
      else {put('yamCreature',320,0,{patrol:55});deck(620);put('yamDrop',940);upper(1170,311,spec.enemy);put('yamWheelbarrow',1430);put('yamGobbler',1740,0,{patrol:45});put('yamDrop',1950);}
      break;
    case 'sneakerFactory':
      if(index===0){put('conveyor',300);put('factoryWorker',690,0,{patrol:50});put('dropGate',980);deck(1300,150);upper(1480,311,spec.enemy2);put('factoryThreadCart',1810);put('factoryPolishWheel',2070);}
      else if(index===1){put('factoryWorker',300,0,{patrol:45});put('factoryBelt',620);deck(900);upper(1080,311,spec.enemy);put('factoryLaceSpool',1320);choice('gate',1630,1590);put('factorySneakerTray',1980);}
      else if(index===2){put('conveyor',300);put('factoryWorker',680,0,{patrol:60});put('factorySneakerMold',960);deck(1320,190,'fireEscape');upper(1480,311,spec.enemy2,30);put('factoryLabelRoll',1810);put('factoryShoeDryer',2040);}
      else if(index===3){put('barrier',320);put('factoryWorker',700,0,{patrol:45});choice('gate',980,940);upper(1190,311,spec.enemy);put('factoryPress',1450);put('factoryRobotArm',1780);put('factoryLaceBundle',2020);}
      else if(index===4){put('conveyor',300);upper(700,311,spec.enemy);put('factoryBoxRunner',980,0,{patrol:55});deck(1250);upper(1420,311,spec.enemy2,30);put('factoryLaceBin',1770);put('factoryBoxChute',2030);put('factoryGluePuddle',2100);}
      else {put('factoryWorker',300,0,{patrol:45});put('dropGate',620);deck(900,190,'fireEscape');upper(1080,311,spec.enemy);put('conveyor',1350);upper(1530,311,spec.enemy2,30);put('factoryShoePile',1840);}
      break;
    case 'victory':
      if(index===0){put('barrier',300);upper(700,245,spec.enemy);deck(1050);upper(1210,311,spec.enemy2,30);put('barrel',1630);put('trafficCone',1870);put('victoryCrowdDrum',1950);put('victoryHandPennant',2080);}
      else if(index===1){deck(300,190,'fireEscape');put('barrel',650);upper(900,311,spec.enemy);choice('gate',1180,1140);put('barrel',1530);upper(1770,311,spec.enemy2,30);put('victoryBarrelStack',1990);}
      else {put('conveyor',300);put('barrel',650);deck(930);upper(1090,311,spec.enemy);put('barrel',1380);choice('gate',1690,1650);put('barrel',1900);put('victoryConfettiCannon',2050);}
      break;
    case 'court':
      if(index===0){put('car',300);deck(620);upper(780,311,spec.enemy);put('barrier',1010);deck(1300,190,'fireEscape');upper(1460,311,spec.enemy2,30);put('sweeper',1720);}
      else if(index===1){deck(300,190,'fireEscape');upper(500,311,spec.enemy);put('bollards',760);deck(1060);upper(1220,311,spec.enemy2,30);put('bikeRack',1650);}
      else if(index===2){put('barrel',300);actor(620,0,spec.enemy,35);deck(860);upper(1020,311,spec.enemy2);put('barrier',1260);deck(1500);upper(1660,311,spec.enemy,30);}
      else if(index===3){put('sweeper',300);deck(280);upper(450,311,spec.enemy);choice('gate',760,720);actor2(1090,0,spec.enemy2,35);put('crane',1400);put('trafficCone',1750);}
      else if(index===4){put('crane',300);put('truck',650);deck(1050);upper(1210,311,spec.enemy);put('shutter',1410);actor2(1740,0,spec.enemy2,35);}
      else {deck(300);put('spikes',650);deck(1060);upper(1220,311,spec.enemy);put('gate',1450);actor2(1740,0,spec.enemy2,35);put('bollards',1900);}
      break;
    case 'bridge':
      if(index===0){put('crane',300);put('truck',650);deck(1060);upper(1220,311,spec.enemy);actor2(1540,0,spec.enemy2,35);put('cableSpool',1810);}
      else if(index===1){put('truck',300);deck(760);upper(920,311,spec.enemy);put('barrier',1150);deck(1400,190,'fireEscape');upper(1560,311,spec.enemy2,30);}
      else if(index===2){put('bollards',300);actor(620,0,spec.enemy,35);deck(880);upper(1040,311,spec.enemy2);put('sweeper',1270);deck(1510);upper(1670,311,spec.enemy,30);}
      else if(index===3){deck(300);upper(470,311,spec.enemy);put('car',760);deck(1060,190,'fireEscape');upper(1220,311,spec.enemy2,30);put('gate',1500);actor2(1800,0,spec.enemy,35);}
      else if(index===4){deck(300);put('electric',680);deck(1110);upper(1270,311,spec.enemy);put('spikes',1510);actor2(2020,0,spec.enemy2,30);}
      else {choice('gate',300,260);upper(430,311,spec.enemy);put('barrier',760);deck(1050);upper(1210,311,spec.enemy2,30);put('car',1540);put('bikeRack',1810);}
      break;
    case 'crosswalk':
      if(index===0){put('car',300);put('truck',650);deck(1030);upper(1190,311,spec.enemy);actor2(1510,0,spec.enemy2,35);put('barrier',1770);}
      else if(index===1){choice('gate',320,280);upper(450,311,spec.enemy);put('bollards',800);deck(1110);upper(1270,311,spec.enemy2,30);put('parkingMeter',1660);}
      else if(index===2){put('barrier',300);deck(560);upper(720,311,spec.enemy);put('car',980);deck(1260,190,'fireEscape');upper(1420,311,spec.enemy2,30);put('bikeRack',1760);}
      else if(index===3){put('sweeper',300);deck(280);upper(450,311,spec.enemy);choice('gate',780,740);actor2(1110,0,spec.enemy2,35);put('truck',1410);put('trafficCone',1770);}
      else if(index===4){deck(300);put('spikes',690);deck(1120);upper(1280,311,spec.enemy);put('electric',1350);actor2(1840,0,spec.enemy2,30);}
      else {put('conveyor',300);put('shutter',650);deck(1050);upper(1210,311,spec.enemy2);put('crane',1430);actor(1760,0,spec.enemy,35);}
      break;
    case 'dawn':
      if(index===0){put('conveyor',300);put('barrel',650);deck(930);upper(1090,311,spec.enemy);put('shutter',1320);actor2(1660,0,spec.enemy2,35);}
      else if(index===1){put('shutter',300);deck(760);upper(920,311,spec.enemy);choice('gate',1190,1150);put('crane',1480);actor2(1780,0,spec.enemy2,35);}
      else if(index===2){put('crane',300);deck(760);upper(920,311,spec.enemy);put('truck',1180);actor2(1510,0,spec.enemy2,35);put('cableSpool',1810);}
      else if(index===3){put('barrier',300);upper(710,245,spec.enemy);deck(1190);upper(1350,311,spec.enemy2,30);put('electric',1400);put('barrier',1870);}
      else if(index===4){put('car',300);actor(610,0,spec.enemy,35);deck(870);upper(1030,311,spec.enemy2);put('spikes',1280);deck(1590,190,'fireEscape');upper(1750,311,spec.enemy,30);}
      else if(index===5){deck(300);put('spikes',650);deck(1060);upper(1220,311,spec.enemy);put('electric',1350);actor2(1810,0,spec.enemy2,30);}
      else {put('sweeper',300);deck(280);upper(450,311,spec.enemy);choice('gate',790,750);put('crane',1110);deck(1450,190,'fireEscape');upper(1610,311,spec.enemy2,30);}
      break;
    default: throw new Error(`Unknown authored level style ${style}`);
  }

  const kitDx=spec.kitDx??2050;
  // Every third authored beat introduces one of the new obstacle-only verbs
  // in the existing recovery-prop slot. That preserves breathing room while
  // guaranteeing the campaign teaches all three mechanics repeatedly.
  const mechanic=(stage+sequenceIndex)%3;
  // The Airport moving-walkway beat already has a timed drop gate followed
  // by a stanchion and suitcase pile. Adding the rotating surface hazard in
  // that same hand-off collapses the recovery window into an unavoidable
  // shield trade, so leave this beat's floor clean and keep the mechanic in
  // the other authored compounds.
  const mechanicType=stage===6&&index===2?null:['rollingCart','dropGate','oilSlick'][mechanic];
  const kitType=mechanicType;
  // A rolling cart needs to clear before the next beat's low gate enters the
  // same reaction box. Keep the other mechanics at the authored recovery
  // anchor; only the moving cart gets the earlier hand-off.
  // Each recovery mechanic has a dedicated late-beat slot. These anchors
  // leave the following beat's reaction window empty and keep the full art
  // footprint within this beat even when a seeded layout shifts it right.
  const mechanicDx=kitType==='rollingCart'?Math.min(kitDx,1740):kitType==='dropGate'?Math.min(kitDx,1920):Math.min(kitDx,1990);
  if(kitType)put(kitType,mechanicDx,0,kitType==='rollingCart'?{patrol:105}:{});
  coins(2050,58,3,45);
  if(kitType==='oilSlick')coins(2050,170,3,45);
  route.pickups.push({id:`${spec.id}:${sequenceIndex}:flow`,type:'flow',x:start+d(1940),y:58});
  route.pickups.push({id:`${spec.id}:${sequenceIndex}:power`,type:spec.reward||['shield','magnet','speed'][sequenceIndex%3],x:start+d(2050),y:spec.rewardY??(patternIndex%2?311:58)});

  // Place the decorative chapter landmark after the playable geometry exists.
  // Each beat gets the emptiest nearby pocket, so a large sign or stall frames
  // the route without sitting on a platform, enemy, or recovery mechanic.
  if(spec.signature&&patternIndex%2===0){
    const shape=SHAPES[spec.signature];
    const candidates=[2180,2000,1840,1680,1480,1320,1160].filter(dx=>d(dx)+shape.width<=SECTION_LENGTH);
    // Include nearby background landmarks from the preceding beat as well as
    // the current compound. Without that look-back, two large signs/stalls
    // can land 280 units apart at a section seam and read as one clump.
    const occupied=route.entities.filter(entity=>(!entity.background&&entity.x>=start-120&&entity.x<=start+SECTION_LENGTH+120)||(entity.background&&Math.abs(entity.x-start)<SECTION_LENGTH+420));
    const measure=dx=>{
      const x=start+d(dx),gaps=occupied.map(entity=>{
        const other=SHAPES[entity.type];
        return Math.abs((x+shape.width/2)-(entity.x+other.width/2))-((shape.width+other.width)/2+24);
      });
      return{overlaps:gaps.filter(gap=>gap<0).length,minGap:Math.min(...gaps)};
    };
    const chosen=candidates.reduce((best,dx)=>{
      const next=measure(dx),current=measure(best);
      return next.overlaps<current.overlaps||next.overlaps===current.overlaps&&next.minGap>current.minGap?dx:best;
    },candidates[0]);
    put(spec.signature,chosen,0);
  }
}

const FINALES=Object.freeze({
  pier:[["checkpoint",420,0],["conveyor",980,0],["fireEscape",1540,120],["deliveryBoss",2500,0],["barrier",3400,0],["finish",5000,0]],
  loading:[["checkpoint",420,0],["shutter",980,0],["crane",1700,0],["deliveryBoss",2700,0],["rollingCart",3650,0],["finish",5300,0]],
  rooftop:[["checkpoint",420,0],["fireEscape",980,120],["rooftopFan",1720,0],["deliveryBoss",2700,0],["barrier",3650,0],["finish",5200,0]],
  market:[["checkpoint",420,0],["sweeper",1080,0],["bollards",1850,0],["deliveryBoss",2800,0],["barrel",3750,0],["finish",5200,0]],
  underpass:[["checkpoint",420,0],["train",1200,0],["underpassVent",2550,0],["deliveryBoss",3300,0],["barrier",4300,0],["finish",5800,0]],
  subway:[["checkpoint",420,0],["train",1200,0],["subwayConductor",2700,0],["deliveryBoss",3500,0],["subwayTurnstile",4550,0],["finish",6000,0]],
  court:[["checkpoint",420,0],["bollards",1100,0],["basketballHoop",1850,0],["deliveryBoss",2700,0],["sweeper",3700,0],["finish",5250,0]],
  bridge:[["checkpoint",420,0],["truck",1100,0],["crane",1900,0],["deliveryBoss",2950,0],["barrier",3950,0],["finish",5500,0]],
  crosswalk:[["checkpoint",420,0],["car",1100,0],["crosswalkSignal",1850,0],["deliveryBoss",2700,0],["bollards",3700,0],["finish",5250,0]],
  dawn:[["checkpoint",420,0],["conveyor",1050,0],["factoryPress",1800,0],["deliveryBoss",2750,0],["factoryShoePile",3800,0],["finish",5350,0]],
  victory:[["checkpoint",420,0],["suitBoss",2200,0],["victoryBossBarrel",3200,0],["victoryBossBarrel",3900,0],["victoryBossBarrel",4600,0],["finish",6200,0]],
});

// The final banner is a destination, not a UI element floating in a blank
// road.  Each chapter gets a small, grounded arrival composition so its last
// screen still belongs to the place the player has been running through.
// These are decorative landmarks with empty solids; they frame the finish
// without creating a surprise collision in the last reaction window.
const FINALE_DRESSING=Object.freeze({
  // Keep finish cues close enough that the faster scenery tracks carry one
  // into view as the preceding cue leaves, including narrow portrait screens.
  // Repeated animated props made the end of every block look like a prop
  // gallery instead of the same street reaching a destination.
  pier:[['waterfrontMarker',-300],['waterfrontMarker',-40]],
  loading:[['loadingCrates',-300],['warehouseSign',-40]],
  rooftop:[['rooftopTank',-300],['rooftopTank',-40]],
  market:[['marketStall',-300],['marketStall',-40]],
  underpass:[['underpassVent',-300],['underpassVent',-40]],
  subway:[['subwaySignal',-300],['subwaySignal',-40]],
  court:[['basketballHoop',-300],['basketballHoop',-40]],
  bridge:[['bridgeAnchor',-300],['bridgeAnchor',-40]],
  crosswalk:[['crosswalkSignal',-300],['crosswalkSignal',-40]],
  dawn:[['dawnStreetlight',-300],['dawnStreetlight',-40]],
  victory:[['dawnStreetlight',-300],['victoryFan',-180],['victoryBanner',80],['victoryDrum',340]],
});

const FINALE_COIN_ARCS=Object.freeze({
  pier:170,loading:155,rooftop:215,market:190,underpass:145,
  subway:185,court:125,bridge:175,crosswalk:205,dawn:165,victory:190,
});

const structuralPriority = type => ({
  train: 5, platform: 4, fireEscape: 4, deliveryBoss: 4, suitBoss: 4, securityGate: 3, checkpoint: 3, button: 3, finish: 3,
}[type] || 1);
const boxesOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Authored pieces are allowed to share a visual neighborhood, but their
// colliders must never stack into an unreadable wall. Keep set pieces and
// traversable decks, then discard the lower-priority optional prop/enemy when
// a seeded variant still produces a solid intersection.
function sanitizeRoute(route) {
  // Song-length chapters repeat the authored deck several times, so resolve
  // until a complete pass is clean instead of assuming three short sections.
  for (let pass = 0; pass < route.entities.length; pass++) {
    const entities = route.entities.filter(entity => !entity.decorative && solidBoxes(entity).length);
    let removed = false;
    outer: for (let i = 0; i < entities.length; i++) for (let j = i + 1; j < entities.length; j++) {
      if (!solidBoxes(entities[i]).some(firstBox => solidBoxes(entities[j]).some(secondBox => boxesOverlap(firstBox, secondBox)))) continue;
      const first = entities[i], second = entities[j];
      const p1 = structuralPriority(first.type), p2 = structuralPriority(second.type);
      const victim = p1 === p2 ? second : (p1 < p2 ? first : second);
      if (p1 >= 3 && p2 >= 3) {
        victim.x = Math.max(victim.x, Math.max(first.x + first.width, second.x + second.width) + 90);
        victim.previousX = victim.x;
      } else {
        route.entities = route.entities.filter(entity => entity !== victim);
      }
      removed = true;
      break outer;
    }
    if (!removed) break;
  }
  route.entities.sort((a,b)=>a.x-b.x);
}

// Enemies either stand on the street or on a real authored top face. Any
// elevated actor without support is snapped to the street instead of being
// allowed to hover beside a platform. Skateboard rivals on supported ledges
// receive the authored drop behavior used by the simulation.
function groundEnemies(route) {
  const supports=route.entities.filter(entity=>!entity.decorative&&!SHAPES[entity.type]?.enemy);
  for(const enemy of route.entities.filter(entity=>SHAPES[entity.type]?.enemy)){
    if((enemy.y||0)<=1){enemy.y=0;continue;}
    const center=enemy.x+enemy.width/2;
    const faces=supports.flatMap(entity=>topFaces(entity).filter(face=>center>=face.x&&center<=face.x+face.w));
    const support=faces.sort((a,b)=>Math.abs(a.y-enemy.y)-Math.abs(b.y-enemy.y))[0];
    if(!support||Math.abs(support.y-enemy.y)>90){enemy.y=0;continue;}
    enemy.y=support.y;
    if(enemy.type==='rival')enemy.ledgeDrop=true;
  }
}

function keepPlatformsReachable(route) {
  for(const platform of route.entities.filter(entity=>['platform','fireEscape'].includes(entity.type))){
    const top=Math.max(...topFaces(platform).map(face=>face.y),0);
    if(top<=PLATFORM_RULES.maxPlatformTop)continue;
    platform.y=Math.max(0,(platform.y||0)-(top-PLATFORM_RULES.maxPlatformTop));
    platform.previousY=platform.y;
  }
}

export function makeRoute(stage=0,difficulty='standard',seed=42){
  const data=LEVELS[stage];
  const routeSeed=seed>>>0;
  const route={entities:[],pickups:[],speed:data.speed*DIFFICULTIES[difficulty].speed,length:0,duration:0};
  for(let i=0;i<7;i++)route.pickups.push({id:`start:${i}`,type:'coin',x:PLAYER_X+220+i*48,y:58});
  // Start climbing and encountering enemies in the first block, with all
  // scenery and actors already placed in world space before they come into view.
  const beats=data.beats?.length?data.beats:data.sections;
  const finale=FINALES[data.finale]||FINALES.pier;
  const finishDx=finale.find(([type])=>type==='finish')?.[1]??5200;
  // Leave a 20% musical recovery margin for the stomp bounce and its visual
  // beat. The simulation keeps running throughout the feedback animation.
  const targetFinishX=PLAYER_X+route.speed*data.songSeconds*.8;
  const base=targetFinishX-finishDx;
  const sectionCount=Math.max(beats.length,Math.floor((base-1350)/SECTION_LENGTH));
  const storyBeats=Array.from({length:sectionCount},(_,i)=>beats[i%beats.length]);
  const variants=storyBeats.map((_,i)=>layoutVariant(routeSeed,stage,i));
  storyBeats.forEach((kind,i)=>section(route,kind,PLAYER_X+900+i*SECTION_LENGTH,i,stage,{variant:variants[i],style:data.style}));
  // The finale is a place-specific set-piece instead of a random late spawn.
  // Each chapter chooses its own order for the same readable verbs: jump,
  // roll, switch, climb, and clear a lethal strip. Sensors are safe to touch
  // and give the player a reliable progress landmark.
  const lastSectionEnd=PLAYER_X+900+sectionCount*SECTION_LENGTH;
  for(let x=lastSectionEnd+160,i=0;x<base-260;x+=72,i++)route.pickups.push({id:`final-approach:${stage}:${i}`,type:'coin',x,y:58+(i%4===2?70:0)});
  let finalIndex=0;
  const putFinal=(type,x,y=0,extra={})=>{
    const shape=SHAPES[type];
    route.entities.push({id:`final:${type}:${finalIndex++}`,type,x,y,width:shape.width,hit:false,passed:false,
      ...(shape.decorative?{decorative:true,background:true}:{}),...(shape.boss?{bossHealth:shape.bossHealth}:{}),...extra});
  };
  let finishX=targetFinishX;
  for(const [type,dx,y] of finale){
    if(type==='train'){
      const trainX=base+dx;
      // The train is staged off-screen, then starts a deliberate approach
      // when the runner enters its warning window. Its real patrol is swept
      // by the collision system, so the visual rush and the hitbox share one
      // timeline.
      putFinal(type,trainX,y,{patrol:{min:trainX-1650,max:trainX+240,speed:330+data.speed*.2},direction:-1,rush:{trigger:1500,active:false}});
    }else if(type==='barrel'||type==='victoryBossBarrel'){
      const barrelX=base+dx;
      putFinal(type,barrelX,y,{patrol:{min:barrelX-760,max:barrelX+30,speed:235},direction:-1,thrown:true});
    }else putFinal(type,base+dx,y);
    if(type==='finish')finishX=base+dx;
  }

  // Give the approach a readable visual rhythm and a small reward line. The
  // landmarks arrive before the finish banner, where the player can use them
  // as a place cue, while the coins create a visible invitation to keep
  // moving through the otherwise empty recovery distance.
  const arrival=FINALE_DRESSING[data.finale]||FINALE_DRESSING.pier;
  arrival.forEach(([type,dx],i)=>{
    const shape=SHAPES[type];
    if(!shape) return;
    route.entities.push({id:`final-dressing:${stage}:${i}`,type,x:finishX+dx,y:0,width:shape.width,hit:false,passed:false,decorative:true,background:true,backgroundGroup:'finish-arrival'});
  });
  const coinY=FINALE_COIN_ARCS[data.finale]??170;
  for(let i=0;i<7;i++)route.pickups.push({id:`final-coins:${stage}:${i}`,type:'coin',x:finishX-610+i*68,y:coinY+(i<3?i*28:(i>4?(6-i)*28:84))});
  route.finishX=finishX;route.playLength=finishX-PLAYER_X;route.length=finishX+360;
  keepPlatformsReachable(route);
  groundEnemies(route);
  sanitizeRoute(route);
  route.design={chapter:data.name,style:data.style,beats:storyBeats.map(item=>typeof item==='string'?item:item.id),finale:data.finale,seed:routeSeed,variants,
    rules:PLATFORM_RULES};
  route.duration=route.playLength/route.speed;
  route.entities.sort((a,b)=>a.x-b.x);route.pickups.sort((a,b)=>a.x-b.x);
  return route;
}
export function endlessSection(sequence,seed,start,speed){
  const random=seeded(seed+sequence*701);
  // Let the first twenty compounds establish the four core verbs before the
  // lethal and moving set pieces enter the run. This gives a fair opening in
  // the timed mode while still making a long run expand into a six-piece deck.
  const kinds=sequence<20?['stairs','traffic','works','market']:['stairs','traffic','works','market','hazard','train'];
  // Advance through two silhouettes at a time and let the seed choose one of
  // the neighboring variants. The stride prevents adjacent repeats while the
  // seed continues to decide the reproducible ordering.
  const choice=(sequence*2+Math.floor(random()*2))%kinds.length;
  const kind=kinds[choice];
  const route={entities:[],pickups:[],kind};
  section(route,kind,PLAYER_X+start,sequence,Math.min(9,Math.floor(sequence/3)),{variant:(sequence+Math.floor(random()*3))%3});
  return{...route,end:start+SECTION_LENGTH};
}
