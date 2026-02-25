import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { Menu, X, LogOut, Lock, Crown, Shield, Loader2 } from 'lucide-react';

import { SidebarContent, MENU_CATEGORIES } from './Sidebar';
import { MockPage } from '../ui/Shared';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuthRole } from '../../hooks/useAuthRole';
import PrivacyModeToggle from '../auth/PrivacyModeToggle';
// Importações normais para páginas leves
import RemindersPage from '../../pages/Reminders';

// Lazy imports para páginas pesadas (reduz bundle inicial)
const AdminPanel = lazy(() => import('../../pages/AdminPanel'));
const AirdropHub = lazy(() => import('../../pages/AirdropHub'));
const AirdropRouter = lazy(() => import('../../pages/AirdropDetail'));
const Portfolio = lazy(() => import('../../pages/Portfolio'));
const Wallets = lazy(() => import('../../pages/Wallets'));
const DeFiPositions = lazy(() => import('../../pages/DeFiPositions'));
const DeFiToolsLanding = lazy(() => import('../../pages/DeFiToolsLanding'));
const AssessorDashboard = lazy(() => import('../../pages/AssessorDashboard'));
const AiCopilot = lazy(() => import('../../pages/AiCopilot'));

// Fallback de loading para Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
  </div>
);


// COMPONENTE DE BLOQUEIO (PAYWALL)
const PremiumLockScreen = ({ featureName }) => (
  <div className="animate-in fade-in flex flex-col items-center justify-center py-20 px-4 text-center mt-12">
    <div className="w-24 h-24 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mb-8 relative shadow-[0_0_50px_rgba(59,130,246,0.15)]">
       <Lock className="w-10 h-10 text-blue-500" />
       <div className="absolute -top-3 -right-3 bg-[#111] border border-gray-700 p-1.5 rounded-full">
         <Crown className="w-5 h-5 text-yellow-500" />
       </div>
    </div>
    <h2 className="text-3xl font-extrabold text-white mb-4">Acesso Restrito</h2>
    <p className="text-gray-400 max-w-lg mb-8 text-lg">
      A funcionalidade de <strong>{featureName}</strong> é um recurso exclusivo para níveis superiores de assinatura.
    </p>
    <a href="https://app.alpaclass.com/" target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all outline-none">
      Fazer Upgrade de Conta
    </a>
  </div>
);

