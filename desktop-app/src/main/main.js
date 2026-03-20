/**
 * AWE System Desktop - Main Process
 * Automated Writing Evaluation with Local LLM Support
 * 
 * Developed by: Dr. Waleed Mandour, 2026
 * Sultan Qaboos University
 */

const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const si = require('systeminformation');
const Store = require('electron-store');
const { spawn, exec } = require('child_process');

// Initialize store for app settings
const store = new Store({
  name: 'awe-settings',
  defaults: {
    llm: {
      provider: 'ollama',
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
      customUrl: '',
      model: 'llama3.2',
      temperature: 0.3,
      maxTokens: 2000
    },
    ocr: {
      provider: 'tesseract',
      language: 'eng',
      tesseractPath: ''
    },
    courses: [
      { id: '0230', name: 'English Language Foundation I', program: 'foundation', maxScore: 6 },
      { id: '0340', name: 'English Language Foundation II', program: 'foundation', maxScore: 6 },
      { id: 'LANC2160', name: 'Academic English: Summary Writing', program: 'post-foundation', maxScore: 5 }
    ],
    pythonBackend: {
      port: 5000,
      autoStart: true
    },
    appearance: {
      theme: 'light',
      language: 'en'
    }
  }
});

// Global variables
let mainWindow = null;
let pythonProcess = null;
let systemSpecs = null;

// Minimum system requirements
const MIN_REQUIREMENTS = {
  cpuCores: 4,
  ramGB: 8,
  storageGB: 10,
  gpuMemoryGB: 4 // For LLM inference
};

// Recommended system requirements
const RECOMMENDED_REQUIREMENTS = {
  cpuCores: 8,
  ramGB: 16,
  storageGB: 20,
  gpuMemoryGB: 8
};

/**
 * Check system specifications
 */
async function checkSystemSpecs() {
  try {
    const [cpu, mem, graphics, osInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.graphics(),
      si.osInfo()
    ]);

    const specs = {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed
      },
      memory: {
        total: mem.total,
        totalGB: Math.round(mem.total / (1024 * 1024 * 1024) * 10) / 10,
        free: mem.free,
        freeGB: Math.round(mem.free / (1024 * 1024 * 1024) * 10) / 10
      },
      graphics: graphics.controllers.map(gpu => ({
        vendor: gpu.vendor,
        model: gpu.model,
        vram: gpu.vram,
        vramGB: gpu.vram ? Math.round(gpu.vram / 1024 * 10) / 10 : null
      })),
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch
      },
      compatibility: null
    };

    // Check compatibility
    specs.compatibility = checkCompatibility(specs);

    systemSpecs = specs;
    return specs;
  } catch (error) {
    console.error('Error checking system specs:', error);
    return null;
  }
}

/**
 * Check system compatibility with requirements
 */
function checkCompatibility(specs) {
  const result = {
    minimum: { passed: true, details: [] },
    recommended: { passed: true, details: [] },
    warnings: [],
    errors: []
  };

  // Check CPU cores
  if (specs.cpu.cores < MIN_REQUIREMENTS.cpuCores) {
    result.minimum.passed = false;
    result.errors.push(`CPU: ${specs.cpu.cores} cores (minimum ${MIN_REQUIREMENTS.cpuCores} required)`);
  } else if (specs.cpu.cores < RECOMMENDED_REQUIREMENTS.cpuCores) {
    result.recommended.passed = false;
    result.warnings.push(`CPU: ${specs.cpu.cores} cores (${RECOMMENDED_REQUIREMENTS.cpuCores} recommended for better performance)`);
  }

  // Check RAM
  if (specs.memory.totalGB < MIN_REQUIREMENTS.ramGB) {
    result.minimum.passed = false;
    result.errors.push(`RAM: ${specs.memory.totalGB}GB (minimum ${MIN_REQUIREMENTS.ramGB}GB required)`);
  } else if (specs.memory.totalGB < RECOMMENDED_REQUIREMENTS.ramGB) {
    result.recommended.passed = false;
    result.warnings.push(`RAM: ${specs.memory.totalGB}GB (${RECOMMENDED_REQUIREMENTS.ramGB}GB recommended for larger models)`);
  }

  // Check GPU (for LLM acceleration)
  const hasGPUMemory = specs.graphics.some(gpu => gpu.vramGB && gpu.vramGB >= MIN_REQUIREMENTS.gpuMemoryGB);
  const hasRecommendedGPU = specs.graphics.some(gpu => gpu.vramGB && gpu.vramGB >= RECOMMENDED_REQUIREMENTS.gpuMemoryGB);
  
  if (!hasGPUMemory) {
    result.warnings.push('GPU: No dedicated GPU with sufficient VRAM detected. LLM inference will use CPU (slower).');
    result.recommended.passed = false;
  } else if (!hasRecommendedGPU) {
    result.recommended.passed = false;
    result.warnings.push(`GPU: VRAM below recommended. Larger models may be slow.`);
  }

  result.summary = result.minimum.passed 
    ? (result.recommended.passed ? 'excellent' : 'compatible')
    : 'incompatible';

  return result;
}

/**
 * Check if Ollama is installed
 */
