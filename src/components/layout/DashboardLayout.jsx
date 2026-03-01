import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { Menu, X, LogOut, Lock, Crown, Shield, Loader2, ArrowRight, Calendar, FileText, CheckCircle2 } from 'lucide-react';

import { SidebarContent, MENU_CATEGORIES } from './Sidebar';
import { MockPage } from '../ui/Shared';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, limit, updateDoc } from 'firebase/firestore';
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
const Dashboard = lazy(() => import('../../pages/Dashboard'));

// Importações para páginas consumer (PHASE 3)
const ResearchHub = lazy(() => import('../../pages/ResearchHub'));
const ResearchDetail = lazy(() => import('../../pages/ResearchDetail'));
const StrategiesMarketplace = lazy(() => import('../../pages/StrategiesMarketplace'));
const ModelPortfoliosPage = lazy(() => import('../../pages/ModelPortfoliosPage'));
const RecommendationsFeed = lazy(() => import('../../pages/RecommendationsFeed'));

// Importações para VIP Consulting (PHASE 4 novo)
const InsightsFeed = lazy(() => import('../../pages/InsightsFeed'));
const VideoLibrary = lazy(() => import('../../pages/VideoLibrary'));

// Importações para DeFi Guides (PHASE 5 novo)
const DeFiGuidesHub = lazy(() => import('../../pages/DeFiGuidesHub'));
const DeFiGuideDetail = lazy(() => import('../../pages/DeFiGuideDetail'));

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
       <div className="absolute -top-3 -right-3 bg-[#111] border border-white/[0.07] p-1.5 rounded-full">
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
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [selectedAirdrop, setSelectedAirdrop] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ pro: true, defi: true, educacao: false, ferramentas: false });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // VIP Consulting states (PHASE 4 novo)
  const [proposalBanner, setProposalBanner] = useState(null);
  const [meetingBanner, setMeetingBanner] = useState(null);

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

  // 3. Listener para propostas de VIP Consulting (PHASE 4 novo)
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'proposals'),
      where('status', '==', 'pending'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const proposal = snapshot.docs[0].data();
        setProposalBanner({
          id: snapshot.docs[0].id,
          ...proposal
        });
      } else {
        setProposalBanner(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Listener para meetings/triggers (PHASE 4 novo)
  useEffect(() => {
    if (!auth.currentUser || userTier !== 'vip') return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'meetings'),
      where('status', '==', 'scheduled'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const meeting = snapshot.docs[0].data();
        setMeetingBanner({
          id: snapshot.docs[0].id,
          ...meeting
        });
      } else {
        setMeetingBanner(null);
      }
    });

    return () => unsubscribe();
  }, [userTier]);

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
      'dashboard': 'free',
      'portfolio': 'portfolio',
      'carteiras-recomendadas': 'portfolio',
      'ia-copilot': 'portfolio',
      'defi-positions': 'defi',
      'defi-guides': 'defi',
      'airdrops': 'airdrops',
      'airdrop-detail': 'airdrops',
      'defi-tools': 'defi',
      'reminders': 'reminders',
      'research': 'free',
      'research-detail': 'free',
      'strategies': 'free',
      'portfolios': 'free',
      'recommendations': 'free',
      'academia': 'free',
      'assessor': 'free',
      'insights': 'vip'
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

  // Handlers para VIP Consulting (PHASE 4 novo)
  const handleAcknowledgeProposal = useCallback(async () => {
    if (!proposalBanner || !auth.currentUser) return;

    try {
      const proposalRef = doc(db, 'users', auth.currentUser.uid, 'proposals', proposalBanner.id);
      await updateDoc(proposalRef, { acknowledged: true });
      setProposalBanner(null);
    } catch (error) {
      console.error('Erro ao acknowledgear proposta:', error);
    }
  }, [proposalBanner]);

  const handleDismissMeetingBanner = useCallback(() => {
    setMeetingBanner(null);
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
      
      <aside className="hidden md:flex flex-col w-72 bg-[#0B0D12] border-r border-white/[0.07] sticky top-0 h-screen p-6 z-30">
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

      <header className="md:hidden flex items-center justify-between p-4 bg-[#0B0D12] border-b border-white/[0.07] sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 -ml-1 text-gray-400 hover:text-white outline-none">
            <Menu className="w-6 h-6" />
          </button>
          <img src="https://i.imgur.com/QAqVuyN.png" alt="Mercurius" className="h-5" />
        </div>
        <div className="flex items-center gap-2">
          <PrivacyModeToggle />
          <div className="w-8 h-8 rounded-md bg-[#181C25] border border-white/[0.07] flex items-center justify-center text-white font-bold text-xs uppercase">
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
              {currentRoute === 'dashboard' && (
                <Dashboard
                  onNavigatePortfolio={() => navigateTo('portfolio')}
                  onNavigateReminders={() => navigateTo('reminders')}
                />
              )}

              {/* PRO Pages */}
              {currentRoute === 'portfolio' && <Portfolio />}
              {currentRoute === 'carteiras-recomendadas' && <Wallets />}
              {currentRoute === 'ia-copilot' && <AiCopilot />}

              {/* DEFI Pages */}
              {currentRoute === 'defi-positions' && <DeFiPositions />}
              {currentRoute === 'defi-guides' && <DeFiGuidesHub />}
              {currentRoute === 'airdrops' && <AirdropHub onSelect={openAirdrop} />}
              {currentRoute === 'airdrop-detail' && selectedAirdrop && <AirdropRouter airdrop={selectedAirdrop} onBack={() => navigateTo('airdrops')} />}
              {currentRoute === 'defi-tools' && <DeFiToolsLanding />}

              {/* EDUCACAO Pages */}
              {currentRoute === 'research' && <ResearchHub />}
              {currentRoute === 'research-detail' && <ResearchDetail />}
              {currentRoute === 'strategies' && <StrategiesMarketplace />}
              {currentRoute === 'portfolios' && <ModelPortfoliosPage />}
              {currentRoute === 'recommendations' && <RecommendationsFeed />}
              {currentRoute === 'academia' && <VideoLibrary />}

              {/* FERRAMENTAS Pages */}
              {currentRoute === 'reminders' && <RemindersPage />}

              {/* PHASE 4: VIP Consulting Pages (hidden from menu) */}
              {currentRoute === 'insights' && <InsightsFeed />}
              {currentRoute === 'assessor' && <AssessorDashboard />}

              {['analises', 'suporte'].includes(currentRoute) && (
                <MockPage title={getRouteTitle(currentRoute)} />
              )}
            </>
          )}
        </Suspense>
      </main>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-[#151515] border border-white/[0.07] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <LogOut className="w-8 h-8 text-red-500 ml-1" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Terminar Sessão</h3>
              <p className="text-gray-400 text-sm mb-6">
                Tem a certeza que deseja sair da sua conta? Terá de iniciar sessão novamente para aceder.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 bg-[#1A1D24] hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors border border-white/[0.07] outline-none">Cancelar</button>
                <button onClick={confirmLogout} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors outline-none">Sair</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: VIP Consulting Proposal Banner */}
      {proposalBanner && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-right duration-300">
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-bold flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  Proposta de Consulting
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  {proposalBanner.description || 'Você recebeu uma nova proposta de consulting. Verifique os detalhes.'}
                </p>
                <button
                  onClick={handleAcknowledgeProposal}
                  className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Ver Proposta
                </button>
              </div>
              <button
                onClick={() => setProposalBanner(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: VIP Consulting Meeting Banner */}
      {meetingBanner && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md animate-in slide-in-from-left duration-300">
          <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-xl p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-bold flex items-center gap-2 mb-1">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Reunião Agendada
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  {meetingBanner.time && `${new Date(meetingBanner.time).toLocaleDateString('pt-BR')} às ${new Date(meetingBanner.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
                <button
                  onClick={() => navigateTo('insights')}
                  className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  Ver Detalhes <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleDismissMeetingBanner}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;