import React, { useMemo, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Pencil, Trash2 } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
import { DashboardIconButton } from '../ui/DashboardButtons';
import { fmt } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

/** @typedef {'asset' | 'qty' | 'avgPrice' | 'currentPrice' | 'plDollar' | 'plPercent' | 'allocation'} SortKey */
/** @typedef {'asc' | 'desc'} SortDir */

/**
 * SortIcon — renders the appropriate chevron for a column header.
 *
 * @param {object} props
 * @param {boolean} props.active   - true when this column is the active sort key
 * @param {SortDir} props.dir      - current sort direction
 */
function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
  return dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-cyan" />
    : <ChevronDown className="w-3 h-3 text-cyan" />;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * ColumnHeader — clickable th cell that toggles asc/desc sort.
 */
function ColumnHeader({ label, sortKey, activeKey, dir, onSort, align = 'right' }) {
  const isActive = activeKey === sortKey;
  const textAlign = align === 'left' ? 'text-left' : 'text-right';
  const justifyClass = align === 'left' ? 'justify-start' : 'justify-end';

  return (
    <th
      className={`px-4 py-3 ${textAlign} cursor-pointer select-none`}
      onClick={() => onSort(sortKey)}
    >
      <span
        className={`inline-flex items-center gap-1 ${justifyClass} text-xs font-bold uppercase tracking-widest transition-colors`}
        style={{ color: isActive ? '#00FFEF' : '#6B7280' }}
      >
        {label}
        <SortIcon active={isActive} dir={dir} />
      </span>
    </th>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * AdvancedAssetTable — full portfolio asset table with sorting and row actions.
 *
 * Features:
 *   - Columns: Asset | Qty | Avg Price | Current | P&L $ | P&L % | Alloc %
 *   - Click any header to sort asc/desc
 *   - Click a row to open AssetDetailSlideOver
 *   - Row action buttons: Edit, Delete
 *
 * Must be rendered inside a <PortfolioProvider> tree.
 *
 * @param {object}   props
 * @param {Function} [props.onRowClick]   - Called with the asset when a row is clicked
 * @param {Function} [props.onEditAsset]  - Called with the asset for editing
 * @param {Function} [props.onDeleteAsset] - Called with coinId (string) for deletion
 */
const AdvancedAssetTable = React.memo(function AdvancedAssetTable({
  onRowClick,
  onEditAsset,
  onDeleteAsset,
}) {
  const { portfolioAssets, livePrices, readOnly } = usePortfolioContext();

  // ===== SORT STATE =====
  const [sortKey, setSortKey] = useState('allocation');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = useCallback((key) => {
    setSortDir((prev) => (sortKey === key && prev === 'desc' ? 'asc' : 'desc'));
    setSortKey(key);
  }, [sortKey]);

  // ===== DERIVED DATA =====

  const totalValue = useMemo(() => {
    if (!Array.isArray(portfolioAssets)) return 0;
    return portfolioAssets.reduce((sum, a) => {
      const price = livePrices[a.coinId]?.usd ?? 0;
      return sum + a.amount * price;
    }, 0);
  }, [portfolioAssets, livePrices]);

  const enrichedAssets = useMemo(() => {
    if (!Array.isArray(portfolioAssets)) return [];

    return portfolioAssets.map((asset) => {
      const currentPrice = livePrices[asset.coinId]?.usd ?? 0;
      const avgPrice = asset.averageBuyPrice ?? 0;
      const qty = asset.amount ?? 0;
      const currentValue = qty * currentPrice;
      const invested = qty * avgPrice;
      const plDollar = currentValue - invested;
      const plPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
      const allocation = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

      return {
        ...asset,
        currentPrice,
        currentValue,
        invested,
        plDollar,
        plPercent,
        allocation,
      };
    });
  }, [portfolioAssets, livePrices, totalValue]);

  const sortedAssets = useMemo(() => {
    const sorted = [...enrichedAssets].sort((a, b) => {
      let valA, valB;

      switch (sortKey) {
        case 'asset':
          valA = (a.name ?? a.coinId ?? '').toLowerCase();
          valB = (b.name ?? b.coinId ?? '').toLowerCase();
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);

        case 'qty':        valA = a.amount;      valB = b.amount;      break;
        case 'avgPrice':   valA = a.averageBuyPrice ?? 0; valB = b.averageBuyPrice ?? 0; break;
        case 'currentPrice': valA = a.currentPrice; valB = b.currentPrice; break;
        case 'plDollar':   valA = a.plDollar;     valB = b.plDollar;    break;
        case 'plPercent':  valA = a.plPercent;    valB = b.plPercent;   break;
        case 'allocation': valA = a.allocation;   valB = b.allocation;  break;
        default:           valA = a.allocation;   valB = b.allocation;
      }

      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return sorted;
  }, [enrichedAssets, sortKey, sortDir]);

  // ===== EMPTY STATE =====

  if (!sortedAssets.length) {
    return (
      <div
        className="p-8 text-center animate-fade-in"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          color: '#6B7280',
        }}
      >
        <p className="text-sm font-medium">Nenhum ativo adicionado ao portfolio.</p>
        <p className="text-xs mt-2 text-text-tertiary">Clique em "+ Ativo" para adicionar o primeiro ativo.</p>
      </div>
    );
  }

  // ===== RENDER =====

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
      {/* Accent line */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(0,255,239,0.3), rgba(26,111,212,0.2))',
          zIndex: 1,
        }}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <ColumnHeader
                label="Ativo"
                sortKey="asset"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                align="left"
              />
              <ColumnHeader label="Qtd" sortKey="qty" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColumnHeader label="Preco Medio" sortKey="avgPrice" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColumnHeader label="Preco Atual" sortKey="currentPrice" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColumnHeader label="P&L $" sortKey="plDollar" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColumnHeader label="P&L %" sortKey="plPercent" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <ColumnHeader label="Alocacao" sortKey="allocation" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              {!readOnly && <th className="w-20 px-4 py-3" />}
            </tr>
          </thead>

          <tbody>
            {sortedAssets.map((asset) => (
              <AssetRow
                key={asset.id ?? asset.coinId}
                asset={asset}
                onRowClick={onRowClick}
                onEdit={onEditAsset}
                onDelete={onDeleteAsset}
                readOnly={readOnly}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// AssetRow
// ---------------------------------------------------------------------------

/**
 * AssetRow — a single row inside AdvancedAssetTable.
 *
 * @param {object}   props
 * @param {object}   props.asset       - Enriched asset object
 * @param {Function} [props.onRowClick] - Row click handler
 * @param {Function} [props.onEdit]     - Edit handler
 * @param {Function} [props.onDelete]   - Delete handler
 * @param {boolean}  [props.readOnly]   - Hides action buttons in assessor mode
 */
const AssetRow = React.memo(function AssetRow({ asset, onRowClick, onEdit, onDelete, readOnly }) {
  const isPositive = asset.plDollar >= 0;
  const plColor = isPositive ? '#4ADE80' : '#F87171';
  const coinColor = asset.color ?? '#00FFEF';

  const handleRowClick = useCallback((e) => {
    // Do not trigger row click when action buttons are clicked
    if (e.target.closest('[data-action-btn]')) return;
    onRowClick?.(asset);
  }, [asset, onRowClick]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit?.(asset);
  }, [asset, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete?.(asset.coinId ?? asset.id);
  }, [asset, onDelete]);

  return (
    <tr
      className="group transition-colors duration-150 cursor-pointer"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
      onClick={handleRowClick}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Asset name + symbol */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: `${coinColor}15`, border: `1px solid ${coinColor}25`, color: coinColor }}
          >
            {(asset.symbol ?? asset.coinId ?? '?').slice(0, 3).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary leading-none">{asset.name ?? asset.coinId}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{(asset.symbol ?? '').toUpperCase()}</p>
          </div>
        </div>
      </td>

      {/* Quantity */}
      <td className="px-4 py-4 text-right">
        <span className="font-mono text-sm text-text-primary">
          {asset.amount?.toLocaleString('en-US', { maximumFractionDigits: 8 }) ?? '-'}
        </span>
      </td>

      {/* Avg Price */}
      <td className="px-4 py-4 text-right">
        <span className="font-mono text-sm text-text-secondary">
          ${fmt.usd(asset.averageBuyPrice ?? 0)}
        </span>
      </td>

      {/* Current Price */}
      <td className="px-4 py-4 text-right">
        <span className="font-mono text-sm text-text-primary">
          ${fmt.usd(asset.currentPrice)}
        </span>
      </td>

      {/* P&L $ */}
      <td className="px-4 py-4 text-right">
        <span className="font-mono text-sm font-semibold" style={{ color: plColor }}>
          {isPositive ? '+' : '-'}${fmt.usd(Math.abs(asset.plDollar))}
        </span>
      </td>

      {/* P&L % */}
      <td className="px-4 py-4 text-right">
        <span
          className="text-sm font-bold px-2 py-0.5 rounded-md"
          style={{
            color: plColor,
            background: isPositive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          }}
        >
          {isPositive ? '+' : ''}{fmt.pct(asset.plPercent)}%
        </span>
      </td>

      {/* Allocation */}
      <td className="px-4 py-4 text-right">
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">
            {fmt.pct(asset.allocation)}%
          </span>
          {/* Mini allocation bar */}
          <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, asset.allocation)}%`,
                background: `linear-gradient(to right, ${coinColor}aa, ${coinColor}66)`,
              }}
            />
          </div>
        </div>
      </td>

      {/* Actions */}
      {!readOnly && (
        <td className="px-4 py-4" data-action-btn="true">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" data-action-btn="true">
            <DashboardIconButton
              onClick={handleEdit}
              variant="ghost"
              title={`Editar ${asset.name}`}
              className="w-7 h-7"
              data-action-btn="true"
            >
              <Pencil size={13} className="text-text-secondary" />
            </DashboardIconButton>

            <DashboardIconButton
              onClick={handleDelete}
              variant="ghost"
              title={`Remover ${asset.name}`}
              className="w-7 h-7"
              data-action-btn="true"
            >
              <Trash2 size={13} className="text-red-400" />
            </DashboardIconButton>
          </div>
        </td>
      )}
    </tr>
  );
});

export default AdvancedAssetTable;
