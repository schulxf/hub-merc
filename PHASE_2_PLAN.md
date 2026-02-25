# PHASE 2: Admin CMS - Content Management System

**Status**: 🔄 In Progress
**Timeline**: 10 dias
**Branch**: `feat/phase-2-admin-cms`
**Objective**: Build complete CMS for airdrop guides, research, strategies, and model portfolios

---

## 📋 Overview

PHASE 2 is the **BLOCKER** that unblocks PHASE 3-4 feature development. Admins need full control over:
- Airdrop guides (existing: AdminContentTab.jsx is 551 LOC, needs completion)
- Research documents
- DeFi strategies
- Model portfolios
- Assessor recommendations

Current state: **AdminContentTab.jsx foundation exists** → needs refinement + integration

---

## 🎯 Tasks

### TASK 2.1: Complete Airdrop CMS ✅ FOUNDATION EXISTS
**File**: `/src/components/admin/AdminContentTab.jsx` (551 LOC)
**Status**: Partially complete, needs testing + refinement

**What exists**:
```javascript
// ✅ Already implemented:
- Airdrop list with real-time Firestore sync
- Form for create/edit airdrops
- Image upload to Cloud Storage
- Phase management system
- Field validation
- Delete capability
```

**What's needed**:
1. [ ] Test AdminContentTab with real Firestore data
2. [ ] Fix any bugs in image upload flow
3. [ ] Add error handling for failed uploads
4. [ ] Add loading states for image processing
5. [ ] Optimize image storage (compression before upload)
6. [ ] Add bulk operations (export, delete multiple)

### TASK 2.2: Create Research CMS
**File**: `/src/components/admin/AdminResearchTab.jsx` (NEW)
**Size**: ~250 LOC
**Fields**:
- Title (max 200 chars)
- Category (enum: 'defi', 'nft', 'l2', 'macro')
- Status (draft, published, archived)
- Content (markdown editor)
- Tags (array)
- Min tier (free, pro, vip)
- Publish date
- Author (auto-populated)

**Integration**:
- Firestore collection: `/research/{docId}`
- Real-time sync like airdrops
- Markdown preview
- Version history (future)

### TASK 2.3: Create Strategy CMS
**File**: `/src/components/admin/AdminStrategyTab.jsx` (NEW)
**Size**: ~250 LOC
**Fields**:
- Name (strategy name)
- Risk profile (low, medium, high)
- Status (draft, published, archived)
- Allocation rules (JSON)
- Description
- Associated coins (multi-select)
- Min tier requirement
- Created by (assessor)

**Integration**:
- Firestore: `/strategies/{strategyId}`
- Assessor-created (with admin approval)
- Reusable by clients

### TASK 2.4: Create Model Portfolio CMS
**File**: `/src/components/admin/AdminModelPortfolioTab.jsx` (NEW)
**Size**: ~250 LOC
**Fields**:
- Name (portfolio name)
- Status (draft, published)
- Description
- Target allocation (% per asset)
- Min/Max investment
- Risk level
- Min tier (pro, vip)
- Coins included (multi-select)

**Integration**:
- Firestore: `/model_portfolios/{modelId}`
- Admin/assessor created
- Clients can view + import

### TASK 2.5: Create Recommendations CMS
**File**: `/src/components/admin/AdminRecommendationsTab.jsx` (NEW)
**Size**: ~200 LOC
**Fields**:
- Type (rebalance, add, remove, replace)
- Target user/tier
- Recommendation text
- Supporting data (JSON)
- Status (draft, sent, archived)
- Created by (assessor)

**Integration**:
- Firestore: `/recommendations/{recId}`
- Assessor-scoped (their clients only)
- Notification system (future)

### TASK 2.6: Update AdminPanel to Include All Tabs
**File**: `/src/pages/AdminPanel.jsx` (already lazy-loads tabs)
**Status**: ✅ Already supports 4 tabs, add more as needed

**What's needed**:
1. [ ] Import new CMS components
2. [ ] Add new tabs to TABS array
3. [ ] Test lazy loading of all tabs
4. [ ] Verify Suspense fallback works for all

### TASK 2.7: Add Markdown Editor Integration
**Package**: `react-markdown` + `marked` (already in package.json)
**Component**: `/src/components/ui/MarkdownEditor.jsx` (NEW)
**Size**: ~150 LOC

**Features**:
- Live preview (split pane)
- Toolbar (bold, italic, code, headers)
- Tab/space support
- Syntax highlighting
- Copy markdown button

### TASK 2.8: Add Image Upload Optimization
**File**: `/src/lib/imageOptimization.js` (NEW)
**Size**: ~100 LOC

**Functions**:
```javascript
compressImage(file) → Blob     // JPEG/PNG compression
resizeImage(file, max) → Blob  // Max 1200x800
generateThumbnail(file) → Blob // 300x200 for list view
```

**Benefits**:
- Reduce Cloud Storage costs
- Faster uploads
- Better performance

### TASK 2.9: Add Form Validation & Error Handling
**File**: Update each CMS component
**Use**: Zod schemas + validation helpers from PHASE 0.3

