import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, KeyRound, Loader2, AlertCircle, Github, Chrome } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const curRef = useRef(null);
  const curRRef = useRef(null);

  useEffect(() => {
    // Canvas mesh background (subtle)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    const particles = [
      { x: w * 0.2, y: h * 0.3, vx: 0.1, vy: 0.08 },
      { x: w * 0.8, y: h * 0.4, vx: -0.08, vy: 0.12 },
    ];

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 250);
        gradient.addColorStop(0, 'rgba(0, 255, 239, 0.04)');
        gradient.addColorStop(1, 'rgba(0, 255, 239, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - 250, p.y - 250, 500, 500);
      });

      requestAnimationFrame(animate);
    };

    animate();

    // GSAP animations
    const timeline = gsap.timeline();

    timeline
      .fromTo('.login-card', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6 })
      .fromTo('.logo', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
      .fromTo('.form-header', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, 0.3)
      .fromTo('.form-group', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, 0.5)
      .fromTo('.form-options', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.1)
      .fromTo('.submit-btn', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 }, 1.3)
      .fromTo('.divider', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.5)
      .fromTo('.oauth-buttons > button', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 }, 1.6)
      .fromTo('.form-footer', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.9);

    // Custom cursor
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

    // Button magnetic effect
    const buttons = document.querySelectorAll('.magnetic-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.3,
          overwrite: 'auto',
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.3,
        });
      });
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email inválido.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Palavra-passe deve ter pelo menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          tier: 'free',
          createdAt: new Date().toISOString(),
          status: 'active',
        });
      }
    } catch (err) {
      console.error('Erro de Autenticação:', err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou palavra-passe incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está registado.');
      } else if (err.code === 'auth/weak-password') {
        setError('Palavra-passe muito fraca.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiadas tentativas. Tente novamente mais tarde.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de ligação. Verifique a internet.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeError = (field) => {
    if (error) setError('');
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#07090C] text-white overflow-x-hidden relative flex items-center justify-center p-4"
      style={{ cursor: 'none' }}
    >
      {/* Canvas Background */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />

      {/* Grain Overlay */}
      <svg className="fixed inset-0 pointer-events-none z-[9997]" style={{ opacity: 0.25 }}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Custom Cursor */}
      <div
        ref={curRef}
        className="fixed w-1 h-1 bg-cyan-400 rounded-full pointer-events-none z-[9998]"
        style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
      />
      <div
        ref={curRRef}
        className="fixed w-7 h-7 border-2 border-cyan-400 rounded-full pointer-events-none z-[9998]"
        style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="login-card bg-[#0F1117]/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl opacity-0">
          {/* Header with gradient top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-t-2xl" />

          {/* Logo */}
          <div className="logo text-center mb-8 opacity-0">
            <h1 className="text-3xl font-black">
              merc <span className="text-cyan-400">defi</span>.
            </h1>
            <p className="text-gray-500 text-sm mt-2">Inteligência on-chain</p>
          </div>

          {/* Form Header */}
          <div className="form-header text-center mb-8 opacity-0">
            <h2 className="text-2xl font-bold mb-2">
              {isLoginMode ? 'Bem-vindo de volta' : 'Criar Conta'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLoginMode
                ? 'Aceda ao seu portfólio de inteligência on-chain'
                : 'Candidate-se ao acesso exclusivo'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            {/* Email */}
            <div className="form-group opacity-0">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    removeError('email');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[#07090C] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="você@exemplo.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group opacity-0">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Palavra-passe
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    removeError('password');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[#07090C] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="form-options flex items-center justify-between opacity-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-700 bg-[#07090C]" />
                <span className="text-sm text-gray-400">Lembrar-me</span>
              </label>
              <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 transition">
                Esqueceu palavra-passe?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-btn magnetic-btn w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 opacity-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLoginMode ? 'A entrar...' : 'A registar...'}
                </>
              ) : (
                isLoginMode ? 'Entrar' : 'Registar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider my-6 flex items-center gap-4 opacity-0">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-500">OU</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* OAuth Buttons */}
          <div className="oauth-buttons flex gap-4 opacity-0">
            <button
              type="button"
              className="magnetic-btn flex-1 py-3 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Chrome className="w-4 h-4" />
              Google
            </button>
            <button
              type="button"
              className="magnetic-btn flex-1 py-3 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>

          {/* Footer */}
          <div className="form-footer mt-8 text-center opacity-0">
            <p className="text-sm text-gray-400">
              {isLoginMode ? 'Não tem conta? ' : 'Já tem conta? '}
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                }}
                className="text-cyan-400 hover:text-cyan-300 transition font-medium"
              >
                {isLoginMode ? 'Registar' : 'Entrar'}
              </button>
            </p>
            <div className="mt-6 flex gap-4 justify-center text-xs text-gray-500">
              <Link to="/" className="hover:text-cyan-400 transition">
                Voltar ao início
              </Link>
              <span>•</span>
              <a href="#" className="hover:text-cyan-400 transition">
                Privacidade
              </a>
              <span>•</span>
              <a href="#" className="hover:text-cyan-400 transition">
                Termos
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
