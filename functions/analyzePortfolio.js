/**
 * Cloud Function: analyzePortfolio
 *
 * DEPLOYMENT INSTRUCTIONS (requires Firebase Blaze plan):
 *
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Set up functions: firebase init functions
 * 3. Copy this file to functions/index.js
 * 4. Set OpenAI API key: firebase functions:config:set openai.api_key="sk-..."
 * 5. Deploy: firebase deploy --only functions
 *
 * Endpoint: https://[region]-[projectid].cloudfunctions.net/analyzePortfolio
 *
 * USAGE (from frontend):
 * const response = await fetch(
 *   'https://[region]-[projectid].cloudfunctions.net/analyzePortfolio',
 *   {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${idToken}` // From Firebase Auth
 *     },
 *     body: JSON.stringify({ portfolioData, userQuestion })
 *   }
 * );
 * const result = await response.json();
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

// Initialize Firebase Admin (automatically initialized in Cloud Functions)
admin.initializeApp();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * analyzePortfolio — HTTP Cloud Function for portfolio analysis with OpenAI.
 *
 * Receives portfolio data and user question, returns AI analysis.
 *
 * Request body:
 * {
 *   portfolioData: {
 *     assets: [{symbol, name, quantity, purchasePrice, currentPrice, currentValue, coinId}],
 *     totalValue: number,
 *     assetCount: number
 *   },
 *   userQuestion: string
 * }
 *
 * Response:
 * {
 *   analysis: string,
 *   recommendations: [{type, asset, rationale, priority, estimated_impact}]
 * }
 */
exports.analyzePortfolio = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to call this function.',
    );
  }

  const { portfolioData, userQuestion } = data;

  // Validate input
  if (!portfolioData || !userQuestion) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'portfolioData and userQuestion are required.',
    );
  }

  try {
    // Format portfolio data for GPT context
    const portfolioSummary = formatPortfolioForContext(portfolioData);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a professional cryptocurrency portfolio advisor.
          Analyze the user's portfolio and answer their questions.
          Provide actionable insights, risk assessments, and recommendations.
          Always respond in Portuguese (Portugal).
          Keep responses concise and focused on the user's specific question.`,
        },
        {
          role: 'user',
          content: `Portfolio Summary:\n${portfolioSummary}\n\nUser Question: ${userQuestion}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    // Extract analysis
    const analysis = response.choices[0].message.content;

    // Parse recommendations from analysis (simple regex-based parsing)
    const recommendations = parseRecommendations(analysis);

    return {
      success: true,
      analysis,
      recommendations,
      timestamp: new Date().toISOString(),
      tokensUsed: response.usage,
    };
  } catch (error) {
    console.error('[analyzePortfolio] Erro ao chamar OpenAI:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao processar análise de portfólio',
    );
  }
});

/**
 * Format portfolio data into human-readable context for GPT.
 */
function formatPortfolioForContext(portfolioData) {
  const { assets, totalValue, assetCount } = portfolioData;

  const assetLines = assets
    .map((asset) => {
      const allocationPercent = (asset.currentValue / totalValue) * 100;
      return `- ${asset.symbol}: ${asset.quantity} unidades (${asset.currentValue.toFixed(2)} USD, ${allocationPercent.toFixed(1)}%)`;
    })
    .join('\n');

  return `
Portfólio Total: $${totalValue.toFixed(2)}
Número de Ativos: ${assetCount}

Composição:
${assetLines}
  `.trim();
}

/**
 * Simple recommendation parser from GPT response.
 * In production, would use more sophisticated extraction.
 */
function parseRecommendations(analysis) {
  const recommendations = [];

  // Simple pattern: look for keywords indicating recommendations
  const buyPattern = /comprar|buy|aumentar posição/gi;
  const sellPattern = /vender|sell|reduzir posição/gi;
  const rebalancePattern = /rebalance|rebalancear/gi;

  if (buyPattern.test(analysis)) {
    recommendations.push({
      type: 'buy',
      asset: 'unknown',
      rationale: 'Análise sugere aumento de posição',
      priority: 'medium',
      estimated_impact: 5,
    });
  }

  if (sellPattern.test(analysis)) {
    recommendations.push({
      type: 'sell',
      asset: 'unknown',
      rationale: 'Análise sugere redução de posição',
      priority: 'medium',
      estimated_impact: -5,
    });
  }

  if (rebalancePattern.test(analysis)) {
    recommendations.push({
      type: 'rebalance',
      asset: 'portfolio',
      rationale: 'Rebalanceamento recomendado',
      priority: 'medium',
      estimated_impact: 0,
    });
  }

  return recommendations;
}

/**
 * Scheduled function to analyze market conditions daily.
 * (Optional - run at 9 AM UTC daily)
 */
exports.dailyMarketAnalysis = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('[dailyMarketAnalysis] Running scheduled market analysis...');
    // TODO: Implement daily market analysis logic
    return null;
  });
