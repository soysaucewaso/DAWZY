window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('send-btn').onclick = function() {
    const msg = document.getElementById('chat-input').value;
    fetch('http://localhost:5005/message', {
      method: 'POST',
      body: msg
    });
  };
  const screenshotImage = document.getElementById('screenshot')
  document.getElementById('screenshot-btn').onclick = async () => {
    try {
      const imageUrl = await window.electronAPI.takeScreenshot();
      screenshotImage.src = imageUrl;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      alert('Failed to capture screenshot. See console for details.');
    }
  }


});

