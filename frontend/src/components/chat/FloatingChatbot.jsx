import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import ChatWindow from './ChatWindow'
import { useChat } from './ChatContext'
import './FloatingChatbot.css'

function FloatingChatbot() {
  const [open, setOpen] = useState(false)
  const { messages, sendMessage, isLoading } = useChat()

  const handleSend = async (text) => {
    await sendMessage(text)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        className="floating-chat-btn"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Open AI Assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="floating-chat-window">
          <ChatWindow messages={messages} onSend={handleSend} isLoading={isLoading} />
        </div>
      )}
    </>
  )
}

export default FloatingChatbot