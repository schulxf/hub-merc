import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';

/**
 * SlippageDisplay — shows and allows adjustment of slippage tolerance.
 *
 * Features:
 * - Display current slippage %
 * - Quick select buttons (0.1%, 0.5%, 1%)
 * - Custom slippage input
 * - Warning for high slippage
 *
 * @param {object} props
 * @param {number} props.slippage - Current slippage %
 * @param {Function} props.onSlippageChange - Callback when slippage changes
 * @returns {React.ReactElement}
 */
const SlippageDisplay = React.memo(function SlippageDisplay({
  slippage,
  onSlippageChange,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const QUICK_OPTIONS = [0.1, 0.5, 1.0];

  const handleQuickSelect = (value) => {
    onSlippageChange(value);
  };

  const handleCustomInput = (e) => {
    const value = parseFloat(e.target.value) || 0;
    onSlippageChange(Math.min(value, 10)); // Cap at 10%
  };

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex justify-between items-center text-sm hover:bg-gray-700/30 p-2 rounded transition-colors"
        >
          <span className="text-gray-400 flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Tolerância de Slippage
          </span>
          <span className="text-gray-100 font-medium">{slippage.toFixed(2)}%</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Slippage
            </span>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-300"
            >
              Fechar
            </button>
          </div>

          {/* Quick options */}
          <div className="flex gap-2">
            {QUICK_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => handleQuickSelect(option)}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  Math.abs(slippage - option) < 0.01
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {option.toFixed(1)}%
              </button>
            ))}
          </div>

          {/* Custom input */}
          <input
            type="number"
            value={slippage}
            onChange={handleCustomInput}
            min="0"
            max="10"
            step="0.1"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            placeholder="Digite o slippage"
          />

          {/* Warning for high slippage */}
          {slippage > 2 && (
            <p className="text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
              Slippage alto pode resultar em execução com preço desfavorável.
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default SlippageDisplay;
