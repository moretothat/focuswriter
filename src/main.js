const { app, BrowserWindow, ipcMain, globalShortcut, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isLocked = false;
let lockEndTime = null;
let preventCloseUntil = null;

// Disable hardware acceleration issues
app.disableHardwareAcceleration();

// Single instance lock - prevent multiple windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Get user data path for saving documents
const userDataPath = app.getPath('userData');
const documentsPath = path.join(userDataPath, 'documents');
const settingsPath = path.join(userDataPath, 'settings.json');

// Ensure documents directory exists
if (!fs.existsSync(documentsPath)) {
  fs.mkdirSync(documentsPath, { recursive: true });
}

function createWindow() {
  // Remove the application menu entirely for cleaner look
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Prevent closing during lock
  mainWindow.on('close', (e) => {
    if (isLocked && Date.now() < preventCloseUntil) {
      e.preventDefault();
      mainWindow.webContents.send('close-attempted');
      return false;
    }
  });

  // Prevent minimize during lock
  mainWindow.on('minimize', (e) => {
    if (isLocked) {
      e.preventDefault();
      mainWindow.restore();
    }
  });

  // Keep window on top and fullscreen during lock
  mainWindow.on('leave-full-screen', () => {
    if (isLocked) {
      setTimeout(() => {
        mainWindow.setFullScreen(true);
      }, 100);
    }
  });

  // Prevent blur/focus loss during lock
  mainWindow.on('blur', () => {
    if (isLocked) {
      setTimeout(() => {
        mainWindow.focus();
        mainWindow.moveTop();
      }, 100);
    }
  });
}

// Register global shortcuts to block common escape attempts
function registerBlockingShortcuts() {
  // Block Cmd+Q (Quit)
  globalShortcut.register('CommandOrControl+Q', () => {
    if (!isLocked) app.quit();
  });

  // Block Cmd+W (Close Window)
  globalShortcut.register('CommandOrControl+W', () => {
    // Do nothing during lock
  });

  // Block Cmd+M (Minimize)
  globalShortcut.register('CommandOrControl+M', () => {
    // Do nothing during lock
  });

  // Block Cmd+H (Hide)
  globalShortcut.register('CommandOrControl+H', () => {
    // Do nothing during lock
  });

  // Block Cmd+Tab (App Switcher) - Note: This may not work on all systems
  globalShortcut.register('CommandOrControl+Tab', () => {
    if (isLocked) {
      mainWindow.focus();
    }
  });

  // Block Escape
  globalShortcut.register('Escape', () => {
    // Do nothing during lock
  });

  // Block F11 (Fullscreen toggle)
  globalShortcut.register('F11', () => {
    // Do nothing during lock
  });
}

function unregisterBlockingShortcuts() {
  globalShortcut.unregisterAll();
}

// IPC handlers
ipcMain.handle('start-session', async (event, minutes) => {
  isLocked = true;
  const duration = minutes * 60 * 1000;
  lockEndTime = Date.now() + duration;
  preventCloseUntil = lockEndTime;

  // Enter kiosk mode (true fullscreen that hides dock/menu)
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.focus();

  registerBlockingShortcuts();

  return { endTime: lockEndTime };
});

ipcMain.handle('end-session', async () => {
  isLocked = false;
  lockEndTime = null;
  preventCloseUntil = null;

  unregisterBlockingShortcuts();

  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false);
  mainWindow.setFullScreen(false);

  return true;
});

ipcMain.handle('get-lock-status', async () => {
  return {
    isLocked,
    endTime: lockEndTime,
    remaining: lockEndTime ? Math.max(0, lockEndTime - Date.now()) : 0
  };
});

ipcMain.handle('save-document', async (event, content, filename) => {
  const filePath = path.join(documentsPath, filename || 'autosave.txt');
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
});

ipcMain.handle('load-document', async (event, filename) => {
  const filePath = path.join(documentsPath, filename || 'autosave.txt');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return '';
});

ipcMain.handle('export-document', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Document',
    defaultPath: path.join(app.getPath('documents'), 'focuswriter-export.txt'),
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return result.filePath;
  }
  return null;
});

ipcMain.handle('get-documents-path', async () => {
  return documentsPath;
});

ipcMain.handle('emergency-exit', async (event, phrase) => {
  // Require typing a long phrase to exit early
  const requiredPhrase = "I understand this defeats the purpose of focused writing";
  if (phrase === requiredPhrase) {
    isLocked = false;
    lockEndTime = null;
    preventCloseUntil = null;
    unregisterBlockingShortcuts();
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setVisibleOnAllWorkspaces(false);
    return true;
  }
  return false;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Prevent new windows
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
