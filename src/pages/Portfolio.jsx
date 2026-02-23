import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Loader2,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { useWalletBalances } from '../hooks/useWalletBalances';

// Lista de moedas suportadas para adicionar (pode expandir depois)
const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#14F195' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0' },
];

export default function Portfolio() {
  const [portfolioAssets, setPortfolioAssets] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [wallets, setWallets] = useState([]);
  const [syncTrigger, setSyncTrigger] = useState(null);
  const [localSyncWarning, setLocalSyncWarning] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  const {
    tokens: onChainTokens,
    isLoading: isSyncingOnChain,
    error: onChainError,
    warning: onChainWarning,
  } = useWalletBalances(wallets, syncTrigger);

  // Estados do Modal de Adicionar Ativo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 1. LER DADOS DO FIREBASE EM TEMPO REAL
  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    // Aponta para a "pasta" do utilizador logado
    const portfolioRef = collection(db, 'users', auth.currentUser.uid, 'portfolio');
    const q = query(portfolioRef);

    // onSnapshot fica a ouvir mudanças em tempo real no servidor
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets = [];
      snapshot.forEach((doc) => {
        assets.push({ id: doc.id, ...doc.data() });
      });
      setPortfolioAssets(assets);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar portfólio:", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpeza quando sai da página
  }, []);

  // 1.b LER CARTEIRAS EM TEMPO REAL (sem chamar API externa)
  useEffect(() => {
    if (!auth.currentUser) {
      setWallets([]);
      return;
    }

    const walletsRef = collection(db, 'users', auth.currentUser.uid, 'wallets');
    const q = query(walletsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = [];
        snapshot.forEach((docSnap) => {
          next.push({ id: docSnap.id, ...docSnap.data() });
        });
        setWallets(next);
      },
      (error) => {
        console.error('Erro ao ler carteiras para o portfólio:', error);
      },
    );

    return () => unsubscribe();
  }, []);

  // 2. BUSCAR PREÇOS REAIS DA COINGECKO
  useEffect(() => {
    if (portfolioAssets.length === 0) return;

    const fetchPrices = async () => {
      try {
        const coinIds = portfolioAssets.map(a => a.coinId).join(',');
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
        const data = await response.json();
        setLivePrices(data);
      } catch (error) {
        console.error("Erro ao buscar preços:", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, [portfolioAssets]);

  // 3. GRAVAR NOVO ATIVO NO FIREBASE
  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !buyPrice) return;
    
    setIsSaving(true);
    const coin = SUPPORTED_COINS.find(c => c.id === selectedCoin);
    
    try {
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', selectedCoin);
      
      // Salva ou atualiza a moeda no banco de dados da Google
      await setDoc(assetRef, {
        coinId: selectedCoin,
        symbol: coin.symbol,
        name: coin.name,
        color: coin.color,
        amount: parseFloat(amount),
        averageBuyPrice: parseFloat(buyPrice),
        updatedAt: new Date().toISOString()
      });

      setIsModalOpen(false);
      setAmount('');
      setBuyPrice('');
    } catch (error) {
      console.error("Erro ao guardar ativo:", error);
      alert("Erro ao guardar ativo. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. APAGAR ATIVO DO FIREBASE
  const handleRemoveAsset = async (coinId) => {
    if (!auth.currentUser) return;
    if (!window.confirm("Tem a certeza que deseja remover este ativo?")) return;

    try {
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', coinId);
      await deleteDoc(assetRef);
    } catch (error) {
      console.error("Erro ao remover ativo:", error);
    }
  };

  // 5. CÁLCULOS DO PORTFÓLIO
  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalInvested = 0;
    let totalValue24hAgo = 0;

    const enrichedAssets = portfolioAssets.map(asset => {
      const liveData = livePrices[asset.coinId] || { usd: asset.averageBuyPrice, usd_24h_change: 0 };
      const currentPrice = liveData.usd;
      const currentValue = asset.amount * currentPrice;
      const investedValue = asset.amount * asset.averageBuyPrice;
      const profitLoss = currentValue - investedValue;
      const profitLossPct = (profitLoss / investedValue) * 100;

      const change24hPct = typeof liveData.usd_24h_change === 'number' ? liveData.usd_24h_change : 0;
      const safeDenominator = 1 + change24hPct / 100;
      const price24hAgo = safeDenominator > 0 ? currentPrice / safeDenominator : currentPrice;
      const value24hAgo = asset.amount * price24hAgo;

      totalValue += currentValue;
      totalInvested += investedValue;
      totalValue24hAgo += value24hAgo;

      return {
        ...asset,
        currentPrice,
        currentValue,
        investedValue,
        profitLoss,
        profitLossPct,
        change24h: liveData.usd_24h_change
      };
    }).sort((a, b) => b.currentValue - a.currentValue); // Ordena por maior valor

    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    const change24hAbs = totalValue - totalValue24hAgo;
    const change24hPct = totalValue24hAgo > 0 ? (change24hAbs / totalValue24hAgo) * 100 : 0;

    let bestPerformer = null;
    let worstPerformer = null;

    if (enrichedAssets.length > 0) {
      bestPerformer = enrichedAssets.reduce(
        (best, asset) => (!best || asset.profitLossPct > best.profitLossPct ? asset : best),
        null,
      );
      worstPerformer = enrichedAssets.reduce(
        (worst, asset) => (!worst || asset.profitLossPct < worst.profitLossPct ? asset : worst),
        null,
      );
    }

    return {
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPct,
      change24hAbs,
      change24hPct,
      enrichedAssets,
      bestPerformer,
      worstPerformer,
    };
  }, [portfolioAssets, livePrices]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-12 grid gap-8 md:grid-cols-[260px,1fr]">
      {/* SIDEBAR ESQUERDA */}
      <aside className="space-y-4">
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/40 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  Portfólio próprio
                </p>
                <p className="text-sm font-bold text-white leading-tight">
                  Portfólio principal
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-2">Valor total</p>
          <p className="text-2xl font-extrabold text-white">
            $
            {portfolioStats.totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Meus portfólios
            </p>
            <span className="text-[11px] text-gray-500">1 ativo</span>
          </div>
          <div className="space-y-2 mb-4">
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#181818] border border-gray-700 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-white">Portfólio principal</p>
                <p className="text-[11px] text-gray-500">
                  Default • {portfolioStats.enrichedAssets.length} ativos
                </p>
              </div>
            </button>
          </div>
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-700 text-xs font-semibold text-gray-500 cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Novo portfólio (em breve)
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <section>
        {/* HEADER DO PORTFÓLIO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-blue-500" />
              Meu Portfólio
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-gray-400 text-sm">
                Acompanhe o valor e a performance da sua carteira.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <button
              type="button"
              onClick={() => {
                if (!wallets || wallets.length === 0) {
                  setLocalSyncWarning(
                    'Adicione pelo menos uma carteira em Perfil & Carteiras para puxar dados on-chain.',
                  );
                  return;
                }
                setLocalSyncWarning('');
                setSyncTrigger(Date.now().toString());
              }}
              className="bg-[#111] hover:bg-[#181818] text-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 border border-gray-700 shadow-sm outline-none focus:outline-none focus:ring-0"
            >
              {isSyncingOnChain ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400" />
              )}
              <span>Sync on-chain</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 outline-none focus:outline-none focus:ring-0 text-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar transação
            </button>
            <button
              type="button"
              className="bg-[#111] hover:bg-[#181818] text-gray-100 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 border border-gray-700 outline-none focus:outline-none focus:ring-0"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowCharts((prev) => !prev)}
              className="bg-[#111] hover:bg-[#181818] text-gray-100 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 border border-gray-700 outline-none focus:outline-none focus:ring-0"
            >
              {showCharts ? 'Ocultar gráficos' : 'Mostrar gráficos'}
            </button>
            <button
              type="button"
              className="bg-[#111] hover:bg-[#181818] text-gray-400 px-2.5 py-2.5 rounded-xl transition-colors border border-gray-700 outline-none focus:outline-none focus:ring-0 flex items-center justify-center"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">Valor total</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-4xl font-extrabold text-white">
              $
              {portfolioStats.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`font-semibold px-2 py-1 rounded-md ${
                  portfolioStats.change24hAbs >= 0
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {portfolioStats.change24hAbs >= 0 ? '+' : ''}
                $
                {Math.abs(portfolioStats.change24hAbs).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                (24h)
              </span>
              <span
                className={`font-semibold px-2 py-1 rounded-md ${
                  portfolioStats.change24hPct >= 0
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {portfolioStats.change24hPct >= 0 ? '+' : ''}
                {portfolioStats.change24hPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {(localSyncWarning || onChainWarning || onChainError) && (
          <div className="mb-6 bg-[#111111] border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-yellow-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-400" />
            <div>
              {localSyncWarning && <p>{localSyncWarning}</p>}
              {onChainWarning && <p>{onChainWarning}</p>}
              {onChainError && <p>{onChainError}</p>}
            </div>
          </div>
        )}

        {/* CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#111] border border-gray-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              {portfolioStats.totalProfitLoss >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <h3 className="font-semibold text-sm">Lucro total</h3>
            </div>
            <p
              className={`text-2xl font-black ${
                portfolioStats.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {portfolioStats.totalProfitLoss >= 0 ? '+' : ''}
              $
              {portfolioStats.totalProfitLoss.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p
              className={`mt-1 text-xs font-semibold ${
                portfolioStats.totalProfitLossPct >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {portfolioStats.totalProfitLossPct >= 0 ? '+' : ''}
              {portfolioStats.totalProfitLossPct.toFixed(2)}%
            </p>
          </div>

          <div className="bg-[#111] border border-gray-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-semibold text-sm">Cost basis</h3>
            </div>
            <p className="text-2xl font-black text-white">
              $
              {portfolioStats.totalInvested.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Somatório do capital investido em todas as posições.
            </p>
          </div>

          <div className="bg-[#111] border border-gray-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-sm">Best performer</h3>
            </div>
            {portfolioStats.bestPerformer ? (
              <>
                <p className="text-sm font-semibold text-white">
                  {portfolioStats.bestPerformer.name} ({portfolioStats.bestPerformer.symbol})
                </p>
                <p className="mt-1 text-lg font-extrabold text-green-400">
                  +
                  {portfolioStats.bestPerformer.profitLossPct.toFixed(2)}%
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">Adicione ativos para ver o destaque.</p>
            )}
          </div>

          <div className="bg-[#111] border border-gray-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-sm">Worst performer</h3>
            </div>
            {portfolioStats.worstPerformer ? (
              <>
                <p className="text-sm font-semibold text-white">
                  {portfolioStats.worstPerformer.name} ({portfolioStats.worstPerformer.symbol})
                </p>
                <p className="mt-1 text-lg font-extrabold text-red-400">
                  {portfolioStats.worstPerformer.profitLossPct.toFixed(2)}%
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">Adicione ativos para ver o destaque.</p>
            )}
          </div>
        </div>

        {/* ÁREA DE GRÁFICOS */}
        {showCharts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white">Histórico</p>
                <div className="flex gap-1">
                  {['24h', '7d', '30d', '90d', 'Tudo'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={`px-2 py-1 rounded-full text-[11px] ${
                        label === '30d'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-[#1b1b1b]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 rounded-xl border border-gray-800 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-60">
                  <div className="w-full h-full bg-[radial-gradient(circle_at_0_0,#ef4444_0,transparent_50%),radial-gradient(circle_at_100%_100%,#3b82f6_0,transparent_55%)]" />
                </div>
                <div className="relative h-40 flex items-center justify-center">
                  <p className="text-xs text-gray-500">
                    Gráfico histórico detalhado será ligado à API.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col">
              <p className="text-sm font-semibold text-white mb-4">
                Desempenho cumulativo vs BTC
              </p>
              <div className="flex-1 rounded-xl border border-gray-800 bg-gradient-to-br from-emerald-500/5 via-transparent to-yellow-500/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-60">
                  <div className="w-full h-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.02)_0,rgba(255,255,255,0.02)_4px,transparent_4px,transparent_8px)]" />
                </div>
                <div className="relative h-40 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-3 h-1.5 rounded-full bg-emerald-400" />{' '}
                    <span className="text-gray-400">Portfólio</span>
                    <span className="w-3 h-1.5 rounded-full bg-yellow-400" />{' '}
                    <span className="text-gray-400">BTC</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center max-w-xs">
                    Espaço reservado para comparar a curva de lucro acumulado com a referência de
                    mercado.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col">
              <p className="text-sm font-semibold text-white mb-4">Alocação por ativo</p>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-[#0b0b0b] border border-gray-800" />
                  <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-500/40 via-emerald-400/30 to-purple-500/40 blur-[2px]" />
                  <div className="absolute inset-7 rounded-full bg-[#0b0b0b]" />
                </div>
                <div className="flex-1 space-y-2">
                  {portfolioStats.enrichedAssets.slice(0, 4).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: asset.color }}
                        />
                        <span className="text-gray-300">
                          {asset.name} ({asset.symbol})
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {(
                          (asset.currentValue / (portfolioStats.totalValue || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  ))}
                  {portfolioStats.enrichedAssets.length === 0 && (
                    <p className="text-xs text-gray-500">
                      Adicione ativos para visualizar a alocação.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABELA DE ATIVOS */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-[#151515]">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Ativo
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    1h%
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    24h%
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    7d%
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Holdings
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Preço médio
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Lucro / Perda
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {portfolioStats.enrichedAssets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>O seu portfólio está vazio.</p>
                      <p className="text-sm mt-1">
                        Clique em &quot;Adicionar transação&quot; para começar.
                      </p>
                    </td>
                  </tr>
                ) : (
                  portfolioStats.enrichedAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: asset.color }}
                          >
                            {asset.symbol[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white">{asset.name}</p>
                            <p className="text-xs text-gray-500 font-mono">
                              {asset.symbol} • {asset.amount}{' '}
                              {asset.symbol}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white">
                          $
                          {asset.currentPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-gray-600">—</span>
                      </td>
                      <td className="p-4">
                        <p
                          className={`text-xs font-semibold ${
                            asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h?.toFixed(2)}%
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-gray-600">—</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white">
                          $
                          {asset.currentValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {asset.amount}{' '}
                          {asset.symbol}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-gray-400">
                          $
                          {asset.averageBuyPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        <p
                          className={`font-bold text-sm ${
                            asset.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {asset.profitLoss >= 0 ? '+' : ''}
                          $
                          {asset.profitLoss.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            asset.profitLossPct >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {asset.profitLossPct >= 0 ? '+' : ''}
                          {asset.profitLossPct.toFixed(2)}%
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCoin(asset.coinId);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors outline-none focus:outline-none focus:ring-0"
                            title="Adicionar transação"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"
                            title="Remover ativo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECÇÃO OPCIONAL PARA DADOS ON-CHAIN (quando implementados no web3Api) */}
        {onChainTokens && onChainTokens.length > 0 && (
          <div className="mt-10 bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Visão on-chain das carteiras</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#151515]">
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Valor (USD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {onChainTokens.map((token) => (
                    <tr key={token.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{token.symbol}</span>
                          <span className="text-xs text-gray-500">{token.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm text-gray-100">
                          {token.amount?.toLocaleString('en-US', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 8,
                          })}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm text-gray-100">
                          {typeof token.valueUsd === 'number'
                            ? `$${token.valueUsd.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* MODAL ADICIONAR ATIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Adicionar Transação</h2>
            
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Moeda</label>
                <select 
                  value={selectedCoin}
                  onChange={(e) => setSelectedCoin(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  {SUPPORTED_COINS.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Quantidade Comprada</label>
                <input 
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 0.5"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Preço Médio de Compra (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input 
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Ex: 60000"
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-800">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-800 transition-colors outline-none focus:outline-none focus:ring-0"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 outline-none focus:outline-none focus:ring-0"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gravar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}