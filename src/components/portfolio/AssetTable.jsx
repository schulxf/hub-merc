import React, { useMemo, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
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
  const { portfolioAssets, livePrices } = usePortfolioContext();

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
      <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
        Nenhum ativo adicionado ao portfólio
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="flex items-center px-4 py-3 bg-gray-700 border-b border-gray-600">
        <div className="flex-1 text-xs font-bold text-gray-400">ATIVO</div>
        <div className="w-20 text-right text-xs font-bold text-gray-400">BALANCE</div>
        <div className="w-24 text-right text-xs font-bold text-gray-400">COMPRA</div>
        <div className="w-24 text-right text-xs font-bold text-gray-400">ATUAL</div>
        <div className="w-32 text-right text-xs font-bold text-gray-400">VALOR USD</div>
        <div className="w-20 text-right text-xs font-bold text-gray-400">RETORNO</div>
        <div className="w-8" aria-hidden="true" />
      </div>

      {/* Asset rows */}
      <div className="max-h-96 overflow-y-auto">
        {sortedAssets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            currentPrice={livePrices?.[asset.coinId]?.usd ?? 0}
            onDelete={() => onDeleteAsset?.(asset.id)}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * AssetRow — single asset row in the table
 */
const AssetRow = React.memo(function AssetRow({ asset, currentPrice, onDelete }) {
  const totalValue = asset.amount * currentPrice;
  const change =
    asset.buyPrice > 0
      ? ((currentPrice - asset.buyPrice) / asset.buyPrice) * 100
      : 0;
  const isPositive = change >= 0;

  return (
    <div className="flex items-center px-4 py-3 bg-gray-800 border-b border-gray-700 hover:bg-gray-750 group transition-colors">
      {/* Name + Symbol */}
      <div className="flex-1 text-sm">
        <div className="text-white font-medium">{asset.name}</div>
        <div className="text-gray-400 text-xs">{asset.symbol}</div>
      </div>

      {/* Balance */}
      <div className="w-20 text-right text-sm text-gray-300">
        {asset.amount.toFixed(6)}
      </div>

      {/* Buy Price */}
      <div className="w-24 text-right text-sm text-gray-300">
        ${fmt.usd(asset.buyPrice)}
      </div>

      {/* Current Price */}
      <div className="w-24 text-right text-sm text-gray-300">
        ${fmt.usd(currentPrice)}
      </div>

      {/* USD Value */}
      <div className="w-32 text-right text-sm text-white font-medium">
        ${fmt.usd(totalValue)}
      </div>

      {/* Return % */}
      <div
        className={`w-20 text-right text-sm font-medium ${
          isPositive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {fmt.sign(change)}{fmt.pct(change)}%
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-900 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
        title={`Remover ${asset.name}`}
        aria-label={`Remover ${asset.name}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});

export default AssetTable;
