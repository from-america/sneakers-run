import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PLAYER_X,SHAPES,STEP} from '../game/simulation.js';
import {KIT_ART_REGISTRATION,topFaces,solidBoxes,triggerBoxes} from '../game/config.js';
import {sweepLanding,damagingContacts} from '../game/collision.js';
const empty=()=>{const g=new Game();g.reset();g.entities=[];g.pickups=[];g.routeLength=Infinity;return g;};
const prop=(g,type,x=PLAYER_X-40,y=0)=>{const e={id:type,type,x,y,width:SHAPES[type].width};g.entities.push(e);return e;};
test('all painted solid tops accept falling feet at both elevations and stay safe',()=>{
 for(const [type,shape] of Object.entries(SHAPES))if(!shape.enemy&&!shape.sensor&&!shape.lethal&&!shape.decorative){
  for(const elevation of [0,190]){
   const g=empty(),e=prop(g,type,PLAYER_X-40,elevation);
   for(const face of topFaces(e)){
    const higher=topFaces(e).some(f=>f.y>face.y&&f.x<face.x+face.w&&f.x+f.w>face.x);
    if(higher)continue;
    const x=face.x+face.w/2;
    assert.equal(sweepLanding([e],{x,y:face.y+6},{x,y:face.y-6})?.y,face.y,type);
   }
   const face=topFaces(e).sort((a,b)=>b.y-a.y)[0];
   e.x+=PLAYER_X-(face.x+face.w/2);
   g.player.y=face.y+1;g.player.previousY=g.player.y;g.player.vy=-200;g.player.grounded=false;
   g.tick();assert.equal(g.hits,0,type);assert.equal(g.player.grounded,true,type);assert.equal(g.player.y,face.y,type);
  }
 }
});
test('edge impacts survive even when the tick ends past the ledge',()=>{
 const e={type:'barrel',x:0,width:132};
 const impact=sweepLanding([e],{x:144,y:87},{x:147,y:85});
 assert.ok(impact);assert.equal(impact.time,.5);assert.equal(impact.supported,false);
});
test('an earlier side impact is not erased by a later safe landing',()=>{
 const entities=[{type:'gate',x:100,width:246},{type:'barrel',x:70,width:132}];
 const from={x:-23,y:204,w:46,h:121},to={...from,x:177,y:4};
 const landing=sweepLanding(entities,{x:0,y:200},{x:200,y:0});
 assert.ok(damagingContacts(entities,from,to).some(c=>c.time<landing.time));
});
test('all enemies moving either way can be stomped once, with no ghost collision',()=>{
 for(const [type,shape] of Object.entries(SHAPES))if(shape.enemy&&!shape.boss)for(const direction of [-1,1])for(const y of [0,200]){
  const g=empty(),e=prop(g,type,PLAYER_X-shape.width/2,y);e.direction=direction;e.patrol={min:e.x-30,max:e.x+30,speed:70};
  const top=Math.max(...topFaces(e).map(f=>f.y));
  Object.assign(g.player,{y:top+1,vy:-200,grounded:false,jumps:1});
  g.drainEvents();g.tick();assert.equal(g.stomps,1,type);assert.equal(g.hits,0,type);assert.equal(g.score,250,type);assert.ok(g.player.vy>0);assert.equal(solidBoxes(e).length,0);
  let count=g.drainEvents().filter(e=>e.type==='stomp').length;
  for(let i=0;i<120;i++){g.tick();count+=g.drainEvents().filter(e=>e.type==='stomp').length;}
  assert.equal(count,1,type);assert.equal(g.stomps,1,type);
 }
});
test('relative motion detects approaching enemies and rejects receding ones',()=>{
 const e={type:'business',previousX:300,x:180,y:0,width:100};
 const body={x:201,y:4,w:46,h:121};
 assert.ok(damagingContacts([e],body,body).length);
 e.previousX=300;e.x=420;assert.equal(damagingContacts([e],body,body).length,0);
});
test('lethal wall hit ends resolution before a later stomp awards anything',()=>{
 const g=empty();g.lives=1;prop(g,'shutter',PLAYER_X-4);prop(g,'business',PLAYER_X-25);
 Object.assign(g.player,{y:134,vy:-1000,grounded:false,jumps:1});g.drainEvents();g.tick();
 assert.equal(g.phase,'gameover');assert.equal(g.stomps,0);assert.equal(g.score,0);assert.ok(!g.drainEvents().some(e=>e.type==='stomp'));
});
test('buffered air-drop becomes low before remaining landing motion enters a beam',()=>{
 const g=empty();prop(g,'gate',PLAYER_X+.5);Object.assign(g.player,{y:1,vy:-300,grounded:false,jumps:1});
 g.command('roll');g.tick();assert.equal(g.hits,0);assert.equal(g.player.low,true);
});
test('stomp trajectory is independent of entity array order',()=>{
 const make=reverse=>{const g=empty();prop(g,'platform',PLAYER_X-80);prop(g,'rival',PLAYER_X-60,121);Object.assign(g.player,{y:240,vy:-600,grounded:false,jumps:1});if(reverse)g.entities.reverse();for(let i=0;i<10;i++)g.tick();return[g.hits,g.stomps,g.player.y,g.player.vy];};
 assert.deepEqual(make(false),make(true));assert.equal(make(false)[1],1);
});

