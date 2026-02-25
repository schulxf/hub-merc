# Testing Guide — Mercurius Hub Phase 8

## 📋 Overview

Comprehensive testing strategy covering:
- **Unit Tests**: Individual functions and hooks (Jest + React Testing Library)
- **Integration Tests**: Component interactions and API flows
- **E2E Tests**: Full user workflows (Testnet)
- **Performance Tests**: Bundle size and runtime metrics

## 🚀 Setup

### Prerequisites
```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  babel-jest \
  identity-obj-proxy
```

### Configuration Files
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test environment setup
- `.env.test` - Test environment variables

## 🧪 Test Suites

### Unit Tests

#### Services
```bash
npm test -- src/services/__tests__/swapService.test.js
npm test -- src/services/__tests__/opportunityAnalyzer.test.js
```

**Coverage**:
- `swapService.js`: Quote fetching, slippage calculation, gas estimation
- `opportunityAnalyzer.js`: Drift detection, opportunity ranking

#### Hooks
```bash
npm test -- src/hooks/__tests__/useSwapQuote.test.js
npm test -- src/hooks/__tests__/useOpportunityAnalyzer.test.js
```

**Coverage**:
- `useSwapQuote`: Quote fetching, caching, error handling
- `useOpportunityAnalyzer`: Portfolio analysis, auto-updates

#### Components
```bash
npm test -- src/components/swap/__tests__/SwapWidget.test.js
npm test -- src/components/ai/__tests__/ChatInterface.test.js
```

**Coverage**:
- Swap UI interactions
- Chat message rendering
- Form submissions

### Running All Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run in watch mode (development)
npm test -- --watch

# Run specific suite
npm test -- --testNamePattern="useSwapQuote"
```

## 🌐 Integration Tests

### Portfolio Integration
```bash
# Test: Adding asset → Portfolio updates → Chart refreshes
npm test -- src/pages/__tests__/Portfolio.integration.test.js
```

### AI Copilot Integration
```bash
# Test: User message → AI analysis → Recommendations display
npm test -- src/pages/__tests__/AiCopilot.integration.test.js
```

### Swap Widget Integration
```bash
# Test: Quote fetch → Amount input → Gas calc → Execution
npm test -- src/components/swap/__tests__/SwapWidget.integration.test.js
```

## 🔗 Testnet E2E Tests

### Setup Testnet Wallet
```bash
# Add testnet provider to Hardhat config
npx hardhat node

# Deploy test tokens
npx hardhat run scripts/deploy-test-tokens.js --network localhost
```

### E2E Scenarios
1. **Swap Flow**
   - Select tokens
   - Enter amount
   - Verify quote
   - Confirm in MetaMask
   - Check transaction status

2. **AI Analysis Flow**
   - Input portfolio data
   - Send chat message
   - Receive AI analysis
   - Verify recommendations

3. **Portfolio Update Flow**
   - Add asset to portfolio
   - Trigger snapshot capture
   - Verify Firestore update
   - Check chart refresh

### Run E2E Tests
```bash
# Requires testnet running
npm run test:e2e

# With UI
npm run test:e2e -- --ui

# Specific test
npm run test:e2e -- --spec "tests/e2e/swap.test.js"
```

## 📊 Coverage Requirements

### Target Coverage
```javascript
{
  branches: 60%,
  functions: 60%,
  lines: 60%,
  statements: 60%
}
```

### View Coverage Report
```bash
npm test -- --coverage

# HTML report
open coverage/lcov-report/index.html
```

## 🐛 Debugging Tests

### Run Single Test File
```bash
npm test -- swapService.test.js
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
# Open chrome://inspect
```

### Console Output During Tests
```bash
npm test -- --verbose
```

## 🎯 Critical Test Scenarios

### Scenario 1: Swap with High Slippage
```javascript
// Test that warnings appear
// Test that gas estimates are calculated
// Test that execution is still possible
```

### Scenario 2: Portfolio with Mixed Assets
```javascript
// Test opportunity detection for 5+ assets
// Test score ranking
// Test drift calculation
```

### Scenario 3: AI Chat with Context
```javascript
// Test portfolio data serialization
// Test streaming response animation
// Test recommendation extraction
```

### Scenario 4: Network Errors
```javascript
// Test graceful error handling
// Test error message display
// Test retry functionality
```

## 📈 Performance Testing

### Bundle Analysis
```bash
npm run build

# View bundle size breakdown
npm run bundle-analyze
```

### Runtime Performance
```javascript
// Measure component render time
import { performance } from 'perf_hooks';

performance.mark('swap-quote-start');
await getSwapQuote(...);
performance.mark('swap-quote-end');
performance.measure('swap-quote', 'swap-quote-start', 'swap-quote-end');
```

### Target Metrics
- SwapWidget render: < 100ms
- Quote fetch: < 500ms
- AI analysis: < 3000ms
- Portfolio update: < 200ms

## ✅ Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Coverage > 60% (`npm test -- --coverage`)
- [ ] No console errors or warnings
- [ ] Bundle size acceptable (`npm run build`)
- [ ] E2E tests passing on testnet
- [ ] Swap functionality verified
- [ ] AI analysis working with testnet
- [ ] Portfolio snapshots saving correctly
- [ ] Error handling tested
- [ ] Mobile responsiveness verified

## 🔧 Maintenance

### Add New Test
1. Create `__tests__/component.test.js` next to component
2. Use existing mocks in `jest.setup.js`
3. Follow naming convention: `describe()`/`it()`
4. Verify coverage doesn't drop below 60%

### Update Tests on Breaking Changes
```bash
# Update snapshots
npm test -- --updateSnapshot
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run build
```

## 📚 Resources

- [Jest Docs](https://jestjs.io)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [1inch API Testnet](https://portal.1inch.io/)
- [OpenAI API Testing](https://platform.openai.com/docs/guides/rate-limits)

## 🚨 Known Issues

- [ ] Testnet faucet sometimes unavailable (use Alchemy testnet faucet)
- [ ] Firebase emulator slow on first run
- [ ] MetaMask window focus issues in E2E tests (use --headless)

## 💬 Questions?

See CLOUD_FUNCTIONS_SETUP.md for testing deployed functions.
See README.md for overall architecture.
