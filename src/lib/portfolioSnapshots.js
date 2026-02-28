import { z } from 'zod';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * @typedef {Object} PortfolioAsset
 * @property {string} coinId - CoinGecko ID
 * @property {string} symbol - Ticker symbol (BTC, ETH, etc)
 * @property {string} name - Full name (Bitcoin, Ethereum, etc)
 * @property {number} amount - Quantity held
 * @property {number} currentPrice - Current price in USD
 * @property {number} currentValue - amount * currentPrice
 * @property {number} averageBuyPrice - Cost basis
 * @property {number} profitLossPct - (currentValue - invested) / invested * 100
 */
const PortfolioAssetSchema = z.object({
  coinId: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().positive(),
  currentPrice: z.number().min(0),
  currentValue: z.number().min(0),
  averageBuyPrice: z.number().min(0),
  profitLossPct: z.number(),
});

/**
 * @typedef {Object} PortfolioSnapshotData
 * @property {number} totalValue - Total portfolio value in USD
 * @property {number} totalInvested - Total amount invested (cost basis)
 * @property {number} totalProfitLoss - totalValue - totalInvested
 * @property {number} change24h - 24h percentage change
 * @property {PortfolioAsset[]} assets - Array of assets in portfolio
 */
const PortfolioSnapshotDataSchema = z.object({
  totalValue: z.number().min(0),
  totalInvested: z.number().min(0),
  totalProfitLoss: z.number(),
  change24h: z.number(),
  assets: z.array(PortfolioAssetSchema),
});

/**
 * @typedef {Object} PortfolioSnapshot
 * @property {string} timestamp - ISO8601 timestamp
 * @property {string} date - YYYY-MM-DD format for day queries
 * @property {number} totalValue
 * @property {number} totalInvested
 * @property {number} totalProfitLoss
 * @property {number} change24h
 * @property {PortfolioAsset[]} assets
 * @property {Object} metadata
 * @property {string} metadata.triggeredBy - "lazy-load" | "manual" | "admin"
 * @property {string} [metadata.userAgent] - Browser user agent
 * @property {number} metadata.timestamp_ms - Milliseconds for sorting
 */
const PortfolioSnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalValue: z.number().min(0),
  totalInvested: z.number().min(0),
  totalProfitLoss: z.number(),
  change24h: z.number(),
  assets: z.array(PortfolioAssetSchema),
  metadata: z.object({
    triggeredBy: z.enum(['lazy-load', 'manual', 'admin']),
    userAgent: z.string().optional(),
    timestamp_ms: z.number().positive(),
  }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
function getTodayDate() {
  return formatDate(new Date());
}

/**
 * Extract date from ISO8601 timestamp
 * @param {string} timestamp - ISO8601 string
 * @returns {string} - YYYY-MM-DD format
 */
function extractDate(timestamp) {
  return timestamp.split('T')[0];
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Check if a snapshot already exists for today
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function hasSnapshotForToday(uid) {
  if (!uid) return false;

  try {
    const todayDate = getTodayDate();
    const snapshotsRef = collection(db, 'users', uid, 'portfolio_snapshots');
    const q = query(
      snapshotsRef,
      where('date', '==', todayDate),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('[portfolioSnapshots] Error checking for today snapshot:', error);
    return false;
  }
}

/**
 * Save a portfolio snapshot
 * @param {string} uid - User ID
 * @param {PortfolioSnapshotData} snapshotData - Snapshot data to save
 * @param {string} [triggeredBy='lazy-load'] - How snapshot was triggered
 * @returns {Promise<string>} - Timestamp of created snapshot
 * @throws {Error} if validation fails or Firebase error
 */
export async function savePortfolioSnapshot(
  uid,
  snapshotData,
  triggeredBy = 'lazy-load'
) {
  if (!uid || !auth.currentUser) {
    throw new Error('User must be authenticated to save snapshot');
  }

  // Validate data with Zod
  const result = PortfolioSnapshotDataSchema.safeParse(snapshotData);
  if (!result.success) {
    console.error('[portfolioSnapshots] Validation error:', result.error);
    throw new Error(`Invalid snapshot data: ${result.error.message}`);
  }

  try {
    const now = new Date();
    const timestamp = now.toISOString();
    const date = extractDate(timestamp);
    const timestamp_ms = now.getTime();

    const snapshotToSave = {
      ...result.data,
      timestamp,
      date,
      metadata: {
        triggeredBy,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp_ms,
      },
    };

    // Use timestamp_ms as document ID for unique snapshots per day
    const snapshotRef = doc(
      db,
      'users',
      uid,
      'portfolio_snapshots',
      timestamp_ms.toString()
    );

    await setDoc(snapshotRef, snapshotToSave);

    console.log('[portfolioSnapshots] Snapshot saved:', timestamp);
    return timestamp;
  } catch (error) {
    console.error('[portfolioSnapshots] Error saving snapshot:', error);
    throw error;
  }
}

/**
 * Get portfolio snapshots for the last N days
 * @param {string} uid - User ID
 * @param {number} days - Number of days (30, 90, 365)
 * @returns {Promise<PortfolioSnapshot[]>} - Array of snapshots (oldest to newest)
 */
export async function getPortfolioSnapshots(uid, days = 30) {
  if (!uid) return [];

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = cutoffDate.toISOString();

    const snapshotsRef = collection(db, 'users', uid, 'portfolio_snapshots');
    const q = query(
      snapshotsRef,
      where('timestamp', '>=', cutoffTimestamp),
      orderBy('timestamp', 'asc'),
      limit(365) // Max 365 snapshots
    );

    const querySnapshot = await getDocs(q);
    const snapshots = [];

    querySnapshot.forEach((doc) => {
      snapshots.push(doc.data());
    });

    return snapshots;
  } catch (error) {
    console.error('[portfolioSnapshots] Error fetching snapshots:', error);
    return [];
  }
}

/**
 * Get the most recent snapshot
 * @param {string} uid - User ID
 * @returns {Promise<PortfolioSnapshot|null>}
 */
export async function getLatestSnapshot(uid) {
  if (!uid) return null;

  try {
    const snapshotsRef = collection(db, 'users', uid, 'portfolio_snapshots');
    const q = query(
      snapshotsRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('[portfolioSnapshots] Error fetching latest snapshot:', error);
    return null;
  }
}

/**
 * Format snapshot for chart display
 * Converts to format Recharts expects
 * @param {PortfolioSnapshot} snapshot
 * @returns {{date: string, value: number}}
 */
export function formatSnapshotForChart(snapshot) {
  return {
    date: snapshot.date,
    value: Math.round(snapshot.totalValue),
  };
}
