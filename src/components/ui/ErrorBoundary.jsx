import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary — captura erros em qualquer componente filho
 * e mostra um fallback elegante em vez de tela branca.
 *
 * Uso global: envolver <App /> em <GlobalErrorBoundary>
 * Uso local: envolver componentes sensíveis (ex: gráficos)
 */
export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log detalhado para debug
    console.error('[ErrorBoundary] Erro capturado:', error);
    console.error('[ErrorBoundary] Stack:', errorInfo.componentStack);

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.MODE === 'development';

      return (
        <div className="min-h-screen bg-[#07090C] flex flex-col items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/30 rounded-2xl max-w-md p-8 shadow-xl">
            {/* Ícone */}
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Oops! Algo correu mal
            </h2>

            {/* Mensagem */}
            <p className="text-gray-400 text-center text-sm mb-6">
              Um erro inesperado ocorreu. Por favor, tente recarregar a página.
            </p>

            {/* Debug info (apenas em dev) */}
            {isDevelopment && this.state.error && (
              <div className="bg-[#0a0a0a] border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-xs font-mono text-red-400 break-words">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                      Stack trace
                    </summary>
                    <pre className="text-[10px] text-gray-600 mt-2 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-[#181818] hover:bg-[#222] text-gray-100 px-4 py-3 rounded-xl font-bold transition-colors"
              >
                Voltar à Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary local — para componentes específicos (ex: gráficos).
 * Mostra fallback sem derrubar a página inteira.
 */
export function LocalErrorBoundary({ children, fallback = null }) {
  return (
    <GlobalErrorBoundary>
      {fallback ? (
        <div>
          {(() => {
            try {
              return children;
            } catch (error) {
              console.warn('[LocalErrorBoundary] Erro em componente:', error);
              return fallback;
            }
          })()}
        </div>
      ) : (
        children
      )}
    </GlobalErrorBoundary>
  );
}
