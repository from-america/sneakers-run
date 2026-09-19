import { packager } from '@electron/packager';
import { mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const options=Object.fromEntries(process.argv.slice(2).map(value=>value.replace(/^--/,'').split('=')));
const platform=options.platform||process.platform,arch=options.arch||process.arch;
if(!['darwin','linux','win32'].includes(platform)||!['x64','arm64'].includes(arch))throw Error('Unsupported desktop target.');
const stage=path.join(root,'dist/app');await rm(stage,{recursive:true,force:true});await mkdir(stage,{recursive:true});
await cp(path.join(root,'dist/web'),stage,{recursive:true});await cp(path.join(root,'desktop'),path.join(stage,'desktop'),{recursive:true});
await writeFile(path.join(stage,'package.json'),JSON.stringify({name:'sneakers-run',productName:'Sneakers Run',version:'3.0.0',main:'desktop/main.cjs',description:'Famous Moji city escape',author:'Famous Moji'}));
const paths=await packager({dir:stage,out:path.join(root,'dist/desktop'),name:'Sneakers Run',executableName:'sneakers-run',platform,arch,
  electronVersion:'44.4.1',asar:true,overwrite:true,prune:true,appBundleId:'com.famousmoji.sneakersrun',appVersion:'3.0.0',appCopyright:'Famous Moji',
  icon:path.join(root,'desktop/icon'),
  osxSign:false,osxNotarize:false});
console.log(paths.join('\n'));
