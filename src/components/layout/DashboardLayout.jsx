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
const InsightsFeed = lazy(() => import('../../pages/InsightsFeed'));
const VideoLibrary = lazy(() => import('../../pages/VideoLibrary'));

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
  const [expandedMenus, setExpandedMenus] = useState({ pro: true, defi: true });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ETAPA 3: Proposal banner state
  const [pendingProposal, setPendingProposal] = useState(null); // proposal doc or null
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // ETAPA 4A: Meeting trigger state
  const [showMeetingBanner, setShowMeetingBanner] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // 1. Estados de Permissão Dinâmicos
  const { profile, isLoadingProfile } = useUserProfile();
  const userTier = profile?.tier || 'free';
  const { role: authRole } = useAuthRole();
  
  // Guardamos as configurações do Admin Panel aqui
  const [appPermissions, setAppPermissions] = useState({
    portfolio: 'pro', airdrops: 'free', defi: 'pro', reminders: 'free',
    insights: 'vip', academia: 'vip'
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

  // ETAPA 3: Listen for pending proposals
  useEffect(() => {
    if (!auth.currentUser?.uid || !profile) return;
    try {
      const uid = auth.currentUser.uid;
      const proposalsRef = collection(db, 'users', uid, 'proposals');
      const q = query(proposalsRef, where('status', '==', 'pending'), limit(1));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const d = snap.docs[0];
            setPendingProposal({ id: d.id, ...d.data() });
          } else {
            setPendingProposal(null);
            setIsProposalModalOpen(false);
          }
        },
        (err) => {
          console.error('Erro ao escutar propostas:', err);
          setPendingProposal(null);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error('Erro ao setup listener de propostas:', err);
    }
  }, [profile]);

  // ETAPA 4A: Check meeting trigger (45+ days), once per session
  useEffect(() => {
    try {
      if (!profile || pendingProposal) return; // proposal takes priority
      const dismissed = sessionStorage.getItem('mercurius_meeting_dismissed');
      if (dismissed) return;
      const lastMeeting = profile.lastMeetingDate;
      if (!lastMeeting) {
        setShowMeetingBanner(true);
        return;
      }
      const d = lastMeeting.toDate ? lastMeeting.toDate() : new Date(lastMeeting);
      const daysSince = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 45) setShowMeetingBanner(true);
    } catch (err) {
      console.error('Erro ao verificar trigger de reunião:', err);
    }
  }, [profile, pendingProposal]);

  const handleAcknowledgeProposal = useCallback(async () => {
    if (!pendingProposal || !auth.currentUser) return;
    setIsAcknowledging(true);
    try {
      const proposalRef = doc(db, 'users', auth.currentUser.uid, 'proposals', pendingProposal.id);
      await updateDoc(proposalRef, { status: 'acknowledged' });
      setIsProposalModalOpen(false);
    } catch (err) {
      console.error('Erro ao reconhecer proposta:', err);
    } finally {
      setIsAcknowledging(false);
    }
  }, [pendingProposal]);

  const handleDismissMeetingBanner = useCallback(() => {
    sessionStorage.setItem('mercurius_meeting_dismissed', '1');
    setShowMeetingBanner(false);
    setIsMeetingModalOpen(false);
  }, []);

  // 3. A Lógica do Guarda-Costas Avançado
  const hasAccess = useCallback((permKey) => {
    if (userTier === 'admin') return true; // Admin acessa TUDO
    if (!permKey) return true; // Se não tem regra, é livre

    const requiredTier = appPermissions[permKey] || 'free';
    
    // Pesos da hierarquia
    const tierWeight = { free: 0, pro: 1, vip: 2, assessor: 2, admin: 3 };
    
    // O usuário tem peso maior ou igual ao exigido?
    return tierWeight[userTier] >= tierWeight[requiredTier];
  }, [userTier, appPermissions]);

  // Função para saber a chave de permissão da rota atual
  const getCurrentRoutePermKey = () => {
    // Mapeamento manual rápido
    const map = {
      'dashboard': 'free',
      'portfolio': 'portfolio',
      'carteiras-pro': 'portfolio',
      'analises': 'portfolio',
      'airdrops': 'airdrops',
      'airdrop-detail': 'airdrops',
      'defi-positions': 'defi',
      'defi-tools': 'defi',
      'reminders': 'reminders',
      'carteiras-recomendadas': 'portfolio',
      'insights': 'insights',
      'academia': 'academia',
      'assessor-dashboard': null,  // handled by tier check directly
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
        {/* ETAPA 3: Proposal Banner (highest priority) */}
        {pendingProposal && !isProposalModalOpen && (
          <div className="mb-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-yellow-200 text-sm">Nova sugestão de alocação disponível</p>
              <p className="text-yellow-400/70 text-xs mt-0.5 truncate">
                {pendingProposal.fromAsset} → {pendingProposal.toAsset}
                {pendingProposal.amount ? ` · ${pendingProposal.amount}` : ''}
              </p>
            </div>
            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-4 py-2 rounded-xl transition-colors outline-none flex-shrink-0"
            >
              Ver Proposta <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ETAPA 4A: Meeting Banner (shows only when no proposal pending) */}
        {!pendingProposal && showMeetingBanner && (
          <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-blue-200 text-sm">Há algum tempo que não revemos a sua estratégia</p>
              <p className="text-blue-400/70 text-xs mt-0.5">Agende uma call com o seu consultor Mercurius.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsMeetingModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors outline-none"
              >
                Agendar <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismissMeetingBanner}
                className="text-gray-500 hover:text-gray-300 transition-colors outline-none p-1"
                title="Dispensar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Suspense fallback={<PageLoader />}>
          {/* Rota de Admin Secreta */}
          {currentRoute === 'admin' && userTier === 'admin' ? (
            <AdminPanel />
          ) : currentRoute === 'assessor-dashboard' && (userTier === 'assessor' || userTier === 'admin') ? (
            <AssessorDashboard />
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
              {currentRoute === 'airdrops' && <AirdropHub onSelect={openAirdrop} />}
              {currentRoute === 'airdrop-detail' && selectedAirdrop && <AirdropRouter airdrop={selectedAirdrop} onBack={() => navigateTo('airdrops')} />}
              {currentRoute === 'defi-positions' && <DeFiPositions />}
              {currentRoute === 'reminders' && <RemindersPage />}
              {currentRoute === 'portfolio' && <Portfolio />}
              {currentRoute === 'carteiras-pro' && <Wallets />}
              {currentRoute === 'defi-tools' && <DeFiToolsLanding />}
              {currentRoute === 'insights' && <InsightsFeed />}
              {currentRoute === 'academia' && <VideoLibrary />}
              {currentRoute === 'assessor' && <AssessorDashboard />}
              {currentRoute === 'ia-copilot' && <AiCopilot />}

              {['analises', 'suporte', 'carteiras-recomendadas', 'research'].includes(currentRoute) && (
                <MockPage title={getRouteTitle(currentRoute)} />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* ETAPA 3: Proposal Detail Modal */}
      {isProposalModalOpen && pendingProposal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" />
                Proposta de Rebalanceamento
              </h3>
              <button onClick={() => setIsProposalModalOpen(false)} className="text-gray-500 hover:text-white transition-colors outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">De</p>
                  <p className="text-white font-bold text-lg">{pendingProposal.fromAsset}</p>
                </div>
                <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Para</p>
                  <p className="text-white font-bold text-lg">{pendingProposal.toAsset}</p>
                </div>
              </div>
              {pendingProposal.amount && (
                <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quantidade</p>
                  <p className="text-white font-semibold">{pendingProposal.amount}</p>
                </div>
              )}
              <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Justificativa do Assessor</p>
                <p className="text-gray-300 text-sm leading-relaxed">{pendingProposal.justification}</p>
              </div>
              {pendingProposal.assessorName && (
                <p className="text-xs text-gray-600 text-center">Proposta enviada por <span className="text-gray-400">{pendingProposal.assessorName}</span></p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="flex-1 bg-[#1A1D24] hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors border border-gray-700 outline-none text-sm"
              >
                Fechar
              </button>
              <button
                onClick={handleAcknowledgeProposal}
                disabled={isAcknowledging}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 outline-none disabled:opacity-50 text-sm"
              >
                {isAcknowledging ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Reconhecer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 4A: Meeting / Calendly Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Agendar Reunião de Estratégia
              </h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-gray-500 hover:text-white transition-colors outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[500px] bg-white">
              <iframe
                src={profile?.calendlyUrl || 'https://calendly.com/mercurius'}
                title="Agendar Reunião"
                className="w-full h-full border-0"
              />
            </div>
            <div className="p-4 flex justify-end border-t border-gray-800">
              <button
                onClick={handleDismissMeetingBanner}
                className="bg-[#1A1D24] hover:bg-gray-800 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors border border-gray-700 outline-none text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default DashboardLayout;