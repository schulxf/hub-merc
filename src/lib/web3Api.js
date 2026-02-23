// Camada de integração Web3 (APIs externas como Moralis / DeBank / Zapper).
// Nesta fase, apenas preparamos a arquitetura e tratamento de erros elegantes.

const hasAnyWeb3ApiKey =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  (import.meta.env.VITE_MORALIS_API_KEY ||
    import.meta.env.VITE_DEBANK_API_KEY ||
    import.meta.env.VITE_ZAPPER_API_KEY);

/**
 * Estrutura simplificada de saldo de token agregada por endereço/carteira.
 *
 * @typedef {Object} TokenBalance
 * @property {string} id           Identificador interno (ex: "eth:ethereum").
 * @property {string} symbol       Símbolo (ex: "ETH").
 * @property {string} name         Nome legível.
 * @property {number} amount       Quantidade total somada em todas as carteiras.
 * @property {number} [priceUsd]   Preço em USD, se disponível.
 * @property {number} [valueUsd]   Valor em USD (amount * priceUsd).
 * @property {number} [change24h]  Variação 24h em %, se disponível.
 */

/**
 * Função principal para buscar saldos on-chain a partir de uma lista de carteiras.
 * Nesta fase, devolve apenas placeholders e mensagens de aviso quando não há API configurada.
 *
 * @param {Array<{ address: string; networkType: 'evm' | 'solana'; chainId?: string }>} wallets
 * @returns {Promise<{ tokens: TokenBalance[]; raw: any; warning?: string }>}
 */
export async function fetchWalletBalances(wallets) {
  if (!wallets || wallets.length === 0) {
    return { tokens: [], raw: null };
  }

  if (!hasAnyWeb3ApiKey) {
    return {
      tokens: [],
      raw: null,
      warning:
        'Integração Web3 ainda não configurada. Adicione uma API key (Moralis / DeBank / Zapper) para ativar a leitura on-chain.',
    };
  }

  try {
    // Espaço reservado para integração real com o provedor escolhido.
    // A ideia é:
    // 1. Agrupar carteiras por tipo/rede.
    // 2. Chamar o(s) endpoint(s) externo(s).
    // 3. Normalizar o resultado para o formato TokenBalance[].

    const tokens = [];

    return {
      tokens,
      raw: null,
    };
  } catch (error) {
    console.error('Erro na camada web3Api:', error);
    throw error;
  }
}

