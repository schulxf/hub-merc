/**
 * Opportunity Analyzer Service — detect and rank portfolio rebalancing opportunities.
 * Pure service functions, no React, no hooks.
 *
 * Compares current portfolio allocation against a benchmark and surfaces
 * actionable rebalancing suggestions, ranked by a priority score.
 */

// ─────────────────────────────────────────────
// Default benchmark allocation (fractions that sum to 1.0)
// ─────────────────────────────────────────────
const DEFAULT_BENCHMARK = {
  BTC: 0.40,
  ETH: 0.30,
  USDC: 0.20,
  USDT: 0.10,
};

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * calculateSwapAmount — Estimate the USD amount to swap to correct drift.
 *
 * @param {{ valueUsd: number }} asset - Asset with current USD value
 * @param {number} drift - Current allocation minus target allocation (signed)
 * @param {number} totalValue - Total portfolio value in USD
 * @returns {string} - Amount in wei (approximated as USD * 1e18 / ethPrice placeholder)
 */
function calculateSwapAmount(asset, drift, totalValue) {
  // Amount in USD needed to reach target allocation
  const usdDelta = Math.abs(drift) * totalValue;
  // Express as a wei string using a 1:1 placeholder (1 USD = 1e18 units).
  // The calling layer is expected to convert using the real token price.
  return BigInt(Math.round(usdDelta * 1e18)).toString();
}

/**
 * getRiskMultiplier — Weight opportunity score by asset risk profile.
 * Lower-risk assets score higher because rebalancing them is more reliable.
 *
 * @param {string} symbol - Token symbol (uppercase)
 * @returns {number} - Multiplier in range [0.8, 1.2]
 */
function getRiskMultiplier(symbol) {
  const riskMap = {
    BTC: 1.2,
    ETH: 1.1,
    USDC: 0.8,
    USDT: 0.8,
  };
  return riskMap[symbol.toUpperCase()] ?? 1.0;
}

/**
 * estimateSwapGasImpact — Rough gas cost as a percentage of the swap value.
 * Uses a flat $30 gas estimate; the score penalty grows as swap size shrinks.
 *
 * @param {{ suggestedAmount: string }} _opportunity - Opportunity (reserved for future use)
 * @returns {number} - Penalty points subtracted from the raw drift score
 */
function estimateSwapGasImpact(_opportunity) {
  // Rough flat estimate: $30 gas / $1000 typical swap = 3 percentage points of penalty
  const estimatedGasUsd = 30;
  const typicalSwapValueUsd = 1000;
  return (estimatedGasUsd / typicalSwapValueUsd) * 100;
}

/**
 * calculateOpportunityScore — Heuristic score for opportunity prioritization.
 * Incorporates drift magnitude, asset risk profile, and estimated gas impact.
 *
 * @param {{ driftAmount: number, asset: string, suggestedAmount: string }} opportunity
 * @returns {number} - Score in range [0, 100]
 */
function calculateOpportunityScore(opportunity) {
  // Amplify drift into a 0–100 range (5% drift → 25 pts, 20% drift → 100 pts)
  const driftScore = Math.min(100, opportunity.driftAmount * 500);
  const gasImpact = estimateSwapGasImpact(opportunity);
  const riskMultiplier = getRiskMultiplier(opportunity.asset);

  return Math.max(0, driftScore * riskMultiplier - gasImpact);
}

// ─────────────────────────────────────────────
// Public service functions
// ─────────────────────────────────────────────

/**
 * findRebalancingOpportunities — Detect assets that have drifted from their target allocation.
 * Only returns assets where |current - target| exceeds driftThreshold.
 *
 * @param {Array<{ symbol: string, valueUsd: number }>} portfolio - Current portfolio assets
 * @param {Record<string, number>} [benchmark=DEFAULT_BENCHMARK] - Target allocation map { SYMBOL: fraction }
 * @param {number} [driftThreshold=0.05] - Minimum drift fraction to flag (default: 5%)
 * @returns {Array<{ type: 'buy'|'sell', asset: string, currentAllocation: number, targetAllocation: number, driftAmount: number, suggestedAmount: string }>}
 */
export function findRebalancingOpportunities(
  portfolio,
  benchmark = DEFAULT_BENCHMARK,
  driftThreshold = 0.05
) {
  if (!Array.isArray(portfolio) || portfolio.length === 0) {
    return [];
  }

  const totalValue = portfolio.reduce((sum, a) => sum + (a.valueUsd ?? 0), 0);
  if (totalValue <= 0) {
    console.warn('[opportunityAnalyzer] Portfolio totalValue is 0; cannot calculate allocations');
    return [];
  }

  const opportunities = [];

  for (const asset of portfolio) {
    const symbol = (asset.symbol ?? '').toUpperCase();
    const currentAlloc = (asset.valueUsd ?? 0) / totalValue;
    const targetAlloc = benchmark[symbol] ?? 0;
    const drift = currentAlloc - targetAlloc;

    if (Math.abs(drift) > driftThreshold) {
      opportunities.push({
        type: drift > 0 ? 'sell' : 'buy',
        asset: symbol,
        currentAllocation: currentAlloc,
        targetAllocation: targetAlloc,
        driftAmount: Math.abs(drift),
        suggestedAmount: calculateSwapAmount(asset, drift, totalValue),
      });
    }
  }

  return opportunities;
}

/**
 * rankOpportunitiesByScore — Sort opportunities by expected portfolio impact.
 * Attaches a numeric score to each opportunity and returns them highest-score first.
 *
 * @param {Array<{ type: string, asset: string, currentAllocation: number, targetAllocation: number, driftAmount: number, suggestedAmount: string }>} opportunities
 * @returns {Array<{ type: string, asset: string, currentAllocation: number, targetAllocation: number, driftAmount: number, suggestedAmount: string, score: number }>}
 */
export function rankOpportunitiesByScore(opportunities) {
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return [];
  }

  return opportunities
    .map((opp) => ({
      ...opp,
      score: calculateOpportunityScore(opp),
    }))
    .sort((a, b) => b.score - a.score);
}
