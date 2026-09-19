import { STEP, PLAYER_X, PHYSICS, CHASER_PHYSICS, SHAPES, DIFFICULTIES, clamp, overlap, hazardBox, playerBox, solidBoxes, surfaceBox, topFaces, triggerBoxes } from './config.js?v=10';
import { sweepLanding, damagingContacts } from './collision.js?v=7';
import { LEVELS, makeRoute, endlessSection } from './routes.js?v=11';
export { STEP, PLAYER_X, PHYSICS, CHASER_PHYSICS, SHAPES, playerBox, hazardBox };

const chaser = (id, gap) => ({
  id, type: 'suit-chaser', visualOnly: true, gap,
  x: PLAYER_X - gap, previousX: PLAYER_X - gap,
  y: 0, previousY: 0, vy: 0, grounded: true, low: false,
  jumps: 0, jumpOrigin: 0, rollTime: 0, action: 'run', actionTime: 0,
  airAction: 'ground', state: 'grounded',
  mode: 'running', disjoint: false, rejoinPending: false,
});

const chaserSample = (game) => ({
  time: game.time, world: game.world,
  y: game.player.y, vy: game.player.vy, grounded: game.player.grounded,
  low: game.player.low, rollTime: game.player.rollTime,
  rollBuffer: game.player.rollBuffer, airAction: game.player.airAction,
  action: game.player.action, actionTime: game.player.actionTime,
  jumps: game.player.jumps, jumpOrigin: game.player.jumpOrigin,
  support: game.player.support,
});

