const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  launchGame: (data) => ipcRenderer.invoke("launch-game", data),
});