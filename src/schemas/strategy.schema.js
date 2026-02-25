/**
 * Zod schemas for Strategy documents (TASK 5).
 *
 * Firestore path: strategies/{strategyId}
 *
 * Strategies are investmenmt playbooks created by assessors and shared with
 * assigned clients.  They define target allocation percentages, rebalancing
 * rules, and risk tolerance.
 */
import { z } from 'zod';

export const RiskProfileSchema = z.enum([
  'conservative',
  'moderate',
  'aggressive',
  'speculative',
]);

export const StrategyStatusSchema = z.enum(['active', 'draft', 'archived']);

/**
 * A single allocation entry describing the target weight for one asset.
 */
export const AllocationEntrySchema = z.object({
  /** CoinGecko coin ID */
  coinId: z.string().min(1),
  /** Human-readable symbol */
  symbol: z.string().min(1),
  /** Target allocation percentage (0-100) */
  targetPercent: z.number().min(0).max(100),
  /** Rebalancing band — trigger if allocation drifts beyond this (0-100) */
  driftThresholdPercent: z.number().min(0).max(100).default(5),
});

export const StrategySchema = z.object({
  /** Firestore document ID — populated after fetch */
  id: z.string().optional(),

  /** Strategy display name (e.g. "Carteira Conservadora 2025") */
  name: z.string().min(1).max(100),

  /** Longer description of the strategy's goals */
  description: z.string().optional().default(''),

  /** Risk profile this strategy targets */
  riskProfile: RiskProfileSchema,

  /** Current lifecycle status */
  status: StrategyStatusSchema.default('draft'),

  /** Planned asset allocations — must sum to 100 */
  allocations: z.array(AllocationEntrySchema).default([]),

  /** Assessor UID who created this strategy */
  createdByUid: z.string().optional(),

  /** List of client UIDs this strategy has been assigned to */
  assignedClientUids: z.array(z.string()).default([]),

  /** Benchmark identifier for performance comparison (e.g. "bitcoin") */
  benchmarkCoinId: z.string().optional(),

  /** ISO timestamp of creation */
  createdAt: z.string().optional(),

  /** ISO timestamp of last update */
  updatedAt: z.string().optional(),
});

/**
 * @param {unknown} raw
 * @returns {z.infer<typeof StrategySchema>}
 */
export function validateStrategy(raw) {
  return StrategySchema.parse(raw);
}

/**
 * @param {unknown} raw
 * @returns {z.SafeParseReturnType<typeof StrategySchema>}
 */
export function safeValidateStrategy(raw) {
  return StrategySchema.safeParse(raw);
}
