import React from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * ExecuteSwap — button and transaction status display for executing swap.
 *
 * Features:
 * - Primary button to execute swap
 * - Loading state with spinner
 * - Success message with tx hash
 * - Error display with retry option
 *
 * @param {object} props
 * @param {Function} props.onExecute - Callback to execute swap
 * @param {boolean} [props.isLoading=false] - Show loading state
 * @param {string|null} [props.error=null] - Error message
 * @param {string|null} [props.txHash=null] - Successful transaction hash
 * @param {boolean} [props.disabled=false] - Disable button
 * @returns {React.ReactElement}
 */
const ExecuteSwap = React.memo(function ExecuteSwap({
  onExecute,
  isLoading = false,
  error = null,
  txHash = null,
  disabled = false,
}) {
  const isDisabled = disabled || isLoading || !!txHash;

  return (
    <div className="space-y-3">
      {/* Main button */}
      <button
        onClick={onExecute}
        disabled={isDisabled}
        className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
          isDisabled
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {isLoading ? 'Executando...' : 'Executar Swap'}
      </button>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">Erro na transação</p>
            <p className="text-xs text-red-300/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success display */}
      {txHash && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-300 font-medium">Transação bem-sucedida</p>
            <p className="text-xs text-green-300/70 mt-1 font-mono break-all">
              {txHash}
            </p>
          </div>
        </div>
      )}

      {/* Warning about MetaMask */}
      {!txHash && !error && (
        <p className="text-xs text-gray-500 text-center">
          Clique para confirmar a transação no MetaMask
        </p>
      )}
    </div>
  );
});

export default ExecuteSwap;
