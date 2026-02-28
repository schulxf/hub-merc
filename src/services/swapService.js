/**
 * Swap Service — DEX swap integration via 1inch aggregator.
 * Pure service functions, no React, no hooks.
 *
 * Supports quote fetching, gas estimation, transaction building,
 * transaction submission, and confirmation polling.
 *
 * All 1inch API responses are validated with Zod schemas.
 */
import { OneInchQuoteSchema, OneInchSwapSchema } from '../schemas/aiService.schema.js';

const ONE_INCH_BASE = 'https://api.1inch.io/v5.0/1'; // Ethereum mainnet
const ONE_INCH_TESTNET = 'https://api.1inch.io/v5.0/5'; // Goerli testnet

// ─────────────────────────────────────────────
// Public service functions
// ─────────────────────────────────────────────

/**
 * getSwapQuote — Fetch a swap quote from the 1inch aggregator API.
 *
 * @param {{ address: string, symbol: string, decimals: number }} tokenIn - Source token
 * @param {{ address: string, symbol: string, decimals: number }} tokenOut - Destination token
 * @param {string} amountIn - Amount in wei (as a string to avoid BigInt precision loss)
 * @param {boolean} [testnet=true] - Use Goerli testnet when true, mainnet otherwise
 * @returns {Promise<{ outAmount: string, minOutAmount: string, estimatedGas: string, gasPrice: string, protocols: string[][][] }>}
 * @throws {Error} When the 1inch API returns an error or the response fails validation
 */
export async function getSwapQuote(tokenIn, tokenOut, amountIn, testnet = true) {
  if (!tokenIn?.address || !tokenOut?.address) {
    throw new Error('[swapService] tokenIn and tokenOut must have address fields');
  }
  if (!amountIn || amountIn === '0') {
    throw new Error('[swapService] amountIn must be a non-zero wei string');
  }

  const baseUrl = testnet ? ONE_INCH_TESTNET : ONE_INCH_BASE;
  const params = new URLSearchParams({
    fromTokenAddress: tokenIn.address,
    toTokenAddress: tokenOut.address,
    amount: amountIn,
  });

  let raw;
  try {
    const response = await fetch(`${baseUrl}/quote?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`1inch API error ${response.status}: ${body}`);
    }
    raw = await response.json();
  } catch (err) {
    throw new Error(`[swapService] getSwapQuote network error: ${err.message}`);
  }

  const validated = OneInchQuoteSchema.parse(raw);

  const minOutAmount = calculateSlippageAmount(validated.toAmount, 0.5);

  return {
    outAmount: validated.toAmount,
    minOutAmount,
    estimatedGas: validated.estimatedGas,
    gasPrice: validated.gasPrice,
    protocols: validated.protocols,
  };
}

/**
 * calculateSlippageAmount — Apply slippage tolerance to an expected output amount.
 * Uses BigInt arithmetic to avoid floating-point precision errors with wei values.
 *
 * @param {string} outAmount - Expected output amount in wei
 * @param {number} [slippagePercent=0.5] - Slippage tolerance as a percentage (0–100)
 * @returns {string} - Minimum acceptable output with slippage applied, in wei
 */
export function calculateSlippageAmount(outAmount, slippagePercent = 0.5) {
  if (!outAmount || outAmount === '0') return '0';

  const bn = BigInt(outAmount);
  // Convert percent to basis points (1% = 100 bps); round to nearest integer
  const slippageBps = BigInt(Math.round(slippagePercent * 100));
  return ((bn * (10000n - slippageBps)) / 10000n).toString();
}

/**
 * estimateSwapGasInUsd — Convert raw gas units into a USD cost estimate.
 *
 * @param {{ estimatedGas: string, gasPrice: string }} quote - From getSwapQuote
 * @param {number} ethPrice - Current ETH price in USD
 * @returns {number} - Estimated gas cost in USD
 */
export function estimateSwapGasInUsd(quote, ethPrice) {
  if (!quote?.estimatedGas || !quote?.gasPrice) {
    throw new Error('[swapService] quote must have estimatedGas and gasPrice fields');
  }
  if (typeof ethPrice !== 'number' || ethPrice <= 0) {
    throw new Error('[swapService] ethPrice must be a positive number');
  }

  const gasInEth = Number(BigInt(quote.estimatedGas) * BigInt(quote.gasPrice)) / 1e18;
  return gasInEth * ethPrice;
}

/**
 * getSwapTransaction — Build a swap transaction ready to be signed by the user's wallet.
 * Uses disableEstimate=true since the quote has already been obtained separately.
 *
 * @param {{ address: string, symbol: string, decimals: number }} tokenIn
 * @param {{ address: string, symbol: string, decimals: number }} tokenOut
 * @param {string} amountIn - Amount in wei
 * @param {string} walletAddress - User's wallet address (checksummed)
 * @param {number} [slippageTolerance=0.5] - Slippage tolerance as a percentage
 * @param {boolean} [testnet=true] - Use Goerli testnet when true
 * @returns {Promise<{ to: string, data: string, value: string, gas: string, gasPrice: string }>}
 * @throws {Error} When the API call fails or the response fails validation
 */
export async function getSwapTransaction(
  tokenIn,
  tokenOut,
  amountIn,
  walletAddress,
  slippageTolerance = 0.5,
  testnet = true
) {
  if (!tokenIn?.address || !tokenOut?.address) {
    throw new Error('[swapService] tokenIn and tokenOut must have address fields');
  }
  if (!amountIn || amountIn === '0') {
    throw new Error('[swapService] amountIn must be a non-zero wei string');
  }
  if (!walletAddress) {
    throw new Error('[swapService] walletAddress is required');
  }

  const baseUrl = testnet ? ONE_INCH_TESTNET : ONE_INCH_BASE;
  const params = new URLSearchParams({
    fromTokenAddress: tokenIn.address,
    toTokenAddress: tokenOut.address,
    amount: amountIn,
    fromAddress: walletAddress,
    slippage: slippageTolerance.toString(),
    disableEstimate: 'true', // We already have the quote
  });

  let raw;
  try {
    const response = await fetch(`${baseUrl}/swap?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`1inch API error ${response.status}: ${body}`);
    }
    raw = await response.json();
  } catch (err) {
    throw new Error(`[swapService] getSwapTransaction network error: ${err.message}`);
  }

  const validated = OneInchSwapSchema.parse(raw);

  return {
    to: validated.tx.to,
    data: validated.tx.data,
    value: validated.tx.value,
    gas: validated.tx.gas,
    gasPrice: validated.tx.gasPrice,
  };
}

