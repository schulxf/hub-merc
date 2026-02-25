import React, { useCallback } from 'react';
import { auth } from '../lib/firebase';
import { PortfolioProvider } from '../components/portfolio/PortfolioContext';
import { useDashboardData } from '../hooks/useDashboardData';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import HeroCard from '../components/dashboard/HeroCard';
import AlertsSection from '../components/dashboard/AlertsSection';
import NewsGrid from '../components/dashboard/NewsGrid';
import PortfolioOverview from '../components/dashboard/PortfolioOverview';

// ---------------------------------------------------------------------------
// DashboardContent — inner component that consumes PortfolioProvider
// ---------------------------------------------------------------------------

/**
 * DashboardContent — renders the full homepage dashboard UI.
 *
 * Separated from Dashboard so it can call usePortfolioContext()
 * (via useDashboardData) after PortfolioProvider has mounted.
 *
 * @param {object}   props
 * @param {Function} props.onNavigatePortfolio  - Navigate to /portfolio route
 * @param {Function} props.onNavigateReminders  - Navigate to /reminders route
 */
function DashboardContent({ onNavigatePortfolio, onNavigateReminders }) {
  const { totalValue, change24hPct, change24hAbs, isLoading } = useDashboardData();

  // Navigate to portfolio with the add-transaction modal open
  const handleAddTransaction = useCallback(() => {
    if (onNavigatePortfolio) onNavigatePortfolio();
  }, [onNavigatePortfolio]);

  // Display name: first part of email, or a generic fallback
  const userEmail = auth.currentUser?.email ?? '';
  const displayName = userEmail ? userEmail.split('@')[0] : 'Investidor';

  return (
    <div className="animate-fade-in pb-12 px-6 md:px-8 max-w-[1600px] mx-auto relative min-h-screen">

      {/* ── ATMOSPHERIC BACKGROUND ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0" style={{ background: '#07090C' }} />
        <div
          className="absolute rounded-full"
          style={{
            top: '-160px',
            left: '-120px',
            width: '720px',
            height: '720px',
            background: 'radial-gradient(circle, rgba(0,255,239,0.10) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-200px',
            right: '-160px',
            width: '640px',
            height: '640px',
            background: 'radial-gradient(circle, rgba(26,111,212,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(7,9,12,0.55)' }}
        />
      </div>

      {/* ── 1. HEADER ──────────────────────────────────────────────────── */}
      <div className="pt-4">
        <DashboardHeader
          userName={displayName}
          onAddTransaction={handleAddTransaction}
        />
      </div>

      {/* ── 2. HERO CARD ───────────────────────────────────────────────── */}
      <HeroCard
        totalValue={totalValue}
        change24hPct={change24hPct}
        change24hAbs={change24hAbs}
        isLoading={isLoading}
      />

      {/* ── 3. MAIN GRID: Alerts + Portfolio Overview ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-2">

        {/* Alerts — narrower column */}
        <div className="lg:col-span-4">
          <AlertsSection onNavigateReminders={onNavigateReminders} />
        </div>

        {/* Portfolio Winners / Losers — wider column */}
        <div className="lg:col-span-8">
          <PortfolioOverview onNavigatePortfolio={onNavigatePortfolio} />
        </div>
      </div>

      {/* ── 4. NEWS GRID ───────────────────────────────────────────────── */}
      <NewsGrid />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard — page component (public export)
// ---------------------------------------------------------------------------

/**
 * Dashboard — homepage page-level component.
 *
 * Mounts PortfolioProvider (required by useDashboardData and PortfolioOverview),
 * then renders DashboardContent.
 *
 * @param {object}   props
 * @param {Function} [props.onNavigatePortfolio]  - Callback to navigate to Portfolio
 * @param {Function} [props.onNavigateReminders]  - Callback to navigate to Reminders
 */
export default function Dashboard({ onNavigatePortfolio, onNavigateReminders }) {
  return (
    <PortfolioProvider>
      <DashboardContent
        onNavigatePortfolio={onNavigatePortfolio}
        onNavigateReminders={onNavigateReminders}
      />
    </PortfolioProvider>
  );
}
