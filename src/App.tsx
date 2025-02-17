import io from "socket.io-client";
import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";
import { SERVER_SOCKET } from "./config";

import "./github-markdown.css";

const socket = io(SERVER_SOCKET, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

const App = () => {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const scrollPositionsRef = useRef({ editorScroll: 0, previewScroll: 0 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

    socket.on("disconnect", () => {
      if (textareaRef.current) {
        scrollPositionsRef.current.editorScroll = textareaRef.current.scrollTop;
      }
      if (previewRef.current) {
        scrollPositionsRef.current.previewScroll = previewRef.current.scrollTop;
      }
      setLoading(true);
    });

    socket.on("reconnect", () => {
      setLoading(false);
    });

    socket.on("updateMarkdown", (content) => {
      setMarkdown(content);
    });

    socket.on("onlineUsers", (count) => {
      setOnlineUsers(count);
    });

    if (!storedUsername) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("reconnect");
      socket.off("updateMarkdown");
      socket.off("onlineUsers");
    };
  }, []);

  useEffect(() => {
    if (!loading && isConnected) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = scrollPositionsRef.current.editorScroll;
        }
        if (previewRef.current) {
          previewRef.current.scrollTop = scrollPositionsRef.current.previewScroll;
        }
      }, 500);
    }
  }, [loading, isConnected, markdown]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUsernameSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
    socket.emit("markdownChange", e.target.value);
  };

  const handleEditorScroll = () => {
    if (isSyncingRef.current) return;
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    isSyncingRef.current = true;
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    scrollPositionsRef.current.editorScroll = editor.scrollTop;
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  };

  const handlePreviewScroll = () => {
    if (isSyncingRef.current) return;
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    isSyncingRef.current = true;
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    scrollPositionsRef.current.previewScroll = preview.scrollTop;
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  };

  const appContainerStyle: React.CSSProperties = {
    display: "flex",
    height: "100vh",
    flexDirection: isMobile ? "column" : "row",
  };

  const textareaStyle: React.CSSProperties = {
    width: isMobile ? "100%" : "50%",
    height: isMobile ? "50%" : "100%",
    padding: "15px",
    fontSize: "1rem",
    borderRight: isMobile ? "none" : "1px solid #888",
    borderBottom: isMobile ? "1px solid #888" : "none",
    resize: "none",
    outline: "none",
    backgroundColor: "#1a1a1a",
    color: "white",
    boxSizing: "border-box",
  };

  const previewStyle: React.CSSProperties = {
    width: isMobile ? "100%" : "50%",
    height: isMobile ? "50%" : "100%",
    padding: "15px",
    backgroundColor: "#f0f0f0",
    overflowY: "auto",
    color: "black",
    boxSizing: "border-box",
  };

  const containerLoadingStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "black",
    color: "white",
    fontFamily: "Arial, sans-serif",
  };

  const containerUsernameStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "black",
    color: "white",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  };

  const usernameHeaderStyle: React.CSSProperties = {
    fontSize: "2rem",
    marginBottom: "1rem",
  };

  const usernameInputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid white",
    textAlign: "center",
    fontSize: "1.2rem",
    color: "white",
    padding: "5px",
    outline: "none",
  };

  const joinButtonStyle: React.CSSProperties = {
    marginTop: "1rem",
    padding: "10px 20px",
    border: "1px solid white",
    background: "transparent",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "0.3s",
  };

  const errorMessageStyle: React.CSSProperties = {
    color: "red",
    marginTop: "1rem",
  };

  const onlineUsersStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "10px",
    right: "20px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: "5px 10px",
    color: "white",
    borderRadius: "4px",
    fontSize: "14px",
  };

  if (loading) {
    return (
      <div style={containerLoadingStyle}>
        Connecting to server...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={containerUsernameStyle}>
        <h1 style={usernameHeaderStyle}>Please enter your name</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          style={usernameInputStyle}
          placeholder="Your name"
          ref={inputRef}
          autoFocus
        />
        <button onClick={handleUsernameSubmit} style={joinButtonStyle}>
          Join
        </button>
        {error && <p style={errorMessageStyle}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={appContainerStyle}>
      <textarea
        ref={textareaRef}
        value={markdown}
        onChange={handleChange}
        onScroll={handleEditorScroll}
        placeholder="Type your markdown here..."
        style={textareaStyle}
      />
      <div
        className="markdown-body"
        style={previewStyle}
        ref={previewRef}
        onScroll={handlePreviewScroll}
      >
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
      <div style={onlineUsersStyle}>
        Online users: {onlineUsers}
      </div>
    </div>
  );
};

export default App;
