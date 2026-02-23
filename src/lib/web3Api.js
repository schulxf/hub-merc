// Camada de integração Web3 via Moralis API.
// Busca saldos on-chain de carteiras EVM e Solana.

const MORALIS_API_KEY = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.VITE_MORALIS_API_KEY
  : null;

const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2.2';
const MORALIS_SOL = 'https://solana-gateway.moralis.io';

/**
 * @typedef {Object} TokenBalance
 * @property {string} id
 * @property {string} symbol
 * @property {string} name
 * @property {number} amount
 * @property {number} [priceUsd]
 * @property {number} [valueUsd]
 * @property {number} [change24h]
 */

/**
 * Detecta tokens scam/spam com heurísticas simples.
 * Moralis retorna `possible_spam` para ERC-20; combinamos com regras extras.
 */
function isSpamToken(token) {
  const name = (token.name || '').trim();
  const symbol = (token.symbol || '').trim();

  // Campo nativo do Moralis
  if (token.possible_spam === true) return true;

  // Symbol vazio ou absurdamente longo
  if (!symbol || symbol === 'UNKNOWN' || symbol.length > 20) return true;

  // Nome excessivamente longo
  if (name.length > 60) return true;

  // Caracteres estranhos no symbol (permitir apenas alfanuméricos, ponto e hífen)
  if (/[^a-zA-Z0-9.\-]/.test(symbol)) return true;

  // Nomes que parecem URLs (padrão de scam comum)
  if (/https?:\/\/|\.com|\.xyz|\.io|\.net|\.org/.test(name.toLowerCase())) return true;

  return false;
}

/**
 * Tenta descobrir o CoinGecko ID a partir do symbol de um token.
 * Usa a API de busca do CoinGecko. Retorna null se não encontrar.
 */
export async function lookupCoinGeckoId(symbol) {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Tenta match exato pelo symbol (case-insensitive)
    const match = data.coins?.find(
      c => c.symbol?.toLowerCase() === symbol.toLowerCase()
    );
    return match ? { id: match.id, name: match.name, symbol: match.symbol } : null;
  } catch {
    return null;
  }
}

/**
 * Busca saldos ERC-20 + ETH nativo de um endereço EVM via Moralis.
 */
async function fetchEvmBalances(address, chain = 'eth') {
  const headers = { 'X-API-Key': MORALIS_API_KEY, 'Accept': 'application/json' };

  const [tokensRes, nativeRes] = await Promise.all([
    fetch(`${MORALIS_BASE}/${address}/erc20?chain=${chain}`, { headers }),
    fetch(`${MORALIS_BASE}/${address}/balance?chain=${chain}`, { headers }),
  ]);

  if (!tokensRes.ok || !nativeRes.ok) {
    const errText = !tokensRes.ok ? await tokensRes.text() : await nativeRes.text();
    throw new Error(`Moralis EVM error (${chain}): ${errText}`);
  }

  const tokensData = await tokensRes.json();
  const nativeData = await nativeRes.json();

  const tokens = [];

  // ETH nativo (ou nativo da chain)
  const nativeSymbols = { eth: 'ETH', bsc: 'BNB', polygon: 'MATIC', arbitrum: 'ETH', avalanche: 'AVAX' };
  const nativeNames = { eth: 'Ethereum', bsc: 'BNB', polygon: 'Polygon', arbitrum: 'Ethereum (Arbitrum)', avalanche: 'Avalanche' };
  const nativeBalance = parseFloat(nativeData.balance) / 1e18;

  if (nativeBalance > 0.0001) {
    tokens.push({
      symbol: nativeSymbols[chain] || 'ETH',
      name: nativeNames[chain] || 'Native Token',
      amount: nativeBalance,
      decimals: 18,
    });
  }

  // ERC-20 tokens (com filtragem de scam)
  for (const t of (Array.isArray(tokensData) ? tokensData : [])) {
    if (isSpamToken(t)) continue;

    const decimals = Number(t.decimals) || 18;
    const amount = parseFloat(t.balance) / Math.pow(10, decimals);
    if (amount < 0.001) continue; // dust threshold aumentado

    tokens.push({
      symbol: t.symbol || 'UNKNOWN',
      name: t.name || t.symbol || 'Unknown Token',
      amount,
      decimals,
      contractAddress: t.token_address,
    });
  }

  return tokens;
}

