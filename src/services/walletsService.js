/**
 * Serviço de carteiras via Moralis.
 * Usado pelo TanStack Query — não chama diretamente nos componentes.
 */
import { fetchWalletBalances } from '../lib/web3Api';

/**
 * Busca saldos on-chain de uma lista de carteiras.
 * @param {Array} wallets - ex: [{ address: '0x...', networkType: 'evm', chainId: 'eth' }]
 * @returns {Promise<{ tokens: any[], warning?: string }>}
 */
export async function fetchWalletsData(wallets) {
  if (!wallets || wallets.length === 0) {
    return { tokens: [], warning: undefined };
  }

  try {
    return await fetchWalletBalances(wallets);
  } catch (error) {
    console.error('[walletsService] Erro ao buscar carteiras:', error);
    throw error;
  }
}

/**
 * Query key factory — garante keys consistentes em todo o app.
 */
export const walletsKeys = {
  all: ['wallets'],
  byAddresses: (addresses) => ['wallets', addresses.map(a => a.address).sort().join(',')],
  byTrigger: (trigger) => ['wallets', trigger],
};
