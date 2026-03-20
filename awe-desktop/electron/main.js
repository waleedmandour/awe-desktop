const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow = null;
let pythonProcess = null;
let isQuitting = false;

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

  // LLM recommendation based on specs
  let llmRecommendation;
  if (totalMemoryGB >= 32 && cpuCores >= 8) {
    llmRecommendation = {
      recommended: 'llama3:8b',
      alternatives: ['llama3:70b', 'mistral:7b', 'codellama:34b'],
      reason: 'Your system can handle large models with excellent performance.',
      maxModelSize: '70B'
    };
  } else if (totalMemoryGB >= 16 && cpuCores >= 4) {
    llmRecommendation = {
      recommended: 'llama3:8b',
      alternatives: ['mistral:7b', 'phi3:14b', 'gemma:7b'],
      reason: 'Your system is well-suited for medium-sized models.',
      maxModelSize: '14B'
    };
  } else if (totalMemoryGB >= 8) {
    llmRecommendation = {
      recommended: 'phi3:mini',
      alternatives: ['tinyllama:1.1b', 'gemma:2b', 'llama3:8b-q4'],
      reason: 'Your system can run smaller models efficiently.',
      maxModelSize: '8B (quantized)'
    };
  } else {
    llmRecommendation = {
      recommended: 'tinyllama:1.1b',
      alternatives: ['phi3:mini-q4'],
      reason: 'For optimal performance, consider using a smaller model or upgrading RAM.',
      maxModelSize: '3B'
    };
  }

  return {
    platform,
    arch,
    cpuCores,
    cpuModel,
    totalMemoryGB,
    freeMemoryGB,
    llmRecommendation
  };
}

// Start Python backend
function startPythonBackend() {
  return new Promise((resolve) => {
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const mainPyPath = path.join(__dirname, '..', 'python-backend', 'main.py');
    
    if (!fs.existsSync(mainPyPath)) {
      console.log('Python backend not found, creating minimal server...');
      createMinimalPythonBackend();
    }
    
    pythonProcess = spawn(pythonExe, [mainPyPath, '--port', PYTHON_PORT.toString()], {
      cwd: path.dirname(mainPyPath),
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python: ${data}`);
      if (data.toString().includes('Uvicorn running') || data.toString().includes('Starting')) {
        resolve();
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python backend:', err);
      resolve();
    });

    setTimeout(resolve, 5000);
  });
}

// Create minimal Python backend
function createMinimalPythonBackend() {
  const backendDir = path.join(__dirname, '..', 'python-backend');
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
}

// Stop Python backend
function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'AWE Desktop',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#f8fafc',
    titleBarStyle: 'default'
  });

  const isDev = process.env.ELECTRON_START_URL !== undefined;
  
  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

// Create menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Assessment',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new-assessment')
        },
        { type: 'separator' },
        {
          label: 'Open Image...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] }]
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('file-opened', result.filePaths[0]);
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
      label: 'Tools',
      submenu: [
        {
          label: 'LLM Settings',
          click: () => mainWindow?.webContents.send('open-settings', 'llm')
        },
        {
          label: 'OCR Settings',
          click: () => mainWindow?.webContents.send('open-settings', 'ocr')
        },
        { type: 'separator' },
        {
          label: 'Check System',
          click: () => mainWindow?.webContents.send('check-system')
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
              detail: 'Version 1.0.0\n\nDeveloped by: Dr. Waleed Mandour\nCenter for Preparatory Studies\nSultan Qaboos University\n© 2026'
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
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-system-info', () => getSystemInfo());

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'] }]
  });
  if (result.canceled) return null;
  
  const filePath = result.filePaths[0];
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === 'jpg' ? 'jpeg' : ext;
  
  return { path: filePath, base64: `data:image/${mimeType};base64,${base64}`, name: path.basename(filePath) };
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
  await startPythonBackend();
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

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});
