// Chat functionality with persistent message history
let chatHistory = [];
const CHAT_HISTORY_KEY = 'dawzy_chat_history';
const CHAT_HISTORY_LIMIT = 100; // Maximum number of messages to store

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const queryBtn = document.getElementById('query-btn');
const micBtn = document.getElementById('mic-btn');
const whistleBtn = document.getElementById('whistle-btn');

// Speech Recognition State
let isRecording = false;
let finalTranscript = '';

// Show a system message in the chat
function showSystemMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message system';
  messageElement.textContent = message;
  document.getElementById('chat-messages').appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Toggle audio recording
async function toggleRecording(onStop, isWhistle = false) {
  if (isRecording) {
    stopRecording();
    onStop();
  } else {
    if (startRecording()) {
      // Update the active state for the correct button
      const activeButton = isWhistle ? whistleBtn : micBtn;
      activeButton.classList.add('active');
    }
  }
}

// Start audio recording
function startRecording() {
  try {
    const success = window.electronAPI.startRecording();
    isRecording = true;
    if (!success) {
      throw new Error('Failed to start recording');
    }

    return true;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}

// Stop audio recording
function stopRecording() {
  if (!isRecording) return false;
  
  try {
    window.electronAPI.stopRecording();
    isRecording = false;
    // Remove active state from both buttons to be safe
    micBtn.classList.remove('active');
    whistleBtn.classList.remove('active');
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
}

async function sendAudioMsg(){
    const transcribed = await window.electronAPI.transcribeFromMic();
    sendMessage(transcribed)
    return transcribed;
}


// Load chat history from localStorage
function loadChatHistory() {
  try {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      chatHistory = JSON.parse(savedHistory);
      // Filter out any typing indicators that might have been saved
      chatHistory = chatHistory.filter(msg => msg.sender !== 'assistant-typing');
      // Render all messages
      chatHistory.forEach(msg => addMessageToChat(msg.sender, msg.text, false));
      // Scroll to bottom
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

// Save chat history to localStorage
function saveChatHistory() {
  try {
    // Keep only the most recent messages up to the limit
    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
      chatHistory = chatHistory.slice(-CHAT_HISTORY_LIMIT);
    }
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

// Add or update a message in the chat UI
function addMessageToChat(sender, text, saveToHistory = true, messageId = null, isItalic = false) {
  let messageElement;
  
  if (messageId && messageId in chatMessages.children) {
    // Update existing message
    messageElement = chatMessages.children[messageId];
    messageElement.textContent = text;
    if (isItalic) {
      messageElement.style.fontStyle = 'italic';
    } else {
      messageElement.style.fontStyle = 'normal';
    }
  } else {
    // Create new message element
    messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.textContent = text;
    if (isItalic) {
      messageElement.style.fontStyle = 'italic';
    }
    
    // Add to chat
    chatMessages.appendChild(messageElement);
    
    // Add to history if needed
    if (saveToHistory && sender !== 'assistant-typing') {
      // Only save non-typing messages to history
      const messageData = { 
        sender, 
        text, 
        timestamp: new Date().toISOString() 
      };
      chatHistory.push(messageData);
      saveChatHistory();
    }
  }
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageElement;
}

// Send message to the assistant
async function sendMessage(message, whistle=false) {
  // Add user message to chat
  addMessageToChat('user', message);
  
  try {
    // Create typing indicator with animated dots
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message assistant-typing';
    typingIndicator.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Get the index of the typing indicator message
    const messageIndex = Array.from(chatMessages.children).indexOf(typingIndicator);
    
    try {
      let response;
      if (whistle) {
        await window.electronAPI.humToMIDI();
        response = 'Added MIDI track to REAPER';
      }else{
      // Send message to main process and get response
        response = await window.electronAPI.takeScreenshot(message, messageIndex);
      }
      
      // Update the typing indicator with the actual response
      addMessageToChat('assistant', response, true, messageIndex);
    } catch (error) {
      console.error('Error getting response:', error);
      // Update the typing indicator with error message
      addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.', true, messageIndex);
    }
  } catch (error) {
    console.error('Error showing typing indicator:', error);
    // Fallback in case typing indicator fails
    addMessageToChat('assistant', 'Sorry, something went wrong. Please try again.');
  }
}

// Reset chat history
function resetChat() {
  if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
    // Clear the chat UI
    chatMessages.innerHTML = '';
    
    // Clear the chat history array
    chatHistory = [];
    
    // Remove from localStorage
    localStorage.removeItem(CHAT_HISTORY_KEY);
    
    // Add a system message to indicate the chat was cleared
    const systemMessage = document.createElement('div');
    systemMessage.className = 'message system';
    systemMessage.textContent = 'Chat history has been cleared';
    chatMessages.appendChild(systemMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Handle undo action
async function handleUndo() {
  try {
    await window.electronAPI.undoLastAction();
  } catch (error) {
    console.error('Error undoing last action:', error);
    showSystemMessage('Failed to undo last action');
  }
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  // Load previous chat history
  loadChatHistory();
  
  // Add undo button event listener
  document.getElementById('undo-btn').addEventListener('click', handleUndo);
  
  // Set up event listeners
  queryBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = '';
    sendMessage(message);
  });
  micBtn.addEventListener('click', () => toggleRecording(sendAudioMsg, false));

  whistleBtn.addEventListener('click', () => {
    toggleRecording(humToMIDI, true);
  });
  
  // Listen for recording errors
  window.electronAPI.on('recording-error', (error) => {
    console.error('Recording error:', error);
    showSystemMessage(`Recording error: ${error}`);
    isRecording = false;
    micBtn.classList.remove('active');
  });
  
  // Clean up when the window is closed
  window.addEventListener('beforeunload', () => {
    if (isRecording) {
      stopRecording().catch(console.error);
    }
  });
  
  // Send message on Enter key (but allow Shift+Enter for new lines)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;
      chatInput.value = '';
      sendMessage(message);
    }
  });
  
  // Add reset chat functionality
  document.getElementById('reset-chat').addEventListener('click', resetChat);
  
  // Focus the input field when the app loads
  chatInput.focus();
});

// Handle window resize to ensure proper scrolling
window.addEventListener('resize', () => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

async function humToMIDI(){
    // Add user message when recording starts (italicized)
    sendMessage('Sent a hum', true)
    
}
    