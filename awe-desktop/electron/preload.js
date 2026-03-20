const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // File operations
  selectImage: () => ipcRenderer.invoke('select-image'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Python backend
  getPythonUrl: () => ipcRenderer.invoke('get-python-url'),
  checkOllama: () => ipcRenderer.invoke('check-ollama'),
  
  // Menu events
  onMenuNewAssessment: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu-new-assessment', handler);
    return () => ipcRenderer.removeListener('menu-new-assessment', handler);
  },
  onFileOpened: (callback) => {
    const handler = (event, filePath) => callback(filePath);
    ipcRenderer.on('file-opened', handler);
    return () => ipcRenderer.removeListener('file-opened', handler);
  },
  onOpenSettings: (callback) => {
    const handler = (event, tab) => callback(tab);
    ipcRenderer.on('open-settings', handler);
    return () => ipcRenderer.removeListener('open-settings', handler);
  },
  onCheckSystem: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('check-system', handler);
    return () => ipcRenderer.removeListener('check-system', handler);
  },
  
  // Platform detection
  platform: process.platform,
  isElectron: true
});
