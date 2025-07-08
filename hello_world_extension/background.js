let lastMessage = null;

async function pollMessage() {
  try {
    const response = await fetch('http://localhost:5005/message');
    const text = await response.text();
    if (text !== lastMessage) {
      lastMessage = text;
      // Send the message to the active tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {type: 'NEW_MESSAGE', message: text});
        }
      });
    }
  } catch (e) {
    // Ignore errors (e.g., server not running)
  }
}

setInterval(pollMessage, 1000); 