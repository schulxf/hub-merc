import { renderHook, waitFor } from '@testing-library/react';
import { useSwapQuote } from '../useSwapQuote';
import * as swapService from '../../services/swapService';

/**
 * Test suite for useSwapQuote hook — quote fetching with caching.
 */
jest.mock('../../services/swapService');

describe('useSwapQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when inputs are missing', () => {
    const { result } = renderHook(() =>
      useSwapQuote({
        tokenIn: null,
        tokenOut: null,
        amountIn: '',
      }),
    );

    expect(result.current.quote).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch quote when inputs are provided', async () => {
    const mockQuote = {
      toAmount: '1500000000000000000',
      estimatedGas: '150000',
    };

    swapService.getSwapQuote.mockResolvedValueOnce(mockQuote);

    const { result } = renderHook(() =>
      useSwapQuote({
        tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        amountIn: '1000000000000000000',
      }),
    );

    await waitFor(() => {
      expect(result.current.quote).toEqual(mockQuote);
    });
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('API Error');
    swapService.getSwapQuote.mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useSwapQuote({
        tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        amountIn: '1000000000000000000',
      }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });
  });

  it('should provide refetch function', async () => {
    const mockQuote = { toAmount: '1500000000000000000' };
    swapService.getSwapQuote.mockResolvedValueOnce(mockQuote);

    const { result } = renderHook(() =>
      useSwapQuote({
        tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        amountIn: '1000000000000000000',
      }),
    );

    await waitFor(() => {
      expect(result.current.quote).toEqual(mockQuote);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});
