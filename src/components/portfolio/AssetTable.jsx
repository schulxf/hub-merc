import React, { useMemo, useCallback } from 'react';
import { List } from 'react-window';
import { Trash2 } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
import { fmt } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Height in pixels of each virtualized row. Must match the rendered row height. */
const ROW_HEIGHT = 50;

/** Height in pixels of the virtualized list viewport. */
const LIST_HEIGHT = 400;

// ---------------------------------------------------------------------------
// Row sub-component (rendered by react-window for each asset)
// ---------------------------------------------------------------------------

/**
 * Row — a single asset row inside the virtualized list.
 *
 * Receives `style` from react-window (absolute positioning) and `data` which
 * carries the full asset array, live prices map, and the delete callback.
 *
 * @param {object} props
 * @param {number}  props.index  - Row index inside the virtualized list
 * @param {object}  props.style  - Inline positioning styles from react-window
 * @param {object}  props.data   - Shared item data: { assets, prices, onDelete }
 */
function Row({ index, style, data }) {
  const asset = data.assets[index];

  // livePrices[coinId] is { usd: number, usd_24h_change: number }
  const priceData = data.prices?.[asset.coinId] ?? {};
  const currentPrice = typeof priceData.usd === 'number' ? priceData.usd : 0;

  const totalValue = asset.amount * currentPrice;

  // Change percentage relative to the recorded buy price
  const change =
    asset.buyPrice > 0
      ? ((currentPrice - asset.buyPrice) / asset.buyPrice) * 100
      : 0;

  const isPositive = change >= 0;

  const handleDelete = useCallback(() => {
    data.onDelete?.(asset.id);
  }, [data, asset.id]);

  return (
    <div
      style={style}
      className="flex items-center px-4 bg-gray-800 border-b border-gray-700 hover:bg-gray-750 group"
    >
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

      {/* Delete button — visible on row hover */}
      <button
        type="button"
        onClick={handleDelete}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-900 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
        title={`Remover ${asset.name}`}
        aria-label={`Remover ${asset.name}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * AssetTable — virtualized table of portfolio assets using react-window.
 *
 * Renders up to 1000+ assets without performance degradation by only mounting
 * DOM nodes for the rows currently visible in the 400px viewport.
 *
 * Assets are sorted by current USD value (descending) so the most significant
 * positions appear at the top.
 *
 * The delete handler logs the asset ID; full integration with Firestore delete
 * will be wired up in Portfolio.jsx during Task 8.
 *
 * Must be rendered inside a <PortfolioProvider> tree.
 *
 * @returns {React.ReactElement}
 */
const AssetTable = React.memo(function AssetTable() {
  const { portfolioAssets, livePrices } = usePortfolioContext();

  // Sort by current USD value descending so highest-value positions come first.
  const sortedAssets = useMemo(() => {
    return [...portfolioAssets].sort((a, b) => {
      const priceA = livePrices[a.coinId]?.usd ?? 0;
      const priceB = livePrices[b.coinId]?.usd ?? 0;
      const valueA = a.amount * priceA;
      const valueB = b.amount * priceB;
      return valueB - valueA;
    });
  }, [portfolioAssets, livePrices]);

  /**
   * Delete handler placeholder.
   * Task 8 will replace this with the actual Firestore delete call
   * passed down from Portfolio.jsx.
   */
  const handleDeleteAsset = useCallback((assetId) => {
    console.log('[AssetTable] Delete asset:', assetId);
  }, []);

  // Stable itemData object passed to every Row via react-window.
  // Keeping this outside JSX prevents row re-renders when the parent re-renders.
  const itemData = useMemo(
    () => ({
      assets: sortedAssets,
      prices: livePrices,
      onDelete: handleDeleteAsset,
    }),
    [sortedAssets, livePrices, handleDeleteAsset],
  );

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

      {/* Virtualized asset rows */}
      <List
        height={LIST_HEIGHT}
        itemCount={sortedAssets.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        itemData={itemData}
      >
        {Row}
      </List>
    </div>
  );
});

export default AssetTable;
