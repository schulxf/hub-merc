import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import {
  hasSnapshotForToday,
  savePortfolioSnapshot,
} from '../lib/portfolioSnapshots';

/**
 * @typedef {Object} UseFirstLoadSnapshotResult
 * @property {boolean} isCapturing - True while saving snapshot
 * @property {string|null} lastCapturedAt - ISO timestamp of last captured snapshot
 * @property {Error|null} error - Error if snapshot capture failed
 */

/**
 * Hook to lazily capture portfolio snapshot on first load each day
 *
 * Usage:
 * ```jsx
 * function MyComponent() {
 *   const { portfolioAssets, livePrices } = usePortfolioContext();
 *   const { isCapturing, lastCapturedAt } = useFirstLoadSnapshot(
 *     portfolioAssets,
 *     livePrices
 *   );
 *
 *   if (isCapturing) return <Spinner />;
 *   return <Dashboard />;
 * }
 * ```
 *
 * @param {Array} portfolioAssets - Array of assets from PortfolioContext
 * @param {Object} livePrices - Live prices object from PortfolioContext
 * @returns {UseFirstLoadSnapshotResult}
 */
export function useFirstLoadSnapshot(portfolioAssets, livePrices) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapturedAt, setLastCapturedAt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function captureIfNeeded() {
      if (!auth.currentUser) return;
      if (!Array.isArray(portfolioAssets) || portfolioAssets.length === 0) return;
      if (!livePrices || Object.keys(livePrices).length === 0) return;

      try {
        // Check if snapshot exists
        const alreadyHasSnapshot = await hasSnapshotForToday(
          auth.currentUser.uid
        );

        if (alreadyHasSnapshot) {
          console.log('[useFirstLoadSnapshot] Snapshot already exists for today');
          return;
        }

        // Calculate snapshot data
        if (isMounted) {
          setIsCapturing(true);
        }

        const snapshotData = calculateSnapshotData(
          portfolioAssets,
          livePrices
        );

        // Validate data has assets
        if (!snapshotData || snapshotData.assets.length === 0) {
          console.warn('[useFirstLoadSnapshot] No assets to snapshot');
          return;
        }

        // Save snapshot
        const timestamp = await savePortfolioSnapshot(
          auth.currentUser.uid,
          snapshotData,
          'lazy-load'
        );

        if (isMounted) {
          setLastCapturedAt(timestamp);
          setError(null);
          console.log('[useFirstLoadSnapshot] Snapshot captured at', timestamp);
        }
      } catch (err) {
        console.error('[useFirstLoadSnapshot] Error capturing snapshot:', err);
        if (isMounted) {
          setError(err);
          // Don't fail UX - snapshots are optional
        }
      } finally {
        if (isMounted) {
          setIsCapturing(false);
        }
      }
    }

    captureIfNeeded();

    return () => {
      isMounted = false;
    };
  }, [portfolioAssets, livePrices]);

  return {
    isCapturing,
    lastCapturedAt,
    error,
  };
}

/**
 * Calculate snapshot data from current portfolio state
 * @private
 * @param {Array} portfolioAssets
 * @param {Object} livePrices
 * @returns {Object} Snapshot data ready for Zod validation
 */
function calculateSnapshotData(portfolioAssets, livePrices) {
  let totalValue = 0;
  let totalInvested = 0;
  let totalValue24hAgo = 0;

  const assets = portfolioAssets.map((asset) => {
    const priceData = livePrices?.[asset.coinId] ?? {
      usd: asset.averageBuyPrice ?? 0,
      usd_24h_change: 0,
    };

    const currentPrice = priceData.usd ?? 0;
    const currentValue = asset.amount * currentPrice;
    const investedValue = asset.amount * asset.averageBuyPrice;
    const profitLoss = currentValue - investedValue;
    const profitLossPct =
      investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

    // Calculate 24h change
    const change24hPct =
      typeof priceData.usd_24h_change === 'number'
        ? priceData.usd_24h_change
        : 0;
    const safeDenominator = 1 + change24hPct / 100;
    const price24hAgo =
      safeDenominator > 0 ? currentPrice / safeDenominator : currentPrice;
    const value24hAgo = asset.amount * price24hAgo;

    totalValue += currentValue;
    totalInvested += investedValue;
    totalValue24hAgo += value24hAgo;

    return {
      coinId: asset.coinId,
      symbol: asset.symbol,
      name: asset.name,
      amount: asset.amount,
      currentPrice,
      currentValue,
      averageBuyPrice: asset.averageBuyPrice,
      profitLossPct,
    };
  });

  const totalProfitLoss = totalValue - totalInvested;
  const change24hAbs = totalValue - totalValue24hAgo;
  const change24hPct =
    totalValue24hAgo > 0 ? (change24hAbs / totalValue24hAgo) * 100 : 0;

  return {
    totalValue,
    totalInvested,
    totalProfitLoss,
    change24h: change24hPct,
    assets,
  };
}
