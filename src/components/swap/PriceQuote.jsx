import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

/**
 * PriceQuote — displays exchange rate and price impact information.
 *
 * Shows:
 * - Exchange rate (1 tokenIn = X tokenOut)
 * - Price impact percentage
 * - Warning if impact > 1%
 *
 * @param {object} props
 * @param {string} props.tokenIn - Input token symbol
 * @param {string} props.tokenOut - Output token symbol
 * @param {number|null} props.rate - Exchange rate (1 tokenIn = rate tokenOut)
 * @param {number|null} props.priceImpact - Price impact percentage
 * @returns {React.ReactElement}
 */
const PriceQuote = React.memo(function PriceQuote({
  tokenIn,
  tokenOut,
  rate,
  priceImpact,
}) {
  const hasHighImpact = priceImpact && priceImpact > 1;

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 space-y-2">
      {/* Exchange rate */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Taxa de câmbio</span>
        <span className="text-gray-100 font-medium">
          1 {tokenIn} = {rate ? rate.toFixed(6) : '—'} {tokenOut}
        </span>
      </div>

      {/* Price impact */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Impacto de preço</span>
        <div className="flex items-center gap-2">
          {hasHighImpact && (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
          <span
            className={`font-medium ${
              priceImpact === null
                ? 'text-gray-400'
                : hasHighImpact
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }`}
          >
            {priceImpact !== null ? `${priceImpact.toFixed(2)}%` : '—'}
          </span>
        </div>
      </div>

      {/* High impact warning */}
      {hasHighImpact && (
        <div className="flex gap-2 text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
          <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Impacto de preço alto. Considere dividir a ordem.</span>
        </div>
      )}
    </div>
  );
});

export default PriceQuote;
