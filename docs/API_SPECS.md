# Firestore CMS API Specifications

**Last Updated**: February 25, 2026 (PHASE 2)
**Status**: Complete API definitions for admin CMS

---

## 📋 Overview

Technical API specifications for all Firestore CMS collections. For admin usage guide, see [CMS_GUIDE.md](./CMS_GUIDE.md).

---

## 📚 Research Collection API

### Path
```
/research/{docId}
```

### Schema

```typescript
interface ResearchDocument {
  docId: string;                    // Firestore document ID (auto-generated)

  // Required fields
  title: string;                    // Max 200 characters
  content: string;                  // Markdown formatted

  // Required enums
  category: 'defi' | 'nft' | 'l2' | 'macro' | 'governance' | 'security';
  status: 'draft' | 'published' | 'archived';

  // Optional fields
  tags?: string[];                  // Array of tag strings
  minTier?: 'free' | 'pro' | 'vip';  // Default: 'free'
  publishDate?: Timestamp;          // Scheduled publication date
  author?: string;                  // Admin/assessor UID

  // Metadata (auto-generated)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                // Admin UID
}
```

### CRUD Operations

#### Create
```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const docRef = await addDoc(collection(db, 'research'), {
  title: 'DeFi Security Best Practices',
  category: 'defi',
  content: '# DeFi Security\n\nBest practices for smart contract interaction...',
  status: 'draft',
  tags: ['security', 'defi', 'best-practices'],
  minTier: 'pro',
  publishDate: new Date('2026-03-01'),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'user123'
});
```

#### Read
```javascript
import { getDoc, doc } from 'firebase/firestore';

const docRef = doc(db, 'research', 'docId');
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
  console.log(docSnap.data());
}
```

#### Update
```javascript
import { updateDoc } from 'firebase/firestore';

const docRef = doc(db, 'research', 'docId');
await updateDoc(docRef, {
  status: 'published',
  updatedAt: serverTimestamp()
});
```

#### Delete
```javascript
import { deleteDoc } from 'firebase/firestore';

const docRef = doc(db, 'research', 'docId');
await deleteDoc(docRef);
```

#### List (Real-time)
```javascript
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const q = query(
  collection(db, 'research'),
  where('status', '==', 'published'),
  where('minTier', '==', 'pro')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.forEach((doc) => {
    console.log(doc.data());
  });
});
```

### Validation

| Field | Rules |
|-------|-------|
| `title` | Required, 1-200 chars |
| `content` | Required, min 10 chars |
| `category` | Required, one of enum |
| `status` | Required, one of enum |
| `tags` | Optional, array of strings |
| `minTier` | Optional, one of enum |

### Firestore Rules

```javascript
match /research/{docId} {
  allow read: if request.auth != null;
  allow create: if isAdmin();
  allow update: if isAdmin();
  allow delete: if isAdmin();
}
```

---

## 💼 Strategies Collection API

### Path
```
/strategies/{strategyId}
```

### Schema

```typescript
interface Strategy {
  strategyId: string;               // Firestore document ID

  // Required fields
  name: string;                     // Strategy name
  description: string;              // Detailed description

  // Required enums
  riskProfile: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'archived';

  // Allocation array
  allocations: Allocation[];        // Must sum to 100%

  // Optional fields
  minTier?: 'free' | 'pro' | 'vip';  // Default: 'pro'
  coins?: string[];                 // CoinGecko IDs

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                // Assessor or admin UID
}

interface Allocation {
  coinId: string;                   // CoinGecko coin ID
  percentage: number;               // 0-100
}
```

### Examples

#### Create Strategy
```javascript
const strategyRef = await addDoc(collection(db, 'strategies'), {
  name: 'Balanced Growth',
  description: 'Moderate allocation for steady growth',
  riskProfile: 'medium',
  status: 'draft',
  allocations: [
    { coinId: 'bitcoin', percentage: 40 },
    { coinId: 'ethereum', percentage: 35 },
    { coinId: 'solana', percentage: 15 },
    { coinId: 'polygon', percentage: 10 }
  ],
  minTier: 'pro',
  coins: ['bitcoin', 'ethereum', 'solana', 'polygon'],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'user456'
});
```

