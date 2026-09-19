import { PLAYER_X, PHYSICS, SHAPES, SCENE_PROFILES, URBAN_KIT, hazardBox, playerBox, clamp, solidBoxes, topFaces, triggerBoxes } from './config.js?v=10';
import { LEVELS } from './routes.js?v=11';
import { loadRuntimeManifest } from './load-manifest.js?v=12';
import { BACKGROUND_PARALLAX, BACKGROUND_ALPHA, BACKGROUND_LANE_CLEARANCE, backgroundPlateFor, backgroundPlacementFor, backgroundTrackFor, backgroundScreenX } from './depth.js?v=3';

const STEP_SAFE = 1/60;
// The reference run sheet is authored as eight key poses. During play, phase
// follows a fixed display cadence so frame 8 always wraps to frame 1 without
// an extra hold or a missing front-arm pose.
const CHASER_FPS = 10;
const CHASER_FRAME_COUNT = 8;
const CHASER_START_DURATION = 1.2;
const CHASER_START_FPS = 5;
const CHASER_POSE_FRAMES = Object.freeze({ start: 6, finish: 6, jump: 4, roll: 4 });
const OPENING_POINT_END = 2.1;
const OPENING_SURPRISE_END = 3.45;
const OPENING_RUN_START = 3.7;
const OPENING_LAUNCH_END = 4.45;
const OPENING_DURATION = 9.99;
const decode = async url => { const image = new Image(); image.src = url; await image.decode(); return image; };
export class Assets {
  constructor() { this.scenes = new Map(); this.pending = new Map(); this.rasters = new Map(); this.kit = null; this.gameplayReady = false; this.lowMemory = false; }
  async load(progress = () => {}) {
    this.manifest = await loadRuntimeManifest(); progress(.25);
    this.lowMemory = this.manifest.lowMemoryActive === true;
    // Tie the atlas URL to its content hash.  A new manifest must never be
    // paired with a cached atlas from an earlier build (that produced visible
    // onion-skin seams over vehicles in the small viewport).
    const cacheKey = this.manifest.atlasHash ? `?v=${this.manifest.atlasHash.slice(0, 16)}` : '';
    this.image = await decode(`assets/runtime/${this.manifest.image}${cacheKey}`); progress(.7);
    await this.scene(0); progress(1);
  }
  async prepareGameplay() {
    if (this.gameplayReady) return;
    const suffix = this.lowMemory ? '-low' : '';
    this.kit = await decode(`assets/runtime/urban-hazard-kit${suffix}.webp`);
    await Promise.all([
      // These standalone textures are displayed at 27–270 world units. The
      // compact deliveries already exceed that resolution on desktop too.
      ['flowBadge', 'assets/runtime/flow-badge-low.webp'],
      ['rollingCart', 'assets/runtime/rolling-cart-low.webp'],
      ['dropGate', 'assets/runtime/drop-gate-low.webp'],
      ['oilSlick', 'assets/runtime/oil-slick-low.webp'],
    ].map(async ([name, url]) => {
      try { this.rasters.set(name, await decode(url)); } catch { /* optional raster polish */ }
    }));
    this.gameplayReady = true;
  }
  async scene(stage) {
    const key = LEVELS[stage].scene.replace('.png', '.webp');
    if (this.scenes.has(key)) return this.scenes.get(key);
    if (!this.pending.has(key)) this.pending.set(key, decode(`assets/runtime/${key}`).then(image => {
      this.scenes.set(key, image); this.pending.delete(key); return image;
    }).catch(error => { this.pending.delete(key); throw error; }));
    return this.pending.get(key);
  }
  retain(stage) {
    const stages = this.lowMemory ? [stage] : [stage, Math.min(stage + 1, LEVELS.length - 1)];
    const names = stages.map(i => LEVELS[i].scene.replace('.png', '.webp'));
    for (const name of this.scenes.keys()) if (!names.includes(name)) this.scenes.delete(name);
  }
}

