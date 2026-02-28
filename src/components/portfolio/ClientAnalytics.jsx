import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Activity, ArrowDownRight, BarChart3 } from 'lucide-react';
import { getPortfolioSnapshots } from '../../lib/portfolioSnapshots';
import {
  fetchBenchmarkData,
  calculatePerformanceMetrics,
  calculateDailyReturns,
} from '../../lib/benchmarkService';

// ============================================================================
// Constants
// ============================================================================

/** Period toggle options shown in the card header. */
const PERIODS = ['30D', '90D'];

/**
 * Map a period label to its numeric day count.
 * @param {string} period
 * @returns {number}
 */
function periodToDays(period) {
  return period === '90D' ? 90 : 30;
}

// ============================================================================
// Metric card sub-component
// ============================================================================

/**
 * @typedef {Object} MetricCardProps
 * @property {React.ElementType} icon   - Lucide icon component
 * @property {string}  label            - Short uppercase label
 * @property {string}  value            - Formatted value string
 * @property {boolean} [positive]       - When true → green; false → red; undefined → neutral
 * @property {string}  [tooltip]        - Optional tooltip description
 */

/**
 * MetricCard — single analytics metric displayed in a dark card.
 *
 * @param {MetricCardProps} props
 * @returns {React.ReactElement}
 */
const MetricCard = React.memo(function MetricCard({
  icon: Icon,
  label,
  value,
  positive,
  tooltip,
}) {
  const valueColor =
    positive === true
      ? 'text-green-400'
      : positive === false
      ? 'text-red-400'
      : 'text-gray-100';

  return (
    <div
      className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col gap-2"
      title={tooltip}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />
        <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
    </div>
  );
});

// ============================================================================
// Normalisation helpers
// ============================================================================

/**
 * Normalise an array of numbers to base 100 (index series).
 * The first value becomes 100; subsequent values scale proportionally.
 *
 * @param {number[]} values
 * @returns {number[]}
 */
function normalise(values) {
  if (values.length === 0) return [];
  const base = values[0];
  if (base === 0) return values.map(() => 100);
  return values.map((v) => Math.round((v / base) * 10000) / 100);
}

// ============================================================================
// Main component
// ============================================================================

/**
 * ClientAnalytics — performance comparison between client portfolio and Bitcoin.
 *
 * Displays:
 * 1. Normalised line chart (portfolio vs BTC, both rebased to 100)
 * 2. Four metric cards: Alpha, Sharpe Ratio, Max Drawdown, Volatility
 *
 * Period selector: 30D / 90D tabs.
 * Shows a spinner while data is loading.
 * Shows an empty-state message when fewer than 2 portfolio snapshots exist.
 *
 * @param {object} props
 * @param {string} props.clientUid - Firebase UID of the client whose data to load
 * @returns {React.ReactElement}
 */