### Validation

| Field | Rules |
|-------|-------|
| `name` | Required, max 100 chars |
| `description` | Required, min 10 chars |
| `riskProfile` | Required, one of enum |
| `allocations` | Required, sum must = 100% |
| `status` | Required, one of enum |
| `minTier` | Optional, one of enum |

### Firestore Rules

```javascript
match /strategies/{strategyId} {
  allow read: if request.auth != null;
  allow create: if isAdmin() || isAssessor();
  allow update: if isAdmin() || (isAssessor() &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assessorClients);
  allow delete: if isAdmin();
}
```

---

## 📊 Model Portfolios Collection API

### Path
```
/model_portfolios/{modelId}
```

### Schema

```typescript
interface ModelPortfolio {
  modelId: string;

  // Required fields
  name: string;                     // Portfolio name
  description: string;              // Purpose and use case

  // Required enums
  status: 'draft' | 'published';
  riskLevel: 'low' | 'medium' | 'high';

  // Investment range (USD)
  minInvestment: number;            // Minimum investment required
  maxInvestment: number;            // Maximum recommended investment

  // Allocations
  targetAllocation: Allocation[];   // Must sum to 100%

  // Optional fields
  minTier?: 'free' | 'pro' | 'vip';  // Default: 'pro'
  coins?: string[];                 // Included assets

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### Examples

#### Create Model Portfolio
```javascript
const portfolioRef = await addDoc(collection(db, 'model_portfolios'), {
  name: 'Conservative Starter',
  description: 'For new investors wanting low-risk exposure',
  status: 'published',
  riskLevel: 'low',
  minInvestment: 1000,
  maxInvestment: 50000,
  targetAllocation: [
    { coinId: 'bitcoin', percentage: 50 },
    { coinId: 'ethereum', percentage: 30 },
    { coinId: 'usdcoin', percentage: 20 }
  ],
  minTier: 'free',
  coins: ['bitcoin', 'ethereum', 'usdcoin'],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'admin-user'
});
```

### Validation

| Field | Rules |
|-------|-------|
| `name` | Required, max 100 chars |
| `description` | Required, min 20 chars |
| `minInvestment` | Required, > 0, < maxInvestment |
| `maxInvestment` | Required, > minInvestment |
| `targetAllocation` | Required, sum = 100% |
| `riskLevel` | Required, one of enum |
| `status` | Required, one of enum |

---

## 💬 Recommendations Collection API

### Path
```
/recommendations/{recId}
```

### Schema

```typescript
interface Recommendation {
  recId: string;

  // Required fields
  recommendationText: string;       // Main recommendation content

  // Required enums
  type: 'rebalance' | 'add' | 'remove' | 'replace' | 'general';
  status: 'draft' | 'sent' | 'archived';

  // Target (one of the two)
  targetUserTier?: 'free' | 'pro' | 'vip';  // For tier-based targeting
  targetUserId?: string;                     // For specific user targeting

