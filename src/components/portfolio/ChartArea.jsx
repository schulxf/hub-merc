import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { usePortfolioContext } from './PortfolioContext';

/**
 * Renders a custom percentage label positioned at the centroid of each pie slice.
 *
 * Recharts passes geometry props (cx, cy, midAngle, innerRadius, outerRadius,
 * percent) to the label render prop. We compute a point along the midline of the
 * slice at roughly 75 % of the way from the inner to the outer edge so the label
 * sits comfortably inside without overlapping the legend or neighbouring slices.
 *
 * @param {object} props - Label props injected by Recharts
 * @param {number} props.cx - X coordinate of the pie centre
 * @param {number} props.cy - Y coordinate of the pie centre
 * @param {number} props.midAngle - Midpoint angle of the slice in degrees
 * @param {number} props.innerRadius - Inner radius of the donut
 * @param {number} props.outerRadius - Outer radius of the donut
 * @param {number} props.percent - Fraction of the total (0–1)
 * @returns {React.ReactElement | null} SVG text element, or null for tiny slices
 */
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  // Skip labels on slices smaller than 4 % to avoid clutter
  if (percent < 0.04) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

/**
 * ChartArea — Donut chart showing portfolio allocation by coin.
 *
 * Reads `portfolioAssets` and `livePrices` from PortfolioContext, derives each
 * asset's current USD value, and renders a Recharts PieChart (donut variant).
 * Assets with a computed value of zero are excluded from the chart.
 *
 * Performance: data transformation is memoised with `useMemo`; the component
 * itself is wrapped with `React.memo` to prevent unnecessary re-renders when
 * unrelated context values change.
 *
 * @returns {React.ReactElement} Donut chart card or empty-state placeholder
 */
const ChartArea = React.memo(function ChartArea() {
  const { portfolioAssets, livePrices } = usePortfolioContext();

  /**
   * Transform raw portfolio assets into the shape expected by Recharts.
   * Each entry: { name: string, value: number (USD), color: string }
   * Assets without a live price or with zero balance are filtered out.
   *
   * livePrices[coinId] is { usd: number, usd_24h_change: number } — we must
   * read the nested `.usd` field, not use the object itself as a number.
   */
  const chartData = useMemo(() => {
    return portfolioAssets
      .map((asset) => ({
        name: asset.name,
        value: asset.amount * (livePrices[asset.coinId]?.usd ?? 0),
        color: asset.color,
      }))
      .filter((item) => item.value > 0);
  }, [portfolioAssets, livePrices]);

  // Empty state — no assets with a non-zero USD value
  if (chartData.length === 0) {
    return (
      <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-4 flex items-center justify-center h-[400px]">
        <p className="text-gray-500 text-sm">
          Nenhum ativo com valor para exibir no gráfico.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-4">
      {/* Section title */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Alocação do Portfólio
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>

          {/* Tooltip shows coin name and formatted USD value */}
          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, 'Valor']}
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

          {/* Legend below the chart */}
          <Legend
            wrapperStyle={{ color: '#9ca3af', fontSize: '13px', paddingTop: '16px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ChartArea;
