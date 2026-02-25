import React, { useState, lazy, Suspense } from 'react';
import { Users, Shield, Calendar, FileText, AlertTriangle, Loader2 } from 'lucide-react';

// Lazy-loaded tab components — each tab's code is split into its own chunk
// so the browser only downloads what the admin actually navigates to.
const AdminUsersTab = lazy(() => import('../components/admin/AdminUsersTab'));
const AdminPermissionsTab = lazy(() => import('../components/admin/AdminPermissionsTab'));
const AdminAgendaTab = lazy(() => import('../components/admin/AdminAgendaTab'));
const AdminContentTab = lazy(() => import('../components/admin/AdminContentTab'));

const TABS = [
  { id: 'users', label: 'Gestão de Clientes', icon: Users },
  { id: 'permissions', label: 'Permissões de Acesso', icon: Shield },
  { id: 'agenda', label: 'Agenda Global', icon: Calendar },
  { id: 'content', label: 'Conteúdo (Guias)', icon: FileText },
];

/** Fallback shown while a lazy tab chunk is downloading. */
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );
}

/**
 * AdminPanel — Container page for all admin-only features.
 *
 * Renders a tab bar and lazy-loads each tab's component on first visit.
 * Error state is lifted here so every tab can surface errors in one place.
 *
 * Sub-components:
 *   - AdminUsersTab       — user list + tier management
 *   - AdminPermissionsTab — feature flag / access rules
 *   - AdminAgendaTab      — global calendar events
 *   - AdminContentTab     — airdrop CMS (create / edit / delete guides)
 */
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [actionError, setActionError] = useState('');

  const handleError = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(''), 3000);
  };

  return (
    <div className="animate-in fade-in pb-24 md:pb-12 max-w-6xl mx-auto">
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

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800 mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none whitespace-nowrap ${
              activeTab === id
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content — lazy loaded */}
      <Suspense fallback={<TabLoading />}>
        {activeTab === 'users' && <AdminUsersTab onError={handleError} />}
        {activeTab === 'permissions' && <AdminPermissionsTab onError={handleError} />}
        {activeTab === 'agenda' && <AdminAgendaTab onError={handleError} />}
        {activeTab === 'content' && <AdminContentTab onError={handleError} />}
      </Suspense>
    </div>
  );
}
