import React from 'react';
import { Zap } from 'lucide-react';

/**
 * GasEstimate — displays estimated gas fees for the swap.
 *
 * Shows:
 * - Gas fee in USD
 * - Gas fee as % of swap amount
 * - Warning if gas > 5% of amount
 *
 * @param {object} props
 * @param {number|null} props.gasUsd - Estimated gas in USD
 * @param {number|null} props.gasPercentage - Gas as % of swap amount
 * @returns {React.ReactElement}
 */
const GasEstimate = React.memo(function GasEstimate({ gasUsd, gasPercentage }) {
  const isHighGas = gasPercentage && gasPercentage > 5;

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Estimativa de Gas
        </span>
        <div className="flex items-center gap-3">
          {gasUsd !== null && (
            <span
              className={`font-medium ${
                isHighGas ? 'text-yellow-500' : 'text-gray-100'
              }`}
            >
              ${gasUsd.toFixed(2)}
            </span>
          )}
          {gasPercentage !== null && (
            <span className="text-xs text-gray-500">
              ({gasPercentage.toFixed(2)}% da ordem)
            </span>
          )}
          {gasUsd === null && (
            <span className="text-gray-500">—</span>
          )}
        </div>
      </div>

      {isHighGas && (
        <p className="text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mt-2">
          Gas elevado. Considere aumentar o tamanho da ordem para melhorar a taxa.
        </p>
      )}
    </div>
  );
});

export default GasEstimate;
