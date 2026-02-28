/**
 * Zod schemas for AI service and swap service API validation.
 * Validates OpenAI streaming responses, portfolio analysis output,
 * and 1inch DEX aggregator API responses.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────
// OPENAI — streaming response chunk
// ─────────────────────────────────────────────
export const OpenAIStreamChunkSchema = z.object({
  id: z.string(),
  object: z.literal('text_completion.chunk'),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      delta: z
        .object({
          content: z.string().optional(),
        })
        .optional(),
      finish_reason: z.string().nullable().optional(),
    })
  ),
});

// ─────────────────────────────────────────────
// PORTFOLIO ANALYSIS — AI-generated analysis
// ─────────────────────────────────────────────
export const PortfolioAnalysisSchema = z.object({
  summary: z.string(),
  allocation_assessment: z.string(),
  recommendations: z.array(
    z.object({
      type: z.enum(['buy', 'sell', 'rebalance', 'diversify']),
      asset: z.string(),
      rationale: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      estimated_impact: z.string(), // e.g., "+2.3% portfolio value"
    })
  ),
});

// ─────────────────────────────────────────────
// 1INCH — quote response
// ─────────────────────────────────────────────
export const OneInchQuoteSchema = z.object({
  fromToken: z.object({
    symbol: z.string(),
    address: z.string(),
  }),
  toToken: z.object({
    symbol: z.string(),
    address: z.string(),
  }),
  toAmount: z.string(), // in wei
  estimatedGas: z.string(),
  gasPrice: z.string(),
  protocols: z.array(z.array(z.string())), // routes
});

// ─────────────────────────────────────────────
// 1INCH — swap transaction data
// ─────────────────────────────────────────────
export const OneInchSwapSchema = z.object({
  tx: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gas: z.string(),
    gasPrice: z.string(),
  }),
});

// ─────────────────────────────────────────────
// RECOMMENDATION — structured recommendation object
// ─────────────────────────────────────────────
export const RecommendationSchema = z.object({
  id: z.string().optional(), // UUID
  type: z.enum(['buy', 'sell', 'rebalance', 'diversify']),
  asset: z.string().toUpperCase(),
  currentAllocation: z.number().min(0).max(1),
  targetAllocation: z.number().min(0).max(1),
  suggestedAmount: z.string(), // in wei
  rationale: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  expectedROI: z.number().optional(), // percentage
  gasEstimate: z
    .object({
      amount: z.string(), // in wei
      usdValue: z.number(),
    })
    .optional(),
});
