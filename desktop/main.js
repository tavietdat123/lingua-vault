const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 414,
    height: 896,
    minWidth: 380,
    minHeight: 700,
    maxWidth: 480,
    title: '📱 LinguaVault - Mobile App (iPhone 15 Pro)',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      touchEmulation: true
    }
  });

  // Emulate mobile user agent for exact mobile experience
  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  );

  // Load the compiled Mobile App
  mainWindow.loadURL('http://localhost:5001/mobile/');

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Mobile Electron Console] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Mobile Electron Load Failed] ${errorDescription} (${errorCode}) for ${validatedURL}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
