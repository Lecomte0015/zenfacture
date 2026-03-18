import React, { useState } from 'react';
import { Shield, Info } from 'lucide-react';
import { useFiduciaire } from '../../hooks/useFiduciaire';
import FiduciaireAccess from '../../components/fiduciaire/FiduciaireAccess';
import FiduciaireExport from '../../components/fiduciaire/FiduciaireExport';

type Tab = 'access' | 'exports';

const FiduciairePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('access');
  const {
    accesses,
    exports,
    loading,
    error,
    createAccess,
    revokeAccess,
    generateExport
  } = useFiduciaire();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Portail Fiduciaire</h1>
          </div>
          <p className="text-gray-600">
            Gérez les accès de vos fiduciaires et générez des exports comptables
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">À propos du portail fiduciaire</p>
            <p>
              Le portail fiduciaire permet à vos experts-comptables d'accéder en lecture seule à vos données comptables.
              Vous pouvez créer des accès personnalisés avec des permissions spécifiques et générer des exports
              dans différents formats (CSV, JSON) pour faciliter le travail de votre fiduciaire.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('access')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'access'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Accès
              </button>
              <button
                onClick={() => setActiveTab('exports')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'exports'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Exports
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'access' && (
              <FiduciaireAccess
                accesses={accesses}
                onCreateAccess={createAccess}
                onRevokeAccess={revokeAccess}
                loading={loading}
              />
            )}

            {activeTab === 'exports' && (
              <FiduciaireExport
                accesses={accesses}
                exports={exports}
                onGenerateExport={generateExport}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiduciairePage;
