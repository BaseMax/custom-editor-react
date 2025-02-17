import io from "socket.io-client";
import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";

import './github-markdown.css';
import { SERVER_SOCKET } from "./config";

const socket = io(SERVER_SOCKET);

const App = () => {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // On initial mount, try to load stored username and ensure the input gets focus if needed.
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      setIsConnected(true);
      socket.emit("joinRoom", storedUsername);
    }
    
    // Ensure loading state is updated when socket connects.
    socket.on("connect", () => {
      setLoading(false);
    });

    socket.on("updateMarkdown", (content) => {
      setMarkdown(content);
    });

    // Use a small timeout to ensure the input is rendered before focusing.
    if (!storedUsername) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    return () => {
      socket.off("connect");
      socket.off("updateMarkdown");
    };
  }, []);

  // When connection is established, focus on the markdown editor.
  useEffect(() => {
    if (isConnected) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isConnected]);

  const handleUsernameSubmit = () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername === "") {
      setError("Username cannot be empty!");
      return;
    }

    localStorage.setItem("username", trimmedUsername);
    socket.emit("joinRoom", trimmedUsername);
    setIsConnected(true);
    setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUsernameSubmit();
    }
  };

  const handleChange = (e) => {
    setMarkdown(e.target.value);
    socket.emit("markdownChange", e.target.value);
  };

  if (loading) {
    return <div className="container loading">Connecting to server...</div>;
  }

  if (!isConnected) {
    return (
      <div className="container username-container">
        <h1>Please enter your name</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          className="username-input"
          placeholder="Your name"
          ref={inputRef}
          autoFocus
        />
        <button onClick={handleUsernameSubmit} className="join-button">
          Join
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  return (
    <div className="app-container">
      <textarea
        ref={textareaRef}
        value={markdown}
        onChange={handleChange}
        placeholder="Type your markdown here..."
        className="textarea"
      />
      <div className="preview markdown-body">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default App;
