/**
 * Zod schema for a single portfolio asset document.
 *
 * Firestore path: users/{uid}/portfolio/{coinId}
 *
 * Used for runtime validation when reading portfolio documents from Firestore
 * to surface data issues early rather than letting corrupt data silently flow
 * into UI calculations.
 */
import { z } from 'zod';

export const PortfolioAssetSchema = z.object({
  /** Firestore document ID — populated after fetch (equals coinId) */
  id: z.string().optional(),

  /** CoinGecko coin ID (e.g. "bitcoin", "ethereum") */
  coinId: z.string().min(1),

  /** Short symbol (e.g. "BTC", "ETH") */
  symbol: z.string().min(1),

  /** Full display name (e.g. "Bitcoin") */
  name: z.string().min(1),

  /** Hex colour used in charts (e.g. "#F7931A") */
  color: z.string().optional().default('#6366F1'),

  /** Number of units held — must be positive */
  amount: z.number().positive(),

  /** Average purchase price in USD — 0 is valid (on-chain imported) */
  averageBuyPrice: z.number().nonnegative(),

  /** Origin of the asset. 'manual' = user-entered, 'onchain' = wallet import */
  source: z.enum(['manual', 'onchain']).optional().default('manual'),

  /** ISO timestamp of last update */
  updatedAt: z.string().optional(),
});

/**
 * Parse and validate a raw Firestore portfolio asset document.
 * Throws ZodError on invalid input.
 *
 * @param {unknown} raw
 * @returns {z.infer<typeof PortfolioAssetSchema>}
 */
export function validatePortfolioAsset(raw) {
  return PortfolioAssetSchema.parse(raw);
}

/**
 * Safely validate a raw portfolio asset document without throwing.
 *
 * @param {unknown} raw
 * @returns {z.SafeParseReturnType<typeof PortfolioAssetSchema>}
 */
export function safeValidatePortfolioAsset(raw) {
  return PortfolioAssetSchema.safeParse(raw);
}
