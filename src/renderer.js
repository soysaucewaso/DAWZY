window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('send-btn').onclick = function() {
    const msg = document.getElementById('chat-input').value;
    fetch('http://localhost:5005/message', {
      method: 'POST',
      body: msg
    });
  };
  const userMsg = document.getElementById('chat-input')
  const assistantResponse = document.getElementById('assistant_response')
  document.getElementById('query-btn').onclick = async () => {
    console.log(userMsg)
    try {
      const response = await window.electronAPI.takeScreenshot(userMsg.value);
      assistantResponse.textContent = response;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      alert('Failed to capture screenshot. See console for details.');
    }
  }


});

