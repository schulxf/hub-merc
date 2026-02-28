import {
  getSwapQuote,
  calculateSlippageAmount,
  estimateSwapGasInUsd,
} from '../swapService';

/**
 * Test suite for swapService — 1inch integration and swap utilities.
 */
describe('swapService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getSwapQuote', () => {
    it('should fetch a valid quote from 1inch', async () => {
      const mockQuote = {
        toAmount: '1500000000000000000', // 1.5 in 18 decimals
        estimatedGas: '150000',
        data: '0x...',
        to: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuote,
      });

      const quote = await getSwapQuote(
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        '1000000000000000000', // 1 ETH
        true, // testnet
      );

      expect(quote).toEqual(mockQuote);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        getSwapQuote(
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          '1000000000000000000',
          true,
        ),
      ).rejects.toThrow();
    });

    it('should apply default slippage of 0.5%', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ toAmount: '1500000000000000000' }),
      });

      await getSwapQuote(
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        '1000000000000000000',
      );

      const callUrl = fetch.mock.calls[0][0];
      expect(callUrl).toContain('slippage=0.5');
    });
  });

  describe('calculateSlippageAmount', () => {
    it('should calculate slippage correctly', () => {
      const slippageAmount = calculateSlippageAmount(
        1000000000000000000n, // 1 in 18 decimals
        0.5, // 0.5%
      );

      expect(slippageAmount).toBe(5000000000000000n); // 0.005 in 18 decimals
    });

    it('should handle high slippage', () => {
      const slippageAmount = calculateSlippageAmount(
        1000000000000000000n,
        10, // 10%
      );

      expect(slippageAmount).toBe(100000000000000000n); // 0.1 in 18 decimals
    });

    it('should handle zero slippage', () => {
      const slippageAmount = calculateSlippageAmount(
        1000000000000000000n,
        0,
      );

      expect(slippageAmount).toBe(0n);
    });
  });

  describe('estimateSwapGasInUsd', () => {
    it('should calculate gas cost in USD', () => {
      const gasUsd = estimateSwapGasInUsd(
        { estimatedGas: '150000' }, // 0.00015 ETH
        1200, // $1200 per ETH
      );

      // 150000 / 1e18 * 1200 = 0.0000000000000018
      expect(gasUsd).toBeCloseTo(0.00000018, 10);
    });

    it('should handle different ETH prices', () => {
      const gasUsd = estimateSwapGasInUsd(
        { estimatedGas: '200000' },
        2000, // $2000 per ETH
      );

      expect(gasUsd).toBeCloseTo(0.0000000000000004, 10);
    });
  });
});
