import React, { useMemo, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
import { DashboardIconButton } from '../ui/DashboardButtons';
import { fmt } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * AssetTable — table of portfolio assets.
 *
 * Renders assets sorted by current USD value (descending).
 *
 * Must be rendered inside a <PortfolioProvider> tree.
 *
 * @param {object}   props
 * @param {Function} [props.onDeleteAsset] - Called with coinId (string) when
 *                                           the user requests deletion of an asset.
 * @returns {React.ReactElement}
 */
const AssetTable = React.memo(function AssetTable({ onDeleteAsset }) {
  const { portfolioAssets, livePrices, readOnly } = usePortfolioContext();

  // Sort by current USD value descending so highest-value positions come first.
  const sortedAssets = useMemo(() => {
    if (!Array.isArray(portfolioAssets)) {
      return [];
    }
    return [...portfolioAssets].sort((a, b) => {
      const priceA = livePrices?.[a.coinId]?.usd ?? 0;
      const priceB = livePrices?.[b.coinId]?.usd ?? 0;
      const valueA = a.amount * priceA;
      const valueB = b.amount * priceB;
      return valueB - valueA;
    });
  }, [portfolioAssets, livePrices]);

  // Empty state
  if (!sortedAssets.length) {
    return (
      <div
        className="p-6 text-center animate-fade-in"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          color: '#6B7280',
        }}
      >
        Nenhum ativo adicionado ao portfólio
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden animate-fade-in"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
      }}
    >
      {/* Gradient accent line on top */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(0,255,239,0.3), rgba(26,111,212,0.2))',
          zIndex: 1,
        }}
      />

      {/* Table header */}
      <div className="flex items-center px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex-1 text-xs font-bold text-text-secondary uppercase tracking-widest">Ativo</div>
        <div className="w-20 text-right text-xs font-bold text-text-secondary uppercase tracking-widest">Balance</div>
        <div className="w-24 text-right text-xs font-bold text-text-secondary uppercase tracking-widest">Compra</div>
        <div className="w-24 text-right text-xs font-bold text-text-secondary uppercase tracking-widest">Atual</div>
        <div className="w-32 text-right text-xs font-bold text-text-secondary uppercase tracking-widest">Valor USD</div>
        <div className="w-20 text-right text-xs font-bold text-text-secondary uppercase tracking-widest">Retorno</div>
        {/* Spacer for delete button column — hidden in read-only mode */}
        {!readOnly && <div className="w-10" aria-hidden="true" />}
      </div>

      {/* Asset rows */}
      <div className="max-h-96 overflow-y-auto">
        {sortedAssets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            currentPrice={livePrices?.[asset.coinId]?.usd ?? 0}
            onDelete={() => onDeleteAsset?.(asset.id)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * AssetRow — single asset row in the table.
 *
 * @param {object}   props
 * @param {object}   props.asset         - Portfolio asset object
 * @param {number}   props.currentPrice  - Live price in USD
 * @param {Function} [props.onDelete]    - Called when delete is clicked
 * @param {boolean}  [props.readOnly]    - When true, hides the delete button
 */
const AssetRow = React.memo(function AssetRow({ asset, currentPrice, onDelete, readOnly }) {
  const totalValue = asset.amount * currentPrice;
  const change =
    asset.buyPrice > 0
      ? ((currentPrice - asset.buyPrice) / asset.buyPrice) * 100
      : 0;
  const isPositive = change >= 0;

  return (
    <div
      className="flex items-center px-6 py-4 transition-colors duration-150 group"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Name + Symbol */}
      <div className="flex-1 text-sm">
        <div className="text-text-primary font-medium">{asset.name}</div>
        <div className="text-text-tertiary text-xs">{asset.symbol}</div>
      </div>

      {/* Balance */}
      <div className="w-20 text-right text-sm text-text-primary">
        {asset.amount.toFixed(6)}
      </div>

      {/* Buy Price */}
      <div className="w-24 text-right text-sm text-text-primary">
        ${fmt.usd(asset.buyPrice)}
      </div>

      {/* Current Price */}
      <div className="w-24 text-right text-sm text-text-primary">
        ${fmt.usd(currentPrice)}
      </div>

      {/* USD Value */}
      <div className="w-32 text-right text-sm text-text-primary font-semibold">
        ${fmt.usd(totalValue)}
      </div>

      {/* Return % */}
      <div
        className={`w-20 text-right text-sm font-semibold ${
          isPositive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {fmt.sign(change)}{fmt.pct(change)}%
      </div>

      {/* Delete button — hidden in read-only (assessor) mode */}
      {!readOnly && (
        <div className="w-10 flex justify-end">
          <DashboardIconButton
            onClick={onDelete}
            variant="ghost"
            title={`Remover ${asset.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={16} className="text-red-400" />
          </DashboardIconButton>
        </div>
      )}
    </div>
  );
});

export default AssetTable;
