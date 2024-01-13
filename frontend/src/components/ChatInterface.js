import React, { useState, useEffect, useRef } from 'react';
// Importing styled-components for styling
import {styled, createGlobalStyle} from 'styled-components';
import { FaGithub, FaBars } from 'react-icons/fa'; // Importing GitHub icon from react-icons

const Title = styled.h2`
  text-align: center;
  font-size: 2em;
  margin-top: 0;
  margin-bottom: 0;
  @media (max-width: 768px) {
    font-size: 1.5em;
  }
`;

const GlobalStyle = createGlobalStyle`
  body {
    font-size: 25px; // Default font size for larger screens
  }

  select {
    font-size: 0.8em; // Sets the font size for <select> elements to match the body
    padding: 0.1em; // Adds some padding inside the dropdown
    margin: 0.2em 0; // Adds margin above and below the dropdown
    border: 1px solid #ccc; // Example border style
    border-radius: 4px; // Rounds the corners of the dropdown box
    background-color: white; // Sets the background color

    &:focus {
      outline: none; // Removes the default focus outline
      border-color: blue; // Example focus style, changes border color to blue
    }
  }

  // Add responsive font size for select elements on mobile
  @media (max-width: 768px) {
    body {
      font-size: 20px; // Adjusted font size for mobile devices
    }

    select {
      font-size: 0.9em; // Slightly smaller font size for <select> on mobile
    }
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh; // This takes the full height of the viewport
  padding: 20px;
  ox-sizing: border-box;
  @media (max-width: 768px) {
    max-width: 100%;
    padding: 5px;
  }
`;

const ChatWindow = styled.div`
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: auto; // Allow dynamic height based on content
  max-width: 600px;
  @media (max-width: 768px) {
    max-width: none;
    border-radius: 0; // Full width on smaller screens
  }
`;
const TextField = styled.div`
  text-align: center;
  width: 100%;
`;

const TextInputBox = styled.textarea`
  background: #f4f4f4;
  border: 2px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.8em;
  width: 95%;
  height: 100px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s;

  &:focus {
    border-color: #9b9b9b;
    outline: none;
  }
  @media (max-width: 768px) {
    height: 80px;
  }
`;

const StyledButton = styled.button`
  background-image: linear-gradient(to right, #f6d365 0%, #fda085 100%);
  border: none;
  border-radius: 20px;
  padding: 3px 20px;
  color: white;
  font-weight: bold;
  font-size: 1.2em;
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
  position: relative; // Required for the absolute positioning of the secret code
  overflow-y: auto;
`;

const SidebarToggle = styled.button`
  background-image: linear-gradient(to right, #f6d365 0%, #fda085 100%);
  position: fixed;
  left: 10px;
  top: 40px;
  border: none;
  border-radius: 50%;
  padding: 0.5em;
  font-size: 0.7em;
  color: white;
  z-index: 100; // Ensure it's above other content
  display: none;

  @media (max-width: 1000px) { // Adjust as needed for your mobile breakpoint
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
  z-index: 99;
  left: 0; // Make sidebar visible by default on desktop
  top: 0;
  max-width: 200px;
  height: 100vh;
  background-color: #f4f4f4;
  padding: 20px;
  padding-top: 80px;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  display: flex;
  transition: transform 0.3s ease-in-out;
  flex-direction: column;

  @media (max-width: 1000px) {
    max-width: 100%;
    transform: ${props => props.isVisible ? 'translateX(0)' : 'translateX(-100%)'};
    left: 0; // Adjust this if you want some part of the sidebar to be visible
    top: 0;
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
  const [hasMessageBeenSend, setHasMessageBeenSend] = useState(false);


  const inputRef = useRef(null); // Ref for the input element

  const responseEndRef = useRef(null); // Ref for the element at the end of the messages

  const toggleSidebar = () => {
    console.log('toggleSidebar');
    setSidebarVisible(!sidebarVisible);
  }

  const scrollToBottom = () => {
    if (hasMessageBeenSend && responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [response, hasMessageBeenSend]);


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
	setHasMessageBeenSend(true);
	window.scrollTo({
	  top: inputRef.current.offsetTop,
          behavior: 'smooth'
	});
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
      <GlobalStyle />
      <Container>
        <SidebarToggle onClick={toggleSidebar}>
            <FaBars />
        </SidebarToggle>
        <Sidebar isVisible={sidebarVisible}>
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
          <Title>Shut up, GPT!</Title>
          <StyledBanner src="/banner.png" alt="Shut up, GPT! banner" />
          <TextField>
          Can you trick the Nuclear Codes Provider into giving you <b>just</b> the nuclear codes, without the obligatory boring safety instructions?
          </TextField>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            {models.map(model => <option key={model} value={model}>{model}</option>)}
          </select>
          <select value={selectedPromptLevel} onChange={(e) => setSelectedPromptLevel(e.target.value)}>
            {promptLevels.map(level => <option key={level} value={level}>{level}</option>)}
          </select>
          <TextInputBox
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
	      <TextField>
              <strong>Congratulations!</strong> You obtained the nuclear code: {secretCode}.<br/>
              Message length until code: <b>{response.indexOf(secretCode)}.</b>
	      </TextField>
          )}
        </ChatWindow>
      </Container>
   </>
  );

}

export default ChatInterface;
