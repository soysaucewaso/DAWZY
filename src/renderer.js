document.getElementById('send-btn').onclick = function() {
  const msg = document.getElementById('chat-input').value;
  fetch('http://localhost:5005/message', {
    method: 'POST',
    body: msg
  });
}; 