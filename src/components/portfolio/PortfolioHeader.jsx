import React, { useCallback } from 'react';
import { PieChart, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
import {
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardIconButton,
} from '../ui/DashboardButtons';

/**
 * PortfolioHeader — header for the Portfolio section with design system styling.
 *
 * Renders the section title and three action buttons:
 * - Sync: triggers an on-chain wallet balance sync via PortfolioContext
 * - + Ativo: opens the add-asset modal (delegated to parent via onAddAsset)
 * - Refresh: manually refreshes prices (delegated to parent via onRefresh)
 *
 * All buttons are disabled while an on-chain sync is in progress.
 * When `readOnly` is true (assessor viewing a client portfolio) the action buttons
 * are hidden and only the title is rendered.
 *
 * @param {object} props
 * @param {() => void} props.onAddAsset - Called when the user clicks "+ Ativo"
 * @param {() => void} props.onRefresh  - Called when the user clicks the refresh button
 */
const PortfolioHeader = React.memo(function PortfolioHeader({ onAddAsset, onRefresh }) {
  const { isSyncingOnChain, setSyncTrigger, readOnly } = usePortfolioContext();

  /** Triggers an on-chain sync by updating the sync trigger timestamp. */
  const handleSync = useCallback(() => {
    setSyncTrigger(Date.now());
  }, [setSyncTrigger]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
      {/* Title with Icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-dim border border-cyan/30 flex items-center justify-center shadow-cyan">
          <PieChart className="w-5 h-5 text-cyan" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text-primary">Portfólio</h1>
          <p className="text-sm text-text-tertiary">Visão consolidada dos seus ativos</p>
        </div>

        {/* Inline loading indicator while syncing (not shown in read-only mode) */}
        {!readOnly && isSyncingOnChain && (
          <Loader2 className="w-5 h-5 text-cyan animate-spin ml-4" />
        )}
      </div>

      {/* Action buttons — hidden in read-only (assessor) mode */}
      {!readOnly && (
        <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
          {/* Sync on-chain */}
          <DashboardSecondaryButton
            onClick={handleSync}
            disabled={isSyncingOnChain}
            title="Sincronizar saldos on-chain"
            className="flex items-center justify-center gap-2"
          >
            {isSyncingOnChain ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Sync</span>
          </DashboardSecondaryButton>

          {/* Add asset - Primary action */}
          <DashboardPrimaryButton
            onClick={onAddAsset}
            disabled={isSyncingOnChain}
            title="Adicionar novo ativo ao portfólio"
            className="flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ativo</span>
          </DashboardPrimaryButton>

          {/* Refresh prices - Icon button */}
          <DashboardIconButton
            onClick={onRefresh}
            disabled={isSyncingOnChain}
            variant="secondary"
            title="Atualizar preços manualmente"
          >
            <RefreshCw className="w-4 h-4" />
          </DashboardIconButton>
        </div>
      )}
    </div>
  );
});

export default PortfolioHeader;
