import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { auth } from './lib/firebase';
import { queryClient } from './lib/queryClient';
import { Loader2 } from 'lucide-react';

// Importação dos componentes
import DashboardLayout from './components/layout/DashboardLayout';
import Auth from './pages/Auth';
import { GlobalErrorBoundary } from './components/ui/ErrorBoundary';
import { PrivacyProvider } from './contexts/PrivacyContext';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Fica à escuta do estado de autenticação real do Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    // Limpa o ouvinte quando o componente é destruído
    return () => unsubscribe();
  }, []);

  // Ecrã de carregamento elegante enquanto o Firebase decide se há sessão ativa
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">A verificar credenciais seguras...</p>
      </div>
    );
  }

  // O "Guarda-Costas": Se não houver utilizador logado, mostra o ecrã de Auth.
  if (!user) {
    return <Auth />;
  }

  // Se houver utilizador, mostra o Dashboard completo da Mercurius
  return (
    <PrivacyProvider>
      <DashboardLayout />
    </PrivacyProvider>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        /* 🎨 Cyan custom cursor */
        html, body, * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="%2300FFEF" opacity="0.9"/><circle cx="12" cy="12" r="7" fill="none" stroke="%2300FFEF" stroke-width="1" opacity="0.5"/></svg>') 12 12, auto;
        }
      `}</style>

      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </>
  );
}