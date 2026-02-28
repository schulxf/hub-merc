import React, { Suspense } from 'react';
import { Zap } from 'lucide-react';
import ChatInterface from '../components/ai/ChatInterface';
import { AiCopilotProvider } from '../contexts/AiCopilotContext';
import { PortfolioProvider } from '../components/portfolio/PortfolioContext';

/**
 * RecommendationPanel — lazy-loaded component for displaying AI recommendations.
 *
 * Future: Will show recommended actions from AI analysis (buy/sell/rebalance).
 * Currently a placeholder.
 */
const RecommendationPanel = React.lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="hidden lg:block w-80 bg-[#0a0a0a] border-l border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Recomendações
        </h3>
        <p className="text-gray-500 text-xs">
          As recomendações da IA serão mostradas aqui.
        </p>
      </div>
    ),
  }),
);

/**
 * AiCopilot — main page for AI portfolio assistant.
 *
 * Features:
 * - Full-screen chat interface with AI assistant
 * - Real-time portfolio data integration
 * - Recommendation panel (future)
 * - Responsive design (chat fullscreen on mobile, split view on desktop)
 *
 * @returns {React.ReactElement}
 */
function AiCopilot() {
  return (
    <PortfolioProvider>
      <AiCopilotProvider>
        <div className="flex h-screen bg-[#0f1419]">
          {/* Main chat interface */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-[#0a0a0a] border-b border-gray-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-100">
                    Assistente de Portfólio
                  </h1>
                  <p className="text-xs text-gray-500">
                    Análise de portfólio baseada em IA
                  </p>
                </div>
              </div>
            </div>

            {/* Chat interface */}
            <ChatInterface />
          </div>

          {/* Recommendation panel (right sidebar, desktop only) */}
          <Suspense fallback={null}>
            <RecommendationPanel />
          </Suspense>
        </div>
      </AiCopilotProvider>
    </PortfolioProvider>
  );
}

export default AiCopilot;
