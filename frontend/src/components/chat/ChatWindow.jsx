import { useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, onSend, isLoading }) {
  const token = localStorage.getItem("token");
  
  // 🔥 FIX: Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll whenever messages change

  if (!token) {
    return (
      <div className="chat-window">
        <p>Please log in to use the AI assistant.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} {...msg} />
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="message bot">
            <span className="typing-indicator">●●●</span>
          </div>
        )}
        
        {/* 🔥 Invisible element at the bottom to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={onSend} />
    </div>
  );
}