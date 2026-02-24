import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Info, TrendingUp, TrendingDown, Calculator, RefreshCw, AlertCircle, Save, Trash2, History, BarChart3, Loader2, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import TokenSelector from '../components/defi/TokenSelector';
import PositionStatus from '../components/defi/PositionStatus';

// Fallback tokens list (Top 20)
const FALLBACK_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin', defaultIV: 45, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { symbol: 'ETH', name: 'Ethereum', id: 'ethereum', defaultIV: 55, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { symbol: 'BNB', name: 'BNB', id: 'binancecoin', defaultIV: 60, image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { symbol: 'SOL', name: 'Solana', id: 'solana', defaultIV: 70, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { symbol: 'XRP', name: 'Ripple', id: 'ripple', defaultIV: 65, image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { symbol: 'ADA', name: 'Cardano', id: 'cardano', defaultIV: 70, image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2', defaultIV: 70, image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin', defaultIV: 75, image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { symbol: 'DOT', name: 'Polkadot', id: 'polkadot', defaultIV: 68, image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { symbol: 'MATIC', name: 'Polygon', id: 'matic-network', defaultIV: 75, image: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png' },
  { symbol: 'LINK', name: 'Chainlink', id: 'chainlink', defaultIV: 65, image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { symbol: 'UNI', name: 'Uniswap', id: 'uniswap', defaultIV: 75, image: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png' },
  { symbol: 'LTC', name: 'Litecoin', id: 'litecoin', defaultIV: 55, image: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { symbol: 'ATOM', name: 'Cosmos', id: 'cosmos', defaultIV: 70, image: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png' },
  { symbol: 'ARB', name: 'Arbitrum', id: 'arbitrum', defaultIV: 80, image: 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg' },
  { symbol: 'OP', name: 'Optimism', id: 'optimism', defaultIV: 80, image: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png' },
  { symbol: 'AAVE', name: 'Aave', id: 'aave', defaultIV: 70, image: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' },
  { symbol: 'CRV', name: 'Curve', id: 'curve-dao-token', defaultIV: 80, image: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png' },
  { symbol: 'MKR', name: 'Maker', id: 'maker', defaultIV: 65, image: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png' },
  { symbol: 'SNX', name: 'Synthetix', id: 'synthetix-network-token', defaultIV: 85, image: 'https://assets.coingecko.com/coins/images/3406/small/SNX.png' },
];

const STABLECOINS = [
  'tether', 'usd-coin', 'dai', 'frax', 'true-usd', 'paxos-standard',
  'binance-usd', 'gemini-dollar', 'liquity-usd', 'terrausd', 'neutrino',
  'fei-usd', 'magic-internet-money', 'usdd', 'ethena-usde', 'first-digital-usd',
  'paypal-usd', 'origin-dollar', 'alchemix-usd', 'frax-price-index'
];

const FALLBACK_PRICES = {
  ethereum: 3200, bitcoin: 67000, solana: 145, chainlink: 14,
  'matic-network': 0.58, arbitrum: 0.82, optimism: 1.85,
  'avalanche-2': 28, uniswap: 7.5, aave: 95,
  binancecoin: 610, ripple: 0.52, cardano: 0.38,
  dogecoin: 0.08, polkadot: 5.1, litecoin: 75,
  cosmos: 6.8, 'curve-dao-token': 0.72, maker: 1420,
  'synthetix-network-token': 2.1,
};

// Custom Tooltip Component
const InfoTooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      {children}
      <button
        className="ml-1.5 text-gray-500 hover:text-blue-400 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <Info size={15} />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-[#111] border border-gray-700 rounded-xl text-xs text-gray-300 w-72 shadow-2xl shadow-black/50">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
        </div>
      )}
    </span>
  );
};

// Result Card Component
const ResultCard = ({ title, hodlValue, lpValue, tooltip }) => {
  const diff = lpValue - hodlValue;
  const diffPercent = hodlValue !== 0 ? ((diff / hodlValue) * 100) : 0;
  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <InfoTooltip text={tooltip}>
          <span className="text-sm text-gray-400 font-medium">{title}</span>
        </InfoTooltip>
        {diff >= 0 ? <TrendingUp size={20} className="text-emerald-400" /> : <TrendingDown size={20} className="text-red-400" />}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-gray-500 mb-2">HODL</p>
          <p className="text-xl font-bold text-white">${hodlValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">LP + Taxas</p>
          <p className="text-xl font-bold text-white">${lpValue.toFixed(2)}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
        <span className="text-sm text-gray-500">Diferença</span>
        <span className={`font-semibold text-base ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {diff >= 0 ? '+' : ''}{diff.toFixed(2)} ({diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};

// Metric Card Component - color map to avoid dynamic class purging
const colorMap = {
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
};

const MetricCard = ({ label, value, subValue, color = 'blue', tooltip }) => (
  <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
    <InfoTooltip text={tooltip}>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </InfoTooltip>
    <p className={`text-2xl font-bold mt-2 ${colorMap[color] || colorMap.blue}`}>{value}</p>
    {subValue && <p className="text-xs text-gray-600 mt-2">{subValue}</p>}
  </div>
);

export default function UniswapCalc() {
  // State
  const [tokens, setTokens] = useState(FALLBACK_TOKENS);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);
  const [spotPrice, setSpotPrice] = useState(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [principal, setPrincipal] = useState(3000);
  const [days, setDays] = useState(7);
  const [impliedVolatility, setImpliedVolatility] = useState(55);
  const [priceLow, setPriceLow] = useState(0);
  const [priceHigh, setPriceHigh] = useState(0);
  const [manualRangeEdit, setManualRangeEdit] = useState(false);
  const [expectedAPR, setExpectedAPR] = useState(60);
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('v1');
  const [selectedQuoteToken, setSelectedQuoteToken] = useState(null);
  const [quotePrice, setQuotePrice] = useState(0);
  const [pairVolatility, setPairVolatility] = useState(0);
  const [correlation, setCorrelation] = useState(0.5);

  // Auto-IV Engine State
  const [isCalculatingIV, setIsCalculatingIV] = useState(false);
  const [ivCalculationStatus, setIvCalculationStatus] = useState(null);
  const [ivSource, setIvSource] = useState('estimated');
  const [ivPeriod, setIvPeriod] = useState(30);

  // Fetch token list
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
        );
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        const shouldFilterStables = activeTab === 'v1';
        const filteredTokens = data
          .filter(token => shouldFilterStables ? !STABLECOINS.includes(token.id) : true)
          .map(token => ({
            symbol: token.symbol.toUpperCase(),
            name: token.name,
            id: token.id,
            image: token.image,
            defaultIV: calculateDefaultIV(token.market_cap_rank),
            currentPrice: token.current_price
          }))
          .slice(0, 50);
        if (filteredTokens.length > 0) {
          setTokens(filteredTokens);
          if (!selectedToken) setSelectedToken(filteredTokens[0]);
          if (activeTab === 'v2' && !selectedQuoteToken) {
            setSelectedQuoteToken(filteredTokens[1]);
          }
        }
      } catch (error) {
        console.error('Token fetch error:', error);
        setTokens(FALLBACK_TOKENS);
        if (!selectedToken) setSelectedToken(FALLBACK_TOKENS[0]);
      } finally {
        setIsLoadingTokens(false);
      }
    };
    fetchTokens();
  }, [activeTab]);

  const calculateDefaultIV = (rank) => {
    if (rank <= 5) return 50;
    if (rank <= 10) return 60;
    if (rank <= 20) return 70;
    if (rank <= 50) return 80;
    return 90;
  };

  // Auto-IV Engine - refactored to avoid recursive state corruption
  const calculateVolatilityFromHistory = async (tokenId, initialDays = 30) => {
    setIsCalculatingIV(true);
    setIvCalculationStatus(null);

    // Try multiple day ranges without recursion
    const dayRanges = [initialDays, 7, 1];

    for (const days of dayRanges) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
        );
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        const prices = data.prices?.map(p => p[1]);
        if (!prices || prices.length < 5) throw new Error('Insufficient data');

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
          returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        const annualizedVol = stdDev * Math.sqrt(365) * 100;

        setImpliedVolatility(Math.round(annualizedVol));
        setIvCalculationStatus('success');
        setIvSource(`${days}d_history`);
        setIsCalculatingIV(false);
        return Math.round(annualizedVol);
      } catch (error) {
        console.error(`HV calculation error for ${days}d:`, error);
        // Continue to next day range
        continue;
      }
    }

    // All attempts failed, use fallback
    const estimatedIV = getSmartFallbackIV(tokenId);
    setImpliedVolatility(estimatedIV);
    setIvCalculationStatus('fallback');
    setIvSource('correlation_estimate');
    setIsCalculatingIV(false);
    return estimatedIV;
  };

  const getSmartFallbackIV = (tokenId) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return 60;
    const majorTokens = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 'cardano'];
    if (majorTokens.includes(tokenId)) return 50;
    const defiBlueChips = ['uniswap', 'aave', 'maker', 'curve-dao-token', 'chainlink'];
    if (defiBlueChips.includes(tokenId)) return 65;
    const layer2Tokens = ['arbitrum', 'optimism', 'polygon'];
    if (layer2Tokens.includes(tokenId)) return 75;
    return token.defaultIV || 80;
  };

  // Fetch price
  const fetchPrice = useCallback(async (tokenId) => {
    setIsLoadingPrice(true);
    setPriceError(false);
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
      );
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      const price = data[tokenId]?.usd;
      if (price) {
        setSpotPrice(price);
      } else {
        throw new Error('No price data');
      }
    } catch (error) {
      console.error('Price fetch error:', error);
      setPriceError(true);
      setSpotPrice(FALLBACK_PRICES[tokenId] || 100);
    } finally {
      setIsLoadingPrice(false);
    }
  }, []);

  // Handle token selection with Auto-IV
  useEffect(() => {
    if (selectedToken) {
      if (selectedToken.currentPrice) {
        setSpotPrice(selectedToken.currentPrice);
        setIsLoadingPrice(false);
      } else {
        fetchPrice(selectedToken.id);
      }
      if (activeTab === 'v1') {
        calculateVolatilityFromHistory(selectedToken.id, ivPeriod).then(calculatedIV => {
          if (!calculatedIV) setImpliedVolatility(selectedToken.defaultIV);
        });
      }
    }
  }, [selectedToken, activeTab, ivPeriod]);

  // Auto-Range Algorithm
  useEffect(() => {
    if (spotPrice > 0 && !manualRangeEdit) {
      const volPeriod = (impliedVolatility / 100) * Math.sqrt(days / 365);
      const volPercent = Math.ceil(volPeriod * 100) / 100;
      const low = spotPrice * (1 - volPercent);
      const high = spotPrice * (1 + volPercent);
      setPriceLow(Number(low.toFixed(2)));
      setPriceHigh(Number(high.toFixed(2)));
    }
  }, [spotPrice, days, impliedVolatility, manualRangeEdit]);

  // Mathematical calculations
  const calculations = useMemo(() => {
    if (spotPrice <= 0 || priceLow <= 0 || priceHigh <= 0 || priceLow >= priceHigh) return null;

    let P, Pa, Pb;
    let quoteAssetPrice = 1;
    if (activeTab === 'v2') {
      if (!quotePrice || quotePrice <= 0) return null;
      P = spotPrice / quotePrice;
      Pa = priceLow / quotePrice;
      Pb = priceHigh / quotePrice;
      quoteAssetPrice = quotePrice;
    } else {
      P = spotPrice; Pa = priceLow; Pb = priceHigh;
    }

    const capital = principal;
    const sqrtP = Math.sqrt(P);
    const sqrtPa = Math.sqrt(Pa);
    const sqrtPb = Math.sqrt(Pb);
    const denominator = 2 * (sqrtP - sqrtPa + P * (1/sqrtP - 1/sqrtPb));
    const L = denominator > 0 ? capital / denominator : 0;
    const token0Amount = L * (sqrtP - sqrtPa);
    const token1Amount = L * (1/sqrtP - 1/sqrtPb) * P;

    const effectiveVolatility = activeTab === 'v2' ? pairVolatility : impliedVolatility;
    const volPeriod = (effectiveVolatility / 100) * Math.sqrt(days / 365);
    const futureHigh = P * (1 + volPeriod);
    const futureLow = P * (1 - volPeriod);

    const calculateLPValueV2 = (price) => {
      const sqrtPrice = Math.sqrt(price);
      if (price <= Pa) { return L * (1/sqrtPa - 1/sqrtPb) * price; }
      else if (price >= Pb) { return L * (sqrtPb - sqrtPa); }
      else {
        const x = L * (1/sqrtPrice - 1/sqrtPb);
        const y = L * (sqrtPrice - sqrtPa);
        return x * price + y;
      }
    };

    const initialVolatileTokens = capital / 2 / P;
    const initialStable = capital / 2;
    let hodlValueHigh, hodlValueLow, hodlValueCurrent;
    if (activeTab === 'v2') {
      hodlValueHigh = (initialVolatileTokens * futureHigh + initialStable) * quoteAssetPrice;
      hodlValueLow = (initialVolatileTokens * futureLow + initialStable) * quoteAssetPrice;
      hodlValueCurrent = capital;
    } else {
      hodlValueHigh = initialVolatileTokens * futureHigh + initialStable;
      hodlValueLow = initialVolatileTokens * futureLow + initialStable;
      hodlValueCurrent = capital;
    }

    let lpValueHigh = calculateLPValueV2(futureHigh);
    let lpValueLow = calculateLPValueV2(futureLow);
    let lpValueCurrent = calculateLPValueV2(P);
    if (activeTab === 'v2') {
      lpValueHigh *= quoteAssetPrice;
      lpValueLow *= quoteAssetPrice;
      lpValueCurrent *= quoteAssetPrice;
    }

    const lpMultiplier = capital / lpValueCurrent;
    const normalizedLpHigh = lpValueHigh * lpMultiplier;
    const normalizedLpLow = lpValueLow * lpMultiplier;
    const ilHigh = ((normalizedLpHigh - hodlValueHigh) / hodlValueHigh) * 100;
    const ilLow = ((normalizedLpLow - hodlValueLow) / hodlValueLow) * 100;
    const dailyAPR = expectedAPR / 365;
    const periodFees = capital * (dailyAPR / 100) * days;
    const lpWithFeesHigh = normalizedLpHigh + periodFees;
    const lpWithFeesLow = normalizedLpLow + periodFees;
    const ilDollarHigh = hodlValueHigh - normalizedLpHigh;
    const ilDollarLow = hodlValueLow - normalizedLpLow;
    const avgILDollar = (Math.max(0, ilDollarHigh) + Math.max(0, ilDollarLow)) / 2;
    const breakEvenAPR = (avgILDollar / capital) * (365 / days) * 100;
    const volatileInLP = (token0Amount * P / capital) * 100;
    const stableInLP = 100 - volatileInLP;

    const ilCurveData = [];
    const priceRange = Pb - Pa;
    const extendedLow = Pa - priceRange * 0.3;
    const extendedHigh = Pb + priceRange * 0.3;
    for (let i = 0; i <= 50; i++) {
      const price = extendedLow + (extendedHigh - extendedLow) * (i / 50);
      const hodl = initialVolatileTokens * price + initialStable;
      const lp = calculateLPValueV2(price) * lpMultiplier;
      const il = ((lp - hodl) / hodl) * 100;
      ilCurveData.push({
        price: Number(price.toFixed(2)),
        il: Number(il.toFixed(2)),
        lpValue: Number(lp.toFixed(2)),
        hodlValue: Number(hodl.toFixed(2)),
        inRange: price >= Pa && price <= Pb
      });
    }

    return {
      liquidity: L, token0Amount, token1Amount, volatileInLP, stableInLP,
      futureHigh, futureLow, hodlValueHigh, hodlValueLow,
      lpValueHigh: normalizedLpHigh, lpValueLow: normalizedLpLow,
      lpWithFeesHigh, lpWithFeesLow, ilHigh, ilLow, periodFees,
      breakEvenAPR, ilCurveData, volPeriod: volPeriod * 100,
      rangePercent: Math.ceil((effectiveVolatility / 100) * Math.sqrt(days / 365) * 100),
      effectivePrice: P, quoteAssetPrice
    };
  }, [spotPrice, priceLow, priceHigh, principal, days, impliedVolatility, expectedAPR, activeTab, quotePrice, pairVolatility]);

  const handleManualRangeChange = (setter) => (e) => {
    setManualRangeEdit(true);
    setter(Number(e.target.value));
  };

  const resetAutoRange = () => setManualRangeEdit(false);

  const savePosition = async () => {
    if (!selectedToken || !spotPrice || !calculations || !auth.currentUser) {
      console.error('Cannot save position: missing required data or user not authenticated');
      alert('Erro: Utilizador não autenticado. Por favor, faça login novamente.');
      return;
    }
    const newPosition = {
      id: Date.now(), timestamp: new Date().toISOString(), mode: activeTab,
      tokenSymbol: selectedToken.symbol, tokenName: selectedToken.name, tokenId: selectedToken.id,
      entryPrice: spotPrice,
      quoteTokenSymbol: activeTab === 'v2' ? selectedQuoteToken?.symbol : 'USDC',
      quoteTokenId: activeTab === 'v2' ? selectedQuoteToken?.id : null,
      quotePrice: activeTab === 'v2' ? quotePrice : 1,
      priceLow, priceHigh, principal,
      impliedVolatility: activeTab === 'v2' ? pairVolatility : impliedVolatility,
      days, expectedAPR, breakEvenAPR: calculations.breakEvenAPR, feesCollected: []
    };

    setIsSavingPosition(true);
    try {
      const posId = Date.now().toString();
      const posRef = doc(db, 'users', auth.currentUser.uid, 'defi', posId);

      await setDoc(posRef, {
        type: 'uniswap-pool',
        protocol: 'Uniswap V3',
        asset: `${newPosition.tokenSymbol}/${newPosition.quoteTokenSymbol}`,
        capital: newPosition.principal,
        apr: newPosition.expectedAPR,
        ...newPosition,
        updatedAt: new Date().toISOString(),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar posição:', error);
      alert('Erro ao salvar posição. Verifique se está autenticado.');
    } finally {
      setIsSavingPosition(false);
    }
  };

  // Loading state
  if (isLoadingTokens || !selectedToken) {
    return (
      <div className="animate-in fade-in flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-400 animate-spin mx-auto mb-5" />
          <p className="text-gray-400 text-lg">Carregando tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-500" />
            Calculadora de Pools
          </h1>
          <p className="text-gray-400 text-sm">Simulador Uniswap V3 - Liquidez Concentrada & Impermanent Loss</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://medium.com/@schulz_99930/dominando-a-matem%C3%A1tica-da-liquidez-o-guia-da-calculadora-de-valor-esperado-ev-a370511328ba?postPublishedType=initial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111] text-gray-400 border border-gray-700 hover:border-blue-500/50 hover:text-blue-400 transition-all text-sm font-medium"
          >
            <Info size={16} />
            <span className="hidden lg:inline">Guia Oficial</span>
          </a>
        </div>
      </div>

      {/* 3-Tab Navigation */}
      <div className="mb-8">
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-2 flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('v1')}
            className={`flex-1 min-w-[140px] px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'v1' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-[#181818]'
            }`}>
            <span className="hidden sm:inline">Par Estável</span>
            <span className="sm:hidden">Estável</span>
          </button>
          <button onClick={() => setActiveTab('v2')}
            className={`flex-1 min-w-[140px] px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'v2' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-[#181818]'
            }`}>
            <span className="hidden sm:inline">Par Volátil</span>
            <span className="sm:hidden">Volátil</span>
          </button>
        </div>

        {/* Tab Info Banner */}
        {(activeTab === 'v1' || activeTab === 'v2') && (
          <div className={`mt-4 rounded-2xl p-5 border ${
            activeTab === 'v1' ? 'bg-blue-500/5 border-blue-500/30' : 'bg-purple-500/5 border-purple-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activeTab === 'v1' ? 'bg-blue-500/20' : 'bg-purple-500/20'
              }`}>
                <Info size={20} className={activeTab === 'v1' ? 'text-blue-400' : 'text-purple-400'} />
              </div>
              <div>
                <h3 className={`font-bold text-base mb-1 ${activeTab === 'v1' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {activeTab === 'v1' ? 'Modo Par Estável: Token Volátil + Stablecoin' : 'Modo Par Volátil: Token A + Token B'}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {activeTab === 'v1'
                    ? 'Ideal para acumular dólares ou fazer DCA. Alto risco de IL se o mercado explodir, mas lucro previsível em mercados laterais.'
                    : 'Ideal para pares correlacionados (ex: ETH/BTC, SOL/ETH). Ajuste a correlação esperada entre os ativos.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calculator Tabs (V1 & V2) */}
      <>
        {/* V2 Maintenance Mode */}
        {activeTab === 'v2' && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-24 h-24 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Módulo em Manutenção</h2>
              <p className="text-gray-400 mb-6">
                Estamos refinando os modelos de correlação para pares voláteis.
                <br />
                <span className="text-purple-400 font-semibold">Use o Modo Par Estável enquanto isso.</span>
              </p>
            </div>
          </div>
        )}

        {/* V1 Calculator */}
        {activeTab === 'v1' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Token Selection */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl relative z-50">
              <h2 className="text-base font-semibold text-gray-300 mb-5 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" />
                Seleção de Token
              </h2>
              <div className="space-y-4">
                <div className="relative z-50">
                  <label className="text-sm text-gray-400 mb-3 block font-medium">Token Volátil</label>
                  <TokenSelector tokens={tokens} selectedToken={selectedToken} onSelect={(token) => { setSelectedToken(token); setManualRangeEdit(false); }} />
                  <p className="text-xs text-gray-600 mt-3 flex items-center justify-between">
                    <span>Par: <span className="text-blue-400 font-medium">{selectedToken?.symbol}/USDC</span></span>
                    <span className="bg-[#0D0F13] px-2 py-0.5 rounded-md">{tokens.length} tokens</span>
                  </p>
                </div>
                <div className="bg-[#0D0F13] rounded-2xl p-5 border border-gray-700/50 relative z-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400 font-medium">Preço Atual (USD)</span>
                    {isLoadingPrice && <RefreshCw size={16} className="text-blue-400 animate-spin" />}
                  </div>
                  <p className="text-3xl font-bold text-white mb-3">
                    ${spotPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <button onClick={() => fetchPrice(selectedToken.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium">
                    <RefreshCw size={12} /> Atualizar preço
                  </button>
                </div>
              </div>
            </div>

            {/* Position Settings */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl relative z-0">
              <h2 className="text-base font-semibold text-gray-300 mb-5">Configurações da Posição</h2>
              <div className="space-y-5">
                <div>
                  <InfoTooltip text="O valor total em dólares que você deseja alocar na posição de liquidez.">
                    <label className="text-sm text-gray-400 font-medium">Capital Principal ($)</label>
                  </InfoTooltip>
                  <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="w-full bg-[#0D0F13] border border-gray-700 rounded-xl px-4 py-3.5 text-white mt-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base" placeholder="3000" />
                </div>
                <div>
                  <InfoTooltip text="Por quantos dias você pretende manter a posição aberta.">
                    <label className="text-sm text-gray-400 font-medium">Dias na Posição</label>
                  </InfoTooltip>
                  <input type="number" value={days} onChange={(e) => { setDays(Number(e.target.value)); setManualRangeEdit(false); }} min={1} max={365} className="w-full bg-[#0D0F13] border border-gray-700 rounded-xl px-4 py-3.5 text-white mt-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base" placeholder="7" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[1, 7, 30, 90, 180].map(d => (
                      <button key={d} onClick={() => { setDays(d); setManualRangeEdit(false); }} className={`text-sm px-4 py-2 rounded-lg transition-all font-medium ${days === d ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-[#0D0F13] text-gray-400 border border-gray-700 hover:border-gray-600'}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <InfoTooltip text="Historical Volatility calculada automaticamente usando retornos logarítmicos e desvio padrão anualizado.">
                      <label className="text-sm text-gray-400 font-medium">Volatilidade Histórica (HV)</label>
                    </InfoTooltip>
                    {isCalculatingIV ? (
                      <span className="flex items-center gap-1 text-xs text-blue-400"><RefreshCw size={12} className="animate-spin" />Calculando...</span>
                    ) : ivCalculationStatus === 'success' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">{ivSource}</span>
                    ) : ivCalculationStatus === 'fallback' ? (
                      <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md"><AlertCircle size={12} />Estimado</span>
                    ) : null}
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[7, 30, 90].map(period => (
                      <button key={period} onClick={() => setIvPeriod(period)} disabled={isCalculatingIV} className={`flex-1 text-xs px-3 py-2 rounded-lg transition-all font-medium ${ivPeriod === period ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-[#0D0F13] text-gray-400 border border-gray-700 hover:border-gray-600 disabled:opacity-50'}`}>
                        {period}d
                      </button>
                    ))}
                  </div>
                  <input type="number" value={impliedVolatility} onChange={(e) => { setImpliedVolatility(Number(e.target.value)); setManualRangeEdit(false); }} min={1} max={200} className="w-full bg-[#0D0F13] border border-gray-700 rounded-xl px-4 py-3.5 text-white mt-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base" />
                  <input type="range" value={impliedVolatility} onChange={(e) => { setImpliedVolatility(Number(e.target.value)); setManualRangeEdit(false); }} min={10} max={150} className="w-full mt-3 h-2 accent-blue-500 cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>10%</span>
                    <span className="text-blue-400 font-medium">{impliedVolatility}%</span>
                    <span>150%</span>
                  </div>
                </div>
                <div>
                  <InfoTooltip text="Taxa de rendimento anual esperada das taxas de trading na pool.">
                    <label className="text-sm text-gray-400 font-medium">APR Esperado (%)</label>
                  </InfoTooltip>
                  <input type="number" value={expectedAPR} onChange={(e) => setExpectedAPR(Number(e.target.value))} min={0} max={500} className="w-full bg-[#0D0F13] border border-gray-700 rounded-xl px-4 py-3.5 text-white mt-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base" placeholder="60" />
                </div>
              </div>
            </div>

            {/* Range Settings */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl relative z-0">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-300">Range de Preço</h2>
                {manualRangeEdit && (
                  <button onClick={resetAutoRange} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors font-medium">
                    <RefreshCw size={14} /> Auto-Range
                  </button>
                )}
              </div>
              {calculations && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-medium">Range automático (IV)</span>
                    <span className="text-lg font-bold text-blue-400">±{calculations.rangePercent}%</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InfoTooltip text="Preço mínimo do range."><label className="text-sm text-gray-400 font-medium">Preço Mínimo</label></InfoTooltip>
                  <input type="number" value={priceLow} onChange={handleManualRangeChange(setPriceLow)} className="w-full bg-[#0D0F13] border border-gray-700 rounded-xl px-4 py-3.5 text-white mt-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base" />
                </div>
                <div>
                  <InfoTooltip text="Preço máximo do range."><label className="text-sm text-gray-400 font-medium">Preço Máximo</label></InfoTooltip>
                  <input type="number" value={priceHigh} onChange={handleManualRangeChange(setPriceHigh)} className="w-full bg-[#0D0F13] border border-gray-700 rounded-xl px-4 py-3.5 text-white mt-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-8 space-y-6">
            {calculations ? (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard label="Volatilidade do Período" value={`${calculations.volPeriod.toFixed(2)}%`} tooltip="Volatilidade esperada para o período selecionado." />
                  <MetricCard label="Preço Futuro Alto" value={`$${calculations.futureHigh.toFixed(2)}`} subValue="+1 desvio padrão" color="emerald" tooltip="Preço projetado em cenário otimista." />
                  <MetricCard label="Preço Futuro Baixo" value={`$${calculations.futureLow.toFixed(2)}`} subValue="-1 desvio padrão" color="red" tooltip="Preço projetado em cenário pessimista." />
                  <MetricCard label="Taxas Estimadas" value={`$${calculations.periodFees.toFixed(2)}`} subValue={`${days} dias @ ${expectedAPR}% APR`} color="purple" tooltip="Receita estimada de taxas para o período." />
                </div>

                {/* Composition */}
                <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-semibold text-gray-300 mb-5">Composição da Posição LP</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-[#0D0F13] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" style={{ width: `${calculations.volatileInLP}%` }} />
                      </div>
                      <div className="flex justify-between mt-3 text-sm">
                        <span className="font-medium text-blue-400">{selectedToken?.symbol}: {calculations.volatileInLP.toFixed(1)}%</span>
                        <span className="font-medium text-purple-400">USDC: {calculations.stableInLP.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  <ResultCard title="Cenário de Alta" hodlValue={calculations.hodlValueHigh} lpValue={calculations.lpWithFeesHigh} tooltip="Comparação entre HODL e LP se o preço subir 1 desvio padrão." />
                  <ResultCard title="Cenário de Baixa" hodlValue={calculations.hodlValueLow} lpValue={calculations.lpWithFeesLow} tooltip="Comparação entre HODL e LP se o preço cair 1 desvio padrão." />
                </div>

                {/* IL & Break-even */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
                    <InfoTooltip text="IL no cenário de alta."><span className="text-sm text-gray-400 font-medium">IL Cenário Alta</span></InfoTooltip>
                    <p className={`text-3xl font-bold mt-3 ${calculations.ilHigh >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{calculations.ilHigh.toFixed(2)}%</p>
                  </div>
                  <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
                    <InfoTooltip text="IL no cenário de baixa."><span className="text-sm text-gray-400 font-medium">IL Cenário Baixa</span></InfoTooltip>
                    <p className={`text-3xl font-bold mt-3 ${calculations.ilLow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{calculations.ilLow.toFixed(2)}%</p>
                  </div>
                  <div className="bg-purple-500/5 border border-purple-500/30 rounded-xl p-5">
                    <InfoTooltip text="APR mínimo para compensar o IL esperado."><span className="text-sm text-gray-400 font-medium">Break-even APR</span></InfoTooltip>
                    <p className="text-3xl font-bold mt-3 text-purple-400">{calculations.breakEvenAPR.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {expectedAPR >= calculations.breakEvenAPR
                        ? <span className="text-emerald-400 font-medium">APR suficiente</span>
                        : <span className="text-amber-400 font-medium">APR insuficiente</span>}
                    </p>
                  </div>
                </div>

                {/* IL Curve Chart */}
                <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-semibold text-gray-300 mb-5">Curva de Impermanent Loss</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={calculations.ilCurveData}>
                        <defs>
                          <linearGradient id="ilGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="price" stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
                        <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${v}%`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #374151', borderRadius: '12px', fontSize: '13px' }}
                          formatter={(value, name) => { if (name === 'il') return [`${value}%`, 'Impermanent Loss']; return [value, name]; }}
                          labelFormatter={(label) => `Preço: $${label}`}
                        />
                        <ReferenceLine x={spotPrice} stroke="#a855f7" strokeDasharray="5 5" label={{ value: 'Atual', fill: '#a855f7', fontSize: 11 }} />
                        <ReferenceLine x={priceLow} stroke="#22c55e" strokeDasharray="3 3" />
                        <ReferenceLine x={priceHigh} stroke="#22c55e" strokeDasharray="3 3" />
                        <ReferenceLine y={0} stroke="#6b7280" />
                        <Area type="monotone" dataKey="il" stroke="#3b82f6" fill="url(#ilGradient)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-8 mt-5 text-xs text-gray-500">
                    <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-purple-500" /> Preço Atual</span>
                    <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-emerald-500" /> Range</span>
                    <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-blue-500" /> Curva IL</span>
                  </div>
                </div>

                {/* Save Position */}
                <div className="flex justify-center">
                  <button onClick={savePosition} disabled={!calculations || isSavingPosition} className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-2xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 text-base">
                    {isSavingPosition ? <Loader2 size={20} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Save size={20} />}
                    {saveSuccess ? 'Posição Salva!' : 'Salvar Posição'}
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/5 border border-gray-800 rounded-2xl p-6">
                  <h4 className="text-base font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <Info size={18} className="text-blue-400" /> Sobre os Cálculos
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
                    <div><p className="font-semibold text-gray-300 mb-2">Regra dos 68%</p><p>A probabilidade de permanecer dentro de um range usando a IV como guia é de aproximadamente 68%.</p></div>
                    <div><p className="font-semibold text-gray-300 mb-2">Regra do Risco Duplo</p><p>A probabilidade de tocar o range dentro do período é aproximadamente o dobro da probabilidade de terminar fora dele.</p></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-96 bg-[#111] rounded-2xl border border-gray-800 shadow-xl">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-2xl bg-[#0D0F13] flex items-center justify-center mx-auto mb-6">
                    <Calculator size={48} className="text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg font-medium">Configure os parâmetros</p>
                  <p className="text-gray-600 text-sm mt-2">Os resultados aparecerão aqui</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </>
    </div>
  );
}
