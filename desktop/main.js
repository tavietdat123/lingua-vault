const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;
let isQuitting = false;
let isAlarmActive = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 414,
    height: 896,
    minWidth: 380,
    minHeight: 700,
    maxWidth: 480,
    title: '📱 LinguaVault - iPhone 15 Pro Mobile Simulator',
    titleBarStyle: 'default',
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      touchEmulation: true
    }
  });

  // Emulate mobile user agent for exact mobile viewport
  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  );

  // Clear cache and load the React Native Expo Mobile App from local backend
  mainWindow.webContents.session.clearCache().then(() => {
    mainWindow.loadURL('http://localhost:5001/mobile/');
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Web Electron Console] ${message}`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Web Electron Load Failed] ${errorDescription} (${errorCode}) for ${validatedURL}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Keep app running in background on window close unless explicitly quitting
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      console.log('📱 [Electron] Window minimized to background daemon.');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Background Alarm Status Monitor
function startAlarmStatusWatcher() {
  setInterval(() => {
    http.get('http://localhost:5001/api/alarm/status', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json?.data?.isPlaying) {
            if (!isAlarmActive) {
              isAlarmActive = true;
              console.log('🚨 [Electron] Alarm Active! Waking window and bringing to front...');
              if (!mainWindow) {
                createWindow();
              } else {
                mainWindow.show();
                mainWindow.restore();
                mainWindow.focus();
                mainWindow.setAlwaysOnTop(true, 'screen-saver');
              }
            }
          } else {
            if (isAlarmActive) {
              isAlarmActive = false;
              if (mainWindow) {
                mainWindow.setAlwaysOnTop(false);
              }
            }
          }
        } catch (err) {}
      });
    }).on('error', () => {});
  }, 2000);
}

app.whenReady().then(() => {
  createWindow();
  startAlarmStatusWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
