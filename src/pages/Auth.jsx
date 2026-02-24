import React, { useState } from 'react';
import { Mail, KeyRound, UserPlus, LogIn, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Auth() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // GRAVAÇÃO CORRIGIDA: Caminho com número par de segmentos (Coleção -> Documento)
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          tier: 'free', 
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    } catch (err) {
      console.error("Erro de Autenticação:", err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou palavra-passe incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está registado.');
      } else if (err.code === 'auth/weak-password') {
        setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiadas tentativas. Tente novamente mais tarde.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de ligação. Verifique a sua conexão à internet.');
      } else {
        // Generic user-friendly message for unhandled errors
        setError('Ocorreu um erro. Por favor, tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-white tracking-tight">
          Mercurius Hub
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          {isLoginMode ? 'Aceda à sua inteligência on-chain' : 'Candidate-se ao acesso exclusivo'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#111]/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-gray-800 sm:rounded-3xl sm:px-10">
          
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Endereço de Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-800 rounded-xl bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="exemplo@mercurius.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Palavra-passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-800 rounded-xl bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#111] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLoginMode ? (
                <span className="flex items-center gap-2">Entrar no Hub <LogIn className="w-4 h-4" /></span>
              ) : (
                <span className="flex items-center gap-2">Criar Conta <UserPlus className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#111] text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Ou
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
              }}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors outline-none focus:outline-none focus:ring-0"
            >
              {isLoginMode 
                ? 'Ainda não é membro? Registre-se agora' 
                : 'Já possui uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}