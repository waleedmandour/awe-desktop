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
    ipcRenderer.on('menu-new-assessment', callback);
    return () => ipcRenderer.removeListener('menu-new-assessment', callback);
  },
  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', callback);
    return () => ipcRenderer.removeListener('file-opened', callback);
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
    return () => ipcRenderer.removeListener('open-settings', callback);
  },
  onCheckSystem: (callback) => {
    ipcRenderer.on('check-system', callback);
    return () => ipcRenderer.removeListener('check-system', callback);
  },
  
  // Platform detection
  platform: process.platform,
  isElectron: true
});
