import React from 'react';
import { usePortfolioContext } from './PortfolioContext';
import KpiCards from './KpiCards';
import ChartArea from './ChartArea';
import ChartAreaEvolution from './ChartAreaEvolution';
import { fmt } from '../../lib/utils';

/**
 * OverviewTab — Tab 1 of the Portfolio page.
 *
 * Renders:
 *   - KPI cards (total value, 24h change, ROI)
 *   - Evolution line chart (left, 7/12 cols)
 *   - Allocation donut chart + stats (right, 5/12 cols)
 *
 * This component reproduces the existing Portfolio overview visuals exactly,
 * extracted into its own file to keep Portfolio.jsx clean.
 *
 * Must be rendered inside a <PortfolioProvider> tree.
 *
 * @returns {React.ReactElement}
 */
function OverviewTab() {
  const { portfolioAssets, livePrices } = usePortfolioContext();

  // ===== DERIVED METRICS =====

  const totalValue = Array.isArray(portfolioAssets)
    ? portfolioAssets.reduce((sum, asset) => {
        const price = livePrices[asset.coinId]?.usd ?? 0;
        return sum + asset.amount * price;
      }, 0)
    : 0;

  const totalInvestedAmount = Array.isArray(portfolioAssets)
    ? portfolioAssets.reduce((sum, asset) => {
        return sum + asset.amount * (asset.averageBuyPrice ?? 0);
      }, 0)
    : 0;

  const totalProfit = totalValue - totalInvestedAmount;

  const bestAsset = (() => {
    if (!Array.isArray(portfolioAssets) || portfolioAssets.length === 0) return null;

    let best = null;
    let bestRoi = -Infinity;

    for (const asset of portfolioAssets) {
      const invested = asset.amount * (asset.averageBuyPrice ?? 0);
      if (invested <= 0) continue;

      const currentValue = asset.amount * (livePrices[asset.coinId]?.usd ?? 0);
      const roi = ((currentValue - invested) / invested) * 100;

      if (roi > bestRoi) {
        bestRoi = roi;
        best = { symbol: asset.symbol?.toUpperCase() ?? asset.coinId, roi };
      }
    }

    return best;
  })();

  return (
    <div className="animate-fade-in">
      {/* ========== KPI CARDS ========== */}
      <section className="mb-8">
        <KpiCards />
      </section>

      {/* ========== MAIN GRID: 60/40 Charts ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">

        {/* LEFT: Evolution chart (7/12) */}
        <div
          className="lg:col-span-7 relative overflow-hidden flex flex-col animate-fade-in transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '18px',
          }}
        >
          {/* Teal accent line */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(0,255,239,0.55), rgba(26,111,212,0.3))',
              zIndex: 1,
            }}
          />

          <div
            className="flex items-center justify-between px-6 pt-5 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              Evolucao do Patrimonio
            </h3>
          </div>

          <div className="flex-1 px-5 pb-5 pt-4" style={{ minHeight: '320px' }}>
            <ChartAreaEvolution />
          </div>
        </div>

        {/* RIGHT: Allocation + Stats (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-4 animate-fade-in">

          {/* Allocation donut */}
          <div
            className="relative overflow-hidden flex-1 p-5 transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '18px',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(26,111,212,0.5), rgba(0,255,239,0.25))',
                zIndex: 1,
              }}
            />

            <h3
              className="text-sm font-bold mb-4"
              style={{ color: '#E5E7EB', letterSpacing: '-0.01em' }}
            >
              Alocacao de Ativos
            </h3>

            <ChartArea />
          </div>

          {/* Stats 2-col grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Lucro Total */}
            <div
              className="relative overflow-hidden p-4 transition-all duration-300"
              style={{
                background: 'rgba(34,197,94,0.05)',
                border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: '14px',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 pointer-events-none"
                style={{
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.4), transparent)',
                }}
              />
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: '#6B7280' }}
              >
                Lucro Total
              </p>
              <p
                className="text-lg font-black"
                style={{ color: totalProfit >= 0 ? '#4ADE80' : '#F87171' }}
              >
                {totalProfit >= 0 ? '+' : '-'}$
                {fmt.usd(Math.abs(totalProfit))}
              </p>
            </div>

            {/* Melhor Ativo */}
            <div
              className="relative overflow-hidden p-4 transition-all duration-300"
              style={{
                background: 'rgba(0,255,239,0.03)',
                border: '1px solid rgba(0,255,239,0.1)',
                borderRadius: '14px',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 pointer-events-none"
                style={{
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, rgba(0,255,239,0.35), transparent)',
                }}
              />
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: '#6B7280' }}
              >
                Melhor Ativo
              </p>
              {bestAsset ? (
                <p
                  className="text-lg font-black flex items-center gap-2"
                  style={{ color: '#00FFEF' }}
                >
                  {bestAsset.symbol}
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{
                      color: bestAsset.roi >= 0 ? '#4ADE80' : '#F87171',
                      background: bestAsset.roi >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                    }}
                  >
                    {bestAsset.roi >= 0 ? '+' : ''}
                    {fmt.pct(bestAsset.roi)}%
                  </span>
                </p>
              ) : (
                <p className="text-sm font-medium" style={{ color: '#6B7280' }}>-</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
