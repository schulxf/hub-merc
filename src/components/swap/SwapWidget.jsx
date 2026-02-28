import React, { useState, useCallback } from 'react';
import { ArrowDownUp, X } from 'lucide-react';
import SwapInput from './SwapInput';
import SwapOutput from './SwapOutput';
import PriceQuote from './PriceQuote';
import SlippageDisplay from './SlippageDisplay';
import GasEstimate from './GasEstimate';
import ExecuteSwap from './ExecuteSwap';
import { useSwapQuote } from '../../hooks/useSwapQuote';

/**
 * SwapWidget — complete swap interface for DEX trades.
 *
 * Features:
 * - Select tokens and amounts
 * - Real-time price quotes from 1inch
 * - Adjust slippage tolerance
 * - View gas estimates
 * - Execute swap via MetaMask
 * - Handles loading and error states
 *
 * @param {object} props
 * @param {Function} [props.onClose] - Callback to close widget
 * @param {string} [props.initialTokenIn='ETH'] - Initial input token
 * @param {string} [props.initialTokenOut='USDC'] - Initial output token
 * @returns {React.ReactElement}
 */
const SwapWidget = React.memo(function SwapWidget({
  onClose,
  initialTokenIn = 'ETH',
  initialTokenOut = 'USDC',
}) {
  const [tokenIn, setTokenIn] = useState(initialTokenIn);
  const [tokenOut, setTokenOut] = useState(initialTokenOut);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Mock balance (future: fetch from portfolio)
  const balance = 10.5;

  // Fetch quote from 1inch
  const { quote, isLoading: isQuoteLoading } = useSwapQuote({
    tokenIn,
    tokenOut,
    amountIn: amountIn ? String(Math.floor(parseFloat(amountIn) * 1e18)) : '',
    slippage,
  });

  /**
   * Calculate output amount from quote.
   */
  const outputAmount =
    quote && amountIn ? parseFloat(quote.toAmount) / 1e18 : null;

  /**
   * Calculate exchange rate.
   */
  const exchangeRate =
    amountIn && outputAmount
      ? outputAmount / parseFloat(amountIn)
      : quote && parseFloat(amountIn) > 0
        ? parseFloat(quote.toAmount) / (parseFloat(amountIn) * 1e18)
        : null;

  /**
   * Calculate price impact (simplified).
   */
  const priceImpact = quote ? (quote.estimatedGas || 0) * 0.001 : null;

  /**
   * Calculate gas estimate in USD.
   */
  const gasUsd = quote ? (quote.estimatedGas || 0) / 1e18 * 1200 : null; // Assume $1200/ETH
  const gasPercentage =
    gasUsd && amountIn ? (gasUsd / (parseFloat(amountIn) * 1200)) * 100 : null;

  /**
   * Swap token positions.
   */
  const handleSwapTokens = useCallback(() => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
  }, [tokenIn, tokenOut]);

  /**
   * Execute swap via MetaMask.
   */
  const handleExecuteSwap = useCallback(async () => {
    if (!window.ethereum) {
      setTxError('MetaMask não encontrado');
      return;
    }

    if (!quote) {
      setTxError('Aguarde a cotação');
      return;
    }

    try {
      setIsExecuting(true);
      setTxError(null);

      // Send transaction via MetaMask
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: (await window.ethereum.request({ method: 'eth_accounts' }))[0],
            to: quote.to,
            data: quote.data,
            value: quote.value || '0',
          },
        ],
      });

      setTxHash(txHash);
    } catch (error) {
      console.error('[SwapWidget] Erro ao executar swap:', error);
      setTxError(error.message || 'Erro ao executar transação');
    } finally {
      setIsExecuting(false);
    }
  }, [quote]);

  /**
   * Reset after successful swap.
   */
  const handleReset = () => {
    setAmountIn('');
    setTxHash(null);
    setTxError(null);
  };

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white">Trocar (Swap)</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Swap inputs */}
      <div className="space-y-4 mb-6">
        {/* Input */}
        <SwapInput
          tokenIn={tokenIn}
          balance={balance}
          amount={amountIn}
          onAmountChange={setAmountIn}
          onTokenChange={() => {}} // TODO: Token selector modal
          disabled={isExecuting || !!txHash}
        />

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors border border-gray-700"
          >
            <ArrowDownUp className="w-5 h-5 text-blue-400" />
          </button>
        </div>

        {/* Output */}
        <SwapOutput
          tokenOut={tokenOut}
          outputAmount={outputAmount}
          onTokenChange={() => {}} // TODO: Token selector modal
          isLoading={isQuoteLoading}
          disabled={isExecuting || !!txHash}
        />
      </div>

      {/* Quote details */}
      {amountIn && (
        <div className="space-y-3 mb-6">
          <PriceQuote
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            rate={exchangeRate}
            priceImpact={priceImpact}
          />

          <SlippageDisplay
            slippage={slippage}
            onSlippageChange={setSlippage}
          />

          <GasEstimate gasUsd={gasUsd} gasPercentage={gasPercentage} />
        </div>
      )}

      {/* Execute button */}
      <ExecuteSwap
        onExecute={handleExecuteSwap}
        isLoading={isExecuting}
        error={txError}
        txHash={txHash}
        disabled={!quote || !amountIn || parseFloat(amountIn) === 0}
      />

      {/* Reset link */}
      {txHash && (
        <button
          onClick={handleReset}
          className="w-full mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Fazer outro swap
        </button>
      )}
    </div>
  );
});

export default SwapWidget;
