import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * AdminHeader Component
 * Displays panel title, description, error alerts, and tab navigation
 *
 * @param {Object} props
 * @param {'users' | 'permissions' | 'agenda'} props.activeTab - Currently active tab
 * @param {(tab: 'users' | 'permissions' | 'agenda') => void} props.onTabChange - Callback when tab changes
 * @param {string} [props.errorMessage] - Error message to display (optional)
 */
export default function AdminHeader({ activeTab, onTabChange, errorMessage }) {
  const tabs = [
    { id: 'users', label: 'Gestão de Clientes', icon: 'Users' },
    { id: 'permissions', label: 'Permissões de Acesso', icon: 'Shield' },
    { id: 'agenda', label: 'Agenda Global', icon: 'Calendar' }
  ];

  // Icon imports
  const { Users, Calendar } = require('lucide-react');
  const iconMap = { Users, Shield, Calendar };

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          Painel de Controle Mercurius
        </h1>
        <p className="text-gray-400">Área restrita para gestão da plataforma e clientes.</p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800 mb-8">
        {tabs.map((tab) => {
          const IconComponent = iconMap[tab.icon];
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
