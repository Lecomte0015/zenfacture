import React, { useState } from 'react';
import { Zap, Settings as SettingsIcon, Send } from 'lucide-react';
import { useEbill } from '../../hooks/useEbill';
import EbillConfig from '../../components/ebill/EbillConfig';
import EbillStatus from '../../components/ebill/EbillStatus';

type Tab = 'configuration' | 'envois';

const EbillPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('configuration');
  const {
    config,
    envois,
    stats,
    loading,
    error,
    saveConfig,
    activateEbill,
    deactivateEbill,
    sendEbill,
    refreshEnvois,
    refreshConfig,
    refreshStats,
  } = useEbill();

  // Déterminer si la configuration est complète
  const isConfigured = config && config.participant_id && config.participant_id.trim() !== '';

  // Si pas encore configuré, afficher l'assistant de configuration
  const showSetupWizard = !isConfigured;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">eBill</h1>
              <p className="text-sm text-gray-600 mt-1">
                Envoyez vos factures directement dans l'e-banking de vos clients
              </p>
            </div>
          </div>

          {/* Message d'erreur global */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Assistant de configuration (si pas configuré) */}
        {showSetupWizard ? (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <Zap className="h-10 w-10 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenue sur eBill
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Configurez votre compte eBill pour commencer à envoyer vos factures
                directement dans l'e-banking de vos clients suisses.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <EbillConfig
                config={config}
                loading={loading}
                onSaveConfig={saveConfig}
                onActivate={activateEbill}
                onDeactivate={deactivateEbill}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Onglets */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('configuration')}
                  className={`${
                    activeTab === 'configuration'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Configuration</span>
                </button>
                <button
                  onClick={() => setActiveTab('envois')}
                  className={`${
                    activeTab === 'envois'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Send className="h-5 w-5" />
                  <span>Envois</span>
                  {stats && stats.total > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {stats.total}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Contenu des onglets */}
            <div>
              {activeTab === 'configuration' ? (
                <EbillConfig
                  config={config}
                  loading={loading}
                  onSaveConfig={saveConfig}
                  onActivate={activateEbill}
                  onDeactivate={deactivateEbill}
                />
              ) : (
                <EbillStatus
                  envois={envois}
                  stats={stats}
                  loading={loading}
                  onRefresh={refreshEnvois}
                />
              )}
            </div>
          </>
        )}

        {/* Informations de statut eBill */}
        {isConfigured && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Statut du service</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Votre intégration eBill est{' '}
                  {config?.actif ? (
                    <span className="font-medium text-green-600">active</span>
                  ) : (
                    <span className="font-medium text-gray-600">inactive</span>
                  )}
                </p>
              </div>
              {config?.actif && stats && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">facture{stats.total !== 1 ? 's' : ''} envoyée{stats.total !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EbillPage;
