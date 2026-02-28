import React, { useEffect, useRef } from 'react';
import UserMessage from './UserMessage';
import AIMessage from './AIMessage';

/**
 * ChatMessages — renders list of all chat messages.
 *
 * Auto-scrolls to bottom when new messages arrive.
 * Delegates message rendering to UserMessage and AIMessage components.
 *
 * @param {object} props
 * @param {Array<{id, role, content, isStreaming}>} props.messages - Chat messages
 * @returns {React.ReactElement}
 */
const ChatMessages = React.memo(function ChatMessages({ messages }) {
  const messagesEndRef = useRef(null);

  /**
   * Auto-scroll to bottom when new messages arrive.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p className="text-center text-sm">
          Olá! Eu sou seu assistente de portfólio baseado em IA.
          <br />
          Faça uma pergunta sobre seu portfólio para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
      {messages.map((message) =>
        message.role === 'user' ? (
          <UserMessage key={message.id} content={message.content} />
        ) : (
          <AIMessage
            key={message.id}
            content={message.content}
            isStreaming={message.isStreaming}
          />
        ),
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default ChatMessages;
