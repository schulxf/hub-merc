import React, { useCallback } from 'react';
import { RefreshCw, RotateCcw, Loader2 } from 'lucide-react';
import { usePortfolioContext } from './PortfolioContext';
import {
  DashboardSecondaryButton,
} from '../ui/DashboardButtons';

/**
 * PortfolioHeader — header for the Portfolio section with design system styling.
 *
 * Renders two action buttons:
 * - Sync: triggers an on-chain wallet balance sync via PortfolioContext
 * - Refresh: manually refreshes prices (delegated to parent via onRefresh)
 *
 * All buttons are disabled while an on-chain sync is in progress.
 * When `readOnly` is true (assessor viewing a client portfolio) the action buttons
 * are hidden and only the title is rendered.
 *
 * @param {object} props
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
        <div className="flex items-center gap-1.5 animate-fade-in">
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
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-medium">Sync</span>
          </DashboardSecondaryButton>

          {/* Refresh prices */}
          <DashboardSecondaryButton
            onClick={onRefresh}
            disabled={isSyncingOnChain}
            title="Atualizar preços manualmente"
            className="flex items-center justify-center gap-1.5 px-3 py-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Refresh</span>
          </DashboardSecondaryButton>
        </div>
      )}
    </>
  );
});

export default PortfolioHeader;
