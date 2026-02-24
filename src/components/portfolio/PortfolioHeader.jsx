import React, { useCallback } from 'react';
import { PieChart, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';

/**
 * PortfolioHeader — header for the Portfolio section.
 *
 * Renders the section title and three action buttons:
 * - Sync: triggers an on-chain wallet balance sync via PortfolioContext
 * - + Ativo: opens the add-asset modal (delegated to parent via onAddAsset)
 * - Refresh: manually refreshes prices (delegated to parent via onRefresh)
 *
 * All buttons are disabled while an on-chain sync is in progress.
 *
 * @param {object} props
 * @param {() => void} props.onAddAsset - Called when the user clicks "+ Ativo"
 * @param {() => void} props.onRefresh  - Called when the user clicks the refresh button
 */
const PortfolioHeader = React.memo(function PortfolioHeader({ onAddAsset, onRefresh }) {
  const { isSyncingOnChain, setSyncTrigger } = usePortfolioContext();

  /** Triggers an on-chain sync by updating the sync trigger timestamp. */
  const handleSync = useCallback(() => {
    setSyncTrigger(Date.now());
  }, [setSyncTrigger]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/40 flex items-center justify-center">
          <PieChart className="w-4 h-4 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Portfólio</h1>

        {/* Inline loading indicator while syncing */}
        {isSyncingOnChain && (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
        {/* Sync on-chain */}
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncingOnChain}
          className="bg-[#111] hover:bg-[#181818] disabled:opacity-50 disabled:cursor-not-allowed text-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 select-none"
          title="Sincronizar saldos on-chain"
        >
          {isSyncingOnChain ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : (
            <RefreshCw className="w-4 h-4 text-blue-400" />
          )}
          <span>Sync</span>
        </button>

        {/* Add asset */}
        <button
          type="button"
          onClick={onAddAsset}
          disabled={isSyncingOnChain}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 outline-none focus:ring-2 focus:ring-blue-500 select-none"
          title="Adicionar novo ativo ao portfólio"
        >
          <Plus className="w-4 h-4" />
          <span>+ Ativo</span>
        </button>

        {/* Refresh prices */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isSyncingOnChain}
          className="bg-[#111] hover:bg-[#181818] disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 px-3 py-2.5 rounded-xl transition-colors border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 select-none flex items-center justify-center"
          title="Atualizar preços manualmente"
        >
          <Loader2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default PortfolioHeader;
