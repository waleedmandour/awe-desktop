const { app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow = null;
let pythonProcess = null;
let isQuitting = false;

// Python backend configuration
const isDev = process.env.ELECTRON_START_URL !== undefined;
const APP_PATH = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath);
const PYTHON_BACKEND_PATH = path.join(APP_PATH, 'python-backend');
const PYTHON_PORT = 8765;
const PYTHON_URL = `http://127.0.0.1:${PYTHON_PORT}`;

// Get system information
function getSystemInfo() {
  const cpus = os.cpus();
  const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const cpuCores = cpus.length;
  const cpuModel = cpus[0]?.model || 'Unknown';
  const platform = os.platform();
  const arch = os.arch();
  const freeMemoryGB = Math.round(os.freemem() / (1024 * 1024 * 1024));

  return {
    totalMemoryGB,
    freeMemoryGB,
    cpuCores,
    cpuModel,
    platform,
    arch,
    gpu: 'Not detected' // Will be updated by Python backend
  };
}

// Recommend LLM based on system specs
function recommendLLM(systemInfo) {
  const { totalMemoryGB, cpuCores } = systemInfo;
  
  if (totalMemoryGB >= 32 && cpuCores >= 8) {
    return {
      recommended: 'llama3:8b',
      alternatives: ['llama3:70b', 'mistral:7b', 'codellama:34b'],
      reason: 'Your system can handle large models with excellent performance.',
      maxModelSize: '70B'
    };
  } else if (totalMemoryGB >= 16 && cpuCores >= 4) {
    return {
      recommended: 'llama3:8b',
      alternatives: ['mistral:7b', 'phi3:14b', 'gemma:7b'],
      reason: 'Your system is well-suited for medium-sized models.',
      maxModelSize: '14B'
    };
  } else if (totalMemoryGB >= 8) {
    return {
      recommended: 'phi3:mini',
      alternatives: ['tinyllama:1.1b', 'gemma:2b', 'llama3:8b-q4'],
      reason: 'Your system can run smaller models efficiently.',
      maxModelSize: '8B (quantized)'
    };
  } else {
    return {
      recommended: 'tinyllama:1.1b',
      alternatives: ['phi3:mini-q4'],
      reason: 'For optimal performance, consider using a smaller model or upgrading RAM.',
      maxModelSize: '3B'
    };
  }
}

// Start Python backend server
function startPythonBackend() {
  return new Promise((resolve, reject) => {
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const mainPyPath = path.join(PYTHON_BACKEND_PATH, 'main.py');
    
    console.log('Starting Python backend from:', mainPyPath);
    
    // Check if Python backend exists
    if (!fs.existsSync(mainPyPath)) {
      console.log('Python backend not found, creating minimal server...');
      createMinimalPythonBackend();
    }
    
    pythonProcess = spawn(pythonExe, [mainPyPath, '--port', PYTHON_PORT.toString()], {
      cwd: PYTHON_BACKEND_PATH,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python: ${data}`);
      if (data.toString().includes('Uvicorn running')) {
        resolve();
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python backend:', err);
      // Resolve anyway - app can work with limited functionality
      resolve();
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      resolve();
    }, 10000);
  });
}

// Create minimal Python backend if not exists
function createMinimalPythonBackend() {
  const backendDir = path.join(APP_PATH, 'python-backend');
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  
  const mainPy = path.join(backendDir, 'main.py');
  const content = `#!/usr/bin/env python3
"""AWE Desktop - Python Backend Server"""
import sys
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import threading

PORT = 8765

class MinimalHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile(json.dumps({'status': 'ok', 'mode': 'minimal'}).encode())
        elif self.path == '/api/system-info':
            import platform
            info = {
                'platform': platform.system(),
                'memory': 'Unknown',
                'cpu': platform.processor() or 'Unknown',
                'cores': os.cpu_count() or 1
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile(json.dumps(info).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/api/ocr':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile(json.dumps({'text': 'OCR requires full Python backend installation'}).encode())
        elif self.path == '/api/assess':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile(json.dumps({'assessment': 'Assessment requires LLM connection'}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"Server: {args[0]}")

if __name__ == '__main__':
    port = int(sys.argv[sys.argv.index('--port') + 1]) if '--port' in sys.argv else PORT
    server = HTTPServer(('127.0.0.1', port), MinimalHandler)
    print(f"Minimal server running on port {port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
`;
  
  fs.writeFileSync(mainPy, content);
}

// Stop Python backend
function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Create the main application window
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'AWE Desktop - Automated Writing Evaluation',
    icon: path.join(APP_PATH, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#1a5f2a',
    titleBarStyle: 'default'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Assessment',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-assessment')
        },
        { type: 'separator' },
        {
          label: 'Open Image...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] }
              ]
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('file-opened', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'LLM Configuration',
          click: () => mainWindow.webContents.send('open-settings', 'llm')
        },
        {
          label: 'OCR Settings',
          click: () => mainWindow.webContents.send('open-settings', 'ocr')
        },
        { type: 'separator' },
        {
          label: 'Check System Compatibility',
          click: () => mainWindow.webContents.send('check-system')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AWE Desktop',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About AWE Desktop',
              message: 'AWE Desktop - Automated Writing Evaluation System',
              detail: 'Version 1.0.0\n\nDeveloped by: Dr. Waleed Mandour\nSultan Qaboos University\n© 2026\n\nAn AI-powered writing assessment tool for educators and students.'
            });
          }
        },
        {
          label: 'Check for Updates',
          click: () => shell.openExternal('https://github.com/waleedmandour/awe-desktop/releases')
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/waleedmandour/awe-desktop#readme')
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/waleedmandour/awe-desktop/issues')
        }
      ]
    }
  ];

  // Add Developer menu in development
  if (isDev) {
    template.push({
      label: 'Developer',
      submenu: [
        { role: 'toggleDevTools' },
        {
          label: 'Reload Python Backend',
          click: async () => {
            stopPythonBackend();
            await startPythonBackend();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              message: 'Python backend reloaded'
            });
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-system-info', () => {
  const sysInfo = getSystemInfo();
  const llmRecommendation = recommendLLM(sysInfo);
  return { ...sysInfo, llmRecommendation };
});

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'] }
    ]
  });
  if (result.canceled) return null;
  
  const filePath = result.filePaths[0];
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === 'jpg' ? 'jpeg' : ext;
  
  return {
    path: filePath,
    base64: `data:image/${mimeType};base64,${base64}`,
    name: path.basename(filePath)
  };
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('get-python-url', () => PYTHON_URL);

ipcMain.handle('check-ollama', async () => {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ available: true, models: parsed.models || [] });
        } catch {
          resolve({ available: false, models: [] });
        }
      });
    });
    req.on('error', () => resolve({ available: false, models: [] }));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ available: false, models: [] });
    });
  });
});

// App lifecycle
app.whenReady().then(async () => {
  console.log('Starting AWE Desktop...');
  
  // Start Python backend
  console.log('Starting Python backend...');
  await startPythonBackend();
  console.log('Python backend started');
  
  // Create main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  stopPythonBackend();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});