/**
 * Busca saldos SPL de um endereço Solana via Moralis.
 */
async function fetchSolBalances(address) {
  const headers = { 'X-API-Key': MORALIS_API_KEY, 'Accept': 'application/json' };

  // Saldo nativo SOL
  let solBalance = 0;
  try {
    const solRes = await fetch(`${MORALIS_SOL}/account/mainnet/${address}/balance`, { headers });
    if (solRes.ok) {
      const solData = await solRes.json();
      solBalance = parseFloat(solData.solana || solData.lamports / 1e9 || 0);
    }
  } catch (e) {
    console.warn('Erro ao buscar SOL nativo:', e);
  }

  // SPL Tokens
  const tokens = [];
  if (solBalance > 0.0001) {
    tokens.push({ symbol: 'SOL', name: 'Solana', amount: solBalance });
  }

  try {
    const res = await fetch(`${MORALIS_SOL}/account/mainnet/${address}/tokens`, { headers });
    if (res.ok) {
      const data = await res.json();
      for (const t of (Array.isArray(data) ? data : [])) {
        if (isSpamToken(t)) continue;

        const decimals = Number(t.decimals) || 9;
        const amount = parseFloat(t.amount) / Math.pow(10, decimals);
        if (amount < 0.001) continue;

        tokens.push({
          symbol: t.symbol || 'UNKNOWN',
          name: t.name || t.symbol || 'Unknown SPL Token',
          amount,
        });
      }
    }
  } catch (e) {
    console.warn('Erro ao buscar SPL tokens:', e);
  }

  return tokens;
}

/**
 * Função principal: busca saldos on-chain de uma lista de carteiras.
 * Agrega por símbolo entre todas as wallets.
 *
 * @param {Array<{ address: string; networkType: 'evm' | 'solana'; chainId?: string }>} wallets
 * @returns {Promise<{ tokens: TokenBalance[]; raw: any; warning?: string }>}
 */
export async function fetchWalletBalances(wallets) {
  if (!wallets || wallets.length === 0) {
    return { tokens: [], raw: null };
  }

  if (!MORALIS_API_KEY) {
    return {
      tokens: [],
      raw: null,
      warning: 'Integração Web3 ainda não configurada. Adicione VITE_MORALIS_API_KEY ao ficheiro .env.local para ativar a leitura on-chain.',
    };
  }

  try {
    const evmWallets = wallets.filter(w => w.networkType === 'evm');
    const solWallets = wallets.filter(w => w.networkType === 'solana');

    // Buscar todos em paralelo (com tolerância a falhas individuais)
    const results = await Promise.allSettled([
      ...evmWallets.map(w => fetchEvmBalances(w.address, w.chainId || 'eth')),
      ...solWallets.map(w => fetchSolBalances(w.address)),
    ]);

    // Agregar por símbolo
    const aggregated = {};
    let failedCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const token of result.value) {
          const key = token.symbol.toUpperCase();
          if (!aggregated[key]) {
            aggregated[key] = { ...token, amount: 0 };
          }
          aggregated[key].amount += token.amount;
        }
      } else {
        failedCount++;
        console.warn('Wallet fetch falhou:', result.reason?.message);
      }
    }

    const tokenList = Object.values(aggregated).map((t, i) => ({
      id: `${t.symbol.toLowerCase()}-${i}`,
      symbol: t.symbol,
      name: t.name,
      amount: t.amount,
      priceUsd: null,
      valueUsd: null,
    }));

    const warning = failedCount > 0
      ? `${failedCount} carteira(s) não puderam ser sincronizadas. Verifique os endereços.`
      : undefined;

    return { tokens: tokenList, raw: aggregated, warning };
  } catch (error) {
    console.error('Erro na camada web3Api:', error);
    throw error;
  }
}
