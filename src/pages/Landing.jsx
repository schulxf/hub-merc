import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight, BarChart3, Shield, Zap, Brain, Lock, Rocket } from 'lucide-react';

const Landing = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const curRef = useRef(null);
  const curRRef = useRef(null);

  useEffect(() => {
    // Canvas mesh background
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    const particles = [
      { x: w * 0.2, y: h * 0.3, vx: 0.3, vy: 0.2 },
      { x: w * 0.8, y: h * 0.2, vx: -0.2, vy: 0.4 },
      { x: w * 0.5, y: h * 0.7, vx: 0.1, vy: -0.3 },
    ];

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0, 255, 239, 0.04)';

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 300);
        gradient.addColorStop(0, 'rgba(0, 255, 239, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 255, 239, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - 300, p.y - 300, 600, 600);
      });

      requestAnimationFrame(animate);
    };

    animate();

    // GSAP animations
    const timeline = gsap.timeline();

    // Entrance animations
    timeline
      .fromTo('.eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
      .to('.hero-word', { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.2)
      .fromTo('.subtitle', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, 0.8)
      .fromTo('.cta-btn', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 }, 1)
      .fromTo('.feature-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, 1.2)
      .fromTo('.stat-item', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, 1.6);

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

  const features = [
    {
      icon: BarChart3,
      title: 'Portfolio Intelligence',
      description: 'Análise avançada de carteiras com rebalancing automático',
      color: 'bg-blue-500/20',
      accent: 'border-blue-500',
    },
    {
      icon: Zap,
      title: 'DeFi Execution',
      description: 'Swaps otimizados através de 1inch com menor slippage',
      color: 'bg-cyan-500/20',
      accent: 'border-cyan-500',
    },
    {
      icon: Brain,
      title: 'AI Copilot',
      description: 'Sugestões de investimento em tempo real com contexto',
      color: 'bg-green-500/20',
      accent: 'border-green-500',
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'RBAC granular com criptografia ponta-a-ponta',
      color: 'bg-purple-500/20',
      accent: 'border-purple-500',
    },
    {
      icon: Lock,
      title: 'Non-Custodial',
      description: 'Os seus ativos permanecem sempre na sua carteira',
      color: 'bg-orange-500/20',
      accent: 'border-orange-500',
    },
    {
      icon: Rocket,
      title: 'Escala Global',
      description: 'Suporte para múltiplas blockchains e redes',
      color: 'bg-teal-500/20',
      accent: 'border-teal-500',
    },
  ];

  const stats = [
    { label: 'Utilizadores Ativos', value: '2,847' },
    { label: 'Portfolio Value', value: '$142.5M' },
    { label: 'Swaps Executados', value: '18,392' },
    { label: 'Uptime', value: '99.9%' },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#07090C] text-white overflow-x-hidden relative"
      style={{ cursor: 'none' }}
    >
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
      />

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
        style={{
          left: 0,
          top: 0,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        ref={curRRef}
        className="fixed w-7 h-7 border-2 border-cyan-400 rounded-full pointer-events-none z-[9998]"
        style={{
          left: 0,
          top: 0,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <p className="eyebrow text-cyan-400 text-sm font-medium tracking-wider mb-6 opacity-0">
          INTELIGÊNCIA ON-CHAIN PARA TRADERS
        </p>

        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            <span className="hero-word inline-block opacity-0 translate-y-6">A</span>
            <span className="hero-word inline-block opacity-0 translate-y-6 mx-2">Carteira</span>
            <span className="hero-word inline-block opacity-0 translate-y-6">Que</span>
            <br />
            <span className="hero-word inline-block opacity-0 translate-y-6">Pensa</span>
            <span className="hero-word inline-block opacity-0 translate-y-6 mx-2">Por</span>
            <span className="hero-word inline-block opacity-0 translate-y-6">Ti</span>
          </h1>
        </div>

        <p className="subtitle text-lg text-gray-400 max-w-2xl text-center mb-12 opacity-0">
          Portfolio tracking, DeFi execution e AI Copilot num ecossistema integrado. Construído para traders que exigem performance.
        </p>

        <Link
          to="/login"
          className="cta-btn magnetic-btn px-8 py-4 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/30 opacity-0"
        >
          Começar Agora
          <ArrowRight className="inline-block ml-2 w-5 h-5" />
        </Link>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
        <h2 className="text-4xl font-black text-center mb-16 tracking-tight">
          Funcionalidades que <span className="text-cyan-400">Transformam</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="feature-card group p-8 rounded-2xl border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 bg-gray-950/50 backdrop-blur opacity-0 hover:bg-gray-900"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-item opacity-0">
              <p className="text-3xl md:text-4xl font-black text-cyan-400 mb-2">
                {stat.value}
              </p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-20 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-bold mb-4">Produto</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-cyan-400 transition">Portfolio</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">DeFi</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">AI Copilot</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Empresa</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-cyan-400 transition">Sobre</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Blog</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Contactos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-cyan-400 transition">Privacidade</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Termos</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Cookies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Social</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-cyan-400 transition">Twitter</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Discord</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Mercurius Hub. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
