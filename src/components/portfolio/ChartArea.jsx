import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { usePortfolioContext } from './PortfolioContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders a custom percentage label inside each pie slice.
 * Skips slices smaller than 6% to avoid clutter.
 */
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="rgba(255,255,255,0.9)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div
      style={{
        background: 'rgba(7,9,12,0.95)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '10px 14px',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: entry.color }}
        />
        <span style={{ color: '#E5E7EB', fontSize: '13px', fontWeight: 600 }}>
          {entry.name}
        </span>
      </div>
      <p style={{ color: '#00FFEF', fontSize: '14px', fontWeight: 700 }}>
        ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ChartArea — Donut chart + horizontal legend showing portfolio allocation.
 *
 * No outer card wrapper — card is provided by Portfolio.jsx.
 * Layout: donut on the left, coin list on the right.
 *
 * @returns {React.ReactElement}
 */
const ChartArea = React.memo(function ChartArea() {
  const { portfolioAssets, livePrices } = usePortfolioContext();

  const chartData = useMemo(() => {
    if (!Array.isArray(portfolioAssets)) return [];
    return portfolioAssets
      .map((asset) => ({
        name: asset.name,
        symbol: asset.symbol,
        value: asset.amount * (livePrices?.[asset.coinId]?.usd ?? 0),
        color: asset.color,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [portfolioAssets, livePrices]);

  const totalValue = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData],
  );

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '160px' }}
      >
        <p style={{ color: '#6B7280', fontSize: '13px' }}>
          Nenhum ativo para exibir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5 w-full">
      {/* Donut chart — fixed width */}
      <div className="shrink-0" style={{ width: '150px' }}>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={70}
              innerRadius={40}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list — scrollable */}
      <div
        className="flex-1 space-y-2 overflow-y-auto"
        style={{ maxHeight: '160px' }}
      >
        {chartData.map((entry) => {
          const pct =
            totalValue > 0
              ? ((entry.value / totalValue) * 100).toFixed(1)
              : '0.0';

          return (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-2 group"
            >
              {/* Dot + name */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="shrink-0 rounded-full"
                  style={{ width: '7px', height: '7px', background: entry.color }}
                />
                <span
                  className="text-xs truncate transition-colors"
                  style={{ color: '#9CA3AF' }}
                >
                  {entry.symbol}
                </span>
              </div>

              {/* Pct + value */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span style={{ color: '#6B7280', fontSize: '11px' }}>{pct}%</span>
                <span style={{ color: '#E5E7EB', fontSize: '12px', fontWeight: 600 }}>
                  {entry.value >= 1000
                    ? `$${(entry.value / 1000).toFixed(1)}k`
                    : `$${entry.value.toFixed(0)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ChartArea;
