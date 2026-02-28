import React from 'react';
import { Zap } from 'lucide-react';

/**
 * AIMessage — displays an AI response message (left-aligned).
 *
 * Features:
 * - Left-aligned with dark background and AI icon
 * - Shows blinking cursor while streaming
 * - Supports markdown-like formatting
 *
 * @param {object} props
 * @param {string} props.content - Message text
 * @param {boolean} [props.isStreaming=false] - Whether message is being streamed
 * @returns {React.ReactElement}
 */
const AIMessage = React.memo(function AIMessage({ content, isStreaming = false }) {
  return (
    <div className="flex justify-start gap-3">
      {/* AI Icon */}
      <div className="flex-shrink-0 pt-1">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
        </div>
      </div>

      {/* Message bubble */}
      <div className="bg-gray-800/50 border border-gray-700 text-gray-100 rounded-lg px-4 py-3 max-w-xs lg:max-w-md break-words text-sm">
        <p className="leading-relaxed whitespace-pre-wrap">
          {content}
          {isStreaming && <span className="animate-pulse">▌</span>}
        </p>
      </div>
    </div>
  );
});

export default AIMessage;
