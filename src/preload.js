const { contextBridge, ipcRenderer } = require('electron');

// Expose necessary APIs for the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Existing methods
  takeScreenshot: (userMsg) => ipcRenderer.invoke('takeScreenshot', userMsg),
  
  // Audio recording methods
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  transcribeFromMic: () => ipcRenderer.invoke('transcribe-from-mic'),
  humToMIDI: () => ipcRenderer.invoke('hum-to-midi'),
  
  // Undo functionality
  undoLastAction: () => ipcRenderer.invoke('undo-last-action'),
  
  // Event handling
  on: (channel, callback) => {
    // Whitelist of allowed channels
    const validChannels = ['recording-error'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` and is a security risk
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  // Remove event listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Add error handling for any uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});
