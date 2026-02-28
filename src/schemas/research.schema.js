/**
 * Zod schemas for Research content documents (TASK 4).
 *
 * Firestore path: research/{researchId}
 *
 * Research documents are created by admins / assessors and surfaced as
 * read-only content to platform users.  The schema enforces structure
 * at read time so stale or malformed documents don't reach the UI.
 */
import { z } from 'zod';

export const ResearchCategorySchema = z.enum([
  'macro',
  'altcoin',
  'defi',
  'nft',
  'regulation',
  'technical_analysis',
  'on_chain',
  'other',
]);

export const ResearchStatusSchema = z.enum(['draft', 'published', 'archived']);

export const ResearchSentimentSchema = z.enum(['bullish', 'bearish', 'neutral']);

export const ResearchSchema = z.object({
  /** Firestore document ID — populated after fetch */
  id: z.string().optional(),

  /** Short article title */
  title: z.string().min(1).max(200),

  /** Brief summary shown in preview cards */
  summary: z.string().min(1).max(500),

  /** Full article body in Markdown or plain text */
  content: z.string().min(1),

  /** Primary subject category */
  category: ResearchCategorySchema,

  /** Ticker symbols this article relates to (e.g. ["BTC", "ETH"]) */
  relatedAssets: z.array(z.string()).default([]),

  /** Publication status */
  status: ResearchStatusSchema.default('draft'),

  /** Overall market sentiment expressed in the article */
  sentiment: ResearchSentimentSchema.optional(),

  /** Thumbnail or hero image URL */
  imageUrl: z.string().url().optional().or(z.literal('')),

  /** Author's display name */
  authorName: z.string().optional(),

  /** UID of the author (assessor or admin) */
  authorUid: z.string().optional(),

  /** Minimum user tier required to read ('free' | 'pro' | 'vip') */
  minTier: z.enum(['free', 'pro', 'vip']).default('pro'),

  /** ISO timestamp of when the article was published */
  publishedAt: z.string().optional(),

  /** ISO timestamp of last update */
  updatedAt: z.string().optional(),
});

/**
 * @param {unknown} raw
 * @returns {z.infer<typeof ResearchSchema>}
 */
export function validateResearch(raw) {
  return ResearchSchema.parse(raw);
}

/**
 * @param {unknown} raw
 * @returns {z.SafeParseReturnType<typeof ResearchSchema>}
 */
export function safeValidateResearch(raw) {
  return ResearchSchema.safeParse(raw);
}