test('holding roll past its animation does not restart a fresh locked roll',()=>{
 const g=empty();g.command('roll',true);for(let i=0;i<156;i++)g.tick();
 assert.equal(g.player.low,true);assert.equal(g.player.rollTime,0);
 g.command('releaseRoll');g.tick();assert.equal(g.player.low,false);
});

test('rush adds a mild forward boost without altering jump gravity',()=>{
 const g=empty(),base=g.speed;g.pickups=[{type:'speed',x:PLAYER_X+3,y:58}];
 g.tick();g.tick();assert.equal(g.speed,base*1.07);assert.ok(g.shield&&g.magnet>0);assert.equal(g.score,100);
 const normal=empty();g.command('jump');normal.command('jump');for(let i=0;i<10;i++){g.tick();normal.tick();}assert.equal(g.player.vy,normal.player.vy);assert.equal(g.player.y,normal.player.y);
 for(let i=0;i<550;i++)g.tick();assert.equal(g.rush,0);assert.equal(g.speed,base);
});
test('conveyor changes forward travel only while supported on its painted belt',()=>{
 const g=empty();prop(g,'conveyor',PLAYER_X-100);Object.assign(g.player,{y:71,vy:-200,grounded:false});g.tick();
 assert.equal(g.player.support,'conveyor');const before=g.world;g.tick();assert.ok(g.world-before>g.speed*STEP);
 g.command('jump');g.tick();assert.equal(g.player.support,null);const airborne=g.world;g.tick();assert.ok(Math.abs(g.world-airborne-g.speed*STEP)<1e-8);
});
test('static kit hazards use lethal contacts, safe tops, and deterministic switches',()=>{
 const lethal=empty();lethal.lives=3;prop(lethal,'spikes',PLAYER_X-40);lethal.tick();assert.equal(lethal.phase,'gameover');assert.equal(lethal.lives,0);assert.equal(lethal.deathReason,'construction spikes');
 const topLethal=empty();prop(topLethal,'spikes',PLAYER_X-40);Object.assign(topLethal.player,{y:49,previousY:49,vy:-200,grounded:false});topLethal.tick();assert.equal(topLethal.phase,'gameover');
 const rail=empty();rail.lives=3;prop(rail,'electric',PLAYER_X-40);rail.tick();assert.equal(rail.phase,'gameover');
 const train=empty(),trainEntity=prop(train,'train',PLAYER_X-40);assert.equal(SHAPES.train.artOffsetY,KIT_ART_REGISTRATION.train.offsetY);assert.equal(Math.max(...topFaces(trainEntity).map(face=>face.y)),245);Object.assign(train.player,{y:246,previousY:246,vy:-200,grounded:false});train.tick();assert.equal(train.hits,0);assert.equal(train.player.grounded,true);assert.equal(train.player.y,245);
 const gateTop=empty(),gateEntity=prop(gateTop,'securityGate',PLAYER_X-40);assert.equal(SHAPES.securityGate.artOffsetY,KIT_ART_REGISTRATION.gate.offsetY);assert.equal(Math.max(...topFaces(gateEntity).map(face=>face.y)),241);
 const switchGame=empty(),button=prop(switchGame,'button',PLAYER_X-40),gate=prop(switchGame,'securityGate',PLAYER_X+250);assert.equal(solidBoxes(button).length,0);assert.equal(triggerBoxes(button)[0].h,28);switchGame.tick();assert.equal(button.activated,true);assert.equal(button.activatedAt,switchGame.time);assert.equal(gate.open,true);assert.equal(gate.openedAt,switchGame.time);assert.equal(solidBoxes(gate).length,0);
 const airSwitch=empty(),airButton=prop(airSwitch,'button',PLAYER_X-40);airSwitch.player.y=50;airSwitch.player.previousY=50;airSwitch.tick();assert.equal(Boolean(airButton.activated),false);
 const goal=empty();goal.finishX=PLAYER_X;prop(goal,'checkpoint',PLAYER_X-40);prop(goal,'finish',PLAYER_X+10);goal.tick();assert.equal(goal.checkpointX,PLAYER_X-40);assert.equal(goal.phase,'cleared');
});
test('the staged train arms at its warning window and sweeps with a moving hitbox',()=>{
 const g=empty(),train=prop(g,'train',PLAYER_X+700);train.patrol={min:train.x-720,max:train.x+240,speed:430};train.direction=-1;train.rush={trigger:800,active:false};
 g.player.y=400;g.player.previousY=400;g.player.grounded=false;const before=train.x;g.tick();
 assert.equal(train.rush.active,true);assert.ok(train.x<before);assert.equal(train.previousX,before);
 const contact=damagingContacts([{type:'train',x:PLAYER_X+30,previousX:PLAYER_X+400,y:0,width:SHAPES.train.width}],{x:PLAYER_X+200,y:40,w:46,h:121},{x:PLAYER_X+200,y:40,w:46,h:121});
 assert.ok(contact.some(hit=>hit.entity.type==='train'));
});

test('every static kit piece is registered to the shared floor line',()=>{
 for(const [type,registration] of Object.entries(KIT_ART_REGISTRATION)){
  const shape=SHAPES[type==='gate'?'securityGate':type];
  assert.equal(shape.artOffsetY,registration.offsetY,type);
  const [x,y,w,h]=registration.visible;
  assert.ok(x>=0&&y>=0&&w>0&&h>0,type);
  assert.ok(x+w<=shape.width&&h<=shape.height,type);
 }
});
