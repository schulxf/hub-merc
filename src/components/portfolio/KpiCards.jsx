import React, { useMemo, useRef, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import gsap from 'gsap';
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
 * an optional secondary label. Uses design system styling with GSAP hover effects.
 *
 * @param {object}        props
 * @param {React.ReactNode} props.icon         - Lucide icon element
 * @param {string}        props.title          - Card label (e.g. "Valor Total")
 * @param {string}        props.value          - Primary formatted value
 * @param {string}        [props.subLabel]     - Optional secondary line
 * @param {'cyan'|'positive'|'negative'} props.variant - Accent variant
 */
const KpiCard = React.memo(function KpiCard({ icon, title, value, subLabel, variant = 'cyan' }) {
  const ref = useRef(null);

  useEffect(() => {
    const card = ref.current;
    if (!card) return;

    // Hover effect: subtle lift + glow
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -4,
        boxShadow: variant === 'positive'
          ? '0 16px 40px rgba(34, 197, 94, 0.2)'
          : variant === 'negative'
          ? '0 16px 40px rgba(239, 68, 68, 0.2)'
          : '0 16px 40px rgba(0, 255, 239, 0.2)',
        duration: 0.3,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        duration: 0.3,
      });
    });

    return () => {
      card.removeEventListener('mouseenter', null);
      card.removeEventListener('mouseleave', null);
    };
  }, [variant]);

  const variantClasses = {
    cyan: {
      icon: 'bg-cyan/10 border-cyan/30 text-cyan',
      value: 'text-cyan',
      sub: 'text-cyan/70',
    },
    positive: {
      icon: 'bg-green-500/10 border-green-500/30 text-green-400',
      value: 'text-green-400',
      sub: 'text-green-400/70',
    },
    negative: {
      icon: 'bg-red-500/10 border-red-500/30 text-red-400',
      value: 'text-red-400',
      sub: 'text-red-400/70',
    },
  };

  const tokens = variantClasses[variant] ?? variantClasses.cyan;

  return (
    <div
      ref={ref}
      className="relative overflow-hidden flex flex-col gap-4 animate-fade-in transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '24px',
      }}
    >
      {/* Gradient accent line on top */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '1px',
          background:
            variant === 'positive'
              ? 'linear-gradient(to right, transparent, rgba(34,197,94,0.5), transparent)'
              : variant === 'negative'
              ? 'linear-gradient(to right, transparent, rgba(239,68,68,0.5), transparent)'
              : 'linear-gradient(to right, transparent, rgba(0,255,239,0.5), rgba(26,111,212,0.3))',
        }}
      />

      {/* Header row: icon + title */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${tokens.icon}`}
        >
          {icon}
        </div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest leading-tight">
          {title}
        </p>
      </div>

      {/* Primary value */}
      <p className={`text-3xl font-black leading-none ${tokens.value}`}>{value}</p>

      {/* Optional secondary label */}
      {subLabel !== undefined && (
        <p className={`text-xs font-medium ${tokens.sub}`}>{subLabel}</p>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1 — Total Portfolio Value */}
      <KpiCard
        icon={<DollarSign className="w-5 h-5" />}
        title="Valor Total"
        value={formatUsd(totalValue)}
        variant="cyan"
      />

      {/* Card 2 — 24h Change */}
      <KpiCard
        icon={
          change24hPositive ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )
        }
        title="Variação 24h"
        value={formatPct(change24hPct)}
        variant={change24hPositive ? 'positive' : 'negative'}
      />

      {/* Card 3 — Yield / ROI */}
      <KpiCard
        icon={
          yieldPositive ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )
        }
        title="Rendimento (ROI)"
        value={formatPct(yieldPct)}
        subLabel="vs. preço médio de compra"
        variant={yieldPositive ? 'positive' : 'negative'}
      />
    </div>
  );
});

export default KpiCards;
