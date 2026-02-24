/**
 * Schemas Zod para validar respostas das APIs externas (Moralis, CoinGecko).
 * Se a API mudar uma chave sem aviso, o safeParse captura e loga
 * em vez de deixar o app crashar silenciosamente.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────
// MORALIS — ERC-20 token (um item do array)
// ─────────────────────────────────────────────
export const MoralisErc20TokenSchema = z.object({
  symbol: z.string().optional().default('UNKNOWN'),
  name: z.string().optional().default('Unknown Token'),
  balance: z.string(),                          // string wei, ex: "1000000000000000000"
  decimals: z.union([z.string(), z.number()]).optional().default(18),
  token_address: z.string().optional(),
  possible_spam: z.boolean().optional().default(false),
  verified_contract: z.boolean().optional(),
});

export const MoralisErc20ListSchema = z.array(MoralisErc20TokenSchema);

// ─────────────────────────────────────────────
// MORALIS — saldo nativo EVM (ETH, BNB, etc.)
// ─────────────────────────────────────────────
export const MoralisNativeBalanceSchema = z.object({
  balance: z.string(), // string wei
});

// ─────────────────────────────────────────────
// MORALIS — SPL token Solana
// ─────────────────────────────────────────────
export const MoralisSplTokenSchema = z.object({
  symbol: z.string().optional().default('UNKNOWN'),
  name: z.string().optional().default('Unknown SPL Token'),
  amount: z.union([z.string(), z.number()]),
  decimals: z.union([z.string(), z.number()]).optional().default(9),
  possible_spam: z.boolean().optional().default(false),
});

export const MoralisSplListSchema = z.array(MoralisSplTokenSchema);

// ─────────────────────────────────────────────
// MORALIS — saldo nativo Solana
// ─────────────────────────────────────────────
export const MoralisSolNativeSchema = z.object({
  solana: z.string().optional(),
  lamports: z.number().optional(),
});

// ─────────────────────────────────────────────
// COINGECKO — simple/price (mapa de coin → preço)
// Cada entrada: { "bitcoin": { usd: 60000, usd_24h_change: 1.23 } }
// ─────────────────────────────────────────────
export const CoinGeckoCoinPriceSchema = z.object({
  usd: z.number(),
  usd_24h_change: z.number().optional().default(0),
  usd_1h_change: z.number().optional(),
  usd_7d_change: z.number().optional(),
});

export const CoinGeckoPriceMapSchema = z.record(z.string(), CoinGeckoCoinPriceSchema);

// ─────────────────────────────────────────────
// COINGECKO — search/coins (resultado da busca)
// ─────────────────────────────────────────────
export const CoinGeckoSearchCoinSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  market_cap_rank: z.number().nullable().optional(),
});

export const CoinGeckoSearchResultSchema = z.object({
  coins: z.array(CoinGeckoSearchCoinSchema).optional().default([]),
});

// ─────────────────────────────────────────────
// Helper: parse seguro com log de erro
// ─────────────────────────────────────────────
export function safeParse(schema, data, label = 'unknown') {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`[Zod] Schema inválido para "${label}":`, result.error.flatten());
    return null;
  }
  return result.data;
}
