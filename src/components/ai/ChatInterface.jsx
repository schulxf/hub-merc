import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import ChatMessages from './ChatMessages';
import FollowUpSuggestions from './FollowUpSuggestions';
import { useAiCopilotContext } from '../../contexts/AiCopilotContext';
import { useAiChat } from '../../hooks/useAiChat';

/**
 * ChatInterface — main chat container with message list, input form, and error display.
 *
 * Features:
 * - Displays all messages with auto-scroll
 * - Input form with send button
 * - Suggested follow-up questions
 * - Error banner for AI service errors
 *
 * @returns {React.ReactElement}
 */
const ChatInterface = React.memo(function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const { messages, isStreaming, error } = useAiCopilotContext();
  const { sendMessage, isLoading } = useAiChat();

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || isLoading) return;
    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setInputValue(suggestion);
    await sendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1419]">
      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Messages */}
      <ChatMessages messages={messages} />

      {/* Suggestions (show only when no messages yet or after AI response) */}
      {messages.length === 0 && <FollowUpSuggestions
        onSuggestionClick={handleSuggestionClick}
        isLoading={isStreaming || isLoading}
      />}

      {/* Input form */}
      <div className="border-t border-gray-800 bg-[#0a0a0a] px-4 py-4">
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre seu portfólio..."
            disabled={isStreaming || isLoading}
            rows={1}
            className="flex-1 bg-gray-800/50 border border-gray-700 text-gray-100 rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatInterface;
