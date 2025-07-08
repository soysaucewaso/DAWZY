// Poll the Flask server every second for the latest message
let lastMessage = null;
let latestMessage = '';
function pollMessage() {
  fetch('http://localhost:5005/message')
    .then(response => response.text())
    .then(text => {
      let msgDiv = document.getElementById('external-message');
      if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'external-message';
        msgDiv.style.marginBottom = '10px';
        msgDiv.style.fontWeight = 'bold';
        document.body.insertBefore(msgDiv, document.body.firstChild);
      }
      if (text !== lastMessage) {
        msgDiv.textContent = text || 'No message yet.';
        lastMessage = text;
        latestMessage = text;
        // Try to type the message into ProseMirror when a new message arrives
        typeMessageIntoProseMirror(latestMessage);
      }
    })
    .catch(() => {
      let msgDiv = document.getElementById('external-message');
      if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'external-message';
        msgDiv.style.marginBottom = '10px';
        msgDiv.style.fontWeight = 'bold';
        document.body.insertBefore(msgDiv, document.body.firstChild);
      }
      msgDiv.textContent = 'Could not connect to message server.';
    });
}
pollMessage();
setInterval(pollMessage, 1000); // Poll every 1 second

function typeMessageIntoProseMirror(messageToType, maxRetries = 10, delay = 300) {
  let attempts = 0;
  function tryType() {
    // Try several selectors for robustness
    let pm = document.querySelector('#prompt-textarea');
    if (!pm) pm = document.querySelector('.ProseMirror[contenteditable="true"]');
    if (!pm) pm = document.querySelector('div[contenteditable="true"].ProseMirror');

    if (pm) {
      // Get the center of the element
      const rect = pm.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Dispatch a real mouse click event at the center
      pm.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window
      }));
      pm.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window
      }));
      pm.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window
      }));

      pm.focus();
      pm.textContent = messageToType || '';
      pm.dispatchEvent(new Event('input', { bubbles: true }));
      // Simulate pressing Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13
      });
      const enterEventUp = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13
      });
      pm.dispatchEvent(enterEvent);
      pm.dispatchEvent(enterEventUp);
    } else if (attempts < maxRetries) {
      attempts++;
      setTimeout(tryType, delay);
    }
  }
  tryType();
}

// Query the active tab and display its URL
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  const urlDiv = document.getElementById('url');
  if (tabs.length > 0) {
    urlDiv.textContent = tabs[0].url;

    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      args: [latestMessage],
      func: (messageToType) => {
        let status = {
          htmlRetrieved: false,
          typed: false,
          hasProseMirror: false,
          enterSent: false
        };
        try {
          const html = document.documentElement.outerHTML;
          status.htmlRetrieved = !!html;

          // Find the ProseMirror contenteditable div
          const pm = document.querySelector('div.ProseMirror#prompt-textarea[contenteditable="true"]');
          if (pm) {
            status.hasProseMirror = true;
            pm.textContent = messageToType || '';
            // Dispatch input event
            pm.dispatchEvent(new Event('input', { bubbles: true }));
            status.typed = true;

            // Simulate pressing Enter key
            const enterEvent = new KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              key: 'Enter',
              code: 'Enter',
              which: 13,
              keyCode: 13
            });
            const enterEventUp = new KeyboardEvent('keyup', {
              bubbles: true,
              cancelable: true,
              key: 'Enter',
              code: 'Enter',
              which: 13,
              keyCode: 13
            });
            pm.dispatchEvent(enterEvent);
            pm.dispatchEvent(enterEventUp);
            status.enterSent = true;
          }
        } catch (e) {
          // If any error occurs, status fields remain false
        }
        return status;
      },
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const status = results[0].result;
        let msg = `URL: ${tabs[0].url}\n`;
        msg += status.htmlRetrieved ? "HTML retrieved successfully.\n" : "Failed to retrieve HTML.\n";
        if (status.hasProseMirror) {
          msg += "ProseMirror input found. ";
          msg += status.typed ? "Typed successfully! " : "Failed to type in the ProseMirror input. ";
          msg += status.enterSent ? "Enter key sent!" : "Failed to send Enter key.";
        } else {
          msg += "No ProseMirror input found.";
        }
        urlDiv.textContent = msg;
      }
    });
  } else {
    urlDiv.textContent = 'No active tab found.';
  }
}); 