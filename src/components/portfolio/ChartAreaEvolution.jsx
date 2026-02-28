import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { auth } from '../../lib/firebase';
import { getPortfolioSnapshots } from '../../lib/portfolioSnapshots';
import { usePortfolioContext } from './PortfolioContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERIODS = ['30D', '90D', '365D'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate mock historical portfolio value data for a given number of days.
 * Starts at a fixed seed value so the chart is stable on re-renders.
 *
 * @param {number} days
 * @returns {Array<{ date: string, value: number }>}
 */
function generateMockHistoryData(days) {
  const data = [];
  const now = new Date();
  let currentValue = 50000;

  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const changePercent = (Math.random() - 0.5) * 0.07;
    currentValue = currentValue * (1 + changePercent);
    data.push({
      date: date.toLocaleDateString('pt-PT'),
      value: Math.round(currentValue),
    });
  }

  return data;
}

function periodToDays(period) {
  if (period === '30D') return 30;
  if (period === '90D') return 90;
  return 365;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(7,9,12,0.95)',
        border: '1px solid rgba(0,255,239,0.2)',
        borderRadius: '10px',
        padding: '10px 14px',
        backdropFilter: 'blur(16px)',
      }}
    >
      <p style={{ color: '#6B7280', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: '#E5E7EB', fontSize: '15px', fontWeight: 700 }}>
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ChartAreaEvolution — gradient area chart for portfolio value history.
 *
 * No outer card wrapper — the card is provided by Portfolio.jsx.
 * Includes period toggle buttons internally.
 *
 * @returns {React.ReactElement}
 */
const ChartAreaEvolution = React.memo(function ChartAreaEvolution() {
  const { portfolioAssets } = usePortfolioContext();
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [snapshots, setSnapshots] = useState([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(true);

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

  const chartData = useMemo(() => {
    const days = periodToDays(selectedPeriod);
    if (snapshots.length >= 2) {
      return snapshots.slice(-days).map((s) => ({
        date: new Date(s.timestamp).toLocaleDateString('pt-PT'),
        value: Math.round(s.totalValue),
      }));
    }
    const allData = generateMockHistoryData(365);
    return allData.slice(-days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, snapshots, portfolioAssets]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Period toggle */}
      <div className="flex justify-end">
        <div
          className="flex gap-0.5 p-1 rounded-lg border"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          {PERIODS.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className="px-3 py-1 text-xs font-bold rounded-md transition-all"
              style={{
                background: selectedPeriod === period ? 'rgba(0,255,239,0.12)' : 'transparent',
                color: selectedPeriod === period ? '#00FFEF' : '#6B7280',
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Area chart */}
      <div className="flex-1" style={{ minHeight: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FFEF" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00FFEF" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fill: '#6B7280', fontSize: 10 }}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="transparent"
              tick={{ fill: '#6B7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(0,255,239,0.2)', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#00FFEF"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              dot={false}
              isAnimationActive={false}
              name="Valor Total"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default ChartAreaEvolution;
