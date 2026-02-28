import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserProfile } from '../hooks/useUserProfile';

const DeFiGuidesHub = ({ onSelect }) => {
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const { profile } = useUserProfile();
  const userTier = profile?.tier || 'free';

  // Mock data for now — será alimentado por Firestore depois
  const mockGuides = [
    {
      id: '1',
      title: 'Yield Farming Strategies',
      subtitle: 'Maximize your DeFi returns',
      description: 'Learn how to identify and execute safe yield farming strategies across major protocols.',
      imageUrl: 'https://images.unsplash.com/photo-1639762681033-6461854290e7?w=500&h=300&fit=crop',
      type: 'Educação',
      accent: '#00D4FF',
      targetTier: 'free',
      phases: [
        {
          id: 'p1',
          title: 'Protocol Basics',
          tasks: [
            { id: 't1_1', title: 'Understand APY vs APR', desc: 'Learn the difference between annualized and effective yields' },
            { id: 't1_2', title: 'Impermanent Loss Guide', desc: 'What it is and how to calculate it' },
          ]
        },
        {
          id: 'p2',
          title: 'Execution',
          tasks: [
            { id: 't2_1', title: 'Select Farm Pool', desc: 'Evaluate risk vs reward' },
            { id: 't2_2', title: 'Deposit Liquidity', desc: 'Step-by-step guide' },
          ]
        },
      ]
    },
    {
      id: '2',
      title: 'Liquidity Provision Guide',
      subtitle: 'Become a liquidity provider',
      description: 'Master the art of providing liquidity and earning trading fees.',
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a92589?w=500&h=300&fit=crop',
      type: 'Tutorial',
      accent: '#00FF88',
      targetTier: 'free',
      phases: [
        {
          id: 'p1',
          title: 'LP Fundamentals',
          tasks: [
            { id: 't1_1', title: 'How LPs Work', desc: 'Mechanism overview' },
            { id: 't1_2', title: 'Fee Tiers', desc: 'Understanding different fee structures' },
          ]
        },
      ]
    },
    {
      id: '3',
      title: 'Flash Loans 101',
      subtitle: 'Advanced DeFi mechanics',
      description: 'Understand and utilize flash loans for arbitrage and liquidations.',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&h=300&fit=crop',
      type: 'Advanced',
      accent: '#FF00FF',
      targetTier: 'pro',
      phases: [
        {
          id: 'p1',
          title: 'Flash Loan Basics',
          tasks: [
            { id: 't1_1', title: 'What are Flash Loans', desc: 'Origins and use cases' },
          ]
        },
      ]
    },
  ];

  useEffect(() => {
    if (unsubscribeRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // For now, use mock data. Later: onSnapshot(query(collection(db, 'defi_guides'), ...))
      setGuides(mockGuides.filter(g => {
        const tierRank = { free: 0, pro: 1, vip: 2, admin: 3 };
        return tierRank[g.targetTier] <= (tierRank[userTier] || 0);
      }));
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao carregar guias DeFi:', err);
      setError('Falha ao carregar guias. Tente novamente.');
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userTier]);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-400">Carregando guias...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Guias de DeFi</h1>
        <p className="text-gray-400">Aprenda estratégias avançadas de DeFi passo a passo</p>
      </div>

      {guides.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          Nenhum guia disponível no seu tier.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map(guide => (
            <button
              key={guide.id}
              onClick={() => onSelect && onSelect(guide)}
              className="group relative overflow-hidden rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.15] transition-all duration-300 h-64"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `url(${guide.imageUrl})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-6 z-10">
                {/* Top: Type Badge */}
                <div className="flex items-start justify-between">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full text-white/90"
                    style={{ backgroundColor: `${guide.accent}20`, border: `1px solid ${guide.accent}40` }}
                  >
                    {guide.type}
                  </span>
                </div>

                {/* Bottom: Title and CTA */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">{guide.subtitle}</p>
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Guia
                    <span>→</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeFiGuidesHub;
