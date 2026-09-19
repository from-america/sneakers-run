import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {SHAPES,PHYSICS,URBAN_KIT} from '../game/config.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=file=>readFileSync(path.join(root,file));
const hash=file=>createHash('sha256').update(read(file)).digest('hex');
export function fingerprints(){
 const files=['index.html','assets/art-catalog.json','assets/level-props.json','assets/street-kit.json','assets/runner-registration.json','tools/pack-runtime-art.py'];
 for(const directory of ['game','assets/runtime','assets/fonts'])for(const file of readdirSync(path.join(root,directory))){
  // Internal authoring tools are deliberately outside the distributable and
  // do not invalidate the recorded visual review of the shipping game.
  if(directory==='game'&&file.startsWith('editor.'))continue;
  files.push(`${directory}/${file}`);
 }
 const atlas=JSON.parse(read('assets/runtime/sprites.json'));
 files.push(...Object.keys(atlas.sources));
 return Object.fromEntries([...new Set(files)].sort().map(file=>[file,hash(file)]));
}
export function validateAssets(){
 const errors=[],atlas=JSON.parse(read('assets/runtime/sprites.json'));
 for(const [source,expected] of Object.entries(atlas.sources)){
  if(!/^assets\/imagegen\/.+\.png$/.test(source))errors.push(`Unapproved source: ${source}`);
  if(hash(source)!==expected)errors.push(`Source changed since packing: ${source}`);
 }
 for(const [name,frames] of Object.entries(atlas.sprites))for(const frame of frames){
  if(frame.width<=0||frame.height<=0||frame.pivotX<0||frame.pivotY<0)errors.push(`Invalid frame geometry: ${name}`);
  const [x,y,w,h]=frame.rect;if(x<4||y<4||x+w>atlas.size[0]||y+h>atlas.size[1])errors.push(`Frame outside atlas: ${name}`);
  // Tiny decorative frames can only be rasterized to whole device pixels;
  // allow that bounded rounding error while still rejecting real stretching.
  const pixelTolerance=Math.max(.012,1/Math.min(w,h)+.001);
  if(Math.abs(frame.width/frame.height-w/h)>pixelTolerance)errors.push(`Distorted frame: ${name}`);
 }
 for(const [name,rect] of Object.entries(URBAN_KIT))if(name!=='image'){
  const [x,y,w,h]=rect;
  if(x<0||y<0||w<=0||h<=0||x+w>1536||y+h>1024)errors.push(`Kit rectangle outside reviewed sheet: ${name}`);
 }
 for(const [name,shape] of Object.entries(SHAPES)){
  // Special kit artwork is a reviewed raster sheet with stable source
  // rectangles, so it is validated through URBAN_KIT rather than the packed
  // gameplay atlas.
  if(shape.special){if(!URBAN_KIT[shape.special])errors.push(`Missing kit rectangle: ${name}`);for(const [x,y,w,h] of shape.solids||[])if(x<0||y<0||x+w>shape.width+1||y+h>shape.height+1)errors.push(`Collider outside authored footprint: ${name}`);continue;}
  const frame=atlas.sprites[shape.art]?.[0];if(!frame){errors.push(`Missing ${name} sprite`);continue;}
  if(!shape.enemy&&Math.abs(frame.width-shape.width)>1)errors.push(`Art/physics width mismatch: ${name}`);
  for(const [x,y,w,h] of shape.solids||[])if(x<0||y<0||x+w>shape.width+1||y+h>shape.height+1)errors.push(`Collider outside authored footprint: ${name}`);
  if(!shape.enemy&&Math.abs(frame.height-shape.height)>4)errors.push(`Art/physics height mismatch: ${name} ${frame.height} / ${shape.height}`);
 }
 const rollHeight=Math.max(...atlas.sprites.roll.map(f=>f.height));
 if(rollHeight>=SHAPES.gate.solids[0][1]||PHYSICS.low>=SHAPES.gate.solids[0][1])errors.push('Roll does not fit visible clearance.');
 if(PHYSICS.standing<=SHAPES.gate.solids[0][1])errors.push('Low-clearance beam cannot hit an upright runner.');
 return errors;
}
export function checkReview(review,current=fingerprints()){
 const errors=[];
 if(review.status!=='locally-reviewed'||!review.reviewer||!review.date)errors.push('Missing explicit local review.');
 for(const criterion of ['runnerStyle','protectedCharacters','cameraComposition','laneReadability','uiHierarchy','collisionGeometry']){
  if(review.criteria?.[criterion]?.verdict!=='pass'||!review.criteria[criterion].evidence)errors.push(`Missing review: ${criterion}`);
 }
 for(const file of new Set([...Object.keys(current),...Object.keys(review.fingerprints||{})]))if(current[file]!==review.fingerprints?.[file])errors.push(`Visual review is stale: ${file}`);
 return errors;
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
 try{
  const review=JSON.parse(read('game-tests/review.json'));const errors=[...validateAssets(),...checkReview(review)];
  for(const file of review.captures||[])if(!existsSync(path.join(root,file)))errors.push(`Missing review evidence: ${file}`);
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Raster provenance, world footprints, roll clearance and recorded visual review match this build. This is a local review, not a quality or platform certification.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
