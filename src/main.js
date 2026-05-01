const { app, BrowserWindow, ipcMain, globalShortcut, dialog, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Native addon for blocking Cmd+Tab at system level
let presentationOptions = null;
try {
  presentationOptions = require('../native');
  console.log('Native Cmd+Tab blocking loaded:', presentationOptions.isAvailable());
} catch (err) {
  console.warn('Native addon not available:', err.message);
}

let mainWindow;
let blockingWindows = []; // Windows to black out external monitors
let isLocked = false;
let lockEndTime = null;
let preventCloseUntil = null;
let sessionMode = 'none'; // 'words', 'time', 'none'

// Disable hardware acceleration issues
app.disableHardwareAcceleration();

// Single instance lock - prevent multiple windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Auto-save location: ~/Documents/auto_save_document
const documentsPath = path.join(os.homedir(), 'Documents', 'auto_save_document');

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
    backgroundColor: '#f0f2f5', // Light mode background
    titleBarStyle: 'hiddenInset',
    fullscreen: true, // Start in fullscreen
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    show: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window in fullscreen when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.setFullScreen(true);
  });

  // Prevent closing during lock
  mainWindow.on('close', (e) => {
    if (isLocked && preventCloseUntil && Date.now() < preventCloseUntil) {
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

  // Block Cmd+Tab (App Switcher)
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

function enterLockMode() {
  isLocked = true;
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.focus();
  registerBlockingShortcuts();

  // Block Cmd+Tab at system level
  setTimeout(() => {
    if (presentationOptions && presentationOptions.isAvailable()) {
      presentationOptions.disableProcessSwitching();
    }
  }, 100);

  // Black out external monitors
  blockExternalMonitors();
}

function exitLockMode() {
  isLocked = false;
  lockEndTime = null;
  preventCloseUntil = null;
  sessionMode = 'none';
  unregisterBlockingShortcuts();

  // Re-enable Cmd+Tab
  if (presentationOptions && presentationOptions.isAvailable()) {
    presentationOptions.enableProcessSwitching();
  }

  // Close external monitor blocking windows
  unblockExternalMonitors();

  // Keep kiosk/fullscreen mode - only disable blocking features
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false);
  // Stay fullscreen until user clicks Save and Quit
}

function exitFullscreen() {
  mainWindow.setKiosk(false);
  mainWindow.setFullScreen(false);
}

// Block external monitors with black fullscreen windows
function blockExternalMonitors() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  displays.forEach((display) => {
    // Skip the primary display (where FocusWriter is)
    if (display.id === primaryDisplay.id) return;

    const blockingWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      backgroundColor: '#000000',
      fullscreen: true,
      kiosk: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      closable: false,
      focusable: false,
      webPreferences: {
        nodeIntegration: false
      }
    });

    // Load a simple black page
    blockingWindow.loadURL('data:text/html,<html><body style="background:#000;margin:0;"></body></html>');
    blockingWindow.setAlwaysOnTop(true, 'screen-saver');
    blockingWindows.push(blockingWindow);
  });
}

// Remove blocking windows from external monitors
function unblockExternalMonitors() {
  blockingWindows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });
  blockingWindows = [];
}

// IPC handlers

// Start session with word count goal
ipcMain.handle('start-session-words', async (event, wordTarget) => {
  sessionMode = 'words';
  // For word-based sessions, we set a very long timeout (24 hours)
  // The session ends when the word count is reached (handled in renderer)
  const duration = 24 * 60 * 60 * 1000; // 24 hours max
  lockEndTime = Date.now() + duration;
  preventCloseUntil = lockEndTime;

  enterLockMode();

  return { wordTarget };
});

// Start session with time limit
ipcMain.handle('start-session-time', async (event, minutes) => {
  sessionMode = 'time';
  const duration = minutes * 60 * 1000;
  lockEndTime = Date.now() + duration;
  preventCloseUntil = lockEndTime;

  enterLockMode();

  return { endTime: lockEndTime };
});

// Legacy handler for backwards compatibility
ipcMain.handle('start-session', async (event, minutes) => {
  return ipcMain.handle('start-session-time', event, minutes);
});

ipcMain.handle('end-session', async () => {
  exitLockMode();
  return true;
});

