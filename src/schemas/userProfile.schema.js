/**
 * Zod schemas for user profile and assessor-client data.
 * Used for runtime validation when reading from Firestore.
 */
import { z } from 'zod';

export const UserProfileSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  tier: z.enum(['free', 'pro', 'vip', 'admin']).default('free'),
  assessorIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  status: z.enum(['active', 'suspended']).default('active'),
});

export const AssessorClientSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  tier: z.string(),
  totalValue: z.number().default(0),
  lastReviewDate: z.string().nullable().default(null),
});
