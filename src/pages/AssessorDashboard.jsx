// src/pages/AssessorDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Search, Shield, ArrowLeft, Loader2, UserX } from 'lucide-react';

import { useAuthRole } from '../hooks/useAuthRole';
import { getAssessorClients } from '../lib/assessorService';
import { auth } from '../lib/firebase';
import PrivacyModeToggle from '../components/auth/PrivacyModeToggle';
import ClientCard from '../components/dashboard/ClientCard';
import ClientPortfolioView from '../components/portfolio/ClientPortfolioView';

// ---------------------------------------------------------------------------
// AccessDenied — shown when the user does not have the assessor/admin role
// ---------------------------------------------------------------------------

/**
 * AccessDenied — full-page message for unauthorised access attempts.
 *
 * @returns {React.ReactElement}
 */
const AccessDenied = React.memo(function AccessDenied() {
  return (
    <div className="animate-in fade-in flex flex-col items-center justify-center py-20 px-4 text-center mt-8">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
        <Shield className="w-9 h-9 text-red-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-white mb-3">Acesso Restrito</h2>
      <p className="text-gray-400 max-w-md text-base">
        Esta área é exclusiva para consultores e administradores. Contacte a equipa de suporte se
        julgar que deveria ter acesso.
      </p>
    </div>
  );
});

// ---------------------------------------------------------------------------
// ClientListSection — search input + cards grid
// ---------------------------------------------------------------------------

/**
 * ClientListSection — search bar and responsive card grid.
 *
 * @param {object} props
 * @param {import('../schemas/userProfile.schema').AssessorClient[]} props.clients
 * @param {string} props.searchTerm
 * @param {(term: string) => void} props.onSearchChange
 * @param {(uid: string) => void} props.onSelectClient
 * @returns {React.ReactElement}
 */
const ClientListSection = React.memo(function ClientListSection({
  clients,
  searchTerm,
  onSearchChange,
  onSelectClient,
}) {
  const handleSearchInput = useCallback(
    (e) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange],
  );

  return (
    <div className="animate-in fade-in space-y-5">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="search"
          value={searchTerm}
          onChange={handleSearchInput}
          placeholder="Pesquisar por nome ou email…"
          className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Grid */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserX className="w-10 h-10 text-gray-700 mb-4" />
          <p className="text-gray-500 font-semibold">Nenhum cliente atribuído</p>
          {searchTerm && (
            <p className="text-gray-600 text-sm mt-1">
              Sem resultados para &ldquo;{searchTerm}&rdquo;
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.uid}
              client={client}
              onSelect={onSelectClient}
              isSelected={false}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// ClientDetailSection — back button + client info bar + portfolio placeholder
// ---------------------------------------------------------------------------

/**
 * ClientDetailSection — header and portfolio viewer for a selected client.
 *
 * @param {object} props
 * @param {import('../schemas/userProfile.schema').AssessorClient} props.client
 * @param {() => void} props.onBack
 * @returns {React.ReactElement}
 */
const ClientDetailSection = React.memo(function ClientDetailSection({ client, onBack }) {
  return (
    <div className="animate-in fade-in space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-1 -ml-1 select-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à lista
      </button>

      {/* Client info header bar */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 flex flex-wrap items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-300 font-bold text-base">
            {(client.displayName || client.email || '?')[0].toUpperCase()}
          </span>
        </div>

        {/* Name / email */}
        <div className="flex-1 min-w-0">
          {client.displayName && (
            <p className="font-semibold text-white leading-tight truncate">{client.displayName}</p>
          )}
          <p className={`text-sm text-gray-400 truncate ${!client.displayName ? 'font-semibold text-white' : ''}`}>
            {client.email}
          </p>
        </div>

        {/* Tier badge */}
        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold capitalize flex-shrink-0">
          {client.tier}
        </span>
      </div>

      {/* Client portfolio in read-only mode */}
      <ClientPortfolioView
        clientUid={client.uid}
        clientEmail={client.email}
        clientName={client.displayName}
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// AssessorDashboard — page-level component (public export)
// ---------------------------------------------------------------------------

/**
 * AssessorDashboard — main assessor page.
 *
 * Shows a list of assigned clients and allows the assessor to drill into
 * a client's portfolio view. Access is gated to users with role 'assessor'
 * or 'admin'.
 *
 * @returns {React.ReactElement}
 */
export default function AssessorDashboard() {
  const { role, isLoading: isRoleLoading } = useAuthRole();

  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClientUid, setSelectedClientUid] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAuthorised = role === 'assessor' || role === 'admin';

  // Load clients once the role is resolved and the user is authorised
  useEffect(() => {
    if (isRoleLoading || !isAuthorised) return;

    const assessorUid = auth.currentUser?.uid;
    if (!assessorUid) return;

    let cancelled = false;

    setIsLoadingClients(true);
    getAssessorClients(assessorUid)
      .then((data) => {
        if (!cancelled) setClients(data);
      })
      .catch((err) => {
        console.error('[AssessorDashboard] Failed to load clients:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingClients(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isRoleLoading, isAuthorised]);

  // Filter clients by searchTerm against email and displayName
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.email.toLowerCase().includes(lower) ||
        (c.displayName && c.displayName.toLowerCase().includes(lower)),
    );
  }, [clients, searchTerm]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.uid === selectedClientUid) ?? null,
    [clients, selectedClientUid],
  );

  const handleSelectClient = useCallback((uid) => {
    setSelectedClientUid(uid);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedClientUid(null);
  }, []);

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // ===== LOADING ROLE =====
  if (isRoleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ===== RBAC GATE =====
  if (!isAuthorised) {
    return <AccessDenied />;
  }

  // ===== RENDER =====
  return (
    <div className="animate-in fade-in space-y-6 pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Painel de Consultoria</h2>
        </div>
        <PrivacyModeToggle />
      </div>

      {/* Loading clients */}
      {isLoadingClients ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
        </div>
      ) : selectedClient ? (
        <ClientDetailSection client={selectedClient} onBack={handleBack} />
      ) : (
        <ClientListSection
          clients={filteredClients}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onSelectClient={handleSelectClient}
        />
      )}
    </div>
  );
}
