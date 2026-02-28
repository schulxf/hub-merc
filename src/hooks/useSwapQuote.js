import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSwapQuote } from '../services/swapService';

/**
 * useSwapQuote — hook for fetching and managing swap quotes.
 *
 * Features:
 * - Fetches quote from 1inch API with debouncing
 * - Caches results with TanStack Query
 * - Handles loading, error, and quote states
 * - Refetch on demand
 *
 * @param {object} options
 * @param {string} options.tokenIn - Input token address
 * @param {string} options.tokenOut - Output token address
 * @param {string} options.amountIn - Amount to swap (in smallest units)
 * @param {number} [options.slippage=0.5] - Slippage tolerance %
 * @param {boolean} [options.testnet=true] - Use testnet
 *
 * @returns {{
 *   quote: object|null,
 *   isLoading: boolean,
 *   error: string|null,
 *   refetch: Function,
 * }}
 */
export function useSwapQuote({
  tokenIn,
  tokenOut,
  amountIn,
  slippage = 0.5,
  testnet = true,
}) {
  const {
    data: quote = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'swap-quote',
      tokenIn,
      tokenOut,
      amountIn,
      slippage,
      testnet,
    ],
    queryFn: async () => {
      if (!tokenIn || !tokenOut || !amountIn) return null;
      return getSwapQuote(tokenIn, tokenOut, amountIn, testnet, slippage);
    },
    enabled: Boolean(tokenIn && tokenOut && amountIn),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    quote,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
