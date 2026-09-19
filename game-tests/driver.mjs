// Playtest driver: only sends the same commands as a human; no state changes,
// damage suppression, teleporting, or privileged route access.
import {PLAYER_X,PHYSICS,SHAPES,topFaces,solidBoxes} from '../game/config.js';
export function drive(g,timing=0){
 const p=g.player,x=g.world+PLAYER_X;
 const upcoming=g.entities.filter(e=>!e.dead&&e.x+e.width>x+8).map(e=>({e,front:e.x-x,top:Math.max(...topFaces(e).map(f=>f.y)),shape:SHAPES[e.type]})).filter(o=>o.front<430&&o.top>=p.y-5).sort((a,b)=>a.front-b.front);
 const target=upcoming[0];if(!target)return;
 const {e,front,top,shape}=target;
 const pace=g.speed/(g.difficulty==='relaxed'?.8:1);
 const runway=pace*(.40+timing);
 if(p.grounded){
  if(shape.move==='roll'&&p.y<(e.y||0)+30){if(front<pace*.26&&!p.low)g.command('roll',true);return;}
  if(p.low){g.command('releaseRoll');if(g.entities.some(o=>solidBoxes(o).some(b=>b.y>p.y+80&&b.x<x+35&&b.x+b.w>x-35)))return;}
  if(front<runway&&front> -e.width+40&&top>p.y+8)g.command('jump');
 }else if(p.jumps===1){
  const seconds=Math.max(0,(front-25)/pace);
  const at=p.y+p.vy*seconds-.5*PHYSICS.gravity*seconds*seconds;
  if(front<200&&front> -20&&top>at-10&&p.vy<380)g.command('jump');
 }
}

function fork(g){
 const copy=Object.assign(Object.create(Object.getPrototypeOf(g)),g);
 copy.player={...g.player};copy.input=[];copy.events=[];
 copy.chasers=g.chasers.map(e=>({...e}));
 copy.chaserHistory=g.chaserHistory.map(sample=>({...sample}));
 copy.entities=g.entities.filter(e=>e.x<g.world+1250).map(e=>({...e,
  patrol:e.patrol?{...e.patrol}:e.patrol,
  rush:e.rush?{...e.rush}:e.rush,
 }));
 copy.pickups=g.pickups.filter(e=>e.x<g.world+1250).map(e=>({...e}));
 return copy;
}
export function planInputs(game,{depth=24,beam=18}={}){
 const frames=Math.round(12/(game.difficulty==='relaxed'?.8:1));
 let nodes=[{game:fork(game),commands:[],cost:0}];
 for(let step=0;step<depth;step++){
  const candidates=[];
  for(const node of nodes){
   const p=node.game.player;
   const options=['none'];
   if(p.grounded||p.coyote>0||p.jumps<2)options.push('jump');
   if(p.grounded&&!p.low||!p.grounded&&p.vy> -500)options.push('roll');
   if(p.low)options.push('releaseRoll');
   for(const action of options){
    const g=fork(node.game);if(action!=='none')g.command(action,action==='roll');
    for(let i=0;i<frames&&g.phase==='running';i++)g.tick();
    // A shield is part of the authored route's safe-play budget. Let the
    // search spend it when that keeps the run alive; the gameplay test still
    // rejects any actual life-losing hit.
    if(g.hits>game.hits||g.phase==='gameover')continue;
    const cost=node.cost+(action==='none'?0:.7);
    const score=(g.coins-game.coins)*3+(g.stomps-game.stomps)*18+(g.player.grounded?g.player.y*.10+2:g.player.y*.006)-cost;
    candidates.push({game:g,commands:[...node.commands,action],cost,score});
   }
  }
  if(!candidates.length)break;
  candidates.sort((a,b)=>b.score-a.score);
  const used=new Set();nodes=[];
  for(const n of candidates){const p=n.game.player,key=[Math.round(p.y/12),Math.round(p.vy/70),p.jumps,p.low,p.heldRoll,n.game.stomps,n.game.coins].join(':');if(used.has(key))continue;used.add(key);nodes.push(n);if(nodes.length>=beam)break;}
 }
 return{commands:nodes[0].commands.slice(0,3),frames};
}
