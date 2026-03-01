# 🧪 Testing Strategy & Best Practices

**Last Updated**: Feb 25, 2026 (PHASE 0.5)
**Status**: Foundation established, growing coverage phase

---

## 📋 Test Infrastructure

### Setup
- **Framework**: Jest + React Testing Library (RTL)
- **Environment**: jsdom (browser-like)
- **Config**: `/jest.config.js`
- **Setup File**: `/jest.setup.js`

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- portfolioReducer.test.js

# Watch mode (development)
npm test -- --watch

# Run failed tests only
npm test -- --lastCommit

# Run tests matching pattern
npm test -- --testNamePattern="portfolio"
```

---

## 📊 Current Coverage Status

### Test Suites: 6 Total
- ✅ 3 passing
- ❌ 3 failing (service setup issues, not critical)

### Test Count: 72 Total
- ✅ 65 passing
- ❌ 7 failing

### Coverage Breakdown

| Category | Coverage | Tests | Status |
|----------|----------|-------|--------|
| **Schemas** | 58.82% | 34/34 | ✅ PASSING |
| **Portfolio Reducer** | 100% | 19/19 | ✅ PASSING |
| **Portfolio Tabs** | N/A | 6/6 | ✅ PASSING |
| **Services** | 9.09% | 0/7 | ❌ NEEDS SETUP |
| **Hooks** | 0.5% | 0/2 | ⏳ WIP |
| **Components** | 0% | 0/0 | ⏳ PLANNED |

### Phase 0.5 Baseline
- Coverage Threshold: **2%** (MVP baseline)
- Target for Phase 1: **10%**
- Target for Phase 2: **25%**
- Long-term Target: **50%+**

---

## ✅ Tested Modules (Working Well)

### 1. Schemas (300 LOC tests, 34 tests)
**File**: `/src/schemas/__tests__/schemas.test.js`

**Coverage**: Valid inputs, defaults, validations, error cases
```javascript
// Example: Portfolio Asset validation
describe('PortfolioAssetSchema', () => {
  it('accepts a valid portfolio asset', () => {
    const result = portfolioAssetSchema.safeParse(validAsset);
    expect(result.success).toBe(true);
  });

  it('rejects a negative amount', () => {
    const result = portfolioAssetSchema.safeParse({...validAsset, amount: -5});
    expect(result.success).toBe(false);
  });
});
```

**Schemas Tested**:
- ✅ portfolioAsset.schema.js (100% coverage)
- ✅ defiPosition.schema.js (80% coverage)
- ✅ modelPortfolio.schema.js (80% coverage)
- ✅ research.schema.js (83% coverage)
- ✅ strategy.schema.js (83% coverage)
- ✅ transaction.schema.js (100% coverage)

### 2. Portfolio Reducer (243 LOC tests, 19 tests)
**File**: `/src/pages/__tests__/portfolioReducer.test.js`

**Coverage**: All actions, state transitions, edge cases
```javascript
describe('portfolioReducer', () => {
  it('opens the modal for a new asset', () => {
    const state = portfolioReducer(initialState, {
      type: PORTFOLIO_ACTIONS.OPEN_MODAL
    });
    expect(state.modal.isOpen).toBe(true);
  });
});
```

**Actions Tested**:
- ✅ OPEN_MODAL, CLOSE_MODAL
- ✅ OPEN_MODAL_EDIT
- ✅ SET_FORM_FIELD
- ✅ SAVE_START, SAVE_END
- ✅ ONCHAIN_LOOKUP_START, ONCHAIN_LOOKUP_END
- ✅ ONCHAIN_CLEAR
- ✅ SET_SYNC_WARNING, CLEAR_SYNC_WARNING

### 3. Portfolio Tabs (73 LOC tests, 6 tests)
**File**: `/src/components/portfolio/__tests__/PortfolioTabs.test.jsx`

**Coverage**: Tab rendering, active state, click handlers
```javascript
describe('PortfolioTabs', () => {
  it('highlights the active tab', () => {
    render(<PortfolioTabs activeTab="assets" setActiveTab={mockFn} />);
    expect(screen.getByText('Gestao de Ativos'))
      .toHaveClass('text-blue-400');
  });
});
```

---

## ⏳ Modules Needing Tests (In Progress)

### Services
**Status**: Partial tests exist but failing due to setup

**Services**:
- `transactionService.js` - Firestore operations
- `swapService.js` - Uniswap API integration
- `pricesService.js` - CoinGecko API
- `aiService.js` - AI chat integration
- `opportunityAnalyzer.js` - Analysis engine

**What's needed**:
```javascript
// Mock Firestore
jest.mock('../lib/firebase', () => ({
  db: mockDb,
  auth: mockAuth
}));

// Mock APIs
jest.mock('../lib/web3Api');

// Setup QueryClient for hooks
const queryClient = new QueryClient();
```

### Components
**Status**: Not yet tested

**High Priority** (critical user flows):
- `Portfolio.jsx` - Main portfolio page
- `Dashboard.jsx` - Homepage
- `AdminPanel.jsx` - Admin controls
- `AirdropDetail.jsx` - Airdrop details
- `Wallets.jsx` - Wallet management

**Medium Priority** (important flows):
- `AiCopilot.jsx`
- `DeFiPositions.jsx`
- `AssessorDashboard.jsx`

### Hooks
**Status**: Partial (useSwapQuote failing due to QueryClient)

**Hooks to test**:
- `useDashboardData.js`
- `useFirstLoadSnapshot.js`
- `useWallets.js`
- `useCryptoPrices.js`

---

## 🏗️ Testing Patterns & Best Practices

### 1. Schema Validation Pattern
```javascript
// Safe parsing (UI use)
const { success, data, error } = safeValidatePortfolioAsset(userInput);
if (!success) {
  showErrorMessage(error);
} else {
  saveToDatabase(data);
}

