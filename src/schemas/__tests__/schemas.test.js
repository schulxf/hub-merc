/**
 * Unit tests for all Zod schema validation functions.
 *
 * Tests both valid and invalid inputs to confirm that:
 *  - Valid data passes through unchanged (with defaults applied)
 *  - Invalid data throws or returns a failure result
 */

import {
  PortfolioAssetSchema,
  validatePortfolioAsset,
  safeValidatePortfolioAsset,
} from '../portfolioAsset.schema';

import {
  DefiPositionSchema,
  validateDefiPosition,
} from '../defiPosition.schema';

import {
  ResearchSchema,
  validateResearch,
} from '../research.schema';

import {
  StrategySchema,
  validateStrategy,
} from '../strategy.schema';

import {
  ModelPortfolioSchema,
  validateModelPortfolio,
} from '../modelPortfolio.schema';

import {
  TransactionSchema,
  validateTransaction,
  safeValidateTransaction,
} from '../transaction.schema';

// ─── PortfolioAssetSchema ────────────────────────────────────────────────────

describe('PortfolioAssetSchema', () => {
  const validAsset = {
    coinId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 0.5,
    averageBuyPrice: 60000,
  };

  it('accepts a valid portfolio asset', () => {
    const result = validatePortfolioAsset(validAsset);
    expect(result.coinId).toBe('bitcoin');
    expect(result.symbol).toBe('BTC');
    expect(result.amount).toBe(0.5);
  });

  it('applies default color when omitted', () => {
    const result = validatePortfolioAsset(validAsset);
    expect(result.color).toBe('#6366F1');
  });

  it('applies default source "manual" when omitted', () => {
    const result = validatePortfolioAsset(validAsset);
    expect(result.source).toBe('manual');
  });

  it('accepts source "onchain"', () => {
    const result = validatePortfolioAsset({ ...validAsset, source: 'onchain' });
    expect(result.source).toBe('onchain');
  });

  it('rejects a negative amount', () => {
    expect(() => validatePortfolioAsset({ ...validAsset, amount: -1 })).toThrow();
  });

  it('rejects a negative averageBuyPrice', () => {
    expect(() =>
      validatePortfolioAsset({ ...validAsset, averageBuyPrice: -100 })
    ).toThrow();
  });

  it('rejects a missing coinId', () => {
    const { coinId, ...rest } = validAsset;
    expect(() => validatePortfolioAsset(rest)).toThrow();
  });

  it('safeValidatePortfolioAsset returns success=true for valid data', () => {
    const result = safeValidatePortfolioAsset(validAsset);
    expect(result.success).toBe(true);
  });

  it('safeValidatePortfolioAsset returns success=false for invalid data', () => {
    const result = safeValidatePortfolioAsset({ coinId: '', amount: -1 });
    expect(result.success).toBe(false);
  });
});

// ─── DefiPositionSchema ──────────────────────────────────────────────────────

describe('DefiPositionSchema', () => {
  const validPosition = {
    protocol: 'Lido',
    chain: 'ethereum',
    type: 'staking',
    tokenSymbol: 'ETH',
    amountDeposited: 2,
  };

  it('accepts a valid DeFi position', () => {
    const result = validateDefiPosition(validPosition);
    expect(result.protocol).toBe('Lido');
    expect(result.type).toBe('staking');
  });

  it('applies default status "active"', () => {
    const result = validateDefiPosition(validPosition);
    expect(result.status).toBe('active');
  });

  it('rejects an unknown position type', () => {
    expect(() =>
      validateDefiPosition({ ...validPosition, type: 'invalid_type' })
    ).toThrow();
  });

  it('rejects a negative amountDeposited', () => {
    expect(() =>
      validateDefiPosition({ ...validPosition, amountDeposited: -5 })
    ).toThrow();
  });

  it('accepts LP pair positions with tokenSymbolPair', () => {
    const result = validateDefiPosition({
      ...validPosition,
      type: 'liquidity_pool',
      tokenSymbolPair: 'USDC',
    });
    expect(result.tokenSymbolPair).toBe('USDC');
  });
});

// ─── ResearchSchema ──────────────────────────────────────────────────────────

