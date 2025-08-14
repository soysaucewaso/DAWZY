import { app, BrowserWindow, desktopCapturer, screen, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { windowManager } from 'node-window-manager';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { v1p1beta1 as speech } from '@google-cloud/speech';
import fs from 'node:fs';
import os from 'node:os';
import OpenAI from 'openai';
import player from 'play-sound';
import { startRecording, stopRecording, transcribeFromMic, cleanupSpeechRecognition } from './speech_to_text.js';
import { humToMIDI } from './hum_to_midi.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function queryAI(_event, user_msg) {
  console.log('ipc called');
  const venvPython = process.platform === 'win32'
    ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
    : path.join(__dirname, 'venv', 'bin', 'python');
  const pythonPath = existsSync(venvPython) ? venvPython : 'python3';
  console.log(`Sending query: ${user_msg} to AI assistant`);
  return new Promise((resolve, reject) => {
    execFile(pythonPath, ['chat.py', user_msg], (error, stdout, stderr) => {
      if (error) {
        reject(`❌ Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

ipcMain.handle('takeScreenshot', async (_event, user_msg) => queryAI(_event, user_msg));

let chatbotWindow = null;
let mainWindow = null; // Add this line to track the main window
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
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      sandbox: true
    },
    show: false, // Start hidden, show when ready
  });
  chatbotWindow.loadFile(path.join(__dirname, 'index.html'));
  chatbotWindow.once('ready-to-show', () => chatbotWindow.show());
}

function updateChatbotWindow() {
  const dawWindow = findDAWWindow();
  const CHATBOT_WIDTH = 600;

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
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          sandbox: true,
          allowRunningInsecureContent: false
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

app.whenReady().then(() => {
  // Set up IPC handlers for audio recording
  ipcMain.handle('start-recording', () => {
    startRecording();
  });

  ipcMain.handle('stop-recording', () => {
      stopRecording();
    }
  );

  ipcMain.handle('transcribe-from-mic', async () => {
    return await transcribeFromMic();
  });

  ipcMain.handle('hum-to-midi', async () => {
    console.log('hum2midi')
    return await humToMIDI();
  });


  // Initialize and show the main window
  updateChatbotWindow();
  
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      updateChatbotWindow();
    }
  });
});


app.on('window-all-closed', () => {
  cleanupSpeechRecognition();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanupSpeechRecognition();
});

