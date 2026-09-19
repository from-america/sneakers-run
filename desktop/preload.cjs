const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop',Object.freeze({
  readSave:()=>ipcRenderer.invoke('read-progress'),
  writeSave:contents=>ipcRenderer.invoke('write-progress',contents),
  fullscreen:()=>ipcRenderer.invoke('fullscreen'),
  quit:()=>ipcRenderer.invoke('quit-game'),
  onSuspend:callback=>{ipcRenderer.on('system-suspend',()=>callback());},
}));
