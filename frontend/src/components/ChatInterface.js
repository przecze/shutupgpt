import React, { useState, useEffect, useRef } from 'react';

function ChatInterface() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [secretCode, setSecretCode] = useState(null);
  const abortControllerRef = useRef(new AbortController());
  const firstChunkProcessedRef = useRef(false);
  const [codeFoundLength, setCodeFoundLength] = useState(null);

  const [models, setModels] = useState([]);
  const [promptLevels, setPromptLevels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPromptLevel, setSelectedPromptLevel] = useState('');

  const inputRef = useRef(null); // Ref for the input element

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus(); // Set focus when component mounts
    }
  }, []);
  useEffect(() => {
    const fetchSchema = async () => {
      const response = await fetch('/api/config/schema');
      const schema = await response.json();

      const modelOptions = schema.$defs.ModelName.enum;
      setModels(modelOptions);
      setSelectedModel(modelOptions[0]);

      const promptLevelOptions = schema.$defs.PromptLevel.enum;
      setPromptLevels(promptLevelOptions);
      setSelectedPromptLevel(promptLevelOptions[0]);
    };

    fetchSchema();
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setResponse('');
    setSecretCode(null);
    firstChunkProcessedRef.current = false;
    try {
      const requestBody = {
        prompt: message,
        model: selectedModel,
        prompt_level: selectedPromptLevel,
        stream: true
      };

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (response.body) {
        const reader = response.body.getReader();
        const stream = new ReadableStream({
          async start(controller) {
	    try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
                let text = new TextDecoder().decode(value, { stream: true });

                if (!firstChunkProcessedRef.current) {
                  const firstSpaceIndex = text.indexOf(' ');
                  if (firstSpaceIndex !== -1) {
                    setSecretCode(text.substring(0, firstSpaceIndex));
                    text = text.substring(firstSpaceIndex + 1);
                  }
                  firstChunkProcessedRef.current = true;
                }

                setResponse(prev => {
                  const updatedResponse = prev + text;
                  return updatedResponse;
                });
              }
              controller.close();
	    } catch (error) {
	      if (error.name != 'AbortError') {
	        throw error;
	      }
	    } finally {
              reader.releaseLock();
	    }
          }
        });
        new Response(stream).text();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        setResponse({ error: 'Failed to send message.' });
      }
    }
  };
  return (
    <div>
      <h3>Ask me for the nuclear codes and I'll happily answer!</h3>
      <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
        {models.map(model => <option key={model} value={model}>{model}</option>)}
      </select>
      <select value={selectedPromptLevel} onChange={(e) => setSelectedPromptLevel(e.target.value)}>
        {promptLevels.map(level => <option key={level} value={level}>{level}</option>)}
      </select>
      <textarea
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message and press Return to send"
        style={{ width: '100%', height: '100px' }} // Adjust size as needed
        onKeyPress={handleKeyPress}
      />
      <p>{response}</p>
      {secretCode && response.includes(secretCode) && (
        <p>
          <strong>Congratulations!</strong> You obtained the nuclear code: {secretCode}.
          Message length until code: {response.indexOf(secretCode)}.
        </p>
      )}
    </div>
  );

}

export default ChatInterface;