const DashboardLayout = () => {
  const [currentRoute, setCurrentRoute] = useState('airdrops');
  const [selectedAirdrop, setSelectedAirdrop] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ pro: true, defi: true });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // 1. Estados de Permissão Dinâmicos
  const { profile, isLoadingProfile } = useUserProfile();
  const userTier = profile?.tier || 'free';
  const { role: authRole } = useAuthRole();
  
  // Guardamos as configurações do Admin Panel aqui
  const [appPermissions, setAppPermissions] = useState({
    portfolio: 'pro', airdrops: 'free', defi: 'pro', reminders: 'free'
  });

  // 2. Buscar as regras ao vivo do Banco de Dados
  useEffect(() => {
    const permsRef = doc(db, 'settings', 'permissions');
    const unsubscribe = onSnapshot(permsRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppPermissions(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. A Lógica do Guarda-Costas Avançado
  const hasAccess = useCallback((permKey) => {
    if (userTier === 'admin') return true; // Admin acessa TUDO
    if (!permKey) return true; // Se não tem regra, é livre

    const requiredTier = appPermissions[permKey] || 'free';
    
    // Pesos da hierarquia
    const tierWeight = { free: 0, pro: 1, vip: 2, admin: 3 };
    
    // O usuário tem peso maior ou igual ao exigido?
    return tierWeight[userTier] >= tierWeight[requiredTier];
  }, [userTier, appPermissions]);

  // Função para saber a chave de permissão da rota atual
  const getCurrentRoutePermKey = () => {
    // Mapeamento manual rápido
    const map = {
      'portfolio': 'portfolio',
      'carteiras-pro': 'portfolio',
      'analises': 'portfolio',
      'airdrops': 'airdrops',
      'airdrop-detail': 'airdrops',
      'defi-positions': 'defi',
      'defi-tools': 'defi',
      'reminders': 'reminders',
      'carteiras-recomendadas': 'portfolio',
      'assessor': 'free',
      'ia-copilot': 'portfolio'
    };
    return map[currentRoute] || 'free';
  };

  const toggleMenu = useCallback((id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleLogoutClick = useCallback(() => {
    setIsLogoutModalOpen(true);
    setIsMobileMenuOpen(false);
  }, []);

  const confirmLogout = useCallback(async () => {
    try {
      await signOut(auth);
      // Modal will auto-close when user state changes in App.jsx
      setIsLogoutModalOpen(false);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert('Erro ao fazer logout. Por favor, tente novamente.');
      setIsLogoutModalOpen(false);
    }
  }, []);

  const navigateTo = useCallback((route) => {
    setCurrentRoute(route);
    setSelectedAirdrop(null);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const openAirdrop = useCallback((airdrop) => {
    setSelectedAirdrop(airdrop);
    setCurrentRoute('airdrop-detail');
    window.scrollTo(0, 0);
  }, []);

  const getRouteTitle = (routeId) => {
     if (!MENU_CATEGORIES) return 'Funcionalidade Exclusiva';
     const item = MENU_CATEGORIES.flatMap(c => c.items ? c.items : [c]).find(i => i.id === routeId);
     return item ? item.label : 'Funcionalidade Exclusiva';
  };

  const isCurrentRouteLocked = !hasAccess(getCurrentRoutePermKey());

  return (
    <div className="min-h-screen bg-[#07090C] flex flex-col md:flex-row text-gray-200 font-sans selection:bg-blue-500/30">
      
      <aside className="hidden md:flex flex-col w-72 bg-[#0B0D12] border-r border-gray-800/80 sticky top-0 h-screen p-6 z-30">
        <SidebarContent
           currentRoute={currentRoute}
           navigateTo={navigateTo}
           expandedMenus={expandedMenus}
           toggleMenu={toggleMenu}
           userEmail={auth.currentUser?.email}
           userTier={userTier}
           authRole={authRole}
           hasAccess={hasAccess} // Passamos a função de verificação para a Sidebar
           onLogout={handleLogoutClick}
        />
      </aside>

      <header className="md:hidden flex items-center justify-between p-4 bg-[#0B0D12] border-b border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 -ml-1 text-gray-400 hover:text-white outline-none">
            <Menu className="w-6 h-6" />
          </button>
          <img src="https://i.imgur.com/QAqVuyN.png" alt="Mercurius" className="h-5" />
        </div>
        <div className="flex items-center gap-2">
          <PrivacyModeToggle />
          <div className="w-8 h-8 rounded-md bg-[#181C25] border border-gray-700 flex items-center justify-center text-white font-bold text-xs uppercase">
            {auth.currentUser?.email ? auth.currentUser.email[0] : 'M'}
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 max-w-[80vw] bg-[#0B0D12] h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 text-gray-500 hover:text-white outline-none">
              <X className="w-6 h-6" />
            </button>
            <SidebarContent
               currentRoute={currentRoute}
               navigateTo={navigateTo}
               expandedMenus={expandedMenus}
               toggleMenu={toggleMenu}
               userEmail={auth.currentUser?.email}
               userTier={userTier}
               authRole={authRole}
               hasAccess={hasAccess}
               onLogout={handleLogoutClick}
            />
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-12 z-10 relative">
        <Suspense fallback={<PageLoader />}>
          {/* Rota de Admin Secreta */}
          {currentRoute === 'admin' && userTier === 'admin' ? (
            <AdminPanel />
          ) : isCurrentRouteLocked ? (
            /* O NOVO PAYWALL DINÂMICO */
            <PremiumLockScreen featureName={getRouteTitle(currentRoute)} />
          ) : (
            /* ROTAS LIBERADAS */
            <>
              {currentRoute === 'airdrops' && <AirdropHub onSelect={openAirdrop} />}
              {currentRoute === 'airdrop-detail' && selectedAirdrop && <AirdropRouter airdrop={selectedAirdrop} onBack={() => navigateTo('airdrops')} />}
              {currentRoute === 'defi-positions' && <DeFiPositions />}
              {currentRoute === 'reminders' && <RemindersPage />}
              {currentRoute === 'portfolio' && <Portfolio />}
              {currentRoute === 'carteiras-pro' && <Wallets />}
              {currentRoute === 'defi-tools' && <DeFiToolsLanding />}
              {currentRoute === 'assessor' && <AssessorDashboard />}
              {currentRoute === 'ia-copilot' && <AiCopilot />}

              {['analises', 'cursos', 'suporte', 'carteiras-recomendadas', 'research'].includes(currentRoute) && (
                <MockPage title={getRouteTitle(currentRoute)} />
              )}
            </>
          )}
        </Suspense>
      </main>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <LogOut className="w-8 h-8 text-red-500 ml-1" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Terminar Sessão</h3>
              <p className="text-gray-400 text-sm mb-6">
                Tem a certeza que deseja sair da sua conta? Terá de iniciar sessão novamente para aceder.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 bg-[#1A1D24] hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors border border-gray-700 outline-none">Cancelar</button>
                <button onClick={confirmLogout} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors outline-none">Sair</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;