// Strict parsing (critical paths)
try {
  const validated = validatePortfolioAsset(data);
  processData(validated);
} catch (err) {
  logErrorAndAlert(err);
}
```

### 2. Reducer Testing Pattern
```javascript
describe('FeatureReducer', () => {
  it('should handle ACTION_TYPE', () => {
    const state = featureReducer(initialState, {
      type: ACTIONS.ACTION_TYPE,
      payload: { /* test data */ }
    });
    expect(state).toEqual(expectedState);
  });
});
```

### 3. Component Testing Pattern
```javascript
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockFn = jest.fn();
    render(<Component onAction={mockFn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### 4. Async Service Testing Pattern
```javascript
it('fetches data successfully', async () => {
  // Mock API
  jest.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => mockData
  });

  const result = await fetchSomething();
  expect(result).toEqual(mockData);
});
```

---

## 📝 Test File Organization

```
src/
├── components/
│   └── __tests__/
│       └── ComponentName.test.jsx
├── pages/
│   └── __tests__/
│       └── pageReducer.test.js
├── hooks/
│   └── __tests__/
│       └── useHookName.test.js
├── services/
│   └── __tests__/
│       └── serviceName.test.js
└── schemas/
    └── __tests__/
        └── schemas.test.js
```

**Naming Convention**:
- Test files: `ComponentName.test.jsx` or `featureName.test.js`
- Test suites: describe block matches component/function name
- Test cases: "should/it does ..." clear action descriptions

---

## 🚀 Improving Coverage Phase

### Phase 1: Service Tests (Week 2)
- Mock Firebase Realtime Database
- Mock external APIs (CoinGecko, Uniswap)
- Add 20 service-level tests
- Target: 10% coverage

### Phase 2: Component Tests (Week 3)
- Test critical user flows
- Test error states
- Test loading states
- Test accessibility
- Target: 25% coverage

### Phase 3: Integration Tests (Week 4)
- Test reducer + component interactions
- Test data flow end-to-end
- Test Firebase operations
- Target: 40% coverage

### Phase 4: E2E Tests (Future)
- Playwright/Cypress
- User journey validation
- Cross-browser testing
- Target: 60%+ coverage

---

## 🔍 Coverage Analysis

### High Coverage (Ready)
| Module | Coverage | Status |
|--------|----------|--------|
| portfolioReducer | 100% | ✅ Excellent |
| portfolioAsset.schema | 100% | ✅ Excellent |
| transaction.schema | 100% | ✅ Excellent |

### Medium Coverage (Good Foundation)
| Module | Coverage | Status |
|--------|----------|--------|
| schemas (avg) | 58% | ✅ Good |
| portfolioTabs | ~70% | ✅ Good |

### Low Coverage (Needs Work)
| Module | Coverage | Status |
|--------|----------|--------|
| services | 9% | ⏳ Planned |
| hooks | 0.5% | ⏳ Planned |
| components | 0% | ⏳ Planned |
| pages | 1.5% | ⏳ Planned |

---

## 📚 Mock Data & Fixtures

### Where to Put Fixtures
```
src/__fixtures__/
├── portfolioAssets.json
├── defiPositions.json
├── users.json
└── mockData.js
```

### Example Fixture
```javascript
// src/__fixtures__/portfolioAssets.json
{
  "valid": {
    "coinId": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "amount": 1.5,
    "averageBuyPrice": 45000
  }
}
```

---

## 🐛 Debugging Tests

```bash
# Run single test with output
npm test -- portfolioReducer.test.js --verbose

# Debug in Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Watch specific file
npm test -- portfolioReducer.test.js --watch

# Run failing tests in isolation
npm test -- --lastCommit --verbose
```

---

## ✅ Pre-Commit Test Checklist

Before pushing code:
```bash
# 1. Run tests
npm test

# 2. Check coverage
npm test -- --coverage

# 3. Build verification
npm run build

# 4. Linting (future)
npm run lint
```

---

## 📞 Test Maintenance

### Monthly Tasks
- [ ] Review test coverage reports
- [ ] Update mocks for API changes
- [ ] Remove obsolete tests
- [ ] Add tests for new features

### Quarterly Tasks
- [ ] Review testing strategy
- [ ] Evaluate test performance
- [ ] Update Jest config if needed
- [ ] Plan next coverage phase

---

## 🔗 Related Files

- **Jest Config**: `/jest.config.js`
- **Jest Setup**: `/jest.setup.js`
- **Validation**: `/src/lib/validation.js`
- **Schemas**: `/src/schemas/` (5 schemas)
- **Tests**: `/src/**/__tests__/`

---

## 📊 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Test Suites Passing | 100% | 50% | ⏳ |
| Tests Passing | 95%+ | 90% | ⏳ |
| Coverage | 2%+ (Phase 0) | 2.26% | ✅ |
| Build Time | <15s | ~12s | ✅ |

---

**Classification**: Internal - Development Guide
