import React from 'react';
import {
  ChevronDown, ChevronUp, Briefcase, PieChart,
  Activity, Zap, LayoutGrid,
  ArrowRightLeft, Bell, Layers, GraduationCap, LifeBuoy, LogOut, Lock, Shield,
  Star, BookOpen, Newspaper, Crown, BarChart2, Users, Brain, Home
} from 'lucide-react';

export const MENU_CATEGORIES = [
  {
    id: 'dashboard',
    label: 'Início',
    icon: Home,
    permKey: 'free',
  },
  {
    id: 'pro',
    label: 'PRO',
    icon: Briefcase,
    items: [
      { id: 'portfolio', label: 'Portfólio', icon: PieChart, permKey: 'portfolio' },
      { id: 'ia-copilot', label: 'Assistente IA', icon: Brain, permKey: 'portfolio' },
      { id: 'analises', label: 'Análises', icon: Activity, isMock: true, permKey: 'portfolio' },
      { id: 'carteiras-recomendadas', label: 'Carteiras', icon: Star, isMock: true, permKey: 'portfolio' },
    ]
  },
  {
    id: 'defi',
    label: 'DeFi',
    icon: Zap,
    items: [
      { id: 'airdrops', label: 'Hub de Airdrops', icon: LayoutGrid, permKey: 'airdrops' },
      { id: 'defi-tools', label: 'Ferramentas DeFi', icon: ArrowRightLeft, permKey: 'defi' },
      { id: 'defi-positions', label: 'Posições DeFi', icon: Layers, permKey: 'defi' },
      { id: 'reminders', label: 'Trackers e Agenda', icon: Bell, permKey: 'reminders' },
    ]
  },
  {
    id: 'consulting',
    label: 'VIP Consulting',
    icon: Crown,
    vipOnly: true,
    items: [
      { id: 'insights', label: 'Insights', icon: Newspaper, permKey: 'insights' },
      { id: 'academia', label: 'Academia DeFi', icon: GraduationCap, permKey: 'academia' },
    ]
  },
  {
    id: 'research',
    label: 'Research',
    icon: BookOpen,
    isMock: true,
    permKey: 'free'
  },
  {
    id: 'suporte',
    label: 'Suporte',
    icon: LifeBuoy,
    isMock: true,
    permKey: 'free'
  }
];

export const SidebarContent = ({ currentRoute, navigateTo, expandedMenus, toggleMenu, userEmail, userTier, authRole, onLogout, hasAccess }) => (
  <>
    <div className="flex items-center justify-center mb-10 mt-2 md:mt-0">
      <img src="https://i.imgur.com/QAqVuyN.png" alt="Mercurius Crypto" className="w-full max-w-[140px] object-contain opacity-90" />
    </div>

    <nav className="flex-1 space-y-3 overflow-y-auto pr-2 pb-6 custom-scrollbar">
      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-4 px-2">Explorar</p>

      <div className="space-y-2">
        {MENU_CATEGORIES.filter(category => {
          // Hide VIP Consulting category from free/pro users
          if (category.vipOnly) {
            const tierWeight = { free: 0, pro: 1, vip: 2, assessor: 2, admin: 3 };
            return (tierWeight[userTier] || 0) >= 2;
          }
          return true;
        }).map(category => (
          <div key={category.id} className="space-y-1">
            {category.items ? (
              <>
                <button
                  onClick={() => toggleMenu(category.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-text-secondary hover:text-text-primary transition-fast outline-none focus:ring-2 focus:ring-cyan select-none"
                >
                  <div className="flex items-center gap-3">
                    <category.icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{category.label}</span>
                  </div>
                  {expandedMenus[category.id] ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                </button>

                {expandedMenus[category.id] && (
                  <div className="pl-4 space-y-1 mt-1 border-l border-subtle ml-4">
                    {category.items.map(item => {
                      const isActive = currentRoute === item.id || (currentRoute === 'airdrop-detail' && item.id === 'airdrops');

                      // Lógica de bloqueio integrada com as regras dinâmicas
                      const isLocked = hasAccess && !hasAccess(item.permKey);

                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateTo(item.id)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-r-lg transition-normal font-medium text-sm outline-none focus:ring-2 focus:ring-cyan select-none ${
                            isActive
                              ? 'bg-bg-quaternary text-text-primary border-y border-r border-cyan/30 shadow-cyan'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <item.icon className={`w-4 h-4 ${isActive ? 'text-cyan' : 'opacity-60'} ${isLocked ? 'text-text-muted' : ''}`} />
                             <span className={isLocked ? 'text-text-muted' : ''}>{item.label}</span>
                          </div>
                          {isLocked && <Lock className="w-3 h-3 text-cyan/50" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => navigateTo(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-normal font-bold text-xs uppercase tracking-wider outline-none focus:ring-2 focus:ring-cyan select-none ${
                  currentRoute === category.id
                    ? 'bg-bg-quaternary text-text-primary border border-cyan/30 shadow-cyan'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                   <category.icon className={`w-4 h-4 ${currentRoute === category.id ? 'text-cyan' : ''}`} />
                   {category.label}
                </div>
                {hasAccess && !hasAccess(category.permKey) && <Lock className="w-3 h-3 text-cyan/50" />}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* SECÇÃO DE GESTÃO — visível para admin e assessor */}
      {(userTier === 'admin' || userTier === 'assessor') && (
        <div className="mt-6 pt-6 border-t border-gray-800 px-2">
          <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest mb-3">Gestão</p>

          {/* Terminal Assessor — assessor + admin */}
          <button
            onClick={() => navigateTo('assessor-dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 select-none mb-1 ${
              currentRoute === 'assessor-dashboard'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-blue-500/70 hover:text-blue-400 hover:bg-blue-500/10'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Terminal Assessor
          </button>

          {/* Painel Admin — somente admin */}
          {userTier === 'admin' && (
            <button
              onClick={() => navigateTo('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 select-none ${
                currentRoute === 'admin'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-purple-500/70 hover:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Shield className="w-4 h-4" />
              Painel Admin
            </button>
          )}
        </div>
      )}

    </nav>

    <div className="mt-auto pt-6 border-t border-subtle/80 space-y-2">
      <button
        onClick={() => navigateTo('carteiras-pro')}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-fast outline-none focus:ring-2 focus:ring-cyan select-none ${
          currentRoute === 'carteiras-pro'
            ? 'bg-bg-quaternary border border-cyan/30 shadow-cyan'
            : 'hover:bg-bg-quaternary/50 hover:border-border-medium'
        }`}
      >
        <div className="w-8 h-8 rounded-md bg-bg-quaternary border border-border-medium flex items-center justify-center text-text-primary font-bold text-xs shadow-sm uppercase flex-shrink-0">
          {userEmail ? userEmail[0] : 'M'}
        </div>
        <div className="flex flex-col text-left min-w-0 flex-1">
          <p className="text-sm font-bold text-text-primary leading-tight truncate" title={userEmail}>
            {userEmail || 'Membro VIP'}
          </p>
          <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
            userTier === 'admin' ? 'text-purple-300' :
            userTier === 'vip' ? 'text-yellow-300' :
            userTier === 'pro' ? 'text-blue-300' : 'text-text-tertiary'
          }`}>
            {userTier === 'admin' ? 'Administrador' :
             userTier === 'vip' ? 'VIP Consulting' :
             userTier === 'pro' ? 'Premium' : 'Plano Gratuito'}
          </span>
        </div>
      </button>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-fast outline-none focus:ring-2 focus:ring-cyan select-none"
        title="Terminar Sessão"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-xs font-semibold">Terminar Sessão</span>
      </button>
    </div>
  </>
);