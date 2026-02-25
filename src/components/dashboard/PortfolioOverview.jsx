import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { usePortfolioContext } from '../portfolio/PortfolioContext';
import { fmt } from '../../lib/utils';

// ---------------------------------------------------------------------------
// AssetRow — single row for winners / losers table
// ---------------------------------------------------------------------------

/**
 * AssetRow — displays one asset with its 24h P&L percentage.
 *
 * @param {object}  props
 * @param {string}  props.name        - Asset display name
 * @param {string}  props.symbol      - Ticker symbol (uppercase)
 * @param {number}  props.pnlPct      - 24h P&L percentage
 * @param {number}  props.value       - Current value in USD
 * @param {boolean} props.isWinner    - true → green badge, false → red badge
 */
function AssetRow({ name, symbol, pnlPct, value, isWinner }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 group"
      style={{
        background: isWinner ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
        border: `1px solid ${isWinner ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
      }}
    >
      {/* Symbol badge */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
        style={{
          background: isWinner ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: isWinner ? '#4ADE80' : '#F87171',
        }}
      >
        {symbol.slice(0, 3)}
      </div>

      {/* Name + value */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-primary truncate">{name}</p>
        <p className="text-xs text-text-tertiary font-mono">${fmt.usd(value)}</p>
      </div>

      {/* P&L badge */}
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg flex-shrink-0"
        style={{
          background: isWinner ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        }}
      >
        {isWinner ? (
          <TrendingUp className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" style={{ color: '#F87171' }} />
        )}
        <span
          className="text-xs font-bold"
          style={{ color: isWinner ? '#4ADE80' : '#F87171' }}
        >
          {fmt.sign(pnlPct)}{fmt.pct(pnlPct)}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PortfolioOverview — main export
// ---------------------------------------------------------------------------

/**
 * PortfolioOverview — shows the top 3 winners and top 3 losers from the
 * current portfolio based on 24h price change.
 *
 * Must be rendered inside a <PortfolioProvider> tree.
 *
 * @param {object}   props
 * @param {Function} [props.onNavigatePortfolio] - Navigate to full Portfolio page
 */
const PortfolioOverview = React.memo(function PortfolioOverview({ onNavigatePortfolio }) {
  const { portfolioAssets, livePrices, isLoading } = usePortfolioContext();

  /**
   * Derive P&L % per asset (24h) from live prices, then split into
   * winners (sorted desc) and losers (sorted asc by pnlPct).
   */
  const { winners, losers } = useMemo(() => {
    if (!Array.isArray(portfolioAssets) || portfolioAssets.length === 0) {
      return { winners: [], losers: [] };
    }

    const ranked = portfolioAssets
      .map((asset) => {
        const priceData = livePrices[asset.coinId] ?? {};
        const currentPrice = typeof priceData.usd === 'number' ? priceData.usd : 0;
        const raw24hChange =
          typeof priceData.usd_24h_change === 'number' ? priceData.usd_24h_change : 0;
        const currentValue = asset.amount * currentPrice;

        return {
          name: asset.name || asset.coinId,
          symbol: (asset.symbol || asset.coinId).toUpperCase(),
          pnlPct: raw24hChange,
          value: currentValue,
        };
      })
      .filter((a) => a.value > 0); // exclude zero-value assets

    const sorted = [...ranked].sort((a, b) => b.pnlPct - a.pnlPct);

    return {
      winners: sorted.filter((a) => a.pnlPct >= 0).slice(0, 3),
      losers: sorted
        .filter((a) => a.pnlPct < 0)
        .reverse()
        .slice(0, 3),
    };
  }, [portfolioAssets, livePrices]);

  return (
    <section className="mb-6 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text-primary">Visão do Portfólio</h3>
        {onNavigatePortfolio && (
          <button
            onClick={onNavigatePortfolio}
            className="flex items-center gap-1 text-xs font-medium text-text-tertiary hover:text-cyan transition-colors outline-none focus:ring-2 focus:ring-cyan/50 rounded"
          >
            Ver portfólio completo
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                height: '200px',
              }}
            />
          ))}
        </div>
      ) : portfolioAssets.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-sm text-text-tertiary mb-1">Portfólio vazio</p>
          <p className="text-xs text-text-muted">Adicione ativos para ver o ranking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Winners */}
          <div
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Accent line */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.5), transparent)',
              }}
            />
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider">
                Top Ganhos
              </h4>
            </div>

            {winners.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">Sem ganhos nas últimas 24h</p>
            ) : (
              <div className="space-y-2">
                {winners.map((asset) => (
                  <AssetRow key={asset.symbol} {...asset} isWinner={true} />
                ))}
              </div>
            )}
          </div>

          {/* Losers */}
          <div
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Accent line */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(239,68,68,0.5), transparent)',
              }}
            />
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Top Perdas
              </h4>
            </div>

            {losers.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">Sem perdas nas últimas 24h</p>
            ) : (
              <div className="space-y-2">
                {losers.map((asset) => (
                  <AssetRow key={asset.symbol} {...asset} isWinner={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

export default PortfolioOverview;
