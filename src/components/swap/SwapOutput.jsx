import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

/**
 * SwapOutput — output section showing "receive" token selection and amount.
 *
 * Features:
 * - Dropdown to select output token
 * - Estimated output amount (updates with quote)
 * - Loading indicator while fetching quote
 * - Read-only output
 *
 * @param {object} props
 * @param {string} props.tokenOut - Selected token symbol
 * @param {number|null} props.outputAmount - Estimated output amount
 * @param {Function} props.onTokenChange - Callback on token selection
 * @param {boolean} [props.isLoading=false] - Show loading state
 * @param {boolean} [props.disabled=false] - Disable input
 * @returns {React.ReactElement}
 */
const SwapOutput = React.memo(function SwapOutput({
  tokenOut,
  outputAmount,
  onTokenChange,
  isLoading = false,
  disabled = false,
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs font-semibold text-gray-400 uppercase">Receber</label>
      </div>

      <div className="flex gap-3">
        {/* Token selector */}
        <button
          onClick={onTokenChange}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-white"
        >
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">
            {tokenOut[0]}
          </div>
          {tokenOut}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </button>

        {/* Amount display */}
        <div className="flex-1 relative flex items-center justify-end">
          {isLoading && (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin mr-3" />
          )}
          <div className="text-right text-2xl font-semibold text-white">
            {outputAmount !== null ? outputAmount.toFixed(4) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SwapOutput;
