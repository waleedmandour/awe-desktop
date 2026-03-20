/**
 * AWE System Desktop - Preload Script
 * Secure IPC bridge between main and renderer processes
 * 
 * Developed by: Dr. Waleed Mandour, 2026
 * Sultan Qaboos University
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('aweAPI', {
  // System Information
  getSystemSpecs: () => ipcRenderer.invoke('get-system-specs'),
  checkLLMStatus: () => ipcRenderer.invoke('check-llm-status'),
  
  // Settings Management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // LLM Operations
  testLLMConnection: (provider) => ipcRenderer.invoke('test-llm-connection', provider),
  
  // File Operations
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveResults: (content, defaultName) => ipcRenderer.invoke('save-results', { content, defaultName }),
  
  // Menu Events
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:new-assessment', callback);
    ipcRenderer.on('menu:export', callback);
    ipcRenderer.on('menu:settings', (event, tab) => callback({ action: 'settings', tab }));
    ipcRenderer.on('menu:check-system', callback);
    ipcRenderer.on('file:open-image', (event, path) => callback({ action: 'open-image', path }));
  },
  
  // Remove listeners
  removeMenuListener: (callback) => {
    ipcRenderer.removeListener('menu:new-assessment', callback);
    ipcRenderer.removeListener('menu:export', callback);
    ipcRenderer.removeListener('menu:settings', callback);
    ipcRenderer.removeListener('menu:check-system', callback);
    ipcRenderer.removeListener('file:open-image', callback);
  },
  
  // Platform info
  platform: process.platform,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux'
});

// Expose app info
contextBridge.exposeInMainWorld('aweApp', {
  name: 'AWE System Desktop',
  version: '1.0.0',
  description: 'Automated Writing Evaluation with Local LLM Support',
  author: 'Dr. Waleed Mandour',
  institution: 'Sultan Qaboos University',
  year: 2026
});
