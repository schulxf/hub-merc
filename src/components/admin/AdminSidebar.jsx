import React from 'react';
import {
  FileText,
  BookOpen,
  TrendingUp,
  Briefcase,
  Lightbulb,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';

const ADMIN_TABS = [
  { id: 'content', label: 'Conteúdo (Airdrops)', icon: FileText },
  { id: 'research', label: 'Pesquisas', icon: BookOpen },
  { id: 'strategies', label: 'Estratégias', icon: TrendingUp },
  { id: 'portfolios', label: 'Carteiras Modelo', icon: Briefcase },
  { id: 'recommendations', label: 'Recomendações', icon: Lightbulb },
  { id: 'users', label: 'Utilizadores', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

/**
 * AdminSidebar — Vertical navigation for admin panel
 *
 * Features:
 * - Vertical sidebar with 8 admin tabs
 * - Active state highlighting with cyan color
 * - Sticky positioning, full-height
 * - Smooth transitions on hover
 *
 * Props:
 * - activeTab: string — currently active tab ID
 * - onSelectTab: function — callback when tab clicked
 * - collapsed: boolean — optional collapse state (for future mobile responsiveness)
 */
export default function AdminSidebar({ activeTab, onSelectTab, collapsed = false }) {
  return (
    <div className="w-72 bg-[#0B0D12] border-r border-white/[0.07] sticky top-0 h-screen overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.07]">
        <h2 className="text-sm font-semibold text-white">PAINEL DE ADMINISTRAÇÃO</h2>
      </div>

      {/* Navigation Items */}
      <nav className="py-4 space-y-1 px-2">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-gray-800 text-cyan-400 border-l-2 border-cyan-400 pl-3 shadow-sm shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50 border-l-2 border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info (Optional) */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-white/[0.07] bg-gray-900/30">
        <p className="text-xs text-gray-500">v1.0 — PHASE 2 CMS</p>
      </div>
    </div>
  );
}
