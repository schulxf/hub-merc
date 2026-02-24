/**
 * Serviço de preços via CoinGecko.
 * Usado pelo TanStack Query — não chama diretamente nos componentes.
 */
import { CoinGeckoPriceMapSchema, safeParse } from '../schemas/web3.schema';

const CG_BASE = 'https://api.coingecko.com/api/v3';

/**
 * Busca preços em USD + variação 24h para uma lista de coin IDs.
 * @param {string[]} coinIds - ex: ['bitcoin', 'ethereum']
 * @returns {Promise<Record<string, { usd: number, usd_24h_change: number }>>}
 */
export async function fetchCoinPrices(coinIds) {
  if (!coinIds || coinIds.length === 0) return {};

  const uniqueIds = [...new Set(coinIds)].join(',');
  const url = `${CG_BASE}/simple/price?ids=${uniqueIds}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

  const raw = await res.json();

  // Validar schema — se CoinGecko mudar o formato, logamos e devolvemos objeto vazio
  const parsed = safeParse(CoinGeckoPriceMapSchema, raw, 'CoinGecko/prices');
  return parsed ?? {};
}

/**
 * Query key factory — garante keys consistentes em todo o app.
 */
export const pricesKeys = {
  all: ['prices'],
  byIds: (coinIds) => ['prices', [...coinIds].sort().join(',')],
};
