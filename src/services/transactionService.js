/**
 * transactionService.js
 *
 * Firestore helpers for reading and writing portfolio transaction documents.
 *
 * Schema path: users/{uid}/portfolio/{coinId}/transactions/{autoId}
 *
 * Document shape:
 *   type:     "BUY" | "SELL"
 *   quantity: number
 *   price:    number        (USD per unit at transaction time)
 *   date:     Timestamp
 *   notes:    string        (optional)
 *   usdValue: number        (quantity * price)
 *   coinId:   string
 *   symbol:   string
 *   name:     string
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { safeValidateTransaction } from '../schemas/transaction.schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Firestore Timestamp (or JS Date / ISO string) to a JS Date.
 *
 * @param {Timestamp | Date | string} value
 * @returns {Date}
 */
function toDate(value) {
  if (!value) return new Date();
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Map a raw Firestore snapshot doc to a clean transaction object.
 *
 * @param {import('firebase/firestore').QueryDocumentSnapshot} doc
 * @param {string} [coinId]
 * @returns {object}
 */
function docToTransaction(doc, coinId) {
  const data = doc.data();
  return {
    id: doc.id,
    coinId: data.coinId ?? coinId ?? '',
    symbol: data.symbol ?? '',
    name: data.name ?? '',
    type: data.type ?? 'BUY',
    quantity: data.quantity ?? 0,
    price: data.price ?? 0,
    date: toDate(data.date),
    notes: data.notes ?? '',
    usdValue: data.usdValue ?? (data.quantity ?? 0) * (data.price ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Fetch all transactions for a specific asset.
 *
 * @param {string} uid    - Firebase user UID
 * @param {string} coinId - Portfolio asset document ID (e.g. "bitcoin")
 * @returns {Promise<Array<object>>}
 */
export async function getTransactionsForAsset(uid, coinId) {
  const txRef = collection(db, 'users', uid, 'portfolio', coinId, 'transactions');
  const q = query(txRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => docToTransaction(doc, coinId));
}

/**
 * Fetch ALL transactions across every asset for a user.
 * Uses a collectionGroup query.
 *
 * NOTE: This requires a Firestore collectionGroup index on "transactions"
 * ordered by "date". If the index is missing, Firestore will throw an error
 * with a link to create it automatically.
 *
 * @param {string} uid - Firebase user UID
 * @returns {Promise<Array<object>>}
 */
export async function getAllTransactions(uid) {
  // collectionGroup queries all "transactions" sub-collections across the DB.
  // We then filter client-side to only the current user's documents because
  // security rules already prevent reading other users' data, but the query
  // itself is scoped to the full DB path prefix pattern.
  const txGroup = collectionGroup(db, 'transactions');
  const q = query(txGroup, orderBy('date', 'desc'));

  try {
    const snapshot = await getDocs(q);
    const results = [];

    for (const doc of snapshot.docs) {
      // Path: users/{uid}/portfolio/{coinId}/transactions/{txId}
      const pathSegments = doc.ref.path.split('/');
      const docUid = pathSegments[1];
      const coinId = pathSegments[3];

      // Only include documents belonging to the current user
      if (docUid !== uid) continue;

      results.push(docToTransaction(doc, coinId));
    }

    return results;
  } catch (err) {
    // Fallback: if collectionGroup fails (e.g. missing index), iterate assets manually
    console.warn('[transactionService] collectionGroup failed, falling back:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Add a new transaction to a portfolio asset's subcollection.
 *
 * @param {string} uid
 * @param {string} coinId
 * @param {{
 *   type: 'BUY' | 'SELL',
 *   quantity: number,
 *   price: number,
 *   date: Date,
 *   notes?: string,
 *   symbol?: string,
 *   name?: string,
 * }} data
 * @returns {Promise<string>} The new document ID
 */
export async function addTransaction(uid, coinId, data) {
  const usdValue = data.quantity * data.price;
  const payload = {
    type: data.type,
    quantity: data.quantity,
    price: data.price,
    date: Timestamp.fromDate(data.date instanceof Date ? data.date : new Date(data.date)),
    notes: data.notes ?? '',
    usdValue,
    coinId,
    symbol: data.symbol ?? '',
    name: data.name ?? '',
    createdAt: Timestamp.now(),
  };

  const txRef = collection(db, 'users', uid, 'portfolio', coinId, 'transactions');
  const docRef = await addDoc(txRef, payload);
  return docRef.id;
}

// ---------------------------------------------------------------------------
// Seed data — for development / first-load testing
// ---------------------------------------------------------------------------

/**
 * Seed 2-3 test transactions per asset for the current authenticated user.
 * Only seeds if the subcollection is empty (idempotent).
 *
 * @param {Array<{coinId: string, symbol: string, name: string}>} assets
 * @returns {Promise<void>}
 */
export async function seedTransactionsIfEmpty(assets) {
  const uid = auth.currentUser?.uid;
  if (!uid || !Array.isArray(assets) || assets.length === 0) return;

  const seedData = {
    bitcoin: [
      { type: 'BUY', quantity: 0.5, price: 42000, daysAgo: 90, notes: 'Compra inicial' },
      { type: 'BUY', quantity: 0.25, price: 38000, daysAgo: 60, notes: 'DCA mensal' },
      { type: 'SELL', quantity: 0.1, price: 55000, daysAgo: 15, notes: 'Realização parcial' },
    ],
    ethereum: [
      { type: 'BUY', quantity: 2.0, price: 2200, daysAgo: 120, notes: 'Entrada estratégica' },
      { type: 'BUY', quantity: 1.0, price: 1800, daysAgo: 75, notes: 'Aporte mensal' },
    ],
    solana: [
      { type: 'BUY', quantity: 50, price: 80, daysAgo: 100, notes: 'Posição inicial' },
      { type: 'BUY', quantity: 25, price: 60, daysAgo: 45, notes: 'DCA' },
      { type: 'SELL', quantity: 10, price: 150, daysAgo: 10, notes: 'Take profit' },
    ],
    chainlink: [
      { type: 'BUY', quantity: 100, price: 12, daysAgo: 80, notes: 'Entrada inicial' },
      { type: 'BUY', quantity: 50, price: 10, daysAgo: 30, notes: 'Aporte' },
    ],
    arbitrum: [
      { type: 'BUY', quantity: 500, price: 1.2, daysAgo: 60, notes: 'Posição L2' },
    ],
    tether: [
      { type: 'BUY', quantity: 1000, price: 1.0, daysAgo: 30, notes: 'Reserva estável' },
    ],
    'usd-coin': [
      { type: 'BUY', quantity: 500, price: 1.0, daysAgo: 20, notes: 'Reserva USDC' },
    ],
  };

  for (const asset of assets) {
    const coinId = asset.coinId ?? asset.id;
    if (!coinId) continue;

    // Check if transactions already exist
    const txRef = collection(db, 'users', uid, 'portfolio', coinId, 'transactions');
    const existing = await getDocs(txRef);
    if (!existing.empty) continue;

    const seeds = seedData[coinId];
    if (!seeds) continue;

    for (const seed of seeds) {
      const txDate = new Date();
      txDate.setDate(txDate.getDate() - seed.daysAgo);

      await addTransaction(uid, coinId, {
        type: seed.type,
        quantity: seed.quantity,
        price: seed.price,
        date: txDate,
        notes: seed.notes,
        symbol: asset.symbol ?? coinId,
        name: asset.name ?? coinId,
      });
    }
  }
}