**Validation**:
```javascript
// Use existing helpers
const { success, data, error } = safeValidateResearch(formData);
```

### TASK 2.10: Create CMS Unit Tests
**File**: `/src/components/admin/__tests__/AdminCMS.test.jsx`
**Size**: ~400 LOC
**Coverage**: 70%+ for CMS components

**Test cases**:
- Render all tabs
- CRUD operations (create, read, update, delete)
- Form validation
- Error handling
- Loading states

---

## 🏗️ Architecture

### Data Flow
```
Admin Input
    ↓
Zod Validation (PHASE 0.3)
    ↓
Firestore Rules Check
    ↓
Cloud Storage (images) / Firestore (data)
    ↓
Real-time Sync (onSnapshot)
    ↓
Component Re-render (updated list)
```

### Component Hierarchy
```
AdminPanel
├─ AdminHeader (already exists)
├─ AdminContentTab (Airdrops) ← NEEDS COMPLETION
├─ AdminResearchTab (NEW) ← NEEDS CREATION
├─ AdminStrategyTab (NEW) ← NEEDS CREATION
├─ AdminModelPortfolioTab (NEW) ← NEEDS CREATION
└─ AdminRecommendationsTab (NEW) ← NEEDS CREATION
```

### Firestore Collections
```
/airdrops/{airdropId}
├─ name: string
├─ type: enum
├─ description: string
├─ phases: array
└─ imageUrl: string

/research/{docId}
├─ title: string
├─ content: markdown
├─ category: enum
└─ minTier: enum

/strategies/{strategyId}
├─ name: string
├─ allocation: object
└─ coins: array

/model_portfolios/{modelId}
├─ name: string
├─ allocation: object
└─ coins: array

/recommendations/{recId}
├─ type: enum
├─ content: string
└─ targetUserId: string | null
```

---

## 📊 Deliverables

### Code (NEW)
- [ ] AdminResearchTab.jsx (~250 LOC)
- [ ] AdminStrategyTab.jsx (~250 LOC)
- [ ] AdminModelPortfolioTab.jsx (~250 LOC)
- [ ] AdminRecommendationsTab.jsx (~200 LOC)
- [ ] MarkdownEditor.jsx (~150 LOC)
- [ ] imageOptimization.js (~100 LOC)

### Refinement (EXISTING)
- [ ] Complete AdminContentTab.jsx testing
- [ ] Fix any bugs in AdminContentTab
- [ ] Update AdminPanel.jsx for all tabs

### Tests
- [ ] AdminCMS.test.jsx (400 LOC, 70% coverage)
- [ ] Each component: unit tests
- [ ] Integration: Firestore mock tests

### Documentation
- [ ] CMS_GUIDE.md (admin guide)
- [ ] API_SPECS.md (Firestore schemas)
- [ ] DEPLOYMENT.md (production setup)

---

## 🚀 Success Criteria

- [ ] All CRUD operations work (create, read, update, delete)
- [ ] Real-time sync verified (onSnapshot working)
- [ ] Image upload & storage working
- [ ] Form validation + error messages
- [ ] 70%+ test coverage
- [ ] Build: 0 errors
- [ ] AdminPanel loads all tabs without errors
- [ ] Lazy loading working for all CMS tabs
- [ ] Firestore rules allow admin mutations only

---

## 📈 Expected Metrics

**Code Changes**:
- ~1,200 LOC new code (CMS components)
- ~100 LOC new code (utilities)
- ~400 LOC tests
- Total: ~1,700 LOC

**Build**:
- Build time: ~11s (acceptable)
- Errors: 0
- Warnings: 1 (pre-existing)

**Coverage**:
- CMS components: 70%+
- Utilities: 80%+
- Overall: 5%+ (Phase 1 target)

---

## 🔗 Dependencies

### External
- `react-markdown`: Markdown rendering (already installed)
- `marked`: Markdown parsing (already installed)
- `sharp` or `sharp-web`: Image compression (may need install)

### Internal
- Firestore rules (already hardened in PHASE 0.4)
- Zod schemas (already created in PHASE 0.3)
- Validation helpers (already created in PHASE 0.3)
- AdminPanel container (already refactored in PHASE 0.1)

---

## ✅ Execution Checklist

- [ ] Create AdminResearchTab component
- [ ] Create AdminStrategyTab component
- [ ] Create AdminModelPortfolioTab component
- [ ] Create AdminRecommendationsTab component
- [ ] Complete AdminContentTab (fix bugs + test)
- [ ] Create MarkdownEditor component
- [ ] Create imageOptimization utilities
- [ ] Add all new tabs to AdminPanel
- [ ] Create comprehensive CMS tests
- [ ] Verify Firestore rules work
- [ ] Document CMS usage
- [ ] Build & test in dev server
- [ ] Create PR for review
- [ ] Merge to main

---

**Ready to Execute**: YES ✅
**Est. Total Time**: 10 dias (can parallelize components)
**Blocker Status**: CRITICAL (unblocks PHASE 3-4)

