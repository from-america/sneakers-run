import { PHYSICS, SHAPES, overlap, solidBoxes, topFaces, entityAt } from './config.js?v=10';
const EPS=1e-7;
// Feet cross moving upper faces in relative space. Impact and end-of-tick
// support are separate facts: even a grazing edge can produce a valid stomp.
export function sweepLanding(entities,from,to,start=0,end=1) {
  let best=null;
  for(const entity of entities){
    if(entity.visualOnly||entity.chaser)continue;
    const old=topFaces(entity,start),next=topFaces(entity,end);
    for(let i=0;i<old.length;i++){
      const a=old[i],b=next[i],above=from.y-a.y,below=to.y-b.y;
      if(above < -EPS || below > EPS || below>above+EPS)continue;
      const time=above-below>EPS?Math.max(0,above/(above-below)):0;
      const x=from.x+(to.x-from.x)*time,fx=a.x+(b.x-a.x)*time;
      if(x+PHYSICS.radius<=fx+EPS||x-PHYSICS.radius>=fx+a.w-EPS)continue;
      const y=a.y+(b.y-a.y)*time;
      if(!best||time<best.time-EPS||Math.abs(time-best.time)<EPS&&y>best.y)
        best={entity,face:i,y,endY:b.y,time,supported:to.x+PHYSICS.radius>b.x+EPS&&to.x-PHYSICS.radius<b.x+b.w-EPS};
    }
  }
  if(to.y<=0&&from.y>=-EPS){const time=from.y/(from.y-to.y||1);if(!best||time<best.time)best={entity:null,face:-1,y:0,endY:0,time,supported:true};}
  return best;
}
function interval(start,size,delta,low,high){
  if(Math.abs(delta)<EPS)return start+size>low&&start<high?[-Infinity,Infinity]:null;
  const a=(low-start-size)/delta,b=(high-start)/delta;return[Math.min(a,b),Math.max(a,b)];
}
export function sweepSolid(from,to,solid){
  if(overlap(from,solid))return{time:0,normal:'inside'};
  const dx=to.x-from.x,dy=to.y-from.y,x=interval(from.x,to.w,dx,solid.x,solid.x+solid.w),y=interval(from.y,to.h,dy,solid.y,solid.y+solid.h);
  if(!x||!y)return null;
  const enter=Math.max(x[0],y[0]),exit=Math.min(x[1],y[1]);
  if(enter < -EPS||enter>1||enter>exit+EPS)return null;
  return{time:Math.max(0,enter),normal:y[0]>=x[0]?dy<0?'top':'underside':dx>0?'left':'right'};
}
export function damagingContacts(entities,from,to,start=0,end=1){
  const contacts=[];
  for(const entity of entities){
    if(entity.visualOnly||entity.chaser)continue;
    const a=entityAt(entity,start),b=entityAt(entity,end);
    const relativeTo={...to,x:to.x-(b.x-a.x),y:to.y-(b.y-a.y)};
    for(const solid of solidBoxes(entity,start)){
      const contact=sweepSolid(from,relativeTo,solid);
      if(contact&&(contact.normal!=='top'||SHAPES[entity.type]?.lethal))contacts.push({...contact,entity,solid});
    }
  }
  return contacts.sort((a,b)=>a.time-b.time);
}
