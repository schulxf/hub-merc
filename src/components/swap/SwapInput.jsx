import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * SwapInput — input section showing "send" token selection and amount.
 *
 * Features:
 * - Dropdown to select input token
 * - Amount input field
 * - Balance display
 * - Max button
 *
 * @param {object} props
 * @param {string} props.tokenIn - Selected token symbol
 * @param {number} props.balance - User balance of tokenIn
 * @param {string} props.amount - Input amount
 * @param {Function} props.onAmountChange - Callback on amount change
 * @param {Function} props.onTokenChange - Callback on token selection
 * @param {boolean} [props.disabled=false] - Disable input
 * @returns {React.ReactElement}
 */
const SwapInput = React.memo(function SwapInput({
  tokenIn,
  balance,
  amount,
  onAmountChange,
  onTokenChange,
  disabled = false,
}) {
  const handleMaxClick = () => {
    onAmountChange(String(balance));
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs font-semibold text-gray-400 uppercase">Enviar</label>
        <span className="text-xs text-gray-500">Saldo: {balance.toFixed(4)}</span>
      </div>

      <div className="flex gap-3">
        {/* Token selector */}
        <button
          onClick={onTokenChange}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-white"
        >
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">
            {tokenIn[0]}
          </div>
          {tokenIn}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </button>

        {/* Amount input */}
        <div className="flex-1 relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
            className="w-full bg-transparent text-right text-2xl font-semibold text-white placeholder-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Max button */}
          <button
            onClick={handleMaxClick}
            disabled={disabled || balance === 0}
            className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-xs font-bold text-white rounded transition-colors"
          >
            Máx
          </button>
        </div>
      </div>
    </div>
  );
});

export default SwapInput;