async function checkOllamaInstalled() {
  return new Promise((resolve) => {
    exec('ollama --version', (error, stdout, stderr) => {
      if (error) {
        resolve({ installed: false, version: null });
      } else {
        const version = stdout.trim().split('\n')[0];
        resolve({ installed: true, version });
      }
    });
  });
}

/**
 * Check if LM Studio is installed
 */
async function checkLMStudioInstalled() {
  const commonPaths = [
    path.join(os.homedir(), 'AppData', 'Local', 'LM-Studio'),
    path.join('C:', 'Program Files', 'LM-Studio'),
    path.join('C:', 'Program Files (x86)', 'LM-Studio')
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return { installed: true, path: p };
    }
  }
  return { installed: false, path: null };
}

/**
 * Get available Ollama models
 */
async function getOllamaModels() {
  const ollamaUrl = store.get('llm.ollamaUrl');
  
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      return data.models || [];
    }
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
  }
  return [];
}

/**
 * Start Python backend server
 */
async function startPythonBackend() {
  const pythonPath = getPythonPath();
  const backendPath = path.join(app.getAppPath(), 'python-backend', 'server.py');
  
  if (!fs.existsSync(backendPath)) {
    console.error('Python backend not found:', backendPath);
    return false;
  }

  const port = store.get('pythonBackend.port');
  
  pythonProcess = spawn(pythonPath, [backendPath, '--port', port], {
    cwd: path.dirname(backendPath),
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Backend: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Backend Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python Backend exited with code ${code}`);
    pythonProcess = null;
  });

  return true;
}

/**
 * Stop Python backend server
 */
function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

/**
 * Get Python executable path
 */
function getPythonPath() {
  // Check for bundled Python first
  const bundledPython = path.join(app.getAppPath(), 'python', 'python.exe');
  if (fs.existsSync(bundledPython)) {
    return bundledPython;
  }
  
  // Fall back to system Python
  return 'python';
}

/**
 * Create the main application window
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, '../../assets/icon.png'),
    title: 'AWE System - Automated Writing Evaluation',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    show: false
  });

  // Load the app
  const isDev = process.argv.includes('--dev');
  
  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Assessment',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu:new-assessment')
        },
        { type: 'separator' },
        {
          label: 'Open Image...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp'] }],
              properties: ['openFile']
            });
            if (!result.canceled) {
              mainWindow.webContents.send('file:open-image', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Export Results...',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('menu:export')
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
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
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
          click: () => mainWindow.webContents.send('menu:settings', 'llm')
        },
        {
          label: 'OCR Settings',
          click: () => mainWindow.webContents.send('menu:settings', 'ocr')
        },
        {
          label: 'Appearance',
          click: () => mainWindow.webContents.send('menu:settings', 'appearance')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AWE System',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About AWE System',
              message: 'AWE System - Automated Writing Evaluation',
              detail: `Version: ${app.getVersion()}\n\nDeveloped by: Dr. Waleed Mandour\nSultan Qaboos University\n2026\n\nAn AI-powered essay assessment system with local LLM support for offline evaluation.`
            });
          }
        },
        {
          label: 'Check System Requirements',
          click: () => mainWindow.webContents.send('menu:check-system')
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/waleedmandour/awe-system/wiki')
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/waleedmandour/awe-system/issues')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-system-specs', async () => {
  if (!systemSpecs) {
    return await checkSystemSpecs();
  }
  return systemSpecs;
});

ipcMain.handle('check-llm-status', async () => {
  const results = {
    ollama: await checkOllamaInstalled(),
    lmstudio: await checkLMStudioInstalled(),
    ollamaModels: []
  };

  if (results.ollama.installed) {
    results.ollamaModels = await getOllamaModels();
  }

  return results;
});

ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('update-settings', (event, settings) => {
  Object.keys(settings).forEach(key => {
    store.set(key, settings[key]);
  });
  return store.store;
});

ipcMain.handle('test-llm-connection', async (event, provider) => {
  const urls = {
    ollama: store.get('llm.ollamaUrl'),
    lmstudio: store.get('llm.lmStudioUrl'),
    custom: store.get('llm.customUrl')
  };

  const url = urls[provider];
  if (!url) return { success: false, error: 'No URL configured' };

  try {
    const response = await fetch(url, { method: 'GET', timeout: 5000 });
    return { success: response.ok, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp'] }],
    properties: ['openFile']
  });
  
  if (result.canceled) return null;
  
  const imagePath = result.filePaths[0];
  const imageData = fs.readFileSync(imagePath);
  return {
    path: imagePath,
    data: `data:image/${path.extname(imagePath).slice(1)};base64,${imageData.toString('base64')}`
  };
});

ipcMain.handle('save-results', async (event, { content, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'assessment-results',
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Text', extensions: ['txt'] }
    ]
  });
  
  if (result.canceled) return null;
  
  fs.writeFileSync(result.filePath, content);
  return result.filePath;
});

// App lifecycle events
app.whenReady().then(async () => {
  // Check system specs first
  await checkSystemSpecs();
  
  // Start Python backend if configured
  if (store.get('pythonBackend.autoStart')) {
    await startPythonBackend();
  }
  
  createWindow();
});

app.on('window-all-closed', () => {
  stopPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopPythonBackend();
});

// Export for testing
module.exports = { checkSystemSpecs, checkCompatibility };
