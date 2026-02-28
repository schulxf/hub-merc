import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * @typedef {Object} BenchmarkDataPoint
 * @property {string} date - Localised date string (pt-PT format)
 * @property {number} price - Asset price in USD
 */
const BenchmarkDataPointSchema = z.object({
  date: z.string(),
  price: z.number(),
});

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} alpha        - Annualised excess return over benchmark (percentage)
 * @property {number} sharpe       - Sharpe ratio (risk-adjusted return)
 * @property {number} maxDrawdown  - Maximum peak-to-trough decline (percentage)
 * @property {number} volatility   - Annualised standard deviation of returns (percentage)
 */

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Fetch historical daily price data from CoinGecko.
 *
 * Uses the `/coins/{id}/market_chart` endpoint with `interval=daily`.
 * Errors are caught and an empty array is returned so callers can degrade
 * gracefully without breaking the UI.
 *
 * @param {string} coinId - CoinGecko coin ID (e.g. 'bitcoin', 'ethereum')
 * @param {number} [days=30] - Number of trailing days to retrieve
 * @returns {Promise<BenchmarkDataPoint[]>}
 */
export async function fetchBenchmarkData(coinId, days = 30) {
  try {
    const url =
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart` +
      `?vs_currency=usd&days=${days}&interval=daily`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.prices || []).map(([timestamp, price]) => {
      /** @type {BenchmarkDataPoint} */
      const point = {
        date: new Date(timestamp).toLocaleDateString('pt-PT'),
        price: Math.round(price * 100) / 100,
      };
      return BenchmarkDataPointSchema.parse(point);
    });
  } catch (error) {
    console.error('[benchmarkService] Error fetching benchmark:', error);
    return [];
  }
}

/**
 * Calculate key performance metrics comparing portfolio returns to a benchmark.
 *
 * All input arrays must use decimal daily returns (e.g. 0.05 = 5% gain).
 * Both arrays are trimmed to the shorter length so index positions align.
 *
 * Metrics produced:
 * - **Alpha** — annualised excess return relative to the benchmark
 * - **Sharpe** — risk-adjusted return using a 5% annual risk-free rate
 * - **Max Drawdown** — worst peak-to-trough loss experienced
 * - **Volatility** — annualised standard deviation of portfolio returns
 *
 * @param {number[]} portfolioReturns - Daily portfolio returns (decimal)
 * @param {number[]} benchmarkReturns - Daily benchmark returns (decimal)
 * @returns {PerformanceMetrics}
 */
export function calculatePerformanceMetrics(portfolioReturns, benchmarkReturns) {
  // Align both arrays to the shorter of the two
  const len = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const pReturns = portfolioReturns.slice(0, len);
  const bReturns = benchmarkReturns.slice(0, len);

  if (len === 0) {
    return { alpha: 0, sharpe: 0, maxDrawdown: 0, volatility: 0 };
  }

  // --- Averages ---
  const avgPortfolio = pReturns.reduce((a, b) => a + b, 0) / len;
  const avgBenchmark = bReturns.reduce((a, b) => a + b, 0) / len;

  // --- Alpha: annualised excess return ---
  const alpha = (avgPortfolio - avgBenchmark) * 365;

  // --- Sharpe Ratio ---
  const riskFreeRate = 0.05 / 365; // ~5% annual risk-free rate, converted to daily
  const variance =
    pReturns.reduce((sum, r) => sum + Math.pow(r - avgPortfolio, 2), 0) / len;
  const stdDev = Math.sqrt(variance);
  const sharpe =
    stdDev > 0 ? ((avgPortfolio - riskFreeRate) / stdDev) * Math.sqrt(365) : 0;

  // --- Max Drawdown ---
  let peak = -Infinity;
  let maxDrawdown = 0;
  let cumulative = 1;
  for (const r of pReturns) {
    cumulative *= 1 + r;
    if (cumulative > peak) peak = cumulative;
    const drawdown = (peak - cumulative) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // --- Annualised Volatility ---
  const volatility = stdDev * Math.sqrt(365);

  return {
    alpha: Math.round(alpha * 10000) / 100,         // percentage, 2 decimals
    sharpe: Math.round(sharpe * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 10000) / 100, // percentage, 2 decimals
    volatility: Math.round(volatility * 10000) / 100,  // percentage, 2 decimals
  };
}

/**
 * Convert an array of absolute portfolio values into daily percentage returns.
 *
 * Each return is computed as `(value[i] - value[i-1]) / value[i-1]`.
 * If `value[i-1]` is zero the return for that day is treated as 0 to avoid
 * division-by-zero errors.
 *
 * @param {number[]} values - Array of consecutive portfolio values
 * @returns {number[]} Array of daily returns in decimal format (length = values.length - 1)
 */
export function calculateDailyReturns(values) {
  const returns = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    } else {
      returns.push(0);
    }
  }
  return returns;
}
