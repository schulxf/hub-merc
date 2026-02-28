import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Settings, Check, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * AdminSettingsTab — Platform configuration and feature flags.
 *
 * Allows admins to:
 * - Toggle feature flags (portfolio, airdrops, defi, reminders)
 * - Manage content categories (research, strategies, risk levels)
 * - Configure app metadata (name, version, maintenance mode)
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminSettingsTab({ onError }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [appName, setAppName] = useState('Mercurius Hub');
  const [version, setVersion] = useState('1.0.0');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({
    analyticsEnabled: true,
    assessorDashboard: true,
    portfolioOptimizer: false,
    realTimeNotifications: true,
  });
  const [categories, setCategories] = useState({
    research: ['defi', 'nft', 'l2', 'macro', 'governance', 'security'],
    strategies: ['conservative', 'balanced', 'aggressive'],
    riskLevels: ['low', 'medium', 'high'],
  });

  const unsubscribeRef = useRef(null);

  // React StrictMode guard: prevent duplicate listeners
  useEffect(() => {
    if (unsubscribeRef.current) return;

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'config'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setConfig(data);
          setAppName(data.appName || 'Mercurius Hub');
          setVersion(data.version || '1.0.0');
          setMaintenanceMode(data.maintenanceMode || false);
          setFeatureFlags(data.featureFlags || featureFlags);
          setCategories(data.categories || categories);
        } else {
          // Initialize with defaults if document doesn't exist
          setConfig({
            appName: 'Mercurius Hub',
            version: '1.0.0',
            maintenanceMode: false,
            featureFlags,
            categories,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar configurações:', error);
        // Initialize with defaults if there's an error
        setConfig({
          appName: 'Mercurius Hub',
          version: '1.0.0',
          maintenanceMode: false,
          featureFlags,
          categories,
        });
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const handleFeatureFlagToggle = (flagName) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [flagName]: !prev[flagName],
    }));
  };

  const handleCategoryChange = (categoryName, value) => {
    setCategories((prev) => ({
      ...prev,
      [categoryName]: value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Validate inputs
      if (!appName.trim()) {
        onError('Nome da aplicação não pode estar vazio');
        setIsSaving(false);
        return;
      }

      if (
        !categories.research.length ||
        !categories.strategies.length ||
        !categories.riskLevels.length
      ) {
        onError('Todas as categorias devem ter pelo menos um item');
        setIsSaving(false);
        return;
      }

      // Save to Firestore
      await setDoc(doc(db, 'settings', 'config'), {
        appName,
        version,
        maintenanceMode,
        featureFlags,
        categories,
        updatedAt: new Date().toISOString(),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      onError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">Configurações da Plataforma</h2>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-green-400 text-sm font-medium">Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* App Metadata Section */}
      <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Metadados da Aplicação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* App Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Aplicação</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition-colors"
              placeholder="Mercurius Hub"
            />
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Versão</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition-colors"
              placeholder="1.0.0"
            />
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-gray-700/50">
          <div>
            <p className="font-medium text-white">Modo de Manutenção</p>
            <p className="text-xs text-gray-500 mt-1">Desabilita acesso para utilizadores normais</p>
          </div>
          <button
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              maintenanceMode ? 'bg-red-500/20' : 'bg-gray-700/30'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                maintenanceMode ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Feature Flags Section */}
      <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-purple-400" />
          Feature Flags
        </h3>

        {Object.entries(featureFlags).map(([flagName, flagValue]) => (
          <div
            key={flagName}
            className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-gray-700/50 hover:border-gray-700 transition-colors"
          >
            <div>
              <p className="font-medium text-white capitalize">{flagName.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-xs text-gray-500 mt-1">Habilitar esta funcionalidade</p>
            </div>
            <button
              onClick={() => handleFeatureFlagToggle(flagName)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                flagValue ? 'bg-cyan-500/20' : 'bg-gray-700/30'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  flagValue ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Content Categories Section */}
      <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Categorias de Conteúdo
        </h3>

        <div className="space-y-4">
          {/* Research Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Categorias de Pesquisa (separadas por vírgula)
            </label>
            <input
              type="text"
              value={categories.research.join(', ')}
              onChange={(e) => handleCategoryChange('research', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition-colors font-mono text-sm"
              placeholder="defi, nft, l2, macro, governance, security"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.research.map((cat, idx) => (
                <span key={idx} className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/30">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Strategy Types */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tipos de Estratégia (separadas por vírgula)
            </label>
            <input
              type="text"
              value={categories.strategies.join(', ')}
              onChange={(e) => handleCategoryChange('strategies', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition-colors font-mono text-sm"
              placeholder="conservative, balanced, aggressive"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.strategies.map((cat, idx) => (
                <span key={idx} className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/30">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Risk Levels */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Níveis de Risco (separados por vírgula)
            </label>
            <input
              type="text"
              value={categories.riskLevels.join(', ')}
              onChange={(e) => handleCategoryChange('riskLevels', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition-colors font-mono text-sm"
              placeholder="low, medium, high"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.riskLevels.map((cat, idx) => (
                <span key={idx} className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  );
}
