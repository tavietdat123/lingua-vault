const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mobileWindow;

function createMobileSimulator() {
  mobileWindow = new BrowserWindow({
    width: 414,
    height: 896,
    minWidth: 380,
    minHeight: 700,
    maxWidth: 480,
    title: '📱 LinguaVault - iPhone 15 Pro Mobile Simulator',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Emulate mobile touch events
      touchEmulation: true
    }
  });

  // Emulate mobile user agent for exact mobile viewport
  mobileWindow.webContents.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  );

  // Load the React Native Expo Mobile App
  mobileWindow.loadURL('http://localhost:8081');

  mobileWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mobileWindow.on('closed', () => {
    mobileWindow = null;
  });
}

app.whenReady().then(() => {
  createMobileSimulator();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMobileSimulator();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
