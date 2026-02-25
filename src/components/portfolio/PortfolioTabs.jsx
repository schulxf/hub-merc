import React from 'react';
import { BarChart3, ListTree, Clock } from 'lucide-react';

/**
 * Tab configuration — defines the three portfolio sections.
 */
const TABS = [
  {
    id: 'overview',
    label: 'Visao Geral',
    icon: BarChart3,
  },
  {
    id: 'assets',
    label: 'Gestao de Ativos',
    icon: ListTree,
  },
  {
    id: 'history',
    label: 'Historico',
    icon: Clock,
  },
];

/**
 * PortfolioTabs — underline-style tab navigation for the three Portfolio sections.
 *
 * @param {object}   props
 * @param {string}   props.activeTab    - ID of the currently active tab
 * @param {Function} props.setActiveTab - Setter to change the active tab
 */
const PortfolioTabs = React.memo(function PortfolioTabs({ activeTab, setActiveTab }) {
  return (
    <div
      className="flex items-center gap-1 mb-8"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 rounded-t-lg"
            style={{
              color: isActive ? '#00FFEF' : '#6B7280',
              background: isActive ? 'rgba(0,255,239,0.04)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = '#9CA3AF';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = '#6B7280';
            }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>

            {/* Active underline indicator */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '2px',
                  background: 'linear-gradient(to right, rgba(0,255,239,0.8), rgba(26,111,212,0.6))',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

export default PortfolioTabs;