describe('ResearchSchema', () => {
  const validResearch = {
    title: 'Bitcoin Q3 Outlook',
    summary: 'An analysis of BTC macro conditions.',
    content: 'Full article content here.',
    category: 'macro',
  };

  it('accepts a valid research document', () => {
    const result = validateResearch(validResearch);
    expect(result.title).toBe('Bitcoin Q3 Outlook');
    expect(result.category).toBe('macro');
  });

  it('applies default status "draft"', () => {
    const result = validateResearch(validResearch);
    expect(result.status).toBe('draft');
  });

  it('applies default minTier "pro"', () => {
    const result = validateResearch(validResearch);
    expect(result.minTier).toBe('pro');
  });

  it('rejects an unknown category', () => {
    expect(() =>
      validateResearch({ ...validResearch, category: 'crypto_news' })
    ).toThrow();
  });

  it('rejects a title over 200 characters', () => {
    const longTitle = 'A'.repeat(201);
    expect(() =>
      validateResearch({ ...validResearch, title: longTitle })
    ).toThrow();
  });
});

// ─── StrategySchema ──────────────────────────────────────────────────────────

describe('StrategySchema', () => {
  const validStrategy = {
    name: 'Carteira Conservadora 2025',
    riskProfile: 'conservative',
  };

  it('accepts a valid strategy', () => {
    const result = validateStrategy(validStrategy);
    expect(result.name).toBe('Carteira Conservadora 2025');
    expect(result.riskProfile).toBe('conservative');
  });

  it('applies default status "draft"', () => {
    const result = validateStrategy(validStrategy);
    expect(result.status).toBe('draft');
  });

  it('applies empty default allocations array', () => {
    const result = validateStrategy(validStrategy);
    expect(result.allocations).toEqual([]);
  });

  it('rejects an unknown risk profile', () => {
    expect(() =>
      validateStrategy({ ...validStrategy, riskProfile: 'extreme' })
    ).toThrow();
  });

  it('validates allocation entries', () => {
    const withAllocation = {
      ...validStrategy,
      allocations: [
        { coinId: 'bitcoin', symbol: 'BTC', targetPercent: 60 },
        { coinId: 'ethereum', symbol: 'ETH', targetPercent: 40 },
      ],
    };
    const result = validateStrategy(withAllocation);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].driftThresholdPercent).toBe(5); // default
  });
});

// ─── ModelPortfolioSchema ────────────────────────────────────────────────────

describe('ModelPortfolioSchema', () => {
  const validModel = {
    name: 'Blue Chip Portfolio',
  };

  it('accepts a minimal model portfolio', () => {
    const result = validateModelPortfolio(validModel);
    expect(result.name).toBe('Blue Chip Portfolio');
  });

  it('applies default status "draft"', () => {
    const result = validateModelPortfolio(validModel);
    expect(result.status).toBe('draft');
  });

  it('applies default minTier "pro"', () => {
    const result = validateModelPortfolio(validModel);
    expect(result.minTier).toBe('pro');
  });

  it('applies empty default slots array', () => {
    const result = validateModelPortfolio(validModel);
    expect(result.slots).toEqual([]);
  });

  it('validates portfolio slots', () => {
    const withSlots = {
      ...validModel,
      slots: [{ coinId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', targetPercent: 50 }],
    };
    const result = validateModelPortfolio(withSlots);
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0].rationale).toBe(''); // default
  });
});

// ─── TransactionSchema ───────────────────────────────────────────────────────

describe('TransactionSchema (existing)', () => {
  const validTx = {
    type: 'BUY',
    quantity: 0.5,
    price: 60000,
    date: '2025-01-01T00:00:00.000Z',
    usdValue: 30000,
  };

  it('accepts a valid BUY transaction', () => {
    const result = validateTransaction(validTx);
    expect(result.type).toBe('BUY');
    expect(result.quantity).toBe(0.5);
  });

  it('accepts a valid SELL transaction', () => {
    const result = validateTransaction({ ...validTx, type: 'SELL' });
    expect(result.type).toBe('SELL');
  });

  it('rejects an unknown transaction type', () => {
    expect(() => validateTransaction({ ...validTx, type: 'TRANSFER' })).toThrow();
  });

  it('rejects a negative quantity', () => {
    expect(() => validateTransaction({ ...validTx, quantity: -1 })).toThrow();
  });

  it('safeValidateTransaction returns success=false for invalid data', () => {
    const result = safeValidateTransaction({ type: 'BUY', quantity: -1 });
    expect(result.success).toBe(false);
  });
});