  // Optional payload
  supportingData?: string;          // JSON string with additional data

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                // Assessor/admin UID
  sentAt?: Timestamp;               // When marked as 'sent'
}
```

### Examples

#### Create General Recommendation
```javascript
const recRef = await addDoc(collection(db, 'recommendations'), {
  type: 'general',
  recommendationText: 'Consider diversifying into emerging markets. Bitcoin and Ethereum are stable but growth may be limited.',
  status: 'draft',
  targetUserTier: 'pro',
  supportingData: JSON.stringify({
    rationale: 'Portfolio overweighted in BTC/ETH',
    suggestedCoins: ['solana', 'polygon'],
    expectedReturn: '15-20%'
  }),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'assessor-user'
});
```

#### Create User-specific Recommendation
```javascript
const recRef = await addDoc(collection(db, 'recommendations'), {
  type: 'rebalance',
  recommendationText: 'Your portfolio is 70% BTC. Recommend reducing to 50% and adding 15% ETH and 20% stables.',
  status: 'draft',
  targetUserId: 'user-123-abc',
  supportingData: JSON.stringify({
    currentAllocation: { BTC: 70, ETH: 20, USDC: 10 },
    proposedAllocation: { BTC: 50, ETH: 35, USDC: 15 },
    reason: 'Risk mitigation'
  }),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'assessor-user'
});
```

### Validation

| Field | Rules |
|-------|-------|
| `recommendationText` | Required, min 20 chars |
| `type` | Required, one of enum |
| `status` | Required, one of enum |
| `targetUserTier` OR `targetUserId` | One required (not both) |
| `supportingData` | Optional, must be valid JSON if present |

### Firestore Rules

```javascript
match /recommendations/{recId} {
  allow read: if request.auth != null &&
    (isAdmin() ||
     isAssessor() ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tier == resource.data.targetUserTier);
  allow create: if isAdmin() || isAssessor();
  allow update: if isAdmin() || (isAssessor() && resource.data.createdBy == request.auth.uid);
  allow delete: if isAdmin();
}
```

---

## 🔒 Common Firestore Rules Functions

```javascript
// Check if user is admin
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tier == 'admin';
}

// Check if user is assessor
function isAssessor() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tier == 'assessor';
}

// Check if user owns document
function isOwner(uid) {
  return request.auth.uid == uid;
}
```

---

## 📡 Real-time Updates

All collections support real-time listeners via `onSnapshot`:

```javascript
import { collection, onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(
  collection(db, 'strategies'),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') console.log('New: ', change.doc.data());
      if (change.type === 'modified') console.log('Modified: ', change.doc.data());
      if (change.type === 'removed') console.log('Deleted: ', change.doc.id);
    });
  }
);
```

---

## 🔍 Query Examples

### Get published research by category
```javascript
const q = query(
  collection(db, 'research'),
  where('status', '==', 'published'),
  where('category', '==', 'defi')
);
```

### Get strategies for specific tier
```javascript
const q = query(
  collection(db, 'strategies'),
  where('minTier', 'in', ['free', 'pro']),
  where('status', '==', 'published')
);
```

### Get recommendations for specific user
```javascript
const q = query(
  collection(db, 'recommendations'),
  where('targetUserId', '==', 'user-123'),
  where('status', '!=', 'archived')
);
```

### Get recommendations by tier
```javascript
const q = query(
  collection(db, 'recommendations'),
  where('targetUserTier', '==', 'pro'),
  where('status', '==', 'sent')
);
```

---

## 📊 Storage & Performance

### Estimated Sizes

| Document | Size (est.) | Count | Total |
|----------|-------------|-------|-------|
| Research doc | 5-50 KB | 100+ | 500 KB - 5 MB |
| Strategy | 1-5 KB | 50+ | 50 KB - 250 KB |
| Model Portfolio | 2-10 KB | 30+ | 60 KB - 300 KB |
| Recommendation | 2-5 KB | 1,000+ | 2-5 MB |

### Query Costs

Each `onSnapshot` listener = 1 read per second of connection
- 100 users connected = 100 reads/second = 5.76M reads/month
- Firestore free tier: 50K reads/day (insufficient)
- Recommend Blaze plan for production

---

## 🚀 Best Practices

1. **Always validate data** before sending to Firestore
2. **Use transactions** for multi-document operations
3. **Index frequently queried fields** (category, status, minTier)
4. **Implement pagination** for large result sets
5. **Cache data** client-side to reduce reads
6. **Use real-time listeners** for dynamic content
7. **Archive instead of delete** for audit trails
8. **Timestamp all operations** for tracking

---

**Classification**: Internal - Technical API Reference