export class Renderer {
  constructor(canvas, assets) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.assets = assets;
    this.effects = []; this.settings = {}; this.debug = false; this.draws = []; this.chaserIntroDone = false; this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.width = Math.max(1, rect.width); this.height = Math.max(1, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, this.assets.lowMemory ? 1 : 1.5);
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0); this.ctx.imageSmoothingQuality = this.assets.lowMemory ? 'medium' : 'high';
    this.scale = Math.min(this.width / (this.width < 600 ? 820 : 1100), this.height / 600, 1.5);
    this.ground = this.height - 52 * this.scale;
    this.viewWidth = this.width / this.scale;
  }
  sprite(name, index, x, y, { alpha = 1, flip = false, factor = 1, squash = 1 } = {}) {
    const frames = this.assets.manifest?.sprites[name]; if (!frames || !this.assets.image) return;
    const frame = frames[clamp(Math.floor(index), 0, frames.length - 1)];
    const [sx, sy, sw, sh] = frame.rect, s = this.scale * factor;
    const ctx = this.ctx;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(1,squash); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(this.assets.image, sx, sy, sw, sh, -frame.pivotX * s, -frame.pivotY * s, frame.width * s, frame.height * s);
    ctx.restore();
    if (this.debug) this.draws.push({ ...this.drawContext, name, x: x-frame.pivotX*s, y: y-frame.pivotY*s*squash, w: frame.width*s, h: frame.height*s*squash,
      frame:Math.floor(index), squash, sourceAspect: frame.width/frame.height, aspect: sw/sh, anchorX:x, anchorY:y });
  }
  kitSprite(name, x, y, { alpha = 1, factor = 1, offsetY = 0 } = {}) {
    const source = URBAN_KIT[name];
    if (!source || !this.assets.kit) return;
    const sourceScale = this.assets.lowMemory ? .5 : 1;
    const [sx, sy, sw, sh] = source, s = this.scale * factor;
    this.ctx.save(); this.ctx.globalAlpha = alpha;
    // offsetY is authored in world units. A negative value lowers the source
    // crop on screen so its painted bottom edge meets the floor anchor.
    const anchorY = y - offsetY * s;
    this.ctx.drawImage(this.assets.kit, sx * sourceScale, sy * sourceScale, sw * sourceScale, sh * sourceScale, x - sw * s / 2, anchorY - sh * s, sw * s, sh * s);
    this.ctx.restore();
    if (this.debug) this.draws.push({ ...this.drawContext, name:`kit:${name}`, x:x-sw*s/2, y:anchorY-sh*s, w:sw*s, h:sh*s, anchorX:x, anchorY:y, artOffsetY:offsetY });
  }
  warmTextures() {
    const images = [this.assets.image, this.assets.kit, ...this.assets.rasters.values()].filter(Boolean);
    if (!images.length) return;
    const ctx = this.ctx;
    ctx.save(); ctx.globalAlpha = .001; ctx.imageSmoothingEnabled = false;
    // Draw the complete source once while the loading panel is still visible.
    // Sampling a single source pixel leaves the browser's texture upload lazy,
    // which turns into a visible hitch on the first gameplay frame.
    for (const image of images) ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, 1, 1);
    ctx.restore();
  }
  raster(name, x, y, { alpha = 1, width = 96, flip = false } = {}) {
    const image = this.assets.rasters.get(name); if (!image) return;
    const s = this.scale, height = width * image.height / image.width;
    this.ctx.save(); this.ctx.globalAlpha = alpha; this.ctx.translate(x, y); if (flip) this.ctx.scale(-1, 1);
    this.ctx.drawImage(image, -width * s / 2, -height * s / 2, width * s, height * s);
    this.ctx.restore();
  }
  rasterGround(name, x, y, { alpha = 1, width = 96, flip = false } = {}) {
    const image = this.assets.rasters.get(name); if (!image) return;
    const s = this.scale, height = width * image.height / image.width;
    this.ctx.save(); this.ctx.globalAlpha = alpha; this.ctx.translate(x, y); if (flip) this.ctx.scale(-1, 1);
    this.ctx.drawImage(image, -width * s / 2, -height * s, width * s, height * s);
    this.ctx.restore();
    if (this.debug) this.draws.push({ ...this.drawContext, name:`raster:${name}`, x:x-width*s/2, y:y-height*s, w:width*s, h:height*s, anchorX:x, anchorY:y });
  }
  supportColumn(x, height, worldToScreen, worldToX) {
    if (!height || !this.assets.image) return;
    const frame = this.assets.manifest?.sprites.support?.[0];
    if (!frame) return;
    const [sx, sy, sw, sh] = frame.rect, s = this.scale, module = frame.height;
    for (let cursor = 0; cursor < height; cursor += module) {
      const visible = Math.min(module, height - cursor);
      // World Y increases upward, so the module's bottom is the screen
      // anchor.  The previous implementation used cursor + module for both
      // bounds on a full module, collapsing the clip to zero pixels and
      // making every elevated platform appear to float.
      const anchorY = worldToScreen(cursor);
      const topY = worldToScreen(cursor + visible);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(worldToX(x - frame.width / 2), topY, frame.width * s, Math.max(1, anchorY - topY));
      this.ctx.clip();
      this.ctx.drawImage(this.assets.image, sx, sy, sw, sh, worldToX(x - frame.pivotX), anchorY - frame.pivotY * s, frame.width * s, frame.height * s);
      this.ctx.restore();
      if (this.debug) this.draws.push({ name:'support', layer:'support', x:worldToX(x-frame.width/2), y:topY, w:frame.width*s, h:anchorY-topY });
    }
  }
  background(game, world) {
    const ctx = this.ctx, image = this.assets.scenes.get(LEVELS[game.stage].scene.replace('.png', '.webp'));
    ctx.fillStyle = '#91c9e8'; ctx.fillRect(0, 0, this.width, this.height);
    this.backgroundLaneClearance = BACKGROUND_LANE_CLEARANCE;
    if (!image) return;
    // Repeat the complete plate so architecture and road move together.
    // Cover the viewport instead of preserving the old short plate height,
    // which exposed a blank band above the skyline on wide screens.
    const imageRatio = image.naturalWidth / Math.max(1, image.naturalHeight);
    const { height, width, top, laneClearance } = backgroundPlateFor(this.width, this.height, this.ground, imageRatio, this.scale, SCENE_PROFILES[LEVELS[game.stage].scene]);
    this.backgroundLaneClearance = laneClearance;
    const travel = ((world * this.scale * BACKGROUND_PARALLAX) % width + width) % width;
    for (let plateX = -travel; plateX < this.width; plateX += width)
      ctx.drawImage(image, plateX, top, width + .5, height);
    const bottom = top + height;
    if (bottom < this.height) ctx.drawImage(image, 0, image.height - 1, image.width, 1, 0, bottom - .5, this.width, this.height-bottom+1);
    if (this.settings.contrast) { ctx.fillStyle = 'rgba(246,237,214,.18)'; ctx.fillRect(0, 0, this.width, this.height); }
  }
  openingBeat(game, world, elapsed) {
    const s=this.scale, x=value=>(value-world)*s, y=value=>this.ground-value*s;
    const fadeIn=clamp(elapsed/.35,0,1);
    const ease=t=>t*t*(3-2*t);
    const pointProgress=clamp(elapsed/OPENING_POINT_END,0,1);
    const burstProgress=ease(clamp((elapsed-OPENING_RUN_START)/(OPENING_DURATION-OPENING_RUN_START),0,1));
    const launchProgress=clamp((elapsed-OPENING_RUN_START)/(OPENING_LAUNCH_END-OPENING_RUN_START),0,1);
    const running=elapsed>=OPENING_LAUNCH_END;
    const runnerX=815+burstProgress*340;
    const grayX=430+burstProgress*340;
    const blueX=615+burstProgress*340;
    const scaredX=815+Math.sin(elapsed*24)*Math.max(0,1-clamp((elapsed-2.1)/1.35,0,1))*7;
    const pointFrame=Math.min(2,Math.floor(pointProgress*3));
    const launchFrame=3+Math.min(2,Math.floor(launchProgress*3));
    const chaserFrame=running?Math.floor((elapsed-OPENING_LAUNCH_END)*CHASER_FPS)%CHASER_FRAME_COUNT:(elapsed<OPENING_RUN_START?pointFrame:launchFrame);
    const chaserSheet=running?'chaser':'chaserStart';
    const chaserBlueSheet=running?'chaser2':'chaser2Start';
    const runnerScared=elapsed<OPENING_SURPRISE_END;
    const surpriseFrame=elapsed<.75?1:Math.min(3,Math.floor((elapsed-.75)*2.2));
    this.ctx.save(); this.ctx.globalAlpha=fadeIn;
    // The opening uses the authored story sheets: both suits point at
    // Sneakers, Sneakers recoils, then all three characters launch into the
    // route. The cutscene stays visual-only; dialogue is played by app.js.
    this.sprite(chaserSheet,chaserFrame,x(grayX),y(0),{factor:1.04});
    this.sprite(chaserBlueSheet,chaserFrame,x(blueX),y(0),{factor:1.04});
    this.sprite(runnerScared?'stumble':'run',
      runnerScared?surpriseFrame:Math.floor((elapsed-OPENING_RUN_START)*8)%8,
      x(runnerScared?scaredX:runnerX),y(0),{factor:1.1});
    this.ctx.restore();
  }
  effect(event) {
    if (this.settings.reducedMotion || this.effects.length >= (this.assets.lowMemory ? 12 : 24)) return;
    const type = { jump:'dust', double:'dust', land:'dust', roll:'dust', hit:'impact', clean:'spark', coin:'spark', shield:'power', magnet:'power', shieldBreak:'power', speed:'power', slip:'spark', stomp:'stompBurst' }[event.type];
    if (type) this.effects.push({ ...event, sprite:type, age:0, life:type==='dust'?.22:type==='spark'?.28:type==='stompBurst'?.42:.35 });
  }
  draw(game, dt = 0, alpha = 1, cosmeticTime = 0) {
    const start = performance.now(); this.draws.length = 0; this.drawContext={layer:'foreground'};
    const s = this.scale, p = game.player;
    const active = game.phase === 'running';
    const world = active ? game.previousWorld + (game.world - game.previousWorld) * alpha : game.world;
    const elevation = active ? p.previousY + (p.y - p.previousY) * alpha : p.y;
    // The floor is the player's reference frame. Keep it fixed while the
    // complete jump envelope remains visible, so landing choices never slide
    // out of view during a double jump or stomp bounce.
    this.cameraY = 0;
    this.background(game, world);
    if (this.cutscene) { this.openingBeat(game, world, this.cutscene.elapsed || 0); return; }
    const x = value => (value - world) * s, y = value => this.ground + (this.cameraY||0)*s - value * s;
    // These are finite authored landmarks, not repeating tiles. Keep their
    // world positions and draw them exactly once in their chosen route gaps.
    const backgroundEntities=[], foregroundEntities=[];
    if(game.phase!=='ready')for(const e of game.entities){
      if(e.background){
        const center=backgroundScreenX(e.x+e.width/2,world,s,backgroundTrackFor(e,SHAPES[e.type]));
        if(center-e.width*s/2>this.width+180||center+e.width*s/2< -180)continue;
      }else if(e.x-world>this.viewWidth+180||e.x+e.width<world-180)continue;
      (e.background?backgroundEntities:foregroundEntities).push(e);
    }
    const drawOrder=[...backgroundEntities,...foregroundEntities];
    let supportsDrawn=false;
    for(const e of drawOrder){
      const shape=SHAPES[e.type],age=e.dead?game.time-e.defeatedAt:0;
      if(e.dead&&age>.42)continue;
      const background=!!e.background;
      if(!background&&!supportsDrawn){
        for(const support of foregroundEntities)if((support.type==='platform'||support.type==='fireEscape')&&support.y>0){
          this.supportColumn(support.x+support.width*.25,support.y,y,x);
          this.supportColumn(support.x+support.width*.75,support.y,y,x);
        }
        supportsDrawn=true;
      }
      this.drawContext={layer:background?'background':'foreground',entityId:e.id};
      let ex=active?(e.previousX??e.x)+(e.x-(e.previousX??e.x))*alpha:e.x;
      let ey=active?(e.previousY??e.y??0)+((e.y||0)-(e.previousY??e.y??0))*alpha:(e.y||0);
      const laneX=background?value=>backgroundScreenX(value,world,s,backgroundTrackFor(e,shape)):x;
      const count=this.assets.manifest.sprites[shape.art]?.length||1;
      const frame=shape.loop?Math.floor(game.time*(shape.fps||4))%count:shape.enemy?Math.floor(game.time*(e.type==='rival'?7:8))%count:0;
      const sourceFrame=this.assets.manifest.sprites[shape.art]?.[frame];
      const placement=background?backgroundPlacementFor(e,shape,sourceFrame,this.ground/s,this.backgroundLaneClearance):null;
      if(background)ey=placement.elevation;
      let decorativeSquash=1;
      if(shape.decorative&&!background&&!this.settings.reducedMotion){
        if(e.type==='loopTaxi'){
          const shuttle=(2/Math.PI)*Math.asin(Math.sin(game.time*.72+e.x*.001));
          ex+=shuttle*120;
          // Ground-pivot scaling leaves the tires planted and moves the roof.
          decorativeSquash=Math.floor(game.time/.5)%2?1.2:1;
        }else decorativeSquash=.985+.015*Math.sin(game.time*4+e.x*.009);
      }
      const layerAlpha=background?BACKGROUND_ALPHA:1, layerFactor=placement?.factor??1;
      this.ctx.save();
      if(background){
        this.ctx.beginPath();this.ctx.rect(0,0,this.width,Math.max(0,this.ground-this.backgroundLaneClearance*s));this.ctx.clip();
      }
      if(shape.special){
        const baseAlpha=e.dead?1-age/.42:1;
        // Opening is a gameplay state, so let the player see the gate clear
        // immediately instead of leaving a closed-looking sprite over an
        // already passable collider. The short fade preserves the authored
        // raster art while making the switch result legible.
        const opening=shape.special==='gate'&&e.open;
        const openAge=opening?Math.max(0,game.time-(e.openedAt??game.time)):0;
        const gateAlpha=opening?Math.max(0,1-openAge/.28):1;
        if(!opening||gateAlpha>0)this.kitSprite(shape.special,laneX(ex+e.width/2),y(ey),{alpha:baseAlpha*gateAlpha*layerAlpha,factor:layerFactor,offsetY:shape.artOffsetY||0});
      }
      else if (shape.raster) {
        const raisedGate = shape.timed && e.floorPhase === false ? 96 : 0;
        this.rasterGround(shape.raster,laneX(ex+e.width/2),y(ey+raisedGate),{alpha:(e.dead?1-age/.42:1)*layerAlpha,width:shape.width*layerFactor,flip:shape.flipMove&&e.direction<0});
      } else this.sprite(shape.art,frame,laneX(ex+e.width/2),y(ey),{alpha:(e.dead?1-age/.42:1)*layerAlpha,flip:(shape.enemy||shape.flipMove)&&e.direction<0,factor:layerFactor,squash:e.dead?.2:decorativeSquash});
      if((e.type==='car'||e.type==='truck')&&!background&&!e.dead&&!this.settings.reducedMotion){
        const pulse=.5+.5*Math.sin(game.time*9+e.x*.013), glow=.22+.22*pulse;
        this.sprite('spark',Math.floor(game.time*5)%2,laneX(ex+e.width*.78),y(ey+18),{alpha:glow,factor:.72});
        this.sprite('spark',Math.floor(game.time*5+1)%2,laneX(ex+e.width*.22),y(ey+15),{alpha:glow*.7,factor:.55});
      }
      if(e.type==='train'&&e.rush?.active&&!background&&!e.dead&&!this.settings.reducedMotion){
        const pulse=.45+.35*Math.sin(game.time*14),front=laneX(ex+e.width*.08);
        this.sprite('spark',Math.floor(game.time*8)%2,front,y(ey+38),{alpha:pulse,factor:.8});
        this.sprite('dust',Math.floor(game.time*9)%2,laneX(ex+e.width*.92),y(ey+8),{alpha:.55,factor:1.15,flip:true});
      }
      this.ctx.restore();
    }
    this.drawContext={layer:'foreground'};
    for(const pickup of game.phase==='ready'?[]:game.pickups){
      if(pickup.taken||pickup.x<world-30||pickup.x>world+this.viewWidth+30)continue;
      const frame=pickup.type==='coin'?Math.floor(game.time*12+pickup.x/83)%8:0;
      if (pickup.type === 'flow') this.raster('flowBadge', x(pickup.x), y(pickup.y), { width: 82 });
      else this.sprite(pickup.type,frame,x(pickup.x),y(pickup.y)+(pickup.type==='coin'?0:17*s));
    }
    let runnerX = PLAYER_X * s;
    if (game.phase === 'ready') runnerX = this.width * (this.width > 700 ? .76 : .69);
    // Chasers render their own delayed simulation. During a train ride or a
    // stomp bounce they settle to the floor and rejoin only after the delayed
    // state is safe. Keep both suits inside the viewport without replacing
    // their authored trailing gaps.
    const chasers = game.chasers || [];
    chasers.forEach((chaser, index) => {
      const chaserWorldX = active ? (chaser.previousX ?? chaser.x) + ((chaser.x ?? chaser.previousX) - (chaser.previousX ?? chaser.x)) * alpha : chaser.x;
      const chaserY = active ? (chaser.previousY ?? chaser.y) + ((chaser.y ?? chaser.previousY) - (chaser.previousY ?? chaser.y)) * alpha : chaser.y;
      // Each suit needs its own stable screen anchor. Clamping both to 96
      // painted the blue suit directly over the gray suit throughout a run.
      const visibleX = Math.max(chaserWorldX, world + (index === 0 ? 164 : 96));
      const action = chaser.action || 'run';
      // The state machine may already know about the runner's down input,
      // but the delayed body has not reached the air yet. Painting a drop
      // pose at y=0 reads as a snap.
      const dropping = chaser.airAction === 'drop' && chaserY > 1;
      const startPose = !this.chaserIntroDone && game.time < CHASER_START_DURATION && chaserY <= 1 && action === 'run' && !dropping;
      const recovering = chaser.state === 'recovering' && chaserY > 1;
      const pose = game.phase === 'cleared' ? {
        suffix: 'Finish', frame: Math.floor(cosmeticTime * 5) % CHASER_POSE_FRAMES.finish, y: 0,
      } : dropping ? {
        suffix: 'Jump', frame: 3, y: chaserY,
      } : action === 'jump' ? {
        suffix: 'Jump', frame: dropping ? 3 : chaser.vy > 500 ? 0 : chaser.vy > 80 ? 1 : chaser.vy > -200 ? 2 : 3, y: chaserY,
      } : action === 'roll' ? {
        suffix: 'Roll', frame: Math.min(CHASER_POSE_FRAMES.roll - 1, Math.floor((chaser.actionTime || 0) / .12) % CHASER_POSE_FRAMES.roll), y: 0,
      } : startPose ? {
        suffix: 'Start', frame: Math.min(CHASER_POSE_FRAMES.start - 1, Math.floor(game.time * CHASER_START_FPS)), y: 0,
      } : {
        suffix: '', frame: Math.floor(game.time * CHASER_FPS + index * 4) % CHASER_FRAME_COUNT, y: recovering ? chaserY : 0,
      };
      const name = index === 0 ? `chaser${pose.suffix}` : `chaser2${pose.suffix}`;
      const registration = this.assets.manifest?.sprites[name]?.[pose.frame];
      // Alpha-cropped frames have slightly different painted foot lines. Keep
      // every pose on the same world-space anchor so the suit never bobs or
      // snaps as its frame changes.
      const footCorrection = registration ? registration.pivotY - registration.height : 0;
      this.sprite(name, pose.frame, x(visibleX), y(pose.y-footCorrection));
    });
    const action = game.phase === 'cleared' ? 'celebrate' : game.phase === 'gameover' ? 'stumble' : p.action;
    let frame = 0;
    if (action === 'run' || action === 'rush') frame = Math.floor((game.phase==='ready'?cosmeticTime*300:p.previousStride+(p.stride-p.previousStride)*alpha)/220*8)%8;
    else if (action === 'jump') frame = p.vy > 500 ? 0 : p.vy > 80 ? 1 : p.vy > -200 ? 2 : 3;
    else if (action === 'roll') frame = p.rollTime > 0 ? Math.min(3, Math.floor(p.actionTime / .12) % 4) : 1;
    else if (action === 'celebrate') frame = Math.floor(cosmeticTime * 6) % 4;
    else frame = Math.min(3, Math.floor(p.actionTime * 14));
    const opacity = p.invulnerable > 0 && !this.settings.reducedMotion && Math.floor(game.time * 12) % 2 ? .55 : 1;
    this.sprite(action==='rush'?'run':action, frame, runnerX, y(elevation), { alpha: opacity });
    if (game.shield) this.sprite('power', 0, runnerX, y(elevation+30), { alpha:.48, factor:1.5 });
    for (const effect of this.effects) { if (active) effect.age += dt;
      if (effect.age < effect.life) {
        const alpha = 1-effect.age/effect.life;
        if (effect.sprite === 'stompBurst') {
          // Stomp feedback uses atlas art that is already resident for jump
          // and landing dust. Avoid uploading the large optional burst image
          // on the impact frame, which caused the reported multi-second hitch.
          this.sprite('dust', 0, x(effect.x), y((effect.y || 0) + 18), { alpha, factor: 1.3 });
          this.sprite('spark', Math.min(1, Math.floor(effect.age / effect.life * 2)), x(effect.x), y((effect.y || 0) + 28), { alpha: alpha * .8, factor: .7 });
        }
        else this.sprite(effect.sprite, Math.min(1, Math.floor(effect.age / effect.life * 2)), x(effect.x), y(effect.y), { alpha });
      } }
    this.effects = this.effects.filter(e => e.age < e.life);
    if (this.debug && this.showBoxes) {
      const ctx=this.ctx; ctx.save(); ctx.lineWidth=1.5; ctx.strokeStyle='#e92748';
      for (const e of game.entities){for(const b of solidBoxes(e)){ctx.strokeRect(x(b.x),y(b.y+b.h),b.w*s,b.h*s);}ctx.strokeStyle='#118751';for(const f of topFaces(e)){ctx.beginPath();ctx.moveTo(x(f.x),y(f.y));ctx.lineTo(x(f.x+f.w),y(f.y));ctx.stroke();}ctx.strokeStyle='#9b6cff';ctx.setLineDash([5,3]);for(const b of triggerBoxes(e)){ctx.strokeRect(x(b.x),y(b.y+b.h),b.w*s,b.h*s);}ctx.setLineDash([]);ctx.strokeStyle='#e92748';}
      const b=playerBox(game); ctx.strokeStyle='#145fff'; ctx.strokeRect(x(b.x), y(b.y+b.h), b.w*s, b.h*s); ctx.restore();
    }
    this.drawMs = performance.now()-start;
  }
}
