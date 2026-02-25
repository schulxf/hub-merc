import { useMemo } from 'react';
import { usePortfolioContext } from '../components/portfolio/PortfolioContext';

/**
 * useDashboardData — derives all values needed by the Dashboard homepage
 * from PortfolioContext in a single memoised pass.
 *
 * Returns:
 *   - totalValue      {number}  sum of (asset.amount * currentPrice)
 *   - change24hPct    {number}  portfolio-level 24h % change
 *   - change24hAbs    {number}  portfolio-level 24h absolute change (USD)
 *   - isLoading       {boolean} true while Firestore/prices are loading
 *
 * Must be called inside a <PortfolioProvider> tree.
 *
 * @returns {{
 *   totalValue: number,
 *   change24hPct: number,
 *   change24hAbs: number,
 *   isLoading: boolean,
 * }}
 */
export function useDashboardData() {
  const { portfolioAssets, livePrices, isLoading } = usePortfolioContext();

  const metrics = useMemo(() => {
    let currentTotal = 0;
    let total24hAgo = 0;

    const assets = Array.isArray(portfolioAssets) ? portfolioAssets : [];

    for (const asset of assets) {
      const priceData = livePrices[asset.coinId] ?? {};
      const currentPrice = typeof priceData.usd === 'number' ? priceData.usd : 0;
      const raw24hChange =
        typeof priceData.usd_24h_change === 'number' ? priceData.usd_24h_change : 0;

      const currentValue = asset.amount * currentPrice;

      // Derive price 24h ago from the % change (guard against division by zero)
      const denominator = 1 + raw24hChange / 100;
      const price24hAgo = denominator > 0 ? currentPrice / denominator : currentPrice;
      const value24hAgo = asset.amount * price24hAgo;

      currentTotal += currentValue;
      total24hAgo += value24hAgo;
    }

    const change24hAbs = currentTotal - total24hAgo;
    const change24hPct =
      total24hAgo > 0 ? (change24hAbs / total24hAgo) * 100 : 0;

    return {
      totalValue: currentTotal,
      change24hPct,
      change24hAbs,
    };
  }, [portfolioAssets, livePrices]);

  return {
    ...metrics,
    isLoading,
  };
}
