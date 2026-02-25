import { useState, useCallback, useEffect } from 'react';
import { findRebalancingOpportunities, rankOpportunitiesByScore } from '../services/opportunityAnalyzer';
import { usePortfolioContext } from '../components/portfolio/PortfolioContext';

/**
 * useOpportunityAnalyzer — hook for detecting portfolio rebalancing opportunities.
 *
 * Features:
 * - Analyzes portfolio against BTC benchmark
 * - Detects allocation drift
 * - Ranks opportunities by impact score
 * - Manual refetch capability
 *
 * @param {number} [driftThreshold=0.05] - Minimum allocation drift to flag opportunity
 *
 * @returns {{
 *   opportunities: Array<{asset, currentAllocation, targetAllocation, drift, score}>,
 *   isAnalyzing: boolean,
 *   error: string|null,
 *   analyze: Function,
 * }}
 */
export function useOpportunityAnalyzer(driftThreshold = 0.05) {
  const { portfolioAssets, livePrices, isLoading } = usePortfolioContext();
  const [opportunities, setOpportunities] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Run opportunity analysis.
   */
  const analyze = useCallback(async () => {
    if (!Array.isArray(portfolioAssets) || portfolioAssets.length === 0) {
      setOpportunities([]);
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Calculate portfolio metrics
      const totalValue = portfolioAssets.reduce(
        (sum, asset) =>
          sum + asset.quantity * (livePrices[asset.coinId] || asset.purchasePrice),
        0,
      );

      if (totalValue <= 0) {
        setOpportunities([]);
        return;
      }

      // Create benchmark with 60% BTC, 40% ETH (simplified)
      const benchmark = {
        BTC: 0.6,
        ETH: 0.4,
      };

      // Find opportunities
      const found = findRebalancingOpportunities(
        portfolioAssets.map((asset) => ({
          symbol: asset.symbol,
          quantity: asset.quantity,
          currentValue:
            asset.quantity * (livePrices[asset.coinId] || asset.purchasePrice),
        })),
        benchmark,
        driftThreshold,
      );

      // Rank by score
      const ranked = rankOpportunitiesByScore(found);
      setOpportunities(ranked);
    } catch (err) {
      console.error('[useOpportunityAnalyzer] Erro ao analisar oportunidades:', err);
      setError('Erro ao analisar oportunidades');
      setOpportunities([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [portfolioAssets, livePrices, driftThreshold]);

  /**
   * Auto-analyze when portfolio changes.
   */
  useEffect(() => {
    analyze();
  }, [analyze]);

  return {
    opportunities,
    isAnalyzing,
    error,
    analyze,
  };
}
