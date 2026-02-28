/**
 * AI Service — portfolio analysis via Firebase Cloud Functions.
 * Pure service functions, no React, no hooks.
 *
 * All external AI responses are validated with Zod schemas before use.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { PortfolioAnalysisSchema, RecommendationSchema } from '../schemas/aiService.schema.js';
import { safeParse } from '../schemas/web3.schema.js';

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Get the Firebase Functions instance (lazy — avoids import-time init issues).
 * Uses the default Firebase app initialized in src/lib/firebase.js.
 * @returns {import('firebase/functions').Functions}
 */
function getFunctionsInstance() {
  try {
    return getFunctions();
  } catch (err) {
    throw new Error(`[aiService] Could not get Firebase Functions instance: ${err.message}`);
  }
}

// ─────────────────────────────────────────────
// Public service functions
// ─────────────────────────────────────────────

/**
 * analyzePortfolioWithAI — Call Cloud Function to get AI-generated portfolio analysis.
 *
 * @param {{ assets: Array<{ symbol: string, valueUsd: number, amount: number }>, totalValue: number }} portfolioData
 * @param {string} userQuestion - User's question about their portfolio
 * @returns {Promise<{ summary: string, allocation_assessment: string, recommendations: Array }>}
 * @throws {Error} When the Cloud Function call fails or the response is invalid
 */
export async function analyzePortfolioWithAI(portfolioData, userQuestion) {
  if (!portfolioData || !portfolioData.assets) {
    throw new Error('[aiService] portfolioData with assets array is required');
  }
  if (!userQuestion || typeof userQuestion !== 'string') {
    throw new Error('[aiService] userQuestion must be a non-empty string');
  }

  try {
    const functions = getFunctionsInstance();
    const analyzePortfolio = httpsCallable(functions, 'analyzePortfolio');

    const result = await analyzePortfolio({
      portfolio: portfolioData,
      question: userQuestion.trim(),
    });

    const analysis = safeParse(PortfolioAnalysisSchema, result.data, 'aiService/analyzePortfolio');
    if (!analysis) {
      throw new Error('[aiService] Invalid response structure from analyzePortfolio function');
    }

    return analysis;
  } catch (err) {
    // Re-throw with consistent prefix so callers can identify the source
    if (err.message.startsWith('[aiService]')) throw err;
    throw new Error(`[aiService] analyzePortfolioWithAI failed: ${err.message}`);
  }
}

/**
 * extractRecommendationsFromAnalysis — Parse AI analysis into typed Recommendation objects.
 * Validates each recommendation with RecommendationSchema; invalid ones are logged and skipped.
 *
 * @param {{ recommendations: Array }} analysis - Output from analyzePortfolioWithAI
 * @returns {Promise<Array>} - Array of validated recommendation objects
 */
export async function extractRecommendationsFromAnalysis(analysis) {
  if (!analysis || !Array.isArray(analysis.recommendations)) {
    console.warn('[aiService] extractRecommendationsFromAnalysis: analysis.recommendations is not an array');
    return [];
  }

  const validated = [];

  for (const raw of analysis.recommendations) {
    // Map PortfolioAnalysis recommendation shape → RecommendationSchema shape.
    // AI response uses estimated_impact (string) and does not include allocation data,
    // so we fill required numeric fields with safe defaults.
    const candidate = {
      type: raw.type,
      asset: raw.asset,
      currentAllocation: raw.currentAllocation ?? 0,
      targetAllocation: raw.targetAllocation ?? 0,
      suggestedAmount: raw.suggestedAmount ?? '0',
      rationale: raw.rationale,
      priority: raw.priority,
      expectedROI: raw.expectedROI,
      gasEstimate: raw.gasEstimate,
      id: raw.id,
    };

    const result = RecommendationSchema.safeParse(candidate);
    if (result.success) {
      validated.push(result.data);
    } else {
      console.warn('[aiService] Skipping invalid recommendation:', result.error.flatten(), raw);
    }
  }

  return validated;
}

/**
 * askFollowUpQuestion — Send a follow-up question with previous analysis context.
 * Returns a markdown-formatted string response from the AI.
 *
 * @param {string} followUpQuestion - User's follow-up question
 * @param {object} previousContext - Previous analysis returned by analyzePortfolioWithAI
 * @returns {Promise<string>} - AI response as markdown text
 * @throws {Error} When the Cloud Function call fails
 */
export async function askFollowUpQuestion(followUpQuestion, previousContext) {
  if (!followUpQuestion || typeof followUpQuestion !== 'string') {
    throw new Error('[aiService] followUpQuestion must be a non-empty string');
  }
  if (!previousContext) {
    throw new Error('[aiService] previousContext is required for follow-up questions');
  }

  try {
    const functions = getFunctionsInstance();
    const askFollowUp = httpsCallable(functions, 'askPortfolioFollowUp');

    const result = await askFollowUp({
      question: followUpQuestion.trim(),
      context: previousContext,
    });

    const data = result.data;
    if (!data || typeof data.response !== 'string') {
      throw new Error('[aiService] Unexpected response format from askPortfolioFollowUp');
    }

    return data.response;
  } catch (err) {
    if (err.message.startsWith('[aiService]')) throw err;
    throw new Error(`[aiService] askFollowUpQuestion failed: ${err.message}`);
  }
}

/**
 * explainRecommendation — Get a detailed AI explanation for a specific recommendation.
 * Includes market context, risk factors, and reasoning behind the suggestion.
 *
 * @param {object} recommendation - A validated Recommendation object
 * @param {{ assets: Array, totalValue: number }} portfolioData - Current portfolio state
 * @returns {Promise<string>} - Detailed explanation as markdown text
 * @throws {Error} When the Cloud Function call fails
 */
export async function explainRecommendation(recommendation, portfolioData) {
  if (!recommendation || !recommendation.asset) {
    throw new Error('[aiService] recommendation with asset field is required');
  }
  if (!portfolioData || !portfolioData.assets) {
    throw new Error('[aiService] portfolioData with assets array is required');
  }

  try {
    const functions = getFunctionsInstance();
    const explainRec = httpsCallable(functions, 'explainRecommendation');

    const result = await explainRec({
      recommendation,
      portfolio: portfolioData,
    });

    const data = result.data;
    if (!data || typeof data.explanation !== 'string') {
      throw new Error('[aiService] Unexpected response format from explainRecommendation');
    }

    return data.explanation;
  } catch (err) {
    if (err.message.startsWith('[aiService]')) throw err;
    throw new Error(`[aiService] explainRecommendation failed: ${err.message}`);
  }
}
