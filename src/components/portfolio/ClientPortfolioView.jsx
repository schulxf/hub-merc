import React from 'react';
import { Eye } from 'lucide-react';

import { PortfolioProvider, usePortfolioContext } from './PortfolioContext';
import KpiCards from './KpiCards';
import ChartArea from './ChartArea';
import ChartAreaEvolution from './ChartAreaEvolution';
import AssetTable from './AssetTable';
import ClientAnalytics from './ClientAnalytics';

// ---------------------------------------------------------------------------
// ClientPortfolioContent — inner component; consumes PortfolioContext
// ---------------------------------------------------------------------------

/**
 * ClientPortfolioContent — renders the read-only portfolio view.
 *
 * Must be used inside a <PortfolioProvider> tree.
 *
 * @param {object} props
 * @param {string} [props.clientEmail] - Client email shown in the banner
 * @param {string} [props.clientName]  - Client display name shown in the banner
 * @param {string} [props.clientUid]   - Client UID forwarded to ClientAnalytics
 * @returns {React.ReactElement}
 */
const ClientPortfolioContent = React.memo(function ClientPortfolioContent({
  clientEmail,
  clientName,
  clientUid,
}) {
  const { isLoading } = usePortfolioContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  /** Display label: prefer displayName, fall back to email, then a generic label. */
  const displayLabel = clientName || clientEmail || 'cliente';

  return (
    <div className="space-y-6">
      {/* Read-only banner */}
      <div className="flex items-center gap-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300">
        <Eye className="w-4 h-4 shrink-0 text-blue-400" aria-hidden="true" />
        <span>
          Visualizando portfólio de{' '}
          <span className="font-semibold text-blue-200">{displayLabel}</span>
        </span>
      </div>

      {/* KPI metric cards */}
      <KpiCards />

      {/* Charts side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartArea />
        <ChartAreaEvolution />
      </div>

      {/* Asset table (delete column hidden via readOnly from context) */}
      <AssetTable />

      {/* Performance analytics vs Bitcoin benchmark */}
      <ClientAnalytics clientUid={clientUid} />
    </div>
  );
});

// ---------------------------------------------------------------------------
// ClientPortfolioView — public export
// ---------------------------------------------------------------------------

/**
 * ClientPortfolioView — renders a client's portfolio in read-only mode.
 *
 * Used by assessors to view client portfolios without being able to
 * add, edit, or delete any assets.
 *
 * Wraps content in a PortfolioProvider with `clientUid` so all Firestore
 * queries target the client's data rather than the logged-in assessor's.
 *
 * @param {object} props
 * @param {string}  props.clientUid    - The client's Firebase UID
 * @param {string}  [props.clientEmail] - Client email for the read-only banner
 * @param {string}  [props.clientName]  - Client display name for the read-only banner
 * @returns {React.ReactElement}
 */
const ClientPortfolioView = React.memo(function ClientPortfolioView({
  clientUid,
  clientEmail,
  clientName,
}) {
  if (!clientUid) {
    return (
      <div className="bg-[#111] border border-dashed border-gray-700 rounded-2xl p-10 flex items-center justify-center text-center">
        <p className="text-gray-500 text-sm">Nenhum cliente selecionado.</p>
      </div>
    );
  }

  return (
    <PortfolioProvider clientUid={clientUid}>
      <ClientPortfolioContent
        clientEmail={clientEmail}
        clientName={clientName}
        clientUid={clientUid}
      />
    </PortfolioProvider>
  );
});

export default ClientPortfolioView;