const ClientAnalytics = React.memo(function ClientAnalytics({ clientUid }) {
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [snapshots, setSnapshots] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --------------------------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!clientUid) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const days = periodToDays(selectedPeriod);

    async function loadData() {
      setIsLoading(true);
      try {
        // Fire both requests in parallel to keep load time minimal
        const [loadedSnapshots, loadedBenchmark] = await Promise.all([
          getPortfolioSnapshots(clientUid, days),
          fetchBenchmarkData('bitcoin', days),
        ]);

        if (!cancelled) {
          setSnapshots(loadedSnapshots || []);
          setBenchmarkData(loadedBenchmark || []);
        }
      } catch (error) {
        console.error('[ClientAnalytics] Error loading data:', error);
        if (!cancelled) {
          setSnapshots([]);
          setBenchmarkData([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [clientUid, selectedPeriod]);

  // --------------------------------------------------------------------------
  // Derived chart data (normalised series)
  // --------------------------------------------------------------------------

  /**
   * Build the chart dataset:
   * - Align portfolio and benchmark by index position
   * - Normalise both to base 100 for fair visual comparison
   * - Returns array of { date, portfolio, bitcoin }
   *
   * @type {Array<{date: string, portfolio: number, bitcoin: number}>}
   */
  const chartData = useMemo(() => {
    if (snapshots.length < 2 || benchmarkData.length < 2) return [];

    const portfolioValues = snapshots.map((s) => s.totalValue);
    const bitcoinPrices = benchmarkData.map((b) => b.price);

    // Align to the shorter array length
    const len = Math.min(portfolioValues.length, bitcoinPrices.length);
    const alignedPortfolio = portfolioValues.slice(0, len);
    const alignedBitcoin = bitcoinPrices.slice(0, len);

    const normPortfolio = normalise(alignedPortfolio);
    const normBitcoin = normalise(alignedBitcoin);

    // Use snapshot dates as the x-axis labels; fall back to benchmark dates
    return normPortfolio.map((pVal, i) => ({
      date: snapshots[i]?.date ?? benchmarkData[i]?.date ?? '',
      portfolio: pVal,
      bitcoin: normBitcoin[i],
    }));
  }, [snapshots, benchmarkData]);

  // --------------------------------------------------------------------------
  // Performance metrics
  // --------------------------------------------------------------------------

  /**
   * Calculate metrics from daily returns whenever chart data is available.
   *
   * @type {{ alpha: number, sharpe: number, maxDrawdown: number, volatility: number }}
   */
  const metrics = useMemo(() => {
    if (snapshots.length < 2 || benchmarkData.length < 2) {
      return { alpha: 0, sharpe: 0, maxDrawdown: 0, volatility: 0 };
    }

    const portfolioValues = snapshots.map((s) => s.totalValue);
    const bitcoinPrices = benchmarkData.map((b) => b.price);

    const portfolioReturns = calculateDailyReturns(portfolioValues);
    const benchmarkReturns = calculateDailyReturns(bitcoinPrices);

    return calculatePerformanceMetrics(portfolioReturns, benchmarkReturns);
  }, [snapshots, benchmarkData]);

  // --------------------------------------------------------------------------
  // Render states
  // --------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-6 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (snapshots.length < 2) {
    return (
      <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 text-sm">Dados insuficientes para análise</p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Full render
  // --------------------------------------------------------------------------

  return (
    <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-6 space-y-6">
      {/* Header: title + period tabs */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Performance vs Bitcoin
        </h3>

        <div className="flex gap-2">
          {PERIODS.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Normalised performance chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}`}
            domain={['auto', 'auto']}
          />

          <Tooltip
            formatter={(value, name) => [
              `${value.toFixed(2)}`,
              name === 'portfolio' ? 'Portfólio' : 'Bitcoin',
            ]}
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb',
              fontSize: '13px',
            }}
            itemStyle={{ color: '#d1d5db' }}
            labelStyle={{ color: '#ffffff', fontWeight: 600 }}
          />

          <Legend
            wrapperStyle={{ color: '#9ca3af', fontSize: '13px', paddingTop: '8px' }}
            formatter={(value) => (value === 'portfolio' ? 'Portfólio' : 'Bitcoin')}
          />

          <Line
            type="monotone"
            dataKey="portfolio"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="portfolio"
          />

          <Line
            type="monotone"
            dataKey="bitcoin"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="bitcoin"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={TrendingUp}
          label="Alpha"
          value={`${metrics.alpha >= 0 ? '+' : ''}${metrics.alpha}%`}
          positive={metrics.alpha >= 0 ? true : false}
          tooltip="Retorno anualizado em excesso sobre o benchmark (Bitcoin)"
        />

        <MetricCard
          icon={Activity}
          label="Sharpe Ratio"
          value={metrics.sharpe.toFixed(2)}
          positive={metrics.sharpe >= 1 ? true : metrics.sharpe < 0 ? false : undefined}
          tooltip="Retorno ajustado ao risco. Acima de 1 é considerado bom."
        />

        <MetricCard
          icon={ArrowDownRight}
          label="Max Drawdown"
          value={`-${metrics.maxDrawdown}%`}
          positive={false}
          tooltip="Queda máxima de pico a vale durante o período"
        />

        <MetricCard
          icon={BarChart3}
          label="Volatilidade"
          value={`${metrics.volatility}%`}
          positive={undefined}
          tooltip="Desvio padrão anualizado dos retornos diários"
        />
      </div>
    </div>
  );
});

export default ClientAnalytics;
