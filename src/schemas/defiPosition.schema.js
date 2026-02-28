/**
 * Zod schemas for DeFi position documents.
 *
 * Firestore path: users/{uid}/defi/{positionId}
 *
 * DeFi positions cover staking, liquidity pools, lending, and yield farming.
 * Each position has a protocol, chain, type, and financial metrics.
 */
import { z } from 'zod';

export const DefiPositionTypeSchema = z.enum([
  'staking',
  'liquidity_pool',
  'lending',
  'yield_farming',
  'other',
]);

export const DefiPositionStatusSchema = z.enum(['active', 'exited', 'pending']);

export const DefiPositionSchema = z.object({
  /** Firestore document ID — populated after fetch */
  id: z.string().optional(),

  /** Protocol name (e.g. "Uniswap V3", "Aave", "Lido") */
  protocol: z.string().min(1),

  /** Blockchain network (e.g. "ethereum", "polygon", "arbitrum") */
  chain: z.string().min(1),

  /** Position type */
  type: DefiPositionTypeSchema,

  /** Current status of the position */
  status: DefiPositionStatusSchema.default('active'),

  /** Primary token symbol (e.g. "ETH", "USDC") */
  tokenSymbol: z.string().min(1),

  /** Secondary token symbol for LP pairs (e.g. "USDC" in ETH/USDC) */
  tokenSymbolPair: z.string().optional(),

  /** Amount of tokens deposited / staked */
  amountDeposited: z.number().nonnegative(),

  /** Current USD value of the position */
  currentValueUsd: z.number().nonnegative().default(0),

  /** USD value at time of entry */
  entryValueUsd: z.number().nonnegative().default(0),

  /** Annualised percentage yield, if known */
  apy: z.number().optional(),

  /** Accumulated rewards in USD */
  rewardsUsd: z.number().nonnegative().default(0),

  /** Contract address of the pool / vault */
  contractAddress: z.string().optional(),

  /** ISO timestamp when position was entered */
  entryDate: z.string().optional(),

  /** ISO timestamp of last update */
  updatedAt: z.string().optional(),
});

/**
 * @param {unknown} raw
 * @returns {z.infer<typeof DefiPositionSchema>}
 */
export function validateDefiPosition(raw) {
  return DefiPositionSchema.parse(raw);
}

/**
 * @param {unknown} raw
 * @returns {z.SafeParseReturnType<typeof DefiPositionSchema>}
 */
export function safeValidateDefiPosition(raw) {
  return DefiPositionSchema.safeParse(raw);
}
