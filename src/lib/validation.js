/**
 * Validation helpers — wrappers around Zod schemas for safe data validation.
 *
 * Provides two patterns:
 * 1. parse() — throws on validation error (strict parsing)
 * 2. safeParse() — returns { success, data?, error? } (soft validation)
 *
 * Use safeParse in components to handle invalid data gracefully.
 * Use parse in critical paths where invalid data is a serious error.
 */

import {
  portfolioAssetSchema,
  defiPositionSchema,
  researchSchema,
  strategySchema,
  modelPortfolioSchema,
} from '../schemas/index';

/**
 * Safely parse a portfolio asset.
 * @param {unknown} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function safeValidatePortfolioAsset(data) {
  const result = portfolioAssetSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return { success: false, error: errorMsg };
}

/**
 * Parse a portfolio asset (throws on validation error).
 * @param {unknown} data
 * @returns {object}
 * @throws {Error}
 */
export function validatePortfolioAsset(data) {
  try {
    return portfolioAssetSchema.parse(data);
  } catch (err) {
    throw new Error(`Invalid portfolio asset: ${err.message}`);
  }
}

/**
 * Safely parse a DeFi position.
 * @param {unknown} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function safeValidateDefiPosition(data) {
  const result = defiPositionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return { success: false, error: errorMsg };
}

/**
 * Parse a DeFi position (throws on validation error).
 * @param {unknown} data
 * @returns {object}
 * @throws {Error}
 */
export function validateDefiPosition(data) {
  try {
    return defiPositionSchema.parse(data);
  } catch (err) {
    throw new Error(`Invalid DeFi position: ${err.message}`);
  }
}

/**
 * Safely parse a research document.
 * @param {unknown} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function safeValidateResearch(data) {
  const result = researchSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return { success: false, error: errorMsg };
}

/**
 * Parse a research document (throws on validation error).
 * @param {unknown} data
 * @returns {object}
 * @throws {Error}
 */
export function validateResearch(data) {
  try {
    return researchSchema.parse(data);
  } catch (err) {
    throw new Error(`Invalid research document: ${err.message}`);
  }
}

/**
 * Safely parse a strategy.
 * @param {unknown} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function safeValidateStrategy(data) {
  const result = strategySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return { success: false, error: errorMsg };
}

/**
 * Parse a strategy (throws on validation error).
 * @param {unknown} data
 * @returns {object}
 * @throws {Error}
 */
export function validateStrategy(data) {
  try {
    return strategySchema.parse(data);
  } catch (err) {
    throw new Error(`Invalid strategy: ${err.message}`);
  }
}

/**
 * Safely parse a model portfolio.
 * @param {unknown} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function safeValidateModelPortfolio(data) {
  const result = modelPortfolioSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return { success: false, error: errorMsg };
}

/**
 * Parse a model portfolio (throws on validation error).
 * @param {unknown} data
 * @returns {object}
 * @throws {Error}
 */
export function validateModelPortfolio(data) {
  try {
    return modelPortfolioSchema.parse(data);
  } catch (err) {
    throw new Error(`Invalid model portfolio: ${err.message}`);
  }
}

/**
 * Batch validate multiple items.
 * @param {unknown[]} items
 * @param {Function} validateFn - validation function (safe or strict)
 * @returns {{ valid: object[], invalid: Array<{item, error}> }}
 */
export function batchValidate(items, validateFn) {
  const valid = [];
  const invalid = [];

  items.forEach((item) => {
    const result = validateFn(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ item, error: result.error });
    }
  });

  return { valid, invalid };
}
