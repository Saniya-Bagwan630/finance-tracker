import { useRef, useEffect } from "react";
import ChatWindow from "../../components/chat/ChatWindow";
import { useChat } from "../../components/chat/ChatContext";
import "./styles.css";

export default function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat();

  // No local state needed, ChatContext handles persistence and AI

  const handleSend = async (text) => {
    await sendMessage(text);
  };

  return (
    <div className="chat-page h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        <ChatWindow messages={messages} onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
