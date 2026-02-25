# Phase 8 Deployment Guide — AI Copilot & Swap Integration

## 📋 Overview

**Phase 8** introduces AI-powered portfolio analysis and DEX swap integration to Mercurius Hub.

**Status**: Ready for MVP production deployment (without Cloud Functions)
**Timeline**: 2-3 days for full deployment + testing

## 🎯 What's New

### AI Copilot Assistant
- Chat interface with streaming responses
- Real-time portfolio analysis
- AI-generated recommendations
- Follow-up suggestion buttons

### Swap Widget
- Real-time 1inch quotes
- Slippage tolerance adjustment
- Gas fee estimation
- MetaMask integration

### Opportunity Detection
- Portfolio drift analysis
- Rebalancing recommendations
- Score-based prioritization
- In-portfolio banner alerts

### Supporting Infrastructure
- TanStack Query caching
- Zod validation schemas
- Cloud Function templates (Blaze plan ready)
- Comprehensive test suite

## 📦 Deployment Options

### Option A: MVP (Recommended — No Paid Services)
✅ What's included:
- AI Copilot page (mocked AI responses)
- Swap Widget with 1inch quotes (testnet)
- Portfolio opportunity detection
- Full UI/UX

❌ What's excluded:
- Real OpenAI integration (requires Cloud Functions)
- Live testnet swaps (requires wallet connection)

### Option B: Full Featured (Requires Blaze Plan)
✅ Additional features:
- Real GPT-4 portfolio analysis
- Cloud Function API
- Production 1inch integration
- MetaMask swap execution

❌ Additional requirements:
- Firebase Blaze plan ($25+/month estimated)
- OpenAI API key
- Testnet ETH for swaps
- Monitoring and alerting setup

## 🚀 MVP Deployment (No Blaze Plan)

### Prerequisites
```bash
# Check Node version (need 20+)
node --version

# Update dependencies
npm install

# Run build
npm run build

# Verify build success
ls -lh dist/
```

### Step 1: Update Environment Variables

```bash
# .env (or Firebase config in App.jsx)
VITE_FIREBASE_PROJECT_ID=hubmercurius
VITE_FIREBASE_APP_ID=1:xxxxx:web:xxxxx

# 1inch API (testnet)
VITE_ONEINCH_API_URL=https://api.1inch.io/v5.0/1  # Ethereum testnet
```

### Step 2: Update Firestore Security Rules

Already deployed in `firestore.rules`. Verify in Firebase Console:

```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy to Firebase Hosting

```bash
# Build production bundle
npm run build

# Deploy
firebase deploy --only hosting

# Get hosting URL
firebase hosting:channel:list
```

### Step 4: Verify Deployment

✅ Checklist:
- [ ] App loads without errors
- [ ] AI Copilot page accessible (Portfolio tier users)
- [ ] Swap Widget displays correctly
- [ ] Portfolio Opportunity Banner shows
- [ ] Chat interface responsive
- [ ] Console has zero errors
- [ ] Mobile view works

**Access**: `https://[projectid].firebaseapp.com/dashboard/ia-copilot`

## 📱 Testing Before Production

### Manual Testing Checklist
```
Portfolio Page:
  [ ] Opportunity Banner displays (if drift > 5%)
  [ ] Banner dismissible
  [ ] "Rebalancear Agora" button accessible

AI Copilot Page:
  [ ] Page loads with header + chat area
  [ ] Welcome message displays
  [ ] Chat input accepts text
  [ ] Send button works
  [ ] Mocked AI response returns in 1-2s
  [ ] Streaming animation shows (cursor blinking)
  [ ] Follow-up suggestions clickable

Swap Widget (when integrated):
  [ ] Token dropdowns show
  [ ] Amount input validates
  [ ] Max button works
  [ ] 1inch quote fetches (if testnet configured)
  [ ] Slippage selector works
  [ ] Gas estimate calculates
  [ ] Submit button disabled until quote ready

General:
  [ ] Mobile view responsive
  [ ] Dark theme consistent
  [ ] No console errors
  [ ] All images load
  [ ] Network requests complete
```

### Automated Testing
```bash
# Run test suite
npm test

# Generate coverage report
npm test -- --coverage

# Check coverage meets 60% threshold
```

## 🔄 Upgrade Path to Full Features

### When Ready for Blaze Plan:

1. **Upgrade Firebase Project**
   - Go to Firebase Console → Settings → Billing
   - Upgrade to Blaze plan
   - Confirm payment method

2. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   firebase functions:config:set openai.api_key="sk-..."
   firebase deploy --only functions
   ```

3. **Update Frontend**
   - Modify `src/services/aiService.js` to call real function
   - Set 1inch API key for production network
   - Configure MetaMask for mainnet

4. **Add Cost Monitoring**
   - Set up Firebase alerts (budget warnings)
   - Monitor OpenAI API usage
   - Add rate limiting if needed

## 📊 Performance Metrics

### Target Load Times
- Portfolio page load: < 2s
- AI Copilot load: < 1.5s
- Quote fetch: < 500ms
- AI analysis: < 3s (with Cloud Function)

### Bundle Sizes (Gzipped)
- Main bundle: ~213 kB
- AiCopilot chunk: 6.61 kB
- Portfolio chunk: 6.40 kB
- Swap components: bundled with features

## 🔐 Security Checklist

Before going to production:

- [ ] Firebase Security Rules enforced
- [ ] API keys not in client code
- [ ] Environment variables configured
- [ ] OpenAI key only in Cloud Functions (server-side)
- [ ] 1inch API key secured
- [ ] No console logging of sensitive data
- [ ] CORS properly configured
- [ ] Rate limiting planned (pre-Blaze)

## 📈 Monitoring & Analytics

### Firebase Console
1. **Firestore**
   - Monitor write operations
   - Check security rule violations
   - View quota usage

2. **Realtime Database**
   - Watch portfolio snapshot writes
   - Monitor transaction delays

3. **Cloud Functions** (after deployment)
   - Check error rates
   - Monitor execution time
   - Review logs for issues

### Application Monitoring
```javascript
// Add to App.jsx for production
if (process.env.NODE_ENV === 'production') {
  // TODO: Add Sentry or equivalent
  // TODO: Add analytics tracking
}
```

## 🚨 Rollback Plan

If issues arise post-deployment:

### Option 1: Quick Rollback
```bash
# Revert to previous build
firebase hosting:versions:list
firebase hosting:clone <version-id>
```

### Option 2: Feature Flag Disable
```javascript
// In DashboardLayout.jsx
const isAiCopilotEnabled = featureFlags?.aiCopilot ?? true;

if (currentRoute === 'ia-copilot' && !isAiCopilotEnabled) {
  return <MockPage title="Feature coming soon" />;
}
```

### Option 3: Full Revert
```bash
# Delete current deployment
firebase hosting:releases:list
firebase hosting:disable

# Contact Firebase support for recovery
```

## 📞 Support & Documentation

### User-Facing Docs
- [ ] Create user guide for AI Copilot
- [ ] Create tutorial for Swap Widget
- [ ] Add FAQ section
- [ ] Create video walkthroughs

### Developer Docs
- See: `TESTING_GUIDE.md` - Testing procedures
- See: `CLOUD_FUNCTIONS_SETUP.md` - Function deployment
- See: `README.md` - Architecture overview

## 🎉 Post-Deployment

### Day 1 (Launch)
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Monitor Firebase quotas

### Week 1
- [ ] Collect analytics data
- [ ] Identify issues from logs
- [ ] Plan bug fixes
- [ ] Start Blaze upgrade planning

### Month 1
- [ ] Evaluate performance
- [ ] Plan Phase 9 features
- [ ] Consider cost optimization
- [ ] Upgrade to Blaze if demand high

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Environment variables set
- [ ] Firebase rules deployed
- [ ] Manual testing completed
- [ ] Security review done
- [ ] Performance targets met

### Deployment
- [ ] Firebase auth configured
- [ ] Hosting enabled
- [ ] Environment set to production
- [ ] Deploy command successful
- [ ] DNS/custom domain configured

### Post-Deployment
- [ ] Smoke test on production
- [ ] Monitor error logs
- [ ] Verify analytics working
- [ ] Notify stakeholders
- [ ] Document deployment
- [ ] Schedule post-launch review

## 📞 Questions?

See individual guides:
- `TESTING_GUIDE.md` - Testing procedures
- `CLOUD_FUNCTIONS_SETUP.md` - Cloud Function deployment
- `README.md` - Architecture and codebase
- `.github/CONTRIBUTING.md` - Development workflow

---

**Deployed by**: Phase 8 Implementation
**Deployment Date**: [Date of deployment]
**Version**: v1.0.0-phase8
**Status**: MVP production-ready
