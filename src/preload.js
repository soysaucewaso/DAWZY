const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  takeScreenshot: (userMsg) => ipcRenderer.invoke('takeScreenshot', userMsg)
});
