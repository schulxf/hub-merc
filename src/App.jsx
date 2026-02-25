import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import gsap from 'gsap';
import { auth } from './lib/firebase';
import { queryClient } from './lib/queryClient';
import { Loader2 } from 'lucide-react';

// Importação dos componentes
import DashboardLayout from './components/layout/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
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

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      {user ? (
        <Route
          path="/dashboard/*"
          element={
            <PrivacyProvider>
              <DashboardLayout />
            </PrivacyProvider>
          }
        />
      ) : (
        <Route path="/dashboard/*" element={<Navigate to="/login" replace />} />
      )}

      {/* Redirect to login if accessing dashboard without auth */}
      <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const curRef = useRef(null);
  const curRRef = useRef(null);

  useEffect(() => {
    // 🎨 Global Custom Cursor
    const cursor = curRef.current;
    const cursorRing = curRRef.current;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      gsap.to(cursor, {
        left: mouseX,
        top: mouseY,
        duration: 0,
      });

      gsap.to(cursorRing, {
        left: mouseX,
        top: mouseY,
        duration: 0.1,
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      <style>{`
        html {
          cursor: none;
        }
      `}</style>

      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AppContent />
          </Router>
        </QueryClientProvider>
      </GlobalErrorBoundary>

      {/* 🎯 Custom Cursor Dot */}
      <div
        ref={curRef}
        className="fixed w-1 h-1 bg-cyan rounded-full pointer-events-none z-[9998]"
        style={{
          left: 0,
          top: 0,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* 🎯 Custom Cursor Ring */}
      <div
        ref={curRRef}
        className="fixed w-7 h-7 border-2 border-cyan rounded-full pointer-events-none z-[9998]"
        style={{
          left: 0,
          top: 0,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  );
}