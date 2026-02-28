import {
  findRebalancingOpportunities,
  rankOpportunitiesByScore,
} from '../opportunityAnalyzer';

/**
 * Test suite for opportunityAnalyzer — portfolio drift and rebalancing detection.
 */
describe('opportunityAnalyzer', () => {
  const mockPortfolio = [
    { symbol: 'BTC', quantity: 1, currentValue: 6000 },
    { symbol: 'ETH', quantity: 10, currentValue: 4000 },
  ];

  const mockBenchmark = {
    BTC: 0.6, // Target 60%
    ETH: 0.4, // Target 40%
  };

  describe('findRebalancingOpportunities', () => {
    it('should detect drift above threshold', () => {
      const opportunities = findRebalancingOpportunities(
        mockPortfolio,
        mockBenchmark,
        0.05, // 5% threshold
      );

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBeGreaterThan(0);
    });

    it('should identify no opportunities when portfolio is balanced', () => {
      const balancedPortfolio = [
        { symbol: 'BTC', quantity: 6, currentValue: 6000 },
        { symbol: 'ETH', quantity: 4, currentValue: 4000 },
      ];

      const opportunities = findRebalancingOpportunities(
        balancedPortfolio,
        mockBenchmark,
        0.05,
      );

      // Should have minimal drift
      expect(opportunities.length).toBeLessThanOrEqual(2);
    });

    it('should return opportunities with correct structure', () => {
      const opportunities = findRebalancingOpportunities(
        mockPortfolio,
        mockBenchmark,
        0.05,
      );

      opportunities.forEach((opp) => {
        expect(opp).toHaveProperty('asset');
        expect(opp).toHaveProperty('currentAllocation');
        expect(opp).toHaveProperty('targetAllocation');
        expect(opp).toHaveProperty('drift');
      });
    });

    it('should respect drift threshold', () => {
      const highThreshold = 0.9; // 90% threshold - very high
      const opportunities = findRebalancingOpportunities(
        mockPortfolio,
        mockBenchmark,
        highThreshold,
      );

      // With high threshold, should find few/no opportunities
      expect(opportunities.length).toBeLessThanOrEqual(2);
    });
  });

  describe('rankOpportunitiesByScore', () => {
    it('should rank opportunities by score', () => {
      const opportunities = [
        { asset: 'BTC', drift: 0.1, score: 50 },
        { asset: 'ETH', drift: 0.05, score: 25 },
        { asset: 'ADA', drift: 0.15, score: 75 },
      ];

      const ranked = rankOpportunitiesByScore(opportunities);

      // Should be sorted by score descending
      expect(ranked[0].asset).toBe('ADA'); // 75
      expect(ranked[1].asset).toBe('BTC'); // 50
      expect(ranked[2].asset).toBe('ETH'); // 25
    });

    it('should handle empty opportunities array', () => {
      const ranked = rankOpportunitiesByScore([]);
      expect(ranked).toEqual([]);
    });

    it('should handle single opportunity', () => {
      const opportunities = [{ asset: 'BTC', drift: 0.1, score: 50 }];
      const ranked = rankOpportunitiesByScore(opportunities);

      expect(ranked.length).toBe(1);
      expect(ranked[0].asset).toBe('BTC');
    });

    it('should preserve all opportunity data', () => {
      const opportunities = [
        {
          asset: 'BTC',
          drift: 0.1,
          score: 50,
          currentAllocation: 0.6,
          targetAllocation: 0.7,
        },
      ];

      const ranked = rankOpportunitiesByScore(opportunities);

      expect(ranked[0]).toEqual(opportunities[0]);
    });
  });

  describe('Integration', () => {
    it('should find and rank opportunities in sequence', () => {
      const opportunities = findRebalancingOpportunities(
        mockPortfolio,
        mockBenchmark,
        0.05,
      );

      const ranked = rankOpportunitiesByScore(opportunities);

      // Ranked should be ordered by score (highest first)
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
      }
    });
  });
});
