import io from "socket.io-client";
import ReactMarkdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { SERVER_SOCKET } from "./config";
import "./styles.css"; // Import the CSS file

const socket = io(SERVER_SOCKET);

const App = () => {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      setIsConnected(true);
      socket.emit("joinRoom", storedUsername);
    }

    socket.on("connect", () => {
      setLoading(false);
    });

    socket.on("updateMarkdown", (content) => {
      setMarkdown(content);
    });

    return () => {
      socket.off("connect");
      socket.off("updateMarkdown");
    };
  }, []);

  const handleUsernameSubmit = () => {
    if (username.trim() !== "") {
      localStorage.setItem("username", username);
      socket.emit("joinRoom", username);
      setIsConnected(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setMarkdown(content);
    socket.emit("markdownChange", content);
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
          className="username-input"
          placeholder="Your name"
        />
        <button onClick={handleUsernameSubmit} className="join-button">
          Join
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <textarea
        value={markdown}
        onChange={handleChange}
        placeholder="Type your markdown here..."
        className="textarea"
      />

      <div className="preview">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default App;
