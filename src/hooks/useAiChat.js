import { useCallback } from 'react';
import { useAiCopilotContext } from '../contexts/AiCopilotContext';
import { usePortfolioContext } from '../components/portfolio/PortfolioContext';
import { analyzePortfolioWithAI } from '../services/aiService';

/**
 * useAiChat — hook for sending messages to the AI service and managing chat state.
 *
 * Handles:
 * - Serialising portfolio data for AI analysis
 * - Calling analyzePortfolioWithAI with user question
 * - Streaming response character-by-character
 * - Error handling and state updates
 *
 * @returns {{
 *   sendMessage: Function(userMessage: string) -> Promise<void>,
 *   isLoading: boolean,
 * }}
 */
export function useAiChat() {
  const { portfolioAssets, livePrices, isLoading: isPortfolioLoading } =
    usePortfolioContext();
  const { addMessage, updateMessage, setIsStreaming, setError } =
    useAiCopilotContext();

  /**
   * Send a user message and get AI analysis.
   */
  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim()) return;

      try {
        setError(null);

        // Add user message to chat
        const userMsgId = Date.now();
        addMessage({
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString(),
        });

        setIsStreaming(true);

        // Prepare portfolio data for AI
        const portfolioData = {
          assets: portfolioAssets.map((asset) => ({
            symbol: asset.symbol,
            name: asset.name,
            quantity: asset.quantity,
            purchasePrice: asset.purchasePrice,
            currentPrice: livePrices[asset.coinId] || asset.purchasePrice,
            currentValue: asset.quantity * (livePrices[asset.coinId] || asset.purchasePrice),
            coinId: asset.coinId,
            color: asset.color,
          })),
          totalValue: portfolioAssets.reduce(
            (sum, asset) =>
              sum + asset.quantity * (livePrices[asset.coinId] || asset.purchasePrice),
            0,
          ),
          assetCount: portfolioAssets.length,
        };

        // Call AI service
        const analysis = await analyzePortfolioWithAI(portfolioData, userMessage);

        if (!analysis || !analysis.analysis) {
          throw new Error('Resposta inválida do serviço de IA');
        }

        // Add AI response message with streaming animation
        const aiMsgId = Date.now() + 1;
        addMessage({
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        });

        // Stream response character-by-character
        const responseText = analysis.analysis;
        for (let i = 0; i < responseText.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 20)); // 20ms per character
          updateMessage(aiMsgId, {
            content: responseText.substring(0, i + 1),
          });
        }

        // Mark streaming complete
        updateMessage(aiMsgId, {
          isStreaming: false,
        });
      } catch (err) {
        console.error('[useAiChat] Erro ao enviar mensagem:', err);
        setError(err.message || 'Erro ao processar sua pergunta');
        setIsStreaming(false);
      }
    },
    [
      portfolioAssets,
      livePrices,
      addMessage,
      updateMessage,
      setIsStreaming,
      setError,
    ],
  );

  return {
    sendMessage,
    isLoading: isPortfolioLoading,
  };
}
