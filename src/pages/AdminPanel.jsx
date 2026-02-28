import React, { useState, lazy, Suspense } from 'react';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';

// Lazy-loaded tab components — each tab's code is split into its own chunk
// so the browser only downloads what the admin actually navigates to.
const AdminUsersTab = lazy(() => import('../components/admin/AdminUsersTab'));
const AdminPermissionsTab = lazy(() => import('../components/admin/AdminPermissionsTab'));
const AdminAgendaTab = lazy(() => import('../components/admin/AdminAgendaTab'));
const AdminContentTab = lazy(() => import('../components/admin/AdminContentTab'));
const AdminResearchTab = lazy(() => import('../components/admin/AdminResearchTab'));
const AdminStrategyTab = lazy(() => import('../components/admin/AdminStrategyTab'));
const AdminModelPortfolioTab = lazy(() => import('../components/admin/AdminModelPortfolioTab'));
const AdminRecommendationsTab = lazy(() => import('../components/admin/AdminRecommendationsTab'));
const AdminAnalyticsTab = lazy(() => import('../components/admin/AdminAnalyticsTab'));
const AdminSettingsTab = lazy(() => import('../components/admin/AdminSettingsTab'));

/** Fallback shown while a lazy tab chunk is downloading. */
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );
}

/**
 * AdminPanel — Container page for all admin-only features (CMS Dashboard).
 *
 * Architecture:
 * - Vertical sidebar (AdminSidebar) on left for navigation
 * - Main content area on right (flex-1) with scrollable tabs
 * - 10 tabs for complete platform management:
 *   - User Management (enhanced with lastActive, assessorIds)
 *   - Permissions, Calendar
 *   - 5 CMS systems (Content, Research, Strategies, Portfolios, Recommendations)
 *   - Analytics Dashboard (real-time KPIs, charts, trends)
 *   - Platform Settings (feature flags, categories)
 *
 * Lazy-loads each tab component on first visit.
 * Error state is lifted here so every tab can surface errors in one place.
 *
 * Sub-components (all lazy-loaded):
 *   - AdminUsersTab           — user list + tier management + lastActive + assessors
 *   - AdminPermissionsTab     — feature flag / access rules
 *   - AdminAgendaTab          — global calendar events
 *   - AdminContentTab         — airdrop CMS (guides)
 *   - AdminResearchTab        — research documents CMS
 *   - AdminStrategyTab        — investment strategies CMS
 *   - AdminModelPortfolioTab  — model portfolio templates CMS
 *   - AdminRecommendationsTab — assessor recommendations
 *   - AdminAnalyticsTab       — real-time KPIs and platform analytics
 *   - AdminSettingsTab        — feature flags and content categories
 */
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [actionError, setActionError] = useState('');

  const handleError = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(''), 3000);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsersTab onError={handleError} />;
      case 'permissions':
        return <AdminPermissionsTab onError={handleError} />;
      case 'agenda':
        return <AdminAgendaTab onError={handleError} />;
      case 'content':
        return <AdminContentTab onError={handleError} />;
      case 'research':
        return <AdminResearchTab onError={handleError} />;
      case 'strategies':
        return <AdminStrategyTab onError={handleError} />;
      case 'portfolios':
        return <AdminModelPortfolioTab onError={handleError} />;
      case 'recommendations':
        return <AdminRecommendationsTab onError={handleError} />;
      case 'analytics':
        return <AdminAnalyticsTab onError={handleError} />;
      case 'settings':
        return <AdminSettingsTab onError={handleError} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#07090C]">
      {/* Vertical Sidebar Navigation */}
      <AdminSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="animate-in fade-in p-8 pb-24 md:pb-12">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              Painel de Controle Mercurius
            </h1>
            <p className="text-gray-400">Área restrita para gestão da plataforma e clientes.</p>
          </div>

          {/* Global Error Banner */}
          {actionError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{actionError}</p>
            </div>
          )}

          {/* Tab Content — lazy loaded */}
          <Suspense fallback={<TabLoading />}>{renderActiveTab()}</Suspense>
        </div>
      </div>
    </div>
  );
}
