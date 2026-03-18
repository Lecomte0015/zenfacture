import React, { useState, useEffect } from 'react';
import { Calculator, FileText, Download, Trash2, Plus, Info } from 'lucide-react';
import { useTvaDeclaration } from '@/hooks/useTvaDeclaration';
import TvaDeclarationForm from '@/components/tva/TvaDeclarationForm';
import TvaSummary from '@/components/tva/TvaSummary';
import type { TvaDeclaration, DeclarationStatus } from '@/types/tva';

type TabType = 'new' | 'history';

const TvaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const {
    declarations,
    currentCalculation,
    loading,
    error,
    calculate,
    create,
    update,
    validate,
    remove,
    generateXmlFile,
    downloadXml,
    refresh
  } = useTvaDeclaration();

  useEffect(() => {
    refresh();
  }, []);

  const handleCalculate = async (
    periodeDebut: string,
    periodeFin: string,
    methode: any
  ) => {
    await calculate(periodeDebut, periodeFin, methode);
  };

  const handleValidate = async () => {
    try {
      if (!currentCalculation) {
        console.error('No calculation available to validate');
        return;
      }

      // Create the declaration first with the current calculation data
      const declarationData = {
        periode_debut: currentCalculation.periode_debut || new Date().toISOString().split('T')[0],
        periode_fin: currentCalculation.periode_fin || new Date().toISOString().split('T')[0],
        methode: currentCalculation.methode || 'effective',
        statut: 'brouillon' as const,
        chiffre200: currentCalculation.chiffre200,
        chiffre220: currentCalculation.chiffre220,
        chiffre230: currentCalculation.chiffre230,
        chiffre289: currentCalculation.chiffre289,
        chiffre299: currentCalculation.chiffre299,
        chiffre300: currentCalculation.chiffre300,
        chiffre310: currentCalculation.chiffre310,
        chiffre340: currentCalculation.chiffre340,
        chiffre399: currentCalculation.chiffre399,
        chiffre400: currentCalculation.chiffre400,
        chiffre405: currentCalculation.chiffre405,
        chiffre410: currentCalculation.chiffre410,
        chiffre420: currentCalculation.chiffre420,
      };

      const declaration = await create(declarationData);

      // Then validate it
      if (declaration?.id) {
        await validate(declaration.id);
      }
    } catch (err) {
      console.error('Error validating declaration:', err);
    }
  };

  const handleExportXml = async (declarationId?: string) => {
    if (declarationId) {
      await downloadXml(declarationId);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette déclaration ?')) {
      await remove(id);
    }
  };

  const getStatusBadge = (status: DeclarationStatus) => {
    const styles = {
      brouillon: 'bg-gray-100 text-gray-800',
      valide: 'bg-blue-100 text-blue-800',
      soumis: 'bg-green-100 text-green-800'
    };

    const labels = {
      brouillon: 'Brouillon',
      valide: 'Validé',
      soumis: 'Soumis'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Déclaration TVA</h1>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Information sur la TVA suisse</p>
            <p>
              La TVA en Suisse comprend trois taux différents : le taux normal de <strong>8,1%</strong>,
              le taux réduit de <strong>2,6%</strong> (pour certains biens et services) et
              le taux spécial de <strong>3,8%</strong> (pour l'hébergement).
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('new')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle déclaration
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Historique
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'new' ? (
        <div className="space-y-6">
          {/* Declaration Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <TvaDeclarationForm
              calculation={currentCalculation}
              onCalculate={handleCalculate}
              onValidate={handleValidate}
              onExportXml={handleExportXml}
              loading={loading}
            />
          </div>

          {/* Summary */}
          {currentCalculation && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TvaSummary
                calculation={currentCalculation}
                previousCalculation={declarations?.[0]}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Méthode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TVA nette
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : declarations && declarations.length > 0 ? (
                  declarations.map((declaration) => (
                    <tr key={declaration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(declaration.periode_debut)} - {formatDate(declaration.periode_fin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {declaration.methode === 'effective' ? 'Effective' : 'Forfaitaire'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatAmount(declaration.chiffre420 || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(declaration.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExportXml(declaration.id)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Télécharger XML"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {declaration.statut === 'brouillon' && (
                            <button
                              onClick={() => handleDelete(declaration.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucune déclaration trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TvaPage;
