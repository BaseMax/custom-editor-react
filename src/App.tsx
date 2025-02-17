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
  const [onlineUsers, setOnlineUsers] = useState(0);

  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const isSyncingRef = useRef(false);

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

    socket.on("onlineUsers", (count) => {
      setOnlineUsers(count);
    });

    if (!storedUsername) {
      // Ensure input is focused on initial render for new users
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    return () => {
      socket.off("connect");
      socket.off("updateMarkdown");
      socket.off("onlineUsers");
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      // Focus on the markdown editor after connecting
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

  // Sync scrolling: when the editor is scrolled, update the preview.
  const handleEditorScroll = () => {
    if (isSyncingRef.current) return;
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    isSyncingRef.current = true;
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  };

  // Sync scrolling: when the preview is scrolled, update the editor.
  const handlePreviewScroll = () => {
    if (isSyncingRef.current) return;
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    isSyncingRef.current = true;
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  };

  if (loading) {
    return (
      <div style={styles.containerLoading}>
        Connecting to server...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={styles.containerUsername}>
        <h1 style={styles.usernameHeader}>Please enter your name</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.usernameInput}
          placeholder="Your name"
          ref={inputRef}
          autoFocus
        />
        <button onClick={handleUsernameSubmit} style={styles.joinButton}>
          Join
        </button>
        {error && <p style={styles.errorMessage}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <textarea
        ref={textareaRef}
        value={markdown}
        onChange={handleChange}
        onScroll={handleEditorScroll}
        placeholder="Type your markdown here..."
        style={styles.textarea}
      />
      <div
        className="markdown-body"
        style={styles.preview}
        ref={previewRef}
        onScroll={handlePreviewScroll}
      >
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
      <div style={styles.onlineUsers}>
        Online users: {onlineUsers}
      </div>
    </div>
  );
};

const styles = {
  containerLoading: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "black",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },
  containerUsername: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "black",
    color: "white",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },
  usernameHeader: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  usernameInput: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid white",
    textAlign: "center",
    fontSize: "1.2rem",
    color: "white",
    padding: "5px",
    outline: "none",
  },
  joinButton: {
    marginTop: "1rem",
    padding: "10px 20px",
    border: "1px solid white",
    background: "transparent",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "0.3s",
  },
  errorMessage: {
    color: "red",
    marginTop: "1rem",
  },
  appContainer: {
    display: "flex",
    height: "100vh",
  },
  textarea: {
    width: "50%",
    height: "100%",
    padding: "15px",
    fontSize: "1rem",
    borderRight: "1px solid #888",
    resize: "none",
    outline: "none",
    backgroundColor: "#1a1a1a",
    color: "white",
  },
  preview: {
    width: "50%",
    height: "100%",
    padding: "15px",
    backgroundColor: "#f0f0f0",
    overflowY: "auto",
    color: "black",
  },
  onlineUsers: {
    position: "fixed",
    bottom: "10px",
    right: "20px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: "5px 10px",
    color: "white",
    borderRadius: "4px",
    fontSize: "14px",
  },
};

export default App;
