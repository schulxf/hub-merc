import React, { useMemo, useState, useEffect } from 'react';
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
import { auth } from '../../lib/firebase';
import { getPortfolioSnapshots } from '../../lib/portfolioSnapshots';
import { usePortfolioContext } from './PortfolioContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Available period filters shown as toggle buttons. */
const PERIODS = ['30D', '90D', '365D'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate mock historical portfolio value data for a given number of days.
 *
 * The series starts at a fixed seed value and applies a random daily variation
 * of ±3.5 % to produce a realistic-looking equity curve. This data is
 * temporary and will be replaced by real Firestore snapshots in a future
 * release.
 *
 * @param {number} days - Total number of historical data points to generate
 * @returns {Array<{ date: string, value: number }>} Array ordered oldest → newest
 */
function generateMockHistoryData(days) {
  const data = [];
  const now = new Date();
  let currentValue = 50000; // fixed seed — keeps the chart stable on re-renders

  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Realistic ±3.5 % daily swing
    const changePercent = (Math.random() - 0.5) * 0.07;
    currentValue = currentValue * (1 + changePercent);

    data.push({
      date: date.toLocaleDateString('pt-PT'),
      value: Math.round(currentValue),
    });
  }

  return data;
}

/**
 * Map a period label to the number of trailing days to display.
 *
 * @param {string} period - One of '30D', '90D', '365D'
 * @returns {number}
 */
function periodToDays(period) {
  if (period === '30D') return 30;
  if (period === '90D') return 90;
  return 365;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ChartAreaEvolution — line chart displaying historical portfolio value.
 *
 * Shows the total portfolio value over the last 30, 90, or 365 days. The
 * displayed period is controlled by toggle buttons in the card header.
 *
 * Data source: Real Firestore snapshots with graceful fallback to mock data
 * if fewer than 2 snapshots exist.
 *
 * Animations are disabled for rendering performance.
 *
 * Consumes `portfolioAssets` and `livePrices` from PortfolioContext; must be
 * rendered inside a <PortfolioProvider> tree.
 *
 * @returns {React.ReactElement}
 */
const ChartAreaEvolution = React.memo(function ChartAreaEvolution() {
  const { portfolioAssets } = usePortfolioContext();
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [snapshots, setSnapshots] = useState([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(true);

  /**
   * Load real portfolio snapshots from Firestore on mount.
   * Attempts to fetch up to 365 days of snapshots.
   * Errors are caught and logged without breaking the UI.
   */
  useEffect(() => {
    async function loadSnapshots() {
      if (!auth.currentUser) {
        setIsLoadingSnapshots(false);
        return;
      }

      try {
        setIsLoadingSnapshots(true);
        const loaded = await getPortfolioSnapshots(auth.currentUser.uid, 365);
        setSnapshots(loaded || []);
      } catch (error) {
        console.error('[ChartAreaEvolution] Erro ao carregar snapshots:', error);
        setSnapshots([]);
      } finally {
        setIsLoadingSnapshots(false);
      }
    }

    loadSnapshots();
  }, []);

  /**
   * Prepare chart data:
   * - If >= 2 real snapshots exist, use them
   * - Otherwise, fallback to mock data
   * Filter by selected period (30D, 90D, 365D).
   */
  const chartData = useMemo(() => {
    const days = periodToDays(selectedPeriod);

    // Use real snapshots if we have at least 2
    if (snapshots.length >= 2) {
      return snapshots
        .slice(-days)
        .map((snapshot) => ({
          date: new Date(snapshot.timestamp).toLocaleDateString('pt-PT'),
          value: Math.round(snapshot.totalValue),
        }));
    }

    // Fallback: mock data
    const allData = generateMockHistoryData(365);
    return allData.slice(-days);
    // portfolioAssets intentionally included so the chart re-seeds when the
    // portfolio changes (future: derive start value from actual totals).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, snapshots, portfolioAssets]);

  return (
    <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-4">
      {/* Card header: title + period toggle buttons */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Evolução do Portfólio
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

      {/* Line chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            // Show a sparse set of ticks to avoid label crowding
            interval="preserveStartEnd"
          />

          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />

          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, 'Valor Total']}
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
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Valor Total"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ChartAreaEvolution;
