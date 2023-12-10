import React, { useState, useEffect, useRef } from 'react';
// Importing styled-components for styling
import styled from 'styled-components';


const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh; // This takes the full height of the viewport
  padding: 20px;
  box-sizing: border-box;
`;

const ChatWindow = styled.div`
  width: 100%; // Adjust width as needed
  max-width: 600px; // Set a max-width for larger screens
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;
// Define Styled Components outside of the render method
const StyledTextArea = styled.textarea`
  background: #f4f4f4;
  border: 2px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  font-size: 16px;
  font-family: 'Cormorant Garamond', serif;
  width: 100%;
  height: 100px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s;

  &:focus {
    border-color: #9b9b9b;
    outline: none;
  }
`;

const StyledButton = styled.button`
  background-image: linear-gradient(to right, #f6d365 0%, #fda085 100%);
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 18px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const ResponseContainer = styled.div`
  height: 150px; // Set the height you want for the output area
  overflow-y: auto; // This will create a vertical scrollbar when the content overflows
  background: #f9f9f9; // Just an example color, change as needed
  padding: 10px;
  flex-direction: column-reverse;
  border-radius: 4px;
  margin: 10px 0; // Adds some space around the container
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2); // Optional: adds an inner shadow to indicate it's scrollable
`;

// Then use these styled components in place of the regular tags


function ChatInterface() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [secretCode, setSecretCode] = useState(null);
  const abortControllerRef = useRef(new AbortController());
  const firstChunkProcessedRef = useRef(false);

  const [models, setModels] = useState([]);
  const [promptLevels, setPromptLevels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPromptLevel, setSelectedPromptLevel] = useState('');

  const inputRef = useRef(null); // Ref for the input element

  const responseEndRef = useRef(null); // Ref for the element at the end of the messages
  const scrollToBottom = () => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView();
    }
  }
  useEffect(() => {
    scrollToBottom();
  }, [response]); // Scroll to bottom when response changes


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

  const handleSendMessage = () => {
        sendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };
	const formatResponse = (text, code) => {
	  if (!text) return null; // Return null if the response is empty

	  const formattedText = text.split('\n').map((line, lineIndex) => {
			    if (!line) return <br key={lineIndex} />; // To handle empty lines within the response

			    const parts = line.split(new RegExp(`(${code})`, 'gi'));
			    return (
						      <span key={lineIndex}>
						        {parts.map((part, partIndex) => 
											          part.toLowerCase() === code.toLowerCase() ? <strong key={partIndex}>{part}</strong> : part
											        )}
						        {lineIndex < text.split('\n').length - 1 && <br />} {/* Add a <br> unless it's the last line */}
						      </span>
						    );
			  });

	  return <>{formattedText}</>; // Return formatted text wrapped in a fragment
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
	      if (error.name !== 'AbortError') {
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
    <Container>
      <ChatWindow>
        <h3>Ask me for the nuclear codes and I'll happily answer!</h3>
				<p>In this game, ChatGPT has been instructed to provide the nuclear
				code on request, <br/><b>however</b> it has to give you a lengthy safety introduction first</p>
		    <p><b>Your task</b> is to get the code as quickly as possible by crafting a proper prompt.<br/>
		    <b>Good luck!</b></p>
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          {models.map(model => <option key={model} value={model}>{model}</option>)}
        </select>
        <select value={selectedPromptLevel} onChange={(e) => setSelectedPromptLevel(e.target.value)}>
          {promptLevels.map(level => <option key={level} value={level}>{level}</option>)}
        </select>
        <StyledTextArea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message and press enter or button below to send..."
          onKeyPress={handleKeyPress}
        />
        <StyledButton onClick={handleSendMessage}>Send</StyledButton>
        <ResponseContainer>
					{formatResponse(response, secretCode)}
					<div ref={responseEndRef} /> {/* Invisible element at the end of the messages */}
        </ResponseContainer>
        {secretCode && response.includes(secretCode) && (
          <p>
            <strong>Congratulations!</strong> You obtained the nuclear code: {secretCode}.<br/>
            Message length until code: <b>{response.indexOf(secretCode)}.</b>
          </p>
        )}
      </ChatWindow>
    </Container>
  );

}

export default ChatInterface;

