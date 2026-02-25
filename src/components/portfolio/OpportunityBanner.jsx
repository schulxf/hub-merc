import React from 'react';
import { Lightbulb, TrendingUp, X } from 'lucide-react';
import { useOpportunityAnalyzer } from '../../hooks/useOpportunityAnalyzer';

/**
 * OpportunityBanner — displays rebalancing opportunities based on portfolio drift.
 *
 * Features:
 * - Shows top 3 rebalancing opportunities
 * - Dismissible banner
 * - Links to swap widget
 * - Score-based ranking
 *
 * @param {object} props
 * @param {Function} [props.onSwapClick] - Callback when user clicks to rebalance
 * @returns {React.ReactElement|null}
 */
const OpportunityBanner = React.memo(function OpportunityBanner({ onSwapClick }) {
  const { opportunities, isAnalyzing } = useOpportunityAnalyzer(0.05);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Show only if we have opportunities and not dismissed
  if (isDismissed || opportunities.length === 0 || isAnalyzing) {
    return null;
  }

  // Get top 3 opportunities
  const topOpportunities = opportunities.slice(0, 3);
  const topOpportunity = topOpportunities[0];

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 flex gap-4">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Oportunidade de Rebalanceamento
            </h3>
            <p className="text-sm text-blue-200/80 mt-1">
              Seu portfólio está {Math.abs(topOpportunity.drift * 100).toFixed(1)}% fora
              do alvo em{' '}
              <span className="font-semibold">{topOpportunity.asset}</span>.
              {topOpportunities.length > 1 && (
                <span>
                  {' '}
                  +{topOpportunities.length - 1} outro
                  {topOpportunities.length > 2 ? 's' : ''}.
                </span>
              )}
            </p>

            {/* Quick action button */}
            <button
              onClick={() => onSwapClick?.(topOpportunity)}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              Rebalancear Agora
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-blue-500/20 rounded transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-blue-300" />
          </button>
        </div>

        {/* Score indicator */}
        <div className="mt-3 pt-3 border-t border-blue-500/20">
          <div className="text-xs text-blue-200/60 flex items-center gap-2">
            <div className="flex-1 bg-blue-500/10 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full"
                style={{ width: `${Math.min(topOpportunity.score, 100)}%` }}
              />
            </div>
            <span>Score: {topOpportunity.score.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OpportunityBanner;