ipcMain.handle('get-lock-status', async () => {
  return {
    isLocked,
    endTime: lockEndTime,
    remaining: lockEndTime ? Math.max(0, lockEndTime - Date.now()) : 0,
    sessionMode
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

// Get list of saved drafts
ipcMain.handle('get-drafts', async () => {
  const drafts = [];

  if (fs.existsSync(documentsPath)) {
    const files = fs.readdirSync(documentsPath);

    for (const file of files) {
      if (file.endsWith('.txt')) {
        const filePath = path.join(documentsPath, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        // Get first line or first 30 chars as name
        const firstLine = content.split('\n')[0] || 'Untitled';
        const name = firstLine.substring(0, 40) + (firstLine.length > 40 ? '...' : '');

        drafts.push({
          filename: file,
          name: name || 'Untitled Draft',
          date: stats.mtime.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          modified: stats.mtime
        });
      }
    }

    // Sort by most recent
    drafts.sort((a, b) => b.modified - a.modified);
  }

  return drafts;
});

// Choose file dialog for Open Draft
ipcMain.handle('choose-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Draft',
    defaultPath: app.getPath('documents'),
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    return {
      path: filePath,
      name: path.basename(filePath)
    };
  }
  return null;
});

// Load file from any path
ipcMain.handle('load-file', async (event, filePath) => {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return '';
});

ipcMain.handle('export-document', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Document',
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

ipcMain.handle('quit-app', async () => {
  // Hide window immediately so desktop isn't visible during quit
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  app.quit();
});

ipcMain.handle('exit-fullscreen', async () => {
  exitFullscreen();
  return true;
});

ipcMain.handle('emergency-exit', async (event, phrase) => {
  // Require typing a long phrase to exit early
  const requiredPhrase = "I understand this defeats the purpose of focused writing";
  if (phrase === requiredPhrase) {
    exitLockMode();
    return true;
  }
  return false;
});

// Autosave file for recovery
const autosavePath = path.join(documentsPath, 'autosave-focuswriter.txt');

ipcMain.handle('clear-autosave', async () => {
  try {
    if (fs.existsSync(autosavePath)) {
      fs.unlinkSync(autosavePath);
    }
  } catch (err) {
    // Ignore errors during cleanup
  }
  return true;
});

ipcMain.handle('check-autosave', async () => {
  try {
    if (fs.existsSync(autosavePath)) {
      const content = fs.readFileSync(autosavePath, 'utf8');
      if (content.trim().length > 0) {
        const stats = fs.statSync(autosavePath);
        return {
          exists: true,
          content,
          lastModified: stats.mtime.toLocaleString()
        };
      }
    }
  } catch (err) {
    // Ignore
  }
  return { exists: false };
});

ipcMain.handle('get-autosave-path', async () => {
  return autosavePath;
});

// Settings persistence
const settingsPath = path.join(app.getPath('userData'), 'focuswriter-settings.json');

ipcMain.handle('load-settings', async () => {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (err) {
    // Ignore
  }
  return {};
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    let existing = {};
    if (fs.existsSync(settingsPath)) {
      existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    const merged = { ...existing, ...settings };
    fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
});

// AI Chat - Gemini API
ipcMain.handle('chat-with-claude', async (event, { apiKey, messages, documentContent }) => {
  try {
    const https = require('https');

    // Build Gemini request
    const geminiMessages = [];

    // System instruction via first user message context
    const systemContext = `You are a helpful writing assistant embedded in a distraction-free writing app called FocusWriter. The user is currently working on a document. Help them with writing, editing, brainstorming, and research. Be concise and practical.\n\nCurrent document content:\n${documentContent}`;

    // Convert chat history to Gemini format
    for (const msg of messages) {
      geminiMessages.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Prepend system context to first user message
    if (geminiMessages.length > 0 && geminiMessages[0].role === 'user') {
      geminiMessages[0].parts[0].text = `[Context: ${systemContext}]\n\n${geminiMessages[0].parts[0].text}`;
    }

    const requestBody = JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    });

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.candidates && parsed.candidates[0]) {
              const content = parsed.candidates[0].content.parts[0].text;
              resolve({ content });
            } else if (parsed.error) {
              resolve({ error: parsed.error.message });
            } else {
              resolve({ error: 'Unexpected response from API' });
            }
          } catch (e) {
            resolve({ error: 'Failed to parse API response' });
          }
        });
      });

      req.on('error', (e) => {
        resolve({ error: e.message });
      });

      req.write(requestBody);
      req.end();
    });
  } catch (err) {
    return { error: err.message };
  }
});

// Context file chooser for AI chat
ipcMain.handle('choose-context-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Add Context Files',
    defaultPath: app.getPath('documents'),
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md', 'json', 'js', 'py', 'html', 'css'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths.map(fp => ({
      path: fp,
      name: path.basename(fp)
    }));
  }
  return [];
});

ipcMain.handle('read-file-for-context', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return { content };
    }
    return { error: 'File not found' };
  } catch (err) {
    return { error: err.message };
  }
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
