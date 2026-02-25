import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Context for managing AI Copilot chat state.
 * Provides chat messages, loading state, and callbacks for message management.
 *
 * @type {React.Context}
 */
const AiCopilotContext = createContext(null);

/**
 * AiCopilotProvider — wraps the AI Copilot interface and manages chat state.
 *
 * Responsibilities:
 * - Maintains array of chat messages (user and AI)
 * - Tracks streaming state and errors
 * - Provides callbacks for adding/updating messages
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components consuming context
 */
export function AiCopilotProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Add a new message to the chat.
   * Messages have format: { id, role ('user'|'assistant'), content, timestamp, isStreaming }
   */
  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, { ...message, id: Date.now() }]);
  }, []);

  /**
   * Update an existing message (used for streaming character-by-character appends).
   */
  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)),
    );
  }, []);

  /**
   * Clear all messages and reset state.
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  /**
   * Memoised context value.
   */
  const value = useMemo(
    () => ({
      messages,
      isStreaming,
      setIsStreaming,
      error,
      setError,
      addMessage,
      updateMessage,
      clearChat,
    }),
    [messages, isStreaming, error, addMessage, updateMessage, clearChat],
  );

  return (
    <AiCopilotContext.Provider value={value}>
      {children}
    </AiCopilotContext.Provider>
  );
}

/**
 * useAiCopilotContext — hook to access AI Copilot context values.
 *
 * Must be used inside an <AiCopilotProvider> tree.
 *
 * @returns {{
 *   messages: Array<{id, role, content, timestamp, isStreaming}>,
 *   isStreaming: boolean,
 *   setIsStreaming: Function,
 *   error: string|null,
 *   setError: Function,
 *   addMessage: Function,
 *   updateMessage: Function,
 *   clearChat: Function,
 * }}
 */
export function useAiCopilotContext() {
  const context = useContext(AiCopilotContext);

  if (context === null) {
    throw new Error(
      'useAiCopilotContext must be used within an AiCopilotProvider. ' +
      'Wrap your component tree with <AiCopilotProvider>.',
    );
  }

  return context;
}

export default AiCopilotContext;
