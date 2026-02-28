import React, { useMemo, useCallback } from 'react';
import { Trash2, Inbox } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
import { fmt } from '../../lib/utils';

// ---------------------------------------------------------------------------
// AssetItem — memoised row rendered once per portfolio asset.
// ---------------------------------------------------------------------------

/**
 * A single row in the sidebar asset list.
 *
 * Displays the coin icon, name, balance in native units, current USD value,
 * and 24-hour percentage change.  A delete button fades in on hover.
 *
 * @param {object}   props
 * @param {object}   props.asset          - Enriched asset object (see PortfolioSidebar)
 * @param {Function} props.onDelete       - Called with asset.coinId when the delete button is clicked
 * @param {boolean}  [props.readOnly]     - When true, hides the delete button
 */
const AssetItem = React.memo(function AssetItem({ asset, onDelete, readOnly }) {
  const handleDelete = useCallback(
    (e) => {
      // Stop propagation so a future click-to-select handler is not triggered
      e.stopPropagation();
      onDelete(asset.coinId);
    },
    [asset.coinId, onDelete],
  );

  const isPositiveChange = asset.change24h >= 0;

  return (
    <li className="group relative flex items-center gap-3 p-4 border-b border-gray-800 hover:bg-[#151515] transition-colors cursor-default select-none">
      {/* Coin icon — coloured circle with the first letter of the ticker */}
      <div
        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs"
        style={{ backgroundColor: asset.color || '#6366F1' }}
        aria-hidden="true"
      >
        {asset.symbol?.[0] ?? '?'}
      </div>

      {/* Name + balance row */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white truncate">{asset.name}</span>
          <span className="text-xs text-gray-400 font-mono shrink-0">
            {asset.amount} {asset.symbol}
          </span>
        </div>

        {/* USD value + 24 h change */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-gray-400">
            ${fmt.usd(asset.currentValue)}
          </span>
          <span
            className={`text-xs font-semibold ${
              isPositiveChange ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {fmt.sign(asset.change24h)}{fmt.pct(asset.change24h)}%
          </span>
        </div>
      </div>

      {/* Delete button — visible on group hover only; hidden in read-only mode */}
      {!readOnly && (
        <button
          type="button"
          onClick={handleDelete}
          title={`Remove ${asset.name}`}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            opacity-0 group-hover:opacity-100
            p-1.5 rounded-lg
            text-red-500 hover:text-white hover:bg-red-500
            transition-all duration-150
            outline-none focus:opacity-100 focus:ring-2 focus:ring-red-500
          "
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </li>
  );
});

// ---------------------------------------------------------------------------
// PortfolioSidebar — main export
// ---------------------------------------------------------------------------

/**
 * PortfolioSidebar — left panel displaying a scrollable list of portfolio assets.
 *
 * Pulls `portfolioAssets` and `livePrices` from `PortfolioContext` and enriches
 * each asset with its current USD value and 24-hour change percentage before
 * rendering.  Assets are sorted descending by current USD value.
 *
 * The `onDeleteAsset` prop delegates deletion to the parent so this component
 * stays free of Firestore dependencies and remains easily testable.
 *
 * @param {object}   props
 * @param {Function} props.onDeleteAsset  - Called with coinId (string) when the
 *                                          user confirms deletion of an asset
 */
const PortfolioSidebar = React.memo(function PortfolioSidebar({ onDeleteAsset }) {
  const { portfolioAssets, livePrices, readOnly } = usePortfolioContext();

  /**
   * Enrich raw Firestore assets with live price data, then sort by USD value
   * (highest first) so the most valuable holdings appear at the top.
   */
  const enrichedAssets = useMemo(() => {
    const assets = Array.isArray(portfolioAssets) ? portfolioAssets : [];
    return assets
      .map((asset) => {
        const liveData = livePrices?.[asset.coinId] ?? {
          usd: asset.averageBuyPrice ?? 0,
          usd_24h_change: 0,
        };

        const currentPrice = liveData.usd ?? 0;
        const currentValue = asset.amount * currentPrice;
        const change24h =
          typeof liveData.usd_24h_change === 'number' ? liveData.usd_24h_change : 0;

        return { ...asset, currentPrice, currentValue, change24h };
      })
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [portfolioAssets, livePrices]);

  /** Stable delete callback forwarded to each AssetItem. */
  const handleDelete = useCallback(
    (coinId) => {
      onDeleteAsset?.(coinId);
    },
    [onDeleteAsset],
  );

  return (
    <aside
      className="
        w-[280px] shrink-0
        bg-[#0f1419] border-r border-gray-800
        flex flex-col
        overflow-hidden
      "
      aria-label="Asset list"
    >
      {/* Sidebar header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
          Ativos
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {enrichedAssets.length} {enrichedAssets.length === 1 ? 'ativo' : 'ativos'}
        </p>
      </div>

      {/* Scrollable asset list */}
      <ul className="flex-1 overflow-y-auto" role="list">
        {enrichedAssets.length === 0 ? (
          /* Empty state */
          <li className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
            <Inbox className="w-8 h-8 text-gray-700" aria-hidden="true" />
            <p className="text-xs text-gray-500">
              Nenhum ativo no portfólio.
              <br />
              Clique em &ldquo;+ Ativo&rdquo; para começar.
            </p>
          </li>
        ) : (
          enrichedAssets.map((asset) => (
            <AssetItem key={asset.id} asset={asset} onDelete={handleDelete} readOnly={readOnly} />
          ))
        )}
      </ul>
    </aside>
  );
});

export default PortfolioSidebar;
