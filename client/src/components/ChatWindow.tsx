import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

interface User {
  id: string;
  username: string;
  email: string;
  status: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  channelId?: string;
  recipientId?: string;
}

interface ChatWindowProps {
  messages: Message[];
  currentUser: User;
  chatName: string;
  onSendMessage: (content: string) => void;
  onTyping?: () => void;
  typingUsers?: string[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUser,
  chatName,
  onSendMessage,
  onTyping,
  typingUsers = []
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Input changed, calling onTyping:', !!onTyping);
    setMessageInput(e.target.value);
    if (onTyping) {
      onTyping();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = formatDate(message.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{chatName}</h2>
      </div>

      <div className="messages-container">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="date-divider">
              <span>{date}</span>
            </div>
            {dateMessages.map(message => (
              <div
                key={message.id}
                className={`message ${message.senderId === currentUser.id ? 'own-message' : ''}`}
              >
                <div className="message-header">
                  <span className="sender-name">
                    {message.senderId === currentUser.id ? 'You' : message.senderName}
                  </span>
                  <span className="timestamp">{formatTime(message.timestamp)}</span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        )}
        {(() => {
          if (typingUsers.length > 0) {
            console.log('ChatWindow rendering typing indicator for users:', typingUsers);
          }
          return typingUsers.length > 0 ? (
            <div className="typing-indicator">
              <span className="typing-text">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`
                }
              </span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : null;
        })()}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <textarea
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={`Message ${chatName}`}
          className="message-input"
          rows={1}
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
