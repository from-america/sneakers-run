// One world space: Y points up, each entity's origin is its visible foot line.
export const STEP = 1 / 120;
export const PLAYER_X = 224;
export const PHYSICS = Object.freeze({ gravity: 950, jump: 620, doubleJump: 570, maxHeight: 480,
  buffer: .14, coyote: .10, roll: .92, invulnerability: 1.25, standing: 125, low: 83, radius: 23, stomp: 490 });
// Suit pursuers are a forgiving visual simulation, not a second collision
// body. They borrow Sneakers' complete movement state after a short delay,
// but stay on the shared floor whenever an elevated route cannot be mirrored
// safely.
export const CHASER_PHYSICS = Object.freeze({
  delay: .2,
  gaps: Object.freeze([155, 230]),
  stompDisjoint: .38,
});
export const DIFFICULTIES = Object.freeze({ standard: { speed: 1, lives: 3 }, relaxed: { speed: .8, lives: 5 } });
// Backgrounds are authored as complete places, not interchangeable plates.
// The profile tells the renderer and editor how much architecture should nest
// around the fixed floor and the player's full jump envelope. dressingLine is
// the reviewed rear sidewalk/platform baseline in normalized source-image Y.
export const SCENE_PROFILES = Object.freeze({
  '01-waterfront-flat-v2.png': { profile:'open', floorLine:.705, horizonLine:.39, foregroundBand:[.68,1], anchors:['pier','rail','shore'] },
  '02-rooftop-flat-v2.png': { profile:'open', floorLine:.705, horizonLine:.3, foregroundBand:[.67,1], anchors:['parapet','roof-door','antenna'] },
  '03-underpass-flat-v2.png': { profile:'semi-enclosed', floorLine:.705, horizonLine:.48, ceilingLine:.16, foregroundBand:[.67,1], anchors:['pier','beam','drain'] },
  '04-market-flat-v2.png': { profile:'semi-enclosed', floorLine:.705, horizonLine:.4, ceilingLine:.24, foregroundBand:[.67,1], anchors:['stall','awning','service-door'] },
  '05-subway-flat-v2.png': { profile:'enclosed', floorLine:.705, horizonLine:.28, ceilingLine:.09, foregroundBand:[.67,1], anchors:['column','platform-edge','tunnel-mouth'] },
  '06-basketball-flat-v2.png': { profile:'open', floorLine:.705, horizonLine:.36, foregroundBand:[.67,1], anchors:['fence','bleacher','hoop'] },
  '07-bridge-flat-v2.png': { profile:'open', floorLine:.705, horizonLine:.34, foregroundBand:[.67,1], anchors:['girder','cable','pier'] },
  '08-crosswalk-flat-v2.png': { profile:'semi-enclosed', floorLine:.705, horizonLine:.39, foregroundBand:[.67,1], anchors:['curb','signal','storefront'] },
  '09-warehouse-flat-v2.png': { profile:'enclosed', floorLine:.705, horizonLine:.25, ceilingLine:.08, foregroundBand:[.67,1], anchors:['rack','loading-bay','beam'] },
  '10-dawn-flat-v2.png': { profile:'open', floorLine:.705, horizonLine:.36, foregroundBand:[.67,1], anchors:['curb','hill','streetlight'] },
  '01-sneaker-shops-flat-v1.png': { dressingLine:.59, profile:'semi-enclosed', floorLine:.705, horizonLine:.39, foregroundBand:[.67,1], anchors:['shopfront','awning','curb'] },
  '02-sunset-city-flat-v1.png': { dressingLine:.67, profile:'open', floorLine:.705, horizonLine:.36, foregroundBand:[.67,1], anchors:['skyline','bridge','curb'] },
  '03-chinatown-flat-v1.png': { dressingLine:.62, profile:'semi-enclosed', floorLine:.705, horizonLine:.34, foregroundBand:[.67,1], anchors:['lantern','dragon','shopfront'] },
  '04-rooftop-night-flat-v1.png': { dressingLine:.61, profile:'open', floorLine:.705, horizonLine:.3, foregroundBand:[.67,1], anchors:['parapet','tank','antenna'] },
  '05-subway-underground-flat-v1.png': { dressingLine:.585, profile:'enclosed', floorLine:.705, horizonLine:.28, ceilingLine:.09, foregroundBand:[.67,1], anchors:['column','platform-edge','tunnel-mouth'] },
  '06-sneaker-district-flat-v1.png': { dressingLine:.615, profile:'semi-enclosed', floorLine:.705, horizonLine:.39, foregroundBand:[.67,1], anchors:['shopfront','fire-escape','overpass'] },
  '07-airport-flat-v1.png': { dressingLine:.54, profile:'enclosed', floorLine:.705, horizonLine:.34, ceilingLine:.1, foregroundBand:[.67,1], anchors:['carousel','windows','jetway'] },
  '08-yam-farm-flat-v1.png': { dressingLine:.81, profile:'open', floorLine:.705, horizonLine:.39, foregroundBand:[.67,1], anchors:['field','barn','fence'] },
  '09-sneaker-factory-flat-v1.png': { dressingLine:.55, profile:'enclosed', floorLine:.705, horizonLine:.31, ceilingLine:.07, foregroundBand:[.67,1], anchors:['conveyor','rack','window'] },
  '10-victory-lap-flat-v1.png': { dressingLine:.56, profile:'open', floorLine:.705, horizonLine:.35, foregroundBand:[.67,1], anchors:['crowd','barrier','plaza'] },
});
export const URBAN_KIT = Object.freeze({
  image:'assets/runtime/urban-hazard-kit-v1.png',
  // Source rectangles are stable, authored regions in the generated raster.
  spikes:[20,322,410,130], electric:[445,322,430,130], finish:[895,55,420,410],
  checkpoint:[1360,245,150,220], button:[18,742,235,165], gate:[270,555,410,350], train:[690,590,820,345],
});
// The reviewed kit sheet includes transparent registration room below each
// painted object.  These offsets move the painted contact edge onto the
// entity's authored floor line.  Collision boxes use the same post-registration
// coordinates, so an asset can never look airborne while its collider sits on
// the ground.
export const KIT_ART_REGISTRATION = Object.freeze({
  spikes: Object.freeze({ offsetY:-6, visible:[0,6,404,119] }),
  electric: Object.freeze({ offsetY:-4, visible:[0,4,423,122] }),
  finish: Object.freeze({ offsetY:-16, visible:[1,0,419,350] }),
  checkpoint: Object.freeze({ offsetY:-16, visible:[11,0,133,166] }),
  button: Object.freeze({ offsetY:-20, visible:[4,0,224,137] }),
  gate: Object.freeze({ offsetY:-31, visible:[0,0,399,299] }),
  train: Object.freeze({ offsetY:-41, visible:[0,0,820,270] }),
});
const enemy = (art, name, width, height, body, extra = {}) => ({ art, name, width, height, enemy: true, move:'stomp', solids:[body], ...extra });
// Level signatures are authored dressing props. They are grounded to the
// shared floor line, rendered with the same route motion as the world, and
// deliberately have no solids so a visual landmark can never create a hidden
// collision shelf.
export const LEVEL_SIGNATURES = Object.freeze([
  'waterfrontMarker', 'loadingCrates', 'rooftopTank', 'marketStall',
  'underpassVent', 'subwaySignal', 'basketballHoop', 'bridgeAnchor',
  'crosswalkSignal', 'dawnStreetlight', 'warehouseSign',
]);
export const STREET_KIT_ASSETS = Object.freeze([
  'trafficCone', 'roadworkSign', 'newspaperBox', 'fireHydrant', 'bikeRack',
  'parkingMeter', 'trashBin', 'cableSpool', 'sawhorse', 'barricadeLamp',
]);
export const SHAPES = Object.freeze({
  barrier: { width:150,height:90,art:'barrier',move:'jump',name:'road barrier',solids:[[13,0,124,62]] },
  car: { width:200,height:108,art:'car',move:'jump',name:'parked car',loop:true,fps:2,solids:[[15,4,184,60],[40,64,91,40]] },
  barrel: { width:132,height:95,art:'barrel',move:'jump',name:'barrels',solids:[[15,0,108,86]] },
  rollingCart: { width:230,height:151,art:'rollingCart',raster:'rollingCart',move:'jump',name:'rolling cargo cart',flipMove:true,solids:[[14,0,202,92]] },
  dropGate: { width:270,height:240,art:'dropGate',raster:'dropGate',move:'timed',name:'timed drop gate',timed:true,floorSolids:[[14,0,242,78]],overheadSolids:[[14,96,242,30]],period:2.4,floorDuration:1.2 },
  oilSlick: { width:210,height:27,art:'oilSlick',raster:'oilSlick',move:'surface',name:'oil slick',sensor:true,surfaceHazard:true,surface:[10,0,190,18],solids:[] },
  gate: { width:246,height:184.5,art:'gate',move:'roll',name:'low clearance',solids:[[24,95,198,29]] },
  platform: { width:248,height:148,art:'platform',move:'route',name:'loading dock',top:121,surfaces:[[6,236,121]] },
  conveyor: { width:250,height:98,art:'conveyor',move:'route',name:'conveyor',solids:[[14,0,222,70]],belt:35 },
  bollards: { width:190,height:125,art:'bollards',move:'jump',name:'bollards',solids:[[18,5,31,116],[80,5,31,116],[144,5,31,116]] },
  shutter: { width:360,height:260,art:'shutter',move:'climb',name:'closed shutter',solids:[[18,0,324,253]] },
  sweeper: { width:246,height:166,art:'sweeper',move:'jump',name:'street sweeper',solids:[[22,0,205,101],[50,101,92,51]] },
  truck: { width:340,height:148,art:'truck',move:'climb',name:'delivery truck',solids:[[12,0,316,55],[18,55,200,89],[220,55,67,69],[288,55,40,21]] },
  crane: { width:246,height:275,art:'crane',move:'climb',name:'crane',solids:[[4,0,238,26],[47,25,21,233],[54,232,183,27],[178,42,39,130]] },
  rival: enemy('rival','skateboard rival',120,130,[24,8,67,103]),
  courier: enemy('courier','shoe-box courier',146,144,[15,0,120,125]),
  business: enemy('business','suit runner',100,145,[25,4,51,125]),
  business2: enemy('business2','suit sprinter',110,148,[25,4,58,129]),
  parking: enemy('parking','parking attendant',102,145,[23,3,57,126]),
  raincoat: enemy('raincoat','raincoat snatcher',122,146,[26,5,65,123]),
  bike: enemy('bike','bike messenger',154,143,[13,2,128,124]),
  pigeons: enemy('pigeons','pigeon flock',146,88,[20,7,102,57]),
  roller: enemy('roller','construction roller',164,138,[15,2,130,112]),
  camera: enemy('camera','camera chaser',120,153,[27,2,67,136]),
  deliveryBoss: enemy('deliveryBoss','delivery boss',270,175,[20,0,232,164],{boss:true,bossHealth:3}),
  suitBoss: enemy('business2','suited finale boss',142,178,[25,4,88,170],{boss:true,bossHealth:3}),
  victoryBarrelStack: { width:68,height:145,art:'victoryBarrelStack',move:'jump',name:'victory barrel stack',loop:true,fps:8,solids:[[6,0,56,116]] },
  victoryBossBarrel: { width:111.22,height:144.42,art:'victoryBossBarrel',move:'jump',name:'star boss barrel',loop:true,fps:8,flipMove:true,solids:[[8,0,95,118]] },
  victoryConfettiCannon: { width:126,height:103,art:'victoryConfettiCannon',move:'jump',name:'victory confetti cannon',loop:true,fps:8,solids:[[6,0,114,82]] },
  victoryHandPennant: { width:124,height:145,art:'victoryHandPennant',move:'jump',name:'victory hand pennant',loop:true,fps:8,solids:[[6,0,112,116]] },
  chinatownDragon: enemy('chinatownDragon','dragon dancer',220,166,[30,0,166,154]),
  airportHandler: enemy('airportHandler','baggage handler',196,145,[16,0,172,136]),
  airportCart: enemy('airportCart','baggage cart',190,138,[18,0,154,124]),
  airportSecurityDog: enemy('airportSecurityDog','airport security dog',176,148,[20,0,136,136]),
  airportBaggageBot: enemy('airportBaggageBot','airport baggage bot',142,148,[16,0,110,136]),
  airportSuitcases: { width:142,height:140,art:'airportSuitcases',move:'jump',name:'airport suitcase cluster',loop:true,fps:8,solids:[[8,0,126,112]] },
  airportBaggageCluster: { width:146,height:128,art:'airportBaggageCluster',move:'jump',name:'airport baggage cluster',loop:true,fps:8,solids:[[8,0,130,104]] },
  airportBoardingGate: { width:150,height:144,art:'airportBoardingGate',move:'jump',name:'airport boarding gate',loop:true,fps:8,solids:[[8,0,134,115]] },
  airportBoardingStanchion: { width:172,height:145,art:'airportBoardingStanchion',move:'jump',name:'airport boarding stanchion',loop:true,fps:8,solids:[[8,0,156,116]] },
  airportTugCart: { width:193,height:142,art:'airportTugCart',move:'jump',name:'airport tug cart',loop:true,fps:8,solids:[[8,0,177,113]] },
  airportJetway: { width:193,height:136,art:'airportJetway',move:'jump',name:'airport jetway',loop:true,fps:8,solids:[[8,0,180,112]] },
  airportJetwayChock: { width:141,height:133,art:'airportJetwayChock',move:'jump',name:'airport jetway wheel chock',loop:true,fps:8,solids:[[7,0,127,106]] },
  airportJetwayDoor: { width:148,height:140,art:'airportJetwayDoor',move:'jump',name:'airport jetway doorway',loop:true,fps:8,solids:[[7,0,134,112]] },
  airportStairs: { width:144,height:144,art:'airportStairs',move:'jump',name:'airport boarding stairs',loop:true,fps:8,solids:[[8,0,128,112]] },
  yamCreature: enemy('yamCreature','yam creature',172,142,[22,0,128,132]),
  yamScarecrow: enemy('yamScarecrow','yam scarecrow',190,160,[22,0,152,150]),
  yamGobbler: enemy('yamGobbler','yam gobbler',124,149,[16,0,108,137]),
  factoryWorker: enemy('factoryWorker','box worker',190,145,[18,0,154,137]),
  factoryBoxRunner: enemy('factoryBoxRunner','sneaker box runner',155,149,[18,0,137,138]),
  subwayConductor: enemy('subwayConductor','subway conductor',170,148,[22,0,126,141]),
  subwayCart: { width:134,height:128,art:'subwayCart',move:'jump',name:'subway maintenance cart',loop:true,fps:8,solids:[[10,0,114,104]] },
  subwayToolbox: { width:155,height:140,art:'subwayToolbox',move:'jump',name:'subway toolbox cart',loop:true,fps:8,solids:[[8,0,147,112]] },
  subwayTurnstile: { width:127,height:122,art:'subwayTurnstile',move:'jump',name:'subway turnstile',loop:true,fps:8,solids:[[6,0,115,100]] },
  subwayBench: { width:145,height:112,art:'subwayBench',move:'jump',name:'subway platform bench',loop:true,fps:8,solids:[[6,0,133,78]] },
  subwaySignalBox: { width:87,height:145,art:'subwaySignalBox',move:'jump',name:'subway signal box',loop:true,fps:8,solids:[[6,0,75,116]] },
  subwaySignalLantern: { width:79,height:145,art:'subwaySignalLantern',move:'jump',name:'subway signal lantern',loop:true,fps:8,solids:[[5,0,69,116]] },
  subwayVendingMachine: { width:93,height:129,art:'subwayVendingMachine',move:'jump',name:'subway vending machine',loop:true,fps:8,solids:[[6,0,87,103]] },
  subwayTicketMachine: { width:94,height:145,art:'subwayTicketMachine',move:'jump',name:'subway ticket machine',loop:true,fps:8,solids:[[8,0,78,116]] },
  subwayEmergencyBox: { width:79,height:145,art:'subwayEmergencyBox',move:'jump',name:'subway emergency box',loop:true,fps:8,solids:[[6,0,67,116]] },
  subwayPlatformSign: { width:51,height:145,art:'subwayPlatformSign',move:'jump',name:'subway platform sign',loop:true,fps:8,solids:[[5,0,41,116]] },
  subwayRailJunction: { width:300,height:137,art:'subwayRailJunction',move:'jump',name:'subway rail junction',loop:true,fps:8,solids:[[8,0,284,109]] },
  subwayTrackSwitch: { width:117,height:133,art:'subwayTrackSwitch',move:'jump',name:'subway track switch',loop:true,fps:8,solids:[[8,0,101,105]] },
  subwayPlatformUmbrella: { width:61,height:145,art:'subwayPlatformUmbrella',move:'jump',name:'subway umbrella stand',loop:true,fps:8,solids:[[5,0,51,116]] },
  subwayPlatformWarningLamp: { width:74,height:145,art:'subwayPlatformWarningLamp',move:'jump',name:'subway platform warning lamp',loop:true,fps:8,solids:[[6,0,62,116]] },
  factoryBelt: { width:133,height:118,art:'factoryBelt',move:'jump',name:'sneaker-box conveyor',loop:true,fps:8,solids:[[8,0,117,90]] },
  factoryPress: { width:113,height:140,art:'factoryPress',move:'jump',name:'sneaker stamping press',loop:true,fps:8,solids:[[6,0,101,112]] },
  factoryShoePile: { width:164,height:137,art:'factoryShoePile',move:'jump',name:'finished sneaker pile',loop:true,fps:8,solids:[[8,0,148,108]] },
  factoryLaceBin: { width:157,height:143,art:'factoryLaceBin',move:'jump',name:'rolling lace bin',loop:true,fps:8,solids:[[8,0,141,110]] },
  factoryThreadCart: { width:208,height:131,art:'factoryThreadCart',move:'jump',name:'rolling thread cart',loop:true,fps:8,solids:[[8,0,192,102]] },
  factoryLabelRoll: { width:226,height:140,art:'factoryLabelRoll',move:'jump',name:'rolling label machine',loop:true,fps:8,solids:[[8,0,210,110]] },
  factoryRobotArm: { width:149,height:122,art:'factoryRobotArm',move:'jump',name:'factory robot arm',loop:true,fps:8,solids:[[8,0,133,98]] },
  factorySneakerMold: { width:114,height:145,art:'factorySneakerMold',move:'jump',name:'sneaker mold press',loop:true,fps:8,solids:[[6,0,102,116]] },
  factoryLaceSpool: { width:197,height:144,art:'factoryLaceSpool',move:'jump',name:'factory lace spool cart',loop:true,fps:8,solids:[[8,0,181,115]] },
  factoryLaceBundle: { width:170,height:139,art:'factoryLaceBundle',move:'jump',name:'factory rolling lace bundle',loop:true,fps:8,solids:[[8,0,154,111]] },
  factoryPolishWheel: { width:123,height:132,art:'factoryPolishWheel',move:'jump',name:'factory polish wheel',loop:true,fps:8,solids:[[6,0,111,105]] },
  factoryShoeDryer: { width:156,height:145,art:'factoryShoeDryer',move:'jump',name:'factory shoe dryer',loop:true,fps:8,solids:[[8,0,140,116]] },
  factorySneakerTray: { width:176,height:145,art:'factorySneakerTray',move:'jump',name:'factory sneaker tray',loop:true,fps:8,solids:[[8,0,160,116]] },
  factoryBoxChute: { width:121,height:135,art:'factoryBoxChute',move:'jump',name:'factory shoe box chute',loop:true,fps:8,solids:[[6,0,109,106]] },
  factoryGluePuddle: { width:86.95,height:25.85,art:'factoryGluePuddle',move:'surface',name:'factory adhesive puddle',loop:true,fps:8,sensor:true,surfaceHazard:true,surface:[4,0,79,10],solids:[] },
  yamRoller: { width:149,height:142,art:'yamRoller',move:'jump',name:'rolling yam',loop:true,fps:8,solids:[[10,0,129,112]] },
  yamCrate: { width:164,height:113,art:'yamCrate',move:'jump',name:'yam produce crate',loop:true,fps:8,solids:[[8,0,148,90]] },
  yamHarvestCrate: { width:164,height:144,art:'yamHarvestCrate',move:'jump',name:'yam harvest crate',loop:true,fps:8,solids:[[8,0,148,116]] },
  yamWheelbarrow: { width:124,height:145,art:'yamWheelbarrow',move:'jump',name:'yam wheelbarrow',loop:true,fps:8,solids:[[8,0,108,112]] },
  yamSackBundle: { width:113,height:129,art:'yamSackBundle',move:'jump',name:'yam sack bundle',loop:true,fps:8,solids:[[8,0,97,103]] },
  yamFieldFence: { width:202,height:135,art:'yamFieldFence',move:'jump',name:'yam field fence',loop:true,fps:8,solids:[[8,0,186,108]] },
  yamHarvestBasket: { width:164,height:129,art:'yamHarvestBasket',move:'jump',name:'yam harvest basket',loop:true,fps:8,solids:[[8,0,148,103]] },
  yamIrrigationSprinkler: { width:103,height:117,art:'yamIrrigationSprinkler',move:'jump',name:'yam irrigation sprinkler',loop:true,fps:8,solids:[[8,0,87,93]] },
  yamIrrigationWheel: { width:119,height:143,art:'yamIrrigationWheel',move:'jump',name:'yam irrigation wheel',loop:true,fps:8,solids:[[8,0,103,112]] },
  yamIrrigationWindmill: { width:122,height:142,art:'yamIrrigationWindmill',move:'jump',name:'yam irrigation windmill',loop:true,fps:8,solids:[[6,0,110,114]] },
  yamHayBale: { width:153,height:119,art:'yamHayBale',move:'jump',name:'rolling yam hay bale',loop:true,fps:8,solids:[[8,0,137,95]] },
  chinatownDrumCart: { width:201,height:134,art:'chinatownDrumCart',move:'jump',name:'parade drum cart',loop:true,fps:8,solids:[[14,0,170,104]] },
  chinatownLionCart: { width:140,height:138,art:'chinatownLionCart',move:'jump',name:'lion dance cart',loop:true,fps:8,solids:[[8,0,124,108]] },
  chinatownLanternGate: { width:156,height:150,art:'chinatownLanternGate',move:'jump',name:'lantern gate',loop:true,fps:8,solids:[[8,0,140,120]] },
  chinatownShopSign: { width:106,height:142,art:'chinatownShopSign',move:'jump',name:'hanging Chinatown sign',loop:true,fps:8,solids:[[6,0,94,112]] },
  chinatownLanternCluster: { width:105,height:145,art:'chinatownLanternCluster',move:'jump',name:'swaying lantern cluster',loop:true,fps:8,solids:[[8,0,97,112]] },
  chinatownShopShutter: { width:135,height:145,art:'chinatownShopShutter',move:'jump',name:'Chinatown shop shutter',loop:true,fps:8,solids:[[8,0,119,115]] },
  chinatownLanternPole: { width:90,height:150,art:'chinatownLanternPole',move:'jump',name:'Chinatown lantern pole',loop:true,fps:8,solids:[[6,0,78,120]] },
  chinatownMarketCrate: { width:145,height:145,art:'chinatownMarketCrate',move:'jump',name:'Chinatown market crate',loop:true,fps:8,solids:[[8,0,129,116]] },
  chinatownFirecrackerCrate: { width:103,height:143,art:'chinatownFirecrackerCrate',move:'jump',name:'Chinatown firecracker crate',loop:true,fps:8,solids:[[6,0,91,114]] },
  chinatownFanStand: { width:118,height:145,art:'chinatownFanStand',move:'jump',name:'Chinatown fan stand',loop:true,fps:8,solids:[[8,0,102,116]] },
  chinatownSteamCart: { width:121,height:143,art:'chinatownSteamCart',move:'jump',name:'Chinatown steam cart',loop:true,fps:8,solids:[[8,0,105,114]] },
  chinatownSteamBasket: { width:119,height:122,art:'chinatownSteamBasket',move:'jump',name:'Chinatown steam basket cart',loop:true,fps:8,solids:[[6,0,107,96]] },
  rooftopDish: { width:87,height:150,art:'rooftopDish',move:'jump',name:'rooftop satellite dish',loop:true,fps:8,solids:[[6,0,75,120]] },
  rooftopFan: { width:161,height:132,art:'rooftopFan',move:'jump',name:'rooftop HVAC fan',loop:true,fps:8,solids:[[10,0,141,104]] },
  rooftopAntenna: { width:124,height:138,art:'rooftopAntenna',move:'jump',name:'rooftop antenna',loop:true,fps:8,solids:[[8,0,108,108]] },
  rooftopClothesline: { width:193,height:145,art:'rooftopClothesline',move:'jump',name:'rooftop clothesline',loop:true,fps:8,solids:[[8,0,177,112]] },
  rooftopClotheslineFlutter: { width:166,height:145,art:'rooftopClotheslineFlutter',move:'jump',name:'rooftop clothesline flutter',loop:true,fps:8,solids:[[8,0,150,116]] },
  rooftopBirdFlock: { width:135,height:119,art:'rooftopBirdFlock',move:'jump',name:'rooftop bird flock',loop:true,fps:8,solids:[[8,0,119,95]] },
  rooftopWaterTank: { width:118,height:145,art:'rooftopWaterTank',move:'jump',name:'rooftop water tank',loop:true,fps:8,solids:[[8,0,102,116]] },
  rooftopValveFlag: { width:122,height:145,art:'rooftopValveFlag',move:'jump',name:'rooftop valve flag',loop:true,fps:8,solids:[[6,0,110,116]] },
  rooftopDishArray: { width:158,height:141,art:'rooftopDishArray',move:'jump',name:'rooftop dish array',loop:true,fps:8,solids:[[8,0,142,112]] },
  rooftopCableAnchor: { width:183,height:128,art:'rooftopCableAnchor',move:'jump',name:'rooftop cable anchor',loop:true,fps:8,solids:[[8,0,167,102]] },
  rooftopPigeonCrate: { width:143,height:123,art:'rooftopPigeonCrate',move:'jump',name:'rooftop pigeon crate',loop:true,fps:8,solids:[[7,0,129,98]] },
  airportDepartureBoard: { width:93,height:143,art:'airportDepartureBoard',move:'jump',name:'airport departure board',loop:true,fps:8,solids:[[6,0,81,114]] },
  airportSecurityScanner: { width:161,height:134,art:'airportSecurityScanner',move:'jump',name:'airport security scanner',loop:true,fps:8,solids:[[8,0,145,106]] },
  airportRunwayCone: { width:123,height:128,art:'airportRunwayCone',move:'jump',name:'airport runway cone',loop:true,fps:8,solids:[[8,0,107,102]] },
  airportSecurityTray: { width:112,height:137,art:'airportSecurityTray',move:'jump',name:'airport security tray',loop:true,fps:8,solids:[[6,0,100,108]] },
  airportBaggageCarousel: { width:133,height:145,art:'airportBaggageCarousel',move:'jump',name:'airport baggage carousel',loop:true,fps:8,solids:[[8,0,117,116]] },
  airportSuitcasePile: { width:110.35,height:139.35,art:'airportSuitcasePile',move:'jump',name:'wobbling airport suitcase pile',loop:true,fps:8,solids:[[8,0,94,115]] },
  sunsetBarrier: { width:158,height:132,art:'sunsetBarrier',move:'jump',name:'sunset traffic barrier',loop:true,fps:8,solids:[[8,0,150,102]] },
  sunsetSignal: { width:56,height:145,art:'sunsetSignal',move:'jump',name:'sunset traffic signal',loop:true,fps:8,solids:[[5,0,46,116]] },
  sunsetNeonSign: { width:65,height:144,art:'sunsetNeonSign',move:'jump',name:'sunset neon sign',loop:true,fps:8,solids:[[4,0,57,115]] },
  sunsetBollards: { width:177,height:131,art:'sunsetBollards',move:'jump',name:'sunset street bollards',loop:true,fps:8,solids:[[8,0,161,104]] },
  sunsetLitSign: { width:57,height:145,art:'sunsetLitSign',move:'jump',name:'sunset lit sign',loop:true,fps:8,solids:[[5,0,47,116]] },
  sneakerRack: { width:101,height:138,art:'sneakerRack',move:'jump',name:'sneaker display rack',loop:true,fps:8,solids:[[7,0,87,115]] },
  sneakerShopRope: { width:164,height:145,art:'sneakerShopRope',move:'jump',name:'sneaker shop security rope',loop:true,fps:8,solids:[[8,0,148,116]] },
  sneakerShopPolishCart: { width:154,height:113,art:'sneakerShopPolishCart',move:'jump',name:'sneaker polish cart',loop:true,fps:8,solids:[[8,0,138,90]] },
  sneakerShopBench: { width:163,height:120,art:'sneakerShopBench',move:'jump',name:'sneaker shop display bench',loop:true,fps:8,solids:[[8,0,147,96]] },
  sneakerLaceDisplay: { width:172,height:133,art:'sneakerLaceDisplay',move:'jump',name:'sneaker lace display',loop:true,fps:8,solids:[[8,0,156,104]] },
  sneakerBoxTower: { width:101,height:136,art:'sneakerBoxTower',move:'jump',name:'stacked shoebox display',loop:true,fps:8,solids:[[6,0,89,110]] },
  sneakerShopWindow: { width:193,height:142,art:'sneakerShopWindow',move:'jump',name:'sneaker shop window',loop:true,fps:8,solids:[[8,0,177,114]] },
  sneakerFittingMirror: { width:76,height:145,art:'sneakerFittingMirror',move:'jump',name:'sneaker fitting mirror',loop:true,fps:8,solids:[[5,0,66,116]] },
  sneakerBoxStack: { width:98,height:143,art:'sneakerBoxStack',move:'jump',name:'sneaker box stack',loop:true,fps:8,solids:[[6,0,86,114]] },
  sneakerSalePennants: { width:221,height:142,art:'sneakerSalePennants',move:'route',name:'sneaker sale pennants',loop:true,fps:8,solids:[],decorative:true },
  victoryFan: { width:112,height:170,art:'victoryFan',move:'route',name:'cheering victory fan',loop:true,fps:6,solids:[],decorative:true },
  victoryFoamFinger: { width:79,height:170,art:'victoryFoamFinger',move:'route',name:'foam-finger fan',loop:true,fps:6,solids:[],decorative:true },
  victoryBanner: { width:143,height:170,art:'victoryBanner',move:'route',name:'victory banner',loop:true,fps:6,solids:[],decorative:true },
  victoryConfettiPopper: { width:108,height:128,art:'victoryConfettiPopper',move:'route',name:'confetti popper',loop:true,fps:6,solids:[],decorative:true },
  victoryPennant: { width:158,height:127,art:'victoryPennant',move:'route',name:'victory pennant',loop:true,fps:6,solids:[],decorative:true },
  victoryDrum: { width:179,height:170,art:'victoryDrum',move:'route',name:'victory drum',loop:true,fps:6,solids:[],decorative:true },
  victoryCrowdDrum: { width:143,height:141,art:'victoryCrowdDrum',move:'jump',name:'victory crowd drum',loop:true,fps:8,solids:[[7,0,129,112]] },
  victoryScarf: { width:148,height:102,art:'victoryScarf',move:'route',name:'victory scarf',loop:true,fps:6,solids:[],decorative:true },
  victoryRibbonBouquet: { width:131,height:144,art:'victoryRibbonBouquet',move:'route',name:'victory ribbon bouquet',loop:true,fps:6,solids:[],decorative:true },
  victoryStarBadge: { width:163,height:157,art:'victoryStarBadge',move:'route',name:'victory star badge',loop:true,fps:6,solids:[],decorative:true },
  victoryBalloonCluster: { width:118,height:157,art:'victoryBalloonCluster',move:'route',name:'victory balloon cluster',loop:true,fps:6,solids:[],decorative:true },
  victoryStarWreath: { width:161,height:165,art:'victoryStarWreath',move:'route',name:'victory star wreath',loop:true,fps:6,solids:[],decorative:true },
  victoryChampionCrown: { width:153,height:170,art:'victoryChampionCrown',move:'route',name:'victory champion crown',loop:true,fps:6,solids:[],decorative:true },
  victoryPomPoms: { width:174,height:170,art:'victoryPomPoms',move:'route',name:'victory pom poms',loop:true,fps:6,solids:[],decorative:true },
  victoryScarfStand: { width:173,height:152,art:'victoryScarfStand',move:'route',name:'victory scarf stand',loop:true,fps:6,solids:[],decorative:true },
  victoryMegaphone: { width:136,height:159,art:'victoryMegaphone',move:'route',name:'victory megaphone',loop:true,fps:6,solids:[],decorative:true },
  sneakerMascot: enemy('sneakerMascot','sneaker-shop mascot',190,150,[20,0,150,140]),
  yamDrop: { width:84,height:96,art:'yamDrop',move:'jump',name:'falling yam',loop:true,fps:8,solids:[[8,0,68,82]] },
  spikes: { width:410,height:130,art:'kit-spikes',special:'spikes',move:'jump',name:'construction spikes',artOffsetY:KIT_ART_REGISTRATION.spikes.offsetY,lethal:true,solids:[[10,0,390,48]] },
  electric: { width:430,height:130,art:'kit-electric',special:'electric',move:'jump',name:'electrified rail',artOffsetY:KIT_ART_REGISTRATION.electric.offsetY,lethal:true,solids:[[0,0,430,38]] },
  // The kit crop has decorative wheels below the car body. The solid stops at
  // the painted roof line (the roof vents are decoration), so a jump lands on
  // the train body instead of an invisible ledge above it.
  train: { width:820,height:345,art:'kit-train',special:'train',move:'jump',name:'stationary train',artOffsetY:KIT_ART_REGISTRATION.train.offsetY,solids:[[18,0,784,245]] },
  fireEscape: { width:248,height:148,art:'platform',move:'one-way',name:'one-way fire escape',oneWay:true,top:121,surfaces:[[6,236,121]] },
  checkpoint: { width:150,height:220,art:'kit-checkpoint',special:'checkpoint',move:'goal',name:'mid-block checkpoint',artOffsetY:KIT_ART_REGISTRATION.checkpoint.offsetY,sensor:true,trigger:[11,0,133,166] },
  finish: { width:420,height:410,art:'kit-finish',special:'finish',move:'goal',name:'finish checkpoint',artOffsetY:KIT_ART_REGISTRATION.finish.offsetY,sensor:true,finish:true,trigger:[1,0,419,350] },
  // A floor button is a trigger. Its art remains readable under the runner's
  // feet without becoming a low invisible wall.
  button: { width:235,height:165,art:'kit-button',special:'button',move:'switch',name:'floor button',artOffsetY:KIT_ART_REGISTRATION.button.offsetY,sensor:true,switch:true,trigger:[4,0,224,28] },
  // The horizontal warning beam is the walkable roof. The lamps and posts
  // above it are decorative and do not create a floating collision shelf.
  securityGate: { width:410,height:350,art:'kit-gate',special:'gate',move:'switch',name:'security gate',artOffsetY:KIT_ART_REGISTRATION.gate.offsetY,gate:true,solids:[[18,0,374,241]] },
  waterfrontMarker: { width:180,height:218.632,art:'waterfrontMarker',move:'route',name:'waterfront life ring',solids:[],decorative:true },
  loadingCrates: { width:210,height:191.585,art:'loadingCrates',move:'route',name:'loading bay crates',solids:[],decorative:true },
  rooftopTank: { width:190,height:290.631,art:'rooftopTank',move:'route',name:'rooftop water tank',solids:[],decorative:true },
  marketStall: { width:240,height:201.745,art:'marketStall',move:'route',name:'market canopy stall',solids:[],decorative:true },
  underpassVent: { width:230,height:144.959,art:'underpassVent',move:'route',name:'underpass steam vent',solids:[],decorative:true },
  subwaySignal: { width:130,height:359.44,art:'subwaySignal',move:'route',name:'subway signal column',solids:[],decorative:true },
  basketballHoop: { width:150,height:276.161,art:'basketballHoop',move:'route',name:'basketball hoop',solids:[],decorative:true },
  bridgeAnchor: { width:240,height:154.218,art:'bridgeAnchor',move:'route',name:'bridge cable anchor',solids:[],decorative:true },
  crosswalkSignal: { width:120,height:443.97,art:'crosswalkSignal',move:'route',name:'crosswalk signal',solids:[],decorative:true },
  dawnStreetlight: { width:140,height:564.456,art:'dawnStreetlight',move:'route',name:'dawn streetlight banner',solids:[],decorative:true },
  warehouseSign: { width:240,height:134.754,art:'warehouseSign',move:'route',name:'warehouse loading sign',solids:[],decorative:true },
  // These ten obstacles are parsed from the single street-kit sheet. Their
  // authored solids are the alpha-derived footprints emitted by the packer,
  // preserving the visual silhouette in physics without a hand-tuned guess.
  trafficCone: { width:88,height:107.043,art:'trafficCone',move:'jump',name:'traffic cone',solids:[[2.02,0,82.23,106.754]] },
  roadworkSign: { width:156,height:162.259,art:'roadworkSign',move:'jump',name:'road work sign',solids:[[2.889,0,149.259,162.259]] },
  newspaperBox: { width:114,height:164.527,art:'newspaperBox',move:'jump',name:'newspaper box',solids:[[2.505,0,106.066,164.11]] },
  fireHydrant: { width:96,height:151.93,art:'fireHydrant',move:'jump',name:'fire hydrant',solids:[[0.417,0,95.165,151.513]] },
  bikeRack: { width:126,height:134.969,art:'bikeRack',move:'jump',name:'bike rack',solids:[[1.281,0,122.156,134.969]] },
  parkingMeter: { width:80,height:186.341,art:'parkingMeter',move:'jump',name:'parking meter',solids:[[3.902,0,70.732,186.341]] },
  trashBin: { width:112,height:134.323,art:'trashBin',move:'jump',name:'rolling trash bin',solids:[[0.77,0,110.845,133.938]] },
  cableSpool: { width:150,height:145.313,art:'cableSpool',move:'jump',name:'cable spool',solids:[[0.426,0,144.46,145.313]] },
  sawhorse: { width:160,height:138.366,art:'sawhorse',move:'jump',name:'road sawhorse',solids:[[14.873,0,145.127,137.915]] },
  barricadeLamp: { width:96,height:99.417,art:'barricadeLamp',move:'jump',name:'barricade lamp',solids:[[0,0,92.893,99.107]] },
  // Looping raster dressing is registered as decorative route art. Its
  // eight-frame sheets are alpha-parsed and share a ground baseline, while
  // empty solids keep the visual animation from creating a hidden collider.
  loopBarrel: { width:77.31,height:95,art:'loopBarrel',move:'route',name:'wobbling construction barrel',solids:[],decorative:true,loop:true,fps:4 },
  loopDumpster: { width:117.424,height:119.318,art:'loopDumpster',move:'route',name:'idling recycling dumpster',solids:[],decorative:true,loop:true,fps:4 },
  loopVendorCart: { width:110.718,height:170,art:'loopVendorCart',move:'route',name:'rocking vendor cart',solids:[],decorative:true,loop:true,fps:4 },
  loopTurnstile: { width:81.055,height:125,art:'loopTurnstile',move:'route',name:'spinning turnstile',solids:[],decorative:true,loop:true,fps:4 },
  loopLamp: { width:56.637,height:83.988,art:'loopLamp',move:'route',name:'pulsing barricade lamp',solids:[],decorative:true,loop:true,fps:4 },
  loopNewspaper: { width:55.622,height:33.6,art:'loopNewspaper',move:'route',name:'fluttering newspaper bundle',solids:[],decorative:true,loop:true,fps:4 },
  loopTaxi: { width:146.695,height:105.112,art:'loopTaxi',move:'route',name:'idling taxi',solids:[],decorative:true,loop:true,fps:4 },
  loopBus: { width:203.05,height:155,art:'loopBus',move:'route',name:'opening bus door',solids:[],decorative:true,loop:true,fps:4 },
  loopVent: { width:50.19,height:60.228,art:'loopVent',move:'route',name:'puffing rooftop vent',solids:[],decorative:true,loop:true,fps:4 },
  loopPuddle: { width:40.6,height:23.8,art:'loopPuddle',move:'route',name:'rippling puddle',solids:[],decorative:true,loop:true,fps:4 },
});
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export function overlap(a,b) { return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }
export function entityAt(entity, time=1) {
  return {x:(entity.previousX??entity.x)+(entity.x-(entity.previousX??entity.x))*time,
    y:(entity.previousY??entity.y??0)+((entity.y??0)-(entity.previousY??entity.y??0))*time};
}
export function solidBoxes(entity, time=1) {
  // Background traffic and fly-by actors share route data for authoring, but
  // they live on a separate visual track and never become hazards or floors.
  if (entity.background) return [];
  if (entity.dead || entity.open) return [];
  const shape=SHAPES[entity.type];
  if (!shape) return [];
  const at=entityAt(entity,time);
  const solids=shape.timed?(entity.floorPhase!==false?shape.floorSolids:shape.overheadSolids):(shape.solids||[]);
  return (solids||[]).map(([x,y,w,h])=>({x:at.x+x,y:at.y+y,w,h}));
}
export function surfaceBox(entity,time=1) {
  const shape=SHAPES[entity.type];
  if (!shape?.surfaceHazard) return null;
  const at=entityAt(entity,time),[x,y,w,h]=shape.surface||[0,0,shape.width,18];
  return {x:at.x+x,y:at.y+y,w,h};
}
export function topFaces(entity,time=1) {
  if (entity.dead) return [];
  const shape=SHAPES[entity.type],at=entityAt(entity,time);
  return [...solidBoxes(entity,time).map(b=>({x:b.x,w:b.w,y:b.y+b.h})),
    ...(shape.surfaces||[]).map(([x,w,y])=>({x:at.x+x,w,y:at.y+y}))];
}
export function triggerBoxes(entity,time=1) {
  const shape=SHAPES[entity.type];
  if(!shape?.sensor&&!shape?.switch)return [];
  const at=entityAt(entity,time),[x,y,w,h]=shape.trigger||[0,0,shape.width,shape.height];
  return [{x:at.x+x,y:at.y+y,w,h}];
}
export function hazardBox(entity) {
  const boxes=solidBoxes(entity),at=entityAt(entity);
  if(!boxes.length)return{x:at.x,y:at.y,w:entity.width,h:SHAPES[entity.type].top||0};
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
  return{x,y,w:Math.max(...boxes.map(b=>b.x+b.w))-x,h:Math.max(...boxes.map(b=>b.y+b.h))-y};
}
export function playerBox(state) {
  const low=state.player.low&&state.player.grounded;
  return{x:state.world+PLAYER_X-(low?34:PHYSICS.radius),y:state.player.y+4,w:low?68:PHYSICS.radius*2,h:(low?PHYSICS.low:PHYSICS.standing)-4};
}
export function seeded(seed) { let value=seed>>>0;return()=>{value+=0x6D2B79F5;let n=Math.imul(value^value>>>15,value|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;}; }
