import { useState } from "react";
import ChatWindow from "./ChatWindow";
import "./styles.css";
import "./FloatingChatbot.css";

// utils
import { detectIntent } from "./utils/intentDetector";
import { getMockResponse } from "./utils/responses";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI finance assistant 😊", sender: "bot" },
  ]);

  const sendMessage = (text) => {
    const intent = detectIntent(text);
    const botReply = getMockResponse(intent);

    setMessages((prev) => [
      ...prev,
      { text, sender: "user" },
      { text: botReply, sender: "bot" },
    ]);
  };

  return (
    <ChatWindow
      messages={messages}
      onSend={sendMessage}
    />
  );
}
