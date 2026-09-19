import { mkdir, cp, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { LEVELS } from '../game/routes.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist/web');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const titleMusic='assets/music/sneakers-run-lite.mp3';
const music=[...new Set([titleMusic,...LEVELS.map(level=>level.music)])];
for(const file of music){
  if(typeof file!=='string'||!file.startsWith('assets/'))throw Error(`Invalid chapter music path: ${file}`);
  const source=path.resolve(root,file);
  const relative=path.relative(root,source);
  if(relative.startsWith('..')||path.isAbsolute(relative)||(await stat(source)).isFile()===false)throw Error(`Missing chapter music: ${file}`);
}
for(const file of ['index.html','game','assets/runtime','assets/fonts','assets/audio/intro-dialogue.mp3',...music]){
  await mkdir(path.dirname(path.join(out,file)),{recursive:true});await cp(path.join(root,file),path.join(out,file),{recursive:true});
}
for(const file of music){
  const built=path.join(out,file);
  if(!(await stat(built)).isFile())throw Error(`Build omitted chapter music: ${file}`);
}
const entries=[];
async function walk(folder){for(const item of await readdir(folder)){const target=path.join(folder,item);if((await stat(target)).isDirectory())await walk(target);else entries.push(target);}}
await walk(out);
const files={};for(const file of entries)files[path.relative(out,file)]=createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile(path.join(out,'build-manifest.json'),JSON.stringify({name:'Sneakers Run',version:'3.0.0',files},null,2)+'\n');
console.log(`Offline web build: ${out}, ${entries.length} files.`);
