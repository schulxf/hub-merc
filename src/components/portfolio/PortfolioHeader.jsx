import React, { useCallback } from 'react';
import { RefreshCw, Plus, Loader2 } from 'lucide-react';
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
    <>
      {/* Action buttons — hidden in read-only (assessor) mode */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-1.5 mb-6 animate-fade-in">
          {/* Sync on-chain */}
          <DashboardSecondaryButton
            onClick={handleSync}
            disabled={isSyncingOnChain}
            title="Sincronizar saldos on-chain"
            className="flex items-center justify-center gap-1.5 px-3 py-2"
          >
            {isSyncingOnChain ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-medium">Sync</span>
          </DashboardSecondaryButton>

          {/* Add asset - Primary action */}
          <DashboardPrimaryButton
            onClick={onAddAsset}
            disabled={isSyncingOnChain}
            title="Adicionar novo ativo ao portfólio"
            className="flex items-center justify-center gap-1.5 px-3 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Ativo</span>
          </DashboardPrimaryButton>

          {/* Refresh prices - Icon button */}
          <DashboardIconButton
            onClick={onRefresh}
            disabled={isSyncingOnChain}
            variant="secondary"
            title="Atualizar preços manualmente"
            className="w-8 h-8"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </DashboardIconButton>
        </div>
      )}
    </>
  );
});

export default PortfolioHeader;
