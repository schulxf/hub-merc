/**
 * Zod schema for portfolio transaction documents.
 * Used for runtime validation when reading from / writing to Firestore.
 *
 * Firestore path: users/{uid}/portfolio/{coinId}/transactions/{autoId}
 */
import { z } from 'zod';

export const TransactionTypeSchema = z.enum(['BUY', 'SELL']);

export const TransactionSchema = z.object({
  /** Firestore document ID — populated after fetch */
  id: z.string().optional(),
  /** "BUY" or "SELL" */
  type: TransactionTypeSchema,
  /** Number of units bought/sold */
  quantity: z.number().positive(),
  /** Price per unit in USD at the time of the transaction */
  price: z.number().nonnegative(),
  /** Transaction date — stored as Firestore Timestamp, received as JS Date or ISO string */
  date: z.union([z.date(), z.string()]),
  /** Optional notes for the transaction */
  notes: z.string().optional().default(''),
  /** Total USD value (quantity * price) */
  usdValue: z.number().nonnegative(),
  /** CoinId for cross-asset queries */
  coinId: z.string().optional(),
  /** Human-readable coin symbol (e.g. "BTC") */
  symbol: z.string().optional(),
  /** Human-readable coin name (e.g. "Bitcoin") */
  name: z.string().optional(),
});

/**
 * Validate a raw Firestore transaction document.
 * Returns the parsed value or throws a ZodError.
 *
 * @param {unknown} raw
 * @returns {z.infer<typeof TransactionSchema>}
 */
export function validateTransaction(raw) {
  return TransactionSchema.parse(raw);
}

/**
 * Safely validate a raw Firestore transaction document.
 * Returns { success, data, error } without throwing.
 *
 * @param {unknown} raw
 * @returns {z.SafeParseReturnType<typeof TransactionSchema>}
 */
export function safeValidateTransaction(raw) {
  return TransactionSchema.safeParse(raw);
}
