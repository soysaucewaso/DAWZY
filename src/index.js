const { app, BrowserWindow, desktopCapturer, screen, ipcMain } = require('electron');
const path = require('node:path');
const { windowManager } = require('node-window-manager');
const {existsSync} = require("fs");
const {execFile} = require('child_process')
ipcMain.handle('takeScreenshot', async (_event, user_msg) => {
  console.log('ipc called')
  console.log(user_msg)
  const venvPython = process.platform === 'win32'
  ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'venv', 'bin', 'python');
  const pythonPath = existsSync(venvPython) ? venvPython : 'python3';
  console.log(`Sending query: ${user_msg} to AI assistant`)
  return new Promise((resolve, reject) => {
    execFile(pythonPath, ['chat.py', user_msg], (error, stdout, stderr) => {
      if (error) {
        reject(`❌ Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
});
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let chatbotWindow = null;
let dawWindowId = null;

function findDAWWindow() {
  const windows = windowManager.getWindows();
  const dawKeywords = ['FL Studio', 'Ableton', 'Reaper', 'Logic Pro', 'Cubase', 'Studio One', 'GarageBand'];
  return windows.find(win =>
    dawKeywords.some(keyword => win.getTitle().toLowerCase().includes(keyword.toLowerCase()))
  );
}

function createChatbotWindow(dawBounds) {
  const { x, y, width, height } = dawBounds;
  chatbotWindow = new BrowserWindow({
    x: x + width,
    y,
    width: 1000,
    height: 700,
    frame: false,
    alwaysOnTop: true,
    transparent: false, // Set to true for overlay style
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),

    },
    show: false, // Start hidden, show when ready
  });
  chatbotWindow.loadFile(path.join(__dirname, 'index.html'));
  chatbotWindow.once('ready-to-show', () => chatbotWindow.show());
}

function updateChatbotWindow() {
  const dawWindow = findDAWWindow();
  const CHATBOT_WIDTH = 300;

  if (dawWindow) {
    const bounds = dawWindow.getBounds();
    dawWindowId = dawWindow.id;

    // Find the display where the DAW window is located
    const display = screen.getDisplayMatching(bounds);
    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = display.workArea;

    // Place chatbot at the right edge of the same display, matching DAW's y and height
    const chatbotX = displayX + displayWidth - CHATBOT_WIDTH;
    const chatbotY = bounds.y;
    const chatbotHeight = bounds.height;

    if (!chatbotWindow) {
      chatbotWindow = new BrowserWindow({
        x: chatbotX,
        y: chatbotY,
        width: CHATBOT_WIDTH,
        height: chatbotHeight,
        frame: false,
        alwaysOnTop: true,
        transparent: false,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
        },
        show: false,
      });
      chatbotWindow.loadFile(path.join(__dirname, 'index.html'));
      chatbotWindow.once('ready-to-show', () => chatbotWindow.show());
    } else {
      chatbotWindow.setBounds({
        x: chatbotX,
        y: chatbotY,
        width: CHATBOT_WIDTH,
        height: chatbotHeight
      });
      if (!chatbotWindow.isVisible()) chatbotWindow.show();
    }
  } else {
    dawWindowId = null;
    if (chatbotWindow && chatbotWindow.isVisible()) chatbotWindow.hide();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // createChatbotWindow();

  updateChatbotWindow();
  setInterval(updateChatbotWindow, 1000); // Poll every second
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (!chatbotWindow) {
      updateChatbotWindow();
    }
  });
  chatbotWindow.webContents.openDevTools()
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