/**
 * executeSwap — Submit a pre-signed transaction to the blockchain via JSON-RPC.
 *
 * @param {string} signedTx - Hex-encoded signed transaction from WalletConnect
 * @param {string} rpcUrl - Blockchain RPC endpoint URL
 * @returns {Promise<string>} - Transaction hash (0x-prefixed)
 * @throws {Error} When the RPC call fails or the node returns an error
 */
export async function executeSwap(signedTx, rpcUrl) {
  if (!signedTx) {
    throw new Error('[swapService] signedTx is required');
  }
  if (!rpcUrl) {
    throw new Error('[swapService] rpcUrl is required');
  }

  let result;
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [signedTx],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC endpoint returned HTTP ${response.status}`);
    }

    result = await response.json();
  } catch (err) {
    throw new Error(`[swapService] executeSwap network error: ${err.message}`);
  }

  if (result.error) {
    throw new Error(`[swapService] Transaction failed: ${result.error.message}`);
  }

  if (!result.result) {
    throw new Error('[swapService] RPC response missing transaction hash');
  }

  return result.result; // tx hash
}

/**
 * pollTransactionStatus — Poll the blockchain for transaction confirmation.
 * Polls every 2 seconds until a receipt is available or the timeout is reached.
 *
 * @param {string} txHash - Transaction hash to check (0x-prefixed)
 * @param {string} rpcUrl - Blockchain RPC endpoint URL
 * @param {number} [maxWaitMs=60000] - Maximum time to wait in milliseconds
 * @returns {Promise<{ blockNumber: string, status: '0x1' | '0x0' }>} - Transaction receipt
 * @throws {Error} When confirmation times out or an RPC error occurs
 */
export async function pollTransactionStatus(txHash, rpcUrl, maxWaitMs = 60000) {
  if (!txHash) {
    throw new Error('[swapService] txHash is required');
  }
  if (!rpcUrl) {
    throw new Error('[swapService] rpcUrl is required');
  }

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    let result;
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC endpoint returned HTTP ${response.status}`);
      }

      result = await response.json();
    } catch (err) {
      // Network errors during polling are non-fatal — we keep retrying until timeout
      console.warn(`[swapService] pollTransactionStatus network error (retrying): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    if (result.error) {
      throw new Error(`[swapService] RPC error while polling: ${result.error.message}`);
    }

    if (result.result) {
      return result.result;
    }

    // Receipt not yet available — wait before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`[swapService] Transaction confirmation timeout after ${maxWaitMs}ms: ${txHash}`);
}
