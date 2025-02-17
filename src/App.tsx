import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import ReactMarkdown from "react-markdown";

const socket = io("http://localhost:3001");

const App = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    socket.on("updateMarkdown", (content) => {
      setMarkdown(content);
    });

    return () => {
      socket.off("updateMarkdown");
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setMarkdown(content);
    socket.emit("markdownChange", content);
  };

  return (
    <div className="flex h-screen">
      <textarea
        value={markdown}
        onChange={handleChange}
        placeholder="Type your markdown here..."
        className="w-1/2 h-full p-4 text-lg border-r border-gray-300 resize-none"
      />

      <div className="w-1/2 h-full p-4 bg-gray-100 overflow-auto">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default App;
