/**
 * Zod schemas for Model Portfolio documents (TASK 3).
 *
 * Firestore path: model_portfolios/{modelId}
 *
 * A Model Portfolio is a curated template portfolio that assessors can share
 * with clients as a starting point or benchmark.  Clients can "copy" a model
 * portfolio to initialise their own holdings.
 */
import { z } from 'zod';

/**
 * A single slot in a model portfolio — one asset with its target weight.
 */
export const ModelPortfolioSlotSchema = z.object({
  /** CoinGecko coin ID */
  coinId: z.string().min(1),
  /** Human-readable symbol (e.g. "BTC") */
  symbol: z.string().min(1),
  /** Full coin name (e.g. "Bitcoin") */
  name: z.string().min(1),
  /** Target weight percentage (0-100) */
  targetPercent: z.number().min(0).max(100),
  /** Rationale for including this asset */
  rationale: z.string().optional().default(''),
});

export const ModelPortfolioStatusSchema = z.enum(['draft', 'published', 'archived']);

export const ModelPortfolioSchema = z.object({
  /** Firestore document ID — populated after fetch */
  id: z.string().optional(),

  /** Display name for the model portfolio */
  name: z.string().min(1).max(100),

  /** Short description of the portfolio's theme or objective */
  description: z.string().optional().default(''),

  /** Lifecycle status */
  status: ModelPortfolioStatusSchema.default('draft'),

  /** Portfolio slots — each specifies an asset and its target weight */
  slots: z.array(ModelPortfolioSlotSchema).default([]),

  /** Minimum user tier required to access */
  minTier: z.enum(['free', 'pro', 'vip']).default('pro'),

  /** UID of the assessor or admin who created this model */
  createdByUid: z.string().optional(),

  /** Optional thumbnail or icon URL */
  imageUrl: z.string().url().optional().or(z.literal('')),

  /** Expected annualised return label (display only, not financial advice) */
  expectedReturnLabel: z.string().optional(),

  /** Risk profile classification */
  riskProfile: z
    .enum(['conservative', 'moderate', 'aggressive', 'speculative'])
    .optional(),

  /** ISO timestamp of creation */
  createdAt: z.string().optional(),

  /** ISO timestamp of last update */
  updatedAt: z.string().optional(),
});

/**
 * @param {unknown} raw
 * @returns {z.infer<typeof ModelPortfolioSchema>}
 */
export function validateModelPortfolio(raw) {
  return ModelPortfolioSchema.parse(raw);
}

/**
 * @param {unknown} raw
 * @returns {z.SafeParseReturnType<typeof ModelPortfolioSchema>}
 */
export function safeValidateModelPortfolio(raw) {
  return ModelPortfolioSchema.safeParse(raw);
}
