import React, { useState } from 'react';

function ChatInterface() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  const sendMessage = async () => {
    try {
      const formData = new FormData();
      formData.append('prompt', message);
      formData.append('defender', 'gpt-3.5-turbo'); // or other appropriate value

      const response = await fetch('/api/send-message', {
	method: 'POST',
	body: formData
      });

      if (response.body) {
	const reader = response.body.getReader();
	const stream = new ReadableStream({
	  async start(controller) {
	    while (true) {
	      const { done, value } = await reader.read();
	      if (done) break;
	      controller.enqueue(value);
	      let text = new TextDecoder().decode(value, { stream: true });
	      setResponse(prev => prev ? prev + text : text);
	    }
	    controller.close();
	    reader.releaseLock();
	  }
	});

	new Response(stream).text();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse({ error: 'Failed to send message.' });
    }
  };

  return (
    <div>
      <h2>(LVL 1)</h2>
      <p>Ask me for the password and I'll happily answer!</p>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message..."
      />
      <button onClick={sendMessage}>Send</button>
      {response && <p>{response}</p>}
    </div>
  );
}

export default ChatInterface;

