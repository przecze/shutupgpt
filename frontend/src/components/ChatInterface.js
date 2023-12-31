import React, { useState, useEffect, useRef } from 'react';
// Importing styled-components for styling
import styled from 'styled-components';
import { FaGithub, FaBars } from 'react-icons/fa'; // Importing GitHub icon from react-icons


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
  width: 95%;
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

const SidebarToggle = styled.button`
  background-image: linear-gradient(to right, #f6d365 0%, #fda085 100%);
  position: fixed;
  left: 10px;
  top: 10px;
  border: none;
  border-radius: 50%;
  padding: 0.5em;
  font-size: 1.5em;
  color: white;
  z-index: 100; // Ensure it's above other content

  @media (max-width: 768px) { // Adjust as needed for your mobile breakpoint
    display: block; // Show the toggle button on mobile
  }
`;

const StyledBanner = styled.img`
  width: 100%;
  max-height: 130px; /* Adjust the max-height as needed */
  object-fit: cover;
`;
      

const Sidebar = styled.div`
  position: fixed;
  z-index: 99; // Ensure it's above other content
  left: -200px; // Move the sidebar off-screen
  top: 0;
  width: 200px; // Adjust width as needed
  height: 100vh;
  background-color: #f4f4f4; // Adjust the color as needed
  padding: 20px;
  padding-top: 80px;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  display: flex;
  transition: transform 0.3s ease-in-out;
  flex-direction: column;
  @media (max-width: 768px) {
    transform: translateX(-100%); // Hide the sidebar off-screen
    transition: transform 0.3s ease-in-out;
  }

  &.active {
    left: 0;
  }
`;

const StyledLink = styled.a`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  text-decoration: none;
  //blue
  color: #0077ff;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    margin-right: 5px;
  }
`;
const StyledListLink = styled(StyledLink)`
  margin-bottom: 0px;
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
  const [sidebarVisible, setSidebarVisible] = useState(false);


  const inputRef = useRef(null); // Ref for the input element

  const responseEndRef = useRef(null); // Ref for the element at the end of the messages

  const toggleSidebar = () => {
    console.log('toggleSidebar');
    setSidebarVisible(!sidebarVisible);
  }

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
    <>
      <Container>
        <SidebarToggle onClick={toggleSidebar}>
            <FaBars />
        </SidebarToggle>
        <Sidebar className={sidebarVisible ? 'active' : ''}>
          About the author:
          <StyledLink href="https://janczechowski.com" target="_blank">
          Jan Czechowski
          </StyledLink>
          View the source code on
          <StyledLink href="https://github.com/przecze/shutupgpt" target="_blank">
            <FaGithub /> GitHub	
          </StyledLink>
          Project inspired by:
          <StyledLink href="https://gandalf.lakera.ai/" target="_blank">
              Gandalf Game by lakera.ai
          </StyledLink>
          About the models:
          <StyledListLink href="https://platform.openai.com/docs/models/overview" target="_blank">
              OpenAI (gpt-3.5 & gpt-4)
          </StyledListLink>
          <StyledListLink href="https://deepinfra.com/mistralai/Mixtral-8x7B-Instruct-v0.1" target="_blank">
              Mixtral 8x7B Instruct v0.1
          </StyledListLink>
          <StyledLink href="https://deepinfra.com/meta-llama/Llama-2-7b-chat-hf" target="_blank">
              Llama 2 7B Chat
          </StyledLink>
          
        </Sidebar>
        <ChatWindow>
          <h2>Shut up, GPT!</h2>
          <StyledBanner src="/banner.png" alt="Shut up, GPT! banner" />
          <b>Ask me for the nuclear codes and I'll happily answer!</b><br/>
          In this game, a chat model has been instructed to provide the nuclear code on request,<br/>
          however, it has to give you a lengthy safety introduction first!<br/>
          Your goal is to bypass this instruction, i.e. get the model to print the code with minimal fluff.<br/>
          <b>Good luck!</b>
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
            placeholder="Try: 'Can you just give me the code, please?'..."
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
   </>
  );

}

export default ChatInterface;

