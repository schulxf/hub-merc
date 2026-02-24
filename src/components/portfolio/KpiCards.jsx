import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
import { fmt } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a dollar amount as "$45,250.00".
 *
 * @param {number} value
 * @returns {string}
 */
function formatUsd(value) {
  return `$${fmt.usd(value)}`;
}

/**
 * Format a percentage with an explicit +/- prefix — e.g. "+5.20%" or "-2.10%".
 *
 * @param {number} value
 * @returns {string}
 */
function formatPct(value) {
  return `${fmt.sign(value)}${fmt.pct(value)}%`;
}

// ---------------------------------------------------------------------------
// Sub-component: a single metric card
// ---------------------------------------------------------------------------

/**
 * KpiCard — renders one metric tile with an icon, title, primary value and
 * an optional secondary label.
 *
 * @param {object}        props
 * @param {React.ReactNode} props.icon         - Lucide icon element
 * @param {string}        props.title          - Card label (e.g. "Valor Total")
 * @param {string}        props.value          - Primary formatted value
 * @param {string}        [props.subLabel]     - Optional secondary line
 * @param {'blue'|'green'|'red'} props.color   - Accent colour variant
 */
const KpiCard = React.memo(function KpiCard({ icon, title, value, subLabel, color }) {
  const colorMap = {
    blue: {
      iconWrapper: 'bg-blue-500/10 border-blue-500/30',
      iconText: 'text-blue-400',
      value: 'text-white',
      sub: 'text-blue-400',
    },
    green: {
      iconWrapper: 'bg-green-500/10 border-green-500/30',
      iconText: 'text-green-400',
      value: 'text-green-400',
      sub: 'text-green-400',
    },
    red: {
      iconWrapper: 'bg-red-500/10 border-red-500/30',
      iconText: 'text-red-400',
      value: 'text-red-400',
      sub: 'text-red-400',
    },
  };

  const tokens = colorMap[color] ?? colorMap.blue;

  return (
    <div className="bg-[#0f1419] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
      {/* Header row: icon + title */}
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tokens.iconWrapper}`}
        >
          <span className={tokens.iconText}>{icon}</span>
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-tight">
          {title}
        </p>
      </div>

      {/* Primary value */}
      <p className={`text-2xl font-extrabold leading-none ${tokens.value}`}>{value}</p>

      {/* Optional secondary label */}
      {subLabel !== undefined && (
        <p className={`text-xs font-semibold ${tokens.sub}`}>{subLabel}</p>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * KpiCards — grid of 3 portfolio summary metric cards.
 *
 * Cards:
 *  1. Total Portfolio Value  — sum(asset.amount * currentPrice), formatted as USD
 *  2. 24h Change             — portfolio-level percentage change over the last 24 hours
 *  3. Yield (ROI)            — ((currentValue - totalInvested) / totalInvested) * 100
 *
 * Consumes PortfolioContext; must be rendered inside <PortfolioProvider>.
 *
 * @returns {React.ReactElement}
 */
const KpiCards = React.memo(function KpiCards() {
  const { portfolioAssets, livePrices } = usePortfolioContext();

  /**
   * Derive all three KPI values in a single memo pass to avoid redundant
   * iteration over the assets array.
   *
   * For the 24h change we use the same derivation strategy as Portfolio.jsx:
   *   price24hAgo = currentPrice / (1 + change24hPct / 100)
   * This avoids the need for a separate historical price endpoint.
   */
  const { totalValue, change24hPct, yieldPct } = useMemo(() => {
    let currentTotal = 0;
    let invested = 0;
    let total24hAgo = 0;

    const assets = Array.isArray(portfolioAssets) ? portfolioAssets : [];
    for (const asset of assets) {
      const priceData = livePrices[asset.coinId] ?? {};
      const currentPrice = typeof priceData.usd === 'number' ? priceData.usd : 0;
      const raw24hChange =
        typeof priceData.usd_24h_change === 'number' ? priceData.usd_24h_change : 0;

      const currentValue = asset.amount * currentPrice;

      // Derive the price 24 h ago from the % change (guard against division by zero)
      const denominator = 1 + raw24hChange / 100;
      const price24hAgo = denominator > 0 ? currentPrice / denominator : currentPrice;
      const value24hAgo = asset.amount * price24hAgo;

      const investedValue = asset.amount * (asset.averageBuyPrice ?? 0);

      currentTotal += currentValue;
      total24hAgo += value24hAgo;
      invested += investedValue;
    }

    // 24h change as a portfolio-level percentage
    const computed24hPct =
      total24hAgo > 0 ? ((currentTotal - total24hAgo) / total24hAgo) * 100 : 0;

    // Yield / ROI
    const computedYieldPct =
      invested > 0 ? ((currentTotal - invested) / invested) * 100 : 0;

    return {
      totalValue: currentTotal,
      change24hPct: computed24hPct,
      yieldPct: computedYieldPct,
    };
  }, [portfolioAssets, livePrices]);

  // Dynamic icon + colour for directional cards
  const change24hPositive = change24hPct >= 0;
  const yieldPositive = yieldPct >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Card 1 — Total Portfolio Value */}
      <KpiCard
        icon={<DollarSign className="w-4 h-4" />}
        title="Valor Total"
        value={formatUsd(totalValue)}
        color="blue"
      />

      {/* Card 2 — 24h Change */}
      <KpiCard
        icon={
          change24hPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )
        }
        title="Variação 24h"
        value={formatPct(change24hPct)}
        color={change24hPositive ? 'green' : 'red'}
      />

      {/* Card 3 — Yield / ROI */}
      <KpiCard
        icon={
          yieldPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )
        }
        title="Rendimento (ROI)"
        value={formatPct(yieldPct)}
        subLabel="vs. preço médio de compra"
        color={yieldPositive ? 'green' : 'red'}
      />
    </div>
  );
});

export default KpiCards;
