import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * FollowUpSuggestions — displays suggested follow-up questions.
 *
 * Shows hardcoded Portuguese suggestions that users can click to continue the conversation.
 *
 * @param {object} props
 * @param {Function} props.onSuggestionClick - Callback when suggestion is clicked
 * @param {boolean} [props.isLoading=false] - Disable suggestions while loading
 * @returns {React.ReactElement}
 */
const FollowUpSuggestions = React.memo(function FollowUpSuggestions({
  onSuggestionClick,
  isLoading = false,
}) {
  const suggestions = [
    'Qual é meu ativo de melhor desempenho?',
    'Como posso diversificar meu portfólio?',
    'Qual é meu risco geral de portfólio?',
    'Quais são as oportunidades de rebalanceamento?',
  ];

  return (
    <div className="px-4 pt-2 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSuggestionClick(suggestion)}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm"
        >
          <span>{suggestion}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
});

export default FollowUpSuggestions;
