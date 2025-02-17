import { useState } from "react";

const Editor = () => {
  const [content, setContent] = useState("");

  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="Start typing..."
      className="w-full h-screen p-4 border rounded-lg font-mono"
    />
  );
};

export default Editor;