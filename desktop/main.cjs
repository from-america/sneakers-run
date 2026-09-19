const { app, BrowserWindow, protocol, net, ipcMain, Menu, powerMonitor } = require('electron');
const { readFile, writeFile, rename, mkdir } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{ scheme:'sneakers', privileges:{ standard:true, secure:true, supportFetchAPI:true, stream:true, corsEnabled:true } }]);
if(process.env.SNEAKERS_RUN_USER_DATA)app.setPath('userData',path.resolve(process.env.SNEAKERS_RUN_USER_DATA));
app.setName('Sneakers Run');
let window;
const root = path.resolve(__dirname, '..');
let saveQueue=Promise.resolve();
let drained=false;
const trusted = event => event.sender===window?.webContents && event.senderFrame?.url.startsWith('sneakers://game/');
const savePath=()=>path.join(app.getPath('userData'),'progress.json');

app.whenReady().then(()=>{
  protocol.handle('sneakers',request=>{
    const url=new URL(request.url);
    if(url.hostname!=='game'||!['GET','HEAD'].includes(request.method))return new Response('Forbidden',{status:403});
    let pathname;
    try{pathname=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400});}
    const filename=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`);
    if(!filename.startsWith(root+path.sep)||pathname.includes('\\'))return new Response('Forbidden',{status:403});
    return net.fetch(pathToFileURL(filename).toString());
  });
  Menu.setApplicationMenu(null);
  window=new BrowserWindow({width:1280,height:800,minWidth:320,minHeight:360,show:false,fullscreen:process.argv.includes('--fullscreen'),backgroundColor:'#172329',title:'Sneakers Run',icon:path.join(root,'assets/runtime/app-icon.png'),
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,autoplayPolicy:'no-user-gesture-required'}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('sneakers://game/'))event.preventDefault();});
  window.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  window.webContents.session.setPermissionCheckHandler(()=>false);
  window.once('ready-to-show',()=>window.show());
  ipcMain.handle('read-progress',async event=>{
    if(!trusted(event))return null;
    try{return await readFile(savePath(),'utf8');}catch(error){if(error.code==='ENOENT')return null;throw error;}
  });
  ipcMain.handle('write-progress',(event,contents)=>{
    if(!trusted(event)||typeof contents!=='string'||contents.length>131072)return false;
    try{if(JSON.parse(contents).version!==2)return false;}catch{return false;}
    saveQueue=saveQueue.catch(()=>{}).then(async()=>{
      await mkdir(app.getPath('userData'),{recursive:true});
      await writeFile(savePath()+'.tmp',contents,'utf8');await rename(savePath()+'.tmp',savePath());return true;
    }).catch(()=>false);
    return saveQueue;
  });
  ipcMain.handle('fullscreen',event=>{if(trusted(event)){window.setFullScreen(!window.isFullScreen());return window.isFullScreen();}return false;});
  ipcMain.handle('quit-game',async event=>{if(trusted(event)){await saveQueue;app.quit();}});
  powerMonitor.on('suspend',()=>window?.webContents.send('system-suspend'));
  window.loadURL('sneakers://game/'+(process.env.SNEAKERS_RUN_TEST==='1'?'?test=1':''));
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',event=>{
  if(drained)return;event.preventDefault();
  saveQueue.finally(()=>{drained=true;app.quit();});
});
