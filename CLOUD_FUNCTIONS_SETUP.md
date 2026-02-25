# Cloud Functions Setup

## ⚠️ Requirements

- **Firebase Plan**: Blaze (paid) - Cloud Functions require a paid Firebase plan
- **Node.js**: 20 or higher
- **Firebase CLI**: `npm install -g firebase-tools`

## 🚀 Deployment Steps

### Step 1: Upgrade Firebase Project to Blaze

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project `hubmercurius`
3. Go to **Settings** → **Billing**
4. Click **Upgrade to Blaze** and complete the payment setup
5. Confirm Blaze plan is active

### Step 2: Set up Local Development

```bash
cd functions
npm install
```

### Step 3: Configure OpenAI API Key

```bash
# Log in to Firebase
firebase login

# Set environment variable
firebase functions:config:set openai.api_key="sk-your-api-key-here"

# Verify config
firebase functions:config:get
```

### Step 4: Test Locally (Optional)

```bash
firebase emulators:start --only functions
```

### Step 5: Deploy to Production

```bash
firebase deploy --only functions
```

After deployment, you'll see the function URL:
```
✓  functions[analyzePortfolio(us-central1)] Successful
Function URL: https://[region]-[projectid].cloudfunctions.net/analyzePortfolio
```

## 📋 Available Functions

### analyzePortfolio

**Purpose**: AI-powered portfolio analysis using OpenAI GPT-4

**Request**:
```javascript
const response = await fetch(
  'https://[region]-[projectid].cloudfunctions.net/analyzePortfolio',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      portfolioData: {
        assets: [{symbol, name, quantity, currentPrice, currentValue}],
        totalValue: 10000,
        assetCount: 5
      },
      userQuestion: "Devo rebalancear meu portfólio?"
    })
  }
);
```

**Response**:
```javascript
{
  success: true,
  analysis: "Your portfolio analysis...",
  recommendations: [
    {
      type: "buy|sell|rebalance",
      asset: "BTC",
      rationale: "Reasoning...",
      priority: "high|medium|low",
      estimated_impact: 5
    }
  ],
  timestamp: "2026-02-24T22:00:00Z",
  tokensUsed: {
    prompt_tokens: 150,
    completion_tokens: 300
  }
}
```

**Costs**:
- OpenAI GPT-4 Turbo: ~$0.01-0.03 per analysis
- Firebase Cloud Functions: Free tier + usage-based pricing

## 🔑 Environment Variables

Create `.env` file in `functions/`:

```env
OPENAI_API_KEY=sk-your-key-here
FIREBASE_PROJECT_ID=hubmercurius
```

## 📝 Updating Frontend Code

Once deployed, update `src/services/aiService.js` to use the deployed function:

```javascript
// Change from mock to real function call
const response = await functions.httpsCallable('analyzePortfolio')({
  portfolioData,
  userQuestion
});
```

## 🧪 Testing with cURL

```bash
curl -X POST https://[region]-[projectid].cloudfunctions.net/analyzePortfolio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioData": {"assets": [...], "totalValue": 10000},
    "userQuestion": "Análise do portfólio"
  }'
```

## 🐛 Debugging

View function logs:

```bash
firebase functions:log
```

Or in Firebase Console:
1. Go to **Cloud Functions**
2. Click **analyzePortfolio**
3. Go to **Logs** tab

## 💾 Backup & Restore

Functions code is version-controlled in `functions/`:

```bash
# Deploy specific function
firebase deploy --only functions:analyzePortfolio

# View deployment history
firebase functions:list
```

## 🔐 Security

### Authentication
- All functions require Firebase Auth tokens
- Tokens verified automatically by Cloud Functions

### Rate Limiting (TODO)
- Implement per-user rate limits (5 calls/minute)
- Cache analysis results for 5 minutes
- Cost: ~$0.015/call → need throttling

### Data Privacy
- Portfolio data not logged
- OpenAI API call logs audited
- Delete analysis after 30 days

## 📚 Additional Resources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Cloud Functions Best Practices](https://firebase.google.com/docs/functions/bestpractices/tips)

## ⏰ Next Steps

1. ✅ Deploy Cloud Function
2. ⏳ Update `aiService.js` to use real endpoint
3. ⏳ Add rate limiting/caching
4. ⏳ Implement error tracking (Sentry)
5. ⏳ Set up cost monitoring alerts