export class Game {
  constructor(options = {}) { this.reset(options); this.phase = 'ready'; }
  reset({ stage = 0, mode = 'story', difficulty = 'standard', seed = 42 } = {}) {
    this.stage = clamp(Math.trunc(stage) || 0, 0, LEVELS.length - 1);
    this.mode = mode === 'endless' ? 'endless' : 'story';
    this.difficulty = difficulty in DIFFICULTIES ? difficulty : 'standard';
    this.seed = seed >>> 0;
    const route = makeRoute(this.stage, this.difficulty, this.seed);
    this.speed = route.speed; this.baseSpeed=route.speed;
    this.routeLength = route.length; this.finishX = route.finishX ?? route.length;
    this.playLength = route.playLength ?? Math.max(1,this.finishX-PLAYER_X);
    this.entities = this.mode === 'story' ? route.entities : [];
    this.pickups = this.mode === 'story' ? route.pickups : [];
    this.phase = 'running';
    this.tickCount = 0; this.time = 0; this.world = 0; this.previousWorld = 0;
    this.lives = DIFFICULTIES[this.difficulty].lives; this.maxLives = this.lives;
    this.hits = 0; this.coins = 0; this.clean = 0; this.streak = 0; this.bestStreak = 0; this.score = 0;
    this.shield = false; this.magnet = 0; this.rush = 0; this.slip = 0; this.stomps = 0; this.checkpointX = 0; this.endlessSequence = 0; this.nextSection = this.speed * 4.5;
    this.events = []; this.input = []; this.deathReason = ''; this.lastAction = '';
    this.invincibleTest = false;
    this.player = { y: 0, previousY: 0, vy: 0, grounded: true, jumps: 0, coyote: 0, rollTime: 0,
      heldRoll: false, low: false, jumpBuffer: 0, rollBuffer: 0, jumpGrace: 0, invulnerable: 0, stumble: 0, land: 0, action: 'run', actionTime: 0,
      support: null, stride: 0, previousStride: 0, jumpOrigin: 0, airAction: 'ground' };
    this.chasers = CHASER_PHYSICS.gaps.map((gap, index) => chaser(index === 0 ? 'gray-suit' : 'blue-suit', gap));
    this.chaserHistory = [chaserSample(this)];
    this.lastStompAt = -Infinity;
    this.emit('start');
  }
  emit(type, detail = {}) { this.events.push({ type, time: this.time, x: this.world + PLAYER_X, y: this.player.y, ...detail }); }
  drainEvents() { return this.events.splice(0); }
  command(action, held = false) {
    if (action === 'releaseRoll') { this.player.heldRoll = false; for (const input of this.input) if (input.action === 'roll') input.held = false; return; }
    if (this.phase === 'running') this.input.push({ action, held });
  }
  release() { this.input.length = 0; this.player.heldRoll = false; this.player.jumpBuffer = 0; this.player.rollBuffer = 0; }
  pause() { if (this.phase !== 'running') return false; this.phase = 'paused'; this.release(); return true; }
  resume() { if (this.phase !== 'paused') return false; this.phase = 'running'; return true; }
  jump() {
    const p = this.player;
    const first = p.grounded || p.coyote > 0;
    if (!first && p.jumps >= 2) { p.jumpBuffer = PHYSICS.buffer; return false; }
    // Do not stand up into a beam. A buffered jump executes on the safe side.
    const standing = { ...playerBox(this), h: PHYSICS.standing - 4 };
    if (p.low && this.entities.some(e => solidBoxes(e).some(b=>overlap(standing,b)))) {
      p.jumpBuffer = PHYSICS.buffer; return false;
    }
    if (first) p.jumpOrigin = p.y;
    p.vy = first ? PHYSICS.jump : Math.max(p.vy + 100, PHYSICS.doubleJump);
    p.jumps = first ? 1 : p.jumps + 1; p.grounded = false; p.low = false; p.coyote = 0;
    p.airAction = 'jump';
    p.rollTime = 0; p.jumpBuffer = 0; p.rollBuffer = 0; p.land = 0; p.support = null;
    // A buffered double jump gets one fixed-step of separation grace. This
    // prevents a runner who is already brushing an elevated enemy's lower
    // legs from being rejected before the new upward trajectory can clear it.
    p.jumpGrace = first ? 0 : .08;
    this.lastAction = first ? 'jump' : 'double'; this.emit(first ? 'jump' : 'double');
    this.action('jump', true); return true;
  }
  roll(held) {
    const p = this.player; p.heldRoll ||= held;
    if (!p.grounded) { p.vy = Math.min(p.vy, -780); p.airAction = 'drop'; p.rollBuffer = .75; this.lastAction = 'drop'; return; }
    if (p.rollTime > 0) return;
    p.rollTime = PHYSICS.roll; p.low = true; p.jumpBuffer = 0; p.rollBuffer=0;
    p.airAction = 'ground';
    this.lastAction = 'roll'; this.action('roll', true); this.emit('roll');
  }
  action(action, restart = false) { if (this.player.action !== action || restart) { this.player.action = action; this.player.actionTime = 0; } }
  damage(entity) {
    if (entity.dead || entity.hit || this.player.invulnerable > 0 || this.invincibleTest) return;
    entity.hit = true;
    const lethal=!!SHAPES[entity.type]?.lethal;
    if (lethal) {
      this.lives=0; this.hits++; this.streak=0; this.deathReason=SHAPES[entity.type].name;
      this.emit('hit',{obstacle:entity.type,lethal:true});
      this.phase='gameover'; this.release(); this.action('stumble',true); this.emit('gameover');
      return;
    }
    this.player.invulnerable = PHYSICS.invulnerability;
    if (this.shield) { this.shield = false; this.emit('shieldBreak'); return; }
    this.lives--; this.hits++; this.streak = 0; this.player.stumble = .28;
    this.emit('hit', { obstacle: entity.type });
    if (!this.lives) { this.phase = 'gameover'; this.deathReason = SHAPES[entity.type].name;
      this.release(); this.action('stumble', true); this.emit('gameover'); }
  }
  stomp(entity) {
    if (entity.dead) return;
    const shape=SHAPES[entity.type],isBoss=!!shape?.boss;
    if (isBoss) {
      entity.bossHealth=Math.max(0,(entity.bossHealth??shape.bossHealth??3)-1);
      entity.stompGrace=.18;
      if (entity.bossHealth===0) { entity.dead=true; entity.defeatedAt=this.time; }
    } else {
      entity.dead = true; entity.defeatedAt = this.time;
    }
    this.stomps++; this.score += isBoss&&entity.bossHealth===0?500:250; this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const p=this.player; p.vy=PHYSICS.stomp; p.grounded=false; p.support=null; p.jumps=1; p.jumpOrigin=p.y;
    p.airAction='jump';
    p.low=false; p.rollTime=0; p.rollBuffer=0; p.land=0;
    this.lastStompAt = this.time;
    this.emit('stomp',{enemy:entity.type,x:entity.x+entity.width/2,y:p.y,...(isBoss?{boss:true,hitsRemaining:entity.bossHealth}: {})});
  }
  updateEntities(worldDelta = 0) {
    const dt=STEP*DIFFICULTIES[this.difficulty].speed;
    for(const e of this.entities){
      e.previousX=e.x; e.previousY=e.y||0;
      if(e.stompGrace)e.stompGrace=Math.max(0,e.stompGrace-dt);
      if(e.dead)continue;
      const timed=SHAPES[e.type]?.timed;
      if (timed) {
        const shape=SHAPES[e.type],period=shape.period||2.4;
        const phase=((this.time+(e.phaseOffset||0))%period+period)%period;
        const nextFloor=phase<(shape.floorDuration??period/2),runnerX=this.world+PLAYER_X;
        // Never change the required verb while Sneakers is already in the
        // gate's reaction box. The cycle keeps moving on approach, then the
        // chosen phase holds until the runner has committed and cleared it.
        const inReactionBox=e.x<runnerX+e.width+100&&e.x+e.width>runnerX-80;
        if (e.floorPhase===undefined||!inReactionBox) e.floorPhase=nextFloor;
      }
      // Set-piece movers can wait safely off-screen until the runner enters
      // their warning window. Once armed, they use the same swept patrol path
      // as every other moving collider, so a train visibly charging in cannot
      // desync from the damage check.
      if(e.rush&&!e.rush.active){
        if(e.x-(this.world+PLAYER_X)>e.rush.trigger)continue;
        e.rush.active=true;e.rush.startedAt=this.time;e.direction=-1;
      }
      // Skateboard rivals authored on a real ledge can hop down to the street
      // as Sneakers approaches. Their starting feet stay registered to the
      // platform, then the same world-space body follows a short gravity arc.
      if(e.ledgeDrop&&!e.dropping&&e.x-(this.world+PLAYER_X)<340&&e.x+e.width>this.world+PLAYER_X-80){
        e.dropping=true;e.vy=180;
      }
      if(e.dropping){
        e.vy=(e.vy||0)-PHYSICS.gravity*.78*dt;
        e.y=Math.max(0,(e.y||0)+e.vy*dt);
        if(e.y<=0){e.y=0;e.vy=0;e.dropping=false;e.ledgeDrop=false;}
      }
      if(!e.patrol)continue;
      // Trains are oncoming set pieces, not looping hazards. If Sneakers is
      // standing on the roof, hold the body beneath their feet for this
      // fixed step; once they leave, the train resumes its single pass.
      const trainSupport = e.type === 'train' && e.id === this.player.support;
      if (e.type === 'train') {
        if (e.patrol.done) { e.direction=0; continue; }
        e.direction = -1;
        // A supported runner owns the train's local frame for this step. Carry
        // the roof forward with the camera so the train cannot slide out from
        // under Sneakers and turn a readable roof ride into an ankle hit.
        if (trainSupport) { e.x += worldDelta; continue; }
        const next=e.x-e.patrol.speed*dt;
        if(next<=e.patrol.min){e.x=e.patrol.min;e.patrol.done=true;e.direction=0;}
        else e.x=next;
        continue;
      }
      // A cart can patrol freely in the runway, but once it reaches the
      // runner's readable reaction window it pauses. That turns its motion
      // into a timing choice instead of letting it drift under a held roll
      // from the previous obstacle.
      if (e.type==='rollingCart') {
        const runnerX=this.world+PLAYER_X;
        if (e.x-runnerX<300&&e.x+e.width>runnerX-80) continue;
      }
      const next=e.x+(e.direction||-1)*e.patrol.speed*dt;
      if(next<e.patrol.min){e.x=e.patrol.min;e.direction=1;}
      else if(next>e.patrol.max){e.x=e.patrol.max;e.direction=-1;}
      else e.x=next;
    }
  }
  updatePlayer() {
    const p=this.player,dt=STEP*DIFFICULTIES[this.difficulty].speed;
    const oldY=p.y,wasGrounded=p.grounded;
    p.previousY=p.y;p.previousStride=p.stride;p.actionTime+=dt;
    for(const timer of ['rollTime','coyote','jumpBuffer','rollBuffer','invulnerable','stumble','land','jumpGrace'])p[timer]=Math.max(0,p[timer]-dt);
    const from={x:this.previousWorld+PLAYER_X,y:oldY};
    p.vy-=PHYSICS.gravity*dt;
    let to={x:this.world+PLAYER_X,y:p.y+p.vy*dt};
    if(to.y>p.jumpOrigin+PHYSICS.maxHeight){to.y=p.jumpOrigin+PHYSICS.maxHeight;p.vy=Math.min(0,p.vy);}
    let low=p.low&&wasGrounded;
    const body=feet=>({x:feet.x-(low?34:PHYSICS.radius),y:feet.y+4,w:low?68:PHYSICS.radius*2,h:(low?PHYSICS.low:PHYSICS.standing)-4});
    const landing=sweepLanding(this.entities,from,to);
    // Inspect the original trajectory before snapping to support. An earlier
    // side hit cannot disappear because the feet later reach another surface.
    for(const contact of damagingContacts(this.entities,body(from),body(to))) {
      if (contact.entity && SHAPES[contact.entity.type]?.enemy &&
          ((p.jumpGrace > 0 && p.vy > 0) || contact.entity.stompGrace > 0)) continue;
      const lethalTop=landing&&SHAPES[contact.entity.type]?.lethal&&contact.time<=landing.time+1e-7;
      if(!landing||contact.time<landing.time-1e-7||lethalTop){this.damage(contact.entity);if(this.phase!=='running')return;}
    }
    if(landing?.entity&&SHAPES[landing.entity.type]?.lethal){this.damage(landing.entity);if(this.phase!=='running')return;}
    p.grounded=false;p.support=null;
    if(landing){
      const impact={x:from.x+(to.x-from.x)*landing.time,y:landing.y};
      p.y=landing.y;
      if(landing.entity&&SHAPES[landing.entity.type].enemy){
        this.stomp(landing.entity);to.y=landing.y+p.vy*dt*(1-landing.time);
      } else {
        to.y=landing.endY;p.vy=0;p.grounded=landing.supported;p.jumps=0;
        p.airAction='ground';
        p.support=landing.supported?(landing.entity?.id??null):null;
        if(!landing.supported){p.coyote=PHYSICS.coyote;p.jumps=1;}
        if(p.grounded&&(p.rollBuffer>0||!wasGrounded&&p.heldRoll)){this.roll(p.heldRoll);low=true;}
      }
      // Check the horizontal remainder on a roof, including an adjacent higher
      // wall. The contact surface itself is now beneath the body, never inside it.
      for(const contact of damagingContacts(this.entities,body(impact),body(to),landing.time,1)){this.damage(contact.entity);if(this.phase!=='running')return;}
    }
    p.y=to.y;
    if (!p.grounded && p.airAction === 'ground') p.airAction = 'jump';
    if(!wasGrounded&&p.grounded){p.land=.075;p.stride=Math.round(p.stride/110)*110;p.previousStride=p.stride;this.emit('land');}
    if(wasGrounded&&!p.grounded&&p.jumps===0){p.coyote=PHYSICS.coyote;p.jumps=1;}
    const standing={...playerBox(this),y:p.y+4,h:PHYSICS.standing-4};
    const underBeam=p.low&&this.entities.some(e=>solidBoxes(e).some(b=>overlap(standing,b)));
    p.low=p.grounded&&(p.rollTime>0||p.heldRoll||underBeam);
    if(p.grounded&&p.rollBuffer>0)this.roll(p.heldRoll);
    if((p.grounded||p.coyote>0)&&p.jumpBuffer>0)this.jump();
    this.action(p.stumble>0?'stumble':!p.grounded?'jump':p.low?(p.rollTime>0?'roll':'crouch'):p.land>0?'land':this.rush>0?'rush':'run');
    if(p.grounded&&!p.low)p.stride+=this.world-this.previousWorld;
  }
  updateChasers() {
    const dt=STEP*DIFFICULTIES[this.difficulty].speed;
    const floorResponse=1-Math.exp(-dt/.16);
    const settleToFloor=(c)=>{
      const start=c.y;
      c.y += (0-start)*floorResponse;
      if(Math.abs(c.y)<.05)c.y=0;
      c.vy=(c.y-start)/dt;
      c.grounded=c.y<=.05;
      c.state=c.grounded?'grounded':'recovering';
    };
    const copyDelayedState=(c,state)=>{
      c.y=state.y??0;
      c.vy=Number.isFinite(state.vy)?state.vy:0;
      c.grounded=!!state.grounded&&c.y<1;
      c.low=!!state.low;
      c.rollBuffer=state.rollBuffer??0;
      c.jumps=state.jumps??0;
      c.jumpOrigin=state.jumpOrigin??0;
      c.rollTime=state.rollTime??0;
      c.action=state.action||'run';
      c.actionTime=state.actionTime??0;
      // A drop is an input intent. Commit to it while the runner is clearly
      // airborne, but let the delayed trajectory continue to supply the
      // exact height and velocity. The renderer suppresses the pose at y=0,
      // so this cannot create a floor-level visual pop.
      const earlyDrop=this.player.airAction==='drop'&&this.player.y>c.y+2;
      c.airAction=earlyDrop?'drop':(state.airAction||'ground');
      c.state=c.airAction==='drop'?'dropping':c.grounded?(c.low?'rolling':'grounded'):'jumping';
    };
    const current=chaserSample(this);
    this.chaserHistory.push(current);
    const cutoff=this.time-CHASER_PHYSICS.delay;
    while(this.chaserHistory.length>1&&this.chaserHistory[1].time<=cutoff)this.chaserHistory.shift();
    const delayed=this.chaserHistory[0];
    const support=this.entities.find(e=>e.id===this.player.support);
    const delayedSupport=this.entities.find(e=>e.id===delayed.support);
    const trainSupport=(support?.type==='train'||delayedSupport?.type==='train');
    const elevatedSupport=(support?.type&&support.type!=='train'&&this.player.grounded&&this.player.y>0)
      ||(delayedSupport?.type&&delayedSupport.type!=='train'&&delayed.grounded&&delayed.y>0);
    const movingTrainNear=this.entities.some(e=>e.type==='train'&&e.patrol&&Math.abs(e.x-(this.world+PLAYER_X))<e.width+110&&Math.abs(e.x-(e.previousX??e.x))>1e-7);
    const stompDisjoint=this.time-this.lastStompAt<CHASER_PHYSICS.stompDisjoint;
    const routeBreak=trainSupport||elevatedSupport||movingTrainNear||stompDisjoint;
    // Rejoin only when both the live runner and delayed sample are safely on
    // the floor. Rejoining against an airborne delayed sample caused the
    // visible jump/land snap after stomps and elevated routes.
    const canRejoin=!routeBreak&&this.player.grounded&&this.player.y<=1e-7&&delayed.grounded&&delayed.y<=1e-7;
    const targetX=this.world+PLAYER_X;
    for(const c of this.chasers){
      const desiredX=targetX-c.gap;
      c.previousX=c.x;c.previousY=c.y;
      // World motion is authoritative for the trailing gap. It changes
      // continuously with the camera, so never reset previousX during a
      // state transition.
      c.x=desiredX;
      if(routeBreak){
        c.disjoint=true;c.rejoinPending=false;c.mode='bottom';settleToFloor(c);c.low=false;c.jumps=0;c.airAction='ground';
        c.action='run';c.actionTime+=dt;
        continue;
      }
      if(c.disjoint){
        // The public route state can rejoin as soon as Sneakers lands, while
        // the painted puppet stays on the floor until its delayed sample is
        // also safe. This removes the hard transition without holding the
        // chaser in a stale disjoint state.
        if(this.player.grounded&&this.player.y<=1e-7){c.disjoint=false;c.rejoinPending=true;}
        else {
          c.mode='bottom';settleToFloor(c);c.low=false;c.jumps=0;c.airAction='ground';
          c.action='run';c.actionTime+=dt;continue;
        }
      }
      if(c.rejoinPending&&!canRejoin){
        c.mode='recovering';settleToFloor(c);c.low=false;c.jumps=0;c.airAction='ground';
        c.action='run';c.actionTime+=dt;continue;
      }
      c.rejoinPending=false;
      // Copy the complete sampled state in one place so jump, double-jump,
      // roll, land, and air-drop cannot disagree with the painted height.
      copyDelayedState(c,delayed);
      c.mode='running';
    }
  }
  tick() {
    if (this.phase !== 'running') return;
    this.tickCount++; this.time = this.tickCount * STEP;
    this.slip=Math.max(0,this.slip-STEP);
    // Rush should feel like momentum, not a sudden difficulty spike. The old
    // 12% / 6s burst compressed every upcoming reaction window and could make
    // a player regret collecting the reward. Keep the same readable forward
    // boost while leaving enough time to read the next authored beat.
    this.speed=(this.mode==='endless'?Math.min(352,LEVELS[this.stage].speed+this.time*.18)*DIFFICULTIES[this.difficulty].speed:this.baseSpeed)*(this.rush>0?1.07:1)*(this.slip>0?.74:1);
    for (const input of this.input.splice(0)) {
      if (input.action === 'jump') this.jump();
      if (input.action === 'roll') this.roll(input.held);
    }
    this.previousWorld = this.world;
    const support=this.entities.find(e=>e.id===this.player.support);
    this.world += (this.speed + (support?SHAPES[support.type].belt||0:0)*DIFFICULTIES[this.difficulty].speed) * STEP;
    this.updateEntities(this.world - this.previousWorld);
    if (this.mode === 'endless') {
      while (this.nextSection < this.world + 1800) {
        const section = endlessSection(this.endlessSequence++, this.seed, this.nextSection, this.speed);
        this.entities.push(...section.entities); this.pickups.push(...section.pickups); this.nextSection = section.end;
      }
    }
    this.magnet = Math.max(0,this.magnet-STEP); this.rush=Math.max(0,this.rush-STEP);
    this.updatePlayer();
    this.updateChasers();
    if(this.phase!=='running')return;
    const body=playerBox(this);
    // Oil is a readable nonlethal mistake: running through it steals a short
    // burst of speed, while a jump cleanly skips the surface. Trigger once per
    // puddle so the slowdown never becomes a repeated stun-lock.
    for (const e of this.entities) {
      if (e.slipped || !SHAPES[e.type]?.surfaceHazard || !this.player.grounded) continue;
      const slick=surfaceBox(e);
      if (!slick || !overlap(body,slick)) continue;
      e.slipped=true; this.slip=.9; this.emit('slip',{obstacle:e.type,x:e.x+e.width/2});
    }
    // Sensors are evaluated after movement so a fixed-floor camera and a
    // buffered jump share the same authoritative contact frame.
    for(const e of this.entities){
      const shape=SHAPES[e.type];
      if(!shape?.sensor&&!shape?.switch)continue;
      if(!triggerBoxes(e).some(sensor=>overlap(body,sensor)))continue;
      if(shape.finish&&!e.reached){e.reached=true;this.emit('finish',{x:e.x});}
      if(shape.sensor&&e.type==='checkpoint'&&!e.reached){e.reached=true;this.checkpointX=e.x;this.emit('checkpoint',{x:e.x});}
      if(shape.switch&&e.type==='button'&&!e.activated){
        e.activated=true;
        e.activatedAt=this.time;
        for(const gate of this.entities)if(gate.type==='securityGate'&&gate.x>=e.x){gate.open=true;gate.openedAt=this.time;}
        this.emit('switch',{x:e.x});
      }
    }
    for (const e of this.entities) {
      if (!e.passed && e.x + e.width < body.x) {
        e.passed = true;
        if (!e.hit && !e.dead && SHAPES[e.type].move !== 'route') { this.clean++; this.streak++; this.bestStreak = Math.max(this.bestStreak, this.streak);
          this.score += 100 + Math.min(this.streak, 10) * 10; this.emit('clean', { streak: this.streak, obstacle: e.type }); }
      }
    }
    for (const coin of this.pickups) {
      if (coin.taken) continue;
      const targetX = this.world + PLAYER_X, targetY = this.player.y + (this.player.low ? 40 : 62);
      const dx = targetX - coin.x, dy = targetY - coin.y;
      if (this.magnet > 0 && coin.type === 'coin' && Math.hypot(dx, dy) < 220) { coin.x += dx * .1; coin.y += dy * .1; }
      if (!overlap(body, { x: coin.x - 17, y: coin.y - 17, w: 34, h: 34 })) continue;
      coin.taken = true;
      if (coin.type === 'coin') { this.coins++; this.score += 25; }
      if (coin.type === 'shield') this.shield = true;
      if (coin.type === 'magnet') this.magnet = 8;
      if (coin.type === 'speed') { this.rush=4.5; this.shield=true; this.magnet=6; this.score+=100; }
      if (coin.type === 'flow') { this.rush=Math.max(this.rush, 2.5); this.streak++; this.bestStreak=Math.max(this.bestStreak,this.streak); this.score+=150+Math.min(this.streak,10)*15; }
      this.emit(coin.type, { x: coin.x, y: coin.y });
    }
    // Bounded history in endless runs; story routes are tiny but use the same path.
    this.entities = this.entities.filter(e => e.x + e.width > this.world - 250);
    this.pickups = this.pickups.filter(e => !e.taken && e.x > this.world - 250);
    if (this.mode === 'story' && this.world + PLAYER_X >= this.finishX) {
      this.world = Math.min(this.routeLength,Math.max(this.world,this.finishX-PLAYER_X)); this.phase = 'cleared'; this.release(); this.action('celebrate', true);
      this.score += this.lives * 500; this.emit('clear');
    }
  }
  upcoming() { return this.entities.filter(e=>{const shape=SHAPES[e.type];return shape.move!=='route'&&!e.dead&&!e.hit&&!e.passed&&e.x+e.width>this.world+PLAYER_X-34&&(e.y||0)<this.player.y+PHYSICS.standing&&(shape.surfaceHazard||topFaces(e).some(f=>f.y>this.player.y+8));}).sort((a,b)=>a.x-b.x)[0]||null; }
  stars() { return [this.phase === 'cleared', this.coins >= 40, this.phase === 'cleared' && this.hits === 0]; }
  snapshot() { return { phase: this.phase, stage: this.stage, mode: this.mode, difficulty: this.difficulty, seed: this.seed,
    tick: this.tickCount, time: this.time, world: this.world, speed: this.speed, length: this.routeLength, playLength:this.playLength,
    player: { ...this.player }, lives: this.lives, coins: this.coins, hits: this.hits, clean: this.clean, invincibleTest: this.invincibleTest,
    streak: this.streak, score: this.score, stomps:this.stomps, rush:this.rush, slip:this.slip, shield: this.shield, magnet: this.magnet,
    chasers: this.chasers.map(c => ({ ...c })),
    entities: this.entities.map(e => ({ ...e })), pickups: this.pickups.map(e => ({ ...e })) }; }
}

// Renderer frame rate never changes physics; interpolation has no game authority.
export class FixedClock {
  constructor(game) { this.game = game; this.accumulator = 0; }
  reset() { this.accumulator = 0; }
  advance(seconds) {
    if (this.game.phase !== 'running') { this.reset(); return 1; }
    this.accumulator += clamp(seconds, 0, .1);
    while (this.accumulator + 1e-9 >= STEP) { this.game.tick(); this.accumulator -= STEP; }
    return clamp(this.accumulator / STEP, 0, 1);
  }
}
