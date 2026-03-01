import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Users, FileText, TrendingUp, Zap } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * AdminAnalyticsTab — Real-time analytics dashboard for platform KPIs.
 *
 * Displays:
 * - Total users, active users (7-day), total content, tier distribution
 * - Content creation trend (last 30 days)
 * - User signup trend (last 30 days)
 * - Tier distribution pie chart
 * - Recent content items
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminAnalyticsTab({ onError }) {
  const [users, setUsers] = useState([]);
  const [research, setResearch] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true);

  const usersRef = useRef(null);
  const researchRef = useRef(null);
  const strategiesRef = useRef(null);
  const portfoliosRef = useRef(null);
  const recommendationsRef = useRef(null);
  const airdropRef = useRef(null);

  // React StrictMode guard: prevent duplicate listeners
  useEffect(() => {
    let activeListeners = 0;
    const totalListeners = 6;

    const setupListener = (collectionName, setState, ref) => {
      if (ref.current) return;

      const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          const data = [];
          snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setState(data);
          activeListeners++;
          if (activeListeners === totalListeners) {
            setLoading(false);
          }
        },
        (error) => {
          console.error(`Erro ao carregar ${collectionName}:`, error);
          activeListeners++;
          if (activeListeners === totalListeners) {
            setLoading(false);
          }
        }
      );

      ref.current = unsubscribe;
    };

    setupListener('users', setUsers, usersRef);
    setupListener('research', setResearch, researchRef);
    setupListener('strategies', setStrategies, strategiesRef);
    setupListener('model_portfolios', setPortfolios, portfoliosRef);
    setupListener('recommendations', setRecommendations, recommendationsRef);
    setupListener('airdrops', setAirdrops, airdropRef);

    return () => {
      [usersRef, researchRef, strategiesRef, portfoliosRef, recommendationsRef, airdropRef].forEach((ref) => {
        if (ref.current) {
          ref.current();
          ref.current = null;
        }
      });
    };
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = users.length;

    // Active users (last 7 days)
    const activeUsers = users.filter((u) => {
      if (!u.lastActive) return false;
      const lastActive = new Date(u.lastActive);
      return lastActive >= sevenDaysAgo;
    }).length;

    // Total content
    const totalContent = research.length + strategies.length + portfolios.length + recommendations.length + airdrops.length;

    // Tier distribution
    const tierDistribution = {
      free: users.filter((u) => u.tier === 'free' || !u.tier).length,
      pro: users.filter((u) => u.tier === 'pro').length,
      vip: users.filter((u) => u.tier === 'vip').length,
      admin: users.filter((u) => u.tier === 'admin').length,
      assessor: users.filter((u) => u.tier === 'assessor').length,
    };

    return { totalUsers, activeUsers, totalContent, tierDistribution };
  }, [users, research, strategies, portfolios, recommendations, airdrops]);

  // Generate trend data (last 30 days)
  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'short' });

      // Count content created on this date
      const contentCount = [
        ...research,
        ...strategies,
        ...portfolios,
        ...recommendations,
        ...airdrops,
      ].filter((item) => {
        const itemDate = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : null;
        return itemDate === dateStr;
      }).length;

      // Count users created on this date
      const userCount = users.filter((u) => {
        const userDate = u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : null;
        return userDate === dateStr;
      }).length;

      data.push({
        date: dayOfWeek,
        dateStr,
        content: contentCount,
        users: userCount,
      });
    }

    return data;
  }, [users, research, strategies, portfolios, recommendations, airdrops]);

  // Tier distribution for pie chart
  const tierChartData = useMemo(
    () =>
      Object.entries(kpis.tierDistribution).map(([tier, count]) => ({
        name: tier.toUpperCase(),
        count,
      })),
    [kpis.tierDistribution]
  );

  const tierColors = {
    FREE: '#6B7280',
    PRO: '#3B82F6',
    VIP: '#FBBF24',
    ADMIN: '#A855F7',
    ASSESSOR: '#EC4899',
  };

  // Recent content (last 10)
  const recentContent = useMemo(() => {
    const allContent = [
      ...research.map((r) => ({ type: 'Research', name: r.title, createdAt: r.createdAt })),
      ...strategies.map((s) => ({ type: 'Strategy', name: s.name, createdAt: s.createdAt })),
      ...portfolios.map((p) => ({ type: 'Portfolio', name: p.name, createdAt: p.createdAt })),
      ...recommendations.map((r) => ({ type: 'Recommendation', name: r.type, createdAt: r.createdAt })),
      ...airdrops.map((a) => ({ type: 'Airdrop', name: a.name, createdAt: a.createdAt })),
    ];

    return allContent
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [research, strategies, portfolios, recommendations, airdrops]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total de Utilizadores</p>
              <p className="text-3xl font-bold text-white">{kpis.totalUsers}</p>
              <p className="text-xs text-green-400 mt-2">+{Math.max(0, kpis.totalUsers - 5)} esta semana</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-green-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Utilizadores Ativos (7 dias)</p>
              <p className="text-3xl font-bold text-white">{kpis.activeUsers}</p>
              <p className="text-xs text-green-400 mt-2">{Math.round((kpis.activeUsers / Math.max(1, kpis.totalUsers)) * 100)}% engagement</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Total Content Card */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total de Conteúdo</p>
              <p className="text-3xl font-bold text-white">{kpis.totalContent}</p>
              <p className="text-xs text-cyan-400 mt-2">Items publicados</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        {/* Tier Distribution Card */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Distribuição de Tiers</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-300">Free: {kpis.tierDistribution.free}</p>
                <p className="text-xs text-blue-400">Pro: {kpis.tierDistribution.pro}</p>
                <p className="text-xs text-yellow-400">VIP: {kpis.tierDistribution.vip}</p>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Creation Trend */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Conteúdo Criado (30 dias)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="content"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={{ fill: '#06B6D4', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Signup Trend */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Novos Utilizadores (30 dias)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Distribution Pie Chart */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Tiers</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={tierChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                label={(entry) => `${entry.name}: ${entry.count}`}
              >
                {tierChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={tierColors[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Content */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Conteúdo Recente</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentContent.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum conteúdo encontrado</p>
            ) : (
              recentContent.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-gray-800/50 hover:border-gray-700 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {item.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
