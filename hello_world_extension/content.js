let lastCommand = null;

function fetchAndType() {
  fetch('http://localhost:5006/command')
    .then(response => response.text())
    .then(command => {
      command = command.trim();
      if (command && command !== lastCommand) {
        lastCommand = command;
        typeNumberWithClick(command);
      }
    })
    .catch(() => {});
}

function typeNumberWithClick(numberToType, maxRetries = 10, delay = 300) {
  let attempts = 0;
  function attempt() {
    let pm = document.querySelector('#prompt-textarea');
    if (!pm) pm = document.querySelector('.ProseMirror[contenteditable="true"]');
    if (!pm) pm = document.querySelector('div[contenteditable="true"].ProseMirror');
    if (pm) {
      // Click at the center
      const rect = pm.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      pm.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true, cancelable: true, clientX: x, clientY: y, view: window
      }));
      pm.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true, cancelable: true, clientX: x, clientY: y, view: window
      }));
      pm.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, clientX: x, clientY: y, view: window
      }));
      pm.focus();
      pm.textContent = String(numberToType);
      pm.dispatchEvent(new Event('input', { bubbles: true }));
      // Simulate pressing Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', which: 13, keyCode: 13
      });
      const enterEventUp = new KeyboardEvent('keyup', {
        bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', which: 13, keyCode: 13
      });
      pm.dispatchEvent(enterEvent);
      pm.dispatchEvent(enterEventUp);
    } else if (attempts < maxRetries) {
      attempts++;
      setTimeout(attempt, delay);
    }
  }
  attempt();
}

setInterval(fetchAndType, 1000); 