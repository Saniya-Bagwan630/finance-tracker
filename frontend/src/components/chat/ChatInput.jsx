import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();   // prevents form submit / newline
      handleSend();
    }
  };

  return (
    <div className="chat-input">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}   /* 👈 ENTER SUPPORT */
        placeholder="Type your expense or question..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
