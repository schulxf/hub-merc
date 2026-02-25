import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fmt } from '../../lib/utils';

/**
 * HeroCard — prominent card displaying total portfolio value and 24h evolution.
 *
 * Shows:
 *   - Total patrimônio in BRL-style formatting (R$)
 *   - 24h evolution as percentage and absolute value (green/red)
 *   - Status badge ("Em Alta" or "Em Queda")
 *
 * @param {object}  props
 * @param {number}  props.totalValue  - Total portfolio value in USD
 * @param {number}  props.change24hPct - 24h percentage change (positive or negative)
 * @param {number}  props.change24hAbs - 24h absolute change in USD
 * @param {boolean} props.isLoading    - Whether data is still loading
 */
const HeroCard = React.memo(function HeroCard({
  totalValue = 0,
  change24hPct = 0,
  change24hAbs = 0,
  isLoading = false,
}) {
  const isPositive = change24hPct >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-6 animate-fade-in"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top accent gradient line */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '1px',
          background: isPositive
            ? 'linear-gradient(to right, transparent, rgba(34,197,94,0.6), transparent)'
            : 'linear-gradient(to right, transparent, rgba(239,68,68,0.6), transparent)',
        }}
      />

      {/* Atmospheric orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          background: isPositive
            ? 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Left: main values */}
        <div>
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
            Patrimônio Total
          </p>

          {isLoading ? (
            <div className="h-14 w-64 bg-white/5 rounded-xl animate-pulse mb-3" />
          ) : (
            <h2
              className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter leading-none mb-3"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              ${fmt.usd(totalValue)}
            </h2>
          )}

          {/* 24h evolution */}
          {isLoading ? (
            <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-base font-bold flex items-center gap-1.5"
                style={{ color: isPositive ? '#4ADE80' : '#F87171' }}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {fmt.sign(change24hPct)}{fmt.pct(change24hPct)}%
              </span>
              <span className="text-sm font-medium" style={{ color: isPositive ? '#4ADE80' : '#F87171' }}>
                ({fmt.sign(change24hAbs)}${fmt.usd(Math.abs(change24hAbs))})
              </span>
              <span className="text-xs text-text-tertiary font-medium">nas últimas 24h</span>
            </div>
          )}
        </div>

        {/* Right: status badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl self-start md:self-auto"
          style={{
            background: isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isPositive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {isPositive ? (
            <TrendingUp className="w-5 h-5" style={{ color: '#4ADE80' }} />
          ) : (
            <TrendingDown className="w-5 h-5" style={{ color: '#F87171' }} />
          )}
          <span
            className="text-sm font-bold"
            style={{ color: isPositive ? '#4ADE80' : '#F87171' }}
          >
            {isPositive ? 'Em Alta' : 'Em Queda'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default HeroCard;
