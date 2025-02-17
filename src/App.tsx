import io from "socket.io-client";
import ReactMarkdown from "react-markdown";
import React, { useState, useEffect } from "react";

import { SERVER_SOCKET } from './config';

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
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-2xl">
        Connecting to server...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h1 className="text-3xl mb-4">Please enter your name</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-transparent border-b-2 border-white text-center text-lg focus:outline-none"
          placeholder="Your name"
        />
        <button
          onClick={handleUsernameSubmit}
          className="mt-4 px-6 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
        >
          Join
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <textarea
        value={markdown}
        onChange={handleChange}
        placeholder="Type your markdown here..."
        className="w-1/2 h-full p-4 text-lg border-r border-gray-300 resize-none focus:outline-none bg-gray-900 text-white"
      />

      <div className="w-1/2 h-full p-4 bg-gray-100 overflow-auto">
        <ReactMarkdown className="prose">{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default App;
